import { pressureGates } from "../src/expedition/pressure.ts";
import { Expedition, type Input } from "../src/expedition/engine.ts";
import { distance, v } from "../src/expedition/level.ts";
export function drive(s: Expedition, tick: number): Input {
  const i: Input = {
    x: 0,
    z: 0,
    heal: s.health < 48 && s.flasks > 0,
    burst: s.hunt >= 100 && s.living.length > 1,
  };
  if (s.death > 0 || s.finished || s.grapple) return i;
  let target = { ...s.destination };
  const enemies = s.living.sort(
    (a, b) => distance(a.p, s.p) - distance(b.p, s.p),
  );
  const e = enemies[0];
  if (e && distance(s.p, e.p) < 32 && distance(s.p, s.destination) < 23) {
    target = { ...e.p };
    i.throw = true;
    i.attack = distance(s.p, e.p) < 4.1;
    i.grapple = !s.anchor && distance(s.p, e.p) > 6 && e.kind !== "guardian";
    if (e.kind === "guardian" && e.armour) {
      const pillars = s.pillars();
      const pillar = pillars.sort(
        (a, b) => distance(a, s.p) - distance(b, s.p),
      )[0];
      const d = distance(e.p, pillar) || 1;
      target = v(
        pillar.x + ((pillar.x - e.p.x) / d) * 5,
        pillar.y,
        pillar.z + ((pillar.z - e.p.z) / d) * 5,
      );
      i.attack = false;
      i.throw = false;
      if (e.state === "stunned") {
        i.grapple = true;
        target = { ...e.p };
      }
      if (e.state === "charge" || (e.state === "windup" && e.timer < 0.65)) {
        target = v(s.p.x + e.dir.z * 8, s.p.y, s.p.z - e.dir.x * 8);
        i.dodge = e.state === "charge";
      }
    } else if (e.state === "windup" && e.timer < 0.25) {
      i.dodge = true;
      const dx = e.p.x - s.p.x,
        dz = e.p.z - s.p.z;
      target = v(s.p.x - dz, s.p.y, s.p.z + dx);
    }
    i.jump =
      s.rings.some(
        (r) => r.damage > 0 && Math.abs(distance(r.p, s.p) - r.r) < 5,
      ) && s.grounded;
  } else {
    const point = s.chapter.points.find(
      (p) => p.z > s.p.z + 4 && p.z < s.destination.z,
    );
    if (point) target = { ...point };
    if (s.objective.hazard === "pressure") {
      const gates = pressureGates(s.chapter);
      const forward = gates[0].forward;
      const waypoints = gates.flatMap((gate) =>
        [-2, 2].map((along) => ({
          x:
            gate.p.x -
            Math.sign(gate.offset) * 3.4 * gate.across.x +
            forward.x * along,
          y: gate.p.y,
          z:
            gate.p.z -
            Math.sign(gate.offset) * 3.4 * gate.across.z +
            forward.z * along,
        })),
      );
      const next = waypoints.find(
        (p) => (p.x - s.p.x) * forward.x + (p.z - s.p.z) * forward.z > 0.25,
      );
      if (next) target = next;
    }
    if (s.anchor) i.grapple = true;
    if (s.clear && s.objective.device === "rune") {
      const solution = solve(s.runes, s.runeTargets);
      target = s.dial(solution[0] ?? 0);
      i.interact = distance(s.p, target) < 3.5 && tick % 8 === 0;
    } else if (
      s.clear &&
      s.objective.device &&
      distance(s.p, s.destination) < 5.5
    )
      i.interact = tick % 8 === 0;
  }
  if (e && distance(s.p, s.destination) < 23 && e.kind !== "guardian") {
    target.x = Math.max(
      s.destination.x - 18,
      Math.min(s.destination.x + 18, target.x),
    );
    target.z = Math.max(
      s.destination.z - 18,
      Math.min(s.destination.z + 18, target.z),
    );
  }
  const d = distance(s.p, target);
  if (d > (s.objective.hazard === "pressure" ? 0.3 : 2)) {
    i.x = (target.x - s.p.x) / d;
    i.z = (target.z - s.p.z) / d;
  }
  return i;
}

function solve(start: number[], target: number[]) {
  const queue = [{ n: start, path: [] as number[] }],
    seen = new Set<string>();
  while (queue.length) {
    const x = queue.shift()!;
    if (x.n.every((n, i) => n === target[i])) return x.path;
    for (let i = 0; i < 3; i++) {
      const next = [...x.n];
      next[i] = (next[i] + 1) % 4;
      next[(i + 1) % 3] = (next[(i + 1) % 3] + 1) % 4;
      const key = next.join();
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ n: next, path: [...x.path, i] });
      }
    }
  }
  return [];
}
