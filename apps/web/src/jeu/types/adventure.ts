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

export interface PuzzlePageProps {
  puzzle: AdventurePuzzle
  selectedAnswerId: string | null
  onSelectAnswer: (answerId: string) => void
  onValidate: () => void
  onLeave: () => void
  requiredDocumentFound?: boolean
  pending?: boolean
  loopNumber: number
  solvedCount: number
  hintLevel?: number
  onHint?: (level: 1 | 2) => void
  freeLightHint?: boolean
  lockedUntil?: number
  trustedLea?: boolean
  onTrustLea?: () => void
  onJournal?: () => void
  onComplete?: (ending: 1 | 2) => void
  procedureValidated?: boolean
  notice?: string
  gameTime?: string
}
