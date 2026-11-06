import { test, expect } from "@playwright/test"
import { beginSession, PUZZLE_ROOM_IDS, SAVE_KEY } from "../apps/web/src/game/session.ts"

test("US-01 / US-07 / US-09: play, move, save, reload and continue", async ({ page }) => {
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await page.screenshot({ path: "test-results/dev1-menu.png" })
  await expect(page.getByRole("button", { name: "CONTINUER", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: /JOUER/ }).click()
  await expect(page.getByRole("timer")).toHaveText("15:00")
  await expect(page.locator("canvas")).toBeVisible()
  await page.keyboard.down("ArrowRight")
  await expect
    .poll(() =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key))?.playerPosition.x, SAVE_KEY),
    )
    .toBeGreaterThan(1020)
  await page.keyboard.up("ArrowRight")
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click()
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY)
  expect(saved.remainingMs).toBeLessThan(900000)
  expect(saved.playerPosition.x).toBeGreaterThan(1020)
  await page.reload()
  await expect(page.getByRole("button", { name: "CONTINUER", exact: true })).toBeEnabled()
  await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  await expect(page.getByRole("timer")).not.toHaveText("15:00")
  const position = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).playerPosition,
    SAVE_KEY,
  )
  expect(position.x).toBeCloseTo(saved.playerPosition.x, 0)
  expect(errors).toEqual([])
})

test("US-09: menu pauses the countdown and a new game is confirmed", async ({ page }) => {
  await page.clock.install()
  await page.goto("/")
  await page.getByRole("button", { name: /JOUER/ }).click()
  await page.clock.runFor(2100)
  await expect(page.getByRole("timer")).toHaveText("14:58")
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click()
  const remaining = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).remainingMs,
    SAVE_KEY,
  )
  await page.clock.runFor(30000)
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).remainingMs, SAVE_KEY),
  ).toBe(remaining)
  await page.getByRole("button", { name: /JOUER/ }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.getByRole("button", { name: "FERMER" }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: /JOUER/ }).click()
  await page.getByRole("button", { name: "RECOMMENCER", exact: true }).click()
  await expect(page.getByRole("timer")).toHaveText("15:00")
})

test("US-10: expiration survives reload, then reboot starts a new loop", async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
    },
    {
      key: SAVE_KEY,
      value: {
        ...beginSession(),
        remainingMs: 1500,
        solvedRoomIds: ["gaming"],
        knownHintIds: ["hint-1"],
      },
    },
  )
  await page.goto("/game")
  await page.clock.runFor(2000)
  await expect(page.getByRole("heading", { name: "TEMPS ÉCOULÉ" })).toBeVisible()
  await expect(page.getByRole("timer")).toHaveText("00:00")
  await page.reload()
  await expect(page.getByRole("heading", { name: "TEMPS ÉCOULÉ" })).toBeVisible()
  await page.getByRole("button", { name: "RECOMMENCER LA BOUCLE" }).click()
  await expect(page.getByRole("timer")).toHaveText("15:00")
  await expect(page.getByText("Boucle n°2 · 0/5 modules")).toBeVisible()
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).knownHintIds, SAVE_KEY),
  ).toEqual(["hint-1"])
})

test("US-12: five puzzle events open victory, which is saved and can be replayed", async ({
  page,
}) => {
  await page.goto("/victory")
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole("button", { name: /JOUER/ }).click()
  await page.evaluate(
    async (rooms) => {
      const { gameEvents, GAME_EVENTS } = await import("/src/game/events.ts")
      gameEvents.emit(GAME_EVENTS.puzzleSolved, "unknown")
      for (const room of rooms) {
        gameEvents.emit(GAME_EVENTS.puzzleSolved, room)
        gameEvents.emit(GAME_EVENTS.puzzleSolved, room)
      }
    },
    PUZZLE_ROOM_IDS.slice(0, 4),
  )
  await expect(page.getByText("4/5 modules", { exact: false })).toBeVisible()
  await expect(page).toHaveURL(/\/game$/)
  await page.evaluate(async () => {
    const { gameEvents, GAME_EVENTS } = await import("/src/game/events.ts")
    gameEvents.emit(GAME_EVENTS.puzzleSolved, "amphitheater")
  })
  await expect(page.getByRole("heading", { name: "LA BOUCLE EST BRISÉE !" })).toBeVisible()
  await expect(page).toHaveURL(/\/victory$/)
  await page.screenshot({ path: "test-results/dev1-victory.png" })
  await page.reload()
  await expect(page.getByRole("heading", { name: "LA BOUCLE EST BRISÉE !" })).toBeVisible()
  await page.getByRole("button", { name: /REJOUER/ }).click()
  await expect(page.getByRole("timer")).toHaveText("15:00")
  await expect(page).toHaveURL(/\/game$/)
})

test("US-01: menu remains usable on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await expect(page.getByRole("button", { name: /JOUER/ })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: "test-results/dev1-menu-mobile.png" })
})
