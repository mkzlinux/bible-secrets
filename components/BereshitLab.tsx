"use client";

import { useMemo, useState } from "react";
import {
  LETTER_BY_CHAR,
  LEXICON as ALL_ENTRIES,
  albam,
  atbash,
  englishHits,
  englishSegmentations,
  gematria,
  isHebrew,
  segmentations,
  substringHits,
  toConsonants,
} from "@/lib/hebrew";
import { cn } from "@/lib/utils";

type Tab = "nested" | "ciphers" | "graph" | "els" | "method";

const TABS: { id: Tab; label: string }[] = [
  { id: "nested", label: "Words in a word" },
  { id: "ciphers", label: "Anagrams & ciphers" },
  { id: "graph", label: "Verse graph" },
  { id: "els", label: "Letter codes" },
  { id: "method", label: "How to build this" },
];

export function BereshitLab({ engineUp, engineUrl }: { engineUp: boolean; engineUrl: string }) {
  const [tab, setTab] = useState<Tab>("nested");
  const [query, setQuery] = useState("בראשית");
  const [maxParts, setMaxParts] = useState(4);

  const hebrew = isHebrew(query);
  const cons = hebrew ? toConsonants(query) : query.toLowerCase().replace(/[^a-z]/g, "");

  const nested = useMemo(() => {
    if (!cons) return { hits: [], segments: [] as ReturnType<typeof segmentations> };
    if (hebrew) {
      return { hits: substringHits(cons), segments: segmentations(cons, maxParts) };
    }
    return {
      hits: englishHits(cons).map((h) => ({
        text: h.text,
        start: h.start,
        entries: [{ strongs: "KJV", cons: h.text, xlit: h.text, gloss: "KJV vocabulary" }],
      })),
      segments: englishSegmentations(cons, maxParts).map((parts) => ({
        parts: parts.map((p) => ({ strongs: "KJV", cons: p, xlit: p, gloss: "KJV vocabulary" })),
        words: parts,
      })),
    };
  }, [cons, hebrew, maxParts]);

  const value = hebrew ? gematria(cons) : 0;
  const twins = useMemo(() => {
    if (!hebrew || !value) return [];
    return lexiconByValue(value, cons).slice(0, 8);
  }, [hebrew, value, cons]);

  const anagrams = useMemo(() => {
    if (!hebrew || cons.length < 3 || cons.length > 10) return [];
    const signature = [...cons].sort().join("");
    return lexiconBySignature(signature, cons).slice(0, 10);
  }, [hebrew, cons]);

  return (
    <div className="rounded-2xl border border-teal-400/20 bg-ink-900/70">
      {/* Tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-cream/10 px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-2 text-[12px] font-semibold tracking-wide whitespace-nowrap transition-colors",
              tab === t.id
                ? "bg-teal-400/15 text-teal-400"
                : "text-cream-dim hover:bg-cream/5 hover:text-cream",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Query */}
      <div className="flex flex-wrap items-center gap-3 border-b border-cream/10 px-4 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir={hebrew ? "rtl" : "ltr"}
          className={cn(
            "min-w-[160px] flex-1 rounded-xl border border-cream/15 bg-ink-950/70 px-4 py-2.5 text-cream outline-none focus:border-teal-400/60",
            hebrew ? "font-hebrew text-2xl" : "font-sans text-[15px]",
          )}
          aria-label="Word to examine"
        />
        <div className="flex gap-2">
          <button onClick={() => setQuery("בראשית")} className="chip hover:border-teal-400/60">
            בראשית
          </button>
          <button onClick={() => setQuery("beginning")} className="chip hover:border-teal-400/60">
            beginning
          </button>
          <button onClick={() => setQuery("מלכיצדק")} className="chip hover:border-teal-400/60">
            מלכיצדק
          </button>
        </div>
        <label className="flex items-center gap-2 text-[11.5px] text-cream-dim">
          max parts
          <select
            value={maxParts}
            onChange={(e) => setMaxParts(Number(e.target.value))}
            className="rounded-lg border border-cream/15 bg-ink-950/70 px-2 py-1 text-cream"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="p-4 md:p-6">
        {tab === "nested" && (
          <div className="space-y-6">
            {hebrew && (
              <div>
                <SubHead>Letter cards · {cons.length} consonants</SubHead>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" dir="rtl">
                  {Array.from(cons).map((ch, i) => {
                    const letter = LETTER_BY_CHAR.get(ch);
                    return (
                      <div
                        key={`${ch}-${i}`}
                        className="min-w-[92px] rounded-xl border border-cream/12 bg-ink-950/70 p-3 text-center"
                      >
                        <p className="font-hebrew text-3xl text-cream">{ch}</p>
                        <p className="mt-1 text-[10.5px] tracking-[0.14em] text-teal-400 uppercase">
                          {letter?.name ?? "—"}
                        </p>
                        <p className="mt-1 text-[10.5px] leading-snug text-cream-dim">
                          {letter?.pictograph}
                        </p>
                        <p className="mt-1 font-display text-sm text-gold-400">{letter?.value}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-cream-dim/70">
                  Pictographic meanings are a teaching convention, not a linguistic consensus.
                </p>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <SubHead>
                  Consecutive hits ({nested.hits.length}) — words hiding inside {cons}
                </SubHead>
                <ul className="space-y-1.5">
                  {nested.hits.slice(0, 40).map((hit, i) => (
                    <li
                      key={`${hit.text}-${hit.start}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-cream/8 bg-ink-950/50 px-3 py-2"
                    >
                      <span className={cn("text-lg text-cream", hebrew && "font-hebrew")} dir={hebrew ? "rtl" : "ltr"}>
                        {hit.text}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-cream-dim">
                        {hit.entries[0]?.gloss}
                        {hit.entries.length > 1 ? ` (+${hit.entries.length - 1})` : ""}
                      </span>
                      <span className="text-[10.5px] text-teal-400/80">{hit.entries[0]?.strongs}</span>
                    </li>
                  ))}
                  {nested.hits.length === 0 && (
                    <li className="text-[13px] text-cream-dim">No lexicon hits for that string.</li>
                  )}
                </ul>
              </div>

              <div>
                <SubHead>Full-cover segmentations ({nested.segments.length})</SubHead>
                <ul className="space-y-1.5">
                  {nested.segments.map((seg) => (
                    <li
                      key={seg.words.join("+")}
                      className="rounded-lg border border-cream/8 bg-ink-950/50 px-3 py-2"
                    >
                      <p className={cn("text-lg text-gold-300", hebrew && "font-hebrew")} dir={hebrew ? "rtl" : "ltr"}>
                        {seg.words.join(" + ")}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-cream-dim">
                        {seg.parts.map((p) => p.gloss).join(" · ")}
                      </p>
                    </li>
                  ))}
                  {nested.segments.length === 0 && (
                    <li className="text-[13px] text-cream-dim">
                      No full-cover word-break found up to {maxParts} parts.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "ciphers" && (
          <div className="space-y-6">
            {hebrew ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Stat label="Gematria (mispar hechrachi)" value={String(value)} />
                  <Stat label="Atbash" value={atbash(cons)} hebrew />
                  <Stat label="Albam" value={albam(cons)} hebrew />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <SubHead>Gematria twins — same value, other headwords</SubHead>
                    <ul className="space-y-1.5">
                      {twins.map((t) => (
                        <li key={t.strongs} className="flex items-center gap-3 rounded-lg border border-cream/8 px-3 py-2">
                          <span className="font-hebrew text-lg text-cream">{t.cons}</span>
                          <span className="flex-1 text-[12px] text-cream-dim">{t.gloss}</span>
                          <span className="text-[10.5px] text-teal-400/80">{t.strongs}</span>
                        </li>
                      ))}
                      {twins.length === 0 && (
                        <li className="text-[13px] text-cream-dim">
                          No twins in the bundled lexicon subset (the full engine indexes all 8,674).
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <SubHead>Anagrams — same letters, other order</SubHead>
                    <ul className="space-y-1.5">
                      {anagrams.map((a) => (
                        <li key={a.strongs} className="flex items-center gap-3 rounded-lg border border-cream/8 px-3 py-2">
                          <span className="font-hebrew text-lg text-cream">{a.cons}</span>
                          <span className="flex-1 text-[12px] text-cream-dim">{a.gloss}</span>
                          <span className="text-[10.5px] text-teal-400/80">{a.strongs}</span>
                        </li>
                      ))}
                      {anagrams.length === 0 && (
                        <li className="text-[13px] text-cream-dim">
                          No anagram twins in the bundled subset for this word.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-cream-dim">
                Ciphers and gematria run on Hebrew consonants. Switch the query to a Hebrew word
                (בראשית) to see the layer.
              </p>
            )}
          </div>
        )}

        {tab === "graph" && (
          <EnginePane
            engineUp={engineUp}
            engineUrl={engineUrl}
            path="/"
            title="Verse cross-reference graph"
            blurb="Every verse joined to the current verse through the Treasury of Scripture Knowledge graph — centre node gold, Old Testament teal, New Testament coral, edge weight by votes. Genesis 1:1 surfaces John 1:1 as a top edge."
          />
        )}

        {tab === "els" && (
          <EnginePane
            engineUp={engineUp}
            engineUrl={engineUrl}
            path="/?tab=els"
            title="Equidistant letter sequences"
            blurb="Search a consonantal tape for skips: Torah, whole Tanakh, or a single book. Default demo term: תורה."
            caveat="ELS is a microscope, not prophecy. Random books of similar length also produce names and dates at skip distances; Witztum–Rips–Rosenberg did not survive later review."
          />
        )}

        {tab === "method" && (
          <div className="space-y-4 font-serif text-[1.06rem] leading-relaxed text-cream/80">
            <p>
              <strong className="font-sans text-[13px] tracking-widest text-teal-400 uppercase">
                1 · Text layer
              </strong>{" "}
              Public-domain only: King James Version JSON, the Westminster Leningrad Codex from Open
              Scriptures MorphHB, Strong&apos;s lexicon, and OpenBible.info cross-references. Hebrew is
              stored as consonants; vowels and cantillation are display-only; finals are normalised
              (ךםןףץ → כמנפצ). Versification differences are resolved with MorphHB&apos;s VerseMap so
              the Hebrew sits on the verse id you actually see.
            </p>
            <p>
              <strong className="font-sans text-[13px] tracking-widest text-teal-400 uppercase">
                2 · Nested words
              </strong>{" "}
              Consecutive substrings are looked up in the lexicon; single-letter prefixes (ב ה ו כ ל מ ש)
              are allowed; then a dynamic-programming walk finds every full-cover segmentation up to
              four parts. Notarikon is a reading tradition — the tool shows the hits, not a verdict.
            </p>
            <p>
              <strong className="font-sans text-[13px] tracking-widest text-teal-400 uppercase">
                3 · Ciphers
              </strong>{" "}
              Temurah (Atbash, Albam), anagram twins by consonant signature, and gematria twins by
              value (mispar hechrachi). The alphabet is a set of numbers as well as letters; that is
              arithmetic, not doctrine.
            </p>
            <p>
              <strong className="font-sans text-[13px] tracking-widest text-teal-400 uppercase">
                4 · Verse graph
              </strong>{" "}
              ~345,000 weighted edges from the Treasury of Scripture Knowledge, expanded from ranges
              into atomic verse-to-verse links. Click a node and it becomes the new centre.
            </p>
            <p>
              <strong className="font-sans text-[13px] tracking-widest text-teal-400 uppercase">
                5 · Letter codes
              </strong>{" "}
              Concatenate a consonantal tape with a run-length map back to OSIS ids, then scan skip
              distances for a term. Treat the output as a curiosity with a visible caveat, never as
              proof of anything.
            </p>
            <p className="rounded-xl border border-cream/10 bg-ink-950/60 p-4 text-[0.98rem] text-cream-dim">
              Build order: compile the text first, prove one verse end-to-end (Gen.1.1), then the
              lexicon, then the graph, then the codes. The full workbench lives in{" "}
              <code className="rounded bg-cream/10 px-1.5 py-0.5 font-sans text-[12px]">bible-tech/</code>{" "}
              in this repository: <code className="rounded bg-cream/10 px-1.5 py-0.5 font-sans text-[12px]">python3 build_data.py &amp;&amp; python3 server.py</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EnginePane({
  engineUp,
  engineUrl,
  path,
  title,
  blurb,
  caveat,
}: {
  engineUp: boolean;
  engineUrl: string;
  path: string;
  title: string;
  blurb: string;
  caveat?: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <SubHead>{title}</SubHead>
        <p className="mt-2 max-w-3xl font-serif text-[1.05rem] leading-relaxed text-cream/80">{blurb}</p>
      </div>

      {caveat && (
        <p className="rounded-xl border border-coral-400/30 bg-coral-400/10 px-4 py-3 text-[12.5px] leading-relaxed text-coral-400">
          {caveat}
        </p>
      )}

      {engineUp ? (
        <div className="overflow-hidden rounded-xl border border-cream/12">
          <iframe
            src={`${engineUrl}${path}`}
            title={title}
            className="h-[70svh] w-full bg-ink-950"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-cream/12 bg-ink-950/60 p-6">
          <p className="text-[13px] text-cream-dim">
            The {title.toLowerCase()} needs the Bereshit Lab workbench running — it indexes all
            31,102 verses and ~345,000 cross-reference edges, which is too much to ship in the
            browser bundle.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-cream/10 bg-black/50 p-4 font-mono text-[12px] text-teal-300">
{`cd bible-tech
pip install -r requirements.txt
python3 build_data.py      # downloads + compiles data/bible.sqlite
python3 server.py          # serves on 0.0.0.0:8080`}
          </pre>
          <p className="mt-3 text-[12px] text-cream-dim/80">
            Then set <code className="rounded bg-cream/10 px-1.5 py-0.5">NEXT_PUBLIC_BERESHIT_URL</code>{" "}
            and the pane embeds the live engine. Members get unlimited queries.
          </p>
        </div>
      )}
    </div>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold tracking-[0.28em] text-teal-400/90 uppercase">
      {children}
    </p>
  );
}

function Stat({ label, value, hebrew }: { label: string; value: string; hebrew?: boolean }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-ink-950/60 p-4">
      <p className="text-[10px] font-semibold tracking-[0.24em] text-cream-dim uppercase">{label}</p>
      <p className={cn("mt-1 text-2xl text-cream", hebrew && "font-hebrew text-3xl")}>{value}</p>
    </div>
  );
}

/* --------------------------------------------------- lexicon helpers (local) */

function lexiconByValue(value: number, exclude: string) {
  const seen = new Set<string>();
  const out: { strongs: string; cons: string; gloss: string }[] = [];
  for (const entry of ALL_ENTRIES) {
    if (entry.cons === exclude || seen.has(entry.strongs)) continue;
    if (entry.prefix || entry.particle) continue;
    if (gematria(entry.cons) !== value) continue;
    seen.add(entry.strongs);
    out.push(entry);
  }
  return out;
}

function lexiconBySignature(signature: string, exclude: string) {
  const seen = new Set<string>();
  const out: { strongs: string; cons: string; gloss: string }[] = [];
  for (const entry of ALL_ENTRIES) {
    if (entry.cons === exclude || entry.prefix || entry.particle) continue;
    if (entry.cons.length !== signature.length) continue;
    if ([...entry.cons].sort().join("") !== signature) continue;
    if (seen.has(entry.strongs)) continue;
    seen.add(entry.strongs);
    out.push(entry);
  }
  return out;
}
