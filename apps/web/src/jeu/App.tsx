import {
  SORMIOU_THRESHOLD,
  availablePuzzle,
  canonicalAnswer,
  roomsUnlockedBy,
  unlockedRooms,
  validateScenario,
} from "../../../../shared/scenario"
import { DAY_END } from "../../../../shared/clock"
import { useCallback, useMemo, useEffect, useRef, useState } from "react"
import { ScreenViewport } from "./components/ui/ScreenViewport"
import { Dialog } from "./components/ui/Dialog"
import { useScreen } from "./hooks/useScreen"
import { useProfiles } from "./hooks/useProfiles"
import { useAdventure } from "./hooks/useAdventure"
import type { ScreenId } from "./types/navigation"
import { screenLabels } from "./types/navigation"
import type { EndResult } from "./types/quiz"
import type { PuzzleResult } from "./types/adventure"
import type { BriefingData } from "./types/game"
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
import { mockCampusData, mockGameData } from "./mocks/gameData"
import {
  demoQuizQuestion,
  demoSelectedAnswerId,
  demoAnswerKey,
  demoSuccessFeedback,
  demoFailureFeedback,
  demoEndResult,
} from "./mocks/quizData"
import { campaignDeck } from "./game/campaignDeck"
import { introScenes, vendingClue } from "./game/puzzles"
import { formatClock, formatDuration, hintCost, canCutPower } from "./game/session"
import { DIFFICULTIES, campusRate, rulesFor } from "./game/difficulty"
import type { Difficulty, DifficultyRules } from "./game/difficulty"
import { WORLD_ROOMS } from "./game/world"
import { PUZZLE_SPOT_IDS, spotById } from "./game/spots"
import { playCue } from "./game/sfx"
import "./styles/adventure.css"
import "./styles/experience.css"

type Overlay =
  | "options"
  | "pause"
  | "credits"
  | "newgame"
  | "difficulty"
  | "clue"
  | "terminal"
  | "reboot"
  | "journal"
  | null

interface Banner {
  key: number
  title: string
  text: string
  tone: "unlock" | "warning" | "info"
}

const TOTAL = 8
const roomLabel = (id: string) => WORLD_ROOMS.find((r) => r.id === id)?.label ?? id

function briefingFor(rules: DifficultyRules): BriefingData {
  return {
    alertTitle: "⚠ G4-OS · ALERTE SYSTÈME",
    deadlineLabel: rules.loopMinutes
      ? `Mode ${rules.label} · ${rules.loopMinutes} min réelles · Crash à 16:00`
      : `Mode ${rules.label} · Horloge figée`,
    missionTitle: "Remonte à l’origine du bug et répare G4-OS avant 16h00.",
    cards: [
      {
        id: "puzzles",
        icon: "question",
        title: "Huit énigmes en chaîne",
        description:
          "Chaque énigme résolue ouvre la suite : Réfectoire, Sugiton, Sainte Victoire, Mont Ventoux, puis le Co-working.",
      },
      {
        id: "memories",
        icon: "hint",
        title: "Indices et mémos",
        description: rules.hintCosts[0]
          ? `Trois niveaux d’indice (−${rules.hintCosts.join(", −")} min campus). Les mémos techniques sont gratuits.`
          : "Trois niveaux d’indice et des mémos techniques, tous gratuits.",
      },
      {
        id: "loop",
        icon: "clock",
        title: rules.loopMinutes ? "À 16:00, tout recommence" : "Prends ton temps",
        description: rules.loopMinutes
          ? "Retour à 9h00, portes refermées. Mais tu te souviens de tout : une énigme déjà résolue se valide en un clic."
          : "L’horloge ne tourne pas dans ce mode. Explore, lis les mémos et résous chaque énigme à ton rythme.",
      },
    ],
    startLabel: "LANCER LA JOURNÉE",
  }
}

