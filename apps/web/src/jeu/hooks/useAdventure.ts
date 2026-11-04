import { freshCampaignSeed } from "../game/campaignDeck"
import { useCallback, useEffect, useRef, useState } from "react"
import { advanceTime, createSession, readSession } from "../game/session"
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

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setSession((previous) => advanceTime(previous, 1, 1))
    }, 1000)
    return () => window.clearInterval(timer)
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
  const solve = (roomId: string) =>
    setSession((previous) => ({
      ...previous,
      solvedRoomIds: [...new Set([...previous.solvedRoomIds, roomId])],
    }))
  const fail = (puzzleId: string) =>
    setSession((previous) =>
      advanceTime(
        {
          ...previous,
          mistakes: previous.mistakes + 1,
          knownHintIds: [...new Set([...previous.knownHintIds, puzzleId])],
        },
        20,
      ),
    )
  const rememberHint = (puzzleId: string) =>
    setSession((previous) => ({
      ...previous,
      knownHintIds: [...new Set([...previous.knownHintIds, puzzleId])],
    }))
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
    finish,
    dismissEvent,
  }
}
