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

## Install on a phone for testing

These Capacitor installs are separate from the browser PWA. Run npm commands from the repository root, starting with `npm ci` on a fresh checkout.

- **iPhone (Mac + Xcode):** Run `npm run build:ios` and `npm run open:ios`. In Xcode, select your development team and connected iPhone, then click **Run**. See the [iPhone setup guide](./docs/ios-implementation-plan.md#install-on-a-physical-iphone) for signing, first-launch troubleshooting, and updates.
- **Android:** With the [Android prerequisites](./docs/android-build.md#prerequisites) installed, use a clean or disposable checkout. Run `npm run build:android`, then `npm run open:android` and click **Run** in Android Studio with your phone or emulator selected. See the [Android build guide](./docs/android-build.md#build-a-debug-apk) for APK installation and known blockers.

## Documentation

See **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** for the full setup guide, project structure, architecture decisions, and roadmap.

Detailed design docs in [`docs/`](./docs/):
- [Use Cases](./docs/use-cases.md) · [Data Model](./docs/data-model.md) · [Implementation Plan](./docs/implementation-plan.md) · [Test Plan](./docs/test-plan.md)

## Tech Stack

Next.js 15 · TypeScript · Tailwind CSS · next-intl · next-pwa · localStorage (client-side persistence)
