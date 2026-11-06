import { useCallback, useEffect, useRef, useState } from "react"
import {
  advanceTime,
  beginSession,
  isPlayerPosition,
  readSession,
  restartLoop,
  SAVE_KEY,
  solveRoom,
} from "../game/session"
import type { AdventureSession } from "../game/session"
import type { CampaignProgress } from "../game/campaign"

export function useAdventure(running: boolean) {
  const [session, setSession] = useState(readSession)
  const [saveError, setSaveError] = useState(false)
  const latest = useRef(session)
  const update = useCallback((change: (previous: AdventureSession) => AdventureSession) => {
    const next = change(latest.current)
    latest.current = next
    setSession(next)
  }, [])
  const saveNow = useCallback(() => {
    if (latest.current.status === "idle") return
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(latest.current))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [])
  useEffect(() => {
    const timer = window.setInterval(saveNow, 1000)
    return () => window.clearInterval(timer)
  }, [saveNow])

  useEffect(() => {
    if (!running) return
    let previous = performance.now()
    let visible = document.visibilityState === "visible"
    const tick = () => {
      const now = performance.now()
      if (visible) update((value) => advanceTime(value, now - previous))
      previous = now
    }
    const onVisibility = () => {
      tick()
      visible = document.visibilityState === "visible"
      saveNow()
    }
    const timer = window.setInterval(tick, 250)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      tick()
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibility)
      saveNow()
    }
  }, [running, update, saveNow])
  useEffect(() => {
    window.addEventListener("pagehide", saveNow)
    return () => {
      window.removeEventListener("pagehide", saveNow)
      saveNow()
    }
  }, [saveNow])
  const begin = useCallback(
    (seed?: string) => {
      update(() => ({ ...beginSession(), ...(seed ? { challengeSeed: seed } : {}) }))
      saveNow()
    },
    [update, saveNow],
  )
  const reboot = useCallback(() => {
    update(restartLoop)
    saveNow()
  }, [update, saveNow])
  const move = useCallback(
    (position: unknown) => {
      if (isPlayerPosition(position))
        update((value) =>
          value.status === "running" ? { ...value, playerPosition: { ...position } } : value,
        )
    },
    [update],
  )
  const solve = useCallback(
    (roomId: unknown) => {
      update((value) => solveRoom(value, roomId))
      saveNow()
    },
    [update, saveNow],
  )
  const recordCampaign = useCallback(
    (progress: CampaignProgress) => {
      update((value) =>
        value.status === "running"
          ? {
              ...value,
              challengeSeed: progress.seed,
              foundDocumentIds: [...progress.foundDocumentIds],
              knownHintIds: [...new Set([...value.knownHintIds, ...progress.knownHintIds])],
            }
          : value,
      )
      saveNow()
    },
    [update, saveNow],
  )
  return { session, saveError, saveNow, begin, reboot, move, solve, recordCampaign }
}
