import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5174",
      url: baseURL,
      reuseExistingServer:
        !process.env.CI && process.env.PLAYWRIGHT_REUSE_DEV_SERVER === "1",
      timeout: 30_000,
    },
    {
      command:
        "npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
