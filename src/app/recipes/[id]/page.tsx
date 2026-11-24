import RecipeDetailPage from "./RecipeDetailPage";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <RecipeDetailPage />;
}
