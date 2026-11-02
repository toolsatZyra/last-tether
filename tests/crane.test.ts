import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { quarryTrap, CRANE_IMPACT } from "../src/expedition/crane.ts";
const setup = () => {
  const s = new Expedition();
  s.loadSector(4, 0);
  s.events = [];
  s.podUsed.add(1);
  return s;
};
test("crane release requires its nearby grounded lever and is one-use", () => {
  const s = setup(),
    t = quarryTrap(s.chapter);
  s.interact();
  assert.equal(s.craneElapsed, -1);
  s.p = { ...t.lever, y: t.lever.y + 3 };
  s.interact();
  assert.equal(s.craneElapsed, -1);
  s.p = { ...t.lever };
  s.grounded = false;
  s.interact();
  assert.equal(s.craneElapsed, -1);
  s.grounded = true;
  s.interact();
  assert.equal(s.craneElapsed, 0);
  s.updateCrane(0.2);
  s.interact();
  assert.equal(s.craneElapsed, 0.2);
  assert.equal(s.events.filter((e) => e.type === "crane-release").length, 1);
  s.updateCrane(CRANE_IMPACT);
  s.interact();
  assert.equal(s.canReleaseCrane, false);
});
test("fall warning precedes one impact and only creatures inside its height and radius are hit", () => {
  const s = setup(),
    t = quarryTrap(s.chapter);
  s.p = { ...t.lever };
  s.addEnemy("brute", { ...t.load });
  s.addEnemy("raptor", { ...t.load, x: t.load.x + 3 });
  s.addEnemy("raptor", { ...t.load, x: t.load.x + 7 });
  s.addEnemy("wing", { ...t.load, y: t.load.y + 5 });
  s.interact();
  s.updateCrane(CRANE_IMPACT - 0.001);
  assert.equal(s.kills, 0);
  assert.equal(s.enemies[0].hp, 340);
  s.updateCrane(0.002);
  assert.equal(s.kills, 2);
  assert.equal(s.enemies[2].hp, 110);
  assert.equal(s.enemies[3].hp, 95);
  assert.equal(s.health, 100);
  s.updateCrane(20);
  assert.equal(s.kills, 2);
  assert.equal(s.events.filter((e) => e.type === "crane-impact").length, 1);
});
test("the falling load hurts a player underneath but preserves dodge protection and high jumps", () => {
  for (const [protectedBy, expected] of [
    ["none", 75.5],
    ["dodge", 100],
    ["height", 100],
  ] as const) {
    const s = setup(),
      t = quarryTrap(s.chapter);
    s.p = { ...t.lever };
    s.interact();
    s.p = { ...t.load };
    if (protectedBy === "dodge") s.invuln = 0.2;
    if (protectedBy === "height") s.p.y += 4;
    s.updateCrane(CRANE_IMPACT);
    assert.equal(s.health, expected, protectedBy);
  }
});
test("retry rearms the unsecured yard while later checkpoints cannot farm the crane", () => {
  const s = setup(),
    t = quarryTrap(s.chapter);
  s.p = { ...t.lever };
  s.interact();
  s.updateCrane(0.6);
  s.retry();
  assert.equal(s.craneElapsed, -1);
  assert.equal(s.craneSpent, false);
  s.p = { ...t.lever };
  s.interact();
  s.updateCrane(CRANE_IMPACT);
  s.finishBeat();
  s.retry();
  assert.equal(s.craneSpent, true);
  const loaded = new Expedition(s.save());
  assert.equal(loaded.sector, 4);
  assert.equal(loaded.beat, 1);
  assert.equal(loaded.craneSpent, true);
  assert.equal(loaded.canReleaseCrane, false);
  loaded.loadSector(0, 0);
  loaded.p = { ...quarryTrap(loaded.chapter).lever };
  loaded.interact();
  assert.equal(loaded.craneElapsed, -1);
});

test("a live charge under the load chains into the surrounding pack", () => {
  const s = setup(),
    t = quarryTrap(s.chapter);
  s.podUsed.clear();
  s.p = { ...t.lever };
  s.addEnemy("raptor", { ...t.load, x: t.load.x + 9 });
  s.interact();
  s.updateCrane(CRANE_IMPACT);
  assert.equal(s.kills, 1);
  assert.ok(s.podUsed.has(1));
  assert.equal(s.events.filter((e) => e.type === "explode").length, 1);
});
