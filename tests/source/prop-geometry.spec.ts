import { test, expect } from "@playwright/test"
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js"
import { Scene } from "@babylonjs/core/scene.js"
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js"
import { Ray } from "@babylonjs/core/Culling/ray.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { bevelBox } from "../../apps/web/src/jeu/three/props"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js"
import { fitDoorPart } from "../../apps/web/src/jeu/three/slidingDoor"

test("les panneaux restent dans l’encadrement pendant l’ouverture et retrouvent leur forme à la fermeture", () => {
  const engine = new NullEngine(),
    scene = new Scene(engine)
  try {
    for (const horizontal of [true, false]) {
      const axis = horizontal ? "x" : "z"
      const width = 2.8,
        from = 8,
        to = from + width
      const leaves = [-1, 1].map((side) => {
        const root = new TransformNode("leaf", scene)
        const parts = [
          { width: width / 2, offset: 0 },
          { width: width / 2 - 0.2, offset: 0 },
          { width: 0.028, offset: side * width * 0.12 },
        ].map(({ width, offset }) => {
          const mesh = MeshBuilder.CreateBox(
            "part",
            { width: horizontal ? width : 0.14, height: 2.6, depth: horizontal ? 0.14 : width },
            scene,
          )
          mesh.parent = root
          return { mesh, width, offset }
        })
        return { root, side, parts }
      })
      for (const openness of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0]) {
        let visible = 0
        for (const leaf of leaves) {
          leaf.root.position[axis] = (from + to) / 2 + leaf.side * width * (0.25 + 0.52 * openness)
          for (const part of leaf.parts) {
            fitDoorPart(part, horizontal, leaf.root.position[axis], from, to)
            if (!part.mesh.isEnabled()) continue
            visible++
            part.mesh.computeWorldMatrix(true)
            const bounds = part.mesh.getBoundingInfo().boundingBox
            expect(bounds.minimumWorld[axis]).toBeGreaterThanOrEqual(from - 0.00001)
            expect(bounds.maximumWorld[axis]).toBeLessThanOrEqual(to + 0.00001)
            if (openness === 0) expect(part.mesh.scaling[axis]).toBeCloseTo(1)
          }
        }
        expect(visible > 0).toBe(openness < 1)
      }
    }
  } finally {
    engine.dispose()
  }
})

test("bevelled furniture has outward faces and can be targeted from all six sides", () => {
  const engine = new NullEngine(),
    scene = new Scene(engine)
  try {
    const mesh = bevelBox(scene, "cabinet", 0.8, 1.9, 0.95),
      computed: number[] = []
    VertexData.ComputeNormals(mesh.getVerticesData("position")!, mesh.getIndices()!, computed)
    const normals = mesh.getVerticesData("normal")!
    for (let i = 0; i < normals.length; i += 3)
      expect(
        normals[i] * computed[i] +
          normals[i + 1] * computed[i + 1] +
          normals[i + 2] * computed[i + 2],
      ).toBeGreaterThan(0.5)
    mesh.computeWorldMatrix(true)
    for (const dir of [
      Vector3.Right(),
      Vector3.Left(),
      Vector3.Up(),
      Vector3.Down(),
      Vector3.Forward(),
      Vector3.Backward(),
    ]) {
      const hit = scene.pickWithRay(
        new Ray(dir.scale(3), dir.negate(), 4),
        (m) => m === mesh,
        false,
        (a, b, c, ray) =>
          Vector3.Dot(Vector3.Cross(b.subtract(a), c.subtract(a)), ray.direction) > 0,
      )
      expect(hit?.hit).toBe(true)
    }
  } finally {
    engine.dispose()
  }
})
