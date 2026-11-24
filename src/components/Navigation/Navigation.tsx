"use client";

import { isPackagedIOS, recipeHref } from "@/lib/recipe-href";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  ChefHat,
  ShoppingCart,
  Package,
  Home,
  Bell,
  Star,
  AlertCircle,
  Calendar,
  X,
  Settings,
} from "lucide-react";
import { dataService } from "@/lib/data-service";
import { generateNotifications } from "@/lib/notification-utils";
import type { AppNotification } from "@/lib/types";

const linkDefs = [
  { href: "/", labelKey: "dashboard" as const, icon: Home },
  { href: "/meal-plan", labelKey: "mealPlan" as const, icon: CalendarDays },
  { href: "/recipes", labelKey: "recipes" as const, icon: ChefHat },
  { href: "/inventory", labelKey: "inventory" as const, icon: Package },
  { href: "/shopping-list", labelKey: "shoppingList" as const, icon: ShoppingCart },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
];

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "rating-reminder":
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Star className="w-4 h-4 text-amber-500" />
        </div>
      );
    case "expiry-alert":
      return (
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      );
    case "meal-reminder":
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4 text-gray-500" />
        </div>
      );
  }
}

function timeAgo(dateStr: string, tTime: (key: string, values?: Record<string, number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return tTime("justNow");
  if (hours < 24) return tTime("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return tTime("yesterday");
  return tTime("daysAgo", { count: days });
}

export function Navigation() {
  const pathname = usePathname();
  const activePath = isPackagedIOS ? pathname.replace(/\/$/, "") || "/" : pathname;
  const router = useRouter();
  const t = useTranslations("nav");
  const tTime = useTranslations("time");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load and generate real notifications
  useEffect(() => {
    const existing = dataService.notifications.getAll();
    const inventory = dataService.inventory.getAll();
    const meals = dataService.meals.getAll();
    const recipes = dataService.recipes.getAll();
    const updated = generateNotifications(existing, inventory, meals, recipes);
    // Save if new notifications were generated
    if (updated.length !== existing.length) {
      dataService.notifications.saveAll(updated);
    }
    setNotifications(updated);
  }, []);

  const unreadCount = notifications.filter(
    (n) => !n.read && !n.dismissed
  ).length;
  const activeNotifications = notifications.filter((n) => !n.dismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const persistNotifications = (updated: AppNotification[]) => {
    setNotifications(updated);
    dataService.notifications.saveAll(updated);
  };

  const markRead = (id: string) => {
    persistNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismiss = (id: string) => {
    persistNotifications(
      notifications.map((n) => (n.id === id ? { ...n, dismissed: true } : n))
    );
  };

  const markAllRead = () => {
    persistNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showNotifications]);

  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale")
      || document.cookie.match(/locale=([\w-]+)/)?.[1];
    if (stored) setCurrentLocale(stored);
  }, []);

  // Hide nav in cook mode
  if (pathname.startsWith("/cook/")) return null;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl text-brand-600 shrink-0"
          >
            <ChefHat className="w-6 h-6" />
            {t("brand")}
          </Link>

          {/* Nav links — icons only on small screens, icons + text on large */}
          <ul className="hidden sm:flex items-center gap-1 ml-4">
            {linkDefs.map(({ href, labelKey, icon: Icon }) => {
              const active = activePath === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={t(labelKey)}
                    className={`flex items-center gap-1.5 px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{t(labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Language toggle */}
          <button
            onClick={() => {
              const next = currentLocale === "en" ? "zh-CN" : "en";
              localStorage.setItem("locale", next);
              document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
              window.location.reload();
            }}
            className="px-2 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {currentLocale === "zh-CN" ? "EN" : "简体中文"}
          </button>

          {/* Notification bell */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {t("notifications")}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      {t("markAllRead")}
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {activeNotifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                      {t("noNotifications")}
                    </div>
                  ) : (
                    activeNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          setShowNotifications(false);
                          if (n.type === "rating-reminder" && n.recipeId) {
                            router.push(recipeHref("detail", n.recipeId));
                          } else if (n.type === "expiry-alert") {
                            router.push("/inventory");
                          } else if (n.type === "meal-reminder") {
                            router.push("/meal-plan");
                          }
                        }}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                          !n.read ? "bg-brand-50/30" : ""
                        }`}
                      >
                        <NotificationIcon type={n.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm ${
                                !n.read
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {timeAgo(n.createdAt, tTime)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          className="shrink-0 p-1 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom bar */}
        <ul className="flex sm:hidden items-center justify-around h-14 border-t border-gray-100">
          {linkDefs.map(({ href, labelKey, icon: Icon }) => {
            const active = activePath === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                    active ? "text-brand-600" : "text-gray-500"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
