import test from "node:test";
import assert from "node:assert/strict";
import { Expedition } from "../src/expedition/engine.ts";
import { drive } from "./expedition-driver.ts";
test("the input driver joins the quarry bridge from off-centre arena positions without cutting over empty space", () => {
  for (const x of [20, 30, 38, 48, 56]) {
    const s = new Expedition();
    s.loadSector(4, 2);
    s.p = { x, y: 16, z: 187 };
    s.grounded = true;
    for (let tick = 0; tick < 1200 && s.deaths === 0; tick++) {
      s.step(1 / 60, drive(s, tick));
      s.events = [];
    }
    assert.equal(s.deaths, 0, "starting x=" + x);
    assert.ok(s.p.z > 232, "crossing reached from x=" + x);
  }
});
