import { test, expect } from "@playwright/test";

test.describe("Inventory page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
  });

  test("shows empty state message", async ({ page }) => {
    await expect(page.getByText("Your pantry is empty")).toBeVisible();
  });

  test("can add an inventory item", async ({ page }) => {
    // Open the add form
    await page.getByRole("button", { name: /Add Item/ }).click();
    await expect(page.getByText("New Inventory Item")).toBeVisible();

    // Fill in the form
    await page.getByPlaceholder("e.g. Chicken breast").fill("Eggs");
    await page.getByPlaceholder("0").fill("12");

    // Submit
    await page.getByRole("button", { name: "Save" }).click();

    // Verify item appears
    await expect(page.getByText("Eggs")).toBeVisible();
    await expect(page.getByText("12 piece")).toBeVisible();
  });

  test("can remove an inventory item", async ({ page }) => {
    // Add an item first
    await page.getByRole("button", { name: /Add Item/ }).click();
    await page.getByPlaceholder("e.g. Chicken breast").fill("Milk");
    await page.getByPlaceholder("0").fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Milk")).toBeVisible();

    // Remove it
    await page.getByRole("button", { name: /Remove Milk/ }).click();
    await expect(page.getByText("Milk")).not.toBeVisible();
  });

  test("can cancel adding an item", async ({ page }) => {
    await page.getByRole("button", { name: /Add Item/ }).click();
    await expect(page.getByText("New Inventory Item")).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("New Inventory Item")).not.toBeVisible();
  });
});
