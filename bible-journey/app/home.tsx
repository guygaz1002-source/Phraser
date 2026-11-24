import { Redirect, router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { activeProfile } from "../src/game";
import { useGame } from "../src/GameProvider";
import { useLocale } from "../src/LocaleProvider";
import { MenuChoice, MenuFrame, PlayerSeal, storyArt, trailArt } from "../src/MenuFrame";
import { JourneyFolio, hasJourneyFolio } from "../src/HomeWorlds";

export default function Home() {
  const { start, view } = useLocalSearchParams<{ start?: string; view?: string }>();
  const { game, dispatch } = useGame();
  const { tr } = useLocale();
  if (!game.tier) return <Redirect href="/?screen=age" />;
  const profile = activeProfile(game, game.tier);
  if (view === "folio" && hasJourneyFolio(profile)) return <JourneyFolio onClose={() => router.replace(profile.active ? "/journey" : "/characters")} />;
  const choose = (mode: "solo" | "duo") => {
    dispatch({ type: "play-mode", mode });
    router.push(start === "new" ? "/characters?start=new" : "/characters");
  };
  const art = game.tier === "a" ? storyArt : trailArt;
  return <MenuFrame testID="mode-menu" title={tr("How will you play?", "איך משחקים?")} image={art}
    back={tr("Change age group", "בחירת גיל אחר")} onBack={() => router.dismissTo(start === "new" ? "/?screen=age&start=new" : "/?screen=age")}>
    <View style={{ gap: 12 }}>
      <MenuChoice testID="mode-solo" prefix={<PlayerSeal />} primary title={tr("Single player", "משחק יחיד")} label={tr("Single player", "משחק יחיד")} onPress={() => choose("solo")} />
      <MenuChoice testID="mode-duo" prefix={<PlayerSeal pair />} title={tr("Multiplayer", "מרובה משתתפים")} detail={tr("Two players on one device", "שני שחקנים במכשיר אחד")}
        onPress={() => choose("duo")} />
    </View>
  </MenuFrame>;
}
