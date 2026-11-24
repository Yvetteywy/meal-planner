"use client";

import Link from "next/link";
import {
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Package,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const features = [
    {
      href: "/meal-plan",
      icon: CalendarDays,
      title: tNav("mealPlan"),
      description: t("mealPlanDesc"),
      color: "bg-blue-50 text-blue-600",
    },
    {
      href: "/recipes",
      icon: ChefHat,
      title: tNav("recipes"),
      description: t("recipesDesc"),
      color: "bg-amber-50 text-amber-600",
    },
    {
      href: "/inventory",
      icon: Package,
      title: tNav("inventory"),
      description: t("inventoryDesc"),
      color: "bg-green-50 text-green-600",
    },
    {
      href: "/shopping-list",
      icon: ShoppingCart,
      title: tNav("shoppingList"),
      description: t("shoppingListDesc"),
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="text-center space-y-4 py-10">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          {t("badge")}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          <span className="block sm:inline">{t("title")}</span>{" "}
          <span className="block sm:inline text-brand-600">{t("titleAccent")}</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          {t("description")}
        </p>
      </section>

      {/* Feature cards */}
      <section>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {t("featuresHeading")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ href, icon: Icon, title, description, color }) => (
            <Link
              key={href}
              href={href}
              className="group flex gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Roadmap teaser */}
      <section className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          {t("roadmapHeading")}
        </h2>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          <li>{t("roadmap1")}</li>
          <li>{t("roadmap2")}</li>
          <li>{t("roadmap3")}</li>
          <li>{t("roadmap4")}</li>
        </ul>
      </section>
    </div>
  );
}
