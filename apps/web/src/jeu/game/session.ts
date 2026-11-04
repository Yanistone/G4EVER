import type { PlayerPosition } from "../types/game"
import { canWalkAt, START_POSITION } from "./world"

export interface AdventureSession {
  version: 1
  challengeSeed?: string
  profileId: string
  started: boolean
  gameMinute: number
  loopNumber: number
  playedSeconds: number
  mistakes: number
  solvedRoomIds: string[]
  knownHintIds: string[]
  hasVendingClue: boolean
  playerPosition: PlayerPosition
  ending: 1 | 2 | null
  unlockedEndings: number[]
  event: "reboot" | null
  updatedAt: string
}

export const INITIAL_POSITION: PlayerPosition = { ...START_POSITION }
export const DAY_START = 9 * 60
export const DAY_END = 16 * 60

export function createSession(profileId: string, unlockedEndings: number[] = []): AdventureSession {
  return {
    version: 1,
    challengeSeed: "",
    profileId,
    started: false,
    gameMinute: DAY_START,
    loopNumber: 1,
    playedSeconds: 0,
    mistakes: 0,
    solvedRoomIds: [],
    knownHintIds: [],
    hasVendingClue: false,
    playerPosition: { ...INITIAL_POSITION },
    ending: null,
    unlockedEndings: [...new Set(unlockedEndings.filter((ending) => ending === 1 || ending === 2))],
    event: null,
    updatedAt: new Date().toISOString(),
  }
}

export function formatClock(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(minutes % 60)
    .toString()
    .padStart(2, "0")}`
}

export function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`
}

export function advanceTime(
  session: AdventureSession,
  minutes: number,
  realSeconds = 0,
): AdventureSession {
  if (session.ending || !session.started) return session

  if (!Number.isFinite(minutes) || minutes < 0 || !Number.isFinite(realSeconds) || realSeconds < 0)
    return session
  const next = session.gameMinute + minutes
  return next >= DAY_END
    ? {
        ...session,
        gameMinute: DAY_START,
        loopNumber: session.loopNumber + 1,
        playedSeconds: session.playedSeconds + realSeconds,
        solvedRoomIds: [],
        playerPosition: { ...INITIAL_POSITION },
        event: "reboot",
      }
    : { ...session, gameMinute: next, playedSeconds: session.playedSeconds + realSeconds }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null
const isNonnegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0)

export function readSession(
  profileId: string,
  storage?: Pick<Storage, "getItem">,
): AdventureSession {
  try {
    const value: unknown = JSON.parse(
      (storage ?? localStorage).getItem(`g4-ever:save:${profileId}`) ?? "null",
    )
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      value.profileId !== profileId ||
      typeof value.started !== "boolean" ||
      !isNonnegativeNumber(value.gameMinute) ||
      value.gameMinute < DAY_START ||
      value.gameMinute >= DAY_END ||
      !Number.isSafeInteger(value.loopNumber) ||
      (value.loopNumber as number) < 1 ||
      !isNonnegativeNumber(value.playedSeconds) ||
      !Number.isSafeInteger(value.mistakes) ||
      (value.mistakes as number) < 0 ||
      !isStringArray(value.solvedRoomIds) ||
      !isStringArray(value.knownHintIds) ||
      typeof value.hasVendingClue !== "boolean" ||
      !isRecord(value.playerPosition) ||
      !Number.isFinite(value.playerPosition.x) ||
      !Number.isFinite(value.playerPosition.y) ||
      (value.ending !== null && value.ending !== 1 && value.ending !== 2) ||
      (!value.started && value.ending !== null) ||
      !Array.isArray(value.unlockedEndings) ||
      !value.unlockedEndings.every((ending) => ending === 1 || ending === 2) ||
      (value.event !== null && value.event !== "reboot") ||
      typeof value.updatedAt !== "string" ||
      !Number.isFinite(Date.parse(value.updatedAt))
    )
      return createSession(profileId)

    const position = value.playerPosition as unknown as PlayerPosition
    return {
      version: 1,
      ...(typeof value.challengeSeed === "string" && value.challengeSeed.length <= 100
        ? { challengeSeed: value.challengeSeed }
        : value.started
          ? { challengeSeed: "migration:" + profileId }
          : {}),
      profileId,
      started: value.started,
      gameMinute: value.gameMinute,
      loopNumber: value.loopNumber as number,
      playedSeconds: value.playedSeconds,
      mistakes: value.mistakes as number,
      solvedRoomIds: [...new Set(value.solvedRoomIds)],
      knownHintIds: [...new Set(value.knownHintIds)],
      hasVendingClue: value.hasVendingClue,
      playerPosition: canWalkAt(position) ? { ...position } : { ...INITIAL_POSITION },
      ending: value.ending,
      unlockedEndings: [...new Set(value.unlockedEndings)],
      event: value.event,
      updatedAt: value.updatedAt,
    }
  } catch {
    return createSession(profileId)
  }
}
