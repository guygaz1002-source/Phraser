import type { ReactNode } from "react";
import { Image as Painting } from "expo-image";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CarvedFace, EarthenBackdrop, earthen } from "./EarthenSurface";
import { LanguageSwitcher, useLocale } from "./LocaleProvider";

export const trailArt = require("../assets/home/adventure-home-v1.webp") as number;
export const storyArt = require("../assets/home/storybook-home-v1.webp") as number;
export const illuminatedArt = require("../assets/home/illuminated-home-v1.webp") as number;
const book = require("../assets/title/cover.png");

export function MenuText({ children, size = 18, color = earthen.ink, title = false, center = false }: {
  children: ReactNode; size?: number; color?: string; title?: boolean; center?: boolean;
}) {
  const { fontFamily, direction, isHebrew } = useLocale();
  return <Text accessibilityRole={title ? "header" : undefined} style={{
    fontFamily, fontSize: size, lineHeight: Math.ceil(size * (title ? 1.16 : 1.27)), color,
    writingDirection: direction, textAlign: center ? "center" : isHebrew ? "right" : "left",
  }}>{children}</Text>;
}

export function FolioIllustration({ image, height, framed = true }: { image: number; height: number; framed?: boolean }) {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ height, borderRadius: 9, padding: framed ? 5 : 0, borderWidth: framed ? 1 : 0, backgroundColor: "#352016", borderColor: "#A87547" }}>
    <View style={{ flex: 1, borderRadius: 4, overflow: "hidden", borderColor: "#D7A767", borderWidth: framed ? 1 : 0 }}>
      <Painting accessible={false} contentFit="cover" contentPosition={height < 160 && image === storyArt ? { top: "22%" } : "center"}
        source={image} style={{ width: "100%", height: "100%" }} />
      <View style={[StyleSheet.absoluteFill, { borderWidth: 3, borderColor: "#32201548" }]} />
    </View>
  </View>;
}

export function MenuFrame({ title, image = trailArt, children, back, onBack, testID }: {
  title: string; image?: number; children: ReactNode; back?: string; onBack?: () => void; testID: string;
}) {
  const { tr, direction } = useLocale();
  const { width, height } = useWindowDimensions(), wide = width >= 840;
  const artHeight = wide ? Math.max(336, Math.min(510, height * .56)) : Math.max(55, Math.min(109, height * .13));
  return <SafeAreaView testID={testID} style={{ flex: 1, direction, backgroundColor: earthen.background }}>
    <EarthenBackdrop />
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ width: "100%", maxWidth: 1160, alignSelf: "center", flexGrow: 1, paddingHorizontal: wide ? 48 : 18, paddingTop: wide ? 25 : 8, paddingBottom: wide ? 28 : 14 }}>
        <View style={{ direction, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          gap: 12, paddingBottom: wide ? 17 : 8, borderBottomWidth: 1, borderColor: "#9869407D" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Image source={book} accessible={false} resizeMode="contain" style={{ width: 29, height: 37 }} />
            <MenuText size={26} color={earthen.gold}>{tr("Phraser", "פרייזר")}</MenuText>
          </View>
          <LanguageSwitcher light compact />
        </View>
        <View style={{ flexGrow: 1, justifyContent: "center", paddingTop: wide ? 30 : 14, paddingBottom: wide ? 30 : 10 }}>
          <View style={{ flexDirection: wide ? "row-reverse" : "column", alignItems: wide ? "center" : "stretch", gap: wide ? 50 : 14 }}>
            <View style={wide ? { flex: .92 } : undefined}><FolioIllustration image={image} height={artHeight} /></View>
            <View style={{ flex: wide ? 1 : undefined, gap: wide ? 17 : 10 }}>
              <MenuText size={wide ? 46 : 32} title>{title}</MenuText>
              {children}
              {onBack && back ? <Pressable accessibilityRole="button" accessibilityLabel={back} onPress={onBack}
                style={({ pressed }) => ({ alignSelf: "flex-start", justifyContent: "center", minHeight: 44, paddingHorizontal: 4, opacity: pressed ? .65 : 1, outlineColor: earthen.gold })}>
                <MenuText size={17} color={earthen.muted}>{back}</MenuText>
              </Pressable> : null}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function PlayerSeal({ pair = false }: { pair?: boolean }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{
    width: 43, height: 43, borderRadius: 22, borderWidth: 1, borderColor: "#D6A06D", backgroundColor: "#38241A",
    direction: "ltr", flexDirection: "row", alignItems: "center", justifyContent: "center",
  }}>
    {(pair ? [0, 1] : [0]).map(n => <View key={n} style={{ alignItems: "center", marginLeft: n ? -2 : 0 }}>
      <View style={{ width: pair ? 7 : 9, height: pair ? 7 : 9, borderRadius: 5, backgroundColor: n ? "#C99463" : earthen.gold }} />
      <View style={{ marginTop: 2, width: pair ? 14 : 18, height: pair ? 8 : 10, borderTopLeftRadius: 10, borderTopRightRadius: 10,
        backgroundColor: n ? "#C99463" : earthen.gold }} />
    </View>)}
  </View>;
}

export function MenuChoice({ title, detail, onPress, label, prefix, primary = false, testID }: {
  title: string; detail?: string; onPress: () => void; label?: string; prefix?: ReactNode; primary?: boolean; testID?: string;
}) {
  const { direction, isHebrew } = useLocale();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label ?? (detail ? title + ". " + detail : title)}
    onPress={onPress} style={({ pressed }) => ({ direction, flexDirection: "row", alignItems: "center", minHeight: 66,
      paddingVertical: 10, paddingHorizontal: 18, gap: 14, outlineColor: earthen.gold, borderRadius: 9,
      transform: [{ translateY: pressed ? 1 : 0 }] })}>
    {({ pressed }) => <>
      <CarvedFace primary={primary} pressed={pressed} />
      {prefix}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <MenuText size={24}>{title}</MenuText>
        {detail ? <MenuText size={16} color={earthen.muted}>{detail}</MenuText> : null}
      </View>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ width: 10, height: 10, borderRightWidth: 1.5, borderTopWidth: 1.5, borderColor: earthen.gold,
          transform: [{ rotate: isHebrew ? "-135deg" : "45deg" }] }} />
    </>}
  </Pressable>;
}
