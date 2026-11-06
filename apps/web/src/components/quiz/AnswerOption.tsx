import type { QuizAnswer } from "../../types/quiz"

export interface AnswerOptionProps {
  answer: QuizAnswer
  selected: boolean
  disabled?: boolean
  onSelect: (answerId: string) => void
}

export function AnswerOption({ answer, selected, disabled, onSelect }: AnswerOptionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <button
        type="button"
        className="game-button quiz-answer"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onSelect(answer.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          border: "4px solid #1B1030",
          borderRadius: 18,
          background: selected ? "#2EE6FF" : "#FFFFFF",
          boxShadow: "0 6px 0 #1B1030",
          textAlign: "left",
        }}
      >
        <span
          style={{
            flex: "none",
            width: 40,
            height: 40,
            borderRadius: 12,
            border: "3px solid #1B1030",
            background: selected ? "#FFFFFF" : "#FFD93B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: 400,
            fontSize: 22,
            color: "#1B1030",
          }}
        >
          {answer.letter}
        </span>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#1B1030" }}>{answer.label}</span>
      </button>
    </div>
  )
}
