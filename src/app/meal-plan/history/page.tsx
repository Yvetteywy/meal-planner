"use client";

import { recipeHref } from "@/lib/recipe-href";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  SkipForward,
  Calendar,
  Star,
  Filter,
  ChefHat,
} from "lucide-react";

// Mock meal history data for the prototype
const MOCK_HISTORY = [
  {
    id: "h1",
    date: "2026-04-08",
    slot: "Dinner",
    title: "Garlic Butter Pasta",
    recipeId: "sample-1",
    status: "cooked" as const,
    rating: 5,
    comment: "Perfect comfort food!",
  },
  {
    id: "h2",
    date: "2026-04-08",
    slot: "Lunch",
    title: "Chicken Stir-Fry",
    recipeId: "sample-2",
    status: "cooked" as const,
    rating: 4,
    comment: "Great but needs more garlic next time",
  },
  {
    id: "h3",
    date: "2026-04-07",
    slot: "Dinner",
    title: "Leftover fried rice",
    recipeId: null,
    status: "cooked" as const,
    rating: null,
    comment: null,
  },
  {
    id: "h4",
    date: "2026-04-07",
    slot: "Breakfast",
    title: "Oatmeal with berries",
    recipeId: null,
    status: "skipped" as const,
    rating: null,
    comment: null,
  },
  {
    id: "h5",
    date: "2026-04-06",
    slot: "Dinner",
    title: "Garlic Butter Pasta",
    recipeId: "sample-1",
    status: "cooked" as const,
    rating: 4,
    comment: "Good, tried adding chili flakes",
  },
  {
    id: "h6",
    date: "2026-04-06",
    slot: "Lunch",
    title: "Chicken Stir-Fry",
    recipeId: "sample-2",
    status: "cooked" as const,
    rating: 3,
    comment: "鸡肉要提前腌制更久",
  },
  {
    id: "h7",
    date: "2026-04-05",
    slot: "Dinner",
    title: "Grilled salmon",
    recipeId: null,
    status: "cooked" as const,
    rating: 5,
    comment: null,
  },
  {
    id: "h8",
    date: "2026-04-05",
    slot: "Breakfast",
    title: "Avocado toast",
    recipeId: null,
    status: "skipped" as const,
    rating: null,
    comment: null,
  },
  {
    id: "h9",
    date: "2026-04-04",
    slot: "Kids Snack",
    title: "Apple slices with peanut butter",
    recipeId: null,
    status: "cooked" as const,
    rating: null,
    comment: null,
  },
  {
    id: "h10",
    date: "2026-04-03",
    slot: "",
    title: "Mystery leftovers",
    recipeId: null,
    status: "cooked" as const,
    rating: 2,
    comment: "Not great, couldn't remember what this was",
  },
];

function StarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= score ? "fill-amber-400 text-amber-400" : "text-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

type StatusFilter = "all" | "cooked" | "skipped";

export default function MealHistoryPage() {
  const t = useTranslations("mealHistory");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [slotFilter, setSlotFilter] = useState("");

  // Get unique slots from history
  const slots = Array.from(
    new Set(MOCK_HISTORY.map((m) => m.slot).filter(Boolean))
  ).sort();

  // Apply filters
  const filtered = MOCK_HISTORY.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (slotFilter && m.slot !== slotFilter) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof MOCK_HISTORY>>(
    (acc, meal) => {
      if (!acc[meal.date]) acc[meal.date] = [];
      acc[meal.date].push(meal);
      return acc;
    },
    {}
  );

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/meal-plan"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backLink")}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <span className="text-sm text-gray-400">
            ({filtered.length} {t("meals")})
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">{t("filters")}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Status filter */}
          <div className="flex gap-1">
            {(["all", "cooked", "skipped"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? t("all") : s === "cooked" ? t("cooked") : t("skipped")}
              </button>
            ))}
          </div>

          {/* Slot filter */}
          <select
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="">{t("allSlots")}</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History list grouped by date */}
      {dates.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          {t("noResults")}
        </p>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => {
            const dayLabel = new Date(date + "T12:00:00").toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            );
            const isToday =
              date === new Date().toISOString().split("T")[0];

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    {dayLabel}
                  </h3>
                  {isToday && (
                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                      Today
                    </span>
                  )}
                </div>

                {/* Meals for this date */}
                <div className="space-y-2">
                  {grouped[date].map((meal) => (
                    <div
                      key={meal.id}
                      className={`bg-white rounded-xl border shadow-sm px-4 py-3 flex items-center gap-3 ${
                        meal.status === "skipped"
                          ? "border-gray-100 opacity-60"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Status icon */}
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          meal.status === "cooked"
                            ? "bg-brand-100 text-brand-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {meal.status === "cooked" ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <SkipForward className="w-4 h-4" />
                        )}
                      </div>

                      {/* Meal info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {meal.recipeId ? (
                            <Link
                              href={recipeHref("detail", meal.recipeId)}
                              className="font-medium text-gray-900 hover:text-brand-600 transition-colors truncate"
                            >
                              {meal.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900 truncate">
                              {meal.title}
                            </span>
                          )}
                          {meal.recipeId && (
                            <ChefHat className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          {meal.slot ? (
                            <span>{meal.slot}</span>
                          ) : (
                            <span className="italic">{t("noSlot")}</span>
                          )}
                          {meal.rating && <StarRating score={meal.rating} />}
                          {meal.comment && (
                            <span className="truncate max-w-[200px]">
                              &quot;{meal.comment}&quot;
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          meal.status === "cooked"
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {meal.status === "cooked" ? t("statusCooked") : t("statusSkipped")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
