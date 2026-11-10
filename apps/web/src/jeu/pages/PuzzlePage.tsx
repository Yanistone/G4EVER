import { useEffect, useState } from "react"
import type { PuzzlePageProps } from "../types/adventure"
import { Dialog } from "../components/ui/Dialog"
import { ScenarioExhibit } from "../components/game/ScenarioExhibit"
import { DifferenceHunt } from "../components/game/DifferenceHunt"
import {
  PATCH_CARDS,
  SCRIPT,
  SEATING_RULES,
  SEATING_STUDENTS,
} from "../../../../../shared/scenario"
import { playCue } from "../game/sfx"
import "../styles/immersive.css"
import "../styles/scenario.css"

const HINT_LABELS = ["Coup de pouce", "Méthode", "Solution"] as const
const PLANNING_TASKS = [
  ["A", "A · Cahier des charges"],
  ["B", "B · Développement"],
  ["C", "C · Tests"],
  ["D", "D · Formation"],
  ["E", "E · Production"],
] as const

function seatsFromCode(code: string): (string | null)[] {
  const seats: (string | null)[] = [null, null, null, null]
  if (!/^[1-4]{4}$/.test(code)) return seats
  SEATING_STUDENTS.forEach((student, i) => {
    seats[Number(code[i]) - 1] = student
  })
  return seats
}

