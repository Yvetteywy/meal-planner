# API Contract

All API routes live under `src/app/api/` using Next.js App Router Route Handlers. Routes are server-side only — API keys and secrets never reach the client.

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Recipe Import (Phase 6)](#2-recipe-import-phase-6)
3. [AI Recipe Recommendation (Phase 7)](#3-ai-recipe-recommendation-phase-7)
4. [AI Meal Plan Auto-Fill (Phase 8)](#4-ai-meal-plan-auto-fill-phase-8)
5. [Data Sync (Future)](#5-data-sync-future)
6. [Error Handling](#6-error-handling)

---

## 1. Conventions

### Base path

All API routes are relative to the app origin: `http://localhost:3000/api/...`

### Request/response format

- Content-Type: `application/json`
- All dates are ISO 8601 strings
- All IDs are UUIDs (string)

### Authentication

- **Phases 6–10:** No auth required (single-user, local app)
- **Future (sync/sharing):** Bearer token via Supabase Auth in the `Authorization` header

### Rate limiting

- **AI endpoints:** Client-side debounce (500ms minimum between requests)
- **Future:** Server-side rate limiting when multi-user is added

### Common response shape

```typescript
// Success
{
  "data": T,            // the response payload
  "error": null
}

// Error
{
  "data": null,
  "error": {
    "code": string,     // machine-readable error code
    "message": string   // human-readable message
  }
}
```

---

## 2. Recipe Import (Phase 6)

### `POST /api/recipes/import`

Parse a recipe from a URL. Returns structured recipe data for user review before saving.

**Use case:** UC-R9

**Request:**

```typescript
{
  "url": string  // e.g. "https://www.allrecipes.com/recipe/12345/"
}
```

**Response (200):**

```typescript
{
  "data": {
    "title": string,
    "description": string,
    "ingredients": Array<{
      "name": string,
      "quantity": number,
      "unit": string
    }>,
    "instructions": string[],
    "prepTimeMinutes": number | null,
    "cookTimeMinutes": number | null,
    "servings": number | null,
    "tags": string[],
    "imageUrl": string | null,
    "sourceUrl": string,          // the original URL
    "parseMethod": "json-ld" | "ai-extraction" | "microdata"
  },
  "error": null
}
```

**Error responses:**

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_URL` | URL is malformed or empty |
| 404 | `URL_NOT_REACHABLE` | URL returned 404 or connection failed |
| 422 | `PARSE_FAILED` | Page loaded but no recipe data could be extracted |
| 429 | `RATE_LIMITED` | Too many requests (AI extraction fallback) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Implementation notes:**

1. Fetch the URL server-side (avoid CORS issues)
2. Try JSON-LD / schema.org structured data first (fastest, most accurate)
3. Fall back to AI extraction if no structured data found (send page HTML to LLM)
4. Compress/resize `imageUrl` if it's very large
5. Return `parseMethod` so the UI can show "Parsed from structured data" vs "Extracted by AI (review carefully)"

---

## 3. AI Recipe Recommendation (Phase 7)

### `POST /api/ai/suggest-recipes`

Generate recipe suggestions based on a text prompt and/or current inventory.

**Use cases:** UC-A1 (by prompt), UC-A2 (by inventory)

**Request:**

```typescript
{
  "prompt": string | null,        // e.g. "quick chicken dinner" or null for inventory-only
  "inventory": Array<{            // current pantry items (optional, for inventory-based suggestions)
    "name": string,
    "quantity": number,
    "unit": string
  }> | null,
  "count": number,                // number of recipes to suggest (default: 3, max: 5)
  "preferences": {                // optional filters
    "maxPrepMinutes": number | null,
    "maxCookMinutes": number | null,
    "difficulty": "easy" | "medium" | "hard" | null,
    "cuisine": string | null,
    "dietaryRestrictions": string[] | null  // e.g. ["vegetarian", "gluten-free"]
  } | null
}
```

**Response (200):**

```typescript
{
  "data": {
    "recipes": Array<{
      "title": string,
      "description": string,
      "ingredients": Array<{
        "name": string,
        "quantity": number,
        "unit": string,
        "inInventory": boolean     // true if this ingredient is available in the user's pantry
      }>,
      "instructions": string[],
      "prepTimeMinutes": number,
      "cookTimeMinutes": number,
      "servings": number,
      "tags": string[],
      "missingIngredients": string[]  // ingredients not in inventory
    }>,
    "model": string,              // which AI model was used (e.g. "gpt-4o-mini")
    "tokensUsed": number          // for cost tracking
  },
  "error": null
}
```

**Error responses:**

| Status | Code | When |
|---|---|---|
| 400 | `EMPTY_REQUEST` | Neither prompt nor inventory provided |
| 401 | `API_KEY_MISSING` | `OPENAI_API_KEY` (or equivalent) not configured in `.env.local` |
| 429 | `RATE_LIMITED` | AI provider rate limit hit |
| 502 | `AI_PROVIDER_ERROR` | AI provider returned an error or malformed response |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Implementation notes:**

1. Use Vercel AI SDK `generateObject` with Zod schema for type-safe output
2. Include inventory context in the system prompt when provided
3. Mark each ingredient as `inInventory: true/false` by matching against the inventory list
4. Stream the response if possible for faster UX (use `streamObject` for progressive rendering)
5. Log `tokensUsed` for cost monitoring

---

## 4. AI Meal Plan Auto-Fill (Phase 8)

### `POST /api/ai/generate-meal-plan`

Generate a full weekly meal plan.

**Use cases:** UC-A3 (by prompt), UC-A4 (surprise me)

**Request:**

```typescript
{
  "prompt": string | null,        // e.g. "healthy low-carb week" or null for surprise-me
  "weekStartDate": string,        // ISO date (Monday), e.g. "2026-04-06"
  "slots": string[],              // which slots to fill (user-defined slot names, e.g., ["Breakfast", "Lunch", "Dinner"])
  "existingRecipeIds": string[],  // IDs of recipes already in the library (AI should prefer these)
  "recentRecipeIds": string[],    // IDs of recipes used in the past 15 days (AI should avoid these)
  "inventory": Array<{
    "name": string,
    "quantity": number,
    "unit": string
  }> | null,
  "preferences": {
    "dietaryRestrictions": string[] | null,
    "cuisinePreferences": string[] | null,
    "maxPrepMinutes": number | null
  } | null
}
```

**Response (200):**

```typescript
{
  "data": {
    "meals": Array<{
      "date": string,             // ISO date (YYYY-MM-DD)
      "slot": string,               // user-defined slot name (e.g., "Breakfast", "Kids Snack")
      "servings": number,           // how many servings for this meal
      "recipe": {                 // full recipe object (may be new or matched to existingRecipeIds)
        "existingRecipeId": string | null,  // if this matches a library recipe, its ID
        "title": string,
        "description": string,
        "ingredients": Array<{
          "name": string,
          "quantity": number,
          "unit": string
        }>,
        "instructions": string[],
        "prepTimeMinutes": number,
        "cookTimeMinutes": number,
        "servings": number,
        "tags": string[],
        "cuisine": {
          "category": string,
          "subcategory": string | null
        } | null,
        "difficulty": "easy" | "medium" | "hard" | null
      }
    }>,
    "model": string,
    "tokensUsed": number
  },
  "error": null
}
```

**Constraints enforced by the AI prompt:**

- No duplicate recipes within the same week (strict)
- Avoid `recentRecipeIds` (soft — prefer variety, but allowed if library is small)
- Nutritional variety across the week
- Mix of cuisines if no preference specified

**Error responses:**

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_DATE` | `weekStartDate` is not a valid Monday |
| 401 | `API_KEY_MISSING` | AI API key not configured |
| 429 | `RATE_LIMITED` | AI provider rate limit |
| 502 | `AI_PROVIDER_ERROR` | AI returned invalid or incomplete plan |
| 500 | `INTERNAL_ERROR` | Unexpected error |

---

## 5. Data Sync (Future)

These endpoints are **not needed until cross-device sync is implemented**. Documented here for forward planning.

### `GET /api/sync/pull`

Pull all data that changed since a given timestamp.

```typescript
// Request query params
?since=2026-04-01T00:00:00Z&collections=recipes,meals,inventory,shopping-list

// Response
{
  "data": {
    "recipes": { "upserted": Recipe[], "deleted": string[] },
    "meals": { "upserted": Meal[], "deleted": string[] },
    "inventory": { "upserted": InventoryItem[], "deleted": string[] },
    "shoppingList": { "upserted": ShoppingListItem[], "deleted": string[] },
    "serverTimestamp": string  // use as `since` for next pull
  }
}
```

### `POST /api/sync/push`

Push local changes to the server.

```typescript
// Request
{
  "changes": {
    "recipes": { "upserted": Recipe[], "deleted": string[] },
    "meals": { "upserted": Meal[], "deleted": string[] },
    "inventory": { "upserted": InventoryItem[], "deleted": string[] },
    "shoppingList": { "upserted": ShoppingListItem[], "deleted": string[] }
  },
  "clientTimestamp": string
}

// Response
{
  "data": {
    "conflicts": Array<{         // items that changed on both client and server
      "collection": string,
      "id": string,
      "serverVersion": object,
      "clientVersion": object
    }>,
    "serverTimestamp": string
  }
}
```

### `POST /api/auth/login`

Authenticate via Supabase Auth. Returns JWT token.

### `POST /api/auth/register`

Create new account.

### `POST /api/sharing/invite`

Generate a shareable link for a shopping list or meal plan.

---

## 6. Error Handling

### Error codes (all endpoints)

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_URL` | 400 | Malformed URL |
| `EMPTY_REQUEST` | 400 | Required fields missing |
| `INVALID_DATE` | 400 | Date format or value is wrong |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `API_KEY_MISSING` | 401 | Required API key not set in `.env.local` |
| `UNAUTHORIZED` | 401 | Invalid or expired auth token (future) |
| `FORBIDDEN` | 403 | User lacks permission (future, for sharing) |
| `URL_NOT_REACHABLE` | 404 | Remote URL returned 404 or connection failed |
| `PARSE_FAILED` | 422 | Could not extract structured data |
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_PROVIDER_ERROR` | 502 | AI provider returned error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Client-side error handling pattern

```typescript
const response = await fetch('/api/ai/suggest-recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request),
});

const result = await response.json();

if (result.error) {
  // Show user-friendly message based on error code
  switch (result.error.code) {
    case 'API_KEY_MISSING':
      showToast('Please configure your API key in settings');
      break;
    case 'RATE_LIMITED':
      showToast('Too many requests — please wait a moment');
      break;
    default:
      showToast(result.error.message);
  }
  return;
}

// Use result.data
```

---

## File Structure

```
src/app/api/
├── recipes/
│   └── import/
│       └── route.ts              ← POST /api/recipes/import (Phase 6)
├── ai/
│   ├── suggest-recipes/
│   │   └── route.ts              ← POST /api/ai/suggest-recipes (Phase 7)
│   └── generate-meal-plan/
│       └── route.ts              ← POST /api/ai/generate-meal-plan (Phase 8)
└── sync/                         ← Future (cross-device sync)
    ├── pull/
    │   └── route.ts
    └── push/
        └── route.ts
```
