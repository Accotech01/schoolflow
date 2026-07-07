"use server";

import { db } from "@/lib/db";
import {
  attendanceRecords,
  classes,
  studentEnrollments,
  academicSessions,
  grades,
  parentStudents,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";
import { calculateGrade } from "@/lib/utils";

function startOfDay(dateStr: string) {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function requireOwnedClass(classId: string) {
  const session = await auth();
  if (session?.user?.role !== "teacher") return null;

  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!cls || cls.classTeacherId !== session.user.id || cls.schoolId !== session.user.schoolId) {
    return null;
  }
  return { session, cls };
}

// Classes the signed-in teacher is the central/class teacher for, plus the
// school's active session/term.
export async function getMyClassTeacherInfo() {
  const session = await auth();
  if (session?.user?.role !== "teacher" || !session.user.schoolId) {
    return { classes: [], activeSession: null, activeTerm: null };
  }

  const myClasses = await db.query.classes.findMany({
    where: and(eq(classes.classTeacherId, session.user.id), eq(classes.schoolId, session.user.schoolId)),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, session.user.schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });
  const activeTerm = activeSession?.terms.find((t) => t.status === "active") || null;

  return { classes: myClasses, activeSession, activeTerm };
}

// Roster for a class (active enrollments for the given session) with any
// attendance already recorded for the given date.
export async function getClassRosterForDate(classId: string, termId: string, sessionId: string, date: string) {
  const owned = await requireOwnedClass(classId);
  if (!owned) return { roster: [], statuses: {} as Record<string, string> };

  const enrollments = await db.query.studentEnrollments.findMany({
    where: and(
      eq(studentEnrollments.classId, classId),
      eq(studentEnrollments.sessionId, sessionId),
      eq(studentEnrollments.isActive, true)
    ),
    with: { student: true },
    orderBy: (e, { asc }) => [asc(e.studentId)],
  });
  const roster = enrollments
    .map((e) => ({ id: e.student.id, name: e.student.name, admissionNumber: e.student.admissionNumber }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const day = startOfDay(date);
  const existing = await db.query.attendanceRecords.findMany({
    where: and(eq(attendanceRecords.classId, classId), eq(attendanceRecords.termId, termId), eq(attendanceRecords.date, day)),
  });
  const statuses: Record<string, string> = {};
  existing.forEach((r) => (statuses[r.studentId] = r.status));

  return { roster, statuses };
}

const markAttendanceSchema = z.object({
  classId: z.string().uuid(),
  termId: z.string().uuid(),
  date: z.string().min(1),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(["present", "absent", "late"]),
    })
  ),
});

export async function markAttendance(data: z.infer<typeof markAttendanceSchema>) {
  const parsed = markAttendanceSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const owned = await requireOwnedClass(parsed.data.classId);
  if (!owned) return { success: false, error: "Unauthorized: you are not this class's teacher" };

  const day = startOfDay(parsed.data.date);
  const rows = parsed.data.records.map((r) => ({
    studentId: r.studentId,
    classId: parsed.data.classId,
    termId: parsed.data.termId,
    schoolId: owned.session.user.schoolId!,
    date: day,
    status: r.status,
    markedBy: owned.session.user.id,
  }));

  if (rows.length === 0) return { success: true };

  await db
    .insert(attendanceRecords)
    .values(rows)
    .onConflictDoUpdate({
      target: [attendanceRecords.studentId, attendanceRecords.termId, attendanceRecords.date],
      set: {
        status: sql`excluded.status`,
        markedBy: sql`excluded.marked_by`,
        updatedAt: new Date(),
      },
    });

  revalidatePath(`/[schoolSlug]/teacher/attendance`);
  revalidatePath(`/[schoolSlug]/student/dashboard`);
  return { success: true };
}

