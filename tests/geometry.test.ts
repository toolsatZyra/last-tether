import test from "node:test";
import assert from "node:assert/strict";
import { archWedge } from "../src/expedition/geometry.ts";

test("every arch stone has outward-facing finite normals and non-degenerate faces", () => {
  for (const [radius, rise, depth] of [
    [8.4, 8, 3.4],
    [9, 6.5, 3.4],
    [15, 9.3, 8.8],
  ])
    for (let segment = 0; segment < 19; segment++) {
      const data = archWedge(
        radius,
        rise,
        1.15,
        depth,
        (segment * Math.PI) / 19 + 0.006,
        ((segment + 1) * Math.PI) / 19 - 0.006,
      );
      const p = Array.from(data.positions!),
        n = Array.from(data.normals!),
        index = Array.from(data.indices!);
      assert.ok([...p, ...n].every(Number.isFinite));
      const center = [0, 0, 0];
      for (let i = 0; i < p.length; i++) center[i % 3] += p[i] / (p.length / 3);
      for (let face = 0; face < 6; face++) {
        const at = face * 12,
          mid = [0, 0, 0];
        for (let j = 0; j < 4; j++)
          for (let axis = 0; axis < 3; axis++)
            mid[axis] += p[at + j * 3 + axis] / 4;
        const outward = mid.reduce(
          (sum, value, axis) => sum + (value - center[axis]) * n[at + axis],
          0,
        );
        assert.ok(
          outward > 0,
          "inward face at segment " + segment + " face " + face,
        );
      }
      for (let i = 0; i < index.length; i += 3) {
        const a = index[i] * 3,
          b = index[i + 1] * 3,
          c = index[i + 2] * 3;
        const u = [p[b] - p[a], p[b + 1] - p[a + 1], p[b + 2] - p[a + 2]],
          v = [p[c] - p[a], p[c + 1] - p[a + 1], p[c + 2] - p[a + 2]];
        assert.ok(
          Math.hypot(
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0],
          ) > 0.001,
        );
      }
    }
});
