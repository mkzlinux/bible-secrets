"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ReaderPart {
  slug: string;
  title: string;
  number: number;
  pagesHint?: number | null;
  seriesSlug: string;
  seriesTitle: string;
  downloadUrl?: string | null;
}

export function Reader({
  part,
  prev,
  next,
  canDownload,
  userKey,
}: {
  part: ReaderPart;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  canDownload: boolean;
  userKey: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const docRef = useRef<unknown>(null);
  const renderTask = useRef<{ cancel: () => void } | null>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chrome, setChrome] = useState(true);
  const [dim, setDim] = useState(0.12);
  const [markers, setMarkers] = useState<number[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const pdfUrl = `/api/read/${part.slug}`;

  /* ------------------------------------------------------------ document */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({
          url: pdfUrl,
          withCredentials: true,
        }).promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);

        const stored = readProgress(userKey, part.slug);
        if (stored && stored.page > 0) setPage(Math.min(stored.page, doc.numPages));
        setMarkers(readMarkers(userKey, part.slug));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("We could not open this volume. Try downloading it instead.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      const doc = docRef.current as { destroy?: () => void } | null;
      doc?.destroy?.();
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part.slug]);

  /* -------------------------------------------------------------- render */
  const renderPage = useCallback(
    async (pageNumber: number) => {
      const doc = docRef.current as
        | { getPage: (n: number) => Promise<PdfPage> }
        | null;
      if (!doc || !canvasRef.current) return;
      try {
        renderTask.current?.cancel();
        const p = await doc.getPage(pageNumber);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const containerWidth = Math.min(
          scrollRef.current?.clientWidth ?? 900,
          window.innerWidth,
        );
        const baseViewport = p.getViewport({ scale: 1 });
        const fitScale = (containerWidth - 32) / baseViewport.width;
        const scale = Math.max(0.4, fitScale * zoom);
        const viewport = p.getViewport({ scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const task = p.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        renderTask.current = task;
        await task.promise;
      } catch (e) {
        const err = e as { name?: string };
        if (err?.name !== "RenderingCancelledException") console.error(e);
      }
    },
    [zoom],
  );

  useEffect(() => {
    if (!numPages) return;
    void renderPage(page);
  }, [page, numPages, renderPage]);

  /* ------------------------------------------------------------ progress */
  useEffect(() => {
    if (!numPages) return;
    const pct = page / numPages;
    setProgress(pct);
    const t = setTimeout(() => {
      writeProgress(userKey, {
        partSlug: part.slug,
        page,
        pageCount: numPages,
        title: part.title,
        seriesTitle: part.seriesTitle,
        poster: "",
        updatedAt: new Date().toISOString(),
      });
      void fetch("/api/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ partSlug: part.slug, page, pageCount: numPages }),
      }).catch(() => undefined);
    }, 700);
    return () => clearTimeout(t);
  }, [page, numPages, part.slug, part.title, part.seriesTitle, userKey]);

  /* ---------------------------------------------------------- shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setPage((p) => Math.min((numPages ?? 1), p + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPage((p) => Math.max(1, p - 1));
      }
      if (e.key === "f") void toggleFullscreen();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [numPages]);

  async function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) await el.requestFullscreen?.().catch(() => undefined);
    else await document.exitFullscreen?.().catch(() => undefined);
  }

  function toggleMarker() {
    const nextMarkers = markers.includes(page)
      ? markers.filter((m) => m !== page)
      : [...markers, page].sort((a, b) => a - b);
    setMarkers(nextMarkers);
    writeMarkers(userKey, part.slug, nextMarkers);
    setSaved(`Bookmark ${markers.includes(page) ? "removed" : "saved"} on page ${page}`);
    setTimeout(() => setSaved(null), 1800);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#07080a]">
      {/* Top chrome */}
      <header
        className={cn(
          "z-20 flex items-center gap-3 border-b border-cream/10 bg-ink-950/85 px-3 py-2.5 backdrop-blur transition-transform duration-500 md:px-5",
          chrome ? "translate-y-0" : "-translate-y-full",
        )}
      >
        <Link
          href={`/series/${part.seriesSlug}`}
          className="flex h-9 items-center gap-2 rounded-full border border-cream/15 px-3 text-[12px] text-cream-dim transition-colors hover:text-cream"
        >
          ← <span className="hidden sm:inline">Back to series</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13.5px] font-bold text-cream">{part.title}</p>
          <p className="truncate text-[11px] text-cream-dim/80">
            {part.seriesTitle} · part {part.number}
            {numPages ? ` · page ${page} of ${numPages}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn label="Bookmark this page" onClick={toggleMarker} active={markers.includes(page)}>
            <BookmarkIcon filled={markers.includes(page)} />
          </IconBtn>
          {canDownload ? (
            <a
              href={`${pdfUrl}?download=1`}
              className="hidden h-9 items-center rounded-full border border-cream/15 px-3 text-[12px] text-cream-dim transition-colors hover:border-gold-500/60 hover:text-cream sm:flex"
              download
            >
              Download
            </a>
          ) : (
            <span className="hidden h-9 items-center rounded-full border border-coral-400/40 px-3 text-[11px] text-coral-400 sm:flex">
              Preview mode
            </span>
          )}
          <IconBtn label="Immersive mode" onClick={() => setChrome((c) => !c)}>
            <EyeIcon />
          </IconBtn>
        </div>
      </header>

      {/* Stage */}
      <div
        ref={scrollRef}
        className="relative flex flex-1 items-start justify-center overflow-auto px-2 py-4 md:px-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) setChrome((c) => !c);
        }}
      >
        <div className="relative">
          {loading && (
            <div className="grid h-[60svh] w-[78vw] max-w-[820px] place-items-center">
              <p className="animate-pulse font-serif text-lg text-cream-dim">Opening the volume…</p>
            </div>
          )}
          {error && (
            <div className="grid h-[60svh] w-[78vw] max-w-[820px] place-items-center text-center">
              <div>
                <p className="font-serif text-lg text-cream/85">{error}</p>
                {canDownload && (
                  <a href={`${pdfUrl}?download=1`} className="btn btn-gold mt-4 text-sm" download>
                    Download the PDF
                  </a>
                )}
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={cn(
              "mx-auto rounded-sm shadow-[0_40px_120px_-40px_rgba(0,0,0,1)] transition-opacity duration-500",
              loading || error ? "opacity-0" : "opacity-100",
            )}
            style={{ filter: `brightness(${1 - dim})` }}
          />
          {dim > 0 && (
            <div
              className="pointer-events-none absolute inset-0 rounded-sm"
              style={{ background: `rgba(3,4,6,${dim * 0.35})` }}
            />
          )}
        </div>

        {/* Bookmark markers */}
        {markers.length > 0 && chrome && (
          <div className="absolute top-4 right-3 hidden flex-col gap-1 rounded-xl border border-cream/10 bg-ink-950/80 p-2 backdrop-blur md:flex">
            <p className="px-1 text-[9.5px] tracking-[0.2em] text-cream-dim uppercase">Marks</p>
            {markers.map((m) => (
              <button
                key={m}
                onClick={() => setPage(m)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] transition-colors",
                  m === page ? "bg-gold-500 text-ink-950" : "text-cream-dim hover:text-cream",
                )}
              >
                p{m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom chrome */}
      <footer
        className={cn(
          "z-20 border-t border-cream/10 bg-ink-950/85 backdrop-blur transition-transform duration-500",
          chrome ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-3 py-2.5 md:px-6">
          <IconBtn label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronIcon dir="left" />
          </IconBtn>

          <div className="flex flex-1 items-center gap-3">
            <input
              type="range"
              min={1}
              max={numPages ?? 1}
              value={page}
              onChange={(e) => setPage(Number(e.target.value))}
              className="h-1 w-full appearance-none rounded-full bg-cream/15 accent-gold-500"
              aria-label="Page"
            />
            <span className="w-[74px] shrink-0 text-right text-[11.5px] text-cream-dim">
              {page} / {numPages ?? "…"}
            </span>
          </div>

          <div className="hidden items-center gap-1.5 md:flex">
            <IconBtn label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}>
              <MinusIcon />
            </IconBtn>
            <span className="w-10 text-center text-[11.5px] text-cream-dim">
              {Math.round(zoom * 100)}%
            </span>
            <IconBtn label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}>
              <PlusIcon />
            </IconBtn>
            <IconBtn label="Dim the page" onClick={() => setDim((d) => (d >= 0.4 ? 0 : +(d + 0.09).toFixed(2)))}>
              <LampIcon />
            </IconBtn>
          </div>

          <IconBtn
            label="Next page"
            onClick={() => setPage((p) => Math.min(numPages ?? 1, p + 1))}
          >
            <ChevronIcon dir="right" />
          </IconBtn>
        </div>

        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-3 pb-2 text-[11.5px] md:px-6">
          {prev ? (
            <Link href={`/read/${prev.slug}`} className="truncate text-cream-dim hover:text-cream">
              ← {prev.title}
            </Link>
          ) : (
            <span className="text-cream-dim/40">Start of series</span>
          )}
          {saved && <span className="text-gold-400">{saved}</span>}
          {next ? (
            <Link href={`/read/${next.slug}`} className="truncate text-right text-cream-dim hover:text-cream">
              {next.title} →
            </Link>
          ) : (
            <span className="text-cream-dim/40">End of series</span>
          )}
        </div>

        <div className="h-[2px] w-full bg-cream/10">
          <div className="h-full bg-gold-500 transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

interface PdfPage {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: {
    canvasContext: CanvasRenderingContext2D;
    viewport: unknown;
    transform?: number[];
  }) => { promise: Promise<void>; cancel: () => void };
}

function IconBtn({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
        active
          ? "border-gold-500 bg-gold-500/15 text-gold-400"
          : "border-cream/15 text-cream-dim hover:border-gold-500/60 hover:text-cream",
      )}
    >
      {children}
    </button>
  );
}

const KEY = (userKey: string) => `bs:progress:${userKey}`;
const MARK_KEY = (userKey: string, slug: string) => `bs:marks:${userKey}:${slug}`;

interface StoredProgress {
  partSlug: string;
  page: number;
  pageCount: number;
  title: string;
  seriesTitle: string;
  poster: string;
  updatedAt: string;
}

function readAll(userKey: string): StoredProgress[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY(userKey)) ?? "[]") as StoredProgress[];
  } catch {
    return [];
  }
}

function readProgress(userKey: string, slug: string) {
  return readAll(userKey).find((p) => p.partSlug === slug) ?? null;
}

function writeProgress(userKey: string, record: StoredProgress) {
  try {
    const others = readAll(userKey).filter((p) => p.partSlug !== record.partSlug);
    window.localStorage.setItem(KEY(userKey), JSON.stringify([record, ...others].slice(0, 60)));
    // The global "Continue Reading" rail reads this key.
    const globalKey = "bs:progress";
    const globalList = JSON.parse(window.localStorage.getItem(globalKey) ?? "[]") as StoredProgress[];
    const merged = [record, ...globalList.filter((p) => p.partSlug !== record.partSlug)].slice(0, 60);
    window.localStorage.setItem(globalKey, JSON.stringify(merged));
  } catch {
    /* storage unavailable */
  }
}

function readMarkers(userKey: string, slug: string): number[] {
  try {
    return JSON.parse(window.localStorage.getItem(MARK_KEY(userKey, slug)) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function writeMarkers(userKey: string, slug: string, markers: number[]) {
  try {
    window.localStorage.setItem(MARK_KEY(userKey, slug), JSON.stringify(markers));
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------- icons */

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={cn("h-4 w-4", filled ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <path d="M6 3.4h8v13.2L10 13.4l-4 3.2z" strokeLinejoin="round" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6">
      <path d="M2.4 10S5.2 5.2 10 5.2 17.6 10 17.6 10 14.8 14.8 10 14.8 2.4 10 2.4 10Z" />
      <circle cx="10" cy="10" r="2.1" />
    </svg>
  );
}
function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round">
      <path d={dir === "left" ? "M12 5l-5 5 5 5" : "M8 5l5 5-5 5"} />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 5v10M5 10h10" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 10h10" />
    </svg>
  );
}
function LampIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round">
      <path d="M10 3.6v2M4.6 6.2l1.4 1.4M15.4 6.2 14 7.6M3 12h3M14 12h3" />
      <path d="M7.4 16.4h5.2M8 12.6a3.2 3.2 0 1 1 4 0c-.5.4-.8 1-.8 1.6H8.8c0-.6-.3-1.2-.8-1.6Z" />
    </svg>
  );
}
