import { describe, it, expect } from "vitest";
import { getMondayOf, getWeekDates } from "@/lib/date-utils";

// Use local dates (month is 0-indexed) to avoid UTC timezone shifts
describe("getMondayOf", () => {
  it("returns the same date when given a Monday", () => {
    const monday = new Date(2026, 3, 6); // Mon Apr 6
    const result = getMondayOf(monday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Wednesday", () => {
    const wednesday = new Date(2026, 3, 8); // Wed Apr 8
    const result = getMondayOf(wednesday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Sunday", () => {
    const sunday = new Date(2026, 3, 12); // Sun Apr 12
    const result = getMondayOf(sunday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("returns the previous Monday for a Saturday", () => {
    const saturday = new Date(2026, 3, 11); // Sat Apr 11
    const result = getMondayOf(saturday);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(6);
  });

  it("zeroes out the time component", () => {
    const date = new Date(2026, 3, 9, 15, 30, 0);
    const result = getMondayOf(date);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });
});

describe("getWeekDates", () => {
  it("returns exactly 7 dates", () => {
    const monday = new Date(2026, 3, 6);
    const dates = getWeekDates(monday);
    expect(dates).toHaveLength(7);
  });

  it("starts from the given Monday and ends on Sunday", () => {
    const monday = new Date(2026, 3, 6);
    const dates = getWeekDates(monday);
    expect(dates[0].getDate()).toBe(6);
    expect(dates[6].getDate()).toBe(12);
  });

  it("returns consecutive dates", () => {
    const monday = new Date(2026, 3, 6);
    const dates = getWeekDates(monday);
    for (let i = 1; i < dates.length; i++) {
      const diff = dates[i].getTime() - dates[i - 1].getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("handles month boundaries correctly", () => {
    const monday = new Date(2026, 2, 30); // Mon Mar 30
    const dates = getWeekDates(monday);
    expect(dates[0].getMonth()).toBe(2); // March
    expect(dates[6].getMonth()).toBe(3); // April
  });
});
