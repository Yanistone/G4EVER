export class CampusAudio {
  private context?: AudioContext
  private master?: GainNode
  private drone?: OscillatorNode
  volume = 0.35
  get state() {
    return this.context?.state ?? "idle"
  }
  resume() {
    if (!this.context) {
      this.context = new AudioContext()
      this.master = this.context.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.context.destination)
      this.drone = this.context.createOscillator()
      this.drone.frequency.value = 65.4
      const level = this.context.createGain()
      level.gain.value = 0.018
      this.drone.connect(level)
      level.connect(this.master)
      this.drone.start()
    }
    void this.context.resume()
  }
  setVolume(v: number) {
    this.volume = v
    if (this.master) this.master.gain.setTargetAtTime(v, this.context!.currentTime, 0.1)
  }
  cue(kind: "step" | "door" | "pickup" | "deny" | "talk") {
    const c = this.context,
      master = this.master
    if (!c || !master) return
    const o = c.createOscillator(),
      g = c.createGain(),
      t = c.currentTime
    o.type = kind === "step" ? "triangle" : "sine"
    const f = { step: 100, door: 180, pickup: 660, deny: 120, talk: 330 }[kind]
    o.frequency.setValueAtTime(f, t)
    o.frequency.exponentialRampToValueAtTime(kind === "pickup" ? 1320 : f * 0.55, t + 0.18)
    g.gain.setValueAtTime(kind === "step" ? 0.1 : 0.17, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
    o.connect(g)
    g.connect(master)
    o.start()
    o.stop(t + 0.23)
  }
  suspend() {
    void this.context?.suspend()
  }
  dispose() {
    this.drone?.stop()
    void this.context?.close()
  }
}
