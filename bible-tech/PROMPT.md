# Bereshit Lab — master prompt

Copy everything below the line. Paste it into an agentic coding model with a filesystem, network, and the ability to run a local web server.

---

You are an expert Bible-software engineer, Hebraist, and full-stack developer. Build a local, production-quality web workbench called **Bereshit Lab** — a Bible Technology engine, not a devotional pamphlet and not a prophecy toy.

Ship a running app. Do not stop at an architecture essay. Default landing verse: **Genesis 1:1**.

---

## What this engine is

Four indexes on one canonical text, always with the plain verse visible before any clever layer:

1. **Nested words** — words inside a word (Hebrew first: בראשית / Bereshit).
2. **Anagrams & ciphers** — temurah (Atbash, Albam), anagrams, gematria twins.
3. **Verse graph** — every verse connected to the current verse via a real cross-reference graph.
4. **Letter codes (ELS)** — equidistant letter sequences, with a visible scholarly caveat.

This is the same stack behind Logos / Accordance / STEP / BibleHub / Torah-code programs, rebuilt from public-domain data.

---

## Non-negotiable rules

- Public-domain / openly licensed texts only. No NIV, ESV, NLT, or other copyrighted translations.
- Hebrew is stored and searched as **consonants**. Vowels and cantillation are display-only.
- Normalize final forms: ךםןףץ → כמנפצ.
- Use OSIS ids (`Gen.1.1`, `1Sam.3.4`, `Song.1.1`).
- Handle WLC↔KJV versification (VerseMap.xml): Genesis 32, Exodus 7–8, Joel, Malachi, Psalm headings, etc.
- The English verse is always on screen before nested words, ciphers, or ELS.
- ELS is a microscope, not prophecy. Put this caveat on the glass: random books of similar length also produce names and dates at skip distances; Witztum–Rips–Rosenberg did not survive later review.
- Pictographic letter meanings are a teaching convention, not linguistic consensus. Label them as such.
- Bind the server to `0.0.0.0`. No `X-Frame-Options: DENY`. No host allowlist that blocks a preview origin.
- Do not claim secret codes, future-telling, or that gematria “proves” doctrine.

---

## Data to download and compile

Download, parse, and compile into SQLite (`data/bible.sqlite`):

| Layer | Source | Notes |
|---|---|---|
| English Bible | KJV JSON, public domain (e.g. thiagobodruk/bible `en_kjv.json`) | 66 Protestant books, 31,102 verses |
| Hebrew Bible | Open Scriptures MorphHB WLC XML (`wlc/*.xml`) | Word-level `lemma`, `morph`, surface forms with `/` morpheme breaks |
| Versification | MorphHB `VerseMap.xml` | Map WLC OSIS → KJV OSIS; store Hebrew on the KJV id the user sees |
| Lexicon | Open Scriptures Strong’s Hebrew JS/JSON | ~8,674 entries: lemma, xlit, pron, strongs_def, kjv_def |
| Cross-refs | OpenBible.info `cross-references.zip` (CC BY 4.0), from Treasury of Scripture Knowledge | ~344,799 edges with vote weights. Keep votes ≥ 1. Expand same-chapter ranges up to 20 verses into atomic edges |
| Letter streams | Derived | Per OT book: consonantal tape + run-length map `[[osis, letter_count], …]` |

Also extract a **KJV vocabulary** (types length ≥ 2) for the English analogue of nested words.

Schema (minimum):

```
books(osis, name, idx, testament, chapters)
verses(osis PK, book, chapter, verse, idx, testament, kjv, he_pointed, he_cons, wlc_osis)
he_words(osis, seq, pointed, cons, lemma, morph)
xrefs(src, dst, dst_raw, votes)  -- indexes on src and dst
lexicon(strongs PK, lemma, cons, xlit, pron, definition, kjv_def)  -- index cons
streams(book PK, stream, map_json_runs)
kjv_vocab(word PK, n)
verse_map(wlc PK, kjv)
```

Compact the stream map as run-length encoding, not one OSIS string per letter.

---

## Algorithms (implement exactly)

### Hebrew consonants
Strip everything outside U+05D0–U+05EA. Translate finals. MorphHB surface `בְּ/רֵאשִׁ֖ית` → cons `בראשית`.

### Nested words (the Bereshit engine)
For input string S (Hebrew or English auto-detect):

**Hebrew**
- Letter cards: name, Hebrew name, teaching pictograph, gematria value.
- Consecutive substrings of length ≥ 1 looked up in Strong’s by consonants. Single-letter prefixes ב ה ו כ ל מ ש are allowed even if not a headword.
- Full-cover **segmentations** (word-break DP / DFS, max 4 parts): every partition of S into lexicon words / prefixes. Classic hits for בראשית must appear:
  - ב + ראשית
  - ברא + שית
  - בר + אש + ית
  - ב + ראש + ית
- Expected consecutive hits for בראשית: ברא created, בר son (Aramaic), ב in, ראשית beginning, ראש head, אש fire, שית to set / thorns, שי gift.
- Gematria of בראשית = **913**.

**English analogue**
- Strip to `[a-z]`. Consecutive spans that exist in the KJV vocabulary. `beginning` → beginning, begin, be, in, gin, inn, …

Clicking a Hebrew token on the current verse loads that token into this engine.

### Anagrams, temurah, gematria
- Index lexicon by sorted consonant signature. Full-word anagrams + subset anagrams (length ≥ 3, host length ≤ 10).
- **Atbash**: א↔ת ב↔ש ג↔ר ד↔ק ה↔צ ו↔פ ז↔ע ח↔ס ט↔נ י↔מ כ↔ל.
- **Albam**: split alphabet, pair halves (א↔ל ב↔מ …).
- **Gematria** (mispar hechrachi): א1 ב2 ג3 ד4 ה5 ו6 ז7 ח8 ט9 י10 כ20 ל30 מ40 נ50 ס60 ע70 פ80 צ90 ק100 ר200 ש300 ת400. Multimap value → other Strong’s headwords (“twins”).

