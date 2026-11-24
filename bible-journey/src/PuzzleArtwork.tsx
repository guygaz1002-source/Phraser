import { useEffect, useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { puzzleImages } from "../content/catalog.generated";
import { useTier } from "../theme/ThemeProvider";
import { Button, Copy } from "./components";
import { LadderDrawing } from "./ClueLadder";
import { useLocale } from "./LocaleProvider";
import { illustrationFile } from "./illustrationFile";
import type { Puzzle } from "./types";
export function PuzzleArtwork({
  puzzle,
  index,
  imageSet,
  label,
  hideLadder = false,
  maxWidth,
  onReadyChange,
}: {
  puzzle: Puzzle;
  index: number;
  imageSet?: keyof Puzzle["images"];
  label?: string;
  hideLadder?: boolean;
  maxWidth?: number;
  onReadyChange?: (ready: boolean) => void;
}) {
  const t = useTier();
  const { tr, direction } = useLocale();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const set = imageSet ?? t.imageSet;
  const description = (puzzle.descriptions[set] ?? puzzle.descriptions.classic)[index];
  const file = illustrationFile(puzzle, t.imageSet, set, index);
  useEffect(() => { setError(false); setLoading(true); onReadyChange?.(false); }, [file, retry, onReadyChange]);
  const grid = puzzle.imageGrid;
  const columns = grid?.columns ?? 1,
    rows = grid?.rows ?? 1;
  return (
    <View style={{ direction, flexDirection: "row", gap: 12, alignItems: "center", width: "100%", maxWidth: error && maxWidth !== undefined ? Math.max(260, maxWidth) : maxWidth, alignSelf: maxWidth === undefined ? undefined : "center" }}>
      <View
        style={{
          flex: 1,
          padding: t.imageMat,
          borderWidth: t.borderWidth,
          borderColor: t.colors.border,
          borderRadius: t.radius,
          backgroundColor: t.colors.background,
        }}
      >
        <View
          style={{
            // Sprite-sheet offsets are physical coordinates, independent of reading order.
            direction: "ltr",
            width: "100%",
            aspectRatio: error ? undefined : 1,
            backgroundColor: t.colors.painting,
            overflow: "hidden",
            borderRadius: Math.max(0, t.radius - t.imageMat),
          }}
        >
          <Image
            key={`${file}/${retry}`}
            source={puzzleImages[file]}
            recyclingKey={file}
            contentFit={grid ? "fill" : "contain"}
            cachePolicy="memory-disk"
            transition={hideLadder ? 0 : t.motion.duration}
            onError={() => { setError(true); setLoading(false); onReadyChange?.(false); }}
            onLoad={() => { setError(false); setLoading(false); onReadyChange?.(true); }}
            style={{
              position: "absolute",
              opacity: error ? 0 : 1,
              width: `${columns * 100}%`,
              height: `${rows * 100}%`,
              left: `${grid ? -(index % columns) * 100 : 0}%`,
              top: `${grid ? -Math.floor(index / columns) * 100 : 0}%`,
            }}
            accessibilityLabel={`${label ?? tr(`Picture ${index + 1} of 4`, `תמונה ${index + 1} מתוך 4`)}. ${description}`}
          />
          {loading ? <View pointerEvents="none" style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.painting }}><Copy style={{ fontSize: 16, lineHeight: 24, textAlign: "center" }}>{tr("Loading picture…", "טוענים את התמונה…")}</Copy></View> : null}
          {error ? (
            <View
              style={{
                direction,
                backgroundColor: t.colors.background,
                justifyContent: "center",
                padding: 12,
                gap: 8,
              }}
            >
              <Copy>{tr("This picture could not load.", "לא הצלחנו לטעון את התמונה.")}</Copy>
              <Button
                title={tr("Try picture again", "טעינה חוזרת של התמונה")}
                onPress={() => {
                  setError(false);
                  setRetry((n) => n + 1);
                }}
              />
            </View>
          ) : null}
        </View>
      </View>
      {hideLadder ? null : <LadderDrawing image={index} />}
    </View>
  );
}
