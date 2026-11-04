import { defineConfig } from "@playwright/test"
import { fileURLToPath } from "node:url"

export default defineConfig({
  testDir: "./tests/source",
  testMatch: [
    "adventure.spec.ts",
    "scenario.spec.ts",
    "campaign-deck.spec.ts",
    "fps.spec.ts",
    "practical-ui.spec.ts",
    "race-browser.spec.ts",
    "race-engine.spec.ts",
    "prop-geometry.spec.ts",
    "doors.spec.ts",
    "props-browser.spec.ts",
  ],
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  use: {
    baseURL: "http://127.0.0.1:5194",
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
    actionTimeout: 20000,
    screenshot: "only-on-failure",
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
      args: ["--enable-unsafe-swiftshader"],
    },
  },
  webServer: [
    {
      command: "node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5194 --strictPort",
      cwd: fileURLToPath(new URL("./apps/web", import.meta.url)),
      url: "http://127.0.0.1:5194",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node --import tsx server/index.ts",
      url: "http://127.0.0.1:5197/api/health",
      reuseExistingServer: !process.env.CI,
    },
  ],
})
