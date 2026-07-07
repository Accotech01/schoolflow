import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students,
  teachers,
  classes,
  subjects,
  grades,
  academicSessions,
  terms,
  schoolAdmins,
  schools,
} from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaymentStatusBanner } from "@/components/dashboard/payment-status-banner";
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function AdminDashboard({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const currentAdmin = await db.query.schoolAdmins.findFirst({
    where: eq(schoolAdmins.id, session!.user.id),
  });

  const school = await db.query.schools.findFirst({
    where: eq(schools.id, schoolId),
  });

  const [[studentCount], [teacherCount], [classCount], [subjectCount], [activeStudentCount]] =
    await Promise.all([
      db.select({ count: count() }).from(students).where(eq(students.schoolId, schoolId)),
      db.select({ count: count() }).from(teachers).where(eq(teachers.schoolId, schoolId)),
      db.select({ count: count() }).from(classes).where(eq(classes.schoolId, schoolId)),
      db.select({ count: count() }).from(subjects).where(eq(subjects.schoolId, schoolId)),
      db.select({ count: count() }).from(students).where(and(eq(students.schoolId, schoolId), eq(students.status, "active"))),
    ]);

  const amountDue = school ? activeStudentCount.count * parseFloat(school.amountPerStudent) : undefined;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(
      eq(academicSessions.schoolId, schoolId),
      eq(academicSessions.status, "active")
    ),
    with: {
      terms: true,
    },
  });

  const activeTerm = activeSession?.terms.find((t) => t.status === "active");

  const recentGrades = await db.query.grades.findMany({
    where: eq(grades.schoolId, schoolId),
    orderBy: (g, { desc }) => [desc(g.updatedAt)],
    limit: 8,
    with: {
      student: true,
      subject: true,
      class: true,
    },
  });

  return (
    <div>
      <Topbar
        title="Admin Dashboard"
        subtitle={activeSession ? `${activeSession.name} — ${activeTerm?.name || ""} Term` : "No active session"}
      />
      <div className="p-6 space-y-6">
        {currentAdmin && (
          <PaymentStatusBanner
            status={currentAdmin.status}
            nextPaymentDueDate={currentAdmin.nextPaymentDueDate}
            amountDue={amountDue}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={studentCount.count}
            icon={GraduationCap}
            color="blue"
          />
          <StatCard
            title="Teachers"
            value={teacherCount.count}
            icon={Users}
            color="green"
          />
          <StatCard
            title="Classes"
            value={classCount.count}
            icon={Layers}
            color="purple"
          />
          <StatCard
            title="Subjects"
            value={subjectCount.count}
            icon={BookOpen}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Session Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Academic Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeSession ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Session</span>
                    <Badge variant="success">{activeSession.name}</Badge>
                  </div>
                  {activeSession.terms.map((term) => (
                    <div key={term.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-sm text-gray-600">{term.name} Term</span>
                      <Badge variant={term.status === "active" ? "success" : "secondary"}>
                        {term.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No active session. Create a new session from Sessions & Terms.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Grade Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                Recent Grade Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <p className="text-muted-foreground text-sm">No grades entered yet</p>
              ) : (
                <div className="space-y-2">
                  {recentGrades.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{g.student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.subject.name} · {g.class.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{g.total}%</p>
                        <Badge
                          className="text-xs"
                          variant={
                            Number(g.total) >= 50 ? "success" : "destructive"
                          }
                        >
                          {g.grade}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
