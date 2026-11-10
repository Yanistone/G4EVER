import { enterCampus } from "./fps-helpers"
import { test, expect } from "@playwright/test"
import { createSession, advanceTime, readSession } from "../../apps/web/src/jeu/game/session"
import {
  canWalkAt,
  getNearbyInteraction,
  START_POSITION,
  WORLD_ROOMS,
} from "../../apps/web/src/jeu/game/world"

test("all seven rooms and their interaction zones are reachable on foot", () => {
  const queue = [START_POSITION],
    seen = new Set<string>()
  const reached = new Set<string>()
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i],
      key = `${p.x},${p.y}`
    if (seen.has(key)) continue
    seen.add(key)
    const room = getNearbyInteraction(p)
    if (room) reached.add(room.id)
    for (const [dx, dy] of [
      [4, 0],
      [-4, 0],
      [0, 4],
      [0, -4],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy }
      if (!seen.has(`${n.x},${n.y}`) && canWalkAt(n)) queue.push(n)
    }
  }
  expect([...reached].sort()).toEqual(WORLD_ROOMS.map((r) => r.id).sort())
  expect(canWalkAt({ x: 0, y: 0 })).toBe(false)
})
test("deadline reboots modules but retains clues and endings", () => {
  const s = {
    ...createSession("a", [1]),
    started: true,
    gameMinute: 950,
    solvedRoomIds: ["gaming"],
    knownHintIds: ["gaming"],
    hasVendingClue: true,
  }
  const next = advanceTime(s, 20)
  expect(next.loopNumber).toBe(2)
  expect(next.gameMinute).toBe(540)
  expect(next.solvedRoomIds).toEqual([])
  expect(next.knownHintIds).toEqual(["gaming"])
  expect(next.hasVendingClue).toBe(true)
  expect(advanceTime({ ...s, ending: 1 }, 20).gameMinute).toBe(950)
  expect(readSession("a", { getItem: () => "{bad" }).started).toBe(false)
})
test("local profile registration, saving, logout and login", async ({ page }) => {
  await page.goto("/#auth")
  await page.getByLabel("TON PSEUDO").fill("Robin Test")
  await page.getByRole("button", { name: "CRÉER ET JOUER" }).click()
  await expect(page).toHaveURL(/#menu$/)
  await page.getByRole("button", { name: "NOUVELLE PARTIE", exact: true }).click()
  await page.getByRole("listitem", { name: "Mode Classique" }).click()
  await page.getByRole("button", { name: /^PASSER/ }).click()
  await page.getByRole("button", { name: "LANCER LA JOURNÉE" }).click()
  await expect(page.getByTestId("exploration")).toBeVisible()
  await enterCampus(page)
  const before = await page.locator(".fps-canvas").getAttribute("data-position")
  await page.keyboard.down("w")
  await expect
    .poll(() => page.locator(".fps-canvas").getAttribute("data-position"))
    .not.toBe(before)
  await page.keyboard.up("w")
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click()
  await page.getByRole("button", { name: /Déconnexion/ }).click()
  await expect(page).toHaveURL(/#auth$/)
  await page.getByLabel("TON PSEUDO").fill("Robin Test")
  await page.getByRole("button", { name: "SE CONNECTER" }).click()
  await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  await expect(page.getByTestId("exploration")).toBeVisible()
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "g4:3d:settings",
      JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
    ),
  )
})
