import { readSettings } from "../../three/settings"
import { useEffect, useRef, useState } from "react"
export function CampusBackdrop() {
  const [live, setLive] = useState(
    () =>
      !matchMedia("(prefers-reduced-motion: reduce)").matches && readSettings().quality !== "eco",
  )
  useEffect(() => {
    const listener = () =>
      setLive(
        !matchMedia("(prefers-reduced-motion: reduce)").matches && readSettings().quality !== "eco",
      )
    window.addEventListener("g4-settings", listener)
    return () => window.removeEventListener("g4-settings", listener)
  }, [])
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!live) return
    let gone = false,
      dispose: (() => void) | undefined
    void Promise.all([import("../../three/runtime"), document.fonts.ready]).then(([m]) => {
      if (gone || !canvas.current) return
      try {
        const runtime = m.createCampusRuntime(
          canvas.current,
          { active: false, position: { x: 690, y: 590 }, solved: [], inventory: [] },
          {
            move: () => {},
            interact: () => {},
            pause: () => {},
            map: () => {},
            inventory: () => {},
            target: () => {},
            lock: () => {},
            toast: () => {},
            talk: () => {},
            pickup: () => {},
            error: () => {},
          },
          "menu",
          true,
        )
        void runtime.ready.catch(() => {})
        dispose = () => runtime.dispose()
      } catch {}
    })
    return () => {
      gone = true
      dispose?.()
    }
  }, [live])
  return live ? (
    <canvas ref={canvas} className="campus-backdrop" aria-hidden="true" />
  ) : (
    <img className="campus-backdrop" src="/assets/campus-backdrop.jpg" alt="" />
  )
}
