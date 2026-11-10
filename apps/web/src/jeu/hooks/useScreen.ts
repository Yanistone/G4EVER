import { useCallback, useEffect, useState } from "react"
import { screenIds, type ScreenId } from "../types/navigation"

/** Écrans transitoires : après un rechargement, on retombe sur l'écran stable le plus proche. */
const AFTER_RELOAD: Partial<Record<ScreenId, ScreenId>> = {
  puzzle: "explore",
  campus: "explore",
}

function readScreen(): ScreenId {
  const value = window.location.hash.slice(1)
  return screenIds.includes(value as ScreenId) ? (value as ScreenId) : "launch"
}

export function useScreen() {
  const [screen, setScreen] = useState<ScreenId>(() => {
    const initial = readScreen()
    return AFTER_RELOAD[initial] ?? initial
  })
  useEffect(() => {
    // Un rechargement en pleine partie reprend là où le joueur était, au lieu de
    // le renvoyer à l'écran titre (l'App redirige si le profil ou la partie manque).
    const target = `#${screen}`
    if (window.location.hash !== target)
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}${target}`,
      )
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
