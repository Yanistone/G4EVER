import Phaser from "phaser"

import { Player } from "../entities/Player"
import { gameEvents, GAME_EVENTS } from "../events"
import { INITIAL_POSITION, isPlayerPosition } from "../session"

export class GameScene extends Phaser.Scene {
  private player!: Player

  private readonly mapWidth = 2000
  private readonly mapHeight = 1400
  private lastPosition = { ...INITIAL_POSITION }
  private lastPositionEvent = 0

  constructor() {
    super("GameScene")
  }

  create() {
    this.createTextures()
    this.createWorld()
    this.createPlayer()
    this.createCamera()
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.publishPosition())
  }

  update() {
    this.player.update()
    if (this.time.now - this.lastPositionEvent >= 200) {
      this.publishPosition()
      this.lastPositionEvent = this.time.now
    }
  }

  private publishPosition() {
    const position = { x: this.player.x, y: this.player.y }
    if (position.x === this.lastPosition.x && position.y === this.lastPosition.y) return
    this.lastPosition = position
    gameEvents.emit(GAME_EVENTS.playerMoved, position)
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
    const saved: unknown = this.registry.get("playerPosition")
    const position = isPlayerPosition(saved) ? saved : INITIAL_POSITION
    this.player = new Player(this, position.x, position.y)
    this.lastPosition = { ...position }
  }

  private createCamera() {
    const camera = this.cameras.main

    camera.startFollow(this.player, true, 0.1, 0.1)

    camera.setBounds(0, 0, this.mapWidth, this.mapHeight)
  }
}
