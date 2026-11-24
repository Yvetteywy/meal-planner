import { describe, it, expect } from "vitest";
import { generateShoppingList } from "@/lib/shopping-utils";
import type { Meal, Recipe, InventoryItem } from "@/lib/types";

const recipes: Recipe[] = [
  {
    id: "r1",
    title: "Pasta",
    description: "",
    ingredients: [
      { name: "spaghetti", quantity: 200, unit: "g" },
      { name: "butter", quantity: 3, unit: "tbsp" },
      { name: "garlic", quantity: 4, unit: "piece" },
    ],
    instructions: ["Cook"],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    tags: [],
    source: "manual",
    createdAt: "2026-01-01",
    version: 1,
  },
  {
    id: "r2",
    title: "Stir-fry",
    description: "",
    ingredients: [
      { name: "chicken", quantity: 300, unit: "g" },
      { name: "spaghetti", quantity: 100, unit: "g" }, // also uses spaghetti
    ],
    instructions: ["Cook"],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    tags: [],
    source: "manual",
    createdAt: "2026-01-01",
    version: 1,
  },
];

describe("generateShoppingList", () => {
  it("returns deficit when inventory is empty", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
    ];
    const result = generateShoppingList(meals, recipes, []);
    expect(result.length).toBeGreaterThan(0);
    expect(result.find((i) => i.name.toLowerCase() === "spaghetti")?.quantity).toBe(200);
  });

  it("subtracts inventory from needed", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
    ];
    const inventory: InventoryItem[] = [
      { id: "i1", name: "spaghetti", quantity: 150, unit: "g", category: "Grains", addedAt: "2026-01-01" },
    ];
    const result = generateShoppingList(meals, recipes, inventory);
    const pasta = result.find((i) => i.name.toLowerCase() === "spaghetti");
    expect(pasta?.quantity).toBe(50); // 200 - 150
  });

  it("returns empty when inventory covers everything", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
    ];
    const inventory: InventoryItem[] = [
      { id: "i1", name: "spaghetti", quantity: 500, unit: "g", category: "Grains", addedAt: "2026-01-01" },
      { id: "i2", name: "butter", quantity: 10, unit: "tbsp", category: "Dairy", addedAt: "2026-01-01" },
      { id: "i3", name: "garlic", quantity: 10, unit: "piece", category: "Produce", addedAt: "2026-01-01" },
    ];
    const result = generateShoppingList(meals, recipes, inventory);
    expect(result).toHaveLength(0);
  });

  it("aggregates same ingredient across meals", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
      { id: "m2", date: "2026-04-11", slot: "Dinner", recipeId: "r2", servings: 2, status: "planned", rated: false },
    ];
    const result = generateShoppingList(meals, recipes, []);
    // spaghetti: 200 (r1) + 100 (r2) = 300
    const pasta = result.find((i) => i.name.toLowerCase() === "spaghetti");
    expect(pasta?.quantity).toBe(300);
  });

  it("excludes cooked and skipped meals", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "cooked", rated: false },
      { id: "m2", date: "2026-04-11", slot: "Dinner", recipeId: "r2", servings: 2, status: "skipped", rated: false },
    ];
    const result = generateShoppingList(meals, recipes, []);
    expect(result).toHaveLength(0);
  });

  it("scales by serving multiplier", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 4, status: "planned", rated: false },
    ];
    const result = generateShoppingList(meals, recipes, []);
    // recipe serves 2, meal serves 4 → 2x multiplier → spaghetti = 400g
    const pasta = result.find((i) => i.name.toLowerCase() === "spaghetti");
    expect(pasta?.quantity).toBe(400);
  });

  it("sets source to meal-plan", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
    ];
    const result = generateShoppingList(meals, recipes, []);
    expect(result.every((i) => i.source === "meal-plan")).toBe(true);
  });

  it("handles unit conversion (inventory in kg, recipe in g)", () => {
    const meals: Meal[] = [
      { id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false },
    ];
    const inventory: InventoryItem[] = [
      { id: "i1", name: "spaghetti", quantity: 1, unit: "kg", category: "Grains", addedAt: "2026-01-01" },
    ];
    const result = generateShoppingList(meals, recipes, inventory);
    // 1 kg = 1000g, need 200g → no deficit
    const pasta = result.find((i) => i.name.toLowerCase() === "spaghetti");
    expect(pasta).toBeUndefined();
  });
});
