import type { RecipeIngredient, InventoryItem } from "./types";

// ---------------------------------------------------------------------------
// Unit conversion
// ---------------------------------------------------------------------------

const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.6,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.93,
  tbsp: 14.79,
  cup: 236.59,
  qt: 946.35,
  gal: 3785.41,
};

/** Convert a quantity from one unit to another. Returns null if incompatible. */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  if (fromUnit === toUnit) return quantity;

  // Weight conversion
  if (fromUnit in WEIGHT_TO_GRAMS && toUnit in WEIGHT_TO_GRAMS) {
    const grams = quantity * WEIGHT_TO_GRAMS[fromUnit];
    return grams / WEIGHT_TO_GRAMS[toUnit];
  }

  // Volume conversion
  if (fromUnit in VOLUME_TO_ML && toUnit in VOLUME_TO_ML) {
    const ml = quantity * VOLUME_TO_ML[fromUnit];
    return ml / VOLUME_TO_ML[toUnit];
  }

  return null; // incompatible units
}

// ---------------------------------------------------------------------------
// Ingredient deduction
// ---------------------------------------------------------------------------

export interface DeductionResult {
  ingredientName: string;
  requested: number;
  requestedUnit: string;
  deducted: number;
  deductedUnit: string;
  status: "deducted" | "insufficient" | "not-found" | "unit-mismatch";
}

/**
 * Deducts recipe ingredients from inventory.
 * Returns the updated inventory and a log of what was deducted.
 */
export function deductIngredients(
  inventory: InventoryItem[],
  ingredients: RecipeIngredient[],
  servingMultiplier: number = 1
): { updated: InventoryItem[]; log: DeductionResult[] } {
  const updated = inventory.map((item) => ({ ...item })); // shallow clone
  const log: DeductionResult[] = [];

  for (const ing of ingredients) {
    const needed = ing.quantity * servingMultiplier;
    const match = updated.find(
      (item) => item.name.toLowerCase() === ing.name.toLowerCase()
    );

    if (!match) {
      log.push({
        ingredientName: ing.name,
        requested: needed,
        requestedUnit: ing.unit,
        deducted: 0,
        deductedUnit: ing.unit,
        status: "not-found",
      });
      continue;
    }

    // Try unit conversion
    const converted = convertUnit(needed, ing.unit, match.unit);
    if (converted === null) {
      log.push({
        ingredientName: ing.name,
        requested: needed,
        requestedUnit: ing.unit,
        deducted: 0,
        deductedUnit: match.unit,
        status: "unit-mismatch",
      });
      continue;
    }

    const actualDeducted = Math.min(converted, match.quantity);
    match.quantity = Math.max(0, match.quantity - converted);

    log.push({
      ingredientName: ing.name,
      requested: needed,
      requestedUnit: ing.unit,
      deducted: actualDeducted,
      deductedUnit: match.unit,
      status: match.quantity >= 0 && converted <= actualDeducted + 0.001
        ? "deducted"
        : "insufficient",
    });
  }

  return { updated, log };
}
