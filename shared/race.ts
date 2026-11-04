import type { ScenarioKind } from "./scenario"
export interface PublicQuestion {
  id: string
  roomId: string
  title: string
  prompt: string
  answers: { id: string; label: string }[]
  hint?: string
  kind?: "code"
  exhibit?: string
  visual?: ScenarioKind
  lockedUntil?: number
}
export interface RacePlayer {
  id: string
  nickname: string
  ready: boolean
  online: boolean
  solvedRoomIds: string[]
  answered: number
  score: number
  mistakes: number
  penaltyMinutes: number
  timedOut: boolean
  hints: number
  finishedAt: number | null
  position: { x: number; y: number }
  left: boolean
}
export interface RaceSnapshot {
  code: string
  mode: "solo" | "friends"
  phase: "lobby" | "countdown" | "playing" | "finished"
  hostId: string
  round: number
  serverNow: number
  startsAt: number | null
  endsAt: number | null
  durationMinutes: number
  players: RacePlayer[]
  meId: string
  questions: PublicQuestion[]
  ranking: RacePlayer[]
  lastResult?: {
    correct: boolean
    explanation: string
    roomId: string
    roomComplete: boolean
    scoreDelta: number
    penaltyMinutes?: number
    timeBefore?: number
    timeAfter?: number
  }
  winnerId: string | null
}
export interface RaceCredentials {
  code: string
  playerId: string
  token: string
}
