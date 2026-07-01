import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  studentEnrollments,
  academicSessions,
  lessonNotes,
  learningResources,
  teacherAssignments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { BookOpen, Link2, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ subjectId?: string; tab?: string }>;
}

export default async function StudentResourcesPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { subjectId, tab } = await searchParams;
  const session = await auth();
  const studentId = session!.user.id;
  const schoolId = session!.user.schoolId!;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });

  const activeTerm = activeSession?.terms.find((t) => t.status === "active");

  // Get student's current class enrollment
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

  // Get subjects taught in the student's class
  const classSubjects = enrollment && activeSession
    ? await db.query.teacherAssignments.findMany({
        where: and(
          eq(teacherAssignments.classId, enrollment.classId),
          eq(teacherAssignments.sessionId, activeSession.id)
        ),
        with: { subject: true, teacher: true },
      })
    : [];

  // Deduplicate by subjectId
  const uniqueSubjects = classSubjects.filter(
    (a, idx, self) => idx === self.findIndex((b) => b.subjectId === a.subjectId)
  );

  const selectedSubject = subjectId
    ? uniqueSubjects.find((a) => a.subjectId === subjectId)
    : null;

  const notes =
    selectedSubject && activeTerm && enrollment
      ? await db.query.lessonNotes.findMany({
          where: and(
            eq(lessonNotes.classId, enrollment.classId),
            eq(lessonNotes.subjectId, selectedSubject.subjectId),
            eq(lessonNotes.termId, activeTerm.id)
          ),
          orderBy: (n, { asc }) => [asc(n.week)],
        })
      : [];

  const resources =
    selectedSubject && activeTerm && enrollment
      ? await db.query.learningResources.findMany({
          where: and(
            eq(learningResources.classId, enrollment.classId),
            eq(learningResources.subjectId, selectedSubject.subjectId),
            eq(learningResources.termId, activeTerm.id)
          ),
          orderBy: (r, { desc }) => [desc(r.createdAt)],
        })
      : [];

  const defaultTab = tab === "links" ? "resources" : "notes";

  return (
    <div>
      <Topbar
        title="Lesson Notes & Resources"
        subtitle={enrollment ? `${enrollment.class.name} — ${activeTerm?.name || ""} Term` : "No active enrollment"}
      />
      <div className="p-6 space-y-6">
        {!enrollment ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">
                You are not enrolled in any class for the current session.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Subject Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {uniqueSubjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects available for your class.</p>
                  ) : (
                    uniqueSubjects.map((a) => (
                      <a
                        key={a.subjectId}
                        href={`?subjectId=${a.subjectId}&tab=${tab || "notes"}`}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                          subjectId === a.subjectId
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white hover:bg-gray-50 border-gray-200"
                        }`}
                      >
                        {a.subject.name}
                      </a>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedSubject ? (
              <Tabs defaultValue={defaultTab}>
                <TabsList>
                  <TabsTrigger value="notes" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    Lesson Notes ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Resources ({resources.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {selectedSubject.subject.name} — Lesson Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {notes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          No lesson notes uploaded for this subject yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((note) => (
                            <div key={note.id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">{note.title}</h4>
                                  {note.week && (
                                    <Badge variant="info" className="text-xs mt-1">Week {note.week}</Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                                {note.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {selectedSubject.subject.name} — Learning Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resources.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          No resources added for this subject yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm group-hover:text-blue-700">
                                  {resource.title}
                                </h4>
                                <Badge variant="secondary" className="text-xs ml-2 capitalize flex-shrink-0">
                                  {resource.resourceType}
                                </Badge>
                              </div>
                              {resource.description && (
                                <p className="text-xs text-gray-600 mb-2">{resource.description}</p>
                              )}
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <ExternalLink className="h-3 w-3" />
                                <span className="truncate">{resource.url}</span>
                              </div>
                            </a>
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
                  Select a subject above to view lesson notes and resources
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
