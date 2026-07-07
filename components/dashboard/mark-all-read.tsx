"use client";

import { useEffect } from "react";

// Fires once on mount to mark every item currently visible on the page as
// read, so the notification bell's unread list clears them out on the next
// fetch. The page itself still renders each item's read state as it was
// when the page loaded, so "New" badges are visible for one visit.
export function MarkAllRead({ action }: { action: () => Promise<unknown> }) {
  useEffect(() => {
    action().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
