export type ScenarioKind =
  "cups" | "seating" | "algorithm" | "log" | "planning" | "script" | "differences" | "patch"

/** Fiche pédagogique consultable gratuitement : elle rend chaque notion informatique accessible
 * à un joueur qui n'a jamais programmé. */
export interface ScenarioMemo {
  title: string
  lines: readonly string[]
}

export interface ScenarioPuzzle {
  id: string
  roomId: "cafeteria" | "classroom" | "amphitheater" | "gaming" | "cowork"
  room: string
  title: string
  kind: ScenarioKind
  /** Petite phrase d'ambiance affichée au-dessus de l'énigme. */
  flavor: string
  prompt: string
  /** Trois niveaux : un coup de pouce, une méthode, puis la solution complète. */
  hints: readonly [string, string, string]
  memo?: ScenarioMemo
  memory: string
  explanation: string
  /** Récompense annoncée au joueur quand l'énigme est résolue. */
  reward: string
  /** Salle que cette énigme déverrouille, si elle en déverrouille une. */
  unlocks?: "classroom" | "amphitheater" | "gaming" | "cowork" | "sormiou"
}

export const SCENARIO: readonly ScenarioPuzzle[] = [
  {
    id: "cafe-9h",
    roomId: "cafeteria",
    room: "Réfectoire",
    title: "Le café de 9h00",
    kind: "cups",
    flavor:
      "Chaque matin, les mêmes tasses, au même endroit. Le système de 9h00 s’en souvient aussi.",
    prompt: "Observe les deux étagères. Combien de tasses bleues vois-tu ?",
    hints: [
      "Une seule couleur compte : le bleu. Oublie le rouge et le blanc.",
      "Regarde les deux niveaux de l’étagère, sans oublier la tasse à moitié cachée derrière le plateau.",
      "Solution : 3 tasses bleues en haut et 2 en bas, soit 5.",
    ],
    memory: "Souvenir n°1 : 5 tasses bleues. Ce nombre servira au terminal de Sugiton.",
    explanation: "Trois tasses bleues en haut et deux en bas, dont une derrière le plateau : 5.",
    reward: "Souvenir gagné : n = 5",
  },
  {
    id: "table-refectoire",
    roomId: "cafeteria",
    room: "Réfectoire",
    title: "La table du réfectoire",
    kind: "seating",
    flavor:
      "Quatre élèves déjeunent toujours ensemble. Leur placement sert de code à la porte de Sugiton.",
    prompt:
      "Place chaque élève sur sa chaise en respectant les cinq règles. Le code suit l’ordre Noah, Léa, Yanis, Inès.",
    hints: [
      "Commence par Yanis : il est à une extrémité, et Léa est quelque part à sa gauche.",
      "Yanis est donc en place 4. Noah est en 2 ou en 3, mais Léa ne doit pas être à côté de lui.",
      "Solution : Léa en 1, Inès en 2, Noah en 3, Yanis en 4. Code Noah-Léa-Yanis-Inès : 3142.",
    ],
    memory: "Code de Sugiton : 3142. De gauche à droite : Léa, Inès, Noah, Yanis.",
    explanation:
      "Yanis est à droite. Noah est en 3, Inès en 2 et Léa en 1 : Noah, Léa, Yanis, Inès donnent 3142.",
    reward: "Porte de Sugiton déverrouillée",
    unlocks: "classroom",
  },
  {
    id: "calcul-terminal",
    roomId: "classroom",
    room: "Sugiton",
    title: "Le calcul du terminal",
    kind: "algorithm",
    flavor: "Le terminal de cours tourne encore. Il attend la valeur de n… et le bon résultat.",
    prompt:
      "Reprends n dans ton carnet, puis exécute le programme à la main. Quelle valeur affiche-t-il ?",
    hints: [
      "n est le nombre de tasses bleues du réfectoire. Fais ensuite un tableau avec une ligne par valeur de i.",
      "Les totaux successifs sont 1, 5, 8, 24 : il reste à traiter i = 5.",
      "Solution : n = 5 et le programme affiche 1 + 4 + 3 + 16 + 5 = 29.",
    ],
    memo: {
      title: "Lire un algorithme",
      lines: [
        "total ← 0 : la boîte « total » commence à zéro.",
        "POUR i DE 1 À n : on répète les lignes en dessous avec i = 1, puis 2, puis 3… jusqu’à n.",
        "i est pair : i vaut 2, 4, 6… Les autres valeurs sont impaires.",
        "i × i : i multiplié par lui-même. Par exemple, 4 × 4 = 16.",
      ],
    },
    memory: "Code de Sainte Victoire : 29. n = 5 ; total final = 29.",
    explanation: "Pour i de 1 à 5 : 1 + 4 + 3 + 16 + 5 = 29.",
    reward: "Porte de Sainte Victoire déverrouillée",
    unlocks: "amphitheater",
  },
  {
    id: "journal-erreur",
    roomId: "classroom",
    room: "Sugiton",
    title: "Le journal d’erreur",
    kind: "log",
    flavor:
      "Les dernières lignes écrites par G4-OS avant le crash. Quelqu’un a voulu aller trop vite.",
    prompt: "Le journal affiche une erreur HTTP 503. Que signifie ce code ?",
    hints: [
      "Les codes qui commencent par 5 signalent une panne du côté du serveur, pas du visiteur.",
      "404 signifie page introuvable et 403 accès interdit : ce sont des codes 4xx. Ici, le service ne répond plus.",
      "Solution : B, « Service indisponible ».",
    ],
    memo: {
      title: "Les codes HTTP",
      lines: [
        "Quand un site répond, il renvoie un code à trois chiffres.",
        "2xx : tout s’est bien passé.",
        "4xx : la demande du visiteur pose problème (mauvaise adresse, accès refusé…).",
        "5xx : le serveur lui-même est en panne ou surchargé.",
      ],
    },
    memory:
      "15:59:10 : tests exécutés = 0. À 16:00 : erreur 503 et restauration_9h00. Le déploiement n’a pas été testé.",
    explanation:
      "503 signifie « Service indisponible ». Le journal révèle aussi l’absence de tests et la restauration de 9h00.",
    reward: "Souvenir gagné : aucun test avant le déploiement",
  },
  {
    id: "planning-g4",
    roomId: "amphitheater",
    room: "Sainte Victoire",
    title: "Le planning de G4-OS",
    kind: "planning",
    flavor:
      "Sur l’écran de l’amphi, le planning du projet. Une tâche a été rayée à la dernière minute.",
    prompt:
      "Calcule la durée minimale du projet. Pour tenir le délai imposé de 8 jours, quelle tâche a été supprimée ?",
    hints: [
      "Le développement (B) et la formation (D) peuvent avancer en même temps : cherche le chemin le plus long.",
      "Additionne A, B, C et E. Quelle tâche faut-il retirer pour passer de 11 à 8 jours ?",
      "Solution : 2 + 5 + 3 + 1 = 11 jours. Sans les Tests (C), le projet tombe à 8 jours.",
    ],
    memo: {
      title: "Le chemin critique",
      lines: [
        "Une tâche ne peut commencer que lorsque les tâches dont elle dépend sont finies.",
        "Deux tâches indépendantes peuvent avancer en même temps.",
        "La durée minimale d’un projet est celle de la plus longue chaîne de tâches.",
      ],
    },
    memory:
      "Code de Mont Ventoux : 11. Chemin critique A → B → C → E. Les Tests ont été supprimés pour tenir 8 jours.",
    explanation:
      "A + B + C + E = 2 + 5 + 3 + 1 = 11 jours. Sans C (Tests), le projet tombe à 8 jours.",
    reward: "Porte de Mont Ventoux déverrouillée",
    unlocks: "gaming",
  },
  {
    id: "script-journee",
    roomId: "gaming",
    room: "Mont Ventoux",
    title: "Le script de la journée",
    kind: "script",
    flavor: "Voici le programme qui fait tourner la journée du campus. Il ne s’arrête jamais.",
    prompt:
      "Clique sur la ligne qui empêche la boucle de se terminer. Elle devrait faire avancer l’heure.",
    hints: [
      "Suis la valeur de « heure » après chaque passage dans la boucle : 9, puis… ?",
      "L’heure diminue : la condition heure < 16 reste donc toujours vraie.",
      "Solution : la ligne 4, « heure = heure - 1 », devrait être « heure = heure + 1 ».",
    ],
    memo: {
      title: "La boucle « tant que »",
      lines: [
        "Les lignes décalées se répètent tant que la condition reste vraie.",
        "Pour qu’une boucle s’arrête, une valeur doit se rapprocher de la limite à chaque tour.",
        "Sinon, la boucle tourne à l’infini : c’est exactement ce qui arrive au campus.",
      ],
    },
    memory:
      "Ligne fautive : 4. Remplacer heure = heure - 1 par heure = heure + 1. Retirer aussi la restauration de la ligne 5 lors du correctif.",
    explanation:
      "La ligne 4 fait reculer l’heure. Avec + 1, la boucle termine ; la restauration de la ligne 5 doit aussi être retirée.",
    reward: "Souvenir gagné : ligne fautive n°4",
  },
  {
    id: "avant-apres",
    roomId: "gaming",
    room: "Mont Ventoux",
    title: "Avant / après",
    kind: "differences",
    flavor:
      "Deux captures de la salle : l’une juste avant 16h00, l’autre juste après le redémarrage.",
    prompt:
      "Trouve les différences entre les deux vues en cliquant dessus. Le code du Co-working = numéro de la ligne fautive suivi du nombre de différences.",
    hints: [
      "Observe les murs, les écrans et le mobilier de la vue « après ».",
      "Compare l’heure de l’horloge, l’état de l’écran et la position de la chaise. La ligne fautive est dans ton carnet.",
      "Solution : 3 différences (horloge, écran, chaise) et la ligne 4 : code 43.",
    ],
    memory: "Code du Co-working : 43. Ligne 4 et 3 différences : horloge, écran, chaise.",
    explanation: "Il y a trois différences. La ligne 4 suivie de 3 donne le code 43.",
    reward: "Porte du Co-working déverrouillée",
    unlocks: "cowork",
  },
  {
    id: "correctif",
    roomId: "cowork",
    room: "Co-working",
    title: "Le correctif",
    kind: "patch",
    flavor: "Tout est prêt. Il ne reste qu’à réparer G4-OS… dans le bon ordre, cette fois.",
    prompt:
      "Remets les quatre opérations dans le bon ordre, valide la procédure, puis applique le correctif.",
    hints: [
      "On protège d’abord ce qui existe : sauvegarde l’état actuel avant de toucher au système.",
      "On teste toujours avant de déployer. C’est l’absence de tests qui a provoqué le crash.",
      "Solution : C → D → B → A. Sauvegarder, corriger, tester, déployer.",
    ],
    memo: {
      title: "Déployer sans casse",
      lines: [
        "Déployer : mettre la nouvelle version en service pour tout le monde.",
        "Tester : vérifier qu’une modification fonctionne, sans risque pour les utilisateurs.",
        "Sauvegarder : garder une copie pour pouvoir revenir en arrière.",
        "Corriger : modifier le programme fautif.",
      ],
    },
    memory:
      "Procédure validée : C → D → B → A. Sauvegarder, corriger les lignes 4 et 5, tester, déployer.",
    explanation:
      "C → D → B → A protège les données, corrige le script, vérifie le résultat et déploie le correctif.",
    reward: "G4-OS est réparé",
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
export const SEATING_STUDENTS = ["Noah", "Léa", "Yanis", "Inès"] as const
export const PATCH_CARDS: Record<string, string> = {
  A: "Déployer en production",
  B: "Exécuter les tests",
  C: "Sauvegarder l’état actuel du campus",
  D: "Corriger la ligne 4 (+ 1) et retirer la restauration de la ligne 5",
}
/** Zones cliquables du jeu des différences, en coordonnées de l'image (360 × 235). */
export const DIFFERENCE_SPOTS = [
  { id: "horloge", label: "L’horloge", x: 280, y: 50, r: 34 },
  { id: "ecran", label: "L’écran", x: 220, y: 112, r: 40 },
  // La chaise a bougé : sa zone couvre l'ancienne et la nouvelle position.
  { id: "chaise", label: "La chaise", x: 204, y: 186, r: 50 },
] as const
export const ANSWERS: Readonly<Record<string, readonly string[]>> = {
  "cafe-9h": ["5"],
  "table-refectoire": ["3142"],
  "calcul-terminal": ["5|29"],
  "journal-erreur": ["B"],
  "planning-g4": ["11|TESTS", "11|TEST", "11|C", "11|LESTESTS", "11|C·TESTS", "11|CTESTS"],
  "script-journee": ["4"],
  "avant-apres": ["43"],
  correctif: ["CDBA"],
}
export function normalizeAnswer(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase().replace(/\s+/g, "")
}
export function validateScenario(id: string, answer: string): boolean {
  const value = normalizeAnswer(answer)
  return !!ANSWERS[id]?.includes(value)
}
/** Réponse canonique, utilisée quand le joueur valide une énigme grâce à un souvenir. */
export function canonicalAnswer(id: string) {
  return ANSWERS[id]?.[0] ?? ""
}
export function availablePuzzle(solved: readonly string[]) {
  return SCENARIO.find((p) => !solved.includes(p.id))
}
/** Nombre d'énigmes à résoudre avant que la salle serveur de Sormiou ne s'ouvre. */
export const SORMIOU_THRESHOLD = 5
export function unlockedRooms(solved: readonly string[]): string[] {
  const ids = ["cafeteria", "vending"]
  for (const puzzle of SCENARIO)
    if (puzzle.unlocks && puzzle.unlocks !== "sormiou" && solved.includes(puzzle.id))
      ids.push(puzzle.unlocks)
  if (solved.length >= SORMIOU_THRESHOLD) ids.push("sormiou")
  return ids
}
/** Salle déverrouillée par la résolution de cette énigme, en tenant compte de Sormiou. */
export function roomsUnlockedBy(id: string, solvedBefore: readonly string[]): string[] {
  const before = new Set(unlockedRooms(solvedBefore))
  return unlockedRooms([...solvedBefore, id]).filter((room) => !before.has(room))
}
