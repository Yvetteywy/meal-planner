---
description: 'Playwright E2E test patterns and best practices'
applyTo: 'e2e/**/*.spec.ts'
---

# Playwright Test Instructions

## Code Quality Standards

- **Locators**: Prioritize user-facing, role-based locators (`getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`) for resilience and accessibility. Use `test.step()` to group interactions in complex tests.
- **Timeouts**: Rely solely on Playwright's built-in auto-waiting. NEVER use hard-coded waits such as `waitForTimeout` or increased default timeouts.
- **Assertions**: Use auto-retrying web-first assertions with `await` (e.g., `await expect(locator).toHaveText()`). Prefer `toBeVisible()` only when specifically testing visibility changes.
- **Strict mode**: When a locator matches multiple elements, narrow it with `.first()`, `getByRole`, or a more specific selector to avoid strict mode violations.

## Test Structure

- **Imports**: Start with `import { test, expect } from "@playwright/test";`
- **Organization**: Group related tests under a `test.describe()` block
- **Hooks**: Use `test.beforeEach` for setup actions common to all tests in a describe block (e.g., navigating to a page)
- **Titles**: Use clear, descriptive names: `"can add an inventory item"`, `"shows empty state message"`

## File Organization

- **Location**: All E2E tests live in the `e2e/` directory
- **Naming**: `<feature-or-page>.spec.ts` (e.g., `inventory.spec.ts`, `recipes.spec.ts`)
- **Scope**: One test file per major page or feature

## Assertion Best Practices

- **Element presence**: Use `toBeVisible()` or `toHaveCount()`
- **Text content**: Use `toHaveText()` for exact matches, `toContainText()` for partial matches
- **Navigation**: Use `toHaveURL()` to verify URL after navigation
- **Negation**: Use `not.toBeVisible()` to verify elements are hidden

## Example Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("Inventory page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
  });

  test("can add an inventory item", async ({ page }) => {
    await test.step("Open the add form", async () => {
      await page.getByRole("button", { name: /Add Item/ }).click();
      await expect(page.getByText("New Inventory Item")).toBeVisible();
    });

    await test.step("Fill in and submit the form", async () => {
      await page.getByPlaceholder("e.g. Chicken breast").fill("Eggs");
      await page.getByPlaceholder("0").fill("12");
      await page.getByRole("button", { name: "Save" }).click();
    });

    await test.step("Verify item appears", async () => {
      await expect(page.getByText("Eggs")).toBeVisible();
    });
  });
});
```

## Test Execution

1. Ensure the dev server is running (`npm run dev`) or let Playwright start it automatically via the `webServer` config in `playwright.config.ts`
2. Run tests: `npm run test:e2e`
3. Debug failures: `npx playwright test --debug`
4. View report: `npx playwright show-report`

## Configuration

- Config file: `playwright.config.ts`
- Browser: Chromium only (add more in `projects` if needed)
- Base URL: `http://localhost:3000`
- Web server: auto-starts `npm run dev` if not already running

## Quality Checklist

Before finalizing tests, ensure:

- [ ] All locators are accessible and specific (no strict mode violations)
- [ ] Tests are grouped logically under `test.describe()`
- [ ] Assertions reflect real user expectations
- [ ] No hard-coded waits or sleeps
- [ ] Tests pass consistently on repeated runs
