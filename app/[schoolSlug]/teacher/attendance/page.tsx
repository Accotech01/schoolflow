import { getMyClassTeacherInfo, getClassAttendanceSummary } from "@/actions/attendance";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassSelector } from "./class-selector";
import { AttendanceEntryTable } from "./attendance-entry-table";
import { FinalizeAttendanceDialog } from "./finalize-attendance-dialog";

interface Props {
  params: Promise<{ schoolSlug: string }>;
  searchParams: Promise<{ class?: string }>;
}

function toDateInputValue(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export default async function TeacherAttendancePage({ params, searchParams }: Props) {
  const { schoolSlug } = await params;
  const { class: classParam } = await searchParams;

  const { classes, activeSession, activeTerm } = await getMyClassTeacherInfo();

  if (classes.length === 0) {
    return (
      <div>
        <Topbar title="Attendance" subtitle="Mark daily attendance for your class" />
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              You are not currently assigned as a class teacher. Your school administrator assigns
              class teachers from the Classes page.
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const selectedClass = classes.find((c) => c.id === classParam) || classes[0];
  const summary = activeTerm ? await getClassAttendanceSummary(selectedClass.id, activeTerm.id) : [];

  return (
    <div>
      <Topbar title="Attendance" subtitle={`Class teacher for ${selectedClass.name}`} />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {classes.length > 1 ? (
            <ClassSelector schoolSlug={schoolSlug} classes={classes} selectedId={selectedClass.id} />
          ) : (
            <h2 className="text-lg font-semibold">{selectedClass.name}</h2>
          )}
        </div>

        {!activeSession || !activeTerm ? (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6 text-yellow-800">
              No active term found. Attendance can only be marked during an active term.
            </CardContent>
          </Card>
        ) : (
          <>
            <AttendanceEntryTable
              classId={selectedClass.id}
              termId={activeTerm.id}
              sessionId={activeSession.id}
              minDate={toDateInputValue(activeTerm.startDate)}
              maxDate={toDateInputValue(activeTerm.endDate)}
            />

            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base">Attendance Summary — {activeTerm.name} Term</CardTitle>
                <FinalizeAttendanceDialog
                  classId={selectedClass.id}
                  termId={activeTerm.id}
                  termName={activeTerm.name}
                  currentMaxScore={parseFloat(selectedClass.attendanceMaxScore)}
                />
              </CardHeader>
              <CardContent>
                {summary.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No students enrolled in this class yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">Student</th>
                          <th className="py-2 pr-4 font-medium text-center">Present</th>
                          <th className="py-2 pr-4 font-medium text-center">Late</th>
                          <th className="py-2 pr-4 font-medium text-center">Absent</th>
                          <th className="py-2 pr-4 font-medium text-center">Total Marked</th>
                          <th className="py-2 pr-4 font-medium text-center">Rate</th>
                          <th className="py-2 font-medium text-center">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.map((s) => (
                          <tr key={s.studentId} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">{s.name}</td>
                            <td className="py-2 pr-4 text-center">{s.present}</td>
                            <td className="py-2 pr-4 text-center">{s.late}</td>
                            <td className="py-2 pr-4 text-center">{s.absent}</td>
                            <td className="py-2 pr-4 text-center">{s.totalMarked}</td>
                            <td className="py-2 pr-4 text-center font-semibold">
                              {s.totalMarked > 0 ? `${s.percentage}%` : "—"}
                            </td>
                            <td className="py-2 text-center font-semibold">
                              {s.score !== null ? `${s.score} / ${s.maxScore}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
