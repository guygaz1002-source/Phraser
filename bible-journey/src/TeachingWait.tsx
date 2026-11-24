import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useTier } from "../theme/ThemeProvider";
import { Sprite } from "./JourneyMap";
import { rules } from "./game";
import { useLocale } from "./LocaleProvider";

function Hairline() {
  const t = useTier();
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = withTiming(1, { duration: 4000, easing: Easing.linear });
  }, [value]);
  const style = useAnimatedStyle(() => ({ width: `${value.value * 100}%` }));
  return (
    <View
      style={{ width: "100%", height: 1, backgroundColor: t.colors.border }}
    >
      <Animated.View
        style={[{ height: 1, backgroundColor: t.colors.accent }, style]}
      />
    </View>
  );
}

function Arrow() {
  const t = useTier();
  const { isHebrew } = useLocale();
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.2, { duration: 500 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[style, { transform: [{ scaleX: isHebrew ? -1 : 1 }] }]}>
      <Svg width={24} height={20} viewBox="0 0 24 20" aria-hidden>
        <Path d="M2 3L17 10L2 17Z" fill={t.colors.accent} />
      </Svg>
    </Animated.View>
  );
}

function Walker() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setStep((value) => (value + 1) % 12),
      rules.stepMs,
    );
    return () => clearInterval(timer);
  }, []);
  const position = (step <= 6 ? step : 12 - step) * 12;
  const frame = 2 + (step % 2);
  return (
    <View style={{ direction: "ltr", width: 120, height: 66, alignSelf: "center" }}>
      <View style={{ position: "absolute", left: position, top: step % 2 }}>
        <Sprite size={32} frame={frame} walking />
      </View>
    </View>
  );
}

const indicators = { sprite: Walker, arrow: Arrow, hairline: Hairline };
export function TeachingWait() {
  const t = useTier();
  const { tr } = useLocale();
  const Indicator = indicators[t.wait];
  return (
    <View
      accessibilityLabel={tr("Taking a moment with the story", "רגע להתבוננות בסיפור")}
      style={{ minHeight: 32, justifyContent: "center" }}
    >
      <Indicator />
    </View>
  );
}
