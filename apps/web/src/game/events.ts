import Phaser from "phaser"

export const gameEvents = new Phaser.Events.EventEmitter()
export const GAME_EVENTS = { puzzleSolved: "puzzle:solved", playerMoved: "player:moved" } as const
