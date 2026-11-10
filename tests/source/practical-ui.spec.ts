import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { createSession, solvePuzzle } from "../../apps/web/src/jeu/game/session"
import type { AdventureSession } from "../../apps/web/src/jeu/game/session"
import { SCENARIO } from "../../shared/scenario"
async function setup(page: Page, completed = 0, patch: Partial<AdventureSession> = {}) {
  let save = { ...createSession("fiche-ui"), started: true }
  for (const p of SCENARIO.slice(0, completed)) save = solvePuzzle(save, p.id)
  save = { ...save, ...patch }
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
  // Le rechargement sur #puzzle ramène au campus : on rouvre l'énigme en cours depuis le hash.
  await page.goto("/#explore")
  await page.evaluate(() => (window.location.hash = "puzzle"))
}
const save = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("g4-ever:save:fiche-ui")!))

test("le café révèle ses indices un par un et le carnet garde la saisie", async ({ page }) => {
  await setup(page)
  await expect(page.getByRole("dialog", { name: "Le café de 9h00" })).toBeVisible()
  await expect(page.getByRole("img", { name: /Deux étagères/ })).toBeVisible()
  await page.getByRole("button", { name: /Coup de pouce/ }).click()
  await expect(page.getByRole("dialog")).toContainText("Une seule couleur compte")
  await expect(page.getByRole("button", { name: /Méthode/ })).toBeVisible()
  await page.getByLabel("Nombre de tasses bleues").fill("5")
  await page.getByRole("button", { name: "Carnet de souvenirs" }).click()
  await expect(page.getByRole("dialog", { name: "CARNET DE SOUVENIRS" })).toContainText(
    "Une seule couleur compte",
  )
  await page.getByRole("button", { name: "FERMER", exact: true }).click()
  await expect(page.getByLabel("Nombre de tasses bleues")).toHaveValue("5")
  await page.getByLabel("Nombre de tasses bleues").press("Enter")
  await expect(page.getByRole("status").filter({ hasText: "ÉNIGME RÉSOLUE" })).toBeVisible()
  await expect(page.getByText("Souvenir gagné : n = 5")).toBeVisible()
  await page.getByRole("button", { name: /Continuer l’exploration/ }).click()
  await expect(page).toHaveURL(/#explore$/)
})

test("une erreur coûte du temps mais ne bloque jamais le terminal", async ({ page }) => {
  await setup(page)
  for (let i = 0; i < 4; i++) {
    await page.getByLabel("Nombre de tasses bleues").fill("9")
    await page.getByRole("button", { name: "Valider la réponse →" }).click()
    await expect(page.getByRole("alert")).toContainText("−10 min campus")
  }
  await expect(page).toHaveURL(/#puzzle$/)
  await expect(page.getByRole("button", { name: "Valider la réponse →" })).toBeEnabled()
  await expect.poll(async () => (await save(page)).mistakes).toBe(4)
})

test("le terminal vérifie n avant de valider le calcul", async ({ page }) => {
  await setup(page, 2)
  await page.getByLabel("n (souvenir du café)").fill("4")
  await page.getByLabel("Résultat affiché").fill("29")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page.getByRole("status").filter({ hasText: "valeur de n" })).toBeVisible()
  await page.getByLabel("n (souvenir du café)").fill("5")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page.getByText("Porte de Sainte Victoire ouverte")).toBeVisible()
})

test("une énigme résolue dans une boucle précédente se valide en un clic", async ({ page }) => {
  await setup(page, 0, { memoryIds: ["cafe-9h", "table-refectoire"], loopNumber: 2 })
  await page.getByRole("button", { name: "Utiliser mon souvenir" }).click()
  await expect(page.getByText("SOUVENIR RETROUVÉ")).toBeVisible()
  await expect.poll(async () => (await save(page)).solvedPuzzleIds).toEqual(["cafe-9h"])
  await expect.poll(async () => (await save(page)).mistakes).toBe(0)
})

test("le correctif validé mène à la vraie fin", async ({ page }) => {
  await setup(page, 7)
  for (const card of ["C", "C", "D", "D", "B"])
    await page.getByRole("button", { name: `Monter ${card}`, exact: true }).click()
  await page.getByRole("button", { name: "Valider la procédure" }).click()
  await page.getByRole("button", { name: "Appliquer le correctif" }).click()
  await expect(page).toHaveURL(/#end$/)
  await expect(page.getByRole("heading", { name: "Le correctif complet" })).toBeVisible()
})

test("la salle serveur de Sormiou ne s'ouvre qu'après cinq énigmes", async ({ page }) => {
  await setup(page, 4)
  await page.getByRole("button", { name: "Quitter l’énigme" }).click()
  await page.getByRole("button", { name: /Plan/ }).click()
  await expect(page.getByRole("listitem", { name: "Sormiou", exact: true })).toContainText(
    "Verrouillée",
  )
  await expect(page.getByRole("listitem", { name: "Mont Ventoux", exact: true })).toContainText(
    "Verrouillée",
  )
})
