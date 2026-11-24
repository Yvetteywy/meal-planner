import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/components/I18nProvider";
import { useTranslations } from "next-intl";

function TestComponent() {
  const t = useTranslations("nav");
  return <span data-testid="brand">{t("brand")}</span>;
}

beforeEach(() => {
  localStorage.clear();
  document.cookie = "locale=; max-age=0";
});

describe("I18nProvider", () => {
  it("defaults to English when no locale is stored", async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("brand").textContent).toBe("Meal Planner");
    });
  });

  it("loads Chinese when localStorage has zh-CN", async () => {
    localStorage.setItem("locale", "zh-CN");
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("brand").textContent).toBe("膳食规划");
    });
  });

  it("loads Chinese when cookie has zh-CN", async () => {
    document.cookie = "locale=zh-CN; path=/";
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("brand").textContent).toBe("膳食规划");
    });
  });

  it("falls back to English for invalid locale", async () => {
    localStorage.setItem("locale", "fr-FR");
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("brand").textContent).toBe("Meal Planner");
    });
  });

  it("prefers localStorage over cookie", async () => {
    localStorage.setItem("locale", "zh-CN");
    document.cookie = "locale=en; path=/";
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("brand").textContent).toBe("膳食规划");
    });
  });
});
