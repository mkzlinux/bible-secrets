import { FEATURED, ROW_ORDER } from "./featured";
import { getLibrary, getPart, getSessions } from "./library";
import type { HeroSet, HeroSlide } from "./hero";
import type { RailItem } from "@/components/Rail";

export function buildHeroSets(): HeroSet[] {
  const library = getLibrary();

  const originals: HeroSlide[] = FEATURED.flatMap((f) => {
    const found = getPart(f.partSlug);
    if (!found) return [];
    const { series, part } = found;
    return [
      {
        id: `original-${part.slug}`,
        title: f.headline ?? part.title,
        eyebrow: f.eyebrow,
        pitch: f.pitch,
        meta: f.meta ?? [series.title, `${series.parts.length} parts`, String(series.year)],
        backdrop: part.backdrop || series.backdrop,
        poster: part.poster || series.poster,
        actionHref: `/read/${part.slug}`,
        actionLabel: part.access === "members" ? "Preview" : "Play",
        infoHref: `/series/${series.slug}`,
        locked: part.access === "members",
        accent: series.accent,
      },
    ];
  });

  const seriesSlides: HeroSlide[] = library.series.map((series) => {
    const firstPublic = series.parts.find((p) => p.access === "public") ?? series.parts[0];
    return {
      id: `series-${series.slug}`,
      title: series.title,
      eyebrow: series.badge,
      pitch: series.synopsis,
      meta: [String(series.year), `${series.parts.length} parts`, series.genre[0] ?? "Bible Study"],
      backdrop: series.backdrop,
      poster: series.poster,
      actionHref: firstPublic ? `/read/${firstPublic.slug}` : `/series/${series.slug}`,
      actionLabel: firstPublic ? "Play first part" : "View series",
      infoHref: `/series/${series.slug}`,
      accent: series.accent,
    };
  });

  const sessions = getSessions();
  const qa = library.series.find((s) => s.slug === "question-and-answer");
  const sessionSlides: HeroSlide[] = [
    ...sessions.slice(0, 3).map((session) => ({
      id: `session-${session.id}`,
      title: session.title,
      eyebrow: "Live · Tuesday 8PM WhatsApp",
      pitch: session.description,
      meta: ["Every Tuesday", "8:00 PM CAT", "WhatsApp"],
      backdrop: library.liveSession.poster,
      poster: session.poster || library.liveSession.poster,
      actionHref: "/live",
      actionLabel: "Join the session",
      infoHref: "/live",
      accent: "#e08b7a",
    })),
    ...(qa
      ? qa.parts.map((part) => ({
          id: `qa-${part.slug}`,
          title: part.title,
          eyebrow: "Q&A archive",
          pitch: part.synopsis,
          meta: ["Tuesday night archive", "Q&A"],
          backdrop: part.backdrop,
          poster: part.poster,
          actionHref: `/read/${part.slug}`,
          actionLabel: "Read",
          infoHref: `/series/${qa.slug}`,
          accent: qa.accent,
        }))
      : []),
  ];

  const engine: HeroSlide[] = [
    {
      id: "engine-bereshit",
      title: "Bible Technology",
      eyebrow: library.bibleTechnology.engine,
      pitch:
        "Four indexes on one canonical text: words inside a word, anagrams and ciphers, a verse cross-reference graph, and equidistant letter sequences — shown plainly, with the limits on the glass.",
      meta: ["Bereshit Lab", "Hebrew + English", "Open data only"],
      backdrop: library.bibleTechnology.backdrop,
      poster: library.bibleTechnology.poster,
      actionHref: "/bible-technology",
      actionLabel: "Open the engine",
      infoHref: "/bible-technology",
      accent: "#7ec8b8",
    },
  ];

  return [
    { id: "originals", label: "Originals", slides: originals },
    { id: "series", label: "Series", slides: seriesSlides },
    { id: "sessions", label: "Tuesday Live", slides: sessionSlides },
    { id: "engine", label: "Bible Technology", slides: engine },
  ].filter((s) => s.slides.length > 0);
}

export function buildRails() {
  const library = getLibrary();
  const ordered = [...library.series].sort(
    (a, b) => ROW_ORDER.indexOf(a.slug) - ROW_ORDER.indexOf(b.slug),
  );
  return ordered
    .filter((s) => s.parts.length > 0)
    .map((series) => ({
      series,
      items: series.parts.map<RailItem>((part) => ({
        slug: part.slug,
        title: part.title,
        poster: part.poster || series.poster,
        seriesTitle: series.title,
        access: part.access,
        meta: `${series.title} · #${part.number}`,
      })),
    }));
}

export function featuredFirstPart() {
  const first = FEATURED[0];
  return first ? getPart(first.partSlug) : null;
}
