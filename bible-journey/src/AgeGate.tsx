import { router } from "expo-router";
import { View } from "react-native";
import { hebrewWorldLabels } from "../theme/ThemeProvider";
import { tiers } from "../theme/tiers";
import { earthen } from "./EarthenSurface";
import { useGame } from "./GameProvider";
import { useLocale } from "./LocaleProvider";
import { MenuChoice, MenuFrame, MenuText } from "./MenuFrame";
import { tierIds } from "./types";

export function AgeGate({ fresh = false, assignSave = false }: { fresh?: boolean; assignSave?: boolean }) {
  const { game, dispatch } = useGame();
  const { tr } = useLocale();
  return <MenuFrame testID="age-menu" title={tr("Choose your age group", "בחירת קבוצת גיל")}
    back={assignSave ? undefined : tr("Back to the book", "חזרה לספר")} onBack={assignSave ? undefined : () => router.dismissTo("/")}>
    {game.pendingSchoolSplit && <MenuText size={17} color={earthen.muted}>{tr(
      "Choose 8–12 or 13–17 to keep your saved 8–17 journey and tokens in that group.",
      "בחרו 8–12 או 13–17 כדי לשייך לקבוצה הזאת את המסע והמטבעות ששמרתם בגילי 8–17.")}</MenuText>}
    <View style={{ gap: 8 }}>
      {tierIds.filter(id => !assignSave || id === "b" || id === "teen").map(id => {
        const age = tr(tiers[id].age, hebrewWorldLabels[id][1]);
        const name = tr(tiers[id].name, hebrewWorldLabels[id][0]);
        return <MenuChoice key={id} testID={`age-${id}`} title={age} detail={name}
          label={`${age.replace(" עד ", "–")}. ${name}.`} onPress={() => {
            if (game.pendingSchoolSplit && (id === "b" || id === "teen")) {
              dispatch({ type: "assign-school-profile", tier: id });
              if (assignSave) return;
            } else {
              dispatch({ type: "tier", tier: id });
            }
            router.push(fresh ? "/home?start=new" : "/home");
          }} />;
      })}
    </View>
  </MenuFrame>;
}
