# Go-live checklist

Four decisions are made; this page is the sequence that turns the demo into the
live site. Everything here is already wired — the app just needs the keys.

| Decision | Setting |
|---|---|
| Platform | Bible Secrets, with Tinotenda Gwiriri · Grieyx Studios |
| Database | Supabase (Postgres + Auth + Storage) |
| Content | Drive for public previews · Storage for the vault |
| Key art | Generated set stays for launch (swap files later, same names) |
| Price | **US$5 / month** after a **90-day** free trial · coffee donations separate |

---

## 1 · Create the project (5 minutes)

1. <https://supabase.com/dashboard> → **New project**. Region: the one closest to
   your readers (Frankfurt or Johannesburg for Africa).
2. Open **SQL editor** → paste all of `supabase/schema.sql` → **Run**.
   That creates the tables, the row-level security, the three buckets
   (`covers`, `media` public; `books` **private**), the access helper and the
   two seed series.
3. Open **Project settings → API** and copy three values:

   | Variable | Where |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **server only, never public** |

4. Put them into `.env.local` (already git-ignored):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```

   > The service-role key bypasses every rule in the database. It must never be
   > pasted into a client component, a screenshot, or a chat that gets stored.
   > If it is easier, send only the URL and anon key, and drop the service-role
   > key into `.env.local` yourself.

5. Verify it:

   ```bash
   npm run check:supabase
   ```

   You want eleven ✓ tables, three ✓ buckets (`books` private) and a ✓ for
   `has_full_access`. Anything missing means the SQL did not finish.

## 2 · Your admin account

1. Start the app, go to **/signup**, create the account with the email you want
   to publish under.
2. Add that email to `.env.local`:

   ```bash
   BIBLE_SECRETS_ADMINS=tinotenda@yourdomain.com
   ```

3. Restart, open **/admin**. With no admins listed, the first account is treated
   as the owner — which is fine for a fresh install, but list yourself before
   the site is public.

## 3 · Content: Drive for the free 40 %, Storage for the vault

The reader never links a file directly. `/api/read/<slug>` decides at request
time and streams the bytes itself.

| Part type | Source | Why |
|---|---|---|
| Public parts (the 40 %) | Google Drive file id | Shareable, and the file is public anyway |
| Members' parts (the vault) | Private `books` bucket | Signed URL, expiring, only after the entitlement check |
| Guests on either | The generated sample edition | Shows the opening pages, never the vault |

To move a volume into the vault:

1. **/admin/library** → pick the series → the volume → **Upload PDF (stored in
   the books bucket)** → save. The dashboard writes a `storage://books/…`
   reference; nothing public is exposed.
2. To keep a volume on Drive as a public part instead, paste its Drive file id
   in **Drive id** and leave access on **public**.

Real manuscripts and the generated sample editions can coexist: samples are the
fallback, so the reader always opens.

## 4 · Payments

1. Paystack dashboard → **Settings → API keys**.
2. `.env.local`:

   ```bash
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
   PAYSTACK_SECRET_KEY=sk_live_xxx
   PAYSTACK_CURRENCY=USD
   BIBLE_SECRETS_PRICE=5
   BIBLE_SECRETS_PERIOD_DAYS=30
   ```

3. Webhook URL: `https://your-domain/api/paystack/webhook`
   (verified by HMAC; it extends access by one period, never shortens it).
4. Test with a live key in test mode, then flip to live.

## 5 · The Bible Technology engine

The workbench is a separate Python process. It indexes 31,102 verses and
429,941 cross-reference edges, so it stays out of the Node app and is mounted at
`/engine` by a rewrite.

```bash
cd bible-tech
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
python3 build_data.py         # ~2 minutes, downloads public-domain sources
gunicorn -b 0.0.0.0:8080 server:app
```

Then, back in the platform:

```bash
BERESHIT_URL=http://127.0.0.1:8080     # or the engine's internal address
```

Host it on Fly.io / Render / Railway and point `BERESHIT_URL` at the private
address. If it is unreachable the page still teaches the four indexes and says
"Engine offline" rather than breaking.

## 6 · Deploy

1. Push this repository.
2. Vercel → **New project** → import → framework Next.js.
3. Environment variables: everything in `.env.example` that you filled in.
4. Point the domain, then update the Paystack webhook and
   `NEXT_PUBLIC_WHATSAPP_URL`.
5. Two post-deploy checks:
   - `/bible-technology` says **Engine online**;
   - a signed-out browser gets the sample on a vault volume, never the PDF.

---

## What still needs Tinotenda

1. The Supabase keys (section 1) — the platform then stores accounts, progress,
   bookmarks and entitlements for real.
2. The finished manuscripts, once they stop changing — upload them in the
   dashboard and the sample editions retire themselves.
3. Real key art, whenever it exists — drop files into `public/posters/` using the
   current names and every page updates.
4. A Paystack account (or a different processor) for the US$5 key.
5. A coffee link (Paystack page, Stripe, Ko-fi) for `site.membership.coffee.url`.
