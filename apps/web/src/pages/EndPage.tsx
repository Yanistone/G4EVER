import { CampusBackdrop } from "../components/game/CampusBackdrop"
interface EndPageProps {
  result: { totalTime: string; loops: number; solved: number }
  onReplay: () => void
  onMenu: () => void
}
export function EndPage({ result, onReplay, onMenu }: EndPageProps) {
  return (
    <main className="immersive-ending" aria-label="Victoire">
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
        <span className="ending-label">G4-OS / CORRECTIF INSTALLÉ</span>
        <div className="ending-seal" aria-hidden="true">
          ✓
        </div>
        <h1>LA BOUCLE EST BRISÉE !</h1>
        <h2>Le correctif</h2>
        <p>
          Les cinq modules sont réparés. G4-OS est corrigé et les données du campus sont sauvées.
        </p>
        <div className="ending-stats">
          <span>
            <strong>{result.totalTime}</strong>TEMPS DE JEU
          </span>
          <span>
            <strong>{result.solved}/5</strong>MODULES
          </span>
          <span>
            <strong>{result.loops}</strong>BOUCLES
          </span>
        </div>
        <div className="ending-actions">
          <button onClick={onMenu}>MENU PRINCIPAL</button>
          <button onClick={onReplay}>REJOUER ↗</button>
        </div>
      </section>
    </main>
  )
}
