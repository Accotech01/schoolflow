import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students,
  grades,
  studentEnrollments,
  academicSessions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getMyAttendanceSummary } from "@/actions/attendance";
import { Topbar } from "@/components/nav/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { CurrentTermBanner } from "@/components/dashboard/current-term-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen, BarChart3, Award, TrendingUp, Lightbulb, Star, CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { calculateGrade, getGradeColor, getAcademicRecommendation, cn } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function StudentDashboard({ params }: Props) {
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

  const activeTerm = activeSession?.terms.find((t) => t.status === "active");

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

  // Get grades for current term
  const termGrades = activeTerm
    ? await db.query.grades.findMany({
        where: and(
          eq(grades.studentId, studentId),
          eq(grades.termId, activeTerm.id)
        ),
        with: { subject: true },
        orderBy: (g, { desc }) => [desc(g.updatedAt)],
      })
    : [];

  // Calculate average
  const validGrades = termGrades.filter((g) => g.total !== null);
  const average =
    validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + parseFloat(g.total || "0"), 0) / validGrades.length
      : 0;

  const { grade: avgGrade, remark: avgRemark } = calculateGrade(average);
  const recommendation = getAcademicRecommendation(average, avgGrade);

  const subjectsWithGrades = termGrades.filter((g) => g.total !== null).length;

  const attendance = await getMyAttendanceSummary();

  return (
    <div>
      <Topbar
        title={`Welcome, ${student?.name?.split(" ")[0] || "Student"}`}
        subtitle={
          activeSession
            ? `${activeSession.name} — ${activeTerm?.name || ""} Term`
            : "No active session"
        }
      />
      <div className="p-6 space-y-6">
        <CurrentTermBanner
          sessionName={activeSession?.name}
          termName={activeTerm?.name}
          startDate={activeTerm?.startDate}
          endDate={activeTerm?.endDate}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Current Class"
            value={enrollment?.class?.name || "—"}
            icon={BookOpen}
            color="blue"
          />
          <StatCard
            title="Subjects Graded"
            value={subjectsWithGrades}
            icon={BarChart3}
            color="green"
          />
          <StatCard
            title="Term Average"
            value={average > 0 ? `${average.toFixed(1)}%` : "N/A"}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Current Grade"
            value={average > 0 ? avgGrade : "—"}
            description={average > 0 ? avgRemark : undefined}
            icon={Award}
            color="orange"
          />
          <StatCard
            title="Attendance"
            value={attendance?.score !== null && attendance?.score !== undefined ? `${attendance.score}/${attendance.maxScore}` : "N/A"}
            description={attendance && attendance.totalMarked > 0 ? `${attendance.percentage}% attended` : undefined}
            icon={CalendarCheck}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subject Performance */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Subject Performance — {activeTerm?.name || ""} Term</CardTitle>
                <Link href={`/${schoolSlug}/student/results`}>
                  <Button size="sm" variant="outline">Full Report</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {termGrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No grades available for this term yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {termGrades.map((g) => {
                      const score = parseFloat(g.total || "0");
                      const { grade, remark } = calculateGrade(score);
                      return (
                        <div key={g.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{g.subject.name}</span>
                              <span className={cn(
                                "text-xs font-bold px-1.5 py-0.5 rounded",
                                getGradeColor(grade)
                              )}>
                                {grade}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold">{score.toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground ml-1">— {remark}</span>
                            </div>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendation */}
          <div className="space-y-4">
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Academic Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {average > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold px-2 py-1 rounded",
                        getGradeColor(avgGrade)
                      )}>
                        {avgGrade}
                      </span>
                      <span className="text-sm text-muted-foreground">{avgRemark}</span>
                    </div>
                    <Separator />
                    <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Recommendations will appear once your grades are available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Best Subject */}
            {termGrades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Best Subject This Term
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const best = termGrades.reduce((max, g) =>
                      parseFloat(g.total || "0") > parseFloat(max.total || "0") ? g : max
                    );
                    const { grade } = calculateGrade(parseFloat(best.total || "0"));
                    return (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{best.subject.name}</p>
                          <p className="text-xs text-muted-foreground">{parseFloat(best.total || "0").toFixed(1)}%</p>
                        </div>
                        <Badge variant="info" className={cn("text-xs font-bold", getGradeColor(grade))}>
                          {grade}
                        </Badge>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Needs Improvement */}
            {termGrades.filter((g) => parseFloat(g.total || "0") < 50).length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">⚠ Needs Attention</p>
                  {termGrades
                    .filter((g) => parseFloat(g.total || "0") < 50)
                    .map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span className="text-red-700">{g.subject.name}</span>
                        <span className="font-bold text-red-700">{parseFloat(g.total || "0").toFixed(0)}%</span>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
