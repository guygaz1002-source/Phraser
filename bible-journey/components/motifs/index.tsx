import Svg, {
  Path,
  Rect,
  Ellipse,
  Pattern,
  Defs,
  Circle,
  G,
} from "react-native-svg";
import { useId } from "react";
import { StyleSheet, View } from "react-native";
import { useTier } from "../../theme/ThemeProvider";
export function Olive({ size = 28, color }: { size?: number; color?: string }) {
  const t = useTier();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <Path
        d="M7 27Q13 14 26 5"
        fill="none"
        stroke={color ?? t.colors.accent}
        strokeWidth="1.5"
      />
      <Path
        d="M13 19C2 18 5 8 14 16C16 5 25 7 17 15C24 13 29 16 19 20"
        fill={color ?? t.colors.accent}
      />
    </Svg>
  );
}
export function Eye() {
  const t = useTier();
  return (
    <Svg width={30} height={24} viewBox="0 0 30 24" aria-hidden>
      <Path
        d="M2 12Q15-3 28 12Q15 27 2 12Z"
        fill="none"
        stroke={t.colors.ink}
        strokeWidth={2}
      />
      <Circle cx={15} cy={12} r={4} fill={t.colors.ink} />
    </Svg>
  );
}
export function Grain() {
  const t = useTier(),
    id = useId().replace(/:/g, "");
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" aria-hidden>
        <Defs>
          <Pattern id={id} width={29} height={31} patternUnits="userSpaceOnUse">
            <Circle cx={3} cy={5} r={0.65} fill={t.colors.ink} />
            <Circle cx={21} cy={16} r={0.45} fill={t.colors.ink} />
            <Path d="M9 25h3M16 8h2" stroke={t.colors.ink} strokeWidth={0.5} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} opacity={0.05} />
      </Svg>
    </View>
  );
}
export function Arch({
  children,
  height = 220,
}: React.PropsWithChildren<{ height?: number }>) {
  const t = useTier();
  return (
    <View
      style={{
        height,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 200 240"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        aria-hidden
      >
        <Path
          d="M5 237V100C5-24 195-24 195 100V237Z"
          fill={t.colors.panel}
          stroke={t.colors.border}
          strokeWidth={t.borderWidth}
        />
        <Path
          d="M15 237V100C15-10 185-10 185 100V237"
          fill="none"
          stroke={t.colors.border}
          strokeWidth={1}
        />
      </Svg>
      <View
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {children}
      </View>
    </View>
  );
}
export function ScrollEdge({ bottom = false }: { bottom?: boolean }) {
  const t = useTier();
  return (
    <Svg
      width="100%"
      height={14}
      viewBox="0 0 400 14"
      preserveAspectRatio="none"
      aria-hidden
      style={{ transform: [{ rotate: bottom ? "180deg" : "0deg" }] }}
    >
      <Path
        d="M0 11L17 8L38 11L57 6L79 9L103 5L129 9L152 6L178 8L207 5L231 8L259 5L282 10L304 7L332 10L356 6L381 9L400 6V14H0Z"
        fill={t.colors.panel}
      />
      <Path
        d="M0 11L17 8L38 11L57 6L79 9L103 5L129 9L152 6L178 8L207 5L231 8L259 5L282 10L304 7L332 10L356 6L381 9L400 6"
        fill="none"
        stroke={t.colors.border}
      />
    </Svg>
  );
}
export function ClayTablet({ fill, stroke }: { fill: string; stroke: string }) {
  const t = useTier();
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 320 80"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      aria-hidden
    >
      <Path
        d={`M${t.radius + 2} 2L${316 - t.radius} 4Q318 5 318 ${t.radius + 4}L316 ${76 - t.radius}Q315 78 ${316 - t.radius} 78L${t.radius + 1} 76Q2 75 2 ${76 - t.radius}L4 ${t.radius + 2}Q5 2 ${t.radius + 2} 2Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={t.borderWidth}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
export function BushIllustration() {
  const t = useTier();
  return (
    <Svg width="100%" height="100%" viewBox="0 0 320 240" aria-hidden>
      <Path
        d="M0 240V196L71 132L122 181L188 97L320 202V240"
        fill={t.colors.panel}
        stroke={t.colors.border}
      />
      <Path d="M0 219Q85 193 151 219T320 210V240H0" fill={t.terrain.sand} />
      <G stroke={t.colors.ink} strokeWidth="2" fill="none">
        <Path d="M180 217V161M180 198L155 177M180 187L204 167M180 176L165 154" />
      </G>
      <G fill={t.terrain.grass}>
        <Ellipse cx={154} cy={169} rx={19} ry={13} />
        <Ellipse cx={185} cy={150} rx={27} ry={16} />
        <Ellipse cx={210} cy={172} rx={21} ry={17} />
        <Ellipse cx={175} cy={184} rx={27} ry={18} />
      </G>
      <Path
        d="M174 192C142 170 182 164 173 137C200 156 205 177 189 194C196 174 179 165 183 155C168 171 184 181 174 192Z"
        fill={t.colors.accent}
      />
      <G fill={t.colors.ink}>
        <Path d="M73 180Q71 159 81 158Q92 162 90 183L102 212H62Z" />
        <Circle cx={81} cy={151} r={9} />
        <Path d="M106 157V218" stroke={t.colors.ink} strokeWidth={3} />
      </G>
      <Path d="M30 230H288" stroke={t.colors.border} />
    </Svg>
  );
}
