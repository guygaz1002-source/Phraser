export type Language = "he" | "en";
export const gameFonts = { he: "FrankRuhlLibre", en: "EBGaramond" } as const;
export const LANGUAGE_STORAGE_KEY = "bible-journey:language:v1";
export const DEFAULT_LANGUAGE: Language = "he";
export function savedLanguage(value: string | null): Language {
  return value === "en" ? "en" : DEFAULT_LANGUAGE;
}
