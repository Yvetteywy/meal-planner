"use client";

import { recipeHref, isPackagedIOS } from "@/lib/recipe-href";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChefHat,
  Clock,
  Users,
  Star,
  ArrowLeft,
  CalendarPlus,
  Play,
  Pencil,
  GitBranch,
  History,
  Trash2,
} from "lucide-react";
import { Recipe, Meal } from "@/lib/types";
import { useTranslations } from "next-intl";
import { dataService } from "@/lib/data-service";
import { useUnits } from "@/lib/use-units";

function DifficultyBadge({
  difficulty,
}: {
  difficulty: "easy" | "medium" | "hard";
}) {
  const tDiff = useTranslations("recipes.difficulty");
  const config = {
    easy: { label: tDiff("easy"), color: "bg-green-100 text-green-700", icon: "🟢" },
    medium: {
      label: tDiff("medium"),
      color: "bg-amber-100 text-amber-700",
      icon: "🟡",
    },
    hard: { label: tDiff("hard"), color: "bg-red-100 text-red-700", icon: "🔴" },
  };
  const { label, color, icon } = config[difficulty];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {icon} {label}
    </span>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= score
              ? "fill-amber-400 text-amber-400"
              : "text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

export default function RecipeDetailPage({ recipeId }: { recipeId?: string } = {}) {
  const t = useTranslations("recipes.detail");
  const tCal = useTranslations("recipes.calendarModal");
  const tCommon = useTranslations("common");
  const { getUnitLabel } = useUnits();
  const params = useParams();
  const router = useRouter();
  const id = recipeId ?? (params.id as string);

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    setRecipes(dataService.recipes.getAll());
  }, []);

  const recipe = recipes.find((r) => r.id === id);

  // Read servings from URL query param (passed from meal plan)
  const [adjustedServings, setAdjustedServings] = useState<number | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlServings = url.searchParams.get("servings");
    if (urlServings) {
      const parsed = parseInt(urlServings);
      if (parsed >= 1) setAdjustedServings(parsed);
    }
  }, []);

  const allVersions = recipe
    ? recipes.filter(
        (r) =>
          r.id === id ||
          r.parentRecipeId === id ||
          (recipe.parentRecipeId && r.parentRecipeId === recipe.parentRecipeId) ||
          r.id === recipe.parentRecipeId
      ).sort((a, b) => a.version - b.version)
    : [];

  const ratings = recipe?.ratings ?? [];
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0;

  const currentServings = adjustedServings ?? recipe?.servings ?? 1;
  const servingMultiplier = recipe ? currentServings / recipe.servings : 1;

  // Add to Calendar modal state
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [calendarSlot, setCalendarSlot] = useState("Dinner");
  const [calendarServings, setCalendarServings] = useState(currentServings);
  const [mealSlots, setMealSlots] = useState<string[]>([]);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);

  // Inline rating state
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingToast, setRatingToast] = useState<string | null>(null);

  useEffect(() => {
    setMealSlots(dataService.mealSlots.getAll());
  }, []);

  /** Scale a quantity by the serving multiplier and round smartly */
  const scaleQuantity = (qty: number): string => {
    const scaled = qty * servingMultiplier;
    if (scaled === Math.round(scaled)) return String(scaled);
    if (scaled < 10) return String(Math.round(scaled * 4) / 4);
    return String(Math.round(scaled));
  };

  const handleSaveRating = () => {
    if (ratingScore === 0 || !recipe) return;
    const newRating = {
      score: ratingScore,
      ratedAt: new Date().toISOString(),
      comment: ratingComment.trim() || undefined,
    };
    const updatedRecipe = {
      ...recipe,
      ratings: [...(recipe.ratings || []), newRating],
    };
    dataService.recipes.save(updatedRecipe);
    setRecipes(dataService.recipes.getAll());
    setRatingScore(0);
    setRatingComment("");
    setRatingToast(t("ratingSaved"));
    setTimeout(() => setRatingToast(null), 2000);
  };

  if (!recipe) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg">{t("notFound")}</p>
        <Link
          href="/recipes"
          className="text-brand-600 hover:underline text-sm mt-2 inline-block"
        >
          ← {t("backLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backLink")}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
            <p className="text-gray-500">{recipe.description}</p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            {recipe.version > 1 && (
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                v{recipe.version}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {t("timeLabel", { total: recipe.prepTimeMinutes + recipe.cookTimeMinutes, prep: recipe.prepTimeMinutes, cook: recipe.cookTimeMinutes })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {recipe.servings} {tCommon("servings")}
          </span>
          {recipe.difficulty && (
            <DifficultyBadge difficulty={recipe.difficulty} />
          )}
          {recipe.cuisine && (
            <span className="flex items-center gap-1.5">
              <ChefHat className="w-4 h-4" />
              {recipe.cuisine.category}
              {recipe.cuisine.subcategory && ` · ${recipe.cuisine.subcategory}`}
            </span>
          )}
          {avgRating > 0 && (
            <span className="flex items-center gap-1.5">
              <StarRating score={Math.round(avgRating)} />
              <span className="text-xs text-gray-400">
                ({ratings.length})
              </span>
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => router.push(recipeHref("cook", id, isPackagedIOS ? { servings: adjustedServings ?? recipe.servings } : {}))}
            className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            {t("startCooking")}
          </button>
          <button
            onClick={() => {
              setCalendarServings(currentServings);
              setShowCalendarPicker(true);
            }}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" />
            {t("addToCalendar")}
          </button>
          <button
            onClick={() => router.push(recipeHref("edit", recipe.id))}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            {tCommon("edit")}
          </button>
          <button
            onClick={() => router.push(recipeHref("edit", recipe.id, { newVersion: true }))}
            className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <GitBranch className="w-4 h-4" />
            {t("newVersion")}
          </button>
          <button
            onClick={() => {
              if (confirm(t("deleteConfirm", { title: recipe.title }))) {
                dataService.recipes.delete(recipe.id);
                router.push("/recipes");
              }
            }}
            className="flex items-center gap-1.5 text-red-400 px-3 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {tCommon("delete")}
          </button>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {t("ingredients")}
              <span className="text-xs text-gray-400 font-normal ml-2">
                ({recipe.ingredients.length} {t("items")})
              </span>
            </h2>
          </div>

          {/* Serving size adjuster */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{tCommon("servings")}</span>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() =>
                  setAdjustedServings(Math.max(1, currentServings - 1))
                }
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={currentServings}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  if (v >= 1) setAdjustedServings(v);
                }}
                className="w-12 h-7 text-center text-sm font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={() => setAdjustedServings(currentServings + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>
          {adjustedServings && adjustedServings !== recipe.servings && (
            <button
              onClick={() => setAdjustedServings(null)}
              className="text-xs text-brand-600 hover:underline"
            >
              {t("resetServings", { count: recipe.servings })}
            </button>
          )}

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
                <span>
                  <span className="font-medium">{ing.name}</span>
                  <span className={`ml-1.5 ${servingMultiplier !== 1 ? "text-brand-600 font-medium" : "text-gray-400"}`}>
                    {scaleQuantity(ing.quantity)} {getUnitLabel(ing.unit)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">
            {t("instructions")}
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({recipe.instructions.length} {t("steps")})
            </span>
          </h2>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
      </div>

      {/* Ratings & Reviews */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {t("ratings")}
            <span className="text-xs text-gray-400 font-normal ml-2">
              ({ratings.length})
            </span>
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {avgRating.toFixed(1)}
              </span>
              <StarRating score={Math.round(avgRating)} />
            </div>
          )}
        </div>

        {/* Inline rating form */}
        <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
          <p className="text-sm font-medium text-gray-700">{t("rateThis")}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setRatingScore(i)}
                className="p-0.5 hover:scale-110 transition-transform"
              >
                <Star className={`w-7 h-7 transition-colors ${
                  i <= ratingScore
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-200 hover:fill-amber-400 hover:text-amber-400"
                }`} />
              </button>
            ))}
          </div>
          {ratingScore > 0 && (
            <>
              <textarea
                placeholder={t("ratingCommentPlaceholder")}
                rows={2}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none bg-white"
              />
              <button
                onClick={handleSaveRating}
                className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors font-medium"
              >
                {t("submitRating")}
              </button>
            </>
          )}
        </div>

        <div className="space-y-3">
          {ratings.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              {t("noRatings")}
            </p>
          ) : (
          [...ratings].sort((a, b) => new Date(b.ratedAt).getTime() - new Date(a.ratedAt).getTime()).map((rating, i) => (
            <div
              key={i}
              className="flex gap-3 py-3 border-t border-gray-100 first:border-t-0 first:pt-0"
            >
              <div className="shrink-0 pt-0.5">
                <StarRating score={rating.score} />
              </div>
              <div className="flex-1 min-w-0">
                {rating.comment && (
                  <p className="text-sm text-gray-700">{rating.comment}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(rating.ratedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))
          )}
        </div>
      </div>
      {/* Version History — only show if there are multiple versions */}
      {allVersions.length > 1 && (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          {t("versionHistory")}
        </h2>
        <div className="space-y-2">
          {[...allVersions].reverse().map((v) => (
            <div
              key={v.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                v.id === recipe.id
                  ? "bg-brand-50 border border-brand-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
                  v.id === recipe.id
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                v{v.version}
              </span>
              <span className="flex-1 text-gray-700">{v.changelog ?? t("originalRecipe")}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(v.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              {v.id === recipe.id && (
                <span className="text-xs text-brand-600 font-medium">
                  {t("current")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Source info */}
      <div className="text-xs text-gray-400 text-center pb-4">
        Source: {recipe.source} · Added{" "}
        {new Date(recipe.createdAt).toLocaleDateString()}
      </div>

      {/* Add to Calendar modal */}
      {showCalendarPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCalendarPicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900">{t("addToCalendar")}</h3>
            <p className="text-sm text-gray-500">{recipe.title}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{tCal("dateLabel")}</label>
                <input
                  type="date"
                  value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{tCal("slotLabel")}</label>
                <select
                  value={calendarSlot}
                  onChange={(e) => setCalendarSlot(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {mealSlots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{tCommon("servings")}</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarServings(Math.max(1, calendarServings - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
                  >−</button>
                  <span className="w-8 text-center font-semibold">{calendarServings}</span>
                  <button
                    onClick={() => setCalendarServings(calendarServings + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
                  >+</button>
                  <span className="text-xs text-gray-400 ml-1">({tCommon("servings")}: {recipe.servings})</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowCalendarPicker(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={() => {
                  const meal: Meal = {
                    id: crypto.randomUUID(),
                    date: calendarDate,
                    slot: calendarSlot,
                    recipeId: recipe.id,
                    servings: calendarServings,
                    status: "planned",
                    rated: false,
                  };
                  dataService.meals.save(meal);
                  setShowCalendarPicker(false);
                  const dayLabel = new Date(calendarDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  setCalendarToast(tCal("addedToast", { day: dayLabel, slot: calendarSlot }));
                  setTimeout(() => setCalendarToast(null), 4000);
                }}
                className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors font-medium"
              >
                {tCal("addButton")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {(calendarToast || ratingToast) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg text-sm z-50">
          ✅ {calendarToast || ratingToast}
        </div>
      )}
    </div>
  );
}
