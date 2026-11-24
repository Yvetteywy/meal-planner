---
description: 'Tailwind CSS v3 styling patterns and brand theme guidelines'
applyTo: '**/*.{tsx,css}'
---

# Tailwind CSS Instructions

## Configuration

This project uses Tailwind CSS v3 configured in `tailwind.config.js`.

### Content paths

Tailwind scans these directories for class names:

- `src/pages/**/*.{ts,tsx}`
- `src/components/**/*.{ts,tsx}`
- `src/app/**/*.{ts,tsx}`

### Global CSS

Import Tailwind directives in `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Brand Theme

The project uses a custom green-based `brand` colour palette defined in `tailwind.config.js`:

- Primary actions: `bg-brand-600`, `hover:bg-brand-700`
- Active/highlighted: `bg-brand-50`, `text-brand-700`
- Accent text: `text-brand-600`

### Light Theme Palette

- Backgrounds: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Text: `text-gray-900` (primary), `text-gray-500` (secondary), `text-gray-400` (muted)
- Borders: `border-gray-200`, `border-gray-100`

### Status Colours

- Expired / danger: `border-red-200`, `text-red-500`, `text-red-400`
- Near-expiry / warning: `border-amber-200`, `text-amber-500`, `text-amber-400`
- Success / brand: `text-brand-600`, `bg-brand-600`

## Common UI Patterns

### Cards and containers

```
bg-white rounded-2xl border border-gray-200 shadow-sm p-5
```

### Buttons (primary)

```
bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors
```

### Buttons (secondary / ghost)

```
px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors
```

### Form inputs

```
w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400
```

### Filter pills (active / inactive)

```
px-3 py-1 rounded-full text-xs font-medium bg-brand-600 text-white     /* active */
px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600   /* inactive */
```

## Responsive Design

- Mobile-first approach
- Use responsive prefixes: `sm:`, `md:`, `lg:`
- Navigation: desktop top bar + mobile bottom bar (hidden with `hidden sm:flex` / `flex sm:hidden`)
- Grid layouts: `grid-cols-1 sm:grid-cols-2`

## Best Practices

- Prefer utility classes over custom CSS
- Use `transition-colors` for hover/focus state changes
- Use `space-y-*` and `gap-*` for consistent spacing
- Keep utility combinations readable — group by layout, spacing, colour, typography
- Use `truncate` and `min-w-0` for text overflow in flex containers
