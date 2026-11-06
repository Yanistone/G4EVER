import { useEffect, useState } from "react"
import type { PuzzlePageProps } from "../types/adventure"
import { Dialog } from "../components/ui/Dialog"
import { ScenarioExhibit } from "../components/game/ScenarioExhibit"
import { PATCH_CARDS, SCRIPT, normalizeAnswer } from "../../../../../shared/scenario"
import "../styles/immersive.css"
import "../styles/scenario.css"

export function PuzzlePage(p: PuzzlePageProps) {
  const {
    puzzle,
    selectedAnswerId: answer,
    onSelectAnswer: select,
    onValidate: validate,
    onLeave,
  } = p
  const scenario = puzzle.scenario!
  const [now, setNow] = useState(Date.now())
  const [dragged, setDragged] = useState<string | null>(null)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (scenario.kind === "patch" && !answer) select("ABCD")
  }, [puzzle.id])
  const seconds = Math.max(0, Math.ceil(((p.lockedUntil ?? 0) - now) / 1000))
  const disabled = seconds > 0 || !!p.pending
  const fields = (answer ?? "").split("|")
  const setField = (index: number, value: string) => {
    const next = [fields[0] ?? "", fields[1] ?? ""]
    next[index] = value
    select(next.join("|"))
  }
  const input = (label: string, index?: number) => (
    <label className="scenario-field">
      {label}
      <input
        autoComplete="off"
        spellCheck={false}
        maxLength={64}
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
    select(next.join(""))
  }
  return (
    <div className="cartoon-question story-question scenario-question">
      <Dialog title={puzzle.title} onClose={onLeave}>
        <div className="question-modal-meta">
          <span>
            {scenario.room} · ÉNIGME {puzzle.question.number}/8
          </span>
          <b>
            {p.gameTime} · BOUCLE {p.loopNumber} · {p.solvedCount}/8
          </b>
        </div>
        <h3 className="question-modal-prompt">{scenario.prompt}</h3>
        {scenario.kind !== "script" && <ScenarioExhibit kind={scenario.kind} />}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!disabled && answer) validate()
          }}
        >
          {["cups", "seating", "differences"].includes(scenario.kind) &&
            input(
              scenario.kind === "cups"
                ? "Nombre de tasses bleues"
                : scenario.kind === "seating"
                  ? "Code Noah, Léa, Yanis, Inès"
                  : "Code ligne et différences",
            )}
          {scenario.kind === "algorithm" && (
            <div className="scenario-fields">
              {input("n (souvenir du café)", 0)}
              {input("Résultat affiché", 1)}
            </div>
          )}
          {scenario.kind === "log" && (
            <div className="terminal-answers" role="group" aria-label="Signification de HTTP 503">
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
                  onClick={() => select("ABCD"[i])}
                  disabled={disabled}
                >
                  <b>{"ABCD"[i]}</b>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
          {scenario.kind === "planning" && (
            <>
              <aside className="scenario-lea">
                <strong>Léa te propose son aide.</strong>
                <p>
                  Accepter coûte 10 minutes campus. Les indices légers deviennent gratuits ici et à
                  Mont Ventoux.
                </p>
                {p.trustedLea ? (
                  <b>Aide de Léa acceptée.</b>
                ) : (
                  <button type="button" className="ui-button" onClick={p.onTrustLea}>
                    Accepter l’aide · −10 min
                  </button>
                )}
                <p>Tu peux continuer seul sans accepter.</p>
              </aside>
              <div className="scenario-fields">
                {input("Durée minimale (jours)", 0)}
                {input("Tâche supprimée", 1)}
              </div>
            </>
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
                  onClick={() => select(String(i + 1))}
                >
                  <b>{i + 1}</b>
                  <code>{line}</code>
                </button>
              ))}
            </div>
          )}
          {scenario.kind === "patch" && (
            <ol className="scenario-cards" aria-label="Ordre des opérations">
              {order.map((card, i) => (
                <li
                  key={card}
                  draggable={!disabled}
                  onDragStart={() => setDragged(card)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragged) moveCard(order.indexOf(dragged), i)
                    setDragged(null)
                  }}
                >
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
          {p.notice && (
            <p role="status" className="scenario-notice">
              {p.notice}
            </p>
          )}
          {seconds > 0 && (
            <p role="alert" className="scenario-lock">
              Trois erreurs : terminal bloqué encore {seconds} s.
            </p>
          )}
          <div className="question-modal-actions">
            <button type="button" className="ui-button" onClick={p.onJournal}>
              Carnet de souvenirs
            </button>
            <button className="ui-button" type="submit" disabled={disabled || !answer}>
              {scenario.kind === "patch" ? "Valider la procédure" : "Valider la réponse →"}
            </button>
          </div>
        </form>
        <div className="scenario-hints">
          <strong>Souvenir de boucle</strong>
          <div>
            {([1, 2] as const).map((level) => (
              <button className="ui-button" key={level} onClick={() => p.onHint?.(level)}>
                {level === 1 ? "Indice léger" : "Indice fort"} ·{" "}
                {(p.hintLevel ?? 0) >= level
                  ? "déjà mémorisé"
                  : level === 1 && p.freeLightHint
                    ? "gratuit (Léa)"
                    : `−${level === 1 ? 5 : 10} min campus`}
              </button>
            ))}
          </div>
          {(p.hintLevel ?? 0) >= 1 && <p>{scenario.hints[0]}</p>}
          {(p.hintLevel ?? 0) >= 2 && <p>{scenario.hints[1]}</p>}
        </div>
        {scenario.kind === "patch" && (
          <div className="scenario-final">
            <button
              className="ui-button"
              disabled={!p.procedureValidated || normalizeAnswer(answer ?? "") !== "CDBA"}
              onClick={() => p.onComplete?.(1)}
            >
              Appliquer le correctif
            </button>
            <button className="ui-button scenario-cut" onClick={() => p.onComplete?.(2)}>
              Tout couper · fin partielle
            </button>
          </div>
        )}
        <p className="dialog-small">
          Mauvaise réponse : −10 min campus. Trois erreurs sur cette énigme : blocage de 30 s.
        </p>
      </Dialog>
    </div>
  )
}
