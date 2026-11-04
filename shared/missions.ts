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
    title: "Le registre corrompu",
    brief:
      "Le registre de présence répète la même journée. Analyse ses traces pour retrouver la clé du premier module.",
    object: "REGISTRE DE PRÉSENCE · G4-OS",
    reward: "Fragment LOGIQUE récupéré",
    symbol: "01",
  },
  cafeteria: {
    title: "Le réseau du réfectoire",
    brief:
      "La borne du réfectoire ne joint plus le serveur central. Examine les indices réseau et rétablis la connexion.",
    object: "DIAGNOSTIC RÉSEAU · BORNE DU RÉFECTOIRE",
    reward: "Fragment RÉSEAU récupéré",
    symbol: "02",
  },
  gaming: {
    title: "La boucle du programme",
    brief:
      "Le jeu d’arcade tourne à l’infini. Lis le programme et retrouve le résultat qui permet de le débloquer.",
    object: "CONSOLE DE DÉBOGAGE · SALLE GAMING",
    reward: "Fragment CODE récupéré",
    symbol: "03",
  },
  cowork: {
    title: "Le dossier verrouillé",
    brief:
      "Le dossier de conception est protégé. Déchiffre son message et vérifie les règles de sécurité du campus.",
    object: "ARCHIVE PROTÉGÉE · ESPACE COWORK",
    reward: "Fragment SÉCURITÉ récupéré",
    symbol: "04",
  },
  amphitheater: {
    title: "La mémoire du campus",
    brief:
      "Le système de l’amphi a perdu sa configuration. Retrouve ses valeurs pour restaurer la mémoire centrale.",
    object: "CONSOLE SYSTÈME · AMPHITHÉÂTRE",
    reward: "Fragment SYSTÈME récupéré",
    symbol: "05",
  },
  sormiou: {
    title: "Briser la boucle",
    brief: "Assemble les cinq fragments dans la console finale et valide ton évasion.",
    object: "CONSOLE CENTRALE · SORMIOU",
    reward: "La sortie est ouverte !",
    symbol: "★",
  },
  vending: {
    title: "Le ticket oublié",
    brief: "Un ticket coincé dans le distributeur cache un conseil pour explorer le campus.",
    object: "DISTRIBUTEURS",
    reward: "Indice découvert",
    symbol: "?",
  },
}
