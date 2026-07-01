"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { nigerianStates } from "@/lib/utils";
import { createSchoolWithAdmin } from "@/actions/schools";

export function CreateSchoolDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    schoolName: "",
    slug: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    motto: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
  });

  const handleSlugify = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, schoolName: name, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await createSchoolWithAdmin(form);
      if (result.success) {
        toast.success("School created successfully!");
        setOpen(false);
        setForm({
          schoolName: "", slug: "", address: "", city: "", state: "",
          phone: "", email: "", motto: "",
          adminName: "", adminEmail: "", adminPassword: "", adminPhone: "",
        });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create school");
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
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          Add School
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New School</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">
                School Information
              </h3>
            </div>
            <div className="space-y-2">
              <Label>School Name *</Label>
              <Input
                value={form.schoolName}
                onChange={(e) => handleSlugify(e.target.value)}
                placeholder="e.g. Bright Stars Academy"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>School Slug (URL ID) *</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="bright-stars-academy"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used for login: edumanage.ng/<strong>{form.slug || "school-slug"}</strong>
              </p>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="12 Education Street"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Lagos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>State *</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setForm({ ...form, state: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+234 801 234 5678"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@brightstarsakademy.edu.ng"
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>School Motto</Label>
              <Input
                value={form.motto}
                onChange={(e) => setForm({ ...form, motto: e.target.value })}
                placeholder="e.g. Excellence in Education"
              />
            </div>

            {/* Admin Account */}
            <div className="col-span-2 space-y-2 pt-2">
              <h3 className="font-semibold text-sm text-gray-700 border-b pb-1">
                School Admin Account
              </h3>
            </div>
            <div className="space-y-2">
              <Label>Admin Full Name *</Label>
              <Input
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                placeholder="Dr. Emmanuel Okafor"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Phone</Label>
              <Input
                value={form.adminPhone}
                onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                placeholder="+234 802 345 6789"
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Email *</Label>
              <Input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="admin@brightstarsakademy.edu.ng"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Password *</Label>
              <Input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create School & Admin"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
