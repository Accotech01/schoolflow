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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createResource } from "@/actions/lessons";

interface Props {
  teacherId: string;
  classId: string;
  subjectId: string;
  termId: string;
  schoolId: string;
}

const RESOURCE_TYPES = [
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
  { value: "article", label: "Article" },
  { value: "exercise", label: "Exercise" },
  { value: "other", label: "Other" },
];

export function CreateResourceDialog({ teacherId, classId, subjectId, termId, schoolId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  type ResourceType = "link" | "video" | "document" | "pdf" | "article" | "exercise" | "other";

  const [form, setForm] = useState({
    title: "",
    url: "",
    description: "",
    resourceType: "video" as ResourceType,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.startsWith("http://") && !form.url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    setLoading(true);
    try {
      const result = await createResource({
        teacherId, classId, subjectId, termId, schoolId,
        title: form.title,
        url: form.url,
        description: form.description || undefined,
        resourceType: form.resourceType,
      });
      if (result.success) {
        toast.success("Resource added!");
        setOpen(false);
        setForm({ title: "", url: "", description: "", resourceType: "video" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add resource");
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
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Learning Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Khan Academy – Algebra Basics"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Resource Type *</Label>
            <Select value={form.resourceType} onValueChange={(v) => setForm({ ...form, resourceType: v as ResourceType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>URL *</Label>
            <Input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Brief description of this resource..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Add Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
