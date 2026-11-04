import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const screens = [
  { route: "quiz", title: "06 · Exemple : écran de quiz" },
  { route: "launch", title: "0 · Écran de lancement animé" },
  { route: "menu", title: "A · Menu principal" },
  { route: "intro", title: "B · Intro narrative (1/4)" },
  { route: "campus", title: "D2 · Carte complète du campus" },
  { route: "briefing", title: "C · Briefing de mission" },
  { route: "game", title: "D · En jeu : vue de haut + HUD" },
  { route: "success", title: "E1 · Feedback bonne réponse" },
  { route: "failure", title: "E2 · Feedback mauvaise réponse" },
  { route: "end", title: "F · Écran de fin" },
] as const

async function openScreen(page: Page, route: string) {
  await page.goto(`/#${route}`)
  await expect(page.getByRole("main")).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`all ten screens fit ${viewport.width}×${viewport.height}, load local fonts and render without errors`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    const browserErrors: string[] = []
    const failedRequests: string[] = []
    const externalRequests: string[] = []
    page.on("pageerror", (error) => browserErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text())
    })
    page.on("requestfailed", (request) => {
      if (!request.failure()?.errorText.includes("ABORTED")) failedRequests.push(request.url())
    })
    page.on("request", (request) => {
      const url = new URL(request.url())
      if (["http:", "https:"].includes(url.protocol) && url.hostname !== "127.0.0.1")
        externalRequests.push(request.url())
    })

    for (const screen of screens) {
      await test.step(screen.title, async () => {
        await openScreen(page, screen.route)
        await expect(page).toHaveTitle(`${screen.title} — G4 Ever`)
        const main = page.getByRole("main", { name: screen.title, exact: true })
        await expect(main).toBeVisible()
        expect(await main.locator("svg,canvas,h1").count()).toBeGreaterThan(0)
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          width: window.innerWidth,
          height: window.innerHeight,
          headingFont: document.fonts.check('400 24px "Lilita One"'),
          bodyFont: document.fonts.check("800 18px Nunito"),
          localFonts: [...document.fonts]
            .filter((font) => ["Nunito", "Lilita One"].includes(font.family.replaceAll('"', "")))
            .some((font) => font.status === "loaded"),
        }))
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width)
        expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height)
        expect(metrics.headingFont).toBe(true)
        expect(metrics.bodyFont).toBe(true)
        expect(metrics.localFonts).toBe(true)

        const artboard = await main.locator(":scope > div").boundingBox()
        expect(artboard).not.toBeNull()
        expect(artboard!.x).toBeGreaterThanOrEqual(-1)
        expect(artboard!.y).toBeGreaterThanOrEqual(-1)
        expect(artboard!.x + artboard!.width).toBeLessThanOrEqual(viewport.width + 1)
        expect(artboard!.y + artboard!.height).toBeLessThanOrEqual(viewport.height + 1)
      })
    }
    expect(browserErrors).toEqual([])
    expect(failedRequests).toEqual([])
    expect(externalRequests).toEqual([])
  })
}

