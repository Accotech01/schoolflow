"use client";

import { useEffect } from "react";
import { markAllAnnouncementsRead } from "@/actions/announcements";

// Fires once on mount to mark every announcement currently visible on the
// page as read, so the notification bell's unread list clears them out on
// the next fetch. The page itself still renders each item's read state as
// it was when the page loaded, so "New" badges are visible for one visit.
export function MarkAllAnnouncementsRead() {
  useEffect(() => {
    markAllAnnouncementsRead().catch(() => {});
  }, []);

  return null;
}
