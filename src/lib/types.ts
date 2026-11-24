// ---------------------------------------------------------------------------
// Core domain types for the Meal Planner app
// ---------------------------------------------------------------------------

// ── Shared ──────────────────────────────────────────────────────────────────

export type Unit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "tsp"
  | "tbsp"
  | "cup"
  | "oz"
  | "lb"
  | "qt"
  | "gal"
  | "piece"
  | "unit"
  | "pack"
  | "box"
  | "bag";

export interface RecipeIngredient {
  name: string;
  normalizedName?: string; // canonical key for cross-language matching (Phase 4+)
  quantity: number;
  unit: Unit;
}

// ── Recipe ──────────────────────────────────────────────────────────────────

export type RecipeSource = "manual" | "imported" | "ai-generated";
export type RecipeDifficulty = "easy" | "medium" | "hard";

export interface RecipeCuisine {
  category: string;
  subcategory?: string;
}

export interface RecipeRating {
  score: number; // 1–5
  comment?: string;
  ratedAt: string; // ISO date
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
  imageUrl?: string;
  source: RecipeSource;
  sourceUrl?: string;
  aiGenerated?: boolean; // backward compat, derived from source
  createdAt: string; // ISO date
  cuisine?: RecipeCuisine;
  difficulty?: RecipeDifficulty;
  ratings?: RecipeRating[];
  version: number;
  parentRecipeId?: string;
  changelog?: string;
}

// ── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: string;
  expiresAt?: string; // ISO date
  addedAt: string; // ISO date
  source?: "manual" | "shopping-list";
  icon?: string; // emoji or image URL
}

// ── Meal ────────────────────────────────────────────────────────────────────

export type MealStatus = "planned" | "cooking" | "cooked" | "skipped";

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  slot: string; // user-defined slot name
  recipeId?: string;
  customTitle?: string;
  customIngredients?: RecipeIngredient[];
  servings: number;
  notes?: string;
  status: MealStatus;
  cookingStartedAt?: string; // ISO date
  cookedAt?: string; // ISO date
  rated: boolean;
}

// ── Shopping List ───────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: string;
  checked: boolean;
  addedAt: string;
  source?: "manual" | "meal-plan";
  sourceRecipeId?: string;
  movedToInventory?: boolean;
  imageUrl?: string;
  notes?: string;
}

// ── Notifications ───────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: "rating-reminder" | "expiry-alert" | "meal-reminder";
  title: string;
  message: string;
  createdAt: string; // ISO date
  read: boolean;
  dismissed: boolean;
  recipeId?: string;
  inventoryItemId?: string;
  mealId?: string;
}

// ── Budget (future) ─────────────────────────────────────────────────────────

export interface SpendingRecord {
  id: string;
  date: string;
  storeName: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  totalAmount: number;
  currency: string;
  notes?: string;
}
