import { STATION_TARGETS, DOCUMENT_HEIGHTS } from "../../apps/web/src/game/escape"
import { campaignDeck } from "../../apps/web/src/game/campaignDeck"
import { enterCampus, lookAt } from "./fps-helpers"
import { test, expect } from "@playwright/test"
import { createSession, advanceTime, readSession } from "../../apps/web/src/game/session"
import {
  canWalkAt,
  getNearbyInteraction,
  START_POSITION,
  WORLD_ROOMS,
} from "../../apps/web/src/game/world"

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

test("five real modules unlock the Sormiou ending and persist progress", async ({ page }) => {
  test.setTimeout(300000)
  const profile = { id: "campaign-test", nickname: "Campagne", createdAt: new Date().toISOString() }
  await page.addInitScript(
    ({ profile }) => {
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [profile], activeProfileId: profile.id }),
      )
      const fixture = sessionStorage.getItem("test-position")
      if (fixture) {
        const key = "g4-ever:save:campaign-test",
          save = JSON.parse(localStorage.getItem(key)!)
        save.playerPosition = JSON.parse(fixture)
        localStorage.setItem(key, JSON.stringify(save))
        sessionStorage.removeItem("test-position")
      }
    },
    { profile },
  )
  await page.goto("/#menu")
  await page.getByRole("button", { name: "NOUVELLE PARTIE", exact: true }).click()
  await page.getByRole("button", { name: /^PASSER/ }).click()
  await page.getByRole("button", { name: "LANCER LA JOURNÉE" }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("g4-ever:save:campaign-test") ?? "null")?.challengeSeed,
      ),
    )
    .toBeTruthy()
  const deck = campaignDeck(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("g4-ever:save:campaign-test")!).challengeSeed,
    ),
  )
  let solved = 0
  for (const room of WORLD_ROOMS.filter((r) => r.kind === "puzzle")) {
    console.log("MODULE", room.id, "document")
    const task = deck.find((p) => p.roomId === room.id)!.practical!
    const doc = task.document
    const approaches = []
    for (let dx = -65; dx <= 65; dx += 8)
      for (let dy = -65; dy <= 65; dy += 8) {
        const pos = { x: doc.position.x + dx, y: doc.position.y + dy }
        if (canWalkAt(pos)) approaches.push(pos)
      }
    approaches.sort(
      (a, b) =>
        Math.hypot(a.x - doc.position.x, a.y - doc.position.y) -
        Math.hypot(b.x - doc.position.x, b.y - doc.position.y),
    )
    await page.evaluate(
      (pos) => sessionStorage.setItem("test-position", JSON.stringify(pos)),
      approaches[0],
    )
    await page.reload()
    await enterCampus(page)
    await lookAt(page, doc.position, DOCUMENT_HEIGHTS[room.id])
    await expect(page.locator(".fps-interaction")).toContainText(doc.name)
    await page.keyboard.press("e")
    await expect(page.locator(".document-view")).toContainText(doc.name)
    await page.keyboard.press("Escape")
    console.log("DOCUMENT OK", room.id)
    const candidates = []
    for (let dx = -60; dx <= 60; dx += 10)
      for (let dy = -60; dy <= 60; dy += 10) {
        const p = { x: room.interactionPosition.x + dx, y: room.interactionPosition.y + dy }
        if (canWalkAt(p) && getNearbyInteraction(p)?.id === room.id) candidates.push(p)
      }
    expect(candidates.length).toBeGreaterThan(0)
    await page.evaluate(
      ({ pos }) => {
        sessionStorage.setItem("test-position", JSON.stringify(pos))
      },
      { pos: candidates[0] },
    )
    await page.reload()
    await expect(page.getByTestId("exploration")).toBeVisible()
    await enterCampus(page)
    await lookAt(page, STATION_TARGETS[room.id], STATION_TARGETS[room.id].height)
    await expect(page.locator(".fps-interaction")).toBeVisible()
    await page.keyboard.press("e")
    await expect(page).toHaveURL(/#puzzle$/)
    console.log("TERMINAL OUVERT", room.id)
    const puzzle = deck.find((p) => p.roomId === room.id)!,
      answer = puzzle.question.answers.find((a) => a.id === puzzle.correctAnswerId)!
    if (puzzle.practical)
      await page.getByLabel("Réponse du terminal").fill(puzzle.practical.accepted[0])
    else await page.locator(".terminal-answers button").filter({ hasText: answer.label }).click()
    await page.getByRole("button", { name: "Valider la réponse →" }).click()
    await expect(page).toHaveURL(/#success$/)
    await page.getByRole("button", { name: "CONTINUER ▸", exact: true }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("g4-ever:save:campaign-test")!).solvedRoomIds.length,
        ),
      )
      .toBe(++solved)
  }
  await page.evaluate(() => {
    sessionStorage.setItem("test-position", JSON.stringify({ x: 840, y: 920 }))
  })
  await page.reload()
  await expect(page.getByTestId("exploration")).toBeVisible()
  await enterCampus(page)
  await lookAt(page, STATION_TARGETS.sormiou, STATION_TARGETS.sormiou.height)
  await expect(page.locator(".fps-interaction")).toBeVisible()
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "CONSOLE DE SORMIOU" })).toBeVisible()
  await page.getByRole("button", { name: "INSTALLER LE CORRECTIF" }).click()
  await expect(page).toHaveURL(/#end$/)
  await expect(page.getByText("Le correctif", { exact: true })).toBeVisible()
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "g4:3d:settings",
      JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
    ),
  )
})
