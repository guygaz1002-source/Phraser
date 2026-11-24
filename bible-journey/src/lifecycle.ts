import { canLeaveChapter } from "./round";
import type { Journey, Stop, TierId } from "./types";

export type LifeStageId =
  | "moses-baby" | "moses-child" | "moses-young" | "moses-shepherd" | "moses-leader" | "moses-elder"
  | "samson-child" | "samson-adult" | "samson-shorn" | "samson-regrowth"
  | "noah-builder" | "noah-keeper" | "noah-watcher" | "noah-renewed";
export type LifeStage = { id: LifeStageId; hero: string; description: string; motion: "walk" | "float" };

export const lifeStages: Record<LifeStageId, LifeStage> = {
  "moses-baby": { id: "moses-baby", hero: "moses", description: "Baby Moses, a duckling nestled in a floating basket", motion: "float" },
  "moses-child": { id: "moses-child", hero: "moses", description: "Moses as a child, a small duckling in a sand-colored tunic", motion: "walk" },
  "moses-young": { id: "moses-young", hero: "moses", description: "Moses as a young adult duck", motion: "walk" },
  "moses-shepherd": { id: "moses-shepherd", hero: "moses", description: "Moses as a mature shepherd duck with a staff", motion: "walk" },
  "moses-leader": { id: "moses-leader", hero: "moses", description: "Moses as an older leader duck", motion: "walk" },
  "moses-elder": { id: "moses-elder", hero: "moses", description: "Moses as an elder duck with a white beard and staff", motion: "walk" },
  "samson-child": { id: "samson-child", hero: "samson", description: "Samson as a child duckling with growing brown hair", motion: "walk" },
  "samson-adult": { id: "samson-adult", hero: "samson", description: "Samson as an adult duck with long brown hair", motion: "walk" },
  "samson-shorn": { id: "samson-shorn", hero: "samson", description: "Adult Samson with closely cut hair and closed eyes", motion: "walk" },
  "samson-regrowth": { id: "samson-regrowth", hero: "samson", description: "Adult Samson with short regrowing hair and closed eyes", motion: "walk" },
  "noah-builder": { id: "noah-builder", hero: "noah", description: "Adult Noah with a white beard and work apron", motion: "walk" },
  "noah-keeper": { id: "noah-keeper", hero: "noah", description: "Adult Noah with a white beard and a shoulder bag", motion: "walk" },
  "noah-watcher": { id: "noah-watcher", hero: "noah", description: "Adult Noah with a white beard and a tucked olive cloak", motion: "walk" },
  "noah-renewed": { id: "noah-renewed", hero: "noah", description: "Adult Noah with his familiar olive robe and staff", motion: "walk" },
};

// Key by story ID: chapter numbers are deliberately not in chronological order.
// Keep this separately from the generated catalog and world importer.
export const chapterLifeStages: Record<string, { before: LifeStageId; after?: LifeStageId }> = {
  "life-moses-1": { before: "moses-baby" },
  "life-moses-6": { before: "moses-young" },
  "life-moses-2": { before: "moses-shepherd" },
  "life-moses-7": { before: "moses-leader" },
  "life-moses-3": { before: "moses-leader" },
  "life-moses-4": { before: "moses-leader" },
  "life-moses-8": { before: "moses-leader" },
  "life-moses-9": { before: "moses-leader" },
  "life-moses-5": { before: "moses-elder" },
  "life-samson-1": { before: "samson-child" },
  "life-samson-6": { before: "samson-adult" },
  "life-samson-2": { before: "samson-adult" },
  "life-samson-7": { before: "samson-adult" },
  "life-samson-8": { before: "samson-adult" },
  "life-samson-3": { before: "samson-adult" },
  "life-samson-4": { before: "samson-adult", after: "samson-shorn" },
  "life-samson-9": { before: "samson-shorn", after: "samson-regrowth" },
  "life-samson-5": { before: "samson-regrowth" },
  "life-noah-1": { before: "noah-builder" },
  "life-noah-6": { before: "noah-keeper" },
  "life-noah-2": { before: "noah-keeper" },
  "life-noah-3": { before: "noah-watcher" },
  "life-noah-7": { before: "noah-watcher" },
  "life-noah-8": { before: "noah-watcher" },
  "life-noah-4": { before: "noah-watcher" },
  "life-noah-9": { before: "noah-renewed" },
  "life-noah-5": { before: "noah-renewed" },
};

export function lifeStageFor(stopId: string, awards: Journey["awards"] = {}): LifeStage | undefined {
  const chapter = chapterLifeStages[stopId];
  if (!chapter) return undefined;
  // A zero-token reveal is still a solved chapter; do not use a truthiness check.
  return lifeStages[awards[stopId] !== undefined && chapter.after ? chapter.after : chapter.before];
}

export function hasMosesChildInterlude(stop: Stop, journey: Journey, tier: TierId): boolean {
  return stop.id === "life-moses-1" && canLeaveChapter(stop, journey, tier);
}
