import { describe, it, expect, beforeEach } from "vitest";
import { dataService } from "@/lib/data-service";
import { deductIngredients } from "@/lib/deduction-utils";
import { getMealIngredients } from "@/lib/meal-utils";
import type { Recipe, Meal, InventoryItem, RecipeRating } from "@/lib/types";

// Simulates the handleCookingComplete logic from Cook Mode
function completeCooking(
  mealId: string,
  servingMultiplier: number,
  rating?: { score: number; comment?: string }
) {
  const meals = dataService.meals.getAll();
  const meal = meals.find((m) => m.id === mealId);
  if (!meal || meal.status === "cooked") return { success: false };

  // Save rating to recipe
  if (rating && rating.score > 0 && meal.recipeId) {
    const recipe = dataService.recipes.getById(meal.recipeId);
    if (recipe) {
      const newRating: RecipeRating = {
        score: rating.score,
        ratedAt: new Date().toISOString(),
        comment: rating.comment || undefined,
      };
      dataService.recipes.save({
        ...recipe,
        ratings: [...(recipe.ratings || []), newRating],
      });
    }
  }

  // Mark meal as cooked
  const updatedMeal: Meal = {
    ...meal,
    status: "cooked",
    cookedAt: new Date().toISOString(),
  };
  dataService.meals.save(updatedMeal);

  // Deduct ingredients from inventory
  const allRecipes = dataService.recipes.getAll();
  const ingredients = getMealIngredients(updatedMeal, allRecipes);
  if (ingredients.length > 0) {
    const recipe = allRecipes.find((r) => r.id === meal.recipeId);
    const multiplier = servingMultiplier / (recipe?.servings || 1);
    const inventory = dataService.inventory.getAll();
    const { updated } = deductIngredients(inventory, ingredients, multiplier);
    updated.forEach((item) => dataService.inventory.save(item));
  }

  return { success: true };
}

const testRecipe: Recipe = {
  id: "recipe-1",
  title: "Test Pasta",
  description: "Simple pasta",
  ingredients: [
    { name: "spaghetti", quantity: 200, unit: "g" },
    { name: "butter", quantity: 50, unit: "g" },
  ],
  instructions: ["Boil water", "Cook pasta", "Add butter"],
  prepTimeMinutes: 5,
  cookTimeMinutes: 10,
  servings: 2,
  tags: ["pasta"],
  source: "manual",
  createdAt: "2026-01-01T00:00:00Z",
  version: 1,
};

const testMeal: Meal = {
  id: "meal-1",
  date: "2026-04-10",
  slot: "Dinner",
  recipeId: "recipe-1",
  servings: 2,
  status: "planned",
  rated: false,
};

beforeEach(() => {
  localStorage.clear();
  // Set up test data
  dataService.recipes.save(testRecipe);
  dataService.meals.save(testMeal);
});

