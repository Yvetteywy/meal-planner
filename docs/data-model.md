# Data Model / Schema

All types are defined in `src/lib/types.ts`. Data is persisted to `localStorage` with the keys noted below.

---

## Shared Types

```typescript
export type Unit =
  | "g" | "kg" | "ml" | "l"
  | "tsp" | "tbsp" | "cup"
  | "oz" | "lb" | "qt" | "gal"
  | "piece" | "unit" | "pack" | "box" | "bag";

export interface RecipeIngredient {
  name: string;
  normalizedName?: string; // optional canonical key for cross-language matching (Phase 4+)
  quantity: number;
  unit: Unit;
}
```

---

## Recipe

```typescript
export type RecipeSource = "manual" | "imported" | "ai-generated";

export type RecipeDifficulty = "easy" | "medium" | "hard";

export interface RecipeCuisine {
  category: string;              // e.g. "Italian", "Chinese", "Mexican", "Japanese"
  subcategory?: string;          // e.g. "Baking", "Breakfast", "Stir-fry", "Soup"
}

export interface RecipeRating {
  score: number;                 // 1–5 stars
  comment?: string;              // e.g. "Next time use less sugar", "Be careful not to overcook"
  ratedAt: string;               // ISO date
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
  source: RecipeSource;            // how this recipe was created
  sourceUrl?: string;              // original URL if imported from a website
  aiGenerated?: boolean;           // kept for backward compat, derived from source
  createdAt: string;               // ISO date, for sorting

  // ── Classification ────────────────────────────────────────────────
  cuisine?: RecipeCuisine;         // category + optional subcategory
  difficulty?: RecipeDifficulty;   // easy / medium / hard

  // ── User feedback ─────────────────────────────────────────────────
  ratings?: RecipeRating[];        // history of ratings (rate after each cook)

  // ── Versioning ────────────────────────────────────────────────────
  version: number;                 // starts at 1, increments on each revision
  parentRecipeId?: string;         // points to the original recipe this was forked from
  changelog?: string;              // what changed in this version ("reduced sugar by half")
}
```

**localStorage key:** `recipes`

### Recipe versioning design

Versions are modelled as **separate Recipe objects linked by `parentRecipeId`**:

```
Recipe "Garlic Butter Pasta" (id: abc, version: 1, parentRecipeId: undefined)
  └── Recipe "Garlic Butter Pasta" (id: def, version: 2, parentRecipeId: "abc", changelog: "less butter, added chili flakes")
       └── Recipe "Garlic Butter Pasta" (id: ghi, version: 3, parentRecipeId: "abc", changelog: "halved the garlic")
```

- `parentRecipeId` always points to the **original** recipe (version 1), forming a flat list — not a deep chain
- All versions share the same title (user can change it if they want a fork)
- The latest version is the one with the highest `version` number for a given `parentRecipeId` (or the original itself)
- When a recipe is used in a meal plan, `Meal.recipeId` references the **specific version** that was cooked
- Helper: `getRecipeVersions(recipeId, recipes)` returns all versions sorted by version number
- Helper: `getLatestVersion(recipeId, recipes)` returns the most recent version

**Why separate objects instead of embedded version history?**

- Each version is independently referenceable from meal plans (you cooked v1 on Monday, v2 on Friday)
- No complex nested data structures
- Easy to display a version history list
- Simpler localStorage serialization

---

## InventoryItem

```typescript
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: string;
  expiresAt?: string;              // ISO date
  addedAt: string;                 // ISO date
  source?: "manual" | "shopping-list";  // how it entered inventory
  icon?: string;                   // emoji or image URL for quick visual identification
}
```

**localStorage key:** `inventory`

**Icon design:** The `icon` field supports two formats:
- **Emoji** (default, lightweight): `"🥚"`, `"🍗"`, `"🧈"` — picked from a preset emoji palette or typed directly
- **Image URL** (optional): base64 data URL or remote URL for a custom photo

Common category → emoji defaults can be auto-suggested (e.g., Dairy → 🥛, Produce → 🥬, Meat & Fish → 🥩) so users get icons without extra effort.

---

## Meal

