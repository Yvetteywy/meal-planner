# Product Implementation Plan

This plan covers shared Meal Planner features and architecture, not Android or iOS packaging. See the [Android app implementation plan](android-implementation-plan.md) and [iOS app implementation plan](ios-implementation-plan.md) for platform-specific work.

## Priority Summary

| Priority | Phase | Description | Status |
|---|---|---|---|
| **P0** | 1 | Data model refactor + data-service abstraction | ✅ Done |
| **P0** | 2 | Shopping List → Inventory + JSON export/import | ✅ Done |
| **P0** | 3 | Recipe CRUD + Meal Plan ↔ Recipe flows | ✅ Done |
| **P0** | 4 | Mark Cooked → inventory deduction + rating | ✅ Done |
| **P0** | 5 | Generate Shopping List from Meal Plan | ✅ Done |
| **P1** | 9 | Cook Mode (step-by-step assistant with timers) | ✅ Done |
| **P1** | 10 | Notifications & Reminders | ✅ Done |
| **P2** | 6 | Recipe import from URL | 🔮 Pending |
| **P2** | 7 | AI recipe recommendations | 🔮 Pending |
| **P3** | 8 | AI meal plan auto-fill | 🔮 Pending |

**Also completed (not in original plan):**
- ✅ Full i18n (EN + zh-CN) with client-side `I18nProvider`
- ✅ Recipe edit + versioning with changelog
- ✅ Inline editing (inventory + shopping list items)
- ✅ Inventory → shopping list (multi-select, restock empty)
- ✅ Inline rating widget on recipe detail page
- ✅ Export/import JSON backup (Settings page)
- ✅ PWA support (installable offline app)
- ✅ Responsive nav (icons-only on small screens)

**Android packaging:** The Capacitor project and export/sync workflow are in place. Packaged recipe navigation remains a known blocker, and APK smoke tests are pending. See the [Android build guide](android-build.md).

**Core loop (P0):** Recipe → Meal Plan → Cook → Inventory Deducted → Shopping List Generated → Buy → Inventory Restocked

### Execution batches

```
Batch 1:  Phase 1 (data model)              ── foundation, must be first
              │
Batch 2:  Phase 2 + Phase 3  (in parallel)  ── shopping flow + recipe/meal CRUD
              │
Batch 3:  Phase 4 + Phase 5  (in parallel)  ── mark cooked + generate shopping list
              │                                  ── core loop complete ──
Batch 4:  Phase 9                            ── Cook Mode
              │
Batch 5:  Phase 6 + Phase 7  (in parallel)  ── URL import + AI recipe suggestions
              │
Batch 6:  Phase 8 + Phase 10 (in parallel)  ── AI meal plan + notifications
```

---

## Shared Logic Layer (`src/lib/`)

Utility modules that handle cross-feature operations:

### `src/lib/recipe-utils.ts` (new)

| Function | Description |
|---|---|
| `getRecipeVersions(recipeId, recipes)` | Returns all versions of a recipe, sorted by version number |
| `getLatestVersion(recipeId, recipes)` | Returns the most recent version of a recipe |
| `createNewVersion(recipe, changes, changelog)` | Creates a new recipe object with incremented version, parentRecipeId, and changelog |
| `getAverageRating(recipe)` | Calculates the average score from a recipe's ratings array |
| `filterRecipes(recipes, filters)` | Filters recipes by search text (matches title, tags, **and ingredient names**), cuisine, subcategory, difficulty, and/or rating |

### `src/lib/meal-utils.ts`

| Function | Description |
|---|---|
| `getRecipeForMeal(meal, recipes)` | Resolves a Meal's full Recipe from the library |
| `getMealIngredients(meal, recipes)` | Returns the ingredient list for any meal (recipe-based or custom) |

### `src/lib/inventory-utils.ts` (extend existing)

