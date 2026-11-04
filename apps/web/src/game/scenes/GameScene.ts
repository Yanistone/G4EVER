import Phaser from "phaser"

import { Player } from "../entities/Player"

export class GameScene extends Phaser.Scene {
  private player!: Player

  private readonly mapWidth = 2000
  private readonly mapHeight = 1400

  constructor() {
    super("GameScene")
  }

  create() {
    this.createTextures()
    this.createWorld()
    this.createPlayer()
    this.createCamera()
  }

  update() {
    this.player.update()
  }

  private createTextures() {
    if (this.textures.exists("player")) {
      return
    }

    const graphics = this.make.graphics({
      x: 0,
      y: 0,
    })

    graphics.fillStyle(0x3b82f6)
    graphics.fillRoundedRect(0, 0, 32, 40, 6)

    graphics.generateTexture("player", 32, 40)
    graphics.destroy()
  }

  private createWorld() {
    this.add.rectangle(0, 0, this.mapWidth, this.mapHeight, 0x1e293b).setOrigin(0)

    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight)

    const graphics = this.add.graphics()

    graphics.lineStyle(1, 0x334155, 0.5)

    for (let x = 0; x <= this.mapWidth; x += 64) {
      graphics.lineBetween(x, 0, x, this.mapHeight)
    }

    for (let y = 0; y <= this.mapHeight; y += 64) {
      graphics.lineBetween(0, y, this.mapWidth, y)
    }
  }

  private createPlayer() {
    this.player = new Player(this, this.mapWidth / 2, this.mapHeight / 2)
  }

  private createCamera() {
    const camera = this.cameras.main

    camera.startFollow(this.player, true, 0.1, 0.1)

    camera.setBounds(0, 0, this.mapWidth, this.mapHeight)
  }
}
