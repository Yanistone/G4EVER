import type { QuizPageProps } from "../types/quiz"
import { AnswerOption } from "../components/quiz/AnswerOption"
import { QuizArtwork0, QuizArtwork1 } from "../components/artwork/QuizArtwork"

export function QuizPage({
  question,
  selectedAnswerId,
  onSelectAnswer,
  onValidate,
  pending = false,
}: QuizPageProps) {
  const canValidate = question.answers.some((answer) => answer.id === selectedAnswerId) && !pending
  return (
    <div
      aria-labelledby="quiz-question"
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding: "36px 48px",
        position: "relative",
        background: "#2D6BFF",
        color: "#1B1030",
        fontFamily: "'Nunito', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "26px",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: "0", overflow: "hidden" }}>
        <QuizArtwork0 />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "84px",
              height: "84px",
              border: "4px solid #1B1030",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 5px 0 #1B1030",
            }}
          >
            <QuizArtwork1 />
          </div>
          <div
            style={{
              padding: "10px 20px",
              border: "4px solid #1B1030",
              borderRadius: "999px",
              background: "#FF3E7F",
              boxShadow: "0 5px 0 #1B1030",
              fontFamily: "'Lilita One', 'Arial Black', sans-serif",
              fontWeight: "400",
              fontSize: "24px",
              color: "#FFFFFF",
            }}
          >
            {question.courseLabel}
          </div>
        </div>
        <div
          style={{
            padding: "10px 20px",
            border: "4px solid #1B1030",
            borderRadius: "999px",
            background: "#FFFFFF",
            boxShadow: "0 5px 0 #1B1030",
            fontSize: "18px",
            fontWeight: "800",
          }}
        >
          {`Boucle n°${question.loopNumber} · Question ${question.number}/${question.total}`}
        </div>
      </div>
      <div
        style={{
          position: "relative",
          background: "#FFFFFF",
          border: "4px solid #1B1030",
          borderRadius: "24px",
          boxShadow: "0 6px 0 #1B1030",
          padding: "28px 36px",
          textAlign: "center",
        }}
      >
        <p
          id="quiz-question"
          style={{
            margin: "0",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "38px",
            lineHeight: "1.15",
          }}
        >
          {question.prompt.before}
          <span style={{ color: "#FF3E7F" }}>{question.prompt.highlight}</span>
          {question.prompt.after}
        </p>
      </div>
      <div
        role="group"
        aria-label="Choisir une réponse"
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
        }}
      >
        {question.answers.map((answer) => (
          <AnswerOption
            key={answer.id}
            answer={answer}
            selected={answer.id === selectedAnswerId}
            disabled={pending}
            onSelect={onSelectAnswer}
          />
        ))}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "28px",
        }}
      >
        <div
          role="progressbar"
          aria-label="Progression du quiz"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, question.progress))}
          style={{
            flex: "1",
            height: "30px",
            border: "4px solid #1B1030",
            borderRadius: "999px",
            background: "#FFFFFF",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, question.progress))}%`,
              height: "100%",
              background: "#FF9A1F",
              borderRight: "4px solid #1B1030",
            }}
          />
        </div>
        <button
          type="button"
          className="game-button"
          onClick={onValidate}
          disabled={!canValidate}
          aria-busy={pending}
          style={{
            width: "240px",
            height: "72px",
            marginTop: "0",
            boxSizing: "border-box",
            border: "5px solid #1B1030",
            borderRadius: "22px",
            background: "linear-gradient(180deg,#FFF27A,#FFAA00)",
            boxShadow: "0 8px 0 #1B1030",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Lilita One', 'Arial Black', sans-serif",
            fontWeight: "400",
            fontSize: "28px",
            letterSpacing: "1px",
            color: "#1B1030",
          }}
        >
          {"VALIDER"}
        </button>
      </div>
    </div>
  )
}
