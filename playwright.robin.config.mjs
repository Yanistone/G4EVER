import { defineConfig } from "@playwright/test"
import { fileURLToPath } from "node:url"

export default defineConfig({
  testDir: "./tests",
  testMatch: "robin-browser.spec.ts",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:5198",
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : {}),
      args: ["--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    command: "node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5198 --strictPort",
    cwd: fileURLToPath(new URL("./apps/web", import.meta.url)),
    url: "http://127.0.0.1:5198",
    reuseExistingServer: !process.env.CI,
  },
})
