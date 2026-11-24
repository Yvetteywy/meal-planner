"use client";

import { recipeHref } from "@/lib/recipe-href";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  Play,
  Pause,
  RotateCcw,
  List,
  ChefHat,
  Star,
} from "lucide-react";
import { Recipe, Meal, RecipeRating } from "@/lib/types";
import { useTranslations } from "next-intl";
import { dataService } from "@/lib/data-service";
import { useUnits } from "@/lib/use-units";
import { deductIngredients } from "@/lib/deduction-utils";
import { getMealIngredients } from "@/lib/meal-utils";

/** Extract timer duration from instruction text */
function parseTimer(text: string): number | null {
  // Match patterns like "8 minutes", "2 min", "1 minute", "10 minutes"
  const match = text.match(/(\d+)\s*(?:minutes?|mins?)/i);
  if (match) return parseInt(match[1]);
  // Match "X hours"
  const hourMatch = text.match(/(\d+)\s*hours?/i);
  if (hourMatch) return parseInt(hourMatch[1]) * 60;
  return null;
}

/** Find ingredients mentioned in an instruction step */
function matchIngredients(
  step: string,
  ingredients: Recipe["ingredients"]
): Recipe["ingredients"] {
  const lower = step.toLowerCase();
  return ingredients.filter((ing) => lower.includes(ing.name.toLowerCase()));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TimerState {
  stepIndex: number;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
}

export default function CookModePage({ recipeId }: { recipeId?: string } = {}) {
  const t = useTranslations("cook");
  const tCommon = useTranslations("common");
  const { getUnitLabel } = useUnits();
  const params = useParams();
  const router = useRouter();
  const id = recipeId ?? (params.id as string);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const [mealId, setMealId] = useState<string | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    setRecipes(dataService.recipes.getAll());
    const url = new URL(window.location.href);
    const urlServings = url.searchParams.get("servings");
    if (urlServings) {
      const parsed = parseInt(urlServings);
      if (parsed >= 1) setServingMultiplier(parsed);
    }
    const urlMealId = url.searchParams.get("mealId");
    if (urlMealId) setMealId(urlMealId);
  }, []);

  const recipe = recipes.find((r) => r.id === id);

  // Calculate actual multiplier once recipe is loaded
  const actualMultiplier = recipe ? servingMultiplier / recipe.servings : 1;

  /** Scale a quantity and round smartly */
  const scaleQty = (qty: number): string => {
    if (actualMultiplier === 1) return String(qty);
    const scaled = qty * actualMultiplier;
    if (scaled === Math.round(scaled)) return String(scaled);
    if (scaled < 10) return String(Math.round(scaled * 4) / 4);
    return String(Math.round(scaled));
  };

  const [currentStep, setCurrentStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [showOverview, setShowOverview] = useState(false);
  const [timers, setTimers] = useState<TimerState[]>([]);
  const [showFinish, setShowFinish] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  const toggleIngredient = (name: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => {
          if (!t.running || t.remainingSeconds <= 0) return t;
          const next = t.remainingSeconds - 1;
          if (next <= 0) {
            // Timer done — play alert
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              osc.frequency.value = 800;
              osc.connect(ctx.destination);
              osc.start();
              setTimeout(() => osc.stop(), 300);
            } catch {
              // Audio not available
            }
          }
          return { ...t, remainingSeconds: next };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">{t("notFound")}</p>
      </div>
    );
  }

  const totalSteps = recipe.instructions.length;
  const step = recipe.instructions[currentStep];
  const timerDuration = parseTimer(step);
  const stepIngredients = matchIngredients(step, recipe.ingredients);
  const activeTimerForStep = timers.find((t) => t.stepIndex === currentStep);

  const startTimer = () => {
    if (!timerDuration) return;
    const existing = timers.find((t) => t.stepIndex === currentStep);
    if (existing) {
      setTimers((prev) =>
        prev.map((t) =>
          t.stepIndex === currentStep ? { ...t, running: true } : t
        )
      );
    } else {
      setTimers((prev) => [
        ...prev,
        {
          stepIndex: currentStep,
          totalSeconds: timerDuration * 60,
          remainingSeconds: timerDuration * 60,
          running: true,
        },
      ]);
    }
  };

  const pauseTimer = (stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.stepIndex === stepIndex ? { ...t, running: false } : t
      )
    );
  };

  const resetTimer = (stepIndex: number) => {
    setTimers((prev) =>
      prev.map((t) =>
        t.stepIndex === stepIndex
          ? { ...t, remainingSeconds: t.totalSeconds, running: false }
          : t
      )
    );
  };

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setShowFinish(true);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleFinishClick = () => {
    if (currentStep < totalSteps - 1) {
      setShowFinishConfirm(true);
    } else {
      setShowFinish(true);
    }
  };

  // Complete cooking: save rating, mark meal cooked, deduct inventory
  const handleCookingComplete = (skipRating: boolean) => {
    // Save rating if not skipping
    if (!skipRating && ratingScore > 0 && recipe) {
      const newRating: RecipeRating = {
        score: ratingScore,
        ratedAt: new Date().toISOString(),
        comment: ratingComment.trim() || undefined,
      };
      const updatedRecipe = {
        ...recipe,
        ratings: [...(recipe.ratings || []), newRating],
      };
      dataService.recipes.save(updatedRecipe);
    }

    // Mark the meal as cooked and deduct inventory
    if (mealId) {
      const meals = dataService.meals.getAll();
      const meal = meals.find((m) => m.id === mealId);
      if (meal && meal.status !== "cooked") {
        const updatedMeal = {
          ...meal,
          status: "cooked" as const,
          cookedAt: new Date().toISOString(),
        };
        dataService.meals.save(updatedMeal);

        // Deduct ingredients from inventory
        const allRecipes = dataService.recipes.getAll();
        const ingredients = getMealIngredients(updatedMeal, allRecipes);
        if (ingredients.length > 0) {
          const inventory = dataService.inventory.getAll();
          const multiplier = servingMultiplier / (recipe?.servings || 1);
          const { updated } = deductIngredients(inventory, ingredients, multiplier);
          updated.forEach((item) => dataService.inventory.save(item));
        }
      }
    }

    router.push(recipeHref("detail", id));
  };

  // Running timers (for the tray)
  const runningTimers = timers
    .filter((t) => t.running || t.remainingSeconds > 0)
    .sort((a, b) => a.stepIndex - b.stepIndex);

  // Finish screen
  if (showFinish) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("finishTitle")}
          </h1>
          <p className="text-gray-500">
            {t("finishDescription", { recipe: recipe.title })}
          </p>

          {/* Rating */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRatingScore(i)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-8 h-8 transition-colors ${
                    i <= ratingScore
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-200 hover:fill-amber-400 hover:text-amber-400"
                  }`} />
                </button>
              ))}
            </div>
            <textarea
              placeholder={t("notesPlaceholder")}
              rows={2}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleCookingComplete(true)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {t("skipRating")}
            </button>
            <button
              onClick={() => handleCookingComplete(false)}
              className="flex-1 px-4 py-2.5 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-colors font-medium"
            >
              {t("saveDone")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Top bar */}      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.push(recipeHref("detail", id))}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
          {t("exit")}
        </button>
        <div className="text-center">
          <h1 className="font-semibold text-gray-900 text-sm">
            {recipe.title}
          </h1>
          <p className="text-xs text-gray-400">
            {t("stepOf", { current: currentStep + 1, total: totalSteps })}
            {servingMultiplier !== recipe.servings && (
              <span className="text-brand-600"> · {t("servingsLabel", { count: servingMultiplier })}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowOverview(!showOverview)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <List className="w-5 h-5" />
          {t("allSteps")}
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-1.5">
        <div className="flex gap-1">
          {recipe.instructions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                i < currentStep
                  ? "bg-brand-500"
                  : i === currentStep
                  ? "bg-brand-300"
                  : "bg-gray-200"
              }`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>
      </div>

      {/* Step overview panel */}
      {showOverview && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-1 max-h-60 overflow-y-auto">
          {recipe.instructions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentStep(i);
                setShowOverview(false);
              }}
              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                i === currentStep
                  ? "bg-brand-50 text-brand-700"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < currentStep
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {i < currentStep ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="truncate">{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center px-6 py-6 max-w-xl mx-auto w-full">
        {/* Step number */}
        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-base font-bold mb-4">
          {currentStep + 1}
        </div>

        {/* Step instruction */}
        <p className="text-lg sm:text-xl text-center text-gray-900 font-medium leading-relaxed mb-5">
          {step}
        </p>

        {/* Ingredients for this step */}
        {stepIngredients.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4 w-full max-w-sm">
            <p className="text-xs text-gray-400 font-medium uppercase mb-2">
              {t("ingredientsForStep")}
            </p>
            <div className="space-y-1.5">
              {stepIngredients.map((ing, i) => {
                const checked = checkedIngredients.has(ing.name);
                return (
                  <button
                    key={i}
                    onClick={() => toggleIngredient(ing.name)}
                    className={`w-full flex items-center gap-3 text-sm px-2 py-1.5 rounded-lg transition-colors text-left ${
                      checked
                        ? "bg-brand-50 text-gray-400"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        checked
                          ? "bg-brand-500 border-brand-500"
                          : "border-gray-300"
                      }`}
                    >
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </span>
                    <span className={`font-medium ${checked ? "line-through" : ""}`}>
                      {ing.name}
                    </span>
                    <span className={`ml-auto ${checked ? "line-through text-gray-300" : "text-gray-400"}`}>
                      {scaleQty(ing.quantity)} {getUnitLabel(ing.unit)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timer */}
        {timerDuration && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 mb-4 w-full max-w-sm text-center">
            <p className="text-xs text-gray-400 font-medium uppercase mb-2">
              {t("timer")}
            </p>
            <p className="text-3xl font-mono font-bold text-gray-900 mb-2">
              {activeTimerForStep
                ? formatTime(activeTimerForStep.remainingSeconds)
                : formatTime(timerDuration * 60)}
            </p>
            <div className="flex items-center justify-center gap-2">
              {!activeTimerForStep || !activeTimerForStep.running ? (
                <button
                  onClick={startTimer}
                  className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  {activeTimerForStep ? t("timerResume") : t("timerStart")}
                </button>
              ) : (
                <button
                  onClick={() => pauseTimer(currentStep)}
                  className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  {t("timerPause")}
                </button>
              )}
              {activeTimerForStep && (
                <button
                  onClick={() => resetTimer(currentStep)}
                  className="flex items-center gap-1.5 text-gray-500 px-3 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t("timerReset")}
                </button>
              )}
            </div>
            {activeTimerForStep &&
              activeTimerForStep.remainingSeconds <= 0 && (
                <p className="text-brand-600 font-medium text-sm mt-2 animate-pulse">
                  ⏰{t("timerDone")}
                </p>
              )}
          </div>
        )}
      </div>

      {/* Running timers tray */}
      {runningTimers.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-2 flex gap-3 overflow-x-auto">
          {runningTimers.map((tmr) => (
            <div
              key={tmr.stepIndex}
              onClick={() => setCurrentStep(tmr.stepIndex)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                tmr.remainingSeconds <= 0
                  ? "bg-red-50 text-red-600 animate-pulse"
                  : tmr.stepIndex === currentStep
                  ? "bg-brand-50 text-brand-700"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="font-medium">{t("stepOf", { current: tmr.stepIndex + 1, total: totalSteps })}</span>
              <span className="font-mono">
                {formatTime(tmr.remainingSeconds)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5" />
          {tCommon("back")}
        </button>
        <button
          onClick={currentStep === totalSteps - 1 ? handleFinishClick : goNext}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
        >
          {currentStep === totalSteps - 1 ? t("finish") : t("next")}
          {currentStep < totalSteps - 1 && (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Finish confirmation dialog */}
      {showFinishConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-gray-900">
              {t("incompleteTitle")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("incompleteDescription", { current: currentStep + 1, total: totalSteps, remaining: totalSteps - currentStep - 1 })}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowFinishConfirm(false);
                  setShowFinish(true);
                }}
                className="w-full px-4 py-2.5 text-sm bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium"
              >
                Finish anyway
              </button>
              <button
                onClick={() => {
                  setShowFinishConfirm(false);
                  setCurrentStep(totalSteps - 1);
                }}
                className="w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Go to last step
              </button>
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="w-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
