import { drive } from "./expedition-driver.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { CHAPTERS, floorAt } from "../src/expedition/level.ts";
import {
  pressureGates,
  pressurePhase,
  insidePressureLane,
  PRESSURE_PERIOD,
} from "../src/expedition/pressure.ts";
const gates = pressureGates(CHAPTERS[5]);
const inLane = (index: number) => {
  const gate = gates[index];
  return {
    x: gate.p.x + gate.across.x * gate.offset,
    y: gate.p.y,
    z: gate.p.z + gate.across.z * gate.offset,
  };
};
test("pressure banks warn before venting and retain a clear lane on the bridge", () => {
  for (const gate of gates) {
    assert.equal(
      pressurePhase(gate.index * 0.8 + 0.2, gate.index).warning,
      true,
    );
    assert.equal(pressurePhase(gate.index * 0.8 + 1, gate.index).active, true);
    assert.equal(
      pressurePhase(gate.index * 0.8 + 2.5, gate.index).active,
      false,
    );
    const original = pressurePhase(1, gate.index),
      repeated = pressurePhase(1 + PRESSURE_PERIOD * 10, gate.index);
    assert.equal(original.active, repeated.active);
    assert.equal(original.warning, repeated.warning);
    assert.ok(Math.abs(original.phase - repeated.phase) < 1e-10);
    const safe = {
      x: gate.p.x - gate.across.x * Math.sign(gate.offset) * 3.4,
      y: gate.p.y,
      z: gate.p.z - gate.across.z * Math.sign(gate.offset) * 3.4,
    };
    assert.ok(floorAt(CHAPTERS[5], safe.x, safe.z) !== null);
    assert.equal(insidePressureLane(gate, safe), false);
    assert.equal(insidePressureLane(gate, inLane(gate.index)), true);
    assert.equal(
      insidePressureLane(gate, { ...inLane(gate.index), y: gate.p.y + 4 }),
      false,
    );
  }
});
test("only a live steam lane hurts, and dodge protection prevents a burst hit", () => {
  const s = new Expedition();
  s.loadSector(5, 1);
  s.p = inLane(0);
  s.time = 0.2;
  s.invuln = 0;
  s.updateHazards(1 / 60);
  assert.equal(s.health, 100);
  s.time = 1;
  s.updateHazards(1 / 60);
  assert.equal(s.health, 83.2);
  s.updateHazards(1 / 60);
  assert.equal(s.health, 83.2);
  const d = new Expedition();
  d.loadSector(5, 1);
  d.p = inLane(0);
  d.time = 1;
  d.step(1 / 60, { x: 0, z: 1, dodge: true });
  assert.ok(d.dodge > 0);
  assert.equal(d.health, 100);
});
test("the far valve shuts down the pressure sequence and the secured save keeps it off", () => {
  const s = new Expedition();
  s.loadSector(5, 1);
  s.spawned = true;
  s.wave = 99;
  s.p = { ...s.destination };
  s.interact();
  assert.equal(s.beat, 2);
  const resumed = new Expedition(s.save());
  assert.equal(resumed.beat, 2);
  resumed.p = inLane(0);
  resumed.time = 1;
  resumed.invuln = 0;
  resumed.updateHazards(1 / 60);
  assert.equal(resumed.health, 100);
});

test("the clear-lane route crosses every bank without damage at different starting phases", () => {
  for (const phase of [0, 0.8, 1.6, 2.4]) {
    const s = new Expedition();
    s.loadSector(5, 1);
    s.time = phase;
    let minimum = 100;
    for (let tick = 0; tick < 1200 && s.p.z < 111; tick++) {
      s.step(1 / 60, drive(s, tick));
      minimum = Math.min(minimum, s.health);
      s.events = [];
    }
    assert.ok(s.p.z >= 111);
    assert.equal(s.deaths, 0);
    assert.equal(minimum, 100, "starting phase " + phase);
  }
});
