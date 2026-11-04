import type { IntroPageProps } from "../types/entry"
import "../styles/yanis.css"

export function IntroPage({ data, onNext, onSkip }: IntroPageProps) {
  return (
    <main className="yanis-intro">
      <header>
        <strong>G4 EVER</strong>
        <button onClick={onSkip}>PASSER ▸▸</button>
      </header>
      <section>
        <span className="story-day">{data.dayLabel}</span>
        <div className="story-console" aria-hidden="true">
          <span>G4-OS / INITIALISATION</span>
          <b>
            {data.sceneNumber === 2
              ? "ERREUR 0x16H00"
              : data.sceneNumber === 3
                ? "MÉMOIRE CONSERVÉE"
                : "BOUCLE TEMPORELLE"}
          </b>
          <i />
        </div>
        <article>
          <small>{data.narrator}</small>
          <h1>
            {data.beforeHighlight}
            <em>{data.highlight}</em>
            {data.afterHighlight}
          </h1>
        </article>
        <footer>
          <span aria-label={`Scène ${data.sceneNumber} sur ${data.totalScenes}`}>
            {data.sceneNumber} / {data.totalScenes}
          </span>
          <button onClick={onNext}>
            {data.sceneNumber === data.totalScenes ? "ENTRER DANS LE CAMPUS" : "SUIVANT ▸"}
          </button>
        </footer>
      </section>
    </main>
  )
}
