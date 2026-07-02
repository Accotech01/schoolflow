"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export function PrintLetterButton() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print Letter
      </Button>
    </div>
  );
}
