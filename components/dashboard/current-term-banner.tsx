import { CalendarClock, CalendarCheck2, CalendarX2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  sessionName?: string;
  termName?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
}

export function CurrentTermBanner({ sessionName, termName, startDate, endDate }: Props) {
  if (!sessionName || !termName) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
        <CalendarX2 className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>No Active Term:</strong> your school administrator has not activated a term
          yet. Check back once a new term or session has started.
        </p>
      </div>
    );
  }

  const expired = endDate ? new Date(endDate).getTime() < Date.now() : false;

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        <CalendarClock className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">
          <strong>{termName} Term</strong> ({sessionName}) was scheduled to end on{" "}
          {formatDate(endDate ?? null)}. Your school administrator will activate the next term soon.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
      <CalendarCheck2 className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm">
        You are currently in <strong>{termName} Term</strong> — {sessionName}
        {startDate && endDate && ` (${formatDate(startDate ?? null)} – ${formatDate(endDate ?? null)})`}
      </p>
    </div>
  );
}
