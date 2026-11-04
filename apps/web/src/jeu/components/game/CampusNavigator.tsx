import { useEffect } from "react"
import { isMapKey } from "../../game/shortcuts"
import { WORLD_ROOMS, WALKABLE_AREAS, getRoomAt } from "../../game/world"
import { PlayableCampusScene } from "../artwork/PlayableCampusScene"
import { MISSIONS } from "../../../../../../shared/missions"
import type { PlayerPosition } from "../../types/game"
import "../../styles/navigation.css"
interface Props {
  position: PlayerPosition
  solvedRoomIds: readonly string[]
  targetRoomId?: string
  camera?: { x: number; y: number; width: number; height: number }
}
const numbers: Record<string, string> = {
  classroom: "02",
  cafeteria: "01",
  gaming: "04",
  cowork: "05",
  amphitheater: "03",
  sormiou: "★",
  vending: "?",
}
export function CampusMinimap({ position, solvedRoomIds, targetRoomId, camera }: Props) {
  return (
    <span className="campus-mini">
      <span className="mini-title">
        PLAN DU CAMPUS <small>M · AGRANDIR</small>
      </span>
      <svg
        viewBox="0 70 1600 1030"
        role="img"
        aria-label="Mini-carte du campus avec position de Noah et modules réparés"
      >
        <g fill="#9188c8" stroke="#1B1030" strokeWidth="10">
          {WALKABLE_AREAS.slice(7).map((area, i) => (
            <rect key={i} {...area} />
          ))}
        </g>
        {WORLD_ROOMS.map((room) => (
          <g key={room.id}>
            <rect
              {...room.floor}
              rx="24"
              fill={
                solvedRoomIds.includes(room.id)
                  ? "#3DDC6A"
                  : room.id === targetRoomId
                    ? "#2EE6FF"
                    : room.kind === "final"
                      ? "#FF3E7F"
                      : "#F4F6FF"
              }
              stroke="#1B1030"
              strokeWidth="15"
            />
            <text
              x={room.floor.x + room.floor.width / 2}
              y={room.floor.y + room.floor.height / 2 + 27}
              textAnchor="middle"
              fill="#1B1030"
              fontFamily="Lilita One"
              fontSize="95"
            >
              {solvedRoomIds.includes(room.id) ? "✓" : numbers[room.id]}
            </text>
          </g>
        ))}
        {camera && (
          <rect
            {...camera}
            rx="18"
            fill="#2d6bff12"
            stroke="#2D6BFF"
            strokeWidth="12"
            strokeDasharray="22 14"
          />
        )}
        <circle
          cx={position.x}
          cy={position.y}
          r="40"
          fill="#FFD93B"
          stroke="#1B1030"
          strokeWidth="15"
        />
        <circle cx={position.x} cy={position.y} r="12" fill="#1B1030" />
      </svg>
      <span className="mini-caption">
        <i />
        TOI <span>{solvedRoomIds.length}/5 RÉPARÉS</span>
      </span>
    </span>
  )
}
export function CampusNavigator({
  position,
  solvedRoomIds,
  targetRoomId,
  onBack,
}: {
  position: PlayerPosition
  solvedRoomIds: readonly string[]
  targetRoomId?: string
  onBack: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        !e.defaultPrevented &&
        !e.repeat &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey &&
        (e.key === "Escape" || isMapKey(e))
      ) {
        e.preventDefault()
        onBack()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onBack])
  const current = getRoomAt(position)
  return (
    <div className="navigator-screen">
      <header>
        <div>
          <small>INSTITUT G4 · CARTE TACTIQUE</small>
          <h1>PLAN DU CAMPUS</h1>
        </div>
        <button className="r-btn r-btn-gold" onClick={onBack}>
          ← RETOUR AU JEU · M / ÉCHAP
        </button>
      </header>
      <div className="navigator-layout">
        <div className="navigator-map">
          <svg viewBox="0 30 1600 1100" aria-label="Carte détaillée du campus">
            <PlayableCampusScene />
            {WORLD_ROOMS.map((room) => (
              <g
                key={room.id}
                aria-label={room.label}
                className={`navigator-room ${targetRoomId === room.id ? "is-target" : ""}`}
              >
                <rect
                  {...room.floor}
                  rx="15"
                  fill={solvedRoomIds.includes(room.id) ? "#3DDC6A24" : "transparent"}
                  stroke={targetRoomId === room.id ? "#2EE6FF" : "transparent"}
                  strokeWidth="12"
                />
                <g
                  transform={`translate(${room.floor.x + room.floor.width / 2} ${room.floor.y + 35})`}
                >
                  <rect
                    x="-80"
                    y="-20"
                    width="160"
                    height="42"
                    rx="12"
                    fill={
                      solvedRoomIds.includes(room.id)
                        ? "#3DDC6A"
                        : room.kind === "final"
                          ? "#FF3E7F"
                          : "#FFD93B"
                    }
                    stroke="#1B1030"
                    strokeWidth="6"
                  />
                  <text
                    textAnchor="middle"
                    y="10"
                    fontSize="30"
                    fontFamily="Lilita One"
                    fill="#1B1030"
                  >
                    {solvedRoomIds.includes(room.id)
                      ? "RÉPARÉ ✓"
                      : room.kind === "final"
                        ? "SORTIE ★"
                        : room.kind === "hint"
                          ? "INDICE ?"
                          : "MODULE " + numbers[room.id]}
                  </text>
                </g>
              </g>
            ))}
            <circle
              cx={position.x}
              cy={position.y}
              r="35"
              fill="#FFD93B"
              stroke="#1B1030"
              strokeWidth="12"
            />
            <text
              x={position.x}
              y={position.y + 10}
              textAnchor="middle"
              fontSize="25"
              fontFamily="Lilita One"
              fill="#1B1030"
            >
              TOI
            </text>
          </svg>
        </div>
        <aside className="navigator-sidebar">
          <div className="navigator-status">
            <span>TU ES ICI</span>
            <strong>{current?.label ?? "Couloirs du campus"}</strong>
            <small>{solvedRoomIds.length}/5 fragments récupérés</small>
          </div>
          <p>Repère les salles, puis rejoins-les à pied par les couloirs et les portes.</p>
          <div className="navigator-list" role="list" aria-label="Salles du campus">
            {WORLD_ROOMS.map((room) => (
              <article
                role="listitem"
                aria-label={room.label}
                key={room.id}
                className={`navigator-room-info ${targetRoomId === room.id ? "is-target" : ""}`}
              >
                <b>{solvedRoomIds.includes(room.id) ? "✓" : numbers[room.id]}</b>
                <span>
                  <strong>{room.label}</strong>
                  <small>
                    {solvedRoomIds.includes(room.id) ? "Module réparé" : MISSIONS[room.id].title}
                  </small>
                </span>
              </article>
            ))}
          </div>
        </aside>
      </div>
      <footer>
        <span>
          <i className="map-key key-yellow" />
          Ta position
        </span>
        <span>
          <i className="map-key key-green" />
          Module réparé
        </span>
        <span>
          <i className="map-key key-cyan" />
          Objectif en cours
        </span>
        <span>
          <i className="map-key key-pink" />
          Console de sortie
        </span>
        <b>COULOIRS ET PORTES · DÉPLACEMENT À PIED</b>
      </footer>
    </div>
  )
}
