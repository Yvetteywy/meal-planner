# Constraints, Capacity & Cost Estimates

This document defines system constraints, storage capacity estimates, and cost projections at different usage scales. Use this to validate design decisions and plan for growth.

---

## Table of Contents

1. [Storage Constraints](#1-storage-constraints)
2. [Capacity Estimates](#2-capacity-estimates)
3. [API Cost Projections](#3-api-cost-projections)
4. [Performance Budgets](#4-performance-budgets)
5. [Scaling Thresholds](#5-scaling-thresholds)

---

## 1. Storage Constraints

### localStorage (current — Phases 1–5)

| Constraint | Limit | Notes |
|---|---|---|
| **Total quota per origin** | ~5–10 MB (browser-dependent) | Chrome: 5 MB, Safari: 5 MB, Firefox: 10 MB |
| **Per-key limit** | Same as total quota | Each key shares the pool |
| **iOS WebView eviction** | Can be purged by OS | When device is low on storage |
| **Data format** | JSON strings only | No binary data; images must be base64 |

### localStorage keys and estimated sizes

| Key | Data type | Per-item estimate | Notes |
|---|---|---|---|
| `recipes` | `Recipe[]` | ~1–2 KB per recipe | Ingredients + instructions are the bulk |
| `meal-plan` | `Meal[]` | ~0.2 KB per meal | Mostly IDs and short strings |
| `inventory` | `InventoryItem[]` | ~0.15 KB per item | Small objects |
| `shopping-list` | `ShoppingListItem[]` | ~0.2 KB per item (without image) | Images add 30–50 KB each |
| `meal-slots` | `string[]` | ~0.05 KB | Tiny — just slot names |
| `notifications` | `AppNotification[]` | ~0.2 KB per notification | Short messages |

### Image constraints

| Constraint | Limit | Rationale |
|---|---|---|
| **Shopping list image (UC-S4)** | Max 50 KB per thumbnail | Compressed JPEG, ~200×200px |
| **Inventory icon (UC-I5)** | Emoji preferred (0 KB); custom image max 10 KB | Tiny thumbnails only |
| **Total image budget** | Max 500 KB across all images | ~10% of localStorage quota |
| **Compression** | JPEG quality 60%, max 200px width | Balance quality vs size |

---

## 2. Capacity Estimates

### Scenario: Personal user (1 person, 6 months of use)

| Data | Count | Size per item | Total size |
|---|---|---|---|
| Recipes | 50 | 1.5 KB | 75 KB |
| Planned meals (6 months × 3 meals/day) | 540 | 0.2 KB | 108 KB |
| Inventory items | 30 (at any time) | 0.15 KB | 4.5 KB |
| Shopping list items | 15 (at any time) | 0.2 KB | 3 KB |
| Shopping list images | 5 | 50 KB | 250 KB |
| Notifications | 20 (active) | 0.2 KB | 4 KB |
| Meal slots | 5 | — | 0.05 KB |
| **Total** | | | **~445 KB** |

**Verdict:** ✅ Well within 5 MB localStorage quota. Room for ~10x growth.

### Scenario: Power user (family, 2 years of use)

| Data | Count | Size per item | Total size |
|---|---|---|---|
| Recipes (with versions) | 200 | 1.5 KB | 300 KB |
| Planned meals (2 years × 4 meals/day) | 2,920 | 0.2 KB | 584 KB |
| Inventory items | 60 | 0.15 KB | 9 KB |
| Shopping list items | 30 | 0.2 KB | 6 KB |
| Shopping list images | 15 | 50 KB | 750 KB |
| Ratings (2 per week × 2 years) | 208 | 0.1 KB | 21 KB |
| Notifications | 50 | 0.2 KB | 10 KB |
| **Total** | | | **~1.7 MB** |

**Verdict:** ✅ Still within 5 MB quota, but images are the dominant cost. Monitor image count.

### Scenario: When to migrate away from localStorage

| Trigger | Threshold | Action |
|---|---|---|
| Total data > 3 MB | ~150 recipes + 2 years of meals + 30 images | Migrate to IndexedDB (for images) or backend |
| Needs multi-device sync | Any | Migrate to Supabase |
| Needs family sharing | Any | Migrate to Supabase with auth |
| iOS app data eviction | When it happens | Migrate to SQLite via Capacitor |

---

## 3. API Cost Projections

### AI endpoints (Phases 7–8)

Costs depend on the AI provider and model. All estimates use token-based pricing.

#### Per-request estimates

| Endpoint | Input tokens | Output tokens | Model | Cost per request |
|---|---|---|---|---|
| `POST /api/ai/suggest-recipes` (1 recipe) | ~500 | ~800 | GPT-4o-mini | ~$0.0006 |
| `POST /api/ai/suggest-recipes` (3 recipes) | ~500 | ~2,400 | GPT-4o-mini | ~$0.002 |
| `POST /api/ai/suggest-recipes` (by inventory, 30 items) | ~1,200 | ~2,400 | GPT-4o-mini | ~$0.003 |
| `POST /api/ai/generate-meal-plan` (full week, 28 meals) | ~2,000 | ~8,000 | GPT-4o-mini | ~$0.005 |
| `POST /api/recipes/import` (AI fallback) | ~3,000 | ~1,000 | GPT-4o-mini | ~$0.002 |

#### Monthly cost by usage level

| Usage level | Actions per month | Estimated monthly cost |
|---|---|---|
| **Light** (1 user, occasional) | 10 recipe suggestions + 2 meal plan fills | ~$0.03 |
| **Moderate** (1 user, daily) | 30 suggestions + 4 meal plan fills + 5 imports | ~$0.10 |
| **Heavy** (family, power user) | 100 suggestions + 8 meal plan fills + 20 imports | ~$0.35 |

**Verdict:** ✅ Extremely affordable. Even heavy use is under $1/month with GPT-4o-mini.

#### Free alternatives

| Provider | Free tier | Limit |
|---|---|---|
| **Google Gemini 2.0 Flash** | Free | 15 RPM, 1M tokens/day |
| **Anthropic Claude (free tier)** | Free | Rate-limited |

**Recommendation:** Start with Gemini Flash for $0 cost. Upgrade to GPT-4o-mini ($0.10/month) if quality isn't sufficient.

### Recipe import (Phase 6)

| Method | Cost | Notes |
|---|---|---|
| JSON-LD parsing (structured data) | $0 | Pure server-side HTML parsing, no API calls |
| AI fallback extraction | ~$0.002 per import | Only when structured data unavailable |

### Backend (future — Supabase)

| Tier | Monthly cost | Includes |
|---|---|---|
| **Free** | $0 | 500 MB DB, 1 GB storage, 50K MAU, 2M edge invocations |
| **Pro** | $25/month | 8 GB DB, 100 GB storage, unlimited MAU |

**Verdict:** ✅ Free tier is sufficient for personal/family use. Pro only needed for heavy sharing or 100+ users.

---

## 4. Performance Budgets

### Page load targets

| Metric | Target | Current |
|---|---|---|
| **First Load JS (shared)** | < 150 KB | 102 KB ✅ |
| **Per-page JS** | < 5 KB | 2–3 KB ✅ |
| **Largest Contentful Paint (LCP)** | < 2.5s | TBD (measure after Phase 3) |
| **Time to Interactive (TTI)** | < 3s | TBD |

### localStorage read performance

| Operation | Items | Expected time | Notes |
|---|---|---|---|
| Read `recipes` | 50 | < 5ms | JSON.parse of ~75 KB |
| Read `recipes` | 200 | < 15ms | JSON.parse of ~300 KB |
| Read `meal-plan` | 500 | < 10ms | JSON.parse of ~100 KB |
| Read `meal-plan` | 3,000 | < 30ms | JSON.parse of ~600 KB — consider pagination |
| Filter/search recipes | 200 | < 5ms | Array.filter with includes() — fast |

**Verdict:** ✅ localStorage reads are fast for expected data volumes. Pagination needed only beyond ~3,000 meal entries.

### Image processing

| Operation | Target | Notes |
|---|---|---|
| Resize + compress before save | < 200ms | Use canvas API, resize to 200×200px, JPEG 60% |
| Display thumbnail | < 50ms | Already base64, no network request |

---

## 5. Scaling Thresholds

When each component hits its practical limit and what to do:

| Component | Comfortable range | Uncomfortable at | Action at threshold |
|---|---|---|---|
| **localStorage total** | < 2 MB | > 3 MB | Move images to IndexedDB |
| **Recipes array** | < 200 | > 500 | Consider search index or lazy loading |
| **Meal history** | < 2,000 | > 5,000 | Add pagination, archive old meals |
| **Shopping list images** | < 10 | > 20 | Compress more aggressively or move to IndexedDB |
| **AI requests/minute** | < 5 | > 15 RPM | Add client-side rate limiting + queue |
| **Concurrent timers (Cook Mode)** | < 5 | > 10 | Unlikely in practice; no action needed |
| **Supabase free tier DB** | < 200 MB | > 400 MB | Upgrade to Pro ($25/month) |
| **Supabase free tier MAU** | < 30K | > 40K | Upgrade to Pro |

### Growth timeline (single user)

```
Month 1:    ~50 KB   (10 recipes, 90 meals, 20 inventory items)
Month 6:    ~450 KB  (50 recipes, 540 meals, 5 images)
Year 1:     ~900 KB  (80 recipes, 1,080 meals, 10 images)
Year 2:     ~1.7 MB  (150 recipes, 2,160 meals, 15 images)
Year 3:     ~2.5 MB  (200 recipes, 3,000+ meals, 20 images)
                      ↑ Consider IndexedDB migration for images
Year 5:     ~3.5 MB  (300+ recipes, 5,000+ meals)
                      ↑ Consider backend migration or archiving old meals
```

---

## Design decisions informed by these constraints

| Decision | Rationale |
|---|---|
| Images as compressed base64 thumbnails | Fits within localStorage; max 50 KB each |
| `recipeId` reference (not embedded recipe) | Saves ~1 KB per meal vs embedding full recipe |
| Flat `Meal[]` array (not nested by week) | Simpler serialization, ~200 bytes per meal |
| Emoji icons preferred over images for inventory | 0 bytes vs 10 KB per icon |
| Client-side AI rate limiting | Prevents accidental cost spikes |
| Free-tier AI provider (Gemini Flash) as default | $0 cost for personal use |
