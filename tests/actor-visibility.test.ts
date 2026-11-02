import test from "node:test";
import assert from "node:assert/strict";
import { BoundingInfo, Matrix, Vector3 } from "@babylonjs/core";
import {
  actorSight,
  actorOpacity,
} from "../src/expedition/actor-visibility.ts";
const box = (lo: number[], hi: number[]) =>
  new BoundingInfo(Vector3.FromArray(lo), Vector3.FromArray(hi)).boundingBox;
test("only bodies between the camera and player fade, including wide wings and camera overlap", () => {
  const blocked = actorSight(new Vector3(0, 2, 0), new Vector3(0, 2, 10));
  assert.equal(blocked(box([-1, 0, 4], [1, 4, 6])), true);
  assert.equal(blocked(box([-1, 0, 11], [1, 4, 13])), false);
  assert.equal(blocked(box([-1, 0, -4], [1, 4, -2])), false);
  assert.equal(blocked(box([2, 0, 4], [4, 4, 6])), false);
  assert.equal(blocked(box([-0.5, 0, 4], [8, 4, 6])), true);
  assert.equal(blocked(box([-1, 0, -1], [1, 4, 1])), true);
  assert.equal(blocked(box([-1, 5, 4], [1, 7, 6])), false);
  const rotated = new BoundingInfo(
    new Vector3(-4, -1, -0.5),
    new Vector3(4, 1, 0.5),
  );
  rotated.update(
    Matrix.RotationY(Math.PI / 2).multiply(Matrix.Translation(0, 2, 5)),
  );
  assert.equal(blocked(rotated.boundingBox), true);
  assert.equal(
    actorSight(Vector3.Zero(), Vector3.Zero())(box([-1, -1, -1], [1, 1, 1])),
    false,
  );
});
test("occlusion fades smoothly and gives the same result at different frame rates", () => {
  const step = (fps: number, blocked: boolean, start: number) => {
    let a = start;
    for (let i = 0; i < fps; i++) a = actorOpacity(a, blocked, 1 / fps);
    return a;
  };
  assert.ok(actorOpacity(1, true, 1 / 60) > 0.22);
  assert.ok(actorOpacity(1, true, 1 / 60) < 1);
  assert.ok(Math.abs(step(30, true, 1) - step(144, true, 1)) < 1e-12);
  assert.ok(step(60, true, 1) < 0.221);
  assert.ok(step(60, false, 0.22) > 0.999);
  assert.equal(actorOpacity(1, true, 0), 0.22);
  assert.equal(actorOpacity(0.22, false, 0), 1);
});
