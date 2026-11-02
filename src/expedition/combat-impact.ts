import { v, type V, type Kind } from "./level.ts";

export type HitReaction = {
  id: number;
  elapsed: number;
  duration: number;
  direction: V;
  strength: number;
};
export type ImpactCue = {
  direction: V;
  contact: V;
  strength: number;
  blocked?: boolean;
  fatal?: boolean;
};
/** Authored response weights, not a replacement for Havok contact solving. */
export const BODY_WEIGHT: Record<Kind, number> = {
  raptor: 1,
  spitter: 0.9,
  bomber: 0.75,
  wing: 0.8,
  brute: 3.2,
  guardian: 14,
};
export function impactDirection(from: V, to: V, fallbackYaw = 0): V {
  const x = to.x - from.x,
    z = to.z - from.z,
    length = Math.hypot(x, z);
  return length > 0.001
    ? v(x / length, 0, z / length)
    : v(Math.sin(fallbackYaw), 0, Math.cos(fallbackYaw));
}
export function impactStrength(damage: number) {
  return Math.max(0.25, Math.min(1, damage / 72));
}
export function reactionEnvelope(hit?: HitReaction) {
  if (!hit) return 0;
  const t = Math.min(1, hit.elapsed / hit.duration);
  return (1 - t) * (1 - t);
}
