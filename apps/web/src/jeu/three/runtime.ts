import { SSAO2RenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline.js"
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration.js"
import type { EscapeDocument } from "../game/escape"
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js"
import { Engine } from "@babylonjs/core/Engines/engine.js"
import { Ray } from "@babylonjs/core/Culling/ray.js"
import { Scene } from "@babylonjs/core/scene.js"
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js"
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js"
import { WORLD_ROOMS, INTERACTION_RADIUS } from "../game/world"
import type { PlayerPosition } from "../types/game"
import { FpsController } from "./controller"
import { MouseLook } from "./mouseLook"
import { buildWorld, doorIntersectsPosition } from "./world"
import type { Interaction } from "./world"
import { createNpcs } from "./npc"
import { CampusAudio } from "./audio"
import { readSettings } from "./settings"
import type { GameSettings } from "./settings"
export interface RuntimeState {
  epoch?: number
  active: boolean
  position: PlayerPosition
  solved: readonly string[]
  inventory: readonly string[]
  documents?: readonly EscapeDocument[]
  unlockedRoomIds?: readonly string[]
}
export interface RuntimeCallbacks {
  move: (p: PlayerPosition) => void
  interact: (roomId: string) => void
  pause: () => void
  map: () => void
  inventory: () => void
  target: (target: Interaction | null) => void
  lock: (locked: boolean) => void
  toast: (text: string) => void
  talk: (name: string, text: string, roomId?: string) => void
  pickup: (id: string) => void
  error: (text: string) => void
}
export function createCampusRuntime(
  canvas: HTMLCanvasElement,
  initial: RuntimeState,
  cb: RuntimeCallbacks,
  key: string,
  backdrop = false,
) {
  const engine = new Engine(
    canvas,
    true,
    { preserveDrawingBuffer: true, stencil: true, powerPreference: "high-performance" },
    true,
  )
  let settings = readSettings(),
    state = initial,
    disposed = false,
    locked = false,
    freeLook = false,
    enterPending = false,
    suppressUnlock = false,
    lastTarget = "",
    time = 0,
    lastReport = 0,
    lastStep = 0,
    lastSense = 0
  const scene = new Scene(engine),
    camera = new UniversalCamera("noah-eyes", new Vector3(0, 1.72, 0), scene)
  scene.activeCamera = camera
  const controller = new FpsController(camera, state.position)
  const mouseLook = new MouseLook()
  const world = buildWorld(scene, settings, state.documents),
    npcs = createNpcs(scene, world.materials, world.shadow),
    audio = new CampusAudio()
  audio.setVolume(settings.volume)
  const pipeline = new DefaultRenderingPipeline(
    "campus-finish",
    settings.quality !== "eco",
    scene,
    [camera],
  )
  pipeline.fxaaEnabled = true
  pipeline.samples = 1
  pipeline.imageProcessing.contrast = 1.05
  pipeline.imageProcessing.exposure = 0.85
  pipeline.imageProcessing.toneMappingEnabled = true
  pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES
  let ao: SSAO2RenderingPipeline | null = null
  function quality(s: GameSettings) {
    engine.setHardwareScalingLevel(
      s.quality === "eco"
        ? 2.2
        : s.quality === "high"
          ? Math.min(1, 1 / window.devicePixelRatio)
          : 1.15,
    )
    const resolution = s.quality === "high" ? 2048 : 1024
    if (world.shadow.getShadowMap()!.getSize().width !== resolution)
      world.shadow.getShadowMap()!.resize(resolution)
    world.shadow.getShadowMap()!.refreshRate = s.quality === "eco" ? 0 : 1
    world.glow.intensity = s.quality === "eco" ? 0 : 0.16
    world.glow.isEnabled = s.quality !== "eco"
    scene.shadowsEnabled = s.quality !== "eco"
    if (s.quality === "eco" && ao) {
      ao.dispose()
      ao = null
    }
    if (s.quality !== "eco" && !ao && engine.webGLVersion > 1) {
      ao = new SSAO2RenderingPipeline(
        "contact-shadows",
        scene,
        { ssaoRatio: 0.5, blurRatio: 0.5 },
        [camera],
      )
      ao.radius = 0.3
      ao.totalStrength = 0.8
      ao.samples = 8
      ao.expensiveBlur = false
    }
    for (const light of scene.lights)
      if (
        light.name.includes("-warm") ||
        light.name.includes("-blue") ||
        light.name.includes("-pink")
      )
        light.setEnabled(s.quality !== "eco")
  }
  quality(settings)
  try {
    const v = JSON.parse(localStorage.getItem("g4:3d:view:" + key) || "null")
    if (
      v &&
      Math.hypot(v.position.x - initial.position.x, v.position.y - initial.position.y) < 30 &&
      Number.isFinite(v.yaw) &&
      Number.isFinite(v.pitch)
    ) {
      controller.setLook(v.yaw, v.pitch)
    }
  } catch {}
  const roomLocked = (id: string) =>
    state.unlockedRoomIds
      ? !state.unlockedRoomIds.includes(id)
      : id === "sormiou" && state.solved.length < 5
  const doorKey = "g4:3d:doors:" + key
  try {
    const saved = JSON.parse(sessionStorage.getItem(doorKey) || "[]")
    for (const d of world.doors)
      if (Array.isArray(saved) && saved.includes(d.id) && !roomLocked(d.roomId))
        d.desired = d.openness = 1
  } catch {}
  for (const d of world.doors)
    if (doorIntersectsPosition(d, initial.position)) d.desired = d.openness = 1
  for (const [id, root] of world.items) root.setEnabled(!state.inventory.includes(id))
  let target: Interaction | null = null,
    lastDraw = 0
  const handlers: { node: EventTarget; name: string; fn: EventListener }[] = []
  function listen(node: EventTarget, name: string, fn: EventListener) {
    node.addEventListener(name, fn)
    handlers.push({ node, name, fn })
  }
  const report = () => {
    lastReport = time
    cb.move({ ...controller.position })
    try {
      localStorage.setItem(
        "g4:3d:view:" + key,
        JSON.stringify({
          position: controller.position,
          yaw: controller.yaw,
          pitch: controller.pitch,
        }),
      )
    } catch {}
  }
  function unlock(pause = false) {
    controller.stop()
    freeLook = false
    enterPending = false
    mouseLook.reset()
    cb.lock(false)
    if (document.pointerLockElement === canvas) {
      suppressUnlock = !pause
      document.exitPointerLock()
    } else {
      locked = false
      cb.lock(false)
    }
  }
  function enter() {
    if (backdrop || !state.active || disposed || locked || freeLook || enterPending) return
    audio.resume()
    canvas.focus()
    controller.stop()
    mouseLook.reset()
    enterPending = true
    try {
      const p = canvas.requestPointerLock()
      if (p) p.catch(enterFreeLook)
    } catch {
      enterFreeLook()
    }
  }
  function enterFreeLook() {
    if (!enterPending || disposed || !state.active || document.pointerLockElement === canvas) return
    enterPending = false
    freeLook = true
    mouseLook.reset()
    cb.lock(true)
    cb.toast("Bouge la souris dans le jeu pour regarder. Échap : pause.")
  }
  function interact() {
    if (!state.active || !target || backdrop) return
    audio.resume()
    report()
    if (target.kind === "door") {
      const d = world.doors.find((d) => d.id === target!.id)!
      if (roomLocked(d.roomId)) {
        audio.cue("deny")
        cb.toast("Porte verrouillée · récupère le code en terminant les énigmes précédentes.")
        return
      }
      if (d.desired && doorIntersectsPosition(d, controller.position)) {
        cb.toast("Éloigne-toi du seuil avant de fermer la porte.")
        return
      }
      d.desired = d.desired ? 0 : 1
      audio.cue("door")
      try {
        sessionStorage.setItem(
          doorKey,
          JSON.stringify(world.doors.filter((d) => d.desired).map((d) => d.id)),
        )
      } catch {}
      cb.toast(
        d.desired ? "Porte ouverte · vise le cadre et appuie sur E pour fermer." : "Porte fermée",
      )
    } else if (target.kind === "station") {
      const room = WORLD_ROOMS.find((r) => r.id === target!.id)!
      if (
        Math.hypot(
          room.interactionPosition.x - controller.position.x,
          room.interactionPosition.y - controller.position.y,
        ) > INTERACTION_RADIUS
      ) {
        cb.toast("Approche-toi de l’ordinateur pour utiliser le terminal.")
        return
      }
      unlock()
      audio.cue("pickup")
      cb.interact(room.id)
    } else if (target.kind === "npc") {
      const npc = npcs.find((n) => n.id === target!.id)!
      audio.cue("talk")
      unlock()
      cb.talk(npc.name, npc.talk(state.solved), npc.roomId)
    } else {
      world.items.get(target.id)?.setEnabled(false)
      audio.cue("pickup")
      cb.pickup(target.id)
      cb.toast("Document ajouté à l’inventaire · I pour examiner")
    }
  }
  if (!backdrop) {
    listen(canvas, "click", () => {
      if (!locked) enter()
    })
    listen(document, "pointerlockchange", () => {
      const was = locked
      locked = document.pointerLockElement === canvas
      if (locked && (!state.active || disposed)) {
        unlock()
        return
      }
      enterPending = false
      freeLook = false
      mouseLook.reset()
      cb.lock(locked)
      if (was && !locked) {
        controller.stop()
        report()
        if (!suppressUnlock && state.active) cb.pause()
      }
      suppressUnlock = false
    })
    listen(document, "pointerlockerror", enterFreeLook)
    listen(canvas, "mouseleave", () => mouseLook.reset())
    listen(document, "mousemove", ((e: MouseEvent) => {
      if ((!locked && !freeLook) || !state.active) return
      const movement = mouseLook.move(e, locked, e.target === canvas)
      if (movement) controller.look(movement.dx, movement.dy, settings.sensitivity)
    }) as EventListener)
    listen(window, "keydown", ((e: KeyboardEvent) => {
      if (
        !state.active ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return
      if (
        [
          "KeyW",
          "KeyZ",
          "KeyA",
          "KeyQ",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ShiftLeft",
          "ShiftRight",
          "ControlLeft",
          "ControlRight",
        ].includes(e.code) &&
        (locked || freeLook)
      ) {
        e.preventDefault()
        controller.keys.add(e.code)
      }
      if (e.repeat) return
      if (e.code === "KeyE" && (locked || freeLook)) {
        e.preventDefault()
        interact()
      }
      if (e.code === "KeyI") {
        e.preventDefault()
        report()
        unlock()
        cb.inventory()
      }
      if (e.code === "Escape") {
        report()
        unlock()
        cb.pause()
      }
    }) as EventListener)
    listen(window, "keyup", ((e: KeyboardEvent) => {
      controller.keys.delete(e.code)
    }) as EventListener)
    listen(window, "blur", () => {
      if (locked || freeLook) {
        unlock()
        cb.pause()
      }
      controller.stop()
      audio.suspend()
    })
  }
  listen(window, "resize", () => engine.resize())
  listen(window, "g4-settings", ((e: CustomEvent<GameSettings>) => {
    settings = e.detail
    audio.setVolume(settings.volume)
    quality(settings)
  }) as EventListener)
  listen(canvas, "webglcontextlost", ((e: Event) => {
    e.preventDefault()
    unlock()
    cb.error(
      "Le contexte graphique a été interrompu. Recharge la page pour reprendre la sauvegarde.",
    )
  }) as EventListener)
  engine.runRenderLoop(() => {
    if (disposed) return
    const dt = Math.min(0.12, engine.getDeltaTime() / 1000)
    time += dt
    if (backdrop) {
      camera.position.set(
        16.875 + Math.sin(time * 0.08) * 1.25,
        1.8,
        16.25 + Math.cos(time * 0.08) * 0.75,
      )
      camera.setTarget(new Vector3(19.375, 1.5, 14.625))
    } else {
      controller.update(
        dt,
        state.active && (locked || freeLook),
        settings,
        world.doors,
        npcs.map((n) => n.position),
      )
      if (controller.moving && time - lastStep > 0.42) {
        audio.cue("step")
        lastStep = time
      }
      if (time - lastReport > 0.2 && controller.moving) report()
    }
    for (const npc of npcs) npc.update(dt, time, controller.position, world.doors)
    world.update(dt, time, state.solved)
    if (!backdrop && time - lastSense > 0.1) {
      lastSense = time
      const ray = camera.getForwardRay(4.8)
      const hit = scene.pickWithRay(
        new Ray(ray.origin, ray.direction, 4.8),
        (m) => m.isEnabled() && m.isPickable && m.isVisible,
      )
      target = hit?.pickedMesh?.metadata?.interaction ?? null
      if (target?.kind === "door") {
        const d = world.doors.find((d) => d.id === target!.id)!
        target = {
          ...target,
          label: `${roomLocked(d.roomId) ? "Verrouillée · " : d.desired ? "Fermer · " : "Ouvrir · "}${WORLD_ROOMS.find((r) => r.id === d.roomId)!.label}`,
        }
      }
      const k = JSON.stringify(target)
      if (k !== lastTarget) {
        lastTarget = k
        cb.target(target)
      }
      canvas.dataset.inputMode = locked ? "pointer-lock" : freeLook ? "mouse" : "idle"
      canvas.dataset.position = JSON.stringify(controller.position)
      canvas.dataset.yaw = String(controller.yaw)
      canvas.dataset.pitch = String(controller.pitch)
      canvas.dataset.fps = String(Math.round(engine.getFps()))
      canvas.dataset.meshes = String(scene.meshes.length)
      canvas.dataset.doors = JSON.stringify(
        world.doors.map((d) => ({ id: d.id, open: d.openness })),
      )
      canvas.dataset.npcs = JSON.stringify(
        npcs.map((n) => ({ id: n.id, state: n.state, position: n.position })),
      )
    }
    if (backdrop || state.active || canvas.dataset.ready !== "true" || time - lastDraw > 1) {
      scene.render()
      lastDraw = time
    }
  })
  canvas.dataset.ready = "false"
  const ready = world.ready
    .then(
      () =>
        new Promise<void>((resolve) => {
          canvas.dataset.assets = "loaded"
          if (disposed) resolve()
          else scene.onAfterRenderObservable.addOnce(() => resolve())
        }),
    )
    .then(() => {
      if (!disposed) canvas.dataset.ready = "true"
    })
  return {
    ready,
    enter,
    openMap() {
      report()
      unlock()
      cb.map()
    },
    interact,
    unlock: () => unlock(),
    update(next: RuntimeState) {
      if (!next.active && state.active) {
        controller.stop()
        unlock()
        audio.suspend()
      }

      if (
        next.epoch !== state.epoch ||
        Math.hypot(
          next.position.x - controller.position.x,
          next.position.y - controller.position.y,
        ) > 110
      )
        controller.teleport(next.position)
      if (next.epoch !== state.epoch || (state.solved.length >= 5 && next.solved.length < 5))
        for (const door of world.doors)
          if (
            next.unlockedRoomIds
              ? !next.unlockedRoomIds.includes(door.roomId)
              : door.roomId === "sormiou"
          )
            door.desired = 0
      state = next
      for (const [id, root] of world.items) root.setEnabled(!state.inventory.includes(id))
    },
    dispose() {
      if (disposed) return
      disposed = true
      unlock()
      for (const h of handlers) h.node.removeEventListener(h.name, h.fn)
      audio.dispose()
      ao?.dispose()
      pipeline.dispose()
      scene.dispose()
      engine.dispose()
      canvas.dataset.ready = "false"
    },
  }
}
export type CampusRuntime = ReturnType<typeof createCampusRuntime>
