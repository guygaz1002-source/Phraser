import { useState } from "react";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Pressable, View } from "react-native";
import { useCharacters } from "../src/localizedCatalog";
import { useLocale } from "../src/LocaleProvider";
import { activeProfile } from "../src/game";
import { useGame } from "../src/GameProvider";
import { Sprite } from "../src/JourneyMap";
import { MenuChoice, MenuFrame, MenuText, storyArt, trailArt } from "../src/MenuFrame";
import { hasJourneyFolio } from "../src/HomeWorlds";
import { earthen } from "../src/EarthenSurface";

export default function Characters() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const [restartId, setRestartId] = useState<string | null>(null);
  const { game, dispatch } = useGame(), { tr } = useLocale(), characters = useCharacters();
  if (!game.tier) return <Redirect href="/?screen=age" />;
  const profile = activeProfile(game, game.tier);
  const selected = characters.find(c => c.id === restartId);
  const descriptions: Record<string, string> = {
    moses: tr("From the reeds of the Nile to the wilderness", "מקני היאור ועד המדבר"),
    samson: tr("Riddles, strength and a hidden secret", "חידות, גבורה וסוד שמור"),
    noah: tr("From the ark to the rainbow", "מן התיבה ועד הקשת"),
  };
  const image = game.tier === "a" ? storyArt : trailArt;
  if (start === "new" && selected) return <MenuFrame testID="restart-menu" image={image}
    title={tr(`Restart ${selected.name}’s journey?`, `להתחיל מחדש את המסע של ${selected.name}?`)}
    back={tr("Back to characters", "חזרה לבחירת דמות")} onBack={() => setRestartId(null)}>
    <MenuText size={19} color={earthen.muted}>{tr(
      "Starting again replaces this character’s saved progress for the selected age group and play mode.",
      "התחלה מחדש תחליף את ההתקדמות השמורה של הדמות בקבוצת הגיל ובמצב המשחק שבחרתם.")}</MenuText>
    <MenuChoice primary title={tr("Start from the first map", "התחלה מהמפה הראשונה")} onPress={() => {
      dispatch({ type: "restart-journey", id: selected.id }); setRestartId(null); router.replace("/journey");
    }} />
  </MenuFrame>;
  return <MenuFrame testID="character-menu" image={image} title={tr("Choose your companion", "בחירת דמות למסע")}
    back={tr("Change play mode", "בחירת מצב משחק אחר")} onBack={() => router.dismissTo(start === "new" ? "/home?start=new" : "/home")}>
    <View style={{ gap: 10 }}>
      {characters.filter(c => c.stops.length).map(c => {
        const journey = profile.journeys[c.id];
        const phase = journey?.expedition?.phase ?? journey?.phase;
        const label = start === "new" && journey ? tr("Start over", "התחלה מחדש")
          : phase === "finished" ? tr("View your completed journey", "פתיחת המסע שהושלם")
          : phase === "game-over" ? tr("View results", "הצגת התוצאה")
          : journey ? tr("Continue journey", "המשך המסע") : tr("Begin journey", "תחילת המסע");
        const landmark = journey?.expedition?.landmark ?? journey?.stop ?? 0;
        const detail = !journey ? descriptions[c.id] : start === "new" || phase === "finished" || phase === "game-over" ? label
          : tr(`Map ${Math.floor(landmark / 4) + 1} · Landmark ${landmark % 4 + 1} of 4`,
            `מפה ${Math.floor(landmark / 4) + 1} · נקודת ציון ${landmark % 4 + 1} מתוך 4`);
        return <MenuChoice key={c.id} testID={`character-${c.id}`} title={c.name} detail={detail} label={`${c.name}. ${label}.`}
          prefix={<View style={{ width: 53, height: 56, alignItems: "center", justifyContent: "center", borderColor: "#A77B56",
            borderWidth: 1, backgroundColor: "#39241A", borderTopLeftRadius: 27, borderTopRightRadius: 27, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
            <Sprite id={c.id} size={48} frame={0} />
          </View>}
          onPress={() => {
            if (start === "new" && journey) { setRestartId(c.id); return; }
            dispatch({ type: "select", id: c.id }); dispatch({ type: "start", categories: ["stories"] }); router.push("/journey");
          }} />;
      })}
    </View>
    {hasJourneyFolio(profile) && <Pressable accessibilityRole="button" testID="open-folio" onPress={() => router.push("/home?view=folio")}
      style={({ pressed }) => ({ alignSelf: "flex-start", minHeight: 44, justifyContent: "center", opacity: pressed ? .65 : 1, outlineColor: earthen.gold })}>
      <MenuText size={17} color={earthen.gold}>{tr("Open the unlocked illustration", "פתיחת האיור שזכיתם בו")}</MenuText>
    </Pressable>}
  </MenuFrame>;
}