| Function | Description |
|---|---|
| `isExpired(expiresAt, now)` | Existing — checks if item is past expiry |
| `isNearExpiry(expiresAt, now)` | Existing — checks if item expires within 3 days |
| `deductIngredients(inventory, ingredients)` | NEW — subtracts recipe ingredients from inventory, returns updated list + deduction log |
| `addFromShoppingItem(inventory, shoppingItem)` | NEW — creates an InventoryItem from a checked shopping list item |
| `normalizeIngredientName(name: string): string` | NEW (Phase 4+) — converts ingredient name to a canonical key for cross-language matching. Returns lowercase, trimmed, whitespace-collapsed string. Phase 4: exact match + case-insensitive. Future: AI-assisted normalization ("鸡胸肉" → "chicken_breast") or local dictionary lookup |
| `matchIngredient(recipeIngredient, inventoryItem): boolean` | NEW (Phase 4) — returns true if a recipe ingredient matches an inventory item. Uses `normalizedName` if available, falls back to case-insensitive `name` comparison |

### `src/lib/shopping-utils.ts` (new)

| Function | Description |
|---|---|
| `generateShoppingList(meals, recipes, inventory)` | Aggregates ingredients from planned meals, diffs against inventory, returns deficit as ShoppingListItems |

### `src/lib/cook-mode-utils.ts` (new)

| Function | Description |
|---|---|
| `parseTimerFromStep(instruction)` | Extracts duration from step text (regex: "X minutes", "X min", "X 分钟", etc.) |
| `matchIngredientsToStep(instruction, ingredients)` | Finds which ingredients are used in a step via keyword matching |

### `src/lib/notification-utils.ts` (new)

| Function | Description |
|---|---|
| `createRatingReminder(recipe, meal)` | Creates a rating reminder notification |
| `generateExpiryAlerts(inventory, existingNotifications)` | Creates alerts for near-expiry items (deduped) |

---

## Phases

### Phase 1: Data model refactor

- Update `types.ts` with the new/changed interfaces
- Add `RecipeCuisine`, `RecipeDifficulty`, `RecipeRating` types
- Add `cuisine`, `difficulty`, `ratings`, `version`, `parentRecipeId`, `changelog` to Recipe
- Add `icon` field to InventoryItem with emoji picker UI (UC-I5)
- Change `Meal.recipe` → `Meal.recipeId` + `getRecipeForMeal` helper
- Add `status: MealStatus` (replacing boolean `cooked`), `cookingStartedAt`, `cookedAt`, `rated` to Meal
- Add `servings` field to Meal (set when adding meal, editable after)
- Change `MealSlot` from fixed union type to `string`; add user-configurable `meal-slots` localStorage key with default `["Breakfast", "Lunch", "Dinner", "Snack"]`
- Add `source` field to InventoryItem, ShoppingListItem, and Recipe
- Add `sourceUrl`, `createdAt` to Recipe
- Add `imageUrl`, `notes` to ShoppingListItem
- Remove `WeeklyMealPlan` and `ShoppingList` wrapper types (use flat arrays in localStorage)
- Create `src/lib/data-service.ts` — abstraction layer over localStorage so all data reads/writes go through one module (enables future swap to IndexedDB/SQLite/Supabase without changing page components)
- Update all page components to use data-service instead of direct `useLocalStorage` calls
- Write a one-time localStorage migration (see Data Migration Specification in data-model.md)

### Phase 2: Shopping List → Inventory flow + Export/Import

- Add "Move to Pantry" action on checked shopping items
- Implement `addFromShoppingItem` utility
- Add UI: batch "Move all checked to pantry" button
- Mark items as `movedToInventory: true` after transfer
- **Add JSON export/import (UC-F7)**: "Export Data" downloads .json backup, "Import Data" merges uploaded file with local data (merge by ID, keep newer)

**Depends on:** Phase 1

### Phase 3: Meal Plan ↔ Recipe flows

- Build "Add Meal" modal on the calendar grid
  - Tab 1: search/pick from recipe library
  - Tab 2: enter custom meal (title, ingredients, notes)
  - Option to save custom meal as a new recipe
- Add "Add to Calendar" action on recipe cards (UC-R11)
- Add meal plan actions: remove meal (UC-M5), edit meal servings (UC-M6)
- Implement meal slot customization: add/remove/reorder slots (UC-M4b)
- Implement serving size adjuster on recipe detail page (UC-R12)
- Implement meal history view with filtering (UC-M9)
- Implement recipe CRUD (add, edit, delete) on the recipes page
- Add edit inventory item UI (UC-I2b)
- Add edit shopping list item UI (UC-S3b)
- Add cuisine, difficulty, and rating display to recipe cards
- Add filter dropdowns (cuisine, difficulty, rating) to the recipes page
- Implement recipe versioning: "Create New Version" action, version history view
- Add `recipe-utils.ts` with version and filter helpers

