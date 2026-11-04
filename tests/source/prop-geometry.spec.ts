import { test, expect } from "@playwright/test"
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js"
import { Scene } from "@babylonjs/core/scene.js"
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData.js"
import { Ray } from "@babylonjs/core/Culling/ray.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { bevelBox } from "../../apps/web/src/three/props"

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
