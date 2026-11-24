# Use Cases & Requirements

This document captures all user-facing use cases for the Meal Planner app. Each use case includes a description, the user flow, acceptance criteria, and which features/phases it relates to. Use this as a reference for implementation and testing.

---

## Table of Contents

1. [Recipe Management](#1-recipe-management)
2. [Meal Planning](#2-meal-planning)
3. [Cook Mode](#3-cook-mode)
4. [Inventory Management](#4-inventory-management)
5. [Shopping List](#5-shopping-list)
6. [Cross-Feature Flows](#6-cross-feature-flows)
7. [AI Features](#7-ai-features)
8. [Multilingual Support](#8-multilingual-support)
9. [Notifications & Reminders](#9-notifications--reminders)

---

## 1. Recipe Management

### UC-R1: Manually create a recipe

**As a** user, **I want to** type in a new recipe from scratch, **so that** I can build my personal recipe library.

**User flow:**

1. Navigate to the Recipes page
2. Click "Add Recipe"
3. Fill in: title, description, ingredients (name + quantity + unit), instructions, prep/cook time, servings, tags
4. Click "Save"
5. Recipe appears in the library with `source: "manual"`

**Acceptance criteria:**

- [ ] All required fields (title, at least one ingredient, at least one instruction) are validated
- [ ] Recipe is persisted and visible in the library after page reload
- [ ] Recipe can be searched by title or tag
- [ ] `createdAt` is set automatically

**Phase:** 3

---

### UC-R2: Edit an existing recipe

**As a** user, **I want to** edit a recipe I've saved, **so that** I can correct mistakes or update it over time.

This is an **in-place edit** on the current version. For major changes (new ingredients, different instructions), use UC-R7 to create a new version instead.

**User flow:**

1. Navigate to Recipes page
2. Click on a recipe card → recipe detail/edit view
3. Modify any fields
4. Click "Save"

**Acceptance criteria:**

- [ ] Changes are persisted immediately to the same recipe object (same `id`, same `version`)
- [ ] Any planned meals referencing this recipe (via `recipeId`) reflect the updated data
- [ ] Original `createdAt` is preserved; no new duplicate is created
- [ ] `version` number does NOT change (this is not a new version)

**Phase:** 3

---

### UC-R3: Delete a recipe

**As a** user, **I want to** delete a recipe I no longer need, **so that** my library stays clean.

**User flow:**

1. On the recipe card or detail view, click "Delete"
2. Confirmation prompt appears
3. Confirm → recipe is removed

**Acceptance criteria:**

- [ ] Recipe is removed from the library
- [ ] Planned meals that referenced this recipe retain the recipe title as `customTitle` (graceful fallback — the meal is converted to a custom meal so the title is not lost)
- [ ] Deletion is permanent after confirmation
- [ ] If the recipe has other versions, only the selected version is deleted (others remain)

**Phase:** 3

---

### UC-R4: Categorize a recipe by cuisine and type

**As a** user, **I want to** tag recipes with a cuisine (e.g., Italian, Chinese) and a subcategory (e.g., Baking, Breakfast, Soup), **so that** I can organize and filter my library.

**Examples:**

- Cuisine: "Italian", Subcategory: "Pasta"
- Cuisine: "Chinese", Subcategory: "Stir-fry"
- Cuisine: "American", Subcategory: "Baking"
- Cuisine: "Japanese", Subcategory: "Breakfast"

**User flow:**

1. When creating or editing a recipe, select a cuisine from a dropdown (or type a custom one)
2. Optionally select a subcategory
3. On the Recipes page, filter by cuisine or subcategory

**Acceptance criteria:**

- [ ] Cuisine and subcategory are optional fields
- [ ] Common cuisines are pre-populated in a dropdown but custom values are allowed
- [ ] Recipes can be filtered by cuisine and/or subcategory on the Recipes page
- [ ] Works in both English and Chinese

**Phase:** 3

---

### UC-R5: Set recipe difficulty

**As a** user, **I want to** mark how difficult a recipe is to cook, **so that** I can pick easy recipes on busy days and challenge myself on weekends.

**User flow:**

1. When creating or editing a recipe, select difficulty: Easy, Medium, or Hard
2. Difficulty is shown on the recipe card
3. Recipes can be filtered by difficulty

**Acceptance criteria:**

- [ ] Difficulty is optional, defaults to unset
- [ ] Displayed as a badge or icon on recipe cards (e.g., 🟢 Easy, 🟡 Medium, 🔴 Hard)
- [ ] Can be used as a filter on the Recipes page

**Phase:** 3

---

### UC-R6: Rate and comment on a recipe after cooking

**As a** user, **I want to** rate a recipe and leave notes after cooking it, **so that** I can remember how it turned out and what to adjust next time.

**Examples:**

- Rating: 4/5 stars, Comment: "Great flavor but too salty — use less soy sauce next time"
- Rating: 5/5 stars, Comment: "Perfect, don't change anything"
- Rating: 3/5 stars, Comment: "鸡肉要提前腌制更久" (marinate the chicken longer)

**User flow:**

1. After marking a meal as cooked (UC-M8), a "Rate this meal" prompt appears
2. User selects 1–5 stars and optionally writes a comment
3. Rating is saved to the recipe's `ratings` array
4. On the recipe detail view, all past ratings and comments are visible

**Acceptance criteria:**

- [ ] Rating is 1–5 stars (required when rating)
- [ ] Comment is optional, supports any language
- [ ] Multiple ratings accumulate over time (one per cook)
- [ ] Average rating is displayed on the recipe card
- [ ] `ratedAt` is set automatically
- [ ] Ratings are linked to the specific recipe version that was cooked

**Phase:** 4 (tied to "Mark as Cooked" flow)

---

### UC-R7: Create a new version of a recipe

**As a** user, **I want to** revise a recipe while keeping the original version, **so that** I can experiment with changes and compare results.

**Examples:**

- v1: "Garlic Butter Pasta" with 3 tbsp butter
- v2: "Garlic Butter Pasta" — changelog: "reduced butter to 2 tbsp, added chili flakes"
- v3: "Garlic Butter Pasta" — changelog: "halved the garlic, added lemon zest"

**User flow:**

1. On a recipe detail view, click "Create New Version" (or "Revise")
2. A copy of the recipe opens in edit mode
3. User makes changes (ingredients, instructions, etc.)
4. User writes a brief changelog ("reduced sugar by half")
5. Click "Save as New Version"
6. New recipe is created with `version` incremented and `parentRecipeId` pointing to the original

**Acceptance criteria:**

- [ ] New version is a separate recipe object with its own `id`
- [ ] `parentRecipeId` points to the original (v1) recipe
- [ ] `version` is auto-incremented (v1 → v2 → v3)
- [ ] `changelog` describes what changed
- [ ] All versions are accessible from the recipe detail view ("Version History")
- [ ] Each version has its own independent ratings
- [ ] Meal plans reference the specific version that was used
- [ ] The latest version is shown by default in the recipe library; older versions are accessible but not prominent

**Phase:** 3

---

### UC-R8: View version history of a recipe

**As a** user, **I want to** see all past versions of a recipe, **so that** I can compare changes or revert to an older version.

**User flow:**

1. On a recipe detail view, click "Version History"
2. A list shows all versions with: version number, changelog, date, average rating
3. User can click any version to view its full details
4. User can click "Use this version" to add it to a meal plan

**Acceptance criteria:**

- [ ] Shows all versions sorted by version number (newest first)
- [ ] Each entry shows changelog and rating summary
- [ ] Clicking a version shows its full recipe details
- [ ] User can cook or plan any version, not just the latest

**Phase:** 3

---

### UC-R9: Import a recipe from a URL

**As a** user, **I want to** paste a recipe website link and have the app extract the recipe, **so that** I don't have to type it all manually.

**User flow:**

1. On the Recipes page, click "Import from URL"
2. Paste a URL (e.g., from AllRecipes, BBC Good Food, 下厨房)
3. App fetches and parses the recipe data
4. A pre-filled form appears for the user to review and edit
5. Click "Save" → recipe is added with `source: "imported"` and `sourceUrl` set

**Acceptance criteria:**

- [ ] Supports common recipe websites with structured data (JSON-LD / schema.org)
- [ ] Falls back to AI extraction if structured data is unavailable
- [ ] User can edit all fields before saving
- [ ] Original URL is stored for reference
- [ ] Handles invalid/unreachable URLs gracefully with an error message

**Phase:** 6

---

### UC-R10: Search and filter recipes

**As a** user, **I want to** search recipes by title, tag, ingredient, cuisine, or difficulty, **so that** I can quickly find what I'm looking for.

**Examples:**

- Search "chicken" → finds recipes that have "chicken" in the title, tags, or ingredient list
- Search "鸡肉" → finds recipes with chicken ingredients in Chinese
- Filter: cuisine "Italian" + difficulty "Easy"

**User flow:**

1. On the Recipes page, type in the search box and/or use filter dropdowns
2. Results filter in real time

**Acceptance criteria:**

- [ ] Search matches against title, tags, **and ingredient names**
- [ ] Search is case-insensitive and works with English and Chinese text
- [ ] Can filter by cuisine, subcategory, difficulty, and rating
- [ ] Filters can be combined (e.g., "Italian" + "Easy" + search "garlic")
- [ ] Shows "No recipes found" when nothing matches
- [ ] Clearing filters restores the full list

**Phase:** Existing search + Phase 3 for new filters

---

### UC-R11: Add a recipe to the meal plan calendar

**As a** user, **I want to** add a recipe directly to my meal plan from the Recipes page, **so that** I can plan meals while browsing without switching to the calendar first.

**Examples:**

- Browsing recipes, find "Garlic Butter Pasta" → click "Add to Calendar" → pick Wednesday, Dinner → done
- After importing a recipe from a URL → immediately schedule it for Saturday lunch

**User flow:**

1. On a recipe card or detail view, click "Add to Calendar" (or a calendar icon)
2. A compact modal/popover appears with:
   - A date picker (defaulting to the current week, with week navigation)
   - A meal slot selector (Breakfast / Lunch / Dinner / Snack)
3. Select a date and slot, click "Add"
4. The recipe is added to the meal plan for that date + slot
5. A confirmation toast shows: "Added Garlic Butter Pasta to Wednesday Dinner"

**Acceptance criteria:**

- [ ] "Add to Calendar" action is available on recipe cards and detail view
- [ ] Date picker shows the current week by default with ability to navigate weeks
- [ ] All four meal slots are selectable
- [ ] If the selected slot already has a meal, user is warned and can choose to replace or cancel
- [ ] Meal is created with `recipeId` pointing to this recipe
- [ ] Confirmation toast with the recipe name, day, and slot
- [ ] Works from any recipe source (manual, imported, AI-generated)

**Phase:** 3

---

### UC-R12: Adjust serving size

**As a** user, **I want to** change the serving size on a recipe detail page and have all ingredient quantities scale automatically, **so that** I can cook for more or fewer people without doing the math myself.

**Examples:**

- Recipe serves 2 → I'm cooking for 4 → all ingredients double
- Recipe serves 4 → I'm cooking for 1 → all ingredients are quartered
- Recipe serves 2, spaghetti 200g → serving size set to 3 → spaghetti shows 300g

**User flow:**

1. On the recipe detail page, see the current serving size (e.g., "2 servings")
2. Click +/− buttons or type a number to adjust (e.g., change to 4)
3. All ingredient quantities update instantly (200g → 400g)
4. The adjusted serving size is session-only — it does NOT modify the saved recipe

**Acceptance criteria:**

- [ ] Serving size adjuster is displayed near the ingredients section
- [ ] +/− buttons and direct number input are supported
- [ ] Minimum serving size is 1
- [ ] All ingredient quantities scale proportionally (newQty = originalQty × desiredServings / recipeServings)
- [ ] Quantities are rounded to sensible values (no "2.333 tbsp" — round to nearest 0.25 or 0.5 for small units)
- [ ] Original recipe servings are preserved — adjustment is display-only, not saved
- [ ] Adjusted quantities carry over to Cook Mode if the user clicks "Start Cooking"
- [ ] Adjusted quantities are used for inventory deduction when marking as cooked
- [ ] Works in the recipe detail view and in Cook Mode

**Phase:** 3

---

### UC-R13: Unit conversion for ingredient matching

**As a** user, **I want** the app to automatically convert between compatible units when deducting from inventory, **so that** a recipe using "0.5 l" correctly subtracts from inventory tracked in "ml".

**Conversion groups:**

- **Weight:** g ↔ kg ↔ oz ↔ lb (1 kg = 1000g, 1 lb = 453.6g, 1 oz = 28.35g)
- **Volume:** ml ↔ l ↔ tsp ↔ tbsp ↔ cup ↔ qt ↔ gal (1 l = 1000ml, 1 cup = 236.6ml, 1 tbsp = 14.8ml, 1 tsp = 4.9ml, 1 qt = 946.4ml, 1 gal = 3785.4ml)
- **Discrete:** piece, unit, pack, box, bag — same-unit matching only (no cross-conversion)

**Examples:**

- Recipe: "butter 0.5 lb" + Inventory: "butter 300g" → convert 0.5 lb = 226.8g → deduct 226.8g → 73.2g remaining
- Recipe: "milk 0.5 l" + Inventory: "milk 800 ml" → convert 0.5 l = 500ml → deduct → 300ml remaining
- Recipe: "eggs 4 piece" + Inventory: "eggs 1 box" → incompatible units → flag for user review

**Acceptance criteria:**

- [ ] Units within the same group are auto-converted using a normalization function
- [ ] Weight normalizes to grams; volume normalizes to milliliters
- [ ] Cross-group conversions (e.g., g → ml) are not attempted — flagged for user review
- [ ] Discrete units only match same-to-same
- [ ] Conversion is used in inventory deduction (Phase 4) and shopping list generation (Phase 5)
- [ ] Utility function: `convertUnit(quantity, fromUnit, toUnit): number | null` — returns null if incompatible

**Phase:** 4

---

## 2. Meal Planning

### UC-M1: Add a meal from the recipe library

**As a** user, **I want to** pick a saved recipe and place it on my weekly calendar, **so that** I can plan what to eat.

**User flow:**

1. On the Meal Plan page, click "+" on a calendar cell (or "Add Meal")
2. A modal opens with a searchable list of saved recipes
3. Select a recipe
4. A serving size picker appears (defaults to the recipe's servings)
5. Confirm → meal is added to that date + slot with the chosen serving size
6. The recipe title appears in the calendar cell

**Acceptance criteria:**

- [ ] Modal allows searching/filtering recipes
- [ ] After selecting a recipe, user confirms the serving size before adding
- [ ] Serving size defaults to the recipe's original servings
- [ ] Meal is saved with `recipeId` and `servings` (the chosen serving count)
- [ ] Same recipe can be added to multiple slots
- [ ] Meal persists across page reloads

**Phase:** 3

---

### UC-M2: Add a custom meal (not from recipes)

**As a** user, **I want to** type in a meal directly on the calendar without creating a full recipe, **so that** I can quickly jot down what I plan to eat.

**User flow:**

1. On the Meal Plan page, click "+" on a calendar cell
2. Choose "Custom meal" tab
3. Enter: title, optionally ingredients and notes
4. Click "Save"

**Acceptance criteria:**

- [ ] Meal is saved with `customTitle` (no `recipeId`)
- [ ] Ingredients and notes are optional
- [ ] Displays in the calendar identically to recipe-based meals

**Phase:** 3

---

### UC-M3: Save a custom meal as a recipe

**As a** user, **I want to** save a custom meal I entered as a recipe, **so that** I can reuse it in future meal plans.

**User flow:**

1. On a custom meal in the calendar, click "Save as Recipe"
2. A pre-filled recipe form appears (title, ingredients, notes carried over)
3. User fills in any missing fields (instructions, times, servings, tags)
4. Click "Save" → recipe is added to the library
5. The meal in the calendar is updated to reference the new `recipeId`

**Acceptance criteria:**

- [ ] Pre-fills available data from the custom meal
- [ ] New recipe appears in the recipe library with `source: "manual"`
- [ ] The calendar meal is converted from custom to recipe-linked
- [ ] Does not create a duplicate if saved multiple times

**Phase:** 3

---

### UC-M4: Navigate between weeks

**As a** user, **I want to** move forward and backward through weeks, **so that** I can plan ahead or review past meals.

**User flow:**

1. On the Meal Plan page, click "←" or "→" arrows
2. Calendar shifts by one week
3. Today's column is highlighted when the current week is shown

**Acceptance criteria:**

- [ ] Week label updates to show the correct date range
- [ ] Meals for the displayed week are shown correctly
- [ ] Navigating back and forth preserves all data

**Phase:** Existing (already implemented)

---

### UC-M4b: Customize meal slots

**As a** user, **I want to** define my own meal slots (instead of fixed breakfast/lunch/dinner/snack), **so that** my calendar matches how my household actually eats.

**Examples:**

- Default: Breakfast, Lunch, Dinner, Snack
- Family with kids: Breakfast, Kids Snack, Lunch, Afternoon Snack, Dinner
- Intermittent fasting: Brunch, Dinner
- Chinese-style: 早餐, 午餐, 下午茶, 晚餐, 宵夜

**User flow:**

1. Go to Settings (or a "Customize" option on the Meal Plan page)
2. See the current list of meal slots in order
3. Add a new slot (type a name, e.g., "Kids Snack")
4. Reorder slots by drag-and-drop or up/down arrows
5. Remove a slot (with warning if meals exist in that slot)
6. Click "Save"

**Acceptance criteria:**

- [ ] Meal slots are user-defined, stored in localStorage (key: `meal-slots`)
- [ ] Default slots are pre-populated on first use: `["Breakfast", "Lunch", "Dinner", "Snack"]`
- [ ] Slot names support any language (Unicode)
- [ ] Minimum 1 slot required
- [ ] Slots are displayed in the user-defined order on the calendar grid
- [ ] Adding a new slot adds a new row to the calendar
- [ ] Removing a slot warns if planned meals exist in that slot
- [ ] Removing a slot does NOT delete the meals — they remain in history with their original slot name, just no longer shown on the calendar grid
- [ ] Meals with a removed slot are still visible in Meal History (UC-M9)
- [ ] The "Add Meal" modal slot selector reflects the custom slots
- [ ] `Meal.slot` changes from a fixed union type to `string`

**Data model impact:**

```typescript
// Before: fixed enum
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

// After: string (user-defined)
// Meal.slot becomes string
// Custom slots stored separately:
// localStorage key: "meal-slots"
// Default value: ["Breakfast", "Lunch", "Dinner", "Snack"]
```

**Phase:** 3

---

### UC-M5: Remove a planned meal

**As a** user, **I want to** remove a meal from the calendar, **so that** I can change my mind about what I planned.

**User flow:**

1. On a planned meal in the calendar, click "Remove" (or a trash icon)
2. Meal is removed from that date + slot

**Acceptance criteria:**

- [ ] Meal is removed immediately (no confirmation needed for a simple removal)
- [ ] The calendar cell reverts to the empty "+" state
- [ ] The recipe in the library is NOT affected (only the plan entry is removed)
- [ ] Meals in any status can be deleted (planned, cooked, skipped)
- [ ] Deleting a cooked meal shows a confirmation ("This meal has been cooked and rated. Delete anyway?")

**Phase:** 3

---

### UC-M6: Edit a planned meal

**As a** user, **I want to** adjust the serving size or notes on a planned meal, **so that** I can change how much I'm cooking without re-creating the meal.

**User flow:**

1. On a planned meal in the calendar, click "Edit"
2. A popover appears showing:
   - Meal title (read-only — shows recipe name or custom title)
   - Serving size adjuster (+/− buttons)
   - Notes field (editable)
3. Make changes and click "Save"

**Acceptance criteria:**

- [ ] User can adjust the serving size (minimum 1)
- [ ] Notes can be added or edited
- [ ] Recipe and date/slot cannot be changed (delete and re-add instead)
- [ ] Adjusted serving size is used for inventory deduction and Cook Mode
- [ ] Works for all meal statuses (planned, cooked, skipped — though cooked meals are historical records)

**Phase:** 3

---

### UC-M7: Skip a planned meal

**As a** user, **I want to** skip a meal I decided not to cook, **so that** it's visually distinct from meals I haven't gotten to yet, without deleting it.

**User flow:**

1. On a planned meal in the calendar, click "Skip"
2. Meal is marked as skipped and visually dimmed

**Acceptance criteria:**

- [ ] Meal `status` is set to `"skipped"`
- [ ] Skipped meals are visually distinct (dimmed, strikethrough, or a "skipped" badge)
- [ ] No inventory deduction occurs
- [ ] A "Restore" action is available to return the meal to `"planned"` status
- [ ] Skipped meals are excluded from "Generate Shopping List" calculations

**Phase:** 4

---

### UC-M8: Meal actions (Start Cooking / Mark as Cooked)

**As a** user, **I want to** either start cooking interactively or quickly mark a meal as done, **so that** I can choose the right workflow for the moment.

**User flow:**

On a planned meal in the calendar, two actions are available:

**Option A — "Start Cooking" (enters Cook Mode):**

1. Click "Start Cooking" on a planned meal
2. App enters Cook Mode (UC-C1) for this meal's recipe
3. After finishing Cook Mode, the meal is automatically marked as cooked (UC-C5)

**Option B — "Mark as Cooked" (quick action):**

1. Click "Mark as Cooked" on a planned meal
2. Ingredients are auto-deducted from inventory
3. A toast/banner shows what was deducted: "Used 200g spaghetti, 3 tbsp butter, ..."
4. Toast includes "Undo" and "Edit" actions
5. Clicking "Edit" opens a modal showing each ingredient with editable quantities
6. Clicking "Undo" reverses the deduction

**After either option — Rating reminder:**

7. A "Rate this meal" prompt appears immediately (can be dismissed)
8. If dismissed, a notification reminder is scheduled (see UC-N1)

**Acceptance criteria:**

- [ ] Both "Start Cooking" and "Mark as Cooked" are visible on planned meals
- [ ] "Start Cooking" is greyed out / disabled for custom meals that have no instructions
- [ ] "Start Cooking" launches Cook Mode for the meal's recipe
- [ ] "Mark as Cooked" performs the quick deduction flow
- [ ] Meal is marked with `status: "cooked"` and `cookedAt` is set
- [ ] Inventory quantities decrease by the recipe's ingredient amounts
- [ ] If an ingredient is not in inventory, it is skipped (not an error)
- [ ] If inventory has less than required, quantity goes to zero (not negative)
- [ ] Undo fully restores inventory to pre-deduction state
- [ ] Edit allows adjusting quantities (e.g., used half the butter)
- [ ] Cooked meals are visually distinct in the calendar (e.g., checkmark, dimmed)
- [ ] Rating prompt appears after cooking (both paths)
- [ ] If rating is dismissed, a reminder notification is created

**Phase:** 4 + 9 (Start Cooking path)

---

### UC-M9: View meal history

**As a** user, **I want to** browse all my past meals, **so that** I can remember what I cooked, when, and how I rated it.

**User flow:**

1. On the Meal Plan page, click "History" (or a dedicated "Meal History" nav link)
2. See a chronological list of past meals (most recent first)
3. Each entry shows: date, slot (if any), recipe title (or custom title), status (cooked/skipped), rating (if rated)
4. Click a meal to view the recipe detail
5. Filter by date range, slot, or status

**Acceptance criteria:**

- [ ] Shows all meals from all weeks, not just the current week
- [ ] Sorted by date, most recent first
- [ ] Each entry shows: date, slot name, meal title, status badge (cooked ✅ / skipped ⏭)
- [ ] Cooked meals show the rating (stars) if rated
- [ ] Clicking a recipe-linked meal navigates to the recipe detail page
- [ ] Meals with a deleted slot still appear (slot shown as the original name, or "—" if empty)
- [ ] Can filter by: date range, status (cooked/skipped/all), slot name
- [ ] Pagination or infinite scroll for long history

**Phase:** 3

---

## 3. Cook Mode

Cook Mode is an interactive step-by-step cooking assistant that guides the user through a recipe in real time.

### UC-C1: Start Cook Mode for a recipe

**As a** user, **I want to** enter a focused cooking view for a recipe, **so that** I can follow the steps hands-free while cooking.

**User flow:**

1. From a recipe detail view or a planned meal in the calendar, click "Start Cooking"
2. App enters Cook Mode: a full-screen (or near-full-screen) step-by-step view
3. Shows the recipe title, total steps count, and current step number

**Acceptance criteria:**

- [ ] Cook Mode can be launched from a recipe card, recipe detail, or a planned meal
- [ ] Shows a clean, large-text UI optimized for kitchen use (readable from a distance)
- [ ] Displays step progress: "Step 2 of 6"
- [ ] User can exit Cook Mode at any time (step progress is preserved within the session)
- [ ] Explicitly cancelling Cook Mode ("Exit" / "Cancel") discards step progress and returns `status` to `"planned"`

**Phase:** 9

---

### UC-C2: Navigate through cooking steps

**As a** user, **I want to** move through recipe steps one at a time, **so that** I can focus on the current task without being overwhelmed.

**User flow:**

1. In Cook Mode, see the current step's instruction text prominently displayed
2. Below the instruction, see the ingredients used in this step (highlighted from the full ingredient list)
3. Click "Next" to advance or "Back" to revisit a previous step
4. Completed steps show a checkmark

**Acceptance criteria:**

- [ ] One step is shown at a time with large, readable text
- [ ] "Next" and "Back" buttons are large and easy to tap
- [ ] Completed steps are visually marked (checkmark or strikethrough)
- [ ] User can jump to any step via a step overview/list
- [ ] Final step shows a "Finish Cooking" button

**Phase:** 9

---

### UC-C3: See ingredients for the current step

**As a** user, **I want to** see which ingredients are needed for the current step, **so that** I can prepare them before starting.

**Examples:**

- Step: "Melt butter in a pan, sauté minced garlic until fragrant"
  - Ingredients highlighted: butter (3 tbsp), garlic (4 pieces)
- Step: "Toss drained pasta in the garlic butter"
  - Ingredients highlighted: spaghetti (200g)

**User flow:**

1. Each step shows a list of relevant ingredients beneath the instruction
2. User can check off ingredients as they add them

**Acceptance criteria:**

- [ ] Ingredients are matched to steps (either manually tagged per step, or auto-parsed from instruction text)
- [ ] Checked-off ingredients show a visual indicator
- [ ] Full ingredient list is accessible via a sidebar or expandable panel at any time

**Phase:** 9

**Design note:** Initially, ingredient-to-step mapping can be done with simple keyword matching (ingredient name appears in instruction text). A future enhancement could allow recipe authors to explicitly tag ingredients per step.

---

### UC-C4: Step timer

**As a** user, **I want** the app to automatically start a timer when a step involves a duration, **so that** I don't have to set a separate timer on my phone.

**Examples:**

- Step: "Stir-fry for 3 minutes" → auto-detects "3 minutes", shows a countdown timer
- Step: "Bake at 350°F for 25 minutes" → shows a 25-minute timer
- Step: "Let rest for 10 min" → shows a 10-minute timer
- Step: "Simmer on low heat for 1 hour" → shows a 60-minute timer

**User flow:**

1. When entering a step that contains a time duration, a timer automatically appears
2. User clicks "Start Timer" to begin the countdown
3. Timer shows remaining time prominently
4. When the timer reaches zero, an audio alert sounds and a notification appears
5. User can pause, reset, or dismiss the timer
6. Multiple timers can run simultaneously (e.g., pasta boiling while sauce simmers)

**Acceptance criteria:**

- [ ] Durations are auto-parsed from instruction text (regex for patterns like "X minutes", "X min", "X hours", "X 分钟")
- [ ] Timer is prominently displayed alongside the step instruction
- [ ] Timer auto-starts only when user clicks "Start" (not automatically on step entry)
- [ ] Audio alert when timer completes (respects device volume)
- [ ] Multiple concurrent timers are supported (displayed in a timer tray)
- [ ] Timers continue running when navigating between steps
- [ ] Timer works even if screen is locked (via Web Notifications API, future: native push)

**Phase:** 9 (timer is a stretch goal within Cook Mode)

---

### UC-C5: Finish cooking and transition to rating

**As a** user, **I want to** finish Cook Mode and be prompted to rate the recipe, **so that** the cooking experience flows naturally into feedback.

**User flow:**

**Path A — Launched from a planned meal:**

1. After completing the last step, click "Finish Cooking"
2. The meal is automatically marked as cooked (`status: "cooked"`)
3. Inventory deduction happens (toast with undo/edit, same as UC-M8)
4. "Rate this meal" prompt appears (UC-R6)
5. User rates and optionally comments, then returns to the main app

**Path B — Launched from a standalone recipe (not on the calendar):**

1. After completing the last step, click "Finish Cooking"
2. No inventory deduction (no planned meal to track)
3. "Rate this recipe" prompt appears (UC-R6)
4. User rates and optionally comments, then returns to the recipe detail view

**Acceptance criteria:**

- [ ] "Finish Cooking" marks the meal as cooked if launched from a planned meal
- [ ] If launched from a standalone recipe, no meal status change or inventory deduction occurs
- [ ] Rating prompt is shown after finishing in both paths (can be skipped)
- [ ] Inventory deduction happens only for planned meals (toast with undo/edit)
- [ ] Cook Mode state is cleared after finishing

**Phase:** 9 (integrates with Phase 4 for inventory deduction)

---

## 4. Inventory Management

### UC-I1: Manually add an inventory item

**As a** user, **I want to** add items to my pantry, **so that** I can track what ingredients I have.

**User flow:**

1. On the Inventory page, click "Add Item"
2. Fill in: name, quantity, unit, category, optional expiry date
3. Click "Save"

**Acceptance criteria:**

- [ ] Item appears in the inventory list
- [ ] Required fields (name, quantity) are validated
- [ ] `addedAt` is set automatically
- [ ] `source` is set to `"manual"`

**Phase:** Existing (already implemented)

---

### UC-I2: Remove an inventory item

**As a** user, **I want to** remove items from my pantry, **so that** I can keep my inventory accurate.

**User flow:**

1. Click the trash icon on an inventory item
2. Item is removed immediately

**Acceptance criteria:**

- [ ] Item is removed from the list and from storage
- [ ] No confirmation needed (simple action)

**Phase:** Existing (already implemented)

---

### UC-I2b: Edit an inventory item

**As a** user, **I want to** update an inventory item's quantity or details, **so that** my pantry stays accurate without deleting and re-adding.

**Examples:**

- Used 4 eggs out of 12 → update quantity from 12 to 8
- Bought a different brand → update the name or icon
- Realized the expiry date was wrong → correct it

**User flow:**

1. Click on an inventory item (or click an edit icon)
2. An edit form appears with the current values pre-filled
3. Modify any fields (name, quantity, unit, category, expiry, icon)
4. Click "Save"

**Acceptance criteria:**

- [ ] All editable fields are pre-filled with current values
- [ ] Quantity can be adjusted up or down
- [ ] Changes are persisted immediately
- [ ] `addedAt` is preserved (not reset on edit)
- [ ] Validation: quantity cannot be negative

**Phase:** 3

---

### UC-I3: Filter inventory by category

**As a** user, **I want to** filter my pantry by category, **so that** I can quickly find items in a specific group.

**User flow:**

1. Click a category pill (e.g., "Dairy", "Produce")
2. List filters to show only items in that category
3. Click "All" to reset

**Acceptance criteria:**

- [ ] Filter updates instantly
- [ ] Shows "No items in this category" when empty
- [ ] Category pills only show categories that have items (plus "All")

**Phase:** Existing (already implemented)

---

### UC-I4: See expiry alerts

**As a** user, **I want to** see which items are near expiry or expired, **so that** I can use them before they go bad.

**Acceptance criteria:**

- [ ] Items expiring within 3 days are highlighted in amber with an alert icon
- [ ] Expired items are highlighted in red with an alert icon
- [ ] Items with no expiry date show no alert

**Phase:** Existing (already implemented)

---

### UC-I5: Set an icon for an inventory item

**As a** user, **I want to** add a visual icon to pantry items, **so that** I can scan my inventory at a glance without reading every name.

**Examples:**

- Eggs → 🥚
- Chicken breast → 🍗
- Butter → 🧈
- Soy sauce → a custom photo of the bottle

**User flow:**

1. When adding or editing an inventory item, an icon picker is available
2. User can pick from a categorized emoji palette (auto-suggested based on category)
3. Alternatively, user can upload a custom image
4. The icon appears as a small thumbnail next to the item name in the list

**Acceptance criteria:**

- [ ] Icon field is optional — items display a default category icon if unset
- [ ] Emoji picker shows relevant suggestions based on the item's category (e.g., Dairy → 🥛🧀🧈🥚)
- [ ] Custom image upload is supported (resized to thumbnail size)
- [ ] Icon is displayed in the inventory list next to the item name
- [ ] Auto-suggested emoji defaults by category: Produce 🥬, Dairy 🥛, Meat & Fish 🥩, Grains 🌾, Spices 🧂, Frozen ❄️, Bakery 🍞

**Phase:** 1

---

## 5. Shopping List

### UC-S1: Manually add a shopping list item

**As a** user, **I want to** add items to my shopping list, **so that** I remember what to buy.

**User flow:**

1. On the Shopping List page, click "Add Item"
2. Fill in: name, quantity, unit, category
3. Click "Save"

**Acceptance criteria:**

- [ ] Item appears in the "to buy" section
- [ ] `source` is set to `"manual"`
- [ ] Badge count in the header updates

**Phase:** Existing (already implemented)

---

### UC-S2: Check off a shopping list item

**As a** user, **I want to** check off items as I shop, **so that** I can track what I've already picked up.

**User flow:**

1. Click the circle/checkbox on an item
2. Item moves to the "Picked up" section with a line-through style

**Acceptance criteria:**

- [ ] Item toggles between checked and unchecked
- [ ] Checked items appear in a separate "Picked up" section
- [ ] Badge count decreases when an item is checked

**Phase:** Existing (already implemented)

---

### UC-S3: Clear all checked items

**As a** user, **I want to** clear all picked-up items at once, **so that** I can start fresh after a shopping trip.

**User flow:**

1. Click "Clear all" in the "Picked up" section
2. All checked items are removed

**Acceptance criteria:**

- [ ] Only checked items are removed; unchecked items remain
- [ ] "Picked up" section disappears when empty

**Phase:** Existing (already implemented)

---

### UC-S3b: Edit a shopping list item

**As a** user, **I want to** update a shopping list item's details, **so that** I can correct mistakes or adjust quantities.

**User flow:**

1. Click on a shopping list item (or click an edit icon)
2. An edit form appears with the current values pre-filled
3. Modify any fields (name, quantity, unit, category, image, notes)
4. Click "Save"

**Acceptance criteria:**

- [ ] All editable fields are pre-filled with current values
- [ ] Changes are persisted immediately
- [ ] Checked/unchecked state is preserved during edit
- [ ] Works for both manually added and meal-plan-generated items

**Phase:** 3

---

### UC-S4: Add an image to a shopping list item

**As a** user, **I want to** attach a photo to a shopping list item, **so that** my family knows exactly which product to buy.

**Examples:**

- "Chips" with a photo of Hawaiian chips so they don't buy regular Lay's
- "Soy sauce" with a photo of the specific brand (Kikkoman, not generic)
- "牛奶" with a photo of the oat milk carton from Costco

**User flow:**

1. When adding or editing a shopping list item, click "Add Photo"
2. User can either:
   - Upload an image from their device (camera roll or file picker)
   - Take a photo with the device camera (mobile)
3. A thumbnail preview appears on the item
4. The image is saved alongside the item data

**Acceptance criteria:**

- [ ] Image upload accepts common formats (JPEG, PNG, WebP)
- [ ] Images are resized to max 200×200px and compressed to JPEG 60% quality (max ~50 KB per thumbnail)
- [ ] Total image storage budget: max 500 KB across all shopping list images (~10 items with images)
- [ ] Thumbnail is displayed on the shopping list item card
- [ ] Clicking the thumbnail opens a larger preview
- [ ] Image is optional — items work fine without one
- [ ] Image can be removed or replaced after adding
- [ ] On mobile, "Take Photo" option uses the device camera via `<input capture="environment">`
- [ ] A `notes` field is also available for text clarification (e.g., "the blue bag, not the red one")

**Phase:** 2

---

## 6. Cross-Feature Flows

### UC-X1: Move bought items to inventory

**As a** user, **I want to** move checked shopping list items to my inventory, **so that** my pantry is automatically updated after a shopping trip.

**User flow:**

1. After checking off items in the shopping list, click "Move to Pantry"
2. All checked items are added as new inventory items
3. Shopping list items are marked as moved and cleared

**Acceptance criteria:**

- [ ] New InventoryItems are created with matching name/quantity/unit/category
- [ ] `source` on the inventory item is set to `"shopping-list"`
- [ ] Shopping list items are cleared after transfer
- [ ] If an item with the same name already exists in inventory, quantities are added together
- [ ] User can also move individual items (not just batch)

**Phase:** 2

---

### UC-X2: Generate shopping list from meal plan

**As a** user, **I want to** auto-generate a shopping list from my weekly meal plan, **so that** I know exactly what to buy based on what I'm missing.

**User flow:**

1. On the Meal Plan page, click "Generate Shopping List"
2. App calculates: (total ingredients needed for the week) − (what's already in inventory)
3. A preview modal shows the deficit items with quantities
4. User can edit quantities, remove items, or add extras
5. Click "Add to Shopping List" → items are merged into the existing shopping list

**Acceptance criteria:**

- [ ] Aggregates ingredients across all meals for the week (same ingredient from multiple recipes = summed)
- [ ] Meals with `status: "skipped"` are excluded from the calculation
- [ ] Subtracts current inventory quantities
- [ ] Only items with a positive deficit appear
- [ ] Does not duplicate items already on the shopping list (merges quantities instead)
- [ ] `source` is set to `"meal-plan"` and `sourceRecipeId` is set where applicable
- [ ] Handles unit mismatches gracefully (flag for user review)

**Phase:** 5

---

## 7. AI Features

### UC-A1: AI recipe recommendation by prompt

**As a** user, **I want to** describe what I'm craving and get recipe suggestions, **so that** I can discover new meals without browsing.

**Examples:**

- "something quick with chicken"
- "healthy vegetarian dinner under 30 minutes"
- "用鸡肉做一道简单的菜" (Chinese prompt)

**User flow:**

1. On the Recipes page, enter a free-text prompt in the AI panel
2. Click "Suggest"
3. AI returns one or more recipe suggestions
4. User can preview each suggestion and click "Save to Library" to keep it

**Acceptance criteria:**

- [ ] Accepts prompts in English or Chinese
- [ ] Returns structured recipe data (title, ingredients, instructions, times, servings)
- [ ] Each saved recipe has `source: "ai-generated"`
- [ ] Shows a loading state while the AI is working
- [ ] Handles API errors gracefully (rate limit, network failure)
- [ ] Requires `OPENAI_API_KEY` in `.env.local`

**Phase:** 7

---

### UC-A2: AI recipe recommendation by inventory

**As a** user, **I want to** get recipe ideas based on what's already in my pantry, **so that** I can cook without going shopping.

**User flow:**

1. On the Recipes page, click "Suggest from Pantry" (or similar)
2. App sends current inventory items to the AI
3. AI returns recipes that primarily use available ingredients
4. Each suggestion shows which inventory items it uses and what (if anything) is missing
5. User can save to library

**Acceptance criteria:**

- [ ] AI receives the current inventory list as context
- [ ] Suggestions prioritize recipes that need few or no extra ingredients
- [ ] Missing ingredients are clearly highlighted
- [ ] Works with ingredient names in any language

**Phase:** 7

---

### UC-A3: AI auto-fill weekly meal plan by prompt

**As a** user, **I want to** describe my preferences and have the AI fill my entire week, **so that** I don't have to plan each meal individually.

**Examples:**

- "healthy low-carb week with variety"
- "family-friendly meals, no seafood"
- "这周帮我安排一周的素食餐" (Chinese: plan a vegetarian week)

**User flow:**

1. On the Meal Plan page, click "Auto-fill Week"
2. Enter a prompt describing preferences
3. AI fills the week's calendar (breakfast/lunch/dinner/snack)
4. A preview shows the proposed plan
5. User can swap, remove, or edit individual meals
6. Click "Confirm" to save the plan

**Acceptance criteria:**

- [ ] AI fills all 28 slots (7 days × 4 meal types) or a user-specified subset
- [ ] No duplicate recipes within the same week (strict — every meal must be a different recipe)
- [ ] Avoids repeating recipes used in the past 15 days (soft constraint — prefer variety, but allowed if the library is small)
- [ ] These dedup rules apply only to AI-generated plans, not manually added meals
- [ ] Uses existing recipes from the library when suitable; generates new ones when needed
- [ ] New recipes are saved to the library upon confirmation
- [ ] User can edit the plan before confirming
- [ ] Accepts prompts in English or Chinese

**Phase:** 8

---

### UC-A4: AI auto-fill weekly meal plan (random / surprise me)

**As a** user, **I want to** click one button and get a random meal plan for the week, **so that** I can get unstuck when I don't know what to cook.

**User flow:**

1. On the Meal Plan page, click "Surprise Me"
2. AI generates a balanced, varied week
3. Preview → edit → confirm (same as UC-A3)

**Acceptance criteria:**

- [ ] No prompt required — one-click action
- [ ] No duplicate recipes within the same week; avoids recipes used in the past 15 days (same rules as UC-A3)
- [ ] AI considers: nutritional variety, mix of cuisines
- [ ] Considers current inventory to prefer recipes that use available ingredients
- [ ] Same preview/edit/confirm flow as UC-A3

**Phase:** 8

---

## 8. Multilingual Support

### UC-L1: Use ingredient names in any language

**As a** user, **I want to** enter ingredient names in English, Chinese, or a mix, **so that** I can use the app in my preferred language.

**Examples:**

- Inventory: "鸡胸肉" (chicken breast), "2 lb"
- Recipe: "chicken breast, 300g" in one recipe, "鸡胸肉, 300g" in another
- Shopping list: "牛奶 1L"

**Acceptance criteria:**

- [ ] All text fields accept Unicode input (English, Chinese, mixed)
- [ ] Search works across languages (case-insensitive, substring match)
- [ ] Display is correct regardless of language

**Phase:** Already supported (no changes needed)

---

### UC-L2: Cross-language ingredient matching

**As a** user, **I want** the app to recognize that "鸡胸肉" and "chicken breast" are the same ingredient, **so that** inventory deduction and shopping list generation work correctly even when I mix languages.

**User flow:**

1. Inventory has "鸡胸肉, 500g"
2. User cooks a recipe with "chicken breast, 300g"
3. Marks meal as cooked
4. App recognizes these are the same ingredient and deducts 300g

**Acceptance criteria:**

- [ ] Ingredients have an optional `normalizedName` for cross-language matching
- [ ] Normalization can be done via a local dictionary or AI-assisted on save
- [ ] Matching falls back to exact `name` comparison when `normalizedName` is unavailable
- [ ] Works for common ingredients in English and Chinese

**Phase:** 4 (when ingredient matching is built)

---

### UC-L3: App UI localization (future)

**As a** user, **I want to** switch the entire app interface between English and Chinese, **so that** all buttons, labels, and messages are in my preferred language.

**Acceptance criteria:**

- [ ] All UI chrome (buttons, headings, placeholders, error messages) is translatable
- [ ] Language can be switched without losing data
- [ ] Uses `next-intl` or similar i18n framework
- [ ] Locale files: `en.json` and `zh.json`

**Phase:** Future (independent of data flow work)

---

## 9. Notifications & Reminders

A lightweight in-app notification system that surfaces timely prompts without requiring a backend push service.

### UC-N1: Rating reminder after cooking

**As a** user, **I want to** be reminded to rate a recipe if I skipped the prompt after cooking, **so that** I don't forget to log my feedback.

**User flow:**

1. User cooks a meal (via Cook Mode or Mark as Cooked)
2. Rating prompt appears — user dismisses it
3. A reminder is created and stored in a notifications list
4. Next time the user opens the app (or navigates to Dashboard), a badge appears on the notification bell
5. Clicking the notification opens the rating prompt for that recipe

**Acceptance criteria:**

- [ ] Reminder is created only when the rating prompt is dismissed
- [ ] Notification shows the recipe name, date cooked, and "Rate now" action
- [ ] Clicking the notification opens the rating flow (UC-R6)
- [ ] Notification is cleared after the user rates or explicitly dismisses it
- [ ] Badge count shows the number of pending notifications

**Phase:** 10

---

### UC-N2: Expiring inventory alerts

**As a** user, **I want to** be notified when pantry items are about to expire, **so that** I can use them before they go bad.

**User flow:**

1. App checks inventory items on each visit
2. Items expiring within 3 days generate a notification
3. Notification shows on the Dashboard or via a notification bell
4. Clicking the notification navigates to the Inventory page (filtered to expiring items)

**Acceptance criteria:**

- [ ] Notifications are generated for items expiring within 3 days (near-expiry) and already expired
- [ ] Each item generates at most one notification (not repeated on every page load)
- [ ] Notification includes item name, quantity, and expiry date
- [ ] Clicking navigates to Inventory with the relevant filter applied

**Phase:** 10

---

### UC-N3: Meal plan reminders (future)

**As a** user, **I want to** get a reminder about upcoming meals, **so that** I can prepare ingredients in advance.

**Examples:**

- "You have Chicken Stir-Fry planned for dinner tonight — do you have all the ingredients?"
- "Tomorrow's breakfast: Garlic Butter Pasta. Missing: parmesan (50g)"

**Acceptance criteria:**

- [ ] Configurable reminder timing (e.g., morning of, day before)
- [ ] Shows missing ingredients by comparing planned meal against inventory
- [ ] Quick action to add missing items to the shopping list
- [ ] Uses browser Notification API (with user permission) for push-style alerts when the app is open

**Phase:** Future

---

### Notification system design

```typescript
export interface AppNotification {
  id: string;
  type: "rating-reminder" | "expiry-alert" | "meal-reminder";
  title: string;
  message: string;
  createdAt: string;           // ISO date
  read: boolean;
  dismissed: boolean;
  // Context for actions
  recipeId?: string;           // for rating reminders
  inventoryItemId?: string;    // for expiry alerts
  mealId?: string;               // for meal reminders
}
```

**localStorage key:** `notifications`

**UI:** A bell icon in the Navigation bar with a badge count. Clicking opens a dropdown/panel listing pending notifications.
