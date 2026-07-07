"use server";

import { db } from "@/lib/db";
import {
  students,
  teachers,
  classes,
  subjects,
  teacherAssignments,
  studentEnrollments,
  studentSubjectAssignments,
  academicSessions,
  terms,
  parents,
  parentStudents,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { generatePromotions } from "./promotions";

// ─── Sessions & Terms ─────────────────────────────────────────────────────────

// Ends whichever session is currently active for the school: marks its terms
// and itself as completed, then initiates promotions for it. Reused by
// createSession (implicit end-of-year rollover) and endCurrentSession
// (explicit "End Session" action).
async function endActiveSession(schoolId: string) {
  const previousActive = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
  });
  if (!previousActive) return null;

  await db.update(terms)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(terms.sessionId, previousActive.id));

  await db.update(academicSessions)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(academicSessions.id, previousActive.id));

  const { created } = await generatePromotions(previousActive.id, schoolId);
  return { session: previousActive, promotionsInitiated: created };
}

export async function createSession(schoolId: string, name: string) {
  // End whichever session is currently active (completes its terms and
  // kicks off promotion generation for it) before starting the new one.
  const ended = await endActiveSession(schoolId);

  const [session] = await db
    .insert(academicSessions)
    .values({ schoolId, name, status: "active" })
    .returning();

  // Auto-create 3 terms — only the first is active; the rest are upcoming
  // until the admin advances through them.
  await db.insert(terms).values([
    { sessionId: session.id, schoolId, name: "First", status: "active" },
    { sessionId: session.id, schoolId, name: "Second", status: "upcoming" },
    { sessionId: session.id, schoolId, name: "Third", status: "upcoming" },
  ]);

  revalidatePath(`/[schoolSlug]/admin/sessions`);
  revalidatePath(`/[schoolSlug]/admin/promotions`);
  return { success: true, session, promotionsInitiated: ended?.promotionsInitiated ?? 0 };
}

export async function endCurrentSession(schoolId: string) {
  const ended = await endActiveSession(schoolId);
  if (!ended) return { success: false, error: "No active session found" };

  revalidatePath(`/[schoolSlug]/admin/sessions`);
  revalidatePath(`/[schoolSlug]/admin/promotions`);
  return { success: true, promotionsInitiated: ended.promotionsInitiated };
}

export async function setActiveTerm(termId: string, schoolId: string) {
  const term = await db.query.terms.findFirst({ where: eq(terms.id, termId) });
  if (!term || term.schoolId !== schoolId) {
    return { success: false, error: "Term not found" };
  }

  // Only one term per session may be active at a time — whatever was active
  // before is now considered completed.
  await db.update(terms)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(terms.sessionId, term.sessionId), eq(terms.status, "active")));

  await db.update(terms)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(terms.id, termId));

  revalidatePath(`/[schoolSlug]/admin/sessions`);
  return { success: true };
}

export async function updateTermDuration(
  termId: string,
  schoolId: string,
  startDate: string | null,
  endDate: string | null
) {
  const term = await db.query.terms.findFirst({ where: eq(terms.id, termId) });
  if (!term || term.schoolId !== schoolId) {
    return { success: false, error: "Term not found" };
  }

  await db.update(terms)
    .set({
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(terms.id, termId));

  revalidatePath(`/[schoolSlug]/admin/sessions`);
  return { success: true };
}

// ─── Classes ─────────────────────────────────────────────────────────────────
const classSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1),
  level: z.number().int().min(1).max(12),
  description: z.string().optional(),
  classTeacherId: z.string().uuid().nullable().optional(),
});

export async function createClass(data: z.infer<typeof classSchema>) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || session.user.schoolId !== data.schoolId) {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = classSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const [cls] = await db.insert(classes).values(parsed.data).returning();
  revalidatePath(`/[schoolSlug]/admin/classes`);
  return { success: true, class: cls };
}

export async function updateClass(classId: string, data: Partial<z.infer<typeof classSchema>>) {
  const session = await auth();
  if (session?.user?.role !== "school_admin") {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!existing || existing.schoolId !== session.user.schoolId) {
    return { success: false, error: "Class not found" };
  }

  await db.update(classes).set({ ...data, updatedAt: new Date() }).where(eq(classes.id, classId));
  revalidatePath(`/[schoolSlug]/admin/classes`);
  return { success: true };
}

