import { useEffect, useRef } from "react"
import Phaser from "phaser"

import { gameConfig } from "../game/config"
import { getCampaignSeed } from "../game/campaignRun"
import { START_POSITION } from "../game/world"
import type { PlayerPosition } from "../types/game"

export function PhaserGame({ initialPosition }: { initialPosition?: PlayerPosition }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spawnRef = useRef(initialPosition ?? START_POSITION)

  useEffect(() => {
    const container = containerRef.current

    if (!container) return

    let game: Phaser.Game | undefined
    const frame = window.requestAnimationFrame(() => {
      game = new Phaser.Game({
        ...gameConfig,
        parent: container,
        callbacks: {
          preBoot: (instance) => {
            instance.registry.set("playerPosition", spawnRef.current)
            instance.registry.set("challengeSeed", getCampaignSeed())
          },
        },
      })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      game?.destroy(true)
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full [&_canvas]:block" />
}
