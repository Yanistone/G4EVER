import Phaser from "phaser"
import { moveWithCollisions, WALK_SPEED } from "../world"

export class Player extends Phaser.GameObjects.Sprite {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>
  private direction = "down"
  moving = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "noah-down-1")

    scene.add.existing(this)
    this.setDisplaySize(48, 54).setOrigin(0.5, 0.94).setDepth(100)

    const keyboard = scene.input.keyboard

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable")
    }

    this.keys = keyboard.addKeys("Z,Q,S,D,W,A,UP,DOWN,LEFT,RIGHT") as typeof this.keys
  }

  update(delta = 0, active = true) {
    const down = (names: string[]) => names.some((name) => this.keys[name].isDown)
    const dx = active ? Number(down(["RIGHT", "D"])) - Number(down(["LEFT", "Q", "A"])) : 0
    const dy = active ? Number(down(["DOWN", "S"])) - Number(down(["UP", "Z", "W"])) : 0
    const length = Math.hypot(dx, dy)
    const before = { x: this.x, y: this.y }
    if (length) {
      const distance = (WALK_SPEED * Math.min(delta, 50)) / 1000 / length
      const next = moveWithCollisions(before, dx * distance, dy * distance)
      this.setPosition(next.x, next.y)
      this.direction =
        Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down"
    }
    this.moving = Math.hypot(this.x - before.x, this.y - before.y) > 0.01
    const frame = this.moving ? (Math.floor(this.scene.time.now / 125) % 4) + 1 : 1
    this.setTexture(`noah-${this.direction}-${frame}`)
  }
}
