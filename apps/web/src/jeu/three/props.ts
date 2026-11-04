import { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { Color3 } from "@babylonjs/core/Maths/math.color.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture.js"
import type { Scene } from "@babylonjs/core/scene.js"
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js"
import type { Material } from "@babylonjs/core/Materials/material.js"

export function bevelBox(scene: Scene, name: string, w: number, h: number, d: number, r = 0.008) {
  const half = [w / 2, h / 2, d / 2],
    radius = Math.min(r, ...half.map((v) => v * 0.4))
  const positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    indices: number[] = []
  for (let axis = 0; axis < 3; axis++)
    for (const side of [-1, 1]) {
      const a = (axis + 1) % 3,
        b = (axis + 2) % 3,
        start = positions.length / 3
      const av = [-half[a], -half[a] + radius, half[a] - radius, half[a]],
        bv = [-half[b], -half[b] + radius, half[b] - radius, half[b]]
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 4; i++) {
          const p = [0, 0, 0]
          p[axis] = side * half[axis]
          p[a] = av[i]
          p[b] = bv[j]
          const q = p.map((v, k) => Math.max(-half[k] + radius, Math.min(half[k] - radius, v))),
            n = Vector3.FromArray(p.map((v, k) => v - q[k])).normalize()
          positions.push(...q.map((v, k) => v + [n.x, n.y, n.z][k] * radius))
          normals.push(n.x, n.y, n.z)
          uvs.push(i / 3, j / 3)
        }
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          const k = start + j * 4 + i
          const face =
            side > 0
              ? [k, k + 1, k + 4, k + 1, k + 5, k + 4]
              : [k, k + 4, k + 1, k + 1, k + 4, k + 5]
          indices.push(face[0], face[2], face[1], face[3], face[5], face[4])
        }
    }
  const mesh = new Mesh(name, scene),
    data = new VertexData()
  data.positions = positions
  data.normals = normals
  data.uvs = uvs
  data.indices = indices
  data.applyToMesh(mesh)
  mesh.receiveShadows = true
  return mesh
}
export function propKit(scene: Scene) {
  const cache = new Map<string, PBRMaterial>()
  const mat = (name: string, color: string, roughness = 0.5, metallic = 0) => {
    let m = cache.get(name)
    if (m) return m
    m = new PBRMaterial(name, scene)
    m.albedoColor = Color3.FromHexString(color)
    m.roughness = roughness
    m.metallic = metallic
    m.maxSimultaneousLights = 5
    cache.set(name, m)
    return m
  }
  const black = mat("ABS-charcoal", "#171C20", 0.45),
    rubber = mat("matte-rubber", "#151719", 0.92),
    steel = mat("brushed-aluminium", "#A0A8AE", 0.31, 0.85),
    white = mat("warm-laminate", "#D5D7D1", 0.5),
    paint = mat("powder-coated-steel", "#333C40", 0.6, 0.35)
  const box = (
    n: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: Material,
    r = 0.008,
  ) => {
    const o = bevelBox(scene, n, w, h, d, r)
    o.position.set(x, y, z)
    o.material = m
    return o
  }
  const cyl = (
    n: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    height: number,
    m: Material,
    top = diameter,
  ) => {
    const o = MeshBuilder.CreateCylinder(
      n,
      { diameterBottom: diameter, diameterTop: top, height, tessellation: 24 },
      scene,
    )
    o.position.set(x, y, z)
    o.material = m
    o.receiveShadows = true
    return o
  }
  const ball = (
    n: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: Material,
  ) => {
    const o = MeshBuilder.CreateSphere(n, { diameter: 1, segments: 20 }, scene)
    o.position.set(x, y, z)
    o.scaling.set(w, h, d)
    o.material = m
    o.receiveShadows = true
    return o
  }
  const tube = (n: string, pts: number[][], r: number, m: Material) => {
    const o = MeshBuilder.CreateTube(
      n,
      { path: pts.map((p) => Vector3.FromArray(p)), radius: r, tessellation: 8 },
      scene,
    )
    o.material = m
    o.receiveShadows = true
    return o
  }
  const texture = (
    name: string,
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
    emission = 0,
  ) => {
    const existing = cache.get(name)
    if (existing) return existing
    const t = new DynamicTexture(name, { width: w, height: h }, scene, true)
    draw(t.getContext() as CanvasRenderingContext2D)
    t.update()
    t.anisotropicFilteringLevel = 8
    const m = mat(name, "#FFFFFF", emission ? 0.23 : 0.65)
    m.albedoTexture = t
    if (emission) {
      m.emissiveTexture = t
      m.emissiveColor = new Color3(emission, emission, emission)
    }
    return m
  }
  const label = (
    n: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    m: Material,
    ry = Math.PI,
  ) => {
    const o = MeshBuilder.CreatePlane(
      n,
      { width: w, height: h, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    )
    o.position.set(x, y, z)
    o.rotation.y = ry
    o.material = m
    o.receiveShadows = true
    return o
  }
  const screw = (x: number, y: number, z: number) => {
    const o = cyl("recessed-screw", x, y, z, 0.008, 0.003, steel)
    o.rotation.x = Math.PI / 2
    box("screw-slot", x, y, z + 0.002, 0.005, 0.001, 0.001, rubber, 0.0002)
  }
  function finish(start: number, name: string, shadow: ShadowGenerator, metadata?: object) {
    const groups = new Map<Material, Mesh[]>()
    for (const m of scene.meshes.slice(start)) {
      if (!(m instanceof Mesh) || !m.material || m.parent) continue
      const group = groups.get(m.material) ?? []
      group.push(m)
      groups.set(m.material, group)
    }
    for (const [material, meshes] of groups) {
      const m = Mesh.MergeMeshes(meshes, true, true, undefined, false, false)
      if (m) {
        m.name = name + " / " + material.name
        m.metadata = metadata
        m.receiveShadows = true
        m.freezeWorldMatrix()
        shadow.addShadowCaster(m)
      }
    }
  }
  return {
    mat,
    black,
    rubber,
    steel,
    white,
    paint,
    box,
    cyl,
    ball,
    tube,
    texture,
    label,
    screw,
    finish,
  }
}
export type PropKit = ReturnType<typeof propKit>
