# Bible Secrets — with Tinotenda Gwiriri

A cinematic publishing platform for Bible study: series, volumes, the Tuesday 8&nbsp;pm WhatsApp
sessions, and **Bereshit Lab** — a Bible-technology workbench with four indexes on the text
(nested words, anagrams/temurah/gematria, a Treasury-of-Scripture-Knowledge verse graph, and
Equidistant Letter Sequences).

Built by **Grieyx Studios**.

> **In His presence there is fullness of joy** — the words of our Lord Jesus Christ (John 15:11).
> In the hidden years, God planted an enemy in every seed. The enemy has shielded his children in
> the cover of darkness, but the darkness is passing away and the true light already shines.

---

## Run it

```bash
npm install
npm run dev            # http://localhost:3000  (binds 0.0.0.0)
```

The platform runs **with no keys at all** — a JSON-backed demo store serves the catalog, the
samples, sign-in, gating and the admin dashboard, so you can click through the whole product
immediately.

### Add the database (Supabase)

1. Create a project, then paste `supabase/schema.sql` into the SQL editor (tables, row-level
   security, storage buckets and seed rows).
2. Copy `.env.example` → `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server only
```

3. Upload the PDFs to the private `books` bucket (or leave them on Google Drive and set
   `drive_id` on each book) — vault files are only ever served through `/api/read/[slug]`,
   which checks the entitlement first.

### Add payments (Paystack)

```bash
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_CURRENCY=USD
BIBLE_SECRETS_PRICE=5                # major units → US$5, in minor units on the wire
BIBLE_SECRETS_PERIOD_DAYS=30         # one payment buys a month
```

`/api/paystack/webhook` verifies the `x-paystack-signature` HMAC and writes the entitlement;
`/membership` reads the current state. With no keys, checkout runs in demo mode and grants access
so the flow is demonstrable.

### Add the Bible Technology engine

```bash
cd bible-tech
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
python3 build_data.py        # compiles data/bible.sqlite from public-domain sources
python3 server.py            # http://0.0.0.0:8080
```

Then point the platform at it (the site proxies the engine at `/engine`, so the browser never talks to this port directly):

```bash
BERESHIT_URL=http://127.0.0.1:8080
```

The site proxies the engine at `/engine`, so the browser never talks to port 8080 directly —
that keeps the workbench same-origin in preview and in production.

`/bible-technology` live-embeds the workbench when the engine answers `/api/stats`; without it the
page still teaches the four indexes and links to the build notes.

---

## What's in the box

```
app/
  page.tsx                  cinematic home: hero, rails, session spotlight, engine, key
  series/                   the catalog and each series' show page
  read/[slug]/              the reader (entitlement-gated stream, samples for guests)
  bible-technology/         Bereshit Lab: the four indexes, embed + inline demos
  docs/                     build notes: data layers, algorithms, access model
  live/                     Tuesday 8pm WhatsApp session + poster
  about/ membership/        the ministry, the key, the coffee
  signin/ signup/           Supabase auth (or the demo store)
  account/                  entitlement, progress, bookmarks, payments
  admin/                    dashboard, library, sessions, users
  api/                      read, search, entitlement, paystack, admin
components/                 hero stage, rails, posters, reader shell, admin forms
lib/                         data layer (Supabase ⇄ JSON store), access model, utilities
supabase/schema.sql         the whole backend: tables, RLS, buckets, seed
bible-tech/                 the Python engine: compiler, query engine, Flask server, workbench UI
scripts/                    catalog + sample-PDF builders
data/library.json           the catalog compiled from the Drive library
```

## The access model — 40 % free, forever

| | |
|---|---|
| **Guest** | Reads ~40 % of every series — the public parts stream in full, plus every free sample. Never sees a vault file. |
| **Member (signed in)** | 90 days of everything, no card. This is the “free for about three months” promise. |
| **After the trial** | **US$5/month** by Paystack — or an admin grant. Lapsed members fall back to the 40 %; nothing is deleted. |
| **Coffee** | A one-off gift that keeps the engine running; it does not buy access. |

## The session rhythm

Tuesdays, 8&nbsp;pm, on WhatsApp. The admin posts the poster, the title and the link; the home page
counts down to the next one and `/live` holds the room.

## Content

Series, volumes and session media live in the Google Drive library; the catalog is compiled with
`python3 scripts/build_catalog.py`. Public parts are served from their (public) Drive copy — no
account, no token — while every vault volume lives in the **private** `books` bucket and is signed
per request after the entitlement check, so ending a membership ends the access. Guests always land
on the sample edition, never the vault file. Posters and backdrops are generated art placeholders — drop the
real key art into `public/posters/` with the same filenames and nothing else has to change.

## Go live

`docs/GO-LIVE.md` is the whole sequence: create the Supabase project, paste the schema,
verify it with `npm run check:supabase`, make yourself the publisher, move the vault
into private Storage, connect Paystack, host the engine, deploy. Everything is already
wired — it only needs the keys.

## Deploy

Vercel is the shortest path (`npm run build`), set the same environment variables, and either host
the engine on Fly/Render/Railway or run `gunicorn server:app` next to the app. `bible-tech` also
runs happily on a Raspberry Pi; it needs no GPU and ~200 MB of RAM after the first query.

## Attribution

King James Version (public domain) · Westminster Leningrad Codex via **MorphHB** (CC BY 4.0) ·
**Strong's** dictionaries via Open Scriptures · cross-references from **OpenBible.info** (CC BY 4.0),
derived from the Treasury of Scripture Knowledge. The ELS caveat that appears on the engine page is
part of the product, not small print.
