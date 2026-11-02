import {
  Engine,
  Scene,
  Vector3,
  Color4,
  FreeCamera,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";

export function createMainScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Scene {
  const scene = new Scene(engine);

  scene.clearColor = new Color4(0.08, 0.09, 0.13, 1);

  // Camera FPS
  const camera = new FreeCamera("player", new Vector3(0, 1.7, -5), scene);

  camera.setTarget(new Vector3(0, 1.7, 0));
  camera.attachControl(canvas, true);

  camera.keysUp = [90, 87]; // Z / W
  camera.keysDown = [83]; // S
  camera.keysLeft = [81, 65]; // Q / A
  camera.keysRight = [68]; // D

  camera.speed = 0.15;
  camera.angularSensibility = 3000;

  scene.activeCamera = camera;

  // Lumière
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  light.intensity = 0.9;

  // Sol
  const ground = MeshBuilder.CreateGround(
    "ground",
    {
      width: 20,
      height: 20,
    },
    scene,
  );

  const groundMaterial = new StandardMaterial("groundMaterial", scene);

  groundMaterial.diffuseColor = new Color3(0.35, 0.35, 0.4);
  ground.material = groundMaterial;

  // Objet de test
  const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);

  box.position.y = 1;

  const boxMaterial = new StandardMaterial("boxMaterial", scene);

  boxMaterial.diffuseColor = new Color3(0.45, 0.3, 0.85);
  box.material = boxMaterial;

  // Collisions
  scene.collisionsEnabled = true;

  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new Vector3(0.35, 0.85, 0.35);

  ground.checkCollisions = true;
  box.checkCollisions = true;

  scene.gravity = new Vector3(0, -0.15, 0);

  return scene;
}
