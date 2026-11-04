import { STATION_TARGETS } from "../../apps/web/src/jeu/game/escape"
import { test, expect } from "@playwright/test"
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js"
import { Scene } from "@babylonjs/core/scene.js"
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { FpsController } from "../../apps/web/src/jeu/three/controller"
import { WORLD_DOORS, WORLD_ROOMS, canWalkAt } from "../../apps/web/src/jeu/game/world"
import { enterCampus, lookAt } from "./fps-helpers"
import { createSession } from "../../apps/web/src/jeu/game/session"
const settings = { sensitivity: 1, fov: 80, volume: 0, quality: "eco" as const, motion: false }
test("FPS controller blocks every closed door, crosses open thresholds and stops at furniture", () => {
  const engine = new NullEngine(),
    scene = new Scene(engine),
    camera = new UniversalCamera("test", Vector3.Zero(), scene)
  for (const door of WORLD_DOORS) {
    const r = WORLD_ROOMS.find((r) => r.id === door.roomId)!,
      horizontal = door.side === "top" || door.side === "bottom"
    const axis = horizontal
      ? door.side === "top"
        ? r.floor.y
        : r.floor.y + r.floor.height
      : door.side === "left"
        ? r.floor.x
        : r.floor.x + r.floor.width
    const from = horizontal ? door.bounds.x : door.bounds.y,
      to = from + (horizontal ? door.bounds.width : door.bounds.height)
    const p = horizontal
      ? { x: (from + to) / 2, y: axis - 35 }
      : { x: axis - 35, y: (from + to) / 2 }
    expect(canWalkAt(p), door.id).toBe(true)
    const controller = new FpsController(camera, p)
    controller.yaw = horizontal ? 0 : Math.PI / 2
    controller.keys.add("KeyW")
    const collider = { horizontal, axis, from, to, openness: 0 }
    for (let i = 0; i < 100; i++) controller.update(0.016, true, settings, [collider], [])
    expect(horizontal ? controller.position.y : controller.position.x, door.id).toBeLessThan(
      axis - 16,
    )
    collider.openness = 1
    for (let i = 0; i < 35; i++) controller.update(0.016, true, settings, [collider], [])
    expect(horizontal ? controller.position.y : controller.position.x, door.id).toBeGreaterThan(
      axis + 16,
    )
  }
  const c = new FpsController(camera, { x: 690, y: 590 })
  c.yaw = Math.PI / 2
  c.keys.add("KeyW")
  for (let i = 0; i < 120; i++) c.update(0.016, true, settings, [], [])
  expect(c.position.x).toBeLessThanOrEqual(737)
  expect(canWalkAt(c.position)).toBe(true)
  c.stop()
  const before = { ...c.position }
  c.update(1, false, settings, [], [])
  expect(c.position).toEqual(before)
  engine.dispose()
})
test("3D world, real raycast terminal, NPC animation, inventory, settings and pause", async ({
  page,
}) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.addInitScript(
    (s) => {
      const p = { id: "fps-ui", nickname: "FPS", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      localStorage.setItem("g4-ever:save:fps-ui", JSON.stringify(s))
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
    },
    { ...createSession("fps-ui"), started: true, playerPosition: { x: 730, y: 600 } },
  )
  await page.goto("/#explore")
  await enterCampus(page)
  const canvas = page.locator(".fps-canvas")
  expect(Number(await canvas.getAttribute("data-meshes"))).toBeLessThan(1100)
  const npcBefore = await canvas.getAttribute("data-npcs")
  await page.waitForTimeout(900)
  expect(await canvas.getAttribute("data-npcs")).not.toEqual(npcBefore)
  await lookAt(page, STATION_TARGETS.cafeteria, STATION_TARGETS.cafeteria.height)
  await expect(page.locator(".fps-interaction")).toContainText("Activer la borne", {
    timeout: 15000,
  })
  await page.keyboard.press("e")
  await expect(page).toHaveURL(/#puzzle$/)
  await page.getByLabel("Nombre de tasses bleues").fill("5")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page).toHaveURL(/#success$/)
  await page.getByRole("button", { name: "CONTINUER ▸" }).click()
  await expect(page).toHaveURL(/#explore$/)
  await enterCampus(page)
  await page.keyboard.press("i")
  await expect(page.getByRole("dialog", { name: "Inventaire", exact: true })).toBeVisible()
  await expect(page.locator(".inventory-summary")).toContainText("1/8")
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "Paramètres 3D" }).click()
  const fov = page.getByRole("slider", { name: "Champ de vision" })
  await fov.fill("95")
  await page.keyboard.press("Escape")
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("g4:3d:settings")!).fov)).toBe(
    95,
  )
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "PAUSE", exact: true })).toBeVisible()
  const before = await canvas.getAttribute("data-position")
  await page.keyboard.press("w")
  expect(await canvas.getAttribute("data-position")).toBe(before)
  await page.getByRole("button", { name: "REPRENDRE", exact: true }).click()
  await page.screenshot({ path: "docs/3d/verified-game.png" })
  expect(errors).toEqual([])
})
test("documents are collected and examined; a live NPC gives guidance", async ({ page }) => {
  test.setTimeout(90000)
  await page.addInitScript(
    (s) => {
      const p = { id: "fps-items", nickname: "Lecteur", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      if (!localStorage.getItem("g4-ever:save:fps-items"))
        localStorage.setItem("g4-ever:save:fps-items", JSON.stringify(s))
      const fixture = sessionStorage.getItem("npc-test-position")
      if (fixture) {
        const k = "g4-ever:save:fps-items",
          saved = JSON.parse(localStorage.getItem(k)!)
        saved.playerPosition = JSON.parse(fixture)
        localStorage.setItem(k, JSON.stringify(saved))
        sessionStorage.removeItem("npc-test-position")
      }
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
    },
    { ...createSession("fps-items"), started: true, playerPosition: { x: 700, y: 640 } },
  )
  await page.goto("/#explore")
  await enterCampus(page)
  await lookAt(page, { x: 650, y: 640 }, 0.925)
  await expect(page.locator(".fps-interaction")).toContainText("Carnet de maintenance")
  await page.keyboard.press("e")
  await expect(page.getByRole("status")).toContainText("Document ajouté")
  await expect(page.locator(".document-view")).toBeVisible()
  await expect(page.locator(".document-view")).toContainText("Huit énigmes")
  await page.keyboard.press("Escape")
  await page.evaluate(() => {
    sessionStorage.setItem("npc-test-position", JSON.stringify({ x: 700, y: 530 }))
  })
  await page.reload()
  await enterCampus(page)
  await lookAt(page, { x: 650, y: 530 }, 1.67)
  await expect(page.locator(".fps-interaction")).toContainText("Parler à Noa")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "Noa", exact: true })).toBeVisible()
  await expect(page.locator(".npc-dialogue")).toContainText("Le café de 9h00")
  await page.getByRole("button", { name: /JE SUIS BLOQUÉ/ }).click()
  await expect(page.locator(".npc-help")).toContainText("Seule une couleur compte")
  await page.screenshot({ path: "docs/3d/npc-dialogue.png" })
})
test("raycast opens a sliding door and allows leaving the refectory", async ({ page }) => {
  test.setTimeout(90000)
  await page.addInitScript(
    (s) => {
      const p = { id: "fps-door", nickname: "Portes", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      localStorage.setItem("g4-ever:save:fps-door", JSON.stringify(s))
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
    },
    { ...createSession("fps-door"), started: true, playerPosition: { x: 630, y: 546 } },
  )
  await page.goto("/#explore")
  await enterCampus(page)
  await lookAt(page, { x: 580, y: 546 }, 1.6)
  await expect(page.locator(".fps-interaction")).toContainText("Ouvrir · Réfectoire")
  await page.keyboard.down("w")
  await page.waitForTimeout(800)
  await page.keyboard.up("w")
  expect(
    JSON.parse((await page.locator(".fps-canvas").getAttribute("data-position"))!).x,
  ).toBeGreaterThan(596)
  await page.keyboard.press("e")
  await expect
    .poll(
      async () =>
        JSON.parse((await page.locator(".fps-canvas").getAttribute("data-doors"))!).find(
          (d: { id: string }) => d.id === "cafeteria-west",
        ).open,
    )
    .toBeGreaterThan(0.9)
  await page.keyboard.down("w")
  try {
    await expect
      .poll(
        async () =>
          JSON.parse((await page.locator(".fps-canvas").getAttribute("data-position"))!).x,
        { timeout: 15000 },
      )
      .toBeLessThan(555)
  } finally {
    await page.keyboard.up("w")
  }
  await page.screenshot({ path: "docs/3d/open-door.png" })
})
