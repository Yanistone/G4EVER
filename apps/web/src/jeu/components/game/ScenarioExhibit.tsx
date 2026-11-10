import type { ScenarioKind } from "../../../../../../shared/scenario"
import { ALGORITHM, ERROR_LOG, SCRIPT, SEATING_RULES } from "../../../../../../shared/scenario"
import { RoomSnapshots } from "./DifferenceHunt"
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
  if (kind === "differences") return <RoomSnapshots />
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
