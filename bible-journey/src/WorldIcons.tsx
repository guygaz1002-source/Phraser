import Svg, { Path } from "react-native-svg";
import type { Direction } from "./exploration";

// Original clay, wood and bronze pixel objects from the life-journey game.
export function QuestItem({ item, size = 32 }: { item: string; size?: number }) {
  return <Svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
    {item === "jar" ? <>
      <Path d="M11 4h10v5l4 5v13H7V14l4-5z" fill="#bd8050" />
      <Path d="M11 4h10v3H11zM7 17h18v3H7z" fill="#efd08b" />
      <Path d="M10 13h3v11h-3z" fill="#dba968" />
    </> : item === "staff" ? <>
      <Path d="M15 4h9v4h-6v22h-4V8h-3V4z" fill="#a77544" />
      <Path d="M16 9h2v19h-2zM14 4h7v2h-7z" fill="#efd08b" />
    </> : item === "seal" ? <>
      <Path d="M13 3h6v7h-6zM8 12h16v4h4v10h-4v4H8v-4H4V16h4z" fill="#c49858" />
      <Path d="M10 15h12v11H10z" fill="#f2d18b" />
      <Path d="M14 16h4v8h-4zM11 19h10v2H11z" fill="#806341" />
    </> : <>
      <Path d="M5 19h23v5h-4v4H9v-4H5zM3 16h8v4H3z" fill="#bd8050" />
      <Path d="M6 10h4v8H6z" fill="#efbf64" /><Path d="M7 7h2v8H7z" fill="#f7e8a6" />
      <Path d="M11 20h13v3H11z" fill="#e7bf7b" />
    </>}
  </Svg>;
}
export function ScrollIcon() {
  return <Svg viewBox="0 0 32 32" width={30} height={30} aria-hidden>
    <Path d="M8 4h20v22H8zM4 4h6v5H4zM8 24h20v5H8z" fill="#f7e8bc" stroke="#65451f" strokeWidth={2} />
    <Path d="M14 10h9M14 15h9M14 20h6" stroke="#956e32" strokeWidth={2} />
  </Svg>;
}
export function ArrowIcon({ direction, color }: { direction: Direction; color: string }) {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[direction];
  return <Svg viewBox="0 0 24 24" width={24} height={24} aria-hidden>
    <Path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" rotation={rotation} origin="12,12" />
  </Svg>;
}
