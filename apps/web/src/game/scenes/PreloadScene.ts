import Phaser from "phaser"

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene")
  }

  preload() {
    // Chargement des assets
  }

  create() {
    this.scene.start("GameScene")
  }
}
