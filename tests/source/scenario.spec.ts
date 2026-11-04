import { test, expect } from "@playwright/test"
import { SCENARIO } from "../../shared/scenario"
import { createSession } from "../../apps/web/src/jeu/game/session"
import { canWalkAt, getNearbyInteraction, WORLD_ROOMS } from "../../apps/web/src/jeu/game/world"
import { STATION_TARGETS } from "../../apps/web/src/jeu/game/escape"
import { enterCampus, lookAt } from "./fps-helpers"
test("les huit énigmes du PDF se jouent depuis les terminaux du campus 3D", async ({ page }) => {
  test.setTimeout(300000)
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.addInitScript(
    (initial) => {
      const p = { id: "parcours-pdf", nickname: "Parcours", createdAt: new Date().toISOString() }
      localStorage.setItem(
        "g4-ever:profiles:v1",
        JSON.stringify({ profiles: [p], activeProfileId: p.id }),
      )
      const key = "g4-ever:save:parcours-pdf"
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(initial))
      const pos = sessionStorage.getItem("test-position")
      if (pos) {
        const saved = JSON.parse(localStorage.getItem(key)!)
        saved.playerPosition = JSON.parse(pos)
        localStorage.setItem(key, JSON.stringify(saved))
        sessionStorage.removeItem("test-position")
      }
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      )
    },
    { ...createSession("parcours-pdf"), started: true },
  )
  await page.goto("/#explore")
  await enterCampus(page)
  await page.keyboard.press("m")
  await expect(page.getByRole("listitem", { name: "Sugiton", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /REJOINDRE|VERROUILLÉ/ })).toHaveCount(0)
  await page.keyboard.press("m")
  await expect(page).toHaveURL(/#explore$/)
  for (let i = 0; i < SCENARIO.length; i++) {
    const p = SCENARIO[i]
    const room = WORLD_ROOMS.find((r) => r.id === p.roomId)!
    const positions = []
    for (let dx = -60; dx <= 60; dx += 10)
      for (let dy = -60; dy <= 60; dy += 10) {
        const pos = { x: room.interactionPosition.x + dx, y: room.interactionPosition.y + dy }
        if (canWalkAt(pos) && getNearbyInteraction(pos)?.id === room.id) positions.push(pos)
      }
    await page.evaluate(
      (pos) => sessionStorage.setItem("test-position", JSON.stringify(pos)),
      positions[0],
    )
    await page.reload()
    await enterCampus(page)
    await lookAt(page, STATION_TARGETS[room.id], STATION_TARGETS[room.id].height)
    await expect(page.locator(".fps-interaction")).toBeVisible()
    await page.keyboard.press("e")
    await expect(page.getByRole("dialog", { name: p.title, exact: true })).toBeVisible()
    if (p.kind === "cups") {
      await page.getByLabel("Nombre de tasses bleues").fill("5")
      await page.screenshot({ path: ".runtime/verification-cafe.png" })
    }
    if (p.kind === "seating") await page.getByLabel("Code Noah, Léa, Yanis, Inès").fill("3142")
    if (p.kind === "algorithm") {
      await page.getByRole("button", { name: "Carnet de souvenirs" }).click()
      await expect(page.getByRole("dialog", { name: "TES SOUVENIRS" })).toContainText(
        "5 tasses bleues",
      )
      await page.getByRole("button", { name: "FERMER", exact: true }).click()
      await page.getByLabel("n (souvenir du café)").fill("5")
      await page.getByLabel("Résultat affiché").fill("29")
    }
    if (p.kind === "log") await page.getByRole("button", { name: /B Service indisponible/ }).click()
    if (p.kind === "planning") {
      await page.getByRole("button", { name: /Accepter l’aide/ }).click()
      await expect(page.getByRole("button", { name: /Indice léger/ })).toContainText("gratuit")
      await page.getByLabel("Durée minimale (jours)").fill("11")
      await page.getByLabel("Tâche supprimée").fill("Tests")
    }
    if (p.kind === "script") await page.getByRole("button", { name: /4 heure = heure - 1/ }).click()
    if (p.kind === "differences") {
      await expect(page.getByRole("img", { name: /Vue de la salle/ })).toHaveCount(2)
      await page.getByLabel("Code ligne et différences").fill("43")
      await page.screenshot({ path: ".runtime/verification-differences.png" })
    }
    if (p.kind === "patch") {
      await expect(page.getByRole("button", { name: "Appliquer le correctif" })).toBeDisabled()
      await page.getByRole("button", { name: "Monter C", exact: true }).click()
      await page.getByRole("button", { name: "Monter C", exact: true }).click()
      await page.getByRole("button", { name: "Monter D", exact: true }).click()
      await page.getByRole("button", { name: "Monter D", exact: true }).click()
      await page.getByRole("button", { name: "Monter B", exact: true }).click()
      await page.getByRole("button", { name: "Valider la procédure" }).click()
      await expect(page.getByRole("button", { name: "Appliquer le correctif" })).toBeEnabled()
      await page.screenshot({ path: ".runtime/verification-correctif.png" })
      await page.getByRole("button", { name: "Appliquer le correctif" }).click()
      await expect(page).toHaveURL(/#end$/)
      await expect(page.getByRole("heading", { name: "Le correctif complet" })).toBeVisible()
      await expect(page.locator(".ending-stats")).toContainText("8/8")
    } else {
      await page.getByRole("button", { name: "Valider la réponse →" }).click()
      await expect(page).toHaveURL(/#success$/)
      await page.getByRole("button", { name: "CONTINUER ▸", exact: true }).click()
    }
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("g4-ever:save:parcours-pdf")!).solvedPuzzleIds.length,
        ),
      )
      .toBe(i + 1)
  }
  expect(errors).toEqual([])
})
