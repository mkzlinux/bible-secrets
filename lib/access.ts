import { snapshot } from "./store";
import type { Entitlement, Part, UserRecord } from "./types";

export const TRIAL_DAYS = Number(process.env.BIBLE_SECRETS_TRIAL_DAYS ?? "90");

const DAY = 86_400_000;

/**
 * Access model:
 *   • every visitor can open any part marked `public` (~40% of each series);
 *   • signing in opens the whole vault for TRIAL_DAYS (default 90);
 *   • after that a small payment keeps it open, an admin can grant it, or the
 *     member supports with a coffee (donations never gate, they bless).
 */
export function entitlementFor(user: UserRecord | null): Entitlement {
  if (!user) {
    return {
      active: false,
      source: "none",
      startedAt: null,
      expiresAt: null,
      daysLeft: null,
      reason: "Sign in to open the full vault.",
    };
  }

  if (user.role === "admin" || user.role === "editor") {
    return {
      active: true,
      source: "admin",
      startedAt: user.accessStartedAt,
      expiresAt: null,
      daysLeft: null,
      reason: "Staff access.",
    };
  }

  const grant = snapshot().grants[user.id];
  if (grant?.active) {
    const expired = grant.expiresAt ? new Date(grant.expiresAt).getTime() < Date.now() : false;
    if (!expired) {
      return {
        active: true,
        source: grant.source === "admin" ? "admin" : "paid",
        startedAt: user.accessStartedAt,
        expiresAt: grant.expiresAt,
        daysLeft: grant.expiresAt
          ? Math.max(0, Math.ceil((new Date(grant.expiresAt).getTime() - Date.now()) / DAY))
          : null,
        reason: "Full access unlocked. Thank you.",
      };
    }
  }

  const started = new Date(user.accessStartedAt).getTime();
  const expires = started + TRIAL_DAYS * DAY;
  const daysLeft = Math.ceil((expires - Date.now()) / DAY);

  if (daysLeft > 0) {
    return {
      active: true,
      source: "trial",
      startedAt: user.accessStartedAt,
      expiresAt: new Date(expires).toISOString(),
      daysLeft,
      reason: `${daysLeft} day${daysLeft === 1 ? "" : "s"} of full access left in your first three months.`,
    };
  }

  return {
    active: false,
    source: "none",
    startedAt: user.accessStartedAt,
    expiresAt: new Date(expires).toISOString(),
    daysLeft: 0,
    reason: `${TRIAL_DAYS} days are complete — keep the vault open with a small key fee.`,
  };
}

export interface GateResult {
  allowed: boolean;
  needsSignIn: boolean;
  needsPayment: boolean;
  reason: string;
}

export function gateForPart(part: Part, user: UserRecord | null): GateResult {
  if (part.access === "public") {
    return { allowed: true, needsSignIn: false, needsPayment: false, reason: "Open to everyone." };
  }
  if (!user) {
    return {
      allowed: false,
      needsSignIn: true,
      needsPayment: false,
      reason:
        "This part is inside the members' vault. Create a free account — your first three months are open.",
    };
  }
  const entitlement = entitlementFor(user);
  if (entitlement.active) {
    return { allowed: true, needsSignIn: false, needsPayment: false, reason: entitlement.reason };
  }
  return {
    allowed: false,
    needsSignIn: false,
    needsPayment: true,
    reason: entitlement.reason,
  };
}
