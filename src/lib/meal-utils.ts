import type { Meal, Recipe, RecipeIngredient } from "./types";

/** Resolves a Meal's full Recipe from the library. */
export function getRecipeForMeal(
  meal: Meal,
  recipes: Recipe[]
): Recipe | undefined {
  if (!meal.recipeId) return undefined;
  return recipes.find((r) => r.id === meal.recipeId);
}

/** Returns the ingredient list for any meal (recipe-based or custom). */
export function getMealIngredients(
  meal: Meal,
  recipes: Recipe[]
): RecipeIngredient[] {
  if (meal.recipeId) {
    const recipe = getRecipeForMeal(meal, recipes);
    return recipe?.ingredients ?? [];
  }
  return meal.customIngredients ?? [];
}

/** Gets the display title for a meal. */
export function getMealTitle(meal: Meal, recipes: Recipe[]): string {
  if (meal.recipeId) {
    const recipe = getRecipeForMeal(meal, recipes);
    return recipe?.title ?? meal.customTitle ?? "Unknown recipe";
  }
  return meal.customTitle ?? "Untitled meal";
}
