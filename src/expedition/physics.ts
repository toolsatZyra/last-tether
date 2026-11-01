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
import type { Expedition } from "./engine";
import type { V } from "./level";

/** Babylon's Havok controller owns capsule sweeps, sliding, slope and ground contact. */
export class PhysicsWorld {
  bodies: PhysicsAggregate[] = [];
  controller: PhysicsCharacterController | null = null;
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
    this.controller?.dispose();
    this.controller = null;
    this.bodies.forEach((b) => b.dispose());
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
  }
  move(p: V, velocity: V, dt: number) {
    const cc = this.controller!;
    const expected = new Vector3(p.x, p.y + 1.05, p.z);
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
      p: { x: position.x, y: position.y - 1.05, z: position.z },
      grounded: supported && velocity.y <= 0,
    };
  }
}
