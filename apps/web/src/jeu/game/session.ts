import { DAY_START, DAY_END, CAMPUS_MINUTES_PER_SECOND } from "../../../../../shared/clock"
export { DAY_START, DAY_END, CAMPUS_MINUTES_PER_SECOND }
import type { PlayerPosition } from "../types/game"
import { canWalkAt, START_POSITION } from "./world"
import { SCENARIO, SORMIOU_THRESHOLD, availablePuzzle } from "../../../../../shared/scenario"
import { isDifficulty, rulesFor } from "./difficulty"
import type { Difficulty } from "./difficulty"

export interface AdventureSession {
  version: 2
  challengeSeed?: string
  profileId: string
  difficulty: Difficulty
  started: boolean
  gameMinute: number
  loopNumber: number
  playedSeconds: number
  mistakes: number
  solvedRoomIds: string[]
  solvedPuzzleIds: string[]
  /** Énigmes résolues au moins une fois : le joueur s'en souvient d'une boucle à l'autre. */
  memoryIds: string[]
  knownHintIds: string[]
  hintLevels: Record<string, number>
  hintUses: number
  errorCounts: Record<string, number>
  /** Conservé pour la compatibilité des sauvegardes : le terminal n'est plus jamais bloqué. */
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
export function createSession(
  profileId: string,
  unlockedEndings: number[] = [],
  difficulty: Difficulty = "classic",
): AdventureSession {
  return {
    version: 2,
    challengeSeed: "scenario2",
    profileId,
    difficulty,
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
function solvedRooms(solvedPuzzleIds: readonly string[]) {
  return [
    ...new Set(
      SCENARIO.filter((p) =>
        SCENARIO.filter((other) => other.roomId === p.roomId).every((other) =>
          solvedPuzzleIds.includes(other.id),
        ),
      ).map((p) => p.roomId),
    ),
  ]
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
  // En mode Détente, l'horloge reste figée : seules les secondes jouées sont comptées.
  const next = rulesFor(session.difficulty).loopMinutes
    ? session.gameMinute + minutes
    : session.gameMinute
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
  return {
    ...session,
    solvedPuzzleIds,
    solvedRoomIds: solvedRooms(solvedPuzzleIds),
    memoryIds: [...new Set([...session.memoryIds, id])],
    procedureValidated: id === "correctif" || session.procedureValidated,
  }
}
export function recordError(
  session: AdventureSession,
  id: string,
  _now = Date.now(),
): AdventureSession {
  void _now
  if (session.ending) return session
  const errors = (session.errorCounts[id] ?? 0) + 1
  return advanceTime(
    {
      ...session,
      mistakes: session.mistakes + 1,
      errorCounts: { ...session.errorCounts, [id]: errors },
      lockouts: {},
    },
    rulesFor(session.difficulty).wrongAnswerMinutes,
  )
}
/** Coût, en minutes de campus, d'un niveau d'indice pour cette énigme. */
export function hintCost(session: AdventureSession, id: string, level: 1 | 2 | 3) {
  const p = SCENARIO.find((p) => p.id === id)
  const free =
    level === 1 &&
    session.trustedLea &&
    !!p &&
    ["planning", "script", "differences"].includes(p.kind)
  return free ? 0 : rulesFor(session.difficulty).hintCosts[level - 1]
}
export function revealHint(
  session: AdventureSession,
  id: string,
  level: 1 | 2 | 3,
): AdventureSession {
  const p = SCENARIO.find((p) => p.id === id)
  if (
    !p ||
    (session.hintLevels[id] ?? 0) >= level ||
    availablePuzzle(session.solvedPuzzleIds)?.id !== id
  )
    return session
  return advanceTime(
    {
      ...session,
      knownHintIds: [...new Set([...session.knownHintIds, id])],
      hintLevels: { ...session.hintLevels, [id]: level },
      hintUses: session.hintUses + 1,
    },
    hintCost(session, id, level),
  )
}
export function trustLea(session: AdventureSession): AdventureSession {
  if (session.trustedLea) return session
  return advanceTime({ ...session, trustedLea: true }, rulesFor(session.difficulty).leaHelpMinutes)
}
/** La coupure de courant de Sormiou n'est possible qu'après cinq énigmes. */
export function canCutPower(session: AdventureSession) {
  return !session.ending && session.solvedPuzzleIds.length >= SORMIOU_THRESHOLD
}
export function finishSession(session: AdventureSession, ending: 1 | 2): AdventureSession {
  if (session.ending) return session
  if (ending === 1 && !session.solvedPuzzleIds.includes("correctif")) return session
  if (ending === 2 && !canCutPower(session)) return session
  return {
    ...session,
    ending,
    unlockedEndings: [...new Set([...session.unlockedEndings, ending])],
  }
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
    const difficulty = isDifficulty(v.difficulty) ? v.difficulty : "classic"
    if (v.version === 1)
      return { ...createSession(profileId, endings, difficulty), started: v.started === true }
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
      return createSession(profileId, endings, difficulty)
    const ids = SCENARIO.map((p) => p.id)
    const solved: string[] = []
    for (const p of SCENARIO) {
      if (!v.solvedPuzzleIds.includes(p.id)) break
      solved.push(p.id)
    }
    const position = v.playerPosition as unknown as PlayerPosition
    return {
      ...createSession(profileId, endings, difficulty),
      ...v,
      version: 2,
      profileId,
      difficulty,
      lockouts: {},
      solvedPuzzleIds: solved,
      solvedRoomIds: solvedRooms(solved),
      memoryIds: [...new Set([...v.memoryIds.filter((id) => ids.includes(id)), ...solved])],
      hintLevels: Object.fromEntries(
        Object.entries(v.hintLevels).filter(([, level]) => level >= 1 && level <= 3),
      ),
      playerPosition: canWalkAt(position) ? { ...position } : { ...INITIAL_POSITION },
      procedureValidated: solved.includes("correctif"),
      unlockedEndings: endings,
      event: v.event === "reboot" ? "reboot" : null,
    } as AdventureSession
  } catch {
    return createSession(profileId)
  }
}
