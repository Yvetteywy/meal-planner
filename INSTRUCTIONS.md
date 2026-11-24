# Meal Planner — Project Instructions

Welcome! This document is the single source of truth for understanding the project structure, how to run the app locally, and where things are headed.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture Decisions](#2-tech-stack--architecture-decisions)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Features](#5-features)
6. [Configuration & Environment Variables](#6-configuration--environment-variables)
7. [Data Persistence Strategy](#7-data-persistence-strategy)
8. [Roadmap](#8-roadmap)
9. [Contributing](#9-contributing)

---

## 1. Project Overview

**Meal Planner** is a web application that helps you:

- 📅 **Plan your meals** for the week with a visual calendar grid.
- 🍳 **Discover recipes** — browse your saved collection or get AI-powered suggestions based on a free-text prompt and the ingredients you already have.
- 📦 **Track your pantry inventory** — quantity, unit, category, and expiry date, with alerts for items nearing or past expiry.
- 🛒 **Manage a shopping list** — manually add items, check them off as you shop, or auto-generate them from your meal plan.

---

## 2. Tech Stack & Architecture Decisions

| Layer | Choice | Reason |
|---|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) | Full-stack React with file-system routing; easy to add API routes for AI features. |
| **Language** | TypeScript | Type safety across the entire codebase; shared types between client and server. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Utility-first; fast to iterate, consistent design system, no CSS bundle bloat. |
| **Icons** | [lucide-react](https://lucide.dev/) | Lightweight, tree-shakeable, consistent icon set. |
| **State / Persistence** | `localStorage` via `useLocalStorage` hook | Zero-backend setup for the MVP; swap for a database later without changing UI components. |
| **i18n** | [next-intl](https://next-intl-docs.vercel.app/) | Client-side `I18nProvider` with localStorage locale; works in web and Capacitor. English + Simplified Chinese. |
| **PWA** | [next-pwa](https://github.com/shadowwalker/next-pwa) | Service worker + manifest for installable offline-capable app. |
| **AI (future)** | OpenAI API (server-side Next.js Route Handler) | Keeps API keys on the server; easy to swap for another provider. |

### Why Web First?

A React/Next.js web app can be:
- Accessed immediately from any browser (desktop or mobile Safari on iOS).
- Installed as a PWA — standalone app experience on iOS, Android, and desktop.
- Wrapped with [Capacitor](https://capacitorjs.com/) for native iOS/Android app stores.
- Wrapped with [Electron](https://electronjs.org/) or [Tauri](https://tauri.app/) for Windows/Mac desktop apps.
- Deployed for free to [Vercel](https://vercel.com/) (the company behind Next.js).

---

## 3. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12+ on the Node 22 LTS line, or a newer supported LTS line
- npm (bundled with Node.js)

### Install dependencies

```bash
npm ci
```

### Optional environment variables

The current offline features do not require API keys. Use `.env.example` as a template when developing a server integration.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build the web/PWA for production

```bash
npm run build          # web production build (includes PWA service worker)
npm start              # serve production build locally
```

The production build generates a service worker (`public/sw.js`) that enables offline caching and PWA installation. The service worker is disabled in development mode.

### Build the iOS app

On a Mac, run `npm run build:ios` to export and sync assets, then `npm run open:ios`. Follow the [iPhone setup guide](docs/ios-implementation-plan.md#install-on-a-physical-iphone) for signing, installation, and verification status.

### Build the Android app

The Capacitor project is checked in under `android/`. `npm run build:android` exports and syncs web assets; Gradle assembles the APK separately. See the [Android build guide](docs/android-build.md) for prerequisites, exact commands, and current blockers.

### Lint

```bash
npm run lint
```

---

## 4. Project Structure

```
meal-planner/
├── INSTRUCTIONS.md          ← You are here
├── README.md
├── android/                 ← Checked-in Capacitor Android project
├── ios/                     ← Checked-in Capacitor iOS project
├── .env.example             ← Template for environment variables
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── src/
    ├── app/                 ← Next.js App Router pages & layouts
    │   ├── layout.tsx       ← Root layout (Navigation + global CSS)
    │   ├── page.tsx         ← Dashboard / home
    │   ├── globals.css
    │   ├── meal-plan/
    │   │   └── page.tsx     ← Weekly calendar grid
    │   ├── recipes/
    │   │   └── page.tsx     ← Recipe browser + AI recommendation input
    │   ├── inventory/
    │   │   └── page.tsx     ← Pantry tracker with expiry alerts
    │   └── shopping-list/
    │       └── page.tsx     ← Shopping list with check-off UI
    ├── components/
    │   └── Navigation/
    │       └── Navigation.tsx  ← Top nav bar + mobile bottom bar
    ├── hooks/
    │   └── useLocalStorage.ts  ← Generic typed localStorage hook
    └── lib/
        └── types.ts         ← Shared TypeScript domain types
```

---

## 5. Features

### Dashboard (`/`)

Landing page with quick-access cards to all four features and a "Coming Soon" section.

### Meal Plan (`/meal-plan`)

- A 7-column × 4-row grid (Mon–Sun × breakfast / lunch / dinner / snack).
- Navigate between weeks with **← →** arrows.
- Today's column is highlighted.
- Empty cells show a **+** button (add-meal modal is a future task).

### Recipes (`/recipes`)

- Displays saved recipes as cards with title, description, time, servings, and tags.
- **Search** filters by title or tag.
- **AI Recommendation panel** — enter a free-text prompt (e.g. "something quick with chicken") and hit **Suggest**. Requires `OPENAI_API_KEY` in `.env.local` and a Route Handler (see Roadmap).
- Two sample recipes are pre-loaded to demonstrate the UI.

### Inventory (`/inventory`)

- Add pantry items with name, quantity, unit, category, and optional expiry date.
- Items nearing expiry (within 3 days) are highlighted in amber; expired items in red.
- Filter by category.
- Remove items with the trash icon.

### Shopping List (`/shopping-list`)

- Add items with name, quantity, unit, and category.
- Check off items as you shop; checked items move to a "Picked up" section.
- Clear all checked items at once.
- Badge on the page header shows the count of remaining items.

---

## 6. Configuration & Environment Variables

See `.env.example` for all supported variables.

| Variable | Used for |
|---|---|
| `OPENAI_API_KEY` | AI recipe recommendations (not yet wired up — Route Handler needed) |

> **Never commit `.env.local` to Git.** It is already in `.gitignore`.

---

## 7. Data Persistence Strategy

**Current (MVP):** All data is stored in the browser's `localStorage` via the `useLocalStorage` hook (`src/hooks/useLocalStorage.ts`). This means:

- ✅ No backend required to get started.
- ✅ Data persists across page reloads.
- ❌ Data is device-specific; not synced across devices.
- ❌ Data is lost if the user clears browser storage.

**Migration path:** When you're ready to sync data across devices:

1. Add a database (e.g. [Supabase](https://supabase.com/), [PlanetScale](https://planetscale.com/), or a simple SQLite via [Turso](https://turso.tech/)).
2. Replace `useLocalStorage` calls in the page components with React Query / SWR hooks that call Next.js Route Handlers.
3. Add authentication (e.g. [NextAuth.js](https://next-auth.js.org/)).

The UI components are **data-layer agnostic** — they only depend on the `types.ts` contracts.

---

## 8. Roadmap

### Near-term

- [ ] **Add Meal modal** — search recipes and drop them into a calendar cell.
- [ ] **Generate shopping list from meal plan** — diff planned ingredients against inventory.
- [ ] **AI recipe Route Handler** — wire up the OpenAI API call server-side.
- [ ] **Recipe CRUD** — add, edit, and delete custom recipes.
- [x] **Installable web PWA** — manifest and service worker implemented.
- [x] **Interim iOS app (Capacitor)** — Simulator workflows verified; signed build installed and app process confirmed running on an iPhone SE.
- [ ] **iOS device and release verification** — complete [physical-device smoke checks and TestFlight preparation](docs/ios-implementation-plan.md#3-verify-on-simulator-and-iphone).
- [ ] **Packaged Android verification** — [fix recipe routing, isolate the export, and assemble and test an APK](docs/android-build.md#known-issues-and-next-fixes).

### Medium-term

- [ ] **User accounts & cloud sync** — Supabase or similar.
- [ ] **Nutrition data** — calories, macros per serving (OpenFoodFacts API).

### Future

- [ ] **Shopping integrations** — Amazon Fresh, Instacart, QFC via their respective APIs; one-tap re-order.
- [ ] **Budget tracker** — log spending per shopping trip; monthly charts.
- [ ] **Native iOS app (SwiftUI)** — build an iPhone-first interface and plan the transition from Capacitor; see the [native iOS stage](docs/ios-implementation-plan.md#stage-2-native-ios-app-swiftui).
- [ ] **Barcode scanner** — scan pantry items to auto-populate inventory.

---

## 9. Contributing

1. Create a feature branch off `main`.
2. Make your changes; run `npm run lint` and `npm run build` before pushing.
3. Open a pull request with a clear description of what you changed and why.

Questions? Open an issue or start a discussion.
