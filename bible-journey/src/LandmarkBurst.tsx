import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const SPARKS = 12, SIZE = 22;
const tones = ["#FFE09C", "#E8BC76", "#FFF1D5"];

/** A one-shot ring of gold sparks over the map when a landmark is completed. Purely decorative. */
export function LandmarkBurst() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const burst = Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web", isInteraction: false });
    burst.start();
    return () => burst.stop();
  }, [progress]);
  return <View testID="landmark-burst" pointerEvents="none" style={{ position: "absolute", top: "24%", left: "50%", width: 0, height: 0 }}>
    {Array.from({ length: SPARKS }, (_, i) => {
      const angle = (i / SPARKS) * Math.PI * 2 + (i % 2 ? .22 : 0), reach = i % 2 ? 132 : 88;
      return <Animated.View key={i} style={{ position: "absolute", left: -SIZE / 2, top: -SIZE / 2, width: SIZE, height: SIZE,
        opacity: progress.interpolate({ inputRange: [0, .12, .65, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * reach] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * reach * .8] }) },
          { scale: progress.interpolate({ inputRange: [0, .3, 1], outputRange: [.3, i % 2 ? 1 : .7, .4] }) },
          { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", i % 2 ? "70deg" : "-70deg"] }) },
        ] }}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" aria-hidden>
          <Path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" fill={tones[i % tones.length]} stroke="#855623" strokeWidth={1} />
        </Svg>
      </Animated.View>;
    })}
  </View>;
}
