import { test, expect } from "@playwright/test";

test.describe("Meal Plan page", () => {
  test("shows the weekly calendar grid", async ({ page }) => {
    await page.goto("/meal-plan");
    await expect(page.getByRole("heading", { name: "Meal Plan" })).toBeVisible();

    // Check day labels are visible
    await expect(page.getByText("Mon")).toBeVisible();
    await expect(page.getByText("Sun")).toBeVisible();

    // Check meal slot labels are visible
    await expect(page.getByText("breakfast")).toBeVisible();
    await expect(page.getByText("dinner")).toBeVisible();
  });

  test("can navigate between weeks", async ({ page }) => {
    await page.goto("/meal-plan");

    // Get current week label
    const weekLabel = page.locator("text=/\\w+ \\d+ – \\w+ \\d+/");
    const firstWeek = await weekLabel.textContent();

    // Go to next week
    await page.getByRole("button", { name: "Next week" }).click();
    const secondWeek = await weekLabel.textContent();
    expect(secondWeek).not.toBe(firstWeek);

    // Go back to previous week
    await page.getByRole("button", { name: "Previous week" }).click();
    const backToFirst = await weekLabel.textContent();
    expect(backToFirst).toBe(firstWeek);
  });
});
