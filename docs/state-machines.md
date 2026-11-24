# State Transition Diagrams

Lifecycle state machines for the main entities in the app.

---

## Planned Meal Lifecycle

```
                ┌──────────┐
                │ planned  │
                └────┬─────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
   "Start Cooking"  │    "Skip Meal"
          │          │          │
          ▼          │          ▼
    ┌──────────┐     │    ┌──────────┐
    │ cooking  │     │    │ skipped  │
    └────┬─────┘     │    └──────────┘
         │           │
  "Finish Cooking"   │ "Mark as Cooked"
         │           │   (quick action)
         ▼           ▼
       ┌──────────────┐
       │    cooked     │
       └──────┬───────┘
              │
       Rate recipe?
       ├─ UC-R6: Rate immediately
       └─ Dismiss → UC-N1: Reminder notification created
```

| Transition | Trigger | Side Effects |
|---|---|---|
| `planned` → `cooking` | User clicks "Start Cooking" (UC-M8 option A) | `cookingStartedAt` set; enters Cook Mode (UC-C1) |
| `cooking` → `cooked` | Cook Mode "Finish Cooking" (UC-C5) | `cookedAt` set; inventory deducted; rating prompt shown |
| `planned` → `cooked` | User clicks "Mark as Cooked" (UC-M8 option B) | `cookedAt` set; inventory deducted; rating prompt shown |
| `planned` → `skipped` | User clicks "Skip" (UC-M7) | No inventory impact; meal is dimmed in calendar |
| `skipped` → `planned` | User clicks "Restore" | Meal returns to planned state |
| `planned` → *(deleted)* | User clicks "Remove" (UC-M5) | Meal is removed from storage entirely |
| `cooked` → *(deleted)* | User clicks "Remove" (UC-M5) | Confirmation required; meal is removed from storage |
| `skipped` → *(deleted)* | User clicks "Remove" (UC-M5) | Meal is removed from storage entirely |
| `cooked` → (rated) | User submits rating (UC-R6) | `rated` field set to `true`; rating appended to `recipe.ratings[]` |

**Notes:**
- `cooking` → `planned` is allowed (user cancels Cook Mode without finishing — progress is discarded)
- `cooked` is a terminal state (cannot be un-cooked, but inventory deduction can be undone)
- `skipped` can be restored back to `planned`
- Meals in any status can be deleted; deleting a cooked meal requires confirmation
- `rated` is a **field on Meal**, not a separate state — the meal remains in `"cooked"` status

**Note on Slot Removal (UC-M4b):**
When a user removes a meal slot (e.g., removes "Snack" from the calendar), existing meals in that slot are NOT deleted. They remain in storage and appear in Meal History (UC-M9) with their original slot name. The calendar grid simply stops showing that row.

---

## Shopping List Item Lifecycle

```
  ┌──────────┐
  │ to-buy   │  (checked: false)
  └────┬─────┘
       │
  "Check off"
       │
       ▼
  ┌──────────┐
  │ picked-up│  (checked: true)
  └────┬─────┘
       │
  ┌────┴──────────┐
  │               │
"Move to       "Remove"
 Pantry"          │
  │               ▼
  │        (removed from list)
  ▼
  ┌──────────┐
  │ moved    │  (movedToInventory: true)
  └──────────┘
       │
  (removed from list)
  creates InventoryItem
```

---

## Notification Lifecycle

```
  ┌───────────┐
  │  created  │  (read: false, dismissed: false)
  └─────┬─────┘
        │
   User sees it
        │
        ▼
  ┌───────────┐
  │   read    │  (read: true)
  └─────┬─────┘
        │
   ┌────┴────┐
   │         │
"Act on it" "Dismiss"
   │         │
   ▼         ▼
(action)  ┌───────────┐
executed  │ dismissed  │  (dismissed: true)
          └───────────┘
```
