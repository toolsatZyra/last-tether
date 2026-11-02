/** One definition keeps native animation, contact timing and gameplay reach together. */
export type MeleeMove = "slash" | "sweep" | "finisher" | "kick";
export const MELEE = {
  slash: {
    clip: "Sword_Slash",
    duration: 0.35,
    contact: 0.42,
    damage: 34,
    knock: 0.4,
    reach: 3.1,
    height: 2.4,
    cone: 0.05,
    stepTo: 2.6,
    trail: true,
    hitstop: 0.055,
  },
  sweep: {
    clip: "Sword_Slash",
    duration: 0.4,
    contact: 0.375,
    damage: 42,
    knock: 0.4,
    reach: 3.1,
    height: 2.4,
    cone: 0.05,
    stepTo: 2.6,
    trail: true,
    hitstop: 0.055,
  },
  finisher: {
    clip: "Spear_Thrust",
    duration: 0.58,
    contact: 0.52,
    damage: 72,
    knock: 1.8,
    reach: 3.1,
    height: 1.5,
    cone: 0.78,
    stepTo: 2.25,
    trail: true,
    hitstop: 0.085,
  },
  // The licensed kick reaches full extension at about 55% of its native clip.
  kick: {
    clip: "Kick_Right",
    duration: 0.44,
    contact: 0.55,
    damage: 42,
    knock: 1.1,
    reach: 2.3,
    height: 2,
    cone: 0.45,
    stepTo: 1.8,
    trail: false,
    hitstop: 0.065,
  },
} as const;
export function chooseMelee(
  combo: number,
  grounded: boolean,
  range: number,
  height: number,
): MeleeMove {
  if (combo === 1 && grounded && range < 2.8 && height < 1.3) return "kick";
  return (["slash", "sweep", "finisher"] as const)[combo] ?? "slash";
}