function endingResult(
  session: ReturnType<typeof useAdventure>["session"],
  rules: DifficultyRules,
): EndResult {
  if (!session.ending) return demoEndResult
  const multiplier = rules.id === "expert" ? 1.5 : rules.id === "relax" ? 0.5 : 1
  const raw =
    session.solvedPuzzleIds.length * 1000 +
    (session.ending === 1 ? 2000 : 0) -
    session.mistakes * 100 -
    session.hintUses * 120 -
    (session.loopNumber - 1) * 400
  const score = Math.max(0, Math.round(raw * multiplier))
  const rank = score >= 9000 ? "S" : score >= 7000 ? "A" : score >= 5000 ? "B" : "C"
  const other = session.ending === 1 ? 2 : 1
  const otherUnlocked = session.unlockedEndings.includes(other)
  return {
    ...demoEndResult,
    total: TOTAL,
    score,
    rank,
    totalTime: formatDuration(session.playedSeconds),
    loops: session.loopNumber,
    solved: session.solvedPuzzleIds.length,
    hints: session.hintUses,
    endingNumber: session.ending,
    headline: session.ending === 1 ? "LA BOUCLE EST BRISÉE !" : "LE SILENCE APRÈS 16H00",
    endingTitle: session.ending === 1 ? "Le correctif complet" : "Tout couper · fin partielle",
    endingDescription:
      session.ending === 1
        ? "Sauvegarde, correction, tests et déploiement : les huit énigmes sont résolues. G4-OS est réparé et, pour la première fois, l’horloge affiche 16h01."
        : "Tu as abaissé le disjoncteur de Sormiou. La boucle s’arrête net… mais G4-OS reste en panne et le campus plonge dans le noir. Le vrai correctif t’attend encore au Co-working.",
    otherEndingUnlocked: otherUnlocked,
    lockedEndingNumber: other,
    lockedEndingTitle: otherUnlocked ? (other === 1 ? "Le correctif" : "Tout couper") : "???",
    lockedEndingDescription: otherUnlocked
      ? "Cette fin a déjà été découverte sur ce profil."
      : other === 1
        ? "Résous les huit énigmes et applique le correctif au Co-working."
        : "Après cinq énigmes, la salle serveur de Sormiou cache un raccourci… risqué.",
  }
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
  const [engaged, setEngaged] = useState(false)
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
    // L'horloge ne tourne que lorsque le joueur est vraiment dans le campus ou devant une énigme.
    ((screen === "explore" && engaged) || screen === "puzzle") && !overlay,
  )
  const rules = rulesFor(session.difficulty)
  const puzzles = useMemo(() => campaignDeck(session.challengeSeed), [session.challengeSeed])
  const inventoryKey = `story:${profiles.profile?.id}:${session.challengeSeed ?? "legacy"}`
  const escapeDocuments = useMemo(
    () => puzzles.flatMap((p) => (p.practical ? [p.practical.document] : [])),
    [puzzles],
  )
  const [introIndex, setIntroIndex] = useState(0)
  const [answer, setAnswer] = useState<string | null>(null)
  const [demoAnswerId, setDemoAnswerId] = useState<string | null>(demoSelectedAnswerId)
  const [demoSubmitted, setDemoSubmitted] = useState(false)
  const [currentPuzzleId, setCurrentPuzzleId] = useState<string | null>(null)
  const [result, setResult] = useState<PuzzleResult | null>(null)
  const [notice, setNotice] = useState("")
  const [clue, setClue] = useState({ title: "SOUVENIR CONSERVÉ", text: "" })
  const [banner, setBanner] = useState<Banner | null>(null)
  const [referencePosition, setReferencePosition] = useState(mockGameData.playerPosition)
  const overlayTrigger = useRef<HTMLElement | null>(null)
  const openOverlay = useCallback((next: Exclude<Overlay, null>) => {
    overlayTrigger.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOverlay(next)
  }, [])
  const closeOverlay = useCallback(() => setOverlay(null), [])
  const announce = useCallback((title: string, text: string, tone: Banner["tone"] = "info") => {
    setBanner({ key: Date.now(), title, text, tone })
  }, [])
  const played = !!profiles.profile && session.started
  const nextPuzzle = availablePuzzle(session.solvedPuzzleIds)
  const activePuzzle =
    puzzles.find((p) => p.id === currentPuzzleId) ??
    puzzles.find((p) => p.id === nextPuzzle?.id) ??
    puzzles[puzzles.length - 1]

  useEffect(() => {
    document.title = "G4EVER"
    setOverlay(null)
    if (screen !== "explore") setEngaged(false)
  }, [screen])
  useEffect(() => {
    if (screen === "puzzle" && !currentPuzzleId && nextPuzzle) setCurrentPuzzleId(nextPuzzle.id)
  }, [screen, currentPuzzleId, nextPuzzle])
  useEffect(() => {
    if (!banner) return
    const t = window.setTimeout(() => setBanner(null), 4200)
    return () => window.clearTimeout(t)
  }, [banner])
  useEffect(() => {
    if ((screen === "explore" || screen === "puzzle") && !profiles.profile) navigate("auth")
    if ((screen === "explore" || screen === "puzzle") && profiles.profile && !session.started)
      navigate("menu")
  }, [screen, profiles.profile, session.started, navigate])
  useEffect(() => {
    if (session.event === "reboot") {
      if (screen !== "explore" && screen !== "puzzle") return
      if (screen === "puzzle") {
        navigate("explore")
        return
      }
      playCue("alarm")
      openOverlay("reboot")
      dismissEvent()
      setResult(null)
      setCurrentPuzzleId(null)
      setAnswer(null)
    }
  }, [session.event, screen, navigate, openOverlay, dismissEvent])
  // Alertes d'horloge : une heure, puis quinze minutes avant le crash.
  const warned = useRef(new Set<string>())
  useEffect(() => {
    if (!session.started || session.ending || !rules.loopMinutes) return
    const marks = [
      { at: DAY_END - 60, title: "15:00", text: "Plus qu’une heure avant le crash de 16h00." },
      { at: DAY_END - 15, title: "15:45", text: "Le crash approche ! Il reste quinze minutes." },
    ]
    for (const mark of marks) {
      const id = `${session.loopNumber}:${mark.at}`
      if (session.gameMinute < mark.at || warned.current.has(id)) continue
      warned.current.add(id)
      playCue("tick")
      announce(mark.title, mark.text, "warning")
    }
  }, [session.gameMinute, session.loopNumber, session.started, session.ending, rules, announce])

  const start = (difficulty: Difficulty) => {
    if (!profiles.profile) {
      navigate("auth")
      return
    }
    begin(difficulty)
    setIntroIndex(0)
    setAnswer(null)
    setResult(null)
    setCurrentPuzzleId(null)
    setNotice("")
    warned.current.clear()
    navigate("intro")
  }
  const requestStart = () => {
    if (played && !session.ending) openOverlay("newgame")
    else openOverlay("difficulty")
  }
  const logout = () => {
    saveNow()
    profiles.logout()
    setResult(null)
    navigate("auth")
  }
  const showClue = (title: string, text: string) => {
    setClue({ title, text })
    openOverlay("clue")
  }
  const interact = (spotId: string) => {
    if (spotId === "vending") {
      collectClue()
      playCue("memory")
      showClue("LE TICKET DES DISTRIBUTEURS", vendingClue)
      return
    }
    if (spotId === "sormiou") {
      openOverlay("terminal")
      return
    }
    if (spotId === "sormiou-exit") return
    if (spotId === "cowork" && session.solvedPuzzleIds.includes("correctif")) {
      // Procédure validée mais correctif pas encore appliqué : on rouvre l'écran final.
      setCurrentPuzzleId("correctif")
      setResult({ status: "correct", key: Date.now(), message: "" })
      navigate("puzzle")
      return
    }
    // Chaque énigme a son propre emplacement : on retrouve celle qui se trouve ici.
    const puzzle = puzzles.find((p) => PUZZLE_SPOT_IDS[p.id] === spotId)
    if (!puzzle) {
      showClue(
        `${roomLabel(spotById(spotId)?.roomId ?? spotId).toUpperCase()}`,
        "Rien de plus à trouver ici.",
      )
      return
    }
    if (session.solvedPuzzleIds.includes(puzzle.id)) {
      showClue(`${puzzle.title.toUpperCase()} · RÉSOLUE`, puzzle.clue)
      return
    }
    if (nextPuzzle?.id !== puzzle.id) {
      showClue(
        "PAS ENCORE…",
        `Il te manque une information pour t’occuper de ça. Commence par « ${nextPuzzle?.title} » (${nextPuzzle?.room}) : suis la balise lumineuse.`,
      )
      return
    }
    setCurrentPuzzleId(puzzle.id)
    setAnswer(null)
    setNotice("")
    setResult(null)
    navigate("puzzle")
  }
  const succeed = (fromMemory: boolean) => {
    const unlocked = roomsUnlockedBy(activePuzzle.id, session.solvedPuzzleIds).map(roomLabel)
    // On fige l'énigme affichée : sans cela, l'écran basculerait sur l'énigme suivante.
    setCurrentPuzzleId(activePuzzle.id)
    solve(activePuzzle.id)
    setResult({
      status: "correct",
      key: Date.now(),
      message: "",
      fromMemory,
      unlockedLabels: unlocked.map((label) =>
        label === "Sormiou" ? "Salle serveur de Sormiou ouverte" : `Porte de ${label} ouverte`,
      ),
    })
    playCue(fromMemory ? "memory" : "success")
    if (unlocked.length) window.setTimeout(() => playCue("unlock"), 650)
  }
  const validate = () => {
    if (!answer?.trim()) return
    if (activePuzzle.scenario?.kind === "algorithm" && answer.split("|")[0].trim() !== "5") {
      setNotice("Ce n’est pas la bonne valeur de n : retrouve le souvenir du café dans ton carnet.")
      playCue("error")
      return
    }
    setNotice("")
    if (validateScenario(activePuzzle.id, answer)) {
      succeed(false)
      return
    }
    fail(activePuzzle.id)
    playCue("error")
    setResult({
      status: "wrong",
      key: Date.now(),
      message: rules.wrongAnswerMinutes
        ? `Ce n’est pas ça… −${rules.wrongAnswerMinutes} min campus. Relis l’énoncé ou ouvre un indice.`
        : "Ce n’est pas ça… Relis l’énoncé ou ouvre un indice.",
    })
  }
  const recallMemory = () => {
    setAnswer(canonicalAnswer(activePuzzle.id))
    succeed(true)
  }
  const leavePuzzle = () => {
    const wasSolved = result?.status === "correct"
    const labels = result?.unlockedLabels ?? []
    setResult(null)
    setCurrentPuzzleId(null)
    navigate("explore")
    if (wasSolved && labels.length) announce("🔓 ACCÈS DÉVERROUILLÉ", labels.join(" · "), "unlock")
    else if (wasSolved) {
      const next = availablePuzzle([...session.solvedPuzzleIds])
      if (next) announce("OBJECTIF SUIVANT", `${next.title} · ${next.room}`)
    }
  }
  const applyFix = () => {
    if (!session.solvedPuzzleIds.includes("correctif")) return
    finish(1)
    playCue("success")
    navigate("end")
  }
  const cutPower = () => {
    if (!canCutPower(session)) return
    finish(2)
    playCue("power")
    navigate("end")
  }
  const ending = endingResult(session, rules)
  const unlocked = unlockedRooms(session.solvedPuzzleIds)
  const targetRoomId = nextPuzzle?.roomId ?? "cowork"
  const rate = campusRate(session.difficulty)
  const remainingSeconds = rate ? Math.max(0, (DAY_END - session.gameMinute) / rate) : null
  const timeLabel =
    remainingSeconds === null
      ? "HORLOGE FIGÉE"
      : `CRASH DANS ${formatDuration(Math.ceil(remainingSeconds))}`
  const urgent = remainingSeconds !== null && session.gameMinute >= DAY_END - 60
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
        progress={
          session.started && !session.ending
            ? `${session.solvedPuzzleIds.length}/${TOTAL} énigmes · boucle ${session.loopNumber} · ${rules.label}`
            : undefined
        }
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
        data={briefingFor(rules)}
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
          if (!next) return "Tout est prêt : applique le correctif au Co-working."
          if (next.roomId !== roomId) return `Ta prochaine étape : « ${next.title} », ${next.room}.`
          const level = Math.min(2, (session.hintLevels[next.id] ?? 0) + 1) as 1 | 2
          rememberHint(next.id, level)
          playCue("hint")
          return next.hints[level - 1]
        }}
        helpCost={
          nextPuzzle && rules.hintCosts[0]
            ? `Un indice coûte −${hintCost(session, nextPuzzle.id, 1)} min campus (gratuit s’il est déjà connu).`
            : "Les indices sont gratuits dans ce mode."
        }
        unlockedRoomIds={unlocked}
        progress={{
          solved: session.solvedPuzzleIds.length,
          total: TOTAL,
        }}
        objectiveLabel={
          nextPuzzle
            ? nextPuzzle.title
            : session.solvedPuzzleIds.includes("correctif")
              ? "Appliquer le correctif au Co-working"
              : "Rejoindre le Co-working"
        }
        objectiveRoom={nextPuzzle?.room ?? "Co-working"}
        targetRoomId={targetRoomId}
        targetSpotId={nextPuzzle ? PUZZLE_SPOT_IDS[nextPuzzle.id] : "cowork"}
        onJournal={() => openOverlay("journal")}
        inventoryKey={inventoryKey}
        escapeDocuments={escapeDocuments}
        playerPosition={session.playerPosition}
        onMove={move}
        onEngage={setEngaged}
        mapOpen={screen === "campus"}
        onOpenMap={() => navigate("campus")}
        onPause={() => openOverlay("pause")}
        onInteract={interact}
        solvedRoomIds={session.solvedRoomIds}
        active={screen === "explore" && !overlay && !!profiles.profile && !session.ending}
        gameTime={formatClock(session.gameMinute)}
        timeLabel={timeLabel}
        urgent={urgent}
        loopNumber={session.loopNumber}
        hintCount={session.memoryIds.length}
      />
    ),
    campus: played ? (
      <CampusNavigator
        position={session.playerPosition}
        solvedRoomIds={session.solvedRoomIds}
        unlockedRoomIds={unlocked}
        targetRoomId={targetRoomId}
        onBack={() => navigate("explore")}
      />
    ) : (
      <CampusPage
        data={campusData}
        onSelectRoom={() => navigate("briefing")}
        onBack={() => navigate(played ? "explore" : "game")}
      />
    ),
    game: (
      <GamePage
        data={{ ...mockGameData, playerPosition: referencePosition }}
        onMove={setReferencePosition}
        onInteract={() => {
          setDemoSubmitted(false)
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
        selectedAnswerId={demoAnswerId}
        onSelectAnswer={setDemoAnswerId}
        onValidate={() => {
          if (!demoAnswerId) return
          setDemoSubmitted(true)
          navigate(demoAnswerId === demoAnswerKey[demoQuizQuestion.id] ? "success" : "failure")
        }}
      />
    ),
    puzzle: (
      <PuzzlePage
        puzzle={activePuzzle}
        selectedAnswerId={answer}
        onSelectAnswer={(value) => {
          setAnswer(value)
          if (result?.status === "wrong") setResult(null)
        }}
        onValidate={validate}
        onLeave={leavePuzzle}
        result={result}
        remembered={
          session.memoryIds.includes(activePuzzle.id) &&
          !session.solvedPuzzleIds.includes(activePuzzle.id)
        }
        onUseMemory={recallMemory}
        loopNumber={session.loopNumber}
        solvedCount={session.solvedPuzzleIds.length}
        total={TOTAL}
        gameTime={formatClock(session.gameMinute)}
        timeLabel={timeLabel}
        hintLevel={session.hintLevels[activePuzzle.id] ?? 0}
        hintCosts={[
          hintCost(session, activePuzzle.id, 1),
          hintCost(session, activePuzzle.id, 2),
          hintCost(session, activePuzzle.id, 3),
        ]}
        onHint={(level) => {
          rememberHint(activePuzzle.id, level)
          playCue("hint")
        }}
        trustedLea={session.trustedLea}
        leaCost={rules.leaHelpMinutes}
        onTrustLea={trustLea}
        onJournal={() => openOverlay("journal")}
        onApplyFix={applyFix}
        notice={notice}
        wrongAnswerMinutes={rules.wrongAnswerMinutes}
      />
    ),
    success: (
      <SuccessPage
        feedback={{
          ...demoSuccessFeedback,
          ...(demoSubmitted
            ? {
                answer:
                  demoQuizQuestion.answers.find((a) => a.id === demoAnswerId) ??
                  demoSuccessFeedback.answer,
              }
            : {}),
        }}
        onContinue={() => navigate("end")}
      />
    ),
    failure: (
      <FailurePage
        feedback={{
          ...demoFailureFeedback,
          ...(demoSubmitted
            ? {
                answer:
                  demoQuizQuestion.answers.find((a) => a.id === demoAnswerId) ??
                  demoFailureFeedback.answer,
              }
            : {}),
        }}
        onRetry={() => {
          setDemoAnswerId(null)
          navigate("quiz")
        }}
        onLeave={() => navigate("game")}
      />
    ),
    end: (
      <EndPage
        result={ending}
        difficultyLabel={session.ending ? rules.label : undefined}
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
    difficulty: "CHOISIS TON MODE",
    clue: clue.title,
    terminal: "CONSOLE DE SORMIOU",
    reboot: "09:00 · UNE NOUVELLE BOUCLE",
    journal: "CARNET DE SOUVENIRS",
  }
  const inWorld = screen === "explore" || screen === "puzzle" || (screen === "campus" && played)
  return (
    <ScreenViewport
      fluid={inWorld || screen === "race"}
      label={screenLabels[screen]}
      width={screen === "campus" && !played ? 1600 : 1280}
      height={screen === "campus" && !played ? 1100 : 720}
      reducedMotion={reducedMotion}
    >
      <div className="screen-content" inert={overlay !== null}>
        {inWorld ? (
          <>
            <div className="campus-world-layer" inert={screen === "campus"}>
              {pages.explore}
            </div>
            {screen === "campus" && <div className="campus-map-layer">{pages.campus}</div>}
            {screen === "puzzle" && !overlay && pages.puzzle}
            {banner && screen === "explore" && (
              <div
                className={`game-banner game-banner--${banner.tone}`}
                key={banner.key}
                role="status"
              >
                <small>{banner.title}</small>
                <strong>{banner.text}</strong>
              </div>
            )}
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
          className={`dialog-card--${overlay}`}
        >
          {overlay === "options" && <ThreeSettings />}
          {overlay === "pause" && (
            <>
              <p>
                La journée est en pause. Ta progression est sauvegardée automatiquement sur cet
                appareil.
              </p>
              <ThreeSettings />
              <div className="flex flex-wrap gap-4 pause-actions">
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
              <p>G4EVER · Institut G4</p>
              <p>
                Illustrations, personnages et cycles de marche : document G4EVER fourni par
                l’équipe.
              </p>
              <p>Modèles et textures 3D : Poly Haven et ambientCG (CC0).</p>
              <p>Polices Lilita One et Nunito, sous licence SIL Open Font License.</p>
            </>
          )}
          {overlay === "newgame" && (
            <>
              <p>
                Une partie est déjà en cours ({session.solvedPuzzleIds.length}/{TOTAL} énigmes,
                boucle {session.loopNumber}). La recommencer effacera cette progression ; les fins
                déjà découvertes restent débloquées.
              </p>
              <div className="flex flex-wrap gap-4 pause-actions">
                <button className="game-button ui-button" onClick={() => openOverlay("difficulty")}>
                  RECOMMENCER
                </button>
                <button
                  className="game-button ui-button"
                  onClick={() => {
                    closeOverlay()
                    navigate("explore")
                  }}
                >
                  CONTINUER LA PARTIE
                </button>
              </div>
            </>
          )}
          {overlay === "difficulty" && (
            <div className="difficulty-picker" role="list">
              {(Object.values(DIFFICULTIES) as DifficultyRules[]).map((mode) => (
                <button
                  key={mode.id}
                  role="listitem"
                  className={`difficulty-card difficulty-card--${mode.id}`}
                  onClick={() => start(mode.id)}
                  aria-label={`Mode ${mode.label}`}
                >
                  <small>{mode.tagline}</small>
                  <strong>{mode.label}</strong>
                  <p>{mode.description}</p>
                  {mode.id === "classic" && <i>Recommandé</i>}
                </button>
              ))}
            </div>
          )}
          {overlay === "clue" && <p className="clue-text">{clue.text}</p>}
          {overlay === "reboot" && (
            <>
              <p>
                16:00. Les écrans virent au rouge, puis tout s’éteint. Tu rouvres les yeux au
                réfectoire : il est de nouveau 9h00 et les portes se sont refermées.
              </p>
              <p>
                <b>Mais tu te souviens de tout.</b> Chaque énigme déjà résolue se valide maintenant
                en un clic grâce à ton carnet.
              </p>
              <p className="reboot-stats">
                Boucle n°{session.loopNumber} · {session.memoryIds.length} souvenir
                {session.memoryIds.length > 1 ? "s" : ""} · {session.mistakes} erreur
                {session.mistakes > 1 ? "s" : ""} · {formatDuration(session.playedSeconds)} jouées
              </p>
              <button className="game-button ui-button" onClick={closeOverlay}>
                C’EST REPARTI !
              </button>
            </>
          )}
          {overlay === "terminal" && (
            <div className="console-panel">
              <pre>
                {`G4-OS · CONSOLE CENTRALE DE SORMIOU
> état ............ BOUCLE ACTIVE (16:00 → 09:00)
> énigmes résolues  ${session.solvedPuzzleIds.length}/${TOTAL}
> disjoncteur ..... ${canCutPower(session) ? "ACCESSIBLE" : "VERROUILLÉ"}`}
              </pre>
              {canCutPower(session) ? (
                <>
                  <p>
                    Le disjoncteur général est à portée de main. Le couper arrêtera la boucle… mais
                    G4-OS restera en panne. La vraie réparation se fait au Co-working.
                  </p>
                  <div className="flex flex-wrap gap-4 pause-actions">
                    <button className="game-button ui-button console-danger" onClick={cutPower}>
                      COUPER L’ALIMENTATION · FIN PARTIELLE
                    </button>
                    <button className="game-button ui-button" onClick={closeOverlay}>
                      CONTINUER L’ENQUÊTE
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  Résous encore {Math.max(0, SORMIOU_THRESHOLD - session.solvedPuzzleIds.length)}{" "}
                  énigme(s) pour accéder au disjoncteur.
                </p>
              )}
            </div>
          )}
          {overlay === "journal" && (
            <div className="journal-list">
              {puzzles.map((p, index) => {
                const solvedNow = session.solvedPuzzleIds.includes(p.id)
                const remembered = session.memoryIds.includes(p.id)
                const level = session.hintLevels[p.id] ?? 0
                const known = solvedNow || remembered || level > 0 || p.id === nextPuzzle?.id
                return (
                  <article
                    key={p.id}
                    className={`journal-entry${solvedNow ? " is-solved" : remembered ? " is-remembered" : ""}${known ? "" : " is-unknown"}`}
                  >
                    <span className="journal-index">{index + 1}</span>
                    <div>
                      <strong>{known ? p.title : "Énigme inconnue"}</strong>
                      <small>
                        {solvedNow
                          ? `Résolue · ${p.scenario?.room}`
                          : remembered
                            ? "Souvenir d’une boucle précédente"
                            : known
                              ? `En cours · ${p.scenario?.room}`
                              : "À découvrir"}
                      </small>
                      {(solvedNow || remembered) && <p>{p.clue}</p>}
                      {!solvedNow &&
                        !remembered &&
                        p.scenario?.hints
                          .slice(0, level)
                          .map((hint) => <p key={hint}>💡 {hint}</p>)}
                    </div>
                  </article>
                )
              })}
              {session.hasVendingClue && (
                <article className="journal-entry is-remembered">
                  <span className="journal-index">?</span>
                  <div>
                    <strong>Le ticket des distributeurs</strong>
                    <p>{vendingClue}</p>
                  </div>
                </article>
              )}
            </div>
          )}
        </Dialog>
      )}
    </ScreenViewport>
  )
}
