import { auth } from "@/auth";
import { db } from "@/lib/db";
import { subjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SubjectDialog } from "./subject-dialog";
import { DeleteSubjectButton } from "./delete-subject-button";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SubjectsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allSubjects = await db.query.subjects.findMany({
    where: eq(subjects.schoolId, schoolId),
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  return (
    <div>
      <Topbar title="Subjects" subtitle="Manage school subjects" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">All Subjects ({allSubjects.length})</CardTitle>
            <SubjectDialog schoolId={schoolId} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      No subjects created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  allSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <code className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {subject.code}
                        </code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{subject.description || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SubjectDialog schoolId={schoolId} subject={subject} mode="edit" />
                          <DeleteSubjectButton subjectId={subject.id} subjectName={subject.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Default Nigerian Subjects Reference */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-green-800 mb-2">Common Nigerian School Subjects</p>
            <div className="flex flex-wrap gap-2">
              {[
                "English Language", "Mathematics", "Basic Science", "Social Studies",
                "Civic Education", "Agricultural Science", "Business Studies",
                "Computer Studies", "Home Economics", "Fine Art", "Music",
                "Physical & Health Education", "Christian Religious Studies",
                "Islamic Religious Studies", "Yoruba", "Igbo", "Hausa",
                "Physics", "Chemistry", "Biology", "Economics",
                "Government", "Literature in English", "Geography",
                "Further Mathematics", "Technical Drawing",
              ].map((s) => (
                <span key={s} className="text-xs bg-white text-green-700 border border-green-200 px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
