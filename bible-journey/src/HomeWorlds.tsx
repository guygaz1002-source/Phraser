import { View } from "react-native";
import { useGame } from "./GameProvider";
import { useLocale } from "./LocaleProvider";
import { MenuFrame, MenuText, illuminatedArt, storyArt, trailArt } from "./MenuFrame";
import { earthen } from "./EarthenSurface";
import type { Profile } from "./types";

export function hasJourneyFolio(profile: Profile) {
  return Object.values(profile.journeys).some(journey =>
    (journey.expedition?.phase ?? journey.phase) === "finished" || (journey.expedition?.landmark ?? journey.stop) >= 4);
}

export function JourneyFolio({ onClose }: { onClose: () => void }) {
  const { game } = useGame();
  const { tr } = useLocale();
  const child = game.tier === "a", adult = game.tier === "c";
  return <MenuFrame testID="unlocked-folio" title={tr("Every story opens a new path", "כל סיפור פותח דרך חדשה")}
    image={child ? storyArt : adult ? illuminatedArt : trailArt}
    back={tr("Back to my journey", "חזרה למסע שלי")} onBack={onClose}>
    <View style={{ gap: 8 }}>
      <MenuText color={earthen.gold}>{tr("Illustration from your first map", "איור מהמפה הראשונה שהשלמתם")}</MenuText>
      <MenuText size={20}>{child || adult
        ? tr("Moses turns aside from his flock to look at a bush burning in the wilderness. Exodus 3, verses 1–3.",
             "משה עוזב לרגע את הצאן כדי להתבונן בסנה הבוער במדבר. שמות ג׳, פסוקים א׳–ג׳.")
        : tr("A path winds from the water into the hills. Springs, shade and open ground guide the traveller through this imagined biblical landscape.",
             "השביל מטפס מן המים אל הגבעות. מעיין, צל ואדמה פתוחה מכוונים את ההולכים בנוף המקראי שדמיין המאייר.")}</MenuText>
    </View>
  </MenuFrame>;
}
