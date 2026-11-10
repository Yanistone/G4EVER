import { ScenarioExhibit } from "../components/game/ScenarioExhibit"
import { spotRoom } from "../game/spots"
import {
  GAME_DURATION_MINUTES,
  DAY_END,
  campusMinuteAt,
  remainingMilliseconds,
  formatCampusClock,
} from "../../../../../shared/clock"
import "../styles/scenario.css"
import { DOCUMENT_POSITIONS } from "../game/escape"
import { readInventory, storeDocuments } from "../three/inventory"
import { ThreeSettings } from "../components/game/ThreeSettings"
import { BrandMark } from "../components/game/BrandMark"
import { useEffect, useRef, useState } from "react"
import { useRace } from "../hooks/useRace"
import { ExplorePage } from "./ExplorePage"
import { CampusNavigator } from "../components/game/CampusNavigator"
import { MISSIONS } from "../../../../../shared/missions"
import { Dialog } from "../components/ui/Dialog"
import { WORLD_ROOMS } from "../game/world"
import type { PublicQuestion, RaceSnapshot } from "../../../../../shared/race"
import "../styles/race.css"
import "../styles/cartoon.css"
const clock = (ms: number) =>
  `${Math.floor(Math.max(0, ms) / 60000)
    .toString()
    .padStart(2, "0")}:${Math.floor((Math.max(0, ms) / 1000) % 60)
    .toString()
    .padStart(2, "0")}`
