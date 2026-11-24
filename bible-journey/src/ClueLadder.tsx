import { Pressable, View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useTier } from "../theme/ThemeProvider";
import { Copy } from "./components";
import { canBuy } from "./game";
import { useLocale } from "./LocaleProvider";
import type { Clue, PuzzleProgress } from "./types";
export function LadderDrawing({ image }: { image: number }) {
  const t = useTier();
  const { tr } = useLocale();
  return (
    <View
      accessible
      accessibilityLabel={tr(`Clue ladder. Picture ${image + 1} of 4.`, `סולם הרמזים. תמונה ${image + 1} מתוך 4.`)}
      style={{ width: 38, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={38} height={150} viewBox="0 0 38 150" aria-hidden>
        <Path
          d="M8 12L5 141M30 12L33 141"
          stroke={t.colors.ink}
          strokeWidth={4}
          fill="none"
        />
        {[0, 1, 2, 3].map((i) => (
          <Path
            key={i}
            d={`M7 ${128 - i * 34}H31`}
            stroke={i <= image ? t.colors.accent : t.colors.border}
            strokeWidth={i <= image ? 7 : 3}
            strokeLinecap="square"
          />
        ))}
        <Circle
          cx={19}
          cy={128 - image * 34}
          r={6}
          fill={t.colors.accent}
          stroke={t.colors.background}
          strokeWidth={2}
        />
      </Svg>
      <Copy kind="label" style={{ direction: "ltr", writingDirection: "ltr", textAlign: "center" }}>{image + 1}/4</Copy>
    </View>
  );
}
export function ClueLadder({
  progress,
  tokens,
  onBuy,
}: {
  progress: PuzzleProgress;
  tokens: number;
  onBuy: (clue: Clue) => void;
}) {
  const t = useTier();
  const { tr, direction } = useLocale();
  return (
    <View
      style={{
        gap: 8,
        backgroundColor: t.colors.background,
        padding: 14,
        borderWidth: t.borderWidth,
        borderColor: t.colors.border,
        borderRadius: t.radius,
      }}
    >
      <Copy>{t.clues.length === 1 ? tr("Need another look?", "עוד מבט על התמונה?") : tr("Clue ladder", "סולם הרמזים")}</Copy>
      <View style={{ direction, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {t.clues.map((r) => {
          const available = canBuy(r.key, progress),
            afford = tokens >= r.cost;
          const label = tr(r.label, r.key === "image" ? (t.input === "pictures" ? "תמונה ברורה יותר" : "התמונה הבאה") : r.key === "hint" ? "רמז כתוב" : r.key === "letter" ? "האות הראשונה" : "חשיפת התשובה");
          return (
            <Pressable
              key={r.key}
              accessibilityRole="button"
              accessibilityLabel={tr(`Buy ${r.label.toLowerCase()}. ${r.cost} ${r.cost === 1 ? "token" : "tokens"}.`, `${label}. מחיר: ${r.cost === 1 ? "אסימון אחד" : `${r.cost} אסימונים`}.`)}
              accessibilityState={{ disabled: !available || !afford }}
              disabled={!available || !afford}
              onPress={() => onBuy(r.key)}
              style={{
                width: t.clues.length === 1 ? "100%" : "48%",
                minHeight: t.touch,
                justifyContent: "center",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: t.colors.border,
                borderRadius: t.radius,
                opacity: available && afford ? 1 : 0.5,
              }}
            >
              <Copy style={t.input === "pictures" ? undefined : t.type.label}>
                {label}
              </Copy>
              <Copy kind="label" tone="muted">
                {!available
                  ? r.key === "image"
                    ? tr("Last picture", "התמונה האחרונה")
                    : tr("Revealed", "כבר נחשף")
                  : tr(`${r.cost} ${r.cost === 1 ? "token" : "tokens"}`, r.cost === 1 ? "אסימון אחד" : `${r.cost} אסימונים`)}
              </Copy>
            </Pressable>
          );
        })}
      </View>
      <Copy kind="label" tone="muted">
        {progress.image === 3
          ? tr("Last clue. Keep guessing!", "זה הרמז האחרון. אפשר להמשיך לנחש!")
          : t.input === "pictures"
            ? tr("A clearer picture, one step up.", "כל שלב מגלה תמונה ברורה יותר.")
            : tr("Climb for a clearer picture. Guesses stay free.", "כל שלב מגלה תמונה ברורה יותר. הניחושים נשארים בחינם.")}
      </Copy>
    </View>
  );
}
