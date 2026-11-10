import {
  BriefingArtwork0,
  BriefingArtwork1,
  BriefingArtwork2,
  BriefingArtwork3,
} from "../components/artwork/BriefingArtwork"
import type { BriefingData } from "../types/game"
import "../styles/briefing.css"

export interface BriefingPageProps {
  data: BriefingData
  onStart: () => void
}

const cardIcons = {
  question: BriefingArtwork1,
  hint: BriefingArtwork2,
  clock: BriefingArtwork3,
}

function Keycap({ children }: { children: string }) {
  return <span className="briefing-keycap">{children}</span>
}

export function BriefingPage({ data, onStart }: BriefingPageProps) {
  return (
    <div className="briefing-page">
      <div className="briefing-rays">
        <BriefingArtwork0 />
      </div>
      <section className="briefing-panel" aria-labelledby="briefing-title">
        <header className="briefing-alert">
          <span className="briefing-alert-title">{data.alertTitle}</span>
          <span className="briefing-deadline">{data.deadlineLabel}</span>
        </header>
        <div className="briefing-body">
          <div>
            <p className="briefing-eyebrow">MISSION</p>
            <h1 id="briefing-title" className="briefing-title">
              {data.missionTitle}
            </h1>
          </div>
          <div className="briefing-cards">
            {data.cards.map((card) => {
              const Icon = cardIcons[card.icon]
              return (
                <article className="briefing-card" key={card.id}>
                  <div className="briefing-card-icon">
                    <Icon />
                  </div>
                  <h2 className="briefing-card-title">{card.title}</h2>
                  <p className="briefing-card-description">{card.description}</p>
                </article>
              )
            })}
          </div>
          <footer className="briefing-footer">
            <div className="briefing-controls" aria-label="Commandes du jeu">
              <span className="briefing-control">
                <Keycap>Z</Keycap>
                <Keycap>Q</Keycap>
                <Keycap>S</Keycap>
                <Keycap>D</Keycap> Se déplacer
              </span>
              <span className="briefing-control">
                <Keycap>E</Keycap> Interagir
              </span>
              <span className="briefing-control">
                <Keycap>M</Keycap> Plan
              </span>
              <span className="briefing-control">
                <Keycap>J</Keycap> Carnet
              </span>
              <span className="briefing-control">
                <Keycap>Échap</Keycap> Pause
              </span>
            </div>
            <p className="briefing-touch-help">
              Sur téléphone, glisse sur l’écran pour regarder, utilise les flèches pour marcher et
              le bouton Interagir près des objets.
            </p>
            <button type="button" className="game-button briefing-start" onClick={onStart}>
              {data.startLabel}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}