function Board({
  state,
  meId,
  compact = false,
}: {
  state: RaceSnapshot
  meId: string
  compact?: boolean
}) {
  return (
    <div className={`race-board ${compact ? "is-compact" : ""}`}>
      <div className="board-head">
        <span>RANG / JOUEUR</span>
        <span>MODULES</span>
        <span>SCORE</span>
        <span>TEMPS</span>
      </div>
      {state.ranking
        .filter((p) => !p.left || p.answered > 0)
        .map((p, index) => (
          <div className={`board-row ${p.id === meId ? "is-me" : ""}`} key={p.id}>
            <span>
              <b className={`rank rank-${index + 1}`}>{index + 1}</b>
              <strong>{p.nickname}</strong>
              {p.id === meId && <small>TOI</small>}
              {p.left && <small>PARTI</small>}
            </span>
            <span>{p.solvedRoomIds.length}/5</span>
            <span>{p.score.toLocaleString("fr-FR")}</span>
            <span>
              {p.finishedAt
                ? clock(p.finishedAt - state.startsAt!)
                : state.phase === "finished"
                  ? "Inachevé"
                  : "En course"}
            </span>
          </div>
        ))}
    </div>
  )
}
export function RacePage({ nickname, onExit }: { nickname: string; onExit: () => void }) {
  const race = useRace()
  const { state, credentials, pending, error, connected } = race
  const [name, setName] = useState(nickname)
  const [code, setCode] = useState("")
  const [view, setView] = useState<"world" | "map" | "question" | "feedback">("world")
  const [question, setQuestion] = useState<PublicQuestion | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<RaceSnapshot["lastResult"]>()
  const [dialog, setDialog] = useState<
    "pause" | "help" | "terminal" | "clue" | "board" | "exit" | null
  >(null)
  const [target, setTarget] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const [now, setNow] = useState(Date.now())
  const [localPosition, setLocalPosition] = useState({ x: 690, y: 590 })
  const [campusEntered, setCampusEntered] = useState(
    () => !!sessionStorage.getItem("g4-ever:race-help"),
  )
  const initialized = useRef("")
  const restoredPause = useRef(false)
  const me = state?.players.find((p) => p.id === state.meId)
  const inventoryKey =
    state && me ? "race:" + state.code + ":" + state.round + ":" + me.id : "race:pending"
  const raceDocuments = state
    ? storeDocuments(
        inventoryKey,
        state.questions
          .filter((q) => q.kind === "code")
          .map((q) => ({
            id: "race:" + q.id,
            name: MISSIONS[q.roomId]?.object ?? "Document technique",
            icon: "▤",
            room: q.roomId,
            position: DOCUMENT_POSITIONS[q.roomId],
            text: q.exhibit ?? "",
          })),
      )
    : []
  const requiredDocument = question?.kind === "code" ? "race:" + question.id : null
  const documentFound = !requiredDocument || readInventory(inventoryKey).includes(requiredDocument)
  const host = state?.hostId === state?.meId
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [])
  useEffect(() => {
    if (state && me && initialized.current !== `${state.code}:${state.round}`) {
      initialized.current = `${state.code}:${state.round}`
      setLocalPosition(me.position)
      setView("world")
      setDialog(null)
      setQuestion(null)
      setTarget("")
    }
  }, [state, me])
  useEffect(() => {
    if (state?.phase === "playing" && !sessionStorage.getItem("g4-ever:race-help")) {
      setDialog("help")
      sessionStorage.setItem("g4-ever:race-help", "seen")
    }
  }, [state?.phase])
  useEffect(() => {
    if (me?.pauseStartedAt != null) {
      if (!restoredPause.current) {
        restoredPause.current = true
        setDialog("pause")
      }
    } else {
      restoredPause.current = false
    }
  }, [me?.pauseStartedAt])
  const offset = useRef(0)
  useEffect(() => {
    if (state) offset.current = state.serverNow - Date.now()
  }, [state])
  const time = now + offset.current
  const playerTime = me ? (me.pauseStartedAt ?? time) - (me.pausedMilliseconds ?? 0) : time
  const remaining = state?.startsAt
    ? remainingMilliseconds(state.startsAt, me?.finishedAt ?? playerTime, me?.penaltyMinutes ?? 0)
    : 0
  const campusMinute = me?.timedOut
    ? DAY_END
    : state?.startsAt
      ? campusMinuteAt(state.startsAt, me?.finishedAt ?? playerTime, me?.penaltyMinutes ?? 0)
      : 540
  const campusTime = formatCampusClock(campusMinute)
  const lockedSeconds = Math.max(0, Math.ceil(((question?.lockedUntil ?? 0) - playerTime) / 1000))
  const expired = !!me?.timedOut || (state?.phase === "playing" && remaining <= 0)
  const move = (position: { x: number; y: number }) => {
    setLocalPosition(position)
    race.move(position)
  }
  const interact = async (spotId: string) => {
    // Les emplacements d'énigme de l'aventure (étagère, tableau…) ouvrent la question de leur salle.
    const roomId = spotRoom(spotId)
    if (!state || !me) return
    if (roomId === "sormiou") {
      setDialog("terminal")
      return
    }
    if (roomId === "vending") {
      const result = await race.act("clue")
      if (result) setDialog("clue")
      return
    }
    if (me.solvedRoomIds.includes(roomId)) {
      setTarget("Ce module est réparé. Explore une autre salle.")
      return
    }
    const q = state.questions.find((q) => q.roomId === roomId)
    if (!q) return
    const result = await race.act("open", { questionId: q.id })
    if (result) {
      setQuestion(result.questions.find((item) => item.roomId === roomId) ?? q)
      setSelected(null)
      setView("question")
    }
  }
  const answer = async () => {
    if (!question || selected === null || lockedSeconds > 0) return
    const result = await race.act("answer", {
      questionId: question.id,
      ...(question.kind === "code" ? { answerText: selected } : { answerId: selected }),
    })
    if (result?.lastResult) {
      setQuestion(result.questions.find((q) => q.id === question.id) ?? question)
      setFeedback(result.lastResult)
      setView("feedback")
    }
  }
  const next = async () => {
    if (feedback?.correct && !feedback.roomComplete && question) {
      const q = state?.questions.find((q) => q.roomId === question.roomId)
      if (q) {
        const result = await race.act("open", { questionId: q.id })
        if (result) {
          setQuestion(q)
          setSelected(null)
          setView("question")
          return
        }
      }
    }
    if (feedback && !feedback.correct) {
      setSelected(null)
      setView("question")
      return
    }
    setView("world")
    setQuestion(null)
  }
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (view !== "question" || dialog || pending || lockedSeconds > 0) return
      if (/^[1-4]$/.test(e.key) && question && question.kind !== "code") {
        setSelected(question.answers[Number(e.key) - 1]?.id ?? null)
        e.preventDefault()
      }
      if (e.key === "Enter" && selected !== null) {
        e.preventDefault()
        void answer()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })
  const hint = async () => {
    if (!question) return
    const result = await race.act("hint", { questionId: question.id })
    if (result) setQuestion(result.questions.find((q) => q.id === question.id) ?? question)
  }
  const pauseGame = async () => {
    const result = await race.act("pause")
    if (result) setDialog("pause")
  }
  const resumeGame = async () => {
    const result = await race.act("resume")
    if (result) {
      if (question) setQuestion(result.questions.find((q) => q.id === question.id) ?? question)
      setDialog(null)
    }
  }
  const exit = async () => {
    await race.leave()
    onExit()
  }
  const share = async () => {
    if (!state) return
    try {
      const url = new URL(location.href)
      url.hash = "race"
      url.searchParams.set("join", state.code)
      await navigator.clipboard.writeText(url.toString())
      setCopyStatus("Lien copié !")
    } catch {
      setCopyStatus(`Code : ${state.code}`)
    }
  }
  useEffect(() => {
    const join = new URLSearchParams(location.search).get("join")
    if (join) setCode(join.toUpperCase().slice(0, 6))
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && view !== "world" && !dialog) {
        setView("world")
        e.preventDefault()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [view, dialog])
  if (!state)
    return (
      <div className="race-screen race-hub">
        <div className="race-grid" />
        <header className="race-header">
          <button className="r-btn r-btn-ghost" onClick={onExit}>
            ← Menu
          </button>
          <BrandMark />
          <span className="hub-online">SALONS SYNCHRONISÉS</span>
        </header>
        <div className="hub-intro">
          <div className="eyebrow">LE MÊME CAMPUS. LA MÊME CHANCE.</div>
          <h1>
            Qui sortira <em>en premier ?</em>
          </h1>
          <p>Répare les cinq modules, rejoins Sormiou et valide ton évasion avant tes amis.</p>
        </div>
        <div className="hub-settings">
          <label>
            TON PSEUDO
            <input
              value={name}
              maxLength={24}
              minLength={2}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="hub-duration" role="note">
            <strong>15 minutes · 09:00 → 16:00</strong>
            <p>Durée fixe. Chaque erreur avance l’heure du campus de 10 minutes.</p>
          </div>
        </div>
        <div className="hub-cards">
          <section className="hub-card">
            <span className="mode-icon">⚡</span>
            <h2>Créer une course</h2>
            <p>
              Invite jusqu’à 7 amis avec un code.
              <br />
              Le départ attend que tout le monde soit prêt.
            </p>
            <button
              className="r-btn r-btn-gold"
              disabled={pending || name.trim().length < 2}
              onClick={() =>
                race.act("create", {
                  nickname: name,
                  mode: "friends",
                  durationMinutes: GAME_DURATION_MINUTES,
                })
              }
            >
              CRÉER UN SALON →
            </button>
          </section>
          <section className="hub-card">
            <span className="mode-icon">↗</span>
            <h2>Rejoindre les potes</h2>
            <label className="code-label">
              CODE DU SALON
              <input
                aria-label="Code du salon"
                value={code}
                maxLength={6}
                autoComplete="off"
                placeholder="ABC123"
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
              />
            </label>
            <button
              className="r-btn r-btn-cyan"
              disabled={pending || code.length !== 6 || name.trim().length < 2}
              onClick={() => race.act("join", { code, nickname: name })}
            >
              REJOINDRE →
            </button>
          </section>
          <section className="hub-card solo">
            <span className="mode-icon">◎</span>
            <h2>S’entraîner en solo</h2>
            <p>
              De nouvelles questions à chaque course.
              <br />
              Améliore ton temps et ta précision.
            </p>
            <button
              className="r-btn r-btn-ghost"
              disabled={pending || name.trim().length < 2}
              onClick={() =>
                race.act("create", {
                  nickname: name,
                  mode: "solo",
                  durationMinutes: GAME_DURATION_MINUTES,
                })
              }
            >
              LANCER L’ENTRAÎNEMENT
            </button>
          </section>
        </div>
        <div className="race-hub-rules">
          5 énigmes à code + 5 questions tirées au sort · 2 par salle · Réponses et temps vérifiés
          par le serveur
        </div>
        {error && (
          <div className="race-error" role="alert">
            {error}
          </div>
        )}
        {credentials && <p className="hub-recover">Reconnexion au salon {credentials.code}…</p>}
      </div>
    )
  if (!me) return null
  if (state.phase === "lobby")
    return (
      <div className="race-screen lobby-screen">
        <div className="race-grid" />
        <header className="race-header">
          <button className="r-btn r-btn-ghost" onClick={() => setDialog("exit")}>
            ← Quitter le salon
          </button>
          <BrandMark />
          <span>MANCHE {state.round}</span>
        </header>
        <div className="lobby-layout">
          <section className="lobby-invite">
            <div className="eyebrow">
              {state.mode === "solo" ? "ENTRAÎNEMENT SOLO" : "INVITE TES AMIS"}
            </div>
            <h1>
              Le campus
              <br />
              vous attend.
            </h1>
            <p>
              Partage le code. Préparez-vous.
              <br />
              Le compte à rebours démarre pour tous en même temps.
            </p>
            <div className="invite-code">
              <small>CODE DU SALON</small>
              <strong>{state.code}</strong>
              <button className="r-btn r-btn-small r-btn-cyan" onClick={share}>
                {copyStatus || "Copier le lien"}
              </button>
            </div>
            <div className="lobby-pills">
              <span>{state.durationMinutes} minutes</span>
              <span>10 verrous</span>
              <span>{state.players.filter((p) => !p.left).length}/8 joueurs</span>
            </div>
            <p className="lobby-fair">
              Même sélection de questions pour tous. Les questions et l’ordre des réponses changent
              à la manche suivante.
            </p>
          </section>
          <section className="lobby-players">
            <h2>
              Dans le sas{" "}
              <span>{state.players.filter((p) => !p.left && p.ready).length} prêts</span>
            </h2>
            {state.players
              .filter((p) => !p.left)
              .map((p, i) => (
                <div className={`lobby-player ${p.id === me.id ? "is-me" : ""}`} key={p.id}>
                  <span className={`player-avatar avatar-${i % 4}`}>
                    {p.nickname[0].toUpperCase()}
                  </span>
                  <div>
                    <strong>
                      {p.nickname} {p.id === me.id && <small>(toi)</small>}
                    </strong>
                    <small>
                      {p.id === state.hostId ? "Hôte du salon" : "Challenger"}
                      {!p.online ? " · reconnexion…" : ""}
                    </small>
                  </div>
                  <span className={`ready-badge ${p.ready ? "is-ready" : ""}`}>
                    {p.ready ? "✓ Prêt" : "En préparation"}
                  </span>
                  {host && p.id !== me.id && (
                    <button
                      className="r-btn r-btn-small r-btn-ghost"
                      aria-label={`Retirer ${p.nickname}`}
                      disabled={pending}
                      onClick={() => race.act("kick", { playerId: p.id })}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            <div className="lobby-actions">
              <button
                className={`r-btn ${me.ready ? "r-btn-ghost" : "r-btn-cyan"}`}
                disabled={pending}
                onClick={() => race.act("ready", { ready: !me.ready })}
              >
                {me.ready ? "ANNULER PRÊT" : "JE SUIS PRÊT ✓"}
              </button>
              {host ? (
                <button
                  className="r-btn r-btn-gold"
                  disabled={
                    pending ||
                    state.players.filter((p) => !p.left).some((p) => !p.ready || !p.online)
                  }
                  onClick={() => race.act("start")}
                >
                  LANCER LA COURSE →
                </button>
              ) : (
                <p>L’hôte lancera la course quand tout le monde sera prêt.</p>
              )}
            </div>
          </section>
        </div>
        {error && (
          <div className="race-error" role="alert">
            {error}
          </div>
        )}
        {dialog === "exit" && (
          <Dialog title="QUITTER LE SALON ?" onClose={() => setDialog(null)}>
            <p>Les autres joueurs pourront continuer leur partie.</p>
            <button className="r-btn r-btn-red" onClick={exit}>
              QUITTER
            </button>
          </Dialog>
        )}
      </div>
    )
  if (state.phase === "finished" || me.finishedAt || expired)
    return (
      <div className="race-screen results-screen">
        <div className="race-grid" />
        <header className="race-header">
          <BrandMark />
          <span>
            SALON {state.code} · MANCHE {state.round}
          </span>
          <button className="r-btn r-btn-ghost" onClick={exit}>
            Retour au menu
          </button>
        </header>
        <div className="results-heading">
          <div className="eyebrow">
            {state.phase === "finished"
              ? "CLASSEMENT FINAL"
              : "ÉVASION VALIDÉE · CLASSEMENT EN DIRECT"}
          </div>
          <h1>
            {state.ranking[0]?.id === me.id && me.finishedAt
              ? "Premier à sortir !"
              : me.finishedAt
                ? "Tu as brisé la boucle."
                : "Le temps est écoulé."}
          </h1>
          <p>
            {expired
              ? "16:00 · G4-OS a redémarré. La prochaine manche repart à 09:00."
              : state.phase !== "finished"
                ? "Les autres joueurs poursuivent leur journée jusqu’à 16:00."
                : "Évadés classés par ordre d’arrivée. Les autres joueurs sont départagés par progression, puis score."}
          </p>
        </div>
        <div className="result-stats">
          <div>
            <small>TON SCORE</small>
            <strong>{me.score.toLocaleString("fr-FR")}</strong>
          </div>
          <div>
            <small>TEMPS D’ÉVASION</small>
            <strong>{me.finishedAt ? clock(me.finishedAt - state.startsAt!) : "—"}</strong>
          </div>
          <div>
            <small>PRÉCISION</small>
            <strong>
              {me.answered + me.mistakes
                ? Math.round((me.answered / (me.answered + me.mistakes)) * 100)
                : 0}
              %
            </strong>
          </div>
          <div>
            <small>MODULES</small>
            <strong>{me.solvedRoomIds.length}/5</strong>
          </div>
        </div>
        <Board state={state} meId={me.id} />
        <div className="results-actions">
          {host && (
            <button
              className="r-btn r-btn-gold"
              disabled={pending || state.phase !== "finished"}
              onClick={() => {
                race.act("rematch")
                setView("world")
                setDialog(null)
              }}
            >
              REVANCHE · NOUVELLES QUESTIONS
            </button>
          )}
          <button className="r-btn r-btn-ghost" onClick={share}>
            {copyStatus || "Copier le lien du salon"}
          </button>
          <span>
            {state.phase === "finished" && !host ? "L’hôte peut proposer une revanche." : ""}
          </span>
        </div>
        {error && (
          <div className="race-error" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  return (
    <div className="race-play">
      <div inert={dialog !== null || state.phase === "countdown"}>
        {campusEntered && ["world", "question", "feedback", "map"].includes(view) && (
          <div className="race-exploration" inert={view === "map"}>
            <ExplorePage
              helpCost="Un indice coûte 100 points, une seule fois par verrou. Le chrono continue."
              onAskHelp={async (roomId) => {
                const result = await race.act("assist", { roomId })
                return result?.questions.find((q) => q.roomId === roomId)?.hint
              }}
              inventoryKey={inventoryKey}
              escapeDocuments={raceDocuments}
              raceInfo={{
                code: state.code,
                score: me.score,
                rank: `${state.ranking.findIndex((p) => p.id === me.id) + 1}/${state.players.filter((p) => !p.left).length}`,
                onBoard: () => setDialog("board"),
              }}
              playerPosition={localPosition}
              onMove={move}
              mapOpen={view === "map"}
              onOpenMap={() => setView("map")}
              onPause={() => void pauseGame()}
              onInteract={interact}
              solvedRoomIds={me.solvedRoomIds}
              active={
                view === "world" &&
                state.phase === "playing" &&
                me.pauseStartedAt == null &&
                !dialog &&
                connected &&
                !pending
              }
              gameTime={campusTime}
              loopNumber={state.round}
              hintCount={me.hints}
              objectiveLabel={target || undefined}
              targetRoomId={state.questions[0]?.roomId}
            />
          </div>
        )}
        {view === "map" && (
          <div className="campus-map-layer">
            <CampusNavigator
              position={localPosition}
              solvedRoomIds={me.solvedRoomIds}
              targetRoomId={state.questions[0]?.roomId}
              onBack={() => setView("world")}
            />
          </div>
        )}

        {view === "question" && question && (
          <div
            className={`cartoon-question race-screen race-question ${question.kind === "code" ? "is-code" : ""}`}
          >
            <Dialog title={question.title} onClose={() => setView("world")}>
              <div className="question-modal-meta">
                <span>TERMINAL CONNECTÉ</span>
                <b>
                  {campusTime} · ⏱ {clock(remaining)} restantes
                </b>
              </div>
              <section className="question-content">
                <div className="question-kicker">
                  <span>
                    MODULE {WORLD_ROOMS.find((r) => r.id === question.roomId)?.label.toUpperCase()}
                  </span>
                  <span>{me.answered}/10 RÉPONSES VALIDÉES</span>
                </div>
                <div className="mission-brief">
                  <span className="mission-seal">{MISSIONS[question.roomId]?.symbol}</span>
                  <div>
                    <strong>{MISSIONS[question.roomId]?.title}</strong>
                    <p>{MISSIONS[question.roomId]?.brief}</p>
                  </div>
                  <span className="lock-step">
                    VERROU {question.kind === "code" ? "1 · INDICES" : "2 · SAVOIRS"}
                  </span>
                </div>
                <h1>{question.prompt}</h1>
                {question.visual && (question.kind !== "code" || documentFound) && (
                  <ScenarioExhibit kind={question.visual} />
                )}
                {question.exhibit && question.kind !== "code" && !question.visual && (
                  <pre>{question.exhibit}</pre>
                )}
                {question.kind === "code" && (
                  <div className="code-challenge">
                    <div className="evidence-document">
                      <div>
                        {MISSIONS[question.roomId]?.object}
                        <span>PIÈCE À EXAMINER</span>
                      </div>
                      <pre>
                        {documentFound
                          ? question.exhibit
                          : "Retrouve ce document dans la salle et examine-le. Il sera conservé dans ton inventaire."}
                      </pre>
                    </div>
                    <label className="code-entry">
                      CODE DU VERROU
                      <input
                        autoComplete="off"
                        aria-label="Code du verrou"
                        placeholder="Ta réponse…"
                        value={selected ?? ""}
                        maxLength={32}
                        disabled={pending || !documentFound || lockedSeconds > 0}
                        onChange={(e) => setSelected(e.target.value.trim() ? e.target.value : null)}
                      />
                      <small>
                        Lis les indices du document, puis saisis ta solution. Entrée pour valider.
                      </small>
                      <span className="code-lock-symbol" aria-hidden="true">
                        ⌑
                      </span>
                    </label>
                  </div>
                )}

                {question.kind !== "code" && (
                  <div className="race-answers" role="group" aria-label="Choisir une réponse">
                    {question.answers.map((a, i) => (
                      <button
                        key={`${question.id}-${a.id}`}
                        className={`race-answer ${selected === a.id ? "is-selected" : ""}`}
                        aria-pressed={selected === a.id}
                        disabled={pending || lockedSeconds > 0}
                        onClick={() => setSelected(a.id)}
                      >
                        <b>{String.fromCharCode(65 + i)}</b>
                        <span>{a.label}</span>
                        <i>{selected === a.id ? "✓" : ""}</i>
                      </button>
                    ))}
                  </div>
                )}
                {lockedSeconds > 0 && (
                  <p role="alert" className="scenario-lock">
                    Trois erreurs : terminal bloqué encore {lockedSeconds} s.
                  </p>
                )}
                {question.hint && (
                  <aside className="race-hint">
                    <strong>INDICE</strong> {question.hint}
                  </aside>
                )}
                <div className="question-actions">
                  <button
                    className="r-btn r-btn-ghost"
                    disabled={pending || !!question.hint}
                    onClick={hint}
                  >
                    {question.hint ? "Indice affiché" : "Un indice ? −100 pts"}
                  </button>
                  <span>
                    Bonne réponse : jusqu’à +1 000 pts · Erreur : −10 min campus et −150 pts
                  </span>
                  <button
                    className="r-btn r-btn-gold"
                    disabled={
                      pending ||
                      selected === null ||
                      !connected ||
                      !documentFound ||
                      lockedSeconds > 0
                    }
                    onClick={answer}
                  >
                    {pending ? "VÉRIFICATION…" : "VALIDER LA RÉPONSE →"}
                  </button>
                </div>
              </section>
            </Dialog>
          </div>
        )}
        {view === "feedback" && feedback && (
          <div className={`race-screen race-feedback ${feedback.correct ? "is-correct" : ""}`}>
            <div className="feedback-symbol">{feedback.correct ? "✓" : "↻"}</div>
            <div className="eyebrow">
              {feedback.correct
                ? feedback.roomComplete
                  ? "MODULE DÉVERROUILLÉ"
                  : "PREMIER VERROU OUVERT"
                : "LE VERROU RÉSISTE"}
            </div>
            <h1>{feedback.correct ? "Bien joué, hacker." : "Une autre piste ?"}</h1>
            <p>{feedback.explanation}</p>
            {!!feedback.penaltyMinutes && (
              <p className="scenario-lock" role="status">
                Mauvaise réponse : +{feedback.penaltyMinutes} minutes sur l’horloge du campus ·{" "}
                {formatCampusClock(feedback.timeBefore!)} → {formatCampusClock(feedback.timeAfter!)}
              </p>
            )}
            <strong className="feedback-points">
              {feedback.scoreDelta > 0 ? "+" : ""}
              {feedback.scoreDelta} points
            </strong>
            <button className="r-btn r-btn-gold" disabled={pending} onClick={next}>
              {feedback.correct
                ? feedback.roomComplete
                  ? "RETOURNER EXPLORER →"
                  : "OUVRIR LE SECOND VERROU →"
                : "RÉESSAYER →"}
            </button>
            <button className="r-btn r-btn-ghost" onClick={() => setView("world")}>
              Revenir dans la salle
            </button>
            <span className="feedback-clock">
              Horloge du campus : {campusTime} · {clock(remaining)} restantes
            </span>
          </div>
        )}
      </div>
      {state.phase === "countdown" && (
        <div className="race-countdown">
          <span>TOUT LE MONDE AU DÉPART</span>
          <strong>{Math.max(1, Math.ceil((state.startsAt! - time) / 1000))}</strong>
          <h2>5 modules. 10 verrous. À toi de jouer.</h2>
        </div>
      )}
      {!connected && (
        <div className="race-connection" role="status">
          Connexion interrompue · reconnexion automatique…{" "}
          {me.pauseStartedAt != null ? "La pause reste active." : "Le temps continue."}
        </div>
      )}
      {error && (
        <div className="race-error" role="alert">
          <span>{error}</span>
          <button onClick={race.clearError} aria-label="Fermer l’erreur">
            ×
          </button>
        </div>
      )}
      {dialog && (
        <Dialog
          title={
            {
              pause: "PAUSE LOCALE",
              help: "TA MISSION",
              terminal: "CONSOLE DE SORMIOU",
              clue: "LE TICKET DU DISTRIBUTEUR",
              board: "LA COURSE EN DIRECT",
              exit: "QUITTER LA COURSE ?",
            }[dialog]
          }
          onClose={() => {
            if (dialog === "exit" && me.pauseStartedAt != null) {
              setDialog("pause")
              return
            }
            if (dialog === "help") setCampusEntered(true)
            if (dialog === "pause" || (dialog === "help" && me.pauseStartedAt != null)) {
              void resumeGame()
              return
            }
            setDialog(null)
          }}
          className={dialog === "pause" ? "dialog-card--pause" : undefined}
        >
          {dialog === "help" && (
            <>
              <p>
                Répare les <b>cinq modules</b> : retrouve les documents, déduis les codes puis ouvre
                les verrous de chaque salle. Rejoins ensuite la console de <b>Sormiou</b> pour
                valider ta sortie.
              </p>
              <p className="race-desktop-controls">
                <b>ZQSD / WASD / flèches</b> : marcher · <b>E</b> : borne proche · <b>M</b> : carte.
              </p>
              <p className="race-touch-controls">
                Sur téléphone, utilise les flèches tactiles pour marcher, glisse sur le décor pour
                regarder et appuie sur Interagir près d’une borne.
              </p>
              <p>
                Tu as 15 minutes de jeu pour aller de 09:00 à 16:00. Chaque erreur te retire 10
                minutes campus. Trois erreurs sur le même verrou le bloquent 30 secondes. Le temps
                continue pendant les questions et les fenêtres, mais s’arrête dans le menu Pause.
              </p>
              <button
                className="r-btn r-btn-gold"
                onClick={() => {
                  setCampusEntered(true)
                  if (me.pauseStartedAt != null) void resumeGame()
                  else setDialog(null)
                }}
              >
                C’EST PARTI !
              </button>
            </>
          )}
          {dialog === "pause" && (
            <>
              <p>
                Le chronomètre est suspendu pour toi. Les autres joueurs continuent leur course.
              </p>
              <ThreeSettings />
              <div className="dialog-race-actions">
                <button className="r-btn r-btn-gold" onClick={() => void resumeGame()}>
                  REPRENDRE
                </button>
                <button className="r-btn r-btn-ghost" onClick={() => setDialog("help")}>
                  Commandes & mission
                </button>
                <button className="r-btn r-btn-red" onClick={() => setDialog("exit")}>
                  Quitter la course
                </button>
              </div>
            </>
          )}
          {dialog === "terminal" && (
            <>
              <p>
                {me.solvedRoomIds.length === 5
                  ? "Les cinq fragments sont assemblés. Valide maintenant ton évasion pour enregistrer ton temps !"
                  : `Il te manque ${5 - me.solvedRoomIds.length} modules. Chaque salle contient deux questions à résoudre.`}
              </p>
              <button
                className="r-btn r-btn-gold"
                disabled={pending || me.solvedRoomIds.length < 5}
                onClick={() => race.act("finish")}
              >
                VALIDER MON ÉVASION →
              </button>
            </>
          )}
          {dialog === "clue" && (
            <p>
              +100 points d’exploration, une seule fois par manche. Repère les portes lumineuses :
              elles relient les salles aux couloirs. Le terminal final se trouve à Sormiou, tout en
              bas de la carte.
            </p>
          )}
          {dialog === "board" && <Board state={state} meId={me.id} compact />}
          {dialog === "exit" && (
            <>
              <p>Ta participation sera abandonnée. Les autres joueurs continueront.</p>
              <button className="r-btn r-btn-red" disabled={pending} onClick={exit}>
                CONFIRMER L’ABANDON
              </button>
            </>
          )}
        </Dialog>
      )}
    </div>
  )
}
