import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode.js"
import type { Scene } from "@babylonjs/core/scene.js"
import type { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js"
import type { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js"
import type { Mesh } from "@babylonjs/core/Meshes/mesh.js"
import { canWalkAt, findWalkPath, moveWithCollisions } from "../game/world"
import type { PlayerPosition } from "../types/game"
import { SCALE, canPassDoors } from "./controller"
import type { DoorCollider } from "./controller"
import { COLORS, material } from "./world"
import type { Interaction } from "./world"
export type NpcState = "patrol" | "observe" | "talk" | "guard" | "assist"
export interface CampusNpc {
  id: string
  name: string
  role: string
  root: TransformNode
  position: PlayerPosition
  state: NpcState
  roomId: string
  talk: (solved: readonly string[]) => string
  update: (dt: number, time: number, player: PlayerPosition, doors: readonly DoorCollider[]) => void
}
export function createNpcs(
  scene: Scene,
  materials: Map<string, PBRMaterial>,
  shadow: ShadowGenerator,
): CampusNpc[] {
  const specs = [
    {
      id: "noa",
      name: "Noa",
      role: "standard",
      roomId: "cafeteria",
      color: COLORS.cyan,
      p: { x: 650, y: 530 },
      route: [
        { x: 650, y: 530 },
        { x: 700, y: 680 },
        { x: 950, y: 680 },
      ],
    },
    {
      id: "mila",
      name: "Mila",
      role: "explorer",
      roomId: "classroom",
      color: COLORS.blue,
      p: { x: 385, y: 275 },
      route: [
        { x: 385, y: 275 },
        { x: 220, y: 285 },
        { x: 385, y: 390 },
      ],
    },
    {
      id: "ada",
      name: "Ada",
      role: "explorer",
      roomId: "cowork",
      color: COLORS.green,
      p: { x: 390, y: 730 },
      route: [
        { x: 390, y: 700 },
        { x: 390, y: 750 },
      ],
    },
    {
      id: "leo",
      name: "Léa",
      role: "standard",
      roomId: "amphitheater",
      color: COLORS.blue,
      p: { x: 1200, y: 740 },
      route: [
        { x: 1200, y: 650 },
        { x: 1200, y: 830 },
      ],
    },
    {
      id: "atlas",
      name: "Atlas",
      role: "guardian",
      roomId: "sormiou",
      color: COLORS.yellow,
      p: { x: 833, y: 848 },
      route: [],
    },
    {
      id: "byte",
      name: "Byte",
      role: "special",
      roomId: "gaming",
      color: COLORS.pink,
      p: { x: 1440, y: 280 },
      route: [
        { x: 1440, y: 280 },
        { x: 1350, y: 280 },
      ],
    },
  ]
  return specs.map((s) => {
    const root = new TransformNode("npc-" + s.id, scene)
    const torso = new TransformNode("torso", scene)
    torso.parent = root
    const scale = s.role === "guardian" ? 1.14 : 1
    root.scaling.setAll(scale)
    const mat = (c: string, e = false) => material(scene, materials, c, e)
    const parts: Mesh[] = []
    const sphere = (
      name: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      c: string,
      parent: TransformNode = torso,
    ) => {
      const m = MeshBuilder.CreateSphere(name, { diameter: 1, segments: 12 }, scene)
      m.parent = parent
      m.position.set(x, y, z)
      m.scaling.set(sx, sy, sz)
      m.material = mat(c)
      parts.push(m)
      return m
    }
    const box = (
      name: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      c: string,
      parent: TransformNode = torso,
    ) => {
      const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
      m.parent = parent
      m.position.set(x, y, z)
      m.material = mat(c)
      parts.push(m)
      return m
    }

    sphere("hoodie", 0, 1.03, 0, 0.69, 0.78, 0.43, s.color)
    sphere("hood", 0, 1.37, -0.07, 0.6, 0.43, 0.36, s.color)
    const head = sphere("face", 0, 1.66, 0.04, 0.52, 0.56, 0.46, COLORS.skin)
    sphere("hair-cap", 0, 1.88, -0.02, 0.56, 0.27, 0.47, COLORS.hair)
    for (let i = 0; i < 4; i++)
      sphere("hair-fringe", -0.19 + i * 0.12, 1.87, 0.2, 0.19, 0.19, 0.15, COLORS.hair)
    for (const x of [-0.1, 0.1]) {
      sphere("eye-white", x, 1.69, 0.252, 0.1, 0.115, 0.04, COLORS.white)
      sphere("pupil", x + 0.008, 1.685, 0.272, 0.046, 0.066, 0.025, COLORS.ink)
      box("eyebrow", x, 1.79, 0.258, 0.105, 0.027, 0.025, COLORS.hair)
    }
    sphere("nose", 0, 1.61, 0.265, 0.07, 0.08, 0.07, COLORS.skin)
    const smile = MeshBuilder.CreateTorus(
      "smile",
      { diameter: 0.11, thickness: 0.014, tessellation: 16 },
      scene,
    )
    smile.parent = head
    smile.position.set(0, -0.13, 0.22)
    smile.rotation.x = Math.PI / 2
    smile.scaling.y = 0.5
    smile.material = mat(COLORS.ink)
    parts.push(smile)
    sphere("yellow-badge", 0, 1.12, 0.218, 0.18, 0.18, 0.025, COLORS.yellow)
    box("backpack", 0, 1.1, -0.25, 0.45, 0.58, 0.17, COLORS.pink)
    for (const x of [-0.2, 0.2]) box("backpack-strap", x, 1.17, 0.2, 0.055, 0.5, 0.045, COLORS.pink)
    const legs: TransformNode[] = [],
      arms: TransformNode[] = []
    for (const side of [-1, 1]) {
      const hip = new TransformNode("hip", scene)
      hip.parent = root
      hip.position.set(side * 0.16, 0.74, 0)
      legs.push(hip)
      sphere("trouser", 0, -0.27, 0, 0.23, 0.63, 0.24, COLORS.ink, hip)
      box("sneaker", 0, -0.66, 0.075, 0.25, 0.14, 0.37, COLORS.white, hip)
      box("sneaker-accent", 0, -0.61, 0.13, 0.26, 0.06, 0.18, s.color, hip)
      const shoulder = new TransformNode("shoulder", scene)
      shoulder.parent = torso
      shoulder.position.set(side * 0.35, 1.28, 0)
      arms.push(shoulder)
      sphere("sleeve", side * 0.035, -0.17, 0, 0.23, 0.45, 0.25, s.color, shoulder)
      sphere("hand", side * 0.04, -0.43, 0.015, 0.17, 0.2, 0.18, COLORS.skin, shoulder)
    }
    if (s.role === "explorer") {
      sphere("cap-crown", 0, 1.99, 0, 0.59, 0.2, 0.5, COLORS.cyan)
      box("cap-visor", 0, 1.94, 0.25, 0.6, 0.055, 0.29, COLORS.cyan)
      box("satchel", -0.32, 0.89, 0.02, 0.19, 0.29, 0.27, COLORS.yellow)
    }
    if (s.role === "guardian") {
      for (const x of [-0.34, 0.34])
        sphere("padded-shoulder", x, 1.29, 0, 0.28, 0.24, 0.38, COLORS.blue)
      box("security-visor", 0, 1.71, 0.278, 0.4, 0.12, 0.045, COLORS.ink)
      box("visor-light", 0, 1.71, 0.305, 0.29, 0.018, 0.015, COLORS.cyan)
    }
    if (s.role === "special") {
      for (const x of [-0.3, 0.3]) sphere("headphones", x, 1.74, 0, 0.13, 0.27, 0.2, COLORS.cyan)
      box("headphone-band", 0, 1.99, 0, 0.59, 0.045, 0.12, COLORS.cyan)
      box("tablet", 0.4, 1.02, 0.25, 0.3, 0.39, 0.05, COLORS.ink)
      box("tablet-screen", 0.4, 1.02, 0.284, 0.24, 0.31, 0.015, COLORS.cyan)
    }
    const metadata = {
      interaction: {
        id: s.id,
        kind: "npc",
        label: `Parler à ${s.name}`,
        roomId: s.roomId,
      } satisfies Interaction,
    }
    parts.forEach((m) => {
      m.metadata = metadata
      shadow.addShadowCaster(m)
    })
    let index = 0,
      path: PlayerPosition[] = [],
      wait = 0,
      phase = 0,
      talkUntil = 0
    const npc: CampusNpc = {
      id: s.id,
      name: s.name,
      role: s.role,
      roomId: s.roomId,
      root,
      position: { ...s.p },
      state: s.role === "guardian" ? "guard" : "patrol",
      talk() {
        talkUntil = performance.now() + 5000
        npc.state = "talk"
        if (s.role === "guardian")
          return "En aventure, la porte de sortie s’ouvre après cinq énigmes. Dans la course, cette console valide l’arrivée après les cinq salles. Le carnet garde tes souvenirs entre deux boucles."
        if (s.roomId === "classroom")
          return "Le terminal de Sugiton utilise le souvenir du café. Lis ensuite le journal d’erreur : le crash et la restauration y laissent des traces."
        if (s.roomId === "cowork")
          return "Les quatre cartes décrivent la réparation. Protège d’abord les données et vérifie le correctif avant de le déployer. Tout couper donne une autre fin, mais laisse le système en panne."
        if (s.roomId === "amphitheater")
          return "Je suis Léa. Le planning montre ce qui a été sacrifié pour livrer trop vite. Au terminal, tu peux accepter mon aide contre dix minutes : les indices légers seront gratuits ici et à Mont Ventoux."
        if (s.role === "special")
          return "À Mont Ventoux, suis la valeur de l’heure dans le script, puis compare les deux images. Le numéro de ligne et le nombre de différences formeront un code."
        return "Le café de 9h00 est le début de la chaîne. Observe les étagères, puis résous la disposition de la table. M ouvre le plan et J le carnet de souvenirs."
      },
      update(dt, time, player, doors) {
        const distance = Math.hypot(player.x - npc.position.x, player.y - npc.position.y)
        let moving = false
        if (performance.now() < talkUntil) npc.state = "talk"
        else if (s.role === "guardian") npc.state = "guard"
        else if (distance < 90) npc.state = s.role === "special" ? "assist" : "observe"
        else npc.state = "patrol"
        if (npc.state === "patrol" && s.route.length) {
          if (wait > 0) wait -= dt
          else {
            if (!path.length) {
              index = (index + 1) % s.route.length
              path = findWalkPath(npc.position, s.route[index])
              wait = path.length ? 0 : 2
            }
            const next = path[0]
            if (next) {
              const dx = next.x - npc.position.x,
                dy = next.y - npc.position.y,
                d = Math.hypot(dx, dy),
                step = Math.min(d, dt * 30)
              const p = moveWithCollisions(
                npc.position,
                (dx / (d || 1)) * step,
                (dy / (d || 1)) * step,
              )
              if (
                canPassDoors(p, doors) &&
                Math.hypot(player.x - p.x, player.y - p.y) > 35 &&
                canWalkAt(p)
              ) {
                moving = Math.hypot(p.x - npc.position.x, p.y - npc.position.y) > 0.01
                npc.position = p
              } else {
                path = []
                wait = 1
              }
              if (d < 3) path.shift()
              if (!path.length) wait = 2
              const angle = Math.atan2(dx, dy)
              root.rotation.y +=
                Math.atan2(Math.sin(angle - root.rotation.y), Math.cos(angle - root.rotation.y)) *
                Math.min(1, dt * 7)
            }
          }
        } else if (distance < 130) {
          const angle = Math.atan2(player.x - npc.position.x, player.y - npc.position.y)
          root.rotation.y +=
            Math.atan2(Math.sin(angle - root.rotation.y), Math.cos(angle - root.rotation.y)) *
            Math.min(1, dt * 4)
        }
        phase += dt * (moving ? 8 : 2)
        root.position.set(
          npc.position.x * SCALE,
          moving ? Math.abs(Math.sin(phase)) * 0.025 : 0,
          npc.position.y * SCALE,
        )
        torso.position.y = Math.sin(time * 2 + specs.indexOf(s)) * 0.012
        legs.forEach((l, i) => (l.rotation.x = moving ? Math.sin(phase + i * Math.PI) * 0.55 : 0))
        arms.forEach((a, i) => {
          a.rotation.x = moving
            ? -Math.sin(phase + i * Math.PI) * 0.4
            : npc.state === "talk" && i === 1
              ? -0.7 + Math.sin(time * 4) * 0.16
              : 0.03 * Math.sin(time * 2 + i)
          a.rotation.z = (i === 0 ? 1 : -1) * 0.08
        })
        root.metadata = { state: npc.state, role: s.role }
      },
    }
    npc.update(0, 0, { x: 0, y: 0 }, [])
    return npc
  })
}
