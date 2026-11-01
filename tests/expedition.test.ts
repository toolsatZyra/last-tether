import test from "node:test";
import assert from "node:assert/strict";
import { Expedition, validSave } from "../src/expedition/engine.ts";
import { v, distance } from "../src/expedition/level.ts";
import { drive } from "./expedition-driver.ts";
const step = (s: Expedition, n: number, input = { x: 0, z: 0 }) => {
  for (let i = 0; i < n; i++) {
    s.step(1 / 60, input);
    s.events = [];
  }
};

test("save validation rejects invalid chapters, unfinished endings and non-finite counters", () => {
  const s = new Expedition().save();
  assert.ok(validSave(s));
  for (const patch of [
    { sector: 8 },
    { beat: -1 },
    { seconds: NaN },
    { finished: true },
    { deaths: -1 },
    { difficulty: "anything" },
  ])
    assert.equal(validSave({ ...s, ...patch }), null);
  assert.deepEqual(validSave({ ...s, unexpected: "discard" })?.secrets, []);
  assert.equal("unexpected" in validSave({ ...s, unexpected: true })!, false);
});
test("movement accelerates, stops promptly and does not gain diagonal speed", () => {
  const straight = new Expedition(),
    diagonal = new Expedition();
  step(straight, 30, { x: 0, z: 1 });
  step(diagonal, 30, { x: 1, z: 1 });
  assert.ok(Math.abs(straight.speed - diagonal.speed) < 0.01);
  assert.ok(straight.speed > 6.5 && straight.speed < 7);
  step(straight, 15);
  assert.ok(straight.speed < 0.05);
});
test("jump returns to the floor without consuming a healing flask", () => {
  const s = new Expedition();
  s.step(1 / 60, { x: 0, z: 0, jump: true });
  assert.ok(!s.grounded);
  step(s, 90);
  assert.ok(s.grounded);
  assert.equal(s.flasks, 3);
  assert.ok(Math.abs(s.p.y - 8) < 0.05);
});
test("healing consumes a flask only when healing is possible", () => {
  const s = new Expedition();
  s.step(1 / 60, { x: 0, z: 0, heal: true });
  assert.equal(s.flasks, 3);
  s.health = 20;
  s.step(1 / 60, { x: 0, z: 0, heal: true });
  assert.equal(s.health, 75);
  assert.equal(s.flasks, 2);
});
test("assisted grapple clears an authored gap and lands on the marked terrace", () => {
  const s = new Expedition(null, "daily"),
    target = s.anchor!;
  assert.ok(target);
  s.step(1 / 60, { x: 0, z: 0, grapple: true });
  assert.ok(s.grapple);
  step(s, 220);
  assert.equal(s.grapple, null);
  assert.ok(distance(s.p, target) < 0.1);
  assert.ok(s.grounded);
});
test("a hunt burst cannot refill itself from the targets it hits", () => {
  const s = new Expedition(null, "daily");
  s.hunt = 100;
  for (let i = 0; i < 8; i++) s.addEnemy("raptor", v(i - 4, s.p.y, s.p.z + 4));
  s.step(1 / 60, { x: 0, z: 0, burst: true });
  assert.equal(s.hunt, 0);
  assert.equal(s.living.length, 0);
});
test("an uncleared reinforcement wave keeps the exit locked", () => {
  const s = new Expedition();
  s.loadSector(1, 0);
  s.spawn();
  s.enemies.forEach((e) => (e.hp = 0));
  assert.equal(s.clear, false);
  step(s, 1);
  assert.equal(s.wave, 1);
  assert.ok(s.living.length > 0);
  s.enemies.forEach((e) => (e.hp = 0));
  assert.ok(s.clear);
});
test("a linked wheel turns its neighbour and cannot complete with a single wheel", () => {
  const s = new Expedition();
  s.loadSector(2, 1);
  s.spawned = true;
  s.wave = 99;
  s.p = s.dial(0);
  s.interact();
  assert.deepEqual(s.runes, [1, 1, 0]);
  assert.equal(s.beat, 1);
});
test("guardian armour resists attacks until a charge hits a support and tether tears it loose", () => {
  const s = new Expedition();
  s.loadSector(6, 1);
  s.spawn();
  const boss = s.living[0];
  const old = boss.hp;
  s.damage(boss, 100);
  assert.equal(old - boss.hp, 8);
  const pillar = s.pillars()[0];
  boss.p = { ...pillar };
  boss.dir = v(0, 0, 1);
  boss.state = "charge";
  boss.timer = 1;
  s.guardian(boss, 1 / 60);
  assert.equal(boss.state, "stunned");
  s.p = v(pillar.x + 5, pillar.y, pillar.z);
  s.useGrapple();
  assert.equal(boss.armour, false);
  assert.ok(boss.exposed > 0);
});
test("fall recovery preserves a secured checkpoint and resets the encounter", () => {
  const s = new Expedition();
  s.loadSector(1, 2);
  const checkpoint = { ...s.checkpoint };
  s.p.y = -30;
  s.step(1 / 60, { x: 0, z: 0 });
  assert.equal(s.deaths, 1);
  step(s, 90);
  assert.equal(s.beat, 2);
  assert.ok(distance(s.p, checkpoint) < 0.1);
  assert.equal(s.health, 100);
});
test("a full input-only route can solve every objective, boss and escape", () => {
  const s = new Expedition();
  const visited = new Set<number>();
  for (let tick = 0; tick < 60 * 1200 && !s.finished; tick++) {
    s.step(1 / 60, drive(s, tick));
    s.events = [];
    visited.add(s.sector);
  }
  assert.ok(
    s.finished,
    JSON.stringify({ sector: s.sector, beat: s.beat, p: s.p }),
  );
  assert.equal(visited.size, 8);
  assert.ok(s.kills >= 180);
  assert.equal(validSave(s.save())?.finished, true);
});
