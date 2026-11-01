import test from "node:test";
import assert from "node:assert/strict";
import { validRecords, validPreferences } from "../src/expedition/profile.ts";

test("personal records reject injected dates and invalid ghost positions", () => {
  const run = {
    date: "2026-11-02",
    seconds: 120,
    deaths: 0,
    ghost: [{ t: 1, x: 0, y: 20, z: 0, yaw: 0, sector: 3 }],
  };
  assert.equal(validRecords([run]).length, 1);
  assert.equal(
    validRecords([{ ...run, date: "<img onerror=alert(1)>" }]).length,
    0,
  );
  assert.equal(
    validRecords([{ ...run, ghost: [{ ...run.ghost[0], x: NaN }] }]).length,
    0,
  );
  assert.equal(
    validRecords([{ ...run, ghost: [{ ...run.ghost[0], t: 4 }, run.ghost[0]] }])
      .length,
    0,
  );
});

test("settings recover safely from damaged storage", () => {
  assert.equal(validPreferences(null).quality, "balanced");
  assert.equal(
    validPreferences({ quality: "ultra", difficulty: "hunter" }).difficulty,
    "hunter",
  );
  assert.equal(validPreferences({ quality: "ultra" }).quality, "balanced");
});
