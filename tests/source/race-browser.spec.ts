import { approachFirstTerminal, collectNetworkEvidence } from "./fps-helpers"
import { test, expect } from "@playwright/test"
test("friends create/join, ready, start together, answer a random question and reconnect", async ({
  browser,
}) => {
  test.setTimeout(120000)
  const c1 = await browser.newContext(),
    c2 = await browser.newContext()
  const a = await c1.newPage(),
    b = await c2.newPage()
  for (const c of [c1, c2])
    await c.addInitScript(() =>
      localStorage.setItem(
        "g4:3d:settings",
        JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
      ),
    )
  await a.goto("/#race")
  await expect(a.getByRole("combobox")).toHaveCount(0)
  await expect(a.locator(".hub-duration")).toContainText("15 minutes")
  await a.getByLabel("TON PSEUDO", { exact: true }).fill("Alice")
  await a.getByRole("button", { name: "CRÉER UN SALON →", exact: true }).click()
  const code = (await a.locator(".invite-code>strong").innerText()).trim()
  await expect(a.locator(".lobby-pills")).toContainText("15 minutes")
  await b.goto("/#race")
  await b.getByLabel("TON PSEUDO", { exact: true }).fill("Bob")
  await b.getByLabel("Code du salon", { exact: true }).fill(code)
  await b.getByRole("button", { name: "REJOINDRE →", exact: true }).click()
  await expect(a.getByText("Bob", { exact: true })).toBeVisible()
  await a.getByRole("button", { name: "JE SUIS PRÊT ✓", exact: true }).click()
  await b.getByRole("button", { name: "JE SUIS PRÊT ✓", exact: true }).click()
  await expect(a.getByRole("button", { name: "LANCER LA COURSE →" })).toBeEnabled()
  await a.getByRole("button", { name: "LANCER LA COURSE →" }).click()
  await a.getByRole("button", { name: "C’EST PARTI !" }).click()
  await b.getByRole("button", { name: "C’EST PARTI !" }).click()
  await expect(a.getByTestId("exploration")).toBeVisible()
  await expect(b.getByTestId("exploration")).toBeVisible()
  await a.evaluate(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "m", code: "Semicolon", bubbles: true }),
    ),
  )
  await expect(a.locator(".navigator-list button")).toHaveCount(7)
  await a
    .locator(".navigator-list")
    .getByRole("button", { name: /Réfectoire/ })
    .click()
  await expect(a.getByTestId("exploration")).toBeVisible()
  await collectNetworkEvidence(a)
  await approachFirstTerminal(a)
  await expect(a.locator(".race-question")).toBeVisible()
  await a.getByRole("button", { name: /Un indice/ }).click()
  await expect(a.locator(".race-hint")).toBeVisible()
  await a.getByLabel("Code du verrou").fill("999")
  const answerResponse = a.waitForResponse(
    (r) => r.url().endsWith("/answer") && r.request().method() === "POST",
  )
  await a.getByRole("button", { name: "VALIDER LA RÉPONSE →" }).click()
  const answerResult = await (await answerResponse).json()
  expect(answerResult.snapshot.lastResult.penaltyMinutes).toBe(10)
  expect(
    answerResult.snapshot.lastResult.timeAfter - answerResult.snapshot.lastResult.timeBefore,
  ).toBeCloseTo(10)
  await expect(a.locator(".race-feedback")).toBeVisible()
  await expect(a.locator(".race-feedback").getByRole("status")).toContainText("+10 minutes")
  await a.screenshot({ path: ".runtime/horloge-penalite.png" })
  await b.reload()
  await expect(b.getByTestId("exploration")).toBeVisible()
  await b.getByRole("button", { name: /♛/ }).click()
  await expect(b.getByRole("dialog").getByText("Alice", { exact: true })).toBeVisible()
  await c1.close()
  await c2.close()
})

test("evidence code opens a second lock, then repairs the room and updates the map", async ({
  page,
}) => {
  test.setTimeout(120000)
  const { QUESTION_BANK } = await import("../../shared/questions")
  await page.goto("/#race")
  await page.getByLabel("TON PSEUDO", { exact: true }).fill("Détective")
  await page.getByRole("button", { name: "LANCER L’ENTRAÎNEMENT" }).click()
  await page.getByRole("button", { name: "JE SUIS PRÊT ✓" }).click()
  await page.getByRole("button", { name: "LANCER LA COURSE →" }).click()
  await page.getByRole("button", { name: "C’EST PARTI !" }).click()
  await collectNetworkEvidence(page)
  await approachFirstTerminal(page)
  await expect(page.locator(".evidence-document")).toBeVisible()
  await expect(page.locator(".race-answer")).toHaveCount(0)
  let prompt = await page.locator(".question-content h1").innerText()
  let q = QUESTION_BANK.find((q) => q.prompt === prompt)!
  await page.getByLabel("Code du verrou").fill(q.answers[q.correct])
  await page.keyboard.press("Enter")
  await expect(page.getByText("PREMIER VERROU OUVERT", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "OUVRIR LE SECOND VERROU →" }).click()
  await expect(page.locator(".race-answer")).toHaveCount(4)
  prompt = await page.locator(".question-content h1").innerText()
  q = QUESTION_BANK.find((q) => q.prompt === prompt)!
  await page.locator(".race-answer").filter({ hasText: q.answers[q.correct] }).click()
  await page.getByRole("button", { name: "VALIDER LA RÉPONSE →" }).click()
  await expect(page.getByText("MODULE DÉVERROUILLÉ", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "RETOURNER EXPLORER →" }).click()
  await expect(page.locator(".fragment-dots")).toContainText("1/5")
  await page.keyboard.press("m")
  await expect(page.locator(".navigator-status")).toContainText("1/5 fragments récupérés")
  await expect(
    page.locator(".navigator-list").getByRole("button", { name: /Distributeurs/ }),
  ).toBeInViewport()
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "g4:3d:settings",
      JSON.stringify({ sensitivity: 1, fov: 80, volume: 0, quality: "eco", motion: false }),
    ),
  )
})