export async function deleteClass(classId: string) {
  const session = await auth();
  if (session?.user?.role !== "school_admin") {
    return { success: false, error: "Unauthorized" };
  }

  const existing = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!existing || existing.schoolId !== session.user.schoolId) {
    return { success: false, error: "Class not found" };
  }

  await db.delete(classes).where(eq(classes.id, classId));
  revalidatePath(`/[schoolSlug]/admin/classes`);
  return { success: true };
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
const subjectSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(2).max(10),
  description: z.string().optional(),
});

export async function createSubject(data: z.infer<typeof subjectSchema>) {
  const parsed = subjectSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const [sub] = await db.insert(subjects).values(parsed.data).returning();
  revalidatePath(`/[schoolSlug]/admin/subjects`);
  return { success: true, subject: sub };
}

export async function updateSubject(subjectId: string, data: Partial<z.infer<typeof subjectSchema>>) {
  await db.update(subjects).set({ ...data, updatedAt: new Date() }).where(eq(subjects.id, subjectId));
  revalidatePath(`/[schoolSlug]/admin/subjects`);
  return { success: true };
}

export async function deleteSubject(subjectId: string) {
  await db.delete(subjects).where(eq(subjects.id, subjectId));
  revalidatePath(`/[schoolSlug]/admin/subjects`);
  return { success: true };
}

// ─── Teachers ─────────────────────────────────────────────────────────────────
const teacherSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  employeeId: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

export async function createTeacher(data: z.infer<typeof teacherSchema>) {
  const parsed = teacherSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data: " + parsed.error.message };

  const existing = await db.query.teachers.findFirst({
    where: eq(teachers.email, parsed.data.email),
  });
  if (existing) return { success: false, error: "Email already in use" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const { password, ...rest } = parsed.data;

  const [teacher] = await db.insert(teachers).values({ ...rest, passwordHash }).returning();
  revalidatePath(`/[schoolSlug]/admin/teachers`);
  return { success: true, teacher };
}

export async function updateTeacher(teacherId: string, data: Partial<Omit<z.infer<typeof teacherSchema>, "password">> & { password?: string }) {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
    delete updateData.password;
  }
  await db.update(teachers).set(updateData).where(eq(teachers.id, teacherId));
  revalidatePath(`/[schoolSlug]/admin/teachers`);
  return { success: true };
}

export async function deleteTeacher(teacherId: string) {
  await db.delete(teachers).where(eq(teachers.id, teacherId));
  revalidatePath(`/[schoolSlug]/admin/teachers`);
  return { success: true };
}

// ─── Students ─────────────────────────────────────────────────────────────────
const studentSchema = z.object({
  schoolId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  admissionNumber: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.string().optional(),
  guardianRelationship: z.string().optional(),
  bloodGroup: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  religion: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  parentPassword: z.string().min(6).optional().or(z.literal("")),
});

// Finds-or-creates a parent login by email (scoped to the school) and links
// them to the given student — reused whenever a school admin optionally
// provides parent login details, at creation or later via edit.
async function linkParentToStudent(
  schoolId: string,
  studentId: string,
  parentEmail: string,
  parentPassword: string,
  parentName: string
) {
  let parent = await db.query.parents.findFirst({
    where: and(eq(parents.email, parentEmail), eq(parents.schoolId, schoolId)),
  });

  if (!parent) {
    const passwordHash = await bcrypt.hash(parentPassword, 12);
    [parent] = await db
      .insert(parents)
      .values({
        schoolId,
        name: parentName || "Parent/Guardian",
        email: parentEmail,
        passwordHash,
      })
      .returning();
  }

  await db
    .insert(parentStudents)
    .values({ parentId: parent.id, studentId })
    .onConflictDoNothing({ target: [parentStudents.parentId, parentStudents.studentId] });

  return parent;
}

export async function createStudent(data: z.infer<typeof studentSchema>) {
  const parsed = studentSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data: " + parsed.error.message };

  const existing = await db.query.students.findFirst({
    where: eq(students.email, parsed.data.email),
  });
  if (existing) return { success: false, error: "Email already in use" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const { password, parentEmail, parentPassword, ...rest } = parsed.data;

  const [student] = await db.insert(students).values({
    ...rest,
    passwordHash,
    dateOfBirth: rest.dateOfBirth ? new Date(rest.dateOfBirth) : null,
  }).returning();

  if (parentEmail && parentPassword) {
    await linkParentToStudent(parsed.data.schoolId, student.id, parentEmail, parentPassword, rest.guardianName || "");
  }

  revalidatePath(`/[schoolSlug]/admin/students`);
  return { success: true, student };
}

export async function updateStudent(studentId: string, data: Partial<Omit<z.infer<typeof studentSchema>, "password">> & { password?: string }) {
  const { parentEmail, parentPassword, ...rest } = data;
  const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 12);
    delete updateData.password;
  }
  if (data.dateOfBirth) {
    updateData.dateOfBirth = new Date(data.dateOfBirth);
  }
  await db.update(students).set(updateData).where(eq(students.id, studentId));

  if (parentEmail && parentPassword) {
    const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
    if (student) {
      await linkParentToStudent(student.schoolId, studentId, parentEmail, parentPassword, data.guardianName || "");
    }
  }

  revalidatePath(`/[schoolSlug]/admin/students`);
  return { success: true };
}

