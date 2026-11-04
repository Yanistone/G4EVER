import type { PlayerPosition } from "../types/game"

export type RoomId =
  "classroom" | "cafeteria" | "gaming" | "cowork" | "amphitheater" | "sormiou" | "vending"
export interface WorldRect {
  x: number
  y: number
  width: number
  height: number
}
export interface WorldRoom {
  id: RoomId
  label: string
  floor: WorldRect
  interactionPosition: PlayerPosition
  interactionLabel: string
  kind: "puzzle" | "final" | "hint"
}

export const START_POSITION: PlayerPosition = { x: 690, y: 590 }
export const WORLD_BOUNDS = { width: 1600, height: 1100 }
export const PLAYER_RADIUS = 16
export const WALK_SPEED = 150
export const INTERACTION_RADIUS = 70

export const WORLD_ROOMS: readonly WorldRoom[] = [
  {
    id: "classroom",
    label: "Salle principale",
    floor: { x: 70, y: 130, width: 370, height: 320 },
    interactionPosition: { x: 170, y: 264 },
    interactionLabel: "Examiner le poste de cours",
    kind: "puzzle",
  },
  {
    id: "cafeteria",
    label: "Réfectoire",
    floor: { x: 580, y: 430, width: 440, height: 290 },
    interactionPosition: { x: 774, y: 600 },
    interactionLabel: "Activer la borne G4-OS",
    kind: "puzzle",
  },
  {
    id: "gaming",
    label: "Salle gaming",
    floor: { x: 1160, y: 130, width: 370, height: 300 },
    interactionPosition: { x: 1196, y: 250 },
    interactionLabel: "Inspecter la borne d’arcade",
    kind: "puzzle",
  },
  {
    id: "cowork",
    label: "Cowork",
    floor: { x: 70, y: 560, width: 370, height: 400 },
    interactionPosition: { x: 245, y: 687 },
    interactionLabel: "Lire le dossier de conception",
    kind: "puzzle",
  },
  {
    id: "amphitheater",
    label: "Amphithéâtre",
    floor: { x: 1160, y: 540, width: 370, height: 420 },
    interactionPosition: { x: 1350, y: 616 },
    interactionLabel: "Analyser le terminal de l’amphi",
    kind: "puzzle",
  },
  {
    id: "sormiou",
    label: "Sormiou",
    floor: { x: 560, y: 880, width: 480, height: 170 },
    interactionPosition: { x: 873, y: 964 },
    interactionLabel: "Ouvrir la console centrale",
    kind: "final",
  },
  {
    id: "vending",
    label: "Distributeurs",
    floor: { x: 650, y: 150, width: 160, height: 100 },
    interactionPosition: { x: 744, y: 190 },
    interactionLabel: "Inspecter le distributeur",
    kind: "hint",
  },
]

export const ROOM_SPAWNS: Readonly<Record<RoomId, PlayerPosition>> = {
  classroom: { x: 410, y: 365 },
  cafeteria: START_POSITION,
  gaming: { x: 1180, y: 365 },
  cowork: { x: 415, y: 665 },
  amphitheater: { x: 1175, y: 625 },
  sormiou: { x: 800, y: 905 },
  vending: { x: 730, y: 235 },
}

export interface WorldDoor {
  id: string
  roomId: RoomId
  side: "left" | "right" | "top" | "bottom"
  bounds: WorldRect
  clearance: WorldRect
}
export const WORLD_DOORS: readonly WorldDoor[] = [
  {
    id: "classroom-east",
    roomId: "classroom",
    side: "right",
    bounds: { x: 428, y: 316, width: 58, height: 112 },
    clearance: { x: 365, y: 300, width: 130, height: 140 },
  },
  {
    id: "cowork-east",
    roomId: "cowork",
    side: "right",
    bounds: { x: 428, y: 624, width: 58, height: 112 },
    clearance: { x: 370, y: 610, width: 125, height: 140 },
  },
  {
    id: "gaming-west",
    roomId: "gaming",
    side: "left",
    bounds: { x: 1120, y: 316, width: 58, height: 112 },
    clearance: { x: 1110, y: 300, width: 145, height: 140 },
  },
  {
    id: "amphi-west",
    roomId: "amphitheater",
    side: "left",
    bounds: { x: 1120, y: 584, width: 58, height: 112 },
    clearance: { x: 1110, y: 570, width: 125, height: 140 },
  },
  {
    id: "cafeteria-west",
    roomId: "cafeteria",
    side: "left",
    bounds: { x: 550, y: 490, width: 65, height: 112 },
    clearance: { x: 540, y: 475, width: 125, height: 142 },
  },
  {
    id: "cafeteria-east",
    roomId: "cafeteria",
    side: "right",
    bounds: { x: 998, y: 584, width: 65, height: 112 },
    clearance: { x: 955, y: 570, width: 120, height: 140 },
  },
  {
    id: "cafeteria-south",
    roomId: "cafeteria",
    side: "bottom",
    bounds: { x: 754, y: 704, width: 112, height: 75 },
    clearance: { x: 735, y: 650, width: 150, height: 150 },
  },
  {
    id: "sormiou-north",
    roomId: "sormiou",
    side: "top",
    bounds: { x: 744, y: 780, width: 112, height: 120 },
    clearance: { x: 725, y: 775, width: 150, height: 170 },
  },
  {
    id: "vending-south",
    roomId: "vending",
    side: "bottom",
    bounds: { x: 680, y: 230, width: 100, height: 100 },
    clearance: { x: 670, y: 205, width: 120, height: 120 },
  },
]
export const WALKABLE_AREAS: readonly WorldRect[] = [
  ...WORLD_ROOMS.map((r) => r.floor),
  { x: 460, y: 300, width: 680, height: 90 },
  { x: 460, y: 300, width: 112, height: 520 },
  { x: 1028, y: 300, width: 112, height: 520 },
  { x: 460, y: 730, width: 680, height: 90 },
  ...WORLD_DOORS.map((door) => door.bounds),
]
export interface WorldFurniture extends WorldRect {
  id: string
  roomId: RoomId
  kind:
    | "desk"
    | "table"
    | "arcade"
    | "vending"
    | "counter"
    | "terminal"
    | "sofa"
    | "armchair"
    | "coffee"
    | "plant"
    | "equipment"
}

