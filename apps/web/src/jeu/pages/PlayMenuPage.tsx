import { BrandMark } from "../components/game/BrandMark"
import { CampusBackdrop } from "../components/game/CampusBackdrop"
import "../styles/race.css"
import "../styles/cartoon.css"
import "../styles/immersive.css"
interface Props {
  nickname: string
  canContinue: boolean
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
        <span className="edition-tag">G4 EVER / L’EXPÉRIENCE 3D</span>
        <h1>
          Le campus
          <br />a besoin
          <br />
          <em>de ton cerveau.</em>
        </h1>
        <p>
          Une boucle temporelle. Cinq systèmes à réparer.
          <br />
          Explore le campus, trouve les indices et ouvre la sortie.
        </p>
        <div className="immersive-modes">
          <button className="immersive-play" onClick={p.onRace}>
            <span>01</span>
            <div>
              <small>SOLO OU ENTRE AMIS</small>
              <strong>La course au reboot</strong>
              <p>Un code. Le même départ. Le premier s’échappe.</p>
            </div>
            <b>↗</b>
          </button>
          <button className="immersive-story" aria-label="NOUVELLE PARTIE" onClick={p.onCampaign}>
            <span>02</span>
            <div>
              <small>AVENTURE NARRATIVE</small>
              <strong>Briser la boucle</strong>
            </div>
            <b>→</b>
          </button>
        </div>
        <nav className="immersive-menu-links">
          <button aria-label="CONTINUER" disabled={!p.canContinue} onClick={p.onContinue}>
            Continuer l’histoire
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
        <span>EXPLORATION FPS · ÉNIGMES INFORMATIQUES · 7 ESPACES</span>
        <button onClick={p.onQuit}>QUITTER ↗</button>
      </footer>
    </div>
  )
}
