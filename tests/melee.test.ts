import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { v } from "../src/expedition/level.ts";
const setup = (z = 2.2) => {
  const s = new Expedition();
  s.spawned = true;
  s.wave = 99;
  s.addEnemy("brute", v(s.p.x, s.p.y, s.p.z + z));
  const e = s.enemies[0];
  e.state = "stunned";
  e.timer = 10;
  s.combo = 0;
  s.comboWindow = 1;
  s.strike();
  return { s, e };
};
test("the middle strike chooses a close kick or a distant spear sweep", () => {
  assert.equal(setup().s.meleeMove, "kick");
  assert.equal(setup(3.5).s.meleeMove, "sweep");
  const { s } = setup();
  s.resetActions();
  s.grounded = false;
  s.combo = 0;
  s.comboWindow = 1;
  s.strike();
  assert.equal(s.meleeMove, "sweep");
});
test("kick damage arrives at extension once, with stronger forward pushback", () => {
  const { s, e } = setup();
  const hp = e.hp;
  for (let i = 0; i < 13; i++) s.step(1 / 60, { x: 0, z: 0 });
  assert.equal(e.hp, hp);
  assert.equal(s.meleeMove, "kick");
  for (let i = 0; i < 3; i++) s.step(1 / 60, { x: 0, z: 0 });
  assert.equal(e.hp, hp - 42);
  assert.ok(e.knockVelocity && e.knockVelocity.z > 4);
  for (let i = 0; i < 30; i++) s.step(1 / 60, { x: 0, z: 0 });
  assert.equal(e.hp, hp - 42);
  assert.equal(s.events.filter((e) => e.type === "kick").length, 1);
});
test("the kick cannot hit behind, beside, above or beyond the foot's forward range", () => {
  const { s, e } = setup();
  const cases = [v(0, 0, -2), v(2, 0, 0), v(0, 2.1, 1), v(0, 0, 3.1)];
  for (const offset of cases) {
    e.p = v(s.p.x + offset.x, s.p.y + offset.y, s.p.z + offset.z);
    const hp = e.hp;
    s.resolveSwing();
    assert.equal(e.hp, hp);
  }
  e.p = v(s.p.x, s.p.y, s.p.z + 2);
  const hp = e.hp;
  s.resolveSwing();
  assert.equal(e.hp, hp - 42);
});
test("taking damage cancels the pending kick and retry clears its state", () => {
  const { s, e } = setup();
  const hp = e.hp;
  s.hurt(1);
  for (let i = 0; i < 40; i++) s.step(1 / 60, { x: 0, z: 0 });
  assert.equal(e.hp, hp);
  s.retry();
  assert.equal(s.meleeMove, "slash");
  assert.equal(s.swingDelay, -1);
});