async function summarizeClass(classId: string, termId: string, maxScore: number) {
  const [records, enrollments] = await Promise.all([
    db.query.attendanceRecords.findMany({
      where: and(eq(attendanceRecords.classId, classId), eq(attendanceRecords.termId, termId)),
    }),
    db.query.studentEnrollments.findMany({
      where: and(eq(studentEnrollments.classId, classId), eq(studentEnrollments.isActive, true)),
      with: { student: true },
    }),
  ]);

  return enrollments
    .map((e) => {
      const studentRecords = records.filter((r) => r.studentId === e.studentId);
      const totalMarked = studentRecords.length;
      const present = studentRecords.filter((r) => r.status === "present").length;
      const late = studentRecords.filter((r) => r.status === "late").length;
      const absent = studentRecords.filter((r) => r.status === "absent").length;
      // Present and late both count as "attended" for the percentage.
      const attended = present + late;
      const percentage = totalMarked > 0 ? Math.round((attended / totalMarked) * 1000) / 10 : 0;
      const score = totalMarked > 0 ? Math.round((percentage / 100) * maxScore * 100) / 100 : null;
      return {
        studentId: e.studentId,
        name: e.student.name,
        totalMarked,
        present,
        late,
        absent,
        percentage,
        maxScore,
        score,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClassAttendanceSummary(classId: string, termId: string) {
  const owned = await requireOwnedClass(classId);
  if (!owned) return [];
  return summarizeClass(classId, termId, parseFloat(owned.cls.attendanceMaxScore));
}

// A student's own attendance summary for the school's current active term.
export async function getMyAttendanceSummary() {
  const session = await auth();
  if (session?.user?.role !== "student" || !session.user.schoolId) return null;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, session.user.schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });
  const activeTerm = activeSession?.terms.find((t) => t.status === "active");
  if (!activeSession || !activeTerm) return null;

  const enrollment = await db.query.studentEnrollments.findFirst({
    where: and(
      eq(studentEnrollments.studentId, session.user.id),
      eq(studentEnrollments.sessionId, activeSession.id),
      eq(studentEnrollments.isActive, true)
    ),
    with: { class: true },
  });
  if (!enrollment) return null;

  const summary = await summarizeClass(enrollment.classId, activeTerm.id, parseFloat(enrollment.class.attendanceMaxScore));
  return summary.find((s) => s.studentId === session.user.id) || null;
}

// A specific child's attendance summary for the school's current active
// term, for a parent viewing their linked child.
export async function getChildAttendanceSummary(studentId: string) {
  const session = await auth();
  if (session?.user?.role !== "parent" || !session.user.schoolId) return null;

  const link = await db.query.parentStudents.findFirst({
    where: and(eq(parentStudents.parentId, session.user.id), eq(parentStudents.studentId, studentId)),
  });
  if (!link) return null;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, session.user.schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });
  const activeTerm = activeSession?.terms.find((t) => t.status === "active");
  if (!activeSession || !activeTerm) return null;

  const enrollment = await db.query.studentEnrollments.findFirst({
    where: and(
      eq(studentEnrollments.studentId, studentId),
      eq(studentEnrollments.sessionId, activeSession.id),
      eq(studentEnrollments.isActive, true)
    ),
    with: { class: true },
  });
  if (!enrollment) return null;

  const summary = await summarizeClass(enrollment.classId, activeTerm.id, parseFloat(enrollment.class.attendanceMaxScore));
  return summary.find((s) => s.studentId === studentId) || null;
}

// Calculates each enrolled student's attendance score (0 to maxScore, based
// on daily records marked so far) and writes it into the Attendance field of
// every subject grade already recorded for this student/term, recalculating
// that subject's total and letter grade. Safe to re-run — e.g. after more
// subjects get graded, or after more attendance gets marked.
export async function finalizeTermAttendance(classId: string, termId: string, maxScore: number) {
  const owned = await requireOwnedClass(classId);
  if (!owned) return { success: false, error: "Unauthorized: you are not this class's teacher" };

  if (!(maxScore > 0 && maxScore <= 100)) {
    return { success: false, error: "Max score must be between 0 and 100" };
  }

  await db
    .update(classes)
    .set({ attendanceMaxScore: String(maxScore), updatedAt: new Date() })
    .where(eq(classes.id, classId));

  const summary = await summarizeClass(classId, termId, maxScore);

  let studentsUpdated = 0;
  let gradesUpdated = 0;

  for (const s of summary) {
    if (s.score === null) continue;

    const studentGrades = await db.query.grades.findMany({
      where: and(eq(grades.studentId, s.studentId), eq(grades.termId, termId), eq(grades.classId, classId)),
    });
    if (studentGrades.length === 0) continue;

    for (const g of studentGrades) {
      const total =
        parseFloat(g.test1 || "0") +
        parseFloat(g.test2 || "0") +
        parseFloat(g.assignment || "0") +
        s.score +
        parseFloat(g.exam || "0");
      const { grade, remark } = calculateGrade(total);

      await db
        .update(grades)
        .set({
          attendance: String(s.score),
          total: String(total),
          grade,
          remark,
          updatedAt: new Date(),
        })
        .where(eq(grades.id, g.id));
      gradesUpdated++;
    }
    studentsUpdated++;
  }

  revalidatePath(`/[schoolSlug]/teacher/attendance`);
  revalidatePath(`/[schoolSlug]/teacher/grades`);
  revalidatePath(`/[schoolSlug]/student/results`);
  revalidatePath(`/[schoolSlug]/student/dashboard`);
  return { success: true, studentsUpdated, gradesUpdated };
}
