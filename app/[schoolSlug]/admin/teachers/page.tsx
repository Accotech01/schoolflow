import { auth } from "@/auth";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSearch } from "@/components/ui/table-search";
import { formatDate } from "@/lib/utils";
import { TeacherDialog } from "./teacher-dialog";
import { DeleteTeacherButton } from "./delete-teacher-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function TeachersPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allTeachers = await db.query.teachers.findMany({
    where: eq(teachers.schoolId, schoolId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return (
    <div>
      <Topbar title="Teachers" subtitle={`${allTeachers.length} registered teachers`} />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">All Teachers</CardTitle>
            <div className="flex items-center gap-3">
              <TableSearch targetId="teachers-table" placeholder="Search teachers..." />
              <TeacherDialog schoolId={schoolId} />
            </div>
          </CardHeader>
          <CardContent>
            <Table id="teachers-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No teachers registered yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                  <TableRow data-search-empty style={{ display: "none" }}>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No matching teachers found.
                    </TableCell>
                  </TableRow>
                  {allTeachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      data-search={`${teacher.name} ${teacher.email} ${teacher.employeeId || ""}`.toLowerCase()}
                    >
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {teacher.employeeId || "—"}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm">{teacher.email}</TableCell>
                      <TableCell>{teacher.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{teacher.qualification || "—"}</TableCell>
                      <TableCell className="capitalize">{teacher.gender || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.status === "active" ? "success" : "warning"}>
                          {teacher.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(teacher.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TeacherDialog schoolId={schoolId} teacher={teacher} mode="edit" />
                          <DeleteTeacherButton teacherId={teacher.id} teacherName={teacher.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
