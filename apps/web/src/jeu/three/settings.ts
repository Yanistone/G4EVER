export interface GameSettings {
  sensitivity: number
  fov: number
  volume: number
  quality: "eco" | "balanced" | "high"
  motion: boolean
}
const defaults: GameSettings = {
  sensitivity: 1,
  fov: 80,
  volume: 0.35,
  quality: "balanced",
  motion: true,
}
export function readSettings(): GameSettings {
  try {
    const v = JSON.parse(localStorage.getItem("g4:3d:settings") || "{}")
    const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
      typeof n === "number" && Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback
    return {
      sensitivity: clamp(v.sensitivity, 0.25, 2.5, 1),
      fov: clamp(v.fov, 65, 105, 80),
      volume: clamp(v.volume, 0, 1, 0.35),
      quality: ["eco", "balanced", "high"].includes(v.quality) ? v.quality : "balanced",
      motion: typeof v.motion === "boolean" ? v.motion : true,
    }
  } catch {
    return { ...defaults }
  }
}
export function saveSettings(settings: GameSettings) {
  try {
    localStorage.setItem("g4:3d:settings", JSON.stringify(settings))
  } catch {}
  window.dispatchEvent(new CustomEvent("g4-settings", { detail: settings }))
}
