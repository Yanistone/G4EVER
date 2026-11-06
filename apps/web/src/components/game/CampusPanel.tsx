import { useEffect, useState } from "react"
import { gameEvents, GAME_EVENTS } from "../../game/events"
import { CAMPUS_EVENTS } from "../../game/campusEvents"
import type { InteractionRequest } from "../../game/campusEvents"
import { getCampaignSeed } from "../../game/campaignRun"
import { campaignDeck } from "../../game/campaignDeck"
import { getNearbyInteraction, getRoomAt, START_POSITION, WORLD_ROOMS } from "../../game/world"
import type { PlayerPosition } from "../../types/game"
import {
  campusAudio,
  isCampusSoundEnabled,
  setCampusSoundEnabled,
} from "../../services/campusSound"
import { Dialog } from "../ui/Dialog"
import "../../styles/robin.css"

export function CampusPanel() {
  const [position, setPosition] = useState<PlayerPosition>(START_POSITION)
  const [ready, setReady] = useState(false)
  const [seed, setSeed] = useState(getCampaignSeed)
  const [request, setRequest] = useState<InteractionRequest | null>(null)
  const [sound, setSound] = useState(isCampusSoundEnabled)
  const [volume, setVolume] = useState(campusAudio.volume)
  useEffect(() => {
    const ready = (data: { seed: string; position: PlayerPosition }) => {
      setSeed(data.seed)
      setPosition(data.position)
      setReady(true)
    }
    const inspect = (data: InteractionRequest) => setRequest(data)
    gameEvents.on(CAMPUS_EVENTS.ready, ready)
    gameEvents.on(CAMPUS_EVENTS.inspect, inspect)
    gameEvents.on(GAME_EVENTS.playerMoved, setPosition)
    return () => {
      gameEvents.off(CAMPUS_EVENTS.ready, ready)
      gameEvents.off(CAMPUS_EVENTS.inspect, inspect)
      gameEvents.off(GAME_EVENTS.playerMoved, setPosition)
    }
  }, [])
  const nearby = getNearbyInteraction(position)
  const room = getRoomAt(position)
  const selectedRoom = WORLD_ROOMS.find((item) => item.id === request?.roomId)
  const puzzle = request
    ? campaignDeck(request.seed).find((item) => item.roomId === request.roomId)
    : undefined
  const close = () => {
    setRequest(null)
    gameEvents.emit(CAMPUS_EVENTS.controls, true)
  }
  return (
    <>
      <section
        className="campus-hud"
        data-testid="campus-hud"
        data-ready={ready}
        data-x={position.x.toFixed(2)}
        data-y={position.y.toFixed(2)}
        data-seed={seed}
        inert={request !== null}
      >
        <div>
          <strong>{ready ? (room?.label ?? "Couloirs du campus") : "Chargement du campus…"}</strong>
          <p>ZQSD / WASD / flèches : marcher · E : interagir</p>
        </div>
        <div className="campus-audio">
          <button
            aria-pressed={sound}
            onClick={() => {
              const value = !sound
              setCampusSoundEnabled(value)
              setSound(value)
            }}
          >
            {sound ? "COUPER LE SON" : "ACTIVER LE SON"}
          </button>
          <label>
            Volume{" "}
            <input
              aria-label="Volume du jeu"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(event) => {
                const value = Number(event.target.value)
                setVolume(value)
                campusAudio.setVolume(value)
              }}
            />
          </label>
        </div>
        <p className="campus-interaction" aria-live="polite">
          {nearby
            ? `E · ${nearby.interactionLabel}`
            : "Explore les salles et approche-toi des postes."}
        </p>
      </section>
      {request && (
        <Dialog title={selectedRoom?.interactionLabel ?? "Le campus"} onClose={close}>
          <p>{selectedRoom?.label}</p>
          {puzzle?.practical ? (
            <>
              <article className="campus-document">
                <h3>{puzzle.practical.document.name}</h3>
                <p>{puzzle.practical.document.text}</p>
              </article>
              <details>
                <summary>Consulter le terminal</summary>
                <p>{puzzle.practical.instruction}</p>
                <pre>{puzzle.practical.template}</pre>
              </details>
            </>
          ) : (
            <p>
              {request.roomId === "sormiou"
                ? "La console centrale attend les cinq modules de réparation."
                : "Un ticket oublié rappelle que chaque salle cache une partie du correctif."}
            </p>
          )}
        </Dialog>
      )}
    </>
  )
}
