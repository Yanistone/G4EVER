import { useCallback, useEffect, useRef, useState } from "react"
import type { PlayerPosition } from "../types/game"
import type { NoahDirection } from "../components/artwork/NoahSprite"
import {
  findWalkPath,
  canWalkAt,
  getNearbyInteraction,
  getRoomAt,
  moveWithCollisions,
  START_POSITION,
  WALK_SPEED,
} from "../game/world"

interface ExplorationOptions {
  playerPosition: PlayerPosition
  active: boolean
  onMove: (position: PlayerPosition) => void
  onInteract: (roomId: string) => void
  onOpenMap: () => void
  onPause: () => void
}
const movementKeys = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
  "z",
  "q",
])
const equals = (a: PlayerPosition, b: PlayerPosition) =>
  Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01

export function useExploration(options: ExplorationOptions) {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const initial = canWalkAt(options.playerPosition) ? options.playerPosition : START_POSITION
  const positionRef = useRef(initial)
  const lastReported = useRef(initial)
  const keys = useRef(new Set<string>())
  const walkPath = useRef<PlayerPosition[]>([])
  const sprint = useRef(false)
  const moveTo = useCallback((target: PlayerPosition) => {
    if (optionsRef.current.active) walkPath.current = findWalkPath(positionRef.current, target)
  }, [])
  const [position, setPosition] = useState(initial)
  const [direction, setDirection] = useState<NoahDirection>("down")
  const [moving, setMoving] = useState(false)

  const flush = useCallback(() => {
    const current = positionRef.current
    if (!equals(current, lastReported.current)) {
      lastReported.current = current
      optionsRef.current.onMove(current)
    }
  }, [])

  useEffect(() => {
    const incoming = options.playerPosition
    if (!equals(incoming, lastReported.current)) {
      const next = canWalkAt(incoming) ? incoming : START_POSITION
      positionRef.current = next
      lastReported.current = next
      setPosition(next)
    }
  }, [options.playerPosition.x, options.playerPosition.y])

  const interact = useCallback(() => {
    if (!optionsRef.current.active) return
    const room = getNearbyInteraction(positionRef.current)
    if (!room) return
    keys.current.clear()
    walkPath.current = []
    setMoving(false)
    flush()
    optionsRef.current.onInteract(room.id)
  }, [flush])
  const openMap = useCallback(() => {
    if (!optionsRef.current.active) return
    keys.current.clear()
    walkPath.current = []
    setMoving(false)
    flush()
    optionsRef.current.onOpenMap()
  }, [flush])
  const pause = useCallback(() => {
    if (!optionsRef.current.active) return
    keys.current.clear()
    walkPath.current = []
    setMoving(false)
    flush()
    optionsRef.current.onPause()
  }, [flush])

  useEffect(() => {
    if (!options.active) {
      keys.current.clear()
      walkPath.current = []
      setMoving(false)
      flush()
      return
    }
    let frame = 0
    let previousTime = 0
    let previousReport = 0
    const stop = () => {
      keys.current.clear()
      walkPath.current = []
      setMoving(false)
      previousTime = 0
      flush()
    }
    const handleDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]')
      )
        return
      const key = event.key.toLowerCase()
      if (key === "shift") sprint.current = true
      if (movementKeys.has(key)) {
        event.preventDefault()
        keys.current.add(key)
        walkPath.current = []
        return
      }
      if (event.repeat) return
      if (key === "e") {
        event.preventDefault()
        interact()
      }
      if (key === "m") {
        event.preventDefault()
        openMap()
      }
      if (key === "escape") {
        event.preventDefault()
        pause()
      }
    }
    const handleUp = (event: KeyboardEvent) => {
      keys.current.delete(event.key.toLowerCase())
      if (event.key === "Shift") sprint.current = false
      if (!keys.current.size) {
        setMoving(false)
        flush()
      }
    }
    const handleVisibility = () => {
      if (document.hidden) stop()
    }
    const tick = (time: number) => {
      const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0
      previousTime = time
      const pressed = keys.current
      let x =
        Number(["arrowright", "d"].some((key) => pressed.has(key))) -
        Number(["arrowleft", "a", "q"].some((key) => pressed.has(key)))
      let y =
        Number(["arrowdown", "s"].some((key) => pressed.has(key))) -
        Number(["arrowup", "w", "z"].some((key) => pressed.has(key)))
      if (!x && !y && walkPath.current.length) {
        let waypoint = walkPath.current[0]
        if (
          Math.hypot(waypoint.x - positionRef.current.x, waypoint.y - positionRef.current.y) < 4
        ) {
          walkPath.current.shift()
          waypoint = walkPath.current[0]
        }
        if (waypoint) {
          const length = Math.hypot(
            waypoint.x - positionRef.current.x,
            waypoint.y - positionRef.current.y,
          )
          x = (waypoint.x - positionRef.current.x) / length
          y = (waypoint.y - positionRef.current.y) / length
        }
      }
      if (x || y) {
        setDirection(
          Math.abs(x) >= Math.abs(y) ? (x < 0 ? "left" : "right") : y < 0 ? "up" : "down",
        )
        const distance = (WALK_SPEED * (sprint.current ? 1.35 : 1) * dt) / Math.hypot(x, y)
        const next = moveWithCollisions(positionRef.current, x * distance, y * distance)
        const didMove = !equals(positionRef.current, next)
        setMoving(didMove)
        if (didMove) {
          positionRef.current = next
          setPosition(next)
        }
      } else setMoving(false)
      if (time - previousReport >= 200) {
        flush()
        previousReport = time
      }
      frame = requestAnimationFrame(tick)
    }
    window.addEventListener("keydown", handleDown)
    window.addEventListener("keyup", handleUp)
    window.addEventListener("blur", stop)
    document.addEventListener("visibilitychange", handleVisibility)
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("keydown", handleDown)
      window.removeEventListener("keyup", handleUp)
      window.removeEventListener("blur", stop)
      document.removeEventListener("visibilitychange", handleVisibility)
      keys.current.clear()
      walkPath.current = []
      flush()
    }
  }, [options.active, flush, interact, openMap, pause])

  return {
    position,
    direction,
    moving,
    room: getRoomAt(position),
    nearby: getNearbyInteraction(position),
    moveTo,
    interact,
    openMap,
    pause,
  }
}
