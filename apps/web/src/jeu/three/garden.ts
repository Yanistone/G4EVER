import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js"
import { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js"
import { Color3 } from "@babylonjs/core/Maths/math.color.js"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js"
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js"
import type { Scene } from "@babylonjs/core/scene.js"
export function addGarden(scene: Scene) {
  const sky = MeshBuilder.CreateSphere(
      "daylight-sky",
      { diameter: 160, segments: 32, sideOrientation: Mesh.BACKSIDE },
      scene,
    ),
    skyMat = new StandardMaterial("daylight-sky-material", scene)
  const panorama = new Texture("/assets/realism/campus-panorama.jpg", scene)
  panorama.uScale = -1
  panorama.vScale = -1
  panorama.vOffset = 1
  skyMat.backFaceCulling = false
  skyMat.disableLighting = true
  skyMat.diffuseColor = Color3.Black()
  skyMat.emissiveColor = Color3.Black()
  skyMat.emissiveTexture = panorama
  sky.material = skyMat
  sky.infiniteDistance = true
  sky.ignoreCameraMaxZ = true
  sky.isPickable = false
  const ground = MeshBuilder.CreateGround("campus-garden", { width: 160, height: 160 }, scene)
  ground.position.set(20, -0.11, 14)
  const turf = new PBRMaterial("garden-turf", scene)
  turf.albedoColor = Color3.FromHexString("#81946B")
  turf.roughness = 0.98
  turf.metallic = 0
  ground.material = turf
  ground.isPickable = false
  ground.receiveShadows = true
  const pathMat = new PBRMaterial("garden-path-stone", scene)
  pathMat.albedoColor = Color3.FromHexString("#D7D4C9")
  pathMat.roughness = 0.9
  pathMat.metallic = 0
  for (const x of [0.6, 39.4]) {
    const path = MeshBuilder.CreateBox(
      "garden-path",
      { width: 1.7, height: 0.06, depth: 28 },
      scene,
    )
    path.position.set(x, -0.065, 14)
    path.material = pathMat
    path.isPickable = false
  }
  return LoadAssetContainerAsync("/assets/realism/models/shrub_02/shrub_02_1k.gltf", scene)
    .then((c) => {
      if (scene.isDisposed) {
        c.dispose()
        return
      }
      for (const mesh of c.meshes) mesh.receiveShadows = true
      scene.onDisposeObservable.addOnce(() => c.dispose())
      for (const [index, p] of [
        { x: -1.8, z: 7 },
        { x: -1.8, z: 19 },
        { x: 41.5, z: 7 },
        { x: 41.5, z: 19 },
      ].entries()) {
        const group = c.instantiateModelsToScene((n) => "garden-" + index + "-" + n, false, {
          doNotInstantiate: false,
        })
        const root = new TransformNode("garden-shrub-row", scene)
        for (const n of group.rootNodes) n.parent = root
        root.computeWorldMatrix(true)
        const bounds = root.getHierarchyBoundingVectors(true),
          height = bounds.max.y - bounds.min.y,
          k = 1.7 / height
        const placement = new TransformNode("garden-shrub-placement", scene)
        root.parent = placement
        root.scaling.setAll(k)
        root.position.set(
          (-(bounds.min.x + bounds.max.x) / 2) * k,
          -bounds.min.y * k,
          (-(bounds.min.z + bounds.max.z) / 2) * k,
        )
        placement.rotation.y = Math.PI / 2
        placement.position.set(p.x, 0, p.z)
        for (const m of root.getChildMeshes()) {
          m.isPickable = false
        }
      }
    })
    .catch((e) => {
      if (!scene.isDisposed) throw e
    })
}
