# Bereshit Lab — Bible Technology engine

Four indexes on one canonical text, rebuilt from public-domain data:

1. **Nested words** — words inside a word (Hebrew first: בראשית → ב + ראשית)
2. **Anagrams, temurah & gematria** — Atbash, Albam, anagram twins, gematria twins
3. **Verse graph** — the Treasury of Scripture Knowledge cross-reference graph
4. **Letter codes (ELS)** — equidistant letter sequences, with the scholarly caveat on screen

The English verse is always shown before any clever layer. ELS is a microscope, not a prophecy
machine. Pictographic letter meanings are a teaching convention, not linguistic consensus.

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python3 build_data.py      # download once, compile data/bible.sqlite
python3 server.py          # http://0.0.0.0:8080
```

`build_data.py` downloads repository tarballs from GitHub (codeload), extracts only the files it
needs, deletes the tarball, and compiles SQLite. Expect ≈70 MB for the database; the raw download is
trimmed as it goes. Use `--only kjv lexicon` for a partial rebuild, `--force` to re-download.

## What gets compiled

| Layer | Source | Result |
|---|---|---|
| English Bible | thiagobodruk/bible `en_kjv.json` (public domain) | 66 books, 31,102 verses |
| Hebrew Bible | Open Scriptures MorphHB WLC XML (CC BY 4.0) | 306,785 words with lemma + morph |
| Versification | MorphHB `VerseMap.xml` | 1,978 WLC → KJV mappings applied |
| Lexicon | Open Scriptures Strong's Hebrew | 8,674 entries, indexed by consonants |
| Cross-refs | OpenBible.info TSK dataset (CC BY 4.0) | 429,941 weighted edges |
| Letter streams | derived | 39 consonantal tapes + run-length OSIS maps |
| KJV vocabulary | derived | 12,458 types (length ≥ 2) |

## API

```
GET /api/books
GET /api/verse/<osis>              # kjv, pointed Hebrew, words[], prev/next
GET /api/chapter/<book>/<n>
GET /api/search?q=                 # "John 1:1" or a phrase
GET /api/xrefs/<osis>?limit=
GET /api/graph/<osis>              # nodes + links for the canvas
GET /api/nested?q=&lang=auto|he|en
GET /api/anagrams?q=
GET /api/els?q=&scope=Torah|Tanakh|<book>&min=&max=&lang=he|en
GET /api/strongs/<code>
GET /api/stats
GET /                              # the workbench UI
```

## Smoke tests that must pass

```
✓ Gen.1.1 KJV starts “In the beginning God created”
✓ first Hebrew token of Gen.1.1 is בראשית, gematria 913
✓ nested בראשית returns ברא · ראש · אש · ראשית and segmentation ב + ראשית
✓ Gen.1.1 xrefs include John 1:1 (42 votes)
✓ ELS תורה over Torah, skips 2–10, returns hits with OSIS citations
✓ English nested “beginning” includes begin, be, in
```

## Fitting it into the platform

The Bible Secrets site embeds this workbench on `/bible-technology`. Set
`NEXT_PUBLIC_BERESHIT_URL` in the platform's `.env.local` and the pane live-embeds it; members get
unlimited queries, and the engine is included for the first 90 days of membership.

## Attribution

- King James Version — public domain.
- Westminster Leningrad Codex via Open Scriptures **MorphHB** — CC BY 4.0.
- Strong's dictionaries via **Open Scriptures**.
- Cross-references from **OpenBible.info** — CC BY 4.0, derived from the Treasury of Scripture
  Knowledge (mirrored at `neuu-org/bible-crossrefs-dataset`).
