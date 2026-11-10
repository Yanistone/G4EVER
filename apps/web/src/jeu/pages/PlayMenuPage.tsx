import { BrandMark } from "../components/game/BrandMark"
import { CampusBackdrop } from "../components/game/CampusBackdrop"
import "../styles/race.css"
import "../styles/cartoon.css"
import "../styles/immersive.css"
interface Props {
  nickname: string
  canContinue: boolean
  progress?: string
  onRace: () => void
  onCampaign: () => void
  onContinue: () => void
  onOptions: () => void
  onLogout: () => void
  onQuit: () => void
}
export function PlayMenuPage(p: Props) {
  return (
    <div className="immersive-home">
      <CampusBackdrop />
      <div className="home-shade" />
      <header className="immersive-header">
        <BrandMark />
        <div>
          <span className="live-dot" />
          {p.nickname}
          <button onClick={p.onLogout}>Déconnexion ↗</button>
        </div>
      </header>
      <section className="immersive-home-content">
        <span className="edition-tag">G4EVER / L’EXPÉRIENCE 3D</span>
        <h1>
          Le campus
          <br />a besoin
          <br />
          <em>de ton cerveau.</em>
        </h1>
        <p>
          Une journée qui recommence sans fin à 16h00. Huit énigmes, deux fins.
          <br />
          Explore le campus en 3D, fouille, déduis… et brise la boucle.
        </p>
        <div className="immersive-modes">
          <button className="immersive-play" aria-label="NOUVELLE PARTIE" onClick={p.onCampaign}>
            <span>01</span>
            <div>
              <small>ESCAPE GAME · SOLO · 20 À 40 MIN</small>
              <strong>Briser la boucle</strong>
              <p>L’aventure complète. Trois modes, du plus détendu au plus corsé.</p>
            </div>
            <b>→</b>
          </button>
          <button className="immersive-story" onClick={p.onRace}>
            <span>02</span>
            <div>
              <small>ENTRE AMIS · EN LIGNE</small>
              <strong>La course au reboot</strong>
            </div>
            <b>↗</b>
          </button>
        </div>
        <nav className="immersive-menu-links">
          <button aria-label="CONTINUER" disabled={!p.canContinue} onClick={p.onContinue}>
            Continuer l’histoire{p.progress ? ` · ${p.progress}` : ""}
          </button>
          <button aria-label="OPTIONS" onClick={p.onOptions}>
            Paramètres
          </button>
        </nav>
      </section>
      <aside className="home-scene-caption">
        <span>01 / RÉFECTOIRE</span>
        <p>
          Le signal clignote.
          <br />
          La boucle recommence.
        </p>
        <i />
      </aside>
      <footer className="immersive-footer">
        <span>ESCAPE GAME 3D · ÉNIGMES DE LOGIQUE ET D’INFORMATIQUE · 7 ESPACES</span>
        <button onClick={p.onQuit}>QUITTER ↗</button>
      </footer>
    </div>
  )
}
