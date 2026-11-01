import type { Frame } from "./engine.ts";

export type RecordRun = {
  date: string;
  seconds: number;
  deaths: number;
  ghost: Frame[];
};
export type Preferences = {
  quality: "high" | "balanced" | "low";
  reduced: boolean;
  ghost: boolean;
  difficulty: "explorer" | "hunter";
};
export const defaultPreferences: Preferences = {
  quality: "balanced",
  reduced: false,
  ghost: true,
  difficulty: "explorer",
};

export function validPreferences(raw: unknown): Preferences {
  const p = raw as Partial<Preferences> | null;
  return {
    quality:
      p && ["high", "balanced", "low"].includes(p.quality || "")
        ? p.quality!
        : defaultPreferences.quality,
    reduced: p?.reduced === true,
    ghost: p?.ghost !== false,
    difficulty: p?.difficulty === "hunter" ? "hunter" : "explorer",
  };
}

export function validRecords(raw: unknown): RecordRun[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).filter((r): r is RecordRun => {
    if (
      !r ||
      typeof r !== "object" ||
      typeof r.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
      !Number.isFinite(r.seconds) ||
      r.seconds <= 0 ||
      r.seconds > 86400 ||
      !Number.isInteger(r.deaths) ||
      r.deaths < 0 ||
      !Array.isArray(r.ghost) ||
      r.ghost.length > 15000
    )
      return false;
    let last = -1;
    return r.ghost.every((f: Frame) => {
      if (
        !f ||
        ![f.t, f.x, f.y, f.z, f.yaw].every(Number.isFinite) ||
        f.t < last ||
        f.t < 0 ||
        f.t > r.seconds + 1 ||
        f.sector !== 3 ||
        Math.abs(f.x) > 1000 ||
        Math.abs(f.y) > 1000 ||
        Math.abs(f.z) > 1000
      )
        return false;
      last = f.t;
      return true;
    });
  });
}
