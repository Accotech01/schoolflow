"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  targetId: string;
  placeholder?: string;
  className?: string;
}

// A search box that filters rows of a table (or items in a list) elsewhere
// on the page, by toggling the visibility of any descendant marked with a
// `data-search="..."` attribute. Kept deliberately simple (no client state
// lifted into the table itself) since the tables it filters are plain
// server-rendered markup.
export function TableSearch({ targetId, placeholder = "Search...", className }: Props) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    const container = document.getElementById(targetId);
    if (!container) return;

    const q = value.trim().toLowerCase();
    const items = container.querySelectorAll<HTMLElement>("[data-search]");
    let visibleCount = 0;
    items.forEach((item) => {
      const matches = q === "" || (item.dataset.search || "").includes(q);
      item.style.display = matches ? "" : "none";
      if (matches) visibleCount++;
    });

    const emptyState = container.querySelector<HTMLElement>("[data-search-empty]");
    if (emptyState) {
      emptyState.style.display = q !== "" && visibleCount === 0 ? "" : "none";
    }
  };

  return (
    <div className={`relative w-full max-w-xs ${className || ""}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
