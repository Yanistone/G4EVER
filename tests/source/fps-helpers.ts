import { STATION_TARGETS } from "../../apps/web/src/game/escape"
import { expect } from "@playwright/test"
import type { Page } from "@playwright/test"
export async function enterCampus(page: Page) {
  await expect(page.locator(".fps-canvas")).toHaveAttribute("data-ready", "true", {
    timeout: 60000,
  })
  const enter = page.getByRole("button", { name: /Entrer dans le campus/ })
  if (await enter.isVisible()) await enter.click()
  await expect(page.locator(".fps-canvas")).toHaveAttribute(
    "data-input-mode",
    /pointer-lock|drag/,
    { timeout: 15000 },
  )
}
export async function lookAt(page: Page, p: { x: number; y: number }, height = 1.6) {
  const c = page.locator(".fps-canvas")
  await expect(c).toHaveAttribute("data-position", /x/)
  const pos = JSON.parse((await c.getAttribute("data-position"))!)
  const yaw = Number(await c.getAttribute("data-yaw")),
    pitch = Number(await c.getAttribute("data-pitch"))
  const desired = Math.atan2(p.x - pos.x, p.y - pos.y),
    delta = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw))
  const angle = -Math.atan2(height - 1.72, Math.hypot(p.x - pos.x, p.y - pos.y) * 0.025)
  await page.evaluate(
    ({ dx, dy }) => {
      document
        .querySelector("canvas.fps-canvas")!
        .dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
      document.dispatchEvent(
        new MouseEvent("mousemove", { movementX: dx, movementY: dy, bubbles: true }),
      )
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }))
    },
    { dx: delta / 0.002, dy: (angle - pitch) / 0.002 },
  )
  await expect
    .poll(async () => Math.abs(Number(await c.getAttribute("data-yaw")) - (yaw + delta)), {
      timeout: 10000,
    })
    .toBeLessThan(0.004)
}
export async function approachFirstTerminal(page: Page) {
  await enterCampus(page)
  await lookAt(page, { x: 774, y: 600 })
  await page.keyboard.down("w")
  try {
    await expect
      .poll(
        async () =>
          JSON.parse((await page.locator(".fps-canvas").getAttribute("data-position"))!).x,
        { timeout: 15000 },
      )
      .toBeGreaterThan(730)
  } finally {
    await page.keyboard.up("w")
  }
  await page.waitForTimeout(600)
  await lookAt(page, STATION_TARGETS.cafeteria, STATION_TARGETS.cafeteria.height)
  await expect(page.locator(".fps-interaction")).toContainText("Activer la borne", {
    timeout: 15000,
  })
  await page.keyboard.press("e")
}

export async function collectNetworkEvidence(page: Page) {
  await enterCampus(page)
  await lookAt(page, { x: 830, y: 472 }, 1.25)
  await expect(page.locator(".fps-interaction")).toContainText("DIAGNOSTIC RÉSEAU", {
    timeout: 15000,
  })
  await page.keyboard.press("e")
  await expect(page.locator(".document-view")).toBeVisible()
  await page.keyboard.press("Escape")
}
