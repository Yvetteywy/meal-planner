"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Recipe } from "@/lib/types";
import { dataService } from "@/lib/data-service";
import RecipeForm from "@/components/RecipeForm/RecipeForm";

export default function EditRecipePage({ recipeId }: { recipeId?: string } = {}) {
  const params = useParams<{ id: string }>();
  const id = recipeId ?? params.id;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = dataService.recipes.getById(id);
    setRecipe(found ?? null);

    const url = new URL(window.location.href);
    setIsNewVersion(url.searchParams.get("newVersion") === "true");
    setLoading(false);
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!recipe) return <div className="p-8 text-center text-gray-400">Recipe not found</div>;

  return <RecipeForm existingRecipe={recipe} isNewVersion={isNewVersion} />;
}
