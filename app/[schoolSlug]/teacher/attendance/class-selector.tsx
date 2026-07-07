"use client";

import { useRouter } from "next/navigation";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Props {
  schoolSlug: string;
  classes: { id: string; name: string }[];
  selectedId: string;
}

export function ClassSelector({ schoolSlug, classes, selectedId }: Props) {
  const router = useRouter();

  return (
    <Select
      value={selectedId}
      onValueChange={(v) => router.push(`/${schoolSlug}/teacher/attendance?class=${v}`)}
    >
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select class" />
      </SelectTrigger>
      <SelectContent>
        {classes.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
