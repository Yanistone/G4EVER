import Phaser from "phaser"

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys
  private readonly keys: {
    Z: Phaser.Input.Keyboard.Key
    Q: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }

  private readonly speed = 220

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player")

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.setCollideWorldBounds(true)

    const keyboard = scene.input.keyboard

    if (!keyboard) {
      throw new Error("Keyboard input is unavailable")
    }

    this.cursors = keyboard.createCursorKeys()

    this.keys = keyboard.addKeys("Z,Q,S,D") as typeof this.keys
  }

  update() {
    const left = this.cursors.left.isDown || this.keys.Q.isDown
    const right = this.cursors.right.isDown || this.keys.D.isDown
    const up = this.cursors.up.isDown || this.keys.Z.isDown
    const down = this.cursors.down.isDown || this.keys.S.isDown

    const velocity = new Phaser.Math.Vector2(
      Number(right) - Number(left),
      Number(down) - Number(up),
    )

    velocity.normalize().scale(this.speed)

    this.setVelocity(velocity.x, velocity.y)
  }
}
