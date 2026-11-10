import { WORLD_DOORS, WORLD_ROOMS, getRoomAt } from "./world"
import type { PlayerPosition } from "../types/game"
/** Même échelle que le moteur 3D (unités du plan → mètres), sans charger Babylon. */
const SCALE = 0.025

export interface Waypoint {
  point: PlayerPosition
  /** Ce que vise la boussole : la sortie de la salle, la porte de l'objectif ou son terminal. */
  step: "exit" | "door" | "terminal"
  /** Distance à vol d'oiseau jusqu'au terminal de l'objectif, en mètres. */
  meters: number
  /** Assez près pour utiliser le terminal (même tolérance que le moteur 3D). */
  near: boolean
}
const NEAR = 70 * 1.7

const center = (d: (typeof WORLD_DOORS)[number]) => ({
  x: d.bounds.x + d.bounds.width / 2,
  y: d.bounds.y + d.bounds.height / 2,
})
const dist = (a: PlayerPosition, b: PlayerPosition) => Math.hypot(a.x - b.x, a.y - b.y)

/** Prochain point de passage vers le terminal d'une salle, en deux étapes au plus :
 * sortir de la salle courante, puis rejoindre la porte de la salle visée. */
export function waypointTo(position: PlayerPosition, roomId: string): Waypoint | null {
  const room = WORLD_ROOMS.find((r) => r.id === roomId)
  if (!room) return null
  const terminal = room.interactionPosition
  const meters = Math.round(dist(position, terminal) * SCALE)
  const near = dist(position, terminal) <= NEAR
  const here = getRoomAt(position)
  if (here?.id === roomId) return { point: terminal, step: "terminal", meters, near }
  const targetDoors = WORLD_DOORS.filter((d) => d.roomId === roomId).map(center)
  if (!targetDoors.length) return { point: terminal, step: "terminal", meters, near }
  if (here) {
    const exits = WORLD_DOORS.filter((d) => d.roomId === here.id).map(center)
    // Une porte partagée (ex. réfectoire → Sormiou) mène directement à la salle visée.
    const best = exits
      .map((exit) => ({
        exit,
        cost: dist(position, exit) + Math.min(...targetDoors.map((t) => dist(exit, t))),
      }))
      .sort((a, b) => a.cost - b.cost)[0]
    if (best && dist(position, best.exit) > 30)
      return { point: best.exit, step: "exit", meters, near: false }
  }
  const door = targetDoors.sort((a, b) => dist(position, a) - dist(position, b))[0]
  return dist(position, door) > 30
    ? { point: door, step: "door", meters, near: false }
    : { point: terminal, step: "terminal", meters, near }
}

/** Angle (en radians, 0 = droit devant, positif = à droite) entre le regard et un point. */
export function relativeBearing(position: PlayerPosition, yaw: number, point: PlayerPosition) {
  const bearing = Math.atan2(point.x - position.x, point.y - position.y)
  return Math.atan2(Math.sin(bearing - yaw), Math.cos(bearing - yaw))
}
