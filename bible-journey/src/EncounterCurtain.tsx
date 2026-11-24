import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
/** A single closing/opening iris, never a flashing strobe. */
export function EncounterCurtain({ closing = false }: { closing?: boolean }) {
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const coverage = useSharedValue(closing ? 0 : 1);
  useEffect(() => {
    coverage.value = withTiming(closing ? 1 : 0, {
      duration: reduced ? 0 : 420,
      easing: Easing.inOut(Easing.quad),
    });
  }, [closing, coverage, reduced]);
  const top = useAnimatedStyle(() => ({
    transform: [{ translateY: -(1 - coverage.value) * (height / 2 + 2) }],
  }));
  const bottom = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - coverage.value) * (height / 2 + 2) }],
  }));
  return (
    <Animated.View
      pointerEvents={closing ? "auto" : "none"}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { zIndex: 100, overflow: "hidden" }]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: "50.2%",
            backgroundColor: "#1B1510",
          },
          top,
        ]}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "50.2%",
            backgroundColor: "#1B1510",
          },
          bottom,
        ]}
      />
    </Animated.View>
  );
}
