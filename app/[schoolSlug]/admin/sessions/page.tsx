import { auth } from "@/auth";
import { db } from "@/lib/db";
import { academicSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CreateSessionDialog } from "./create-session-dialog";
import { SetActiveTermButton } from "./set-active-term-button";
import { TermDurationDialog } from "./term-duration-dialog";
import { EndSessionButton } from "./end-session-button";

const termBadgeVariant = {
  active: "success",
  completed: "secondary",
  upcoming: "info",
} as const;

const termCardStyle = {
  active: "border-green-300 bg-green-50",
  completed: "border-gray-200 bg-gray-50",
  upcoming: "border-blue-200 bg-blue-50/40",
} as const;

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function SessionsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allSessions = await db.query.academicSessions.findMany({
    where: eq(academicSessions.schoolId, schoolId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    with: {
      terms: {
        orderBy: (t, { asc }) => [asc(t.name)],
      },
    },
  });

  const activeSession = allSessions.find((s) => s.status === "active");

  return (
    <div>
      <Topbar title="Sessions & Terms" subtitle="Manage academic calendar" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <CreateSessionDialog schoolId={schoolId} activeSessionName={activeSession?.name} />
        </div>

        {allSessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No academic sessions yet. Create your first session above.
            </CardContent>
          </Card>
        ) : (
          allSessions.map((academicSession) => (
            <Card key={academicSession.id} className={academicSession.status === "active" ? "border-blue-300 shadow-blue-100" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {academicSession.name} Academic Session
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={academicSession.status === "active" ? "success" : "secondary"}>
                      {academicSession.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(academicSession.createdAt)}</span>
                    {academicSession.status === "active" && (
                      <EndSessionButton schoolId={schoolId} sessionName={academicSession.name} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {academicSession.terms.map((term) => (
                    <div
                      key={term.id}
                      className={`p-4 rounded-lg border ${termCardStyle[term.status]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{term.name} Term</h4>
                        <Badge variant={termBadgeVariant[term.status]} className="text-xs">
                          {term.status}
                        </Badge>
                      </div>
                      {term.startDate && (
                        <p className="text-xs text-muted-foreground">Start: {formatDate(term.startDate)}</p>
                      )}
                      {term.endDate && (
                        <p className="text-xs text-muted-foreground">End: {formatDate(term.endDate)}</p>
                      )}
                      <TermDurationDialog
                        termId={term.id}
                        schoolId={schoolId}
                        termName={term.name}
                        startDate={term.startDate}
                        endDate={term.endDate}
                      />
                      {academicSession.status === "active" && (
                        <SetActiveTermButton
                          termId={term.id}
                          schoolId={schoolId}
                          isActive={term.status === "active"}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
