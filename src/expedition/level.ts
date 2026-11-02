export type V = { x: number; y: number; z: number };
export const v = (x = 0, y = 0, z = 0): V => ({ x, y, z });
export type Kind =
  | "raptor"
  | "spitter"
  | "brute"
  | "bomber"
  | "wing"
  | "guardian";
export type Point = V & { width: number; gap?: boolean; arena?: boolean };
export type Beat = {
  node: number;
  title: string;
  hint: string;
  enemies?: Kind[];
  reinforcements?: Kind[][];
  device?: "valve" | "rune" | "wheel" | "beacon";
  story?: string;
  hazard?: "blades" | "surge" | "rocks" | "pressure";
};
export type Chapter = {
  title: string;
  subtitle: string;
  color: string;
  sky: string;
  water: string;
  points: Point[];
  beats: Beat[];
  entry: string;
  exit: string;
};
const path = (xs: number[], ys: number[], gaps: number[] = []) =>
  xs.map((x, i) => ({
    ...v(x, ys[i] ?? 8, i * 58),
    width: 10,
    gap: gaps.includes(i),
    arena: i % 2 === 1,
  }));
export const CHAPTERS: Chapter[] = [
  {
    title: "The storm road",
    subtitle: "I · A MESSAGE IN THE RAIN",
    color: "#d2ad7c",
    sky: "#758b9a",
    water: "#264b59",
    entry:
      "The warning bell has stopped. Somewhere above the valley, the old spillway is breaking.",
    exit: "The signal is alive. Now find what silenced it.",
    points: path(
      [0, 18, -14, 27, 6, -27, 0, 12],
      [8, 10, 14, 12, 15, 18, 17, 20],
      [2, 5],
    ),
    beats: [
      {
        node: 1,
        title: "Reach the first signal",
        hint: "WASD moves. Hold F or click to chain spear attacks. Shift dodges. Space jumps.",
        enemies: ["raptor", "raptor", "raptor"],
        story: "KAVI: Those tracks are fresh. They came down with the storm.",
      },
      {
        node: 3,
        title: "Take back the watchpost",
        hint: "Click or F chains spear attacks. Shift dodges through a committed attack.",
        enemies: ["raptor", "raptor", "spitter", "raptor"],
      },
      {
        node: 5,
        title: "Cross the broken aqueduct",
        hint: "Face the gold ring and press Q. Space can release a grapple early.",
        hazard: "rocks",
        enemies: ["wing", "wing"],
      },
      {
        node: 7,
        title: "Light the warning beacon",
        hint: "Clear the watchpost, then press E at the beacon.",
        enemies: ["raptor", "spitter", "raptor", "bomber"],
        device: "beacon",
        story:
          "THE KEEPER: Kavi? The lower gates are jammed. If you can reach the crown, there is still a way.",
      },
    ],
  },
  {
    title: "The hunting grounds",
    subtitle: "II · LEARN WHAT HUNTS YOU",
    color: "#e6bd81",
    sky: "#799994",
    water: "#285d61",
    entry:
      "The terraces used to grow food. Now every path through them belongs to something hungry.",
    exit: "The hunter understands the terrain. The explorer finds a way through it.",
    points: path(
      [0, -28, 20, 42, -12, -38, 16, 0],
      [12, 14, 13, 17, 19, 17, 23, 22],
      [3],
    ),
    beats: [
      {
        node: 1,
        title: "Break the pack",
        hint: "Q pulls a nearby ground predator off balance. Follow with a spear chain.",
        enemies: ["raptor", "raptor", "raptor", "raptor", "spitter"],
      },
      {
        node: 3,
        title: "Silence the ridge",
        hint: "R throws a returning spear at the nearest creature ahead. Keep moving between throws.",
        enemies: ["spitter", "spitter", "wing", "wing"],
      },
      {
        node: 5,
        title: "Bring down the stonehide",
        hint: "The heavy creature sends a shockwave across the ground. Jump over its ring.",
        enemies: ["brute", "raptor", "raptor", "bomber", "spitter"],
      },
      {
        node: 7,
        title: "Open the hunters’ gate",
        hint: "The second wave mixes flyers with ground attackers. Use height and space.",
        enemies: ["brute", "wing", "wing", "raptor", "raptor", "bomber"],
        device: "wheel",
        story:
          "KAVI: I used to mark safe paths. I should have been marking where they could turn.",
      },
    ],
  },
  {
    title: "The drowned gardens",
    subtitle: "III · WATER REMEMBERS",
    color: "#abc9b9",
    sky: "#638b8e",
    water: "#226e72",
    entry:
      "Three relief valves feed the old reservoir. Open them in the order carved into their stones.",
    exit: "The reservoir exhales. Far above, the great turbines begin to turn.",
    points: path(
      [0, 30, -32, 24, -42, 32, -18, 0],
      [10, 12, 15, 14, 16, 20, 19, 22],
      [4, 6],
    ),
    beats: [
      {
        node: 1,
        title: "Release the first valve",
        hint: "Find the marked wheel. Clear its guardians, then E turns it.",
        enemies: ["spitter", "bomber", "raptor", "raptor"],
        device: "valve",
      },
      {
        node: 3,
        title: "Align the second valve",
        hint: "Three linked wheels. Each turn also moves the next wheel. Match every blue hand to its gold notch.",
        enemies: ["brute", "spitter", "bomber", "bomber"],
        device: "rune",
      },
      {
        node: 5,
        title: "Drain the upper pool",
        hint: "Use the grapple across the flooded cut. The flyers are easiest to hit with R.",
        enemies: ["wing", "wing", "spitter", "raptor", "raptor"],
        device: "valve",
      },
      {
        node: 7,
        title: "Restart the reservoir",
        hint: "Align the three linked wheels. Jump the pressure rings while you work.",
        enemies: ["brute", "brute", "bomber", "spitter"],
        device: "rune",
        hazard: "surge",
        story:
          "THE KEEPER: Pressure is falling here. Whatever you are doing—keep going.",
      },
    ],
  },
  {
    title: "The hanging forest",
    subtitle: "IV · NOTHING BELOW YOU",
    color: "#edca9e",
    sky: "#8ca4a1",
    water: "#356472",
    entry:
      "The maintenance road ends in a canopy of suspended stone. Only the anchor line continues.",
    exit: "For a moment, above the mist, the whole valley is visible.",
    points: path(
      [0, -32, 26, -30, 36, -25, 35, 0],
      [18, 23, 28, 25, 31, 35, 32, 38],
      [1, 2, 4, 6],
    ),
    beats: [
      {
        node: 1,
        title: "Follow the anchor line",
        hint: "Q travels to the highlighted gold ring. Land, look ahead, then chain the next crossing.",
        enemies: ["wing", "wing"],
      },
      {
        node: 3,
        title: "Hold the hanging terrace",
        hint: "Aerial attacks become a ground slam. Jump, then attack above the pack.",
        enemies: ["raptor", "raptor", "raptor", "wing", "wing"],
        hazard: "rocks",
      },
      {
        node: 5,
        title: "Pass the windward shrine",
        hint: "Jump the narrow breaks. Falling returns you to the last secured terrace.",
        enemies: ["wing", "wing", "wing", "spitter"],
        device: "beacon",
      },
      {
        node: 7,
        title: "Secure the sky gate",
        hint: "Build your hunt meter with clean hits. X spends it in a powerful shock burst.",
        enemies: ["brute", "wing", "wing", "bomber", "raptor"],
        device: "wheel",
        story:
          "KAVI: I can see the roofs from here. Hold on. Just a little longer.",
      },
    ],
  },
  {
    title: "The ember quarry",
    subtitle: "V · MAKE THE WORLD A WEAPON",
    color: "#e4a371",
    sky: "#887e79",
    water: "#455264",
    entry:
      "The quarry stores the charges used to break hard stone. Its new inhabitants have not learned to fear them.",
    exit: "The last quarry lift rises toward the turbine gallery.",
    points: path(
      [0, 36, -24, 38, -36, 20, -30, 0],
      [12, 14, 17, 16, 22, 24, 21, 26],
      [2, 5],
    ),
    beats: [
      {
        node: 1,
        title: "Clear the blasting yard",
        hint: "Strike a red charge pod to explode it. Draw nearby creatures into the blast.",
        enemies: ["raptor", "raptor", "bomber", "bomber", "spitter", "brute"],
      },
      {
        node: 3,
        title: "Survive the furnace approach",
        hint: "Spore carriers rush before exploding. A thrown spear keeps them at a distance.",
        enemies: ["bomber", "bomber", "bomber", "spitter", "spitter", "raptor"],
        hazard: "surge",
      },
      {
        node: 5,
        title: "Break the quarry ambush",
        hint: "Combine grapple pulls, aerial strikes and ranged attacks. H uses a healing flask.",
        enemies: [
          "brute",
          "brute",
          "raptor",
          "raptor",
          "wing",
          "spitter",
          "bomber",
        ],
      },
      {
        node: 7,
        title: "Raise the crown lift",
        hint: "Clear the lift controls and turn the wheel.",
        enemies: ["brute", "wing", "wing", "spitter", "bomber", "raptor"],
        device: "wheel",
        story:
          "THE KEEPER: The crown is occupied. Something is nesting against the main gate.",
      },
    ],
  },
  {
    title: "The turbine gallery",
    subtitle: "VI · KEEP YOUR MOMENTUM",
    color: "#8dd5d1",
    sky: "#486b7b",
    water: "#1e5a6b",
    entry:
      "The turbines are turning again. Their maintenance lanes were never meant to be crossed at full pressure.",
    exit: "Beyond the final seal, something enormous moves.",
    points: path(
      [0, -24, 20, -36, 28, -20, 24, 0],
      [8, 10, 13, 12, 18, 17, 23, 24],
      [3, 6],
    ),
    beats: [
      {
        node: 1,
        title: "Pass the first turbine",
        hint: "Jump the rotating energy sweep or dodge through it. Do not stand in its path.",
        enemies: ["raptor", "spitter", "wing"],
        hazard: "blades",
        device: "valve",
      },
      {
        node: 3,
        title: "Cross the pressure channel",
        hint: "Amber warns of steam. Follow the cyan gaps or Shift through a burst. Q crosses the spill; E closes the far valve.",
        enemies: ["wing", "wing"],
        hazard: "pressure",
        device: "valve",
        story:
          "KAVI: There’s the cutoff wheel. Clear the flyers, then shut this down.",
      },
      {
        node: 5,
        title: "Release the crown lock",
        hint: "Match all three linked pointers to their gold notches to release the crown lock.",
        enemies: ["brute", "raptor", "raptor", "spitter", "bomber"],
        device: "rune",
        hazard: "surge",
      },
      {
        node: 7,
        title: "Open the guardian’s door",
        hint: "This is the last safe station. Clear it and open the seal.",
        enemies: ["brute", "brute", "wing", "wing", "spitter"],
        device: "wheel",
        story: "KAVI: No route around it. Then I will make one through.",
      },
    ],
  },
  {
    title: "The crown guardian",
    subtitle: "VII · BECOME THE HUNTER",
    color: "#d6a86d",
    sky: "#627782",
    water: "#284958",
    entry:
      "The Slateback has grown around the crown’s machinery. Its armour is the stone of the spillway itself.",
    exit: "The guardian falls. The water does not stop.",
    points: path(
      [0, 12, -12, 0, 18, -18, 0, 0],
      [12, 14, 16, 18, 18, 20, 22, 24],
    ),
    beats: [
      {
        node: 1,
        title: "Reach the crown",
        hint: "Preserve your flasks. Defeat the creatures guarding the last approach.",
        enemies: ["brute", "raptor", "spitter", "wing"],
      },
      {
        node: 3,
        title: "Defeat the Slateback",
        hint: "Bait its charge into a striped support. Q pulls loose armour. Attack while exposed.",
        enemies: ["guardian"],
        story: "KAVI: You know this place. So do I.",
      },
      {
        node: 5,
        title: "Reach the flood controls",
        hint: "The remaining brood is scattered. Clear a path to the emergency wheel.",
        enemies: ["raptor", "raptor", "wing", "bomber"],
      },
      {
        node: 7,
        title: "Release the floodgate",
        hint: "E opens the emergency sluice. Be ready to run.",
        device: "wheel",
        story:
          "THE KEEPER: The channel is open! Kavi, get off the spillway. Now!",
      },
    ],
  },
  {
    title: "Outrun the flood",
    subtitle: "VIII · ONE LAST CROSSING",
    color: "#e5bb8a",
    sky: "#a9b0ae",
    water: "#608c94",
    entry:
      "The surge is behind you. The refuge is above. Every lesson has led to this crossing.",
    exit: "The valley holds. And a routefinder returns as a hunter.",
    points: path(
      [0, 20, -24, 30, -20, 34, -16, 0],
      [12, 17, 22, 26, 30, 34, 38, 43],
      [1, 3, 5, 6],
    ),
    beats: [
      {
        node: 1,
        title: "Escape the lower crown",
        hint: "Keep moving. Q catches the next anchor; the flood is rising.",
        hazard: "rocks",
      },
      {
        node: 3,
        title: "Cross the falling aqueduct",
        hint: "Use the anchor line. The next landing is marked with a warm light.",
        hazard: "surge",
      },
      {
        node: 5,
        title: "Climb above the surge",
        hint: "Chain your grapples, then run to the final staircase.",
        hazard: "rocks",
      },
      {
        node: 7,
        title: "Reach the high refuge",
        hint: "The last light is home. Reach it to finish the chapter.",
        device: "beacon",
      },
    ],
  },
];
// Reinforcements change the attack pattern after the initial group is broken.
const waves: Record<number, Kind[][][]> = {
  0: [[], [["raptor", "raptor"]], [], [["wing", "raptor", "bomber"]]],
  1: [
    [["raptor", "raptor", "bomber"]],
    [["raptor", "wing", "spitter"]],
    [["brute", "bomber", "raptor"]],
    [["wing", "spitter", "bomber", "raptor"]],
  ],
  2: [
    [["raptor", "spitter"]],
    [["wing", "raptor", "bomber"]],
    [["brute", "raptor", "wing"]],
    [["wing", "spitter", "bomber"]],
  ],
  3: [
    [],
    [["wing", "spitter", "raptor"]],
    [["wing", "raptor", "raptor"]],
    [["brute", "wing", "bomber"]],
  ],
  4: [
    [["bomber", "raptor", "raptor"]],
    [["brute", "wing", "bomber"]],
    [["spitter", "wing", "bomber", "raptor"]],
    [["brute", "raptor", "spitter", "bomber"]],
  ],
  5: [
    [["bomber", "raptor", "wing"]],
    [],
    [["brute", "wing", "bomber"]],
    [["wing", "raptor", "spitter", "bomber"]],
  ],
  6: [[["raptor", "wing", "spitter"]], [], [["bomber", "spitter", "wing"]], []],
};
for (const [sector, groups] of Object.entries(waves))
  groups.forEach((reinforcements, beat) => {
    CHAPTERS[Number(sector)].beats[beat].reinforcements = reinforcements;
  });
