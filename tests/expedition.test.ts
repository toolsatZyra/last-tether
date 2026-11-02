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
  for (let frame = 0; frame < 90 && !s.grounded; frame++) step(s, 1);
  assert.ok(s.landTime > 0);
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
  // Inspect the landing itself; later enemy attacks can now physically displace Kavi.
  for (let i = 0; i < 220 && s.grapple; i++) step(s, 1);
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

function meleeEncounter() {
  const s = new Expedition();
  s.spawned = true;
  s.wave = 99;
  s.addEnemy("brute", v(s.p.x, s.p.y, s.p.z + 2.5));
  const enemy = s.enemies[0];
  enemy.state = "stunned";
  enemy.timer = 10;
  return { s, enemy };
}
test("melee damage arrives at contact once, and dodge cancels an unfinished swing", () => {
  const { s, enemy } = meleeEncounter();
  const hp = enemy.hp;
  s.step(1 / 60, { x: 0, z: 0, attack: true });
  assert.equal(enemy.hp, hp);
  step(s, 5);
  assert.equal(enemy.hp, hp);
  step(s, 4);
  assert.equal(enemy.hp, hp - 34);
  step(s, 25);
  assert.equal(enemy.hp, hp - 34);
  const cancel = meleeEncounter();
  cancel.s.step(1 / 60, { x: 0, z: 0, attack: true });
  cancel.s.step(1 / 60, { x: 1, z: 0, dodge: true });
  step(cancel.s, 30);
  assert.equal(cancel.enemy.hp, cancel.enemy.max);
});
test("impact pause holds motion but retains a quick jump and heal press", () => {
  const { s } = meleeEncounter();
  s.hitstop = 0.035;
  s.health = 20;
  const before = { ...s.p };
  const time = s.seconds;
  s.step(1 / 60, { x: 1, z: 0, jump: true, heal: true });
  assert.deepEqual(s.p, before);
  assert.equal(s.flasks, 3);
  assert.ok(s.seconds > time);
  step(s, 3);
  assert.equal(s.flasks, 2);
  assert.equal(s.health, 75);
  assert.ok(!s.grounded);
  step(s, 3);
  assert.equal(s.flasks, 2);
});
test("a late attack press carries through recovery and melee takes priority over throwing", () => {
  const { s } = meleeEncounter();
  s.loadSector(1, 0);
  s.spawned = true;
  s.wave = 99;
  s.step(1 / 60, { x: 0, z: 0, attack: true, throw: true });
  assert.equal(s.throwTime, 0);
  assert.ok(s.attack > 0);
  while (s.attackCooldown > 0.08) s.step(1 / 60, { x: 0, z: 0 });
  s.step(1 / 60, { x: 0, z: 0, attack: true });
  step(s, 6);
  assert.equal(s.combo, 1);
  assert.ok(s.attack > 0.25);
  s.retry();
  assert.equal(s.swingDelay, -1);
  assert.equal(s.attackBuffer, 0);
  assert.equal(s.hitstop, 0);
});

test("the melee closing step moves through collision, never by teleporting", () => {
  const { s, enemy } = meleeEncounter();
  enemy.p.z = s.p.z + 3.4;
  const origin = { ...s.p };
  let sweeps = 0;
  s.motion = (p, velocity, dt) => {
    sweeps++;
    assert.ok(dt > 0);
    return { p: { ...p }, grounded: true };
  };
  s.step(1 / 60, { x: 0, z: 0, attack: true });
  step(s, 12);
  assert.ok(sweeps > 1);
  assert.deepEqual(s.p, origin);
  assert.equal(enemy.hp, enemy.max);
  const free = meleeEncounter();
  free.enemy.p.z = free.s.p.z + 3.4;
  free.s.step(1 / 60, { x: 0, z: 0, attack: true });
  step(free.s, 12);
  assert.ok(free.s.p.z > origin.z + 0.2 && free.s.p.z < origin.z + 1);
  assert.ok(free.enemy.hp < free.enemy.max);
});

test("guardian commits its facing to the charge instead of tracking a dodging player", () => {
  const s = new Expedition();
  s.loadSector(6, 1);
  s.addEnemy("guardian", { ...s.destination });
  const e = s.enemies.at(-1)!;
  e.state = "idle";
  e.timer = 0;
  s.p = { x: e.p.x + 10, y: e.p.y, z: e.p.z };
  s.updateEnemies(1 / 60);
  const yaw = e.yaw;
  e.state = "charge";
  e.timer = 1;
  s.p = { x: e.p.x, y: e.p.y, z: e.p.z + 10 };
  s.updateEnemies(1 / 60);
  assert.equal(e.yaw, yaw);
  assert.ok(e.dir.x > 0.99);
  e.armour = false;
  s.damage(e, 9999);
  assert.equal(e.dead, 2.4);
});

test("raptor tells and lunges retain the same direction when the player dodges sideways", () => {
  const s = new Expedition();
  s.addEnemy("raptor", { ...s.destination });
  const e = s.enemies.at(-1)!;
  e.timer = 0;
  s.p = { x: e.p.x, y: e.p.y, z: e.p.z + 3 };
  s.updateEnemies(1 / 60);
  assert.equal(e.state, "windup");
  const yaw = e.yaw,
    origin = { ...e.p };
  s.p.x += 10;
  for (let i = 0; i < 40; i++) s.updateEnemies(1 / 60);
  assert.equal(e.state, "lunge");
  assert.equal(e.yaw, yaw);
  assert.equal(e.p.x, origin.x);
  assert.ok(e.p.z > origin.z);
  assert.equal(s.health, 100);
});

