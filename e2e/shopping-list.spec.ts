import { test, expect } from "@playwright/test";

test.describe("Shopping List page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/shopping-list");
  });

  test("shows empty state message", async ({ page }) => {
    await expect(page.getByText("Your shopping list is empty")).toBeVisible();
  });

  test("can add a shopping list item", async ({ page }) => {
    await page.getByRole("button", { name: /Add Item/ }).click();
    await page.getByPlaceholder("e.g. Eggs").fill("Bananas");
    await page.getByPlaceholder("0").fill("6");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Bananas")).toBeVisible();
    await expect(page.getByText("6 piece")).toBeVisible();
  });

  test("can check off and uncheck an item", async ({ page }) => {
    // Add an item
    await page.getByRole("button", { name: /Add Item/ }).click();
    await page.getByPlaceholder("e.g. Eggs").fill("Bread");
    await page.getByPlaceholder("0").fill("1");
    await page.getByRole("button", { name: "Save" }).click();

    // Check it off
    await page.getByRole("button", { name: /Mark as picked up/ }).click();
    await expect(page.getByText("Picked up (1)")).toBeVisible();

    // Uncheck it
    await page.getByRole("button", { name: /Mark as needed/ }).click();
    await expect(page.getByText("Picked up")).not.toBeVisible();
  });

  test("can clear all checked items", async ({ page }) => {
    // Add two items
    await page.getByRole("button", { name: /Add Item/ }).click();
    await page.getByPlaceholder("e.g. Eggs").fill("Apples");
    await page.getByPlaceholder("0").fill("5");
    await page.getByRole("button", { name: "Save" }).click();

    await page.getByRole("button", { name: /Add Item/ }).click();
    await page.getByPlaceholder("e.g. Eggs").fill("Oranges");
    await page.getByPlaceholder("0").fill("3");
    await page.getByRole("button", { name: "Save" }).click();

    // Check both off
    const checkButtons = page.getByRole("button", { name: /Mark as picked up/ });
    await checkButtons.first().click();
    await checkButtons.first().click();

    // Clear all checked
    await page.getByRole("button", { name: /Clear all/ }).click();
    await expect(page.getByText("Apples")).not.toBeVisible();
    await expect(page.getByText("Oranges")).not.toBeVisible();
  });
});
