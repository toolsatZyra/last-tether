import type { V } from "./level.ts";

/** Timings and socket measurements for the licensed Spider rig at game scale. */
export const SILKSPITTER = {
  height: 1.45,
  windup: 0.85,
  recovery: 1.6,
  clipDuration: 1.6,
  clipContact: 0.67,
  deathDuration: 1.15,
  shotHeight: 2.345,
  shotForward: 0.62,
  impactHeight: 0.95,
} as const;

export function silkspitterShotOrigin(p: V, yaw: number): V {
  return {
    x: p.x + Math.sin(yaw) * SILKSPITTER.shotForward,
    y: p.y + SILKSPITTER.shotHeight,
    z: p.z + Math.cos(yaw) * SILKSPITTER.shotForward,
  };
}
