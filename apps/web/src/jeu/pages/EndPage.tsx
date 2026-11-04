import type { EndPageProps } from "../types/quiz"
import { CampusBackdrop } from "../components/game/CampusBackdrop"
import "../styles/immersive.css"
export function EndPage({ result: r, onReplay, onMenu, onCredits }: EndPageProps) {
  return (
    <div className="immersive-ending" aria-label="Fin de partie">
      <CampusBackdrop />
      <div className="ending-shade" />
      <div className="ending-particles" aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `-${i * 0.3}s`,
              background: ["#ffd93b", "#2ee6ff", "#ff3e7f"][i % 3],
            }}
          />
        ))}
      </div>
      <section>
        <span className="ending-label">
          G4-OS / FIN {r.endingNumber} SUR {r.endingsTotal}
        </span>
        <div className="ending-seal">{r.endingNumber === 1 ? "✓" : "∞"}</div>
        <h1>{r.headline}</h1>
        <h2>{r.endingTitle}</h2>
        <p>{r.endingDescription}</p>
        <div className="ending-stats">
          <span>
            <strong>{r.totalTime}</strong>TEMPS DE JEU
          </span>
          <span>
            <strong>
              {r.solved}/{r.total}
            </strong>
            MODULES
          </span>
          <span>
            <strong>{r.loops}</strong>BOUCLES
          </span>
          <span>
            <strong>{r.hints}</strong>SOUVENIRS
          </span>
        </div>
        <div className="ending-actions">
          <button onClick={onMenu}>MENU PRINCIPAL</button>
          <button onClick={onReplay}>REJOUER ↗</button>
          <button onClick={onCredits}>CRÉDITS</button>
        </div>
        <small>
          {r.otherEndingUnlocked
            ? "Les deux issues ont été découvertes."
            : `Une autre issue t’attend : ${r.lockedEndingTitle}.`}
        </small>
      </section>
    </div>
  )
}
