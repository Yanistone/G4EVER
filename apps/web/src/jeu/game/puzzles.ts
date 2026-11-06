import { SCENARIO } from "../../../../../shared/scenario"
import type { AdventurePuzzle } from "../types/adventure"
import type { IntroData } from "../types/entry"

export const puzzles: readonly AdventurePuzzle[] = SCENARIO.map((p, index) => ({
  id: p.id,
  roomId: p.roomId,
  title: p.title,
  scenario: p,
  question: {
    id: p.id,
    courseLabel: p.room.toUpperCase(),
    loopNumber: 1,
    number: index + 1,
    total: 8,
    prompt: { before: p.prompt, highlight: "", after: "" },
    answers: [],
    progress: (index / 8) * 100,
  },
  correctAnswerId: "",
  explanation: { before: p.explanation, highlight: "", after: "" },
  hint: p.hints[0],
  clue: p.memory,
}))
export const vendingClue =
  "Le carnet conserve tes souvenirs d’une boucle à l’autre. Le café de 9h00 est ton point de départ."
export const sormiouClue =
  "Après cinq énigmes, la porte finale de Sormiou se déverrouille. Ouvre-la pour quitter le campus."

export const introScenes: readonly IntroData[] = [
  {
    dayLabel: "LUNDI · 09:00",
    narrator: "NARRATEUR",
    beforeHighlight:
      "Lundi, 9 h 00. Noah se réveille pour une journée de cours ordinaire à l’Institut G4. Le nouveau système central, ",
    highlight: "G4-OS",
    afterHighlight: ", a été installé à la hâte pendant le week-end…",
    sceneNumber: 1,
    totalScenes: 4,
  },
  {
    dayLabel: "LUNDI · 16:00",
    narrator: "NARRATEUR",
    beforeHighlight: "À 16 h 00, le campus se fige. Un message rouge traverse les écrans : ",
    highlight: "ERREUR 0x16H00",
    afterHighlight:
      ". Puis tout s’éteint. Quand Noah ouvre les yeux, l’horloge affiche de nouveau 9 h 00.",
    sceneNumber: 2,
    totalScenes: 4,
  },
  {
    dayLabel: "LUNDI · ENCORE",
    narrator: "NOAH",
    beforeHighlight: "« Même journée, mêmes couloirs… mais je me souviens de tout. Si mes ",
    highlight: "souvenirs survivent à la boucle",
    afterHighlight:
      ", je peux retrouver le bug. Chaque salle doit cacher une partie de la réponse. »",
    sceneNumber: 3,
    totalScenes: 4,
  },
  {
    dayLabel: "LUNDI · 09:00",
    narrator: "NARRATEUR",
    beforeHighlight:
      "Explore le campus, résous les huit énigmes et conserve tes souvenirs. Le terminal du ",
    highlight: "Co-working",
    afterHighlight:
      " permettra d’appliquer le correctif. Tu as quinze minutes réelles pour sauver la journée. Cette fois, il faut que la journée dépasse 16 h 00.",
    sceneNumber: 4,
    totalScenes: 4,
  },
]
