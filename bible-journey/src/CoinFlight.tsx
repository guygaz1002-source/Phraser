import { useEffect, useRef, type ComponentRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import { Coin } from "./RoundEffects";

export type ViewHandle = ComponentRef<typeof View>;
type Rect = Pick<DOMRect, "x" | "y" | "width" | "height">;
type Point = { x: number; y: number };
type Flight = { from: Point; to: Point; width: number };
const SIZE = 30;

// Capture the pressed answer before feedback or keyboard dismissal changes its position.
export function measureFlight(answer: ViewHandle | null, wallet: ViewHandle | null, layer: ViewHandle | null): Flight | null {
  const source = answer?.getBoundingClientRect();
  const target = wallet?.getBoundingClientRect();
  const frame = layer?.getBoundingClientRect();
  if (!source?.height || !target?.height || !frame?.height) return null;
  const center = (rect: Rect): Point => ({
    x: rect.x + rect.width / 2 - frame.x,
    y: rect.y + rect.height / 2 - frame.y,
  });
  const from = center(source);
  from.y = Math.max(SIZE / 2, Math.min(frame.height - SIZE / 2, from.y));
  return { from, to: center(target), width: frame.width };
}

export function CoinFlight({ path, onLand }: { path: Flight; onLand: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const tween = Animated.timing(progress, { toValue: 1, duration: 620,
      easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== "web", isInteraction: false });
    tween.start(({ finished }) => { if (finished) onLand(); });
    return () => tween.stop();
  }, [path, onLand, progress]);
  const { from, to, width } = path;
  const bend = (from.x < width / 2 ? 1 : -1) * Math.min(44, Math.abs(from.y - to.y) * 0.16);
  const lift = Math.min(82, Math.abs(to.y - from.y) * 0.22);
  const inputRange = [0, 0.25, 0.5, 0.75, 1];
  const axis = (a: number, b: number, curve: number) => progress.interpolate({ inputRange,
    outputRange: inputRange.map(t => a + (b - a) * t + 4 * t * (1 - t) * curve - SIZE / 2) });
  return <Animated.View testID="coin-flight" style={{ position: "absolute", top: 0, left: 0, width: SIZE, height: SIZE,
    transform: [{ translateX: axis(from.x, to.x, bend) }, { translateY: axis(from.y, to.y, -lift) },
      { scale: progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.85, 1.2, 0.8] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["-35deg", "360deg"] }) }] }}>
    <Coin size={SIZE} />
  </Animated.View>;
}
