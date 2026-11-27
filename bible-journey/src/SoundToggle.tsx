import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useLocale } from "./LocaleProvider";
import { soundAvailable, useSoundMuted } from "./sound";

/** Speaker button, styled to sit beside the language switcher. Renders nothing where sound is unavailable. */
export function SoundToggle() {
  const { tr } = useLocale();
  const [muted, toggle] = useSoundMuted();
  if (!soundAvailable) return null;
  return <Pressable testID="sound-toggle" accessibilityRole="button" onPress={toggle}
    accessibilityLabel={muted ? tr("Turn sound on", "הפעלת הצלילים") : tr("Mute sound", "השתקת הצלילים")}
    style={({ pressed }) => ({ width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1,
      borderColor: "#F7EFE066", backgroundColor: "#1B1510CC", opacity: pressed ? .7 : 1, outlineColor: "#E8BC76" })}>
    <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
      <Path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill={muted ? "#D5B896" : "#E8BC76"} />
      {muted
        ? <Path d="M15.5 9.5l5 5m0-5l-5 5" stroke="#D5B896" strokeWidth={1.8} strokeLinecap="round" fill="none" />
        : <Path d="M15 9.2a4 4 0 010 5.6M17.6 6.8a7.4 7.4 0 010 10.4" stroke="#E8BC76" strokeWidth={1.8} strokeLinecap="round" fill="none" />}
    </Svg>
  </Pressable>;
}
