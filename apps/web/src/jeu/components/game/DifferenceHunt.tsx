import { useState } from "react"
import type { MouseEvent } from "react"
import { DIFFERENCE_SPOTS } from "../../../../../../shared/scenario"

function RoomDrawing({ after }: { after: boolean }) {
  return (
    <>
      <rect width="360" height="235" rx="12" fill="#e9dbc9" />
      <path d="M0 175h360v60H0" fill="#cba77f" />
      <rect x="25" y="35" width="85" height="80" fill="#87bed1" stroke="#fcfaf3" strokeWidth="8" />
      <path d="M67 35v80M25 75h85" stroke="#fcfaf3" strokeWidth="5" />
      <circle cx="280" cy="50" r="27" fill="#fff" stroke="#4c5775" strokeWidth="5" />
      <path
        d={after ? "M280 31v19l-16 10" : "M280 31v19l-16 0"}
        stroke="#36425d"
        strokeWidth="4"
        fill="none"
      />
      <rect x="138" y="139" width="158" height="12" fill="#986b40" />
      <path d="M151 151v60M283 151v60" stroke="#684628" strokeWidth="9" />
      <rect
        x="185"
        y="90"
        width="70"
        height="45"
        rx="4"
        fill={after ? "#202738" : "#39baca"}
        stroke="#273149"
        strokeWidth="6"
      />
      <path d="M220 135v6" stroke="#273149" strokeWidth="7" />
      <g transform={after ? "translate(47 0)" : ""}>
        <rect x="155" y="165" width="48" height="9" rx="3" fill="#d67371" />
        <path
          d="M159 174v42M198 174v42M158 163v-31h42v31"
          stroke="#4d5367"
          strokeWidth="7"
          fill="none"
        />
      </g>
      <rect x="37" y="160" width="31" height="40" rx="5" fill="#727e66" />
      <path d="M52 161v-32M52 145l-16-12M52 142l16-19" stroke="#4c7954" strokeWidth="8" />
    </>
  )
}

/** Version statique, utilisée par l'aperçu des énigmes. */
export function RoomSnapshots() {
  return (
    <div className="scenario-comparison">
      {[false, true].map((after) => (
        <figure key={String(after)}>
          <figcaption>{after ? "APRÈS" : "AVANT"}</figcaption>
          <svg
            className="scenario-exhibit"
            viewBox="0 0 360 235"
            role="img"
            aria-label={
              after
                ? "Vue de la salle après le redémarrage"
                : "Vue de la salle avant le redémarrage"
            }
          >
            <RoomDrawing after={after} />
          </svg>
        </figure>
      ))}
    </div>
  )
}

interface DifferenceHuntProps {
  found: readonly string[]
  onFind: (id: string) => void
  onMiss?: () => void
  disabled?: boolean
}

/** Jeu des différences : chaque zone se trouve en cliquant sur l'une des deux vues. */
export function DifferenceHunt({ found, onFind, onMiss, disabled }: DifferenceHuntProps) {
  const [miss, setMiss] = useState<{ x: number; y: number; key: number } | null>(null)
  const click = (event: MouseEvent<SVGSVGElement>) => {
    if (disabled) return
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 360
    const y = ((event.clientY - box.top) / box.height) * 235
    const hit = DIFFERENCE_SPOTS.filter((s) => Math.hypot(s.x - x, s.y - y) <= s.r).sort(
      (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
    )[0]
    if (hit && !found.includes(hit.id)) onFind(hit.id)
    else if (!hit) {
      setMiss({ x, y, key: Date.now() })
      onMiss?.()
    }
  }
  return (
    <div className="difference-hunt">
      <div className="scenario-comparison">
        {[false, true].map((after) => (
          <figure key={String(after)}>
            <figcaption>{after ? "APRÈS 16:00" : "AVANT 16:00"}</figcaption>
            <svg
              className="scenario-exhibit is-interactive"
              viewBox="0 0 360 235"
              role="img"
              aria-label={
                after
                  ? "Vue de la salle après le redémarrage"
                  : "Vue de la salle avant le redémarrage"
              }
              onClick={click}
            >
              <RoomDrawing after={after} />
              {DIFFERENCE_SPOTS.filter((s) => found.includes(s.id)).map((s) => (
                <circle
                  key={s.id}
                  className="difference-mark"
                  cx={s.x}
                  cy={s.y}
                  r={s.r - 6}
                  fill="none"
                  stroke="#ff3e7f"
                  strokeWidth="5"
                />
              ))}
              {miss && (
                <g key={miss.key} className="difference-miss">
                  <path
                    d={`M${miss.x - 9} ${miss.y - 9}l18 18M${miss.x + 9} ${miss.y - 9}l-18 18`}
                    stroke="#1b1030"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </g>
              )}
            </svg>
          </figure>
        ))}
      </div>
      <p className="difference-list" aria-live="polite">
        {found.length === 0 ? (
          "Clique sur une différence, dans l’une ou l’autre des vues."
        ) : (
          <>
            <b>
              {found.length} différence{found.length > 1 ? "s" : ""} trouvée
              {found.length > 1 ? "s" : ""}
            </b>{" "}
            ·{" "}
            {DIFFERENCE_SPOTS.filter((s) => found.includes(s.id))
              .map((s) => s.label)
              .join(", ")}
            {found.length === DIFFERENCE_SPOTS.length && " — il n’y en a pas d’autre !"}
          </>
        )}
      </p>
    </div>
  )
}
