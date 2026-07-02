import { auth } from "@/auth";
import { db } from "@/lib/db";
import { promotions, academicSessions, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GeneratePromotionsButton } from "./generate-promotions-button";
import { ExecutePromotionsButton } from "./execute-promotions-button";
import { ProcessPromotionDialog } from "./process-promotion-dialog";
import { SessionSelector } from "./session-selector";
import { getGradeColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ session?: string }>;
}

export default async function PromotionsPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { session: sessionParam } = await searchParams;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allSessions = await db.query.academicSessions.findMany({
    where: eq(academicSessions.schoolId, schoolId),
    orderBy: (s, { desc }) => [desc(s.createdAt)],
  });

  const activeSession = allSessions.find((s) => s.status === "active");
  const lastCompletedSession = allSessions.find((s) => s.status === "completed");

  const selectedSession =
    (sessionParam && allSessions.find((s) => s.id === sessionParam)) ||
    lastCompletedSession ||
    activeSession;

  const allPromotions = selectedSession
    ? await db.query.promotions.findMany({
        where: and(eq(promotions.schoolId, schoolId), eq(promotions.sessionId, selectedSession.id)),
        with: { student: true, fromClass: true, toClass: true },
        orderBy: (p, { asc }) => [asc(p.averageGrade)],
      })
    : [];

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  const executableCount = allPromotions.filter(
    (p) => (p.status === "auto_promoted" || p.status === "manual_promoted") && p.toClassId
  ).length;
  const canExecute =
    !!selectedSession &&
    selectedSession.status === "completed" &&
    !!activeSession &&
    activeSession.id !== selectedSession.id &&
    executableCount > 0;

  const stats = {
    total: allPromotions.length,
    autoPromoted: allPromotions.filter((p) => p.status === "auto_promoted").length,
    pending: allPromotions.filter((p) => p.status === "pending").length,
    repeated: allPromotions.filter((p) => p.status === "repeated").length,
    manualPromoted: allPromotions.filter((p) => p.status === "manual_promoted").length,
  };

  return (
    <div>
      <Topbar title="Promotions" subtitle="End of session student promotion management" />
      <div className="p-6 space-y-6">
        {allSessions.length > 0 && selectedSession && (
          <div className="flex items-center gap-3">
            <SessionSelector schoolSlug={schoolSlug} sessions={allSessions} selectedId={selectedSession.id} />
            <Badge variant={selectedSession.status === "active" ? "success" : "secondary"} className="capitalize">
              {selectedSession.status}
            </Badge>
          </div>
        )}

        {!selectedSession ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">No academic sessions found yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {selectedSession.status === "active" && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedSession.name}</strong> is still in progress. Promotions are
                    calculated automatically once you end this session or start a new one from
                    Sessions &amp; Terms.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total", value: stats.total, color: "bg-gray-100 text-gray-700" },
                { label: "Auto Promoted", value: stats.autoPromoted, color: "bg-green-100 text-green-700" },
                { label: "Pending Review", value: stats.pending, color: "bg-yellow-100 text-yellow-700" },
                { label: "Manual Promoted", value: stats.manualPromoted, color: "bg-blue-100 text-blue-700" },
                { label: "To Repeat", value: stats.repeated, color: "bg-red-100 text-red-700" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-lg p-4 ${stat.color}`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            {selectedSession.status === "completed" && (
              <div className="flex flex-wrap items-center gap-3">
                <GeneratePromotionsButton sessionId={selectedSession.id} schoolId={schoolId} />
                {canExecute && (
                  <ExecutePromotionsButton sessionId={selectedSession.id} schoolId={schoolId} />
                )}
                {!activeSession && (
                  <p className="text-sm text-muted-foreground">
                    Create a new academic session before executing promotions, so promoted
                    students have a class to move into.
                  </p>
                )}
                {stats.pending > 0 && (
                  <p className="text-sm text-yellow-700">
                    {stats.pending} student(s) still awaiting a manual decision.
                  </p>
                )}
              </div>
            )}

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Promotion Records</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Current Class</TableHead>
                      <TableHead>Average Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Promotion To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPromotions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No promotion records yet. Click &ldquo;Generate Promotions&rdquo; to process end-of-session results.
                        </TableCell>
                      </TableRow>
                    ) : (
                      allPromotions.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.student.name}</TableCell>
                          <TableCell>{p.fromClass.name}</TableCell>
                          <TableCell>{p.averageScore ? `${parseFloat(p.averageScore).toFixed(1)}%` : "—"}</TableCell>
                          <TableCell>
                            {p.averageGrade && (
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded", getGradeColor(p.averageGrade))}>
                                {p.averageGrade}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{p.toClass?.name || "Not set"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.status === "auto_promoted" ? "success"
                                  : p.status === "manual_promoted" ? "info"
                                  : p.status === "repeated" ? "destructive"
                                  : "warning"
                              }
                            >
                              {p.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {p.status === "pending" && (
                              <ProcessPromotionDialog
                                promotionId={p.id}
                                studentName={p.student.name}
                                classes={allClasses}
                                adminId={session!.user.id}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
