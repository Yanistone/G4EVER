export const MISSIONS: Record<
  string,
  {
    title: string
    brief: string
    object: string
    reward: string
    symbol: string
  }
> = {
  classroom: {
    title: "Le terminal de Sugiton",
    brief: "Calcule le total puis interprète le journal d’erreur de G4-OS.",
    object: "TERMINAL ET JOURNAL · SUGITON",
    reward: "Journal analysé",
    symbol: "02",
  },
  cafeteria: {
    title: "Le café et la table",
    brief: "Observe les tasses puis retrouve les places de Noah, Léa, Yanis et Inès.",
    object: "SOUVENIRS DU RÉFECTOIRE",
    reward: "Code de Sugiton récupéré",
    symbol: "01",
  },
  gaming: {
    title: "Le script et les différences",
    brief: "Repère la ligne fautive puis compare les deux vues de Mont Ventoux.",
    object: "SCRIPT DE LA JOURNÉE · MONT VENTOUX",
    reward: "Code du Co-working récupéré",
    symbol: "04",
  },
  cowork: {
    title: "Le correctif",
    brief: "Sauvegarde, correction, tests, déploiement : retrouve la bonne procédure.",
    object: "PROCÉDURE DE CORRECTION · CO-WORKING",
    reward: "Correctif prêt",
    symbol: "05",
  },
  amphitheater: {
    title: "Le planning de G4-OS",
    brief: "Analyse les dépendances du projet et retrouve la tâche sacrifiée.",
    object: "PLANNING · SAINTE VICTOIRE",
    reward: "Cause du crash identifiée",
    symbol: "03",
  },
  sormiou: {
    title: "Sortir du campus",
    brief:
      "Dans la course, valide ton arrivée après les cinq salles. En aventure, applique le correctif au Co-working.",
    object: "CONSOLE CENTRALE · SORMIOU",
    reward: "La sortie est ouverte !",
    symbol: "★",
  },
  vending: {
    title: "Le ticket oublié",
    brief: "Un ticket rappelle le rôle de ton carnet de souvenirs.",
    object: "DISTRIBUTEURS",
    reward: "Indice découvert",
    symbol: "?",
  },
}
