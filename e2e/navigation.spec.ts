import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page loads with hero heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Plan smarter,")).toBeVisible();
  });

  test("can navigate to all main pages", async ({ page }) => {
    await page.goto("/");

    // Navigate to Meal Plan
    await page.getByRole("link", { name: /Meal Plan/ }).first().click();
    await expect(page.getByRole("heading", { name: "Meal Plan" })).toBeVisible();

    // Navigate to Recipes
    await page.getByRole("link", { name: /Recipes/ }).first().click();
    await expect(page.getByRole("heading", { name: "Recipes" })).toBeVisible();

    // Navigate to Inventory
    await page.getByRole("link", { name: /Inventory/ }).first().click();
    await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();

    // Navigate to Shopping List
    await page.getByRole("link", { name: /Shopping List/ }).first().click();
    await expect(page.getByRole("heading", { name: "Shopping List" })).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole("link", { name: /Dashboard/ }).first().click();
    await expect(page.getByText("Plan smarter,")).toBeVisible();
  });
});
