import { test, expect } from "@playwright/test";

test.describe("Recipes page", () => {
  test("shows sample recipes on first load", async ({ page }) => {
    await page.goto("/recipes");
    await expect(page.getByRole("heading", { name: "Garlic Butter Pasta" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chicken Stir-Fry" })).toBeVisible();
  });

  test("can search recipes by title", async ({ page }) => {
    await page.goto("/recipes");
    await page.getByPlaceholder(/Search recipes/).fill("pasta");

    await expect(page.getByRole("heading", { name: "Garlic Butter Pasta" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Chicken Stir-Fry" })).not.toBeVisible();
  });

  test("can search recipes by tag", async ({ page }) => {
    await page.goto("/recipes");
    await page.getByPlaceholder(/Search recipes/).fill("healthy");

    await expect(page.getByRole("heading", { name: "Chicken Stir-Fry" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Garlic Butter Pasta" })).not.toBeVisible();
  });

  test("shows empty state when no recipes match", async ({ page }) => {
    await page.goto("/recipes");
    await page.getByPlaceholder(/Search recipes/).fill("nonexistent xyz");

    await expect(page.getByText("No recipes found")).toBeVisible();
  });
});
