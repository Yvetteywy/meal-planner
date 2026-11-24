# Meal Planner

> Plan smarter, eat better.

A web app for planning meals, managing recipes, tracking your pantry inventory, and managing your shopping list. Available as a PWA for installable mobile/desktop experience.

## Quick Start

```bash
npm ci
npm run dev          # open http://localhost:3000
```

## Features

- 📅 **Weekly meal plan** — visual calendar grid with customizable meal slots
- 🍳 **Recipes** — create, edit, version, rate, and cook step-by-step
- 📦 **Pantry inventory** — track quantities, units, categories, and expiry dates
- 🛒 **Shopping list** — add items manually or generate from your meal plan
- 🔔 **Notifications** — expiry alerts, rating reminders, meal reminders
- 💾 **Export/Import** — JSON backup and restore from Settings
- 🌐 **i18n** — English and Simplified Chinese with language toggle
- 📱 **PWA** — installable on iOS, Android, and desktop

## PWA (Progressive Web App)

The app can be installed as a standalone app on any device:

- **iOS**: Open in Safari → tap Share → "Add to Home Screen"
- **Android**: Open in Chrome → tap "Install" banner or menu → "Install app"
- **Desktop**: Open in Chrome/Edge → click install icon in address bar

The PWA works offline with cached assets and stores all data in localStorage.

## Build

```bash
npm run build        # production build (includes PWA service worker)
npm run start        # serve production build locally
```

The Capacitor Android project is checked in under `android/`. See the [Android build guide](./docs/android-build.md) for SDK setup, APK assembly, and known issues. This is separate from the installable web PWA.

For the interim Capacitor iOS app, see the [iOS app implementation plan](./docs/ios-implementation-plan.md#build-and-run-locally) for Simulator setup and current status.

## Documentation

See **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** for the full setup guide, project structure, architecture decisions, and roadmap.

Detailed design docs in [`docs/`](./docs/):
- [Use Cases](./docs/use-cases.md) · [Data Model](./docs/data-model.md) · [Implementation Plan](./docs/implementation-plan.md) · [Test Plan](./docs/test-plan.md)

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS · next-intl · next-pwa · localStorage (client-side persistence)
