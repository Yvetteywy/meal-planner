import type { AppNotification, InventoryItem, Meal, Recipe } from "./types";
import { isExpired, isNearExpiry } from "./inventory-utils";

/**
 * Generates notifications by scanning inventory and meals.
 * Merges with existing notifications to preserve read/dismissed state.
 */
export function generateNotifications(
  existingNotifications: AppNotification[],
  inventory: InventoryItem[],
  meals: Meal[],
  recipes: Recipe[]
): AppNotification[] {
  const now = new Date();
  const generated: AppNotification[] = [];
  const existingIds = new Set(existingNotifications.map((n) => n.id));

  // 1. Expiry alerts for inventory items
  for (const item of inventory) {
    if (!item.expiresAt || item.quantity === 0) continue;

    const expired = isExpired(item.expiresAt);
    const nearExpiry = !expired && isNearExpiry(item.expiresAt);

    if (expired) {
      const id = `expiry-expired-${item.id}`;
      if (!existingIds.has(id)) {
        generated.push({
          id,
          type: "expiry-alert",
          title: "Expired",
          message: `${item.name} (${item.quantity} ${item.unit}) has expired`,
          createdAt: now.toISOString(),
          read: false,
          dismissed: false,
          inventoryItemId: item.id,
        });
      }
    } else if (nearExpiry) {
      const id = `expiry-soon-${item.id}`;
      if (!existingIds.has(id)) {
        const expiryDate = new Date(item.expiresAt);
        const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        generated.push({
          id,
          type: "expiry-alert",
          title: "Expiring soon",
          message: `${item.name} (${item.quantity} ${item.unit}) expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
          createdAt: now.toISOString(),
          read: false,
          dismissed: false,
          inventoryItemId: item.id,
        });
      }
    }
  }

  // 2. Rating reminders for cooked meals that haven't been rated
  for (const meal of meals) {
    if (meal.status !== "cooked" || meal.rated) continue;

    const id = `rating-${meal.id}`;
    if (existingIds.has(id)) continue;

    const recipe = meal.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
    const mealName = meal.customTitle || recipe?.title || "your meal";

    generated.push({
      id,
      type: "rating-reminder",
      title: "Rate your meal",
      message: `How was the ${mealName}?`,
      createdAt: meal.cookedAt || now.toISOString(),
      read: false,
      dismissed: false,
      recipeId: meal.recipeId,
      mealId: meal.id,
    });
  }

  // 3. Meal reminders for today's planned meals
  const todayStr = toLocalDateString(now);
  for (const meal of meals) {
    if (meal.date !== todayStr || meal.status !== "planned") continue;

    const id = `meal-today-${meal.id}`;
    if (existingIds.has(id)) continue;

    const recipe = meal.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
    const mealName = meal.customTitle || recipe?.title || "a meal";

    generated.push({
      id,
      type: "meal-reminder",
      title: `${meal.slot} today`,
      message: `You have ${mealName} planned for ${meal.slot.toLowerCase()} today`,
      createdAt: now.toISOString(),
      read: false,
      dismissed: false,
      mealId: meal.id,
      recipeId: meal.recipeId,
    });
  }

  // Merge: keep existing (preserving read/dismissed state) + add new
  return [...existingNotifications, ...generated];
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