export async function deleteStudent(studentId: string) {
  await db.delete(students).where(eq(students.id, studentId));
  revalidatePath(`/[schoolSlug]/admin/students`);
  return { success: true };
}

// ─── Teacher Assignments ──────────────────────────────────────────────────────
export async function assignTeacher(
  teacherId: string,
  classId: string,
  subjectId: string,
  sessionId: string,
  schoolId: string
) {
  // Check if already assigned
  const existing = await db.query.teacherAssignments.findFirst({
    where: and(
      eq(teacherAssignments.teacherId, teacherId),
      eq(teacherAssignments.classId, classId),
      eq(teacherAssignments.subjectId, subjectId),
      eq(teacherAssignments.sessionId, sessionId)
    ),
  });
  if (existing) return { success: false, error: "Assignment already exists" };

  await db.insert(teacherAssignments).values({
    teacherId, classId, subjectId, sessionId, schoolId,
  });

  revalidatePath(`/[schoolSlug]/admin/assignments`);
  return { success: true };
}

export async function removeTeacherAssignment(assignmentId: string) {
  await db.delete(teacherAssignments).where(eq(teacherAssignments.id, assignmentId));
  revalidatePath(`/[schoolSlug]/admin/assignments`);
  return { success: true };
}

// ─── Student Enrollments ─────────────────────────────────────────────────────
export async function enrollStudent(
  studentId: string,
  classId: string,
  sessionId: string,
  schoolId: string
) {
  try {
    // Deactivate previous enrollment for this session
    await db.update(studentEnrollments)
      .set({ isActive: false })
      .where(
        and(
          eq(studentEnrollments.studentId, studentId),
          eq(studentEnrollments.sessionId, sessionId)
        )
      );

    const [enrollment] = await db.insert(studentEnrollments).values({
      studentId, classId, sessionId, schoolId, isActive: true,
    }).returning();

    revalidatePath(`/[schoolSlug]/admin/students`);
    return { success: true, enrollment };
  } catch (error) {
    console.error("Error enrolling student:", error);
    return { success: false, error: "Failed to enroll student" };
  }
}

const studentSubjectAssignmentSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectIds: z.array(z.string().uuid()),
  sessionId: z.string().uuid(),
  schoolId: z.string().uuid(),
});

export async function assignStudentSubjects(
  studentId: string,
  classId: string,
  subjectIds: string[],
  sessionId: string,
  schoolId: string
) {
  try {
    const parsed = studentSubjectAssignmentSchema.safeParse({
      studentId,
      classId,
      subjectIds,
      sessionId,
      schoolId,
    });
    if (!parsed.success) {
      return { success: false, error: "Invalid subject assignment data" };
    }

    await db.delete(studentSubjectAssignments).where(
      and(
        eq(studentSubjectAssignments.studentId, studentId),
        eq(studentSubjectAssignments.sessionId, sessionId),
        eq(studentSubjectAssignments.classId, classId)
      )
    );

    if (parsed.data.subjectIds.length > 0) {
      await db.insert(studentSubjectAssignments).values(
        parsed.data.subjectIds.map((subjectId) => ({
          studentId,
          classId,
          subjectId,
          sessionId,
          schoolId,
          isActive: true,
        }))
      );
    }

    revalidatePath(`/[schoolSlug]/admin/students`);
    return { success: true };
  } catch (error) {
    console.error("Error assigning student subjects:", error);
    return { success: false, error: "Failed to save subjects. Please ensure all students and subjects exist." };
  }
}

export async function unenrollStudent(enrollmentId: string) {
  await db.delete(studentEnrollments).where(eq(studentEnrollments.id, enrollmentId));
  revalidatePath(`/[schoolSlug]/admin/students`);
  return { success: true };
}
