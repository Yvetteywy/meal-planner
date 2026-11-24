---
description: 'Vitest unit test patterns and best practices'
applyTo: 'tests/**/*.test.{ts,tsx}'
---

# Vitest Unit Test Instructions

## Configuration

- Config file: `vitest.config.ts`
- Test environment: `jsdom`
- Setup file: `tests/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Globals mode enabled — `describe`, `it`, `expect`, `vi` are available without imports

## Test Structure

- **Imports**: Import from `vitest` and `@testing-library/react` as needed
- **Organization**: Group related tests under `describe()` blocks
- **Naming**: Use clear descriptions: `"returns the previous Monday for a Sunday"`

### Example: Pure function test

```typescript
import { describe, it, expect } from "vitest";
import { isExpired } from "@/lib/inventory-utils";

describe("isExpired", () => {
  const now = new Date("2026-04-07T12:00:00Z");

  it("returns false when no expiry date is provided", () => {
    expect(isExpired(undefined, now)).toBe(false);
  });

  it("returns true when the expiry date is in the past", () => {
    expect(isExpired("2026-04-06", now)).toBe(true);
  });
});
```

### Example: React component test

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

describe("HomePage", () => {
  it("renders the hero heading", () => {
    render(<HomePage />);
    expect(screen.getByText(/Plan smarter/)).toBeInTheDocument();
  });
});
```

### Example: Hook test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => localStorage.clear());

  it("persists updates", () => {
    const { result } = renderHook(() => useLocalStorage("key", 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem("key")!)).toBe(42);
  });
});
```

## File Organization

- **Location**: All unit tests in `tests/` at the project root, mirroring the source structure
- **Naming**: `<module>.test.ts` or `<component>.test.tsx`
- **Structure**:
  - `tests/lib/` — tests for `src/lib/` utilities
  - `tests/hooks/` — tests for `src/hooks/`
  - `tests/components/` — tests for `src/components/`
  - `tests/pages/` — tests for page components

## Best Practices

- **Timezone safety**: Use `new Date(year, month, day)` (local dates) instead of `new Date("YYYY-MM-DD")` (UTC midnight) to avoid timezone-shift bugs in date tests
- **Mocking**: Mock Next.js modules (`next/link`, `next/navigation`) when testing components that depend on them
- **Deterministic time**: Pass a `now` parameter to time-dependent functions instead of relying on `Date.now()`
- **Isolation**: Clear shared state (e.g., `localStorage.clear()`) in `beforeEach`
- **Assertions**: Use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveTextContent`) for DOM assertions

## Test Execution

| Command | Description |
|---|---|
| `npm test` | Run all unit tests once |
| `npm run test:watch` | Run in watch mode (re-runs on file changes) |
| `npx vitest run --reporter=verbose` | Verbose output with individual test names |
