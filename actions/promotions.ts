"use server";

import { db } from "@/lib/db";
import {
  promotions,
  grades,
  studentEnrollments,
  classes,
  academicSessions,
} from "@/lib/db/schema";
import { eq, and, avg } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { calculateGrade, isPromotionEligible } from "@/lib/utils";

export async function generatePromotions(sessionId: string, schoolId: string) {
  // Get all active student enrollments for this session
  const enrollments = await db.query.studentEnrollments.findMany({
    where: and(
      eq(studentEnrollments.sessionId, sessionId),
      eq(studentEnrollments.schoolId, schoolId),
      eq(studentEnrollments.isActive, true)
    ),
    with: {
      student: true,
      class: true,
    },
  });

  // Get all classes sorted by level for promotion
  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  let created = 0;

  for (const enrollment of enrollments) {
    // Get student's grades for this session
    const studentGrades = await db.query.grades.findMany({
      where: and(
        eq(grades.studentId, enrollment.studentId),
        eq(grades.sessionId, sessionId),
        eq(grades.schoolId, schoolId)
      ),
    });

    if (studentGrades.length === 0) continue;

    const totalScore = studentGrades.reduce(
      (sum, g) => sum + parseFloat(g.total || "0"),
      0
    );
    const averageScore = totalScore / studentGrades.length;
    const { grade: avgGrade } = calculateGrade(averageScore);
    const eligible = isPromotionEligible(avgGrade);

    // Find next class (by level)
    const currentClassLevel = enrollment.class.level;
    const nextClass = allClasses.find((c) => c.level === currentClassLevel + 1);

    // Check if promotion already exists
    const existingPromotion = await db.query.promotions.findFirst({
      where: and(
        eq(promotions.studentId, enrollment.studentId),
        eq(promotions.sessionId, sessionId)
      ),
    });

    if (existingPromotion) continue;

    await db.insert(promotions).values({
      studentId: enrollment.studentId,
      fromClassId: enrollment.classId,
      toClassId: nextClass?.id || null,
      sessionId,
      schoolId,
      averageScore: String(averageScore.toFixed(2)),
      averageGrade: avgGrade,
      status: eligible ? "auto_promoted" : "pending",
    });
    created++;
  }

  revalidatePath("/[schoolSlug]/admin/promotions");
  return { success: true, created };
}

export async function processPromotion(
  promotionId: string,
  status: "manual_promoted" | "repeated",
  toClassId?: string,
  adminNote?: string,
  adminId?: string
) {
  await db.update(promotions)
    .set({
      status,
      toClassId: toClassId || null,
      adminNote: adminNote || null,
      promotedBy: adminId || null,
      promotedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(promotions.id, promotionId));

  revalidatePath("/[schoolSlug]/admin/promotions");
  return { success: true };
}

export async function executePromotions(sessionId: string, schoolId: string) {
  // Get all approved promotions (auto or manual)
  const approvedPromotions = await db.query.promotions.findMany({
    where: and(
      eq(promotions.sessionId, sessionId),
      eq(promotions.schoolId, schoolId),
    ),
    with: { student: true, toClass: true },
  });

  // Get next session
  const nextSession = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.schoolId, schoolId),
      eq(academicSessions.status, "active")
    ),
  });

  if (!nextSession) {
    return { success: false, error: "No active session found for new enrollments" };
  }

  let processed = 0;
  for (const promotion of approvedPromotions) {
    if (
      (promotion.status === "auto_promoted" || promotion.status === "manual_promoted") &&
      promotion.toClassId
    ) {
      // Enroll student in new class for next session
      const existing = await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.studentId, promotion.studentId),
          eq(studentEnrollments.sessionId, nextSession.id)
        ),
      });
      if (!existing) {
        await db.insert(studentEnrollments).values({
          studentId: promotion.studentId,
          classId: promotion.toClassId,
          sessionId: nextSession.id,
          schoolId,
          isActive: true,
        });
        processed++;
      }
    }
  }

  revalidatePath("/[schoolSlug]/admin/promotions");
  return { success: true, processed };
}
