export const CAMPUS_EVENTS = {
  ready: "campus:ready",
  inspect: "campus:inspect",
  controls: "campus:controls",
  puzzleRequested: "puzzle:requested",
  hintDiscovered: "hint:discovered",
  progressChanged: "campaign:changed",
} as const

export interface InteractionRequest {
  roomId: string
  seed: string
  handled?: boolean
}
