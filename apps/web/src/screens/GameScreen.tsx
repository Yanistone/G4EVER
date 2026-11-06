import { Navigate, useNavigate } from "react-router-dom"
import { Button } from "../components/Button"
import { PhaserGame } from "../components/PhaserGame"
import { CampusPanel } from "../components/game/CampusPanel"
import { CampaignPanel } from "../components/game/CampaignPanel"
import { getCampaignSeed } from "../game/campaignRun"
import { formatDuration } from "../game/session"
import type { useAdventure } from "../hooks/useAdventure"

export function GameScreen({ adventure }: { adventure: ReturnType<typeof useAdventure> }) {
  const navigate = useNavigate()
  const { session, reboot, saveNow } = adventure
  if (session.status === "idle") return <Navigate to="/" replace />
  if (session.status === "won") return <Navigate to="/victory" replace />
  const expired = session.status === "expired"
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-dark">
      {!expired && (
        <>
          <PhaserGame
            key={`campus:${session.loopNumber}`}
            initialPosition={session.playerPosition}
            challengeSeed={session.challengeSeed}
          />
          <CampusPanel />
          <CampaignPanel
            key={`campagne:${session.loopNumber}`}
            standalone={false}
            initialProgress={{
              seed: session.challengeSeed ?? getCampaignSeed(),
              solvedRoomIds: [...session.solvedRoomIds],
              knownHintIds: [...session.knownHintIds],
              foundDocumentIds: [...session.foundDocumentIds],
            }}
          />
        </>
      )}
      <div className="game-hud">
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => {
            saveNow()
            navigate("/")
          }}
        >
          MENU PRINCIPAL
        </Button>
        <span>
          Boucle n°{session.loopNumber} · {session.solvedRoomIds.length}/5 modules
        </span>
        <span
          className={session.remainingMs <= 60000 ? "countdown urgent" : "countdown"}
          role="timer"
          aria-label="Temps restant avant le redémarrage"
        >
          {formatDuration(Math.ceil(session.remainingMs / 1000))}
        </span>
      </div>
      {!expired && (
        <p className="game-controls">
          ZQSD / flèches : se déplacer · Progression sauvegardée automatiquement
        </p>
      )}
      {expired && (
        <section className="reboot-screen" aria-labelledby="reboot-title">
          <p>G4-OS / REDÉMARRAGE</p>
          <h1 id="reboot-title">TEMPS ÉCOULÉ</h1>
          <p>Les 15 minutes sont écoulées. Recommence une boucle pour tenter de sortir.</p>
          <p>Tes souvenirs restent conservés.</p>
          <Button onClick={reboot}>RECOMMENCER LA BOUCLE</Button>
        </section>
      )}
    </main>
  )
}
