import { readInventory } from "./three/inventory"
import { availablePuzzle, unlockedRooms, validateScenario } from "../../../../shared/scenario"
import { useCallback, useMemo, useEffect, useRef, useState } from "react"
import { ScreenViewport } from "./components/ui/ScreenViewport"
import { Dialog } from "./components/ui/Dialog"
import { useScreen } from "./hooks/useScreen"
import { useProfiles } from "./hooks/useProfiles"
import { useAdventure } from "./hooks/useAdventure"
import type { ScreenId } from "./types/navigation"
import { screenLabels } from "./types/navigation"
import type { QuizAnswer, SuccessFeedback, FailureFeedback, EndResult } from "./types/quiz"
import { LaunchPage } from "./pages/LaunchPage"
import { AuthPage } from "./pages/AuthPage"
import { PlayMenuPage } from "./pages/PlayMenuPage"
import { RacePage } from "./pages/RacePage"
import { IntroPage } from "./pages/IntroPage"
import { CampusNavigator } from "./components/game/CampusNavigator"
import { CampusPage } from "./pages/CampusPage"
import { BriefingPage } from "./pages/BriefingPage"
import { GamePage } from "./pages/GamePage"
import { ThreeSettings } from "./components/game/ThreeSettings"
import { ExplorePage } from "./pages/ExplorePage"
import { PuzzlePage } from "./pages/PuzzlePage"
import { QuizPage } from "./pages/QuizPage"
import { SuccessPage } from "./pages/SuccessPage"
import { FailurePage } from "./pages/FailurePage"
import { EndPage } from "./pages/EndPage"
import { launchData } from "./mocks/entryData"
import { mockBriefingData, mockCampusData, mockGameData } from "./mocks/gameData"
import {
  demoQuizQuestion,
  demoSelectedAnswerId,
  demoAnswerKey,
  demoSuccessFeedback,
  demoFailureFeedback,
  demoEndResult,
} from "./mocks/quizData"
import { campaignDeck } from "./game/campaignDeck"
import { introScenes, vendingClue, sormiouClue } from "./game/puzzles"
import { WORLD_ROOMS, ROOM_SPAWNS } from "./game/world"
import { formatClock, formatDuration } from "./game/session"
import type { RoomId } from "./game/world"
import "./styles/adventure.css"

type Overlay =
  | "options"
  | "pause"
  | "credits"
  | "newgame"
  | "clue"
  | "terminal"
  | "reboot"
  | "map-room"
  | "journal"
  | null
interface SubmittedAnswer {
  answer: QuizAnswer
  puzzleId: string
  timeBefore: string
  timeAfter: string
}
const mapRoomIds: Record<string, RoomId> = {
  main: "classroom",
  refectory: "cafeteria",
  amphi: "amphitheater",
  gaming: "gaming",
  cowork: "cowork",
  sormiou: "sormiou",
  vending: "vending",
}