**Depends on:** Phase 1

### Phase 4: Mark Cooked → Inventory deduction

- Add "Mark as Cooked" button/toggle on planned meals in the calendar
- Implement `deductIngredients` utility with fuzzy ingredient name matching
- Show toast with deduction summary + "Undo / Edit" action
- Handle edge cases: missing inventory items, insufficient quantity, unit mismatches
- After marking cooked, prompt "Rate this meal" (1–5 stars + optional comment)
- Save rating to the recipe's `ratings` array

**Depends on:** Phase 3

### Phase 5: Generate Shopping List from Meal Plan

- Add "Generate Shopping List" button on the meal plan page
- Implement `generateShoppingList` utility (diff planned ingredients vs inventory)
- Preview modal showing what will be added, with edit/remove before confirming
- Merge with existing shopping list items (aggregate quantities for same ingredient)

**Depends on:** Phases 2 & 3

### Phase 6: Recipe import from URL

- Add "Import from URL" option on the recipes page
- Build a Next.js API route that fetches and parses recipe data from a URL (using structured data / JSON-LD, or AI extraction as fallback)
- User reviews and edits the parsed recipe before saving
- Set `source: "imported"` and `sourceUrl` on the saved recipe

**Depends on:** Phase 1

### Phase 7: AI recipe recommendations

- Add AI recommendation panel on the recipes page (UI already exists, needs wiring)
- Build Next.js API route that calls OpenAI (or similar) with the user's prompt
- Support two modes:
  - **By prompt**: user describes what they want → AI returns recipe(s)
  - **By inventory**: AI reads current pantry items → suggests recipes using available ingredients
- User can save AI results to the recipe library (`source: "ai-generated"`)

**Depends on:** Phase 1

### Phase 8: AI meal plan auto-fill

- Add "Auto-fill week" option on the meal plan page
- Support two modes:
  - **By prompt**: user describes preferences ("low-carb week", "family dinners") → AI fills the calendar
  - **Random / surprise me**: AI picks a balanced week from existing recipes + new suggestions
- AI considers: variety (no repeats), nutritional balance, existing inventory
- User previews and can edit the suggested plan before confirming

**Depends on:** Phases 3 & 7

### Phase 9: Cook Mode (step-by-step cooking assistant)

- Build a full-screen Cook Mode view (`/cook/[recipeId]` or modal)
- Display one step at a time with large, kitchen-friendly text
- Show step progress ("Step 2 of 6") with next/back navigation
- Highlight ingredients relevant to the current step (keyword matching against instruction text)
- Allow checking off ingredients and marking steps as done
- Auto-detect time durations in step text (regex: "X minutes", "X min", "X 分钟", etc.)
- Display a countdown timer with start/pause/reset controls
- Support multiple concurrent timers (timer tray)
- Audio alert when a timer completes
- "Finish Cooking" button on the last step → triggers Mark as Cooked (Phase 4) + rating prompt (UC-R6)

**Depends on:** Phases 3 & 4

### Phase 10: Notifications & Reminders

- Add `AppNotification` type and `notifications` localStorage key
- Build notification bell icon in Navigation bar with badge count
- Build notification dropdown/panel listing pending notifications
- Implement rating reminder: created when user dismisses the post-cook rating prompt
- Implement expiry alerts: generated on app load for items expiring within 3 days
- Clicking a notification triggers the relevant action (open rating prompt, navigate to inventory)
- Future: meal plan reminders with missing ingredient check, browser Notification API

**Depends on:** Phases 4 & 9

---

## Dependency Graph

```
Phase 1 (data model refactor)
  ├──► Phase 2 (shopping → inventory)
  │       └──► Phase 5 (generate shopping list) ◄──┐
  ├──► Phase 3 (meal plan ↔ recipes)               │
  │       ├──► Phase 4 (mark cooked → deduct)       │
  │       │       └──► Phase 9 (Cook Mode) ◄────────┤
  │       │               └──► Phase 10 (notifications & reminders)
  │       ├─────────────────────────────────────────┘
  │       └──► Phase 8 (AI meal plan auto-fill) ◄──┐
  ├──► Phase 6 (recipe import from URL)             │
  └──► Phase 7 (AI recipe recommendations) ────────┘
```
