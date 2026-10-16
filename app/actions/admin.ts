"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { isAdmin, getCurrentUser } from "@/lib/auth";
import { UPLOAD_DIR, deletePart, deleteSession, id as newId, upsertSession, updatePart, addPart, addPart as _addPart, setGrant, upsertUser } from "@/lib/store";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/config";
import type { LiveSession, Part, Series } from "@/lib/types";

void _addPart;

export interface AdminState {
  ok?: boolean;
  error?: string;
  message?: string;
  url?: string;
}

async function guard() {
  const ok = await isAdmin();
  if (!ok) throw new Error("not_authorised");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Save an upload to Supabase Storage when configured, else to /public/uploads. */
async function storeUpload(file: File, kind: "covers" | "books" | "media") {
  const clean = file.name.replace(/[^\w.-]+/g, "-");
  const filename = `${Date.now()}-${clean}`;

  const admin = await createSupabaseAdminClient();
  if (isSupabaseConfigured() && admin) {
    const bucket = BUCKETS[kind];
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage
      .from(bucket)
      .upload(filename, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw new Error(error.message);
    const { data } = admin.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}

async function fileFrom(formData: FormData, key: string) {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) return value;
  return null;
}

/* ------------------------------------------------------------------- parts */

export async function savePartAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await guard();
  } catch {
    return { error: "You are not signed in as a publisher." };
  }

  const seriesSlug = String(formData.get("seriesSlug") ?? "").trim();
  const existingSlug = String(formData.get("existingSlug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const number = Number(formData.get("number") ?? 0) || 1;
  const synopsis = String(formData.get("synopsis") ?? "").trim();
  const access = (String(formData.get("access") ?? "members") === "public" ? "public" : "members") as
    | "public"
    | "members";
  const driveId = String(formData.get("driveId") ?? "").trim();
  const streamUrlInput = String(formData.get("streamUrl") ?? "").trim();
  const trailerUrl = String(formData.get("trailerUrl") ?? "").trim();
  const pages = Number(formData.get("pages") ?? 0) || null;
  const posterInput = String(formData.get("poster") ?? "").trim();

  if (!title) return { error: "A title is required." };
  if (!seriesSlug) return { error: "Pick the series this volume belongs to." };

  const slug = existingSlug || slugify(`${seriesSlug}-${number}-${title}`);

  let poster = posterInput;
  let streamUrl = streamUrlInput || null;

  const posterFile = await fileFrom(formData, "posterFile");
  if (posterFile) poster = await storeUpload(posterFile, "covers");

  const pdfFile = await fileFrom(formData, "pdfFile");
  if (pdfFile) streamUrl = await storeUpload(pdfFile, "books");

  const drive = driveId
    ? {
        driveId,
        previewUrl: `https://drive.google.com/file/d/${driveId}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
      }
    : {};

  const part: Part = {
    slug,
    number,
    title,
    synopsis: synopsis || title,
    poster: poster || "/posters/poster-bereshit.jpg",
    backdrop: (poster || "/posters/backdrop-bereshit.jpg").replace("poster-", "backdrop-"),
    access,
    pages,
    trailerUrl: trailerUrl || null,
    streamUrl,
    kind: "pdf",
    ...drive,
  };

  if (existingSlug) updatePart(existingSlug, part);
  else addPart(seriesSlug, part);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/series/${seriesSlug}`);
  return { ok: true, message: existingSlug ? `Updated “${title}”.` : `Added “${title}”.` };
}

export async function deletePartAction(formData: FormData): Promise<void> {
  await guard();
  const slug = String(formData.get("slug") ?? "");
  if (slug) deletePart(slug);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveSeriesMetaAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await guard();
  } catch {
    return { error: "You are not signed in as a publisher." };
  }
  const slug = String(formData.get("slug") ?? "");
  const title = String(formData.get("title") ?? "");
  const tagline = String(formData.get("tagline") ?? "");
  const synopsis = String(formData.get("synopsis") ?? "");
  const badge = String(formData.get("badge") ?? "");
  if (!slug) return { error: "Missing series." };

  const { update } = await import("@/lib/store");
  update((data) => {
    data.seriesOverrides[slug] = { ...(data.seriesOverrides[slug] ?? {}), title, tagline, synopsis, badge };
    return null;
  });
  revalidatePath("/admin");
  revalidatePath(`/series/${slug}`);
  return { ok: true, message: `Series “${title || slug}” updated.` };
}

/* ---------------------------------------------------------------- sessions */

export async function saveSessionAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  try {
    await guard();
  } catch {
    return { error: "You are not signed in as a publisher." };
  }

  const existingId = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const whatsappUrl = String(formData.get("whatsappUrl") ?? "").trim();
  let poster = String(formData.get("poster") ?? "").trim() || "/posters/poster-session.jpg";

  if (!title) return { error: "Give the session a title." };

  const file = await fileFrom(formData, "posterFile");
  if (file) poster = await storeUpload(file, "covers");

  const session: LiveSession = {
    id: existingId || newId(),
    title,
    description: description || "Session notes will be published after the meeting.",
    poster,
    startsAt: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
    whatsappUrl,
    isPublished: true,
    host: "Tinotenda Gwiriri",
  };

  upsertSession(session);
  revalidatePath("/");
  revalidatePath("/live");
  revalidatePath("/admin/sessions");
  return { ok: true, message: `Session “${title}” saved.` };
}

export async function deleteSessionAction(formData: FormData): Promise<void> {
  await guard();
  const sessionId = String(formData.get("id") ?? "");
  if (sessionId) deleteSession(sessionId);
  revalidatePath("/admin/sessions");
  revalidatePath("/live");
}

/* -------------------------------------------------------------------- users */

export async function grantAccessAction(formData: FormData): Promise<void> {
  await guard();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const action = String(formData.get("action") ?? "grant");
  if (!email) return;

  const record = upsertUser({ email, displayName: email.split("@")[0] });
  if (action === "revoke") {
    setGrant(record.id, { active: false, expiresAt: null, source: "admin" });
  } else {
    const days = Number(formData.get("days") ?? 365) || 365;
    setGrant(record.id, {
      active: true,
      expiresAt: new Date(Date.now() + days * 86_400_000).toISOString(),
      source: "admin",
    });
  }
  revalidatePath("/admin/users");
}

export async function setRoleAction(formData: FormData): Promise<void> {
  await guard();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "reader") as "reader" | "editor" | "admin";
  if (!email) return;
  upsertUser({ email, role });
  revalidatePath("/admin/users");
}

export async function whoAmI(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email ?? null;
}

export type { Series };
