import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students, grades, academicSessions, terms, classes, subjects, studentEnrollments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getStudentClassPosition } from "@/actions/reports";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGradeColor, cn } from "@/lib/utils";
import { ReportCardPrint } from "./report-card-print";
import { DownloadReportCardButton } from "./download-report-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ studentId?: string; termId?: string }>;
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { studentId, termId } = await searchParams;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const school = await db.query.schools.findFirst({
    where: (s, { eq }) => eq(s.id, schoolId),
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });

  const activeTerm = activeSession?.terms.find((t) =>
    termId ? t.id === termId : t.status === "active"
  );

  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    orderBy: (s, { asc }) => [asc(s.name)],
    with: {
      enrollments: {
        where: and(
          eq(studentEnrollments.isActive, true),
          activeSession ? eq(studentEnrollments.sessionId, activeSession.id) : undefined!
        ),
        with: { class: true },
      },
    },
  });

  const selectedStudent = studentId
    ? allStudents.find((s) => s.id === studentId)
    : null;

  const studentGrades = selectedStudent && activeTerm
    ? await db.query.grades.findMany({
        where: and(
          eq(grades.studentId, selectedStudent.id),
          eq(grades.termId, activeTerm.id),
          eq(grades.schoolId, schoolId)
        ),
        with: { subject: true, teacher: true },
        orderBy: (g, { asc }) => [asc(g.subjectId)],
      })
    : [];

  const positionInfo = selectedStudent && activeTerm
    ? await getStudentClassPosition(selectedStudent.id, activeTerm.id)
    : null;

  return (
    <div>
      <Topbar title="Reports" subtitle="Generate and print student report cards" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Student</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {allStudents.map((s) => (
                  <a
                    key={s.id}
                    href={`?studentId=${s.id}${termId ? `&termId=${termId}` : ""}`}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer",
                      studentId === s.id ? "bg-blue-50 text-blue-700 font-medium" : ""
                    )}
                  >
                    <span>{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.enrollments[0]?.class.name || "—"}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Report Card */}
          <div className="lg:col-span-2">
            {!selectedStudent ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Select a student to view their report card
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <DownloadReportCardButton 
                    studentName={selectedStudent.name} 
                    sessionName={activeSession?.name || ""}
                  />
                </div>
                <div id="report-card-content">
                  <ReportCardPrint
                    student={selectedStudent}
                    grades={studentGrades}
                    school={school!}
                    session={activeSession?.name || ""}
                    term={activeTerm?.name || ""}
                    className={selectedStudent.enrollments[0]?.class.name || ""}
                    position={positionInfo?.position}
                    totalRanked={positionInfo?.totalRanked}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
