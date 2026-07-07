"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getClassAttendanceSummary, finalizeTermAttendance } from "@/actions/attendance";

interface Props {
  classId: string;
  termId: string;
  termName: string;
  currentMaxScore: number;
}

export function FinalizeAttendanceDialog({ classId, termId, termName, currentMaxScore }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxScore, setMaxScore] = useState(currentMaxScore);
  const [preview, setPreview] = useState<{ name: string; percentage: number; totalMarked: number }[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getClassAttendanceSummary(classId, termId)
      .then((rows) => setPreview(rows.map((r) => ({ name: r.name, percentage: r.percentage, totalMarked: r.totalMarked }))))
      .finally(() => setLoading(false));
  }, [open, classId, termId]);

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const result = await finalizeTermAttendance(classId, termId, maxScore);
      if (result.success) {
        toast.success(
          `Attendance finalized for ${result.studentsUpdated} student(s) — updated ${result.gradesUpdated} subject grade(s).`
        );
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to finalize attendance");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <CheckCheck className="h-4 w-4" />
          Finalize Attendance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalize {termName} Term Attendance</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This calculates each student&apos;s attendance score out of the max below, based on daily
          records marked so far, and writes it into the Attendance field of every subject already
          graded this term — overwriting any existing value and recalculating that subject&apos;s
          total and grade. Safe to re-run any time (e.g. after more subjects are graded).
        </p>
        <div className="space-y-2">
          <Label>Maximum Attendance Score *</Label>
          <Input
            type="number"
            min={1}
            max={100}
            step={0.5}
            value={maxScore}
            onChange={(e) => setMaxScore(parseFloat(e.target.value) || 0)}
          />
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading preview...</p>
        ) : preview.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No students enrolled in this class.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
            {preview.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span>{p.name}</span>
                <span className="font-medium">
                  {p.totalMarked > 0
                    ? `${Math.round((p.percentage / 100) * maxScore * 100) / 100} / ${maxScore}`
                    : "No records"}
                </span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleFinalize} disabled={saving || loading} className="bg-purple-600 hover:bg-purple-700">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Finalizing...</> : "Finalize Attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
