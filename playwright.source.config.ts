import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 120000,
  expect: { timeout: 10000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    actionTimeout: 20000,
    baseURL: "http://127.0.0.1:5194",
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run server",
      url: "http://127.0.0.1:5197/api/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev -- --port 5194 --strictPort",
      url: "http://127.0.0.1:5194",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
})
