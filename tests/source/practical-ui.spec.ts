import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { createSession, solvePuzzle } from "../../apps/web/src/jeu/game/session"
import { SCENARIO } from "../../shared/scenario"
async function setup(page: Page, completed = 0) {
  let save = { ...createSession("fiche-ui"), started: true }
  for (const p of SCENARIO.slice(0, completed)) save = solvePuzzle(save, p.id)
  await page.addInitScript((s) => {
    const p = { id: "fiche-ui", nickname: "Fiches", createdAt: new Date().toISOString() }
    localStorage.setItem(
      "g4-ever:profiles:v1",
      JSON.stringify({ profiles: [p], activeProfileId: p.id }),
    )
    if (!localStorage.getItem("g4-ever:save:fiche-ui"))
      localStorage.setItem("g4-ever:save:fiche-ui", JSON.stringify(s))
    localStorage.setItem(
      "g4:3d:settings",
      JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
    )
  }, save)
  await page.goto("/#puzzle")
}
test("le café affiche ses indices et le carnet sans perdre la saisie", async ({ page }) => {
  await setup(page)
  await expect(page.getByRole("dialog", { name: "Le café de 9h00" })).toBeVisible()
  await expect(page.getByRole("img", { name: /Deux étagères/ })).toBeVisible()
  await page.getByRole("button", { name: /Indice léger/ }).click()
  await expect(page.getByRole("dialog")).toContainText("Seule une couleur compte.")
  await page.getByLabel("Nombre de tasses bleues").fill("5")
  await page.getByRole("button", { name: "Carnet de souvenirs" }).click()
  await expect(page.getByRole("dialog", { name: "TES SOUVENIRS" })).toContainText(
    "Seule une couleur compte.",
  )
  await page.getByRole("button", { name: "FERMER", exact: true }).click()
  await expect(page.getByLabel("Nombre de tasses bleues")).toHaveValue("5")
  await page.getByLabel("Nombre de tasses bleues").press("Enter")
  await expect(page).toHaveURL(/#success$/)
})
test("trois mauvaises réponses bloquent réellement le terminal", async ({ page }) => {
  await setup(page)
  for (let i = 0; i < 3; i++) {
    await page.getByLabel("Nombre de tasses bleues").fill("9")
    await page.getByRole("button", { name: "Valider la réponse →" }).click()
    await expect(page).toHaveURL(/#failure$/)
    await page.getByRole("button", { name: "RÉESSAYER ▸" }).click()
  }
  await expect(page.getByRole("alert")).toContainText("terminal bloqué")
  await expect(page.getByRole("button", { name: "Valider la réponse →" })).toBeDisabled()
})
test("le terminal utilise n et le correctif exige la procédure validée", async ({ page }) => {
  await setup(page, 2)
  await page.getByLabel("n (souvenir du café)").fill("4")
  await page.getByLabel("Résultat affiché").fill("29")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page.getByRole("status")).toContainText("Souvenir manquant")
  await page.getByLabel("n (souvenir du café)").fill("5")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page).toHaveURL(/#success$/)
})
test("la coupure donne une fin partielle même avec un ordre incorrect", async ({ page }) => {
  await setup(page, 7)
  await expect(page.getByRole("button", { name: "Appliquer le correctif" })).toBeDisabled()
  await page.getByRole("button", { name: /Tout couper · fin partielle/ }).click()
  await expect(page).toHaveURL(/#end$/)
  await expect(page.getByRole("heading", { name: "Tout couper · fin partielle" })).toBeVisible()
})
