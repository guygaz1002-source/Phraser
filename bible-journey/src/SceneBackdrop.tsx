import { StyleSheet, View } from "react-native";
import Svg, { Path, Rect, G } from "react-native-svg";
import { useTier } from "../theme/ThemeProvider";
export type SceneKind = "desert" | "palace" | "sea";
export function SceneBackdrop({ scene }: { scene: SceneKind }) {
  const t = useTier();
  const palette = t.scenes[scene];
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: palette.background }]}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 400 900"
        aria-hidden
      >
        {scene === "desert" ? (
          <>
            <Path
              d="M0 170Q80 115 145 170T400 120V0H0Z"
              fill={palette.detail}
              opacity={0.2}
            />
            <Path
              d="M0 780Q100 650 220 770T400 740V900H0Z"
              fill={palette.detail}
              opacity={0.35}
            />
            <Path
              d="M0 840Q100 720 230 820T400 790"
              fill="none"
              stroke={palette.detail}
              strokeWidth={2}
            />
          </>
        ) : scene === "palace" ? (
          <G fill={palette.detail} opacity={0.28}>
            {[8, 370].map((x) => (
              <G key={x}>
                <Rect x={x} y={80} width={22} height={730} />
                <Rect x={x - 5} y={70} width={32} height={18} />
                <Path
                  d={`M${x} 100l11 12 11-12M${x} 130l11 12 11-12`}
                  stroke={t.colors.background}
                  strokeWidth={3}
                  fill="none"
                />
              </G>
            ))}
            <Path d="M0 840h400v60H0Z" />
          </G>
        ) : (
          <G fill="none" stroke={palette.detail} strokeWidth={3} opacity={0.38}>
            {[50, 78, 106, 730, 770, 810, 850].map((y) => (
              <Path
                key={y}
                d={`M-40 ${y}q40-20 80 0t80 0t80 0t80 0t80 0t80 0`}
              />
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
}