### Verse graph
- On open verse V: top ~40–80 outgoing xrefs by votes, plus incoming “cited by.”
- Join to KJV text, book name, testament.
- Force-directed canvas: centre node gold, OT teal, NT coral, edge thickness ∝ votes.
- Click a node → that verse becomes the new centre (teleport). List panel mirrors the graph.
- Genesis 1:1 must surface **John 1:1–3** as a top-weight edge (“In the beginning was the Word…”).

### ELS
- Hebrew: search Torah (Gen+Exod+Lev+Num+Deut concatenated), whole Tanakh, or a single book.
- English optional: KJV letters-only per book.
- Parameters: term, min skip (default 2), max skip (default 20–30), limit ~40 hits.
- Each hit: skip, start/end OSIS, highlighted context window.
- Default demo term: תורה.
- Caveat banner always visible on this tab.

---

## APIs

Local Flask (or equivalent) on port 8080:

```
GET /api/books
GET /api/verse/<osis>          # kjv, hebrew pointed, words[], prev/next, verse_count
GET /api/chapter/<book>/<n>
GET /api/search?q=             # "John 1:1" or phrase LIKE
GET /api/xrefs/<osis>?limit=   # refs[], incoming[], totals
GET /api/graph/<osis>
GET /api/nested?q=&lang=auto|he|en
GET /api/anagrams?q=
GET /api/els?q=&scope=Torah|Tanakh|<book>&min=&max=&lang=he|en
GET /api/stats
GET /                         # the app
```

Load lexicon, KJV vocab, and letter streams into memory at boot. Hebrew nested-word and anagram queries must feel instant.

---

## UI

Name: **Bereshit Lab**. Subtitle: *Nested words · anagrams · verse graphs · letter codes.*

Aesthetic: night library, leather and gold tooling, not purple-gradient SaaS, not a church flyer.

- Background `#110e0b`, gold `#d4b45a`, cream `#f3ead8`, OT `#7ec8b8`, NT `#e08b7a`
- Fonts: Cormorant Garamond (display), IBM Plex Sans (UI), Frank Ruhl Libre (Hebrew)
- Header + search (`John 1:1` or a phrase)
- Book / chapter / verse picker, prev/next
- Verse card: OSIS label, large RTL Hebrew (each word clickable), KJV serif, token counts
- Tabs: **Verse graph | Words in a word | Anagrams & ciphers | Letter codes | How to build this**
- Graph: canvas constellation + scrollable ranked list with vote counts
- Nested: RTL letter cards (name, pictograph, value) + substring hits + full-cover segmentations. Buttons: `בראשית` and `English: beginning`
- Method tab: teach the four-layer stack so a developer could rebuild it

Copy for the method tab must explain, in this order: text layer → nested words / notarikon / word-break → anagrams/temurah/gematria → TSK verse graph → ELS with statistical caveat → build order.

Footer attributions: KJV public domain; WLC via Open Scriptures MorphHB CC BY 4.0; Strong’s / Open Scriptures; OpenBible.info CC BY 4.0 (Treasury of Scripture Knowledge).

---

## Hebrew letter teaching table (include)

א Aleph — ox / strength / leader — 1  
ב Bet — house / family / inside — 2  
ג Gimel — camel / lift up / generosity — 3  
ד Dalet — door / pathway — 4  
ה He — window / behold / breath — 5  
ו Vav — nail / hook / and / join — 6  
ז Zayin — weapon / cut / nourish — 7  
ח Chet — fence / inner room / life — 8  
ט Tet — basket / surround / good — 9  
י Yod — hand / deed / power — 10  
כ Kaf — palm / cover / allow — 20  
ל Lamed — ox-goad / teach / toward — 30  
מ Mem — water / chaos / mighty — 40  
נ Nun — fish / life / continue — 50  
ס Samekh — prop / support / shield — 60  
ע Ayin — eye / see / fountain — 70  
פ Pe — mouth / speak / open — 80  
צ Tsade — hook / hunt / righteousness — 90  
ק Qof — back of head / holiness — 100  
ר Resh — head / first / person — 200  
ש Shin — teeth / consume / fire — 300  
ת Tav — mark / covenant / sign — 400  

---

## Project layout

```
bible-tech/
  build_data.py      # download-once compile → data/bible.sqlite
  engine.py          # nested words, anagrams, gematria, temurah, ELS
  server.py          # Flask, host 0.0.0.0:8080
  requirements.txt
  README.md
  PROMPT.md          # this prompt
  data/bible.sqlite
  static/index.html
  static/styles.css
  static/app.js
```

Build must print progress. After compile, smoke-test:

- `Gen.1.1` KJV starts “In the beginning God created”
- First Hebrew token cons = `בראשית`, gematria 913
- Nested בראשית returns ברא, ראש, אש, ראשית, and segmentation `ב + ראשית`
- Xrefs for Gen.1.1 include John 1:1 with high votes
- ELS `תורה` on Torah, skips 2–10, returns at least one hit with an OSIS cite
- English nested `beginning` includes begin, be, in

Then start the server and leave it running.

---

## Product voice

Scholarly, precise, slightly nocturnal. No hype about hidden predictions. No mockery of people who love these methods. Show the instrument, show the hit, show the limit.

When Genesis 1:1 opens, the first thing the user should feel is: the Bible is a graph, and בראשית is a lock with more than one key.
