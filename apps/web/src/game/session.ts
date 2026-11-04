export const SAVE_KEY = "g4ever:save:valentin:v1"
export const LOOP_DURATION_MS = 15 * 60 * 1000
export const PUZZLE_ROOM_IDS = [
  "classroom",
  "cafeteria",
  "gaming",
  "cowork",
  "amphitheater",
] as const
export type PuzzleRoomId = (typeof PUZZLE_ROOM_IDS)[number]
export interface PlayerPosition {
  x: number
  y: number
}
export const INITIAL_POSITION: PlayerPosition = { x: 1000, y: 700 }

export interface AdventureSession {
  version: 1
  status: "idle" | "running" | "expired" | "won"
  remainingMs: number
  playedMs: number
  loopNumber: number
  solvedRoomIds: PuzzleRoomId[]
  knownHintIds: string[]
  playerPosition: PlayerPosition
}

export function createSession(loopNumber = 1, knownHintIds: string[] = []): AdventureSession {
  return {
    version: 1,
    status: "idle",
    remainingMs: LOOP_DURATION_MS,
    playedMs: 0,
    loopNumber,
    solvedRoomIds: [],
    knownHintIds: [...knownHintIds],
    playerPosition: { ...INITIAL_POSITION },
  }
}

export function beginSession(): AdventureSession {
  return { ...createSession(), status: "running" }
}

export function advanceTime(session: AdventureSession, elapsedMs: number): AdventureSession {
  if (session.status !== "running" || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return session
  const elapsed = Math.min(elapsedMs, session.remainingMs)
  const remainingMs = session.remainingMs - elapsed
  return {
    ...session,
    remainingMs,
    playedMs: session.playedMs + elapsed,
    status: remainingMs === 0 ? "expired" : "running",
  }
}

export function restartLoop(session: AdventureSession): AdventureSession {
  if (session.status !== "expired") return session
  return {
    ...createSession(session.loopNumber + 1, session.knownHintIds),
    status: "running",
    playedMs: session.playedMs,
  }
}

export function isPuzzleRoomId(value: unknown): value is PuzzleRoomId {
  return PUZZLE_ROOM_IDS.some((id) => id === value)
}

export function solveRoom(session: AdventureSession, roomId: unknown): AdventureSession {
  if (session.status !== "running" || !isPuzzleRoomId(roomId)) return session
  if (session.solvedRoomIds.includes(roomId)) return session
  const solvedRoomIds = [...session.solvedRoomIds, roomId]
  return {
    ...session,
    solvedRoomIds,
    status: solvedRoomIds.length === PUZZLE_ROOM_IDS.length ? "won" : "running",
  }
}

export function isPlayerPosition(value: unknown): value is PlayerPosition {
  if (typeof value !== "object" || value === null) return false
  const { x, y } = value as PlayerPosition
  return Number.isFinite(x) && Number.isFinite(y) && x >= 16 && x <= 1984 && y >= 20 && y <= 1380
}

export function formatDuration(seconds: number) {
  const value = Math.max(0, Math.floor(seconds))
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`
}

export function readSession(storage?: Pick<Storage, "getItem">): AdventureSession {
  try {
    const value: unknown = JSON.parse((storage ?? localStorage).getItem(SAVE_KEY) ?? "null")
    if (typeof value !== "object" || value === null) return createSession()
    const data = value as Record<string, unknown>
    if (
      data.version !== 1 ||
      !["idle", "running", "expired", "won"].includes(data.status as string) ||
      typeof data.remainingMs !== "number" ||
      !Number.isFinite(data.remainingMs) ||
      data.remainingMs < 0 ||
      data.remainingMs > LOOP_DURATION_MS ||
      typeof data.playedMs !== "number" ||
      !Number.isFinite(data.playedMs) ||
      data.playedMs < 0 ||
      typeof data.loopNumber !== "number" ||
      !Number.isSafeInteger(data.loopNumber) ||
      data.loopNumber < 1 ||
      !Array.isArray(data.solvedRoomIds) ||
      !data.solvedRoomIds.every(isPuzzleRoomId) ||
      new Set(data.solvedRoomIds).size !== data.solvedRoomIds.length ||
      !Array.isArray(data.knownHintIds) ||
      !data.knownHintIds.every((id) => typeof id === "string" && id.length > 0) ||
      !isPlayerPosition(data.playerPosition) ||
      (data.status === "expired") !== (data.remainingMs === 0) ||
      (data.status === "won") !== (data.solvedRoomIds.length === PUZZLE_ROOM_IDS.length) ||
      (data.status === "idle" &&
        (data.solvedRoomIds.length > 0 || data.remainingMs !== LOOP_DURATION_MS))
    )
      return createSession()
    return {
      version: 1,
      status: data.status as AdventureSession["status"],
      remainingMs: data.remainingMs,
      playedMs: data.playedMs,
      loopNumber: data.loopNumber,
      solvedRoomIds: [...data.solvedRoomIds],
      knownHintIds: [...new Set(data.knownHintIds as string[])],
      playerPosition: { ...data.playerPosition },
    }
  } catch {
    return createSession()
  }
}
