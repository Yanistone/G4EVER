import type { SuccessPageProps } from "../types/quiz"
import "../styles/immersive.css"
export function SuccessPage({ feedback: f, onContinue }: SuccessPageProps) {
  return (
    <div className="immersive-feedback success" aria-label="Bonne réponse">
      <div className="feedback-orbit" />
      <section>
        <div className="result-emblem">✓</div>
        <small>SYSTÈME RESTAURÉ / {f.contextLabel}</small>
        <h1>{f.characterQuote}</h1>
        <div className="feedback-card">
          <strong>
            {f.answer.letter} · {f.answer.label}
          </strong>
          <p>
            {f.explanation.before}
            <b>{f.explanation.highlight}</b>
            {f.explanation.after}
          </p>
          <div className="result-metrics">
            <span>
              <b>+{f.memoryReward}</b> souvenir
            </span>
            <span>
              <b>
                {f.solved}/{f.total}
              </b>{" "}
              modules
            </span>
            <span>
              <b>{f.timeLabel}</b> campus
            </span>
          </div>
        </div>
        <button onClick={onContinue} className="terminal-submit">
          CONTINUER ▸
        </button>
      </section>
      <footer>G4-OS / FRAGMENT SYNCHRONISÉ</footer>
    </div>
  )
}
