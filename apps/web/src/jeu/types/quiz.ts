export interface EmphasizedText {
  before: string
  highlight: string
  after: string
}

export interface QuizAnswer {
  id: string
  letter: string
  label: string
}

export interface QuizQuestion {
  id: string
  courseLabel: string
  loopNumber: number
  number: number
  total: number
  prompt: EmphasizedText
  answers: readonly QuizAnswer[]

  progress: number
}

export interface QuizPageProps {
  question: QuizQuestion
  selectedAnswerId: string | null
  onSelectAnswer: (answerId: string) => void
  onValidate: () => void
  pending?: boolean
}

export interface AnswerFeedback {
  characterQuote: string
  contextLabel: string
  answer: QuizAnswer
}

export interface SuccessFeedback extends AnswerFeedback {
  explanation: EmphasizedText
  memoryReward: number
  timeLabel: string
  solved: number
  total: number
}

export interface SuccessPageProps {
  feedback: SuccessFeedback
  onContinue: () => void
}

export interface FailureFeedback extends AnswerFeedback {
  timeBefore: string
  timeAfter: string
  penaltyMinutes: number
  resetTime: string
  progress: number
  hint: string
}

export interface FailurePageProps {
  feedback: FailureFeedback
  onRetry: () => void
  onLeave: () => void
}

export interface EndResult {
  characterQuote: string
  rank: string
  day: string
  clock: readonly [string, string, string]
  headline: string
  totalTime: string
  loops: number
  solved: number
  total: number
  hints: number
  endingNumber: number
  endingsTotal: number
  endingTitle: string
  endingDescription: string
  otherEndingUnlocked?: boolean
  lockedEndingNumber: number
  lockedEndingTitle: string
  lockedEndingDescription: string
}

export interface EndPageProps {
  result: EndResult
  onReplay: () => void
  onMenu: () => void
  onCredits: () => void
}
