import assert from "node:assert/strict"
import { test } from "node:test"
import { campaignDeck, freshCampaignSeed } from "../apps/web/src/game/campaignDeck"
import {
  canWalkAt,
  getNearbyInteraction,
  moveWithCollisions,
  START_POSITION,
  WORLD_ROOMS,
} from "../apps/web/src/game/world"

test("US-04: all seven rooms and interaction zones can be reached on foot", () => {
  const queue = [START_POSITION],
    seen = new Set<string>(),
    reached = new Set<string>()
  for (let index = 0; index < queue.length && reached.size < WORLD_ROOMS.length; index++) {
    const point = queue[index],
      key = `${point.x},${point.y}`
    if (seen.has(key)) continue
    seen.add(key)
    const room = getNearbyInteraction(point)
    if (room) reached.add(room.id)
    for (const [dx, dy] of [
      [8, 0],
      [-8, 0],
      [0, 8],
      [0, -8],
    ]) {
      const next = { x: point.x + dx, y: point.y + dy }
      if (!seen.has(`${next.x},${next.y}`) && canWalkAt(next)) queue.push(next)
    }
  }
  assert.deepEqual([...reached].sort(), WORLD_ROOMS.map((room) => room.id).sort())
})

test("US-04: the player cannot cross a terminal or leave the campus", () => {
  assert.equal(canWalkAt({ x: 0, y: 0 }), false)
  assert.equal(canWalkAt({ x: NaN, y: 590 }), false)
  const next = moveWithCollisions(START_POSITION, 500, 0)
  assert.equal(canWalkAt(next), true)
  assert.ok(next.x <= 736)
})

test("US-05: interaction requires a nearby terminal in the current room", () => {
  assert.equal(getNearbyInteraction(START_POSITION), undefined)
  assert.equal(getNearbyInteraction({ x: 730, y: 590 })?.id, "cafeteria")
  assert.equal(getNearbyInteraction({ x: 800, y: 800 }), undefined)
})

test("US-11: seeds produce stable, solvable and distinct sets of five puzzles", () => {
  const fingerprints = new Set<string>()
  for (let index = 0; index < 24; index++) {
    const seed = `robin-${index}`,
      deck = campaignDeck(seed)
    assert.deepEqual(deck, campaignDeck(seed))
    assert.equal(new Set(deck.map((puzzle) => puzzle.roomId)).size, 5)
    for (const puzzle of deck) {
      assert.ok(puzzle.practical?.accepted.length)
      assert.ok(puzzle.practical?.document.text.length)
      assert.ok(puzzle.question.answers.some((answer) => answer.id === puzzle.correctAnswerId))
    }
    fingerprints.add(JSON.stringify(deck.map((puzzle) => puzzle.practical)))
  }
  assert.equal(fingerprints.size, 24)
  const fresh = freshCampaignSeed("robin-0")
  assert.notDeepEqual(campaignDeck(fresh), campaignDeck("robin-0"))
})
