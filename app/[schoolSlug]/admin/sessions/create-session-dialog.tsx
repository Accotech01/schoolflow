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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSession } from "@/actions/admin";

interface Props {
  schoolId: string;
  activeSessionName?: string;
}

export function CreateSessionDialog({ schoolId, activeSessionName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(() => {
    const year = new Date().getFullYear();
    return `${year}/${year + 1}`;
  });

  const doCreate = async () => {
    setLoading(true);
    try {
      const result = await createSession(schoolId, name);
      if (result.success) {
        const promotionNote = result.promotionsInitiated
          ? ` ${activeSessionName} was ended and ${result.promotionsInitiated} promotion record(s) were initiated.`
          : "";
        toast.success(`Session ${name} created with 3 terms!${promotionNote}`);
        setConfirmOpen(false);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to create session");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSessionName) {
      setConfirmOpen(true);
    } else {
      doCreate();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> New Session</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Session Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2024/2025" required />
              <p className="text-xs text-muted-foreground">3 terms (First, Second, Third) will be created automatically.</p>
            </div>
            {activeSessionName && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
                <strong>{activeSessionName}</strong> is currently active. Creating a new session will end it
                and calculate its end-of-session promotions.
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End {activeSessionName} and start {name}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                <strong>{activeSessionName}</strong> is still active. Continuing will mark all of its
                terms as completed and automatically calculate promotions for every enrolled student
                based on their average scores.
              </p>
              <p>
                Promotion decisions can still be reviewed and adjusted afterward on the Promotions page.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doCreate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : `End Session & Create ${name}`}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
