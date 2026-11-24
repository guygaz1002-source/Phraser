import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useReducedMotion } from "react-native-reanimated";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useCharacters } from "./localizedCatalog";
import { useLocale } from "./LocaleProvider";
import { useTier } from "../theme/ThemeProvider";
import { useGame } from "./GameProvider";
import { current } from "./game";
import { Button, Copy, Header, Panel, Screen } from "./components";
import { RouteGate } from "./RouteGate";
import { useStopImages } from "./useStopImages";
import { ExplorationMap } from "./ExplorationMap";
import { canLeaveChapter, bonusesFor } from "./round";
import { BonusChallenge } from "./BonusChallenge";
import { QuestItem } from "./WorldIcons";

export function JourneyScene({ route }: { route: "/journey" | "/intro" }) {
  const t = useTier(), { game, dispatch } = useGame();
  const characters = useCharacters(), { tr, direction } = useLocale();
  const { character, journey, stop, profile } = current(game, characters);
  const reduced = useReducedMotion();
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const worldStop = character?.stops.find(s => s.id === journey?.exploring) ?? stop;
  useStopImages(worldStop);
  useEffect(() => { if (journey?.phase === "intro") dispatch({ type: "begin" }); }, [journey?.phase, dispatch]);
  useEffect(() => { if (journey?.walkingFrom !== null && journey?.walkingFrom !== undefined) dispatch({ type: "walked" }); }, [journey?.walkingFrom, dispatch]);
  useEffect(() => setDialog(null), [worldStop?.id]);
  const finished = journey?.phase === "finished";
  const solved = !!(worldStop && journey && journey.awards[worldStop.id] !== undefined);
  const ready = !!(stop && journey && canLeaveChapter(stop, journey, t.id));
  const quest = bonusesFor(worldStop, t.id).find(q => q.id === dialog);
  const openScroll = () => {
    if (!stop || !worldStop) return;
    if (worldStop.id === stop.id && !finished) dispatch({ type: "enter" });
    else setDialog("story");
  };
  return <RouteGate route={route}><Screen key={`${character?.id}/${worldStop?.id}/${finished}`} style={{ maxWidth: 1000, gap: 16, paddingTop: 18 }}>
    {character && journey && stop && worldStop ? <>
      <View style={{ direction, flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <Copy style={{ fontSize: t.id === "a" ? 26 : 22, lineHeight: 32 }}>{tr(`${character.name}’s journey`, `המסע של ${character.name}`)}</Copy>
        <Copy style={{ fontSize: 16, lineHeight: 24 }}>{tr(`${profile.tokens} tokens`, `${profile.tokens} אסימונים`)}</Copy>
      </View>
      <Copy style={{ fontSize: 17, lineHeight: 26 }}>{tr(`Chapter ${character.stops.indexOf(worldStop) + 1} of ${character.stops.length} · ${Object.keys(journey.awards).length} mysteries solved`, `פרק ${character.stops.indexOf(worldStop) + 1} מתוך ${character.stops.length} · ${Object.keys(journey.awards).length} חידות נפתרו`)}</Copy>
      {finished ? <Panel><Copy>{tr("Your storybook is complete.", "ספר המסע הושלם.")}</Copy><Copy style={{ fontSize: 18, lineHeight: 28 }}>{character.ending?.[t.storyEdition]}</Copy></Panel> : null}
      <ExplorationMap key={`${character.id}/${worldStop.id}`} character={character} stop={worldStop} journey={journey} paused={dialog !== null || route === "/intro"} onScroll={openScroll} onBonus={setDialog} />
      {worldStop.id === stop.id && !finished && ready ? <Button title={journey.stop === character.stops.length - 1 ? tr("Complete the journey", "סיום המסע") : tr("Continue the journey", "המשך המסע")} onPress={() => dispatch({ type: "continue" })} /> : null}
      {worldStop.id !== stop.id && !finished ? <Button title={tr("Return to the current chapter", "חזרה לפרק הנוכחי")} onPress={() => dispatch({ type: "explore", stopId: stop.id })} /> : null}
      <Button quiet title={chaptersOpen ? tr("Close chapter book", "סגירת ספר הפרקים") : tr("Open chapter book", "פתיחת ספר הפרקים")} onPress={() => setChaptersOpen(v => !v)} />
      {chaptersOpen ? <View style={{ gap: 8 }}>
        {character.stops.map((s, index) => {
          const unlocked = s.id === stop.id || journey.awards[s.id] !== undefined;
          return <Pressable key={s.id} accessibilityRole="button" accessibilityLabel={tr(`Explore chapter ${index + 1}${unlocked ? "" : ". Locked"}`, `סיור בפרק ${index + 1}${unlocked ? "" : ". נעול"}`)} disabled={!unlocked}
            onPress={() => { dispatch({ type: "explore", stopId: s.id }); setChaptersOpen(false); }}
            style={{ padding: 14, minHeight: t.touch, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radius, opacity: unlocked ? 1 : 0.5 }}>
            <View style={{ direction, flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Copy style={{ direction: "ltr", writingDirection: "ltr", fontSize: 18, lineHeight: 27, flexShrink: 0 }}>{index + 1}.</Copy>
              <Copy style={{ fontSize: 18, lineHeight: 27, flex: 1 }}>{journey.awards[s.id] !== undefined ? s.solvedTitle : tr("A chapter to discover", "פרק שעוד נגלה")}</Copy>
            </View>
          </Pressable>;
        })}
      </View> : null}
      <Button quiet title={tr("Choose another journey", "בחירת מסע אחר")} onPress={() => router.replace("/characters")} />
      <Modal visible={dialog !== null} transparent animationType={reduced ? "none" : "fade"} onRequestClose={() => setDialog(null)}>
        <View style={{ flex: 1, direction, backgroundColor: "#1B1510B3", justifyContent: "center", padding: 20 }}>
          <View accessibilityViewIsModal style={{ direction, backgroundColor: t.colors.background, borderColor: t.colors.border, borderWidth: 1, borderRadius: 16, maxHeight: "90%", width: "100%", maxWidth: 600, alignSelf: "center", overflow: "hidden" }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              {dialog === "story" && solved ? <><Header title={worldStop.solvedTitle ?? tr("Your discovered story", "הסיפור שגיליתם")} /><Copy>{worldStop.passage[t.storyEdition]}</Copy><Copy style={{ fontSize: 16, lineHeight: 24 }}>{worldStop.source}</Copy></> : null}
              {quest ? <>
                <View style={{ alignItems: "center" }}><QuestItem item={quest.item} size={64} /></View>
                {solved ? <BonusChallenge key={quest.id} question={quest} stopId={worldStop.id} /> : <><Header title={tr("A bonus treasure", "אוצר בונוס")} /><Copy style={{ fontSize: 19, lineHeight: 29 }}>{tr("Solve this chapter’s picture mystery, then come back to collect this item.", "פותרים את חידת התמונה של הפרק, ואז חוזרים לאסוף את האוצר.")}</Copy><Copy style={{ fontSize: 16, lineHeight: 25 }}>{tr("The scroll marks the way to the picture mystery.", "המגילה מסמנת את הדרך לחידת התמונה.")}</Copy></>}
              </> : null}
              <Button quiet title={tr("Back to exploring", "חזרה לסיור")} onPress={() => setDialog(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </> : null}
  </Screen></RouteGate>;
}
