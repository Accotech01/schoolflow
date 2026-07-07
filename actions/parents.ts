"use server";

import { db } from "@/lib/db";
import {
  parentStudents,
  students,
  studentEnrollments,
  grades,
  academicSessions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

async function requireParent() {
  const session = await auth();
  if (session?.user?.role !== "parent" || !session.user.schoolId) return null;
  return session;
}

// Verifies the signed-in parent is actually linked to this student before
// any child-specific data is returned.
async function requireOwnedChild(studentId: string) {
  const session = await requireParent();
  if (!session) return null;

  const link = await db.query.parentStudents.findFirst({
    where: and(eq(parentStudents.parentId, session.user.id), eq(parentStudents.studentId, studentId)),
  });
  if (!link) return null;

  return session;
}

// Every child linked to the signed-in parent, with their current class.
export async function getMyChildren() {
  const session = await requireParent();
  if (!session) return [];

  const links = await db.query.parentStudents.findMany({
    where: eq(parentStudents.parentId, session.user.id),
    with: { student: true },
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, session.user.schoolId!), eq(academicSessions.status, "active")),
  });

  return Promise.all(
    links.map(async (link) => {
      const enrollment = activeSession
        ? await db.query.studentEnrollments.findFirst({
            where: and(
              eq(studentEnrollments.studentId, link.studentId),
              eq(studentEnrollments.sessionId, activeSession.id),
              eq(studentEnrollments.isActive, true)
            ),
            with: { class: true },
          })
        : null;

      return {
        id: link.student.id,
        name: link.student.name,
        admissionNumber: link.student.admissionNumber,
        status: link.student.status,
        gender: link.student.gender,
        className: enrollment?.class.name || null,
      };
    })
  );
}

export async function getChildProfile(studentId: string) {
  const session = await requireOwnedChild(studentId);
  if (!session) return null;

  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  if (!student) return null;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, session.user.schoolId!), eq(academicSessions.status, "active")),
    with: { terms: true },
  });

  const enrollment = activeSession
    ? await db.query.studentEnrollments.findFirst({
        where: and(
          eq(studentEnrollments.studentId, studentId),
          eq(studentEnrollments.sessionId, activeSession.id),
          eq(studentEnrollments.isActive, true)
        ),
        with: { class: true },
      })
    : null;

  const activeTerm = activeSession?.terms.find((t) => t.status === "active") || null;

  return { student, activeSession, activeTerm, enrollment };
}

export async function getChildGrades(studentId: string, termId: string) {
  const session = await requireOwnedChild(studentId);
  if (!session) return [];

  return db.query.grades.findMany({
    where: and(eq(grades.studentId, studentId), eq(grades.termId, termId)),
    with: { subject: true },
    orderBy: (g, { asc }) => [asc(g.subjectId)],
  });
}
