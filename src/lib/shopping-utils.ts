import type { Meal, Recipe, ShoppingListItem, InventoryItem, Unit } from "./types";
import { getMealIngredients } from "./meal-utils";
import { convertUnit } from "./deduction-utils";

/**
 * Generates a shopping list by comparing planned meals' ingredients
 * against current inventory. Returns deficit items.
 */
export function generateShoppingList(
  meals: Meal[],
  recipes: Recipe[],
  inventory: InventoryItem[]
): ShoppingListItem[] {
  // Only include planned meals (not cooked/skipped)
  const plannedMeals = meals.filter((m) => m.status === "planned");

  // Aggregate all needed ingredients across all planned meals
  const needed: Record<string, { quantity: number; unit: Unit; recipeId?: string }> = {};

  for (const meal of plannedMeals) {
    const ingredients = getMealIngredients(meal, recipes);
    const multiplier = meal.recipeId
      ? meal.servings / (recipes.find((r) => r.id === meal.recipeId)?.servings ?? meal.servings)
      : 1;

    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}|${ing.unit}`;
      if (needed[key]) {
        needed[key].quantity += ing.quantity * multiplier;
      } else {
        needed[key] = {
          quantity: ing.quantity * multiplier,
          unit: ing.unit,
          recipeId: meal.recipeId,
        };
      }
    }
  }

  // Subtract inventory
  const deficit: ShoppingListItem[] = [];

  for (const [key, need] of Object.entries(needed)) {
    const name = key.split("|")[0];

    // Find matching inventory item
    const invItem = inventory.find(
      (i) => i.name.toLowerCase() === name
    );

    let remainingNeed = need.quantity;

    if (invItem) {
      // Try unit conversion
      const converted = convertUnit(invItem.quantity, invItem.unit, need.unit);
      if (converted !== null) {
        remainingNeed = Math.max(0, need.quantity - converted);
      }
      // If units incompatible, include full quantity (user can review)
    }

    if (remainingNeed > 0.01) {
      deficit.push({
        id: crypto.randomUUID(),
        name: name.charAt(0).toUpperCase() + name.slice(1), // capitalize
        quantity: Math.round(remainingNeed * 100) / 100, // round to 2 decimals
        unit: need.unit,
        category: "Other",
        checked: false,
        addedAt: new Date().toISOString(),
        source: "meal-plan",
        sourceRecipeId: need.recipeId,
      });
    }
  }

  return deficit;
}
