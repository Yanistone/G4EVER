import { addGarden } from "./garden"
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js"
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import { Color3 } from "@babylonjs/core/Maths/math.color.js"
import { HDRCubeTexture } from "@babylonjs/core/Materials/Textures/hdrCubeTexture.js"
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js"
import type { Scene } from "@babylonjs/core/scene.js"
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js"
import "@babylonjs/loaders/glTF/glTFFileLoader.js"
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js"
import { readSettings } from "./settings"
import { WORLD_CHAIRS } from "../game/world"
import { SCALE } from "./controller"
export function photographicMaterial(scene: Scene, id: string, name: string, meters = 1) {
  const root = "/assets/realism/textures/" + id + "/"
  const names =
    id === "carpet012"
      ? [
          "Carpet012_1K-JPG_Color.jpg",
          "Carpet012_1K-JPG_NormalGL.jpg",
          "Carpet012_1K-JPG_Roughness.jpg",
        ]
      : ["color.jpg", "normal.jpg", "roughness.jpg"]
  const m = new PBRMaterial(name, scene)
  m.albedoColor = Color3.White()
  m.metallic = 0
  m.roughness = 1
  m.maxSimultaneousLights = 5
  m.albedoTexture = new Texture(root + names[0], scene)
  m.bumpTexture = new Texture(root + names[1], scene)
  m.bumpTexture.level = 0.5
  m.metallicTexture = new Texture(root + names[2], scene)
  m.useRoughnessFromMetallicTextureAlpha = false
  m.useRoughnessFromMetallicTextureGreen = true
  m.useMetallnessFromMetallicTextureBlue = false
  for (const t of [m.albedoTexture, m.bumpTexture, m.metallicTexture]) {
    ;(t as Texture).uScale = meters
    ;(t as Texture).vScale = meters
  }
  m.environmentIntensity = 0.65
  return m
}
export function addRealism(scene: Scene, shadow: ShadowGenerator) {
  scene.environmentIntensity = 0.65
  const eco = readSettings().quality === "eco"
  const env = new HDRCubeTexture(
    "/assets/realism/campus-daylight.hdr",
    scene,
    eco ? 32 : 128,
    false,
    !eco,
    false,
    !eco,
  )
  scene.environmentTexture = env
  const wall = photographicMaterial(scene, "white_plaster_02", "photographic-plaster", 1)
  wall.albedoTexture = null
  wall.albedoColor = Color3.FromHexString("#F1F0E9")
  wall.bumpTexture!.level = 0.12
  for (const mesh of scene.meshes)
    if (mesh.name.startsWith("architectural-wall")) mesh.material = wall
  const chairPlaces = WORLD_CHAIRS.map((c) => ({
    x: (c.x + c.width / 2) * SCALE,
    z: (c.y + c.height / 2) * SCALE,
    id: c.id,
    room: c.roomId,
  }))
  for (const m of scene.meshes)
    if (
      [
        "seat-cushion",
        "chair-upholstered-back",
        "chair-steel-frame",
        "chair-foot",
        "seat-base",
      ].includes(m.name)
    )
      m.setEnabled(false)
  const load = async (id: string) => {
    const container = await LoadAssetContainerAsync(
      "/assets/realism/models/" + id + "/" + id + "_1k.gltf",
      scene,
    )
    if (scene.isDisposed) {
      container.dispose()
      return
    }
    for (const mesh of container.meshes) mesh.receiveShadows = true
    scene.onDisposeObservable.addOnce(() => container.dispose())
    return container
  }
  return Promise.all([
    load("modern_arm_chair_01").then((c) => {
      if (!c) return
      for (const chair of [
        ...chairPlaces.filter((c) => c.room === "cafeteria"),
        { x: 335 * SCALE, z: 846 * SCALE, id: "lounge", room: "cowork" },
      ]) {
        const instance = c.instantiateModelsToScene(
          (n) => "modern-chair-" + chair.id + "-" + n,
          false,
          { doNotInstantiate: false },
        )
        const root = new TransformNode("modern-chair-scan", scene)
        root.position.set(chair.x, 0, chair.z)
        root.scaling.set(0.75 / 0.82, 1, 0.8 / 0.987)
        if (chair.room === "cafeteria") root.rotation.y = Math.PI
        if (chair.id === "lounge") root.rotation.y = -0.8
        for (const n of instance.rootNodes) n.parent = root
        for (const m of root.getChildMeshes()) {
          m.isPickable = false
          shadow.addShadowCaster(m)
        }
      }
    }),
    load("sofa_03").then((c) => {
      if (!c) return
      const instance = c.instantiateModelsToScene((n) => "lounge-sofa-" + n, false, {
        doNotInstantiate: false,
      })
      const root = new TransformNode("lounge-sofa-scan", scene)
      root.position.set(190 * SCALE, 0, 814.5 * SCALE)
      for (const n of instance.rootNodes) n.parent = root
      for (const m of root.getChildMeshes()) {
        m.isPickable = false
        shadow.addShadowCaster(m)
      }
    }),
    load("CoffeeCart_01").then((c) => {
      if (!c) return
      const group = c.instantiateModelsToScene((n) => "scanned-coffee-cart-" + n, false, {
        doNotInstantiate: false,
      })
      const root = new TransformNode("coffee-cart-scan", scene)
      for (const n of group.rootNodes) n.parent = root
      root.computeWorldMatrix(true)
      const b = root.getHierarchyBoundingVectors(true),
        k = Math.min(1.875 / (b.max.x - b.min.x), 0.85 / (b.max.z - b.min.z))
      root.scaling.setAll(k)
      root.position.set(
        632.5 * SCALE - ((b.min.x + b.max.x) / 2) * k,
        -b.min.y * k,
        455 * SCALE - ((b.min.z + b.max.z) / 2) * k,
      )
      for (const m of root.getChildMeshes()) shadow.addShadowCaster(m)
    }),
    load("projector_screen").then((c) => {
      if (!c) return
      const group = c.instantiateModelsToScene((n) => "scanned-projector-" + n, false, {
        doNotInstantiate: false,
      })
      const root = new TransformNode("projector-screen-scan", scene)
      for (const n of group.rootNodes) n.parent = root
      root.computeWorldMatrix(true)
      const b = root.getHierarchyBoundingVectors(true),
        k = Math.min(1.1 / (b.max.x - b.min.x), 0.95 / (b.max.z - b.min.z))
      root.scaling.setAll(k)
      root.position.set(
        1505 * SCALE - ((b.min.x + b.max.x) / 2) * k,
        -b.min.y * k,
        563 * SCALE - ((b.min.z + b.max.z) / 2) * k,
      )
      for (const m of root.getChildMeshes()) shadow.addShadowCaster(m)
    }),
    addGarden(scene),
    load("potted_plant_01").then((c) => {
      if (!c) return
      for (const p of [
        { x: 2.12, z: 3.64 },
        { x: 37.85, z: 3.65 },
        { x: 2.12, z: 23.6 },
        { x: 37.85, z: 23.6 },
        { x: 25.2, z: 11.025 },
      ]) {
        const instance = c.instantiateModelsToScene((n) => "real-plant-" + n, false, {
          doNotInstantiate: false,
        })
        const root = new TransformNode("plant-scan", scene)
        root.position.set(p.x, 0, p.z)
        root.scaling.setAll(0.75)
        for (const n of instance.rootNodes) n.parent = root
        for (const m of root.getChildMeshes()) {
          m.isPickable = false
          shadow.addShadowCaster(m)
        }
      }
      for (const mesh of scene.meshes)
        if (
          (mesh.name === "ceramic-planter" || mesh.name === "plant-leaf") &&
          ((mesh.position.x < 2 && mesh.position.z < 4) ||
            (mesh.position.x > 38 && mesh.position.z > 23))
        )
          mesh.setEnabled(false)
    }),
  ])
    .then(() => {})
    .catch((e) => {
      if (!scene.isDisposed) throw e
    })
}
