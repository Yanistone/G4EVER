import { campaignDeck } from "./campaignDeck"
import { normalizeCode } from "./escape"

export interface CampaignProgress {
  seed: string
  solvedRoomIds: string[]
  foundDocumentIds: string[]
  knownHintIds: string[]
}

export function createCampaign(seed: string): CampaignProgress {
  return { seed, solvedRoomIds: [], foundDocumentIds: [], knownHintIds: [] }
}

export function examineDocument(progress: CampaignProgress, roomId: string): CampaignProgress {
  const document = campaignDeck(progress.seed).find((item) => item.roomId === roomId)?.practical
    ?.document
  if (!document || progress.foundDocumentIds.includes(document.id)) return progress
  return { ...progress, foundDocumentIds: [...progress.foundDocumentIds, document.id] }
}

export function requestHint(progress: CampaignProgress, roomId: string) {
  const puzzle = campaignDeck(progress.seed).find((item) => item.roomId === roomId)
  if (!puzzle) return { progress, text: "" }
  return {
    progress: { ...progress, knownHintIds: [...new Set([...progress.knownHintIds, puzzle.id])] },
    text: puzzle.hint,
  }
}

export function submitAnswer(progress: CampaignProgress, roomId: string, answer: string) {
  const puzzle = campaignDeck(progress.seed).find((item) => item.roomId === roomId)
  if (!puzzle || progress.solvedRoomIds.includes(roomId))
    return { progress, correct: false, reason: "unavailable" }
  if (puzzle.practical && !progress.foundDocumentIds.includes(puzzle.practical.document.id)) {
    return { progress, correct: false, reason: "missing-document" }
  }
  const correct = puzzle.practical
    ? puzzle.practical.accepted.some((value) => normalizeCode(value) === normalizeCode(answer))
    : answer === puzzle.correctAnswerId
  return {
    progress: correct
      ? { ...progress, solvedRoomIds: [...progress.solvedRoomIds, roomId] }
      : progress,
    correct,
    reason: correct ? "correct" : "wrong",
  }
}
