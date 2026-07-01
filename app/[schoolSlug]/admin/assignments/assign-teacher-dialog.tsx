"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignTeacher } from "@/actions/admin";

interface Props {
  schoolId: string;
  sessionId: string;
  teachers: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  subjects: { id: string; name: string; code: string }[];
}

export function AssignTeacherDialog({ schoolId, sessionId, teachers, classes, subjects }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ teacherId: "", classId: "", subjectId: "" });

  const handleSubmit = async () => {
    if (!form.teacherId || !form.classId || !form.subjectId) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const result = await assignTeacher(form.teacherId, form.classId, form.subjectId, sessionId, schoolId);
      if (result.success) {
        toast.success("Assignment created!");
        setOpen(false);
        setForm({ teacherId: "", classId: "", subjectId: "" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Assign Teacher</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Teacher to Class & Subject</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher *</Label>
            <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
              <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class *</Label>
            <Select value={form.classId} onValueChange={(v) => setForm({ ...form, classId: v })}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s.id} value={s.id}>[{s.code}] {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assigning...</> : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
