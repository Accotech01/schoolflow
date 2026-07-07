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
import { Send, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendMessageToAdmin, createPlatformAnnouncement } from "@/actions/platform-messages";

const BROADCAST = "broadcast";

interface Props {
  admins: { id: string; name: string; school: { name: string } }[];
}

export function ComposeMessageDialog({ admins }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ recipient: BROADCAST, title: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result =
        form.recipient === BROADCAST
          ? await createPlatformAnnouncement({ title: form.title, message: form.message })
          : await sendMessageToAdmin(form.recipient, { title: form.title, message: form.message });

      if (result.success) {
        toast.success(form.recipient === BROADCAST ? "Announcement posted!" : "Message sent!");
        setOpen(false);
        setForm({ recipient: BROADCAST, title: "", message: "" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to send");
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
          <Plus className="h-4 w-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message to School Admin(s)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Send To *</Label>
            <Select value={form.recipient} onValueChange={(v) => setForm({ ...form, recipient: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BROADCAST}>All School Admins (Announcement)</SelectItem>
                {admins.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name} — {a.school.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Upcoming Maintenance Notice"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write your message here..."
              rows={5}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="gap-2 bg-blue-600 hover:bg-blue-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