test("flyer follows during anticipation but commits its dive once released", () => {
  const s = new Expedition();
  s.addEnemy("wing", { ...s.destination });
  const e = s.enemies.at(-1)!;
  e.state = "windup";
  e.timer = 0.02;
  s.p = { x: e.p.x + 8, y: e.p.y, z: e.p.z };
  s.updateEnemies(1 / 60);
  assert.ok(Math.abs(e.yaw - Math.PI / 2) < 1e-8);
  s.updateEnemies(1 / 60);
  assert.equal(e.state, "lunge");
  const yaw = e.yaw,
    origin = { ...e.p };
  s.p = { x: e.p.x, y: e.p.y, z: e.p.z + 8 };
  s.updateEnemies(1 / 60);
  assert.equal(e.yaw, yaw);
  assert.equal(e.p.z, origin.z);
  assert.ok(e.p.x > origin.x);
});

test("a missed edge lunge falls and credits one defeat instead of hovering or snapping home", () => {
  const s = new Expedition(),
    c = s.destination;
  s.p = { x: c.x + 22, y: c.y, z: c.z };
  s.addEnemy("raptor", { x: c.x + 21, y: c.y, z: c.z });
  const e = s.enemies[0];
  e.timer = 0;
  let falling = false;
  for (let i = 0; i < 240; i++) {
    s.updateEnemies(1 / 60);
    falling ||= e.state === "falling";
    if (e.state === "falling") assert.notEqual(s.target, e);
  }
  assert.ok(falling);
  assert.equal(e.hp, 0);
  assert.equal(s.kills, 1);
  assert.ok(e.p.y < c.y - 18);
  const end = { ...e.p };
  for (let i = 0; i < 120; i++) s.updateEnemies(1 / 60);
  assert.deepEqual(e.p, end);
  assert.equal(s.kills, 1);
  assert.equal(s.events.filter((e) => e.type === "environmentkill").length, 1);
});

test("ground knockback is offered to collision as velocity rather than teleporting the creature", () => {
  const s = new Expedition(),
    c = s.destination;
  s.p = { x: c.x, y: c.y, z: c.z - 4 };
  s.addEnemy("raptor", { ...c });
  const e = s.enemies[0],
    start = { ...e.p };
  let swept = 0;
  s.enemyMotion = (enemy, velocity, dt) => {
    swept++;
    assert.ok(velocity.z > 0);
    assert.equal(dt, 1 / 60);
    return { p: { ...enemy.p }, grounded: true };
  };
  s.damage(e, 1, 2);
  assert.deepEqual(e.p, start);
  s.updateEnemies(1 / 60);
  assert.equal(swept, 1);
  assert.deepEqual(e.p, start);
});

test("a creature that lands on a lower surface recovers without being counted as defeated", () => {
  const s = new Expedition(),
    c = s.destination;
  s.addEnemy("raptor", { x: c.x, y: c.y + 2, z: c.z });
  const e = s.enemies[0];
  e.state = "falling";
  e.fallVelocity = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < 60 && e.state === "falling"; i++)
    s.moveGroundEnemy(e, e.fallVelocity!, 1 / 60);
  assert.equal(e.state, "recover");
  assert.equal(e.p.y, c.y);
  assert.equal(e.verticalSpeed, 0);
  assert.equal(s.kills, 0);
});

test("combat tether pulls over time and respects the same collision sweep as locomotion", () => {
  const s = new Expedition(),
    c = s.destination;
  s.p = { ...c };
  s.addEnemy("raptor", { ...c, z: c.z + 10 });
  const e = s.enemies[0],
    start = { ...e.p };
  s.useGrapple();
  assert.deepEqual(e.p, start);
  assert.equal(e.hp, e.max - 22);
  for (let i = 0; i < 20; i++) s.updateEnemies(1 / 60);
  assert.ok(Math.abs(e.p.z - c.z - 3) < 0.1);
  assert.equal(e.pull, undefined);
  const blocked = new Expedition();
  blocked.p = { ...blocked.destination };
  blocked.addEnemy("raptor", { ...blocked.p, z: blocked.p.z + 10 });
  const b = blocked.enemies[0],
    origin = { ...b.p };
  let sweeps = 0;
  blocked.enemyMotion = (enemy, velocity, dt) => {
    sweeps++;
    assert.ok(velocity.z <= 0);
    return { p: { ...enemy.p }, grounded: true };
  };
  blocked.useGrapple();
  for (let i = 0; i < 30; i++) blocked.updateEnemies(1 / 60);
  assert.ok(sweeps >= 18);
  assert.deepEqual(b.p, origin);
  assert.equal(b.pull, undefined);
});

test("a fatal tether hit cannot revive or keep dragging a defeated creature", () => {
  const s = new Expedition(),
    c = s.destination;
  s.p = { ...c };
  s.addEnemy("raptor", { ...c, z: c.z + 10 });
  const e = s.enemies[0];
  e.hp = 20;
  s.useGrapple();
  assert.equal(e.hp, 0);
  assert.equal(e.state, "death");
  assert.equal(e.pull, undefined);
  assert.equal(s.kills, 1);
});

test("knockback momentum is transferred into a fall once", () => {
  const s = new Expedition(),
    c = s.destination;
  s.addEnemy("raptor", { ...c, x: c.x + 25 });
  const e = s.enemies[0];
  e.verticalSpeed = -4;
  e.knockVelocity = v(12, 0, 0);
  const start = e.p.x;
  s.moveGroundEnemy(e, v(), 1 / 60);
  const first = e.p.x - start;
  assert.equal(e.state, "falling");
  assert.equal(e.knockVelocity, undefined);
  s.moveGroundEnemy(e, e.fallVelocity!, 1 / 60);
  assert.ok(Math.abs(e.p.x - start - first * 2) < 1e-8);
});
