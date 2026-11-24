import { afterEach, describe, expect, it, vi } from "vitest";

const target = "NEXT_PUBLIC_MEAL_PLANNER_TARGET";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("recipe links", () => {
  it.each([undefined, "android"])("keeps existing routes for target %s", async (value) => {
    vi.stubEnv(target, value);
    const { recipeHref } = await import("@/lib/recipe-href");
    expect(recipeHref("detail", "sample-1")).toBe("/recipes/sample-1");
    expect(recipeHref("edit", "sample-1", { newVersion: true })).toBe("/recipes/edit/sample-1?newVersion=true");
    expect(recipeHref("cook", "sample-1", { servings: 3, mealId: "meal-1" })).toBe("/cook/sample-1?servings=3&mealId=meal-1");
  });

  it("uses bundled routes and encodes recipe and meal IDs on iOS", async () => {
    vi.stubEnv(target, "ios");
    const { recipeHref } = await import("@/lib/recipe-href");
    expect(recipeHref("detail", "recipe/1", { servings: 3 })).toBe("/recipes/detail/?id=recipe%2F1&servings=3");
    expect(recipeHref("edit", "recipe/1", { newVersion: true })).toBe("/recipes/edit/?id=recipe%2F1&newVersion=true");
    expect(recipeHref("cook", "recipe/1", { servings: 3, mealId: "meal&1" })).toBe("/cook/session/?id=recipe%2F1&servings=3&mealId=meal%261");
  });
});