import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState, Image, Platform, View, type ImageStyle } from "react-native";
import { useLocale } from "./LocaleProvider";

const greeting = require("../assets/title/title-greeting.png");
const poses = [1, 2, 1, 2, 1, 0];
const beatMs = 175;

export function TitleDuck({ size, still }: { size: number; still: boolean }) {
  const [frame, setFrame] = useState(0);
  const { tr } = useLocale();

  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    let beat = 0;
    function wave() {
      setFrame(poses[beat]!);
      beat = (beat + 1) % poses.length;
      timer = setTimeout(wave, beat === 0 ? 8500 : beatMs);
    }
    function schedule() {
      clearTimeout(timer);
      beat = 0;
      setFrame(0);
      const visible = Platform.OS === "web" ? !document.hidden : AppState.currentState === "active";
      if (!still && visible) timer = setTimeout(wave, 2700);
    }
    schedule();
    const listener = AppState.addEventListener("change", schedule);
    if (Platform.OS === "web") document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      listener.remove();
      if (Platform.OS === "web") document.removeEventListener("visibilitychange", schedule);
    };
  }, [still]));

  return <View testID="title-duck" accessible accessibilityRole="image"
    accessibilityLabel={tr("Moses the duck sitting beneath the title", "משה הברווז יושב מתחת לשם המשחק")}
    style={{ direction:"ltr", width:size, height:size, overflow:"hidden", alignSelf:"center" }}>
    <Image accessible={false} source={greeting} resizeMode="stretch" style={{
      position:"absolute", left:-(still ? 0 : frame) * size, top:0, width:size * 3, height:size, imageRendering:"pixelated"
    } as ImageStyle} />
  </View>;
}
