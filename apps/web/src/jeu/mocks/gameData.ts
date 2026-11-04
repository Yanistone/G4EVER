import type { BriefingData, CampusData, GameData } from "../types/game"

export const mockBriefingData: BriefingData = {
  alertTitle: "⚠ G4-OS · ALERTE SYSTÈME",
  deadlineLabel: "15 min réelles · Crash à 16:00",
  missionTitle: "Remonte à l’origine du bug avant le reboot définitif.",
  cards: [
    {
      id: "puzzles",
      icon: "question",
      title: "Huit énigmes liées",
      description: "Réfectoire, Sugiton, Sainte Victoire, Mont Ventoux, Co-working.",
    },
    {
      id: "memories",
      icon: "hint",
      title: "Souvenirs de boucle",
      description: "Indice léger : −5 min campus ; fort : −10. Erreur : −10 min.",
    },
    {
      id: "loop",
      icon: "clock",
      title: "À 16:00, tout recommence",
      description:
        "Retour à 9:00. Le carnet garde tes découvertes ; trois erreurs bloquent le terminal 30 s.",
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
