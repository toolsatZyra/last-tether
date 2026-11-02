import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTERS, floorAt } from "../src/expedition/level.ts";
import { landscapeHeight } from "../src/expedition/landscape.ts";
test("sculpted landscapes leave every sampled walkable surface and crossing clear", () => {
  let sampled = 0;
  for (let sector = 0; sector < CHAPTERS.length; sector++) {
    const ch = CHAPTERS[sector];
    for (let x = -100; x <= 100; x += 3)
      for (let z = -20; z <= 440; z += 3) {
        const y = floorAt(ch, x, z);
        if (y === null) continue;
        const terrain = landscapeHeight(ch, sector, x, z);
        assert.ok(
          Number.isFinite(terrain) && terrain <= y - 8,
          JSON.stringify({ sector, x, z, y, terrain }),
        );
        sampled++;
      }
    for (const side of [-1, 1])
      for (let z = -200; z <= 700; z += 31) {
        const y = landscapeHeight(ch, sector, side * 180, z);
        assert.ok(Number.isFinite(y) && y > 20 && y < 250);
      }
  }
  assert.ok(sampled > 10000);
});
