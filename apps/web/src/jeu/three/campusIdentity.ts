import { bevelBox } from "./props"
import { photographicMaterial } from "./realism"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import { Color3 } from "@babylonjs/core/Maths/math.color.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import type { Scene } from "@babylonjs/core/scene.js"
import { WORLD_CHAIRS, WORLD_OBSTACLES, WORLD_ROOMS } from "../game/world"
import { SCALE } from "./controller"

export function addCampusIdentity(scene: Scene) {
  const plain = (name: string, color: string, roughness = 0.7) => {
    const m = new PBRMaterial(name, scene)
    m.albedoColor = Color3.FromHexString(color)
    m.roughness = roughness
    m.metallic = 0
    return m
  }
  const frame = plain("school-chair-blue-enamel", "#287A95", 0.42),
    plywood = photographicMaterial(scene, "wood_table_001", "school-chair-beech", 0.4),
    rubber = plain("rubber-feet", "#343638"),
    white = plain("white-laminate", "#E4E5DF", 0.55),
    metal = plain("school-table-steel", "#A2A8AA", 0.42)
  metal.metallic = 0.65
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    mat: PBRMaterial,
  ) => {
    const m = bevelBox(scene, name, w, h, d, 0.008)
    m.position.set(x, y, z)
    m.material = mat
    m.receiveShadows = true
    return m
  }

  for (const f of WORLD_OBSTACLES.filter(
    (f) =>
      ["classroom", "cowork", "amphitheater"].includes(f.roomId) &&
      ["desk", "table"].includes(f.kind),
  )) {
    for (const suffix of ["-top", "-edge"]) {
      const top = scene.getMeshByName(f.id + suffix)
      if (top) {
        top.material = suffix === "-top" ? white : metal
      }
    }
  }
  for (const chair of WORLD_CHAIRS.filter((c) =>
    ["classroom", "cowork", "amphitheater", "gaming"].includes(c.roomId),
  )) {
    const x = (chair.x + chair.width / 2) * SCALE,
      z = (chair.y + chair.height / 2) * SCALE

    for (const side of [-1, 1]) {
      const tube = MeshBuilder.CreateTube(
        "campus-blue-chair-frame",
        {
          path: [
            new Vector3(x + side * 0.25, 0.04, z - 0.27),
            new Vector3(x + side * 0.22, 0.46, z - 0.19),
            new Vector3(x + side * 0.22, 0.49, z + 0.23),
            new Vector3(x + side * 0.24, 0.04, z + 0.3),
          ],
          radius: 0.019,
          tessellation: 8,
        },
        scene,
      )
      tube.material = frame
      tube.isPickable = false
      const upright = MeshBuilder.CreateTube(
        "campus-chair-back-upright",
        {
          path: [
            new Vector3(x + side * 0.23, 0.25, z + 0.27),
            new Vector3(x + side * 0.23, 0.48, z + 0.25),
            new Vector3(x + side * 0.23, 0.94, z + 0.31),
          ],
          radius: 0.018,
          tessellation: 8,
        },
        scene,
      )
      upright.material = frame
      upright.isPickable = false
      for (const dz of [-0.27, 0.3]) {
        const foot = box(
          "campus-chair-rubber",
          x + side * 0.25,
          0.025,
          z + dz,
          0.05,
          0.05,
          0.06,
          rubber,
        )
        foot.isPickable = false
      }
    }
    const seat = box("campus-plywood-seat", x, 0.48, z, 0.53, 0.035, 0.48, plywood)
    seat.isPickable = false
    const positions: number[] = [],
      uvs: number[] = [],
      indices: number[] = []
    for (let row = 0; row < 2; row++)
      for (let col = 0; col <= 12; col++) {
        const u = col / 12,
          dx = (u - 0.5) * 0.54
        positions.push(x + dx, 0.66 + row * 0.27, z + 0.3 - Math.pow(dx / 0.27, 2) * 0.045)
        uvs.push(u, row)
      }
    for (let col = 0; col < 12; col++) {
      const a = col,
        b = col + 1,
        c = col + 13,
        d = col + 14
      indices.push(a, b, c, b, d, c)
    }
    const normals: number[] = []
    VertexData.ComputeNormals(positions, indices, normals)
    const data = new VertexData()
    data.positions = positions
    data.indices = indices
    data.normals = normals
    data.uvs = uvs
    const back = new Mesh("campus-curved-plywood-back", scene)
    data.applyToMesh(back)
    plywood.backFaceCulling = false
    plywood.twoSidedLighting = true
    back.material = plywood
    back.isPickable = false
    back.receiveShadows = true
  }

  const muralTex = new DynamicTexture(
      "marseille-original-mural",
      { width: 2048, height: 768 },
      scene,
      false,
    ),
    ctx = muralTex.getContext() as CanvasRenderingContext2D
  ctx.fillStyle = "#8B453A"
  ctx.fillRect(0, 0, 2048, 768)
  let seed = 7829
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let row = 0; row < 17; row++)
    for (let col = -1; col < 19; col++) {
      ctx.fillStyle = ["#965044", "#AA6252", "#82483F", "#9C5D4E"][Math.floor(rand() * 4)]
      ctx.fillRect(col * 124 + (row % 2) * 62 + 3, row * 48 + 3, 118, 42)
    }
  for (let i = 0; i < 75; i++) {
    ctx.globalAlpha = 0.13 + rand() * 0.38
    ctx.fillStyle = ["#E3D5AF", "#D8DFCE", "#264E69", "#39A1B7", "#D6B546", "#D97166"][i % 6]
    ctx.beginPath()
    ctx.ellipse(
      rand() * 2048,
      rand() * 768,
      rand() * 240 + 30,
      rand() * 90 + 10,
      rand() * 3,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.save()
  ctx.translate(1024, 395)
  ctx.rotate(-0.045)
  ctx.textAlign = "center"
  ctx.font = "900 italic 235px Arial"
  ctx.lineJoin = "round"
  ctx.lineWidth = 25
  ctx.strokeStyle = "#233E4A"
  ctx.strokeText("CRÉER. OSER.", 0, 0)
  ctx.fillStyle = "#E6E1CD"
  ctx.fillText("CRÉER. OSER.", 0, 0)
  ctx.font = "900 90px Arial"
  ctx.fillStyle = "#F0BD4F"
  ctx.fillText("CODE · DESIGN · PROJETS", 0, 140)
  ctx.restore()
  ctx.font = "bold 45px Arial"
  ctx.fillStyle = "#E8E4D7"
  ctx.fillText("G4  /  MARSEILLE", 90, 690)
  ctx.textAlign = "right"
  ctx.fillText("43°20′ N  ·  CAMPUS", 1960, 690)
  ctx.textAlign = "left"
  muralTex.update()
  const mural = new PBRMaterial("marseille-mural-paint", scene)
  mural.albedoTexture = muralTex
  mural.roughness = 0.96
  mural.metallic = 0
  for (const p of [
    { x: 6.375, z: 11.145, w: 9 },
    { x: 6.375, z: 23.895, w: 9 },
  ]) {
    const plane = MeshBuilder.CreatePlane(
      "campus-street-art",
      { width: p.w, height: 2.95, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    )
    plane.position.set(p.x, 1.62, p.z)
    plane.material = mural
    plane.receiveShadows = true
  }

  const notice = new DynamicTexture("campus-notices", { width: 768, height: 512 }, scene, false),
    nc = notice.getContext()
  nc.fillStyle = "#8D7962"
  nc.fillRect(0, 0, 768, 512)
  const notes = [
    ["G4 / CAMPUS", "MARSEILLE", "#EBE5D3"],
    ["PROJETS", "Sprint de la semaine", "#DAE7E3"],
    ["VIE ÉTUDIANTE", "Créer ensemble", "#E8DBC3"],
    ["RÉSEAU", "Maintenance en cours", "#C5D9E5"],
  ]
  notes.forEach(([a, b, c], i) => {
    const x = 25 + (i % 2) * 374,
      y = 20 + Math.floor(i / 2) * 246
    nc.fillStyle = c
    nc.fillRect(x, y, 344, 226)
    nc.fillStyle = "#35454B"
    nc.font = "bold 27px Arial"
    nc.fillText(a, x + 22, y + 46)
    nc.font = "20px Arial"
    nc.fillText(b, x + 22, y + 90)
    for (let l = 0; l < 4; l++) nc.fillRect(x + 22, y + 118 + l * 18, 210 + (l % 2) * 44, 3)
    nc.fillStyle = "#B14945"
    nc.beginPath()
    nc.arc(x + 172, y + 9, 5, 0, Math.PI * 2)
    nc.fill()
  })
  notice.update()
  const noticeMat = new PBRMaterial("campus-notice-paper", scene)
  noticeMat.albedoTexture = notice
  noticeMat.roughness = 1
  const board = MeshBuilder.CreatePlane(
    "campus-noticeboard",
    { width: 2.6, height: 1.7, sideOrientation: Mesh.DOUBLESIDE },
    scene,
  )
  board.position.set(23.7, 1.9, 10.82)
  board.rotation.y = Math.PI
  board.material = noticeMat
  board.receiveShadows = true
  for (const room of WORLD_ROOMS.filter((r) =>
    ["classroom", "cowork", "amphitheater"].includes(r.id),
  )) {
    const f = room.floor
    const z = (f.y + f.height - 3) * SCALE,
      x = (f.x + f.width / 2) * SCALE
    box("campus-cable-trunking", x, 0.27, z, f.width * SCALE - 0.3, 0.065, 0.05, white)
    for (const offset of [-2.5, 0, 2.5]) {
      box("campus-wall-socket", x + offset, 0.34, z - 0.04, 0.14, 0.14, 0.04, white)
      for (const dx of [-0.025, 0.025])
        box("campus-socket-hole", x + offset + dx, 0.34, z - 0.065, 0.012, 0.018, 0.005, rubber)
    }
  }
}
