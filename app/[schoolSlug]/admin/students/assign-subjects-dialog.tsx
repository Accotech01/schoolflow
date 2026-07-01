"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { assignStudentSubjects } from "@/actions/admin";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Props {
  studentId: string;
  classId: string;
  sessionId: string;
  schoolId: string;
  subjects: Subject[];
  initialSubjectIds: string[];
}

export function AssignStudentSubjectsDialog({
  studentId,
  classId,
  sessionId,
  schoolId,
  subjects,
  initialSubjectIds,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initialSubjectIds);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await assignStudentSubjects(
        studentId,
        classId,
        selectedSubjectIds,
        sessionId,
        schoolId
      );
      if (result.success) {
        toast.success("Student subjects updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save subjects");
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
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Assign Subjects
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Subjects to Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Subjects</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-muted px-3 py-2 text-sm transition hover:bg-muted/10"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>[{subject.code}]</strong> {subject.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Subjects"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
