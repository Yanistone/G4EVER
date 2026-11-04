import { useEffect, useState } from "react"
import {
  GameArtwork0,
  GameArtwork1,
  GameArtwork2,
  GameArtwork5,
} from "../components/artwork/GameArtwork"
import type { GameData, PlayerPosition } from "../types/game"
import "../styles/game.css"

export interface GamePageProps {
  data: GameData
  onInteract: () => void
  onOpenMap: () => void
  onPause: () => void
  onMove?: (position: PlayerPosition) => void
  isPaused?: boolean
}

const fraction = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export function GamePage({
  data,
  onInteract,
  onOpenMap,
  onPause,
  onMove,
  isPaused = false,
}: GamePageProps) {
  const [position, setPosition] = useState(data.playerPosition)

  useEffect(() => {
    setPosition({ x: data.playerPosition.x, y: data.playerPosition.y })
  }, [data.playerPosition.x, data.playerPosition.y])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isPaused || event.altKey || event.ctrlKey || event.metaKey) return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          'input, textarea, select, [contenteditable="true"], [role="dialog"], dialog',
        )
      )
        return
      const key = event.key.toLowerCase()
      if (key === "e" || key === "m" || key === "escape") {
        event.preventDefault()
        if (!event.repeat) {
          if (key === "e") onInteract()
          if (key === "m") onOpenMap()
          if (key === "escape") onPause()
        }
        return
      }
      const step = 8
      let dx = 0
      let dy = 0
      if (["arrowup", "z", "w"].includes(key)) dy = -step
      if (["arrowdown", "s"].includes(key)) dy = step
      if (["arrowleft", "q", "a"].includes(key)) dx = -step
      if (["arrowright", "d"].includes(key)) dx = step
      if (!dx && !dy) return
      event.preventDefault()
      const bounds = data.movementBounds
      const next = {
        x: Math.min(bounds.maxX, Math.max(bounds.minX, position.x + dx)),
        y: Math.min(bounds.maxY, Math.max(bounds.minY, position.y + dy)),
      }
      setPosition(next)
      onMove?.(next)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [data.movementBounds, isPaused, onInteract, onMove, onOpenMap, onPause, position])

  const hintCount = Math.max(0, Math.min(4, data.hintCount))
  const hintCapacity = Math.max(0, Math.min(4, data.hintCapacity))

  return (
    <div className="game-page" aria-label="Exploration du réfectoire">
      <GameArtwork0 playerPosition={position} />
      <div className="game-identity">
        <div className="game-loop">
          <GameArtwork1 />
          Boucle n°{data.loopNumber}
        </div>
        <div className="game-day">{data.day}</div>
      </div>
      <section className="game-timeline" aria-label="Horloge de la journée">
        <div className="game-timeline-labels">
          <span className="game-time-start">{data.startTime}</span>
          <span className="game-time-current">{data.currentTime}</span>
          <span className="game-time-crash">{data.crashTime} CRASH</span>
        </div>
        <div
          className="game-time-track"
          role="progressbar"
          aria-label="Progression de la journée"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction(data.elapsedFraction) * 100)}
        >
          <div
            className="game-time-fill"
            style={{ width: `${fraction(data.elapsedFraction) * 100}%` }}
          />
          <div
            className="game-time-warning"
            style={{ width: `${fraction(data.warningFraction) * 100}%` }}
          />
        </div>
      </section>
      <button
        type="button"
        className="game-button game-pause"
        onClick={onPause}
        disabled={isPaused}
        aria-label="Pause"
        aria-keyshortcuts="Escape"
      >
        <span />
        <span />
      </button>
      <section className="game-objectives" aria-labelledby="game-objective-title">
        <p className="game-eyebrow">OBJECTIF</p>
        <h1 id="game-objective-title" className="game-objective-title">
          {data.objectiveTitle}
        </h1>
        {data.objectives.map((objective) => (
          <p
            key={objective.id}
            className={`game-objective${objective.completed ? " is-completed" : ""}`}
          >
            {`${objective.completed ? "✔" : "☐"} ${objective.label}`}
          </p>
        ))}
      </section>
      <button
        type="button"
        className="game-button game-interact"
        onClick={onInteract}
        disabled={isPaused}
        aria-keyshortcuts="E"
      >
        <span className="game-keycap" aria-hidden="true">
          E
        </span>{" "}
        {data.interactionLabel}
      </button>
      <section className="game-memories" aria-label="Souvenirs collectés">
        <p className="game-eyebrow">SOUVENIRS · {hintCount} INDICES</p>
        <div className="game-memory-slots">
          {Array.from({ length: hintCapacity }, (_, index) => (
            <div
              key={index}
              className={`game-memory-slot${index < hintCount ? " is-collected" : ""}`}
              aria-label={index < hintCount ? `Indice ${index + 1} collecté` : "Emplacement vide"}
            >
              {index < hintCount && <GameArtwork2 />}
            </div>
          ))}
        </div>
      </section>
      <button
        type="button"
        className="game-button game-minimap"
        onClick={onOpenMap}
        disabled={isPaused}
        aria-label="Ouvrir la carte du campus"
        aria-keyshortcuts="M"
      >
        <GameArtwork5 playerPosition={position} />
      </button>
    </div>
  )
}
