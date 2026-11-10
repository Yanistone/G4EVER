import { DAY_END, DAY_START } from "../../../../../shared/clock"

export type Difficulty = "relax" | "classic" | "expert"

export interface DifficultyRules {
  id: Difficulty
  label: string
  tagline: string
  description: string
  /** Durée réelle d'une boucle (9h00 → 16h00), en minutes. `null` : l'horloge ne tourne pas. */
  loopMinutes: number | null
  /** Minutes de campus perdues par mauvaise réponse. */
  wrongAnswerMinutes: number
  /** Coût en minutes de campus des trois niveaux d'indice. */
  hintCosts: readonly [number, number, number]
  leaHelpMinutes: number
}

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyRules>> = {
  relax: {
    id: "relax",
    label: "Détente",
    tagline: "Sans chrono",
    description:
      "L’horloge reste figée : prends le temps d’explorer. Indices gratuits, aucune pénalité.",
    loopMinutes: null,
    wrongAnswerMinutes: 0,
    hintCosts: [0, 0, 0],
    leaHelpMinutes: 0,
  },
  classic: {
    id: "classic",
    label: "Classique",
    tagline: "20 min par boucle",
    description:
      "La vraie expérience : la journée dure vingt minutes réelles. Les indices et les erreurs coûtent du temps.",
    loopMinutes: 20,
    wrongAnswerMinutes: 10,
    hintCosts: [5, 10, 25],
    leaHelpMinutes: 10,
  },
  expert: {
    id: "expert",
    label: "Expert",
    tagline: "12 min par boucle",
    description: "Pour les habitués des escape games : douze minutes et des indices plus chers.",
    loopMinutes: 12,
    wrongAnswerMinutes: 15,
    hintCosts: [10, 20, 40],
    leaHelpMinutes: 15,
  },
}

export function rulesFor(difficulty: Difficulty | undefined): DifficultyRules {
  return DIFFICULTIES[difficulty ?? "classic"] ?? DIFFICULTIES.classic
}

/** Minutes de campus écoulées par seconde réelle. */
export function campusRate(difficulty: Difficulty | undefined) {
  const minutes = rulesFor(difficulty).loopMinutes
  return minutes ? (DAY_END - DAY_START) / (minutes * 60) : 0
}

export function isDifficulty(value: unknown): value is Difficulty {
  return value === "relax" || value === "classic" || value === "expert"
}
