import { useEffect, useRef } from "react"
import Phaser from "phaser"

import { gameConfig } from "../game/config"

export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const game = new Phaser.Game({
      ...gameConfig,
      parent: container,
    })

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full [&_canvas]:block" />
}
