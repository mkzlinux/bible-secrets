import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(iso)} · ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** Next Tuesday 20:00 in CAT (GMT+2). */
export function nextSessionDate(from: Date = new Date()): Date {
  const utc = new Date(from.getTime() + from.getTimezoneOffset() * 60_000);
  const target = new Date(utc);
  const day = target.getDay(); // 0 Sun … 2 Tue
  let delta = (2 - day + 7) % 7;
  target.setHours(20, 0, 0, 0);
  if (delta === 0 && target.getTime() <= utc.getTime()) delta = 7;
  target.setDate(target.getDate() + delta);
  // 20:00 CAT == 18:00 UTC
  return new Date(
    Date.UTC(target.getFullYear(), target.getMonth(), target.getDate(), 18, 0, 0),
  );
}

export function countdown(targetIso: string, now: Date = new Date()) {
  const diff = new Date(targetIso).getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const seconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    past: false,
  };
}

export function currency(amount: number, code = "KES") {
  const symbol = code === "KES" ? "KSh" : code === "USD" ? "$" : code + " ";
  return `${symbol}${amount.toLocaleString("en-KE")}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
