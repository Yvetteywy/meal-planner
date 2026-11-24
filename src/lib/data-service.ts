import type { Recipe, InventoryItem, Meal, ShoppingListItem, AppNotification } from "./types";

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: "sample-1",
    title: "Garlic Butter Pasta",
    description: "A quick weeknight pasta with garlic, butter, and parmesan.",
    ingredients: [
      { name: "spaghetti", quantity: 200, unit: "g" },
      { name: "butter", quantity: 3, unit: "tbsp" },
      { name: "garlic", quantity: 4, unit: "piece" },
      { name: "parmesan", quantity: 50, unit: "g" },
    ],
    instructions: [
      "Cook spaghetti according to package directions, about 8 minutes.",
      "Melt butter in a large pan over medium heat, sauté minced garlic for 2 minutes until fragrant.",
      "Toss drained pasta in the garlic butter. Mix well for 1 minute.",
      "Finish with grated parmesan and black pepper. Serve immediately.",
    ],
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    servings: 2,
    tags: ["pasta", "quick", "vegetarian"],
    source: "manual",
    createdAt: new Date().toISOString(),
    version: 1,
  },
  {
    id: "sample-2",
    title: "Chicken Stir-Fry",
    description: "Colourful veggie and chicken stir-fry with soy-ginger sauce.",
    ingredients: [
      { name: "chicken breast", quantity: 300, unit: "g" },
      { name: "soy sauce", quantity: 3, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tsp" },
      { name: "broccoli", quantity: 150, unit: "g" },
      { name: "carrot", quantity: 1, unit: "piece" },
    ],
    instructions: [
      "Slice chicken into thin strips and marinate in soy sauce and ginger for 10 minutes.",
      "Heat oil in a wok over high heat. Stir-fry chicken for 4 minutes until cooked through. Set aside.",
      "Add broccoli and sliced carrot to the wok. Stir-fry for 3 minutes until tender-crisp.",
      "Return chicken to the wok. Combine everything and toss for 1 minute.",
      "Serve over steamed rice.",
    ],
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 2,
    tags: ["chicken", "stir-fry", "healthy"],
    source: "manual",
    createdAt: new Date().toISOString(),
    version: 1,
  },
];