export const distance = (a: V, b: V) => Math.hypot(a.x - b.x, a.z - b.z);
export const length3 = (a: V, b: V) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function floorAt(ch: Chapter, x: number, z: number): number | null {
  let floor: number | null = null;
  for (let i = 0; i < ch.points.length; i++) {
    const p = ch.points[i];
    const radius = p.arena ? 23 : 13;
    if (Math.abs(x - p.x) < radius && Math.abs(z - p.z) < (p.arena ? 23 : 14))
      floor = Math.max(floor ?? -999, p.y);
    const q = ch.points[i + 1];
    if (!q || q.gap) continue;
    const dx = q.x - p.x,
      dz = q.z - p.z,
      t = ((x - p.x) * dx + (z - p.z) * dz) / (dx * dx + dz * dz);
    if (t < 0 || t > 1) continue;
    if (
      Math.hypot(x - (p.x + dx * t), z - (p.z + dz * t)) <
      Math.min(p.width, q.width) / 2
    )
      floor = Math.max(
        floor ?? -999,
        p.y +
          (q.y - p.y) *
            Math.max(
              0,
              Math.min(
                1,
                (t - (p.arena ? 23 : 14) / Math.abs(dz)) /
                  (1 -
                    ((p.arena ? 23 : 14) + (q.arena ? 23 : 14)) / Math.abs(dz)),
              ),
            ),
      );
  }
  return floor;
}
export const ASSETS = {
  hero: "/assets/hero/Adventurer.gltf",
  raptor: "/assets/creatures/Dino.gltf",
  spitter: "/assets/creatures/Frog.gltf",
  brute: "/assets/creatures/Yeti.gltf",
  bomber: "/assets/creatures/MushroomKing.gltf",
  wing: "/assets/flying/Dragon.gltf",
  guardian: "/assets/flying/Goleling_Evolved.gltf",
};
