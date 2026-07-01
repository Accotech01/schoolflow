import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  teachers,
  teacherAssignments,
  academicSessions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, BookOpen, GraduationCap, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function TeacherProfilePage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const teacherId = session!.user.id;
  const schoolId = session!.user.schoolId!;

  const teacher = await db.query.teachers.findFirst({
    where: eq(teachers.id, teacherId),
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });

  const myAssignments = activeSession
    ? await db.query.teacherAssignments.findMany({
        where: and(
          eq(teacherAssignments.teacherId, teacherId),
          eq(teacherAssignments.sessionId, activeSession.id)
        ),
        with: { class: true, subject: true },
      })
    : [];

  if (!teacher) {
    return (
      <div>
        <Topbar title="My Profile" subtitle="View your account information" />
        <div className="p-6">
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="My Profile" subtitle="Your account information and teaching details" />
      <div className="p-6 space-y-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{teacher.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">Teacher</Badge>
                  <Badge variant={teacher.status === "active" ? "success" : "secondary"}>
                    {teacher.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{teacher.email}</p>
                </div>
              </div>

              {teacher.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{teacher.phone}</p>
                  </div>
                </div>
              )}

              {teacher.qualification && (
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium">{teacher.qualification}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">{formatDate(teacher.createdAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Current Teaching Assignments
              {activeSession && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  — {activeSession.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teaching assignments for the current session.
              </p>
            ) : (
              <div className="space-y-2">
                {myAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{a.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{a.class.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {a.subject.code}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Security Note */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> To update your profile information or change your password,
              please contact your school administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
