import type { Mesh } from "@babylonjs/core/Meshes/mesh.js"

export interface SlidingDoorPart {
  mesh: Mesh
  width: number
  offset: number
}

export function fitDoorPart(
  part: SlidingDoorPart,
  horizontal: boolean,
  leafPosition: number,
  from: number,
  to: number,
) {
  const axis = horizontal ? "x" : "z"
  const center = leafPosition + part.offset
  const min = Math.max(from, center - part.width / 2)
  const max = Math.min(to, center + part.width / 2)
  const visible = max - min > 0.0001
  part.mesh.setEnabled(visible)
  if (!visible) return
  part.mesh.scaling[axis] = (max - min) / part.width
  part.mesh.position[axis] = (min + max) / 2 - leafPosition
}
