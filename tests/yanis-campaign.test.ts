import assert from "node:assert/strict"
import { test } from "node:test"
import {
  createCampaign,
  examineDocument,
  requestHint,
  submitAnswer,
} from "../apps/web/src/game/campaign"
import { campaignDeck } from "../apps/web/src/game/campaignDeck"
import { introScenes } from "../apps/web/src/game/puzzles"

test("US-03 : les quatre scènes présentent le contexte et l'objectif", () => {
  assert.equal(introScenes.length, 4)
  assert.deepEqual(
    introScenes.map((scene) => scene.sceneNumber),
    [1, 2, 3, 4],
  )
  assert.ok(introScenes.every((scene) => scene.totalScenes === 4))
  assert.ok(introScenes[0].highlight.includes("G4-OS"))
  assert.ok(introScenes[3].beforeHighlight.includes("cinq modules"))
})

test("US-06 : les cinq terminaux exigent leur document et acceptent leur solution", () => {
  let progress = createCampaign("yanis-test")
  for (const puzzle of campaignDeck(progress.seed)) {
    const answer = puzzle.practical!.accepted[0]
    assert.equal(submitAnswer(progress, puzzle.roomId, answer).reason, "missing-document")
    progress = examineDocument(progress, puzzle.roomId)
    const result = submitAnswer(progress, puzzle.roomId, answer)
    assert.equal(result.correct, true)
    progress = result.progress
  }
  assert.equal(new Set(progress.solvedRoomIds).size, 5)
})

test("US-06 : une réponse fausse ou une salle inconnue ne donne aucun module", () => {
  let progress = createCampaign("yanis-test")
  progress = examineDocument(progress, "gaming")
  const wrong = submitAnswer(progress, "gaming", "réponse incorrecte")
  assert.equal(wrong.correct, false)
  assert.deepEqual(wrong.progress.solvedRoomIds, [])
  assert.equal(submitAnswer(progress, "inconnue", "123").reason, "unavailable")
})

test("US-06 : la même salle ne peut donner deux modules", () => {
  const puzzle = campaignDeck("yanis-test")[0]
  const progress = examineDocument(createCampaign("yanis-test"), puzzle.roomId)
  const first = submitAnswer(progress, puzzle.roomId, puzzle.practical!.accepted[0])
  const second = submitAnswer(first.progress, puzzle.roomId, puzzle.practical!.accepted[0])
  assert.equal(second.correct, false)
  assert.equal(second.progress.solvedRoomIds.length, 1)
})

test("US-08 : l'indice correspond au terminal et reste unique", () => {
  const progress = createCampaign("yanis-test")
  const first = requestHint(progress, "cowork")
  const second = requestHint(first.progress, "cowork")
  assert.equal(
    first.text,
    campaignDeck(progress.seed).find((item) => item.roomId === "cowork")!.hint,
  )
  assert.equal(second.progress.knownHintIds.length, 1)
  assert.equal(requestHint(progress, "inconnue").text, "")
})
