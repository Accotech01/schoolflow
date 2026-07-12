import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  students,
  academicSessions,
  classes,
  studentEnrollments,
  studentSubjectAssignments,
  subjects,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSearch } from "@/components/ui/table-search";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import Link from "next/link";
import { StudentDialog } from "./student-dialog";
import { DeleteStudentButton } from "./delete-student-button";
import { EnrollStudentDialog } from "./enroll-student-dialog";
import { AssignStudentSubjectsDialog } from "./assign-subjects-dialog";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function StudentsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
  });

  const allSubjects = await db.query.subjects.findMany({
    where: eq(subjects.schoolId, schoolId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    orderBy: (s, { asc }) => [asc(s.name)],
    with: {
      enrollments: {
        where: eq(studentEnrollments.isActive, true),
        with: { class: true, session: true },
      },
    },
  });

  // Try to fetch subject assignments, but handle if table doesn't exist yet
  let studentSubjectAssignmentsMap: Record<string, any[]> = {};
  try {
    if (activeSession) {
      const assignments = await db.query.studentSubjectAssignments.findMany({
        where: and(
          eq(studentSubjectAssignments.sessionId, activeSession.id),
          eq(studentSubjectAssignments.isActive, true)
        ),
        with: { subject: true },
      });
      assignments.forEach((assignment) => {
        if (!studentSubjectAssignmentsMap[assignment.studentId]) {
          studentSubjectAssignmentsMap[assignment.studentId] = [];
        }
        studentSubjectAssignmentsMap[assignment.studentId].push(assignment);
      });
    }
  } catch {
    // Table might not exist yet or query failed - silently continue
  }

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  return (
    <div>
      <Topbar title="Students" subtitle={`${allStudents.length} registered students`} />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">All Students</CardTitle>
            <div className="flex items-center gap-3">
              <TableSearch targetId="students-table" placeholder="Search students..." />
              <StudentDialog schoolId={schoolId} />
            </div>
          </CardHeader>
          <CardContent>
            <Table id="students-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Current Class</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No students registered yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                  <TableRow data-search-empty style={{ display: "none" }}>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No matching students found.
                    </TableCell>
                  </TableRow>
                  {allStudents.map((student) => {
                    const activeEnrollment = student.enrollments[0];
                    return (
                      <TableRow
                        key={student.id}
                        data-search={`${student.name} ${student.admissionNumber} ${student.email}`.toLowerCase()}
                      >
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {student.admissionNumber}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.email}
                        </TableCell>
                        <TableCell className="capitalize">{student.gender || "—"}</TableCell>
                        <TableCell>
                          {activeEnrollment ? (
                            <Badge variant="info">{activeEnrollment.class.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Not enrolled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {studentSubjectAssignmentsMap[student.id]?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {studentSubjectAssignmentsMap[student.id].map((assignment) => (
                                <Badge key={assignment.id} variant="secondary">
                                  {assignment.subject.code}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">No subjects</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === "active" ? "success" : "warning"}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(student.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <StudentDialog schoolId={schoolId} student={student} mode="edit" />
                            {activeSession && activeEnrollment ? (
                              <AssignStudentSubjectsDialog
                                studentId={student.id}
                                classId={activeEnrollment.class.id}
                                sessionId={activeSession.id}
                                schoolId={schoolId}
                                subjects={allSubjects}
                                initialSubjectIds={studentSubjectAssignmentsMap[student.id]?.map((assignment) => assignment.subjectId) || []}
                              />
                            ) : (
                              <Button variant="outline" size="sm" disabled>
                                Assign Subjects
                              </Button>
                            )}
                            {activeSession && (
                              <EnrollStudentDialog
                                studentId={student.id}
                                sessionId={activeSession.id}
                                schoolId={schoolId}
                                classes={allClasses}
                                currentClassId={activeEnrollment?.class.id}
                              />
                            )}
                            <Link href={`/${schoolSlug}/admin/students/${student.id}/admission-letter`}>
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                Admission Letter
                              </Button>
                            </Link>
                            <DeleteStudentButton studentId={student.id} studentName={student.name} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
