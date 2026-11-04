import { useEffect, useRef } from "react"
import Phaser from "phaser"

import { gameConfig } from "../game/config"
import type { PlayerPosition } from "../game/session"

export function PhaserGame({ initialPosition }: { initialPosition: PlayerPosition }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spawnRef = useRef(initialPosition)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    const game = new Phaser.Game({
      ...gameConfig,
      parent: container,
      callbacks: {
        preBoot: (instance) => instance.registry.set("playerPosition", spawnRef.current),
      },
    })

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full [&_canvas]:block" />
}
