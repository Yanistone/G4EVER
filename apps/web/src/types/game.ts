export interface PlayerPosition {
  x: number
  y: number
}

export interface CampusRoom {
  id: string
  label: string

  bounds: { x: number; y: number; width: number; height: number }
}

export interface CampusData {
  title: string
  rooms: readonly CampusRoom[]
  playerPosition: PlayerPosition
}

export interface BriefingCard {
  id: string
  icon: "question" | "hint" | "clock"
  title: string
  description: string
}

export interface BriefingData {
  alertTitle: string
  deadlineLabel: string
  missionTitle: string
  cards: readonly BriefingCard[]
  startLabel: string
}

export interface GameObjective {
  id: string
  label: string
  completed: boolean
}

export interface GameData {
  loopNumber: number
  day: string
  startTime: string
  currentTime: string
  crashTime: string

  elapsedFraction: number
  warningFraction: number
  objectiveTitle: string
  objectives: readonly GameObjective[]
  interactionLabel: string
  hintCount: number
  hintCapacity: number
  playerPosition: PlayerPosition

  movementBounds: { minX: number; maxX: number; minY: number; maxY: number }
}
