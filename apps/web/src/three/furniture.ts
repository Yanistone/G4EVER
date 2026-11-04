import { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import type { Scene } from "@babylonjs/core/scene.js"
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js"
import { WORLD_OBSTACLES, WORLD_ROOMS } from "../game/world"
import { SCALE } from "./controller"
import { propKit } from "./props"
import type { PropKit } from "./props"
import type { Interaction } from "./world"

const stations = new Set([
  "gaming-arcade",
  "vending-a",
  "vending-b",
  "class-terminal",
  "class-desk-0-0",
  "cafeteria-terminal",
  "cowork-table-a",
  "amphi-row-570",
  "sormiou-console",
])
export function addFurniture(scene: Scene, shadow: ShadowGenerator) {
  const p = propKit(scene),
    { box, cyl, ball, tube, mat, texture, label, black, steel, rubber, white, paint } = p
  const accent = mat("arcade-red-enamel", "#8C2625", 0.28, 0.12),
    blue = mat("arcade-blue-enamel", "#215764", 0.32, 0.1),
    wood = mat("beech-edge", "#A28865", 0.67)
  const screen = texture(
    "workstation-LCD",
    1024,
    640,
    (c) => {
      c.fillStyle = "#131D25"
      c.fillRect(0, 0, 1024, 640)
      c.fillStyle = "#253845"
      c.fillRect(0, 0, 1024, 48)
      c.fillStyle = "#C7D8D8"
      c.font = "19px monospace"
      c.fillText("G4 SYSTEMS     Applications     Terminal", 24, 31)
      c.fillStyle = "#0B151B"
      c.fillRect(30, 90, 964, 500)
      c.font = "24px monospace"
      ;[
        "g4@campus:~$ diagnostics --all",
        "",
        "✓ network interface detected",
        "✓ campus / marseille",
        "",
        "> Module en attente de réparation",
        "",
        "Consulter le journal de maintenance.",
        "_",
      ].forEach((t, i) => {
        c.fillStyle = i === 5 ? "#D4B87B" : "#8BB4AE"
        c.fillText(t, 62, 145 + i * 44)
      })
    },
    0.35,
  )
  const keys = texture("keyboard-legends", 1024, 256, (c) => {
    c.fillStyle = "#C0C3C2"
    c.fillRect(0, 0, 1024, 256)
    c.fillStyle = "#151C20"
    c.font = "27px monospace"
    ;["1234567890", "AZERTYUIOP", "QSDFGHJKLM", "WXCVBN,;:!"].forEach((s, row) =>
      [...s].forEach((s, col) => c.fillText(s, 18 + col * 99, 45 + row * 62)),
    )
  })
  function monitor(x: number, y: number, z: number, rotation = 0) {
    const start = scene.meshes.length
    box("monitor-foot", x, y + 0.012, z, 0.29, 0.025, 0.21, paint, 0.012)
    box("monitor-neck", x, y + 0.16, z - 0.025, 0.055, 0.29, 0.045, steel)
    box("monitor-back", x, y + 0.44, z - 0.026, 0.565, 0.344, 0.053, black, 0.016)
    box("monitor-vent-inset", x, y + 0.47, z - 0.057, 0.32, 0.13, 0.012, rubber)
    for (let i = 0; i < 20; i++)
      box(
        "monitor-cooling-slot",
        x - 0.145 + i * 0.015,
        y + 0.47,
        z - 0.065,
        0.005,
        0.1,
        0.003,
        paint,
        0.001,
      )
    box("LCD-black-bezel", x, y + 0.44, z + 0.004, 0.548, 0.324, 0.012, rubber, 0.008)
    label("LCD-glass", x, y + 0.448, z + 0.012, 0.523, 0.293, screen)
    label(
      "monitor-back-mark",
      x,
      y + 0.43,
      z - 0.067,
      0.055,
      0.026,
      texture("G4-monitor-label", 128, 64, (c) => {
        c.fillStyle = "#292F34"
        c.fillRect(0, 0, 128, 64)
        c.fillStyle = "#AAAEB0"
        c.font = "bold 36px Arial"
        c.fillText("G4", 34, 46)
      }),
      0,
    )
    const led = mat("status-led", "#8DAF9C", 0.25)
    led.emissiveColor.set(0.12, 0.25, 0.16)
    ball("monitor-power-led", x + 0.25, y + 0.292, z + 0.013, 0.004, 0.004, 0.002, led)
    tube(
      "monitor-cable",
      [
        [x, y + 0.2, z - 0.06],
        [x + 0.04, y + 0.04, z - 0.18],
        [x + 0.07, y - 0.35, z - 0.25],
        [x + 0.09, 0.12, z - 0.25],
      ],
      0.004,
      rubber,
    )
    box("keyboard-body", x, y + 0.021, z + 0.33, 0.435, 0.034, 0.145, black, 0.007)
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 14; col++) {
        const key = box(
          "keyboard-keycap",
          x - 0.201 + col * 0.031,
          y + 0.044,
          z + 0.277 + row * 0.031,
          0.027,
          0.012,
          0.025,
          paint,
          0.002,
        )
        if (col < 10) {
          const glyph = label(
            "key-legend",
            key.position.x,
            y + 0.051,
            key.position.z,
            0.019,
            0.019,
            keys,
          )
          glyph.rotation.set(Math.PI / 2, 0, 0)
          const uv = glyph.getVerticesData("uv")!
          for (let k = 0; k < uv.length; k += 2) {
            uv[k] = (col + uv[k]) / 10
            uv[k + 1] = (3 - row + uv[k + 1]) / 4
          }
          glyph.setVerticesData("uv", uv)
        }
      }
    box("keyboard-spacebar", x, y + 0.046, z + 0.395, 0.16, 0.014, 0.022, paint, 0.003)
    ball("optical-mouse", x + 0.33, y + 0.029, z + 0.33, 0.065, 0.045, 0.112, black)
    box("mouse-scroll", x + 0.33, y + 0.052, z + 0.315, 0.006, 0.008, 0.024, rubber, 0.002)
    tube(
      "mouse-cable",
      [
        [x + 0.33, y + 0.04, z + 0.27],
        [x + 0.35, y + 0.013, z + 0.14],
        [x + 0.2, y + 0.013, z + 0.07],
      ],
      0.0025,
      rubber,
    )
    if (rotation) {
      const pivot = new Vector3(x, 0, z)
      for (const m of scene.meshes.slice(start)) {
        const a = m.position.subtract(pivot)
        m.position.set(
          pivot.x + Math.cos(rotation) * a.x + Math.sin(rotation) * a.z,
          m.position.y,
          pivot.z - Math.sin(rotation) * a.x + Math.cos(rotation) * a.z,
        )
        m.rotation.y += rotation
      }
    }
  }
  for (const f of WORLD_OBSTACLES) {
    if (["sofa", "armchair", "plant", "equipment"].includes(f.kind)) continue
    const start = scene.meshes.length,
      x = (f.x + f.width / 2) * SCALE,
      z = (f.y + f.height / 2) * SCALE,
      w = f.width * SCALE,
      d = f.height * SCALE
    if (f.kind === "arcade")
      arcade(scene, p, x, z, f.id.endsWith("-b") ? blue : accent, f.id.endsWith("-b"))
    else if (f.kind === "vending") vending(scene, p, x, z, w, d, f.id.endsWith("-b"))
    else if (f.id === "sormiou-console") serverRack(scene, p, x, z, w, d)
    else if (f.kind === "coffee") {
      cyl("oak-coffee-table", x, 0.55, z, 0.78, 0.055, wood)
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI * 2) / 3
        tube(
          "splayed-oak-leg",
          [
            [x + Math.cos(a) * 0.29, 0.035, z + Math.sin(a) * 0.29],
            [x + Math.cos(a) * 0.18, 0.53, z + Math.sin(a) * 0.18],
          ],
          0.028,
          wood,
        )
      }
    } else if (f.kind === "counter") {
      box("worktop-counter", x, 1.15, z, w, 0.065, d, white, 0.012)
      box("counter-plinth", x, 0.08, z, w - 0.12, 0.16, d - 0.13, rubber)
      box("counter-carcass", x, 0.64, z, w - 0.04, 1.02, d - 0.06, white)
      for (let i = 0; i < 6; i++) {
        const px = x - w / 2 + ((i + 0.5) * w) / 6
        box("cabinet-door", px, 0.66, z + d / 2 + 0.003, w / 6 - 0.018, 0.98, 0.024, white)
        tube(
          "cabinet-pull",
          [
            [px - 0.1, 0.96, z + d / 2 + 0.022],
            [px - 0.1, 0.96, z + d / 2 + 0.058],
            [px + 0.1, 0.96, z + d / 2 + 0.058],
            [px + 0.1, 0.96, z + d / 2 + 0.022],
          ],
          0.007,
          steel,
        )
      }
      espresso(p, x - 1, 1.187, z)
      for (let i = 0; i < 3; i++) {
        const px = x + 0.1 + i * 0.26
        cyl("coffee-canister", px, 1.35, z - 0.13, 0.18, 0.32, steel)
        cyl("canister-lid", px, 1.515, z - 0.13, 0.185, 0.018, black)
      }
      box("counter-serving-tray", x - 0.25, 1.195, z + 0.12, 0.55, 0.018, 0.35, steel)
      for (let i = 0; i < 3; i++) {
        cyl("stacked-cups", x - 0.39 + i * 0.14, 1.25, z + 0.13, 0.09, 0.09, white, 0.1)
      }
    } else {
      const cafeteria = f.id === "cafeteria-terminal",
        terminal = f.kind === "terminal",
        top = 0.89
      box(f.id + "-top", x, top - 0.025, z, w, 0.05, d, white, 0.012)
      box("table-underside-frame", x, top - 0.085, z, w - 0.15, 0.065, d - 0.15, paint, 0.005)
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          box(
            "square-steel-table-leg",
            x + sx * (w / 2 - 0.08),
            (top - 0.08) / 2,
            z + sz * (d / 2 - 0.08),
            0.045,
            top - 0.08,
            0.045,
            steel,
            0.004,
          )
          box(
            "adjustable-table-foot",
            x + sx * (w / 2 - 0.08),
            0.016,
            z + sz * (d / 2 - 0.08),
            0.05,
            0.032,
            0.05,
            rubber,
            0.004,
          )
        }

      if (f.roomId === "cafeteria" && !terminal) {
        cyl("mug-body", x - 0.32, top + 0.045, z - 0.17, 0.085, 0.09, white, 0.095)
        cyl(
          "coffee-surface",
          x - 0.32,
          top + 0.092,
          z - 0.17,
          0.078,
          0.003,
          mat("coffee-dark", "#2C1D13", 0.22),
        )
        tube(
          "mug-handle",
          [
            [x - 0.36, top + 0.07, z - 0.17],
            [x - 0.39, top + 0.065, z - 0.17],
            [x - 0.4, top + 0.04, z - 0.17],
            [x - 0.36, top + 0.025, z - 0.17],
          ],
          0.008,
          white,
        )
        box("paper-notebook", x + 0.12, top + 0.009, z + 0.12, 0.2, 0.018, 0.27, wood, 0.003)
        box("notebook-paper", x + 0.12, top + 0.02, z + 0.12, 0.19, 0.009, 0.26, white, 0.001)
      } else if (cafeteria) {
        monitor(x + 0.12, top, z, -Math.PI / 2)
      } else {
        const n = Math.max(1, Math.floor(w / 2))
        for (let i = 0; i < n; i++) {
          const mx = x - w / 2 + ((i + 0.5) * w) / n
          monitor(mx, top, z - 0.04)
          if (f.roomId !== "amphitheater") {
            box(
              "desktop-PC-tower",
              mx + (w / n) * 0.35,
              0.28,
              z - 0.18,
              0.18,
              0.53,
              0.4,
              black,
              0.01,
            )
            for (let k = 0; k < 8; k++)
              box(
                "PC-front-vent",
                mx + (w / n) * 0.35,
                0.17 + k * 0.022,
                z + 0.023,
                0.13,
                0.008,
                0.003,
                paint,
                0.001,
              )
            box(
              "PC-power-switch",
              mx + (w / n) * 0.35 + 0.045,
              0.48,
              z + 0.024,
              0.015,
              0.015,
              0.004,
              steel,
              0.002,
            )
          }
        }
      }
    }
    const room = WORLD_ROOMS.find((r) => r.id === f.roomId)!
    const metadata = stations.has(f.id)
      ? {
          interaction: {
            id: room.id,
            kind: "station",
            label: room.interactionLabel,
            roomId: room.id,
          } satisfies Interaction,
        }
      : undefined
    p.finish(start, "fixture:" + f.id, shadow, metadata)
  }
  return p
}

