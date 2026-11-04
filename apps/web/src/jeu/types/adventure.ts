import type { PracticalTask } from "../game/escape"
import type { EmphasizedText, QuizQuestion } from "./quiz"

export type PuzzleRoomId = "classroom" | "cafeteria" | "gaming" | "cowork" | "amphitheater"

export interface AdventurePuzzle {
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
}
