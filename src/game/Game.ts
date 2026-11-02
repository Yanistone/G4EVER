import { Engine, Scene } from "@babylonjs/core";
import { createMainScene } from "./scenes/MainScene";

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = createMainScene(this.engine, canvas);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    window.addEventListener("resize", this.handleResize);
  }

  private readonly handleResize = () => {
    this.engine.resize();
  };

  dispose() {
    window.removeEventListener("resize", this.handleResize);
    this.scene.dispose();
    this.engine.dispose();
  }
}