function arcade(
  scene: Scene,
  p: PropKit,
  x: number,
  z: number,
  enamel: ReturnType<PropKit["mat"]>,
  second: boolean,
) {
  const { box, cyl, ball, tube, label, texture, black, rubber, steel, mat } = p
  const profile = [
    [-0.43, 0.06],
    [0.31, 0.06],
    [0.31, 0.91],
    [0.46, 1.01],
    [0.43, 1.12],
    [0.24, 1.15],
    [0.11, 1.57],
    [0.4, 1.66],
    [0.4, 1.91],
    [-0.43, 1.91],
  ]

  const triangles: number[] = [],
    poly = profile.map((_, i) => i)
  const cross = (a: number[], b: number[], c: number[]) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  while (poly.length > 3) {
    let clipped = false
    for (let j = 0; j < poly.length; j++) {
      const a = poly[(j + poly.length - 1) % poly.length],
        b = poly[j],
        c = poly[(j + 1) % poly.length]
      if (cross(profile[a], profile[b], profile[c]) <= 0) continue
      if (
        poly.some(
          (q) =>
            q !== a &&
            q !== b &&
            q !== c &&
            cross(profile[a], profile[b], profile[q]) >= 0 &&
            cross(profile[b], profile[c], profile[q]) >= 0 &&
            cross(profile[c], profile[a], profile[q]) >= 0,
        )
      )
        continue
      triangles.push(a, b, c)
      poly.splice(j, 1)
      clipped = true
      break
    }
    if (!clipped) break
  }
  triangles.push(...poly)
  const art = texture(second ? "arcade-blue-side-art" : "arcade-red-side-art", 512, 1024, (c) => {
    c.fillStyle = second ? "#154351" : "#611F23"
    c.fillRect(0, 0, 512, 1024)
    c.strokeStyle = "#CFB27B"
    c.lineWidth = 9
    for (let i = 0; i < 5; i++) {
      c.beginPath()
      c.moveTo(-80 + i * 90, 1024)
      c.lineTo(200 + i * 90, 420)
      c.lineTo(100 + i * 90, 0)
      c.stroke()
    }
    c.save()
    c.translate(80, 730)
    c.rotate(-Math.PI / 2)
    c.fillStyle = "#EEE4CB"
    c.font = "900 90px Arial"
    c.fillText(second ? "NEON RUN" : "G4 / LOGIC", 0, 0)
    c.restore()
    c.fillStyle = "rgba(0,0,0,.12)"
    for (let i = 0; i < 200; i++) c.fillRect((i * 191) % 512, (i * 139) % 1024, 1, 12)
  })
  for (const side of [-1, 1]) {
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = []
    for (const offset of [-0.009, 0.009])
      for (const [pz, y] of profile) {
        positions.push(x + side * 0.38 + offset, y, z + pz)
        uvs.push((pz + 0.43) / 0.9, 1 - y / 1.95)
      }
    for (const t of [0, 1])
      for (let i = 0; i < triangles.length; i += 3) {
        const a = triangles[i] + t * profile.length,
          b = triangles[i + 1] + t * profile.length,
          c = triangles[i + 2] + t * profile.length
        indices.push(...(t ? [a, b, c] : [a, c, b]))
      }
    for (let i = 0; i < profile.length; i++) {
      const next = (i + 1) % profile.length
      indices.push(i, next, i + profile.length, next, next + profile.length, i + profile.length)
    }
    const data = new VertexData(),
      normals: number[] = []
    VertexData.ComputeNormals(positions, indices, normals)
    data.positions = positions
    data.normals = normals
    data.indices = indices
    data.uvs = uvs
    const panel = new Mesh("arcade-profiled-side", scene)
    data.applyToMesh(panel)
    panel.material = art
    tube(
      "arcade-T-moulding",
      [...profile, profile[0]].map(([a, b]) => [x + side * 0.391, b, z + a]),
      0.008,
      enamel,
    )
  }
  box("arcade-rear-service-panel", x, 0.98, z - 0.424, 0.74, 1.83, 0.025, black)
  box("arcade-front-kick-panel", x, 0.5, z + 0.3, 0.742, 0.9, 0.026, black)
  const apron = box("arcade-control-apron", x, 0.985, z + 0.375, 0.742, 0.24, 0.025, black)
  apron.rotation.x = 0.94
  box("arcade-base-plinth", x, 0.06, z - 0.03, 0.75, 0.1, 0.74, rubber)
  for (const sx of [-0.32, 0.32])
    for (const sz of [-0.36, 0.26])
      cyl("cabinet-levelling-foot", x + sx, 0.025, z + sz, 0.04, 0.05, steel)
  const deck = box("arcade-control-panel", x, 1.075, z + 0.285, 0.74, 0.06, 0.34, enamel)
  deck.rotation.x = -0.1
  const deckArt = texture("arcade-control-labels", 1024, 256, (c) => {
    c.fillStyle = "#161D22"
    c.fillRect(0, 0, 1024, 256)
    c.strokeStyle = "#B69B65"
    c.lineWidth = 4
    c.strokeRect(12, 12, 1000, 232)
    c.font = "24px Arial"
    c.fillStyle = "#CFC5AE"
    c.fillText("MOVE", 140, 70)
    c.fillText("ACTION", 630, 70)
    c.fillText("PLAYER 1   /   CAMPUS EDITION", 280, 230)
  })
  const decal = label("arcade-control-decal", x, 1.113, z + 0.285, 0.7, 0.3, deckArt)
  decal.rotation.set(Math.PI / 2 - 0.1, 0, 0)
  cyl("joystick-dust-washer", x - 0.19, 1.125, z + 0.3, 0.08, 0.009, rubber)
  cyl("joystick-chrome-shaft", x - 0.19, 1.177, z + 0.3, 0.012, 0.11, steel)
  ball("joystick-ball-top", x - 0.19, 1.24, z + 0.3, 0.065, 0.065, 0.065, enamel)
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 3; col++) {
      const bx = x + 0.065 + col * 0.065,
        bz = z + 0.26 + row * 0.065
      cyl("button-black-bezel", bx, 1.127, bz, 0.04, 0.012, rubber)
      cyl(
        "convex-arcade-button",
        bx,
        1.135,
        bz,
        0.031,
        0.012,
        col === 2 ? enamel : mat("ivory-button", "#D6CEB9", 0.26),
      )
    }
  for (const sx of [-0.3, 0.3])
    for (const sz of [0.17, 0.4]) {
      const screw = cyl("control-fastener", x + sx, 1.114, z + sz, 0.009, 0.004, steel)
      screw.rotation.x = -0.1
    }
  const recess = box("CRT-bezel-recess", x, 1.405, z + 0.158, 0.74, 0.49, 0.075, rubber, 0.018)
  recess.rotation.x = -0.29
  const fascia = box("CRT-lower-fascia", x, 1.145, z + 0.22, 0.742, 0.085, 0.04, black)
  fascia.rotation.x = -0.29
  const crt = texture(
    second ? "arcade-neon-run-screen" : "arcade-logic-screen",
    768,
    640,
    (c) => {
      c.fillStyle = "#081219"
      c.fillRect(0, 0, 768, 640)
      c.strokeStyle = second ? "#57B5BB" : "#B0A16A"
      c.lineWidth = 3
      for (let i = -8; i < 9; i++) {
        c.beginPath()
        c.moveTo(384 + i * 35, 310)
        c.lineTo(384 + i * 120, 640)
        c.stroke()
      }
      for (let y = 340; y < 640; y += 45) {
        c.beginPath()
        c.moveTo(0, y)
        c.lineTo(768, y)
        c.stroke()
      }
      c.fillStyle = "#DACBA7"
      c.textAlign = "center"
      c.font = "900 70px monospace"
      c.fillText(second ? "NEON RUN" : "G4 LOGIC", 384, 154)
      c.font = "23px monospace"
      c.fillStyle = "#90AFAA"
      c.fillText("CAMPUS ARCADE SYSTEM", 384, 202)
      c.fillStyle = "#D9BD72"
      c.font = "bold 27px monospace"
      c.fillText(second ? "HIGH SCORE  012450" : "SYSTEM ERROR / DEBUG REQUIRED", 384, 275)
      c.font = "22px monospace"
      c.fillText(second ? "PRESS START" : "EXAMINER LE JOURNAL", 384, 520)
      c.fillStyle = "rgba(0,0,0,.20)"
      for (let y = 0; y < 640; y += 4) c.fillRect(0, y, 768, 1)
      c.textAlign = "left"
    },
    0.48,
  )
  crt.roughness = 0.16
  crt.metallic = 0.05

  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = []
  for (let j = 0; j <= 12; j++)
    for (let i = 0; i <= 16; i++) {
      const u = i / 16,
        v = j / 12,
        xx = (u - 0.5) * 0.58,
        yy = (v - 0.5) * 0.36
      positions.push(
        x + xx,
        1.41 + yy,
        z + 0.205 - yy * 0.29 + 0.021 * (1 - Math.pow(xx / 0.3, 2)) * (1 - Math.pow(yy / 0.19, 2)),
      )
      uvs.push(1 - u, v)
    }
  for (let j = 0; j < 12; j++)
    for (let i = 0; i < 16; i++) {
      const a = j * 17 + i
      indices.push(a, a + 17, a + 1, a + 1, a + 17, a + 18)
    }
  const vd = new VertexData(),
    normals: number[] = []
  VertexData.ComputeNormals(positions, indices, normals)
  vd.positions = positions
  vd.indices = indices
  vd.normals = normals
  vd.uvs = uvs
  const glass = new Mesh("arcade-convex-CRT-glass", scene)
  vd.applyToMesh(glass)
  glass.material = crt
  crt.backFaceCulling = false
  box("marquee-lightbox", x, 1.785, z + 0.34, 0.746, 0.245, 0.12, black)
  const marquee = texture(
    second ? "NEON-RUN-marquee" : "G4-LOGIC-marquee",
    1024,
    256,
    (c) => {
      c.fillStyle = second ? "#264A50" : "#64292B"
      c.fillRect(0, 0, 1024, 256)
      c.strokeStyle = "#CEB57E"
      c.lineWidth = 8
      c.strokeRect(10, 10, 1004, 236)
      c.textAlign = "center"
      c.fillStyle = "#EEE3C6"
      c.font = "italic 900 114px Arial"
      c.fillText(second ? "NEON RUN" : "G4 LOGIC", 512, 157)
      c.font = "22px Arial"
      c.fillText("CAMPUS ARCADE  •  MARSEILLE", 512, 213)
    },
    0.33,
  )
  label("backlit-acrylic-marquee", x, 1.785, z + 0.406, 0.707, 0.202, marquee)
  box("speaker-panel", x, 1.633, z + 0.31, 0.74, 0.055, 0.22, black)
  for (let side of [-1, 1])
    for (let i = 0; i < 7; i++)
      box(
        "speaker-grille-slot",
        x + side * 0.22 + (i - 3) * 0.012,
        1.64,
        z + 0.425,
        0.005,
        0.032,
        0.006,
        rubber,
        0.001,
      )
  box("coin-door-surround", x, 0.59, z + 0.322, 0.37, 0.45, 0.021, steel)
  box("pressed-steel-coin-door", x, 0.59, z + 0.337, 0.347, 0.426, 0.016, paintMaterial(p))
  for (const sx of [-0.14, 0.14]) for (const sy of [0.41, 0.77]) p.screw(x + sx, sy, z + 0.348)
  for (const sx of [-0.085, 0.085]) {
    box("coin-insert", x + sx, 0.69, z + 0.352, 0.064, 0.1, 0.018, steel)
    box("coin-slot", x + sx, 0.71, z + 0.365, 0.006, 0.044, 0.004, rubber, 0.001)
    box("coin-return-pocket", x + sx, 0.5, z + 0.357, 0.065, 0.053, 0.022, rubber)
  }
  const key = cyl("coin-door-keyhole", x, 0.585, z + 0.353, 0.015, 0.009, steel)
  key.rotation.x = Math.PI / 2
  box("toe-kick-plate", x, 0.18, z + 0.322, 0.58, 0.12, 0.012, steel)
  for (let i = 0; i < 9; i++)
    box("rear-vent-slot", x - 0.15 + i * 0.038, 1.69, z - 0.44, 0.015, 0.09, 0.005, rubber, 0.001)
}
function paintMaterial(p: PropKit) {
  return p.mat("coin-door-black-powdercoat", "#303331", 0.75, 0.3)
}
function vending(
  _scene: Scene,
  p: PropKit,
  x: number,
  z: number,
  w: number,
  d: number,
  drinks: boolean,
) {
  const { box, cyl, ball, label, texture, black, rubber, steel, mat } = p
  const enamel = mat("vending-ivory-enamel", "#D2D0C5", 0.35, 0.15),
    front = z + d / 2
  box("vending-back", x, 1.02, z - d / 2 + 0.025, w - 0.025, 2.02, 0.05, enamel, 0.012)
  for (const side of [-1, 1])
    box("vending-side", x + side * (w / 2 - 0.025), 1.02, z, 0.05, 2.02, d - 0.025, enamel, 0.012)
  box("vending-roof", x, 2.01, z, w - 0.025, 0.05, d - 0.025, enamel, 0.012)
  box("vending-bottom-front", x, 0.3, front - 0.024, w - 0.025, 0.54, 0.05, enamel, 0.012)
  box("vending-black-plinth", x, 0.075, z, w - 0.045, 0.15, d - 0.04, rubber)
  box("product-cavity", x - w * 0.1, 1.21, front - 0.23, w * 0.7, 1.25, 0.022, black, 0.015)
  const productColors = ["#B45037", "#C8AC53", "#65816D", "#8595AC"]
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 4; col++) {
      const px = x - w * 0.37 + col * w * 0.17,
        py = 0.73 + row * 0.27,
        pz = front - 0.075
      if (drinks) {
        const wrap = texture("can-label-" + col, 512, 512, (c) => {
          c.fillStyle = productColors[col]
          c.fillRect(0, 0, 512, 512)
          c.fillStyle = "#D7D4C7"
          c.fillRect(0, 35, 512, 9)
          c.fillRect(0, 466, 512, 9)
          c.save()
          c.translate(240, 270)
          c.rotate(-0.12)
          c.fillStyle = "#EEEADD"
          c.textAlign = "center"
          c.font = "900 77px Arial"
          c.fillText(["COLA", "CITRON", "THÉ", "EAU"][col], 0, 0)
          c.font = "26px Arial"
          c.fillText("G4 / LA PAUSE", 0, 48)
          c.restore()
          c.fillStyle = "#E5E1D4"
          c.font = "18px Arial"
          c.fillText("33 cl · SERVIR FRAIS", 100, 419)
          for (let k = 0; k < 24; k++) {
            c.fillStyle = k % 3 ? "#EEEADD" : "#202827"
            c.fillRect(440 + k * 2, 300, 2, 85)
          }
        })
        wrap.metallic = 0.25
        wrap.roughness = 0.34
        const can = cyl("beverage-can", px, py, pz, 0.095, 0.17, wrap),
          uv = can.getVerticesData("uv")!
        for (let k = 0; k < uv.length; k += 2) uv[k] = 1 - uv[k]
        can.setVerticesData("uv", uv)
        cyl("can-pulltop", px, py + 0.087, pz, 0.093, 0.005, steel)
        cyl("can-bottom-rim", px, py - 0.086, pz, 0.094, 0.004, steel)
        ball("can-ring-pull", px, py + 0.091, pz, 0.016, 0.003, 0.028, black)
      } else {
        const packet = box(
          "snack-package",
          px,
          py,
          pz,
          0.13,
          0.18,
          0.075,
          mat("snack-" + col, productColors[col], 0.6),
          0.014,
        )
        packet.rotation.z = (col % 2 ? 1 : -1) * 0.07
        box(
          "snack-label",
          px,
          py,
          pz + 0.04,
          0.09,
          0.065,
          0.004,
          mat("paper-cream", "#DED8C7", 0.9),
          0.001,
        )
      }
    }
  for (let row = 0; row < 4; row++) {
    box(
      "vending-product-shelf",
      x - w * 0.1,
      0.62 + row * 0.27,
      front - 0.09,
      w * 0.68,
      0.026,
      0.18,
      steel,
    )
    box(
      "vending-shelf-ticket",
      x - w * 0.1,
      0.62 + row * 0.27,
      front + 0.005,
      w * 0.68,
      0.035,
      0.006,
      rubber,
      0.001,
    )
    for (let col = 0; col < 4; col++) {
      const px = x - w * 0.37 + col * w * 0.17
      for (let coil = 0; coil < 4; coil++)
        ball(
          "vending-coil",
          px + 0.045 * Math.sin(coil * 2),
          0.66 + row * 0.27,
          front - 0.04 + coil * 0.014,
          0.013,
          0.013,
          0.013,
          steel,
        )
    }
  }

  const glass = mat("vending-safety-glass", "#B7C8CE", 0.12, 0.15)
  glass.alpha = 0.12
  glass.transparencyMode = 2
  box("vending-window-glass", x - w * 0.1, 1.21, front + 0.015, w * 0.7, 1.25, 0.008, glass, 0.003)
  for (const sx of [-0.46, 0.26])
    box("vending-window-gasket", x + sx * w, 1.21, front + 0.023, 0.025, 1.31, 0.026, rubber)
  box("payment-panel", x + w * 0.37, 1.16, front + 0.015, w * 0.19, 1.34, 0.03, black)
  const display = texture(
    "vending-price-display",
    256,
    128,
    (c) => {
      c.fillStyle = "#182921"
      c.fillRect(0, 0, 256, 128)
      c.fillStyle = "#BDD0A9"
      c.font = "36px monospace"
      c.fillText("1.20 €", 38, 55)
      c.font = "17px monospace"
      c.fillText("SÉLECTIONNER", 30, 98)
    },
    0.2,
  )
  label("vending-price-LCD", x + w * 0.37, 1.62, front + 0.033, w * 0.15, 0.11, display)
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 3; col++)
      box(
        "vending-keypad",
        x + w * 0.325 + col * 0.05,
        1.41 - row * 0.06,
        front + 0.04,
        0.037,
        0.043,
        0.015,
        steel,
        0.004,
      )
  box("vending-card-reader", x + w * 0.37, 1.06, front + 0.04, 0.12, 0.15, 0.045, steel)
  box("card-reader-screen", x + w * 0.37, 1.085, front + 0.064, 0.09, 0.06, 0.006, rubber)
  box("vending-coin-slot", x + w * 0.37, 0.9, front + 0.034, 0.06, 0.012, 0.012, rubber, 0.001)
  box("collection-hatch-rim", x - w * 0.08, 0.32, front + 0.019, w * 0.72, 0.29, 0.025, steel)
  box("collection-hatch", x - w * 0.08, 0.32, front + 0.036, w * 0.68, 0.25, 0.021, rubber)
  const head = texture(
    drinks ? "vending-drinks-brand" : "vending-snacks-brand",
    1024,
    192,
    (c) => {
      c.fillStyle = "#2B393B"
      c.fillRect(0, 0, 1024, 192)
      c.font = "bold 78px Arial"
      c.fillStyle = "#D9D3BA"
      c.fillText(drinks ? "BOISSONS FRAÎCHES" : "LA PAUSE / SNACKS", 46, 118)
    },
    0.15,
  )
  label("vending-header", x, 1.91, front + 0.02, w - 0.1, 0.15, head)
}
function espresso(p: PropKit, x: number, y: number, z: number) {
  const { box, cyl, tube, black, steel, white, rubber, mat } = p
  box("espresso-stainless-body", x, y + 0.26, z, 0.56, 0.51, 0.43, steel, 0.025)
  box("espresso-front-panel", x, y + 0.28, z + 0.223, 0.5, 0.29, 0.022, black)
  box("espresso-cup-warmer", x, y + 0.52, z, 0.52, 0.018, 0.4, steel)
  for (let i = 0; i < 10; i++)
    box("cup-warmer-grille", x - 0.22 + i * 0.05, y + 0.532, z, 0.005, 0.007, 0.34, black, 0.001)
  box("espresso-drip-tray", x, y + 0.035, z + 0.29, 0.52, 0.035, 0.26, steel)
  for (let i = 0; i < 10; i++)
    box(
      "drip-tray-slot",
      x - 0.21 + i * 0.047,
      y + 0.056,
      z + 0.28,
      0.015,
      0.003,
      0.18,
      rubber,
      0.001,
    )
  for (const side of [-1, 1]) {
    const sx = x + side * 0.12
    cyl("espresso-group-head", sx, y + 0.23, z + 0.25, 0.068, 0.07, steel)
    box("portafilter-handle", sx, y + 0.205, z + 0.34, 0.025, 0.027, 0.16, black, 0.009)
    cyl("espresso-cup", sx, y + 0.105, z + 0.28, 0.068, 0.085, white, 0.08)
  }
  for (const side of [-1, 1]) {
    tube(
      "steam-wand",
      [
        [x + side * 0.24, y + 0.3, z + 0.25],
        [x + side * 0.26, y + 0.2, z + 0.29],
        [x + side * 0.23, y + 0.12, z + 0.31],
      ],
      0.007,
      steel,
    )
  }
  for (let i = 0; i < 4; i++) {
    const o = cyl(
      "espresso-selector",
      x - 0.16 + i * 0.105,
      y + 0.4,
      z + 0.242,
      0.027,
      0.014,
      mat("espresso-button", "#667271", 0.3, 0.7),
    )
    o.rotation.x = Math.PI / 2
  }
}
function serverRack(scene: Scene, p: PropKit, x: number, z: number, w: number, d: number) {
  const { box, cyl, tube, black, steel, rubber, mat, texture, label } = p
  box("server-rack-plinth", x, 0.07, z, w, 0.14, d, black)
  box("server-rack-top", x, 2.02, z, w, 0.055, d, black)
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      box(
        "server-rack-post",
        x + sx * (w / 2 - 0.025),
        1.04,
        z + sz * (d / 2 - 0.025),
        0.044,
        1.94,
        0.044,
        steel,
      )
  for (const sx of [-1, 1])
    box("server-rack-side", x + sx * (w / 2 - 0.008), 1.05, z, 0.016, 1.86, d - 0.06, black)
  const front = z + d / 2 - 0.015
  for (let row = 0; row < 10; row++) {
    const y = 0.24 + row * 0.155
    box(
      "rackmount-server",
      x,
      y,
      z,
      w - 0.09,
      0.125,
      d - 0.1,
      mat("server-brushed-face", "#707B7C", 0.38, 0.7),
    )
    for (let j = 0; j < 12; j++)
      box("server-vent", x - w * 0.31 + j * w * 0.048, y, front, 0.014, 0.065, 0.008, rubber, 0.001)
    for (const sx of [-1, 1]) {
      box("rack-ear", x + sx * (w / 2 - 0.045), y, front + 0.006, 0.035, 0.127, 0.015, black)
      p.screw(x + sx * (w / 2 - 0.045), y + 0.045, front + 0.016)
    }
    const led = mat("server-led", "#86B99C", 0.25)
    led.emissiveColor.set(0.12, 0.4, 0.2)
    for (let j = 0; j < 3; j++)
      box(
        "server-status-light",
        x + w * 0.28,
        y - 0.035 + j * 0.022,
        front + 0.014,
        0.009,
        0.007,
        0.006,
        led,
        0.001,
      )
  }
  box("rack-patch-panel", x, 1.85, z, w - 0.08, 0.1, d - 0.1, black)
  for (let i = 0; i < 8; i++) {
    const px = x - w * 0.3 + i * w * 0.085
    box("ethernet-port", px, 1.85, front + 0.004, 0.035, 0.028, 0.012, steel, 0.001)
    tube(
      "patch-cable",
      [
        [px, 1.85, front + 0.018],
        [px + 0.01, 1.72, front + 0.06],
        [x + w * 0.35, 1.68, front + 0.035],
      ],
      0.0035,
      mat("network-cable-" + i, ["#436F86", "#928665", "#555D61"][i % 3], 0.8),
    )
  }
  const terminal = texture(
    "server-service-LCD",
    512,
    256,
    (c) => {
      c.fillStyle = "#101B23"
      c.fillRect(0, 0, 512, 256)
      c.fillStyle = "#94B7AA"
      c.font = "bold 34px monospace"
      c.fillText("G4 / CORE", 27, 63)
      c.font = "23px monospace"
      c.fillText("MAINTENANCE MODE", 27, 121)
      c.fillText("CODE : _ _ _ _", 27, 177)
    },
    0.3,
  )

  box("server-service-screen-bezel", x, 1.24, z - d / 2 - 0.012, w - 0.08, 0.35, 0.025, black)
  label("server-service-screen", x, 1.24, z - d / 2 - 0.027, w - 0.12, 0.28, terminal, 0)
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const k = box(
        "server-service-keypad",
        x - 0.06 + col * 0.06,
        0.99 - row * 0.06,
        z - d / 2 - 0.027,
        0.045,
        0.044,
        0.014,
        steel,
        0.003,
      )
      k.isPickable = true
    }

  box("rack-service-console", x, 1.19, z - d / 2 + 0.01, w - 0.06, 0.59, 0.025, black)
  for (const y of [0.24, 0.4, 0.56, 0.72, 1.57, 1.73, 1.89]) {
    box(
      "north-server-face",
      x,
      y,
      z - d / 2 - 0.008,
      w - 0.09,
      0.125,
      0.025,
      mat("server-brushed-face", "#707B7C", 0.38, 0.7),
    )
    for (let k = 0; k < 11; k++)
      box(
        "north-server-vent",
        x - w * 0.3 + k * w * 0.047,
        y,
        z - d / 2 - 0.023,
        0.012,
        0.073,
        0.006,
        rubber,
        0.001,
      )
    const led = mat("server-led", "#86B99C", 0.25)
    for (let k = 0; k < 3; k++)
      box(
        "north-server-LED",
        x + w * 0.28,
        y - 0.025 + k * 0.021,
        z - d / 2 - 0.025,
        0.009,
        0.006,
        0.005,
        led,
        0.001,
      )
    for (const side of [-1, 1])
      box(
        "rack-handhold",
        x + side * w * 0.35,
        y,
        z - d / 2 - 0.036,
        0.012,
        0.075,
        0.025,
        steel,
        0.004,
      )
  }
  cyl("server-rack-earth-point", x - w * 0.35, 0.12, z + d / 2, 0.02, 0.02, steel)
  void scene
}
