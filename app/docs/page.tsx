import Link from "next/link";

export const metadata = { title: "Build notes" };

const SECTIONS: { heading: string; body: React.ReactNode }[] = [
  {
    heading: "1 · The text layer",
    body: (
      <>
        Public domain only. English: King James Version (31,102 verses). Hebrew: the Westminster
        Leningrad Codex via Open Scriptures MorphHB, word by word with lemma and morphology.
        Lexicon: Open Scriptures Strong&apos;s Hebrew dictionary (8,674 entries). Cross-references:
        the Treasury of Scripture Knowledge dataset published by OpenBible.info (CC BY 4.0).
        Versification differences ride on MorphHB&apos;s VerseMap so Hebrew sits on the KJV verse id
        the reader actually sees. Hebrew is stored as consonants; vowels and cantillation are
        display-only; final forms are normalised (ךםןףץ → כמנפצ).
      </>
    ),
  },
  {
    heading: "2 · Words inside a word",
    body: (
      <>
        Consecutive substrings of the query are looked up in the lexicon — בראשית yields ברא, ראש,
        אש, ראשית, שית and שי. Single-letter prefixes (ב ה ו כ ל מ ש) are allowed even though they are
        not headwords. Then a depth-first walk finds every full-cover segmentation up to four parts,
        which is what surfaces ב + ראשית, ברא + שית and בר + אש + ית. Notarikon is a reading
        tradition: the instrument shows the hits, not a verdict.
      </>
    ),
  },
  {
    heading: "3 · Anagrams, temurah and gematria",
    body: (
      <>
        The lexicon is indexed by sorted consonant signature for anagram twins and by mispar
        hechrachi value for gematria twins (בראשית = 913). Atbash (א↔ת ב↔ש …) and Albam (the alphabet
        split in half and paired across) are implemented letter-for-letter. Arithmetic is arithmetic —
        it does not prove doctrine.
      </>
    ),
  },
  {
    heading: "4 · The verse graph",
    body: (
      <>
        Weighted edges from the Treasury of Scripture Knowledge, with same-chapter ranges expanded
        into atomic verse-to-verse links. Genesis 1:1 links to John 1:1 at high weight; the graph
        view colours the centre node gold, the Old Testament teal and the New Testament coral, with
        edge thickness proportional to votes. Clicking a node teleports the centre.
      </>
    ),
  },
  {
    heading: "5 · Letter codes (ELS)",
    body: (
      <>
        Per book, a consonantal tape is stored with a run-length map back to OSIS ids, so a hit can
        be cited to a verse instead of a letter offset. The scan walks skip distances over Torah,
        the whole Tanakh, or a single book. The caveat is permanent and on the glass: random books of
        similar length also produce names and dates at skip distances, and Witztum–Rips–Rosenberg did
        not survive later review.
      </>
    ),
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-20 md:px-10 md:pt-36">
      <p className="text-[10.5px] font-semibold tracking-[0.34em] text-teal-400 uppercase">
        Build notes
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-[42px]">
        How Bible Secrets and Bereshit Lab are put together
      </h1>
      <p className="mt-5 font-serif text-[1.15rem] leading-relaxed text-cream/80">
        Two halves: a cinematic publishing platform for the ministry&apos;s series and volumes, and a
        Bible-technology workbench that indexes the text four ways. Both are in this repository.
      </p>

      <section className="mt-10 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
            <h2 className="font-display text-lg font-bold text-cream">{section.heading}</h2>
            <p className="mt-3 font-serif text-[1.06rem] leading-relaxed text-cream/80">
              {section.body}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
        <h2 className="font-display text-lg font-bold text-cream">Running it</h2>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-cream/10 bg-black/60 p-4 font-mono text-[12px] text-teal-300">
{`# 1 · the platform
npm install
npm run dev                 # http://localhost:3000

# 2 · the Bible Technology engine
cd bible-tech
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
python3 build_data.py       # compiles data/bible.sqlite (~2 min, ~70 MB)
python3 server.py           # http://127.0.0.1:8080

# 3 · give the site the engine address
echo "BERESHIT_URL=http://127.0.0.1:8080" >> .env.local`}
        </pre>
        <p className="mt-4 text-[12.5px] leading-relaxed text-cream-dim">
          Adding Supabase keys moves auth, books, storage and reader data onto Postgres
          (<code className="rounded bg-cream/10 px-1.5 py-0.5">supabase/schema.sql</code> is the
          whole schema plus row-level security). Adding Paystack keys turns the 90-day trial into a
          real checkout.
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
        <h2 className="font-display text-lg font-bold text-cream">Access model</h2>
        <ul className="mt-3 space-y-2 font-serif text-[1.06rem] leading-relaxed text-cream/80">
          <li>· ~40% of every series is public: no account, no email, no friction.</li>
          <li>· Signing in opens the whole vault for 90 days.</li>
          <li>· After that, a small key fee (or an admin grant) keeps it open; a coffee always helps.</li>
          <li>· Vault PDFs are never exposed: they stream through an entitlement-checked route.</li>
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/bible-technology" className="btn btn-gold text-sm">
          Back to the engine
        </Link>
        <Link href="/series" className="btn btn-ghost text-sm">
          Browse the library
        </Link>
      </div>
    </div>
  );
}
