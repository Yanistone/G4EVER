import type { EndResult, FailureFeedback, QuizQuestion, SuccessFeedback } from "../types/quiz"

export const demoQuizQuestion: QuizQuestion = {
  id: "http-503",
  courseLabel: "SUGITON · JOURNAL D’ERREUR",
  loopNumber: 3,
  number: 2,
  total: 8,
  prompt: {
    before: "Que signifie le code HTTP ",
    highlight: "503",
    after: " ?",
  },
  answers: [
    { id: "a", letter: "A", label: "Service indisponible" },
    { id: "b", letter: "B", label: "Page introuvable" },
    { id: "c", letter: "C", label: "Accès interdit" },
    { id: "d", letter: "D", label: "Erreur de syntaxe" },
  ],
  progress: 40,
}

export const demoAnswerKey: Readonly<Record<string, string>> = {
  "http-503": "a",
}
export const demoSelectedAnswerId = "b"

export const demoSuccessFeedback: SuccessFeedback = {
  characterQuote: "« Trop facile. »",
  contextLabel: "TA RÉPONSE · SUGITON · ÉNIGME 4/8",
  answer: { id: "a", letter: "A", label: "Service indisponible" },
  explanation: {
    before: "Exact : ",
    highlight: "503",
    after: " indique un service indisponible. Les erreurs 5xx concernent le serveur.",
  },
  memoryReward: 1,
  timeLabel: "Aucun temps perdu",
  solved: 2,
  total: 8,
}

export const demoFailureFeedback: FailureFeedback = {
  characterQuote: "« Sérieux… ? »",
  contextLabel: "TA RÉPONSE · SUGITON · ÉNIGME 4/8",
  answer: { id: "reference-d", letter: "D", label: "Accès interdit" },
  timeBefore: "10:20",
  timeAfter: "10:30",
  penaltyMinutes: 10,
  resetTime: "16:00",
  progress: 29,
  hint: "Les erreurs 5xx concernent le serveur.",
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
  total: 8,
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
