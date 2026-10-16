"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SearchHit {
  partSlug: string;
  title: string;
  seriesTitle: string;
  seriesSlug: string;
  poster: string;
  access: "public" | "members";
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    setQuery("");
    setHits([]);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { hits: SearchHit[] };
        setHits(data.hits ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query]);

  const suggestions = useMemo(
    () => ["Melchizedek", "Noah", "Watchers", "Courts of Heaven", "Meditation", "Comic"],
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-ink-950/85 p-4 backdrop-blur-xl md:p-10">
      <button aria-label="Close search" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl animate-fade-up">
        <div className="flex items-center gap-3 rounded-2xl border border-cream/15 bg-ink-900/90 px-4 py-3 shadow-cinema">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-none stroke-gold-500" strokeWidth="1.7">
            <circle cx="9" cy="9" r="5.6" />
            <path d="m13.2 13.2 3.4 3.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search volumes, series, sessions…"
            className="w-full bg-transparent font-serif text-lg text-cream outline-none placeholder:text-cream-dim/50"
          />
          <button onClick={onClose} className="text-[11px] tracking-widest text-cream-dim/70 uppercase hover:text-cream">
            Esc
          </button>
        </div>

        {!query && (
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="chip hover:border-gold-500/60">
                {s}
              </button>
            ))}
          </div>
        )}

        {query && (
          <div className="mt-4 max-h-[62svh] overflow-y-auto rounded-2xl border border-cream/10 bg-ink-900/85 p-2 shadow-cinema">
            {loading && <p className="px-3 py-4 text-sm text-cream-dim">Searching the vault…</p>}
            {!loading && hits.length === 0 && (
              <p className="px-3 py-4 text-sm text-cream-dim">Nothing matched “{query}”.</p>
            )}
            <ul>
              {hits.map((hit) => (
                <li key={hit.partSlug}>
                  <Link
                    href={`/read/${hit.partSlug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-cream/5"
                  >
                    <span className="relative h-16 w-11 overflow-hidden rounded-md">
                      <Image src={hit.poster} alt="" fill sizes="44px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-cream">{hit.title}</span>
                      <span className="block truncate text-xs text-cream-dim">{hit.seriesTitle}</span>
                    </span>
                    {hit.access === "members" && (
                      <span className="lock-ribbon rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                        Members
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
