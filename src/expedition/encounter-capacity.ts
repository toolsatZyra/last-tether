import type { Chapter, Kind } from "./level.ts";
export const CREATURE_KINDS: Kind[] = [
  "raptor",
  "spitter",
  "brute",
  "bomber",
  "wing",
  "guardian",
];
/** Reserve a whole encounter, including overlapping waves, adjacent encounters and boss summons. */
export function encounterCapacity(chapter: Chapter): Record<Kind, number> {
  const capacity = Object.fromEntries(
    CREATURE_KINDS.map((kind) => [kind, 0]),
  ) as Record<Kind, number>;
  let previous: Kind[] = [];
  for (const beat of chapter.beats) {
    const members = [
      ...(beat.enemies || []),
      ...(beat.reinforcements || []).flat(),
    ];
    if (members.includes("guardian"))
      members.push("raptor", "wing", "raptor", "wing", "raptor");
    for (const kind of CREATURE_KINDS)
      capacity[kind] = Math.max(
        capacity[kind],
        [...previous, ...members].filter((member) => member === kind).length,
      );
    previous = members;
  }
  return capacity;
}
