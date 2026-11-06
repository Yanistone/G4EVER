import { test, expect } from "@playwright/test"
import {
  WORLD_DOORS,
  WORLD_OBSTACLES,
  WORLD_CHAIRS,
  WORLD_ROOMS,
  canWalkAt,
  moveWithCollisions,
  findWalkPath,
  START_POSITION,
  getNearbyInteraction,
} from "../../apps/web/src/jeu/game/world"

test("all nine doorways have furniture-free approach areas", () => {
  for (const door of WORLD_DOORS)
    for (const item of [...WORLD_OBSTACLES, ...WORLD_CHAIRS]) {
      const a = door.clearance,
        b = item
      const overlap =
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
      expect(overlap, `${door.id}: furniture ${item.id} blocks clearance`).toBe(false)
    }
})
test("every doorway can be crossed straight in both directions at walking speed", () => {
  for (const door of WORLD_DOORS) {
    const d = door.bounds
    const vertical = door.side === "left" || door.side === "right"
    const center = { x: d.x + d.width / 2, y: d.y + d.height / 2 }
    const from = vertical ? { x: d.x - 20, y: center.y } : { x: center.x, y: d.y - 20 }
    const to = vertical
      ? { x: d.x + d.width + 20, y: center.y }
      : { x: center.x, y: d.y + d.height + 20 }
    expect(canWalkAt(from), door.id + " entry").toBe(true)
    expect(canWalkAt(to), door.id + " exit").toBe(true)
    const crossed = moveWithCollisions(from, to.x - from.x, to.y - from.y)
    expect(crossed.x, door.id).toBeCloseTo(to.x)
    expect(crossed.y, door.id).toBeCloseTo(to.y)
    const back = moveWithCollisions(to, from.x - to.x, from.y - to.y)
    expect(back.x, door.id + " return").toBeCloseTo(from.x)
    expect(back.y, door.id + " return").toBeCloseTo(from.y)
  }
})
test("click-to-walk reaches an interaction in every room with the actual player footprint", () => {
  for (const room of WORLD_ROOMS) {
    const path = findWalkPath(START_POSITION, room.interactionPosition)
    expect(path.length, room.id).toBeGreaterThan(0)
    expect(path.every(canWalkAt), room.id).toBe(true)
    expect(getNearbyInteraction(path.at(-1)!)?.id).toBe(room.id)
  }
})
