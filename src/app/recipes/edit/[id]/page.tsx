import EditRecipePage from "./EditRecipePage";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <EditRecipePage />;
}
