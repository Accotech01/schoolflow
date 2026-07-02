"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRightCircle } from "lucide-react";
import { toast } from "sonner";
import { executePromotions } from "@/actions/promotions";

export function ExecutePromotionsButton({ sessionId, schoolId }: { sessionId: string; schoolId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const result = await executePromotions(sessionId, schoolId);
      if (result.success) {
        toast.success(`Moved ${result.processed} student(s) into their new classes`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to execute promotions");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleExecute} disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700">
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ArrowRightCircle className="h-4 w-4" />
          Execute Promotions
        </>
      )}
    </Button>
  );
}
