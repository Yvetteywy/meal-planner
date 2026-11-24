/**
 * Inventory utility functions for expiry date checks.
 */

/** Returns true if the item expires within 3 days (but is not yet expired). */
export function isNearExpiry(expiresAt?: string, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

/** Returns true if the item is already expired. */
export function isExpired(expiresAt?: string, now: Date = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now.getTime();
}
