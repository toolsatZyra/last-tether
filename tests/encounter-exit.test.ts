import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import {
  EXIT_GATE_OFFSET,
  EXIT_GATE_CLEARANCE,
} from "../src/expedition/level.ts";
test("an uncleared encounter stops the player before the gate and clearing it releases movement", () => {
  const s = new Expedition(),
    p = s.destination;
  s.p = { x: p.x, y: p.y, z: p.z + 20 };
  s.spawned = true;
  s.addEnemy("raptor", { ...p });
  s.enemies[0].state = "stunned";
  s.enemies[0].timer = 100;
  s.invuln = 100;
  for (let i = 0; i < 60; i++) s.step(1 / 60, { x: 0, z: 1 });
  const stop = p.z + EXIT_GATE_OFFSET - EXIT_GATE_CLEARANCE;
  assert.ok(Math.abs(s.p.z - stop) < 1e-8);
  assert.ok(p.z + EXIT_GATE_OFFSET - s.p.z > 0.65);
  s.enemies[0].hp = 0;
  for (let i = 0; i < 12; i++) s.step(1 / 60, { x: 0, z: 1 });
  assert.ok(s.p.z > stop + 0.5);
});
