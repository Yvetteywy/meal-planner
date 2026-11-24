import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation/Navigation";
import { I18nProvider } from "@/components/I18nProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Meal Planner",
  description:
    "Plan meals, get AI recipe recommendations, track your pantry, and manage your shopping list.",
  manifest: "/manifest.json",
  themeColor: "#16a34a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meal Planner",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          <Navigation />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
