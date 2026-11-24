# Technology Research & Evaluation

Comparison of frameworks, libraries, and tools evaluated for the Meal Planner app. Organized by category. Use this as a reference when making technology decisions or considering alternatives.

---

## Table of Contents

1. [UI Component Libraries](#1-ui-component-libraries)
2. [State Management](#2-state-management)
3. [Data Storage](#3-data-storage)
4. [Backend & Database](#4-backend--database)
5. [AI / LLM Integration](#5-ai--llm-integration)
6. [Authentication](#6-authentication)
7. [Mobile / Native](#7-mobile--native)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Testing](#9-testing)

---

## 1. UI Component Libraries

### Current: Raw Tailwind CSS

We currently use Tailwind CSS utility classes directly with no component library.

### Candidates

| Library | Tailwind-native | Bundle size | Cost | Scalability | DX / Docs | Community | Lock-in |
|---|---|---|---|---|---|---|---|
| **shadcn/ui** | ✅ Yes | ~0 KB (copy-paste, no runtime) | Free | ✅ You own the code | ✅ Excellent docs, CLI installer | Large, active | ✅ None — it's your code |
| **HeroUI** | ✅ Yes | ~30 KB+ (Framer Motion dep) | Free | ✅ Good | ✅ Good docs | Medium | Low — can eject |
| **DaisyUI** | ✅ Yes (plugin) | ~3 KB CSS | Free | ✅ Good | ✅ Simple API | Large | Low — CSS only |
| **Mantine** | ❌ Own CSS | ~50 KB+ | Free | ✅ Excellent (100+ components) | ✅ Excellent docs | Large | Medium — own theming system |
| **Tailwind UI** | ✅ Yes | ~0 KB (templates) | $299 one-time | ✅ Good | ✅ Official | N/A (product) | ✅ None — it's your code |
| **MUI** | ❌ Own theming | ~80 KB+ | Free / Paid (pro) | ✅ Enterprise-grade | ✅ Excellent | Very large | Medium — coupled to MUI theming |

### Recommendation

**shadcn/ui** — Tailwind-native, zero runtime cost, accessible (Radix UI), and provides the exact components we need (calendar, dialog, command palette, tabs, toast). Evaluate when starting Phase 3.

### Decision status: **Not yet adopted** — current raw Tailwind works for MVP

---

## 2. State Management

### Current: `useLocalStorage` custom hook

Simple hook that persists React state to localStorage. Works for single-device, single-tab use.

### Candidates

| Library | Bundle | Cost | Performance | Scalability | DX / Learning curve | Community | Lock-in |
|---|---|---|---|---|---|---|---|
| **Zustand** | ~1.2 KB | Free | ✅ Fast, no re-render overhead | ✅ Good for medium apps | ✅ Minimal API, easy | Very large (most downloaded) | ✅ Low |
| **Jotai** | ~3.6 KB | Free | ✅ Atomic = surgical re-renders | ✅ Great for complex state | ✅ Simple but atomic mindset | Large | ✅ Low |
| **TanStack Query** | ~12 KB | Free | ✅ Smart caching, dedup | ✅ Built for server-scale | ✅ Good, more concepts | Very large | ✅ Low |
| **Redux Toolkit** | ~11 KB | Free | ✅ Good | ✅ Enterprise-proven | ⚠️ More boilerplate | Very large (legacy) | Low |

### Recommended migration path

```
Phase 1–5: Keep useLocalStorage (simple, works, no new dependency)
Phase 6+:  Add Zustand for shared cross-page state (e.g., notifications badge)
Backend:   Add React Query for server data; keep Zustand for UI state
```

### Why Zustand over Jotai

- Our state is store-shaped (recipes[], meals[], inventory[]), not granular atoms
- Zustand's `persist` middleware is a near drop-in replacement for `useLocalStorage`
- Smaller bundle, simpler mental model

### Decision status: **Deferred** — custom hook sufficient for now

---

## 3. Data Storage

### Current: localStorage

| Aspect | Detail |
|---|---|
| **Tech** | Browser `localStorage` via custom `useLocalStorage` hook |
| **Capacity** | ~5–10 MB per origin (browser-dependent) |
| **Persistence** | Survives page reloads; lost if user clears browser data |
| **Sync** | ❌ Single device, single browser only |
| **Indexing** | ❌ No querying — full scan on every read |
| **iOS (WebView)** | ⚠️ Can be evicted by OS when device is low on storage |

### Storage options comparison

| Storage | Capacity | Eviction risk (iOS) | Sync | Indexing/Query | Cross-platform | Best for |
|---|---|---|---|---|---|---|
| **localStorage** | ~5–10 MB | ⚠️ Yes (WebView) | ❌ | ❌ Key-value only | ✅ Web | Small data, MVP |
| **IndexedDB** | ~50–100 MB | ⚠️ Yes (iOS WebView) | ❌ | ✅ Indexes on object stores | ✅ Web | Larger data, images, offline cache |
| **SQLite (Capacitor)** | Device storage limit | ✅ Safe | ❌ (custom only) | ✅ Full SQL | ✅ iOS/Android/Web | Reliable mobile storage, complex queries |
| **Core Data + CloudKit** | Device storage limit | ✅ Safe | ✅ iCloud (Apple only) | ✅ ORM + predicates | ❌ Apple only | Native iOS with iCloud sync |
| **iCloud Key-Value** | 1 MB total (1024 keys) | ✅ Safe | ✅ iCloud (Apple only) | ❌ Key-value only | ❌ Apple only | Tiny settings/preferences |
| **Supabase (PostgreSQL)** | Server-side (unlimited) | ✅ N/A | ✅ Real-time WebSocket | ✅ Full SQL + indexes | ✅ Everywhere | Multi-device, sharing, production |

### ⚠️ Key risks with current approach

1. **localStorage on iOS WebView is unreliable** — the OS can evict WebView storage when the device is low on space, silently deleting all user data
2. **5 MB limit** — once we add images (shopping list photos, inventory icons), we'll hit the quota fast
3. **No indexing** — every query is a full array scan (fine for small datasets, won't scale)
4. **No sync** — data is trapped on one device/browser

### Cross-device sync approaches compared

| Approach | Cost | Effort | Sync speed | Platforms | Conflict handling | Offline | Best for |
|---|---|---|---|---|---|---|---|
| **A: JSON export/import** | $0 | Very low (1–2 days) | Manual (user-initiated) | ✅ All (it's a file) | Merge by ID (last-write-wins) | ✅ Full offline | Personal use, backup, getting started |
| **B: Cloud file sync** (Dropbox/Google Drive/iCloud Drive) | $0 | Low (3–5 days) | Near-auto (file watcher) | ✅ All (via file APIs) | File-level (not item-level) | ✅ With local cache | 2–3 devices, same user |
| **C: Supabase backend** | $0–25/mo | High (2–4 weeks) | Real-time (WebSocket) | ✅ All | Row-level, server-authoritative | ⚠️ Needs offline queue | Family sharing, production |
| **D: iCloud CloudKit** | $0 (Apple dev acct) | High (native bridge) | Auto (iOS managed) | ❌ Apple only | Apple-managed | ✅ Built-in | Apple-only users |
| **E: Peer-to-peer (CRDTs)** | $0 | Very high | Real-time (P2P) | ✅ All | Auto (CRDT merge) | ✅ Full offline | Experimental, no server |

### How JSON export/import works (Approach A)

This is the **cheapest, fastest, and most practical** first step:

```
Device A (laptop):
  1. Settings → "Export Data" → downloads meal-planner-backup-2026-04-09.json

Device B (iPhone):
  1. Settings → "Import Data" → upload the JSON file
  2. Data is merged with any existing data on the device
```

**What's in the export file:**
```json
{
  "version": 2,
  "exportedAt": "2026-04-09T17:00:00Z",
  "data": {
    "recipes": [...],
    "mealPlan": [...],
    "inventory": [...],
    "shoppingList": [...],
    "mealSlots": [...],
    "notifications": [...]
  }
}
```

**Import merge strategy:**
- Match items by `id`
- If ID exists on both devices → keep the newer one (compare `updatedAt` or `createdAt`)
- If ID only exists in import → add it
- If ID only exists locally → keep it
- Never delete local data during import

**Pros:**
- Zero infrastructure cost
- Works offline and across any device/platform
- Acts as a backup (protects against iOS data eviction)
- Takes 1–2 days to implement

**Cons:**
- Manual — user must remember to export/import
- No real-time sync
- Merge conflicts possible if both devices diverge significantly

### Recommended migration path

```
Phase 1:    localStorage + data access abstraction layer
            └─ All data reads/writes go through src/lib/data-service.ts
               (makes future storage swaps a one-file change)

Phase 2:    Add JSON export/import (UC-F7)
            ├─ "Export Data" button in settings → downloads .json file
            ├─ "Import Data" button → upload, merge, confirm
            └─ Also serves as backup against iOS data eviction

Phase 6+:   IndexedDB (via Dexie.js) for images
            └─ Swap implementation inside data-service.ts

iOS app:    SQLite via @capacitor-community/sqlite
            └─ Swap implementation inside data-service.ts

Production: Supabase (PostgreSQL) for real-time sync + sharing
            └─ Swap implementation inside data-service.ts
            └─ Keep local storage as offline cache
```
```

### IndexedDB libraries (for Phase 6+)

| Library | Size | API style | Why consider |
|---|---|---|---|
| **Dexie.js** | ~16 KB | Promise-based, table-like | Easiest API, versioned schemas, good docs |
| **idb** | ~1.5 KB | Thin wrapper over native IndexedDB | Minimal, if you want low-level control |
| **RxDB** | ~45 KB | Reactive, real-time, sync-capable | Built-in replication to CouchDB/Supabase — overkill for now |

### SQLite on iOS (for native app)

Using `@capacitor-community/sqlite`:

```typescript
// Example: query recipes
const db = await sqlite.createConnection('meal-planner');
await db.open();

const result = await db.query(
  'SELECT * FROM recipes WHERE cuisine_category = ? ORDER BY created_at DESC',
  ['Italian']
);
```

- ✅ Full SQL with indexes, joins, aggregations
- ✅ No storage limit (device disk)
- ✅ No eviction — data is safe
- ✅ Same relational model as our TypeScript types
- ⚠️ Need to maintain a schema migration system (similar to localStorage migration in Phase 1)

### iCloud sync — not recommended as primary sync

iCloud is tempting for Apple-only sync but has major limitations:

- **Key-Value Store**: 1 MB total, 1024 keys max — too small for our data
- **CloudKit (via Core Data)**: Powerful but requires native Swift code, complex Capacitor bridging, Apple-only
- **Better alternative**: Use Supabase for cross-platform sync (works on web, iOS, Android) and keep iCloud for tiny preferences (like "preferred language" or "last viewed week")

### Decision status: **localStorage for now; migrate to IndexedDB when images are added; SQLite via Capacitor for iOS app; Supabase for production sync**

---

## 4. Backend & Database

### Current: localStorage (no backend)

### Candidates

| Platform | DB Type | Cost (free tier) | Cost (scale) | Performance | Scalability | Auth | Real-time | Open source | Lock-in |
|---|---|---|---|---|---|---|---|---|---|
| **Supabase** | PostgreSQL | ✅ 500 MB DB, 50K MAU | $25/mo (8 GB) | ✅ Fast (Postgres) | ✅ Good | ✅ Built-in | ✅ WebSocket | ✅ Yes | ✅ Low |
| **Firebase** | Firestore (NoSQL) | ✅ 1 GB, 50K reads/day | Usage-based (can spike) | ✅ Fast | ✅ Excellent (Google infra) | ✅ Built-in | ✅ Best-in-class | ❌ No | ⚠️ High |
| **PlanetScale** | MySQL (Vitess) | ✅ 5 GB, 1B row reads/mo | $29/mo+ | ✅ Fast | ✅ Excellent (Vitess) | ❌ DIY | ❌ No | ❌ No | Medium |
| **Neon** | PostgreSQL | ✅ 0.5 GB, 190h compute | Usage-based | ✅ Fast (serverless) | ✅ Good | ❌ DIY | ❌ No | ✅ Yes | ✅ Low |

### Recommendation

**Supabase** — best fit for our needs:
- Relational data matches our type structure (recipes, meals, inventory, shopping lists)
- Built-in auth (needed for family sharing and cross-device sync)
- Real-time (needed for shared shopping lists)
- Row-Level Security for multi-user access control
- Open source, no vendor lock-in, self-hostable
- First-class Next.js integration
- Predictable pricing (flat tiers, not per-operation)

### When to adopt

When implementing cross-device sync (future-features.md, Section 4). Not needed for Phases 1–10.

### Decision status: **Evaluated, not yet adopted**

---

## 5. AI / LLM Integration

### Needed for: Phases 6 (URL import fallback), 7 (recipe recommendations), 8 (meal plan auto-fill)

### Candidates

| SDK | Bundle | Cost (API) | Performance | Scalability | Provider support | Structured output | DX | Lock-in |
|---|---|---|---|---|---|---|---|---|
| **Vercel AI SDK** | ~15 KB | Free SDK; pay per API call to provider | ✅ Edge + streaming | ✅ Provider-agnostic scaling | ✅ OpenAI, Anthropic, Google, Mistral, etc. | ✅ `generateObject` + Zod | ✅ Excellent (hooks, RSC) | ✅ Low — swap providers freely |
| **OpenAI SDK** | ~5 KB | Pay per token (see below) | ✅ Fast | ⚠️ OpenAI-only | ❌ OpenAI only | ✅ JSON mode | ✅ Good | ⚠️ Medium — single provider |
| **LangChain JS** | ~50 KB+ | Free SDK; pay per API call | ✅ Good | ✅ Many providers | ✅ Many | ✅ Via parsers | ⚠️ Complex, steep curve | ✅ Low |

### AI API costs (pay-per-use, not free)

| Provider / Model | Input cost | Output cost | Estimated cost per recipe suggestion |
|---|---|---|---|
| **OpenAI GPT-4o** | $2.50 / 1M tokens | $10.00 / 1M tokens | ~$0.01–0.02 |
| **OpenAI GPT-4o-mini** | $0.15 / 1M tokens | $0.60 / 1M tokens | ~$0.001 |
| **Anthropic Claude Sonnet** | $3.00 / 1M tokens | $15.00 / 1M tokens | ~$0.02–0.03 |
| **Google Gemini 2.0 Flash** | Free (rate limited) | Free (rate limited) | ~$0.00 (free tier) |

**Note:** The SDK itself is free. You pay per API call to the AI provider. For a personal meal planner, costs are minimal (~$1–5/month with moderate use). Gemini Flash offers a free tier for light usage.

### Recommendation

**Vercel AI SDK** — best fit because:
- Provider-agnostic (can swap OpenAI → Claude → Gemini with one config change)
- `generateObject` with Zod schema validation ensures type-safe recipe output
- Streaming built-in for responsive UX
- Native Next.js App Router support (Route Handlers, Server Components)
- React hooks (`useChat`, `useCompletion`) for the AI recommendation panel
- Can start with free Gemini Flash, upgrade to GPT-4o when needed

### Example: AI recipe generation

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    ingredients: z.array(z.object({
      name: z.string(),
      quantity: z.number(),
      unit: z.string(),
    })),
    instructions: z.array(z.string()),
    prepTimeMinutes: z.number(),
    cookTimeMinutes: z.number(),
    servings: z.number(),
    tags: z.array(z.string()),
  }),
  prompt: 'Suggest a quick chicken dinner recipe',
});
```

### Decision status: **Recommended, adopt in Phase 7**

---

## 6. Authentication

### Needed for: Family sharing, cross-device sync (future features)

### Candidates

| Solution | Cost (free tier) | Cost (scale) | Performance | Scalability | DX | Hosted UI | Lock-in |
|---|---|---|---|---|---|---|---|
| **NextAuth.js** | ✅ Free (unlimited) | Free (self-hosted) | ✅ Fast | ✅ Good | ✅ Good, DIY UI | ❌ Build your own | ✅ Low (open source) |
| **Supabase Auth** | ✅ Free (50K MAU) | $25/mo (bundled with DB) | ✅ Fast | ✅ Good | ✅ Good | ✅ Pre-built | ✅ Low (open source) |
| **Clerk** | ✅ Free (10K MAU) | $25/mo (10K+) | ✅ Fast | ✅ Good | ✅ Excellent (drop-in) | ✅ Polished | ⚠️ Medium (proprietary) |
| **Firebase Auth** | ✅ Free (unlimited) | Free | ✅ Fast | ✅ Excellent | ✅ Good | ✅ FirebaseUI | ⚠️ High (Google lock-in) |

### Recommendation

**Supabase Auth** — bundled with the database recommendation. If we adopt Supabase for the backend, auth comes for free with Row-Level Security integration.

**Fallback:** NextAuth.js if we want auth before committing to a backend.

### Decision status: **Deferred** — no auth needed until cross-device sync

---

## 7. Mobile / Native

### Needed for: Future iOS/Android app

### Candidates

| Approach | Cost | Performance | Code sharing | Native features | Scalability | DX | Effort |
|---|---|---|---|---|---|---|---|
| **Capacitor** | Free | ✅ Web perf (WebView) | ✅ 100% shared | Camera, push, haptics via plugins | ✅ Good | ✅ Easy (wrap existing app) | Low |
| **React Native** | Free | ✅ Near-native | 💡 Share types + logic, rewrite UI | Full native access | ✅ Excellent | ⚠️ Separate codebase | High |
| **PWA** (`next-pwa`) | Free | ✅ Web perf | ✅ 100% shared | Limited (recent iOS push support) | ✅ Good | ✅ Easiest | Very low |
| **Expo** | Free / EAS paid | ✅ Near-native | 💡 Share types + logic | Full native + OTA updates | ✅ Excellent | ✅ Good (managed) | High |

### Recommendation

**PWA first, Capacitor later:**
1. Add PWA support via `next-pwa` — immediate installability, offline caching, minimal effort
2. Wrap with Capacitor when native features are needed (camera for receipt scanning, push notifications)

### Decision status: **Deferred** — web-first approach for now

---

## 8. Internationalization (i18n)

### Needed for: UC-L3 (app UI localization)

### Candidates

| Library | Bundle | Cost | Performance | DX | Next.js App Router | Lock-in |
|---|---|---|---|---|---|---|
| **next-intl** | ~5 KB | Free | ✅ Server component support | ✅ Excellent, purpose-built | ✅ First-class | ✅ Low |
| **next-i18next** | ~10 KB | Free | ✅ Good | ✅ Good but Pages Router only | ⚠️ Pages Router only | Low |
| **react-intl** | ~12 KB | Free | ✅ Good | ✅ Good, ICU format | ✅ Compatible | Low |
| **Lingui** | ~3 KB | Free | ✅ Compile-time optimized | ⚠️ Steeper setup | ✅ Compatible | ✅ Low |

### Recommendation

**next-intl** — purpose-built for Next.js App Router, smallest integration effort, supports server components.

### Decision status: **✅ Adopted** — `next-intl` with client-side `I18nProvider`

**Implementation notes:**
- `I18nProvider` reads locale from `localStorage` (not cookies) for Capacitor compatibility
- Messages imported statically from `src/messages/en.json` and `src/messages/zh-CN.json`
- `key={locale}` on provider forces full re-render on language switch
- Language toggle saves to both `localStorage` and cookie (web backward compat)
- Server-side `i18n.ts` still exists for the next-intl plugin but `layout.tsx` does not call `getMessages()`

---

## 9. Testing

### Current: Vitest (unit) + Playwright (E2E) — already adopted ✅

| Tool | Purpose | Status |
|---|---|---|
| **Vitest** | Unit tests, hook tests, component tests | ✅ Adopted |
| **@testing-library/react** | React component rendering tests | ✅ Adopted |
| **Playwright** | E2E browser tests | ✅ Adopted |
| **MSW (Mock Service Worker)** | Mock API responses in tests | 📋 Needed for Phases 6–8 (AI/import) |

### Future addition: MSW

When we add API routes (Phases 6–8), we'll need to mock them in tests. MSW intercepts network requests at the service worker level — works with both Vitest and Playwright.

```typescript
// Example: mock AI recipe endpoint
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/ai/suggest', () => {
    return HttpResponse.json({
      title: "Test Recipe",
      ingredients: [{ name: "chicken", quantity: 300, unit: "g" }],
      // ...
    });
  }),
];
```

### Decision status: **Vitest + Playwright adopted; MSW planned for Phase 7**
