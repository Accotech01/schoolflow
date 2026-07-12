import { auth } from "@/auth";
import { db } from "@/lib/db";
import { classes, academicSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getClassMasterSheet, getClassPerformanceRanking } from "@/actions/reports";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGradeColor, ordinal, cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { MasterSheetFilters } from "./master-sheet-filters";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ class?: string; term?: string }>;
}

export default async function MasterSheetPage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { class: classParam, term: termParam } = await searchParams;
  const session = await auth();
  const schoolId = session!.user.schoolId!;

  const allClasses = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId),
    orderBy: (c, { asc }) => [asc(c.level)],
  });

  const activeSession = await db.query.academicSessions.findFirst({
    where: and(eq(academicSessions.schoolId, schoolId), eq(academicSessions.status, "active")),
    with: { terms: true },
  });
  const sessionTerms = activeSession
    ? [...activeSession.terms].sort((a, b) => ["First", "Second", "Third"].indexOf(a.name) - ["First", "Second", "Third"].indexOf(b.name))
    : [];

  if (allClasses.length === 0 || sessionTerms.length === 0) {
    return (
      <div>
        <Topbar title="Master Sheet" subtitle="Class summary of scores, averages, and positions" />
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {allClasses.length === 0
                ? "No classes created yet."
                : "No active academic session found."}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedClassId = allClasses.find((c) => c.id === classParam)?.id || allClasses[0].id;
  const activeTerm = sessionTerms.find((t) => t.status === "active");
  const selectedTermId = sessionTerms.find((t) => t.id === termParam)?.id || activeTerm?.id || sessionTerms[0].id;

  const [sheet, ranking] = await Promise.all([
    getClassMasterSheet(selectedClassId, selectedTermId),
    getClassPerformanceRanking(selectedTermId),
  ]);

  const bestClass = ranking[0];

  return (
    <div>
      <Topbar title="Master Sheet" subtitle="Class summary of scores, averages, and positions" />
      <div className="p-6 space-y-6">
        <MasterSheetFilters
          schoolSlug={schoolSlug}
          classes={allClasses}
          terms={sessionTerms}
          selectedClassId={selectedClassId}
          selectedTermId={selectedTermId}
        />

        {bestClass && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <Trophy className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <p className="text-sm">
              <strong>Best Performing Class:</strong> {bestClass.className} with a class average of{" "}
              <strong>{bestClass.average}%</strong> this term.
            </p>
          </div>
        )}

        {!sheet || sheet.rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students enrolled in this class for the selected term.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {sheet.class.name} — {sheet.term.name} Term Master Sheet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-blue-500 px-3 py-2 text-left sticky left-0 bg-blue-600">Student</th>
                      {sheet.subjects.map((s) => (
                        <th key={s.id} className="border border-blue-500 px-2 py-2 text-center whitespace-nowrap">
                          {s.code}
                        </th>
                      ))}
                      <th className="border border-blue-500 px-2 py-2 text-center">Grand Total</th>
                      <th className="border border-blue-500 px-2 py-2 text-center">Average</th>
                      <th className="border border-blue-500 px-2 py-2 text-center">Grade</th>
                      <th className="border border-blue-500 px-2 py-2 text-center">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((r, i) => (
                      <tr key={r.studentId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border px-3 py-1.5 font-medium sticky left-0 bg-inherit">
                          {r.name}
                          <span className="block text-xs text-muted-foreground font-normal">{r.admissionNumber}</span>
                        </td>
                        {sheet.subjects.map((s) => (
                          <td key={s.id} className="border px-2 py-1.5 text-center">
                            {r.scores[s.id] !== null ? r.scores[s.id] : "—"}
                          </td>
                        ))}
                        <td className="border px-2 py-1.5 text-center font-bold">{r.grandTotal}</td>
                        <td className="border px-2 py-1.5 text-center font-bold">{r.average}%</td>
                        <td className="border px-2 py-1.5 text-center">
                          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", getGradeColor(r.grade))}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="border px-2 py-1.5 text-center font-semibold">
                          {r.position !== null ? ordinal(r.position) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold border-t-2">
                      <td className="border px-3 py-2 sticky left-0 bg-gray-100" colSpan={sheet.subjects.length + 1}>
                        Class Average ({sheet.totalRanked} of {sheet.rows.length} student{sheet.rows.length === 1 ? "" : "s"} graded)
                      </td>
                      <td className="border px-2 py-2 text-center" colSpan={3}>{sheet.classAverage}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {ranking.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class Performance Ranking — {sheet?.term.name || ""} Term</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div
                    key={r.classId}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg",
                      i === 0 ? "bg-amber-50 border border-amber-200" : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {i === 0 && <Trophy className="h-4 w-4 text-amber-600" />}
                      <span className="font-medium text-sm">{ordinal(i + 1)} — {r.className}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.totalRanked} ranked</span>
                      <Badge variant={i === 0 ? "warning" : "secondary"}>{r.average}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
