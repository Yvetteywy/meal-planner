import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Desktop — primary test target
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    // Tablet — skip until mobile UX is optimized
    {
      name: "ipad",
      use: { ...devices["iPad (gen 7)"] },
      grep: /@mobile/,
    },
    // Mobile — skip until mobile UX is optimized
    {
      name: "iphone",
      use: { ...devices["iPhone 14"] },
      grep: /@mobile/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
