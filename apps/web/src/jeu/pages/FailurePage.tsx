import type { FailurePageProps } from "../types/quiz"
import "../styles/immersive.css"
export function FailurePage({ feedback: f, onRetry, onLeave }: FailurePageProps) {
  return (
    <div className="immersive-feedback failure" aria-label="Mauvaise réponse">
      <div className="feedback-orbit" />
      <section>
        <div className="result-emblem">↻</div>
        <small>LE SYSTÈME RÉSISTE / {f.contextLabel}</small>
        <h1>{f.characterQuote}</h1>
        <div className="feedback-card">
          <strong>
            {f.answer.letter} · {f.answer.label}
          </strong>
          <p>{f.hint}</p>
          <div className="result-metrics">
            <span>
              <b>+{f.penaltyMinutes} min</b> pénalité
            </span>
            <span>
              <b>
                {f.timeBefore} → {f.timeAfter}
              </b>{" "}
              campus
            </span>
          </div>
        </div>
        <div className="feedback-actions">
          <button onClick={onRetry} className="terminal-submit">
            RÉESSAYER ▸
          </button>
          <button onClick={onLeave}>RETOUR À LA SALLE</button>
        </div>
      </section>
      <footer>CHAQUE ERREUR LAISSE UN SOUVENIR.</footer>
    </div>
  )
}
