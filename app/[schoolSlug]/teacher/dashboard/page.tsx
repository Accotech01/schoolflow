import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  teacherAssignments,
  academicSessions,
  grades,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ClipboardCheck, Users, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function TeacherDashboard({ params }: Props) {
  const { schoolSlug } = await params;
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

  const uniqueClasses = [...new Set(myAssignments.map((a) => a.classId))];
  const uniqueSubjects = [...new Set(myAssignments.map((a) => a.subjectId))];

  const recentGrades = activeTerm
    ? await db.query.grades.findMany({
        where: and(
          eq(grades.teacherId, teacherId),
          eq(grades.termId, activeTerm.id)
        ),
        orderBy: (g, { desc }) => [desc(g.updatedAt)],
        limit: 5,
        with: { student: true, subject: true },
      })
    : [];

  return (
    <div>
      <Topbar
        title="Teacher Dashboard"
        subtitle={
          activeSession
            ? `${activeSession.name} — ${activeTerm?.name || ""} Term`
            : "No active session"
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="My Classes" value={uniqueClasses.length} icon={Layers} color="blue" />
          <StatCard title="My Subjects" value={uniqueSubjects.length} icon={BookOpen} color="green" />
          <StatCard title="Assignments" value={myAssignments.length} icon={ClipboardCheck} color="purple" />
          <StatCard title="Grades Entered" value={recentGrades.length > 0 ? "Active" : "0"} icon={Users} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Teaching Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">My Assignments</CardTitle>
              <Link href={`/${schoolSlug}/teacher/grades`}>
                <Button size="sm" variant="outline">Grade Students</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {myAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments yet for this session.</p>
              ) : (
                <div className="space-y-2">
                  {myAssignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{a.subject.name}</p>
                        <p className="text-xs text-muted-foreground">{a.class.name}</p>
                      </div>
                      <Badge variant="info">
                        <code className="text-xs">{a.subject.code}</code>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Grading Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Grading Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grades entered this term yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentGrades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{g.student.name}</p>
                        <p className="text-xs text-muted-foreground">{g.subject.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{g.total}%</p>
                        <span className="text-xs text-muted-foreground">{g.grade}</span>
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
