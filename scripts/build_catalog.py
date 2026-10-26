#!/usr/bin/env python3
"""
Build data/library.json — the public catalog for the Bible Secrets platform.

The inventory below was read from the Google Drive folder
"Bible Secrets with Tinotenda Gwiriri "
(folder id 1-BQptbqyKDf_pqSB5PGDtfaofwy9P470, owner tinotendagwiriri@gmail.com).

Rules applied here:
  * Drive ids are preserved so the reader can stream the real files.
  * Roughly 40% of every series is marked "public" (open to anyone).
    The remainder is "members" (sign-in + full access required).
  * Poster art is local (/posters/*.jpg); swap for Supabase Storage URLs later.

Re-run after editing the inventory:  python3 scripts/build_catalog.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "library.json"

SITE = {
    "name": "Bible Secrets",
    "shortName": "Bible Secrets",
    "founder": "Tinotenda Gwiriri",
    "studio": "Grieyx Studios",
    "tagline": "The Word, unsealed frame by frame.",
    "subtitle": "Nested words · anagrams · verse graphs · letter codes.",
    "about": (
        "Bible Secrets is the teaching library of Tinotenda Gwiriri — a platform "
        "built to ferry revelation out of the Word and put it in your hands. "
        "Series, volumes, comic issues and the Bible Technology engine in one place. "
        "Developed in conjunction with Grieyx Studios."
    ),
    "verse": {
        "ref": "Deuteronomy 29:29",
        "text": "The secret things belong unto the LORD our God: but those things which are revealed belong unto us and to our children for ever.",
    },
    "session": {
        "day": "Tuesday",
        "time": "8:00 PM",
        "timezone": "CAT (GMT+2)",
        "channel": "WhatsApp",
        "title": "Tuesday Night Bible Secrets",
        "note": "Every Tuesday at 8PM we open the Word together on WhatsApp. Poster, notes and replay land here.",
    },
    "membership": {
        "trialDays": 90,
        "headline": "Three months free, then $5 a month",
        "blurb": (
            "Sign in and you have full access for your first three months. After that, "
            "$5 a month keeps the vault open — the Bible Technology engine, the locked "
            "volumes and every new release. Cancel whenever; the free 40 % stays free."
        ),
        "price": 5,
        "currency": "USD",
        "periodDays": 30,
        "coffee": {
            "label": "Buy Tinotenda a coffee",
            "blurb": "Not ready to subscribe? A coffee keeps the presses running.",
            "url": "",
        },
    },
}

# ---------------------------------------------------------------- inventory ---
# (drive_id, title) — order matters: it becomes the episode order.

SERIES_INVENTORY = [
    {
        "slug": "the-return-of-melchizedek",
        "title": "The Return of Melchizedek",
        "tagline": "The priest-king who never left the page.",
        "synopsis": (
            "Melchizedek appears once, blesses Abraham, and vanishes — yet he returns "
            "again and again at the hinges of the story. This flagship series follows "
            "the thread from Genesis 14 through the Psalms, Hebrews and the courts of "
            "heaven, and closes on the Kruptos Protocol: hidden things ferried forward."
        ),
        "genre": ["Bible Study", "Priesthood", "Courts of Heaven"],
        "rating": 9.4,
        "year": 2024,
        "poster": "/posters/poster-melchizedek.jpg",
        "backdrop": "/posters/backdrop-melchizedek.jpg",
        "accent": "#d9b45a",
        "badge": "Flagship series",
        "parts": [
            ("1x-xO1nbwsnX2tiYfZ4a3MLBrPrp_g210", "The Return of Melchizedek I"),
            ("1xAE1L4bQKphsTXd38Vr-_gAAal4gqbtG", "The Return of Melchizedek II"),
            ("1wtaegN0CmOmxqw1ba_IEGikPEnFOA_To", "The Return of Melchizedek III"),
            ("1xAWtODxIzH76PHhhDISr5KYPpsXn2Gue", "The Return of Melchizedek IV"),
            ("1wuK4CuGlYYsXG2RS64OpdQPH4_nHaorl", "The Return of Melchizedek V"),
            ("1wn3z31tzvbLC7idNMq57UH1W7rL_qy8G", "The Return of Melchizedek IX"),
            ("15fMnvwO-kBcvpmDEAQBZgK9T5Gh4UpHw", "The Return of Melchizedek X — Lab Session 4"),
            ("15doLWArGMXtGBz71KoNVFW7rfz4nQ_iU", "The Return of Melchizedek XI"),
            ("15V63ltE8AYvwFug9eW_DKyT_KzppSoVV", "The Return of Melchizedek XII"),
            ("15TBIwKG8KfMzvemGUTop46jgNaIoPc38", "The Return of Melchizedek XIII"),
            ("1EiLo9RkriW8IsasYHuQvzjfeWgJe8mYi", "The Return of Melchizedek XIV"),
            ("1Eq3hyudLSw1MWKeP3s35BllDGSxQPfgo", "The Return of Melchizedek XV"),
            ("10swHqoEyakOyTEBDZldDBgfsSfz6eZpg", "TRoM Volume 3 — The Kruptos Protocol"),
            ("1EqmO1xKT3hPWsIr1MIOK-xdOqp6FYXqz", "The Men From The Arabah"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "the-days-of-noah",
        "title": "The Days of Noah",
        "tagline": "As it was, so it is.",
        "synopsis": (
            "Thirty-five parts on the days that framed a flood: the fall of the sons of "
            "God, the ministry of the Watchers, the gates of hell, the courts of heaven, "
            "the blood of Jesus and the ministry of angels. The long walk through "
            "Genesis 6 and everything it set in motion."
        ),
        "genre": ["Bible Study", "Genesis 6", "Spiritual Warfare"],
        "rating": 9.1,
        "year": 2023,
        "poster": "/posters/poster-noah.jpg",
        "backdrop": "/posters/backdrop-noah.jpg",
        "accent": "#6fb3d9",
        "badge": "35 parts",
        "parts": [
            ("1ei2_PtiYgO3e62xiGHlZ3ZwgSjOjGf1d", "Part 1 — The Fall of The Sons of God 1"),
            ("1gWRaPuGpz4MJfaIM-QizVJSBJxMmGSJ-", "Part 2 — Noah & Melchizedek"),
            ("1i27cxulmG1OQnZrMlfAiPJJbd7pCRj-c", "Part 3 — The Gates of Hell 1"),
            ("1V69YDwOqLipJUPp9rxbwKAsc2jVkGit_", "Part 4 — The Gates of Hell 2 (The Sword of Goliath)"),
            ("1-eCYkQ6FAmPv-kaD_HVSvB4fvJ6Qt0o9", "Part 5 — The Gates of Hell 3 (Before The Tomb)"),
            ("1-Z3XauHvGWss0aoZWOvsVhCIMBW4OcIw", "Part 6 — The Fall of The Sons of God 2"),
            ("1-YcoXTAWP8CTDD-7OnrV0mgHugUZYnxk", "Part 7 — The Ministry of The Watchers"),
            ("1S8XpIyJYTj0bFRafCHSF9cxKAARb1Rop", "Part 8 — The Ministry of the Watchers 2.0"),
            ("1ZwhyXNy0zP-shry4cs_Ca4UgVTOSlg9f", "Part 9 — The Ministry of the Watchers 3"),
            ("1ZxXXDrs6s2mIIhy6qEIt09K3xV28HCAd", "Part 10 — The Ministry of the Watchers 4"),
            ("1Zy8jDTjPh3F70OtIzPU68rplsbNAempL", "Part 11 — The Ministry Of The Watchers 5"),
            ("1_0PR1pMdNG4ypYhnZKKqBxquaLp47yjn", "Part 12 — The Imaginations of Lucifer I"),
            ("1_2RABbRmmO2lZVAqHuz5vXNwd8CS3x2F", "Part 13 — The Imaginations of Lucifer II (Stars & Morningstars)"),
            ("1_56TPZtCZECIObiN2zj-f03h9D4a4igD", "Part 14 — The Imaginations of Lucifer III"),
            ("1_8PN9DX_67MeSshttZKD7xRG3zhxO3_1", "Part 15 — The Imaginations of Lucifer IV"),
            ("1_98ghtiRSnqL77lP_hyQEVFMQZxLPQ6K", "Part 16 — The Imaginations of Lucifer V"),
            ("16YCIeFuCOyZnVGAC8KZIW1UxDClcJ2ll", "Part 17 — The Evil Kingdom I"),
            ("16euMpCcy99HK1mzWZyaZl71a8Cbr3zbs", "Part 18 — The Evil Kingdom II"),
            ("16jGZMQIc61qjWctbveRg0hwSp2C5vf4g", "Part 19 — The Evil Kingdom III"),
            ("1OZZGGeCqn36tRW8DEvMqQUn_GsOQIA30", "Part 20 — The Courts of Heaven 1"),
            ("14_Wx7LPnNIXFOyLuvE-gKRc37VwYddsq", "Part 21 — The Courts of Heaven 2"),
            ("14ZG0eqFrissveJHjHQgdPOSCF3f49Vlp", "Part 22 — Engaging The Courts of Heaven"),
            ("16e8wVDs4QqMDf6SKSB_WA01IECeBpOKN", "Part 23 — Engaging The Courts of Heaven 4"),
            ("15DRQUYTppgUAGPD1AUG6zj0EmlFaZPuI", "Part 24 — 7 Days In The Courts of Heaven"),
            ("14dQufv2R-2iN43Htc5s3u9gCzhDeqZrh", "Part 25 — Engaging The Courts of Heaven | Giving"),
            ("14fr7RqsN1ttiANvBqNqL_f9UpZ2NQhjf", "Part 26 — Engaging The Courts of Heaven | The Bride"),
            ("16dFcUWT9jTdrdHlbGXHg9Ouhl5-yEaf4", "Part 27 — Court Session For Families I"),
            ("1gjo6LLNmF6yVmRpZG4T3QAsQEJYrLgfW", "Part 28 — The Bride"),
            ("14rZ4tDluxw9lYc2jBJrkrlugj0t0vVEh", "Part 29 — Court Session For Families II"),
            ("1MNIe-q9qMzXBsDjm9ERdj1b5uMfy_cxz", "Part 30 — The Blood of Jesus"),
            ("1MScKVBeBR7cXUsCQh9Z05Hi9E7fsZKVH", "Part 31 — The Blood of Jesus 2"),
            ("1MOBS0L7IDwNUwnDU-uHILTe1ZcPIW98d", "Part 32 — The Blood of Jesus 3"),
            ("1MTq8wVIrgvnTIVUv976Olp0NjAE0uCXs", "Part 34 — The Blood of Jesus 5"),
            ("1MVjMeh2OXUzi36kqLF_gRv5cqzP3EV3k", "Part 35 — The Ministry of Angels"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "unmasking-the-devil",
        "title": "Unmasking The Devil",
        "tagline": "Every mask comes off.",
        "synopsis": (
            "Twelve sessions on the flesh, the world and the serpent's oldest trick: "
            "making you think he is not there. Practical, unsparing teaching on dealing "
            "with the flesh and how it all went wrong."
        ),
        "genre": ["Bible Study", "Deliverance", "Discipleship"],
        "rating": 8.8,
        "year": 2022,
        "poster": "/posters/poster-devil.jpg",
        "backdrop": "/posters/backdrop-devil.jpg",
        "accent": "#c8564a",
        "badge": "12 sessions",
        "parts": [
            ("12gIEik_AGYJSfbUxUq3No4YPFMZoq4vJ", "Aliens of Glory"),
            ("13J0nb9TJxbrqowrMmLa9em6SaxbK898_", "Dealing With The Flesh 1"),
            ("13BlYk7Xl8X-vlfRPQhpuutvuU5oCD59A", "Dealing With The Flesh 2"),
            ("12wtIQKQnc466U6RS1WX48Vtt5GOUFzIi", "Dealing With The Flesh 3"),
            ("12yEvmAZSjnO7dmYRilS8YKI__l9zxc4h", "How It All Went Wrong 1"),
            ("13LIcerjFmWMwlBtxgfFurltqEO2wm2bU", "How It All Went Wrong 2"),
            ("13LZnRIYCtxA5KXtqxaxg7FYFiv_NDACf", "My Own World 1"),
            ("1343nFZiJjuij8alaeCdk-ArFgPZl4-Tk", "My Own World 2"),
            ("135wieSK_1N4OoUNXy8TUddCuIhJcEz6d", "The Apocalypse"),
            ("13F1rixOVsNDdYdCQIN1wqaKhbYF30z1F", "The Apocalypse 2"),
            ("13S4R4KpYRdF2mR1b-3tnmIACw-7tcvzG", "We Have Come Unto Mt Zion"),
            ("130EuirI-RbdCCs4URTvrhdK7-BCSaHJX", "You Were Delivered 1"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "word-of-god",
        "title": "Word of God",
        "tagline": "How to eat, hide, sleep on and stand with the Word.",
        "synopsis": (
            "Eight studies on your relationship with the text itself: eating the Word, "
            "hiding it, the mind–heart–word circuit, sleeping on it, standing with it, "
            "and the sure word of prophecy."
        ),
        "genre": ["Bible Study", "Devotion", "Foundations"],
        "rating": 8.9,
        "year": 2022,
        "poster": "/posters/poster-word.jpg",
        "backdrop": "/posters/backdrop-word.jpg",
        "accent": "#8fb06a",
        "badge": "8 studies",
        "parts": [
            ("12GlnlRIK1y8MuaL-4QykW5fv4QNQcBwY", "Eating With The Word"),
            ("12HfGQUX3E49OGXuNXBFmVOSoCHeEivF5", "Hiding The Word"),
            ("12Gb9_07wFPYR3NtkrXiPr5_GHd4qmKTw", "Mind–Heart–Word 1"),
            ("12Lxm5_PktrJZDkiIoiS32olt99SM88Mr", "Mind–Heart–Word 2"),
            ("12B9easieRrYxPba4YTdI-TgsNVfo6HHg", "Mind–Heart–Word 3"),
            ("12JRBDf-TZ2n1-w7O36B_iZ2lbmUYXa_-", "Sleeping On The Word"),
            ("12F1NQKo_7xWRHgWZKduhbd-3p-ydfvQC", "Standing With The Word"),
            ("12QpOd6K10YttuKC8pdceI_5vPXVnQf3E", "Sure Word of Prophecy"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "heis-series",
        "title": "Heis Series",
        "tagline": "Seed of God, spoken forward.",
        "synopsis": (
            "Nine-part series tracing the seed — of God, of the woman, of the serpent — "
            "and what it means to be born of Him."
        ),
        "genre": ["Bible Study", "Identity", "Kingdom"],
        "rating": 8.6,
        "year": 2021,
        "poster": "/posters/poster-heis.jpg",
        "backdrop": "/posters/backdrop-heis.jpg",
        "accent": "#d98f5a",
        "badge": "9 parts",
        "parts": [
            ("13oS18ctz-fizhkUoWctZHVcksptRdtEO", "Heis Series Part 1"),
            ("13hFL1_lwcWuswLY_cKmhNfMbRN-lemx2", "Heis Series Part 2"),
            ("13uzb43K4FSGJsvYod1vWk4xcMAi1vzty", "Heis Series Part 3"),
            ("13lRaMDCeKLuzFSUYX45LF-fCCIr7xy-7", "Heis Series Part 5"),
            ("13fdaYG9qyHO1hQJN8FcAJ5zGgXwmWKsE", "Heis Series Part 6 — Seed Of God I"),
            ("13uw32OqWm_pwk4JH2efvnEkh4Xuy4S9I", "Heis Series Part 7 — Seed Of God II"),
            ("13v7OWTf83IZpJBOaZJH4oLYCHQT954M2", "Heis Series Part 8"),
            ("13keCvmGDz8lCoLa6pFU7sQ0UCnQxCF8p", "Heis Series Part 9"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "meditation-series",
        "title": "Meditation Series",
        "tagline": "The road to the secret place.",
        "synopsis": (
            "Three studies on meditation as a discipline, not a mood: the road to "
            "meditation, its course, and what happens to a mind that stays there."
        ),
        "genre": ["Meditation", "Prayer", "Inner Life"],
        "rating": 8.7,
        "year": 2021,
        "poster": "/posters/poster-meditation.jpg",
        "backdrop": "/posters/backdrop-meditation.jpg",
        "accent": "#7ec8b8",
        "badge": "3 parts",
        "parts": [
            ("12TaDqC7hr5QN0ENOgzzOmRrkNfyeWm9H", "Part 1 — Road to Meditation I"),
            ("12UQjf9k2u23wAgWjs0Ef6nLaXcg2Wexz", "Part 2 — Road to Meditation II"),
            ("12VsZtkt3nSIBGwxfisOii6RWkO3GG5Sb", "Part 3 — The Course of Meditation"),
        ],
        "freeRatio": 0.4,
    },
    {
        "slug": "comic-book-issues",
        "title": "Comic Book Issues",
        "tagline": "The Word, drawn.",
        "synopsis": (
            "The illustrated wing of Bible Secrets. Church Witchcraft Issue #1 leads the "
            "line — doctrine and warfare in panels, with terms and conditions for "
            "characters published alongside."
        ),
        "genre": ["Comic", "Illustrated", "Warfare"],
        "rating": 9.0,
        "year": 2026,
        "poster": "/posters/poster-comic.jpg",
        "backdrop": "/posters/backdrop-comic.jpg",
        "accent": "#e0574f",
        "badge": "Issue #1 out",
        "parts": [
            ("1RTRmu2gMP625kEXSrTV7Oc68YhkziNr1", "Church Witchcraft — Issue #1"),
            ("1pCFNkt3I1DfGhnm6sgbIfxXhmHyTTWDd", "Bible Secrets Characters — Terms and Conditions"),
        ],
        "freeRatio": 0.5,
    },
    {
        "slug": "question-and-answer",
        "title": "Question & Answer",
        "tagline": "You asked. We opened the Book.",
        "synopsis": (
            "The live Q&A archive from the Tuesday night session — questions sent in on "
            "WhatsApp, answered from the Word."
        ),
        "genre": ["Q&A", "Live Session"],
        "rating": 8.5,
        "year": 2023,
        "poster": "/posters/poster-qa.jpg",
        "backdrop": "/posters/backdrop-qa.jpg",
        "accent": "#b79ce0",
        "badge": "Live archive",
        "parts": [
            ("1Ol63qVnm5UgFr8WHIvITOzaW9uskkU1W", "Bible Secrets Q&A 1"),
            ("1Os-_zUmZIJxvB31pKMquVr8DaXnSPrPL", "Bible Secrets Q&A 2"),
            ("1OwV8Fql5d7j1mRefrEGsd-0I0QwB4saI", "Bible Secrets Q&A 3"),
        ],
        "freeRatio": 1.0,
    },
]

# Dedicated 16:9 hero art per series, rendered from the poster by
# `scripts/make_backdrops.sh` (backdrop-<art>.jpg). Drop in real 16:9 art with
# the same names to replace them.

SERIES_BLURB = {
    "the-return-of-melchizedek": "A volume in the Return of Melchizedek series.",
    "the-days-of-noah": "A session in the Days of Noah series.",
    "unmasking-the-devil": "A session in the Unmasking The Devil series.",
    "word-of-god": "A study in the Word of God series.",
    "heis-series": "A part of the Heis series.",
    "meditation-series": "A study in the Meditation series.",
    "comic-book-issues": "From the illustrated wing of Bible Secrets.",
    "question-and-answer": "From the Tuesday night Q&A archive.",
}


def slugify(text: str, fallback: str) -> str:
    keep = []
    for ch in text.lower():
        if ch.isalnum():
            keep.append(ch)
        elif keep and keep[-1] != "-":
            keep.append("-")
    out = "".join(keep).strip("-")
    return out[:60] or fallback


def build() -> dict:
    series_out = []
    for s in SERIES_INVENTORY:
        parts = s["parts"]
        n = len(parts)
        free_count = n if s.get("freeRatio", 0.4) >= 1 else max(1, math.floor(n * s.get("freeRatio", 0.4)))
        built_parts = []
        for idx, (drive_id, title) in enumerate(parts, start=1):
            built_parts.append(
                {
                    "slug": slugify(f"{s['slug']}-{idx}-{title}", f"{s['slug']}-{idx}"),
                    "number": idx,
                    "title": title,
                    "synopsis": f"{SERIES_BLURB.get(s['slug'], 'A Bible Secrets session.')} "
                    f"{title.replace('—', '·')}.",
                    "poster": s["poster"],
                    "backdrop": s["poster"].replace("poster-", "backdrop-"),
                    "access": "public" if idx <= free_count else "members",
                    "driveId": drive_id,
                    "previewUrl": f"https://drive.google.com/file/d/{drive_id}/preview",
                    "downloadUrl": f"https://drive.google.com/uc?export=download&id={drive_id}",
                    "trailerUrl": None,
                }
            )
        series_out.append(
            {
                "slug": s["slug"],
                "title": s["title"],
                "tagline": s["tagline"],
                "synopsis": s["synopsis"],
                "genre": s["genre"],
                "rating": s["rating"],
                "year": s["year"],
                "poster": s["poster"],
                "backdrop": s["poster"].replace("poster-", "backdrop-"),
                "accent": s["accent"],
                "badge": s["badge"],
                "parts": built_parts,
            }
        )

    return {
        "site": SITE,
        "series": series_out,
        "liveSession": {
            "title": "Tuesday Night Bible Secrets",
            "day": "Tuesday",
            "time": "8:00 PM",
            "timezone": "CAT (GMT+2)",
            "channel": "WhatsApp",
            "poster": "/posters/poster-session.jpg",
            "backdrop": "/posters/backdrop-session.jpg",
            "whatsappUrl": "",
            "notes": (
                "Session notes are published here after every Tuesday night. "
                "Join on WhatsApp for the live opening of the Word."
            ),
        },
        "bibleTechnology": {
            "title": "Bible Technology",
            "engine": "Bereshit Lab",
            "subtitle": "Nested words · anagrams · verse graphs · letter codes",
            "poster": "/posters/poster-bereshit.jpg",
            "backdrop": "/posters/backdrop-bereshit.jpg",
            "defaultVerse": "Gen.1.1",
            "engineUrlEnv": "NEXT_PUBLIC_BERESHIT_URL",
        },
    }


def main() -> None:
    data = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    total = sum(len(s["parts"]) for s in data["series"])
    public = sum(1 for s in data["series"] for p in s["parts"] if p["access"] == "public")
    print(f"wrote {OUT}")
    print(f"series: {len(data['series'])}  parts: {total}  public: {public}  members: {total - public}")


if __name__ == "__main__":
    main()