test("new game completes a wrong-answer/retry/correct-answer journey and supports credits/replay", async ({
  page,
}) => {
  await openScreen(page, "quiz")
  await page.getByRole("button", { name: "B « null »", exact: true }).click()
  const validate = page.getByRole("button", { name: "VALIDER", exact: true })
  await expect(validate).toBeEnabled()
  const wrongAnswer = page.getByRole("button", { name: "B « null »", exact: true })
  await wrongAnswer.click()
  await expect(wrongAnswer).toHaveAttribute("aria-pressed", "true")
  await expect(validate).toBeEnabled()
  await validate.click()
  await expect(page).toHaveURL(/#failure$/)
  await expect(page.getByText("B · « null »", { exact: true })).toBeVisible()
  await expect(page.locator(".feedback-card p")).toBeVisible()
  await page.getByRole("button", { name: "RÉESSAYER ▸", exact: true }).click()
  await expect(validate).toBeDisabled()
  await expect(page.getByRole("button", { name: "B « null »", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  )

  const correctAnswer = page.getByRole("button", { name: "A « object »", exact: true })
  await correctAnswer.focus()
  await page.keyboard.press("Space")
  await expect(correctAnswer).toHaveAttribute("aria-pressed", "true")
  await validate.focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/#success$/)
  await expect(page.locator(".result-emblem")).toBeVisible()
  await page.getByRole("button", { name: "CONTINUER ▸", exact: true }).click()
  await expect(page).toHaveURL(/#end$/)
  await expect(page.getByText("LA BOUCLE EST BRISÉE !", { exact: true })).toBeVisible()

  const credits = page.getByRole("button", { name: "CRÉDITS", exact: true })
  await credits.click()
  await expect(page.getByRole("dialog", { name: "CRÉDITS" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(credits).toBeFocused()
  await page.getByRole("button", { name: "REJOUER ↗", exact: true }).click()
  await expect(page).toHaveURL(/#auth$/)
})

test("options trap focus and retain the motion preference; pause resumes or returns to menu", async ({
  page,
}) => {
  await openScreen(page, "menu")
  const options = page.getByRole("button", { name: "OPTIONS", exact: true })
  await options.click()
  const dialog = page.getByRole("dialog", { name: "OPTIONS" })
  const reduceMotion = dialog.getByRole("slider", { name: "Sensibilité souris" })
  await expect(reduceMotion).toBeFocused()
  await reduceMotion.fill("1.5")
  await page.keyboard.press("Shift+Tab")
  await expect(dialog.getByRole("button", { name: "FERMER" })).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(reduceMotion).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(options).toBeFocused()
  await options.click()
  await expect(reduceMotion).toHaveValue("1.5")
  await dialog.getByRole("button", { name: "FERMER" }).click()

  await openScreen(page, "game")
  await expect(page).toHaveURL(/#game$/)
  const playerMarker = page.getByLabel("Mini-carte du campus").locator("circle")
  const initialX = await playerMarker.getAttribute("cx")
  await page.keyboard.press("ArrowRight")
  await expect(playerMarker).not.toHaveAttribute("cx", initialX!)
  const pausedX = await playerMarker.getAttribute("cx")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "PAUSE" })).toBeVisible()
  await page.keyboard.press("ArrowRight")
  await expect(playerMarker).toHaveAttribute("cx", pausedX!)

  await page.keyboard.press("e")
  await expect(page).toHaveURL(/#game$/)
  await page.getByRole("button", { name: "REPRENDRE", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.keyboard.press("Escape")
  await page
    .getByRole("dialog", { name: "PAUSE" })
    .getByRole("button", { name: "MENU PRINCIPAL", exact: true })
    .click()
  await expect(page).toHaveURL(/#menu$/)
})

test("campus map supports opening, keyboard return, room selection and its native artboard", async ({
  page,
}) => {
  await openScreen(page, "game")
  await page.keyboard.press("m")
  await expect(page).toHaveURL(/#campus$/)
  await expect(page.getByRole("heading", { name: "CARTE DU CAMPUS · INSTITUT G4" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page).toHaveURL(/#game$/)

  await page.setViewportSize({ width: 1600, height: 1100 })
  await openScreen(page, "campus")
  const artboard = await page.getByRole("main").locator(":scope > div").boundingBox()
  expect(artboard?.width).toBe(1600)
  expect(artboard?.height).toBe(1100)
  await page.getByRole("button", { name: "Salle gaming", exact: true }).click()
  await expect(page).toHaveURL(/#briefing$/)
})

test("failure can leave the room and the end screen can return to the menu", async ({ page }) => {
  await openScreen(page, "failure")
  await page.getByRole("button", { name: "RETOUR À LA SALLE", exact: true }).click()
  await expect(page).toHaveURL(/#game$/)
  await openScreen(page, "end")
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click()
  await expect(page).toHaveURL(/#menu$/)
  await page.getByRole("button", { name: "QUITTER ↗", exact: true }).click()
  await expect(page).toHaveURL(/#launch$/)
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "g4:3d:settings",
      JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
    ),
  )
})
