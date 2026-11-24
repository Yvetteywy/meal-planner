# Future Features Roadmap

Features planned for later phases, documented now to ensure the current architecture doesn't block them.

---

## Table of Contents

1. [Shopping Integrations](#1-shopping-integrations)
2. [Budget & Price Tracking](#2-budget--price-tracking)
3. [Family Sharing](#3-family-sharing)
4. [Cross-Device Sync](#4-cross-device-sync)
5. [Meal Insights & Trends](#5-meal-insights--trends)
6. [App UI Localization](#6-app-ui-localization)
7. [Smart Inventory Auto-Replenish](#7-smart-inventory-auto-replenish)
8. [Multi-Platform Distribution](#8-multi-platform-distribution)

---

## 1. Shopping Integrations

### Vision

Integrate with grocery delivery services (Amazon Fresh, Instacart, Walmart, etc.) so users can push their shopping list to a store and have items auto-added to their cart.

### Use Cases

#### UC-F1: Export shopping list to a grocery service

**As a** user, **I want to** send my shopping list to Amazon Fresh (or another store), **so that** I can order groceries without re-typing everything.

**User flow:**

1. On the Shopping List page, click "Order Online"
2. Choose a store (Amazon Fresh, Instacart, Walmart, etc.)
3. App maps shopping list items to the store's product catalog
4. User reviews the matched products (can swap alternatives)
5. Click "Add to Cart" → opens the store's checkout in a new tab/app

**Acceptance criteria:**

- [ ] Supports at least one integration at launch (Amazon Fresh or Instacart)
- [ ] Fuzzy product matching: "Chicken breast 300g" → finds the closest product
- [ ] User can review and swap products before adding to cart
- [ ] Handles items that can't be matched (flagged for manual selection)
- [ ] Works via store APIs where available, or deep-link URLs as fallback

**Architecture considerations:**

- Needs a server-side integration layer (API keys for store APIs must stay on the server)
- Product matching may use AI to map ingredient names → store catalog items
- Deep-link fallback: construct a URL like `https://www.amazon.com/afx/lists/add?items=...` where APIs aren't available
- Each store integration is a pluggable adapter (same interface, different implementation)

---

## 2. Budget & Price Tracking

### Vision

Track how much each shopping trip costs, see spending trends over time, and understand which categories cost the most.

### Data Model

```typescript
export interface PriceRecord {
  ingredientName: string;       // matches shopping list item or inventory item name
  normalizedName?: string;      // for cross-language matching
  price: number;
  currency: string;             // "USD", "CNY", etc.
  store?: string;               // where it was purchased
  recordedAt: string;           // ISO date
}

export interface ShoppingTrip {
  id: string;
  date: string;                 // ISO date
  store: string;
  items: Array<{
    shoppingListItemId?: string;
    name: string;
    quantity: number;
    unit: Unit;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
  notes?: string;
}
```

**localStorage key:** `shopping-trips`, `price-history`

### Use Cases

#### UC-F2: Log a shopping trip with prices

**As a** user, **I want to** record how much I spent on each item, **so that** I can track my grocery budget.

**User flow:**

1. After a shopping trip, go to "Log Trip" (or triggered from "Move to Pantry")
2. Items from the checked shopping list are pre-filled
3. User enters the price for each item (or scans a receipt — future)
4. Click "Save" → trip is recorded

**Acceptance criteria:**

- [ ] Pre-fills items from the shopping list
- [ ] Calculates total automatically
- [ ] Supports multiple currencies
- [ ] Stores price per item for historical tracking

#### UC-F3: View spending trends

**As a** user, **I want to** see charts showing my monthly grocery spending by category, **so that** I can understand where my money goes.

**Acceptance criteria:**

- [ ] Monthly bar chart of total spending
- [ ] Breakdown by category (Produce, Meat & Fish, Dairy, etc.)
- [ ] Average cost per meal (total spend ÷ meals cooked)
- [ ] Price trend per item over time ("chicken breast is getting more expensive")

**Architecture considerations:**

- Price history enables smart shopping: "You paid $5.99 at Store A last time, Store B has it for $4.99"
- Receipt scanning (OCR) is a future enhancement — use device camera + AI to extract items and prices
- The existing `SpendingRecord` type in `types.ts` can be evolved into this design

---

## 3. Family Sharing

### Vision

Share shopping lists (and optionally meal plans) with family members so they can shop for you, see what's needed, and update the list in real time.

### Use Cases

#### UC-F4: Share a shopping list with family

**As a** user, **I want to** share my shopping list with my partner/family, **so that** anyone can do the grocery run.

**User flow:**

1. On the Shopping List page, click "Share"
2. Generate a shareable link (or invite by email/phone)
3. Family member opens the link → sees the shopping list in real time
4. Either person can check items off, and changes sync live

**Acceptance criteria:**

- [ ] Real-time sync: when one person checks an item, the other sees it immediately
- [ ] Works without requiring the other person to create an account (view-only via link)
- [ ] For full edit access, the other person needs an account
- [ ] Shows who checked off which item (attribution)
- [ ] Item images and notes are visible to all shared users

#### UC-F5: Collaborate on meal planning

**As a** user, **I want to** let my family suggest meals for the week, **so that** everyone has input on what we eat.

**Acceptance criteria:**

- [ ] Shared meal plan view — family members can add/suggest meals
- [ ] Suggestions need approval from the plan owner (optional setting)
- [ ] Comments on meals: "Can we swap this for something lighter?"

**Architecture considerations:**

- Requires a backend with real-time capabilities (WebSocket or Supabase Realtime)
- Sharing model: owner + collaborators with role-based permissions (view / edit / admin)
- Can start simple: share a read-only snapshot link (no backend), then evolve to real-time sync
- Push notifications when the shared list is updated

---

## 4. Cross-Device Sync

### Vision

Use the app on phone, tablet, and desktop with all data staying in sync automatically.

### Options

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| **A: Backend + auth** (Supabase, Firebase, PlanetScale) | Full sync, sharing, works everywhere | Needs account creation, hosting costs | High |
| **B: iCloud CloudKit** (via Capacitor plugin) | No account needed for Apple users, automatic sync | Apple-only, no web/Android, limited to iOS/macOS | Medium |
| **C: Export/import JSON** | Zero infrastructure, works now | Manual, no real-time sync | Low |
| **D: CRDTs + peer-to-peer** (e.g., Automerge) | No server needed, offline-first | Complex conflict resolution, experimental | High |

### Recommended path

```
Phase 1 (now):     localStorage — single device, no sync
Phase 2 (near):    Export/import JSON backup — manual sync, data safety
Phase 3 (medium):  Supabase backend + NextAuth — full sync, sharing, accounts
Phase 4 (future):  Capacitor native app — iOS/Android with same backend
```

### Use Cases

#### UC-F6: Sync data across devices

**As a** user, **I want to** access my recipes, meal plans, inventory, and shopping list from any device, **so that** I can plan on my laptop and shop with my phone.

**Acceptance criteria:**

- [ ] Data is consistent across all devices within a few seconds
- [ ] Offline edits sync when back online (conflict resolution)
- [ ] User authenticates once per device
- [ ] Existing localStorage data is migrated to the cloud on first login

#### UC-F7: Export and import data (near-term)

**As a** user, **I want to** export all my data as a file and import it on another device, **so that** I have a backup and can manually transfer data.

**User flow:**

1. Settings → "Export Data" → downloads a JSON file
2. On another device, Settings → "Import Data" → upload the JSON file
3. Data is merged with any existing data on the device

**Acceptance criteria:**

- [ ] Exports all localStorage data (recipes, meals, inventory, shopping list, notifications)
- [ ] JSON format is human-readable
- [ ] Import merges by ID (updates existing, adds new, doesn't duplicate)
- [ ] Version field in export for forward-compatibility

---

## 5. Meal Insights & Trends

### Vision

Provide reports and visualizations of past meal data so users can understand their cooking habits, favorite recipes, nutritional patterns, and variety over time.

### Use Cases

#### UC-F8: Cooking stats dashboard

**As a** user, **I want to** see a summary of my cooking activity, **so that** I can track how often I cook and what I eat.

**Stats to display:**

- Meals cooked this week / month / all time
- Meals skipped this week / month
- Average rating across all cooked meals
- Cooking streak (consecutive days with at least one cooked meal)

#### UC-F9: Most-cooked recipes

---

## 8. Multi-Platform Distribution

**Status:** PWA implemented · Capacitor mobile projects checked in · Desktop wrapper planned

The app supports multiple distribution channels from a single codebase:

| Platform | Tool | Status | Notes |
|----------|------|--------|-------|
| **Web** | Next.js | ✅ Done | Default — deploy to Vercel, Netlify, or any host |
| **PWA** | next-pwa | ✅ Done | Installable from browser on iOS, Android, desktop |
| **Windows** | Electron or Tauri | 🔮 Planned | Wraps web build into `.exe` installer |
| **iOS** | Capacitor | Signed iPhone install and process startup confirmed | [Device workflows and TestFlight are pending](ios-implementation-plan.md) |
| **Android** | Capacitor | Export and sync verified; APK not yet verified | [APK assembly, recipe routing fixes, and device tests are pending](android-build.md) |

**Architecture:** The platforms share web source, not build output. The web/PWA uses a Next.js production build. iOS exports to `.ios-web/` and Android exports to `out/` before syncing their respective Capacitor projects.

**PWA capabilities (current):**
- Offline caching via service worker (Workbox)
- Home screen installation on all major browsers
- Standalone display mode (no browser chrome)
- All data persisted in localStorage

**Build commands:** `npm run build` builds the web/PWA. `npm run build:ios` and `npm run build:android` export and sync their respective projects. Xcode and Gradle compile the apps. A desktop build script is not implemented.

**As a** user, **I want to** see which recipes I cook most often, **so that** I can identify my favorites and try new things.

**Visualizations:**

- Top 10 most-cooked recipes (bar chart or ranked list)
- Frequency over time (e.g., "You've made Garlic Butter Pasta 8 times in the last 3 months")
- Recipes cooked only once ("tried it once" list)

#### UC-F10: Rating trends

**As a** user, **I want to** see how my ratings change over time, **so that** I can see if I'm improving recipes through versioning.

**Examples:**

- "Garlic Butter Pasta: v1 avg 3.5★, v2 avg 4.5★ — the chili flakes helped!"
- Overall average rating trend by month

#### UC-F11: Cuisine and variety analysis

**As a** user, **I want to** see what cuisines I cook most, **so that** I can diversify my meals if I'm eating too much of one type.

**Visualizations:**

- Cuisine distribution (pie chart: 40% Italian, 25% Chinese, 20% American, ...)
- Variety score: "You used 15 unique recipes this month out of 60 meals" 
- Suggestions: "You haven't cooked Japanese food in 3 weeks — try a new recipe?"

#### UC-F12: Ingredient usage patterns

**As a** user, **I want to** see which ingredients I use most, **so that** I can plan shopping better and spot nutritional gaps.

**Examples:**

- Top ingredients by frequency (chicken, garlic, spaghetti, ...)
- Ingredients bought but never used (waste tracking)
- Seasonal patterns: "You eat more soup in winter"

**Architecture considerations:**

- All data already exists in `Meal` history + `Recipe` library — no new data collection needed
- Computations are pure functions over existing arrays — good for `src/lib/insights-utils.ts`
- Charts can use a lightweight library (e.g., Recharts ~45 KB, or Chart.js ~60 KB)
- Could be a new `/insights` page or a section on the Dashboard

---

## 6. App UI Localization

### Vision

Switch the entire app interface between English and Chinese (and potentially other languages), so all buttons, labels, headings, and messages are in the user's preferred language.

**Related use case:** UC-L3

### Use Cases

#### UC-F13: Switch app language

**As a** user, **I want to** switch the app between English and Chinese, **so that** the entire UI is in my preferred language.

**Acceptance criteria:**

- [ ] All UI chrome (buttons, headings, placeholders, error messages) is translatable
- [ ] Language can be switched without losing data
- [ ] User-generated content (recipe titles, ingredient names) is NOT translated — only app UI
- [ ] Locale files: `en.json` and `zh.json` (extensible to more languages)

**Architecture considerations:**

- Use `next-intl` (recommended in tech-research.md) for Next.js App Router i18n
- URL strategy: browser locale detection or manual toggle in settings (not URL-based like `/en/...`)
- Translations needed: ~200–300 strings across all pages
- Can be added independently at any point — no dependency on other features

---

## 7. Smart Inventory Auto-Replenish

### Vision

Track purchase frequency of inventory items and automatically add them to the shopping list when they run low, so the user never runs out of staples.

### Use Cases

#### UC-F14: Track most-bought items

**As a** user, **I want to** see which inventory items I buy most often, **so that** I can identify my household staples.

**Data needed:**
- Every time an item enters inventory (via "Move to Pantry" or manual add), record it
- Track: item name, frequency (times bought per month), average quantity per purchase

#### UC-F15: Auto-add to shopping list when low

**As a** user, **I want** frequently-bought items to be automatically added to my shopping list when their quantity drops below a threshold, **so that** I never run out of essentials.

**User flow:**
1. User marks an item as a "staple" (or the app auto-detects based on purchase frequency)
2. User sets a reorder threshold (e.g., "when eggs ≤ 2, add 12 to shopping list")
3. When inventory quantity drops below threshold (after cooking deduction or manual edit), the item is auto-added to the shopping list
4. A notification appears: "Added Eggs (12) to your shopping list — running low"

**Acceptance criteria:**
- [ ] User can mark items as "staple" with a reorder threshold and reorder quantity
- [ ] Auto-detection: items bought 3+ times in 2 months are suggested as staples
- [ ] When quantity ≤ threshold, item is added to shopping list automatically
- [ ] Duplicate check: don't add if already on the shopping list
- [ ] Notification when auto-added
- [ ] User can disable auto-replenish per item or globally

**Architecture considerations:**
- Needs a purchase history log (already partially available via `source: "shopping-list"` on inventory items)
- Add fields to `InventoryItem`: `isStaple?: boolean`, `reorderThreshold?: number`, `reorderQuantity?: number`
- Check triggers: after `deductIngredients` (Phase 4) and after manual inventory edits
- Pure utility function: `checkAndAutoReplenish(inventory, shoppingList) → newShoppingItems[]`

---

| Current Decision | Future Feature it Enables |
|---|---|
| `recipeId` references (not embedded objects) | Sync-friendly — no duplicated data to reconcile |
| `source` fields on all items | Attribution — know where data came from when syncing |
| `normalizedName` on ingredients | Cross-language product matching for store integrations |
| `imageUrl` as string (not binary blob) | Easy to migrate from base64 → cloud storage URL |
| Type contracts in `types.ts` | Shared between client and future API layer |
| Utility functions in `src/lib/` | Reusable on server-side when backend is added |
| Export/import JSON (UC-F7) | Stepping stone to full sync; also serves as backup |
