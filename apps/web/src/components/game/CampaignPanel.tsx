import { useEffect, useRef, useState } from "react"
import { createCampaign, examineDocument, requestHint, submitAnswer } from "../../game/campaign"
import type { CampaignProgress } from "../../game/campaign"
import { campaignDeck } from "../../game/campaignDeck"
import { getCampaignSeed } from "../../game/campaignRun"
import { gameEvents, GAME_EVENTS } from "../../game/events"
import { CAMPUS_EVENTS } from "../../game/campusEvents"
import type { InteractionRequest } from "../../game/campusEvents"
import { PuzzlePage } from "../../pages/PuzzlePage"
import { Dialog } from "../ui/Dialog"
import "../../styles/yanis.css"

export function CampaignPanel({ standalone = true }: { standalone?: boolean }) {
  const [progress, setProgress] = useState(() => createCampaign(getCampaignSeed()))
  const latest = useRef(progress)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [hintText, setHintText] = useState("")
  const [error, setError] = useState("")
  const [showDocument, setShowDocument] = useState(false)
  const [feedback, setFeedback] = useState("")
  const update = (value: CampaignProgress) => {
    latest.current = value
    setProgress(value)
  }
  useEffect(() => {
    const requested = (request: InteractionRequest) => {
      if (!campaignDeck(request.seed).some((item) => item.roomId === request.roomId)) return
      request.handled = true
      if (latest.current.seed !== request.seed) {
        const value = createCampaign(request.seed)
        latest.current = value
        setProgress(value)
      }
      setRoomId(request.roomId)
      setAnswer(null)
      setHintText("")
      setError("")
      setShowDocument(false)
      setFeedback("")
      gameEvents.emit(CAMPUS_EVENTS.controls, false)
    }
    gameEvents.on(CAMPUS_EVENTS.puzzleRequested, requested)
    return () => {
      gameEvents.off(CAMPUS_EVENTS.puzzleRequested, requested)
    }
  }, [])
  const puzzles = campaignDeck(progress.seed)
  const puzzle = puzzles.find((item) => item.roomId === roomId)
  const close = () => {
    setRoomId(null)
    setFeedback("")
    gameEvents.emit(CAMPUS_EVENTS.controls, true)
  }
  const open = (id: string) => {
    setRoomId(id)
    setAnswer(null)
    setHintText("")
    setError("")
    setShowDocument(false)
    gameEvents.emit(CAMPUS_EVENTS.controls, false)
  }
  const validate = () => {
    if (!roomId || !answer?.trim()) return
    const result = submitAnswer(latest.current, roomId, answer)
    update(result.progress)
    if (result.correct && puzzle) {
      setFeedback(
        `${puzzle.explanation.before}${puzzle.explanation.highlight}${puzzle.explanation.after}`,
      )
      gameEvents.emit(GAME_EVENTS.puzzleSolved, roomId)
    } else
      setError(
        result.reason === "missing-document"
          ? "Examine d'abord le document de cette salle."
          : "Réponse incorrecte. Réessaie ou demande un indice.",
      )
  }
  return (
    <>
      {standalone && (
        <section
          className="campaign-hub"
          data-testid="campaign-panel"
          data-seed={progress.seed}
          inert={roomId !== null}
        >
          <span>G4-OS / SYSTÈMES DU CAMPUS</span>
          <h1>Les cinq modules à réparer</h1>
          <p>Examine les documents, répare chaque terminal et demande un indice si tu es bloqué.</p>
          <div className="module-grid">
            {puzzles.map((item) => (
              <button
                key={item.id}
                disabled={progress.solvedRoomIds.includes(item.roomId)}
                aria-label={`Ouvrir ${item.question.courseLabel}`}
                onClick={() => open(item.roomId)}
              >
                <small>{item.question.courseLabel}</small>
                <strong>{item.title}</strong>
                <span>
                  {progress.solvedRoomIds.includes(item.roomId)
                    ? "✓ MODULE RÉPARÉ"
                    : "OUVRIR LE TERMINAL →"}
                </span>
              </button>
            ))}
          </div>
          <p className="module-count" role="status">
            {progress.solvedRoomIds.length}/5 modules réparés
          </p>
        </section>
      )}
      {feedback ? (
        <Dialog title="MODULE RESTAURÉ" onClose={close}>
          <p>{feedback}</p>
          <strong>{progress.solvedRoomIds.length}/5 modules réparés</strong>
          <p>Le fragment de réparation est récupéré.</p>
          <button className="ui-button" onClick={close}>
            CONTINUER
          </button>
        </Dialog>
      ) : (
        puzzle && (
          <PuzzlePage
            puzzle={puzzle}
            selectedAnswerId={answer}
            onSelectAnswer={setAnswer}
            onValidate={validate}
            onLeave={close}
            loopNumber={1}
            solvedCount={progress.solvedRoomIds.length}
            requiredDocumentFound={
              !puzzle.practical || progress.foundDocumentIds.includes(puzzle.practical.document.id)
            }
            onExamineDocument={() => {
              update(examineDocument(latest.current, puzzle.roomId))
              setShowDocument(true)
            }}
            showDocument={showDocument}
            error={error}
            hintText={hintText}
            onHint={() => {
              const result = requestHint(latest.current, puzzle.roomId)
              update(result.progress)
              setHintText(result.text)
              gameEvents.emit(CAMPUS_EVENTS.hintDiscovered, puzzle.id)
            }}
          />
        )
      )}
    </>
  )
}
