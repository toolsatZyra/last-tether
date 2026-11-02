import test from "node:test";
import assert from "node:assert/strict";
import { encounterCapacity } from "../src/expedition/encounter-capacity.ts";
import { CHAPTERS } from "../src/expedition/level.ts";
test("opening reserves overlap a dying first group with the following reinforced encounter", () => {
  const c = encounterCapacity(CHAPTERS[0]);
  assert.equal(c.raptor, 8);
  assert.equal(c.wing, 3);
  assert.equal(c.bomber, 2);
  assert.equal(c.guardian, 0);
});
test("guardian reserves include both phase summons and the next encounter", () => {
  const c = encounterCapacity(CHAPTERS[6]);
  assert.equal(c.guardian, 1);
  assert.ok(c.raptor >= 5);
  assert.ok(c.wing >= 4);
});
test("the escape area retains no unused creature reserve", () => {
  assert.ok(
    Object.values(encounterCapacity(CHAPTERS[7])).every((n) => n === 0),
  );
});
