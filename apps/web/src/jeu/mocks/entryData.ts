import type { IntroData, LaunchData, MenuData } from "../types/entry"

export const launchData: LaunchData = {
  terminalLines: [
    "> G4-OS v1.0 — démarrage…",
    "> Chargement du campus ............ OK",
    "> Synchronisation de l’horloge : 09:00 ..... OK",
    "> Analyse des boucles temporelles ... 0 détectée",
    "> ERREUR 0x16H00 : réinitialisation imminente",
  ],
  loadingLabel: "CHARGEMENT DE LA JOURNÉE…",
  startLabel: "APPUIE SUR UNE TOUCHE",
  versionLabel: "Institut G4 · G4-OS v1.0",
  dayLabel: "Lundi · 09:00",
}

export const menuData: MenuData = {
  loopNumber: 3,
  time: "09:42",
  savedLoopNumber: 3,
  savedTime: "11:20",
  canContinue: true,
  statusLabel: "G4-OS : en ligne",
  versionLabel: "Institut G4 · v0.1",
  bestTime: "12 min 48",
}

export const introData: IntroData = {
  dayLabel: "LUNDI · 09:00",
  narrator: "NARRATEUR",
  beforeHighlight:
    "Lundi, 9 h 00. Noah se réveille pour une journée de cours ordinaire à l’Institut G4. Le nouveau système central, ",
  highlight: "G4-OS",
  afterHighlight: ", a été installé à la hâte pendant le week-end…",
  sceneNumber: 1,
  totalScenes: 4,
}
