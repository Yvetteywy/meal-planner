"use client";

import { recipeHref } from "@/lib/recipe-href";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  Users,
  X,
  ChefHat,
  Pencil,
  History,
  ShoppingCart,
  Play,
  Check,
  Trash2,
  SkipForward,
} from "lucide-react";
import { Meal, Recipe } from "@/lib/types";
import { useTranslations } from "next-intl";
import { dataService } from "@/lib/data-service";
import { getMondayOf, getWeekDates } from "@/lib/date-utils";
import { deductIngredients } from "@/lib/deduction-utils";
import { generateShoppingList } from "@/lib/shopping-utils";
import { getMealIngredients } from "@/lib/meal-utils";


/** Format a Date as YYYY-MM-DD in local timezone (not UTC) */
function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface AddMealModalProps {
  date: Date;
  slot: string;
  onClose: () => void;
  onMealAdded: () => void;
}

function AddMealModal({ date: initialDate, slot: initialSlot, onClose, onMealAdded }: AddMealModalProps) {
  const t = useTranslations("mealPlan.addMealModal");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<"recipe" | "custom">("recipe");
  const [searchQuery, setSearchQuery] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(toLocalDateString(initialDate));
  const [selectedSlot, setSelectedSlot] = useState(initialSlot);
  const [pickedRecipe, setPickedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(2);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealSlots, setMealSlots] = useState<string[]>([]);
  useEffect(() => {
    setRecipes(dataService.recipes.getAll());
    setMealSlots(dataService.mealSlots.getAll());
  }, []);

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">{t("title")}</h2>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400 capitalize"
              >
                {mealSlots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("recipe")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "recipe"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            {t("tabRecipe")}
          </button>
          <button
            onClick={() => setActiveTab("custom")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "custom"
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Pencil className="w-4 h-4" />
            {t("tabCustom")}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {pickedRecipe ? (
            /* Serving size confirmation */
            <div className="space-y-4">
              <div className="bg-brand-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900">{pickedRecipe.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{pickedRecipe.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("servingsLabel")}</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => { const v = parseInt(e.target.value); if (v >= 1) setServings(v); }}
                    className="w-16 h-9 text-center text-sm font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg font-bold transition-colors"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-400">
                    ({t("recipeDefault", { count: pickedRecipe.servings })})
                  </span>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setPickedRecipe(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {tCommon("back")}
                </button>
                <button
                  onClick={() => {
                    const meal: Meal = {
                      id: crypto.randomUUID(),
                      date: selectedDate,
                      slot: selectedSlot,
                      recipeId: pickedRecipe.id,
                      servings,
                      status: "planned",
                      rated: false,
                    };
                    dataService.meals.save(meal);
                    onMealAdded();
                    onClose();
                  }}
                  className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors font-medium"
                >
                  {t("title")}
                </button>
              </div>
            </div>
          ) : activeTab === "recipe" ? (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                  autoFocus
                />
              </div>

              {/* Recipe list */}
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  No recipes found
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => {
                        setPickedRecipe(recipe);
                        setServings(recipe.servings);
                      }}
                      className="w-full text-left bg-gray-50 hover:bg-brand-50 hover:border-brand-200 border border-gray-200 rounded-xl p-3 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm group-hover:text-brand-700 transition-colors">
                            {recipe.title}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {recipe.description}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.prepTimeMinutes + recipe.cookTimeMinutes}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {recipe.servings}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-white text-gray-400 px-2 py-0.5 rounded-full border border-gray-100"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Custom meal tab */
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("customTitle")}
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={t("customTitlePlaceholder")}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t("notesLabel")}
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
              <p className="text-xs text-gray-400">
                💡 {t("customHint")}
              </p>
            </div>
          )}
        </div>

        {/* Footer (only for custom tab) */}
        {activeTab === "custom" && (
          <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={() => {
                if (!customTitle.trim()) return;
                const meal: Meal = {
                  id: crypto.randomUUID(),
                  date: selectedDate,
                  slot: selectedSlot,
                  customTitle: customTitle.trim(),
                  servings: 1,
                  notes: customNotes.trim() || undefined,
                  status: "planned",
                  rated: false,
                };
                dataService.meals.save(meal);
                onMealAdded();
                onClose();
              }}
              disabled={!customTitle.trim()}
              className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {t("title")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MealPlanPage() {
  const t = useTranslations("mealPlan");
  const tActions = useTranslations("mealPlan.actions");
  const tToasts = useTranslations("mealPlan.toasts");
  const tCommon = useTranslations("common");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealSlots, setMealSlots] = useState<string[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [modalTarget, setModalTarget] = useState<{
    date: Date;
    slot: string;
  } | null>(null);

  useEffect(() => {
    setMeals(dataService.meals.getAll());
    setMealSlots(dataService.mealSlots.getAll());
  }, []);

  const today = new Date();
  const monday = getMondayOf(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(monday);

  const weekLabel = `${weekDates[0].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${weekDates[6].toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  const [toast, setToast] = useState<string | null>(null);

  const getMealsFor = (date: Date, slot: string): Meal[] => {
    const iso = toLocalDateString(date);
    return meals.filter((m) => m.date === iso && m.slot === slot);
  };

  const handleMarkCooked = (meal: Meal) => {
    const recipes = dataService.recipes.getAll();
    const ingredients = getMealIngredients(meal, recipes);
    const inventory = dataService.inventory.getAll();
    const multiplier = meal.recipeId
      ? meal.servings / (recipes.find((r) => r.id === meal.recipeId)?.servings ?? meal.servings)
      : 1;

    const { updated, log } = deductIngredients(inventory, ingredients, multiplier);
    dataService.inventory.saveAll(updated);

    // Update meal status
    const updatedMeal: Meal = { ...meal, status: "cooked", cookedAt: new Date().toISOString() };
    dataService.meals.save(updatedMeal);
    setMeals(dataService.meals.getAll());

    // Show toast with deduction summary
    const deducted = log.filter((l) => l.status === "deducted");
    const skipped = log.filter((l) => l.status !== "deducted");
    const parts: string[] = [];
    if (deducted.length > 0) parts.push(tToasts("deducted", { count: deducted.length }));
    if (skipped.length > 0) parts.push(tToasts("skipped", { count: skipped.length }));
    setToast(parts.join(". ") || tToasts("markedCooked"));
    setTimeout(() => setToast(null), 5000);
  };

  const handleGenerateShoppingList = () => {
    const recipes = dataService.recipes.getAll();
    const inventory = dataService.inventory.getAll();
    const deficit = generateShoppingList(meals, recipes, inventory);

    if (deficit.length === 0) {
      setToast(tToasts("allCovered"));
      setTimeout(() => setToast(null), 4000);
      return;
    }

    // Merge with existing shopping list
    const existing = dataService.shoppingList.getAll();
    const merged = [...existing];
    for (const item of deficit) {
      const match = merged.find(
        (e) => e.name.toLowerCase() === item.name.toLowerCase() && e.unit === item.unit
      );
      if (match) {
        match.quantity += item.quantity;
      } else {
        merged.push(item);
      }
    }
    dataService.shoppingList.saveAll(merged);

    setToast(tToasts("addedToList", { count: deficit.length }));
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateShoppingList}
            title={t("generateList")}
            className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 px-2 lg:px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden lg:inline">{t("generateList")}</span>
          </button>
          <Link
            href="/meal-plan/history"
            title={t("history")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2 lg:px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <History className="w-4 h-4" />
            <span className="hidden lg:inline">{t("history")}</span>
          </Link>
          <button
            onClick={() =>
              setModalTarget({ date: today, slot: mealSlots[0] ?? "Dinner" })
            }
            title={t("addMeal")}
            className="flex items-center gap-2 bg-brand-600 text-white px-3 lg:px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">{t("addMeal")}</span>
          </button>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-1 rounded-lg hover:bg-gray-100"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-1 rounded-lg hover:bg-gray-100"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Grid: days × slots */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="py-2 pr-3 text-left text-xs text-gray-400 font-medium w-24 uppercase">
                {t("slotHeader")}
              </th>
              {weekDates.map((d, i) => {
                const isToday =
                  d.toDateString() === today.toDateString();
                return (
                  <th
                    key={i}
                    className={`py-2 px-2 text-center text-xs font-medium ${
                      isToday ? "text-brand-600" : "text-gray-500"
                    }`}
                  >
                    <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div
                      className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center mt-0.5 ${
                        isToday ? "bg-brand-600 text-white" : ""
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {mealSlots.map((slot) => (
              <tr key={slot} className="border-t border-gray-100">
                <td className="py-3 pr-3 text-xs text-gray-400 font-medium uppercase align-top">
                  {slot}
                </td>
                {weekDates.map((d, i) => {
                  const cellMeals = getMealsFor(d, slot);
                  return (
                    <td
                      key={i}
                      className="py-2 px-2 align-top min-w-[100px]"
                    >
                      {cellMeals.length === 0 ? (
                        <button
                          onClick={() => setModalTarget({ date: d, slot })}
                          className="w-full h-10 border border-dashed border-gray-200 rounded-lg text-gray-300 hover:border-brand-400 hover:text-brand-400 transition-colors text-lg"
                        >
                          +
                        </button>
                      ) : (
                        cellMeals.map((m) => (
                          <div
                            key={m.id}
                            className={`group relative w-full text-left rounded-lg px-2 py-1 text-xs mb-1 leading-snug cursor-pointer transition-colors ${
                              m.status === "cooked"
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : m.status === "skipped"
                                ? "bg-gray-100 text-gray-400 line-through"
                                : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                            }`}
                            onClick={() => setSelectedMeal(m)}
                          >
                            <span>{m.customTitle ?? dataService.recipes.getById(m.recipeId ?? "")?.title ?? "Untitled"}</span>
                            {m.status === "cooked" && <span className="ml-1">✓</span>}
                            {/* Web-only: hover delete button (hidden on mobile via sm:) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dataService.meals.delete(m.id);
                                setMeals(dataService.meals.getAll());
                              }}
                              className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 bg-red-400 text-white rounded-full items-center justify-center text-xs hover:bg-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {t("instruction")}
      </p>

      {/* Add Meal Modal */}
      {modalTarget && (
        <AddMealModal
          date={modalTarget.date}
          slot={modalTarget.slot}
          onClose={() => setModalTarget(null)}
          onMealAdded={() => setMeals(dataService.meals.getAll())}
        />
      )}

      {/* Meal action popover */}
      {selectedMeal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedMeal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {selectedMeal.customTitle ?? dataService.recipes.getById(selectedMeal.recipeId ?? "")?.title ?? "Untitled"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selectedMeal.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  {" · "}{selectedMeal.slot}
                </p>
              </div>
              <button onClick={() => setSelectedMeal(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Serving size adjuster */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{tCommon("servings")}</span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => {
                    const newServings = Math.max(1, selectedMeal.servings - 1);
                    const updated = { ...selectedMeal, servings: newServings };
                    dataService.meals.save(updated);
                    setMeals(dataService.meals.getAll());
                    setSelectedMeal(updated);
                  }}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold">{selectedMeal.servings}</span>
                <button
                  onClick={() => {
                    const newServings = selectedMeal.servings + 1;
                    const updated = { ...selectedMeal, servings: newServings };
                    dataService.meals.save(updated);
                    setMeals(dataService.meals.getAll());
                    setSelectedMeal(updated);
                  }}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {selectedMeal.status === "planned" && selectedMeal.recipeId && (
                <button
                  onClick={() => {
                    const recipeId = selectedMeal.recipeId;
                    if (!recipeId) return;
                    setSelectedMeal(null);
                    window.location.href = recipeHref("cook", recipeId, {
                      servings: selectedMeal.servings, mealId: selectedMeal.id,
                    });
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {tActions("startCooking")}
                </button>
              )}
              {selectedMeal.status === "planned" && (
                <button
                  onClick={() => {
                    handleMarkCooked(selectedMeal);
                    setSelectedMeal(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {tActions("markCooked")}
                </button>
              )}
              {selectedMeal.status === "planned" && (
                <button
                  onClick={() => {
                    const updated: Meal = { ...selectedMeal, status: "skipped" };
                    dataService.meals.save(updated);
                    setMeals(dataService.meals.getAll());
                    setSelectedMeal(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  {tActions("skip")}
                </button>
              )}
              {selectedMeal.recipeId && (
                <button
                  onClick={() => {
                    const recipeId = selectedMeal.recipeId;
                    if (!recipeId) return;
                    setSelectedMeal(null);
                    window.location.href = recipeHref("detail", recipeId, { servings: selectedMeal.servings });
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChefHat className="w-4 h-4" />
                  {tActions("viewRecipe")}
                </button>
              )}
              <button
                onClick={() => {
                  const confirmed = selectedMeal.status === "cooked"
                    ? confirm(tActions("deleteCookedConfirm"))
                    : true;
                  if (confirmed) {
                    dataService.meals.delete(selectedMeal.id);
                    setMeals(dataService.meals.getAll());
                    setSelectedMeal(null);
                  }
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {tActions("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50 animate-in fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
