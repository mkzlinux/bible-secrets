"use client";

import { useEffect, useState } from "react";
import { Rail, type RailItem } from "./Rail";

interface StoredProgress {
  partSlug: string;
  page: number;
  pageCount: number;
  title: string;
  seriesTitle: string;
  poster: string;
  updatedAt: string;
}

const KEY = "bs:progress";

export function ContinueRail() {
  const [items, setItems] = useState<RailItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredProgress[];
      const seen = new Set<string>();
      const list: RailItem[] = [];
      for (const p of parsed.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))) {
        if (seen.has(p.partSlug)) continue;
        seen.add(p.partSlug);
        list.push({
          slug: p.partSlug,
          title: p.title,
          seriesTitle: p.seriesTitle,
          poster: p.poster,
          access: "public",
          meta: p.pageCount ? `Page ${p.page} of ${p.pageCount}` : undefined,
          progress: p.pageCount ? p.page / p.pageCount : 0,
        });
        if (list.length >= 12) break;
      }
      setItems(list);
    } catch {
      /* ignore */
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <Rail
      eyebrow="Pick up where you stopped"
      title="Continue Reading"
      items={items.map((i) => ({ ...i, access: "public" as const }))}
      variant="wide"
    />
  );
}
