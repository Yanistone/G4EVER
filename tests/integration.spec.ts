import { expect, test } from "@playwright/test"
import { beginSession, SAVE_KEY } from "../apps/web/src/game/session"
import { campaignDeck } from "../apps/web/src/game/campaignDeck"
import { canWalkAt, getNearbyInteraction, WORLD_ROOMS } from "../apps/web/src/game/world"

test("Le menu, le campus, les indices et la reprise partagent la même partie", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await page.getByRole("button", { name: /JOUER/ }).click()
  await expect(page).toHaveURL(/\/intro$/)
  await page.getByRole("button", { name: /PASSER/ }).click()
  const hud = page.getByTestId("campus-hud")
  await expect(hud).toHaveAttribute("data-ready", "true")
  const seed = (await hud.getAttribute("data-seed"))!
  await page.keyboard.down("ArrowRight")
  await expect.poll(async () => Math.round(Number(await hud.getAttribute("data-x")))).toBe(736)
  await page.keyboard.up("ArrowRight")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "Reconnecter le réseau" })).toBeVisible()
  await expect(page.getByLabel("Réponse du terminal")).toBeDisabled()
  await page.getByRole("button", { name: "EXAMINER LE DOCUMENT" }).click()
  await page.getByRole("button", { name: "JE SUIS BLOQUÉ" }).click()
  const puzzle = campaignDeck(seed).find((item) => item.roomId === "cafeteria")!
  await expect(page.getByRole("dialog").getByRole("status")).toHaveText(puzzle.hint)
  await page.getByLabel("Réponse du terminal").fill(puzzle.practical!.accepted[0])
  await page.getByRole("button", { name: "Valider la réponse →" }).click()
  await expect(page.getByRole("dialog", { name: "MODULE RESTAURÉ" })).toBeVisible()
  await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  await expect(page.getByText("Boucle n°1 · 1/5 modules")).toBeVisible()
  await page.getByRole("button", { name: "MENU PRINCIPAL", exact: true }).click()
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)
  expect(saved.challengeSeed).toBe(seed)
  expect(saved.foundDocumentIds).toContain(puzzle.practical!.document.id)
  expect(saved.knownHintIds).toContain(puzzle.id)
  await page.reload()
  await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
  await expect(hud).toHaveAttribute("data-ready", "true")
  await expect(page.getByText("Boucle n°1 · 1/5 modules")).toBeVisible()
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog", { name: "MODULE RESTAURÉ" })).toBeVisible()
  await page.getByRole("button", { name: "FERMER", exact: true }).click()
  await page.screenshot({ path: "test-results/dev-campus-assemble.png" })
  expect(errors).toEqual([])
})

test("Les cinq bornes réelles déclenchent la victoire et permettent de rejouer", async ({
  page,
}) => {
  test.setTimeout(90000)
  const seed = "partie-complete-integration"
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
      const position = sessionStorage.getItem("integration:position")
      if (position) {
        const save = JSON.parse(localStorage.getItem(key)!)
        save.playerPosition = JSON.parse(position)
        localStorage.setItem(key, JSON.stringify(save))
        sessionStorage.removeItem("integration:position")
      }
    },
    { key: SAVE_KEY, value: { ...beginSession(), challengeSeed: seed } },
  )
  const deck = campaignDeck(seed)
  let completed = 0
  for (const puzzle of deck) {
    const room = WORLD_ROOMS.find((item) => item.id === puzzle.roomId)!
    const approaches = []
    for (let dx = -64; dx <= 64; dx += 8)
      for (let dy = -64; dy <= 64; dy += 8) {
        const point = { x: room.interactionPosition.x + dx, y: room.interactionPosition.y + dy }
        if (canWalkAt(point) && getNearbyInteraction(point)?.id === room.id) approaches.push(point)
      }
    approaches.sort(
      (a, b) =>
        Math.hypot(a.x - room.interactionPosition.x, a.y - room.interactionPosition.y) -
        Math.hypot(b.x - room.interactionPosition.x, b.y - room.interactionPosition.y),
    )
    expect(approaches.length).toBeGreaterThan(0)
    if (completed === 0) await page.goto("/game")
    await page.evaluate(
      (position) => sessionStorage.setItem("integration:position", JSON.stringify(position)),
      approaches[0],
    )
    await page.reload()
    await expect(page.getByTestId("campus-hud")).toHaveAttribute("data-ready", "true")
    await page.keyboard.press("e")
    await expect(page.getByRole("dialog", { name: puzzle.title })).toBeVisible()
    await page.getByRole("button", { name: "EXAMINER LE DOCUMENT" }).click()
    await page.getByLabel("Réponse du terminal").fill(puzzle.practical!.accepted[0])
    await page.getByRole("button", { name: "Valider la réponse →" }).click()
    completed++
    if (completed < 5) {
      await expect(page.getByRole("dialog", { name: "MODULE RESTAURÉ" })).toBeVisible()
      await page.getByRole("button", { name: "CONTINUER", exact: true }).click()
      await expect(page.getByText(`Boucle n°1 · ${completed}/5 modules`)).toBeVisible()
    }
  }
  await expect(page.getByRole("heading", { name: "LA BOUCLE EST BRISÉE !" })).toBeVisible()
  await expect(page).toHaveURL(/\/victory$/)
  await page.reload()
  await expect(page.getByRole("heading", { name: "LA BOUCLE EST BRISÉE !" })).toBeVisible()
  await page.screenshot({ path: "test-results/dev-victoire.png" })
  await page.getByRole("button", { name: /REJOUER/ }).click()
  await expect(page).toHaveURL(/\/intro$/)
  await page.getByRole("button", { name: /PASSER/ }).click()
  await expect(page.getByTestId("campus-hud")).toHaveAttribute("data-ready", "true")
  await expect(page.getByText("Boucle n°1 · 0/5 modules")).toBeVisible()
  expect(await page.getByTestId("campus-hud").getAttribute("data-seed")).not.toBe(seed)
})

test("Une nouvelle boucle garde sa graine, ses documents et ses souvenirs", async ({ page }) => {
  await page.clock.install()
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value))
    },
    {
      key: SAVE_KEY,
      value: {
        ...beginSession(),
        remainingMs: 1500,
        challengeSeed: "boucle-integration",
        solvedRoomIds: ["cafeteria"],
        knownHintIds: ["cafeteria-signal"],
        foundDocumentIds: ["escape:cafeteria"],
      },
    },
  )
  await page.goto("/game")
  await page.clock.runFor(2000)
  await expect(page.getByRole("heading", { name: "TEMPS ÉCOULÉ" })).toBeVisible()
  await page.getByRole("button", { name: "RECOMMENCER LA BOUCLE" }).click()
  await expect(page.getByRole("timer")).toHaveText("15:00")
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), SAVE_KEY)
  expect(saved.challengeSeed).toBe("boucle-integration")
  expect(saved.loopNumber).toBe(2)
  expect(saved.solvedRoomIds).toEqual([])
  expect(saved.knownHintIds).toEqual(["cafeteria-signal"])
  expect(saved.foundDocumentIds).toEqual(["escape:cafeteria"])
})

test("Les ressources récupérées et le serveur de salons sont accessibles", async ({ request }) => {
  for (const path of [
    "/assets/campus-backdrop.jpg",
    "/assets/noah/down-1.svg",
    "/assets/realism/campus-daylight.hdr",
    "/assets/realism/models/MODEL-SOURCES.json",
  ])
    expect((await request.get(path)).status()).toBe(200)
  const health = await request.get("http://127.0.0.1:5197/api/health")
  expect(await health.json()).toEqual({ ok: true })
})
