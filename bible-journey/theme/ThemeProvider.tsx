import { createContext, useContext } from "react";
import { useGame } from "../src/GameProvider";
import { useLocale } from "../src/LocaleProvider";
import { tiers, type Tier } from "./tiers";
const Context = createContext<Tier>(tiers.c);
export const hebrewWorldLabels = { a: ["עולם הסיפורים", "גילאי 4 עד 7"], b: ["עולם ההרפתקאות", "גילאי 8 עד 12"], teen: ["עולם התגליות", "גילאי 13 עד 17"], c: ["עולם ההתבוננות", "גילאי 18 ומעלה"] } as const;
const clueLabels: Record<string, string> = { image: "תמונה נוספת", hint: "רמז כתוב", letter: "אות ראשונה", answer: "פתרון" };
const hebrewTiers = Object.fromEntries(Object.entries(tiers).map(([id, tier]) => [id, {
  ...tier, name: hebrewWorldLabels[tier.id][0], age: hebrewWorldLabels[tier.id][1], mapEyebrow: "מסע בתנ״ך",
  clues: tier.clues.map(clue => ({ ...clue, label: tier.id === "a" && clue.key === "image" ? "עוד תמונה" : clueLabels[clue.key] })),
  home: { ...tier.home, title: "סיפורים גדולים.\nצעד אחר צעד.", purpose: "מגלים את הסיפור דרך התמונות.", chapter: "סיפור לגלות" },
}])) as Record<keyof typeof tiers, Tier>;
export function ThemeProvider({ children }: React.PropsWithChildren) {
  const { game } = useGame();
  const { isHebrew } = useLocale();
  return <Context.Provider value={(isHebrew ? hebrewTiers : tiers)[game.tier ?? "c"]}>{children}</Context.Provider>;
}
export const ThemePreview = Context.Provider;
export const useTier = () => useContext(Context);