export function PuzzlePage(p: PuzzlePageProps) {
  const {
    puzzle,
    selectedAnswerId: answer,
    onSelectAnswer: select,
    onValidate: validate,
    onLeave,
  } = p
  const scenario = puzzle.scenario!
  const solved = p.result?.status === "correct"
  const wrong = p.result?.status === "wrong" ? p.result : null
  const [dragged, setDragged] = useState<string | null>(null)
  const [memoOpen, setMemoOpen] = useState(true)
  const [found, setFound] = useState<string[]>([])
  const [seats, setSeats] = useState<(string | null)[]>(() => seatsFromCode(answer ?? ""))
  useEffect(() => {
    if (scenario.kind === "patch" && !answer) select("ABCD")
    setFound([])
    setSeats(seatsFromCode(answer ?? ""))
  }, [puzzle.id])
  const disabled = !!solved
  const fields = (answer ?? "").split("|")
  const setField = (index: number, value: string) => {
    const next = [fields[0] ?? "", fields[1] ?? ""]
    next[index] = value
    select(next.join("|"))
  }
  const input = (
    label: string,
    index?: number,
    options: { numeric?: boolean; placeholder?: string } = {},
  ) => (
    <label className="scenario-field">
      <span>{label}</span>
      <input
        autoComplete="off"
        spellCheck={false}
        maxLength={64}
        inputMode={options.numeric ? "numeric" : undefined}
        placeholder={options.placeholder}
        aria-label={label}
        value={index === undefined ? (answer ?? "") : (fields[index] ?? "")}
        onChange={(e) =>
          index === undefined ? select(e.target.value) : setField(index, e.target.value)
        }
        disabled={disabled}
      />
    </label>
  )
  const order =
    /^[ABCD]{4}$/.test(answer ?? "") && new Set(answer).size === 4
      ? answer!.split("")
      : ["A", "B", "C", "D"]
  const moveCard = (from: number, to: number) => {
    if (to < 0 || to > 3) return
    const next = [...order]
    const [card] = next.splice(from, 1)
    next.splice(to, 0, card)
    playCue("click")
    select(next.join(""))
  }
  const seat = (index: number, student: string) => {
    const next = seats.map((s) => (s === student ? null : s))
    next[index] = student || null
    setSeats(next)
    const complete = SEATING_STUDENTS.every((s) => next.includes(s))
    select(complete ? SEATING_STUDENTS.map((s) => next.indexOf(s) + 1).join("") : "")
  }
  const seatingCode = SEATING_STUDENTS.map((s) =>
    seats.includes(s) ? String(seats.indexOf(s) + 1) : "_",
  ).join(" ")
  const cups = Number.parseInt(answer ?? "", 10)
  return (
    <div className="cartoon-question story-question scenario-question">
      <Dialog
        title={puzzle.title}
        onClose={onLeave}
        hideTitle
        hideClose
        className={`puzzle-dialog puzzle-dialog--${scenario.kind}${solved ? " is-solved" : ""}`}
      >
        <header className="puzzle-head" aria-hidden="true">
          <div>
            <span className="puzzle-room">{scenario.room}</span>
            <span className="puzzle-step">
              Énigme {puzzle.question.number} sur {p.total}
            </span>
          </div>
          <strong className="puzzle-title">{puzzle.title}</strong>
          <div className="puzzle-clock">
            <b>{p.gameTime}</b>
            <small>{p.timeLabel}</small>
          </div>
        </header>
        {solved ? (
          <div className="puzzle-success" role="status">
            <div className="success-seal" aria-hidden="true">
              ✓
            </div>
            <small>{p.result?.fromMemory ? "SOUVENIR RETROUVÉ" : "ÉNIGME RÉSOLUE"}</small>
            <h3>{scenario.reward}</h3>
            {!!p.result?.unlockedLabels?.length && (
              <div className="unlock-chips">
                {p.result.unlockedLabels.map((label) => (
                  <span key={label}>🔓 {label}</span>
                ))}
              </div>
            )}
            <div className="success-why">
              <b>Pourquoi ?</b>
              <p>{scenario.explanation}</p>
            </div>
            <p className="success-memory">
              <span aria-hidden="true">📓</span> Noté dans ton carnet : {scenario.memory}
            </p>
            {scenario.kind === "patch" ? (
              <button className="ui-button puzzle-primary" autoFocus onClick={p.onApplyFix}>
                Appliquer le correctif
              </button>
            ) : (
              <button className="ui-button puzzle-primary" autoFocus onClick={onLeave}>
                Continuer l’exploration →
              </button>
            )}
          </div>
        ) : (
          <div className="puzzle-body">
            <section className="puzzle-main">
              <p className="puzzle-flavor">{scenario.flavor}</p>
              <h3 className="question-modal-prompt">{scenario.prompt}</h3>
              {p.remembered && (
                <div className="puzzle-memory-banner">
                  <span aria-hidden="true">🧠</span>
                  <p>
                    <b>Tu te souviens de cette énigme.</b> Tu l’as résolue dans une boucle
                    précédente.
                  </p>
                  <button type="button" className="ui-button" onClick={p.onUseMemory}>
                    Utiliser mon souvenir
                  </button>
                </div>
              )}
              {!["script", "differences", "seating"].includes(scenario.kind) && (
                <ScenarioExhibit kind={scenario.kind} />
              )}
              <form
                className={wrong ? "is-wrong" : undefined}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!disabled && answer) validate()
                }}
              >
                {scenario.kind === "cups" && (
                  <div className="cups-input">
                    <button
                      type="button"
                      aria-label="Une tasse de moins"
                      onClick={() => select(String(Math.max(0, (cups || 0) - 1)))}
                    >
                      −
                    </button>
                    {input("Nombre de tasses bleues", undefined, {
                      numeric: true,
                      placeholder: "?",
                    })}
                    <button
                      type="button"
                      aria-label="Une tasse de plus"
                      onClick={() => select(String(Math.min(20, (cups || 0) + 1)))}
                    >
                      +
                    </button>
                  </div>
                )}
                {scenario.kind === "seating" && (
                  <div className="seating-puzzle">
                    <ol className="seating-rules">
                      {SEATING_RULES.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                    </ol>
                    <div className="seat-table" aria-label="Places de gauche à droite">
                      <div className="seat-board" aria-hidden="true" />
                      {seats.map((student, i) => (
                        <label key={i} className={`seat${student ? " is-taken" : ""}`}>
                          <span className="seat-number">Place {i + 1}</span>
                          <span className="seat-avatar" aria-hidden="true">
                            {student ? student.charAt(0) : "?"}
                          </span>
                          <select
                            aria-label={`Place ${i + 1}`}
                            value={student ?? ""}
                            onChange={(e) => seat(i, e.target.value)}
                          >
                            <option value="">— libre —</option>
                            {SEATING_STUDENTS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <p className="seating-code">
                      Code Noah · Léa · Yanis · Inès : <b>{seatingCode}</b>
                    </p>
                  </div>
                )}
                {scenario.kind === "algorithm" && (
                  <div className="scenario-fields">
                    {input("n (souvenir du café)", 0, { numeric: true })}
                    {input("Résultat affiché", 1, { numeric: true })}
                  </div>
                )}
                {scenario.kind === "log" && (
                  <div
                    className="terminal-answers"
                    role="group"
                    aria-label="Signification de HTTP 503"
                  >
                    {[
                      "Page introuvable",
                      "Service indisponible",
                      "Accès interdit",
                      "Erreur de syntaxe",
                    ].map((label, i) => (
                      <button
                        type="button"
                        key={label}
                        aria-pressed={answer === "ABCD"[i]}
                        onClick={() => {
                          playCue("click")
                          select("ABCD"[i])
                        }}
                        disabled={disabled}
                      >
                        <b>{"ABCD"[i]}</b>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {scenario.kind === "planning" && (
                  <div className="scenario-fields">
                    {input("Durée minimale (jours)", 0, { numeric: true })}
                    <label className="scenario-field">
                      <span>Tâche supprimée</span>
                      <select
                        aria-label="Tâche supprimée"
                        value={fields[1] ?? ""}
                        onChange={(e) => setField(1, e.target.value)}
                      >
                        <option value="">Choisis une tâche…</option>
                        {PLANNING_TASKS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                {scenario.kind === "script" && (
                  <div
                    className="scenario-script"
                    role="group"
                    aria-label="Sélectionner la ligne fautive"
                  >
                    {SCRIPT.map((line, i) => (
                      <button
                        type="button"
                        key={line}
                        disabled={disabled}
                        aria-pressed={answer === String(i + 1)}
                        onClick={() => {
                          playCue("click")
                          select(String(i + 1))
                        }}
                      >
                        <b>{i + 1}</b>
                        <code>{line}</code>
                      </button>
                    ))}
                  </div>
                )}
                {scenario.kind === "differences" && (
                  <>
                    <DifferenceHunt
                      found={found}
                      onFind={(id) => {
                        playCue("memory")
                        setFound((prev) => [...new Set([...prev, id])])
                      }}
                      onMiss={() => playCue("click")}
                    />
                    {input("Code du Co-working", undefined, {
                      numeric: true,
                      placeholder: "ligne + différences",
                    })}
                  </>
                )}
                {scenario.kind === "patch" && (
                  <ol className="scenario-cards" aria-label="Ordre des opérations">
                    {order.map((card, i) => (
                      <li
                        key={card}
                        draggable={!disabled}
                        className={dragged === card ? "is-dragged" : undefined}
                        onDragStart={() => setDragged(card)}
                        onDragEnd={() => setDragged(null)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (dragged) moveCard(order.indexOf(dragged), i)
                          setDragged(null)
                        }}
                      >
                        <i aria-hidden="true">{i + 1}</i>
                        <b>{card}</b>
                        <span>{PATCH_CARDS[card]}</span>
                        <button
                          type="button"
                          aria-label={`Monter ${card}`}
                          disabled={i === 0 || disabled}
                          onClick={() => moveCard(i, i - 1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label={`Descendre ${card}`}
                          disabled={i === 3 || disabled}
                          onClick={() => moveCard(i, i + 1)}
                        >
                          ↓
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                {wrong && (
                  <p role="alert" className="puzzle-feedback" key={wrong.key}>
                    {wrong.message}
                  </p>
                )}
                {p.notice && (
                  <p role="status" className="scenario-notice">
                    {p.notice}
                  </p>
                )}
                <div className="question-modal-actions">
                  <button
                    type="button"
                    className="ui-button puzzle-secondary"
                    onClick={p.onJournal}
                  >
                    Carnet de souvenirs
                  </button>
                  <button
                    className="ui-button puzzle-primary"
                    type="submit"
                    disabled={disabled || !answer}
                  >
                    {scenario.kind === "patch" ? "Valider la procédure" : "Valider la réponse →"}
                  </button>
                </div>
              </form>
            </section>
            <aside className="puzzle-side">
              {scenario.memo && (
                <section className="puzzle-memo">
                  <button
                    type="button"
                    aria-expanded={memoOpen}
                    onClick={() => setMemoOpen((open) => !open)}
                  >
                    <span aria-hidden="true">📘</span> Mémo · {scenario.memo.title}
                    <i aria-hidden="true">{memoOpen ? "−" : "+"}</i>
                  </button>
                  {memoOpen && (
                    <ul>
                      {scenario.memo.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
              {scenario.kind === "planning" && (
                <section className="scenario-lea">
                  <strong>Léa te propose son aide.</strong>
                  <p>
                    {p.leaCost ? `Accepter coûte ${p.leaCost} minutes campus. ` : ""}Le premier
                    indice devient gratuit ici et à Mont Ventoux.
                  </p>
                  {p.trustedLea ? (
                    <b>Aide de Léa acceptée.</b>
                  ) : (
                    <button type="button" className="ui-button" onClick={p.onTrustLea}>
                      Accepter l’aide{p.leaCost ? ` · −${p.leaCost} min` : " · gratuit"}
                    </button>
                  )}
                </section>
              )}
              <section className="puzzle-hints" aria-label="Indices">
                <header>
                  <strong>Indices</strong>
                  <small>Révèle-les un par un, seulement si tu bloques.</small>
                </header>
                {([1, 2, 3] as const).map((level) => {
                  const cost = p.hintCosts[level - 1]
                  if (level <= p.hintLevel)
                    return (
                      <p key={level} className={`hint-revealed hint-level-${level}`}>
                        <b>{HINT_LABELS[level - 1]}</b>
                        {scenario.hints[level - 1]}
                      </p>
                    )
                  if (level === p.hintLevel + 1)
                    return (
                      <button
                        key={level}
                        type="button"
                        className={`hint-next hint-level-${level}`}
                        onClick={() => p.onHint(level)}
                      >
                        <span>{HINT_LABELS[level - 1]}</span>
                        <small>{cost ? `−${cost} min campus` : "gratuit"}</small>
                      </button>
                    )
                  return (
                    <span key={level} className="hint-locked" aria-hidden="true">
                      {HINT_LABELS[level - 1]}
                    </span>
                  )
                })}
              </section>
              <p className="puzzle-rules">
                {p.wrongAnswerMinutes
                  ? `Mauvaise réponse : −${p.wrongAnswerMinutes} min campus. Tu peux réessayer autant de fois que tu veux.`
                  : "Aucune pénalité : réessaie autant de fois que tu veux."}
              </p>
            </aside>
          </div>
        )}
        <button className="puzzle-close" aria-label="Quitter l’énigme" onClick={onLeave}>
          ✕
        </button>
      </Dialog>
    </div>
  )
}
