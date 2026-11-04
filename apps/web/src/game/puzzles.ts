import type { AdventurePuzzle } from "../types/adventure"
import type { IntroData } from "../types/entry"

export const puzzles: readonly AdventurePuzzle[] = [
  {
    id: "classroom-sequence",
    roomId: "classroom",
    title: "Le registre qui bégaie",
    question: {
      id: "classroom-sequence",
      courseLabel: "SALLE PRINCIPALE · LOGIQUE",
      loopNumber: 1,
      number: 1,
      total: 5,
      prompt: {
        before: "Le registre affiche ",
        highlight: "3 → 6 → 12 → ?",
        after: " Quelle valeur manque ?",
      },
      answers: [
        { id: "a", letter: "A", label: "18" },
        { id: "b", letter: "B", label: "21" },
        { id: "c", letter: "C", label: "24" },
        { id: "d", letter: "D", label: "36" },
      ],
      progress: 0,
    },
    correctAnswerId: "c",
    explanation: {
      before: "Chaque nombre est ",
      highlight: "multiplié par 2",
      after: " : 3, 6, 12, puis 24. La cadence du registre est retrouvée.",
    },
    hint: "Compare 3 à 6, puis 6 à 12 : c’est la même opération à chaque étape.",
    clue: "Cadence réparée : chaque étape du registre double la précédente.",
  },
  {
    id: "cafeteria-signal",
    roomId: "cafeteria",
    title: "Le signal du réfectoire",
    question: {
      id: "cafeteria-signal",
      courseLabel: "RÉFECTOIRE · OBSERVATION",
      loopNumber: 1,
      number: 2,
      total: 5,
      prompt: {
        before: "La borne clignote : ",
        highlight: "rouge → vert → bleu → rouge",
        after: ". Et ensuite ?",
      },
      answers: [
        { id: "a", letter: "A", label: "Vert" },
        { id: "b", letter: "B", label: "Rouge" },
        { id: "c", letter: "C", label: "Jaune" },
        { id: "d", letter: "D", label: "Bleu" },
      ],
      progress: 0,
    },
    correctAnswerId: "a",
    explanation: {
      before: "Le motif répète ",
      highlight: "rouge, vert, bleu",
      after: ". Après le second rouge vient donc le vert. Le signal est synchronisé.",
    },
    hint: "Les trois premières couleurs forment un cycle. Le second rouge recommence ce cycle.",
    clue: "Signal réparé : la borne suit le cycle rouge, vert, bleu.",
  },
  {
    id: "gaming-typeof-null",
    roomId: "gaming",
    title: "Le vieux bug de JavaScript",
    question: {
      id: "gaming-typeof-null",
      courseLabel: "SALLE GAMING · CODE",
      loopNumber: 1,
      number: 3,
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
      progress: 0,
    },
    correctAnswerId: "a",
    explanation: {
      before: "Exact : ",
      highlight: "typeof null",
      after:
        " renvoie « object ». C’est un vieux bug de JavaScript, gardé depuis 1995 pour ne rien casser.",
    },
    hint: "« null » n’est pas vraiment vide pour JavaScript… Pense aux types les plus anciens du langage.",
    clue: "Module hérité identifié : tester la valeur null avant de se fier à typeof.",
  },
  {
    id: "cowork-accessible-error",
    roomId: "cowork",
    title: "Une alerte pour tout le monde",
    question: {
      id: "cowork-accessible-error",
      courseLabel: "COWORK · CONCEPTION",
      loopNumber: 1,
      number: 4,
      total: 5,
      prompt: {
        before: "Quelle alerte reste claire ",
        highlight: "sans distinguer les couleurs",
        after: " ?",
      },
      answers: [
        { id: "a", letter: "A", label: "Une bordure rouge, sans autre indication" },
        { id: "b", letter: "B", label: "Une icône et un texte explicite" },
        { id: "c", letter: "C", label: "Le même bouton, coloré en orange" },
        { id: "d", letter: "D", label: "Un fond qui passe du vert au rouge" },
      ],
      progress: 0,
    },
    correctAnswerId: "b",
    explanation: {
      before: "Une erreur doit être expliquée par ",
      highlight: "un texte et une icône",
      after: ", pas seulement par une couleur. Le message du crash devient enfin lisible.",
    },
    hint: "Imagine l’écran en noir et blanc : quelle réponse permet encore de comprendre le problème ?",
    clue: "Alerte décodée : G4-OS attend une validation des sauvegardes, pas un nouveau redémarrage.",
  },
  {
    id: "amphitheater-backup-gate",
    roomId: "amphitheater",
    title: "La porte des sauvegardes",
    question: {
      id: "amphitheater-backup-gate",
      courseLabel: "AMPHITHÉÂTRE · ALGORITHME",
      loopNumber: 1,
      number: 5,
      total: 5,
      prompt: {
        before: "Quel test exige que les sauvegardes ",
        highlight: "A et B soient toutes deux prêtes",
        after: " ?",
      },
      answers: [
        { id: "a", letter: "A", label: "A || B" },
        { id: "b", letter: "B", label: "!A && !B" },
        { id: "c", letter: "C", label: "A !== B" },
        { id: "d", letter: "D", label: "A && B" },
      ],
      progress: 0,
    },
    correctAnswerId: "d",
    explanation: {
      before: "L’opérateur ",
      highlight: "&& signifie « ET »",
      after:
        " : il exige que A et B soient vrais. G4-OS peut maintenant vérifier ses deux sauvegardes avant le correctif.",
    },
    hint: "« OU » accepte une seule sauvegarde. Il faut un opérateur qui exige les deux à la fois.",
    clue: "Verrou réparé : mémoire ET horloge doivent être validées ensemble.",
  },
]

export const vendingClue =
  "Un ticket coincé indique : « Ne force pas le reboot. Vérifie la cadence, le signal, le module hérité, l’alerte et les deux sauvegardes. Le terminal de Sormiou assemble le correctif. »"

export const sormiouClue =
  "Le terminal de Sormiou attend cinq fragments de réparation : salle principale, réfectoire, salle gaming, cowork et amphithéâtre. Rassemble-les, puis applique le correctif pour dépasser 16:00."

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
      "Explore le campus, répare les cinq modules et conserve les indices de tes erreurs. Le terminal de ",
    highlight: "Sormiou",
    afterHighlight:
      " pourra assembler le correctif. Cette fois, il faut que la journée dépasse 16 h 00.",
    sceneNumber: 4,
    totalScenes: 4,
  },
]
