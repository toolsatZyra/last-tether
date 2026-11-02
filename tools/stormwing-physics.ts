import {
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Vector3,
} from "@babylonjs/core";
export function fixture(scene) {
  const floor = MeshBuilder.CreateBox(
    "flight-test-floor",
    { width: 30, height: 1, depth: 30 },
    scene,
  );
  floor.position.set(0, 79.5, 0);
  const wall = MeshBuilder.CreateBox(
    "flight-test-wall",
    { width: 18, height: 12, depth: 1 },
    scene,
  );
  wall.position.set(0, 85, 0);
  const bodies = [floor, wall].map((m) => {
    const b = new PhysicsAggregate(m, PhysicsShapeType.BOX, { mass: 0 }, scene);
    b.shape.filterMembershipMask = 1;
    return b;
  });
  return {
    wall,
    dispose() {
      bodies.forEach((b) => b.dispose());
      floor.dispose();
      wall.dispose();
    },
  };
}
