"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Megaphone, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getMyAnnouncements, markAnnouncementRead } from "@/actions/announcements";
import { getMyPlatformMessages, markPlatformMessageRead } from "@/actions/platform-messages";

interface NotificationItem {
  id: string;
  kind: "announcement" | "platform_message";
  title: string;
  message: string;
  createdAt: Date;
}

function useAnnouncementsPageHref() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [schoolSlug, role] = segments;
  if (!schoolSlug || !["admin", "teacher", "student"].includes(role)) return null;
  return `/${schoolSlug}/${role}/announcements`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const announcementsHref = useAnnouncementsPageHref();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyAnnouncements(), getMyPlatformMessages()])
      .then(([announcements, messages]) => {
        if (cancelled) return;
        const merged: NotificationItem[] = [
          ...announcements.map((a) => ({ id: a.id, kind: "announcement" as const, title: a.title, message: a.message, createdAt: a.createdAt })),
          ...messages.map((m) => ({ id: m.id, kind: "platform_message" as const, title: m.title, message: m.message, createdAt: m.createdAt })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setItems(merged);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleView = (item: NotificationItem) => {
    // Optimistically drop it from the dropdown — the bell's dot clears once
    // no unread items remain.
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    if (item.kind === "announcement") {
      markAnnouncementRead(item.id).catch(() => {});
    } else {
      markPlatformMessageRead(item.id).catch(() => {});
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          {loading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading...</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No new notifications</p>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const Icon = item.kind === "platform_message" ? Mail : Megaphone;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => handleView(item)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 group"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                      </div>
                      <Check className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {announcementsHref && (
            <Link
              href={announcementsHref}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-xs font-medium text-blue-600 hover:bg-gray-50 border-t"
            >
              View all announcements
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
