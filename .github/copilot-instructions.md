# Meal Planner — Copilot Development Guidelines

A meal-planning web app built with Next.js, React, TypeScript, and Tailwind CSS. Please follow these guidelines when contributing.

## Agent notes

- Explore the project before beginning code generation
- Create todo lists for long operations
  - Before each step in a todo list, reread the instructions to ensure you always have the right directions
- Always use instructions files when available, reviewing before generating code
- Do not generate summary markdown files upon completion of a task
- Always use absolute paths when running scripts and terminal commands
- **Do NOT commit or push changes unless explicitly instructed to do so by the user**

## Code standards

### Required Before Each Commit

#### Testing guidelines

- Run Vitest unit tests (`npm test`) to verify logic and component behaviour
- Run Playwright E2E tests (`npm run test:e2e`) to verify frontend flows
- Review existing tests before adding new ones to avoid duplication
- Test code should follow the same quality and DRY principles as production code
- Run `npm run build` to verify there are no build errors

#### Project guidelines

- When adding new functionality, update `INSTRUCTIONS.md` and `README.md` if the change affects project structure, setup, or usage
- When adding new pages or routes, update the project structure section in `INSTRUCTIONS.md`
- Make sure all guidance in Copilot Instructions files is updated with any relevant changes

### Technology evaluation

When comparing technology options (libraries, frameworks, services, tools), always include these dimensions:

- **Performance** — speed, bundle size, latency
- **Cost** — free tier limits, pricing model, estimated monthly cost at scale
- **Scalability** — how well it handles growth (data volume, users, traffic)
- **Developer experience** — API quality, documentation, learning curve
- **Ecosystem / community** — maintenance activity, community size, plugin ecosystem
- **Lock-in risk** — open source vs proprietary, migration difficulty
- **Extendability** — plugin support, customization, API surface
- **Compatibility** — cross-platform, integration with existing stack
- **Licensing** — license type (MIT, Apache, proprietary), commercial use restrictions
- **Operational burden** — hosting, maintenance, monitoring requirements

Add other relevant dimensions for the specific comparison. Always include **reference links** to sources.

### Code formatting requirements

- Use TypeScript with strict mode for all source files
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use the `@/*` path alias (mapped to `./src/*`) for imports

### Next.js and React patterns

- Use the App Router (`src/app/`) for pages and layouts
- Server Components by default; add `"use client"` only when needed (state, effects, browser APIs)
- Shared types go in `src/lib/types.ts`
- Reusable pure functions go in `src/lib/` (e.g., `date-utils.ts`, `inventory-utils.ts`)
- Custom hooks go in `src/hooks/`
- Reusable UI components go in `src/components/`
- Use `useLocalStorage` hook from `src/hooks/useLocalStorage.ts` for client-side persistence

### Styling

- Use Tailwind CSS utility classes exclusively — see `tailwindcss.instructions.md`
- Brand colour palette: green-based (`brand-50` through `brand-900`) defined in `tailwind.config.js`
- Light theme with clean, modern look
- Rounded corners (`rounded-xl`, `rounded-2xl`) and subtle shadows (`shadow-sm`)
- Follow modern UI/UX principles with clean, accessible interfaces

### Theming rules

- **Never hardcode color values** (hex, rgb, hsl) in components — always use CSS variables (`--primary`, `--background`, etc.) or Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`)
- Use `brand-*` classes for the app identity color; these map to CSS variables in `tailwind.config.js`
- Use shadcn/ui semantic colors (`primary`, `secondary`, `muted`, `destructive`, `accent`) for UI elements
- Fonts must use CSS variable `--font-sans` — never hardcode font-family
- Theme preference (light/dark) is stored in localStorage (`theme` key)
- All theming is centralized in `src/app/globals.css` (CSS variables) and `tailwind.config.js` (Tailwind mappings) — changing theme = changing these two files only

### Localization readiness

- Keep UI strings simple and extractable — avoid embedding variables inside translated text (e.g., use `{count} items` not `"You have " + count + " items in your list"`)
- Don't concatenate UI strings across JSX elements
- Use complete sentences/phrases as string values (easier to translate than fragments)
- When localization is added, strings will move to `src/messages/en.json` and use `next-intl` — keeping strings clean now makes that migration straightforward

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build (includes PWA service worker) |
| `npm run build:android` | Capacitor Android build (static export + sync) |
| `npm run open:android` | Open Android project in Android Studio |
| `npm run lint` | Run ESLint via Next.js |
| `npm test` | Run Vitest unit tests (128 tests) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

## Repository Structure

```
meal-planner/
├── .github/
│   ├── copilot-instructions.md   ← You are here
│   └── instructions/             ← Scoped Copilot instructions
│       ├── nextjs.instructions.md
│       ├── playwright.instructions.md
│       ├── tailwindcss.instructions.md
│       └── vitest.instructions.md
├── INSTRUCTIONS.md               ← Detailed project docs
├── README.md
├── next.config.js                ← Next.js config (next-intl + next-pwa plugins)
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── public/
│   ├── manifest.json             ← PWA manifest
│   └── icons/                    ← PWA app icons (SVG)
├── src/
│   ├── app/                      ← Next.js App Router pages & layouts
│   │   ├── layout.tsx            ← Root layout (PWA meta tags, i18n provider)
│   │   ├── page.tsx              ← Dashboard / home
│   │   ├── globals.css
│   │   ├── meal-plan/page.tsx
│   │   ├── recipes/page.tsx
│   │   ├── recipes/edit/[id]/    ← Recipe edit page
│   │   ├── inventory/page.tsx
│   │   ├── shopping-list/page.tsx
│   │   ├── settings/page.tsx     ← Export/import backup
│   │   └── cook/[id]/page.tsx    ← Cook Mode
│   ├── components/
│   │   ├── Navigation/Navigation.tsx
│   │   └── RecipeForm/RecipeForm.tsx ← Shared recipe create/edit form
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── types.ts              ← Shared TypeScript domain types
│   │   ├── data-service.ts       ← Data abstraction layer (CRUD, export/import)
│   │   ├── deduction-utils.ts    ← Unit conversion + inventory deduction
│   │   ├── shopping-utils.ts     ← Shopping list generation
│   │   ├── notification-utils.ts ← Notification generator
│   │   ├── date-utils.ts         ← Date helpers (getMondayOf, getWeekDates)
│   │   ├── inventory-utils.ts    ← Expiry helpers (isExpired, isNearExpiry)
│   │   ├── meal-utils.ts         ← Meal helpers (getRecipeForMeal, etc.)
│   │   └── use-units.ts          ← Centralized unit translation hook
│   ├── messages/
│   │   ├── en.json               ← English translations
│   │   └── zh-CN.json            ← Simplified Chinese translations
│   └── i18n.ts                   ← next-intl locale config
├── tests/                        ← Vitest unit tests (123 tests)
│   ├── setup.ts
│   ├── lib/
│   ├── hooks/
│   ├── components/
│   └── pages/
└── e2e/                          ← Playwright E2E tests
    ├── navigation.spec.ts
    ├── inventory.spec.ts
    ├── shopping-list.spec.ts
    ├── recipes.spec.ts
    └── meal-plan.spec.ts
```
