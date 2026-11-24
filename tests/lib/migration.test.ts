import { describe, it, expect, beforeEach } from "vitest";
import { migrateIfNeeded } from "@/lib/data-service";

describe("migrateIfNeeded", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("sets data-version to 2 after migration", () => {
    migrateIfNeeded();
    expect(JSON.parse(localStorage.getItem("data-version")!)).toBe(2);
  });

  it("skips migration if already at version 2", () => {
    localStorage.setItem("data-version", "2");
    localStorage.setItem("recipes", JSON.stringify([{ id: "test", title: "Test" }]));
    migrateIfNeeded();
    // Recipes should not be modified
    const recipes = JSON.parse(localStorage.getItem("recipes")!);
    expect(recipes[0].title).toBe("Test");
    expect(recipes[0].source).toBeUndefined(); // not migrated
  });

  it("adds source field to legacy recipes", () => {
    const legacyRecipes = [
      {
        id: "r1",
        title: "Pasta",
        description: "test",
        ingredients: [],
        instructions: [],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        servings: 2,
        tags: [],
      },
    ];
    localStorage.setItem("recipes", JSON.stringify(legacyRecipes));
    migrateIfNeeded();
    const recipes = JSON.parse(localStorage.getItem("recipes")!);
    expect(recipes[0].source).toBe("manual");
    expect(recipes[0].version).toBe(1);
    expect(recipes[0].createdAt).toBeDefined();
  });

  it("migrates PlannedMeal with embedded recipe to Meal with recipeId", () => {
    const legacyMeals = [
      {
        id: "m1",
        date: "2025-01-01",
        slot: "dinner",
        recipe: { id: "r1", title: "Pasta", servings: 2 },
        notes: "extra cheese",
      },
    ];
    localStorage.setItem("meal-plan", JSON.stringify(legacyMeals));
    migrateIfNeeded();
    const meals = JSON.parse(localStorage.getItem("meal-plan")!);
    expect(meals[0].recipeId).toBe("r1");
    expect(meals[0].servings).toBe(2);
    expect(meals[0].status).toBe("cooked"); // past meal
    expect(meals[0].rated).toBe(false);
    expect(meals[0].notes).toBe("extra cheese");
    expect(meals[0].recipe).toBeUndefined(); // embedded recipe removed
  });

  it("handles meal with no recipe (custom meal)", () => {
    const legacyMeals = [
      {
        id: "m2",
        date: "2025-06-01",
        slot: "lunch",
        notes: "leftovers",
      },
    ];
    localStorage.setItem("meal-plan", JSON.stringify(legacyMeals));
    migrateIfNeeded();
    const meals = JSON.parse(localStorage.getItem("meal-plan")!);
    expect(meals[0].recipeId).toBeUndefined();
    expect(meals[0].customTitle).toBe("Unknown meal");
    expect(meals[0].servings).toBe(2); // default
  });

  it("adds source field to legacy inventory items", () => {
    const items = [{ id: "i1", name: "Eggs", quantity: 12, unit: "piece", category: "Dairy", addedAt: "2026-01-01" }];
    localStorage.setItem("inventory", JSON.stringify(items));
    migrateIfNeeded();
    const result = JSON.parse(localStorage.getItem("inventory")!);
    expect(result[0].source).toBe("manual");
  });

  it("adds source field to legacy shopping list items", () => {
    const items = [{ id: "s1", name: "Milk", quantity: 1, unit: "l", category: "Dairy", checked: false, addedAt: "2026-01-01" }];
    localStorage.setItem("shopping-list", JSON.stringify(items));
    migrateIfNeeded();
    const result = JSON.parse(localStorage.getItem("shopping-list")!);
    expect(result[0].source).toBe("manual");
  });

  it("initializes default meal slots if not present", () => {
    migrateIfNeeded();
    const slots = JSON.parse(localStorage.getItem("meal-slots")!);
    expect(slots).toEqual(["Breakfast", "Lunch", "Dinner", "Snack"]);
  });

  it("preserves existing meal slots", () => {
    localStorage.setItem("meal-slots", JSON.stringify(["Brunch", "Dinner"]));
    migrateIfNeeded();
    const slots = JSON.parse(localStorage.getItem("meal-slots")!);
    expect(slots).toEqual(["Brunch", "Dinner"]);
  });

  it("is idempotent — running twice produces same result", () => {
    const legacyRecipes = [{ id: "r1", title: "Pasta", description: "", ingredients: [], instructions: [], prepTimeMinutes: 5, cookTimeMinutes: 10, servings: 2, tags: [] }];
    localStorage.setItem("recipes", JSON.stringify(legacyRecipes));

    migrateIfNeeded();
    const first = localStorage.getItem("recipes");

    // Reset version to trigger migration again
    localStorage.setItem("data-version", "1");
    migrateIfNeeded();
    const second = localStorage.getItem("recipes");

    expect(JSON.parse(first!)[0].source).toBe("manual");
    expect(JSON.parse(second!)[0].source).toBe("manual");
  });
});
