import { puzzleImages } from "../content/catalog.generated";
import type { Puzzle } from "./types";

type ArtSet = keyof Puzzle["images"];

/** Keep the clue's composition while using the player's illustrated edition. */
export function illustrationFile(puzzle: Puzzle, playerSet: ArtSet, sourceSet: ArtSet, index: number) {
  const original = (puzzle.images[sourceSet] ?? puzzle.images.classic)[index]!;
  const alternate = playerSet + "-" + original;
  return playerSet !== sourceSet && puzzleImages[alternate] !== undefined ? alternate : original;
}
