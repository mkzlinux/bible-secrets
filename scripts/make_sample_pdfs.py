#!/usr/bin/env python3
"""
Generate local sample editions for every public part.

Why: the platform streams the real volumes from Google Drive / Supabase Storage,
but this keeps the reader demonstrable on any machine without those credentials
(and gives visitors something to read before the vault is connected). Samples are
clearly watermarked, and `BIBLE_SECRETS_SAMPLES=0` switches them off.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / "data" / "library.json"
OUT = ROOT / "public" / "samples"

WIDTH, HEIGHT = 595, 842  # A4 points

KJV_BLOCKS = [
    ("Genesis 1:1-3", [
        "In the beginning God created the heaven and the earth.",
        "And the earth was without form, and void; and darkness was upon the face of the deep. "
        "And the Spirit of God moved upon the face of the waters.",
        "And God said, Let there be light: and there was light.",
    ]),
    ("Deuteronomy 29:29", [
        "The secret things belong unto the LORD our God: but those things which are revealed "
        "belong unto us and to our children for ever, that we may do all the words of this law.",
    ]),
    ("John 1:1-3", [
        "In the beginning was the Word, and the Word was with God, and the Word was God.",
        "The same was in the beginning with God.",
        "All things were made by him; and without him was not any thing made that was made.",
    ]),
    ("Psalm 91:1-2", [
        "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.",
        "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.",
    ]),
    ("Hebrews 7:1-3", [
        "For this Melchisedec, king of Salem, priest of the most high God, who met Abraham "
        "returning from the slaughter of the kings, and blessed him;",
        "To whom also Abraham gave a tenth part of all; first being by interpretation King of "
        "righteousness, and after that also King of Salem, which is, King of peace;",
        "Without father, without mother, without descent, having neither beginning of days, nor "
        "end of life; but made like unto the Son of God; abideth a priest continually.",
    ]),
    ("Ephesians 1:17-18", [
        "That the God of our Lord Jesus Christ, the Father of glory, may give unto you the spirit "
        "of wisdom and revelation in the knowledge of him:",
        "The eyes of your understanding being enlightened; that ye may know what is the hope of "
        "his calling, and what the riches of the glory of his inheritance in the saints.",
    ]),
]

SERIES_LINES = {
    "the-return-of-melchizedek": [
        "This volume walks the Melchizedek thread: the king-priest who meets Abraham in Genesis 14, "
        "the oath of Psalm 110, and the argument of Hebrews 7.",
        "The sessions were opened live on a Tuesday night, then edited into the form you are reading.",
    ],
    "the-days-of-noah": [
        "Genesis 6 is the hinge of this series: the sons of God, the Watchers, the gates of hell, "
        "and the courts of heaven.",
        "Read slowly. The material assumes you will sit with the scripture before the commentary.",
    ],
    "unmasking-the-devil": [
        "Twelve sessions on the flesh and the world, and on the oldest trick in the book: being "
        "absent while you assume he is not.",
        "Practical teaching, unapologetic in tone, always anchored to the text.",
    ],
}

GENERIC_LINES = [
    "This is a sample edition generated for the Bible Secrets reader: it exists so the reading "
    "experience can be demonstrated before the full library is connected.",
    "The complete volume streams from the vault with bookmarks, resume-where-you-stopped and PDF "
    "download for members.",
]


def escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


def wrap(text: str, size: int, width: int, mono_pitch: float) -> list[str]:
    max_chars = int(width / (size * mono_pitch))
    words, lines, current = text.split(), [], ""
    for w in words:
        candidate = f"{current} {w}".strip()
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


class Pdf:
    def __init__(self) -> None:
        self.pages: list[list[str]] = []

    def text(self, x: float, y: float, s: str, font: str = "F1", size: float = 11, color=(0.06, 0.06, 0.07)):
        self.pages[-1].append(
            f"BT /{font} {size} Tf {color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg "
            f"1 0 0 1 {x:.1f} {y:.1f} Tm ({escape(s)}) Tj ET"
        )

    def rule(self, x1: float, y: float, x2: float, color=(0.83, 0.71, 0.35), width: float = 1.1):
        self.pages[-1].append(
            f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} RG {width} w {x1:.1f} {y:.1f} m {x2:.1f} {y:.1f} l S"
        )

    def rect(self, x: float, y: float, w: float, h: float, color=(0.04, 0.04, 0.05)):
        self.pages[-1].append(
            f"{color[0]:.3f} {color[1]:.3f} {color[2]:.3f} rg {x:.1f} {y:.1f} {w:.1f} {h:.1f} re f"
        )

    def new_page(self) -> None:
        self.pages.append([])

    def build(self) -> bytes:
        objects: list[bytes] = []
        n_pages = len(self.pages)
        # 1 catalog, 2 pages, 3..: page objects interleaved with content, then fonts
        page_ids = [3 + i * 2 for i in range(n_pages)]
        content_ids = [pid + 1 for pid in page_ids]

        kids = " ".join(f"{pid} 0 R" for pid in page_ids)
        objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
        objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {n_pages} >>".encode())

        for pid, cid, ops in zip(page_ids, content_ids, self.pages):
            # WinAnsiEncoding == cp1252; anything outside it degrades to ascii.
            text = "\n".join(ops)
            safe = text.encode("cp1252", errors="replace").decode("cp1252")
            stream = safe.encode("cp1252")
            objects.append(
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {WIDTH} {HEIGHT}] "
                f"/Resources << /Font << /F1 {3 + n_pages * 2} 0 R /F2 {4 + n_pages * 2} 0 R "
                f"/F3 {5 + n_pages * 2} 0 R >> >> /Contents {cid} 0 R >>".encode()
            )
            objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")

        objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>")
        objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>")
        objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")

        out = bytearray(b"%PDF-1.4\n")
        offsets = [0]
        for i, obj in enumerate(objects, start=1):
            offsets.append(len(out))
            out += f"{i} 0 obj\n".encode() + obj + b"\nendobj\n"
        xref_pos = len(out)
        out += f"xref\n0 {len(objects) + 1}\n".encode()
        out += b"0000000000 65535 f \n"
        for off in offsets[1:]:
            out += f"{off:010d} 00000 n \n".encode()
        out += (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n"
        ).encode()
        return bytes(out)


def make_pdf(series: dict, part: dict) -> bytes:
    pdf = Pdf()
    accent = series.get("accent", "#d4b45a")
    rgb = tuple(int(accent.lstrip("#")[i : i + 2], 16) / 255 for i in (0, 2, 4))

    # ---- cover
    pdf.new_page()
    pdf.rect(0, 0, WIDTH, HEIGHT)
    pdf.text(52, HEIGHT - 96, "BIBLE SECRETS", font="F3", size=10, color=(0.83, 0.71, 0.35))
    pdf.text(52, HEIGHT - 112, "with Tinotenda Gwiriri", font="F3", size=9, color=(0.72, 0.7, 0.66))
    pdf.rule(52, HEIGHT - 132, WIDTH - 52, color=rgb)
    pdf.text(52, HEIGHT - 220, series["title"].upper(), font="F3", size=10, color=(0.62, 0.6, 0.56))

    y = HEIGHT - 268
    for line in wrap(part["title"], 26, WIDTH - 104, 0.5):
        pdf.text(52, y, line, font="F2", size=26, color=(0.95, 0.92, 0.85))
        y -= 32

    pdf.text(52, y - 6, f"Part {part['number']} of {len(series['parts'])}", font="F3", size=10,
             color=(0.72, 0.7, 0.66))
    pdf.text(52, y - 46, "SAMPLE EDITION", font="F3", size=11, color=rgb)
    y -= 78
    for line in wrap(GENERIC_LINES[0], 12, WIDTH - 160, 0.5):
        pdf.text(52, y, line, font="F1", size=12, color=(0.78, 0.76, 0.72))
        y -= 18

    pdf.rule(52, 96, WIDTH - 52, color=rgb)
    pdf.text(52, 74, "Generated for platform review · full volume streams from the vault",
             font="F3", size=8.5, color=(0.6, 0.58, 0.55))

    # ---- scripture + notes pages
    intro = SERIES_LINES.get(series["slug"], GENERIC_LINES)
    for idx in range(4):
        pdf.new_page()
        pdf.rect(0, 0, WIDTH, HEIGHT)
        pdf.text(52, HEIGHT - 64, series["title"], font="F3", size=9, color=(0.6, 0.58, 0.55))
        pdf.text(WIDTH - 168, HEIGHT - 64, "SAMPLE EDITION", font="F3", size=9, color=rgb)
        pdf.rule(52, HEIGHT - 78, WIDTH - 52, color=(0.25, 0.24, 0.22), width=0.6)

        y = HEIGHT - 118
        heading = ["Where this volume sits", "The text first", "Session notes", "Carry it with you"][idx]
        pdf.text(52, y, heading, font="F2", size=19, color=(0.95, 0.92, 0.85))
        y -= 30

        body = []
        if idx == 0:
            body = [
                intro[0],
                intro[1] if len(intro) > 1 else GENERIC_LINES[1],
                f"Series: {series['title']} — {series.get('tagline','')}",
            ]
        elif idx == 1:
            ref, verses = KJV_BLOCKS[hash(part["slug"]) % len(KJV_BLOCKS)]
            pdf.text(52, y, ref, font="F3", size=10, color=rgb)
            y -= 24
            body = verses
        elif idx == 2:
            body = [
                "1. Read the passage aloud before reading any note.",
                "2. Mark the words that carry weight for you; bring them to the Tuesday session.",
                "3. Write your question down — the Q&A archive is built from questions like yours.",
                GENERIC_LINES[1],
            ]
        else:
            body = [
                "The secret things belong unto the LORD our God; but those things which are "
                "revealed belong unto us and to our children for ever.",
                "Members unlock the complete volume, downloads, bookmarks and the Bereshit Lab "
                "Bible Technology engine.",
            ]

        for paragraph in body:
            for line in wrap(paragraph, 12.5, WIDTH - 104, 0.48):
                pdf.text(52, y, line, font="F1", size=12.5, color=(0.12, 0.11, 0.1))
                y -= 19
            y -= 10

        pdf.text(WIDTH / 2 - 12, 60, str(idx + 2), font="F3", size=9, color=(0.45, 0.44, 0.42))

    return pdf.build()


def main() -> None:
    library = json.loads(LIBRARY.read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    written = 0
    for series in library["series"]:
        for part in series["parts"]:
            # Samples are generated for every part so the reader can be
            # demonstrated locally; the access gate still lives in the app, so
            # vault parts stream only to signed-in members.
            _ = part["access"]
            data = make_pdf(series, part)
            name = re.sub(r"[^a-z0-9]+", "-", part["slug"].lower()).strip("-") + ".pdf"
            (OUT / name).write_bytes(data)
            written += 1
    print(f"wrote {written} sample editions to {OUT}")


if __name__ == "__main__":
    main()
