"use client";

import { useState, useEffect } from "react";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";
import zhCNMessages from "@/messages/zh-CN.json";

const messagesMap: Record<string, Record<string, unknown>> = {
  en: enMessages,
  "zh-CN": zhCNMessages,
};

function getStoredLocale(): string {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("locale")
    || document.cookie.match(/locale=([\w-]+)/)?.[1]
    || "en";
  const validLocales = ["en", "zh-CN"];
  return validLocales.includes(stored) ? stored : "en";
}

export function I18nProvider({ children }: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocale(getStoredLocale());
    setReady(true);
  }, []);

  // Don't render children until locale is determined to avoid flash
  if (!ready) {
    return null;
  }

  return (
    <NextIntlClientProvider key={locale} messages={messagesMap[locale]} locale={locale}>
      {children}
    </NextIntlClientProvider>
  );
}
