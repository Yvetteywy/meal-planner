import { describe, it, expect } from "vitest";
import { getRecipeForMeal, getMealIngredients, getMealTitle } from "@/lib/meal-utils";
import type { Meal, Recipe } from "@/lib/types";

const recipes: Recipe[] = [
  {
    id: "r1",
    title: "Pasta",
    description: "Simple pasta",
    ingredients: [
      { name: "spaghetti", quantity: 200, unit: "g" },
      { name: "butter", quantity: 3, unit: "tbsp" },
    ],
    instructions: ["Cook pasta", "Add butter"],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    servings: 2,
    tags: ["pasta"],
    source: "manual",
    createdAt: "2026-01-01T00:00:00Z",
    version: 1,
  },
];

const recipeMeal: Meal = {
  id: "m1",
  date: "2026-04-08",
  slot: "Dinner",
  recipeId: "r1",
  servings: 2,
  status: "planned",
  rated: false,
};

const customMeal: Meal = {
  id: "m2",
  date: "2026-04-08",
  slot: "Lunch",
  customTitle: "Leftover fried rice",
  customIngredients: [{ name: "rice", quantity: 300, unit: "g" }],
  servings: 1,
  status: "planned",
  rated: false,
};

const orphanMeal: Meal = {
  id: "m3",
  date: "2026-04-08",
  slot: "Breakfast",
  recipeId: "deleted-recipe",
  servings: 2,
  status: "planned",
  rated: false,
};

describe("getRecipeForMeal", () => {
  it("returns the recipe when recipeId matches", () => {
    const result = getRecipeForMeal(recipeMeal, recipes);
    expect(result).toBeDefined();
    expect(result!.id).toBe("r1");
    expect(result!.title).toBe("Pasta");
  });

  it("returns undefined for a custom meal (no recipeId)", () => {
    const result = getRecipeForMeal(customMeal, recipes);
    expect(result).toBeUndefined();
  });

  it("returns undefined when recipe has been deleted", () => {
    const result = getRecipeForMeal(orphanMeal, recipes);
    expect(result).toBeUndefined();
  });
});

describe("getMealIngredients", () => {
  it("returns recipe ingredients for a recipe-based meal", () => {
    const result = getMealIngredients(recipeMeal, recipes);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("spaghetti");
  });

  it("returns custom ingredients for a custom meal", () => {
    const result = getMealIngredients(customMeal, recipes);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("rice");
  });

  it("returns empty array when recipe is deleted", () => {
    const result = getMealIngredients(orphanMeal, recipes);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when custom meal has no ingredients", () => {
    const meal: Meal = { ...customMeal, customIngredients: undefined };
    const result = getMealIngredients(meal, recipes);
    expect(result).toHaveLength(0);
  });
});

describe("getMealTitle", () => {
  it("returns recipe title for a recipe-based meal", () => {
    expect(getMealTitle(recipeMeal, recipes)).toBe("Pasta");
  });

  it("returns custom title for a custom meal", () => {
    expect(getMealTitle(customMeal, recipes)).toBe("Leftover fried rice");
  });

  it("returns fallback when recipe is deleted", () => {
    expect(getMealTitle(orphanMeal, recipes)).toBe("Unknown recipe");
  });

  it("returns fallback when custom meal has no title", () => {
    const meal: Meal = { ...customMeal, customTitle: undefined };
    expect(getMealTitle(meal, recipes)).toBe("Untitled meal");
  });
});
