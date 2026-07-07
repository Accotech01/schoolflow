import { notFound } from "next/navigation";
import { getChildProfile, getChildGrades } from "@/actions/parents";
import { getChildAttendanceSummary } from "@/actions/attendance";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { calculateGrade, getGradeColor, formatDate, cn } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string; studentId: string }>;
}

export default async function ChildDetailPage({ params }: Props) {
  const { schoolSlug, studentId } = await params;

  const profile = await getChildProfile(studentId);
  if (!profile) notFound();

  const { student, activeSession, activeTerm, enrollment } = profile;

  const termGrades = activeTerm ? await getChildGrades(studentId, activeTerm.id) : [];
  const validGrades = termGrades.filter((g) => g.total !== null);
  const average =
    validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + parseFloat(g.total || "0"), 0) / validGrades.length
      : 0;
  const { grade: avgGrade, remark: avgRemark } = calculateGrade(average);

  const attendance = await getChildAttendanceSummary(studentId);

  return (
    <div>
      <Topbar title={student.name} subtitle={enrollment?.class?.name || "Not enrolled"} />
      <div className="p-6 space-y-6">
        <Link href={`/${schoolSlug}/parent/dashboard`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Admission Number</p>
              <p className="text-lg font-bold">{student.admissionNumber}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={student.status === "active" ? "success" : "warning"} className="mt-1">
                {student.status}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-lg font-bold">
                  {attendance?.score !== null && attendance?.score !== undefined
                    ? `${attendance.score}/${attendance.maxScore}`
                    : "N/A"}
                </p>
                {attendance && attendance.totalMarked > 0 && (
                  <p className="text-xs text-muted-foreground">{attendance.percentage}% attended</p>
                )}
              </div>
              <CalendarCheck className="h-6 w-6 text-blue-500" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {activeSession ? `${activeSession.name} — ${activeTerm?.name || ""} Term Results` : "Results"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!activeSession ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active academic session.</p>
            ) : termGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No grades available for this term yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-3 py-2 font-medium">Subject</th>
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
                        <tr key={g.id} className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="px-3 py-2 font-medium">{g.subject.name}</td>
                          <td className="px-2 py-2 text-center font-bold">{total.toFixed(1)}%</td>
                          <td className="px-2 py-2 text-center">
                            <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getGradeColor(grade))}>
                              {grade}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{g.teacherRemark || remark}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {average > 0 && (
                    <tfoot>
                      <tr className="bg-gray-100 font-semibold border-t-2">
                        <td className="px-3 py-2">Term Average</td>
                        <td className="px-2 py-2 text-center">{average.toFixed(1)}%</td>
                        <td className="px-2 py-2 text-center">
                          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getGradeColor(avgGrade))}>
                            {avgGrade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">{avgRemark}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-right">
          Registered: {formatDate(student.createdAt)}
        </p>
      </div>
    </div>
  );
}
