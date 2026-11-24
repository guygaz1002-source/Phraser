import { memo, useEffect, useState } from "react";
import { Image, Pressable, View, type ImageStyle, type ImageSourcePropType } from "react-native";
import Svg, { G, Path, Rect } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useReducedMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { sprites } from "../content/catalog.generated";
import { useLocale } from "./LocaleProvider";
import { useTier } from "../theme/ThemeProvider";
import { Olive } from "../components/motifs";
import { Copy } from "./components";
import { rules } from "./game";
import type { Character, Journey, Stop, Tile } from "./types";
export function Sprite({
  id = "moses",
  size = 64,
  frame,
  walking = false,
  source,
  description,
  floating = false,
}: {
  id?: string;
  size?: number;
  frame?: number;
  walking?: boolean;
  source?: ImageSourcePropType;
  description?: string;
  floating?: boolean;
}) {
  const t = useTier(),
    [idle, setIdle] = useState(0),
    breathe = useSharedValue(1),
    bob = useSharedValue(0);
  const reduced = useReducedMotion();
  const { tr } = useLocale();
  const hebrewName = ({ moses: "משה", samson: "שמשון", noah: "נח", david: "דוד", solomon: "שלמה" } as Record<string, string>)[id] ?? id;
  useEffect(() => {
    if (frame !== undefined || reduced) return;
    const timer = setInterval(() => setIdle((f) => 1 - f), rules.idleMs);
    return () => clearInterval(timer);
  }, [frame, reduced]);
  useEffect(() => {
    breathe.value =
      !reduced && frame === undefined && t.motion.breathe && !walking && !floating
        ? withRepeat(
            withSequence(
              withTiming(1.035, {
                duration: 1400,
                easing: Easing.inOut(Easing.ease),
              }),
              withTiming(1, {
                duration: 1400,
                easing: Easing.inOut(Easing.ease),
              }),
            ),
            -1,
          )
        : 1;
    return () => cancelAnimation(breathe);
  }, [t.motion.breathe, walking, floating, reduced, frame, breathe]);
  useEffect(() => {
    bob.value = floating && !reduced
      ? withRepeat(withSequence(
          withTiming(-Math.max(1, size * 0.025), { duration: 1050, easing: Easing.inOut(Easing.ease) }),
          withTiming(Math.max(1, size * 0.025), { duration: 1050, easing: Easing.inOut(Easing.ease) }),
        ), -1)
      : 0;
    return () => cancelAnimation(bob);
  }, [floating, reduced, size, bob]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: breathe.value }],
  }));
  const f = reduced ? 0 : frame ?? idle;
  return (
    <Animated.View
      style={[{ direction: "ltr", width: size, height: size * 1.5, overflow: "hidden" }, style]}
    >
      <Image
        source={source ?? sprites[id]}
        accessibilityLabel={description ?? tr(`${id} pixel duck portrait`, `דמות ברווז של ${hebrewName} באמנות פיקסלים`)}
        style={
          {
            width: size * 4,
            height: size * 1.5,
            position: "absolute",
            left: -f * size,
            top: 0,
            imageRendering: "pixelated",
          } as ImageStyle
        }
        resizeMode="stretch"
      />
    </Animated.View>
  );
}
const Terrain = memo(function Terrain({ character }: { character: Character }) {
  const t = useTier(),
    m = character.tilemap,
    p = t.terrain;
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${m.width * 16} ${m.height * 16}`}
      aria-hidden
    >
      {m.tiles.flatMap((row, y) =>
        row.map((kind, x) => (
          <G key={`${x}/${y}`} x={x * 16} y={y * 16}>
            <Rect
              width={16}
              height={16}
              fill={
                kind === "sand" ? p.sand : kind === "water" ? p.water : p.grass
              }
            />
            {kind === "grass" && (x + y) % 3 === 0 ? (
              <Path
                d="M3 11v-2h1v2h2v-2h1v3H3M11 4h2v1h-2"
                fill={p.deep}
                opacity={0.5}
              />
            ) : null}
            {kind === "sand" ? (
              <Path
                d="M2 6h2v1H2M10 13h2v1h-2M12 3h1v1h-1"
                fill={p.rock}
                opacity={0.5}
              />
            ) : null}
            {kind === "water" ? (
              <Path
                d="M2 5h6v1H2M10 12h5v1h-5M0 15h3v1H0"
                fill={p.sand}
                opacity={0.5}
              />
            ) : null}
            {kind === "tree" ? (
              <>
                <Rect x={6} y={10} width={4} height={6} fill={p.detail} />
                <Path d="M6 1h4v2h3v3h2v6h-3v2H3v-2H1V6h2V3h3Z" fill={p.deep} />
                <Path d="M5 3h5v2h2v3H4V6H3V5h2Z" fill={p.grass} />
                <Path d="M3 12h10v2H3" fill={p.detail} opacity={0.3} />
              </>
            ) : null}
            {kind === "rock" ? (
              <>
                <Path d="M4 5h7v2h3v6H2V8h2Z" fill={p.detail} opacity={0.5} />
                <Path d="M5 4h5v2h2v4H3V7h2Z" fill={p.rock} />
                <Path d="M5 5h4v1H5" fill={p.sand} />
              </>
            ) : null}
            {kind === "building" ? (
              <>
                <Rect x={1} y={4} width={14} height={12} fill={p.building} />
                <Path
                  d="M0 4h16v3H0M2 1h3v3H2M7 1h3v3H7M12 1h3v3h-3"
                  fill={p.detail}
                />
                <Path d="M6 9h4v7H6" fill={p.detail} />
                <Path d="M2 8h2v4H2M12 8h2v4h-2" fill={p.sand} />
              </>
            ) : null}
          </G>
        )),
      )}
    </Svg>
  );
});
export function JourneyMap({
  character,
  journey,
  onEnter,
  onPreview,
  onArrival,
  preview = false,
}: {
  character: Character;
  journey?: Journey;
  onEnter?: () => void;
  onPreview?: (stop: Stop | undefined) => void;
  onArrival?: () => void;
  preview?: boolean;
}) {
  const t = useTier(),
    [bounds, setBounds] = useState({ width: 0, height: 0 }),
    [step, setStep] = useState(0),
    [loop, setLoop] = useState(0),
    [idle, setIdle] = useState(0);
  const { tr } = useLocale();
  const walking =
    journey?.walkingFrom !== null && journey?.walkingFrom !== undefined;
  const from = walking ? character.stops[journey!.walkingFrom!]! : undefined;
  const path = from?.pathToNext ?? [];
  useEffect(() => {
    setStep(0);
    if (!walking) return;
    let n = 0;
    const timer = setInterval(() => {
      n++;
      setStep(n);
      if (n >= path.length) {
        clearInterval(timer);
        onArrival?.();
      }
    }, rules.stepMs);
    return () => clearInterval(timer);
  }, [walking, journey?.stop, path.length, onArrival]);
  useEffect(() => {
    if (!preview) return;
    const timer = setInterval(() => setLoop((n) => n + 1), rules.stepMs);
    return () => clearInterval(timer);
  }, [preview]);
  useEffect(() => {
    const timer = setInterval(() => setIdle((n) => 1 - n), rules.idleMs);
    return () => clearInterval(timer);
  }, []);
  const previewPath = [
    character.stops[0]!.tile,
    ...character.stops[0]!.pathToNext,
  ];
  const cycle = [...previewPath, ...previewPath.slice(1, -1).reverse()];
  const location: Tile = preview
    ? cycle[loop % cycle.length]!
    : walking
      ? step
        ? path[Math.min(step, path.length) - 1]!
        : from!.tile
      : character.stops[journey?.stop ?? 0]!.tile;
  const ratio = character.tilemap.width / character.tilemap.height;
  const width = Math.min(bounds.width, bounds.height * ratio);
  const cell = width / character.tilemap.width,
    walkFrame = 2 + ((preview ? loop : step) % 2);
  const frame = walking || preview ? walkFrame : idle;
  return (
    <View
      onLayout={(e) => setBounds(e.nativeEvent.layout)}
      style={{
        direction: "ltr",
        width: "100%",
        aspectRatio: ratio,
        flexShrink: 1,
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: width || "100%",
          aspectRatio: ratio,
          overflow: "hidden",
          borderWidth: t.borderWidth,
          borderColor: t.colors.border,
          borderRadius: t.radius,
        }}
      >
        <Terrain character={character} />
        {width > 0
          ? character.stops.map((s, i) => {
              const done = !!journey?.awards[s.id],
                active =
                  i === (journey?.stop ?? 0) && journey?.phase !== "finished";
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={tr(`Chapter ${i + 1}. ${done ? "Completed" : active ? "Current stop" : "Not yet reached"}.`, `פרק ${i + 1}. ${done ? "הושלם" : active ? "התחנה הנוכחית" : "עוד לא הגענו"}.`)}
                  disabled={preview || !done}
                  onPress={() => (onPreview ? onPreview(s) : onEnter?.())}
                  onHoverIn={() => done && onPreview?.(s)}
                  onFocus={() => done && onPreview?.(s)}
                  onBlur={() => onPreview?.(undefined)}
                  style={{
                    position: "absolute",
                    left:
                      ((s.signTile?.x ?? s.tile.x + 1) + 0.5) * cell -
                      t.touch / 2,
                    top:
                      ((s.signTile?.y ?? s.tile.y + 1) + 0.5) * cell -
                      t.touch / 2,
                    width: t.touch,
                    height: t.touch,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: Math.max(26, Number(t.type.label.fontSize) + 12),
                      height: Number(t.type.label.lineHeight) + 4,
                      backgroundColor: t.terrain.sand,
                      borderColor: t.terrain.detail,
                      borderWidth: 2,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {done ? (
                      <Olive size={20} color={t.terrain.detail} />
                    ) : (
                      <Copy kind="label" style={{ color: t.terrain.detail }}>
                        {i + 1}
                      </Copy>
                    )}
                  </View>
                  <View
                    style={{
                      width: 3,
                      height: 7,
                      backgroundColor: t.terrain.detail,
                    }}
                  />
                </Pressable>
              );
            })
          : null}
        {width > 0 ? (
          <View
            pointerEvents="none"
            accessible
            accessibilityLabel={tr(`${character.name} ${walking || preview ? "walking" : `at chapter ${(journey?.stop ?? 0) + 1}`}`, `${character.name} ${walking || preview ? "בדרך" : `בפרק ${(journey?.stop ?? 0) + 1}`}`)}
            style={{
              position: "absolute",
              left: (location.x - 0.125) * cell,
              top: (location.y - 1.1) * cell + (frame % 2),
            }}
          >
            <Sprite
              id={character.id}
              size={cell * 1.25}
              frame={frame}
              walking={walking || preview}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
