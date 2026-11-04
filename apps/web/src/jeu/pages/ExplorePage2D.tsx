import { useState } from "react"
import { PlayableCampusScene } from "../components/artwork/PlayableCampusScene"
import { GameArtwork1, GameArtwork2 } from "../components/artwork/GameArtwork"
import { CampusMinimap } from "../components/game/CampusNavigator"
import { NoahSprite } from "../components/artwork/NoahSprite"
import { useExploration } from "../hooks/useExploration"
import { WORLD_ROOMS, WORLD_BOUNDS } from "../game/world"
import type { PlayerPosition } from "../types/game"
import "../styles/game.css"
import "../styles/explore.css"

export interface ExplorePageProps {
  playerPosition: PlayerPosition
  onMove: (position: PlayerPosition) => void
  onOpenMap: () => void
  onPause: () => void
  onInteract: (roomId: string) => void
  solvedRoomIds: readonly string[]
  active: boolean
  gameTime: string
  loopNumber: number
  hintCount: number
  objectiveLabel?: string
  targetRoomId?: string
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

export function ExplorePage(props: ExplorePageProps) {
  const [wideView, setWideView] = useState(true)
  const CAMERA_WIDTH = wideView ? 960 : 720
  const CAMERA_HEIGHT = (CAMERA_WIDTH * 9) / 16
  const { position, direction, moving, room, nearby, moveTo, interact, openMap, pause } =
    useExploration(props)
  const completed = WORLD_ROOMS.filter(
    (item) => item.kind === "puzzle" && props.solvedRoomIds.includes(item.id),
  ).length
  const objective =
    props.objectiveLabel ??
    (completed >= 5 ? "Rejoindre la console de Sormiou" : "Trouver l’origine du bug")
  const camera = {
    x: clamp(position.x - CAMERA_WIDTH / 2, 0, WORLD_BOUNDS.width - CAMERA_WIDTH),
    y: clamp(position.y - CAMERA_HEIGHT * 0.59, 30, WORLD_BOUNDS.height - CAMERA_HEIGHT),
  }
  const clockParts = props.gameTime.split(":").map(Number)
  const elapsed =
    Number.isFinite(clockParts[0]) && Number.isFinite(clockParts[1])
      ? clamp((clockParts[0] * 60 + clockParts[1] - 540) / 420, 0, 1)
      : 0
  const artworkPosition = { x: position.x - 33.6, y: position.y - 70.56 }

  return (
    <div
      className="game-page explore-page"
      data-testid="exploration"
      data-room={room?.id ?? "corridor"}
      aria-label="Exploration du campus G4"
    >
      <div className="explore-stage">
        <svg
          onPointerDown={(event) => {
            if (event.button !== 0) return
            const svg = event.currentTarget
            const matrix = svg.getScreenCTM()
            if (!matrix) return
            const point = svg.createSVGPoint()
            point.x = event.clientX
            point.y = event.clientY
            const world = point.matrixTransform(matrix.inverse())
            moveTo({ x: world.x, y: world.y })
          }}
          className="explore-world"
          width="1280"
          height="720"
          viewBox={`${camera.x} ${camera.y} ${CAMERA_WIDTH} ${CAMERA_HEIGHT}`}
          aria-label={`Campus, ${room?.label ?? "couloirs"}`}
        >
          <PlayableCampusScene />
          {WORLD_ROOMS.map((station) => {
            const solved = props.solvedRoomIds.includes(station.id)
            const selected = nearby?.id === station.id
            const color =
              station.id === props.targetRoomId
                ? "#2EE6FF"
                : solved
                  ? "#3DDC6A"
                  : station.kind === "final"
                    ? "#FF3E7F"
                    : "#FFD93B"
            return (
              <g
                key={station.id}
                className={`explore-station${selected ? " is-near" : ""}`}
                aria-hidden="true"
                transform={`translate(${station.interactionPosition.x} ${station.interactionPosition.y - 62})`}
              >
                <path d="M -11 10 L 0 23 L 11 10" fill={color} stroke="#1B1030" strokeWidth="3" />
                <circle r="17" fill={color} stroke="#1B1030" strokeWidth="3" />
                <text
                  textAnchor="middle"
                  y="6"
                  fontFamily="Lilita One, sans-serif"
                  fontSize="20"
                  fill="#1B1030"
                >
                  {solved
                    ? "✓"
                    : station.kind === "final"
                      ? "!"
                      : station.kind === "hint"
                        ? "?"
                        : "E"}
                </text>
              </g>
            )
          })}
          <g
            data-player="noah"
            data-direction={direction}
            data-moving={moving}
            data-x={position.x.toFixed(2)}
            data-y={position.y.toFixed(2)}
            transform={`translate(${artworkPosition.x} ${artworkPosition.y})`}
          >
            <NoahSprite width={67.2} height={75.6} direction={direction} moving={moving} />
          </g>
        </svg>
      </div>
      <div className="game-identity">
        <div className="game-loop">
          <GameArtwork1 />
          Boucle n°{props.loopNumber}
        </div>
        <div className="game-day">LUNDI</div>
        <div className="explore-room" aria-live="polite">
          {room?.label ?? "Couloirs du campus"}
        </div>
      </div>
      <section className="game-timeline explore-timeline" aria-label="Horloge de la journée">
        <div className="game-timeline-labels">
          <span className="game-time-start">09:00</span>
          <span className="game-time-current">{props.gameTime}</span>
          <span className="game-time-crash">16:00 CRASH</span>
        </div>
        <div
          className="game-time-track"
          role="progressbar"
          aria-label="Progression de la journée"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(elapsed * 100)}
        >
          <div className="game-time-fill" style={{ width: `${elapsed * 100}%` }} />
          <div className="game-time-warning" style={{ width: "12%" }} />
        </div>
      </section>
      <button
        type="button"
        className="game-button game-pause"
        onClick={pause}
        disabled={!props.active}
        aria-label="Pause"
        aria-keyshortcuts="Escape"
      >
        <span />
        <span />
      </button>
      <button
        className="game-button camera-view-button"
        onClick={() => setWideView((value) => !value)}
        aria-pressed={wideView}
      >
        {wideView ? "⊖ VUE LARGE" : "⊕ VUE PROCHE"}
      </button>
      <section
        className="game-objectives explore-objectives"
        aria-label="Objectif et dossiers récupérés"
      >
        <p className="game-eyebrow">OBJECTIF</p>
        <h1 className="game-objective-title">{objective}</h1>
        <p className="explore-progress">{completed}/5 dossiers récupérés</p>
        {WORLD_ROOMS.filter((item) => item.kind === "puzzle").map((item) => (
          <p
            key={item.id}
            className={`game-objective${props.solvedRoomIds.includes(item.id) ? " is-completed" : ""}`}
          >
            <span aria-label={props.solvedRoomIds.includes(item.id) ? "Terminé :" : "À faire :"}>
              {props.solvedRoomIds.includes(item.id) ? "✔" : "☐"}
            </span>{" "}
            {item.label}
          </p>
        ))}
      </section>
      {nearby && (
        <button
          type="button"
          className="game-button explore-interact"
          onClick={interact}
          disabled={!props.active}
          aria-keyshortcuts="E"
        >
          <span className="game-keycap" aria-hidden="true">
            E
          </span>
          {props.solvedRoomIds.includes(nearby.id) ? "Relire le dossier" : nearby.interactionLabel}
        </button>
      )}
      <section className="game-memories explore-memories" aria-label="Indices récupérés">
        <p className="game-eyebrow">SOUVENIRS · {props.hintCount} INDICES</p>
        <div className="explore-memory-summary">
          <GameArtwork2 />
          <span>
            {props.hintCount} souvenir{props.hintCount === 1 ? "" : "s"} conservé
            {props.hintCount === 1 ? "" : "s"}
          </span>
        </div>
      </section>
      <p className="explore-controls">
        <kbd>ZQSD</kbd> / <kbd>WASD</kbd> / <kbd>↑↓←→</kbd> marcher · clic au sol · Maj : courir ·{" "}
        <kbd>E</kbd> interagir · <kbd>M</kbd> carte
      </p>
      <button
        type="button"
        className="game-button game-minimap"
        onClick={openMap}
        disabled={!props.active}
        aria-label="Ouvrir la carte du campus"
        aria-keyshortcuts="M"
      >
        <CampusMinimap
          position={position}
          solvedRoomIds={props.solvedRoomIds}
          targetRoomId={props.targetRoomId}
          camera={{ ...camera, width: CAMERA_WIDTH, height: CAMERA_HEIGHT }}
        />
      </button>
    </div>
  )
}
