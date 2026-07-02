"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  schoolSlug: string;
  sessions: { id: string; name: string; status: string }[];
  selectedId: string;
}

export function SessionSelector({ schoolSlug, sessions, selectedId }: Props) {
  const router = useRouter();

  return (
    <Select
      value={selectedId}
      onValueChange={(v) => router.push(`/${schoolSlug}/admin/promotions?session=${v}`)}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select session" />
      </SelectTrigger>
      <SelectContent>
        {sessions.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name} ({s.status})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
