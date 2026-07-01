"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLessonNote } from "@/actions/lessons";

interface Props {
  teacherId: string;
  classId: string;
  subjectId: string;
  termId: string;
  schoolId: string;
}

export function CreateLessonNoteDialog({ teacherId, classId, subjectId, termId, schoolId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", week: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createLessonNote({
        teacherId, classId, subjectId, termId, schoolId,
        title: form.title,
        content: form.content,
        week: form.week ? parseInt(form.week) : undefined,
      });
      if (result.success) {
        toast.success("Lesson note created!");
        setOpen(false);
        setForm({ title: "", content: "", week: "" });
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
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Note</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Lesson Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Algebra" required />
          </div>
          <div className="space-y-2">
            <Label>Week Number</Label>
            <Input type="number" min={1} max={15} value={form.week} onChange={(e) => setForm({ ...form, week: e.target.value })} placeholder="1-15" />
          </div>
          <div className="space-y-2">
            <Label>Content *</Label>
            <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Write your lesson note here..." required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
