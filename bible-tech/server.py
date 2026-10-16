#!/usr/bin/env python3
"""
Bereshit Lab — local Flask server (Bible Technology engine).

    python3 server.py            # http://0.0.0.0:8080

Bound to 0.0.0.0 on purpose so the Bible Secrets site can embed it, whether the
browser is on this machine or on a preview origin.
"""

from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from engine import ELS_CAVEAT, engine

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"

app = Flask(__name__, static_folder=str(STATIC), static_url_path="/static")
app.config["JSON_SORT_KEYS"] = False

ENGINE = engine()


# --------------------------------------------------------------------- pages

@app.get("/")
def index():
    return send_from_directory(STATIC, "index.html")


@app.get("/healthz")
def healthz():
    return jsonify({"ok": True, "engine": "Bereshit Lab"})


# ---------------------------------------------------------------------- api

@app.get("/api/books")
def api_books():
    return jsonify({"books": ENGINE.books()})


@app.get("/api/verse/<path:osis>")
def api_verse(osis: str):
    verse = ENGINE.verse(osis)
    if not verse:
        return jsonify({"error": "not_found", "osis": osis}), 404
    return jsonify(verse)


@app.get("/api/chapter/<book>/<int:chapter>")
def api_chapter(book: str, chapter: int):
    return jsonify({"book": book, "chapter": chapter, "verses": ENGINE.chapter(book, chapter)})


@app.get("/api/search")
def api_search():
    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "missing_query"}), 400
    return jsonify({"query": query, "results": ENGINE.search(query)})


@app.get("/api/xrefs/<path:osis>")
def api_xrefs(osis: str):
    limit = int(request.args.get("limit", 80))
    return jsonify(ENGINE.xrefs(osis, limit))


@app.get("/api/graph/<path:osis>")
def api_graph(osis: str):
    limit = int(request.args.get("limit", 40))
    return jsonify(ENGINE.graph(osis, limit))


@app.get("/api/nested")
def api_nested():
    query = request.args.get("q", "בראשית")
    lang = request.args.get("lang", "auto")
    return jsonify(ENGINE.nested(query, lang))


@app.get("/api/anagrams")
def api_anagrams():
    query = request.args.get("q", "בראשית")
    return jsonify(ENGINE.ciphers(query))


@app.get("/api/els")
def api_els():
    term = request.args.get("q", "תורה")
    scope = request.args.get("scope", "Torah")
    minimum = int(request.args.get("min", 2))
    maximum = int(request.args.get("max", 30))
    lang = request.args.get("lang", "he")
    limit = int(request.args.get("limit", 40))
    return jsonify(ENGINE.els(term, scope, minimum, maximum, limit, lang))


@app.get("/api/strongs/<code>")
def api_strongs(code: str):
    entry = ENGINE.strongs_entry(code)
    if not entry:
        return jsonify({"error": "not_found", "code": code}), 404
    return jsonify(entry)


@app.get("/api/stats")
def api_stats():
    payload = ENGINE.stats()
    payload["caveat_els"] = ELS_CAVEAT
    payload["attribution"] = (
        "KJV public domain · WLC via Open Scriptures MorphHB (CC BY 4.0) · "
        "Strong's via Open Scriptures · cross-references OpenBible.info (CC BY 4.0), "
        "derived from the Treasury of Scripture Knowledge."
    )
    return jsonify(payload)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print(f"Bereshit Lab — nested words · anagrams · verse graphs · letter codes")
    print(f"serving on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
