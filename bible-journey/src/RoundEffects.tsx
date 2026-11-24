import Svg, { Circle, Path } from "react-native-svg";

export function Coin({ size = 24 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <Circle cx="16" cy="16" r="14" fill="#E7B768" stroke="#855623" strokeWidth="2" />
    <Circle cx="16" cy="16" r="10" fill="none" stroke="#FFF0BE" strokeWidth="1" />
    <Path d="M16 9v14m-4-11 4-3 4 3" stroke="#65401C" strokeWidth="2" fill="none" />
  </Svg>;
}
