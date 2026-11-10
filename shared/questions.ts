import { SCENARIO, ALGORITHM, ERROR_LOG, SCRIPT, SEATING_RULES, PATCH_CARDS } from "./scenario.ts"
import type { ScenarioKind } from "./scenario.ts"
export interface BankQuestion {
  id: string
  roomId: string
  title: string
  prompt: string
  answers: string[]
  correct: number
  hint: string
  explanation: string
  kind?: "code"
  exhibit?: string
  visual?: ScenarioKind
}
export const RACE_ROOM_IDS = ["cafeteria", "classroom", "amphitheater", "gaming", "cowork"] as const
const code = (index: number, answer: string, exhibit: string): BankQuestion => {
  const p = SCENARIO[index]
  return {
    id: "fiche2:" + p.id,
    roomId: p.roomId,
    title: p.title,
    prompt: p.prompt,
    answers: [answer],
    correct: 0,
    hint: p.hints[0],
    explanation: p.explanation,
    kind: "code",
    exhibit,
    visual: p.kind,
  }
}
const quiz = (
  index: number,
  answers: string[],
  correct: number,
  exhibit?: string,
): BankQuestion => {
  const p = SCENARIO[index]
  return {
    id: "fiche2:" + p.id,
    roomId: p.roomId,
    title: p.title,
    prompt: p.prompt,
    answers,
    correct,
    hint: p.hints[0],
    explanation: p.explanation,
    exhibit,
    visual: p.kind,
  }
}
export const QUESTION_BANK: readonly BankQuestion[] = [
  code(
    0,
    "5",
    "CAFÉ DE 9h00\nObserve les deux étagères dans le terminal et compte les tasses bleues, y compris derrière le plateau.",
  ),
  {
    ...quiz(1, ["3142", "2143", "1342", "3412"], 0, SEATING_RULES.join("\n")),
    // En course, la table est un QCM : l'énoncé de l'aventure (placer les élèves) ne s'applique pas.
    prompt:
      "Retrouve les places de chacun. Quel code donnent les numéros dans l’ordre Noah, Léa, Yanis, Inès ?",
  },
  {
    ...code(2, "29", "SOUVENIR DU CAFÉ : n = 5\n\n" + ALGORITHM),
    prompt: "Avec n = 5, quel total affiche le programme ?",
  },
  quiz(
    3,
    ["Page introuvable", "Service indisponible", "Accès interdit", "Erreur de syntaxe"],
    1,
    ERROR_LOG,
  ),
  {
    ...code(
      4,
      "11",
      "PLANNING\nA : Cahier des charges, 2 j\nB : Développement, 5 j, après A\nC : Tests, 3 j, après B\nD : Formation, 2 j, après A\nE : Production, 1 j, après C et D\n\nDélai imposé : 8 jours",
    ),
    prompt: "Quelle est la durée minimale du projet, en jours ?",
  },
  {
    ...quiz(4, ["Les tests", "La formation", "Le développement", "La production"], 0),
    id: "fiche2:planning-tests",
    prompt: "Quelle tâche a été supprimée pour ramener le projet de 11 à 8 jours ?",
  },
  code(5, "4", SCRIPT.map((line, i) => i + 1 + "  " + line).join("\n")),
  {
    ...quiz(6, ["43", "42", "34", "44"], 0),
    prompt:
      "La ligne fautive est la ligne 4. Observe les vues et forme le code : numéro de ligne puis nombre de différences.",
  },
  {
    ...code(
      7,
      "CDBA",
      Object.entries(PATCH_CARDS)
        .map(([id, label]) => id + " : " + label)
        .join("\n"),
    ),
    prompt: "Remets les opérations dans le bon ordre. Saisis leurs quatre lettres.",
  },
  {
    ...quiz(
      7,
      [
        "La restauration de la sauvegarde de 9h00",
        "Le lancement des cours",
        "La sauvegarde actuelle du campus",
        "Tous les tests",
      ],
      0,
    ),
    id: "fiche2:restauration",
    visual: "log",
    exhibit: ERROR_LOG,
    prompt: "En plus de corriger la ligne 4, quelle opération faut-il supprimer du script ?",
  },
]
