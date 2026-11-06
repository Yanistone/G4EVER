import { CampusBackdrop } from "../components/game/CampusBackdrop"

interface Props {
  canContinue: boolean
  onCampaign: () => void
  onContinue: () => void
}

export function PlayMenuPage({ canContinue, onCampaign, onContinue }: Props) {
  return (
    <main className="immersive-home">
      <CampusBackdrop />
      <div className="home-shade" />
      <header className="immersive-header">
        <span className="brand-mark">G4EVER</span>
      </header>
      <section className="immersive-home-content">
        <span className="edition-tag">G4EVER / LA COURSE AU REBOOT</span>
        <h1>
          Le campus
          <br />a besoin
          <br />
          <em>de ton cerveau.</em>
        </h1>
        <p>
          Une boucle temporelle. Cinq systèmes à réparer.
          <br />
          Tu as 15 minutes pour briser la boucle.
        </p>
        <div className="immersive-modes">
          <button className="immersive-play" onClick={onCampaign}>
            <span>01</span>
            <div>
              <small>AVENTURE NARRATIVE</small>
              <strong>JOUER</strong>
              <p>Commencer une nouvelle partie.</p>
            </div>
            <b aria-hidden="true">→</b>
          </button>
        </div>
        <nav className="immersive-menu-links" aria-label="Sauvegarde">
          <button disabled={!canContinue} onClick={onContinue}>
            CONTINUER
          </button>
        </nav>
      </section>
      <aside className="home-scene-caption">
        <span>LE CAMPUS</span>
        <p>
          Le signal clignote.
          <br />
          La boucle recommence.
        </p>
        <i />
      </aside>
      <footer className="immersive-footer">EXPLORATION · ÉNIGMES INFORMATIQUES · 15 MINUTES</footer>
    </main>
  )
}
