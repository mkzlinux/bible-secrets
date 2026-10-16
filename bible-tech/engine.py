#!/usr/bin/env python3
"""
Bereshit Lab — the engine.

Four indexes on one canonical text:
  1. nested words   — words inside a word (Hebrew first, English analogue)
  2. anagrams/ciphers — temurah (Atbash, Albam), anagram twins, gematria twins
  3. verse graph    — the Treasury of Scripture Knowledge cross-reference graph
  4. letter codes   — equidistant letter sequences, with the caveat on the glass

Hebrew is handled as consonants everywhere: vowels and cantillation are display
only, and final forms are normalised (ךםןףץ → כמנפצ).
"""

from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "bible.sqlite"

HEBREW = re.compile(r"[\u05d0-\u05ea]")
FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}

LETTER_TABLE = [
    ("א", "Aleph", "ox / strength / leader", 1, "ת"),
    ("ב", "Bet", "house / family / inside", 2, "ש"),
    ("ג", "Gimel", "camel / lift up / generosity", 3, "ר"),
    ("ד", "Dalet", "door / pathway", 4, "ק"),
    ("ה", "He", "window / behold / breath", 5, "צ"),
    ("ו", "Vav", "nail / hook / and / join", 6, "פ"),
    ("ז", "Zayin", "weapon / cut / nourish", 7, "ע"),
    ("ח", "Chet", "fence / inner room / life", 8, "ס"),
    ("ט", "Tet", "basket / surround / good", 9, "נ"),
    ("י", "Yod", "hand / deed / power", 10, "מ"),
    ("כ", "Kaf", "palm / cover / allow", 20, "ל"),
    ("ל", "Lamed", "ox-goad / teach / toward", 30, "כ"),
    ("מ", "Mem", "water / chaos / mighty", 40, "י"),
    ("נ", "Nun", "fish / life / continue", 50, "ט"),
    ("ס", "Samekh", "prop / support / shield", 60, "ח"),
    ("ע", "Ayin", "eye / see / fountain", 70, "ז"),
    ("פ", "Pe", "mouth / speak / open", 80, "ו"),
    ("צ", "Tsade", "hook / hunt / righteousness", 90, "ה"),
    ("ק", "Qof", "back of head / holiness", 100, "ד"),
    ("ר", "Resh", "head / first / person", 200, "ג"),
    ("ש", "Shin", "teeth / consume / fire", 300, "ב"),
    ("ת", "Tav", "mark / covenant / sign", 400, "א"),
]
LETTER_BY_CHAR = {row[0]: row for row in LETTER_TABLE}
ALBAM = {}
_half = len(LETTER_TABLE) // 2
for _i in range(_half):
    ALBAM[LETTER_TABLE[_i][0]] = LETTER_TABLE[_i + _half][0]
    ALBAM[LETTER_TABLE[_i + _half][0]] = LETTER_TABLE[_i][0]

PREFIXES = set("בהוכלמש")
TORAH = ("Gen", "Exod", "Lev", "Num", "Deut")


def consonants(text: str) -> str:
    """Keep Hebrew consonants only, translating final forms."""
    return "".join(FINALS.get(ch, ch) for ch in text if HEBREW.match(ch))


def is_hebrew(text: str) -> bool:
    return bool(HEBREW.search(text))


@dataclass
class Entry:
    strongs: str
    cons: str
    lemma: str
    xlit: str
    gloss: str


@dataclass
class Hit:
    text: str
    start: int
    entries: list[Entry] = field(default_factory=list)


@dataclass
class Segmentation:
    words: list[str]
    glosses: list[str]


def gematria(consonants_text: str) -> int:
    return sum(LETTER_BY_CHAR[ch][3] for ch in consonants_text if ch in LETTER_BY_CHAR)


