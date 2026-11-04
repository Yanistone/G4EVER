import { addFurniture } from "./furniture"
import { addCampusIdentity } from "./campusIdentity"
import { DOCUMENT_HEIGHTS } from "../game/escape"
import { photographicMaterial, addRealism } from "./realism"
import type { EscapeDocument } from "../game/escape"
import { addArchitecturalDetail } from "./detail"
import { Color3 } from "@babylonjs/core/Maths/math.color.js"
import { Color4 } from "@babylonjs/core/Maths/math.color.js"
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js"
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer.js"
import { PointLight } from "@babylonjs/core/Lights/pointLight.js"
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer.js"
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js"
import { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import { Scene } from "@babylonjs/core/scene.js"
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js"
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { WORLD_DOORS, WORLD_ROOMS, WALKABLE_AREAS, pointInRect } from "../game/world"
import type { WorldRect } from "../game/world"
import { SCALE } from "./controller"
import type { DoorCollider } from "./controller"
import { COLLECTIBLES } from "./inventory"
import type { GameSettings } from "./settings"
export const COLORS = {
  ink: "#1B1030",
  blue: "#2D6BFF",
  cyan: "#2EE6FF",
  pink: "#FF3E7F",
  yellow: "#FFD93B",
  green: "#3DDC6A",
  white: "#F4F6FF",
  purple: "#3A3170",
  skin: "#E8A97C",
  hair: "#3A2418",
}
export const ROOM_COLORS: Record<string, string> = {
  classroom: COLORS.blue,
  cafeteria: COLORS.yellow,
  gaming: COLORS.pink,
  cowork: COLORS.green,
  amphitheater: COLORS.cyan,
  sormiou: COLORS.pink,
  vending: COLORS.cyan,
}
export interface Interaction {
  id: string
  kind: "door" | "station" | "item" | "npc"
  label: string
  roomId?: string
}
export interface DoorState extends DoorCollider {
  id: string
  roomId: string
  desired: number
  leaves: Mesh[]
  width: number
  bases: Vector3[]
}
export interface CampusWorld {
  ready: Promise<void>
  doors: DoorState[]
  items: Map<string, TransformNode>
  stations: Map<string, Mesh>
  shadow: ShadowGenerator
  glow: GlowLayer
  materials: Map<string, PBRMaterial>
  update: (dt: number, time: number, solved: readonly string[]) => void
}
export function material(
  scene: Scene,
  cache: Map<string, PBRMaterial>,
  color: string,
  emissive = false,
) {
  const key = color + emissive
  let m = cache.get(key)
  if (m) return m
  m = new PBRMaterial(key, scene)
  m.albedoColor = Color3.FromHexString(color)
  m.roughness = 0.72
  m.metallic = 0
  m.maxSimultaneousLights = 5
  if (emissive) {
    m.emissiveColor = Color3.FromHexString(color).scale(0.65)
    m.unlit = true
  }
  cache.set(key, m)
  return m
}
export function buildWorld(
  scene: Scene,
  settings: GameSettings,
  documents: readonly EscapeDocument[] = [],
): CampusWorld {
  scene.clearColor = Color4.FromHexString("#BFD6E2ff")
  scene.ambientColor = Color3.FromHexString("#bec8ff")
  scene.fogMode = Scene.FOGMODE_EXP2
  scene.fogDensity = 0.0015
  scene.fogColor = Color3.FromHexString("#C4D8E3")
  const hemi = new HemisphericLight("campus-ambient", new Vector3(0.3, 1, -0.3), scene)
  hemi.intensity = 0.6
  hemi.groundColor = Color3.FromHexString("#8C8B81")
  const sun = new DirectionalLight("soft-key", new Vector3(1, -0.48, 0.3), scene)
  sun.position = new Vector3(-15, 17, 6)
  sun.intensity = 2.1
  sun.diffuse = Color3.FromHexString("#FFF2D6")
  for (const [name, x, y, z, color, intensity] of [
    ["refectory-warm", 18.75, 2.9, 13.125, "#FFF0CE", 13],
    ["crossing-blue", 13.125, 2.8, 13.75, "#9DCCFF", 10],
    ["server-pink", 20, 2.8, 24.375, "#FF8BB5", 8],
  ] as const) {
    const l = new PointLight(name, new Vector3(x, y, z), scene)
    l.diffuse = Color3.FromHexString(color)
    l.intensity = intensity * 0.22
    l.range = 15
  }
  const shadow = new ShadowGenerator(settings.quality === "high" ? 2048 : 1024, sun)
  shadow.useBlurExponentialShadowMap = true
  shadow.blurKernel = 8
  shadow.darkness = 0.35
  const glow = new GlowLayer("neon-bloom", scene, { blurKernelSize: 24, mainTextureRatio: 0.3 })
  glow.intensity = settings.quality === "eco" ? 0 : 0.22
  const materials = new Map<string, PBRMaterial>()
  const mat = (c: string, e = false) =>
    material(
      scene,
      materials,
      c === COLORS.purple ? "#4A4F5C" : c === COLORS.ink ? "#242A34" : c,
      e,
    )
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: string,
    e = false,
  ) => {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
    m.position.set(x, y, z)
    m.material = mat(c, e)
    m.receiveShadows = true
    return m
  }
  const cylinder = (
    name: string,
    x: number,
    y: number,
    z: number,
    r: number,
    h: number,
    c: string,
  ) => {
    const m = MeshBuilder.CreateCylinder(
      name,
      { diameter: r * 2, height: h, tessellation: 12 },
      scene,
    )
    m.position.set(x, y, z)
    m.material = mat(c)
    return m
  }
  function screen(
    name: string,
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    color: string,
    ry = Math.PI,
  ) {
    const tex = new DynamicTexture(name + "-lettering", { width: 1024, height: 256 }, scene, false)
    const ctx = tex.getContext()
    const display = name.includes("monitor") || name === "system-terminal"
    ctx.fillStyle = display ? "#15232B" : "#E5E6DE"
    ctx.fillRect(0, 0, 1024, 256)
    ctx.fillStyle = display ? "#3B7890" : color
    ctx.fillRect(0, 0, 1024, 18)
    ctx.font = "bold 52px Arial"
    ctx.fillStyle = display ? "#B4D8CD" : "#33474B"
    ctx.fillText(text, 45, 100, 940)
    ctx.font = "24px Arial"
    ctx.fillStyle = display ? "#6D979C" : "#6A797B"
    ctx.fillText(
      display ? "G4 SYSTEMS  /  TERMINAL CONNECTÉ" : "INSTITUT G4  /  CAMPUS MARSEILLE",
      45,
      161,
    )
    if (display) {
      ctx.font = "22px monospace"
      ctx.fillText("● système en attente  >  _", 45, 215)
    } else {
      ctx.fillStyle = "#9DA9A7"
      ctx.fillRect(45, 199, 890, 2)
    }
    tex.update()
    const sm = new StandardMaterial(name + "-display", scene)
    sm.diffuseTexture = tex
    sm.emissiveTexture = tex
    sm.disableLighting = true
    const mesh = MeshBuilder.CreatePlane(
      name,
      { width: w, height: h, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    )
    mesh.position.set(x, y, z)
    mesh.rotation.y = ry
    mesh.material = sm
    return mesh
  }

  const xs = [...new Set(WALKABLE_AREAS.flatMap((r) => [r.x, r.x + r.width]))].sort(
      (a, b) => a - b,
    ),
    zs = [...new Set(WALKABLE_AREAS.flatMap((r) => [r.y, r.y + r.height]))].sort((a, b) => a - b)
  const inside = (x: number, z: number) => WALKABLE_AREAS.some((r) => pointInRect({ x, y: z }, r))
  const regions: (WorldRect & { room: string })[] = []
  for (let j = 0; j < zs.length - 1; j++) {
    let band: (WorldRect & { room: string }) | null = null
    for (let i = 0; i < xs.length - 1; i++) {
      const x = (xs[i] + xs[i + 1]) / 2,
        z = (zs[j] + zs[j + 1]) / 2
      if (!inside(x, z)) {
        band = null
        continue
      }
      const room = WORLD_ROOMS.find((r) => pointInRect({ x, y: z }, r.floor))?.id ?? "corridor"
      if (band && band.room === room && band.x + band.width === xs[i])
        band.width += xs[i + 1] - xs[i]
      else {
        band = { x: xs[i], y: zs[j], width: xs[i + 1] - xs[i], height: zs[j + 1] - zs[j], room }
        regions.push(band)
      }
    }
  }
  const surfaceMaterials = new Map<string, PBRMaterial>()
  const surface = (kind: string) => {
    const existing = surfaceMaterials.get(kind)
    if (existing) return existing
    const wood = false,
      carpet = ["classroom", "cowork", "gaming", "amphitheater", "corridor"].includes(kind),
      corridor = kind === "corridor"
    if (carpet) {
      const photo = photographicMaterial(scene, "carpet012", "carpet-" + kind, 1)
      photo.roughness = 1
      photo.bumpTexture!.level = 0.25
      surfaceMaterials.set(kind, photo)
      return photo
    }
    const texture = new DynamicTexture(
        "surface-" + kind,
        { width: 512, height: 512 },
        scene,
        false,
      ),
      ctx = texture.getContext()
    ctx.fillStyle = wood ? "#B18D70" : carpet ? "#797873" : corridor ? "#49495F" : "#D8DCE5"
    ctx.fillRect(0, 0, 512, 512)
    let seed = 23457
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    for (let i = 0; i < 7000; i++) {
      const g = Math.floor(rand() * 40)
      ctx.fillStyle = wood
        ? "rgba(61,36,22," + rand() * 0.09 + ")"
        : "rgba(" + g + "," + g + "," + g + "," + rand() * 0.08 + ")"
      ctx.fillRect(rand() * 512, rand() * 512, wood ? rand() * 60 + 3 : 1.5, wood ? 0.7 : 1.5)
    }
    ctx.strokeStyle = wood ? "#805D43" : carpet ? "#45445B" : corridor ? "#3C3E52" : "#BEC5D3"
    ctx.lineWidth = 2
    if (wood) {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(i * 128, 0)
        ctx.lineTo(i * 128, 512)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(i * 128, i % 2 ? 256 : 0)
        ctx.lineTo((i + 1) * 128, i % 2 ? 256 : 0)
        ctx.stroke()
      }
    } else if (!carpet) ctx.strokeRect(1, 1, 510, 510)
    texture.update()
    const m = new PBRMaterial("floor-material-" + kind, scene)
    m.albedoTexture = texture
    m.roughness = carpet ? 0.98 : wood ? 0.62 : 0.44
    m.metallic = 0
    m.maxSimultaneousLights = 5
    if (carpet) {
      ctx.strokeStyle = "#72716D"
      ctx.lineWidth = 1
      for (let k = 0; k < 4; k++) {
        ctx.strokeRect(k * 128, 0, 128, 512)
        ctx.strokeRect(0, k * 128, 512, 128)
      }
      texture.update()
    }
    if (!carpet) {
      m.dispose()
      texture.dispose()
      const photo = photographicMaterial(
        scene,
        wood ? "herringbone_parquet" : "laminate_floor_02",
        "photographic-floor-" + kind,
      )
      if (corridor) photo.albedoColor = Color3.FromHexString("#E2DFD7")
      surfaceMaterials.set(kind, photo)
      return photo
    }
    surfaceMaterials.set(kind, m)
    return m
  }
  for (const [i, r] of regions.entries()) {
    const floor = MeshBuilder.CreateGround(
      "continuous-floor-" + i,
      { width: r.width * SCALE, height: r.height * SCALE },
      scene,
    )
    floor.position.set((r.x + r.width / 2) * SCALE, 0, (r.y + r.height / 2) * SCALE)
    floor.material = surface(r.room)
    floor.receiveShadows = true
    const vertices = floor.getVerticesData(VertexBuffer.PositionKind)!,
      uv = floor.getVerticesData(VertexBuffer.UVKind)!
    for (let v = 0; v < uv.length / 2; v++) {
      uv[v * 2] = (vertices[v * 3] + floor.position.x) / 2.4
      uv[v * 2 + 1] = (vertices[v * 3 + 2] + floor.position.z) / 2.4
    }
    floor.setVerticesData(VertexBuffer.UVKind, uv)
    box(
      "continuous-ceiling-" + i,
      (r.x + r.width / 2) * SCALE,
      3.39,
      (r.y + r.height / 2) * SCALE,
      r.width * SCALE,
      0.18,
      r.height * SCALE,
      "#C4CAD5",
    )
  }

  const segments: { horizontal: boolean; axis: number; from: number; to: number }[] = []
  for (const z of zs)
    for (let i = 0; i < xs.length - 1; i++)
      if (inside((xs[i] + xs[i + 1]) / 2, z - 0.01) !== inside((xs[i] + xs[i + 1]) / 2, z + 0.01))
        segments.push({ horizontal: true, axis: z, from: xs[i], to: xs[i + 1] })
  for (const x of xs)
    for (let i = 0; i < zs.length - 1; i++)
      if (inside(x - 0.01, (zs[i] + zs[i + 1]) / 2) !== inside(x + 0.01, (zs[i] + zs[i + 1]) / 2))
        segments.push({ horizontal: false, axis: x, from: zs[i], to: zs[i + 1] })
  segments.sort(
    (a, b) => Number(a.horizontal) - Number(b.horizontal) || a.axis - b.axis || a.from - b.from,
  )
  const merged: typeof segments = []
  for (const s of segments) {
    const last = merged.at(-1)
    if (last && last.horizontal === s.horizontal && last.axis === s.axis && last.to === s.from)
      last.to = s.to
    else merged.push({ ...s })
  }
  merged.forEach((s, i) => {
    const len = (s.to - s.from) * SCALE,
      x = (s.horizontal ? (s.from + s.to) / 2 : s.axis) * SCALE,
      z = (s.horizontal ? s.axis : (s.from + s.to) / 2) * SCALE
    const facade = !s.horizontal && (s.axis === 70 || s.axis === 1530)
    if (facade) {
      const frame = "#303A40"
      const glass = mat("#D8E6E6")
      glass.alpha = 0.06
      glass.roughness = 0.07
      glass.metallic = 0.05
      glass.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
      glass.backFaceCulling = false
      const count = Math.max(2, Math.ceil(len / 1.6))
      box(
        "facade-plinth",
        x,
        0.45,
        z,
        s.horizontal ? len : 0.18,
        0.9,
        s.horizontal ? 0.18 : len,
        "#D8D9D6",
      )
      box(
        "facade-header",
        x,
        3.16,
        z,
        s.horizontal ? len : 0.25,
        0.28,
        s.horizontal ? 0.25 : len,
        "#EDEDE8",
      )
      for (let k = 0; k <= count; k++) {
        const offset = -len / 2 + (k * len) / count
        box(
          "facade-mullion",
          x + (s.horizontal ? offset : 0),
          1.95,
          z + (s.horizontal ? 0 : offset),
          s.horizontal ? 0.055 : 0.1,
          2.14,
          s.horizontal ? 0.1 : 0.055,
          frame,
        )
      }
      for (let k = 0; k < count; k++) {
        const offset = -len / 2 + ((k + 0.5) * len) / count
        const pane = box(
          "facade-glazing",
          x + (s.horizontal ? offset : 0),
          1.96,
          z + (s.horizontal ? 0 : offset),
          s.horizontal ? len / count - 0.055 : 0.025,
          2.06,
          s.horizontal ? 0.025 : len / count - 0.055,
          "#D8E6E6",
        )
        pane.material = glass
        pane.isPickable = true
        const inner = s.axis === 70 ? 0.11 : -0.11
        const drop = [0.8, 1.28, 0.52][k % 3]
        const blindMat = mat("#777C7B")
        blindMat.alpha = 0.66
        blindMat.roughness = 1
        const blind = box(
          "campus-window-blind",
          x + inner,
          3.0 - drop / 2,
          z + offset,
          0.018,
          drop,
          len / count - 0.1,
          "#777C7B",
        )
        blind.material = blindMat
        box(
          "campus-blind-cassette",
          x + inner,
          3.01,
          z + offset,
          0.13,
          0.1,
          len / count - 0.04,
          "#343D40",
        )
        box(
          "campus-blind-weight",
          x + inner,
          3.0 - drop,
          z + offset,
          0.028,
          0.025,
          len / count - 0.09,
          "#3B4243",
        )
      }
      return
    }
    box(
      "architectural-wall-" + i,
      x,
      1.65,
      z,
      s.horizontal ? len : 0.16,
      3.3,
      s.horizontal ? 0.16 : len,
      "#E1E2DF",
    )
    box(
      "purple-skirting-" + i,
      x,
      0.07,
      z,
      s.horizontal ? len : 0.19,
      0.14,
      s.horizontal ? 0.19 : len,
      "#686B72",
    )
    box(
      "blue-cornice-" + i,
      x,
      3.12,
      z,
      s.horizontal ? len : 0.2,
      0.08,
      s.horizontal ? 0.2 : len,
      "#CFD3D8",
    )
  })
  WORLD_ROOMS.forEach((r, index) => {
    const f = r.floor,
      c = ROOM_COLORS[r.id],
      x = (f.x + f.width / 2) * SCALE,
      z = (f.y + f.height / 2) * SCALE

    const count = Math.max(1, Math.floor(f.width / 180))
    for (let k = 0; k < count; k++) {
      const lx = (f.x + ((k + 0.5) * f.width) / count) * SCALE
      box("ceiling-light-frame", lx, 3.23, z, 2.6, 0.12, 0.7, COLORS.ink)
      box("ceiling-light-panel", lx, 3.15, z, 2.4, 0.035, 0.52, "#EDF6FF", true)
    }

    screen(
      "room-sign-" + r.id,
      `${String(index + 1).padStart(2, "0")}  /  ${r.label.toUpperCase()}`,
      x,
      2.7,
      (f.y + 3) * SCALE,
      Math.min(4.5, f.width * SCALE - 0.4),
      0.65,
      c,
      Math.PI,
    )
  })

  addFurniture(scene, shadow)
  const doors: DoorState[] = WORLD_DOORS.map((d) => {
    const r = WORLD_ROOMS.find((r) => r.id === d.roomId)!,
      horizontal = d.side === "top" || d.side === "bottom"
    const axis = horizontal
      ? d.side === "top"
        ? r.floor.y
        : r.floor.y + r.floor.height
      : d.side === "left"
        ? r.floor.x
        : r.floor.x + r.floor.width
    const from = horizontal ? d.bounds.x : d.bounds.y,
      to = from + (horizontal ? d.bounds.width : d.bounds.height),
      width = (to - from) * SCALE
    const x = (horizontal ? (from + to) / 2 : axis) * SCALE,
      z = (horizontal ? axis : (from + to) / 2) * SCALE
    box(
      "door-lintel",
      x,
      2.98,
      z,
      horizontal ? width + 0.3 : 0.32,
      0.64,
      horizontal ? 0.32 : width + 0.3,
      "#D8DCDA",
    )
    for (const side of [-1, 1])
      box(
        "door-jamb",
        x + (horizontal ? side * (width / 2 + 0.06) : 0),
        1.33,
        z + (horizontal ? 0 : side * (width / 2 + 0.06)),
        horizontal ? 0.16 : 0.32,
        2.66,
        horizontal ? 0.32 : 0.16,
        "#475760",
      )
    const leaves = [-1, 1].map((side) => {
      const leaf = box(
        "sliding-door-" + d.id,
        x + (horizontal ? (side * width) / 4 : 0),
        1.31,
        z + (horizontal ? 0 : (side * width) / 4),
        horizontal ? width / 2 : 0.14,
        2.6,
        horizontal ? 0.14 : width / 2,
        "#657274",
      )
      const panel = box(
        "door-inlay",
        0,
        0,
        0,
        horizontal ? width / 2 - 0.2 : 0.17,
        2.28,
        horizontal ? 0.17 : width / 2 - 0.2,
        "#A9B5B4",
      )
      panel.parent = leaf
      panel.position.set(0, 0, 0)
      const strip = box(
        "door-lit-edge",
        0,
        0,
        0,
        horizontal ? 0.028 : 0.185,
        0.11,
        horizontal ? 0.185 : 0.028,
        "#8FB49B",
        true,
      )
      strip.parent = leaf
      strip.position.set(0, 0.95, 0)
      const handle = box(
        "door-handle",
        horizontal ? side * width * 0.12 : 0.12,
        0,
        horizontal ? 0.12 : side * width * 0.12,
        horizontal ? 0.028 : 0.12,
        0.48,
        horizontal ? 0.12 : 0.028,
        "#A7AEAE",
      )
      handle.parent = leaf
      const plaque = box(
        "door-inspection-window",
        0,
        0.35,
        0,
        horizontal ? 0.24 : 0.185,
        0.65,
        horizontal ? 0.185 : 0.24,
        "#35454E",
      )
      plaque.parent = leaf
      for (const mesh of [leaf, panel, strip, handle, plaque])
        mesh.metadata = {
          interaction: {
            id: d.id,
            kind: "door",
            label: r.label,
            roomId: r.id,
          } satisfies Interaction,
        }
      return leaf
    })
    return {
      id: d.id,
      roomId: d.roomId,
      horizontal,
      axis,
      from,
      to,
      openness: 0,
      desired: 0,
      leaves,
      width,
      bases: leaves.map((l) => l.position.clone()),
    }
  })
  const stations = new Map<string, Mesh>()
  WORLD_ROOMS.forEach((r) => {
    const p = r.interactionPosition,
      c = ROOM_COLORS[r.id]
    const ring = MeshBuilder.CreateTorus(
      "hologram-" + r.id,
      { diameter: 0.36, thickness: 0.02, tessellation: 24 },
      scene,
    )
    ring.position.set(p.x * SCALE, 1.6, p.y * SCALE)
    ring.rotation.x = Math.PI / 2
    ring.material = mat(c, true)
    const core = MeshBuilder.CreatePolyhedron("station-" + r.id, { type: 1, size: 0.12 }, scene)
    core.position.copyFrom(ring.position)
    core.material = mat(c, true)
    const interaction: Interaction = {
      id: r.id,
      kind: "station",
      label: r.interactionLabel,
      roomId: r.id,
    }
    core.metadata = { interaction }
    ring.metadata = { interaction }
    core.isVisible = false
    core.isPickable = false
    ring.isVisible = false
    ring.isPickable = false
    stations.set(r.id, core)
    const halo = cylinder("station-anchor", p.x * SCALE, 0.025, p.y * SCALE, 0.32, 0.025, c)
    halo.isPickable = false
    halo.isVisible = false
  })
  const items = new Map<string, TransformNode>()
  for (const item of [...COLLECTIBLES, ...documents]) {
    const root = new TransformNode(item.id, scene)
    root.position.set(
      item.position.x * SCALE,
      item.id.startsWith("escape:") || item.id.startsWith("race:")
        ? (DOCUMENT_HEIGHTS[item.room] ?? 0.925)
        : 0.925,
      item.position.y * SCALE,
    )
    const book = box("collectible-" + item.id, 0, 0, 0, 0.48, 0.06, 0.34, "#D6CDB7")
    book.parent = root
    const band = box("document-binding", 0, 0, 0, 0.06, 0.065, 0.35, "#3C505C")
    band.parent = root
    band.position.x = -0.16
    const glyph = screen("document-title", "G4 / NOTES", 0, 0.045, 0, 0.38, 0.2, COLORS.yellow)
    glyph.parent = root
    glyph.rotation.x = Math.PI / 2
    root
      .getChildMeshes()
      .forEach(
        (m) =>
          (m.metadata = {
            interaction: { id: item.id, kind: "item", label: item.name } satisfies Interaction,
          }),
      )
    items.set(item.id, root)
  }

  screen("logic-whiteboard", "3 > 6 > 12 > ?", 5.94, 1.9, 3.35, 4.2, 0.8, COLORS.cyan, Math.PI)
  screen(
    "cowork-whiteboard",
    "DESIGN / ACCESSIBILITE",
    5.94,
    1.9,
    14.1,
    4.2,
    0.8,
    COLORS.green,
    Math.PI,
  )
  addArchitecturalDetail(scene, mat)
  const ready = addRealism(scene, shadow)
  const sky = scene.getMeshByName("daylight-sky")
  if (sky) glow.addExcludedMesh(sky as Mesh)
  addCampusIdentity(scene)
  const staticMeshes = scene.meshes.filter(
    (m) =>
      !m.name.startsWith("sliding-door") &&
      m.isEnabled() &&
      !m.parent &&
      !m.name.includes("glazing") &&
      !m.name.includes("window-blind") &&
      !m.name.includes("roof-glass") &&
      !m.name.startsWith("daylight-") &&
      !m.metadata?.interaction &&
      !m.name.startsWith("station-") &&
      !m.name.startsWith("hologram-"),
  )
  const batches = new Map<string, Mesh[]>()
  for (const m of staticMeshes) {
    const casts =
      m.name.startsWith("fixture:") ||
      m.name.startsWith("campus-") ||
      m.name.includes("body") ||
      m.name.includes("top") ||
      m.name.startsWith("architectural-wall") ||
      m.name.startsWith("continuous-ceiling") ||
      m.name.startsWith("facade-mullion") ||
      m.name.startsWith("roof-beam")
    const key = m.material?.uniqueId + ":" + casts + ":" + m.isPickable
    const group = batches.get(key) ?? []
    group.push(m as Mesh)
    batches.set(key, group)
  }
  for (const [key, meshes] of batches) {
    const merged = Mesh.MergeMeshes(meshes, true, true, undefined, false, false)
    if (merged) {
      merged.name = "campus-batch-" + key
      merged.receiveShadows = true
      merged.freezeWorldMatrix()
      if (key.split(":")[1] === "true") shadow.addShadowCaster(merged)
    }
  }
  for (const m of materials.values()) m.freeze()
  return {
    ready,
    doors,
    items,
    stations,
    shadow,
    glow,
    materials,
    update(dt, time, solved) {
      for (const d of doors) {
        d.openness += (d.desired - d.openness) * Math.min(1, dt * 7)
        d.leaves.forEach((l, i) => {
          l.position.copyFrom(d.bases[i])
          const slide = (i === 0 ? -1 : 1) * d.width * 0.52 * d.openness
          if (d.horizontal) l.position.x += slide
          else l.position.z += slide
        })
      }
      for (const [id, core] of stations) {
        core.rotation.y = time * 0.6
        core.position.y = 1.6 + Math.sin(time * 2) * 0.05
        core.material = mat(solved.includes(id) ? COLORS.green : ROOM_COLORS[id], true)
      }
    },
  }
}
export function doorIntersectsPosition(d: DoorCollider, p: { x: number; y: number }) {
  return (
    Math.abs((d.horizontal ? p.y : p.x) - d.axis) < 20 &&
    (d.horizontal ? p.x : p.y) > d.from - 16 &&
    (d.horizontal ? p.x : p.y) < d.to + 16
  )
}

export function unionContains(rects: readonly WorldRect[], x: number, y: number) {
  return rects.some((r) => pointInRect({ x, y }, r))
}
