import { useCallback, useEffect, useState } from "react"
import { screenIds, type ScreenId } from "../types/navigation"

function readScreen(): ScreenId {
  const value = window.location.hash.slice(1)
  return screenIds.includes(value as ScreenId) ? (value as ScreenId) : "launch"
}

export function useScreen() {
  const [screen, setScreen] = useState<ScreenId>(readScreen)
  useEffect(() => {
    const update = () => setScreen(readScreen())
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  const navigate = useCallback((target: ScreenId) => {
    window.location.hash = target
    setScreen(target)
  }, [])
  return { screen, navigate }
}
