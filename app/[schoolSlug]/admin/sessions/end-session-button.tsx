"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FlagOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { endCurrentSession } from "@/actions/admin";

interface Props {
  schoolId: string;
  sessionName: string;
}

export function EndSessionButton({ schoolId, sessionName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    setLoading(true);
    try {
      const result = await endCurrentSession(schoolId);
      if (result.success) {
        toast.success(
          `${sessionName} ended. ${result.promotionsInitiated} promotion record(s) initiated — review them on the Promotions page.`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to end session");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
          <FlagOff className="h-4 w-4" />
          End Session
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End {sessionName}?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This marks all terms in <strong>{sessionName}</strong> as completed and
              automatically calculates end-of-session promotions for every enrolled student,
              based on their average scores.
            </p>
            <p>
              You&apos;ll still need to create a new academic session and review any pending
              promotion decisions before students are moved into their new classes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleEnd}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Ending..." : "End Session"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
