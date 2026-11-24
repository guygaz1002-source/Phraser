import { Image, StyleSheet, View } from "react-native";

export const earthen = {
  background: "#291912", panel: "#4D2D20", raised: "#633925", primary: "#7F422A",
  ink: "#FFF1D5", muted: "#D5B896", gold: "#E8BC76", border: "#A1724A",
} as const;

export function EarthenBackdrop() {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, { backgroundColor: earthen.background }]}>
    <Image accessible={false} resizeMode="cover" source={require("../assets/home/earthen-ground.webp")}
      style={{ width: "100%", height: "100%" }} />
  </View>;
}

/** A recessed edge and a fine inner ruling, shared by menu plaques and question buttons. */
export function CarvedFace({ primary = false, pressed = false }: { primary?: boolean; pressed?: boolean }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, {
      overflow: "hidden", borderRadius: 9, borderWidth: 1, borderBottomWidth: pressed ? 1 : 3,
      borderColor: primary ? "#CE9760" : "#916745", borderTopColor: primary ? "#F0C28A" : "#B48A61",
      borderBottomColor: "#27160F", backgroundColor: pressed ? "#583324" : primary ? earthen.primary : earthen.panel,
    }]}>
    <Image accessible={false} resizeMode="stretch" source={require("../assets/home/tablet-glaze.png")}
      style={{ position: "absolute", width: "100%", height: "100%" }} />
    <View style={{ position: "absolute", top: 3, bottom: 3, left: 3, right: 3, borderRadius: 5, borderWidth: 1,
      borderColor: primary ? "#E7B37D55" : "#D0A07936" }} />
  </View>;
}
