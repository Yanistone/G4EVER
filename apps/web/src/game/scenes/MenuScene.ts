import Phaser from "phaser"

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene")
  }

  create() {
    const { width, height } = this.scale

    this.add
      .text(width / 2, height / 2 - 100, "G4EVER", {
        fontFamily: "Arial",
        fontSize: "72px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const playButton = this.add
      .text(width / 2, height / 2 + 50, "JOUER", {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        backgroundColor: "#2563eb",
        padding: {
          x: 30,
          y: 15,
        },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })

    playButton.on("pointerdown", () => {
      this.scene.start("GameScene")
    })
  }
}
