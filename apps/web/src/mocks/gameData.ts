import type { BriefingData, CampusData, GameData } from "../types/game"

export const mockBriefingData: BriefingData = {
  alertTitle: "⚠ G4-OS · ALERTE SYSTÈME",
  deadlineLabel: "Crash prévu à 16:00",
  missionTitle: "Remonte à l’origine du bug avant le reboot définitif.",
  cards: [
    {
      id: "puzzles",
      icon: "question",
      title: "Chaque salle cache une énigme",
      description: "Logique, code, conception, observation.",
    },
    {
      id: "memories",
      icon: "hint",
      title: "Une erreur = un indice",
      description: "Tu gardes tes souvenirs d’une boucle à l’autre.",
    },
    {
      id: "loop",
      icon: "clock",
      title: "À 16:00, tout recommence",
      description: "Retour à 9:00 : sois plus rapide la prochaine fois.",
    },
  ],
  startLabel: "LANCER LA JOURNÉE",
}

export const mockCampusData: CampusData = {
  title: "CARTE DU CAMPUS · INSTITUT G4",
  playerPosition: { x: 656.4, y: 519.4 },
  rooms: [
    {
      id: "main",
      label: "Salle principale",
      bounds: { x: 70, y: 84, width: 370, height: 366 },
    },
    {
      id: "vending",
      label: "Distributeurs",
      bounds: { x: 650, y: 104, width: 160, height: 146 },
    },
    {
      id: "gaming",
      label: "Salle gaming",
      bounds: { x: 1160, y: 84, width: 370, height: 346 },
    },
    {
      id: "amphi",
      label: "Amphithéâtre",
      bounds: { x: 1160, y: 494, width: 370, height: 466 },
    },
    {
      id: "cowork",
      label: "Cowork",
      bounds: { x: 70, y: 514, width: 370, height: 446 },
    },
    {
      id: "sormiou",
      label: "Sormiou",
      bounds: { x: 560, y: 834, width: 480, height: 216 },
    },
    {
      id: "refectory",
      label: "Réfectoire",
      bounds: { x: 580, y: 384, width: 440, height: 336 },
    },
  ],
}

export const mockGameData: GameData = {
  loopNumber: 3,
  day: "LUNDI",
  startTime: "09:00",
  currentTime: "09:42",
  crashTime: "16:00",
  elapsedFraction: 0.1,
  warningFraction: 0.12,
  objectiveTitle: "Trouver l’origine du bug",
  objectives: [
    {
      id: "leave-main",
      label: "Sortir de la salle principale",
      completed: true,
    },
    {
      id: "activate-terminal",
      label: "Activer la borne du réfectoire",
      completed: false,
    },
    {
      id: "explore-gaming",
      label: "Fouiller la salle gaming",
      completed: false,
    },
  ],
  interactionLabel: "Activer la borne G4-OS",
  hintCount: 3,
  hintCapacity: 4,
  playerPosition: { x: 656.4, y: 519.4 },
  movementBounds: { minX: 560, maxX: 910, minY: 430, maxY: 635 },
}
