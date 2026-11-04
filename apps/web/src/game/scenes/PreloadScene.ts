import Phaser from "phaser"

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene")
  }

  preload() {
    for (const direction of ["up", "down", "left", "right"]) {
      for (let frame = 1; frame <= 4; frame += 1) {
        this.load.svg(`noah-${direction}-${frame}`, `/assets/noah/${direction}-${frame}.svg`)
      }
    }
  }

  create() {
    this.scene.start("GameScene")
  }
}
