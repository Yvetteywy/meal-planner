"use client";

import { recipeHref, isPackagedIOS } from "@/lib/recipe-href";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Link as LinkIcon,
} from "lucide-react";
import { Unit, Recipe, RecipeSource } from "@/lib/types";
import { useTranslations } from "next-intl";
import { dataService } from "@/lib/data-service";
import { useUnits } from "@/lib/use-units";

const CATEGORIES = [
  "Italian", "Chinese", "Japanese", "Mexican", "American", "Indian",
  "Thai", "Korean", "French", "Mediterranean", "Other",
];

const SUBCATEGORIES = [
  "Pasta", "Stir-fry", "Soup", "Salad", "Baking", "Breakfast",
  "Dessert", "Grilling", "Slow-cook", "One-pot", "Other",
];

interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: Unit;
}

interface InstructionRow {
  id: string;
  text: string;
}

interface RecipeFormProps {
  /** Existing recipe to edit (undefined = create new) */
  existingRecipe?: Recipe;
  /** If true, creates a new version instead of editing in place */
  isNewVersion?: boolean;
}

export default function RecipeForm({ existingRecipe, isNewVersion }: RecipeFormProps) {
  const router = useRouter();
  const t = useTranslations("recipes.new");
  const tCommon = useTranslations("common");
  const { getUnitLabel, UNITS } = useUnits();

  const isEditMode = !!existingRecipe && !isNewVersion;

  // Pre-fill form state from existing recipe
  const [title, setTitle] = useState(existingRecipe?.title ?? "");
  const [description, setDescription] = useState(existingRecipe?.description ?? "");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    existingRecipe?.ingredients.map((i) => ({
      id: crypto.randomUUID(),
      name: i.name,
      quantity: String(i.quantity),
      unit: i.unit,
    })) ?? [{ id: crypto.randomUUID(), name: "", quantity: "", unit: "g" }]
  );
  const [instructions, setInstructions] = useState<InstructionRow[]>(
    existingRecipe?.instructions.map((text) => ({
      id: crypto.randomUUID(),
      text,
    })) ?? [{ id: crypto.randomUUID(), text: "" }]
  );
  const [prepTime, setPrepTime] = useState(existingRecipe ? String(existingRecipe.prepTimeMinutes || "") : "");
  const [cookTime, setCookTime] = useState(existingRecipe ? String(existingRecipe.cookTimeMinutes || "") : "");
  const [servings, setServings] = useState(existingRecipe ? String(existingRecipe.servings) : "2");
  const [tags, setTags] = useState(existingRecipe?.tags.join(", ") ?? "");
  const [cuisine, setCuisine] = useState(existingRecipe?.cuisine?.category ?? "");
  const [subcategory, setSubcategory] = useState(existingRecipe?.cuisine?.subcategory ?? "");
  const [difficulty, setDifficulty] = useState(existingRecipe?.difficulty ?? "");
  const [changelog, setChangelog] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [showImport, setShowImport] = useState(false);
  const lastIngredientRef = useRef<HTMLInputElement>(null);
  const lastInstructionRef = useRef<HTMLTextAreaElement>(null);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: "", unit: "g" },
    ]);
    setTimeout(() => lastIngredientRef.current?.focus(), 0);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addInstruction = () => {
    setInstructions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "" },
    ]);
    setTimeout(() => lastInstructionRef.current?.focus(), 0);
  };

  const removeInstruction = (id: string) => {
    if (instructions.length > 1) {
      setInstructions((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const updateInstruction = (id: string, text: string) => {
    setInstructions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, text } : i))
    );
  };

  const handleSave = () => {
    if (!title.trim() || !ingredients[0]?.name.trim() || !instructions[0]?.text.trim()) return;

    const recipeData = {
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), quantity: Number(i.quantity) || 0, unit: i.unit })),
      instructions: instructions.filter((i) => i.text.trim()).map((i) => i.text.trim()),
      prepTimeMinutes: Number(prepTime) || 0,
      cookTimeMinutes: Number(cookTime) || 0,
      servings: Number(servings) || 2,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      cuisine: cuisine ? { category: cuisine, subcategory: subcategory || undefined } : undefined,
      difficulty: (difficulty as Recipe["difficulty"]) || undefined,
    };

    if (isEditMode && existingRecipe) {
      // Update existing recipe in place
      const updated: Recipe = {
        ...existingRecipe,
        ...recipeData,
      };
      dataService.recipes.save(updated);
      router.push(recipeHref("detail", existingRecipe.id));
    } else if (isNewVersion && existingRecipe) {
      // Create a new version linked to the original
      const rootId = existingRecipe.parentRecipeId || existingRecipe.id;
      const allVersions = dataService.recipes.getAll().filter(
        (r) => r.id === rootId || r.parentRecipeId === rootId
      );
      const maxVersion = Math.max(...allVersions.map((r) => r.version));

      const newRecipe: Recipe = {
        ...existingRecipe,
        ...recipeData,
        id: crypto.randomUUID(),
        version: maxVersion + 1,
        parentRecipeId: rootId,
        createdAt: new Date().toISOString(),
        changelog: changelog.trim() || undefined,
        ratings: [], // new version starts fresh
      };
      dataService.recipes.save(newRecipe);
      router.push(recipeHref("detail", newRecipe.id));
    } else {
      // Create brand new recipe
      const recipe: Recipe = {
        id: crypto.randomUUID(),
        ...recipeData,
        source: "manual" as RecipeSource,
        createdAt: new Date().toISOString(),
        version: 1,
      };
      dataService.recipes.save(recipe);
      router.push(recipeHref("detail", recipe.id));
    }
  };

  const pageTitle = isNewVersion
    ? t("newVersionTitle")
    : isEditMode
    ? t("editTitle")
    : t("title");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={existingRecipe ? recipeHref("detail", existingRecipe.id) : "/recipes"}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backLink")}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        {!existingRecipe && !isPackagedIOS && (
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            {t("importFromUrl")}
          </button>
        )}
      </div>

      {/* Import from URL (new recipe only) */}
      {showImport && !existingRecipe && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-blue-700">{t("importDescription")}</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder={t("importPlaceholder")}
              className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              disabled={!importUrl.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {t("importButton")}
            </button>
          </div>
          <p className="text-xs text-blue-500">{t("importHint")}</p>
        </div>
      )}

      {/* Changelog for new version */}
      {isNewVersion && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <label className="block text-sm font-medium text-amber-800">
            {t("changelogLabel")}
          </label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder={t("changelogPlaceholder")}
            rows={2}
            className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          />
        </div>
      )}

      {/* Main form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("recipeTitle")}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titlePlaceholder")}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        {/* Meta row: prep time, cook time, servings */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("prepTime")}</label>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("cookTime")}</label>
            <input
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="15"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{tCommon("servings")}</label>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="2"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {/* Classification row: cuisine, subcategory, difficulty */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("cuisine")}</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">{tCommon("select")}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("type")}</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">{tCommon("select")}</option>
              {SUBCATEGORIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t("difficulty")}</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">{tCommon("select")}</option>
              <option value="easy">{t("difficultyEasy")}</option>
              <option value="medium">{t("difficultyMedium")}</option>
              <option value="hard">{t("difficultyHard")}</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("tags")}</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("tagsPlaceholder")}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {tags && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.split(",").map((tag, i) => {
                const trimmed = tag.trim();
                if (!trimmed) return null;
                return (
                  <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {trimmed}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t("ingredientsLabel")}</h2>
          <button
            onClick={addIngredient}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addIngredient")}
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={ing.id} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab" />
              <input
                type="text"
                ref={i === ingredients.length - 1 ? lastIngredientRef : undefined}
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, "name", e.target.value)}
                placeholder={t("ingredientPlaceholder", { num: i + 1 })}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                type="number"
                min={0}
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.id, "quantity", e.target.value)}
                placeholder={t("qtyPlaceholder")}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <select
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, "unit", e.target.value)}
                className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{getUnitLabel(u)}</option>
                ))}
              </select>
              <button
                onClick={() => removeIngredient(ing.id)}
                disabled={ingredients.length <= 1}
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t("instructionsLabel")}</h2>
          <button
            onClick={addInstruction}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addStep")}
          </button>
        </div>
        <div className="space-y-2">
          {instructions.map((inst, i) => (
            <div key={inst.id} className="flex items-start gap-2">
              <span className="shrink-0 w-6 h-8 flex items-center justify-center text-xs font-bold text-gray-400 pt-1">
                {i + 1}.
              </span>
              <textarea
                ref={i === instructions.length - 1 ? lastInstructionRef : undefined}
                value={inst.text}
                onChange={(e) => updateInstruction(inst.id, e.target.value)}
                placeholder={t("stepPlaceholder", { num: i + 1 })}
                rows={2}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
              <button
                onClick={() => removeInstruction(inst.id)}
                disabled={instructions.length <= 1}
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-30 mt-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={() => router.push(existingRecipe ? recipeHref("detail", existingRecipe.id) : "/recipes")}
          className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {tCommon("cancel")}
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim() || !ingredients[0]?.name.trim() || !instructions[0]?.text.trim()}
          className="px-5 py-2.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors font-medium disabled:opacity-50"
        >
          {isNewVersion ? t("saveNewVersion") : isEditMode ? t("saveChanges") : t("saveRecipe")}
        </button>
      </div>
    </div>
  );
}
