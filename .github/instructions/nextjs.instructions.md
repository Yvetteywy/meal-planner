---
description: 'Next.js App Router patterns for pages, layouts, and components'
applyTo: 'src/**/*.{ts,tsx}'
---

# Next.js Instructions

## App Router Structure

This project uses the Next.js 15 App Router with the `src/app/` directory.

### Pages

- Create pages in `src/app/<route>/page.tsx`
- File-based routing: `src/app/recipes/page.tsx` → `/recipes`
- Each page is a Server Component by default

### Layouts

- Root layout in `src/app/layout.tsx` wraps all pages with `<Navigation />` and global CSS
- Use `layout.tsx` files in route directories for nested layouts

### Client Components

Add `"use client"` at the top of a file only when the component needs:

- React hooks (`useState`, `useEffect`, etc.)
- Browser APIs (`localStorage`, `window`, etc.)
- Event handlers (`onClick`, `onChange`, etc.)

### Example Page

```tsx
"use client";

import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { SomeType } from "@/lib/types";

export default function MyPage() {
  const [items, setItems] = useLocalStorage<SomeType[]>("my-key", []);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
      {/* ... */}
    </div>
  );
}
```

## Import Aliases

Use the `@/*` path alias (mapped to `./src/*`):

```tsx
import { Recipe } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { getMondayOf } from "@/lib/date-utils";
```

## Data Layer

- **Current (MVP):** All persistence uses `useLocalStorage` hook — no backend required
- Types are defined in `src/lib/types.ts` and shared across all pages
- Pure utility functions live in `src/lib/` (e.g., `date-utils.ts`, `inventory-utils.ts`)
- Keep UI components data-layer agnostic — they depend only on the type contracts

## Best Practices

- Keep Server Components as the default; only add `"use client"` when required
- Extract reusable logic into custom hooks (`src/hooks/`) or utility modules (`src/lib/`)
- Co-locate related tests in `tests/` mirroring the source structure
- Use TypeScript strict mode — all exports should have explicit types
