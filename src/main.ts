import { Game } from "./game/Game";
import "./style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");

if (!canvas) {
  throw new Error("Game canvas not found");
}

new Game(canvas);
