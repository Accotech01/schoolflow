"use server";

import { db } from "@/lib/db";
import {
  classes,
  terms,
  studentEnrollments,
  studentSubjectAssignments,
  grades,
  parentStudents,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { calculateGrade } from "@/lib/utils";

interface MasterSheetRow {
  studentId: string;
  name: string;
  admissionNumber: string;
  scores: Record<string, number | null>;
  grandTotal: number;
  average: number;
  grade: string;
  remark: string;
  subjectsGraded: number;
  position: number | null;
}

interface MasterSheet {
  class: { id: string; name: string };
  term: { id: string; name: string };
  subjects: { id: string; name: string; code: string }[];
  rows: MasterSheetRow[];
  classAverage: number;
  totalRanked: number;
}

// Builds the full master sheet for a class/term: every student, their total
// per subject, grand total, average, overall grade, and class position
// (ranked descending by average — ties share a position, standard
// "1,2,2,4" competition ranking). No auth check here; callers gate access.
async function buildMasterSheet(classId: string, termId: string): Promise<MasterSheet | null> {
  const [cls, term] = await Promise.all([
    db.query.classes.findFirst({ where: eq(classes.id, classId) }),
    db.query.terms.findFirst({ where: eq(terms.id, termId) }),
  ]);
  if (!cls || !term) return null;

  const [enrollments, subjectAssignments, allGrades] = await Promise.all([
    db.query.studentEnrollments.findMany({
      where: and(
        eq(studentEnrollments.classId, classId),
        eq(studentEnrollments.sessionId, term.sessionId),
        eq(studentEnrollments.isActive, true)
      ),
      with: { student: true },
    }),
    db.query.studentSubjectAssignments.findMany({
      where: and(
        eq(studentSubjectAssignments.classId, classId),
        eq(studentSubjectAssignments.sessionId, term.sessionId),
        eq(studentSubjectAssignments.isActive, true)
      ),
      with: { subject: true },
    }),
    db.query.grades.findMany({
      where: and(eq(grades.classId, classId), eq(grades.termId, termId)),
    }),
  ]);

  const subjectMap = new Map<string, { id: string; name: string; code: string }>();
  subjectAssignments.forEach((a) => subjectMap.set(a.subjectId, a.subject));
  const subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const rows: Omit<MasterSheetRow, "position">[] = enrollments
    .map((e) => {
      const studentGrades = allGrades.filter((g) => g.studentId === e.studentId);
      const scores: Record<string, number | null> = {};
      subjects.forEach((sub) => {
        const g = studentGrades.find((g) => g.subjectId === sub.id);
        scores[sub.id] = g && g.total !== null ? parseFloat(g.total) : null;
      });

      const recorded = Object.values(scores).filter((v): v is number => v !== null);
      const grandTotal = recorded.reduce((sum, v) => sum + v, 0);
      const average = recorded.length > 0 ? Math.round((grandTotal / recorded.length) * 100) / 100 : 0;
      const { grade, remark } = calculateGrade(average);

      return {
        studentId: e.studentId,
        name: e.student.name,
        admissionNumber: e.student.admissionNumber,
        scores,
        grandTotal,
        average,
        grade,
        remark,
        subjectsGraded: recorded.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const graded = [...rows].filter((r) => r.subjectsGraded > 0).sort((a, b) => b.average - a.average);
  const ungraded = rows.filter((r) => r.subjectsGraded === 0);

  let lastAverage: number | null = null;
  let lastPosition = 0;
  const gradedRanked: MasterSheetRow[] = graded.map((r, idx) => {
    if (lastAverage === null || r.average !== lastAverage) {
      lastPosition = idx + 1;
      lastAverage = r.average;
    }
    return { ...r, position: lastPosition };
  });
  const ungradedRanked: MasterSheetRow[] = ungraded.map((r) => ({ ...r, position: null }));

  const classAverage =
    graded.length > 0 ? Math.round((graded.reduce((sum, r) => sum + r.average, 0) / graded.length) * 100) / 100 : 0;

  return {
    class: { id: cls.id, name: cls.name },
    term: { id: term.id, name: term.name },
    subjects,
    rows: [...gradedRanked, ...ungradedRanked],
    classAverage,
    totalRanked: graded.length,
  };
}

export async function getClassMasterSheet(classId: string, termId: string) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) return null;

  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!cls || cls.schoolId !== session.user.schoolId) return null;

  return buildMasterSheet(classId, termId);
}

// Every class ranked by average for the given term — used to surface the
// school's best performing class.
export async function getClassPerformanceRanking(termId: string) {
  const session = await auth();
  if (session?.user?.role !== "school_admin" || !session.user.schoolId) return [];

  const term = await db.query.terms.findFirst({ where: eq(terms.id, termId) });
  if (!term || term.schoolId !== session.user.schoolId) return [];

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, session.user.schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  const results = await Promise.all(
    allClasses.map(async (cls) => {
      const sheet = await buildMasterSheet(cls.id, termId);
      return {
        classId: cls.id,
        className: cls.name,
        average: sheet?.classAverage ?? 0,
        totalRanked: sheet?.totalRanked ?? 0,
      };
    })
  );

  return results.filter((r) => r.totalRanked > 0).sort((a, b) => b.average - a.average);
}

// A single student's class position for a term — used on the student's own
// results page and a parent's view of their child, each with their own
// ownership check (no school-admin requirement here).
export async function getStudentClassPosition(studentId: string, termId: string) {
  const session = await auth();
  if (!session?.user) return null;

  const { role, id: userId, schoolId } = session.user;
  if (role === "student" && userId !== studentId) return null;
  if (role === "parent") {
    const link = await db.query.parentStudents.findFirst({
      where: and(eq(parentStudents.parentId, userId), eq(parentStudents.studentId, studentId)),
    });
    if (!link) return null;
  }
  if (role !== "student" && role !== "parent" && role !== "school_admin") return null;

  const term = await db.query.terms.findFirst({ where: eq(terms.id, termId) });
  if (!term || (schoolId && term.schoolId !== schoolId)) return null;

  const enrollment = await db.query.studentEnrollments.findFirst({
    where: and(
      eq(studentEnrollments.studentId, studentId),
      eq(studentEnrollments.sessionId, term.sessionId),
      eq(studentEnrollments.isActive, true)
    ),
  });
  if (!enrollment) return null;

  const sheet = await buildMasterSheet(enrollment.classId, termId);
  const row = sheet?.rows.find((r) => r.studentId === studentId);
  if (!sheet || !row) return null;

  return { position: row.position, totalRanked: sheet.totalRanked, average: row.average, grade: row.grade };
}
