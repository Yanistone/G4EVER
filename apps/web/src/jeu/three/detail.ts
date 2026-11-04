import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import type { Scene } from "@babylonjs/core/scene.js"
import { WORLD_ROOMS } from "../game/world"
import { SCALE } from "./controller"

export function addArchitecturalDetail(
  scene: Scene,
  base: (color: string, glow?: boolean) => PBRMaterial,
) {
  const mat = (c: string) => base(c)
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
  ) => {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
    m.position.set(x, y, z)
    m.material = mat(c)
    m.receiveShadows = true
    return m
  }
  const cyl = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    height: number,
    c: string,
  ) => {
    const m = MeshBuilder.CreateCylinder(name, { diameter, height, tessellation: 16 }, scene)
    m.position.set(x, y, z)
    m.material = mat(c)
    return m
  }
  for (const room of WORLD_ROOMS) {
    const f = room.floor,
      x = (f.x + f.width / 2) * SCALE,
      z = (f.y + f.height / 2) * SCALE

    for (let i = 1; i < f.height / 24; i++)
      box(
        "acoustic-ceiling-joint",
        x,
        3.292,
        (f.y + i * 24) * SCALE,
        f.width * SCALE - 0.15,
        0.012,
        0.025,
        "#ADB5C7",
      )
    for (let i = 1; i < f.width / 24; i++)
      box(
        "acoustic-ceiling-joint",
        (f.x + i * 24) * SCALE,
        3.291,
        z,
        0.025,
        0.013,
        f.height * SCALE - 0.15,
        "#ADB5C7",
      )
    cyl("smoke-detector", (f.x + 12) * SCALE, 3.23, (f.y + 12) * SCALE, 0.18, 0.08, "#F4F6FF")
    {
      box("vent-frame", x - 1, 3.26, z - 1, 1.1, 0.06, 0.65, "#8793AA")
      for (let i = 0; i < 9; i++)
        box("vent-slat", x - 1.45 + i * 0.11, 3.22, z - 1, 0.025, 0.025, 0.56, "#D8DDE7")
    }
    const clock = MeshBuilder.CreateCylinder(
      "wall-clock",
      { diameter: 0.52, height: 0.06, tessellation: 32 },
      scene,
    )
    clock.rotation.x = Math.PI / 2
    clock.position.set((f.x + f.width - 20) * SCALE, 2.7, (f.y + 3) * SCALE)
    clock.material = mat("#29283E")
    const face = MeshBuilder.CreateCylinder(
      "clock-face",
      { diameter: 0.46, height: 0.065, tessellation: 32 },
      scene,
    )
    face.rotation.x = Math.PI / 2
    face.position.copyFrom(clock.position)
    face.position.z += 0.012
    face.material = mat("#F4F6FF")
    box(
      "clock-hour-hand",
      face.position.x - 0.03,
      2.74,
      face.position.z + 0.04,
      0.022,
      0.15,
      0.008,
      "#1B1030",
    )
    const minute = box(
      "clock-minute-hand",
      face.position.x + 0.07,
      2.7,
      face.position.z + 0.04,
      0.17,
      0.015,
      0.008,
      "#1B1030",
    )
    minute.rotation.z = 0.1
  }

  for (const [x, z] of [
    [11.53, 11.25],
    [28.38, 12.5],
    [11.53, 16.88],
  ]) {
    box("safety-cabinet", x, 1.5, z, 0.11, 0.85, 0.6, "#DF365D")
    box("safety-cabinet-window", x + 0.065, 1.5, z, 0.025, 0.62, 0.42, "#8BABC1")
    cyl("wall-conduit", x, 2.93, z, 0.035, 1.8, "#8B93AB").rotation.z = Math.PI / 2
  }
}
