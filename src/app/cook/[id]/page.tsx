import CookModePage from "./CookModePage";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <CookModePage />;
}
