import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  teacherAssignments,
  academicSessions,
  lessonNotes,
  learningResources,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CreateLessonNoteDialog } from "./create-lesson-note-dialog";
import { CreateResourceDialog } from "./create-resource-dialog";
import { DeleteNoteButton } from "./delete-note-button";
import { DeleteResourceButton } from "./delete-resource-button";
import { BookOpen, Link2, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ classId?: string; subjectId?: string }>;
}

export default async function LessonsPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { classId, subjectId } = await searchParams;
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

  const selectedAssignment =
    classId && subjectId
      ? myAssignments.find((a) => a.classId === classId && a.subjectId === subjectId)
      : null;

  const notes =
    selectedAssignment && activeTerm
      ? await db.query.lessonNotes.findMany({
          where: and(
            eq(lessonNotes.teacherId, teacherId),
            eq(lessonNotes.classId, selectedAssignment.classId),
            eq(lessonNotes.subjectId, selectedAssignment.subjectId),
            eq(lessonNotes.termId, activeTerm.id)
          ),
          orderBy: (n, { desc }) => [desc(n.createdAt)],
        })
      : [];

  const resources =
    selectedAssignment && activeTerm
      ? await db.query.learningResources.findMany({
          where: and(
            eq(learningResources.teacherId, teacherId),
            eq(learningResources.classId, selectedAssignment.classId),
            eq(learningResources.subjectId, selectedAssignment.subjectId),
            eq(learningResources.termId, activeTerm.id)
          ),
          orderBy: (r, { desc }) => [desc(r.createdAt)],
        })
      : [];

  return (
    <div>
      <Topbar title="Lessons & Resources" subtitle="Manage lesson notes and learning materials" />
      <div className="p-6 space-y-6">
        {/* Assignment Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Class & Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teaching assignments for this session.</p>
              ) : (
                myAssignments.map((a) => (
                  <a
                    key={a.id}
                    href={`?classId=${a.classId}&subjectId=${a.subjectId}`}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      classId === a.classId && subjectId === a.subjectId
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {a.class.name} — {a.subject.name}
                  </a>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedAssignment && activeTerm ? (
          <Tabs defaultValue="notes">
            <TabsList>
              <TabsTrigger value="notes" className="gap-2">
                <BookOpen className="h-4 w-4" /> Lesson Notes ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2">
                <Link2 className="h-4 w-4" /> Resources ({resources.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    Lesson Notes — {selectedAssignment.class.name} · {selectedAssignment.subject.name}
                  </CardTitle>
                  <CreateLessonNoteDialog
                    teacherId={teacherId}
                    classId={selectedAssignment.classId}
                    subjectId={selectedAssignment.subjectId}
                    termId={activeTerm.id}
                    schoolId={schoolId}
                  />
                </CardHeader>
                <CardContent>
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No lesson notes yet. Add your first lesson note above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((note) => (
                        <div key={note.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-sm">{note.title}</h4>
                              {note.week && (
                                <Badge variant="info" className="text-xs mt-1">Week {note.week}</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                              <DeleteNoteButton noteId={note.id} noteTitle={note.title} />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Learning Resources</CardTitle>
                  <CreateResourceDialog
                    teacherId={teacherId}
                    classId={selectedAssignment.classId}
                    subjectId={selectedAssignment.subjectId}
                    termId={activeTerm.id}
                    schoolId={schoolId}
                  />
                </CardHeader>
                <CardContent>
                  {resources.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No resources added yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {resources.map((resource) => (
                        <div key={resource.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{resource.title}</h4>
                                <Badge variant="secondary" className="text-xs">{resource.resourceType}</Badge>
                              </div>
                              {resource.description && (
                                <p className="text-xs text-gray-600 mb-1">{resource.description}</p>
                              )}
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {resource.url}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span className="text-xs text-muted-foreground">{formatDate(resource.createdAt)}</span>
                              <DeleteResourceButton resourceId={resource.id} resourceTitle={resource.title} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Select a class and subject to manage lesson notes and resources
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
