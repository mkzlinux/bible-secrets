/**
 * Local content store — the zero-configuration backend.
 *
 * Everything the admin dashboard writes lands in `data/content/store.json`
 * while Supabase is not configured, so the platform is fully demonstrable
 * before the keys are pasted in. Once `NEXT_PUBLIC_SUPABASE_URL` and the
 * service-role key exist, the admin routes talk to Supabase instead
 * (see `supabase/schema.sql`); the read path merges the same shape.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Bookmark,
  CommentItem,
  Highlight,
  LiveSession,
  Part,
  Payment,
  ProgressRecord,
  Series,
  UserRecord,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "content", "store.json");
export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export interface StoreShape {
  parts: Part[];
  partSeries: Record<string, string>;
  partOverrides: Record<string, Partial<Part>>;
  series: Series[];
  seriesOverrides: Record<string, Partial<Series>>;
  hiddenParts: string[];
  sessions: LiveSession[];
  users: UserRecord[];
  payments: Payment[];
  grants: Record<string, { active: boolean; expiresAt: string | null; source: string }>;
  progress: ProgressRecord[];
  bookmarks: Bookmark[];
  highlights: Highlight[];
  comments: CommentItem[];
}

const EMPTY: StoreShape = {
  parts: [],
  partSeries: {},
  partOverrides: {},
  series: [],
  seriesOverrides: {},
  hiddenParts: [],
  sessions: [],
  users: [],
  payments: [],
  grants: {},
  progress: [],
  bookmarks: [],
  highlights: [],
  comments: [],
};

function read(): StoreShape {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    return { ...EMPTY, ...(JSON.parse(raw) as StoreShape) };
  } catch {
    return { ...EMPTY };
  }
}

function write(data: StoreShape) {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2) + "\n");
}

export function update<T>(mutator: (data: StoreShape) => T): T {
  const data = read();
  const result = mutator(data);
  write(data);
  return result;
}

export function snapshot(): StoreShape {
  return read();
}

export function id() {
  return randomUUID();
}

/* ------------------------------------------------------------------ parts */

export function addPart(seriesSlug: string, part: Part) {
  return update((s) => {
    s.parts = s.parts.filter((p) => p.slug !== part.slug).concat(part);
    s.partSeries[part.slug] = seriesSlug;
    return part;
  });
}

export function updatePart(slug: string, patch: Partial<Part>) {
  return update((s) => {
    const existing = s.parts.find((p) => p.slug === slug);
    if (existing) {
      s.parts = s.parts.map((p) => (p.slug === slug ? { ...p, ...patch } : p));
    }
    s.partOverrides[slug] = { ...(s.partOverrides[slug] ?? {}), ...patch };
    return s.partOverrides[slug];
  });
}

export function deletePart(slug: string) {
  return update((s) => {
    s.parts = s.parts.filter((p) => p.slug !== slug);
    s.hiddenParts = Array.from(new Set([...s.hiddenParts, slug]));
    delete s.partOverrides[slug];
    return slug;
  });
}

/* --------------------------------------------------------------- sessions */

export function upsertSession(session: LiveSession) {
  return update((s) => {
    const idx = s.sessions.findIndex((x) => x.id === session.id);
    if (idx >= 0) s.sessions[idx] = session;
    else s.sessions.unshift(session);
    return session;
  });
}

export function deleteSession(sessionId: string) {
  return update((s) => {
    s.sessions = s.sessions.filter((x) => x.id !== sessionId);
    return sessionId;
  });
}

/* ------------------------------------------------------------------ users */

export function upsertUser(user: Partial<UserRecord> & { email: string }) {
  return update((s) => {
    const existing = s.users.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
    if (existing) {
      Object.assign(existing, user);
      return existing;
    }
    const created: UserRecord = {
      id: user.id ?? id(),
      email: user.email,
      displayName: user.displayName ?? user.email.split("@")[0],
      role: user.role ?? "reader",
      createdAt: new Date().toISOString(),
      accessStartedAt: user.accessStartedAt ?? new Date().toISOString(),
    };
    s.users.push(created);
    return created;
  });
}

export function findUser(email: string) {
  return read().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function setGrant(userId: string, grant: StoreShape["grants"][string]) {
  return update((s) => {
    s.grants[userId] = grant;
    return grant;
  });
}

export function recordPayment(payment: Payment) {
  return update((s) => {
    s.payments = [payment, ...s.payments.filter((p) => p.reference !== payment.reference)];
    return payment;
  });
}

/* -------------------------------------------------------------- reader UX */

export function saveProgress(record: ProgressRecord) {
  return update((s) => {
    s.progress = [
      record,
      ...s.progress.filter(
        (p) => !(p.userKey === record.userKey && p.partSlug === record.partSlug),
      ),
    ].slice(0, 500);
    return record;
  });
}

export function toggleBookmark(bookmark: Omit<Bookmark, "id" | "createdAt">) {
  return update((s) => {
    const found = s.bookmarks.find(
      (b) => b.userKey === bookmark.userKey && b.partSlug === bookmark.partSlug && b.page === bookmark.page,
    );
    if (found) {
      s.bookmarks = s.bookmarks.filter((b) => b.id !== found.id);
      return null;
    }
    const created: Bookmark = { ...bookmark, id: id(), createdAt: new Date().toISOString() };
    s.bookmarks = [created, ...s.bookmarks].slice(0, 1000);
    return created;
  });
}

export function addHighlight(highlight: Omit<Highlight, "id" | "createdAt">) {
  return update((s) => {
    const created: Highlight = { ...highlight, id: id(), createdAt: new Date().toISOString() };
    s.highlights = [created, ...s.highlights].slice(0, 1000);
    return created;
  });
}

export function addComment(comment: Omit<CommentItem, "id" | "createdAt">) {
  return update((s) => {
    const created: CommentItem = { ...comment, id: id(), createdAt: new Date().toISOString() };
    s.comments = [created, ...s.comments].slice(0, 2000);
    return created;
  });
}
