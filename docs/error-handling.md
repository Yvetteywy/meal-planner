# Error Handling Strategy

Defines how errors are surfaced, categorized, and handled across the app. Ensures a consistent user experience and makes debugging easier.

---

## Table of Contents

1. [Error Categories](#1-error-categories)
2. [UI Patterns](#2-ui-patterns)
3. [Error Handling by Layer](#3-error-handling-by-layer)
4. [Error Handling by Feature](#4-error-handling-by-feature)
5. [Logging & Debugging](#5-logging--debugging)

---

## 1. Error Categories

| Category | Severity | Example | User impact |
|---|---|---|---|
| **Validation** | Low | Empty recipe title, quantity = 0 | Blocked from saving; inline message |
| **Data** | Medium | localStorage corrupted, migration failed, recipe not found | Graceful fallback; toast notification |
| **Network** | Medium | AI API timeout, URL import failed, rate limited | Retry prompt; toast with explanation |
| **System** | High | localStorage full, browser API unavailable | Prominent error banner; suggest action |

---

## 2. UI Patterns

### When to use each pattern

| Pattern | When to use | Duration | Example |
|---|---|---|---|
| **Inline validation** | Form field errors | Persistent until fixed | "Recipe title is required" below the input |
| **Toast notification** | Action succeeded or recoverable failure | 5 seconds (auto-dismiss) | "Recipe saved!" or "Failed to import — try again" |
| **Toast with action** | Error with an undo or retry option | 8 seconds | "Ingredients deducted. [Undo] [Edit]" |
| **Empty state message** | No data to show | Persistent | "Your pantry is empty. Add your first item above!" |
| **Error page / fallback** | Page-level failure (data missing, crash) | Persistent | "Recipe not found. [← Back to recipes]" |
| **Confirmation dialog** | Destructive or irreversible action | Until user responds | "Delete this recipe? This cannot be undone." |
| **Banner / alert** | System-level warning | Persistent until resolved | "Storage is almost full (4.5 MB / 5 MB). Export your data to free space." |

### Toast design

```
┌──────────────────────────────────────────────┐
│ ✅ Recipe saved successfully                  │  ← success (green accent)
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ⚠️ Could not import recipe. Check the URL.   │  ← warning (amber accent)
│                                  [Retry]     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ ❌ Storage is full. Export data to continue.  │  ← error (red accent)
│                                  [Export]     │
└──────────────────────────────────────────────┘
```

---

## 3. Error Handling by Layer

### Data service layer (`src/lib/data-service.ts`)

| Operation | Error | Handling |
|---|---|---|
| `localStorage.getItem` returns `null` | Key doesn't exist | Return default value (empty array) |
| `JSON.parse` throws | Corrupted data | Log warning, return default value, don't crash |
| `localStorage.setItem` throws | Quota exceeded | Catch error, show "Storage full" banner with export action |
| Recipe/meal/item not found by ID | Deleted or orphaned reference | Return `undefined`, let UI show fallback |

```typescript
// Pattern: safe read with fallback
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    console.warn(`Failed to read "${key}" from localStorage, using fallback`);
    return fallback;
  }
}

// Pattern: safe write with quota check
function safeWrite(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      showBanner('Storage is full. Export your data to free space.', { action: 'Export' });
    }
    return false;
  }
}
```

### Utility functions (`src/lib/*.ts`)

| Function | Error | Handling |
|---|---|---|
| `deductIngredients` — ingredient not in inventory | Missing item | Skip it, include in deduction log as "skipped" |
| `deductIngredients` — insufficient quantity | Not enough stock | Deduct to 0 (not negative), flag in deduction log |
| `generateShoppingList` — unit mismatch | Recipe uses "g", inventory has "kg" | Flag for user review in the preview modal |
| `parseTimerFromStep` — no duration found | Step has no time reference | Return `null`, no timer shown |
| `matchIngredientsToStep` — no matches | Step doesn't mention any ingredient | Return empty array, no ingredients panel shown |
| `getRecipeForMeal` — recipe deleted | Orphaned `recipeId` | Return `undefined`, UI shows `customTitle` fallback |

### API routes (`src/app/api/...`) — Phases 6+

| Error | HTTP Status | Response | Client handling |
|---|---|---|---|
| Invalid request body | 400 | `{ error: { code: "VALIDATION_ERROR", message: "..." } }` | Show inline validation errors |
| API key missing | 401 | `{ error: { code: "API_KEY_MISSING", message: "..." } }` | Toast: "Configure API key in settings" |
| URL not reachable | 404 | `{ error: { code: "URL_NOT_REACHABLE", message: "..." } }` | Toast: "Could not reach URL" |
| Rate limited | 429 | `{ error: { code: "RATE_LIMITED", message: "..." } }` | Toast: "Please wait" + disable button temporarily |
| AI provider error | 502 | `{ error: { code: "AI_PROVIDER_ERROR", message: "..." } }` | Toast: "AI service unavailable — try again" |
| Unexpected error | 500 | `{ error: { code: "INTERNAL_ERROR", message: "..." } }` | Toast: generic error message |

---

## 4. Error Handling by Feature

### Recipe management

| Scenario | Error | UX |
|---|---|---|
| Save recipe with empty title | Validation | Inline: "Title is required" — prevent save |
| Save recipe with no ingredients | Validation | Inline: "Add at least one ingredient" |
| Delete recipe referenced by meals | Data | Confirmation dialog; on confirm, convert meals to `customTitle` |
| Import recipe — URL invalid | Network | Inline: "Please enter a valid URL" |
| Import recipe — parse failed | Network | Toast: "Could not extract recipe from this page. Try a different URL." |
| View recipe that was deleted | Data | Error page: "Recipe not found. [← Back to recipes]" |

### Meal planning

| Scenario | Error | UX |
|---|---|---|
| Add meal to slot that already has one | Validation | Confirmation: "Wednesday Dinner already has Pasta. Replace?" |
| Recipe deleted after meal was planned | Data | Show meal title as text (from `customTitle` fallback), greyed "Start Cooking" button |
| Mark as cooked — no ingredients in inventory | Data | Proceed anyway, toast shows "Skipped: butter (not in inventory)" |
| Mark as cooked — undo after navigation | Data | Undo only available within 10 seconds; after that, changes are permanent |

### Inventory & Shopping List

| Scenario | Error | UX |
|---|---|---|
| Add item with empty name | Validation | Inline: "Name is required" — prevent save |
| Add item with quantity 0 or negative | Validation | Inline: "Quantity must be at least 1" |
| Move to pantry — item already exists | Data | Merge quantities automatically; toast: "Added 12 eggs to existing 6 (now 18)" |
| Upload image — file too large | Validation | Toast: "Image too large. Maximum 50 KB after compression." |
| Upload image — unsupported format | Validation | Toast: "Please upload a JPEG, PNG, or WebP image." |

### Cook Mode

| Scenario | Error | UX |
|---|---|---|
| Start cooking recipe with no instructions | Validation | Button greyed out with tooltip: "No instructions — add steps first" |
| Timer audio fails (no AudioContext) | System | Silently ignore — show visual "Time's up!" only |
| Browser tab goes to background | System | Timers continue (they're `setInterval`-based); visual update when tab refocuses |
| Exit Cook Mode accidentally | UX | No confirmation for Back/Exit — progress is session-only, low cost to restart |

### Data export/import

| Scenario | Error | UX |
|---|---|---|
| Import file — invalid JSON | Validation | Toast: "Invalid file format. Please select a valid backup file." |
| Import file — wrong schema / version | Validation | Toast: "This backup is from a newer version. Update the app first." |
| Import file — merge conflict (same ID, different data) | Data | Keep newer version (compare timestamps); show summary: "Updated 5 recipes, added 3 meals" |
| Export — localStorage read fails | System | Toast: "Could not read data. Some items may be missing from the export." |

### Storage

| Scenario | Error | UX |
|---|---|---|
| localStorage quota exceeded on save | System | Banner: "Storage is almost full. Export your data and clear old meals." with [Export] and [Clear old meals] actions |
| iOS WebView data eviction | System | On next app load, detect empty storage, show: "Your data was cleared by the system. Import from a backup to restore." |

---

## 5. Logging & Debugging

### Console logging (development)

| Event | Log level | What to log |
|---|---|---|
| Data migration runs | `console.info` | "Migrated 50 recipes, 200 meals from v1 → v2" |
| localStorage read/write failure | `console.warn` | Key name, error message |
| API request failure | `console.error` | Endpoint, status code, error body |
| Timer audio failure | `console.warn` | "AudioContext not available" |
| Successful data import | `console.info` | "Imported: 5 recipes updated, 3 meals added, 0 conflicts" |

### No external error tracking (for now)

Since this is a client-only app with no backend, there's no error reporting service. When Supabase is added, consider adding:
- **Sentry** (free tier: 5K events/month) for frontend error tracking
- **Supabase logs** for API route errors
