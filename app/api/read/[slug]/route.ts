import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPart } from "@/lib/library";
import { gateForPart } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/config";
import type { Part } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Streams a volume. Three sources, in a deliberate order:
 *
 *   vault parts   → private Supabase Storage (`storage://books/<key>`), signed
 *                   after the entitlement check. Drive is *never* used for the
 *                   vault, so a leaked link cannot outlive a membership.
 *   public parts  → the public Drive copy, for the free 40 %.
 *   either        → the generated sample edition, so the reader still opens
 *                   while the vault is being filled.
 *
 * Guests never reach the real file: they get the sample edition and the reader
 * lays its unlock card over the pages.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const found = getPart(slug);
  if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { part } = found;
  const user = await getCurrentUser();
  const gate = gateForPart(part, user);

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const filename = `${part.title.replace(/[^\w\s.-]/g, "").trim()}.pdf`;
  const isVault = part.access !== "public";

  /* --------------------------------------------------------- the free 40 % */
  if (!gate.allowed) {
    const sample = await sampleEdition(slug);
    if (sample) {
      return new NextResponse(new Uint8Array(sample), {
        headers: {
          ...pdfHeaders(`${filename} (sample)`, download),
          "x-bible-secrets-preview": "1",
        },
      });
    }
    return NextResponse.json({ error: "locked", reason: gate.reason }, { status: 402 });
  }

  /* ---------------------------------------------- 1 · private vault (Storage) */
  const vault = await storageEdition(part);
  if (vault) {
    return new NextResponse(vault.body, {
      headers: {
        ...pdfHeaders(filename, download, vault.length),
        "x-bible-secrets-source": "storage",
      },
    });
  }

  /* ------------------------------------------------- 2 · file on this server */
  if (part.streamUrl?.startsWith("/")) {
    try {
      const filePath = path.join(process.cwd(), "public", part.streamUrl.replace(/^\//, ""));
      const data = await fs.readFile(filePath);
      return new NextResponse(new Uint8Array(data), {
        headers: { ...pdfHeaders(filename, download), "x-bible-secrets-source": "local" },
      });
    } catch {
      return NextResponse.json({ error: "file_missing" }, { status: 404 });
    }
  }

  /* ------------------------------------- 3 · public Drive copy (never vault) */
  if (!isVault && part.downloadUrl) {
    try {
      const res = await fetch(part.downloadUrl, { redirect: "follow" });
      const contentType = res.headers.get("content-type") ?? "";
      if (res.ok && res.body && !contentType.includes("text/html")) {
        return new NextResponse(res.body as ReadableStream, {
          headers: {
            ...pdfHeaders(filename, download, res.headers.get("content-length")),
            "x-bible-secrets-source": "drive",
          },
        });
      }
    } catch (error) {
      console.warn("[read] drive fetch failed, serving the sample edition", error);
    }
  }

  /* --------------------------------------------- 4 · sample edition fallback */
  // Demo mode: the vault is still filling, so an entitled member keeps reading.
  const sample = await sampleEdition(slug);
  if (sample) {
    return new NextResponse(new Uint8Array(sample), {
      headers: { ...pdfHeaders(`${filename} (sample)`, download), "x-bible-secrets-source": "sample" },
    });
  }

  /* ------------------------------- 5 · last resort: the public Drive preview */
  if (!isVault && part.previewUrl) {
    return NextResponse.redirect(part.previewUrl);
  }

  return NextResponse.json(
    {
      error: "no_source",
      hint: isVault
        ? "Upload the vault PDF from the publisher dashboard — it goes into the private books bucket."
        : "Set a Drive id or upload the file for this public part.",
    },
    { status: 404 },
  );
}

/**
 * Signs a Storage object for an entitled reader. Accepts both the reference the
 * dashboard writes (`storage://books/<key>`) and a legacy public URL that
 * happens to point at the private bucket.
 */
async function storageEdition(
  part: Part,
): Promise<{ body: ReadableStream; length: string | null } | null> {
  const ref = part.streamUrl;
  if (!ref || !isSupabaseConfigured()) return null;

  const key = ref.startsWith("storage://")
    ? ref.replace(/^storage:\/\/[^/]+\//, "")
    : ref.includes(`/${BUCKETS.books}/`)
      ? ref.split(`/${BUCKETS.books}/`)[1]
      : null;
  if (!key) return null;

  const admin = await createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin.storage.from(BUCKETS.books).createSignedUrl(key, 60 * 60);
  if (error || !data?.signedUrl) {
    console.warn("[read] could not sign the vault object", error?.message);
    return null;
  }

  const res = await fetch(data.signedUrl);
  if (!res.ok || !res.body) return null;
  return { body: res.body as ReadableStream, length: res.headers.get("content-length") };
}

/** The generated public sample for a volume, if one exists. */
async function sampleEdition(slug: string): Promise<Buffer | null> {
  if (process.env.BIBLE_SECRETS_SAMPLES === "0") return null;
  try {
    return await fs.readFile(path.join(process.cwd(), "public", "samples", `${slug}.pdf`));
  } catch {
    return null;
  }
}

function pdfHeaders(filename: string, download: boolean, length?: string | null) {
  const headers: Record<string, string> = {
    "content-type": "application/pdf",
    "cache-control": "private, max-age=300",
    "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
  };
  if (length) headers["content-length"] = length;
  return headers;
}