describe("Cook Mode completion", () => {
  it("marks meal as cooked with timestamp", () => {
    completeCooking("meal-1", 2);
    const meal = dataService.meals.getById("meal-1");
    expect(meal?.status).toBe("cooked");
    expect(meal?.cookedAt).toBeDefined();
  });

  it("saves rating to recipe", () => {
    completeCooking("meal-1", 2, { score: 4, comment: "Great!" });
    const recipe = dataService.recipes.getById("recipe-1");
    expect(recipe?.ratings).toHaveLength(1);
    expect(recipe?.ratings![0].score).toBe(4);
    expect(recipe?.ratings![0].comment).toBe("Great!");
    expect(recipe?.ratings![0].ratedAt).toBeDefined();
  });

  it("saves rating without comment", () => {
    completeCooking("meal-1", 2, { score: 5 });
    const recipe = dataService.recipes.getById("recipe-1");
    expect(recipe?.ratings).toHaveLength(1);
    expect(recipe?.ratings![0].score).toBe(5);
    expect(recipe?.ratings![0].comment).toBeUndefined();
  });

  it("skips rating when not provided", () => {
    completeCooking("meal-1", 2);
    const recipe = dataService.recipes.getById("recipe-1");
    expect(recipe?.ratings).toBeUndefined();
  });

  it("deducts ingredients from inventory", () => {
    // Stock the pantry
    dataService.inventory.save({
      id: "inv-1", name: "spaghetti", quantity: 500, unit: "g",
      category: "Pantry", addedAt: new Date().toISOString(), source: "manual",
    });
    dataService.inventory.save({
      id: "inv-2", name: "butter", quantity: 200, unit: "g",
      category: "Dairy", addedAt: new Date().toISOString(), source: "manual",
    });

    // Cook with recipe servings (2) → multiplier = 1
    completeCooking("meal-1", 2);

    const inv = dataService.inventory.getAll();
    const spaghetti = inv.find((i) => i.name === "spaghetti");
    const butter = inv.find((i) => i.name === "butter");
    expect(spaghetti?.quantity).toBe(300); // 500 - 200
    expect(butter?.quantity).toBe(150);    // 200 - 50
  });

  it("deducts scaled ingredients when serving multiplier differs", () => {
    dataService.inventory.save({
      id: "inv-1", name: "spaghetti", quantity: 1000, unit: "g",
      category: "Pantry", addedAt: new Date().toISOString(), source: "manual",
    });
    dataService.inventory.save({
      id: "inv-2", name: "butter", quantity: 200, unit: "g",
      category: "Dairy", addedAt: new Date().toISOString(), source: "manual",
    });

    // Cook for 4 servings (recipe serves 2) → multiplier = 2
    completeCooking("meal-1", 4);

    const inv = dataService.inventory.getAll();
    const spaghetti = inv.find((i) => i.name === "spaghetti");
    const butter = inv.find((i) => i.name === "butter");
    expect(spaghetti?.quantity).toBe(600); // 1000 - 400
    expect(butter?.quantity).toBe(100);    // 200 - 100
  });

  it("does not double-deduct if meal already cooked", () => {
    dataService.inventory.save({
      id: "inv-1", name: "spaghetti", quantity: 500, unit: "g",
      category: "Pantry", addedAt: new Date().toISOString(), source: "manual",
    });

    completeCooking("meal-1", 2);
    const after1 = dataService.inventory.getAll().find((i) => i.name === "spaghetti");
    expect(after1?.quantity).toBe(300);

    // Try completing again — should be a no-op
    const result = completeCooking("meal-1", 2);
    expect(result.success).toBe(false);
    const after2 = dataService.inventory.getAll().find((i) => i.name === "spaghetti");
    expect(after2?.quantity).toBe(300); // unchanged
  });

  it("handles non-existent meal gracefully", () => {
    const result = completeCooking("non-existent", 2);
    expect(result.success).toBe(false);
  });

  it("handles custom meal without recipe (no rating saved)", () => {
    const customMeal: Meal = {
      id: "meal-custom",
      date: "2026-04-10",
      slot: "Lunch",
      customTitle: "Leftover Rice",
      customIngredients: [{ name: "rice", quantity: 300, unit: "g" }],
      servings: 1,
      status: "planned",
      rated: false,
    };
    dataService.meals.save(customMeal);

    completeCooking("meal-custom", 1, { score: 3 });
    const meal = dataService.meals.getById("meal-custom");
    expect(meal?.status).toBe("cooked");
    // No recipe to attach rating to — recipes unchanged
    const recipe = dataService.recipes.getById("recipe-1");
    expect(recipe?.ratings).toBeUndefined();
  });

  it("accumulates multiple ratings on the same recipe", () => {
    completeCooking("meal-1", 2, { score: 4, comment: "Good" });

    // Add another meal for same recipe
    const meal2: Meal = {
      id: "meal-2",
      date: "2026-04-11",
      slot: "Dinner",
      recipeId: "recipe-1",
      servings: 2,
      status: "planned",
      rated: false,
    };
    dataService.meals.save(meal2);
    completeCooking("meal-2", 2, { score: 5, comment: "Even better!" });

    const recipe = dataService.recipes.getById("recipe-1");
    expect(recipe?.ratings).toHaveLength(2);
    expect(recipe?.ratings![0].score).toBe(4);
    expect(recipe?.ratings![1].score).toBe(5);
  });
});
