import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const STAR = "M12 1.8l3.1 6.5 7.1.9-5.2 5 1.3 7.1L12 17.9 5.7 21.3 7 14.2 1.8 9.2l7.1-.9z";

export function Star({ size = 24, filled = true }: { size?: number; filled?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <Path d={STAR} fill={filled ? "#F2C867" : "#5A3A2A"} stroke={filled ? "#855623" : "#7A5740"} strokeWidth={1.4} strokeLinejoin="round" />
    {filled && <Path d="M12 5.2l1.9 4 4.3.6" fill="none" stroke="#FFF0BE" strokeWidth={1} strokeLinecap="round" />}
  </Svg>;
}

/** Three stars that pop in one after another. With reduced motion they are simply shown. */
export function StarRow({ earned, size = 46, animate = true }: { earned: number; size?: number; animate?: boolean }) {
  const reduced = useReducedMotion();
  const pops = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const moving = animate && !reduced;
  useEffect(() => {
    if (!moving) return;
    const run = Animated.stagger(190, pops.map(value => Animated.timing(value, { toValue: 1, duration: 320,
      easing: Easing.out(Easing.back(2.2)), useNativeDriver: Platform.OS !== "web", isInteraction: false })));
    run.start();
    return () => run.stop();
  }, [moving, pops]);
  return <View style={{ direction: "ltr", flexDirection: "row", gap: size * .14, alignItems: "flex-end" }}>
    {[0, 1, 2].map(i => <Animated.View key={i} style={{ marginBottom: i === 1 ? size * .16 : 0,
      ...(moving ? { opacity: pops[i]!.interpolate({ inputRange: [0, .3, 1], outputRange: [0, 1, 1] }), transform: [{ scale: pops[i]! }] } : {}) }}>
      <Star size={size} filled={i < earned} />
    </Animated.View>)}
  </View>;
}

export function Flame({ size = 20 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <Path d="M12.4 2c.6 3.4 5.6 5.6 5.6 11.1A6 6 0 016 13.100c0-2.2 1.1-3.7 2.3-4.9.300 1.7 1 2.6 2 3.100C10 8 10.6 4.6 12.4 2z" fill="#F08A4B" stroke="#7A3317" strokeWidth={1.3} strokeLinejoin="round" />
    <Path d="M12 12.500c1.5 1.2 2.3 2.3 2.3 3.700a2.3 2.3 0 01-4.6 0c0-1.4.900-2.3 2.3-3.700z" fill="#FFE09C" />
  </Svg>;
}