export const WORLD_OBSTACLES: readonly WorldFurniture[] = [
  {
    id: "plant-classroom",
    roomId: "classroom",
    kind: "plant",
    x: 76,
    y: 137,
    width: 18,
    height: 18,
  },
  { id: "plant-gaming", roomId: "gaming", kind: "plant", x: 1505, y: 137, width: 18, height: 18 },
  { id: "plant-cowork", roomId: "cowork", kind: "plant", x: 76, y: 935, width: 18, height: 18 },
  {
    id: "plant-amphi",
    roomId: "amphitheater",
    kind: "plant",
    x: 1505,
    y: 935,
    width: 18,
    height: 18,
  },
  { id: "plant-cafe", roomId: "cafeteria", kind: "plant", x: 999, y: 432, width: 18, height: 18 },
  {
    id: "coffee-cart",
    roomId: "cafeteria",
    kind: "equipment",
    x: 595,
    y: 438,
    width: 75,
    height: 34,
  },
  {
    id: "projector-screen",
    roomId: "amphitheater",
    kind: "equipment",
    x: 1483,
    y: 544,
    width: 44,
    height: 38,
  },
  ...[210, 330].flatMap((y, row) =>
    [110, 260].map((x, col) => ({
      id: `class-desk-${row}-${col}`,
      roomId: "classroom" as const,
      kind: "desk" as const,
      x,
      y,
      width: 90,
      height: 40,
    })),
  ),
  {
    id: "class-terminal",
    roomId: "classroom",
    kind: "terminal",
    x: 140,
    y: 180,
    width: 40,
    height: 40,
  },
  {
    id: "vending-a",
    roomId: "vending",
    kind: "vending",
    x: 666.5,
    y: 160,
    width: 42,
    height: 35,
  },
  {
    id: "vending-b",
    roomId: "vending",
    kind: "vending",
    x: 751.5,
    y: 160,
    width: 42,
    height: 35,
  },
  {
    id: "gaming-arcade",
    roomId: "gaming",
    kind: "arcade",
    x: 1196.5,
    y: 218,
    width: 32,
    height: 38,
  },
  {
    id: "gaming-arcade-b",
    roomId: "gaming",
    kind: "arcade",
    x: 1286.5,
    y: 218,
    width: 32,
    height: 38,
  },
  ...[320].flatMap((y) =>
    [1280, 1410].map((x) => ({
      id: `gaming-desk-${x}`,
      roomId: "gaming" as const,
      kind: "desk" as const,
      x,
      y,
      width: 90,
      height: 40,
    })),
  ),
  {
    id: "cowork-table-a",
    roomId: "cowork",
    kind: "table",
    x: 105,
    y: 590,
    width: 260,
    height: 66,
  },
  { id: "cowork-sofa", roomId: "cowork", kind: "sofa", x: 135, y: 796, width: 110, height: 37 },
  { id: "cowork-coffee", roomId: "cowork", kind: "coffee", x: 184, y: 870, width: 32, height: 32 },
  {
    id: "cowork-armchair",
    roomId: "cowork",
    kind: "armchair",
    x: 318,
    y: 826,
    width: 34,
    height: 40,
  },
  ...[570, 670, 770, 870].map((y) => ({
    id: `amphi-row-${y}`,
    roomId: "amphitheater" as const,
    kind: "desk" as const,
    x: 1260,
    y,
    width: 220,
    height: 40,
  })),
  {
    id: "sormiou-desk-a",
    roomId: "sormiou",
    kind: "desk",
    x: 600,
    y: 900,
    width: 100,
    height: 42,
  },
  {
    id: "sormiou-desk-b",
    roomId: "sormiou",
    kind: "desk",
    x: 600,
    y: 990,
    width: 100,
    height: 42,
  },
  {
    id: "sormiou-desk-c",
    roomId: "sormiou",
    kind: "desk",
    x: 930,
    y: 900,
    width: 85,
    height: 42,
  },
  {
    id: "sormiou-desk-d",
    roomId: "sormiou",
    kind: "desk",
    x: 930,
    y: 990,
    width: 85,
    height: 42,
  },
  {
    id: "sormiou-console",
    roomId: "sormiou",
    kind: "terminal",
    x: 860,
    y: 960,
    width: 26,
    height: 56,
  },
  {
    id: "cafeteria-counter",
    roomId: "cafeteria",
    kind: "counter",
    x: 680,
    y: 450,
    width: 180,
    height: 45,
  },
  {
    id: "cafeteria-terminal",
    roomId: "cafeteria",
    kind: "terminal",
    x: 752,
    y: 562,
    width: 44,
    height: 58,
  },
  {
    id: "cafeteria-table-a",
    roomId: "cafeteria",
    kind: "table",
    x: 900,
    y: 460,
    width: 60,
    height: 42,
  },
  {
    id: "cafeteria-table-b",
    roomId: "cafeteria",
    kind: "table",
    x: 880,
    y: 550,
    width: 60,
    height: 42,
  },
  {
    id: "cafeteria-table-c",
    roomId: "cafeteria",
    kind: "table",
    x: 620,
    y: 630,
    width: 60,
    height: 42,
  },
]

