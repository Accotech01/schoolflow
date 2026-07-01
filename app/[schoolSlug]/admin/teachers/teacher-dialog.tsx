"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTeacher, updateTeacher } from "@/actions/admin";

interface Props {
  schoolId: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    qualification?: string | null;
    employeeId?: string | null;
    gender?: "male" | "female" | "other" | null;
  };
  mode?: "create" | "edit";
}

export function TeacherDialog({ schoolId, teacher, mode = "create" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: teacher?.name || "",
    email: teacher?.email || "",
    password: "",
    phone: teacher?.phone || "",
    qualification: teacher?.qualification || "",
    employeeId: teacher?.employeeId || "",
    gender: teacher?.gender || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        if (!form.password) { toast.error("Password required"); return; }
        const result = await createTeacher({
          schoolId,
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          qualification: form.qualification || undefined,
          employeeId: form.employeeId || undefined,
          gender: (form.gender as "male" | "female" | "other") || undefined,
        });
        if (result.success) {
          toast.success("Teacher created!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || "Failed");
        }
      } else if (teacher) {
        await updateTeacher(teacher.id, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          phone: form.phone || undefined,
          qualification: form.qualification || undefined,
          employeeId: form.employeeId || undefined,
          gender: (form.gender as "male" | "female" | "other") || undefined,
        });
        toast.success("Teacher updated!");
        setOpen(false);
        router.refresh();
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
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Add Teacher</Button>
        ) : (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Teacher" : "Edit Teacher"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{mode === "create" ? "Password *" : "New Password"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={mode === "create"} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. B.Sc. Education" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
