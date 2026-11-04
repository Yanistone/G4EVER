export type ScenarioKind =
  "cups" | "seating" | "algorithm" | "log" | "planning" | "script" | "differences" | "patch"
export interface ScenarioPuzzle {
  id: string
  roomId: "cafeteria" | "classroom" | "amphitheater" | "gaming" | "cowork"
  room: string
  title: string
  kind: ScenarioKind
  prompt: string
  hints: [string, string]
  memory: string
  explanation: string
}
export const SCENARIO: readonly ScenarioPuzzle[] = [
  {
    id: "cafe-9h",
    roomId: "cafeteria",
    room: "Réfectoire",
    title: "Le café de 9h00",
    kind: "cups",
    prompt: "Observe les deux étagères. Combien de tasses bleues vois-tu ?",
    hints: [
      "Seule une couleur compte.",
      "Regarde les deux niveaux de l’étagère, sans oublier la tasse à moitié cachée.",
    ],
    memory: "Souvenir n°1 : 5 tasses bleues. Ce nombre servira au terminal de Sugiton.",
    explanation: "Trois tasses bleues en haut et deux en bas, dont une derrière le plateau : 5.",
  },
  {
    id: "table-refectoire",
    roomId: "cafeteria",
    room: "Réfectoire",
    title: "La table du réfectoire",
    kind: "seating",
    prompt:
      "Retrouve les places de chacun et saisis les quatre numéros dans l’ordre Noah, Léa, Yanis, Inès.",
    hints: ["Place d’abord Yanis.", "Yanis est en place 4 et Noah ne peut pas être en place 2."],
    memory: "Code de Sugiton : 3142. De gauche à droite : Léa, Inès, Noah, Yanis.",
    explanation:
      "Yanis est à droite. Noah est en 3, Inès en 2 et Léa en 1 : Noah, Léa, Yanis, Inès donnent 3142.",
  },
  {
    id: "calcul-terminal",
    roomId: "classroom",
    room: "Sugiton",
    title: "Le calcul du terminal",
    kind: "algorithm",
    prompt:
      "Reprends n dans ton carnet, puis exécute le programme à la main. Quelle valeur affiche-t-il ?",
    hints: [
      "Fais un tableau avec une ligne par valeur de i.",
      "Les totaux successifs sont 1, 5, 8, 24 : il reste la dernière valeur de i.",
    ],
    memory: "Code de Sainte Victoire : 29. n = 5 ; total final = 29.",
    explanation: "Pour i de 1 à 5 : 1 + 4 + 3 + 16 + 5 = 29.",
  },
  {
    id: "journal-erreur",
    roomId: "classroom",
    room: "Sugiton",
    title: "Le journal d’erreur",
    kind: "log",
    prompt: "Le journal affiche une erreur HTTP 503. Que signifie ce code ?",
    hints: [
      "Les codes 5xx signalent une erreur côté serveur.",
      "404 signifie page introuvable et 403 accès interdit. Ici, le service ne répond plus.",
    ],
    memory:
      "15:59:10 : tests exécutés = 0. À 16:00 : erreur 503 et restauration_9h00. Le déploiement n’a pas été testé.",
    explanation:
      "503 signifie « Service indisponible ». Le journal révèle aussi l’absence de tests et la restauration de 9h00.",
  },
  {
    id: "planning-g4",
    roomId: "amphitheater",
    room: "Sainte Victoire",
    title: "Le planning de G4-OS",
    kind: "planning",
    prompt:
      "Calcule la durée minimale du projet. Pour tenir le délai imposé de 8 jours, quelle tâche a été supprimée ?",
    hints: [
      "Cherche le chemin le plus long. Le développement et la formation peuvent avancer en parallèle.",
      "Additionne A, B, C et E. Quelle tâche faut-il retirer pour passer de 11 à 8 jours ?",
    ],
    memory:
      "Code de Mont Ventoux : 11. Chemin critique A → B → C → E. Les Tests ont été supprimés pour tenir 8 jours.",
    explanation:
      "A + B + C + E = 2 + 5 + 3 + 1 = 11 jours. Sans C (Tests), le projet tombe à 8 jours.",
  },
  {
    id: "script-journee",
    roomId: "gaming",
    room: "Mont Ventoux",
    title: "Le script de la journée",
    kind: "script",
    prompt:
      "Clique sur la ligne qui empêche la boucle de se terminer. Elle doit faire avancer l’heure.",
    hints: [
      "Suis la valeur de heure après chaque passage.",
      "L’heure diminue : la condition heure < 16 reste donc vraie.",
    ],
    memory:
      "Ligne fautive : 4. Remplacer heure = heure - 1 par heure = heure + 1. Retirer aussi la restauration de la ligne 5 lors du correctif.",
    explanation:
      "La ligne 4 fait reculer l’heure. Avec + 1, la boucle termine ; la restauration de la ligne 5 doit aussi être retirée.",
  },
  {
    id: "avant-apres",
    roomId: "gaming",
    room: "Mont Ventoux",
    title: "Avant / après",
    kind: "differences",
    prompt:
      "Compte les différences entre les deux vues. Assemble le numéro de la ligne fautive et le nombre de différences pour former le code.",
    hints: [
      "Observe les murs et les écrans.",
      "Compare l’heure de l’horloge, l’état de l’écran et la position de la chaise.",
    ],
    memory: "Code du Co-working : 43. Ligne 4 et 3 différences : horloge, écran, chaise.",
    explanation: "Il y a trois différences. La ligne 4 suivie de 3 donne le code 43.",
  },
  {
    id: "correctif",
    roomId: "cowork",
    room: "Co-working",
    title: "Le correctif",
    kind: "patch",
    prompt:
      "Remets les quatre opérations dans le bon ordre, valide la procédure, puis applique le correctif. Tu peux aussi choisir de tout couper.",
    hints: [
      "Sauvegarde l’état actuel avant de toucher au système.",
      "Teste avant de déployer. L’absence de tests a provoqué le crash.",
    ],
    memory:
      "Procédure validée : C → D → B → A. Sauvegarder, corriger les lignes 4 et 5, tester, déployer.",
    explanation:
      "C → D → B → A protège les données, corrige le script, vérifie le résultat et déploie le correctif.",
  },
]
export const SCRIPT = [
  "heure = 9",
  "tant que heure < 16 :",
  "  lancer_cours(heure)",
  "  heure = heure - 1",
  "restaurer_sauvegarde(9)",
]
export const ERROR_LOG =
  "15:59:10  DEPLOY build final · tests exécutés : 0\n16:00:00  ERREUR 503 · tâche lancée : restauration_9h00"
