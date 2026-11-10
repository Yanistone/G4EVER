import type { ScenarioPuzzle } from "../../../../../shared/scenario"
import type { PracticalTask } from "../game/escape"
import type { EmphasizedText, QuizQuestion } from "./quiz"

export type PuzzleRoomId = "classroom" | "cafeteria" | "gaming" | "cowork" | "amphitheater"

export interface AdventurePuzzle {
  scenario?: ScenarioPuzzle
  practical?: PracticalTask
  id: string
  roomId: PuzzleRoomId
  title: string
  question: QuizQuestion
  correctAnswerId: string
  explanation: EmphasizedText

  hint: string

  clue: string
}

export interface PuzzleResult {
  status: "correct" | "wrong"
  /** Change à chaque tentative pour relancer l'animation. */
  key: number
  message: string
  fromMemory?: boolean
  unlockedLabels?: readonly string[]
}

export interface PuzzlePageProps {
  puzzle: AdventurePuzzle
  selectedAnswerId: string | null
  onSelectAnswer: (answerId: string) => void
  onValidate: () => void
  onLeave: () => void
  result: PuzzleResult | null
  remembered: boolean
  onUseMemory: () => void
  loopNumber: number
  solvedCount: number
  total: number
  hintLevel: number
  /** Coût en minutes de campus de chaque niveau d'indice (0 : gratuit). */
  hintCosts: readonly [number, number, number]
  onHint: (level: 1 | 2 | 3) => void
  trustedLea?: boolean
  leaCost: number
  onTrustLea?: () => void
  onJournal?: () => void
  onApplyFix?: () => void
  notice?: string
  gameTime?: string
  timeLabel: string
  wrongAnswerMinutes: number
}