// ---------------------------------------------------------------------------
// Safe localStorage helpers
// ---------------------------------------------------------------------------

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    console.warn(`Failed to read "${key}" from localStorage, using fallback`);
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    console.error(`Failed to write "${key}" to localStorage (quota exceeded?)`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Migration (v1 → v2)
// ---------------------------------------------------------------------------

interface LegacyPlannedMeal {
  id: string;
  date: string;
  slot: string;
  recipe?: { id?: string; title?: string; servings?: number };
  notes?: string;
}

interface LegacyRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  instructions: string[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  tags: string[];
  imageUrl?: string;
  aiGenerated?: boolean;
  // v2 fields may or may not exist
  source?: string;
  createdAt?: string;
  version?: number;
}

export function migrateIfNeeded(): void {
  if (typeof window === "undefined") return;

  const version = safeRead<number>("data-version", 1);
  if (version >= 2) return;

  console.info("Migrating localStorage data from v1 → v2...");

  // Migrate recipes
  const recipes = safeRead<LegacyRecipe[]>("recipes", []);
  const migratedRecipes: Recipe[] = recipes.map((r) => ({
    ...r,
    source: (r.source as Recipe["source"]) ?? "manual",
    createdAt: r.createdAt ?? new Date().toISOString(),
    version: r.version ?? 1,
    unit: undefined, // clean up any stray fields
  })) as Recipe[];
  if (migratedRecipes.length > 0) {
    safeWrite("recipes", migratedRecipes);
  }

  // Migrate meals
  const meals = safeRead<LegacyPlannedMeal[]>("meal-plan", []);
  const today = new Date().toISOString().split("T")[0];
  const migratedMeals: Meal[] = meals.map((m) => ({
    id: m.id,
    date: m.date,
    slot: m.slot,
    recipeId: m.recipe?.id,
    customTitle: m.recipe?.id ? undefined : (m.recipe?.title ?? "Unknown meal"),
    servings: m.recipe?.servings ?? 2,
    notes: m.notes,
    status: m.date < today ? "cooked" : "planned",
    rated: false,
  }));
  if (meals.length > 0) {
    safeWrite("meal-plan", migratedMeals);
  }

  // Migrate inventory — add source field
  const inventory = safeRead<InventoryItem[]>("inventory", []);
  const migratedInventory = inventory.map((item) => ({
    ...item,
    source: item.source ?? "manual",
  }));
  if (inventory.length > 0) {
    safeWrite("inventory", migratedInventory);
  }

  // Migrate shopping list — add source field
  const shoppingList = safeRead<ShoppingListItem[]>("shopping-list", []);
  const migratedShopping = shoppingList.map((item) => ({
    ...item,
    source: item.source ?? "manual",
  }));
  if (shoppingList.length > 0) {
    safeWrite("shopping-list", migratedShopping);
  }

  // Initialize meal slots
  if (!localStorage.getItem("meal-slots")) {
    safeWrite("meal-slots", DEFAULT_MEAL_SLOTS);
  }

  safeWrite("data-version", 2);
  console.info("Migration complete.");
}

// ---------------------------------------------------------------------------
// Data service — abstraction layer over localStorage
// ---------------------------------------------------------------------------

export const dataService = {
  // ── Recipes ─────────────────────────────────────────────────────────────
  recipes: {
    getAll(): Recipe[] {
      return safeRead<Recipe[]>("recipes", SAMPLE_RECIPES);
    },
    getById(id: string): Recipe | undefined {
      return this.getAll().find((r) => r.id === id);
    },
    save(recipe: Recipe): boolean {
      const all = this.getAll();
      const index = all.findIndex((r) => r.id === recipe.id);
      if (index >= 0) {
        all[index] = recipe;
      } else {
        all.push(recipe);
      }
      return safeWrite("recipes", all);
    },
    delete(id: string): boolean {
      const all = this.getAll().filter((r) => r.id !== id);
      return safeWrite("recipes", all);
    },
  },

  // ── Meals ───────────────────────────────────────────────────────────────
  meals: {
    getAll(): Meal[] {
      return safeRead<Meal[]>("meal-plan", []);
    },
    getById(id: string): Meal | undefined {
      return this.getAll().find((m) => m.id === id);
    },
    save(meal: Meal): boolean {
      const all = this.getAll();
      const index = all.findIndex((m) => m.id === meal.id);
      if (index >= 0) {
        all[index] = meal;
      } else {
        all.push(meal);
      }
      return safeWrite("meal-plan", all);
    },
    saveAll(meals: Meal[]): boolean {
      return safeWrite("meal-plan", meals);
    },
    delete(id: string): boolean {
      const all = this.getAll().filter((m) => m.id !== id);
      return safeWrite("meal-plan", all);
    },
  },

  // ── Inventory ───────────────────────────────────────────────────────────
  inventory: {
    getAll(): InventoryItem[] {
      return safeRead<InventoryItem[]>("inventory", []);
    },
    save(item: InventoryItem): boolean {
      const all = this.getAll();
      const index = all.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        all[index] = item;
      } else {
        all.push(item);
      }
      return safeWrite("inventory", all);
    },
    saveAll(items: InventoryItem[]): boolean {
      return safeWrite("inventory", items);
    },
    delete(id: string): boolean {
      const all = this.getAll().filter((i) => i.id !== id);
      return safeWrite("inventory", all);
    },
  },

  // ── Shopping List ───────────────────────────────────────────────────────
  shoppingList: {
    getAll(): ShoppingListItem[] {
      return safeRead<ShoppingListItem[]>("shopping-list", []);
    },
    saveAll(items: ShoppingListItem[]): boolean {
      return safeWrite("shopping-list", items);
    },
    save(item: ShoppingListItem): boolean {
      const all = this.getAll();
      const index = all.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        all[index] = item;
      } else {
        all.push(item);
      }
      return safeWrite("shopping-list", all);
    },
    delete(id: string): boolean {
      const all = this.getAll().filter((i) => i.id !== id);
      return safeWrite("shopping-list", all);
    },
  },

  // ── Meal Slots ──────────────────────────────────────────────────────────
  mealSlots: {
    getAll(): string[] {
      return safeRead<string[]>("meal-slots", DEFAULT_MEAL_SLOTS);
    },
    saveAll(slots: string[]): boolean {
      return safeWrite("meal-slots", slots);
    },
  },

  // ── Notifications ───────────────────────────────────────────────────────
  notifications: {
    getAll(): AppNotification[] {
      return safeRead<AppNotification[]>("notifications", []);
    },
    saveAll(notifications: AppNotification[]): boolean {
      return safeWrite("notifications", notifications);
    },
  },

  // ── Export / Import ─────────────────────────────────────────────────────
  exportAll(): string {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        recipes: this.recipes.getAll(),
        meals: this.meals.getAll(),
        inventory: this.inventory.getAll(),
        shoppingList: this.shoppingList.getAll(),
        mealSlots: this.mealSlots.getAll(),
        notifications: this.notifications.getAll(),
      },
    };
    return JSON.stringify(data, null, 2);
  },

  importAll(json: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.version || !parsed.data) {
        return { success: false, error: "Invalid backup format" };
      }
      const { data } = parsed;
      if (data.recipes) safeWrite("recipes", data.recipes);
      if (data.meals) safeWrite("meal-plan", data.meals);
      if (data.inventory) safeWrite("inventory", data.inventory);
      if (data.shoppingList) safeWrite("shopping-list", data.shoppingList);
      if (data.mealSlots) safeWrite("meal-slots", data.mealSlots);
      if (data.notifications) safeWrite("notifications", data.notifications);
      return { success: true };
    } catch {
      return { success: false, error: "Invalid JSON" };
    }
  },
};
