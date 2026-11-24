# Test Plan

This document defines the testing strategy, test categories, and specific test cases for each feature and phase. It maps directly to the use cases in [use-cases.md](use-cases.md).

---

## Table of Contents

1. [Testing Strategy](#1-testing-strategy)
2. [Test Categories](#2-test-categories)
3. [Phase 1: Data Model Refactor](#3-phase-1-data-model-refactor)
4. [Phase 2: Shopping List → Inventory](#4-phase-2-shopping-list--inventory)
5. [Phase 3: Meal Plan ↔ Recipe Flows](#5-phase-3-meal-plan--recipe-flows)
6. [Phase 4: Mark Cooked → Inventory Deduction](#6-phase-4-mark-cooked--inventory-deduction)
7. [Phase 5: Generate Shopping List](#7-phase-5-generate-shopping-list)
8. [Phase 6: Recipe Import from URL](#8-phase-6-recipe-import-from-url)
9. [Phase 7: AI Recipe Recommendations](#9-phase-7-ai-recipe-recommendations)
10. [Phase 8: AI Meal Plan Auto-Fill](#10-phase-8-ai-meal-plan-auto-fill)
11. [Phase 9: Cook Mode](#11-phase-9-cook-mode)
12. [Phase 10: Notifications & Reminders](#12-phase-10-notifications--reminders)
13. [Cross-Feature Integration Tests](#13-cross-feature-integration-tests)

---

## 1. Testing Strategy

### Principles

- **Unit tests first:** All pure logic in `src/lib/` gets comprehensive unit tests. These are fast, deterministic, and form the safety net for refactoring.
- **E2E for user flows:** Playwright tests verify that the UI wiring works — clicking buttons triggers the right outcomes across pages.
- **Test the logic, not the framework:** Don't test that React renders a `<div>`. Test that your functions produce the right data and that key user flows work end-to-end.
- **Every bug gets a test:** When a bug is found, write a failing test first, then fix it.

### Coverage targets

| Layer | Tool | What to test | Target |
|---|---|---|---|
| **Pure functions** (`src/lib/`) | Vitest | Data transformations, calculations, matching logic | High — every function, every edge case |
| **Hooks** (`src/hooks/`) | Vitest + RTL | State management, localStorage interaction | Medium — key behaviors |
| **Components** | Vitest + RTL | Rendering, conditional display, user interaction | Medium — key UI states |
| **Page-level flows** | Playwright | Full user journeys across pages | Key happy paths + critical error paths |

### Packaged Android regression

Playwright currently starts the Next.js dev server. It does not cover the exported bundle or Capacitor WebView. Run the [Android APK smoke tests](android-build.md#smoke-test-before-calling-android-ready) on an emulator or device before marking Android packaging complete.

### When to write which type

```
Is it a pure function in src/lib/?
  → Unit test (Vitest)

Is it a React hook?
  → Hook test (Vitest + renderHook)

Is it a component rendering question (does X show up)?
  → Component test (Vitest + RTL)

Does it involve navigation, multiple pages, or localStorage persistence?
  → E2E test (Playwright)

Does it cross feature boundaries (shopping → inventory)?
  → Unit test for the logic + E2E test for the UI flow
```

---

## 2. Test Categories

### Unit Tests (`tests/lib/`)

Pure function tests — no DOM, no React, no browser. Fast and deterministic.

### Hook Tests (`tests/hooks/`)

React hook tests using `renderHook` from Testing Library. Uses jsdom.

### Component Tests (`tests/components/`, `tests/pages/`)

React component rendering tests. Mock external dependencies (next/link, next/navigation).

### E2E Tests (`e2e/`)

Full browser tests with Playwright. Test real user flows against the running dev server.

---

## 3. Phase 1: Data Model Refactor

### Unit Tests

| Test | File | Description |
|---|---|---|
| Migration: old Meal format | `tests/lib/migration.test.ts` | Converts `{ recipe: {...} }` → `{ recipeId: "abc", status: "planned" }` |
| Migration: old Recipe without source | `tests/lib/migration.test.ts` | Adds `source: "manual"`, `version: 1`, `createdAt` to legacy recipes |
| Migration: old ShoppingListItem | `tests/lib/migration.test.ts` | Adds `source: "manual"` to legacy items |
| Migration: already-migrated data | `tests/lib/migration.test.ts` | No-ops when data is already in new format |
| getRecipeForMeal: recipe exists | `tests/lib/meal-utils.test.ts` | Returns the full recipe when recipeId matches |
| getRecipeForMeal: recipe deleted | `tests/lib/meal-utils.test.ts` | Returns undefined when recipe is not found |
| getRecipeForMeal: custom meal | `tests/lib/meal-utils.test.ts` | Returns undefined when meal has no recipeId |
| getMealIngredients: from recipe | `tests/lib/meal-utils.test.ts` | Returns recipe's ingredients |
| getMealIngredients: custom meal | `tests/lib/meal-utils.test.ts` | Returns customIngredients |
| getMealIngredients: no ingredients | `tests/lib/meal-utils.test.ts` | Returns empty array |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Existing pages still work | `e2e/navigation.spec.ts` | All pages load without errors after model change |
| Meal plan displays correctly | `e2e/meal-plan.spec.ts` | Calendar renders, week navigation works |
| Recipes display correctly | `e2e/recipes.spec.ts` | Sample recipes show, search works |
| Inventory: add item still works | `e2e/inventory.spec.ts` | Add item → appears in list with new `source: "manual"` field |
| Inventory: remove item still works | `e2e/inventory.spec.ts` | Remove item → disappears from list |
| Inventory: filter by category | `e2e/inventory.spec.ts` | Click category pill → list filters correctly |
| Inventory: expiry alerts display | `e2e/inventory.spec.ts` | Near-expiry item shows amber alert, expired shows red |
| Shopping list: add item still works | `e2e/shopping-list.spec.ts` | Add item → appears in "to buy" section |
| Shopping list: check/uncheck item | `e2e/shopping-list.spec.ts` | Check item → moves to "Picked up", uncheck → moves back |
| Shopping list: clear checked items | `e2e/shopping-list.spec.ts` | Clear all → only checked items removed |
| Meal plan: week navigation | `e2e/meal-plan.spec.ts` | Navigate back/forward → week label and meals update |
| Recipe search | `e2e/recipes.spec.ts` | Search by title and tag → filters correctly |
| Migration: old data loads correctly | `e2e/navigation.spec.ts` | Pre-seed old format data → app loads without errors, data is migrated |

---

## 4. Phase 2: Shopping List → Inventory

### Unit Tests

| Test | File | Description |
|---|---|---|
| addFromShoppingItem: basic | `tests/lib/inventory-utils.test.ts` | Creates InventoryItem with correct fields and `source: "shopping-list"` |
| addFromShoppingItem: merge existing | `tests/lib/inventory-utils.test.ts` | Same-name item in inventory → quantities are summed |
| addFromShoppingItem: different units | `tests/lib/inventory-utils.test.ts` | Same name but different unit → creates separate item |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Move single item to pantry | `e2e/shopping-list.spec.ts` | Check item → "Move to Pantry" → item appears in inventory |
| Move all checked to pantry | `e2e/shopping-list.spec.ts` | Check 3 items → "Move all to Pantry" → all 3 appear in inventory |
| Item cleared from shopping list | `e2e/shopping-list.spec.ts` | After moving to pantry, item is removed from shopping list |

---

## 5. Phase 3: Meal Plan ↔ Recipe Flows

### Unit Tests

| Test | File | Description |
|---|---|---|
| filterRecipes: by title | `tests/lib/recipe-utils.test.ts` | Matches substring in title |
| filterRecipes: by ingredient | `tests/lib/recipe-utils.test.ts` | Matches ingredient name |
| filterRecipes: by tag | `tests/lib/recipe-utils.test.ts` | Matches tag |
| filterRecipes: by cuisine | `tests/lib/recipe-utils.test.ts` | Filters by cuisine.category |
| filterRecipes: by difficulty | `tests/lib/recipe-utils.test.ts` | Filters by difficulty level |
| filterRecipes: combined filters | `tests/lib/recipe-utils.test.ts` | Cuisine + difficulty + search text together |
| filterRecipes: no matches | `tests/lib/recipe-utils.test.ts` | Returns empty array |
| filterRecipes: Chinese text | `tests/lib/recipe-utils.test.ts` | Searching "鸡肉" finds recipe with chicken ingredient in Chinese |
| getRecipeVersions | `tests/lib/recipe-utils.test.ts` | Returns all versions sorted by version number |
| getLatestVersion | `tests/lib/recipe-utils.test.ts` | Returns highest version |
| createNewVersion | `tests/lib/recipe-utils.test.ts` | Increments version, sets parentRecipeId, includes changelog |
| getAverageRating: with ratings | `tests/lib/recipe-utils.test.ts` | Calculates correct average |
| getAverageRating: no ratings | `tests/lib/recipe-utils.test.ts` | Returns 0 or undefined |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Add meal from recipe library | `e2e/meal-plan.spec.ts` | Click "+" → search recipe → select → appears in calendar |
| Add custom meal | `e2e/meal-plan.spec.ts` | Click "+" → "Custom" tab → type title → save → appears in calendar |
| Save custom meal as recipe | `e2e/meal-plan.spec.ts` | Custom meal → "Save as Recipe" → recipe appears in library |
| Create new recipe | `e2e/recipes.spec.ts` | Click "Add Recipe" → fill form → save → appears in list |
| Edit recipe | `e2e/recipes.spec.ts` | Click recipe → edit fields → save → changes reflected |
| Delete recipe | `e2e/recipes.spec.ts` | Click delete → confirm → recipe removed |
| Add recipe to calendar | `e2e/recipes.spec.ts` | Click "Add to Calendar" → pick date/slot → confirm → appears in meal plan |
| Filter by cuisine | `e2e/recipes.spec.ts` | Select "Italian" → only Italian recipes shown |
| Create new version | `e2e/recipes.spec.ts` | Click "Revise" → edit → save → version 2 created |
| View version history | `e2e/recipes.spec.ts` | Click "Version History" → see v1 and v2 listed |
| Remove planned meal | `e2e/meal-plan.spec.ts` | Click "Remove" on a planned meal → cell reverts to empty "+" |
| Edit planned meal | `e2e/meal-plan.spec.ts` | Click "Edit" → adjust serving size → save → updated in calendar |
| Edit inventory item | `e2e/inventory.spec.ts` | Click item → edit quantity/details → save → changes reflected |
| Edit shopping list item | `e2e/shopping-list.spec.ts` | Click item → edit quantity/details → save → changes reflected |
| Customize meal slots | `e2e/meal-plan.spec.ts` | Add "Kids Snack" slot → save → new row appears on calendar |
| Remove meal slot | `e2e/meal-plan.spec.ts` | Delete slot with meals → confirm → slot row gone, meals in history |
| Adjust serving size | `e2e/recipes.spec.ts` | Open recipe → adjust servings 2→4 → ingredient quantities double |
| Serving size reset | `e2e/recipes.spec.ts` | Adjust servings → click "Reset to original" → quantities restored |
| Confirm servings when adding meal | `e2e/meal-plan.spec.ts` | Click "+" → pick recipe → adjust servings → confirm → meal added with servings |
| View meal history | `e2e/meal-plan.spec.ts` | Click "History" → see past meals sorted by date → filter by status |
| Delete cooked meal | `e2e/meal-plan.spec.ts` | Click "Remove" on cooked meal → confirmation → meal deleted |

---

## 6. Phase 4: Mark Cooked → Inventory Deduction

### Unit Tests

| Test | File | Description |
|---|---|---|
| deductIngredients: exact match | `tests/lib/inventory-utils.test.ts` | 500g chicken − 300g = 200g remaining |
| deductIngredients: full depletion | `tests/lib/inventory-utils.test.ts` | 200g pasta − 200g = 0g (item removed or zeroed) |
| deductIngredients: insufficient | `tests/lib/inventory-utils.test.ts` | 100g butter − 200g = 0g (not negative) |
| deductIngredients: missing item | `tests/lib/inventory-utils.test.ts` | Ingredient not in inventory → skipped, logged in deduction result |
| deductIngredients: multiple ingredients | `tests/lib/inventory-utils.test.ts` | Deducts all recipe ingredients in one call |
| deductIngredients: returns deduction log | `tests/lib/inventory-utils.test.ts` | Returns what was deducted and what was skipped |
| deductIngredients: case-insensitive | `tests/lib/inventory-utils.test.ts` | "Chicken Breast" matches "chicken breast" |
| deductIngredients: unit mismatch | `tests/lib/inventory-utils.test.ts` | Recipe uses "g", inventory has "kg" → flagged for review |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Mark as Cooked: happy path | `e2e/meal-plan.spec.ts` | Click "Mark as Cooked" → toast shows deductions → inventory reduced |
| Mark as Cooked: undo | `e2e/meal-plan.spec.ts` | Click undo in toast → inventory restored |
| Rate after cooking | `e2e/meal-plan.spec.ts` | After marking cooked → rating prompt → submit → rating saved |
| Cooked meal visual state | `e2e/meal-plan.spec.ts` | Cooked meal shows checkmark/dimmed style in calendar |

---

## 7. Phase 5: Generate Shopping List

### Unit Tests

| Test | File | Description |
|---|---|---|
| generateShoppingList: basic deficit | `tests/lib/shopping-utils.test.ts` | 2 meals need 400g pasta, inventory has 200g → 200g on list |
| generateShoppingList: no deficit | `tests/lib/shopping-utils.test.ts` | Inventory has enough → empty list |
| generateShoppingList: aggregation | `tests/lib/shopping-utils.test.ts` | 3 meals all need garlic → single aggregated entry |
| generateShoppingList: multiple ingredients | `tests/lib/shopping-utils.test.ts` | Recipe with 5 ingredients, 3 missing → 3 items on list |
| generateShoppingList: custom meal ingredients | `tests/lib/shopping-utils.test.ts` | Custom meals (no recipeId) with customIngredients are included |
| generateShoppingList: no meals planned | `tests/lib/shopping-utils.test.ts` | Returns empty list |
| generateShoppingList: source tracking | `tests/lib/shopping-utils.test.ts` | Generated items have `source: "meal-plan"` and `sourceRecipeId` |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Generate from meal plan | `e2e/meal-plan.spec.ts` | Click "Generate Shopping List" → preview modal → confirm → items on shopping list |
| Merge with existing list | `e2e/meal-plan.spec.ts` | Existing "eggs" on list + generated "eggs" → quantity merged |

---

## 8. Phase 6: Recipe Import from URL

### Unit Tests

| Test | File | Description |
|---|---|---|
| Parse JSON-LD recipe | `tests/lib/recipe-import.test.ts` | Extracts title, ingredients, instructions from schema.org JSON-LD |
| Parse with missing fields | `tests/lib/recipe-import.test.ts` | Handles missing prep time, servings gracefully |
| Invalid URL | `tests/lib/recipe-import.test.ts` | Returns error for unreachable or non-recipe URLs |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Import recipe from URL | `e2e/recipes.spec.ts` | Paste URL → preview form → edit → save → recipe in library |

---

## 9. Phase 7: AI Recipe Recommendations

### Unit Tests

| Test | File | Description |
|---|---|---|
| Parse AI response to Recipe | `tests/lib/ai-utils.test.ts` | Converts AI JSON response to valid Recipe object |
| Handle malformed AI response | `tests/lib/ai-utils.test.ts` | Graceful fallback when AI returns unexpected format |

### E2E Tests

| Test | File | Description |
|---|---|---|
| AI suggest by prompt | `e2e/recipes.spec.ts` | Enter prompt → click Suggest → results appear → save to library |
| AI suggest by inventory | `e2e/recipes.spec.ts` | Click "Suggest from Pantry" → results based on inventory |

**Note:** E2E tests for AI features should mock the API to avoid flaky tests and API costs.

---

## 10. Phase 8: AI Meal Plan Auto-Fill

### E2E Tests

| Test | File | Description |
|---|---|---|
| Auto-fill by prompt | `e2e/meal-plan.spec.ts` | Click "Auto-fill" → enter prompt → preview → confirm → calendar filled |
| Surprise me | `e2e/meal-plan.spec.ts` | Click "Surprise Me" → preview → confirm → calendar filled |

**Note:** Mock AI API in tests.

---

## 11. Phase 9: Cook Mode

### Unit Tests

| Test | File | Description |
|---|---|---|
| parseTimerFromStep: minutes | `tests/lib/cook-mode-utils.test.ts` | "Stir-fry for 3 minutes" → `{ minutes: 3 }` |
| parseTimerFromStep: hours | `tests/lib/cook-mode-utils.test.ts` | "Bake for 1 hour" → `{ minutes: 60 }` |
| parseTimerFromStep: abbreviated | `tests/lib/cook-mode-utils.test.ts` | "Let rest for 10 min" → `{ minutes: 10 }` |
| parseTimerFromStep: Chinese | `tests/lib/cook-mode-utils.test.ts` | "煮5分钟" → `{ minutes: 5 }` |
| parseTimerFromStep: no timer | `tests/lib/cook-mode-utils.test.ts` | "Add salt to taste" → `null` |
| parseTimerFromStep: combined | `tests/lib/cook-mode-utils.test.ts` | "Bake for 1 hour 30 minutes" → `{ minutes: 90 }` |
| matchIngredientsToStep: single match | `tests/lib/cook-mode-utils.test.ts` | "Melt butter in pan" + ingredients → [butter] |
| matchIngredientsToStep: multiple matches | `tests/lib/cook-mode-utils.test.ts` | "Toss pasta with garlic butter" → [pasta, garlic, butter] |
| matchIngredientsToStep: no matches | `tests/lib/cook-mode-utils.test.ts` | "Preheat oven to 350°F" → [] |
| matchIngredientsToStep: case insensitive | `tests/lib/cook-mode-utils.test.ts` | "Add PARMESAN" + ingredient "parmesan" → [parmesan] |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Enter and navigate Cook Mode | `e2e/cook-mode.spec.ts` | Click "Start Cooking" → see step 1 → next → see step 2 → back → step 1 |
| Timer display | `e2e/cook-mode.spec.ts` | Step with "3 minutes" → timer appears → click Start → countdown visible |
| Finish cooking | `e2e/cook-mode.spec.ts` | Navigate to last step → "Finish Cooking" → meal marked as cooked |
| Ingredient highlights | `e2e/cook-mode.spec.ts` | Step mentioning "butter" → butter is highlighted in ingredient list |

---

## 12. Phase 10: Notifications & Reminders

### Unit Tests

| Test | File | Description |
|---|---|---|
| createRatingReminder | `tests/lib/notification-utils.test.ts` | Creates notification with correct type, recipeId, message |
| generateExpiryAlerts: near-expiry | `tests/lib/notification-utils.test.ts` | Item expiring in 2 days → alert created |
| generateExpiryAlerts: already alerted | `tests/lib/notification-utils.test.ts` | Existing notification for same item → no duplicate |
| generateExpiryAlerts: not near expiry | `tests/lib/notification-utils.test.ts` | Item expiring in 10 days → no alert |

### E2E Tests

| Test | File | Description |
|---|---|---|
| Rating reminder appears | `e2e/notifications.spec.ts` | Cook meal → dismiss rating → bell badge shows 1 → click → rating prompt |
| Expiry alert | `e2e/notifications.spec.ts` | Add item expiring tomorrow → notification bell shows alert |

---

## 13. Cross-Feature Integration Tests

These tests verify that data flows correctly across feature boundaries. They combine unit tests (for logic) and E2E tests (for UI wiring).

### Unit Tests (pure logic, fast)

| Test | File | Description |
|---|---|---|
| Shopping → Inventory → Deduction | `tests/lib/integration.test.ts` | addFromShoppingItem creates item → deductIngredients reduces it |
| Meal Plan → Shopping List → Inventory | `tests/lib/integration.test.ts` | generateShoppingList returns deficit → addFromShoppingItem adds to inventory |
| Recipe versioning + meal reference | `tests/lib/integration.test.ts` | Cook v1 → create v2 → meal still references v1 correctly |
| Cook + rate flow | `tests/lib/integration.test.ts` | deductIngredients → getAverageRating with new rating |

### E2E Tests (full user journeys, slow)

| Test | File | Description |
|---|---|---|
| Plan → Cook → Deduct → Rate | `e2e/cross-feature.spec.ts` | Add recipe to plan → Mark as Cooked → inventory reduced → rate recipe → rating visible |
| Plan → Generate List → Shop → Restock | `e2e/cross-feature.spec.ts` | Add meals → Generate Shopping List → check items → Move to Pantry → inventory updated |
| Recipe → Plan → Cook → Version | `e2e/cross-feature.spec.ts` | Create recipe → add to plan → cook it → rate 3 stars → revise recipe (v2) → add v2 to plan |
| Import → Plan → Shop | `e2e/cross-feature.spec.ts` | Import recipe from URL → add to calendar → generate shopping list → items appear |

---

## Test File Structure

```
tests/
├── setup.ts
├── lib/
│   ├── date-utils.test.ts          ← existing
│   ├── inventory-utils.test.ts     ← existing + Phase 2 & 4 additions
│   ├── meal-utils.test.ts          ← Phase 1
│   ├── recipe-utils.test.ts        ← Phase 3
│   ├── shopping-utils.test.ts      ← Phase 5
│   ├── cook-mode-utils.test.ts     ← Phase 9
│   ├── notification-utils.test.ts  ← Phase 10
│   ├── recipe-import.test.ts       ← Phase 6
│   ├── ai-utils.test.ts            ← Phase 7
│   ├── migration.test.ts           ← Phase 1
│   └── integration.test.ts         ← Cross-feature
├── hooks/
│   └── useLocalStorage.test.ts     ← existing
├── components/
│   └── (component tests as needed)
└── pages/
    └── home.test.tsx               ← existing

e2e/
├── navigation.spec.ts              ← existing
├── inventory.spec.ts               ← existing + Phase 2
├── shopping-list.spec.ts           ← existing + Phase 2
├── recipes.spec.ts                 ← existing + Phase 3, 6, 7
├── meal-plan.spec.ts               ← existing + Phase 3, 4, 5, 8
├── cook-mode.spec.ts               ← Phase 9
├── notifications.spec.ts           ← Phase 10
└── cross-feature.spec.ts           ← Cross-feature journeys
```
