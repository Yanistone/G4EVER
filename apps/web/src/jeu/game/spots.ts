import { WORLD_ROOMS } from "./world"
import type { RoomId } from "./world"
import { STATION_TARGETS } from "./escape"
import type { PlayerPosition } from "../types/game"

/** Point d'interaction d'une énigme : chaque énigme a le sien, même quand deux énigmes
 * partagent une salle. Les terminaux d'origine gardent l'identifiant de leur salle. */
export interface PuzzleSpot {
  id: string
  roomId: RoomId
  /** Texte affiché quand le joueur vise l'objet. */
  label: string
  /** Endroit où se tient le joueur pour interagir. */
  position: PlayerPosition
  /** Objet visé (plan du campus + hauteur en mètres) : sert au rayon de visée et à la balise. */
  target: { x: number; y: number; height: number }
}

const roomSpot = (roomId: RoomId): PuzzleSpot => {
  const room = WORLD_ROOMS.find((r) => r.id === roomId)!
  return {
    id: roomId,
    roomId,
    label: room.interactionLabel,
    position: room.interactionPosition,
    target: STATION_TARGETS[roomId],
  }
}

/** Emplacements ajoutés pour que deux énigmes ne se partagent plus le même terminal. */
export const EXTRA_SPOTS: readonly PuzzleSpot[] = [
  {
    id: "cafeteria-shelf",
    roomId: "cafeteria",
    label: "Observer l’étagère des tasses",
    position: { x: 772, y: 528 },
    target: { x: 772, y: 449, height: 1.85 },
  },
  {
    id: "classroom-board",
    roomId: "classroom",
    label: "Lire le journal d’erreur au tableau",
    position: { x: 238, y: 186 },
    target: { x: 237.6, y: 134, height: 1.9 },
  },
  {
    id: "gaming-photos",
    roomId: "gaming",
    label: "Comparer les captures avant / après",
    position: { x: 1430, y: 192 },
    target: { x: 1430, y: 134, height: 1.75 },
  },
]

/** Emplacement de chaque énigme du scénario. */
export const PUZZLE_SPOT_IDS: Readonly<Record<string, string>> = {
  "cafe-9h": "cafeteria-shelf",
  "table-refectoire": "cafeteria",
  "calcul-terminal": "classroom",
  "journal-erreur": "classroom-board",
  "planning-g4": "amphitheater",
  "script-journee": "gaming",
  "avant-apres": "gaming-photos",
  correctif: "cowork",
}

export function spotById(id: string): PuzzleSpot | undefined {
  return (
    EXTRA_SPOTS.find((s) => s.id === id) ??
    (WORLD_ROOMS.some((r) => r.id === id) ? roomSpot(id as RoomId) : undefined)
  )
}

export function spotForPuzzle(puzzleId: string): PuzzleSpot | undefined {
  const id = PUZZLE_SPOT_IDS[puzzleId]
  return id ? spotById(id) : undefined
}

/** Salle à laquelle appartient un point d'interaction (utile au mode course). */
export function spotRoom(id: string): string {
  return spotById(id)?.roomId ?? id
}
