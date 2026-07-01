"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { setActiveTerm } from "@/actions/admin";

export function SetActiveTermButton({ termId, schoolId, isActive }: { termId: string; schoolId: string; isActive: boolean }) {
  const router = useRouter();
  if (isActive) return null;
  return (
    <Button
      size="sm"
      variant="outline"
      className="mt-2 w-full text-xs"
      onClick={async () => {
        await setActiveTerm(termId, schoolId);
        toast.success("Term activated");
        router.refresh();
      }}
    >
      Set as Active
    </Button>
  );
}
