export type Access = "public" | "members";

export type MediaKind = "pdf" | "comic" | "audio" | "video";

export interface Part {
  slug: string;
  number: number;
  title: string;
  synopsis: string;
  poster: string;
  backdrop: string;
  access: Access;
  /** Google Drive file id, when the item lives in the Drive library. */
  driveId?: string | null;
  previewUrl?: string | null;
  downloadUrl?: string | null;
  /** Self-hosted file (Supabase Storage or /uploads). Takes priority when set. */
  streamUrl?: string | null;
  trailerUrl?: string | null;
  pages?: number | null;
  duration?: string | null;
  kind?: MediaKind;
  publishedAt?: string | null;
}

export interface Series {
  slug: string;
  title: string;
  tagline: string;
  synopsis: string;
  genre: string[];
  rating: number;
  year: number;
  poster: string;
  backdrop: string;
  accent: string;
  badge: string;
  parts: Part[];
  published?: boolean;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  poster: string;
  startsAt: string;
  whatsappUrl: string;
  isPublished: boolean;
  seriesSlug?: string | null;
  host?: string;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  founder: string;
  studio: string;
  tagline: string;
  subtitle: string;
  about: string;
  verse: { ref: string; text: string };
  session: {
    day: string;
    time: string;
    timezone: string;
    channel: string;
    title: string;
    note: string;
  };
  membership: {
    trialDays: number;
    headline: string;
    blurb: string;
    priceKes: number;
    currency: string;
    coffee: { label: string; blurb: string; url: string };
  };
}

export interface BibleTechnologyConfig {
  title: string;
  engine: string;
  subtitle: string;
  poster: string;
  backdrop: string;
  defaultVerse: string;
  engineUrlEnv: string;
}

/** Shape of the shipped seed catalog (data/library.json). */
export interface SeedLiveSession {
  title: string;
  day: string;
  time: string;
  timezone: string;
  channel: string;
  poster: string;
  backdrop: string;
  whatsappUrl: string;
  notes: string;
}

export interface SeedLibrary {
  site: SiteConfig;
  series: Series[];
  liveSession: SeedLiveSession;
  bibleTechnology: BibleTechnologyConfig;
}

/** Merged catalog served to the UI (seed + admin edits). */
export interface Library {
  site: SiteConfig;
  series: Series[];
  liveSession: LiveSession;
  bibleTechnology: BibleTechnologyConfig;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: "reader" | "editor" | "admin";
  createdAt: string;
  /** ISO date the member's access started (trial clock). */
  accessStartedAt: string;
}

export interface Entitlement {
  active: boolean;
  source: "trial" | "paid" | "admin" | "none";
  startedAt: string | null;
  expiresAt: string | null;
  daysLeft: number | null;
  reason: string;
}

export interface Payment {
  id: string;
  reference: string;
  email: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
  provider: "paystack" | "manual";
  createdAt: string;
  paidAt?: string | null;
}

export interface ProgressRecord {
  userKey: string;
  partSlug: string;
  page: number;
  pageCount: number;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userKey: string;
  partSlug: string;
  page: number;
  label: string;
  createdAt: string;
}

export interface Highlight {
  id: string;
  userKey: string;
  partSlug: string;
  page: number;
  text: string;
  note: string;
  color: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  partSlug: string;
  userKey: string;
  displayName: string;
  body: string;
  createdAt: string;
}