```typescript
export type MealStatus = "planned" | "cooking" | "cooked" | "skipped";

export interface Meal {
  id: string;
  date: string;                    // YYYY-MM-DD
  slot: string;                    // user-defined slot name (e.g., "Breakfast", "Kids Snack", "下午茶")
  recipeId?: string;               // reference by ID, not embedded copy
  customTitle?: string;            // for ad-hoc meals without a saved recipe
  customIngredients?: RecipeIngredient[];  // ingredients for custom meals
  servings: number;                // how many servings to cook (set when adding, editable after)
  notes?: string;
  status: MealStatus;              // planned → cooking → cooked / skipped
  cookingStartedAt?: string;       // ISO date when Cook Mode was entered
  cookedAt?: string;               // ISO date when marked cooked
  rated: boolean;                  // whether the user has rated this cook
}
```

**localStorage key:** `meal-plan`

### Meal Slots Configuration

Meal slots are fully user-defined (not a fixed enum). Stored as an ordered array of strings.

```typescript
// localStorage key: "meal-slots"
// Default value (pre-populated on first use):
const DEFAULT_MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];

// User can customize to e.g.:
// ["Breakfast", "Kids Snack", "Lunch", "Afternoon Tea", "Dinner"]
// ["早餐", "午餐", "下午茶", "晚餐", "宵夜"]
```

- Slot names are free-form strings (any language)
- The calendar grid renders one row per slot, in the user-defined order
- `Meal.slot` stores the slot name as a string
- Minimum 1 slot required

**Design note:** A Meal has EITHER `recipeId` (from library) OR `customTitle` (ad-hoc). A helper function `getRecipeForMeal(meal, recipes)` resolves the full Recipe when the UI needs it.

**Why reference by ID instead of embedding the full Recipe?**

- Editing a recipe updates all past and future meal plans automatically
- No data duplication across localStorage keys
- Single source of truth for recipe data

---

## ShoppingListItem

```typescript
export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: string;
  checked: boolean;
  addedAt: string;
  source?: "manual" | "meal-plan"; // how the item was added
  sourceRecipeId?: string;         // which recipe needed it
  movedToInventory?: boolean;      // was it sent to pantry?
  imageUrl?: string;               // photo of the exact item (base64 data URL or blob URL)
  notes?: string;                  // extra detail ("Hawaiian chips, not regular")
}
```

**localStorage key:** `shopping-list`

**Image storage note:** Images are stored as base64 data URLs in localStorage for the MVP. This keeps things simple but limits image size (~5 MB localStorage quota). For a future backend migration, images would move to cloud storage (e.g., S3, Supabase Storage) and `imageUrl` would become a remote URL.

---

## AppNotification

```typescript
export interface AppNotification {
  id: string;
  type: "rating-reminder" | "expiry-alert" | "meal-reminder";
  title: string;
  message: string;
  createdAt: string;             // ISO date
  read: boolean;
  dismissed: boolean;
  recipeId?: string;             // for rating reminders
  inventoryItemId?: string;      // for expiry alerts
  mealId?: string;               // for meal reminders
}
```

**localStorage key:** `notifications`

---

## Deprecated Types

The following types from the original codebase are **removed** in the new data model:

- **`WeeklyMealPlan`** — was a wrapper with `id`, `weekStartDate`, `meals[]`, `createdAt`, `updatedAt`. Replaced by a flat `Meal[]` array in localStorage (key: `meal-plan`). Week grouping is done at the UI level using date filtering.
- **`ShoppingList`** — was a wrapper with `id`, `name`, `items[]`, `createdAt`, `updatedAt`. Replaced by a flat `ShoppingListItem[]` array in localStorage (key: `shopping-list`).

---

## Data Migration Specification (Phase 1)

When Phase 1 deploys, existing localStorage data must be migrated from the old format to the new format. The migration runs once on app load (check a `data-version` key).

### Migration strategy

```typescript
// localStorage key: "data-version"
// If missing or < 2, run migration, then set to 2

function migrateIfNeeded() {
  const version = JSON.parse(localStorage.getItem("data-version") ?? "1");
  if (version >= 2) return; // already migrated

  migrateRecipes();
  migrateMealPlan();
  migrateInventory();
  migrateShoppingList();
  initMealSlots();

  localStorage.setItem("data-version", JSON.stringify(2));
}
```

### Recipe migration

