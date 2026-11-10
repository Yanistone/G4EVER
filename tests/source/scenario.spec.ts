import { test, expect } from "@playwright/test"
import { SCENARIO } from "../../shared/scenario"
import { createSession } from "../../apps/web/src/jeu/game/session"
import { canWalkAt, getRoomAt } from "../../apps/web/src/jeu/game/world"
import { spotForPuzzle } from "../../apps/web/src/jeu/game/spots"
import { enterCampus, lookAt } from "./fps-helpers"
test("les huit énigmes se jouent chacune à son propre emplacement du campus 3D", async ({
  page,
}) => {
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
    const spot = spotForPuzzle(p.id)!
    const positions = []
    for (let dx = -60; dx <= 60; dx += 10)
      for (let dy = -60; dy <= 60; dy += 10) {
        const pos = { x: spot.position.x + dx, y: spot.position.y + dy }
        if (canWalkAt(pos) && getRoomAt(pos)?.id === spot.roomId && Math.hypot(dx, dy) <= 70)
          positions.push(pos)
      }
    positions.sort(
      (a, b) =>
        Math.hypot(a.x - spot.position.x, a.y - spot.position.y) -
        Math.hypot(b.x - spot.position.x, b.y - spot.position.y),
    )
    await page.evaluate(
      (pos) => sessionStorage.setItem("test-position", JSON.stringify(pos)),
      positions[0],
    )
    await page.reload()
    await enterCampus(page)
    await lookAt(page, spot.target, spot.target.height)
    await expect(page.locator(".fps-interaction")).toContainText(spot.label)
    await page.keyboard.press("e")
    await expect(page.getByRole("dialog", { name: p.title, exact: true })).toBeVisible()
    if (p.kind === "cups") {
      await page.getByLabel("Nombre de tasses bleues").fill("5")
      await page.screenshot({ path: ".runtime/verification-cafe.png" })
    }
    if (p.kind === "seating") {
      for (const [seat, student] of [
        ["Place 1", "Léa"],
        ["Place 2", "Inès"],
        ["Place 3", "Noah"],
        ["Place 4", "Yanis"],
      ])
        await page.getByLabel(seat, { exact: true }).selectOption(student)
      await expect(page.locator(".seating-code")).toContainText("3 1 4 2")
    }
    if (p.kind === "algorithm") {
      await page.getByRole("button", { name: "Carnet de souvenirs" }).click()
      await expect(page.getByRole("dialog", { name: "CARNET DE SOUVENIRS" })).toContainText(
        "5 tasses bleues",
      )
      await page.getByRole("button", { name: "FERMER", exact: true }).click()
      await page.getByLabel("n (souvenir du café)").fill("5")
      await page.getByLabel("Résultat affiché").fill("29")
    }
    if (p.kind === "log") await page.getByRole("button", { name: /B Service indisponible/ }).click()
    if (p.kind === "planning") {
      await page.getByRole("button", { name: /Accepter l’aide/ }).click()
      await expect(page.getByRole("button", { name: /Coup de pouce/ })).toContainText("gratuit")
      await page.getByLabel("Durée minimale (jours)").fill("11")
      await page.getByLabel("Tâche supprimée").selectOption("C")
    }
    if (p.kind === "script") await page.getByRole("button", { name: /4 heure = heure - 1/ }).click()
    if (p.kind === "differences") {
      const views = page.getByRole("img", { name: /Vue de la salle/ })
      await expect(views).toHaveCount(2)
      const after = views.nth(1)
      const box = (await after.boundingBox())!
      // Clic sur l'horloge, l'écran et la chaise de la vue « après » (coordonnées de l'image 360 × 235).
      for (const [x, y] of [
        [280, 50],
        [220, 112],
        [226, 190],
      ])
        await page.mouse.click(box.x + (x / 360) * box.width, box.y + (y / 235) * box.height)
      await expect(page.locator(".difference-list")).toContainText("3 différences trouvées")
      await page.getByLabel("Code du Co-working").fill("43")
      await page.screenshot({ path: ".runtime/verification-differences.png" })
    }
    if (p.kind === "patch") {
      await page.getByRole("button", { name: "Monter C", exact: true }).click()
      await page.getByRole("button", { name: "Monter C", exact: true }).click()
      await page.getByRole("button", { name: "Monter D", exact: true }).click()
      await page.getByRole("button", { name: "Monter D", exact: true }).click()
      await page.getByRole("button", { name: "Monter B", exact: true }).click()
      await page.getByRole("button", { name: "Valider la procédure" }).click()
      await expect(page.getByText("G4-OS est réparé")).toBeVisible()
      await page.screenshot({ path: ".runtime/verification-correctif.png" })
      await page.getByRole("button", { name: "Appliquer le correctif" }).click()
      await expect(page).toHaveURL(/#end$/)
      await expect(page.getByRole("heading", { name: "Le correctif complet" })).toBeVisible()
      await expect(page.locator(".ending-stats")).toContainText("8/8")
    } else {
      await page.getByRole("button", { name: "Valider la réponse →" }).click()
      await expect(page.getByText("ÉNIGME RÉSOLUE")).toBeVisible()
      await page.getByRole("button", { name: /Continuer l’exploration/ }).click()
      await expect(page).toHaveURL(/#explore$/)
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
