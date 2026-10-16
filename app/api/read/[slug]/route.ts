import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getPart } from "@/lib/library";
import { gateForPart } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Streams the volume. Public parts are open to anyone; members' parts require
 * an active entitlement. Supports `?download=1` for the attachment form.
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

  /* ------------------------------------------------------- the free 40 % */
  // A locked volume still hands over its public sample edition: the reader
  // shows those pages to a guest and overlays the unlock card on top of them.
  // The vault file itself is never touched on this path.
  if (!gate.allowed) {
    const sample = await sampleEdition(slug);
    if (sample) {
      return new NextResponse(new Uint8Array(sample), {
        headers: { ...pdfHeaders(`${filename} (sample)`, download), "x-bible-secrets-preview": "1" },
      });
    }
    return NextResponse.json({ error: "locked", reason: gate.reason }, { status: 402 });
  }

  /* ------------------------------------------------------- self-hosted file */
  if (part.streamUrl) {
    if (part.streamUrl.startsWith("/")) {
      try {
        const filePath = path.join(process.cwd(), "public", part.streamUrl.replace(/^\//, ""));
        const data = await fs.readFile(filePath);
        return new NextResponse(new Uint8Array(data), {
          headers: pdfHeaders(filename, download),
        });
      } catch {
        return NextResponse.json({ error: "file_missing" }, { status: 404 });
      }
    }

    if (isSupabaseConfigured() && part.streamUrl.includes("/object/")) {
      const admin = await createSupabaseAdminClient();
      if (admin) {
        const key = part.streamUrl.split(`/${BUCKETS.books}/`)[1];
        if (key) {
          const { data } = await admin.storage.from(BUCKETS.books).createSignedUrl(key, 60 * 60);
          if (data?.signedUrl) {
            const res = await fetch(data.signedUrl);
            if (res.ok && res.body) {
              return new NextResponse(res.body as ReadableStream, {
                headers: pdfHeaders(filename, download),
              });
            }
          }
        }
      }
    }

    const remote = await fetch(part.streamUrl);
    if (remote.ok && remote.body) {
      return new NextResponse(remote.body as ReadableStream, {
        headers: pdfHeaders(filename, download, remote.headers.get("content-length")),
      });
    }
  }

  /* --------------------------------------------------- local sample edition */
  // Keeps the reader demonstrable before the vault (Drive / Storage) is wired up.
  const sample = await sampleEdition(slug);
  if (sample) {
    return new NextResponse(new Uint8Array(sample), {
      headers: pdfHeaders(`${filename} (sample)`, download),
    });
  }

  /* --------------------------------------------------------- Google Drive */
  if (part.downloadUrl) {
    try {
      const res = await fetch(part.downloadUrl, { redirect: "follow" });
      const contentType = res.headers.get("content-type") ?? "";
      if (res.ok && res.body && !contentType.includes("text/html")) {
        return new NextResponse(res.body as ReadableStream, {
          headers: pdfHeaders(filename, download, res.headers.get("content-length")),
        });
      }
    } catch (error) {
      console.warn("[read] drive fetch failed, falling back to preview frame", error);
    }

    // Interstitial page or an unreachable host: the browser can still load the
    // Drive preview frame directly, so hand it over rather than failing.
    if (part.previewUrl) {
      return NextResponse.redirect(part.previewUrl);
    }
    return NextResponse.json(
      {
        error: "drive_unavailable",
        hint: "Make the Drive file public, or upload it to Supabase Storage and set streamUrl.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ error: "no_source" }, { status: 404 });
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
