"use client";

import { recipeHref } from "@/lib/recipe-href";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChefHat, Search, Sparkles, Clock, Users, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Recipe } from "@/lib/types";
import { dataService } from "@/lib/data-service";

export default function RecipesPage() {
  const t = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const tTime = useTranslations("time");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading] = useState(false);

  useEffect(() => {
    setRecipes(dataService.recipes.getAll());
  }, []);

  const filtered = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-brand-600" />
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <Link
          href="/recipes/new"
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("addRecipe")}
        </Link>
      </div>

      {/* AI Recommendation — hidden until AI features are implemented */}
      {/* <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-700 font-semibold">
          <Sparkles className="w-5 h-5" />
          {t("aiTitle")}
        </div>
        <p className="text-sm text-amber-600">
          {t("aiDescription")}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={t("aiPlaceholder")}
            className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            disabled={aiLoading || !aiPrompt.trim()}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {aiLoading ? t("aiThinking") : t("aiSuggest")}
          </button>
        </div>
        <p className="text-xs text-amber-500">
          {t("aiHint")}
        </p>
      </div> */}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      {/* Recipe list */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-10">{t("noRecipes")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={recipeHref("detail", recipe.id)}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3 hover:shadow-md hover:border-brand-200 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900">{recipe.title}</h2>
                {recipe.aiGenerated && (
                  <span className="shrink-0 flex items-center gap-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {t("aiBadge")}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {recipe.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {recipe.prepTimeMinutes + recipe.cookTimeMinutes} {tTime("min")}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {recipe.servings} {tCommon("servings")}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {recipe.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