class Engine:
    """Loads the compiled indexes into memory at boot."""

    def __init__(self, db_path: Path = DB_PATH) -> None:
        if not db_path.exists():
            raise SystemExit(
                f"{db_path} is missing — run `python3 build_data.py` first."
            )
        self.con = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, check_same_thread=False)
        self.con.row_factory = sqlite3.Row
        self._load_lexicon()
        self._load_vocab()
        self._load_streams()
        self._load_verses()

    # ------------------------------------------------------------- loading
    def _load_lexicon(self) -> None:
        self.lexicon: dict[str, list[Entry]] = {}
        self.by_value: dict[int, list[Entry]] = {}
        self.by_signature: dict[str, list[Entry]] = {}
        self.strongs: dict[str, Entry] = {}
        for row in self.con.execute(
            "SELECT strongs, lemma, cons, xlit, definition, kjv_def FROM lexicon WHERE cons <> ''"
        ):
            entry = Entry(
                strongs=row["strongs"],
                cons=row["cons"],
                lemma=row["lemma"],
                xlit=row["xlit"],
                gloss=(row["kjv_def"] or row["definition"] or "").split(";")[0].strip()[:90],
            )
            self.lexicon.setdefault(entry.cons, []).append(entry)
            self.strongs[entry.strongs] = entry
            if len(entry.cons) >= 2:
                self.by_value.setdefault(gematria(entry.cons), []).append(entry)
                self.by_signature.setdefault("".join(sorted(entry.cons)), []).append(entry)

    def _load_vocab(self) -> None:
        self.vocab = {row[0] for row in self.con.execute("SELECT word FROM kjv_vocab")}

    def _load_streams(self) -> None:
        self.streams: dict[str, tuple[str, list[list]]] = {}
        for row in self.con.execute("SELECT book, stream, map_json_runs FROM streams"):
            self.streams[row[0]] = (row[1], json.loads(row[2]))

    def _load_verses(self) -> None:
        self.verses = {
            row["osis"]: row
            for row in self.con.execute(
                "SELECT osis, book, chapter, verse, kjv, he_pointed, he_cons, wlc_osis, testament FROM verses"
            )
        }

    # ---------------------------------------------------------------- verse
    def verse(self, osis: str) -> dict | None:
        row = self.verses.get(osis)
        if not row:
            return None
        words = [
            {
                "seq": w["seq"],
                "pointed": w["pointed"],
                "cons": w["cons"],
                "lemma": w["lemma"],
                "morph": w["morph"],
                "strongs": [
                    part.split("/")[-1]
                    for part in (w["lemma"] or "").split()
                    if part.split("/")[-1]
                ],
            }
            for w in self.con.execute(
                "SELECT seq, pointed, cons, lemma, morph FROM he_words WHERE osis=? ORDER BY seq",
                (osis,),
            )
        ]
        prev_osis, next_osis = self._neighbours(osis)
        return {
            "osis": osis,
            "book": row["book"],
            "chapter": row["chapter"],
            "verse": row["verse"],
            "testament": row["testament"],
            "kjv": row["kjv"],
            "he_pointed": row["he_pointed"],
            "he_cons": row["he_cons"],
            "wlc_osis": row["wlc_osis"],
            "words": words,
            "prev": prev_osis,
            "next": next_osis,
            "verse_count": len(self.verses),
        }

    def _neighbours(self, osis: str) -> tuple[str | None, str | None]:
        row = self.con.execute(
            "SELECT osis FROM verses WHERE idx = (SELECT idx-1 FROM verses WHERE osis=?)",
            (osis,),
        ).fetchone()
        prev_osis = row[0] if row else None
        row = self.con.execute(
            "SELECT osis FROM verses WHERE idx = (SELECT idx+1 FROM verses WHERE osis=?)",
            (osis,),
        ).fetchone()
        return prev_osis, (row[0] if row else None)

    def chapter(self, book: str, chapter: int) -> list[dict]:
        return [
            dict(row)
            for row in self.con.execute(
                "SELECT osis, verse, kjv, he_cons FROM verses WHERE book=? AND chapter=? ORDER BY verse",
                (book, chapter),
            )
        ]

    def books(self) -> list[dict]:
        return [
            dict(row)
            for row in self.con.execute(
                "SELECT osis, name, idx, testament, chapters FROM books ORDER BY idx"
            )
        ]

    def search(self, query: str, limit: int = 40) -> list[dict]:
        ref = re.match(r"^\s*([1-3]?\s?[A-Za-z]+)\s*(\d+)\s*[:.]\s*(\d+)\s*$", query)
        if ref:
            book_raw, chapter, verse = ref.groups()
            osis_book = self._resolve_book(book_raw)
            if osis_book:
                osis = f"{osis_book}.{int(chapter)}.{int(verse)}"
                found = self.verse(osis)
                return [found] if found else []
        like = f"%{query.strip()}%"
        return [
            dict(row)
            for row in self.con.execute(
                "SELECT osis, kjv FROM verses WHERE kjv LIKE ? ORDER BY idx LIMIT ?",
                (like, limit),
            )
        ]

    def _resolve_book(self, raw: str) -> str | None:
        key = re.sub(r"[^a-z0-9]", "", raw.lower())
        for row in self.books():
            if re.sub(r"[^a-z0-9]", "", row["name"].lower()).startswith(key) or row["osis"].lower() == key:
                return row["osis"]
        aliases = {"psalm": "Ps", "psalms": "Ps", "songofsolomon": "Song", "canticles": "Song",
                   "revelation": "Rev", "revelations": "Rev", "1john": "1John"}
        return aliases.get(key)

    # ------------------------------------------------------- nested words
    def nested(self, query: str, lang: str = "auto") -> dict:
        hebrew = is_hebrew(query) if lang in {"auto", "he"} else False
        if hebrew:
            cons = consonants(query)
            return {
                "lang": "he",
                "input": query,
                "consonants": cons,
                "letters": [
                    {
                        "char": ch,
                        "name": LETTER_BY_CHAR[ch][1] if ch in LETTER_BY_CHAR else ch,
                        "pictograph": LETTER_BY_CHAR[ch][2] if ch in LETTER_BY_CHAR else "",
                        "value": LETTER_BY_CHAR[ch][3] if ch in LETTER_BY_CHAR else 0,
                    }
                    for ch in cons
                ],
                "gematria": gematria(cons),
                "hits": self.hebrew_hits(cons),
                "segmentations": [s.__dict__ for s in self.segmentations(cons)],
            }

        clean = re.sub(r"[^a-z]", "", query.lower())
        return {
            "lang": "en",
            "input": query,
            "consonants": clean,
            "letters": [],
            "gematria": 0,
            "hits": [
                {"text": text, "start": start, "entries": [{"gloss": "KJV vocabulary"}]}
                for text, start in self.english_hits(clean)
            ][:60],
            "segmentations": [
                {"words": words, "glosses": ["KJV vocabulary"] * len(words)}
                for words in self.english_segmentations(clean)
            ],
        }

    def hebrew_hits(self, cons: str) -> list[dict]:
        hits: list[dict] = []
        for start in range(len(cons)):
            for length in range(1, len(cons) - start + 1):
                text = cons[start : start + length]
                entries = self.lexicon.get(text)
                if entries:
                    hits.append(
                        {
                            "text": text,
                            "start": start,
                            "entries": [
                                {"strongs": e.strongs, "xlit": e.xlit, "gloss": e.gloss}
                                for e in entries
                            ],
                        }
                    )
                elif length == 1 and text in PREFIXES:
                    hits.append(
                        {
                            "text": text,
                            "start": start,
                            "entries": [{"strongs": "", "xlit": text, "gloss": "prefix"}],
                        }
                    )
        hits.sort(key=lambda h: (h["start"], -len(h["text"])))
        return hits

    def segmentations(self, cons: str, max_parts: int = 4, limit: int = 24) -> list[Segmentation]:
        found: dict[str, Segmentation] = {}

        def walk(start: int, words: list[str], glosses: list[str]) -> None:
            if len(found) > 500:
                return
            if start == len(cons):
                if len(words) > 1:
                    found.setdefault("+".join(words), Segmentation(words, glosses))
                return
            if len(words) >= max_parts:
                return
            for end in range(start + 1, len(cons) + 1):
                slice_text = cons[start:end]
                entries = self.lexicon.get(slice_text)
                if entries:
                    entry = entries[0]
                    walk(end, words + [slice_text], glosses + [entry.gloss or entry.xlit or entry.strongs])
                elif len(slice_text) == 1 and slice_text in PREFIXES:
                    walk(end, words + [slice_text], glosses + ["prefix"])

        walk(0, [], [])

        def strength(seg: Segmentation) -> tuple[int, int]:
            headwords = sum(1 for gloss in seg.glosses if gloss != "prefix")
            return (-headwords, len(seg.words))

        return sorted(found.values(), key=strength)[:limit]

    def english_hits(self, clean: str) -> list[tuple[str, int]]:
        out: list[tuple[str, int]] = []
        for start in range(len(clean)):
            for end in range(start + 2, len(clean) + 1):
                slice_text = clean[start:end]
                if slice_text in self.vocab:
                    out.append((slice_text, start))
        out.sort(key=lambda item: (item[1], -len(item[0])))
        return out

    def english_segmentations(self, clean: str, max_parts: int = 4, limit: int = 12) -> list[list[str]]:
        found: list[list[str]] = []

        def walk(start: int, words: list[str]) -> None:
            if len(found) > 60:
                return
            if start == len(clean):
                if len(words) > 1:
                    found.append(words)
                return
            if len(words) >= max_parts:
                return
            for end in range(start + 2, len(clean) + 1):
                slice_text = clean[start:end]
                if slice_text in self.vocab:
                    walk(end, words + [slice_text])

        walk(0, [])
        seen: set[str] = set()
        out = []
        for words in sorted(found, key=len):
            key = "+".join(words)
            if key not in seen:
                seen.add(key)
                out.append(words)
            if len(out) >= limit:
                break
        return out

    # ------------------------------------------------------------ ciphers
    def ciphers(self, query: str) -> dict:
        cons = consonants(query)
        if not cons:
            return {"error": "Give me a Hebrew word."}

        def atbash(text: str) -> str:
            return "".join(LETTER_BY_CHAR[ch][4] if ch in LETTER_BY_CHAR else ch for ch in text)

        def albam(text: str) -> str:
            return "".join(ALBAM.get(ch, ch) for ch in text)

        value = gematria(cons)
        signature = "".join(sorted(cons))
        twins = [
            {"strongs": e.strongs, "cons": e.cons, "xlit": e.xlit, "gloss": e.gloss}
            for e in self.by_value.get(value, [])
            if e.cons != cons
        ][:40]
        anagrams = [
            {"strongs": e.strongs, "cons": e.cons, "xlit": e.xlit, "gloss": e.gloss}
            for e in self.by_signature.get(signature, [])
            if e.cons != cons
        ][:40]

        return {
            "input": query,
            "consonants": cons,
            "gematria": value,
            "atbash": atbash(cons),
            "albam": albam(cons),
            "twins": twins,
            "anagrams": anagrams,
        }

    # --------------------------------------------------------- verse graph
    def xrefs(self, osis: str, limit: int = 80) -> dict:
        outgoing = [
            {
                "osis": row["dst"],
                "votes": row["votes"],
                "kjv": (self.verses[row["dst"]]["kjv"] if row["dst"] in self.verses else None),
                "book": (self.verses[row["dst"]]["book"] if row["dst"] in self.verses else None),
                "testament": (self.verses[row["dst"]]["testament"] if row["dst"] in self.verses else None),
            }
            for row in self.con.execute(
                "SELECT dst, votes FROM xrefs WHERE src=? ORDER BY votes DESC LIMIT ?",
                (osis, limit),
            )
        ]
        incoming = [
            {
                "osis": row["src"],
                "votes": row["votes"],
                "kjv": (self.verses[row["src"]]["kjv"] if row["src"] in self.verses else None),
                "book": (self.verses[row["src"]]["book"] if row["src"] in self.verses else None),
                "testament": (self.verses[row["src"]]["testament"] if row["src"] in self.verses else None),
            }
            for row in self.con.execute(
                "SELECT src, votes FROM xrefs WHERE dst=? ORDER BY votes DESC LIMIT ?",
                (osis, limit),
            )
        ]
        totals = self.con.execute(
            "SELECT (SELECT COUNT(*) FROM xrefs WHERE src=?), (SELECT COUNT(*) FROM xrefs WHERE dst=?)",
            (osis, osis),
        ).fetchone()
        return {
            "osis": osis,
            "refs": outgoing,
            "incoming": incoming,
            "totals": {"outgoing": totals[0], "incoming": totals[1]},
        }

    def graph(self, osis: str, limit: int = 40) -> dict:
        data = self.xrefs(osis, limit)
        centre = self.verses.get(osis)
        nodes = [
            {
                "osis": osis,
                "label": osis,
                "testament": centre["testament"] if centre else "OT",
                "centre": True,
            }
        ]
        links = []
        for ref in data["refs"]:
            nodes.append(
                {"osis": ref["osis"], "label": ref["osis"], "testament": ref["testament"] or "OT"}
            )
            links.append({"source": osis, "target": ref["osis"], "votes": ref["votes"]})
        return {"nodes": nodes, "links": links, "totals": data["totals"]}

    # --------------------------------------------------------- letter codes
    def els(self, term: str, scope: str = "Torah", min_skip: int = 2, max_skip: int = 30,
            limit: int = 40, lang: str = "he") -> dict:
        if lang == "en":
            tape, mapping = self._english_tape(scope)
            needle = re.sub(r"[^a-z]", "", term.lower())
            letters = list(tape)
        else:
            tape, mapping = self._hebrew_tape(scope)
            needle = consonants(term)
            letters = list(tape)

        if not needle or not trade_ok(needle, letters):
            return {
                "term": term,
                "scope": scope,
                "hits": [],
                "tape_length": len(letters),
                "caveat": ELS_CAVEAT,
                "note": "No hits at these skip distances.",
            }

        hits = []
        for skip in range(min_skip, max_skip + 1):
            for start in range(0, max(1, len(letters) - skip * len(needle))):
                if all(letters[start + skip * i] == needle[i] for i in range(len(needle))):
                    end = start + skip * (len(needle) - 1)
                    hits.append(
                        {
                            "skip": skip,
                            "direction": "forward",
                            "start_osis": self._osis_at(mapping, start),
                            "end_osis": self._osis_at(mapping, end),
                            "context": tape[max(0, start - 24) : end + 25],
                            "context_start": max(0, start - 24),
                            "letters": [start + skip * i for i in range(len(needle))],
                        }
                    )
                    if len(hits) >= limit:
                        break
            if len(hits) >= limit:
                break

        return {
            "term": term,
            "scope": scope,
            "lang": lang,
            "hits": hits,
            "tape_length": len(letters),
            "caveat": ELS_CAVEAT,
        }

    def _hebrew_tape(self, scope: str) -> tuple[str, list[list]]:
        books = [b for b in self.streams] if scope in {"Tanakh", "all"} else (
            list(TORAH) if scope == "Torah" else [scope]
        )
        tape_parts: list[str] = []
        mapping: list[list] = []
        offset = 0
        for book in books:
            entry = self.streams.get(book)
            if not entry:
                continue
            stream, runs = entry
            tape_parts.append(stream)
            for osis, length in runs:
                mapping.append([offset, offset + length, osis])
                offset += length
        mapping.sort(key=lambda m: m[0])
        return "".join(tape_parts), mapping

    def _english_tape(self, scope: str) -> tuple[str, list[list]]:
        rows = self.con.execute(
            "SELECT osis, kjv, book FROM verses ORDER BY idx"
        ).fetchall()
        tape_parts: list[str] = []
        mapping: list[list] = []
        offset = 0
        for row in rows:
            if scope not in {"KJV", "all"} and row["book"] != scope:
                continue
            text = re.sub(r"[^a-z]", "", (row["kjv"] or "").lower())
            if not text:
                continue
            tape_parts.append(text)
            mapping.append([offset, offset + len(text), row["osis"]])
            offset += len(text)
        return "".join(tape_parts), mapping

    @staticmethod
    def _osis_at(mapping: list[list], index: int) -> str | None:
        lo, hi = 0, len(mapping) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            start, end, osis = mapping[mid]
            if index < start:
                hi = mid - 1
            elif index >= end:
                lo = mid + 1
            else:
                return osis
        return None

    # ---------------------------------------------------------------- stats
    def stats(self) -> dict:
        counts = {
            "verses": self.con.execute("SELECT COUNT(*) FROM verses").fetchone()[0],
            "hebrew_words": self.con.execute("SELECT COUNT(*) FROM he_words").fetchone()[0],
            "lexicon": self.con.execute("SELECT COUNT(*) FROM lexicon").fetchone()[0],
            "xrefs": self.con.execute("SELECT COUNT(*) FROM xrefs").fetchone()[0],
            "vocab": self.con.execute("SELECT COUNT(*) FROM kjv_vocab").fetchone()[0],
            "streams": self.con.execute("SELECT COUNT(*) FROM streams").fetchone()[0],
            "books": self.con.execute("SELECT COUNT(*) FROM books").fetchone()[0],
        }
        meta = {
            row["key"]: row["value"] for row in self.con.execute("SELECT key, value FROM meta")
        }
        return {"counts": counts, "meta": meta, "name": "Bereshit Lab"}

    def strongs_entry(self, code: str) -> dict | None:
        entry = self.strongs.get(code if code.startswith("H") else f"H{code}")
        return entry.__dict__ if entry else None


def trade_ok(needle: str, letters: list[str]) -> bool:
    """Cheap guard: every letter of the term must exist in the tape."""
    present = set(letters)
    return all(ch in present for ch in needle)


ELS_CAVEAT = (
    "ELS is a microscope, not prophecy. Random books of similar length also produce "
    "names and dates at skip distances; Witztum–Rips–Rosenberg did not survive later review."
)


@lru_cache(maxsize=1)
def engine() -> Engine:
    return Engine()


if __name__ == "__main__":  # quick manual poke
    eng = engine()
    result = eng.nested("בראשית")
    print("consonants:", result["consonants"], "gematria:", result["gematria"])
    print("segmentations:", [s["words"] for s in result["segmentations"]][:8])
    print("xrefs for Gen.1.1 ->", [r["osis"] for r in eng.xrefs("Gen.1.1", 5)["refs"]])
    els = eng.els("תורה", "Torah", 2, 10)
    print("ELS hits:", [(h["skip"], h["start_osis"]) for h in els["hits"][:5]])
