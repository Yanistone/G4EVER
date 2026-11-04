import { useCallback, useEffect, useRef, useState } from "react"
import type { RaceCredentials, RaceSnapshot } from "../../../../shared/race"
const KEY = "g4-ever:race-session"
function restore(): RaceCredentials | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "null")
  } catch {
    return null
  }
}
export function useRace() {
  const [credentials, setCredentials] = useState<RaceCredentials | null>(restore)
  const [state, setState] = useState<RaceSnapshot | null>(null)
  const [error, setError] = useState("")
  const [connected, setConnected] = useState(true)
  const [pending, setPending] = useState(false)
  const credentialsRef = useRef(credentials)
  credentialsRef.current = credentials
  const revision = useRef(0)
  const applied = useRef(0)
  const alive = useRef(true)
  const queuedMove = useRef<{ x: number; y: number } | null>(null)
  const moveTask = useRef<Promise<void> | null>(null)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  const request = useCallback(
    async (
      action: string,
      data: Record<string, unknown> = {},
      explicit?: RaceCredentials | null,
    ) => {
      const auth = explicit === undefined ? credentialsRef.current : explicit
      const id = ++revision.current
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 8000)
      try {
        const url =
          action === "create"
            ? "/api/rooms"
            : `/api/rooms/${String(data.code ?? auth?.code ?? "")}/${action}`
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(auth
              ? {
                  "x-player-id": auth.playerId,
                  authorization: `Bearer ${auth.token}`,
                }
              : {}),
          },
          body: JSON.stringify(data),
          signal: controller.signal,
        })
        const result = await response.json().catch(() => ({
          error: "Le serveur ne répond pas. Lance le serveur de jeu puis réessaie.",
        }))
        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            if (action === "state") {
              setCredentials(null)
              setState(null)
              sessionStorage.removeItem(KEY)
            }
          }
          throw new Error(result.error ?? "Action impossible.")
        }
        if (alive.current && id >= applied.current) {
          applied.current = id
          setState(result.snapshot)
          setConnected(true)
          if (action !== "state" && action !== "move") setError("")
        }
        if (result.credentials && alive.current) {
          credentialsRef.current = result.credentials
          setCredentials(result.credentials)
          sessionStorage.setItem(KEY, JSON.stringify(result.credentials))
        }
        return result.snapshot as RaceSnapshot
      } finally {
        window.clearTimeout(timeout)
      }
    },
    [],
  )
  useEffect(() => {
    if (!credentials) return
    let stopped = false
    let timer: number
    const poll = async () => {
      try {
        await request("state")
      } catch (e) {
        if (!stopped) {
          setConnected(false)
          setError(e instanceof Error ? e.message : "Connexion interrompue.")
        }
      } finally {
        if (!stopped) timer = window.setTimeout(poll, 900)
      }
    }
    void poll()
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [credentials, request])
  const act = useCallback(
    async (action: string, data: Record<string, unknown> = {}) => {
      setPending(true)
      try {
        await moveTask.current
        return await request(action, data)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action impossible.")
        return null
      } finally {
        setPending(false)
      }
    },
    [request],
  )
  const leave = useCallback(async () => {
    try {
      await request("leave")
    } catch {}
    credentialsRef.current = null
    setCredentials(null)
    setState(null)
    sessionStorage.removeItem(KEY)
    setError("")
  }, [request])
  const move = useCallback(
    (position: { x: number; y: number }) => {
      queuedMove.current = position
      if (moveTask.current) return
      moveTask.current = (async () => {
        while (queuedMove.current && alive.current) {
          const position = queuedMove.current
          queuedMove.current = null
          try {
            await request("move", { position })
          } catch {
            setConnected(false)
            queuedMove.current = null
          }
        }
      })().finally(() => {
        moveTask.current = null
      })
    },
    [request],
  )
  return {
    state,
    credentials,
    error,
    connected,
    pending,
    act,
    leave,
    move,
    clearError: () => setError(""),
  }
}
