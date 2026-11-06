import { expect, test } from "@playwright/test"

test("US-04 / US-05: Noah walks, stops at furniture and examines a station", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await page.getByRole("link", { name: "NOUVELLE PARTIE", exact: true }).click()
  const hud = page.getByTestId("campus-hud")
  await expect(page.locator("canvas")).toBeVisible()
  await expect(hud).toHaveAttribute("data-ready", "true")
  await expect(hud).toHaveAttribute("data-x", "690.00")
  await page.keyboard.down("ArrowRight")
  await expect.poll(async () => Number(await hud.getAttribute("data-x"))).toBeGreaterThan(730)
  await expect.poll(async () => Math.round(Number(await hud.getAttribute("data-x")))).toBe(736)
  await page.keyboard.up("ArrowRight")
  await page.keyboard.press("e")
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Ticket du technicien réseau" })).toBeVisible()
  await page.getByText("Consulter le terminal").click()
  await expect(page.locator("pre")).toContainText("unlock --key")
  await page.screenshot({ path: "test-results/dev2-interaction.png" })
  const before = await hud.getAttribute("data-x")
  await page.keyboard.press("ArrowLeft")
  await expect(hud).toHaveAttribute("data-x", before!)
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.screenshot({ path: "test-results/dev2-campus.png" })
  expect(errors).toEqual([])
})

test("US-11: a new game changes its seed and a reload keeps it", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: "NOUVELLE PARTIE", exact: true }).click()
  const hud = page.getByTestId("campus-hud")
  const first = await hud.getAttribute("data-seed")
  expect(first).toBeTruthy()
  await page.reload()
  await expect(hud).toHaveAttribute("data-seed", first!)
  await page.getByRole("link", { name: "RETOUR", exact: true }).click()
  await page.getByRole("link", { name: "NOUVELLE PARTIE", exact: true }).click()
  await expect(hud).not.toHaveAttribute("data-seed", first!)
})

test("US-13: ambient audio starts on play, can be muted and its volume changed", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("link", { name: "NOUVELLE PARTIE", exact: true }).click()
  await expect(page.getByRole("button", { name: "COUPER LE SON" })).toHaveAttribute(
    "aria-pressed",
    "true",
  )
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { campusAudio } = await import("/src/services/campusSound.ts")
        return campusAudio.state
      }),
    )
    .toBe("running")
  await page.getByRole("slider", { name: "Volume du jeu" }).fill("0.2")
  expect(
    await page.evaluate(
      async () => (await import("/src/services/campusSound.ts")).campusAudio.volume,
    ),
  ).toBe(0.2)
  await page.getByRole("button", { name: "COUPER LE SON" }).click()
  await expect
    .poll(() =>
      page.evaluate(async () => (await import("/src/services/campusSound.ts")).campusAudio.state),
    )
    .toBe("suspended")
  await page.getByRole("button", { name: "ACTIVER LE SON" }).click()
  await expect
    .poll(() =>
      page.evaluate(async () => (await import("/src/services/campusSound.ts")).campusAudio.state),
    )
    .toBe("running")
})
