import type { EscapeDocument } from "../game/escape"
import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { WORLD_ROOMS, getRoomAt } from "../game/world"
import { isMapKey } from "../game/shortcuts"
import type { PlayerPosition } from "../types/game"
import type { CampusRuntime } from "../three/runtime"
import type { Interaction } from "../three/world"
import {
  COLLECTIBLES,
  readInventory,
  writeInventory,
  readDocuments,
  storeDocuments,
} from "../three/inventory"
import { Dialog } from "../components/ui/Dialog"
import { ThreeSettings } from "../components/game/ThreeSettings"
import "../styles/immersive.css"
export interface ExplorePageProps {
  playerPosition: PlayerPosition
  onMove: (p: PlayerPosition) => void
  onOpenMap: () => void
  onPause: () => void
  onInteract: (id: string) => void
  solvedRoomIds: readonly string[]
  unlockedRoomIds?: readonly string[]
  progress?: { solved: number; total: number; missionRooms?: readonly string[] }
  active: boolean
  mapOpen?: boolean
  gameTime: string
  loopNumber: number
  hintCount: number
  objectiveLabel?: string
  targetRoomId?: string
  escapeDocuments?: readonly EscapeDocument[]
  onAskHelp?: (roomId: string) => Promise<string | undefined>
  helpCost?: string
  canAffordHelp?: boolean
  onJournal?: () => void
  inventoryKey?: string
  raceInfo?: { code: string; score: number; rank: string; onBoard: () => void }
}
export function ExplorePage(p: ExplorePageProps) {
  const key = p.inventoryKey ?? "campus"
  const canvas = useRef<HTMLCanvasElement>(null),
    runtime = useRef<CampusRuntime | null>(null),
    latest = useRef(p)
  latest.current = p
  const resumeAfterOverlay = useRef(false)
  const touchLook = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [locked, setLocked] = useState(false),
    [target, setTarget] = useState<Interaction | null>(null)
  const [touchDevice, setTouchDevice] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0),
  )
  const [items, setItems] = useState<string[]>(() => readInventory(key)),
    [inventory, setInventory] = useState(false),
    [settings, setSettings] = useState(false),
    [examined, setExamined] = useState<string | null>(null),
    [talk, setTalk] = useState<{
      name: string
      text: string
      roomId?: string
      hint?: string
    } | null>(null),
    [toast, setToast] = useState(""),
    [helpPending, setHelpPending] = useState(false)
  const [documents, setDocuments] = useState(() => storeDocuments(key, p.escapeDocuments ?? []))
  useEffect(() => {
    setDocuments(storeDocuments(key, p.escapeDocuments ?? []))
  }, [key, JSON.stringify(p.escapeDocuments)])
  const allDocuments = [...COLLECTIBLES, ...documents]
  const itemRef = useRef(items)
  itemRef.current = items
  const blocked = inventory || settings || !!talk || !!error
  const blockedRef = useRef(blocked)
  blockedRef.current = blocked
  const openMap = () => {
    if (runtime.current) runtime.current.openMap()
    else latest.current.onOpenMap()
  }
  const holdMovement = (code: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    runtime.current?.press(code)
  }
  const releaseMovement = (code: string, event: ReactPointerEvent<HTMLButtonElement>) => {
    runtime.current?.release(code)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)")
    const update = () => setTouchDevice(query.matches || (navigator.maxTouchPoints ?? 0) > 0)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    const handleMap = (event: KeyboardEvent) => {
      if (
        !latest.current.active ||
        blockedRef.current ||
        event.defaultPrevented ||
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        !isMapKey(event)
      )
        return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,textarea,select,[contenteditable]:not([contenteditable=false])")
      )
        return
      event.preventDefault()
      event.stopImmediatePropagation()
      openMap()
    }
    window.addEventListener("keydown", handleMap, true)
    return () => window.removeEventListener("keydown", handleMap, true)
  }, [])
  useEffect(() => {
    setItems(readInventory(key))
  }, [key])
  useEffect(() => {
    if (!canvas.current) return
    let cancelled = false
    setReady(false)
    void Promise.all([import("../three/runtime"), document.fonts.ready])
      .then(([module]) => {
        if (cancelled || !canvas.current) return
        const q = latest.current
        try {
          runtime.current = module.createCampusRuntime(
            canvas.current,
            {
              epoch: q.loopNumber,
              active: q.active && !blockedRef.current,
              position: q.playerPosition,
              solved: q.solvedRoomIds,
              unlockedRoomIds: q.unlockedRoomIds,
              inventory: itemRef.current,
              documents: latest.current.escapeDocuments ?? readDocuments(key),
            },
            {
              move: (pos) => latest.current.onMove(pos),
              interact: (id) => latest.current.onInteract(id),
              pause: () => latest.current.onPause(),
              map: () => latest.current.onOpenMap(),
              inventory: () => setInventory(true),
              target: setTarget,
              lock: (value) => {
                if (value) resumeAfterOverlay.current = false
                setLocked(value)
              },
              toast: setToast,
              talk: (name, text, roomId) => setTalk({ name, text, roomId }),
              pickup: (id) => {
                setExamined(id)
                setInventory(true)
                return setItems((prev) => {
                  const next = [...new Set([...prev, id])]
                  itemRef.current = next
                  if (!writeInventory(key, next))
                    setToast("Objet récupéré. Le stockage du navigateur est indisponible.")
                  return next
                })
              },
              error: setError,
            },
            key,
          )
          void runtime.current.ready
            .then(() => {
              if (!cancelled) setReady(true)
            })
            .catch((e) => {
              if (!cancelled) setError("Chargement du décor : " + String(e))
            })
        } catch (e) {
          setError(
            `La 3D n’a pas pu démarrer. Vérifie l’accélération graphique du navigateur. ${e instanceof Error ? e.message : ""}`,
          )
        }
      })
      .catch(() => setError("Le moteur 3D n’a pas pu être chargé. Recharge la page."))
    return () => {
      cancelled = true
      runtime.current?.dispose()
      runtime.current = null
    }
  }, [key])
  useEffect(() => {
    runtime.current?.update({
      epoch: p.loopNumber,
      active: p.active && !blocked,
      position: p.playerPosition,
      solved: p.solvedRoomIds,
      unlockedRoomIds: p.unlockedRoomIds,
      inventory: items,
    })
  }, [p.active, p.playerPosition, p.solvedRoomIds, items, blocked, ready])
  useEffect(() => {
    if (p.mapOpen || !p.active) resumeAfterOverlay.current = true
    else if (resumeAfterOverlay.current && ready && !blocked) {
      resumeAfterOverlay.current = false
      runtime.current?.enter()
    }
  }, [p.mapOpen, p.active, ready, blocked])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(""), 4200)
    return () => clearTimeout(t)
  }, [toast])
  const room = getRoomAt(p.playerPosition),
    complete = p.progress?.solved ?? p.solvedRoomIds.length,
    total = p.progress?.total ?? 5
  const missionRooms = p.progress?.missionRooms
  const close = () => {
    setInventory(false)
    setTalk(null)
    setSettings(false)
    setExamined(null)
  }
  const examine = allDocuments.find((i) => i.id === examined)
  return (
    <div
      className={`fps-page${touchDevice ? " has-touch-controls" : ""}`}
      data-testid="exploration"
      data-room={room?.id ?? "corridor"}
      aria-label="Exploration 3D du campus G4"
    >
      <canvas
        ref={canvas}
        className="fps-canvas"
        tabIndex={0}
        aria-label="Campus G4 en 3D, vue subjective"
        onPointerDown={(event) => {
          if (!touchDevice || !locked || event.pointerType !== "touch") return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          touchLook.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
        }}
        onPointerMove={(event) => {
          const previous = touchLook.current
          if (!previous || previous.pointerId !== event.pointerId) return
          runtime.current?.look(event.clientX - previous.x, event.clientY - previous.y)
          touchLook.current = { ...previous, x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          if (touchLook.current?.pointerId === event.pointerId) touchLook.current = null
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          touchLook.current = null
        }}
      />
      <div className="fps-vignette" />
      <header className="fps-top">
        <div className="fps-location">
          <span className="fps-brand">
            G4<span>EVER</span>
          </span>
          <span className="fps-divider" />
          <div>
            <small>
              {p.raceInfo
                ? "COURSE AU REBOOT · " + p.raceInfo.code
                : "LA BOUCLE · " + String(p.loopNumber).padStart(2, "0")}
            </small>
            <strong>{room?.label ?? "Passerelles du campus"}</strong>
          </div>
        </div>
        <div className="fps-clock">
          <span className="live-dot" />
          <small>HORLOGE DU CAMPUS</small>
          <b>{p.gameTime}</b>
        </div>
      </header>
      <div className="fps-objective">
        <small>OBJECTIF EN COURS</small>
        <p>
          {p.objectiveLabel ||
            (complete >= 5
              ? "Vous pouvez sortir par la porte de Sormiou"
              : "Restaurer les cinq modules du campus")}
        </p>
        <div className="fragment-dots">
          {p.progress
            ? Array.from({ length: total }, (_, i) => {
                const roomName = missionRooms?.[i]
                const label = roomName ?? `Mission ${i + 1}`
                return (
                  <span
                    key={i}
                    className={i < complete ? "done" : ""}
                    title={`Mission ${i + 1} · ${label}`}
                    aria-label={`Mission ${i + 1}, ${label}`}
                  >
                    {i < complete ? `✓ ${label}` : label}
                  </span>
                )
              })
            : WORLD_ROOMS.filter((r) => r.kind === "puzzle").map((r) => (
                <span
                  key={r.id}
                  className={p.solvedRoomIds.includes(r.id) ? "done" : ""}
                  title={r.label}
                >
                  {p.solvedRoomIds.includes(r.id) ? `✓ ${r.label}` : r.label}
                </span>
              ))}
          <b>
            {complete}/{total}
          </b>
        </div>
      </div>
      <div className={`fps-reticle ${target ? "has-target" : ""}`} aria-hidden="true">
        <span />
        <span />
      </div>
      {target && locked && (
        <div className="fps-interaction">
          <kbd>{touchDevice ? "↗" : "E"}</kbd>
          <div>
            <small>
              {target.kind === "npc"
                ? "RENCONTRE"
                : target.kind === "item"
                  ? "DOCUMENT"
                  : target.kind === "door"
                    ? "ACCÈS"
                    : "TERMINAL"}
            </small>
            <strong>{target.label}</strong>
          </div>
        </div>
      )}
      {!locked && p.active && !blocked && ready && !resumeAfterOverlay.current && (
        <button className="fps-enter" onClick={() => runtime.current?.enter()}>
          <span className="enter-arrow">↗</span>
          <div>
            <strong>Entrer dans le campus</strong>
            <small>
              {touchDevice
                ? "Glisse pour regarder · utilise les commandes tactiles pour marcher"
                : "Clique pour capturer la souris · Échap pour la libérer"}
            </small>
          </div>
        </button>
      )}
      {touchDevice && locked && p.active && !blocked && (
        <div className="fps-touch-controls" aria-label="Commandes tactiles du campus">
          <div className="fps-touch-pad">
            <button
              type="button"
              aria-label="Avancer"
              onPointerDown={(event) => holdMovement("KeyW", event)}
              onPointerUp={(event) => releaseMovement("KeyW", event)}
              onPointerCancel={(event) => releaseMovement("KeyW", event)}
              onLostPointerCapture={() => runtime.current?.release("KeyW")}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Aller à gauche"
              onPointerDown={(event) => holdMovement("KeyA", event)}
              onPointerUp={(event) => releaseMovement("KeyA", event)}
              onPointerCancel={(event) => releaseMovement("KeyA", event)}
              onLostPointerCapture={() => runtime.current?.release("KeyA")}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Reculer"
              onPointerDown={(event) => holdMovement("KeyS", event)}
              onPointerUp={(event) => releaseMovement("KeyS", event)}
              onPointerCancel={(event) => releaseMovement("KeyS", event)}
              onLostPointerCapture={() => runtime.current?.release("KeyS")}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Aller à droite"
              onPointerDown={(event) => holdMovement("KeyD", event)}
              onPointerUp={(event) => releaseMovement("KeyD", event)}
              onPointerCancel={(event) => releaseMovement("KeyD", event)}
              onLostPointerCapture={() => runtime.current?.release("KeyD")}
            >
              →
            </button>
          </div>
          {target && (
            <button
              type="button"
              className="fps-touch-interact"
              aria-label="Interagir avec l’élément visé"
              onClick={() => runtime.current?.interact()}
            >
              INTERAGIR
            </button>
          )}
        </div>
      )}
      {!ready && !error && (
        <div className="fps-loading">
          <span className="loading-ring" />
          <h2>Connexion au campus</h2>
          <p>Préparation des salles et des systèmes…</p>
        </div>
      )}
      <footer className="fps-bottom">
        <div className="fps-shortcuts">
          <button onClick={openMap}>
            <kbd>M</kbd>Plan
          </button>
          <button
            onClick={() => {
              runtime.current?.unlock()
              setInventory(true)
            }}
          >
            <kbd>I</kbd>Inventaire <span>{items.length + complete}</span>
          </button>
          {p.onJournal && (
            <button
              onClick={() => {
                runtime.current?.unlock()
                p.onJournal?.()
              }}
            >
              Souvenirs
            </button>
          )}
          <button
            aria-label="Paramètres 3D"
            onClick={() => {
              runtime.current?.unlock()
              setSettings(true)
            }}
          >
            ⚙
          </button>
          <button
            aria-label="Plein écran"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen()
              else
                void document.documentElement
                  .requestFullscreen()
                  .catch(() =>
                    setToast("Agrandis le panneau du navigateur pour une vue plus large."),
                  )
            }}
          >
            ⛶
          </button>
          <button
            aria-label="Pause"
            onClick={() => {
              runtime.current?.unlock()
              p.onPause()
            }}
          >
            Ⅱ
          </button>
        </div>
        <div className="fps-status">
          {p.raceInfo ? (
            <button
              onClick={() => {
                runtime.current?.unlock()
                p.raceInfo?.onBoard()
              }}
            >
              ♛ {p.raceInfo.rank} <span>{p.raceInfo.score.toLocaleString("fr-FR")} pts</span>
            </button>
          ) : (
            <span>
              G4-OS <b>●</b> {p.hintCount} souvenirs conservés
            </span>
          )}
        </div>
      </footer>
      {toast && (
        <div role="status" className="fps-toast">
          {toast}
        </div>
      )}
      {(inventory || talk || settings || error) && (
        <Dialog
          title={
            inventory
              ? "Inventaire"
              : settings
                ? "Paramètres du campus"
                : (talk?.name ?? "Moteur graphique")
          }
          onClose={close}
        >
          {inventory && (
            <div className="inventory-panel">
              <div className="inventory-summary">
                <strong>{items.length} documents</strong>
                <span>
                  {complete}/{total} {p.progress ? "énigmes résolues" : "fragments restaurés"}
                </span>
              </div>
              {!examine ? (
                <>
                  <div className="inventory-grid">
                    {allDocuments.map((item) => (
                      <button
                        key={item.id}
                        disabled={!items.includes(item.id)}
                        onClick={() => setExamined(item.id)}
                      >
                        <span>{items.includes(item.id) ? item.icon : "?"}</span>
                        <b>{items.includes(item.id) ? item.name : "Document inconnu"}</b>
                        <small>
                          {items.includes(item.id) ? "Examiner ↗" : "À découvrir dans le campus"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="inventory-fragments">
                    {WORLD_ROOMS.filter((r) => r.kind === "puzzle").map((r) => (
                      <span className={p.solvedRoomIds.includes(r.id) ? "restored" : ""} key={r.id}>
                        {p.solvedRoomIds.includes(r.id) ? "◆" : "◇"} {r.label}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="document-view">
                  <small>
                    ARCHIVES /{" "}
                    {(
                      WORLD_ROOMS.find((r) => r.id === examine.room)?.label ?? examine.room
                    ).toUpperCase()}
                  </small>
                  <h3>{examine.name}</h3>
                  <p>{examine.text}</p>
                  <button className="ui-button" onClick={() => setExamined(null)}>
                    ← Inventaire
                  </button>
                </div>
              )}
              <p className="settings-help">
                Les documents restent dans ce navigateur. En course, le chronomètre continue.
              </p>
            </div>
          )}
          {settings && <ThreeSettings />}
          {talk && (
            <div className="npc-dialogue">
              <div className="dialogue-avatar">{talk.name.charAt(0)}</div>
              <p>{talk.text}</p>
              {talk.roomId && talk.roomId !== "sormiou" && p.onAskHelp && (
                <>
                  {talk.hint ? (
                    <div className="npc-help" role="status">
                      <b>UN COUP DE POUCE</b>
                      <p>{talk.hint}</p>
                    </div>
                  ) : (
                    <button
                      className="ui-button ask-help"
                      disabled={helpPending || p.canAffordHelp === false}
                      onClick={async () => {
                        setHelpPending(true)
                        try {
                          const hint = await p.onAskHelp!(talk.roomId!)
                          setTalk((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  hint:
                                    hint ??
                                    "Ce module est réparé. Rejoins une autre salle ou Sormiou.",
                                }
                              : null,
                          )
                        } catch {
                          setTalk((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  hint: "Je n’ai pas pu joindre le système. Réessaie dans un instant.",
                                }
                              : null,
                          )
                        } finally {
                          setHelpPending(false)
                        }
                      }}
                    >
                      {helpPending
                        ? "J’EXAMINE LE VERROU…"
                        : p.canAffordHelp === false
                          ? "100 POINTS REQUIS"
                          : "JE SUIS BLOQUÉ · UN INDICE ?"}
                    </button>
                  )}
                  <p className="help-cost">
                    {p.helpCost ?? "Un souvenir utile, sans pénalité de temps."}
                  </p>
                </>
              )}
              <button className="ui-button" onClick={close}>
                RETOUR À L’EXPLORATION
              </button>
            </div>
          )}
          {error && <p>{error}</p>}
        </Dialog>
      )}
    </div>
  )
}
