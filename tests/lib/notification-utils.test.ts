import { describe, it, expect, beforeEach, vi } from "vitest";
import { generateNotifications } from "@/lib/notification-utils";
import type { AppNotification, InventoryItem, Meal, Recipe } from "@/lib/types";

const recipes: Recipe[] = [
  {
    id: "r1",
    title: "Pasta",
    description: "",
    ingredients: [],
    instructions: [],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    tags: [],
    source: "manual",
    createdAt: "2026-01-01T00:00:00Z",
    version: 1,
  },
];

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

// Item expiring tomorrow
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];

// Item expired yesterday
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

describe("generateNotifications", () => {
  it("generates expiry-alert for near-expiry items", () => {
    const inventory: InventoryItem[] = [
      {
        id: "inv-1", name: "Chicken", quantity: 300, unit: "g",
        category: "Meat & Fish", addedAt: "2026-01-01T00:00:00Z",
        expiresAt: tomorrowStr,
      },
    ];

    const result = generateNotifications([], inventory, [], recipes);
    const expiryAlerts = result.filter((n) => n.type === "expiry-alert");
    expect(expiryAlerts.length).toBe(1);
    expect(expiryAlerts[0].message).toContain("Chicken");
    expect(expiryAlerts[0].inventoryItemId).toBe("inv-1");
  });

  it("generates expiry-alert for expired items", () => {
    const inventory: InventoryItem[] = [
      {
        id: "inv-2", name: "Milk", quantity: 1, unit: "l",
        category: "Dairy", addedAt: "2026-01-01T00:00:00Z",
        expiresAt: yesterdayStr,
      },
    ];

    const result = generateNotifications([], inventory, [], recipes);
    const expiryAlerts = result.filter((n) => n.type === "expiry-alert");
    expect(expiryAlerts.length).toBe(1);
    expect(expiryAlerts[0].message).toContain("expired");
  });

  it("skips zero-quantity items for expiry alerts", () => {
    const inventory: InventoryItem[] = [
      {
        id: "inv-3", name: "Empty item", quantity: 0, unit: "piece",
        category: "Other", addedAt: "2026-01-01T00:00:00Z",
        expiresAt: yesterdayStr,
      },
    ];

    const result = generateNotifications([], inventory, [], recipes);
    expect(result.filter((n) => n.type === "expiry-alert")).toHaveLength(0);
  });

  it("generates rating-reminder for cooked unrated meals", () => {
    const meals: Meal[] = [
      {
        id: "m1", date: yesterdayStr, slot: "Dinner", recipeId: "r1",
        servings: 2, status: "cooked", rated: false,
        cookedAt: yesterday.toISOString(),
      },
    ];

    const result = generateNotifications([], [], meals, recipes);
    const ratingReminders = result.filter((n) => n.type === "rating-reminder");
    expect(ratingReminders.length).toBe(1);
    expect(ratingReminders[0].message).toContain("Pasta");
    expect(ratingReminders[0].mealId).toBe("m1");
  });

  it("does not generate rating-reminder for rated meals", () => {
    const meals: Meal[] = [
      {
        id: "m2", date: yesterdayStr, slot: "Dinner", recipeId: "r1",
        servings: 2, status: "cooked", rated: true,
      },
    ];

    const result = generateNotifications([], [], meals, recipes);
    expect(result.filter((n) => n.type === "rating-reminder")).toHaveLength(0);
  });

  it("generates meal-reminder for today's planned meals", () => {
    const meals: Meal[] = [
      {
        id: "m3", date: todayStr, slot: "Lunch", recipeId: "r1",
        servings: 2, status: "planned", rated: false,
      },
    ];

    const result = generateNotifications([], [], meals, recipes);
    const mealReminders = result.filter((n) => n.type === "meal-reminder");
    expect(mealReminders.length).toBe(1);
    expect(mealReminders[0].message).toContain("Pasta");
    expect(mealReminders[0].message).toContain("lunch");
  });

  it("does not duplicate existing notifications", () => {
    const meals: Meal[] = [
      {
        id: "m1", date: yesterdayStr, slot: "Dinner", recipeId: "r1",
        servings: 2, status: "cooked", rated: false,
      },
    ];

    const existing: AppNotification[] = [
      {
        id: "rating-m1", type: "rating-reminder", title: "Rate your meal",
        message: "How was the Pasta?", createdAt: yesterday.toISOString(),
        read: true, dismissed: false, recipeId: "r1", mealId: "m1",
      },
    ];

    const result = generateNotifications(existing, [], meals, recipes);
    const ratingReminders = result.filter((n) => n.type === "rating-reminder");
    expect(ratingReminders.length).toBe(1); // existing, not duplicated
    expect(ratingReminders[0].read).toBe(true); // preserved read state
  });

  it("preserves read/dismissed state of existing notifications", () => {
    const existing: AppNotification[] = [
      {
        id: "expiry-soon-inv-1", type: "expiry-alert", title: "Expiring",
        message: "Chicken", createdAt: "2026-01-01T00:00:00Z",
        read: true, dismissed: true, inventoryItemId: "inv-1",
      },
    ];

    const inventory: InventoryItem[] = [
      {
        id: "inv-1", name: "Chicken", quantity: 300, unit: "g",
        category: "Meat", addedAt: "2026-01-01T00:00:00Z",
        expiresAt: tomorrowStr,
      },
    ];

    const result = generateNotifications(existing, inventory, [], recipes);
    const match = result.find((n) => n.id === "expiry-soon-inv-1");
    expect(match).toBeDefined();
    expect(match!.read).toBe(true);
    expect(match!.dismissed).toBe(true);
  });

  it("returns empty array when no notifications needed", () => {
    const result = generateNotifications([], [], [], recipes);
    expect(result).toHaveLength(0);
  });
});
