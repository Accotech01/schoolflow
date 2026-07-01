"use server";

import { db } from "@/lib/db";
import { grades, gradeSettings } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateGrade } from "@/lib/utils";

const gradeSettingsSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  termId: z.string().uuid(),
  schoolId: z.string().uuid(),
  maxTest1: z.number().min(0).max(100),
  maxTest2: z.number().min(0).max(100),
  maxAssignment: z.number().min(0).max(100),
  maxAttendance: z.number().min(0).max(100),
  maxExam: z.number().min(0).max(100),
});

export async function saveGradeSettings(data: z.infer<typeof gradeSettingsSchema>) {
  const parsed = gradeSettingsSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const existing = await db.query.gradeSettings.findFirst({
    where: and(
      eq(gradeSettings.teacherId, parsed.data.teacherId),
      eq(gradeSettings.classId, parsed.data.classId),
      eq(gradeSettings.subjectId, parsed.data.subjectId),
      eq(gradeSettings.termId, parsed.data.termId)
    ),
  });

  if (existing) {
    await db.update(gradeSettings)
      .set({
        maxTest1: String(parsed.data.maxTest1),
        maxTest2: String(parsed.data.maxTest2),
        maxAssignment: String(parsed.data.maxAssignment),
        maxAttendance: String(parsed.data.maxAttendance),
        maxExam: String(parsed.data.maxExam),
        updatedAt: new Date(),
      })
      .where(eq(gradeSettings.id, existing.id));
  } else {
    await db.insert(gradeSettings).values({
      ...parsed.data,
      maxTest1: String(parsed.data.maxTest1),
      maxTest2: String(parsed.data.maxTest2),
      maxAssignment: String(parsed.data.maxAssignment),
      maxAttendance: String(parsed.data.maxAttendance),
      maxExam: String(parsed.data.maxExam),
    });
  }

  revalidatePath("/[schoolSlug]/teacher/grades");
  return { success: true };
}

const gradeEntrySchema = z.object({
  studentId: z.string().uuid(),
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  termId: z.string().uuid(),
  sessionId: z.string().uuid(),
  schoolId: z.string().uuid(),
  test1: z.number().min(0).default(0),
  test2: z.number().min(0).default(0),
  assignment: z.number().min(0).default(0),
  attendance: z.number().min(0).default(0),
  exam: z.number().min(0).default(0),
  teacherRemark: z.string().optional(),
});

export async function saveGrade(data: z.infer<typeof gradeEntrySchema>) {
  const parsed = gradeEntrySchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Invalid data" };

  const total =
    parsed.data.test1 +
    parsed.data.test2 +
    parsed.data.assignment +
    parsed.data.attendance +
    parsed.data.exam;

  const { grade, remark } = calculateGrade(total);

  const existing = await db.query.grades.findFirst({
    where: and(
      eq(grades.studentId, parsed.data.studentId),
      eq(grades.subjectId, parsed.data.subjectId),
      eq(grades.termId, parsed.data.termId)
    ),
  });

  if (existing) {
    await db.update(grades)
      .set({
        test1: String(parsed.data.test1),
        test2: String(parsed.data.test2),
        assignment: String(parsed.data.assignment),
        attendance: String(parsed.data.attendance),
        exam: String(parsed.data.exam),
        total: String(total),
        grade,
        remark,
        teacherRemark: parsed.data.teacherRemark || null,
        updatedAt: new Date(),
      })
      .where(eq(grades.id, existing.id));
  } else {
    await db.insert(grades).values({
      ...parsed.data,
      test1: String(parsed.data.test1),
      test2: String(parsed.data.test2),
      assignment: String(parsed.data.assignment),
      attendance: String(parsed.data.attendance),
      exam: String(parsed.data.exam),
      total: String(total),
      grade,
      remark,
    });
  }

  revalidatePath("/[schoolSlug]/teacher/grades");
  return { success: true };
}

export async function saveBulkGrades(gradesData: z.infer<typeof gradeEntrySchema>[]) {
  for (const gradeData of gradesData) {
    await saveGrade(gradeData);
  }
  revalidatePath("/[schoolSlug]/teacher/grades");
  return { success: true };
}
