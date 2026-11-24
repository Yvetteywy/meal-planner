import { describe, it, expect, beforeEach } from "vitest";
import { dataService, migrateIfNeeded } from "@/lib/data-service";
import type { Recipe, Meal, InventoryItem, ShoppingListItem } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
});

describe("dataService.recipes", () => {
  it("returns sample recipes when localStorage is empty", () => {
    const recipes = dataService.recipes.getAll();
    expect(recipes.length).toBeGreaterThan(0);
    expect(recipes[0].title).toBe("Garlic Butter Pasta");
  });

  it("saves and retrieves a new recipe", () => {
    const recipe: Recipe = {
      id: "test-1",
      title: "Test Recipe",
      description: "Test",
      ingredients: [{ name: "flour", quantity: 200, unit: "g" }],
      instructions: ["Mix"],
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 2,
      tags: ["test"],
      source: "manual",
      createdAt: new Date().toISOString(),
      version: 1,
    };
    dataService.recipes.save(recipe);
    const found = dataService.recipes.getById("test-1");
    expect(found).toBeDefined();
    expect(found!.title).toBe("Test Recipe");
  });

  it("updates an existing recipe", () => {
    const recipes = dataService.recipes.getAll();
    const updated = { ...recipes[0], title: "Updated Title" };
    dataService.recipes.save(updated);
    expect(dataService.recipes.getById(recipes[0].id)!.title).toBe("Updated Title");
  });

  it("deletes a recipe", () => {
    const recipes = dataService.recipes.getAll();
    const id = recipes[0].id;
    dataService.recipes.delete(id);
    expect(dataService.recipes.getById(id)).toBeUndefined();
  });

  it("getById returns undefined for non-existent id", () => {
    expect(dataService.recipes.getById("non-existent")).toBeUndefined();
  });
});

describe("dataService.meals", () => {
  const meal: Meal = {
    id: "meal-1",
    date: "2026-04-10",
    slot: "Dinner",
    recipeId: "sample-1",
    servings: 2,
    status: "planned",
    rated: false,
  };

  it("starts with empty meals", () => {
    expect(dataService.meals.getAll()).toHaveLength(0);
  });

  it("saves and retrieves a meal", () => {
    dataService.meals.save(meal);
    const all = dataService.meals.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].slot).toBe("Dinner");
  });

  it("updates an existing meal", () => {
    dataService.meals.save(meal);
    dataService.meals.save({ ...meal, status: "cooked" });
    expect(dataService.meals.getById("meal-1")!.status).toBe("cooked");
    expect(dataService.meals.getAll()).toHaveLength(1); // no duplicate
  });

  it("deletes a meal", () => {
    dataService.meals.save(meal);
    dataService.meals.delete("meal-1");
    expect(dataService.meals.getAll()).toHaveLength(0);
  });

  it("saveAll replaces all meals", () => {
    dataService.meals.save(meal);
    dataService.meals.saveAll([{ ...meal, id: "meal-2" }]);
    expect(dataService.meals.getAll()).toHaveLength(1);
    expect(dataService.meals.getAll()[0].id).toBe("meal-2");
  });
});

describe("dataService.inventory", () => {
  const item: InventoryItem = {
    id: "inv-1",
    name: "Eggs",
    quantity: 12,
    unit: "piece",
    category: "Dairy",
    addedAt: new Date().toISOString(),
    source: "manual",
  };

  it("starts with empty inventory", () => {
    expect(dataService.inventory.getAll()).toHaveLength(0);
  });

  it("saves and retrieves an item", () => {
    dataService.inventory.save(item);
    expect(dataService.inventory.getAll()).toHaveLength(1);
    expect(dataService.inventory.getAll()[0].name).toBe("Eggs");
  });

  it("updates quantity", () => {
    dataService.inventory.save(item);
    dataService.inventory.save({ ...item, quantity: 6 });
    expect(dataService.inventory.getAll()[0].quantity).toBe(6);
    expect(dataService.inventory.getAll()).toHaveLength(1);
  });

  it("deletes an item", () => {
    dataService.inventory.save(item);
    dataService.inventory.delete("inv-1");
    expect(dataService.inventory.getAll()).toHaveLength(0);
  });
});

describe("dataService.shoppingList", () => {
  const item: ShoppingListItem = {
    id: "shop-1",
    name: "Milk",
    quantity: 1,
    unit: "l",
    category: "Dairy",
    checked: false,
    addedAt: new Date().toISOString(),
    source: "manual",
  };

  it("starts with empty list", () => {
    expect(dataService.shoppingList.getAll()).toHaveLength(0);
  });

  it("saves and retrieves an item", () => {
    dataService.shoppingList.save(item);
    expect(dataService.shoppingList.getAll()).toHaveLength(1);
  });

  it("toggles checked state", () => {
    dataService.shoppingList.save(item);
    dataService.shoppingList.save({ ...item, checked: true });
    expect(dataService.shoppingList.getAll()[0].checked).toBe(true);
  });

  it("deletes an item", () => {
    dataService.shoppingList.save(item);
    dataService.shoppingList.delete("shop-1");
    expect(dataService.shoppingList.getAll()).toHaveLength(0);
  });
});

