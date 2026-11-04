import { useState } from "react"
import { readSettings, saveSettings } from "../../three/settings"
import type { GameSettings } from "../../three/settings"
export function ThreeSettings() {
  const [s, setS] = useState(readSettings)
  const change = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const next = { ...s, [key]: value }
    setS(next)
    saveSettings(next)
  }
  return (
    <div className="three-settings">
      <label>
        Sensibilité souris <output>{s.sensitivity.toFixed(2)}×</output>
        <input
          aria-label="Sensibilité souris"
          type="range"
          min=".25"
          max="2.5"
          step=".05"
          value={s.sensitivity}
          onChange={(e) => change("sensitivity", +e.target.value)}
        />
      </label>
      <label>
        Champ de vision <output>{s.fov}°</output>
        <input
          aria-label="Champ de vision"
          type="range"
          min="65"
          max="105"
          value={s.fov}
          onChange={(e) => change("fov", +e.target.value)}
        />
      </label>
      <label>
        Volume <output>{Math.round(s.volume * 100)} %</output>
        <input
          aria-label="Volume"
          type="range"
          min="0"
          max="1"
          step=".05"
          value={s.volume}
          onChange={(e) => change("volume", +e.target.value)}
        />
      </label>
      <label>
        Qualité graphique
        <select
          value={s.quality}
          onChange={(e) => change("quality", e.target.value as GameSettings["quality"])}
        >
          <option value="eco">Éco · résolution réduite</option>
          <option value="balanced">Équilibrée</option>
          <option value="high">Élevée · ombres détaillées</option>
        </select>
      </label>
      <p className="settings-help">
        ZQSD / WASD : marcher · souris : regarder · E : interagir · Maj : courir · Ctrl :
        s’accroupir · M : carte · I : inventaire · Échap : pause.
      </p>
    </div>
  )
}
