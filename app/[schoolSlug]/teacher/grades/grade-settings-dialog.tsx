"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveGradeSettings } from "@/actions/grades";

interface Props {
  teacherId: string;
  classId: string;
  subjectId: string;
  termId: string;
  schoolId: string;
  currentSettings?: {
    maxTest1: string;
    maxTest2: string;
    maxAssignment: string;
    maxAttendance: string;
    maxExam: string;
  } | null;
}

export function GradeSettingsDialog({
  teacherId, classId, subjectId, termId, schoolId, currentSettings,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    maxTest1: currentSettings?.maxTest1 || "20",
    maxTest2: currentSettings?.maxTest2 || "20",
    maxAssignment: currentSettings?.maxAssignment || "10",
    maxAttendance: currentSettings?.maxAttendance || "10",
    maxExam: currentSettings?.maxExam || "60",
  });

  const total = Object.values(form).reduce((sum, v) => sum + parseFloat(v || "0"), 0);

  const handleSave = async () => {
    if (total !== 100) {
      toast.error(`Total max scores must equal 100 (currently ${total})`);
      return;
    }
    setLoading(true);
    try {
      await saveGradeSettings({
        teacherId, classId, subjectId, termId, schoolId,
        maxTest1: parseFloat(form.maxTest1),
        maxTest2: parseFloat(form.maxTest2),
        maxAssignment: parseFloat(form.maxAssignment),
        maxAttendance: parseFloat(form.maxAttendance),
        maxExam: parseFloat(form.maxExam),
      });
      toast.success("Grade settings saved!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" /> Configure Max Scores
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Grading Weights</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set the maximum score for each assessment component. Total must equal 100.
          </p>
          {[
            { key: "maxTest1", label: "Test 1 Maximum" },
            { key: "maxTest2", label: "Test 2 Maximum" },
            { key: "maxAssignment", label: "Assignment Maximum" },
            { key: "maxAttendance", label: "Attendance Maximum" },
            { key: "maxExam", label: "Examination Maximum" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label className="flex-1">{label}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-24 text-center"
              />
            </div>
          ))}
          <div className={`flex items-center justify-between font-semibold py-2 border-t ${total === 100 ? "text-green-600" : "text-red-600"}`}>
            <span>Total</span>
            <span>{total}/100 {total === 100 ? "✓" : "⚠ Must equal 100"}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || total !== 100} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
