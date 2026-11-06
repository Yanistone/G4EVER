import type { EndResult, FailureFeedback, QuizQuestion, SuccessFeedback } from "../types/quiz"

export const demoQuizQuestion: QuizQuestion = {
  id: "javascript-typeof-null",
  courseLabel: "JOUR 1 · 10:00 · COURS D’ALGO",
  loopNumber: 3,
  number: 2,
  total: 5,
  prompt: {
    before: "En JavaScript, que renvoie ",
    highlight: "typeof null",
    after: " ?",
  },
  answers: [
    { id: "a", letter: "A", label: "« object »" },
    { id: "b", letter: "B", label: "« null »" },
    { id: "c", letter: "C", label: "« undefined »" },
    { id: "d", letter: "D", label: "« number »" },
  ],
  progress: 40,
}

export const demoAnswerKey: Readonly<Record<string, string>> = {
  "javascript-typeof-null": "a",
}
export const demoSelectedAnswerId = "b"

export const demoSuccessFeedback: SuccessFeedback = {
  characterQuote: "« Trop facile. »",
  contextLabel: "TA RÉPONSE · SALLE GAMING · ÉNIGME 2/5",
  answer: { id: "a", letter: "A", label: "« object »" },
  explanation: {
    before: "Exact : ",
    highlight: "typeof null",
    after:
      " renvoie « object ». C’est un vieux bug de JavaScript, gardé depuis 1995 pour ne rien casser.",
  },
  memoryReward: 1,
  timeLabel: "Aucun temps perdu",
  solved: 2,
  total: 5,
}

export const demoFailureFeedback: FailureFeedback = {
  characterQuote: "« Sérieux… ? »",
  contextLabel: "TA RÉPONSE · SALLE GAMING · ÉNIGME 2/5",
  answer: { id: "reference-d", letter: "D", label: "« undefined »" },
  timeBefore: "10:20",
  timeAfter: "10:40",
  penaltyMinutes: 20,
  resetTime: "16:00",
  progress: 29,
  hint: "« null » n’est pas vraiment vide pour JavaScript… Pense aux types les plus anciens du langage.",
}

export const demoEndResult: EndResult = {
  characterQuote: "« Mardi… enfin ! »",
  rank: "S",
  day: "LUNDI",
  clock: ["15:59", "16:00", "16:01"],
  headline: "LA BOUCLE EST BRISÉE !",
  totalTime: "11:42",
  loops: 7,
  solved: 5,
  total: 5,
  hints: 9,
  endingNumber: 1,
  endingsTotal: 2,
  endingTitle: "Le correctif",
  endingDescription:
    "G4-OS est réparé et les données du campus sont sauvées. Personne ne saura jamais ce que tu as fait.",
  lockedEndingNumber: 2,
  lockedEndingTitle: "???",
  lockedEndingDescription: "Une autre fin t’attend…",
}
