import { defineConfig } from "@playwright/test"
import { fileURLToPath } from "node:url"

export default defineConfig({
  testDir: "./tests",
  testMatch: ["integration.spec.ts", "source/race-engine.spec.ts"],
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5200",
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
      args: ["--enable-unsafe-swiftshader"],
    },
  },
  webServer: [
    {
      command: "node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5200 --strictPort",
      cwd: fileURLToPath(new URL("./apps/web", import.meta.url)),
      url: "http://127.0.0.1:5200",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node --import tsx server/index.ts",
      url: "http://127.0.0.1:5197/api/health",
      reuseExistingServer: !process.env.CI,
    },
  ],
})
