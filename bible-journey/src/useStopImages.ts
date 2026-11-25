import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Image } from "expo-image";
import { puzzleImages } from "../content/catalog.generated";
import { useTier } from "../theme/ThemeProvider";
import { illustrationFile } from "./illustrationFile";
import { alternateImageSet, roundArtwork } from "./round";
import type { Stop } from "./types";

type Preparation = {
  total: number;
  settled: number;
  failed: number;
  promise: Promise<void>;
  listeners: Set<() => void>;
};
const preparations = new Map<string, Preparation>();
function prepare(stop: Stop, imageSet: "kids" | "teen" | "classic", artStep?: number): Preparation {
  const activeArt = artStep === undefined ? undefined : roundArtwork(imageSet, artStep, 0);
  const files = [
    ...new Set(
      stop.puzzles.flatMap((p) => activeArt ? [illustrationFile(p, imageSet, activeArt.set, activeArt.index)] : [
        ...(p.images[imageSet] ?? p.images.classic),
        ...(stop.visualQuestions ? [illustrationFile(p, imageSet, alternateImageSet(imageSet), 3)] : []),
        ...([1, 2, 3].map(clue => {
          const art = roundArtwork(imageSet, 0, clue);
          return illustrationFile(p, imageSet, art.set, art.index);
        })),
        ...(imageSet === "kids" ? p.choicePicturesKids : []),
      ]),
    ),
  ];
  const key = files.join("|");
  const found = preparations.get(key);
  if (found) return found;
  const entry: Preparation = {
    total: files.length,
    settled: 0,
    failed: 0,
    promise: Promise.resolve(),
    listeners: new Set(),
  };
  preparations.set(key, entry);
  entry.promise = Promise.all(
    files.map(async (file) => {
      try {
        if (
          !(await Image.prefetch(Asset.fromModule(puzzleImages[file]!).uri, {
            cachePolicy: "memory-disk",
          }))
        )
          entry.failed++;
      } catch {
        entry.failed++;
      } finally {
        entry.settled++;
        entry.listeners.forEach((notify) => notify());
      }
    }),
  ).then(() => undefined);
  return entry;
}
export function useStopImages(stop?: Stop, artStep?: number) {
  const { imageSet } = useTier();
  const [, refresh] = useState(0);
  const [entry, setEntry] = useState<Preparation>();
  useEffect(() => {
    if (!stop) return;
    const next = prepare(stop, imageSet, artStep);
    const notify = () => refresh((n) => n + 1);
    next.listeners.add(notify);
    setEntry(next);
    return () => {
      next.listeners.delete(notify);
    };
  }, [stop, imageSet, artStep]);
  return {
    total: entry?.total ?? 0,
    loaded: (entry?.settled ?? 0) - (entry?.failed ?? 0),
    failed: entry?.failed ?? 0,
    promise: entry?.promise,
  };
}
