export const GAME_DURATION_MINUTES = 15
export const GAME_DURATION_MS = GAME_DURATION_MINUTES * 60000
export const DAY_START = 9 * 60
export const DAY_END = 16 * 60
export const CAMPUS_MINUTES_PER_SECOND = (DAY_END - DAY_START) / (GAME_DURATION_MS / 1000)
export const WRONG_ANSWER_MINUTES = 10
export const PUZZLE_LOCK_MS = 30000
export function penaltyMilliseconds(minutes: number) {
  return (minutes / CAMPUS_MINUTES_PER_SECOND) * 1000
}
export function campusMinuteAt(startsAt: number, now: number, penaltyMinutes = 0) {
  return Math.min(
    DAY_END,
    DAY_START + (Math.max(0, now - startsAt) / 1000) * CAMPUS_MINUTES_PER_SECOND + penaltyMinutes,
  )
}
export function remainingMilliseconds(startsAt: number, now: number, penaltyMinutes = 0) {
  return Math.max(
    0,
    GAME_DURATION_MS - Math.max(0, now - startsAt) - penaltyMilliseconds(penaltyMinutes),
  )
}
export function formatCampusClock(minutes: number) {
  return `${Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(minutes % 60)
    .toString()
    .padStart(2, "0")}`
}
