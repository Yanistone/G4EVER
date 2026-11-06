import type { PuzzlePageProps } from "../types/adventure"
import { Dialog } from "../components/ui/Dialog"
import "../styles/yanis.css"

type Props = PuzzlePageProps & {
  onExamineDocument: () => void
  onHint: () => void
  hintText: string
  error: string
  showDocument: boolean
}

export function PuzzlePage({
  puzzle,
  selectedAnswerId,
  onSelectAnswer,
  onValidate,
  onLeave,
  requiredDocumentFound = false,
  loopNumber,
  solvedCount,
  onExamineDocument,
  onHint,
  hintText,
  error,
  showDocument,
}: Props) {
  const task = puzzle.practical
  return (
    <Dialog title={puzzle.title} onClose={onLeave}>
      <div className="question-meta">
        <span>{puzzle.question.courseLabel}</span>
        <b>
          BOUCLE {loopNumber} · {solvedCount}/5 MODULES
        </b>
      </div>
      <p>{task?.instruction ?? puzzle.question.prompt.before}</p>
      {task && (
        <>
          <button className="document-button" onClick={onExamineDocument}>
            EXAMINER LE DOCUMENT
          </button>
          {showDocument && (
            <article className="evidence">
              <h3>{task.document.name}</h3>
              <p>{task.document.text}</p>
            </article>
          )}
          <pre>{task.template}</pre>
        </>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onValidate()
        }}
      >
        {task ? (
          <label className="terminal-field">
            {task.language}
            <input
              autoComplete="off"
              spellCheck={false}
              maxLength={150}
              aria-label="Réponse du terminal"
              placeholder={task.placeholder}
              disabled={!requiredDocumentFound}
              value={selectedAnswerId ?? ""}
              onChange={(event) => onSelectAnswer(event.target.value)}
            />
          </label>
        ) : (
          <div className="terminal-answers" role="group" aria-label="Choisir une réponse">
            {puzzle.question.answers.map((answer) => (
              <button
                type="button"
                key={answer.id}
                aria-pressed={answer.id === selectedAnswerId}
                onClick={() => onSelectAnswer(answer.id)}
              >
                {answer.letter} · {answer.label}
              </button>
            ))}
          </div>
        )}
        {!requiredDocumentFound && task && (
          <p>Examine le document pour obtenir les informations nécessaires.</p>
        )}
        {error && (
          <p className="answer-error" role="alert">
            {error}
          </p>
        )}
        <div className="terminal-actions">
          <button type="button" className="hint-button" onClick={onHint}>
            JE SUIS BLOQUÉ
          </button>
          <button
            className="ui-button"
            type="submit"
            disabled={!selectedAnswerId?.trim() || (!!task && !requiredDocumentFound)}
          >
            Valider la réponse →
          </button>
        </div>
      </form>
      {hintText && (
        <p className="hint-message" role="status">
          {hintText}
        </p>
      )}
    </Dialog>
  )
}
