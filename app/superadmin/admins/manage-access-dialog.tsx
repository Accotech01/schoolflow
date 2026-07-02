"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSchoolAdminAccess } from "@/actions/superadmin";

interface Props {
  adminId: string;
  adminName: string;
  status: string;
  lastPaymentDate: Date | string | null;
  nextPaymentDueDate: Date | string | null;
}

function toDateInputValue(value: Date | string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function ManageAdminAccessDialog({
  adminId,
  adminName,
  status,
  lastPaymentDate,
  nextPaymentDueDate,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status,
    lastPaymentDate: toDateInputValue(lastPaymentDate),
    nextPaymentDueDate: toDateInputValue(nextPaymentDueDate),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setForm({
        status,
        lastPaymentDate: toDateInputValue(lastPaymentDate),
        nextPaymentDueDate: toDateInputValue(nextPaymentDueDate),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateSchoolAdminAccess(adminId, {
        status: form.status as "active" | "inactive",
        lastPaymentDate: form.lastPaymentDate || null,
        nextPaymentDueDate: form.nextPaymentDueDate || null,
      });
      if (result.success) {
        toast.success(result.message || "Admin access updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update admin access");
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
        <Button size="sm" variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Access — {adminName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Login Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm({ ...form, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active (can log in)</SelectItem>
                <SelectItem value="inactive">Inactive (login blocked)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Set to inactive to block this admin from logging in until payment is made.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Last Payment Date</Label>
            <Input
              type="date"
              value={form.lastPaymentDate}
              onChange={(e) => setForm({ ...form, lastPaymentDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Payment Due Date</Label>
            <Input
              type="date"
              value={form.nextPaymentDueDate}
              onChange={(e) => setForm({ ...form, nextPaymentDueDate: e.target.value })}
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
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
