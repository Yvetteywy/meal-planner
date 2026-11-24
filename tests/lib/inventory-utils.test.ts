import { describe, it, expect } from "vitest";
import { isNearExpiry, isExpired } from "@/lib/inventory-utils";

const NOW = new Date("2026-04-07T12:00:00Z");

describe("isExpired", () => {
  it("returns false when no expiry date is provided", () => {
    expect(isExpired(undefined, NOW)).toBe(false);
  });

  it("returns true when the expiry date is in the past", () => {
    expect(isExpired("2026-04-06", NOW)).toBe(true);
  });

  it("returns false when the expiry date is in the future", () => {
    expect(isExpired("2026-04-20", NOW)).toBe(false);
  });

  it("returns false when the expiry date is today (end of day hasn't passed)", () => {
    // Expiry at midnight Apr 8 vs now at noon Apr 7 → not expired
    expect(isExpired("2026-04-08", NOW)).toBe(false);
  });
});

describe("isNearExpiry", () => {
  it("returns false when no expiry date is provided", () => {
    expect(isNearExpiry(undefined, NOW)).toBe(false);
  });

  it("returns false when already expired", () => {
    expect(isNearExpiry("2026-04-06", NOW)).toBe(false);
  });

  it("returns true when expiry is within 3 days", () => {
    // Apr 9 = 2 days from now
    expect(isNearExpiry("2026-04-09", NOW)).toBe(true);
  });

  it("returns true when expiry is exactly 1 day away", () => {
    expect(isNearExpiry("2026-04-08", NOW)).toBe(true);
  });

  it("returns false when expiry is more than 3 days away", () => {
    expect(isNearExpiry("2026-04-20", NOW)).toBe(false);
  });

  it("returns false when expiry is exactly 3 days away (boundary)", () => {
    // Exactly 3 * 24h from NOW → diff === 3 days → not < 3 days
    const exactly3Days = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(isNearExpiry(exactly3Days.toISOString(), NOW)).toBe(false);
  });
});