export const ALGORITHM =
  "total ← 0\nPOUR i DE 1 À n\n  SI i est pair : total ← total + i × i\n  SINON : total ← total + i\nAFFICHER total"
export const SEATING_RULES = [
  "Noah n’est ni en place 1 ni en place 4.",
  "Léa est quelque part à gauche de Yanis.",
  "Inès est immédiatement à côté de Noah.",
  "Yanis est à une extrémité.",
  "Léa n’est pas à côté de Noah.",
]
export const PATCH_CARDS: Record<string, string> = {
  A: "Déployer en production",
  B: "Exécuter les tests",
  C: "Sauvegarder l’état actuel du campus",
  D: "Corriger la ligne 4 (+ 1) et retirer la restauration de la ligne 5",
}
export function normalizeAnswer(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
}
export function validateScenario(id: string, answer: string): boolean {
  const value = normalizeAnswer(answer)
  const expected: Record<string, string[]> = {
    "cafe-9h": ["5"],
    "table-refectoire": ["3142"],
    "calcul-terminal": ["5|29"],
    "journal-erreur": ["B"],
    "planning-g4": ["11|TESTS", "11|TEST", "11|C"],
    "script-journee": ["4"],
    "avant-apres": ["43"],
    correctif: ["CDBA"],
  }
  return !!expected[id]?.includes(value)
}
export function availablePuzzle(solved: readonly string[]) {
  return SCENARIO.find((p) => !solved.includes(p.id))
}
export function unlockedRooms(solved: readonly string[]): string[] {
  const ids = ["cafeteria", "vending"]
  if (solved.includes("table-refectoire")) ids.push("classroom")
  if (solved.includes("journal-erreur")) ids.push("amphitheater")
  if (solved.includes("planning-g4")) ids.push("gaming")
  if (solved.includes("avant-apres")) ids.push("cowork")
  if (solved.includes("correctif")) ids.push("sormiou")
  return ids
}
