import { STATION_TARGETS } from "../game/escape"
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { canWalkAt, moveWithCollisions, START_POSITION, getRoomAt } from "../game/world"
import type { PlayerPosition } from "../types/game"
import type { GameSettings } from "./settings"
export const SCALE = 0.025
export interface DoorCollider {
  horizontal: boolean
  axis: number
  from: number
  to: number
  openness: number
}
export function canPassDoors(p: PlayerPosition, doors: readonly DoorCollider[]) {
  return !doors.some(
    (d) =>
      d.openness < 0.88 &&
      Math.abs((d.horizontal ? p.y : p.x) - d.axis) < 18 &&
      (d.horizontal ? p.x : p.y) > d.from - 16 &&
      (d.horizontal ? p.x : p.y) < d.to + 16,
  )
}
export class FpsController {
  position: PlayerPosition
  keys = new Set<string>()
  yaw = 0
  pitch = 0
  private vx = 0
  private vy = 0
  moving = false
  constructor(
    private camera: UniversalCamera,
    position: PlayerPosition,
  ) {
    this.position = canWalkAt(position) ? { ...position } : { ...START_POSITION }
    this.camera.inputs.clear()
    this.camera.inertia = 0
    this.camera.rotationQuaternion = null
    this.camera.minZ = 0.08
    this.camera.maxZ = 110

    const room = getRoomAt(this.position)
    const aim = room ? STATION_TARGETS[room.id] : { x: 774, y: 600 }
    this.yaw = Math.atan2(aim.x - this.position.x, aim.y - this.position.y)
    this.pitch = Math.min(
      0.65,
      Math.atan2(
        1.72 - ("height" in aim ? Number(aim.height) : 1.6),
        Math.hypot(aim.x - this.position.x, aim.y - this.position.y) * SCALE,
      ),
    )
    this.sync(1.72)
  }
  look(dx: number, dy: number, sensitivity: number) {
    if (![dx, dy, sensitivity].every(Number.isFinite) || Math.abs(dx) > 1000 || Math.abs(dy) > 1000)
      return
    const speed = 0.002 * Math.max(0.25, Math.min(2.5, sensitivity))
    this.setLook(this.yaw + dx * speed, this.pitch + dy * speed)
  }
  setLook(yaw: number, pitch: number) {
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) return
    this.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw))
    this.pitch = Math.max(-1.35, Math.min(1.35, pitch))
  }
  stop() {
    this.keys.clear()
    this.vx = this.vy = 0
    this.moving = false
  }
  teleport(p: PlayerPosition) {
    if (canWalkAt(p)) {
      this.position = { ...p }
      this.stop()
      this.sync(1.72)
    }
  }
  private sync(height: number) {
    this.camera.position.set(this.position.x * SCALE, height, this.position.y * SCALE)
    this.camera.rotation.set(this.pitch, this.yaw, 0)
  }
  update(
    dt: number,
    enabled: boolean,
    settings: GameSettings,
    doors: readonly DoorCollider[],
    npcs: readonly PlayerPosition[],
  ) {
    let forward = 0,
      side = 0
    const has = (...keys: string[]) => keys.some((k) => this.keys.has(k))
    if (enabled) {
      forward = Number(has("KeyW", "KeyZ", "ArrowUp")) - Number(has("KeyS", "ArrowDown"))
      side = Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "KeyQ", "ArrowLeft"))
    }
    const crouch = enabled && has("ControlLeft", "ControlRight")
    const sprint = enabled && has("ShiftLeft", "ShiftRight") && !crouch
    const speed = crouch ? 68 : sprint ? 200 : 145,
      norm = Math.max(1, Math.hypot(forward, side))
    const targetX = ((Math.sin(this.yaw) * forward + Math.cos(this.yaw) * side) * speed) / norm
    const targetY = ((Math.cos(this.yaw) * forward - Math.sin(this.yaw) * side) * speed) / norm
    const blend = 1 - Math.exp(-dt * 12)
    this.vx += (targetX - this.vx) * blend
    this.vy += (targetY - this.vy) * blend
    const steps = Math.max(
      1,
      Math.ceil(Math.max(Math.abs(this.vx * dt), Math.abs(this.vy * dt)) / 3),
    )
    const before = this.position
    for (let i = 0; i < steps; i++) {
      const next = moveWithCollisions(this.position, (this.vx * dt) / steps, (this.vy * dt) / steps)
      const clear = (p: PlayerPosition) =>
        canPassDoors(p, doors) && !npcs.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 25)
      if (clear(next)) this.position = next
      else {
        const x = { x: next.x, y: this.position.y },
          y = { x: this.position.x, y: next.y }
        if (clear(x) && canWalkAt(x)) this.position = x
        else if (clear(y) && canWalkAt(y)) this.position = y
      }
    }
    this.moving =
      enabled && Math.hypot(this.position.x - before.x, this.position.y - before.y) > 0.04
    const targetHeight = crouch ? 1.05 : 1.72
    const height =
      this.camera.position.y + (targetHeight - this.camera.position.y) * (1 - Math.exp(-dt * 12))
    this.sync(height)
    this.camera.fov = (settings.fov * Math.PI) / 180
  }
  forward() {
    return new Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw))
  }
}
