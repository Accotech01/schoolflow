import { getSchoolHolidays } from "@/actions/holidays";
import { Topbar } from "@/components/nav/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CalendarOff } from "lucide-react";
import { CreateHolidayDialog } from "./create-holiday-dialog";
import { DeleteHolidayButton } from "./delete-holiday-button";

function holidayStatus(startDate: Date, endDate: Date) {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return { label: "Upcoming", variant: "info" as const };
  if (now > end) return { label: "Past", variant: "secondary" as const };
  return { label: "Ongoing", variant: "success" as const };
}

export default async function HolidaysPage() {
  const holidays = await getSchoolHolidays();

  return (
    <div>
      <Topbar
        title="Holidays & Breaks"
        subtitle="Dates that never count toward a student's attendance"
      />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <CreateHolidayDialog />
        </div>

        {holidays.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No holidays or breaks set yet. Add public holidays and midterm breaks here so no
              student is marked absent on those days.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {holidays.map((h) => {
              const status = holidayStatus(h.startDate, h.endDate);
              return (
                <Card key={h.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CalendarOff className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{h.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(h.startDate)}
                          {h.startDate.getTime() !== h.endDate.getTime() && ` — ${formatDate(h.endDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <DeleteHolidayButton holidayId={h.id} name={h.name} />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
