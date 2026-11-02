import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { v } from "../src/expedition/level.ts";
const setup = () => {
  const s = new Expedition();
  s.spawned = true;
  s.wave = 99;
  s.p = { ...s.destination };
  s.events = [];
  return s;
};
test("incoming force is directional, collision-swept and cancelled by recovery", () => {
  const s = setup(),
    start = { ...s.p };
  let velocity = v();
  s.motion = (p, vel) => {
    velocity = { ...vel };
    return { p: { ...p }, grounded: true };
  };
  s.hurt(25, v(start.x - 3, start.y, start.z));
  assert.deepEqual(s.p, start);
  assert.ok(s.recoil.x > 5);
  assert.equal(s.recoil.z, 0);
  const health = s.health;
  s.hurt(25, v(start.x + 3, start.y, start.z));
  assert.equal(s.health, health);
  for (let i = 0; i < 10; i++) s.step(1 / 60, { x: 0, z: 0 });
  assert.ok(velocity.x > 0);
  assert.deepEqual(s.p, start);
  s.retry();
  assert.deepEqual(s.recoil, v());
  assert.equal(s.reaction, undefined);
});
test("weight changes recoil and only committed heavy strikes interrupt a brute", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  s.addEnemy("brute", v(s.p.x, s.p.y, s.p.z + 2));
  const [light, heavy] = s.enemies;
  heavy.state = "windup";
  heavy.timer = 1;
  s.damage(light, 34, 0.4);
  s.damage(heavy, 34, 0.4);
  assert.ok(light.knockVelocity!.z > heavy.knockVelocity!.z * 3);
  assert.equal(heavy.state, "windup");
  assert.equal(light.state, "stunned");
  s.damage(heavy, 42, 1.1);
  assert.equal(heavy.state, "stunned");
  assert.ok(heavy.timer >= 0.2);
});
test("lethal force continues through the collision callback and credits exactly one defeat", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  const e = s.enemies[0];
  e.hp = 1;
  let swept = 0;
  s.enemyMotion = (enemy, velocity, dt) => {
    swept++;
    return {
      p: v(enemy.p.x + velocity.x * dt, enemy.p.y, enemy.p.z + velocity.z * dt),
      grounded: true,
    };
  };
  const start = e.p.z;
  s.damage(e, 72, 1.8);
  assert.equal(e.p.z, start);
  for (let i = 0; i < 30; i++) s.updateEnemies(1 / 60);
  assert.ok(swept > 10);
  assert.ok(e.p.z > start + 1);
  assert.equal(s.kills, 1);
  assert.equal(e.hp, 0);
  assert.equal(e.state, "death");
  s.damage(e, 72, 1.8);
  assert.equal(s.kills, 1);
});
test("a solid contact blocks weapon damage while preserving the clang cue", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  const e = s.enemies[0];
  s.combatTrace = () => ({
    p: v(s.p.x, s.p.y + 1, s.p.z + 1),
    normal: v(0, 0, -1),
  });
  s.resolveSwing();
  assert.equal(e.hp, e.max);
  assert.ok(
    s.events.some((e) => e.type === "weapon-block" && e.impact?.blocked),
  );
  s.combatTrace = () => null;
  s.resolveSwing();
  assert.equal(e.hp, e.max - 34);
});
test("projectile recoil follows projectile travel rather than the player's later position", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  const e = s.enemies[0];
  s.p.x += 20;
  s.shots.push({
    id: 99,
    p: v(e.p.x - 1, e.p.y + 1, e.p.z),
    dir: v(1, 0, 0),
    speed: 10,
    life: 1,
    friendly: true,
    radius: 0.5,
    damage: 48,
    trail: [],
  });
  s.updateShots(1 / 60);
  assert.ok(e.knockVelocity!.x > 0);
  assert.equal(e.knockVelocity!.z, 0);
});
test("wall arrest consumes recoil once without repeatedly stunning or emitting impacts", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  const e = s.enemies[0];
  s.enemyMotion = (enemy) => ({ p: { ...enemy.p }, grounded: true });
  s.damage(e, 34, 1.8);
  for (let i = 0; i < 20; i++) s.updateEnemies(1 / 60);
  assert.equal(e.knockVelocity, undefined);
  assert.equal(s.events.filter((e) => e.type === "body-impact").length, 1);
});

test("projectiles stop at solid scenery before applying enemy damage", () => {
  const s = setup();
  s.addEnemy("raptor", v(s.p.x, s.p.y, s.p.z + 2));
  const e = s.enemies[0];
  s.shots.push({
    id: 99,
    p: v(s.p.x, s.p.y + 1, s.p.z),
    dir: v(0, 0, 1),
    speed: 34,
    life: 1,
    friendly: true,
    radius: 1,
    damage: 48,
    trail: [],
  });
  s.combatTrace = () => ({
    p: v(s.p.x, s.p.y + 1, s.p.z + 0.3),
    normal: v(0, 0, -1),
  });
  s.updateShots(1 / 60);
  assert.equal(e.hp, e.max);
  assert.equal(s.shots.length, 0);
  assert.ok(s.events.some((e) => e.type === "weapon-block"));
});

test("a quick dodge pressed during impact is retained until the short recoil commitment ends", () => {
  const s = setup();
  s.hurt(25, v(s.p.x, s.p.y, s.p.z + 3));
  s.step(1 / 60, { x: 1, z: 0, dodge: true });
  assert.equal(s.dodge, 0);
  let dodged = false,
    at = 0;
  for (let i = 0; i < 30; i++) {
    s.step(1 / 60, { x: 1, z: 0 });
    if (s.dodge > 0) {
      dodged = true;
      at = s.time;
      break;
    }
  }
  assert.ok(dodged);
  assert.ok(at >= 0.12 && at < 0.24);
  assert.equal(s.hurtTime, 0);
  assert.equal(s.dodgeBuffer, 0);
  assert.equal(s.reaction, undefined);
  assert.deepEqual(s.recoil, v());
});
