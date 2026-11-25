import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ImageStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { router } from "expo-router";
import { useGame } from "./GameProvider";
import { LanguageSwitcher, useLocale } from "./LocaleProvider";
import { CarvedFace, EarthenBackdrop, earthen } from "./EarthenSurface";
import { TitleDuck } from "./TitleDuck";
import { SoundToggle } from "./SoundToggle";
import { tierIds } from "./types";

const cover = require("../assets/title/cover.png");
const spread = require("../assets/title/spread.png");
const wordmarks = {
  he: { name: "פרייזר", ink: require("../assets/title/word.png"), reflection: require("../assets/title/glint.png"), aspect: 82 / 26 },
  en: { name: "Phraser", ink: require("../assets/title/word-en.png"), reflection: require("../assets/title/glint-en.png"), aspect: 91 / 26 },
};
const landscape = require("../assets/home/adventure-home-v1.webp");
const pixels: ImageStyle = { width: "100%", height: "100%", imageRendering: "pixelated" } as ImageStyle;
const motionDriver = Platform.OS !== "web";
const copyInk = "#35231D";
// Kept out of StyleSheet.create: react-native-web rejects "direction" there in development and drops it.
const ltr = { direction: "ltr" } as const;

function Wordmark({ width, still }: { width: number; still: boolean }) {
  const { language } = useLocale();
  const { name, ink, reflection, aspect } = wordmarks[language];
  const beam = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const sweep = Animated.timing(beam, { toValue: 1, duration: 1100, delay: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: motionDriver });
    sweep.start();
    return () => sweep.stop();
  }, [still, beam]);
  const height = width / aspect;
  const band = Math.max(8, width * 0.09);
  const offset = beam.interpolate({inputRange: [0,1], outputRange: [-band,width]});
  const inverted = beam.interpolate({inputRange: [0,1], outputRange: [band,-width]});
  return <View accessible accessibilityRole="header" accessibilityLabel={name} style={{ width, height, overflow: "hidden", direction: "ltr" }}>
    <Image accessible={false} source={ink} resizeMode="stretch" style={pixels} />
    {!still && <Animated.View pointerEvents="none" style={{position:"absolute", top:0, left:0, height, width:band, overflow:"hidden", transform:[{translateX:offset}]}}>
      <Animated.View style={{width, height, transform:[{translateX:inverted}]}}><Image accessible={false} source={reflection} resizeMode="stretch" style={pixels} /></Animated.View>
    </Animated.View>}
  </View>;
}

function BookChoice({ label, first = false, small, onPress }: { label: string; first?: boolean; small: boolean; onPress: () => void }) {
  const { fontFamily } = useLocale();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={[styles.choice, { minHeight: small ? 48 : 63 }]}>
    {({ pressed }) => <>
      <CarvedFace primary={first} pressed={pressed} />
      <Text style={{ textAlign: "center", color: earthen.ink, fontFamily, marginHorizontal: 5,
        fontSize: small ? 20 : 28, lineHeight: small ? 26 : 34 }}>{label}</Text>
    </>}
  </Pressable>;
}

