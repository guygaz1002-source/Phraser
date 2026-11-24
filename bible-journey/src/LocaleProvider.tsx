import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { gameFonts, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, savedLanguage, type Language } from "./locale";
export type { Language } from "./locale";
type Locale = { language: Language; fontFamily: (typeof gameFonts)[Language]; isHebrew: boolean; direction: "rtl" | "ltr"; tr: (en: string, he: string) => string; setLanguage: (language: Language) => void };
const LocaleContext = createContext<Locale | null>(null);
export function LocaleProvider({ children }: React.PropsWithChildren) {
  const [language, updateLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const pending = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then(value => {
      if (active) updateLanguage(savedLanguage(value));
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    pending.current = pending.current.catch(() => {}).then(() => AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next));
    void pending.current.catch(() => {});
  }, []);
  const isHebrew = language === "he";
  const direction: "rtl" | "ltr" = isHebrew ? "rtl" : "ltr";
  useEffect(() => {
    if (Platform.OS !== "web") return;
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = isHebrew ? "פרייזר" : "Phraser";
  }, [language, direction, isHebrew]);
  const tr = useCallback((en: string, he: string) => isHebrew ? he : en, [isHebrew]);
  const value = useMemo(() => ({ language, fontFamily: gameFonts[language], isHebrew, direction, tr, setLanguage }), [language, isHebrew, direction, tr, setLanguage]);
  if (!ready) return <View style={{ flex: 1, backgroundColor: "#291912" }} />;
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider missing");
  return value;
}
export function LanguageSwitcher({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  const { language, direction, setLanguage, tr } = useLocale();
  return <View accessibilityRole="radiogroup" accessibilityLabel={tr("Game language", "שפת המשחק")} style={{ flexDirection: "row", direction, alignSelf: "flex-end", gap: 4, padding: 3, borderRadius: 10, borderWidth: 1, borderColor: light ? "#F7EFE066" : "#B8893B66", backgroundColor: light ? "#1B1510CC" : "#F7EFE0" }}>
    {([['he', 'עברית'], ['en', 'English']] as const).map(([id, label]) => <Pressable key={id} testID={`language-${id}`} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: language === id }} onPress={() => setLanguage(id)} style={{ minHeight: 44, minWidth: compact ? 60 : 74, paddingHorizontal: 10, justifyContent: "center", alignItems: "center", borderRadius: 7, backgroundColor: language === id ? "#E0A868" : "transparent" }}>
      <Text style={{ fontFamily: gameFonts[id], fontSize: 16, color: language === id || !light ? "#2E2419" : "#F7EFE0", writingDirection: id === "he" ? "rtl" : "ltr" }}>{label}</Text>
    </Pressable>)}
  </View>;
}
