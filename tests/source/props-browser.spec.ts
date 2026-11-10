import { test, expect } from "@playwright/test"
import { createSession } from "../../apps/web/src/jeu/game/session"
import { STATION_TARGETS } from "../../apps/web/src/jeu/game/escape"
import { enterCampus, lookAt } from "./fps-helpers"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (s) => {
      const p = { id: "props-qa", nickname: "Objets", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      const point = JSON.parse(sessionStorage.getItem("fixture-prop-position") ?? "null")
      localStorage.setItem(
        "g4-ever:save:props-qa",
        JSON.stringify({ ...s, playerPosition: point ?? { x: 730, y: 225 } }),
      )
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
    },
    {
      ...createSession("props-qa"),
      started: true,
      solvedRoomIds: ["classroom", "cafeteria", "gaming", "cowork", "amphitheater"],
    },
  )
})
test("vending glass and the server front remain usable through the actual scene ray", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/#explore")
  await enterCampus(page)
  await lookAt(page, STATION_TARGETS.vending, STATION_TARGETS.vending.height)
  await expect(page.locator(".fps-interaction")).toContainText("Inspecter le distributeur")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "LE TICKET DES DISTRIBUTEURS" })).toBeVisible()
  await page.evaluate(() =>
    sessionStorage.setItem("fixture-prop-position", JSON.stringify({ x: 830, y: 920 })),
  )
  await page.reload()
  await enterCampus(page)
  await lookAt(page, STATION_TARGETS.sormiou, STATION_TARGETS.sormiou.height)
  await expect(page.locator(".fps-interaction")).toContainText("Ouvrir la console")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "CONSOLE DE SORMIOU" })).toBeVisible()
  expect(errors).toEqual([])
})
test("quality can change in pause and exploration still resumes", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/#explore")
  await enterCampus(page)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "PAUSE", exact: true })).toBeVisible()
  for (const quality of ["high", "eco", "balanced"]) {
    await page.getByLabel("Qualité graphique").selectOption(quality)
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("g4:3d:settings")!).quality))
      .toBe(quality)
    await page.waitForTimeout(250)
  }
  await page.getByRole("button", { name: "REPRENDRE", exact: true }).click()
  await enterCampus(page)
  await lookAt(page, STATION_TARGETS.vending, STATION_TARGETS.vending.height)
  await expect(page.locator(".fps-interaction")).toContainText("Inspecter le distributeur")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "LE TICKET DES DISTRIBUTEURS" })).toBeVisible()
  expect(errors).toEqual([])
})
