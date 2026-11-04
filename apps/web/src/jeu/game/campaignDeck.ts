import { puzzles } from "./puzzles"
export function campaignDeck(_seed?: string) {
  void _seed
  return puzzles.map((p) => ({ ...p, question: { ...p.question } }))
}
export function freshCampaignSeed(_previous?: string) {
  void _previous
  return "scenario2:" + crypto.randomUUID()
}
