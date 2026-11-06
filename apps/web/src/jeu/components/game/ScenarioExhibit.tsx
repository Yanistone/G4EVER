import type { ScenarioKind } from "../../../../../../shared/scenario"
import { ALGORITHM, ERROR_LOG, SCRIPT, SEATING_RULES } from "../../../../../../shared/scenario"
export function ScenarioExhibit({ kind }: { kind: ScenarioKind }) {
  if (kind === "cups")
    return (
      <svg
        className="scenario-exhibit"
        viewBox="0 0 600 230"
        role="img"
        aria-label="Deux étagères avec des tasses bleues, rouges et blanches. Un plateau cache partiellement une tasse."
      >
        <rect width="600" height="230" rx="15" fill="#d6c4ac" />
        {[95, 200].map((y) => (
          <rect key={y} x="28" y={y} width="544" height="13" rx="4" fill="#70482f" />
        ))}
        {[
          "#2888d5",
          "#e66865",
          "#2888d5",
          "#f7f5ef",
          "#2888d5",
          "#e66865",
          "#2888d5",
          "#f7f5ef",
          "#e66865",
          "#2888d5",
        ].map((color, i) => {
          const x = 65 + (i % 5) * 108,
            y = i < 5 ? 43 : 148
          return (
            <g key={i}>
              <path
                d={`M${x + 37} ${y + 7} h12 a14 14 0 0 1 0 28 h-12`}
                fill="none"
                stroke={color}
                strokeWidth="7"
              />
              <path
                d={`M${x} ${y} h40 v40 q-20 17 -40 0z`}
                fill={color}
                stroke="#423d39"
                strokeWidth="2"
              />
              <ellipse cx={x + 20} cy={y} rx="20" ry="5" fill="#4b3b32" />
            </g>
          )
        })}
        <rect
          x="492"
          y="172"
          width="77"
          height="28"
          rx="5"
          fill="#a4adb4"
          stroke="#555d64"
          strokeWidth="3"
        />
        <path d="M500 180h60M500 188h60" stroke="#dfe5eb" strokeWidth="2" />
      </svg>
    )
  if (kind === "differences")
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
              <rect width="360" height="235" rx="12" fill="#e9dbc9" />
              <path d="M0 175h360v60H0" fill="#cba77f" />
              <rect
                x="25"
                y="35"
                width="85"
                height="80"
                fill="#87bed1"
                stroke="#fcfaf3"
                strokeWidth="8"
              />
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
            </svg>
          </figure>
        ))}
      </div>
    )
  if (kind === "seating")
    return (
      <>
        <div className="scenario-seats" aria-label="Places de gauche à droite">
          {[1, 2, 3, 4].map((n) => (
            <span key={n}>Place {n}</span>
          ))}
        </div>
        <ul>
          {SEATING_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </>
    )
  if (kind === "algorithm") return <pre>{ALGORITHM}</pre>
  if (kind === "log") return <pre>{ERROR_LOG}</pre>
  if (kind === "script") return <pre>{SCRIPT.map((line, i) => `${i + 1}  ${line}`).join("\n")}</pre>
  if (kind === "planning")
    return (
      <>
        <div className="scenario-plan" aria-label="Dépendances du projet">
          <span>A · Cahier des charges · 2 j</span>
          <b>↙ A → B → C / A → D ↘</b>
          <div>
            <span>B · Développement · 5 j</span>
            <span>D · Formation · 2 j</span>
          </div>
          <span>C · Tests · 3 j (après B)</span>
          <b>↘ C + D → E ↙</b>
          <span>E · Production · 1 j (après C et D)</span>
        </div>
        <p className="scenario-kanban">
          Vendredi 15:59 · <s>Tests</s> · Livraison imposée : 8 jours
        </p>
      </>
    )
  return null
}
