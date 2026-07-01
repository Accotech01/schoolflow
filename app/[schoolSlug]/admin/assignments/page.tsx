import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  teachers, classes, subjects, teacherAssignments, academicSessions,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AssignTeacherDialog } from "./assign-teacher-dialog";
import { RemoveAssignmentButton } from "./remove-assignment-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function AssignmentsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
  });

  const assignments = activeSession
    ? await db.query.teacherAssignments.findMany({
        where: and(
          eq(teacherAssignments.schoolId, schoolId),
          eq(teacherAssignments.sessionId, activeSession.id)
        ),
        with: { teacher: true, class: true, subject: true },
      })
    : [];

  const allTeachers = await db.query.teachers.findMany({
    where: eq(teachers.schoolId, schoolId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });
  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });
  const allSubjects = await db.query.subjects.findMany({
    where: eq(subjects.schoolId, schoolId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  return (
    <div>
      <Topbar title="Teacher Assignments" subtitle="Assign teachers to classes and subjects" />
      <div className="p-6">
        {!activeSession ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">No active academic session found. Please create a session in Sessions & Terms first.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Assignments — {activeSession.name}
                <span className="text-sm font-normal text-muted-foreground ml-2">({assignments.length} total)</span>
              </CardTitle>
              <AssignTeacherDialog
                schoolId={schoolId}
                sessionId={activeSession.id}
                teachers={allTeachers}
                classes={allClasses}
                subjects={allSubjects}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                        No assignments yet for this session.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.teacher.name}</TableCell>
                        <TableCell>{a.class.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <code className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{a.subject.code}</code>
                            {a.subject.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <RemoveAssignmentButton assignmentId={a.id} label={`${a.teacher.name} → ${a.subject.name}`} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
