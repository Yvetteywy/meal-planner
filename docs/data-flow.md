# Data Flow

## Problem

The four features (Meal Plan, Recipes, Inventory, Shopping List) are currently isolated silos. Each stores its own data independently with no cross-feature flows. We need to connect them so that actions in one area ripple through the others naturally.

---

## Data Flow Diagram

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       RECIPE SOURCES                                │
  │                                                                     │
  │  ┌──────────┐   ┌──────────────┐   ┌────────────────────────────┐  │
  │  │  Manual   │   │   Import     │   │     AI Recommendation      │  │
  │  │  input    │   │  from URL    │   │  (user prompt / inventory) │  │
  │  └────┬─────┘   └──────┬───────┘   └─────────────┬──────────────┘  │
  │       └────────────────┼──────────────────────────┘                 │
  └────────────────────────┼────────────────────────────────────────────┘
                           ▼
                    ┌─────────────┐
                    │   Recipes    │
                    │  (library)   │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────────┐
          │ pick recipe    │                    │
          ▼                ▼                    │
   ┌─────────────────────────────┐              │
   │        Meal Plan            │              │
   │       (calendar)            │              │
   │                             │              │
   │ Sources:                    │  save meal   │
   │  • pick from recipes        │  as recipe   │
   │  • AI auto-fill week       ├──────────────┘
   │    (prompt / random)        │
   │  • manual meal input ───────┤
   │    (optionally save         │
   │     as recipe)              │
   └──────┬──────────────────────┘
          │
     ┌────┴─────────────────┐
     │ "Mark cooked"        │ "Generate shopping list"
     │ (auto-deduct)        │ (diff vs inventory)
     ▼                      ▼
┌─────────────┐      ┌─────────────┐
│  Inventory   │◄─────│Shopping List │
│  (pantry)    │"Mark │  (to-buy)   │
└─────────────┘bought"└─────────────┘
```

---

## Recipe Flows

### How recipes enter the library

| Source | Description |
|---|---|
| **Manual input** | User types in title, description, ingredients, instructions, tags |
| **Import from URL** | User pastes a recipe website URL; app scrapes/parses the recipe data |
| **AI recommendation (by prompt)** | User describes what they want ("quick chicken dinner"); AI searches the internet and returns recipe(s) |
| **AI recommendation (by inventory)** | AI looks at what's currently in the pantry and suggests recipes that use those ingredients |

All sources produce the same `Recipe` type and are saved to the recipe library.

### Recipe → other features

- Recipes can be picked when adding a meal to the weekly plan
- Recipe ingredients are used to calculate inventory deductions and shopping list generation

---

## Meal Plan Flows

### How meals enter the calendar

| Source | Description |
|---|---|
| **Pick from recipes** | User searches/browses the recipe library and drops a recipe into a calendar cell |
| **Manual meal input** | User types a meal directly (title + optional ingredients + notes). They can optionally **save it as a recipe** for reuse, or just leave it as a one-off meal |
| **AI auto-fill (by prompt)** | User describes preferences ("healthy vegetarian week"); AI fills the week with recipes (from library or newly generated) |
| **AI auto-fill (random)** | One-click "Surprise me" — AI picks a balanced week from the recipe library and/or generates new suggestions |

### Meal Plan → other features

- **Start Cooking** → enters Cook Mode (step-by-step guided cooking)
- **Mark cooked** (or Finish Cooking from Cook Mode) → auto-deducts ingredients from inventory (with undo/edit) → prompts for rating
- **Generate shopping list** → diffs planned ingredients against inventory, creates shopping items for the deficit
- **Skip meal** → marks meal as skipped, excluded from shopping list generation

---

## Inventory & Shopping List Flows

### Flow 1: Shopping List → Inventory (bought items)

When a shopping list item is marked as "bought" (checked), the user can send it to inventory. This creates a new InventoryItem with the same name/quantity/unit/category. The shopping list item is then cleared.

### Flow 2: Meal Plan → Inventory (cooked meals)

When a user marks a planned meal as "cooked" (either via quick action or by finishing Cook Mode), the recipe's ingredients are auto-deducted from inventory. A toast/banner shows what was deducted with an "Undo / Edit" option so the user can adjust quantities or skip items they didn't actually use.

### Flow 3: Meal Plan → Shopping List (generate list)

A "Generate Shopping List" action compares the week's planned meals' ingredients against current inventory and creates shopping list items for anything missing or insufficient. Skipped meals are excluded.

### Flow 4: Cooking → Rating → Notification

After a meal is cooked, the user is prompted to rate the recipe (1–5 stars + comment). If the rating is dismissed, a reminder notification is created. Expiry alerts are also generated when inventory items are nearing their expiry date.
