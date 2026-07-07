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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClass, updateClass } from "@/actions/admin";

const UNASSIGNED = "unassigned";

interface Props {
  schoolId: string;
  cls?: { id: string; name: string; level: number; description?: string | null; classTeacherId?: string | null };
  mode?: "create" | "edit";
  teachers: { id: string; name: string }[];
}

export function ClassDialog({ schoolId, cls, mode = "create", teachers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: cls?.name || "",
    level: cls?.level || 1,
    description: cls?.description || "",
    classTeacherId: cls?.classTeacherId || UNASSIGNED,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        classTeacherId: form.classTeacherId === UNASSIGNED ? null : form.classTeacherId,
      };
      if (mode === "create") {
        const result = await createClass({ schoolId, ...payload });
        if (result.success) {
          toast.success("Class created!");
          setOpen(false);
          setForm({ name: "", level: 1, description: "", classTeacherId: UNASSIGNED });
          router.refresh();
        } else {
          toast.error(result.error || "Failed");
        }
      } else if (cls) {
        const result = await updateClass(cls.id, payload);
        if (result.success) {
          toast.success("Class updated!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || "Failed");
        }
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
        {mode === "create" ? (
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Class</Button>
        ) : (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Class" : "Edit Class"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Class Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. JSS 1, SS 2A" required />
          </div>
          <div className="space-y-2">
            <Label>Level * (1=Primary 1, 7=JSS 1, 10=SS 1)</Label>
            <Input type="number" min={1} max={12} value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })} required />
          </div>
          <div className="space-y-2">
            <Label>Class Teacher</Label>
            <Select
              value={form.classTeacherId}
              onValueChange={(v) => setForm({ ...form, classTeacherId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>— Not assigned —</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The class teacher marks daily attendance and sets the attendance rating scale for this class.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
