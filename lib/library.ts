import libraryJson from "@/data/library.json";
import { snapshot } from "./store";
import type { Library, LiveSession, Part, SeedLibrary, Series } from "./types";

const BASE = libraryJson as unknown as SeedLibrary;

/** Merge the seed catalog with anything the admin dashboard has changed. */
export function getLibrary(): Library {
  const store = snapshot();
  const hidden = new Set(store.hiddenParts.map(String));

  const merged: Series[] = BASE.series.map((series) => {
    const override = store.seriesOverrides[series.slug] ?? {};
    const parts = series.parts
      .filter((p) => !hidden.has(p.slug))
      .map((p) => ({ ...p, ...(store.partOverrides[p.slug] ?? {}) }));

    const added = store.parts
      .filter((p) => store.partSeries[p.slug] === series.slug)
      .map((p) => ({ ...p, ...(store.partOverrides[p.slug] ?? {}) }));

    const all = [...parts, ...added].sort((a, b) => a.number - b.number);
    return { ...series, ...override, parts: all };
  });

  const known = new Set(BASE.series.map((s) => s.slug));
  const extra = store.series
    .filter((s) => !known.has(s.slug))
    .map((s) => ({
      ...s,
      parts: [
        ...s.parts,
        ...store.parts
          .filter((p) => store.partSeries[p.slug] === s.slug)
          .map((p) => ({ ...p, ...(store.partOverrides[p.slug] ?? {}) })),
      ].sort((a, b) => a.number - b.number),
    }));

  return {
    ...BASE,
    series: [...merged, ...extra],
    liveSession: getSessions()[0],
  };
}

export function getSeries(slug: string): Series | null {
  return getLibrary().series.find((s) => s.slug === slug) ?? null;
}

export function getPart(slug: string): { series: Series; part: Part } | null {
  for (const series of getLibrary().series) {
    const part = series.parts.find((p) => p.slug === slug);
    if (part) return { series, part };
  }
  return null;
}

export function allParts(): { series: Series; part: Part }[] {
  return getLibrary().series.flatMap((series) => series.parts.map((part) => ({ series, part })));
}

export function searchLibrary(query: string, limit = 20) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allParts()
    .filter(
      ({ series, part }) =>
        part.title.toLowerCase().includes(q) ||
        part.synopsis.toLowerCase().includes(q) ||
        series.title.toLowerCase().includes(q) ||
        series.genre.some((g) => g.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

export function publicCount() {
  const parts = allParts();
  return {
    total: parts.length,
    public: parts.filter((p) => p.part.access === "public").length,
    series: getLibrary().series.length,
  };
}

export function getSessions(): LiveSession[] {
  const store = snapshot();
  const seeded: LiveSession[] = [
    {
      id: "next-session",
      title: BASE.liveSession.title,
      description: BASE.liveSession.notes,
      poster: BASE.liveSession.poster,
      startsAt: nextTuesdayIso(),
      whatsappUrl: BASE.liveSession.whatsappUrl,
      isPublished: true,
      host: BASE.site.founder,
    },
  ];
  const all = store.sessions.length ? store.sessions : seeded;
  return [...all].sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
}

export function nextTuesdayIso(from: Date = new Date()): string {
  const d = new Date(from);
  const day = d.getUTCDay();
  let delta = (2 - day + 7) % 7;
  const candidate = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 18, 0, 0),
  );
  if (delta === 0 && candidate.getTime() <= d.getTime()) delta = 7;
  candidate.setUTCDate(candidate.getUTCDate() + delta);
  return candidate.toISOString();
}
