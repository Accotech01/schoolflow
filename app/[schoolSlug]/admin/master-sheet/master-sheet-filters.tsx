"use client";

import { useRouter } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface Props {
  schoolSlug: string;
  classes: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  selectedClassId: string;
  selectedTermId: string;
}

export function MasterSheetFilters({ schoolSlug, classes, terms, selectedClassId, selectedTermId }: Props) {
  const router = useRouter();

  const navigate = (classId: string, termId: string) => {
    router.push(`/${schoolSlug}/admin/master-sheet?class=${classId}&term=${termId}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 no-print">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedClassId} onValueChange={(v) => navigate(v, selectedTermId)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTermId} onValueChange={(v) => navigate(selectedClassId, v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name} Term</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="outline" className="gap-2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
