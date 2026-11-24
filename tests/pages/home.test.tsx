import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";

// Mock next/link since it requires router context
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("HomePage", () => {
  it("renders the hero heading", () => {
    renderWithIntl(<HomePage />);
    expect(screen.getByText(/Plan smarter,/)).toBeInTheDocument();
    expect(screen.getByText(/eat better/)).toBeInTheDocument();
  });

  it("renders all four feature cards", () => {
    renderWithIntl(<HomePage />);
    expect(screen.getByText("Meal Plan")).toBeInTheDocument();
    expect(screen.getByText("Recipes")).toBeInTheDocument();
    expect(screen.getByText("Inventory")).toBeInTheDocument();
    expect(screen.getByText("Shopping List")).toBeInTheDocument();
  });

  it("renders feature card links with correct hrefs", () => {
    renderWithIntl(<HomePage />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/meal-plan");
    expect(hrefs).toContain("/recipes");
    expect(hrefs).toContain("/inventory");
    expect(hrefs).toContain("/shopping-list");
  });

  it("renders the 'Coming soon' section", () => {
    renderWithIntl(<HomePage />);
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
