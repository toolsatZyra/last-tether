/** Native Wasp rig; gameplay owns travel while source clips articulate the body. */
export const STORMWING = {
  height: 1.9,
  bodyHeight: 1.4,
  radius: 0.55,
  windup: 0.85,
  lunge: 0.55,
  recovery: 0.9,
  clipDuration: 1.8,
  clipLaunch: 0.6,
  clipRecover: 1.1,
  deathLife: 2.2,
  deathDuration: 1.5,
} as const;
/** Offline Babylon skinning over all 708 authored frames, plus .12-unit margin.
 * Regenerate with tools/stormwing-bounds.js after editing the asset. */
export const STORMWING_BOUNDS = [
  {
    mesh: "WaspBody_primitive0",
    min: [-0.9699269485473633, 0.7160633850097656, -1.1423708152770997],
    max: [0.9357906532287598, 2.574118251800537, 1.0427849245071412],
  },
  {
    mesh: "WaspBody_primitive1",
    min: [-1.1803066682815553, 0.6646892476081848, -1.0712801170349122],
    max: [1.182042236328125, 2.9405337524414064, 0.6532690477371216],
  },
];

/** Neutral-to-folded bottom clearance measured at the authored 1.9-unit scale.
 * Keep the rendered corpse on its collision foot without flattening its volume. */
const deathClearance = [
  0, 0, 0.0913, 0.1871, 0.4519, 0.569, 0.5895, 0.5841, 0.5639, 0.5388, 0.5301,
];
export function stormwingDeathOffset(elapsed: number) {
  const frame =
    Math.max(0, Math.min(1, elapsed / STORMWING.deathDuration)) * 10;
  const index = Math.min(9, Math.floor(frame));
  return (
    deathClearance[index] +
    (deathClearance[index + 1] - deathClearance[index]) * (frame - index)
  );
}
