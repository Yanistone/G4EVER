import type { PlayerPosition } from "../types/game"
import { canWalkAt, START_POSITION } from "./world"
import { SCENARIO, availablePuzzle } from "../../../../../shared/scenario"

export interface AdventureSession {
  version: 2
  challengeSeed?: string
  profileId: string
  started: boolean
  gameMinute: number
  loopNumber: number
  playedSeconds: number
  mistakes: number
  solvedRoomIds: string[]
  solvedPuzzleIds: string[]
  memoryIds: string[]
  knownHintIds: string[]
  hintLevels: Record<string, number>
  hintUses: number
  errorCounts: Record<string, number>
  lockouts: Record<string, number>
  trustedLea: boolean
  procedureValidated: boolean
  hasVendingClue: boolean
  playerPosition: PlayerPosition
  ending: 1 | 2 | null
  unlockedEndings: number[]
  event: "reboot" | null
  updatedAt: string
}
export const INITIAL_POSITION: PlayerPosition = { ...START_POSITION }
export const DAY_START = 540
export const DAY_END = 960
export const CAMPUS_MINUTES_PER_SECOND = (DAY_END - DAY_START) / (15 * 60)
export function createSession(profileId: string, unlockedEndings: number[] = []): AdventureSession {
  return {
    version: 2,
    challengeSeed: "scenario2",
    profileId,
    started: false,
    gameMinute: DAY_START,
    loopNumber: 1,
    playedSeconds: 0,
    mistakes: 0,
    solvedRoomIds: [],
    solvedPuzzleIds: [],
    memoryIds: [],
    knownHintIds: [],
    hintLevels: {},
    hintUses: 0,
    errorCounts: {},
    lockouts: {},
    trustedLea: false,
    procedureValidated: false,
    hasVendingClue: false,
    playerPosition: { ...INITIAL_POSITION },
    ending: null,
    unlockedEndings: [...new Set(unlockedEndings.filter((v) => v === 1 || v === 2))],
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
  if (
    session.ending ||
    !session.started ||
    !Number.isFinite(minutes) ||
    minutes < 0 ||
    !Number.isFinite(realSeconds) ||
    realSeconds < 0
  )
    return session
  const next = session.gameMinute + minutes
  if (next < DAY_END - 0.000001)
    return { ...session, gameMinute: next, playedSeconds: session.playedSeconds + realSeconds }
  return {
    ...session,
    gameMinute: DAY_START,
    loopNumber: session.loopNumber + 1,
    playedSeconds: session.playedSeconds + realSeconds,
    solvedRoomIds: [],
    solvedPuzzleIds: [],
    errorCounts: {},
    lockouts: {},
    trustedLea: false,
    procedureValidated: false,
    playerPosition: { ...INITIAL_POSITION },
    event: "reboot",
  }
}
export function solvePuzzle(session: AdventureSession, id: string): AdventureSession {
  if (availablePuzzle(session.solvedPuzzleIds)?.id !== id || session.ending) return session
  const solvedPuzzleIds = [...session.solvedPuzzleIds, id]
  const solvedRoomIds = [
    ...new Set(
      SCENARIO.filter((p) =>
        SCENARIO.filter((other) => other.roomId === p.roomId).every((other) =>
          solvedPuzzleIds.includes(other.id),
        ),
      ).map((p) => p.roomId),
    ),
  ]
  return {
    ...session,
    solvedPuzzleIds,
    solvedRoomIds,
    memoryIds: [...new Set([...session.memoryIds, id])],
    procedureValidated: id === "correctif" || session.procedureValidated,
  }
}
export function recordError(
  session: AdventureSession,
  id: string,
  now = Date.now(),
): AdventureSession {
  if ((session.lockouts[id] ?? 0) > now || session.ending) return session
  const errors = (session.errorCounts[id] ?? 0) + 1
  return advanceTime(
    {
      ...session,
      mistakes: session.mistakes + 1,
      errorCounts: { ...session.errorCounts, [id]: errors },
      lockouts: { ...session.lockouts, [id]: errors % 3 === 0 ? now + 30000 : 0 },
    },
    10,
  )
}
export function revealHint(session: AdventureSession, id: string, level: 1 | 2): AdventureSession {
  const p = SCENARIO.find((p) => p.id === id)
  if (
    !p ||
    (session.hintLevels[id] ?? 0) >= level ||
    availablePuzzle(session.solvedPuzzleIds)?.id !== id
  )
    return session
  const free =
    level === 1 && session.trustedLea && ["planning", "script", "differences"].includes(p.kind)
  return advanceTime(
    {
      ...session,
      knownHintIds: [...new Set([...session.knownHintIds, id])],
      hintLevels: { ...session.hintLevels, [id]: level },
      hintUses: session.hintUses + 1,
    },
    free ? 0 : level === 1 ? 5 : 10,
  )
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string")
const numbers = (v: unknown): v is Record<string, number> =>
  record(v) && Object.values(v).every((x) => typeof x === "number" && Number.isFinite(x) && x >= 0)
export function readSession(
  profileId: string,
  storage?: Pick<Storage, "getItem">,
): AdventureSession {
  try {
    const v: unknown = JSON.parse(
      (storage ?? localStorage).getItem(`g4-ever:save:${profileId}`) ?? "null",
    )
    if (!record(v) || v.profileId !== profileId || ![1, 2].includes(v.version as number))
      return createSession(profileId)
    const endings = Array.isArray(v.unlockedEndings)
      ? v.unlockedEndings.filter((n): n is number => n === 1 || n === 2)
      : []
    if (v.version === 1)
      return { ...createSession(profileId, endings), started: v.started === true }
    if (
      typeof v.started !== "boolean" ||
      typeof v.gameMinute !== "number" ||
      !Number.isFinite(v.gameMinute) ||
      v.gameMinute < DAY_START ||
      v.gameMinute >= DAY_END ||
      !Number.isSafeInteger(v.loopNumber) ||
      (v.loopNumber as number) < 1 ||
      ![v.playedSeconds, v.mistakes, v.hintUses].every(
        (n) => typeof n === "number" && Number.isFinite(n) && n >= 0,
      ) ||
      !strings(v.solvedPuzzleIds) ||
      !strings(v.memoryIds) ||
      !strings(v.knownHintIds) ||
      !numbers(v.hintLevels) ||
      !numbers(v.errorCounts) ||
      !numbers(v.lockouts) ||
      !record(v.playerPosition) ||
      !Number.isFinite(v.playerPosition.x) ||
      !Number.isFinite(v.playerPosition.y) ||
      ![null, 1, 2].includes(v.ending as number | null)
    )
      return createSession(profileId, endings)
    const ids = SCENARIO.map((p) => p.id)
    const solved: string[] = []
    for (const p of SCENARIO) {
      if (!v.solvedPuzzleIds.includes(p.id)) break
      solved.push(p.id)
    }
    const position = v.playerPosition as unknown as PlayerPosition
    return {
      ...createSession(profileId, endings),
      ...v,
      version: 2,
      profileId,
      solvedPuzzleIds: solved,
      solvedRoomIds: [
        ...new Set(
          SCENARIO.filter((p) =>
            SCENARIO.filter((q) => q.roomId === p.roomId).every((q) => solved.includes(q.id)),
          ).map((p) => p.roomId),
        ),
      ],
      memoryIds: v.memoryIds.filter((id) => ids.includes(id)),
      playerPosition: canWalkAt(position) ? { ...position } : { ...INITIAL_POSITION },
      procedureValidated: solved.includes("correctif"),
      unlockedEndings: endings,
      event: v.event === "reboot" ? "reboot" : null,
    } as AdventureSession
  } catch {
    return createSession(profileId)
  }
}