```typescript
// BEFORE (v1)
{
  id: "sample-1",
  title: "Garlic Butter Pasta",
  description: "...",
  ingredients: [{ name: "spaghetti", quantity: 200, unit: "g" }],
  instructions: ["Cook spaghetti..."],
  prepTimeMinutes: 5,
  cookTimeMinutes: 15,
  servings: 2,
  tags: ["pasta"],
  aiGenerated: false
}

// AFTER (v2) — add new fields with defaults
{
  ...existing fields,
  source: "manual",           // default for all existing recipes
  createdAt: "2026-01-01T00:00:00Z",  // backfill with a default date
  version: 1,
  // These remain undefined (optional fields):
  // cuisine, difficulty, ratings, parentRecipeId, changelog, sourceUrl
}
```

### Meal migration

```typescript
// BEFORE (v1) — embedded recipe object
{
  id: "meal-1",
  date: "2026-04-07",
  slot: "dinner",
  recipe: { id: "sample-1", title: "Garlic Butter Pasta", ... },
  notes: "extra garlic"
}

// AFTER (v2) — reference by ID, add status fields
{
  id: "meal-1",
  date: "2026-04-07",
  slot: "dinner",              // keep as-is (already lowercase string)
  recipeId: "sample-1",        // extracted from recipe.id
  customTitle: undefined,      // not a custom meal
  servings: 2,                 // copied from recipe.servings
  notes: "extra garlic",
  status: "cooked",            // assume past meals are cooked
  rated: false
  // recipe object is REMOVED — looked up from recipes array when needed
}
```

**Edge cases:**
- If `recipe` is null/undefined → set `customTitle` to `"Unknown meal"`, no `recipeId`
- If `recipe.id` doesn't match any recipe in the library → keep `recipeId` anyway (will show as orphaned meal)
- Meals in the future → `status: "planned"`; meals in the past → `status: "cooked"`

### InventoryItem migration

```typescript
// BEFORE (v1)
{ id: "inv-1", name: "Eggs", quantity: 12, unit: "piece", category: "Dairy", addedAt: "..." }

// AFTER (v2) — add source field
{ ...existing fields, source: "manual" }
```

### ShoppingListItem migration

```typescript
// BEFORE (v1)
{ id: "s-1", name: "Milk", quantity: 1, unit: "l", category: "Dairy", checked: false, addedAt: "..." }

// AFTER (v2) — add source field
{ ...existing fields, source: "manual" }
```

### Meal slots initialization

```typescript
// If "meal-slots" key doesn't exist, create it with defaults
if (!localStorage.getItem("meal-slots")) {
  localStorage.setItem("meal-slots", JSON.stringify(["Breakfast", "Lunch", "Dinner", "Snack"]));
}
```

### Error handling

- If `JSON.parse` throws on any key → clear that key and start fresh (data is lost but app doesn't crash)
- Migration is idempotent — running it twice produces the same result
- Log migration actions to console for debugging

---

## Multilingual / i18n Considerations

The app supports content in both English and Chinese (and potentially other languages).

### User-generated content (ingredient names, recipe text)

All string fields already support Unicode — users can freely mix `"Chicken breast"` and `"鸡胸肉"`.

**Ingredient matching is the key challenge.** When the app needs to match ingredients across features (e.g., deducting `"鸡胸肉"` from inventory after cooking a recipe that lists `"chicken breast"`), exact string comparison will fail.

#### Approach: Normalized ingredient keys

The `normalizedName` field on `RecipeIngredient` (defined above in Shared Types) supports this:

- **Phase 1–3:** Match ingredients by exact `name` string (same-language use is fine)
- **Phase 4+:** Introduce `normalizedName` for cross-language matching
  - Option A: Maintain a local ingredient dictionary mapping display names → canonical keys
  - Option B: Use AI to normalize on save ("鸡胸肉" → "chicken_breast")
  - Option C: Fuzzy matching at deduction time using AI or a multilingual ingredient database

### App UI chrome

If the entire app UI should be switchable between English and Chinese:

- Use [`next-intl`](https://next-intl.dev/) for Next.js App Router i18n
- Locale files in `src/messages/en.json` and `src/messages/zh.json`
- This is a **separate effort** from the data flow work

### Impact on features

| Feature | Impact | Notes |
|---|---|---|
| **Recipe search** | Should work across languages | Case-insensitive `includes()` already works for CJK |
| **Shopping list generation** | Needs ingredient matching | Use `normalizedName` when available |
| **Inventory deduction** | Needs ingredient matching | Same as above |
| **AI features** | Handles multilingual natively | Prompts can be in any language |
| **Recipe import** | Imported recipes may be in any language | Parser should preserve original language |
| **Unit display** | Code-level `Unit` type stays English | Display can be localized: `"cup"` → `"杯"` |
