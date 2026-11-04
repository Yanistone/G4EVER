import { expect, test } from "@playwright/test"
import { campaignDeck } from "../apps/web/src/game/campaignDeck"

test("US-03 : l'introduction se parcourt en quatre scènes", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "NOUVELLE PARTIE", exact: true }).click()
  await expect(page).toHaveURL(/\/intro$/)
  for (let scene = 1; scene <= 3; scene++) {
    await expect(page.getByLabel(`Scène ${scene} sur 4`)).toBeVisible()
    await page.getByRole("button", { name: /SUIVANT/ }).click()
  }
  await expect(page.getByLabel("Scène 4 sur 4")).toBeVisible()
  await page.screenshot({ path: "test-results/dev3-introduction.png" })
  await page.getByRole("button", { name: "ENTRER DANS LE CAMPUS" }).click()
  await expect(page.getByRole("heading", { name: "Les cinq modules à réparer" })).toBeVisible()
})

test("US-03 : passer l'introduction mène aux modules", async ({ page }) => {
  await page.goto("/intro")
  await page.getByRole("button", { name: /PASSER/ }).click()
  await expect(page).toHaveURL(/\/game$/)
  await expect(page.getByTestId("campaign-panel")).toBeVisible()
})

test("US-06 / US-08 : document, erreur et indice permettent de réparer un module", async ({
  page,
}) => {
  await page.goto("/game")
  const seed = (await page.getByTestId("campaign-panel").getAttribute("data-seed"))!
  const puzzle = campaignDeck(seed)[0]
  await page
    .getByRole("button", { name: `Ouvrir ${puzzle.question.courseLabel}`, exact: true })
    .click()
  await expect(page.getByLabel("Réponse du terminal")).toBeDisabled()
  await page.getByRole("button", { name: "EXAMINER LE DOCUMENT" }).click()
  await expect(page.getByRole("heading", { name: puzzle.practical!.document.name })).toBeVisible()
  await page.getByLabel("Réponse du terminal").fill("non")
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page.getByRole("alert")).toContainText("Réponse incorrecte")
  await page.getByRole("button", { name: "JE SUIS BLOQUÉ" }).click()
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(puzzle.hint)
  await page.screenshot({ path: "test-results/dev3-enigme.png" })
  await page.getByLabel("Réponse du terminal").fill(puzzle.practical!.accepted[0])
  await page.getByLabel("Réponse du terminal").press("Enter")
  await expect(page.getByRole("dialog", { name: "MODULE RESTAURÉ" })).toBeVisible()
  await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  await expect(page.getByRole("status")).toHaveText("1/5 modules réparés")
})

test("US-06 : les cinq énigmes envoient un événement de progression distinct", async ({ page }) => {
  const errors: string[] = [],
    solved: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.exposeFunction("recordSolved", (id: string) => solved.push(id))
  await page.goto("/game")
  const seed = (await page.getByTestId("campaign-panel").getAttribute("data-seed"))!
  await page.evaluate(async () => {
    const { gameEvents, GAME_EVENTS } = await import("/src/game/events.ts")
    gameEvents.on(GAME_EVENTS.puzzleSolved, (id: string) => {
      void (window as unknown as { recordSolved: (id: string) => Promise<void> }).recordSolved(id)
    })
  })
  for (const puzzle of campaignDeck(seed)) {
    await page
      .getByRole("button", { name: `Ouvrir ${puzzle.question.courseLabel}`, exact: true })
      .click()
    await page.getByRole("button", { name: "EXAMINER LE DOCUMENT" }).click()
    await page.getByLabel("Réponse du terminal").fill(puzzle.practical!.accepted[0])
    await page.getByRole("button", { name: "Valider la réponse →" }).click()
    await expect(page.getByRole("dialog", { name: "MODULE RESTAURÉ" })).toBeVisible()
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  }
  await expect(page.getByRole("status")).toHaveText("5/5 modules réparés")
  expect(new Set(solved).size).toBe(5)
  expect(errors).toEqual([])
})

test("US-06 : une interaction du campus ouvre le bon terminal", async ({ page }) => {
  await page.goto("/game")
  const handled = await page.evaluate(async () => {
    const { gameEvents } = await import("/src/game/events.ts")
    const { CAMPUS_EVENTS } = await import("/src/game/campusEvents.ts")
    const request = { roomId: "cowork", seed: "campus-integration", handled: false }
    gameEvents.emit(CAMPUS_EVENTS.puzzleRequested, request)
    return request.handled
  })
  expect(handled).toBe(true)
  await expect(page.getByRole("dialog", { name: "Déverrouiller les archives" })).toBeVisible()
})
