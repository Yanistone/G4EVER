import { useEffect } from "react"
import type { PuzzlePageProps } from "../types/adventure"
import { Dialog } from "../components/ui/Dialog"
import "../styles/immersive.css"
export function PuzzlePage({
  puzzle,
  selectedAnswerId,
  onSelectAnswer,
  onValidate,
  onLeave,
  pending = false,
  requiredDocumentFound = true,
  loopNumber,
  solvedCount,
}: PuzzlePageProps) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat || pending || (e.target instanceof HTMLInputElement && e.key !== "Enter")) return
      if (["1", "2", "3", "4"].includes(e.key)) {
        const a = puzzle.question.answers[Number(e.key) - 1]
        if (a) onSelectAnswer(a.id)
      }
      if (e.key === "Enter" && selectedAnswerId) {
        e.preventDefault()
        onValidate()
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [puzzle, onSelectAnswer, onValidate, pending, selectedAnswerId])
  const q = puzzle.question
  return (
    <div className="cartoon-question story-question">
      <Dialog title={puzzle.title} onClose={onLeave}>
        <div className="question-modal-meta">
          <span>{q.courseLabel}</span>
          <b>
            BOUCLE {loopNumber} · {solvedCount}/5 MODULES
          </b>
        </div>
        <h3 className="question-modal-prompt">
          {q.prompt.before}
          <em>{q.prompt.highlight}</em>
          {q.prompt.after}
        </h3>
        {puzzle.practical ? (
          <div className="practical-station">
            <pre>{puzzle.practical.template}</pre>
            {requiredDocumentFound ? (
              <label>
                {puzzle.practical.language} /{" "}
                {puzzle.practical.kind === "code" ? "LIGNE À COMPLÉTER" : "SAISIE CONSOLE"}
                <input
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={150}
                  aria-label="Réponse du terminal"
                  placeholder={puzzle.practical.placeholder}
                  value={selectedAnswerId ?? ""}
                  onChange={(e) => onSelectAnswer(e.target.value)}
                />
              </label>
            ) : (
              <div className="missing-document">
                <strong>Il manque une information.</strong>
                <p>{puzzle.practical.instruction}</p>
                <button className="ui-button" onClick={onLeave}>
                  RETOUR EXPLORER LA SALLE
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="terminal-answers" role="group" aria-label="Choisir une réponse">
            {q.answers.map((a, i) => (
              <button
                key={a.id}
                aria-pressed={a.id === selectedAnswerId}
                className={a.id === selectedAnswerId ? "selected" : ""}
                disabled={pending}
                onClick={() => onSelectAnswer(a.id)}
              >
                <b>{a.letter}</b>
                <span>{a.label}</span>
                <kbd>{i + 1}</kbd>
              </button>
            ))}
          </div>
        )}
        <div className="question-modal-actions">
          <span>
            {puzzle.practical
              ? "Trouve les indices dans la salle · Entrée : valider"
              : "1–4 : choisir · Entrée : valider"}
          </span>
          <button
            className="ui-button"
            disabled={pending || !selectedAnswerId || !requiredDocumentFound}
            onClick={onValidate}
          >
            {pending ? "VÉRIFICATION…" : "Valider la réponse →"}
          </button>
        </div>
      </Dialog>
    </div>
  )
}
