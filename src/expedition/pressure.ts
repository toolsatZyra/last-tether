import { floorAt, type Chapter, type V } from "./level.ts";
export const PRESSURE_PERIOD = 3.6;
export function pressurePhase(time: number, index: number) {
  const phase =
    (((time - index * 0.8) % PRESSURE_PERIOD) + PRESSURE_PERIOD) %
    PRESSURE_PERIOD;
  return {
    phase,
    warning: phase < 0.75,
    active: phase >= 0.75 && phase < 1.75,
  };
}
export function pressureGates(chapter: Chapter) {
  const a = chapter.points[1],
    b = chapter.points[2],
    length = Math.hypot(b.x - a.x, b.z - a.z);
  const forward = { x: (b.x - a.x) / length, z: (b.z - a.z) / length },
    across = { x: forward.z, z: -forward.x };
  return [86, 92.5, 99].map((z, index) => {
    const t = (z - a.z) / (b.z - a.z),
      x = a.x + (b.x - a.x) * t;
    return {
      index,
      p: { x, y: floorAt(chapter, x, z) ?? a.y, z },
      forward,
      across,
      offset: index % 2 ? 1.8 : -1.8,
      yaw: Math.atan2(forward.x, forward.z),
    };
  });
}
export type PressureGate = ReturnType<typeof pressureGates>[number];
export function insidePressureLane(gate: PressureGate, p: V) {
  const dx = p.x - gate.p.x,
    dz = p.z - gate.p.z;
  return (
    Math.abs(dx * gate.forward.x + dz * gate.forward.z) < 1.1 &&
    Math.abs(dx * gate.across.x + dz * gate.across.z - gate.offset) < 3.48 &&
    p.y >= gate.p.y - 0.6 &&
    p.y < gate.p.y + 3.6
  );
}