export function App() {
  const { screen, navigate: changeScreen } = useScreen()
  const profiles = useProfiles()
  const [overlay, setOverlay] = useState<Overlay>(null)
  const navigate = useCallback(
    (target: ScreenId) => {
      setOverlay(null)
      changeScreen(target)
    },
    [changeScreen],
  )
  const [reducedMotion] = useState(() => localStorage.getItem("g4-ever:reduced-motion") === "true")
  const {
    session,
    saveError,
    saveNow,
    begin,
    move,
    solve,
    fail,
    collectClue,
    rememberHint,
    trustLea,
    finish,
    dismissEvent,
  } = useAdventure(
    profiles.profile?.id ?? null,
    (screen === "explore" || screen === "puzzle") && !overlay,
  )
  const puzzles = useMemo(() => campaignDeck(session.challengeSeed), [session.challengeSeed])
  const inventoryKey = `story:${profiles.profile?.id}:${session.challengeSeed ?? "legacy"}`
  const escapeDocuments = useMemo(
    () => puzzles.flatMap((p) => (p.practical ? [p.practical.document] : [])),
    [puzzles],
  )
  const [introIndex, setIntroIndex] = useState(0)
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(demoSelectedAnswerId)
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<SubmittedAnswer | null>(null)
  const [notice, setNotice] = useState("")
  const [clueText, setClueText] = useState("")
  const [selectedMapRoom, setSelectedMapRoom] = useState<RoomId>("cafeteria")
  const [referencePosition, setReferencePosition] = useState(mockGameData.playerPosition)
  const overlayTrigger = useRef<HTMLElement | null>(null)
  const openOverlay = useCallback((next: Exclude<Overlay, null>) => {
    overlayTrigger.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOverlay(next)
  }, [])
  const closeOverlay = useCallback(() => setOverlay(null), [])
  const played = !!profiles.profile && session.started
  const activePuzzle =
    puzzles.find((p) => p.id === currentPuzzleId) ??
    puzzles.find((p) => p.id === availablePuzzle(session.solvedPuzzleIds)?.id) ??
    puzzles[puzzles.length - 1]
  const feedbackPuzzle = puzzles.find((p) => p.id === submitted?.puzzleId)

  useEffect(() => {
    document.title = `${screenLabels[screen]} — G4 Ever 3D · Local`
    setOverlay(null)
  }, [screen])
  useEffect(() => {
    if ((screen === "explore" || screen === "puzzle") && !profiles.profile) navigate("auth")
  }, [screen, profiles.profile, navigate])
  useEffect(() => {
    if (session.event === "reboot") {
      if (screen !== "explore") {
        navigate("explore")
        return
      }
      openOverlay("reboot")
      dismissEvent()
      setSubmitted(null)
      setCurrentPuzzleId(null)
      setSelectedAnswerId(null)
    }
  }, [session.event, screen, navigate, openOverlay, dismissEvent])

  const start = () => {
    if (!profiles.profile) {
      navigate("auth")
      return
    }
    begin()
    setIntroIndex(0)
    setSelectedAnswerId(null)
    setSubmitted(null)
    setCurrentPuzzleId(null)
    setNotice("")
    navigate("intro")
  }
  const requestStart = () => {
    if (played && !session.ending) openOverlay("newgame")
    else start()
  }
  const logout = () => {
    saveNow()
    profiles.logout()
    setSubmitted(null)
    navigate("auth")
  }
  const interact = (roomId: string) => {
    if (roomId === "vending") {
      collectClue()
      setClueText(vendingClue)
      openOverlay("clue")
      return
    }
    if (roomId === "sormiou") {
      openOverlay("terminal")
      return
    }
    const next = availablePuzzle(session.solvedPuzzleIds)
    const puzzle =
      roomId === "cowork" && session.procedureValidated
        ? puzzles[7]
        : puzzles.find((p) => p.roomId === roomId && !session.solvedPuzzleIds.includes(p.id))
    if (!puzzle) {
      setClueText(
        puzzles
          .filter((p) => p.roomId === roomId)
          .map((p) => p.clue)
          .join("\n\n"),
      )
      openOverlay("clue")
      return
    }
    if (next?.id !== puzzle.id && !(puzzle.id === "correctif" && session.procedureValidated)) {
      setClueText(
        `Commence par « ${next?.title} » (${next?.room}). Les codes se récupèrent dans l’ordre et restent dans ton carnet.`,
      )
      openOverlay("clue")
      return
    }
    setCurrentPuzzleId(puzzle.id)
    setSelectedAnswerId(puzzle.id === "correctif" && session.procedureValidated ? "CDBA" : null)
    setNotice("")
    setSubmitted(null)
    navigate("puzzle")
  }
  const validate = () => {
    const isAdventure = screen === "puzzle"
    if (!selectedAnswerId?.trim()) return
    if (isAdventure && (session.lockouts[activePuzzle.id] ?? 0) > Date.now()) return
    if (
      isAdventure &&
      activePuzzle.scenario?.kind === "algorithm" &&
      selectedAnswerId.split("|")[0].trim() !== "5"
    ) {
      setNotice("Souvenir manquant : consulte ton carnet pour retrouver n.")
      return
    }
    const answer = isAdventure
      ? { id: selectedAnswerId, letter: "⌨", label: selectedAnswerId }
      : demoQuizQuestion.answers.find((a) => a.id === selectedAnswerId)
    if (!answer) return
    const correct = isAdventure
      ? validateScenario(activePuzzle.id, selectedAnswerId)
      : answer.id === demoAnswerKey[demoQuizQuestion.id]
    setSubmitted({
      answer,
      puzzleId: isAdventure ? activePuzzle.id : "reference",
      timeBefore: formatClock(session.gameMinute),
      timeAfter: formatClock(Math.min(960, session.gameMinute + 10)),
    })
    if (isAdventure) {
      if (correct) solve(activePuzzle.id)
      else fail(activePuzzle.id)
      if (activePuzzle.scenario?.kind === "patch") {
        setNotice(
          correct
            ? "Procédure validée. Tu peux appliquer le correctif."
            : "Ordre incorrect : −10 minutes campus. Réorganise les opérations.",
        )
        return
      }
    }
    navigate(correct ? "success" : "failure")
  }
  const complete = (ending: 1 | 2) => {
    if (!session.solvedPuzzleIds.includes("avant-apres")) return
    if (
      ending === 1 &&
      (!session.procedureValidated || !validateScenario("correctif", selectedAnswerId ?? ""))
    )
      return
    finish(ending)
    navigate("end")
  }
  const successFeedback: SuccessFeedback =
    feedbackPuzzle && submitted
      ? {
          characterQuote: "« Un module de moins ! »",
          contextLabel: `${feedbackPuzzle.question.courseLabel} · MODULE RÉPARÉ`,
          answer: submitted.answer,
          explanation: feedbackPuzzle.explanation,
          memoryReward: 1,
          timeLabel: "Fragment de réparation récupéré",
          solved: session.solvedPuzzleIds.length,
          total: 8,
        }
      : {
          ...demoSuccessFeedback,
          ...(submitted ? { answer: submitted.answer } : {}),
        }
  const failureFeedback: FailureFeedback =
    feedbackPuzzle && submitted
      ? {
          characterQuote: "« Je retiens la leçon… »",
          contextLabel: feedbackPuzzle.question.courseLabel,
          answer: submitted.answer,
          timeBefore: submitted.timeBefore,
          timeAfter: submitted.timeAfter,
          penaltyMinutes: 10,
          resetTime: "16:00",
          progress: ((session.gameMinute - 540) / 420) * 100,
          hint: "Consulte le carnet ou demande un souvenir de boucle au terminal.",
        }
      : {
          ...demoFailureFeedback,
          ...(submitted ? { answer: submitted.answer } : {}),
        }
  const ending: EndResult = session.ending
    ? {
        ...demoEndResult,
        total: 8,
        score: Math.max(
          0,
          session.solvedPuzzleIds.length * 1000 - session.mistakes * 150 - session.hintUses * 100,
        ),
        rank: session.mistakes === 0 ? "S" : session.mistakes <= 2 ? "A" : "B",
        totalTime: formatDuration(session.playedSeconds),
        loops: session.loopNumber,
        solved: session.solvedPuzzleIds.length,
        hints: session.hintUses,
        endingNumber: session.ending,
        endingTitle: session.ending === 1 ? "Le correctif complet" : "Tout couper · fin partielle",
        endingDescription:
          session.ending === 1
            ? "Sauvegarde, correction, tests et déploiement : les huit énigmes sont résolues. G4-OS est réparé et la journée dépasse enfin 16h00."
            : "Tu as coupé l’alimentation. La boucle est interrompue, mais G4-OS reste en panne : le correctif n’a pas été déployé.",
        otherEndingUnlocked: session.unlockedEndings.includes(session.ending === 1 ? 2 : 1),
        lockedEndingNumber: session.ending === 1 ? 2 : 1,
        lockedEndingTitle: session.unlockedEndings.includes(session.ending === 1 ? 2 : 1)
          ? session.ending === 1
            ? "Tout couper"
            : "Le correctif"
          : "???",
        lockedEndingDescription: session.unlockedEndings.includes(session.ending === 1 ? 2 : 1)
          ? "Cette fin a déjà été découverte sur ce profil."
          : "Au Co-working, tu peux appliquer le correctif ou choisir de tout couper.",
      }
    : demoEndResult
  const campusData = played
    ? {
        ...mockCampusData,
        playerPosition: {
          x: session.playerPosition.x - 33.6,
          y: session.playerPosition.y - 70.56,
        },
        title: "CARTE DU CAMPUS · CLIQUE SUR UNE SALLE",
      }
    : { ...mockCampusData, playerPosition: referencePosition }
  const pages = {
    launch: (
      <LaunchPage data={launchData} onStart={() => navigate(profiles.profile ? "menu" : "auth")} />
    ),
    auth: (
      <AuthPage
        profiles={profiles.profiles}
        error={profiles.error}
        onLogin={profiles.login}
        onRegister={profiles.register}
        onSuccess={() => navigate("menu")}
        onClearError={profiles.clearError}
      />
    ),
    race: <RacePage nickname={profiles.profile?.nickname ?? ""} onExit={() => navigate("menu")} />,
    menu: (
      <PlayMenuPage
        onQuit={() => navigate("launch")}
        nickname={profiles.profile?.nickname ?? "Explorateur"}
        canContinue={!!profiles.profile && session.started && !session.ending}
        onRace={() => navigate("race")}
        onCampaign={requestStart}
        onContinue={() => navigate("explore")}
        onOptions={() => openOverlay("options")}
        onLogout={profiles.profile ? logout : () => navigate("auth")}
      />
    ),
    intro: (
      <IntroPage
        data={introScenes[introIndex]}
        onNext={() =>
          introIndex < introScenes.length - 1 ? setIntroIndex(introIndex + 1) : navigate("briefing")
        }
        onSkip={() => navigate("briefing")}
      />
    ),
    briefing: (
      <BriefingPage
        data={mockBriefingData}
        onStart={() => {
          if (!profiles.profile) {
            navigate("auth")
            return
          }
          if (!session.started) begin()
          navigate("explore")
        }}
      />
    ),
    explore: (
      <ExplorePage
        onAskHelp={async (roomId) => {
          const next = availablePuzzle(session.solvedPuzzleIds)
          if (!next || next.roomId !== roomId)
            return next
              ? `Ta prochaine étape : ${next.title}, ${next.room}.`
              : "La procédure du Co-working est prête."
          rememberHint(next.id)
          return next.hints[0]
        }}
        helpCost="−5 min campus (gratuit si déjà mémorisé ou aide de Léa)"
        unlockedRoomIds={unlockedRooms(session.solvedPuzzleIds)}
        progress={{ solved: session.solvedPuzzleIds.length, total: 8 }}
        objectiveLabel={
          availablePuzzle(session.solvedPuzzleIds)?.title ?? "Appliquer le correctif au Co-working"
        }
        targetRoomId={availablePuzzle(session.solvedPuzzleIds)?.roomId ?? "cowork"}
        onJournal={() => openOverlay("journal")}
        inventoryKey={inventoryKey}
        escapeDocuments={escapeDocuments}
        playerPosition={session.playerPosition}
        onMove={move}
        onOpenMap={() => navigate("campus")}
        onPause={() => openOverlay("pause")}
        onInteract={interact}
        solvedRoomIds={session.solvedRoomIds}
        active={screen === "explore" && !overlay && !!profiles.profile && !session.ending}
        gameTime={formatClock(session.gameMinute)}
        loopNumber={session.loopNumber}
        hintCount={session.knownHintIds.length}
      />
    ),
    campus: played ? (
      <CampusNavigator
        position={session.playerPosition}
        solvedRoomIds={session.solvedRoomIds}
        targetRoomId={selectedMapRoom}
        onSelectRoom={(id) => {
          setSelectedMapRoom(id as RoomId)
          openOverlay("map-room")
        }}
        onBack={() => navigate("explore")}
      />
    ) : (
      <CampusPage
        data={campusData}
        onSelectRoom={(id) => {
          if (played) {
            setSelectedMapRoom(mapRoomIds[id])
            openOverlay("map-room")
          } else navigate("briefing")
        }}
        onBack={() => navigate(played ? "explore" : "game")}
      />
    ),
    game: (
      <GamePage
        data={{ ...mockGameData, playerPosition: referencePosition }}
        onMove={setReferencePosition}
        onInteract={() => {
          setSubmitted(null)
          navigate("quiz")
        }}
        onOpenMap={() => navigate("campus")}
        onPause={() => openOverlay("pause")}
        isPaused={overlay !== null}
      />
    ),
    quiz: (
      <QuizPage
        question={demoQuizQuestion}
        selectedAnswerId={selectedAnswerId}
        onSelectAnswer={setSelectedAnswerId}
        onValidate={validate}
      />
    ),
    puzzle: (
      <PuzzlePage
        requiredDocumentFound={
          !activePuzzle.practical ||
          readInventory(inventoryKey).includes(activePuzzle.practical.document.id)
        }
        puzzle={activePuzzle}
        selectedAnswerId={selectedAnswerId}
        onSelectAnswer={setSelectedAnswerId}
        onValidate={validate}
        onLeave={() => navigate("explore")}
        loopNumber={session.loopNumber}
        solvedCount={session.solvedPuzzleIds.length}
        gameTime={formatClock(session.gameMinute)}
        hintLevel={session.hintLevels[activePuzzle.id] ?? 0}
        onHint={(level) => rememberHint(activePuzzle.id, level)}
        lockedUntil={session.lockouts[activePuzzle.id] ?? 0}
        freeLightHint={
          session.trustedLea &&
          ["planning", "script", "differences"].includes(activePuzzle.scenario!.kind)
        }
        trustedLea={session.trustedLea}
        onTrustLea={trustLea}
        onJournal={() => openOverlay("journal")}
        onComplete={complete}
        procedureValidated={session.procedureValidated}
        notice={notice}
      />
    ),
    success: (
      <SuccessPage
        feedback={successFeedback}
        onContinue={() => navigate(feedbackPuzzle ? "explore" : "end")}
      />
    ),
    failure: (
      <FailurePage
        feedback={failureFeedback}
        onRetry={() => {
          setSelectedAnswerId(null)
          navigate(feedbackPuzzle ? "puzzle" : "quiz")
        }}
        onLeave={() => navigate(feedbackPuzzle ? "explore" : "game")}
      />
    ),
    end: (
      <EndPage
        result={ending}
        onReplay={requestStart}
        onMenu={() => navigate("menu")}
        onCredits={() => openOverlay("credits")}
      />
    ),
  }
  const overlayTitles: Record<Exclude<Overlay, null>, string> = {
    options: "OPTIONS",
    pause: "PAUSE",
    credits: "CRÉDITS",
    newgame: "NOUVELLE PARTIE",
    clue: "SOUVENIR CONSERVÉ",
    terminal: "CONSOLE DE SORMIOU",
    reboot: "09:00 · UNE NOUVELLE BOUCLE",
    "map-room": WORLD_ROOMS.find((r) => r.id === selectedMapRoom)?.label ?? "SALLE",
    journal: "TES SOUVENIRS",
  }
  return (
    <ScreenViewport
      fluid={screen === "explore" || screen === "puzzle"}
      label={screenLabels[screen]}
      width={screen === "campus" && !played ? 1600 : 1280}
      height={screen === "campus" && !played ? 1100 : 720}
      reducedMotion={reducedMotion}
    >
      <div className="screen-content" inert={overlay !== null}>
        {screen === "explore" || screen === "puzzle" ? (
          <>
            {pages.explore}
            {screen === "puzzle" && !overlay && pages.puzzle}
          </>
        ) : (
          pages[screen]
        )}
      </div>
      {saveError && (
        <p className="save-error" role="status">
          Sauvegarde locale indisponible : garde cet onglet ouvert.
        </p>
      )}
      {overlay && (
        <Dialog
          title={overlayTitles[overlay]}
          onClose={closeOverlay}
          restoreFocusTo={overlayTrigger.current}
        >
          {overlay === "options" && (
            <>
              <ThreeSettings />
            </>
          )}
          {overlay === "pause" && (
            <>
              <p>Ta progression est sauvegardée automatiquement. La journée est en pause.</p>
              <ThreeSettings />
              <div className="flex flex-wrap gap-4">
                <button className="game-button ui-button" onClick={closeOverlay}>
                  REPRENDRE
                </button>
                <button
                  className="game-button ui-button"
                  onClick={() => {
                    saveNow()
                    navigate("menu")
                  }}
                >
                  MENU PRINCIPAL
                </button>
                {profiles.profile && (
                  <button className="game-button ui-button" onClick={logout}>
                    DÉCONNEXION
                  </button>
                )}
              </div>
            </>
          )}
          {overlay === "credits" && (
            <>
              <p>G4 Ever · Institut G4</p>
              <p>
                Illustrations, personnages et cycles de marche : document G4 Ever fourni par
                l’équipe.
              </p>
              <p>Polices Lilita One et Nunito, sous licence SIL Open Font License.</p>
            </>
          )}
          {overlay === "newgame" && (
            <>
              <p>
                Recommencer la partie de ce profil ? Les fins déjà découvertes restent débloquées.
              </p>
              <button className="game-button ui-button" onClick={start}>
                RECOMMENCER
              </button>
            </>
          )}
          {overlay === "clue" && <p>{clueText}</p>}
          {overlay === "reboot" && (
            <>
              <p>
                G4-OS a redémarré à 16:00. Tu es de retour à 09:00 : les modules sont à réparer,
                mais tes souvenirs sont intacts.
              </p>
              <p>
                Boucle n°{session.loopNumber} · {session.memoryIds.length} souvenirs conservés ·{" "}
                {session.mistakes} erreurs · {formatDuration(session.playedSeconds)} jouées.
              </p>
              <button className="game-button ui-button" onClick={closeOverlay}>
                C’EST REPARTI !
              </button>
            </>
          )}
          {overlay === "terminal" && <p>{sormiouClue}</p>}
          {overlay === "map-room" && (
            <>
              <p>
                {session.solvedRoomIds.includes(selectedMapRoom)
                  ? "Module réparé. Tu peux y relire ton dossier."
                  : selectedMapRoom === "sormiou"
                    ? sormiouClue
                    : selectedMapRoom === "vending"
                      ? "Un ticket oublié pourrait contenir un indice."
                      : "Explore cette salle et approche-toi du repère E pour interagir."}
              </p>
              <p className="dialog-small">
                Les couloirs et portes permettent aussi de rejoindre chaque salle à pied.
              </p>
              <button
                className="game-button ui-button"
                disabled={!unlockedRooms(session.solvedPuzzleIds).includes(selectedMapRoom)}
                onClick={() => {
                  if (!unlockedRooms(session.solvedPuzzleIds).includes(selectedMapRoom)) return
                  move(ROOM_SPAWNS[selectedMapRoom])
                  navigate("explore")
                }}
              >
                {unlockedRooms(session.solvedPuzzleIds).includes(selectedMapRoom)
                  ? "REJOINDRE LA SALLE"
                  : "VERROUILLÉ · RÉSOUS L’ÉTAPE PRÉCÉDENTE"}
              </button>
            </>
          )}
          {overlay === "journal" && (
            <div className="journal-list">
              {session.knownHintIds.length === 0 && session.memoryIds.length === 0 ? (
                <p>
                  Aucun souvenir pour le moment. Explore les salles, examine les bornes et apprends
                  de tes erreurs.
                </p>
              ) : (
                <>
                  {puzzles
                    .filter(
                      (p) =>
                        session.knownHintIds.includes(p.id) || session.memoryIds.includes(p.id),
                    )
                    .map((p) => (
                      <article key={p.id}>
                        <strong>{p.title}</strong>
                        <p>{session.memoryIds.includes(p.id) ? p.clue : p.hint}</p>
                        {(session.hintLevels[p.id] ?? 0) >= 2 && <p>{p.scenario?.hints[1]}</p>}
                      </article>
                    ))}
                  {session.hasVendingClue && (
                    <article>
                      <strong>Le ticket des distributeurs</strong>
                      <p>{vendingClue}</p>
                    </article>
                  )}
                </>
              )}
            </div>
          )}
        </Dialog>
      )}
    </ScreenViewport>
  )
}
