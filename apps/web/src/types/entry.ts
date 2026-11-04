export interface LaunchData {
  terminalLines: readonly [string, string, string, string, string]
  loadingLabel: string
  startLabel: string
  versionLabel: string
  dayLabel: string
}

export interface LaunchPageProps {
  data: LaunchData
  onStart: () => void
}

export interface MenuData {
  loopNumber: number
  time: string
  savedLoopNumber: number
  savedTime: string
  canContinue: boolean
  statusLabel: string
  versionLabel: string
  bestTime: string
}

export interface MenuPageProps {
  data: MenuData
  onNewGame: () => void
  onContinue: () => void
  onOptions: () => void
  onQuit: () => void
}

export interface IntroData {
  dayLabel: string
  narrator: string
  beforeHighlight: string
  highlight: string
  afterHighlight: string
  sceneNumber: number
  totalScenes: number
}

export interface IntroPageProps {
  data: IntroData
  onNext: () => void
  onSkip: () => void
}
