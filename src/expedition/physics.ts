import HavokPhysics from "@babylonjs/havok";
import wasmUrl from "@babylonjs/havok/lib/esm/HavokPhysics.wasm?url";
import {
  HavokPlugin,
  PhysicsCharacterController,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
  Scene,
  Mesh,
  CharacterSupportedState,
} from "@babylonjs/core";
import type { Enemy, Expedition } from "./engine";
import type { V } from "./level";

/** Babylon's Havok controller owns capsule sweeps, sliding, slope and ground contact. */
export class PhysicsWorld {
  bodies: PhysicsAggregate[] = [];
  controller: PhysicsCharacterController | null = null;
  enemyControllers = new Map<
    Enemy,
    { controller: PhysicsCharacterController; height: number }
  >();
  scene: Scene;
  constructor(scene: Scene) {
    this.scene = scene;
  }
  async init() {
    const havok = await HavokPhysics({ locateFile: () => wasmUrl });
    this.scene.enablePhysics(
      new Vector3(0, -28, 0),
      new HavokPlugin(true, havok),
    );
    this.scene.getPhysicsEngine()!.setTimeStep(1 / 60);
  }
  rebuild(meshes: Mesh[], s: Expedition) {
    for (const _ of this.rebuildSteps(meshes, s)) {
    }
  }
  *rebuildSteps(meshes: Mesh[], s: Expedition): Generator<void> {
    for (const { controller } of this.enemyControllers.values())
      controller.dispose();
    this.enemyControllers.clear();
    this.controller?.dispose();
    this.controller = null;
    for (const body of this.bodies) {
      body.dispose();
      yield;
    }
    this.bodies = [];
    for (const mesh of meshes) {
      if (!mesh.metadata?.physics) continue;
      mesh.computeWorldMatrix(true);
      const vertices = mesh.getVerticesData("position"),
        indices = mesh.getIndices();
      if (
        !vertices ||
        !indices ||
        vertices.some((n) => !Number.isFinite(n)) ||
        indices.some((n) => n < 0 || n >= vertices.length / 3)
      )
        throw new Error(
          "Invalid collision mesh: " +
            JSON.stringify({
              name: mesh.name,
              vertices: vertices?.length,
              indices: indices?.length,
              maxIndex: indices
                ? Array.from(indices).reduce((a, b) => Math.max(a, b), 0)
                : 0,
              badVertex: vertices?.findIndex((n) => !Number.isFinite(n)),
              material: mesh.material?.name,
            }),
        );
      this.bodies.push(
        new PhysicsAggregate(
          mesh,
          PhysicsShapeType.MESH,
          { mass: 0, friction: 0.6, restitution: 0 },
          this.scene,
        ),
      );
      yield;
    }
    this.controller = new PhysicsCharacterController(
      new Vector3(s.p.x, s.p.y + 1.05, s.p.z),
      { capsuleHeight: 2.1, capsuleRadius: 0.38 },
      this.scene,
    );
    this.controller.maxStepHeight = 0.45;
    this.controller.maxSlopeCosine = Math.cos(Math.PI / 3);
    this.controller.keepDistance = 0.02;
    this.controller.keepContactTolerance = 0.08;
    s.motion = (p, velocity, dt) => this.move(p, velocity, dt);
    s.enemyMotion = (enemy, velocity, dt) =>
      this.moveEnemy(enemy, velocity, dt);
    s.syncEnemyPhysics = (enemies) => {
      const living = new Set(enemies.filter((e) => e.hp > 0));
      for (const [e, body] of this.enemyControllers)
        if (!living.has(e)) {
          body.controller.dispose();
          this.enemyControllers.delete(e);
        }
    };
  }
  moveEnemy(e: Enemy, velocity: V, dt: number) {
    let body = this.enemyControllers.get(e);
    if (!body) {
      const height = e.kind === "brute" ? 3 : 1.8;
      const radius = e.kind === "brute" ? 0.9 : 0.55;
      const controller = new PhysicsCharacterController(
        new Vector3(e.p.x, e.p.y + height / 2, e.p.z),
        { capsuleHeight: height, capsuleRadius: radius },
        this.scene,
      );
      controller.maxStepHeight = 0.45;
      controller.maxSlopeCosine = Math.cos(Math.PI / 3);
      controller.keepDistance = 0.02;
      controller.keepContactTolerance = 0.08;
      body = { controller, height };
      this.enemyControllers.set(e, body);
    }
    return this.moveController(body.controller, body.height, e.p, velocity, dt);
  }
  move(p: V, velocity: V, dt: number) {
    return this.moveController(this.controller!, 2.1, p, velocity, dt);
  }
  moveController(
    cc: PhysicsCharacterController,
    height: number,
    p: V,
    velocity: V,
    dt: number,
  ) {
    const expected = new Vector3(p.x, p.y + height / 2, p.z);
    if (Vector3.Distance(cc.getPosition(), expected) > 0.2)
      cc.setPosition(expected);
    const support = cc.checkSupport(dt, new Vector3(0, -1, 0));
    cc.setVelocity(new Vector3(velocity.x, velocity.y, velocity.z));
    cc.integrate(dt, support, new Vector3(0, -28, 0));
    const position = cc.getPosition();
    const supported =
      cc.checkSupport(dt, new Vector3(0, -1, 0)).supportedState ===
      CharacterSupportedState.SUPPORTED;
    return {
      p: { x: position.x, y: position.y - height / 2, z: position.z },
      grounded: supported && velocity.y <= 0,
    };
  }
}
