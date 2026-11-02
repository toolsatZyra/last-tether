import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { v } from "../src/expedition/level.ts";
const setup = () => {
  const s = new Expedition();
  s.spawned = true;
  s.wave = 99;
  s.p = { ...s.destination };
  s.enemies = [];
  s.addEnemy("wing", v(s.p.x, s.p.y + 3, s.p.z + 6));
  return { s, e: s.enemies[0] };
};
test("flight and tether recoil cannot bypass the movement collision callback", () => {
  const { s, e } = setup(),
    before = { ...e.p };
  let swept = 0,
    requested = 0;
  s.enemyMotion = (enemy, velocity) => {
    swept++;
    requested = Math.hypot(velocity.x, velocity.y, velocity.z);
    return { p: { ...enemy.p }, grounded: false };
  };
  e.state = "lunge";
  e.timer = 0.5;
  e.dir = v(0, -0.5, -0.866);
  s.updateEnemies(1 / 60);
  assert.equal(swept, 1);
  assert.ok(requested > 16);
  assert.deepEqual(e.p, before);
  s.damage(e, 10, 1.8);
  s.updateEnemies(1 / 60);
  assert.equal(swept, 2);
  assert.ok(requested > 4);
  assert.deepEqual(e.p, before);
});
test("blocked flight produces one visible wall recoil and cannot damage through scenery", () => {
  const { s, e } = setup();
  e.state = "lunge";
  e.timer = 0.5;
  e.dir = v(0, 0, -1);
  e.p = v(s.p.x, s.p.y, s.p.z + 1.5);
  s.enemyMotion = (enemy) => ({ p: { ...enemy.p }, grounded: false });
  s.combatTrace = () => ({
    p: v(e.p.x, e.p.y + 0.7, e.p.z - 0.5),
    normal: v(0, 0, 1),
  });
  s.events = [];
  for (let i = 0; i < 12; i++) s.updateEnemies(1 / 60);
  assert.equal(s.health, 100);
  assert.equal(e.state, "stunned");
  assert.ok(e.reaction);
  assert.equal(s.events.filter((x) => x.type === "body-impact").length, 1);
});
test("a flyer killed without a knockback still falls, settles and credits one defeat", () => {
  const { s, e } = setup();
  const floor = s.p.y,
    start = e.p.y;
  let sweeps = 0;
  s.enemyMotion = (enemy, velocity, dt) => {
    sweeps++;
    const y = Math.max(floor, enemy.p.y + velocity.y * dt);
    return { p: v(enemy.p.x, y, enemy.p.z), grounded: y === floor };
  };
  s.damage(e, 1000);
  for (let i = 0; i < 65; i++) s.updateEnemies(1 / 60);
  assert.ok(sweeps > 5);
  assert.ok(e.p.y < start);
  assert.equal(e.p.y, floor);
  assert.equal(e.corpseMotion, false);
  assert.equal(s.kills, 1);
});
test("recovering flight climbs through collision in bounded steps instead of snapping home", () => {
  const { s, e } = setup();
  e.p.y -= 2.5;
  e.state = "recover";
  e.timer = 0.8;
  let velocityY = 0;
  const y = e.p.y;
  s.enemyMotion = (enemy, velocity, dt) => {
    velocityY = velocity.y;
    return {
      p: v(enemy.p.x, enemy.p.y + velocity.y * dt, enemy.p.z),
      grounded: false,
    };
  };
  s.updateEnemies(1 / 60);
  assert.ok(velocityY > 0 && velocityY <= 4);
  assert.ok(e.p.y > y && e.p.y - y <= 4 / 60 + 0.00001);
});
