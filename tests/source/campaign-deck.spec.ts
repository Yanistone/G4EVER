import { test, expect } from "@playwright/test"
import { campaignDeck, freshCampaignSeed } from "../../apps/web/src/game/campaignDeck"
import { createSession, readSession } from "../../apps/web/src/game/session"
test("campaign variations are reproducible, keep five solvable rooms and differ on replay", () => {
  const fingerprints = new Set<string>()
  for (let n = 0; n < 24; n++) {
    const deck = campaignDeck("run-" + n)
    expect(deck).toEqual(campaignDeck("run-" + n))
    expect(new Set(deck.map((p) => p.roomId)).size).toBe(5)
    for (const p of deck) {
      expect(p.question.answers).toHaveLength(4)
      expect(new Set(p.question.answers.map((a) => a.label)).size).toBe(4)
      expect(p.question.answers.some((a) => a.id === p.correctAnswerId)).toBe(true)
      expect(p.hint.length).toBeGreaterThan(15)
      expect(p.practical?.accepted.length).toBeGreaterThan(0)
      expect(p.practical?.document.text.length).toBeGreaterThan(50)
      expect(p.practical?.template).toContain("____")
    }
    fingerprints.add(JSON.stringify(deck.map((p) => p.question)))
  }
  expect(fingerprints.size).toBe(24)
  const seed = freshCampaignSeed("run-0")
  expect(campaignDeck(seed)).not.toEqual(campaignDeck("run-0"))
  const save = { ...createSession("replay"), started: true, challengeSeed: seed }
  expect(readSession("replay", { getItem: () => JSON.stringify(save) }).challengeSeed).toBe(seed)
})
