import { test, expect } from "@playwright/test"
import { createSession } from "../../apps/web/src/game/session"
import { campaignDeck } from "../../apps/web/src/game/campaignDeck"
async function setup(page: import("@playwright/test").Page, found: boolean) {
  const seed = "keyboard-workshop",
    task = campaignDeck(seed)[0].practical!
  await page.addInitScript(
    ({ save, found }) => {
      const p = { id: "code-ui", nickname: "Codeur", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      localStorage.setItem("g4-ever:save:code-ui", JSON.stringify(save))
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
      if (found)
        localStorage.setItem(
          "g4:3d:inventory:story:code-ui:keyboard-workshop",
          JSON.stringify(["escape:classroom"]),
        )
    },
    {
      save: {
        ...createSession("code-ui"),
        started: true,
        challengeSeed: seed,
        playerPosition: { x: 170, y: 300 },
      },
      found,
    },
  )
  await page.goto("/#puzzle")
  await expect(page.getByRole("dialog")).toContainText("SALLE PRINCIPALE")
  return task
}
test("a real document is required before completing the computer", async ({ page }) => {
  await setup(page, false)
  await expect(page.locator(".missing-document")).toContainText("Il manque une information")
  await expect(page.getByRole("button", { name: "Valider la réponse →" })).toBeDisabled()
  await expect(page.getByLabel("Réponse du terminal")).toHaveCount(0)
})
test("the editable code line validates with Enter, rejects wrong code and accepts spacing", async ({
  page,
}) => {
  const task = await setup(page, true)
  await page.screenshot({ path: "docs/3d/code-terminal.png" })
  await page.getByLabel("Réponse du terminal").fill("return n - 1;")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/#failure$/)
  await page.getByRole("button", { name: "RÉESSAYER ▸" }).click()
  await page.getByLabel("Réponse du terminal").fill("  " + task.accepted[0] + " ; ")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/#success$/)
})