export const WORLD_CHAIRS: readonly (WorldRect & { id: string; roomId: RoomId })[] =
  WORLD_OBSTACLES.filter(
    (f) => ["desk", "table"].includes(f.kind) && f.roomId !== "sormiou",
  ).flatMap((f) => {
    const count = Math.max(1, Math.floor((f.width * 0.025) / 2))
    return Array.from({ length: count }, (_, i) => ({
      id: f.id + "-chair-" + i,
      roomId: f.roomId,
      x: f.x + ((i + 0.5) * f.width) / count - 15,
      y: f.y + f.height - 8,
      width: 30,
      height: 32,
    }))
  })

export function pointInRect(point: PlayerPosition, rect: WorldRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function getRoomAt(position: PlayerPosition): WorldRoom | undefined {
  return WORLD_ROOMS.find((room) => pointInRect(position, room.floor))
}

export function getNearbyInteraction(position: PlayerPosition): WorldRoom | undefined {
  const room = getRoomAt(position)
  return room &&
    Math.hypot(position.x - room.interactionPosition.x, position.y - room.interactionPosition.y) <=
      INTERACTION_RADIUS
    ? room
    : undefined
}

export function canWalkAt(position: PlayerPosition): boolean {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return false

  for (const [dx, dy] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [0.707, 0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [-0.707, -0.707],
  ]) {
    const sample = {
      x: position.x + dx * PLAYER_RADIUS,
      y: position.y + dy * PLAYER_RADIUS,
    }
    if (!WALKABLE_AREAS.some((area) => pointInRect(sample, area))) return false
  }
  return ![...WORLD_OBSTACLES, ...WORLD_CHAIRS].some((rect) => {
    const nearestX = Math.max(rect.x, Math.min(position.x, rect.x + rect.width))
    const nearestY = Math.max(rect.y, Math.min(position.y, rect.y + rect.height))
    return Math.hypot(position.x - nearestX, position.y - nearestY) < PLAYER_RADIUS
  })
}

export function moveWithCollisions(
  position: PlayerPosition,
  dx: number,
  dy: number,
): PlayerPosition {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4))
  let next = position
  for (let index = 0; index < steps; index += 1) {
    const horizontal = { x: next.x + dx / steps, y: next.y }
    if (canWalkAt(horizontal)) next = horizontal
    const vertical = { x: next.x, y: next.y + dy / steps }
    if (canWalkAt(vertical)) next = vertical
  }
  return next
}

export function findWalkPath(start: PlayerPosition, target: PlayerPosition): PlayerPosition[] {
  const step = 8
  const nodes = [{ p: start, parent: -1 }]
  const seen = new Set(["0,0"])
  let best = 0
  let distance = Infinity
  for (let index = 0; index < nodes.length && index < 35000; index++) {
    const current = nodes[index]
    const d = Math.hypot(current.p.x - target.x, current.p.y - target.y)
    if (d < distance) {
      distance = d
      best = index
    }
    if (d < step) break
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const p = { x: current.p.x + dx, y: current.p.y + dy },
        key = `${Math.round((p.x - start.x) / step)},${Math.round((p.y - start.y) / step)}`
      if (seen.has(key)) continue
      seen.add(key)
      if (canWalkAt(p)) nodes.push({ p, parent: index })
    }
  }
  if (distance > 70) return []
  const result: PlayerPosition[] = []
  for (let i = best; i > 0; i = nodes[i].parent) result.push(nodes[i].p)
  return result.reverse()
}
