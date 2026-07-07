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
import { nigerianStates } from "@/lib/utils";
import { createStudent, updateStudent } from "@/actions/admin";

interface Props {
  schoolId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    admissionNumber: string;
    gender: "male" | "female" | "other" | null;
    phone?: string | null;
    address?: string | null;
    guardianName?: string | null;
    guardianPhone?: string | null;
    stateOfOrigin?: string | null;
    religion?: string | null;
  };
  mode?: "create" | "edit";
}

export function StudentDialog({ schoolId, student, mode = "create" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: student?.name || "",
    email: student?.email || "",
    password: "",
    admissionNumber: student?.admissionNumber || "",
    gender: student?.gender || "",
    address: student?.address || "",
    guardianName: student?.guardianName || "",
    guardianPhone: student?.guardianPhone || "",
    stateOfOrigin: student?.stateOfOrigin || "",
    religion: student?.religion || "",
    parentEmail: "",
    parentPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((form.parentEmail && !form.parentPassword) || (!form.parentEmail && form.parentPassword)) {
      toast.error("Provide both a parent email and password, or leave both blank");
      return;
    }
    setLoading(true);
    try {
      if (mode === "create") {
        if (!form.password) { toast.error("Password is required"); return; }
        const result = await createStudent({
          schoolId,
          name: form.name,
          email: form.email,
          password: form.password,
          admissionNumber: form.admissionNumber,
          gender: (form.gender as "male" | "female" | "other") || undefined,
          address: form.address || undefined,
          guardianName: form.guardianName || undefined,
          guardianPhone: form.guardianPhone || undefined,
          stateOfOrigin: form.stateOfOrigin || undefined,
          religion: form.religion || undefined,
          parentEmail: form.parentEmail || undefined,
          parentPassword: form.parentPassword || undefined,
        });
        if (result.success) {
          toast.success("Student created successfully!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to create student");
        }
      } else if (student) {
        const result = await updateStudent(student.id, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          gender: (form.gender as "male" | "female" | "other") || undefined,
          address: form.address || undefined,
          guardianName: form.guardianName || undefined,
          guardianPhone: form.guardianPhone || undefined,
          stateOfOrigin: form.stateOfOrigin || undefined,
          religion: form.religion || undefined,
          parentEmail: form.parentEmail || undefined,
          parentPassword: form.parentPassword || undefined,
        });
        if (result.success) {
          toast.success("Student updated!");
          setOpen(false);
          router.refresh();
        } else {
          toast.error("Failed to update student");
        }
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const states = nigerianStates();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Student
          </Button>
        ) : (
          <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Student" : "Edit Student"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Admission Number *</Label>
              <Input value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} required disabled={mode === "edit"} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>{mode === "create" ? "Password *" : "New Password (leave blank to keep)"}</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={mode === "create"} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>State of Origin</Label>
              <Select value={form.stateOfOrigin} onValueChange={(v) => setForm({ ...form, stateOfOrigin: v })}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Guardian Name</Label>
              <Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Guardian Phone</Label>
              <Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Religion</Label>
              <Select value={form.religion} onValueChange={(v) => setForm({ ...form, religion: v })}>
                <SelectTrigger><SelectValue placeholder="Select religion" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Christianity">Christianity</SelectItem>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Traditional">Traditional</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2 pt-2">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">
                Parent Account (Optional)
              </h3>
              <p className="text-xs text-muted-foreground">
                Provide both fields to create — or link, if this email already has a parent
                account — a login the parent can use to view this child&apos;s details.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Parent Login Email</Label>
              <Input
                type="email"
                value={form.parentEmail}
                onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                placeholder="parent@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Password</Label>
              <Input
                type="password"
                value={form.parentPassword}
                onChange={(e) => setForm({ ...form, parentPassword: e.target.value })}
                placeholder="Min. 6 characters"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
