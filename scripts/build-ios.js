const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const stage = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "meal-planner-ios-"));

try {
  for (const entry of ["src", "public", "package.json", "tsconfig.json", ".eslintrc.json", "postcss.config.js", "tailwind.config.js"]) {
    fs.cpSync(path.join(root, entry), path.join(stage, entry), {
      recursive: true,
      filter: (source) => !/^(?:\.env(?:\.|$)|sw\.js(?:\.map)?$|(?:workbox|worker)-.*\.js(?:\.map)?$)/.test(path.basename(source)),
    });
  }
  fs.symlinkSync(path.join(root, "node_modules"), path.join(stage, "node_modules"), "dir");
  fs.copyFileSync(path.join(__dirname, "next.ios.config.cjs"), path.join(stage, "next.config.js"));

  // Keep the shared screens, but replace dynamic route entry points in this export only.
  const routes = [
    ["recipes/[id]", "recipes/detail", "RecipeDetailPage"],
    ["recipes/edit/[id]", "recipes/edit", "EditRecipePage"],
    ["cook/[id]", "cook/session", "CookModePage"],
  ];
  for (const [dynamicRoute, staticRoute, component] of routes) {
    fs.rmSync(path.join(stage, "src/app", dynamicRoute, "page.tsx"));
    const directory = path.join(stage, "src/app", staticRoute);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, "page.tsx"), `"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Screen from "@/app/${dynamicRoute}/${component}";

function RecipeRoute() {
  const params = useSearchParams();
  return <Screen key={params.toString()} recipeId={params.get("id") ?? ""} />;
}

export default function Page() {
  return <Suspense fallback={null}><RecipeRoute /></Suspense>;
}
`);
  }

  execFileSync(process.execPath, [require.resolve("next/dist/bin/next"), "build"], {
    cwd: stage,
    env: { ...process.env, NEXT_PUBLIC_MEAL_PLANNER_TARGET: "ios" },
    stdio: "inherit",
  });

  const exported = path.join(stage, "out");
  for (const route of ["", ...routes.map(([, route]) => route)]) {
    if (!fs.statSync(path.join(exported, route, "index.html")).isFile()) {
      throw new Error(`Missing exported page: /${route}`);
    }
  }
  const destination = path.join(root, ".ios-web");
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(exported, destination, { recursive: true });

  execFileSync(process.execPath, [path.join(root, "node_modules/@capacitor/cli/bin/capacitor"), "sync", "ios"], {
    cwd: root,
    env: { ...process.env, CAPACITOR_TARGET: "ios" },
    stdio: "inherit",
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}