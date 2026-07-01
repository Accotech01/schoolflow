"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { generatePromotions } from "@/actions/promotions";

export function GeneratePromotionsButton({ sessionId, schoolId }: { sessionId: string; schoolId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePromotions(sessionId, schoolId);
      if (result.success) {
        toast.success(`Generated ${result.created} promotion records`);
        router.refresh();
      } else {
        toast.error("Failed to generate promotions");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-purple-600 hover:bg-purple-700">
      {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Zap className="h-4 w-4" />Generate Promotions</>}
    </Button>
  );
}
