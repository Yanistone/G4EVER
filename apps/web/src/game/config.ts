import Phaser from "phaser"

import { BootScene } from "./scenes/BootScene"
import { PreloadScene } from "./scenes/PreloadScene"
import { GameScene } from "./scenes/GameScene"

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,

  parent: "game",

  width: 1280,
  height: 720,

  backgroundColor: "#111827",

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },

  scene: [BootScene, PreloadScene, GameScene],
}
