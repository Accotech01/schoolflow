import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  teacherAssignments,
  academicSessions,
  studentSubjectAssignments,
  grades,
  gradeSettings,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeEntryTable } from "./grade-entry-table";
import { GradeSettingsDialog } from "./grade-settings-dialog";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ classId?: string; subjectId?: string }>;
}

export default async function GradesPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { classId, subjectId } = await searchParams;
  const session = await auth();
  const teacherId = session!.user.id;
  const schoolId = session!.user.schoolId!;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });

  const activeTerm = activeSession?.terms.find((t) => t.status === "active");

  const myAssignments = activeSession
    ? await db.query.teacherAssignments.findMany({
        where: and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.sessionId, activeSession.id)
        ),
        with: { class: true, subject: true },
      })
    : [];

  const selectedAssignment =
    classId && subjectId
      ? myAssignments.find((a) => a.classId === classId && a.subjectId === subjectId)
      : null;

  const enrolledStudents =
    selectedAssignment && activeSession
      ? await db.query.studentSubjectAssignments.findMany({
          where: and(
            eq(studentSubjectAssignments.classId, selectedAssignment.classId),
            eq(studentSubjectAssignments.subjectId, selectedAssignment.subjectId),
            eq(studentSubjectAssignments.sessionId, activeSession.id),
            eq(studentSubjectAssignments.isActive, true)
          ),
          with: { student: true },
          orderBy: (ssa, { asc }) => [asc(ssa.studentId)],
        }).catch(() => []) // Fallback to empty if table doesn't exist
      : [];

  const existingGrades =
    selectedAssignment && activeTerm
      ? await db.query.grades.findMany({
          where: and(
            eq(grades.classId, selectedAssignment.classId),
            eq(grades.subjectId, selectedAssignment.subjectId),
            eq(grades.termId, activeTerm.id)
          ),
        })
      : [];

  const gradeConfig =
    selectedAssignment && activeTerm
      ? await db.query.gradeSettings.findFirst({
          where: and(
            eq(gradeSettings.teacherId, teacherId),
            eq(gradeSettings.classId, selectedAssignment.classId),
            eq(gradeSettings.subjectId, selectedAssignment.subjectId),
            eq(gradeSettings.termId, activeTerm.id)
          ),
        })
      : null;

  return (
    <div>
      <Topbar
        title="Grade Students"
        subtitle={activeTerm ? `${activeSession?.name} — ${activeTerm.name} Term` : "No active term"}
      />
      <div className="p-6 space-y-6">
        {!activeSession || !activeTerm ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">No active academic session or term. Ask your admin to set up the academic calendar.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Assignment Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Class & Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {myAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No teaching assignments for this session.</p>
                  ) : (
                    myAssignments.map((a) => (
                      <a
                        key={a.id}
                        href={`?classId=${a.classId}&subjectId=${a.subjectId}`}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          classId === a.classId && subjectId === a.subjectId
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        {a.class.name} — {a.subject.name}
                      </a>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Grade Entry */}
            {selectedAssignment ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedAssignment.class.name} · {selectedAssignment.subject.name}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({enrolledStudents.length} students)
                    </span>
                  </CardTitle>
                  <GradeSettingsDialog
                    teacherId={teacherId}
                    classId={selectedAssignment.classId}
                    subjectId={selectedAssignment.subjectId}
                    termId={activeTerm.id}
                    schoolId={schoolId}
                    currentSettings={gradeConfig}
                  />
                </CardHeader>
                <CardContent>
                  {enrolledStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">
                      No students enrolled in this class for the current session.
                    </p>
                  ) : (
                    <GradeEntryTable
                      students={enrolledStudents.map((e) => e.student)}
                      existingGrades={existingGrades}
                      teacherId={teacherId}
                      classId={selectedAssignment.classId}
                      subjectId={selectedAssignment.subjectId}
                      termId={activeTerm.id}
                      sessionId={activeSession.id}
                      schoolId={schoolId}
                      maxScores={{
                        maxTest1: parseFloat(gradeConfig?.maxTest1 || "20"),
                        maxTest2: parseFloat(gradeConfig?.maxTest2 || "20"),
                        maxAssignment: parseFloat(gradeConfig?.maxAssignment || "10"),
                        maxAttendance: parseFloat(gradeConfig?.maxAttendance || "10"),
                        maxExam: parseFloat(gradeConfig?.maxExam || "60"),
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a class and subject above to start grading students
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
