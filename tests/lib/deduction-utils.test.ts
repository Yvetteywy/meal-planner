import { describe, it, expect } from "vitest";
import { convertUnit, deductIngredients } from "@/lib/deduction-utils";
import type { InventoryItem, RecipeIngredient } from "@/lib/types";

describe("convertUnit", () => {
  it("returns same quantity for same unit", () => {
    expect(convertUnit(500, "g", "g")).toBe(500);
  });

  it("converts kg to g", () => {
    expect(convertUnit(0.5, "kg", "g")).toBe(500);
  });

  it("converts g to kg", () => {
    expect(convertUnit(500, "g", "kg")).toBe(0.5);
  });

  it("converts lb to g", () => {
    expect(convertUnit(1, "lb", "g")).toBeCloseTo(453.6, 1);
  });

  it("converts l to ml", () => {
    expect(convertUnit(0.5, "l", "ml")).toBe(500);
  });

  it("converts cup to ml", () => {
    expect(convertUnit(1, "cup", "ml")).toBeCloseTo(236.59, 1);
  });

  it("converts tbsp to tsp", () => {
    expect(convertUnit(1, "tbsp", "tsp")).toBeCloseTo(3, 0);
  });

  it("returns null for incompatible units (weight vs volume)", () => {
    expect(convertUnit(100, "g", "ml")).toBeNull();
  });

  it("returns null for incompatible units (discrete vs weight)", () => {
    expect(convertUnit(1, "piece", "g")).toBeNull();
  });

  it("converts qt to ml", () => {
    expect(convertUnit(1, "qt", "ml")).toBeCloseTo(946.35, 1);
  });

  it("converts gal to l", () => {
    expect(convertUnit(1, "gal", "l")).toBeCloseTo(3.785, 2);
  });
});

describe("deductIngredients", () => {
  const makeInventory = (items: Partial<InventoryItem>[]): InventoryItem[] =>
    items.map((item, i) => ({
      id: `inv-${i}`,
      name: item.name ?? "item",
      quantity: item.quantity ?? 0,
      unit: item.unit ?? "g",
      category: "Other",
      addedAt: "2026-01-01",
      ...item,
    })) as InventoryItem[];

  it("deducts exact match", () => {
    const inventory = makeInventory([{ name: "chicken", quantity: 500, unit: "g" }]);
    const ingredients: RecipeIngredient[] = [{ name: "chicken", quantity: 300, unit: "g" }];

    const { updated, log } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBe(200);
    expect(log[0].status).toBe("deducted");
  });

  it("deducts to zero when insufficient", () => {
    const inventory = makeInventory([{ name: "butter", quantity: 100, unit: "g" }]);
    const ingredients: RecipeIngredient[] = [{ name: "butter", quantity: 200, unit: "g" }];

    const { updated, log } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBe(0);
    expect(log[0].status).toBe("insufficient");
  });

  it("never goes negative", () => {
    const inventory = makeInventory([{ name: "salt", quantity: 10, unit: "g" }]);
    const ingredients: RecipeIngredient[] = [{ name: "salt", quantity: 50, unit: "g" }];

    const { updated } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBeGreaterThanOrEqual(0);
  });

  it("logs not-found for missing items", () => {
    const inventory = makeInventory([]);
    const ingredients: RecipeIngredient[] = [{ name: "garlic", quantity: 4, unit: "piece" }];

    const { log } = deductIngredients(inventory, ingredients);
    expect(log[0].status).toBe("not-found");
  });

  it("handles case-insensitive matching", () => {
    const inventory = makeInventory([{ name: "Chicken Breast", quantity: 500, unit: "g" }]);
    const ingredients: RecipeIngredient[] = [{ name: "chicken breast", quantity: 300, unit: "g" }];

    const { updated, log } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBe(200);
    expect(log[0].status).toBe("deducted");
  });

  it("converts compatible units (recipe l, inventory ml)", () => {
    const inventory = makeInventory([{ name: "milk", quantity: 800, unit: "ml" }]);
    const ingredients: RecipeIngredient[] = [{ name: "milk", quantity: 0.5, unit: "l" }];

    const { updated, log } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBe(300);
    expect(log[0].status).toBe("deducted");
  });

  it("logs unit-mismatch for incompatible units", () => {
    const inventory = makeInventory([{ name: "eggs", quantity: 12, unit: "piece" }]);
    const ingredients: RecipeIngredient[] = [{ name: "eggs", quantity: 100, unit: "g" }];

    const { log } = deductIngredients(inventory, ingredients);
    expect(log[0].status).toBe("unit-mismatch");
  });

  it("applies serving multiplier", () => {
    const inventory = makeInventory([{ name: "pasta", quantity: 1000, unit: "g" }]);
    const ingredients: RecipeIngredient[] = [{ name: "pasta", quantity: 200, unit: "g" }];

    const { updated } = deductIngredients(inventory, ingredients, 2);
    expect(updated[0].quantity).toBe(600); // 1000 - (200 * 2) = 600
  });

  it("deducts multiple ingredients in one call", () => {
    const inventory = makeInventory([
      { name: "pasta", quantity: 500, unit: "g" },
      { name: "butter", quantity: 100, unit: "g" },
    ]);
    const ingredients: RecipeIngredient[] = [
      { name: "pasta", quantity: 200, unit: "g" },
      { name: "butter", quantity: 30, unit: "g" },
    ];

    const { updated, log } = deductIngredients(inventory, ingredients);
    expect(updated[0].quantity).toBe(300);
    expect(updated[1].quantity).toBe(70);
    expect(log).toHaveLength(2);
    expect(log.every((l) => l.status === "deducted")).toBe(true);
  });
});
