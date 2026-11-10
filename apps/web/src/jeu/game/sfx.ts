import { readSettings } from "../three/settings"

/** Effets sonores d'interface, synthétisés à la volée : aucun fichier à charger. */
type Cue = "click" | "success" | "error" | "unlock" | "hint" | "alarm" | "tick" | "memory" | "power"

let context: AudioContext | null = null
let master: GainNode | null = null

function audio() {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return null
  if (!context) {
    try {
      context = new AudioContext()
      master = context.createGain()
      master.connect(context.destination)
    } catch {
      return null
    }
  }
  const volume = readSettings().volume
  if (master) master.gain.value = Math.min(1, volume * 1.4)
  if (context.state === "suspended") void context.resume()
  return volume > 0 ? context : null
}

function tone(
  c: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  {
    type = "sine" as OscillatorType,
    gain = 0.18,
    slideTo,
  }: { type?: OscillatorType; gain?: number; slideTo?: number } = {},
) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(frequency, start)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + duration)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  o.connect(g)
  g.connect(master!)
  o.start(start)
  o.stop(start + duration + 0.02)
}

function noise(
  c: AudioContext,
  start: number,
  duration: number,
  from: number,
  to: number,
  gain = 0.2,
) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const source = c.createBufferSource()
  source.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = "bandpass"
  filter.Q.value = 1.4
  filter.frequency.setValueAtTime(from, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + duration)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.04)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  source.connect(filter)
  filter.connect(g)
  g.connect(master!)
  source.start(start)
}

export function playCue(cue: Cue) {
  const c = audio()
  if (!c || !master) return
  const t = c.currentTime + 0.01
  switch (cue) {
    case "click":
      tone(c, 880, t, 0.05, { type: "square", gain: 0.04 })
      break
    case "success":
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(c, f, t + i * 0.09, 0.42, { type: "triangle", gain: 0.16 }),
      )
      tone(c, 1567.98, t + 0.36, 0.6, { gain: 0.05 })
      break
    case "error":
      tone(c, 196, t, 0.18, { type: "sawtooth", gain: 0.07 })
      tone(c, 155.56, t + 0.16, 0.28, { type: "sawtooth", gain: 0.07 })
      break
    case "unlock":
      tone(c, 392, t, 0.12, { type: "square", gain: 0.05 })
      tone(c, 587.33, t + 0.1, 0.18, { type: "square", gain: 0.05 })
      noise(c, t + 0.22, 0.6, 2400, 500, 0.12)
      break
    case "hint":
      tone(c, 740, t, 0.3, { gain: 0.1 })
      tone(c, 987.77, t + 0.12, 0.4, { gain: 0.08 })
      break
    case "memory":
      ;[987.77, 1318.51, 1975.53].forEach((f, i) => tone(c, f, t + i * 0.07, 0.5, { gain: 0.07 }))
      break
    case "tick":
      tone(c, 1800, t, 0.03, { type: "square", gain: 0.05 })
      tone(c, 1200, t + 0.5, 0.03, { type: "square", gain: 0.04 })
      break
    case "alarm":
      for (let i = 0; i < 3; i++) tone(c, 880, t + i * 0.32, 0.22, { type: "square", gain: 0.06 })
      break
    case "power":
      tone(c, 220, t, 1.4, { type: "sawtooth", gain: 0.12, slideTo: 30 })
      noise(c, t, 1.2, 900, 80, 0.15)
      break
  }
}
