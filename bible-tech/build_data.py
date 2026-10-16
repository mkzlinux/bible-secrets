#!/usr/bin/env python3
"""
Bereshit Lab — download-once compiler.

Builds `data/bible.sqlite` from public-domain / openly licensed sources only:

  English Bible  KJV JSON (thiagobodruk/bible, public domain)
  Hebrew Bible   Westminster Leningrad Codex via Open Scriptures MorphHB (CC BY 4.0)
  Versification  MorphHB VerseMap.xml (WLC → KJV ids)
  Lexicon        Open Scriptures Strong's Hebrew dictionary
  Cross-refs     OpenBible.info TSK dataset (CC BY 4.0), mirrored at
                 neuu-org/bible-crossrefs-dataset (data/00_raw/openbible)
  Letter streams derived: per OT book consonantal tape + run-length OSIS map

Usage:
  python3 build_data.py                 # everything
  python3 build_data.py --only kjv xrefs
  python3 build_data.py --force         # re-download raw files
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sqlite3
import sys
import tarfile
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "data" / "raw"
DB_PATH = ROOT / "data" / "bible.sqlite"

SOURCES = {
    "kjv": (
        "https://codeload.github.com/thiagobodruk/bible/tar.gz/refs/heads/master",
        "bible-master/json/en_kjv.json",
    ),
    "xrefs": (
        "https://codeload.github.com/neuu-org/bible-crossrefs-dataset/tar.gz/refs/heads/main",
        "data/00_raw/openbible/cross_references.txt",
    ),
    "morphhb": (
        "https://codeload.github.com/openscriptures/morphhb/tar.gz/refs/heads/master",
        "wlc/",
    ),
    "strongs": (
        "https://codeload.github.com/openscriptures/strongs/tar.gz/refs/heads/master",
        "hebrew/strongs-hebrew-dictionary.js",
    ),
}

# Canonical Protestant order → OSIS ids + display names.
BOOKS = [
    ("Gen", "Genesis", "OT"), ("Exod", "Exodus", "OT"), ("Lev", "Leviticus", "OT"),
    ("Num", "Numbers", "OT"), ("Deut", "Deuteronomy", "OT"), ("Josh", "Joshua", "OT"),
    ("Judg", "Judges", "OT"), ("Ruth", "Ruth", "OT"), ("1Sam", "1 Samuel", "OT"),
    ("2Sam", "2 Samuel", "OT"), ("1Kgs", "1 Kings", "OT"), ("2Kgs", "2 Kings", "OT"),
    ("1Chr", "1 Chronicles", "OT"), ("2Chr", "2 Chronicles", "OT"), ("Ezra", "Ezra", "OT"),
    ("Neh", "Nehemiah", "OT"), ("Esth", "Esther", "OT"), ("Job", "Job", "OT"),
    ("Ps", "Psalms", "OT"), ("Prov", "Proverbs", "OT"), ("Eccl", "Ecclesiastes", "OT"),
    ("Song", "Song of Solomon", "OT"), ("Isa", "Isaiah", "OT"), ("Jer", "Jeremiah", "OT"),
    ("Lam", "Lamentations", "OT"), ("Ezek", "Ezekiel", "OT"), ("Dan", "Daniel", "OT"),
    ("Hos", "Hosea", "OT"), ("Joel", "Joel", "OT"), ("Amos", "Amos", "OT"),
    ("Obad", "Obadiah", "OT"), ("Jonah", "Jonah", "OT"), ("Mic", "Micah", "OT"),
    ("Nah", "Nahum", "OT"), ("Hab", "Habakkuk", "OT"), ("Zeph", "Zephaniah", "OT"),
    ("Hag", "Haggai", "OT"), ("Zech", "Zechariah", "OT"), ("Mal", "Malachi", "OT"),
    ("Matt", "Matthew", "NT"), ("Mark", "Mark", "NT"), ("Luke", "Luke", "NT"),
    ("John", "John", "NT"), ("Acts", "Acts", "NT"), ("Rom", "Romans", "NT"),
    ("1Cor", "1 Corinthians", "NT"), ("2Cor", "2 Corinthians", "NT"), ("Gal", "Galatians", "NT"),
    ("Eph", "Ephesians", "NT"), ("Phil", "Philippians", "NT"), ("Col", "Colossians", "NT"),
    ("1Thess", "1 Thessalonians", "NT"), ("2Thess", "2 Thessalonians", "NT"),
    ("1Tim", "1 Timothy", "NT"), ("2Tim", "2 Timothy", "NT"), ("Titus", "Titus", "NT"),
    ("Phlm", "Philemon", "NT"), ("Heb", "Hebrews", "NT"), ("Jas", "James", "NT"),
    ("1Pet", "1 Peter", "NT"), ("2Pet", "2 Peter", "NT"), ("1John", "1 John", "NT"),
    ("2John", "2 John", "NT"), ("3John", "3 John", "NT"), ("Jude", "Jude", "NT"),
    ("Rev", "Revelation", "NT"),
]
OSIS_INDEX = {code: i for i, (code, _, _) in enumerate(BOOKS)}
NAME_BY_OSIS = {code: name for code, name, _ in BOOKS}

HEBREW = re.compile(r"[\u05d0-\u05ea]")
FINALS = {"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"}
PREFIXES = set("בהוכלמש")


def log(message: str) -> None:
    print(f"[build] {message}", flush=True)


def download(url: str, dest: Path, force: bool = False) -> None:
    if dest.exists() and not force and dest.stat().st_size > 0:
        log(f"cached {dest.name} ({dest.stat().st_size // 1024} KB)")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    log(f"downloading {url}")
    started = time.time()
    with urllib.request.urlopen(url, timeout=600) as response, open(dest, "wb") as handle:
        while chunk := response.read(1 << 20):
            handle.write(chunk)
    log(f"saved {dest.name} ({dest.stat().st_size // 1024} KB in {time.time() - started:.0f}s)")


def extract(tarball: Path, member_prefix: str, target_dir: Path) -> list[Path]:
    """Extract matching members from a GitHub tarball, preserving the tree."""
    target_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    with tarfile.open(tarball, "r:gz") as tar:
        for member in tar.getmembers():
            if not member.isfile() or member_prefix not in member.name:
                continue
            if member.name == member_prefix or member.name.endswith(member_prefix):
                rel = Path(member_prefix).name
            elif member_prefix in member.name:
                rel = member.name.split(member_prefix, 1)[1].lstrip("/")
            else:
                continue
            if not rel:
                continue
            out = target_dir / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            with tar.extractfile(member) as src, open(out, "wb") as dst:  # type: ignore[arg-type]
                dst.write(src.read())
            written.append(out)
    return written


def consonants(text: str) -> str:
    out = []
    for ch in text:
        if HEBREW.match(ch):
            out.append(FINALS.get(ch, ch))
    return "".join(out)


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    return con


def create_schema(con: sqlite3.Connection) -> None:
    con.executescript(
        """
        CREATE TABLE IF NOT EXISTS books(
          osis TEXT PRIMARY KEY, name TEXT, idx INTEGER, testament TEXT, chapters INTEGER
        );
        CREATE TABLE IF NOT EXISTS verses(
          osis TEXT PRIMARY KEY, book TEXT, chapter INTEGER, verse INTEGER, idx INTEGER,
          testament TEXT, kjv TEXT, he_pointed TEXT, he_cons TEXT, wlc_osis TEXT
        );
        CREATE TABLE IF NOT EXISTS he_words(
          osis TEXT, seq INTEGER, pointed TEXT, cons TEXT, lemma TEXT, morph TEXT
        );
        CREATE TABLE IF NOT EXISTS xrefs(src TEXT, dst TEXT, dst_raw TEXT, votes INTEGER);
        CREATE TABLE IF NOT EXISTS lexicon(
          strongs TEXT PRIMARY KEY, lemma TEXT, cons TEXT, xlit TEXT, pron TEXT,
          definition TEXT, kjv_def TEXT
        );
        CREATE TABLE IF NOT EXISTS streams(book TEXT PRIMARY KEY, stream TEXT, map_json_runs TEXT);
        CREATE TABLE IF NOT EXISTS kjv_vocab(word TEXT PRIMARY KEY, n INTEGER);
        CREATE TABLE IF NOT EXISTS verse_map(wlc TEXT PRIMARY KEY, kjv TEXT);
        CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT);
        """
    )


# --------------------------------------------------------------------- KJV ---

def build_kjv(con: sqlite3.Connection, path: Path) -> None:
    log("compiling the English text (KJV)")
    data = json.loads(path.read_text(encoding="utf-8"))
    if len(data) != 66:
        log(f"warning: expected 66 books, found {len(data)}")

    con.execute("DELETE FROM books")
    con.execute("DELETE FROM verses")
    book_rows, verse_rows = [], []
    idx = 0
    for book_pos, book in enumerate(data):
        if book_pos >= len(BOOKS):
            break
        osis, name, testament = BOOKS[book_pos]
        chapters = book["chapters"]
        book_rows.append((osis, name, book_pos, testament, len(chapters)))
        for chapter_no, chapter in enumerate(chapters, start=1):
            for verse_no, text in enumerate(chapter, start=1):
                idx += 1
                verse_rows.append(
                    (f"{osis}.{chapter_no}.{verse_no}", osis, chapter_no, verse_no, idx,
                     testament, text.strip())
                )
    con.executemany("INSERT OR REPLACE INTO books VALUES (?,?,?,?,?)", book_rows)
    con.executemany(
        "INSERT OR REPLACE INTO verses(osis,book,chapter,verse,idx,testament,kjv) VALUES (?,?,?,?,?,?,?)",
        verse_rows,
    )
    con.commit()
    log(f"KJV: {len(book_rows)} books, {len(verse_rows):,} verses")


def build_vocab(con: sqlite3.Connection) -> None:
    log("extracting the KJV vocabulary (types length ≥ 2)")
    con.execute("DELETE FROM kjv_vocab")
    counts: dict[str, int] = {}
    for (text,) in con.execute("SELECT kjv FROM verses WHERE kjv IS NOT NULL"):
        for word in re.findall(r"[a-z]+", text.lower()):
            if len(word) >= 2:
                counts[word] = counts.get(word, 0) + 1
    con.executemany("INSERT OR REPLACE INTO kjv_vocab VALUES (?,?)", counts.items())
    con.commit()
    log(f"vocabulary: {len(counts):,} types")


# ------------------------------------------------------------------ Hebrew ---

def build_hebrew(con: sqlite3.Connection, wlc_dir: Path) -> None:
    log("compiling the Hebrew text (MorphHB / WLC)")
    ns = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
    files = sorted(wlc_dir.glob("*.xml"))
    if not files:
        log("warning: no WLC xml files found")
        return

    con.execute("DELETE FROM he_words")
    con.execute("DELETE FROM streams")
    word_rows, verse_updates, stream_rows = [], [], []
    tapes: dict[str, list[tuple[str, int]]] = {}

    for xml_path in files:
        book_osis = xml_path.stem
        if book_osis in {"VerseMap", "osis"}:
            continue
        running: list[str] = []
        for event, elem in ET.iterparse(xml_path, events=("end",)):
            if elem.tag != f"{ns}verse":
                continue
            osis = elem.get("osisID")
            if not osis:
                elem.clear()
                continue
            pointed_parts, concepts = [], []
            for seq, word in enumerate(elem.iter(f"{ns}w"), start=1):
                surface = "".join(word.itertext()).strip()
                if not surface:
                    continue
                pointed_parts.append(surface)
                lemma = (word.get("lemma") or "").split()[0] if word.get("lemma") else ""
                cons = consonants(surface)
                concepts.append(cons)
                word_rows.append((osis, seq, surface, cons, lemma, word.get("morph") or ""))

            pointed = " ".join(pointed_parts)
            he_cons = "".join(concepts)
            if he_cons:
                verse_updates.append((pointed, he_cons, osis))
                running.append(he_cons)
                tapes.setdefault(book_osis, []).append((osis, len(he_cons)))
            elem.clear()

        if book_osis in tapes:
            stream = "".join(running)
            stream_rows.append((book_osis, stream, json.dumps(tapes[book_osis])))

    con.executemany("INSERT INTO he_words VALUES (?,?,?,?,?,?)", word_rows)
    con.executemany(
        "UPDATE verses SET he_pointed=?, he_cons=?, wlc_osis=? WHERE osis=?", 
        [(p, c, o, o) for p, c, o in verse_updates],
    )
    con.executemany("INSERT OR REPLACE INTO streams VALUES (?,?,?)", stream_rows)
    con.commit()
    log(f"Hebrew: {len(word_rows):,} words, {len(stream_rows)} book streams")


def build_verse_map(con: sqlite3.Connection, path: Path) -> None:
    if not path.exists():
        log("no VerseMap.xml — skipping versification map (Hebrew stays on WLC ids)")
        return
    log("building the WLC → KJV versification map")
    con.execute("DELETE FROM verse_map")
    rows = []
    for _, elem in ET.iterparse(path, events=("end",)):
        # this file uses its own namespace (APTBibleTools), so match on the tag
        if not elem.tag.endswith("verse"):
            continue
        wlc, kjv = elem.get("wlc"), elem.get("kjv")
        if wlc and kjv:
            rows.append((wlc, kjv))
        elem.clear()
    con.executemany("INSERT OR REPLACE INTO verse_map VALUES (?,?)", rows)
    con.commit()
    log(f"versification: {len(rows):,} mapped verses")


def apply_verse_map(con: sqlite3.Connection) -> None:
    """Move Hebrew text onto the KJV ids the reader actually sees."""
    if not con.execute("SELECT 1 FROM sqlite_master WHERE name='verse_map'").fetchone():
        return
    mapped = con.execute("SELECT COUNT(*) FROM verse_map WHERE wlc <> kjv").fetchone()[0]
    if not mapped:
        return
    log(f"applying versification map ({mapped:,} differing verses)")
    con.execute(
        """
        UPDATE verses AS v
        SET he_pointed = (SELECT w.he_pointed FROM verses w WHERE w.osis = m.wlc),
            he_cons    = (SELECT w.he_cons    FROM verses w WHERE w.osis = m.wlc),
            wlc_osis   = m.wlc
        FROM verse_map m
        WHERE v.osis = m.kjv AND m.wlc <> m.kjv
          AND EXISTS (SELECT 1 FROM verses w WHERE w.osis = m.wlc AND w.he_cons IS NOT NULL)
        """
    )
    con.execute(
        """
        UPDATE he_words
        SET osis = (SELECT m.kjv FROM verse_map m WHERE m.wlc = he_words.osis)
        WHERE osis IN (SELECT wlc FROM verse_map WHERE wlc <> kjv)
        """
    )
    con.commit()


# ----------------------------------------------------------------- lexicon ---

def build_lexicon(con: sqlite3.Connection, path: Path) -> None:
    log("compiling the Strong's Hebrew lexicon")
    raw = path.read_text(encoding="utf-8", errors="replace")
    start, end = raw.find("{"), raw.rfind("}")
    if start < 0 or end < 0:
        log("warning: could not parse the Strong's dictionary")
        return
    payload = raw[start : end + 1]
    payload = re.sub(r"([{,]\s*)([A-Za-z0-9_]+)\s*:", r'\1"\2":', payload)
    try:
        entries = json.loads(payload)
    except json.JSONDecodeError as error:
        log(f"warning: lexicon parse failed ({error})")
        return

    con.execute("DELETE FROM lexicon")
    rows = []
    for key, value in entries.items():
        if not isinstance(value, dict):
            continue
        lemma = value.get("lemma") or ""
        rows.append(
            (
                f"H{key}",
                lemma,
                consonants(lemma),
                value.get("xlit") or "",
                value.get("pron") or "",
                re.sub(r"<[^>]+>", "", value.get("strongs_def") or "")[:4000],
                re.sub(r"<[^>]+>", "", value.get("kjv_def") or "")[:4000],
            )
        )
    con.executemany("INSERT OR REPLACE INTO lexicon VALUES (?,?,?,?,?,?,?)", rows)
    con.commit()
    log(f"lexicon: {len(rows):,} Hebrew entries")


# -------------------------------------------------------------- cross-refs ---

REF = re.compile(r"^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$")


def normalise_ref(text: str) -> tuple[str, str] | None:
    text = text.strip().replace(" ", "")
    match = REF.match(text)
    if not match:
        return None
    book, chapter, verse = match.groups()
    code = book[0].upper() + book[1:].lower()
    if code not in OSIS_INDEX:
        return None
    return code, f"{code}.{int(chapter)}.{int(verse)}"


def build_xrefs(con: sqlite3.Connection, path: Path) -> None:
    log("compiling the cross-reference graph (TSK via OpenBible.info)")
    con.execute("DELETE FROM xrefs")
    rows = []
    with path.open(encoding="utf-8", errors="replace") as handle:
        reader = csv.reader(handle, delimiter="\t")
        header = next(reader, None)
        for record in reader:
            if len(record) < 3:
                continue
            src = normalise_ref(record[0])
            if not src:
                continue
            votes = int(record[2]) if record[2].strip().isdigit() else 1
            if votes < 1:
                continue
            dst_raw = record[1].strip()
            # expand same-chapter ranges ("Gen.1.1-Gen.1.5") up to 20 verses
            if "-" in dst_raw:
                left, _, right = dst_raw.partition("-")
                start_ref = normalise_ref(left)
                end_ref = normalise_ref(right if "." in right else f"{left.rsplit('.', 1)[0]}.{right}")
                if start_ref and end_ref and start_ref[0] == end_ref[0]:
                    _, chapter, first = start_ref[1].split(".")
                    last = int(end_ref[1].split(".")[2])
                    for verse in range(int(first), min(last, int(first) + 20) + 1):
                        rows.append((src[1], f"{start_ref[0]}.{chapter}.{verse}", dst_raw, votes))
                    continue
                continue
            dst = normalise_ref(dst_raw)
            if dst:
                rows.append((src[1], dst[1], dst_raw, votes))

    con.executemany("INSERT INTO xrefs VALUES (?,?,?,?)", rows)
    con.executescript("CREATE INDEX IF NOT EXISTS xrefs_src ON xrefs(src); CREATE INDEX IF NOT EXISTS xrefs_dst ON xrefs(dst);")
    con.commit()
    log(f"cross-references: {len(rows):,} edges")


# --------------------------------------------------------------- smoke test ---

def smoke(con: sqlite3.Connection) -> bool:
    log("smoke-testing the compile")
    ok = True

    def check(label: str, condition: bool, detail: str = "") -> None:
        nonlocal ok
        mark = "✓" if condition else "✗"
        print(f"  {mark} {label}{(' — ' + detail) if detail else ''}")
        ok = ok and condition

    row = con.execute("SELECT kjv FROM verses WHERE osis='Gen.1.1'").fetchone()
    check("Gen.1.1 KJV starts “In the beginning God created”",
          bool(row) and row[0].startswith("In the beginning God created"), (row or [""])[0][:48])

    row = con.execute("SELECT cons FROM he_words WHERE osis='Gen.1.1' AND seq=1").fetchone()
    check("first Hebrew token is בראשית", bool(row) and row[0] == "בראשית", row[0] if row else "")

    row = con.execute(
        "SELECT votes FROM xrefs WHERE src='Gen.1.1' AND dst='John.1.1' ORDER BY votes DESC LIMIT 1"
    ).fetchone()
    check("Gen.1.1 links to John 1:1", row is not None, f"votes={row[0]}" if row else "no edge")

    count = con.execute("SELECT COUNT(*) FROM kjv_vocab").fetchone()[0]
    check("KJV vocabulary indexed", count > 5000, f"{count:,} types")

    total = con.execute("SELECT COUNT(*) FROM verses").fetchone()[0]
    check("31,102 verses compiled", total == 31102, f"{total:,}")

    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description="Compile the Bereshit Lab dataset")
    parser.add_argument("--only", nargs="*", default=["kjv", "vocab", "hebrew", "lexicon", "xrefs", "map"],
                        choices=["kjv", "vocab", "hebrew", "lexicon", "xrefs", "map"])
    parser.add_argument("--force", action="store_true", help="re-download raw sources")
    parser.add_argument("--skip-smoke", action="store_true")
    args = parser.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    wanted = set(args.only)

    # ------------------------------------------------------------- downloads
    # Sources are fetched as repo tarballs (codeload) and then trimmed down to
    # the one or two files actually needed; the tarball is deleted afterwards so
    # nothing huge stays on disk.
    def fetch(label: str, key: str, extracted: Path, target_dir: Path) -> None:
        if extracted.exists() and not args.force and extracted.stat().st_size > 0:
            log(f"cached {extracted.name} ({extracted.stat().st_size // 1024} KB)")
            return
        url, member = SOURCES[key]
        tarball = RAW / f"{key}.tar.gz"
        download(url, tarball, args.force)
        extract(tarball, member, target_dir)
        tarball.unlink(missing_ok=True)

    if "kjv" in wanted or "vocab" in wanted:
        fetch("kjv", "kjv", RAW / "kjv" / "en_kjv.json", RAW / "kjv")
    if "xrefs" in wanted:
        fetch("xrefs", "xrefs", RAW / "xrefs" / "cross_references.txt", RAW / "xrefs")
    if "hebrew" in wanted or "map" in wanted:
        fetch("morphhb", "morphhb", RAW / "morphhb" / "VerseMap.xml", RAW / "morphhb")
    if "lexicon" in wanted:
        fetch("strongs", "strongs", RAW / "strongs" / "strongs-hebrew-dictionary.js", RAW / "strongs")

    con = connect()
    create_schema(con)

    if "kjv" in wanted:
        build_kjv(con, RAW / "kjv" / "en_kjv.json")
    if "vocab" in wanted:
        build_vocab(con)
    if "hebrew" in wanted:
        build_hebrew(con, RAW / "morphhb")
    if "map" in wanted:
        build_verse_map(con, RAW / "morphhb" / "VerseMap.xml")
    apply_verse_map(con)
    if "lexicon" in wanted:
        build_lexicon(con, RAW / "strongs" / "strongs-hebrew-dictionary.js")
    if "xrefs" in wanted:
        build_xrefs(con, RAW / "xrefs" / "cross_references.txt")

    con.execute(
        "INSERT OR REPLACE INTO meta VALUES (?,?)",
        ("built_at", time.strftime("%Y-%m-%dT%H:%M:%S")),
    )
    con.commit()

    success = True
    if not args.skip_smoke:
        success = smoke(con)
    con.close()

    log(f"database ready: {DB_PATH} ({DB_PATH.stat().st_size // 1024} KB)")
    log("attribution: KJV public domain · WLC via Open Scriptures MorphHB (CC BY 4.0) · "
        "Strong's via Open Scriptures · cross-references OpenBible.info (CC BY 4.0)")
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
