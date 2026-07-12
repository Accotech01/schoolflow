"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Clock, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getClassRosterForDate, markAttendance } from "@/actions/attendance";

type Status = "present" | "absent" | "late";

interface Student {
  id: string;
  name: string;
  admissionNumber: string;
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

const statusOptions: { value: Status; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "present", label: "Present", icon: CheckCircle2 },
  { value: "late", label: "Late", icon: Clock },
  { value: "absent", label: "Absent", icon: XCircle },
];

const statusStyles: Record<Status, string> = {
  present: "bg-green-600 text-white border-green-600",
  late: "bg-amber-500 text-white border-amber-500",
  absent: "bg-red-600 text-white border-red-600",
};

interface Props {
  classId: string;
  termId: string;
  sessionId: string;
  minDate?: string;
  maxDate?: string;
}

export function AttendanceEntryTable({ classId, termId, sessionId, minDate, maxDate }: Props) {
  const [date, setDate] = useState(todayIso());
  const [roster, setRoster] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [holiday, setHoliday] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getClassRosterForDate(classId, termId, sessionId, date)
      .then(({ roster, statuses, holiday }) => {
        if (cancelled) return;
        setRoster(roster);
        setHoliday(holiday);
        const next: Record<string, Status> = {};
        roster.forEach((s) => {
          next[s.id] = (statuses[s.id] as Status) || "present";
        });
        setStatuses(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [classId, termId, sessionId, date]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await markAttendance({
        classId,
        termId,
        date,
        records: roster.map((s) => ({ studentId: s.id, status: statuses[s.id] || "present" })),
      });
      if (result.success) {
        toast.success("Attendance saved");
      } else {
        toast.error(result.error || "Failed to save attendance");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status: Status) => {
    const next: Record<string, Status> = {};
    roster.forEach((s) => (next[s.id] = status));
    setStatuses(next);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-base">Mark Attendance</CardTitle>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading roster...</p>
        ) : holiday ? (
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
            <CalendarOff className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              <strong>{holiday.name}</strong> — this date is set as a holiday/break, so attendance
              can&apos;t be marked and no student will be counted absent for it.
            </p>
          </div>
        ) : roster.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No students enrolled in this class yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => markAll("present")}>
                Mark All Present
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => markAll("absent")}>
                Mark All Absent
              </Button>
            </div>
            <div className="divide-y">
              {roster.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.admissionNumber}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const active = statuses[s.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: opt.value }))}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors",
                            active ? statusStyles[opt.value] : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