describe("dataService.mealSlots", () => {
  it("returns default slots when empty", () => {
    const slots = dataService.mealSlots.getAll();
    expect(slots).toEqual(["Breakfast", "Lunch", "Dinner", "Snack"]);
  });

  it("saves custom slots", () => {
    dataService.mealSlots.saveAll(["Brunch", "Dinner", "Kids Snack"]);
    expect(dataService.mealSlots.getAll()).toEqual(["Brunch", "Dinner", "Kids Snack"]);
  });
});

describe("dataService.exportAll", () => {
  it("exports all data as JSON string", () => {
    dataService.inventory.save({
      id: "inv-1", name: "Eggs", quantity: 12, unit: "piece",
      category: "Dairy", addedAt: new Date().toISOString(), source: "manual",
    });

    const json = dataService.exportAll();
    const parsed = JSON.parse(json);

    expect(parsed.version).toBe(2);
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.data.recipes.length).toBeGreaterThan(0);
    expect(parsed.data.inventory).toHaveLength(1);
    expect(parsed.data.meals).toHaveLength(0);
    expect(parsed.data.mealSlots).toEqual(["Breakfast", "Lunch", "Dinner", "Snack"]);
  });
});

describe("dataService.importAll", () => {
  it("restores exported data", () => {
    // Set up some data
    dataService.inventory.save({
      id: "inv-1", name: "Eggs", quantity: 12, unit: "piece",
      category: "Dairy", addedAt: new Date().toISOString(), source: "manual",
    });
    const exported = dataService.exportAll();

    // Clear everything
    localStorage.clear();
    expect(dataService.inventory.getAll()).toHaveLength(0);

    // Restore
    const result = dataService.importAll(exported);
    expect(result.success).toBe(true);
    expect(dataService.inventory.getAll()).toHaveLength(1);
    expect(dataService.inventory.getAll()[0].name).toBe("Eggs");
  });

  it("restores recipes, meals, and shopping list", () => {
    const backup = JSON.stringify({
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        recipes: [{ id: "r1", title: "Test", description: "", ingredients: [], instructions: [], prepTimeMinutes: 0, cookTimeMinutes: 0, servings: 2, tags: [], source: "manual", createdAt: new Date().toISOString(), version: 1 }],
        meals: [{ id: "m1", date: "2026-04-10", slot: "Dinner", recipeId: "r1", servings: 2, status: "planned", rated: false }],
        inventory: [],
        shoppingList: [{ id: "s1", name: "Milk", quantity: 1, unit: "l", category: "Dairy", checked: false, addedAt: new Date().toISOString() }],
        mealSlots: ["Breakfast", "Dinner"],
        notifications: [],
      },
    });

    const result = dataService.importAll(backup);
    expect(result.success).toBe(true);
    expect(dataService.recipes.getAll().find(r => r.id === "r1")).toBeDefined();
    expect(dataService.meals.getAll()).toHaveLength(1);
    expect(dataService.shoppingList.getAll()).toHaveLength(1);
    expect(dataService.mealSlots.getAll()).toEqual(["Breakfast", "Dinner"]);
  });

  it("rejects invalid JSON", () => {
    const result = dataService.importAll("not json");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid JSON");
  });

  it("rejects missing version/data", () => {
    const result = dataService.importAll(JSON.stringify({ foo: "bar" }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid backup format");
  });

  it("round-trips: export then import produces identical data", () => {
    dataService.meals.save({
      id: "m1", date: "2026-04-10", slot: "Lunch", recipeId: "sample-1",
      servings: 4, status: "planned", rated: false,
    });
    dataService.inventory.save({
      id: "inv-1", name: "Rice", quantity: 500, unit: "g",
      category: "Grains", addedAt: new Date().toISOString(), source: "manual",
    });

    const exported = dataService.exportAll();
    localStorage.clear();
    dataService.importAll(exported);

    const reExported = dataService.exportAll();
    const orig = JSON.parse(exported);
    const restored = JSON.parse(reExported);

    expect(restored.data.recipes).toEqual(orig.data.recipes);
    expect(restored.data.meals).toEqual(orig.data.meals);
    expect(restored.data.inventory).toEqual(orig.data.inventory);
    expect(restored.data.mealSlots).toEqual(orig.data.mealSlots);
  });
});
