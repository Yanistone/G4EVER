import { freshCampaignSeed } from "../game/campaignDeck"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  advanceTime,
  createSession,
  readSession,
  solvePuzzle,
  recordError,
  revealHint,
  CAMPUS_MINUTES_PER_SECOND,
} from "../game/session"
import type { AdventureSession } from "../game/session"
import type { PlayerPosition } from "../types/game"

export function useAdventure(profileId: string | null, running: boolean) {
  const [session, setSession] = useState<AdventureSession>(() =>
    profileId ? readSession(profileId) : createSession("guest"),
  )
  const [saveError, setSaveError] = useState(false)
  const latest = useRef(session)
  latest.current = session
  useEffect(() => {
    setSession(profileId ? readSession(profileId) : createSession("guest"))
  }, [profileId])
  const saveNow = useCallback(() => {
    const value = latest.current
    if (!profileId || value.profileId !== profileId || !value.started) return
    try {
      localStorage.setItem(
        `g4-ever:save:${profileId}`,
        JSON.stringify({ ...value, updatedAt: new Date().toISOString() }),
      )
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [profileId])
  useEffect(() => {
    const timeout = window.setTimeout(saveNow, 200)
    return () => window.clearTimeout(timeout)
  }, [session, saveNow])
  useEffect(() => {
    const hide = () => saveNow()
    window.addEventListener("pagehide", hide)
    return () => {
      window.removeEventListener("pagehide", hide)
      saveNow()
    }
  }, [saveNow])
  useEffect(() => {
    if (!running || !profileId) return

    let last = performance.now()
    const tick = () => {
      const now = performance.now()
      const seconds = (now - last) / 1000
      last = now
      if (document.visibilityState === "visible")
        setSession((previous) =>
          advanceTime(previous, seconds * CAMPUS_MINUTES_PER_SECOND, seconds),
        )
    }
    const visibility = () => {
      last = performance.now()
    }
    document.addEventListener("visibilitychange", visibility)
    const timer = window.setInterval(tick, 250)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", visibility)
    }
  }, [running, profileId])
  const begin = () =>
    setSession((previous) => ({
      ...createSession(profileId ?? "guest", previous.unlockedEndings),
      started: true,
      challengeSeed: freshCampaignSeed(previous.challengeSeed),
    }))
  const move = useCallback(
    (position: PlayerPosition) =>
      setSession((previous) => ({ ...previous, playerPosition: position })),
    [],
  )
  const solve = (puzzleId: string) => setSession((previous) => solvePuzzle(previous, puzzleId))
  const fail = (puzzleId: string) => setSession((previous) => recordError(previous, puzzleId))
  const rememberHint = (puzzleId: string, level: 1 | 2 = 1) =>
    setSession((previous) => revealHint(previous, puzzleId, level))
  const trustLea = () =>
    setSession((previous) =>
      previous.trustedLea ? previous : advanceTime({ ...previous, trustedLea: true }, 10),
    )
  const collectClue = () =>
    setSession((previous) => ({
      ...previous,
      hasVendingClue: true,
      knownHintIds: [...new Set([...previous.knownHintIds, "vending"])],
    }))
  const finish = (ending: 1 | 2) =>
    setSession((previous) => ({
      ...previous,
      ending,
      unlockedEndings: [...new Set([...previous.unlockedEndings, ending])],
    }))
  const dismissEvent = () => setSession((previous) => ({ ...previous, event: null }))
  return {
    session,
    saveError,
    saveNow,
    begin,
    move,
    solve,
    fail,
    collectClue,
    rememberHint,
    trustLea,
    finish,
    dismissEvent,
  }
}
