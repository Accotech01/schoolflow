import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students,
  studentEnrollments,
  academicSessions,
  grades,
  promotions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { calculateGrade, getGradeColor, getAcademicRecommendation, cn, formatDate } from "@/lib/utils";
import {
  User, Mail, Phone, Calendar, MapPin, Hash, GraduationCap, Award, Lightbulb,
} from "lucide-react";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function StudentProfilePage({ params }: Props) {
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

  // Current term grades for recommendation
  const termGrades = activeTerm
    ? await db.query.grades.findMany({
        where: and(
          eq(grades.studentId, studentId),
          eq(grades.termId, activeTerm.id)
        ),
      })
    : [];

  const validGrades = termGrades.filter((g) => g.total !== null);
  const average =
    validGrades.length > 0
      ? validGrades.reduce((s, g) => s + parseFloat(g.total || "0"), 0) / validGrades.length
      : 0;
  const { grade: avgGrade, remark: avgRemark } = calculateGrade(average);
  const recommendation = getAcademicRecommendation(average, avgGrade);

  // Promotion history
  const promotionHistory = await db.query.promotions.findMany({
    where: eq(promotions.studentId, studentId),
    with: { fromClass: true, toClass: true, session: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });

  if (!student) {
    return (
      <div>
        <Topbar title="My Profile" subtitle="Student account information" />
        <div className="p-6">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="My Profile" subtitle="Your personal and academic information" />
      <div className="p-6 space-y-6">
        {/* Personal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{student.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="info">Student</Badge>
                  <Badge variant={student.status === "active" ? "success" : "secondary"}>
                    {student.status}
                  </Badge>
                  {enrollment && (
                    <Badge variant="secondary">{enrollment.class.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Admission Number</p>
                  <p className="text-sm font-medium font-mono">{student.admissionNumber}</p>
                </div>
              </div>

              {student.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email / Username</p>
                    <p className="text-sm font-medium">{student.email}</p>
                  </div>
                </div>
              )}

              {student.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm font-medium">{formatDate(student.dateOfBirth)}</p>
                  </div>
                </div>
              )}

              {student.gender && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm font-medium capitalize">{student.gender}</p>
                  </div>
                </div>
              )}

              {student.stateOfOrigin && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">State of Origin</p>
                    <p className="text-sm font-medium">{student.stateOfOrigin}</p>
                  </div>
                </div>
              )}

              {student.guardianPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Parent/Guardian Contact</p>
                    <p className="text-sm font-medium">{student.guardianPhone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Enrolled Since</p>
                  <p className="text-sm font-medium">{formatDate(student.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Summary */}
        {average > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Current Term Academic Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{average.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xl font-bold px-3 py-1 rounded",
                    getGradeColor(avgGrade)
                  )}>
                    {avgGrade}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">WAEC Grade</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">{avgRemark}</p>
                  <p className="text-xs text-muted-foreground">{validGrades.length} subjects graded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendation */}
        {average > 0 && (
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Personalised Academic Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
            </CardContent>
          </Card>
        )}

        {/* Promotion History */}
        {promotionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                Promotion History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {promotionHistory.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {p.fromClass?.name || "—"} → {p.toClass?.name || "Pending"}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.session?.name}</p>
                      {p.adminNote && (
                        <p className="text-xs text-muted-foreground italic">{p.adminNote}</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        p.status === "auto_promoted" || p.status === "manual_promoted"
                          ? "success"
                          : p.status === "repeated"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize text-xs"
                    >
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Note */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> To update your personal information or change your password,
              please contact your school administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