export function BookTitle() {
  const { width, height } = useWindowDimensions();
  const { game, dispatch } = useGame();
  const { tr, fontFamily } = useLocale();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(reduced);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(false);
  const timeline = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const finish = useCallback(() => { timeline.stopAnimation(); timeline.setValue(1); setOpen(true); }, [timeline]);
  useEffect(() => {
    if (reduced) { finish(); return; }
    if (open || !ready) return;
    const run = Animated.timing(timeline, { toValue: 1, duration: 3400, easing: Easing.linear, useNativeDriver: motionDriver });
    run.start(({finished}) => { if (finished) setOpen(true); });
    return () => run.stop();
  }, [timeline, ready, open, reduced, finish]);

  const compact = width < 620;
  const bookWidth = Math.min(width * (compact ? 0.985 : 0.91), 950, Math.max(540,(height-110)*1.63));
  const bookHeight = compact ? Math.max(306, bookWidth * 0.7) : bookWidth * 0.605;
  const half = bookWidth / 2;
  const logoWidth = half * .74;
  const duckSize = Math.min(116, Math.max(58, half * .30));
  const curve = (inputRange: number[], outputRange: number[]) => timeline.interpolate({inputRange, outputRange, extrapolate:"clamp"});
  const turn = [0,.58,.77,.96,1];
  const continueGame = () => {
    const tiers = game.tier ? [game.tier, ...tierIds.filter(id => id !== game.tier)] : tierIds;
    const modes = game.playMode === "duo" ? ["duo", "solo"] as const : ["solo", "duo"] as const;
    for (const mode of modes) for (const tier of tiers) {
      const profile = mode === "duo" ? game.duoProfiles?.[tier] : game.profiles[tier];
      if (!profile) continue;
      const hero = profile.active && profile.journeys[profile.active] ? profile.active : Object.keys(profile.journeys)[0];
      if (!hero) continue;
      if (mode !== (game.playMode ?? "solo")) dispatch({ type: "play-mode", mode });
      if (tier !== game.tier) dispatch({ type: "tier", tier });
      if (hero !== profile.active) dispatch({ type: "select", id: hero });
      router.push("/journey");
      return;
    }
    setNotice(true);
  };
  return <SafeAreaView style={[styles.scene, ltr]}>
    <EarthenBackdrop />
    <Image accessible={false} source={landscape} resizeMode="cover" style={[StyleSheet.absoluteFill, {width:"100%",height:"100%",opacity:.13}]} />
    <ScrollView contentContainerStyle={{flexGrow:1, alignItems:"center", justifyContent:"center", paddingVertical:54}}>
      <Animated.View testID="title-book" style={{width:bookWidth,height:bookHeight,direction:"ltr", transform:[
        {scale:curve([0,.57,.97,1],[.25,.98,1,1])}, {translateX:curve([0,.58,.96,1],[-half/2,-half/2,0,0])}
      ]}}>
        <Animated.View pointerEvents="none" style={{position:"absolute",left:half,width:half,height:bookHeight,overflow:"hidden",opacity:curve([0,.575,.58,1],[0,0,1,1])}}>
          <Image accessible={false} source={spread} style={[pixels,{position:"absolute",left:-half,width:bookWidth}]} resizeMode="stretch" />
        </Animated.View>
        <Animated.View pointerEvents="none" style={{position:"absolute",left:0,width:half,height:bookHeight,overflow:"hidden", transform:[
          {translateX:curve(turn,[half/2,half/2,half/2,0,0])},{scaleX:curve(turn,[0,0,0,1,1])}]}}>
          <Image accessible={false} source={spread} style={[pixels,{width:bookWidth}]} resizeMode="stretch" />
        </Animated.View>
        {!open && <Animated.View testID="title-cover" pointerEvents="none" style={{position:"absolute",left:half,width:half,height:bookHeight,
          opacity:curve([0,.764,.77,1],[1,1,0,0]),transform:[{translateX:curve(turn,[0,0,-half/2,-half/2,-half/2])},{scaleX:curve(turn,[1,1,0,0,0])}]}}>
          <Image accessible={false} source={cover} resizeMode="stretch" style={pixels} onLoadEnd={() => setReady(true)} />
        </Animated.View>}
        {open && <>
          <View style={{ position:"absolute",left:half,top:bookHeight*.22,width:half*.93,alignItems:"center" }}>
            <View style={{width:logoWidth,alignItems:"center"}}>
              <Wordmark width={logoWidth} still={reduced} />
              <View style={{alignSelf:"center",marginTop:bookHeight*.015}}><TitleDuck size={duckSize} still={reduced} /></View>
            </View>
            <View style={{height:1,width:"44%",backgroundColor:"#A07943",marginTop:bookHeight*.024}} />
            <Text style={{fontFamily,fontSize:compact?13:18,color:"#6A482D",textAlign:"center",marginTop:6}}>{tr("Bible Journey","מסע בתנ״ך")}</Text>
          </View>
          <View testID="book-menu" style={{position:"absolute",left:half*.16,top:bookHeight*.1,width:half*.76,height:bookHeight*.69,justifyContent:"center",gap:compact?8:12}}>
            {notice ? <>
              <Text accessibilityLiveRegion="polite" style={{fontFamily,color:copyInk,textAlign:"center", fontSize:compact?15:21}}>
                {tr("Your journey will be saved once you start playing.", "עדיין אין מסע שמור. אפשר להתחיל משחק חדש.")}
              </Text>
              <BookChoice small={compact} first label={tr("New game","משחק חדש")} onPress={() => router.push("/?screen=age&start=new")} />
              <BookChoice small={compact} label={tr("Back to menu","חזרה לתפריט")} onPress={() => setNotice(false)} />
            </> : <>
              <BookChoice small={compact} first label={tr("New game","משחק חדש")} onPress={() => router.push("/?screen=age&start=new")} />
              <BookChoice small={compact} label={tr("Continue","המשך משחק")} onPress={continueGame} />
            </>}
          </View>
        </>}
      </Animated.View>
    </ScrollView>
    <View style={{position:"absolute",top:9,right:12}}><LanguageSwitcher light compact /></View>
    <View style={{position:"absolute",top:12,left:12}}><SoundToggle /></View>
    {!open && <Pressable accessibilityRole="button" onPress={finish} style={styles.skip}><Text style={[styles.skipText, { fontFamily }]}>{tr("Skip intro","דילוג על הפתיח")}</Text></Pressable>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  scene:{flex:1,backgroundColor:earthen.background},
  choice:{justifyContent:"center",alignItems:"center",paddingHorizontal:2,outlineColor:"#8A5730",borderRadius:9},
  skip:{position:"absolute",bottom:12,alignSelf:"center",minHeight:44,justifyContent:"center",paddingHorizontal:18,backgroundColor:"#172220"},
  skipText:{fontSize:15,color:"#FFE6AC"}
});
