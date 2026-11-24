import { View } from "react-native";
import { useTier } from "../theme/ThemeProvider";
import { Copy, Panel } from "./components";
import { Sprite } from "./JourneyMap";
import { lifeSprites } from "./life-sprites";
import { hasMosesChildInterlude, lifeStageFor, lifeStages, type LifeStage } from "./lifecycle";
import type { Character, Journey, Stop } from "./types";
import { useLocale } from "./LocaleProvider";

const hebrewStageDescriptions: Record<LifeStage["id"], string> = {
  "moses-baby": "משה התינוק, ברווזון עטוף בתיבה צפה",
  "moses-child": "משה הילד, ברווזון קטן בכותונת בגוון חול",
  "moses-young": "משה כברווז בוגר צעיר",
  "moses-shepherd": "משה הרועה, ברווז בוגר עם מטה",
  "moses-leader": "משה המנהיג, ברווז מבוגר",
  "moses-elder": "משה בזקנתו, ברווז עם זקן לבן ומטה",
  "samson-child": "שמשון הילד, ברווזון עם שיער חום שגדל",
  "samson-adult": "שמשון הבוגר, ברווז עם שיער חום ארוך",
  "samson-shorn": "שמשון הבוגר, שערו גזוז ועיניו עצומות",
  "samson-regrowth": "שמשון הבוגר, שערו מתחיל לצמוח ועיניו עצומות",
  "noah-builder": "נח הבוגר, בעל זקן לבן וסינר עבודה",
  "noah-keeper": "נח הבוגר, בעל זקן לבן ותיק מזון על כתפו",
  "noah-watcher": "נח הבוגר, בעל זקן לבן וגלימה ירוקה אסופה",
  "noah-renewed": "נח הבוגר, בגלימתו הירוקה המוכרת ועם מטה",
};
export function lifeStageDescription(stage: LifeStage, isHebrew: boolean) {
  return isHebrew ? hebrewStageDescriptions[stage.id] : stage.description;
}

export function LifeSprite({ stage, size = 64, walking = false, frame }: {
  stage: LifeStage; size?: number; walking?: boolean; frame?: number;
}) {
  const { isHebrew } = useLocale();
  return <Sprite id={stage.hero} source={lifeSprites[stage.id]} description={lifeStageDescription(stage, isHebrew)}
    size={size} walking={walking} frame={frame} floating={stage.motion === "float"} />;
}

export function LifeCharacter({ character, stage, still = false }: { character: Character; stage: LifeStage; still?: boolean }) {
  const t = useTier();
  const { tr, direction } = useLocale();
  return <View testID={`life-stage-${stage.id}`} style={{ direction, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, backgroundColor: t.colors.panel }}>
    <LifeSprite stage={stage} size={58} frame={still ? 0 : undefined} />
    <View style={{ flex: 1, gap: 3 }}>
      <Copy style={{ fontSize: 22, lineHeight: 30 }}>{character.name}</Copy>
      <Copy style={{ fontSize: 16, lineHeight: 23 }}>{tr("Your character in this chapter", "הדמות שלכם בפרק הזה")}</Copy>
    </View>
  </View>;
}

export function LifeStoryTransition({ stop, journey }: { stop: Stop; journey: Journey }) {
  const t = useTier();
  const { tr, direction } = useLocale();
  const childhood = hasMosesChildInterlude(stop, journey, t.id);
  const stage = childhood ? lifeStages["moses-child"] : lifeStageFor(stop.id, journey.awards);
  const changedHair = stop.id === "life-samson-4" || stop.id === "life-samson-9";
  if (!stage || journey.awards[stop.id] === undefined || (!childhood && !changedHair)) return null;
  return <Panel>
    <View testID={`life-transition-${stage.id}`} style={{ direction, flexDirection: "row", alignItems: "center", gap: 18 }}>
      <LifeSprite stage={stage} size={70} />
      <View style={{ flex: 1, gap: 8 }}>
        <Copy style={{ fontSize: 22, lineHeight: 30 }}>{childhood ? tr("Moses grows up", "משה גדל") : tr("The story continues", "הסיפור נמשך")}</Copy>
        <Copy style={{ fontSize: 18, lineHeight: 27 }}>{childhood
          ? tr("The child grew, and Pharaoh’s daughter took him as her son. Years passed, and Moses became an adult.", "משה גדל, ובת פרעה לקחה אותו לבן. השנים חלפו, ומשה התבגר.")
          : stop.id === "life-samson-4"
            ? tr("Samson’s hair was cut, and the Philistines took him captive.", "שערו של שמשון נגזז, והפלשתים לקחו אותו בשבי.")
            : tr("While Samson was in prison, his hair began to grow again.", "בזמן ששמשון היה בבית האסורים, שערו החל לצמוח מחדש.")}</Copy>
      </View>
    </View>
  </Panel>;
}
