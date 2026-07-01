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
import { Button } from "@/components/ui/button";
import { GeneratePromotionsButton } from "./generate-promotions-button";
import { ProcessPromotionDialog } from "./process-promotion-dialog";
import { getGradeColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ schoolSlug: string }>;
}

export default async function PromotionsPage({ params }: Props) {
  const { schoolSlug } = await params;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
  });

  const allPromotions = activeSession
    ? await db.query.promotions.findMany({
        where: and(eq(promotions.schoolId, schoolId), eq(promotions.sessionId, activeSession.id)),
        with: { student: true, fromClass: true, toClass: true },
        orderBy: (p, { asc }) => [asc(p.averageGrade)],
      })
    : [];

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

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
        {!activeSession ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-yellow-800">No active academic session found.</p>
            </CardContent>
          </Card>
        ) : (
          <>
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
            <div className="flex gap-3">
              <GeneratePromotionsButton sessionId={activeSession.id} schoolId={schoolId} />
              <p className="text-sm text-muted-foreground self-center">
                Session: <strong>{activeSession.name}</strong>
              </p>
            </div>

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
