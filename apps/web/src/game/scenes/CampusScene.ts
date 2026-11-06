import Phaser from "phaser"

import { Player } from "../entities/Player"
import { gameEvents, GAME_EVENTS } from "../events"
import { CAMPUS_EVENTS } from "../campusEvents"
import type { InteractionRequest } from "../campusEvents"
import {
  canWalkAt,
  getNearbyInteraction,
  getRoomAt,
  START_POSITION,
  WALKABLE_AREAS,
  WORLD_BOUNDS,
  WORLD_CHAIRS,
  WORLD_DOORS,
  WORLD_OBSTACLES,
  WORLD_ROOMS,
} from "../world"
import type { PlayerPosition } from "../../types/game"
import { campusAudio, isCampusSoundEnabled } from "../../services/campusSound"

export class CampusScene extends Phaser.Scene {
  private player!: Player
  private controlsEnabled = true
  private lastReport = 0
  private lastStep = 0
  private previousRoom = ""
  private seed = ""

  constructor() {
    super("GameScene")
  }

  create() {
    this.seed = this.registry.get("challengeSeed") as string
    this.drawCampus()
    const saved: unknown = this.registry.get("playerPosition")
    const candidate = saved as PlayerPosition | undefined
    const spawn = candidate && canWalkAt(candidate) ? candidate : START_POSITION
    this.player = new Player(this, spawn.x, spawn.y)
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS.width, WORLD_BOUNDS.height)
    this.cameras.main.setZoom(0.9).startFollow(this.player, true, 0.15, 0.15)

    const controls = (enabled: boolean) => {
      this.controlsEnabled = enabled
      this.input.keyboard?.resetKeys()
      if (this.input.keyboard) {
        this.input.keyboard.enabled = enabled
        if (enabled)
          this.input.keyboard.addCapture([
            "Z",
            "Q",
            "S",
            "D",
            "W",
            "A",
            "UP",
            "DOWN",
            "LEFT",
            "RIGHT",
          ])
        else this.input.keyboard.clearCaptures()
      }
      if (!enabled) campusAudio.suspend()
      else if (isCampusSoundEnabled()) campusAudio.resume()
    }
    gameEvents.on(CAMPUS_EVENTS.controls, controls)
    this.input.keyboard?.on("keydown-E", (event: KeyboardEvent) => {
      if (event.repeat || !this.controlsEnabled) return
      const room = getNearbyInteraction(this.player)
      if (!room) return
      controls(false)
      if (isCampusSoundEnabled()) campusAudio.cue("pickup")
      const request: InteractionRequest = { roomId: room.id, seed: this.seed }
      if (room.kind === "puzzle") gameEvents.emit(CAMPUS_EVENTS.puzzleRequested, request)
      if (!request.handled) gameEvents.emit(CAMPUS_EVENTS.inspect, request)
    })
    const visibility = () => {
      this.input.keyboard?.resetKeys()
      if (document.hidden) campusAudio.suspend()
      else if (this.controlsEnabled && isCampusSoundEnabled()) campusAudio.resume()
    }
    document.addEventListener("visibilitychange", visibility)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.publishPosition()
      gameEvents.off(CAMPUS_EVENTS.controls, controls)
      document.removeEventListener("visibilitychange", visibility)
      campusAudio.suspend()
    })
    if (isCampusSoundEnabled()) campusAudio.resume()
    gameEvents.emit(CAMPUS_EVENTS.ready, { seed: this.seed, position: spawn })
    this.publishPosition()
  }

  update(time: number, delta: number) {
    this.player.update(delta, this.controlsEnabled && !document.hidden)
    if (time - this.lastReport >= 100) {
      this.publishPosition()
      this.lastReport = time
    }
    if (this.player.moving && time - this.lastStep >= 380 && isCampusSoundEnabled()) {
      campusAudio.cue("step")
      this.lastStep = time
    }
    const room = getRoomAt(this.player)?.id ?? "corridor"
    if (room !== this.previousRoom) {
      if (this.previousRoom && isCampusSoundEnabled()) campusAudio.cue("door")
      this.previousRoom = room
    }
  }

  private publishPosition() {
    gameEvents.emit(GAME_EVENTS.playerMoved, { x: this.player.x, y: this.player.y })
  }

  private drawCampus() {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x160f38).fillRect(0, 0, WORLD_BOUNDS.width, WORLD_BOUNDS.height)
    for (const area of WALKABLE_AREAS)
      graphics.fillStyle(0x3a3170).fillRect(area.x, area.y, area.width, area.height)
    for (const room of WORLD_ROOMS) {
      const { x, y, width, height } = room.floor
      graphics.fillStyle(0x2b2552).fillRect(x, y, width, height)
      graphics.lineStyle(7, 0x9383ce).strokeRect(x, y, width, height)
      this.add
        .text(x + width / 2, y + 28, room.label, {
          fontFamily: "Arial",
          fontSize: "22px",
          color: "#ffffff",
        })
        .setOrigin(0.5)
      graphics
        .fillStyle(room.kind === "final" ? 0xff3e7f : 0xffd93b, 0.3)
        .fillCircle(room.interactionPosition.x, room.interactionPosition.y, 30)
      this.add
        .text(room.interactionPosition.x, room.interactionPosition.y, "E", {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffd93b",
        })
        .setOrigin(0.5)
    }
    for (const door of WORLD_DOORS) {
      const { x, y, width, height } = door.bounds
      graphics.fillStyle(0x3a3170).fillRect(x, y, width, height)
    }
    for (const item of [...WORLD_OBSTACLES, ...WORLD_CHAIRS]) {
      graphics.fillStyle(
        "kind" in item &&
          typeof item.kind === "string" &&
          ["terminal", "arcade", "vending"].includes(item.kind)
          ? 0x2ee6ff
          : 0xd5a15e,
      )
      graphics.fillRoundedRect(item.x, item.y, item.width, item.height, 5)
      graphics.lineStyle(3, 0x1b1030).strokeRoundedRect(item.x, item.y, item.width, item.height, 5)
    }
  }
}
