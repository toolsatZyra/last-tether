import { v, type V, type Point } from "../src/expedition/level.ts";
/** Steer the test player onto the authored bridge centreline before advancing.
 * A direct diagonal from an arbitrary arena position to the next platform can
 * cross empty space outside the bridge. This guides inputs, never player position.
 */
export function connectionTarget(position: V, from: Point, to: Point): V {
  const dx = to.x - from.x,
    dz = to.z - from.z,
    length = Math.hypot(dx, dz);
  if (length < 0.01) return { ...to };
  const t = Math.max(
    0,
    Math.min(
      1,
      ((position.x - from.x) * dx + (position.z - from.z) * dz) /
        (length * length),
    ),
  );
  const lateral = Math.hypot(
    position.x - (from.x + dx * t),
    position.z - (from.z + dz * t),
  );
  const ahead = Math.min(1, t + (lateral > 2 ? 0 : 6 / length));
  return v(
    from.x + dx * ahead,
    from.y + (to.y - from.y) * ahead,
    from.z + dz * ahead,
  );
}
