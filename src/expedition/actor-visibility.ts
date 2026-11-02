import { Ray, Vector3, type BoundingBox } from "@babylonjs/core";

/** Babylon's box ray test is infinite; opposing rays bound it to this segment. */
export function actorSight(camera: Vector3, player: Vector3) {
  const toward = player.subtract(camera),
    length = toward.length();
  const direction = toward.normalizeToNew();
  const end = camera.add(direction.scale(Math.max(0, length - 0.35)));
  const forward = new Ray(camera, direction);
  const reverse = new Ray(end, direction.negate());
  return (box: BoundingBox) =>
    length > 0.35 &&
    forward.intersectsBoxMinMax(box.minimumWorld, box.maximumWorld, 0.2) &&
    reverse.intersectsBoxMinMax(box.minimumWorld, box.maximumWorld, 0.2);
}

export function actorOpacity(previous: number, blocked: boolean, dt: number) {
  const target = blocked ? 0.22 : 1;
  return dt > 0
    ? previous + (target - previous) * (1 - Math.exp(-dt * (blocked ? 22 : 10)))
    : target;
}
