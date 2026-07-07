import { auth } from "@/auth";
import { db } from "@/lib/db";
import { classes, studentEnrollments, teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ClassDialog } from "./class-dialog";
import { DeleteClassButton } from "./delete-class-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function ClassesPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
    with: {
      studentEnrollments: {
        where: eq(studentEnrollments.isActive, true),
      },
      classTeacher: true,
    },
  });

  const allTeachers = await db.query.teachers.findMany({
    where: eq(teachers.schoolId, schoolId),
    orderBy: (t, { asc }) => [asc(t.name)],
  });

  return (
    <div>
      <Topbar title="Classes" subtitle="Manage school classes" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">All Classes ({allClasses.length})</CardTitle>
            <ClassDialog schoolId={schoolId} teachers={allTeachers} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Students (Active)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No classes created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  allClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.level}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cls.description || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {cls.classTeacher?.name || (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-blue-600">
                          {cls.studentEnrollments.length}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ClassDialog schoolId={schoolId} cls={cls} mode="edit" teachers={allTeachers} />
                          <DeleteClassButton classId={cls.id} className={cls.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Nigerian Class Structure Guide */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">Nigerian School Class Structure Guide</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
              {[
                { name: "Primary 1", level: 1 }, { name: "Primary 2", level: 2 }, { name: "Primary 3", level: 3 },
                { name: "Primary 4", level: 4 }, { name: "Primary 5", level: 5 }, { name: "Primary 6", level: 6 },
                { name: "JSS 1", level: 7 }, { name: "JSS 2", level: 8 }, { name: "JSS 3", level: 9 },
                { name: "SS 1", level: 10 }, { name: "SS 2", level: 11 }, { name: "SS 3", level: 12 },
              ].map((c) => (
                <div key={c.name} className="flex justify-between bg-white/60 px-2 py-1 rounded">
                  <span>{c.name}</span>
                  <span className="font-mono">Level {c.level}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
