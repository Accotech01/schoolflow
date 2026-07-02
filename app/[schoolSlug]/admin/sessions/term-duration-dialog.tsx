"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { CalendarRange, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateTermDuration } from "@/actions/admin";

interface Props {
  termId: string;
  schoolId: string;
  termName: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
}

function toDateInputValue(value: Date | string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function TermDurationDialog({ termId, schoolId, termName, startDate, endDate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setForm({ startDate: toDateInputValue(startDate), endDate: toDateInputValue(endDate) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error("End date must be after start date");
      return;
    }
    setLoading(true);
    try {
      const result = await updateTermDuration(
        termId,
        schoolId,
        form.startDate || null,
        form.endDate || null
      );
      if (result.success) {
        toast.success(`${termName} term duration updated`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update term duration");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="mt-2 w-full text-xs gap-1">
          <CalendarRange className="h-3 w-3" />
          Set Duration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{termName} Term Duration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Duration"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
