import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { PlayMenuPage } from "../pages/PlayMenuPage"
import { Dialog } from "../components/ui/Dialog"
import type { AdventureSession } from "../game/session"

export function HomeScreen({
  session,
  onStart,
}: {
  session: AdventureSession
  onStart: () => void
}) {
  const navigate = useNavigate()
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const canContinue = session.status !== "idle"
  return (
    <>
      <div inert={confirmNewGame}>
        <PlayMenuPage
          canContinue={canContinue}
          onCampaign={() => (canContinue ? setConfirmNewGame(true) : onStart())}
          onContinue={() => navigate(session.status === "won" ? "/victory" : "/game")}
        />
      </div>
      {confirmNewGame && (
        <Dialog title="NOUVELLE PARTIE" onClose={() => setConfirmNewGame(false)}>
          <p>Recommencer la partie ? La sauvegarde actuelle sera remplacée.</p>
          <button className="ui-button" onClick={onStart}>
            RECOMMENCER
          </button>
        </Dialog>
      )}
    </>
  )
}
