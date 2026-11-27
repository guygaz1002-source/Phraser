import "react-native-reanimated";
import { useEffect, useState, type PropsWithChildren } from "react";
import { Stack, useGlobalSearchParams, usePathname } from "expo-router";
import { ActivityIndicator, I18nManager, Modal, Platform, Text, View } from "react-native";
import { FontDisplay, useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GameProvider, useGame } from "../src/GameProvider";
import { ThemeProvider, useTier } from "../theme/ThemeProvider";
import { Copy, Screen } from "../src/components";
import { gameFonts } from "../src/locale";
import { LocaleProvider, useLocale } from "../src/LocaleProvider";
import { AgeGate } from "../src/AgeGate";
import { StorageRecovery } from "../src/StorageRecovery";
import "../src/demoReset";
import "../src/sound";
// Every screen sets its own text direction from the chosen language, exactly as on the web.
// Keep the phone's system direction from mirroring those layouts a second time.
if (Platform.OS !== "web") {
  try { I18nManager.allowRTL(false); I18nManager.swapLeftAndRightInRTL(false); } catch { /* keep the system default */ }
}
function AppStatusBar() {
  return <StatusBar style="light" />;
}
function AppStack() {
  const pathname = usePathname();
  const { screen } = useGlobalSearchParams<{ screen?: string }>();
  const { tr } = useLocale();
  const { ready, error, game } = useGame(),
    t = useTier();
  if (!ready && error) return <StorageRecovery />;
  if (!ready)
    return (
      <Screen>
        <Copy>{tr("Opening the book…", "פותחים את הספר…")}</Copy>
      </Screen>
    );
  const choosingAge = pathname === "/" && screen === "age";
  const assignSave = !choosingAge && game.pendingSchoolSplit && (game.tier === "b" || game.tier === "teen");
  return (
    <View style={{ flex: 1 }}>
    {assignSave ? <AgeGate assignSave /> : <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: t.motion.duration,
        gestureEnabled: false,
        contentStyle: { backgroundColor: "#291912" },
      }}
    />}
    {/* Keep navigation and the interrupted screen mounted during save recovery. */}
    {error ? <Modal visible animationType="none" onRequestClose={() => {}}>
      <StorageRecovery />
    </Modal> : null}
    </View>
  );
}
const fontSource = (uri: number) => ({ uri, display: FontDisplay.SWAP });
function FontBoot({ children }: PropsWithChildren) {
  const { isHebrew, direction, tr, fontFamily } = useLocale();
  const [hebrewLoaded, hebrewError] = useFonts({
    [gameFonts.he]: fontSource(require("../assets/fonts/FrankRuhlLibre-SemiBold.ttf")),
  });
  const [englishLoaded, englishError] = useFonts({
    [gameFonts.en]: fontSource(require("../assets/fonts/EBGaramond-Medium.ttf")),
  });
  const [opened, setOpened] = useState(false);
  const usable = isHebrew ? hebrewLoaded || !!hebrewError : englishLoaded || !!englishError;
  useEffect(() => {
    if (usable) setOpened(true);
  }, [usable]);
  useEffect(() => {
    // Use readable system fonts on a slow connection; late fonts swap in normally.
    const timer = setTimeout(() => setOpened(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  if (!opened && !usable) return (
    <View style={{ flex: 1, backgroundColor: "#291912", alignItems: "center", justifyContent: "center", padding: 24, gap: 16, direction }}>
      <ActivityIndicator color="#E8BC76" />
      <Text accessibilityLiveRegion="polite" style={{ fontFamily, color: "#FFF1D5", fontSize: 20, lineHeight: 30, textAlign: "center", writingDirection: direction }}>{tr("Opening the book…", "פותחים את הספר…")}</Text>
    </View>
  );
  return children;
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider><FontBoot><GameProvider>
        <ThemeProvider>
          <AppStatusBar />
          <AppStack />
        </ThemeProvider>
      </GameProvider></FontBoot></LocaleProvider>
    </SafeAreaProvider>
  );
}
