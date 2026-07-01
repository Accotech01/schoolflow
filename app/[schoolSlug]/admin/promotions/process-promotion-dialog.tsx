"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { processPromotion } from "@/actions/promotions";

interface Props {
  promotionId: string;
  studentName: string;
  classes: { id: string; name: string }[];
  adminId: string;
}

export function ProcessPromotionDialog({ promotionId, studentName, classes, adminId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ status: "", toClassId: "", note: "" });

  const handleSubmit = async () => {
    if (!form.status) { toast.error("Please select an action"); return; }
    if (form.status === "manual_promoted" && !form.toClassId) { toast.error("Please select a target class"); return; }
    setLoading(true);
    try {
      await processPromotion(
        promotionId,
        form.status as "manual_promoted" | "repeated",
        form.toClassId || undefined,
        form.note || undefined,
        adminId
      );
      toast.success("Promotion decision saved!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1"><ClipboardCheck className="h-3 w-3" />Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Promotion: {studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Decision *</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue placeholder="Select decision" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_promoted">Promote to Next Class</SelectItem>
                <SelectItem value="repeated">Repeat Current Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.status === "manual_promoted" && (
            <div className="space-y-2">
              <Label>Promote to Class *</Label>
              <Select value={form.toClassId} onValueChange={(v) => setForm({ ...form, toClassId: v })}>
                <SelectTrigger><SelectValue placeholder="Select target class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Admin Note</Label>
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional notes about this decision..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
