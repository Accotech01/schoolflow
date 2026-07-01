import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students,
  grades,
  studentEnrollments,
  academicSessions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateGrade, getGradeColor, cn } from "@/lib/utils";
import { DownloadResultsButton } from "./download-results-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function StudentResultsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const studentId = session!.user.id;
  const schoolId = session!.user.schoolId!;

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
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

  // Get all terms for active session (sorted: First, Second, Third)
  const sessionTerms = activeSession
    ? [...(activeSession.terms)].sort((a, b) => {
        const order = ["First", "Second", "Third"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      })
    : [];

  // Get all grades for this student in the active session
  const allGrades = activeSession
    ? await db.query.grades.findMany({
        where: eq(grades.studentId, studentId),
        with: { subject: true, term: true },
      })
    : [];

  const gradesByTerm = sessionTerms.map((term) => ({
    term,
    grades: allGrades
      .filter((g) => g.termId === term.id)
      .sort((a, b) => a.subject.name.localeCompare(b.subject.name)),
  }));

  // Calculate per-term stats
  const termStats = gradesByTerm.map(({ term, grades: termGrades }) => {
    const valid = termGrades.filter((g) => g.total !== null);
    const avg = valid.length > 0
      ? valid.reduce((s, g) => s + parseFloat(g.total || "0"), 0) / valid.length
      : 0;
    const { grade, remark } = calculateGrade(avg);
    return { term, grades: termGrades, avg, grade, remark };
  });

  // Overall session average
  const allValid = allGrades.filter((g) => g.total !== null);
  const sessionAvg = allValid.length > 0
    ? allValid.reduce((s, g) => s + parseFloat(g.total || "0"), 0) / allValid.length
    : 0;
  const { grade: sessionGrade, remark: sessionRemark } = calculateGrade(sessionAvg);

  const activeTerm = activeSession?.terms.find((t) => t.status === "active");
  const defaultTab = activeTerm?.name?.toLowerCase().replace(" ", "-") || "first";

  return (
    <div>
      <Topbar
        title="My Results"
        subtitle={
          activeSession
            ? `${activeSession.name} — ${enrollment?.class?.name || ""}`
            : "No active session"
        }
      />
      {activeSession && (
        <div className="px-6 pt-4 pb-2 flex justify-end">
          <DownloadResultsButton 
            studentName={student?.name || "Student"} 
            className={enrollment?.class?.name || "Unknown"}
            sessionName={activeSession.name}
          />
        </div>
      )}
      <div className="p-6 space-y-6" id="results-content">

        {!activeSession ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">No active academic session at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Session Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {termStats.map(({ term, grades: tg, avg, grade, remark }) => (
                <Card key={term.id} className={term.status === "active" ? "border-blue-300 bg-blue-50/30" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{term.name} Term</h3>
                      <div className="flex items-center gap-1">
                        {term.status === "active" && (
                          <Badge variant="info" className="text-xs">Active</Badge>
                        )}
                        {tg.length > 0 && (
                          <span className={cn(
                            "text-xs font-bold px-1.5 py-0.5 rounded",
                            getGradeColor(grade)
                          )}>
                            {grade}
                          </span>
                        )}
                      </div>
                    </div>
                    {avg > 0 ? (
                      <>
                        <p className="text-2xl font-bold">{avg.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">{remark} · {tg.filter(g => g.total !== null).length} subjects</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No grades yet</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Session Overall */}
            {sessionAvg > 0 && (
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Session Overall Average</p>
                      <p className="text-3xl font-bold mt-1">{sessionAvg.toFixed(1)}%</p>
                      <p className="text-blue-200 text-sm">{sessionRemark}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold text-blue-100">{sessionGrade}</div>
                      <p className="text-blue-200 text-sm mt-1">WAEC Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Per-term breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detailed Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={defaultTab}>
                  <TabsList>
                    {sessionTerms.map((term) => (
                      <TabsTrigger
                        key={term.id}
                        value={term.name.toLowerCase().replace(" ", "-")}
                      >
                        {term.name} Term
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {termStats.map(({ term, grades: termGrades, avg }) => (
                    <TabsContent
                      key={term.id}
                      value={term.name.toLowerCase().replace(" ", "-")}
                      className="mt-4"
                    >
                      {termGrades.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No results available for {term.name} Term.
                        </p>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 border-b">
                                  <th className="text-left px-3 py-2 font-medium">Subject</th>
                                  <th className="text-center px-2 py-2 font-medium">Test 1</th>
                                  <th className="text-center px-2 py-2 font-medium">Test 2</th>
                                  <th className="text-center px-2 py-2 font-medium">Assignment</th>
                                  <th className="text-center px-2 py-2 font-medium">Attendance</th>
                                  <th className="text-center px-2 py-2 font-medium">Exam</th>
                                  <th className="text-center px-2 py-2 font-medium">Total</th>
                                  <th className="text-center px-2 py-2 font-medium">Grade</th>
                                  <th className="text-left px-3 py-2 font-medium">Remark</th>
                                </tr>
                              </thead>
                              <tbody>
                                {termGrades.map((g, i) => {
                                  const total = parseFloat(g.total || "0");
                                  const { grade, remark } = calculateGrade(total);
                                  return (
                                    <tr
                                      key={g.id}
                                      className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                                    >
                                      <td className="px-3 py-2 font-medium">{g.subject.name}</td>
                                      <td className="px-2 py-2 text-center">{g.test1 ?? "—"}</td>
                                      <td className="px-2 py-2 text-center">{g.test2 ?? "—"}</td>
                                      <td className="px-2 py-2 text-center">{g.assignment ?? "—"}</td>
                                      <td className="px-2 py-2 text-center">{g.attendance ?? "—"}</td>
                                      <td className="px-2 py-2 text-center">{g.exam ?? "—"}</td>
                                      <td className="px-2 py-2 text-center font-bold">
                                        {total.toFixed(1)}%
                                      </td>
                                      <td className="px-2 py-2 text-center">
                                        <span className={cn(
                                          "text-xs font-bold px-1.5 py-0.5 rounded",
                                          getGradeColor(grade)
                                        )}>
                                          {grade}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-xs text-muted-foreground">
                                        {g.teacherRemark || remark}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {avg > 0 && (
                                <tfoot>
                                  <tr className="bg-gray-100 font-semibold border-t-2">
                                    <td className="px-3 py-2" colSpan={6}>Term Average</td>
                                    <td className="px-2 py-2 text-center">{avg.toFixed(1)}%</td>
                                    <td className="px-2 py-2 text-center">
                                      <span className={cn(
                                        "text-xs font-bold px-1.5 py-0.5 rounded",
                                        getGradeColor(calculateGrade(avg).grade)
                                      )}>
                                        {calculateGrade(avg).grade}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-xs">
                                      {calculateGrade(avg).remark}
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>

                          {/* Progress bars */}
                          <div className="mt-6 space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                              Performance Overview
                            </h4>
                            {termGrades.map((g) => {
                              const score = parseFloat(g.total || "0");
                              const { grade } = calculateGrade(score);
                              return (
                                <div key={g.id} className="flex items-center gap-3">
                                  <span className="text-xs w-32 truncate font-medium">{g.subject.name}</span>
                                  <Progress value={score} className="flex-1 h-2" />
                                  <span className="text-xs font-bold w-12 text-right">{score.toFixed(0)}%</span>
                                  <span className={cn(
                                    "text-xs font-bold px-1.5 py-0.5 rounded w-8 text-center",
                                    getGradeColor(grade)
                                  )}>
                                    {grade}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* WAEC Grading Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">WAEC Grading Scale Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {[
                    { grade: "A1", range: "75–100", label: "Excellent" },
                    { grade: "B2", range: "70–74", label: "Very Good" },
                    { grade: "B3", range: "65–69", label: "Good" },
                    { grade: "C4", range: "60–64", label: "Credit" },
                    { grade: "C5", range: "55–59", label: "Credit" },
                    { grade: "C6", range: "50–54", label: "Credit" },
                    { grade: "D7", range: "45–49", label: "Pass" },
                    { grade: "E8", range: "40–44", label: "Pass" },
                    { grade: "F9", range: "0–39", label: "Fail" },
                  ].map(({ grade, range, label }) => (
                    <div key={grade} className="text-center">
                      <div className={cn(
                        "text-xs font-bold px-2 py-1 rounded mb-1",
                        getGradeColor(grade)
                      )}>
                        {grade}
                      </div>
                      <p className="text-xs text-muted-foreground">{range}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
