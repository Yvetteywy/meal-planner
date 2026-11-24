# Recipe URL Import — Technical Research

## Problem Statement

Users want to import recipes from websites (English and Chinese) into the Meal Planner app without manually typing everything. The import should extract as much structured data as possible, pre-fill the recipe form, and let the user review/edit before saving.

---

## Table of Contents

1. [Data Sources on Recipe Websites](#1-data-sources-on-recipe-websites)
2. [How Web Scraping Works](#2-how-web-scraping-works)
3. [Anti-Scraping and Workarounds](#3-anti-scraping-and-workarounds)
4. [Parsing Strategies](#4-parsing-strategies)
5. [NPM Package Comparison](#5-npm-package-comparison)
6. [Ingredient Parsing](#6-ingredient-parsing)
7. [Chinese Recipe Site Challenges](#7-chinese-recipe-site-challenges)
8. [Architecture Options](#8-architecture-options)
9. [User Flow](#9-user-flow)
10. [Recommendations](#10-recommendations)

---

## 1. Data Sources on Recipe Websites

Recipe websites embed recipe data in three formats, in order of reliability:

### 1a. JSON-LD (best quality — ~70% of recipe sites)

Embedded in `<script type="application/ld+json">` tags following the [schema.org/Recipe](https://schema.org/Recipe) standard.

```json
{
  "@type": "Recipe",
  "name": "Garlic Butter Pasta",
  "description": "A quick weeknight pasta...",
  "recipeIngredient": ["200g spaghetti", "3 tbsp butter", "4 cloves garlic"],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Cook spaghetti..."},
    {"@type": "HowToStep", "text": "Melt butter..."}
  ],
  "prepTime": "PT5M",
  "cookTime": "PT15M",
  "recipeYield": "2 servings",
  "recipeCuisine": "Italian",
  "recipeCategory": "Main Course",
  "image": "https://example.com/photo.jpg"
}
```

**Sites that use this:** AllRecipes, BBC Good Food, Food Network, Epicurious, Serious Eats, Bon Appétit, NYT Cooking, most WordPress recipe plugins (WP Recipe Maker, Tasty Recipes, Recipe Card Blocks).

| Pros | Cons |
|------|------|
| Machine-readable, standardized | Not all sites have it |
| Rich data (times, servings, cuisine) | Ingredients are free-text strings, not structured |
| Works for any language | Some sites have incomplete/incorrect data |
| No HTML parsing needed | Still need to parse ingredient strings |

### 1b. Microdata / RDFa (~10% additional coverage)

Same schema.org data, but embedded as HTML attributes instead of JSON:

```html
<div itemscope itemtype="https://schema.org/Recipe">
  <h1 itemprop="name">Garlic Butter Pasta</h1>
  <span itemprop="recipeIngredient">200g spaghetti</span>
  <span itemprop="recipeIngredient">3 tbsp butter</span>
</div>
```

| Pros | Cons |
|------|------|
| Covers sites that don't use JSON-LD | Harder to parse (need HTML traversal) |
| Same data fields as JSON-LD | Less common than JSON-LD |

### 1c. Raw HTML (unstructured — fallback)

For sites without any structured data (personal blogs, some Chinese sites), we'd need to guess the recipe structure from HTML patterns:
- Look for headings like "Ingredients", "Instructions", "食材", "做法"
- Extract `<ul>` / `<ol>` lists near those headings
- Parse title from `<h1>` or `<title>`

| Pros | Cons |
|------|------|
| Works on any page | Very unreliable, site-specific |
| Can handle blogs without plugins | Breaks when site layout changes |
| | Requires language-specific heuristics |
| | High maintenance burden |

---

## 2. How Web Scraping Works

A "scraper" is simply a program that:

1. **Makes an HTTP request** to a URL (like a browser visiting a page)
2. **Downloads the raw HTML** source code
3. **Searches the HTML** for specific patterns (JSON-LD blocks, HTML tags with recipe data)
4. **Extracts the data** into a structured format we can use

It does NOT:
- Execute JavaScript (can't see content rendered by React/Vue/Angular apps)
- Click buttons or solve CAPTCHAs
- Log in to accounts
- Render the visual page — it only reads the raw source code

### What the scraper sees vs what you see

| What you see in browser | What the scraper sees |
|---|---|
| A beautifully formatted recipe page | Raw HTML: `<h1>Garlic Pasta</h1><ul><li>200g spaghetti</li>...` |
| Images loading | Image URLs in `<img src="...">` tags |
| Recipe structured nicely | JSON-LD block in `<script>` tag (if the site has it) |
| CAPTCHA challenge | A CAPTCHA page — scraper is stuck |
| JavaScript-rendered content | Empty `<div id="root"></div>` — scraper sees nothing |

---

## 3. Anti-Scraping and Workarounds

Some websites try to prevent automated access. Here's what we may encounter and how to handle it:

### Types of anti-scraping

| Protection | How it works | Can we bypass? |
|---|---|---|
| **No protection** | Site serves HTML to any request | ✅ Yes — just fetch |
| **User-Agent check** | Blocks requests without a browser-like User-Agent header | ✅ Yes — set a browser User-Agent string |
| **CAPTCHA** (e.g., 下厨房) | Requires human interaction before showing content | ❌ No — can't solve programmatically |
| **JavaScript rendering** | Content only appears after JS executes (SPAs) | ⚠️ Possible with headless browser (Puppeteer), but heavy |
| **IP rate limiting** | Blocks IPs that make too many requests | ✅ Yes — we only fetch one page at a time |
| **Login required** | Content behind authentication | ❌ No — can't access |

### Workarounds when scraping fails

| Approach | How it works | Pros | Cons |
|---|---|---|---|
| **User pastes text** | User copies recipe content from their browser, pastes into our app | Always works; no infrastructure | Manual work for user |
| **User pastes page source** | User right-clicks → "View Source" → copies HTML | We can parse JSON-LD from it | More technical; worse UX |
| **Headless browser** (Puppeteer/Playwright) | Runs a real Chrome browser on our server | Handles JS rendering + some CAPTCHAs | Heavy (~200MB); slow; expensive to host |
| **Browser extension** (future) | User installs extension, clicks "Send to Meal Planner" on any page | Best UX; bypasses all protections | Requires building + installing an extension |
| **User-Agent spoofing** | Pretend to be a real browser in HTTP headers | Works for simple User-Agent checks | Doesn't help with CAPTCHAs or JS rendering |

### Which sites are affected?

| Site type | Anti-scraping? | Our approach |
|---|---|---|
| **Major English recipe sites** (AllRecipes, BBC, Food Network) | ❌ No — JSON-LD works fine | Auto-import ✅ |
| **WordPress recipe blogs** | ❌ No — plugin adds JSON-LD | Auto-import ✅ |
| **下厨房 (xiachufang.com)** | ✅ CAPTCHA | User paste fallback |
| **美食天下 (meishichina.com)** | ⚠️ Unknown | Try fetch, fallback to paste |
| **小红书 (xiaohongshu.com)** | ✅ Heavy anti-bot + app-only | User paste fallback |
| **Personal blogs without plugins** | ❌ No protection, but no JSON-LD either | User paste fallback |

**Bottom line:** Auto-import works great for English recipe sites (~70-80% coverage). Chinese sites mostly need the paste fallback. AI (Phase 2) would improve Chinese coverage significantly.

---

## 4. Parsing Strategies

### Strategy A: JSON-LD + Microdata only (Recommended for v1)

Parse structured data only. If not found, show "Could not auto-detect recipe — please enter manually" and open an empty form.

| Pros | Cons |
|------|------|
| Reliable — structured data is standardized | ~20-30% of sites won't have structured data |
| Simple implementation (~100 lines) | Chinese recipe sites often lack JSON-LD |
| No site-specific code to maintain | |
| Works for any language that has JSON-LD | |

### Strategy B: JSON-LD + Microdata + HTML heuristics

Try structured data first, fall back to HTML pattern matching.

| Pros | Cons |
|------|------|
| Higher coverage (~85-90%) | HTML heuristics are fragile |
| Handles more blog-style sites | Significant development effort |
| | Needs language-specific patterns (EN vs CN) |
| | Maintenance burden — breaks when sites redesign |

### Strategy C: JSON-LD + AI fallback (future)

Try structured data first, fall back to sending page text to an LLM to extract recipe data.

| Pros | Cons |
|------|------|
| Near 100% coverage | Requires API key + costs money |
| Handles any format/language | Latency (1-3 seconds per request) |
| No site-specific heuristics | Privacy concern (sending page content to API) |
| Can extract from messy blog posts | Overkill for sites with structured data |

### Strategy D: User-assisted paste (simplest)

Let users paste raw text (ingredients list, instructions) and we parse what we can.

| Pros | Cons |
|------|------|
| No server needed | More manual work for user |
| Works in Capacitor/static builds | No auto-detection |
| No CORS/proxy issues | Worse UX than auto-import |
| Simple implementation | |

---

## 5. NPM Package Comparison

### Recipe scrapers (fetch URL → structured recipe)

| Package | Monthly downloads | What it does | Pros | Cons |
|---------|------------------|--------------|------|------|
| `@jitl/recipe-data-scraper` | 46K | Fetches URL, extracts JSON-LD + Microdata | Handles both formats; clean API | Last updated 2022; requires Node.js 18; fetches HTML itself (server-only) |
| `recipe-data-scraper` | — | Original version of above | Same functionality | Superseded by `@jitl/` fork |
| `@rethora/url-recipe-scraper` | 636 | Lightweight JSON-LD scraper | Very simple | Low adoption; limited format support |

### Ingredient parsers (string → structured data)

| Package | Monthly downloads | What it does | Pros | Cons |
|---------|------------------|--------------|------|------|
| `parse-ingredient` | 6.6K | "2 cups flour" → `{quantity: 2, unit: "cup", description: "flour"}` | Handles fractions, ranges; TypeScript; well-tested | English only; doesn't handle Chinese units |
| `numeric-quantity` | 823K | "1 1/2" → `1.5` | Pure number parsing; used by parse-ingredient | Only numbers, not full ingredients |
| `recipe-ingredient-parser-v3` | 921 | Similar to parse-ingredient | Alternate API | Low adoption |

### HTML parsers (if we do our own extraction)

| Package | Monthly downloads | What it does | Notes |
|---------|------------------|--------------|-------|
| `cheerio` | 10M+ | jQuery-like API for HTML parsing | Industry standard; we'd use this for custom extraction |
| `htmlparser2` | 30M+ | Fast streaming HTML parser | Lower-level than cheerio |

---

## 6. Ingredient Parsing

### English ingredients

The `parse-ingredient` package handles common formats:

| Input string | Parsed output |
|---|---|
| `"2 cups all-purpose flour"` | `{quantity: 2, unit: "cup", description: "all-purpose flour"}` |
| `"1/2 tsp salt"` | `{quantity: 0.5, unit: "tsp", description: "salt"}` |
| `"3 large eggs"` | `{quantity: 3, unit: null, description: "large eggs"}` |
| `"1-2 cloves garlic, minced"` | `{quantity: 1, quantity2: 2, unit: null, description: "cloves garlic, minced"}` |

**Limitation:** The parsed unit names don't always match our `Unit` type (e.g., `"cup"` vs `"cup"` ✅, but `"clove"` → no match). We'd need a mapping layer.

### Chinese ingredients

Chinese recipe sites typically list ingredients as:
- `"意大利面 200克"` (spaghetti 200g)
- `"黄油 3大勺"` (butter 3 tbsp)
- `"蒜 4瓣"` (garlic 4 cloves)

**No existing NPM package handles Chinese ingredient parsing.** Options:
1. **Don't parse** — pass the raw string as the ingredient name, let user edit
2. **Simple regex** — match patterns like `(\d+)(克|毫升|大勺|小勺|杯|个|片|根)` to extract quantity + unit
3. **AI parsing** (future) — send to LLM for structured extraction

### Mapping extracted units to our `Unit` type

| Extracted (EN) | Extracted (CN) | Our `Unit` type |
|---|---|---|
| cup, cups | 杯 | `cup` |
| tsp, teaspoon | 小勺, 茶匙 | `tsp` |
| tbsp, tablespoon | 大勺, 汤匙 | `tbsp` |
| g, gram, grams | 克, g | `g` |
| kg, kilogram | 千克, 公斤 | `kg` |
| ml, milliliter | 毫升, ml | `ml` |
| l, liter | 升, L | `l` |
| oz, ounce | 盎司 | `oz` |
| lb, pound | 磅 | `lb` |
| piece, pieces | 个, 瓣, 片, 根, 颗 | `piece` |
| — | 包 | `pack` |
| — | 盒 | `box` |
| — | 袋 | `bag` |

---

## 7. Chinese Recipe Site Challenges

### Popular Chinese recipe sites

| Site | JSON-LD support | Anti-scraping | Notes |
|------|----------------|---------------|-------|
| 下厨房 (xiachufang.com) | ❌ No | ✅ Captcha on access | Requires captcha solve; no structured data |
| 美食天下 (meishichina.com) | ❌ Unknown | Unknown | Large recipe database |
| 美食杰 (meishij.net) | ❌ Unknown | Unknown | Popular recipe site |
| 豆果美食 (douguo.com) | ❌ Unknown | Unknown | App-first, web is secondary |
| 小红书 (xiaohongshu.com) | ❌ No | ✅ Heavy anti-bot | Social media format, not traditional recipe |

**Key finding:** Chinese recipe sites generally do NOT use schema.org structured data and often have anti-scraping protection. This makes automated parsing much harder for Chinese URLs.

### Practical approach for Chinese recipes

1. **Strategy A (JSON-LD)** won't work for most Chinese sites
2. **Strategy D (user paste)** is the most reliable for Chinese
3. **Strategy C (AI)** would be the best long-term solution
4. **Simple regex** for Chinese ingredient strings could extract ~60% of quantities

---

## 8. Architecture Options

### Option 1: Next.js API route (server-side fetch)

```
Browser → /api/import-recipe?url=... → Server fetches HTML → Parse → Return JSON
```

| Pros | Cons |
|------|------|
| No CORS issues | Requires a running server |
| Can use any NPM package | Won't work in static Capacitor builds |
| Secure (URL never exposed to client) | Need to deploy (Vercel, etc.) |

### Option 2: CORS proxy + client-side parsing

```
Browser → cors-proxy.example.com/url → Get HTML → Parse in browser
```

| Pros | Cons |
|------|------|
| Works in Capacitor/static builds | Need to run/pay for a proxy |
| Simple client-side code | Security concern (proxy sees all URLs) |
| | Some sites block proxy IPs |

### Option 3: Capacitor HTTP plugin (mobile only)

```
Android/iOS WebView → Native HTTP (no CORS) → Parse in browser
```

| Pros | Cons |
|------|------|
| No proxy needed on mobile | Only works in Capacitor, not web |
| No CORS restrictions | Web version still needs server/proxy |
| Direct device-to-site connection | |

### Option 4: Hybrid (Recommended)

- **Web:** Next.js API route (`/api/import-recipe`)
- **Mobile:** Capacitor HTTP plugin (bypass CORS natively)
- **Fallback:** User pastes raw text when import fails

| Pros | Cons |
|------|------|
| Best coverage across platforms | More code to maintain |
| Graceful degradation | Need Capacitor HTTP plugin |
| Works offline (paste fallback) | |

### Option 5: Client-only with user paste

No URL fetching at all. User copies recipe text from website, pastes it, and we parse what we can.

| Pros | Cons |
|------|------|
| Zero infrastructure | Worse UX (manual copy-paste) |
| Works everywhere | Can't auto-detect structured data |
| No CORS, no proxy, no server | |
| Privacy-friendly | |

---

## 9. User Flow

### Happy path (site has JSON-LD)

```
1. User pastes URL → clicks "Import"
2. App fetches page HTML (via API route or native HTTP)
3. Extract JSON-LD → parse schema.org/Recipe
4. Parse ingredient strings → extract quantity/unit/name
5. Pre-fill RecipeForm with extracted data
6. User reviews, edits any wrong fields
7. Click "Save" → recipe created
```

### Partial parse (some fields missing)

```
1-4. Same as above, but some fields empty
5. RecipeForm shows what was found, empty fields highlighted
6. User fills in missing fields
7. Click "Save"
```

### No structured data found

```
1. User pastes URL → clicks "Import"
2. App fetches page → no JSON-LD or Microdata found
3. Show message: "Could not auto-detect recipe. You can:"
   - Option A: "Paste recipe text" → text area for raw paste
   - Option B: "Enter manually" → opens empty RecipeForm
4. If user pastes text → attempt ingredient line parsing
5. Pre-fill what we can → user edits → saves
```

---

## 10. Recommendations

### Phase 1 (implement now — no AI)

1. **Strategy A: JSON-LD + Microdata parsing**
   - Use `cheerio` to parse HTML and extract `<script type="application/ld+json">`
   - Parse schema.org/Recipe fields into our `Recipe` type
   - Use `parse-ingredient` for English ingredient string parsing
   - Simple regex for Chinese quantity/unit extraction
   - Pre-fill `RecipeForm` → user edits → saves
   - Implement as Next.js API route (`/api/import-recipe`)

2. **Fallback: User paste**
   - When JSON-LD not found, offer text paste option
   - Parse pasted ingredient lines with same parsing logic
   - Better UX than "enter manually from scratch"

3. **Packages to install:**
   - `cheerio` (~10MB, HTML parsing)
   - `parse-ingredient` (English ingredient parsing)
   - No new dependencies for Chinese parsing (custom regex)

### Phase 2 (future — with AI)

4. **Strategy C: AI fallback**
   - When JSON-LD fails and user provides URL or pasted text
   - Send to OpenAI/Claude to extract structured recipe
   - Parse response into our Recipe type
   - Most useful for Chinese sites and blogs

### Estimated coverage

| Source | JSON-LD (Phase 1) | + AI (Phase 2) |
|--------|-------------------|-----------------|
| English recipe sites | ~70-80% | ~95% |
| English food blogs | ~40-50% | ~90% |
| Chinese recipe sites | ~10-20% | ~85% |
| Social media posts | ~0% | ~70% |

### Duration mapping to our Recipe type

schema.org uses ISO 8601 durations (`PT15M` = 15 minutes, `PT1H30M` = 90 minutes):

```typescript
function parseDuration(iso: string): number {
  // "PT15M" → 15, "PT1H30M" → 90, "PT2H" → 120
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  return (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
}
```

### Decision needed

Which architecture option to start with:
- **Option 1** (API route) — simplest for web, won't work on Android until we add a proxy
- **Option 4** (hybrid) — best coverage but more work
- **Option 5** (paste only) — simplest, works everywhere, but worst UX

My recommendation: **Start with Option 1 (API route) + paste fallback.** This covers the web version fully. For Android, the paste fallback works fine until we add Capacitor HTTP plugin or deploy to a server.
