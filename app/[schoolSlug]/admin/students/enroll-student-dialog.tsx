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
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { enrollStudent } from "@/actions/admin";

interface Props {
  studentId: string;
  sessionId: string;
  schoolId: string;
  classes: { id: string; name: string; level: number }[];
  currentClassId?: string;
}

export function EnrollStudentDialog({ studentId, sessionId, schoolId, classes, currentClassId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classId, setClassId] = useState(currentClassId || "");

  const handleEnroll = async () => {
    if (!classId) { toast.error("Please select a class"); return; }
    setLoading(true);
    try {
      const result = await enrollStudent(studentId, classId, sessionId, schoolId);
      if (result.success) {
        toast.success("Student enrolled successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to enroll student");
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
        <Button variant="ghost" size="sm" title="Assign to class">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign to Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleEnroll} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enrolling...</> : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
