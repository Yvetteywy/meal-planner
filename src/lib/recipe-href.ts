export const isPackagedIOS = process.env.NEXT_PUBLIC_MEAL_PLANNER_TARGET === "ios";

const paths = {
  detail: { web: "/recipes", ios: "/recipes/detail/" },
  edit: { web: "/recipes/edit", ios: "/recipes/edit/" },
  cook: { web: "/cook", ios: "/cook/session/" },
} as const;

type RecipeRoute = keyof typeof paths;

type RecipeQuery = {
  servings?: number;
  mealId?: string;
  newVersion?: boolean;
};

export function recipeHref(route: RecipeRoute, id: string, query: RecipeQuery = {}) {
  const params = new URLSearchParams();
  if (isPackagedIOS) params.set("id", id);
  if (query.servings !== undefined) params.set("servings", String(query.servings));
  if (query.mealId !== undefined) params.set("mealId", query.mealId);
  if (query.newVersion !== undefined) params.set("newVersion", String(query.newVersion));

  const path = isPackagedIOS ? paths[route].ios : `${paths[route].web}/${encodeURIComponent(id)}`;
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}