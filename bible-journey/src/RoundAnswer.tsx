import type { ViewHandle } from "./CoinFlight";
import { useRef, useState, type Ref } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { puzzleImages } from "../content/catalog.generated";
import { useTier } from "../theme/ThemeProvider";
import { CarvedFace, earthen } from "./EarthenSurface";
import { Copy } from "./components";
import { useLocale } from "./LocaleProvider";
import { normalize } from "./game";
import { guidedChoices, pictureChoiceLimit } from "./questionDifficulty";
import type { Puzzle, PuzzleProgress } from "./types";

export function RoundAction({ title, onPress, disabled = false, quiet = false, ref }: {
  title: string; onPress: () => void; disabled?: boolean; quiet?: boolean; ref?: Ref<ViewHandle>;
}) {
  return <Pressable ref={ref} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={{ minHeight: 44, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderRadius: 9, opacity: disabled ? .48 : 1 }}>
    {({pressed}) => <><CarvedFace primary={!quiet} pressed={pressed}/><Copy style={{ color: earthen.ink, fontSize: 16, lineHeight: 24, textAlign: "center" }}>{title}</Copy></>}
  </Pressable>;
}

export function RoundAnswer({ puzzle, progress, disabled, nearAnswer, map, previousWording, choiceSeed, onGuess, onDraft }: {
  map: number; previousWording: boolean; choiceSeed: number;
  puzzle: Puzzle; progress: PuzzleProgress; disabled: boolean; nearAnswer: boolean;
  onGuess: (value: string, origin: ViewHandle | null) => void; onDraft: (value: string) => void;
}) {
  const t = useTier();
  const { tr, direction, isHebrew, fontFamily } = useLocale();
  const choiceButtons = useRef<(ViewHandle | null)[]>([]);
  const submit = useRef<ViewHandle>(null);
  const [preferTyping,setPreferTyping] = useState<boolean>();
  const youngest = t.input === "pictures";
  const limit = previousWording ? (youngest ? puzzle.choicesKids.length : 0) : pictureChoiceLimit(map,youngest);
  const typing = preferTyping ?? (Boolean(progress.draft) || map >= 3);
  const nearHint = nearAnswer && <Copy testID="near-answer-feedback" accessibilityLiveRegion="polite"
    style={{ color: earthen.gold, fontSize: 17, lineHeight: 23 }}>
    {tr("Almost! What exactly is happening in the picture?", "כמעט! מה בדיוק קורה בתמונה?")}
  </Copy>;
  if (youngest || (limit > 0 && !typing)) {
    const correct = puzzle.choicesKids.indexOf(puzzle.answer);
    const indices = guidedChoices(puzzle.choicesKids.length,correct,limit,choiceSeed);
    return <View style={{gap:8}}>
      <View testID="opening-choices" style={{ direction, flexDirection:"row", flexWrap:"wrap", gap:8 }}>
      {indices.map(index => <Pressable key={index} testID={`picture-choice-${index}`} ref={node => { choiceButtons.current[index] = node; }} accessibilityRole="button"
        accessibilityLabel={tr(`Choose ${puzzle.choiceLabelsKids[index]}`, `בחירה: ${puzzle.choiceLabelsKids[index]}`)}
        accessibilityState={{ disabled }} disabled={disabled} onPress={() => onGuess(puzzle.choicesKids[index]!, choiceButtons.current[index] ?? null)}
        style={{ width: "46%", flexGrow: 1, padding: 9, minHeight: 68, alignItems: "center", justifyContent: "center", borderRadius: 9 }}>
        {({pressed}) => <><CarvedFace pressed={pressed}/>
          {youngest && <Image source={puzzleImages[puzzle.choicePicturesKids[index]!]} style={{ width: 41, height: 37, borderRadius: 5 }} contentFit="cover" accessible={false}/>}
          <Copy style={{ fontSize: 16, lineHeight: 22, textAlign: "center" }}>{puzzle.choiceLabelsKids[index]}</Copy>
        </>}
      </Pressable>)}
      </View>
      {!youngest && <RoundAction quiet title={tr("Type an answer","הקלדת תשובה")} disabled={disabled} onPress={() => setPreferTyping(true)}/>}
      {nearHint}
    </View>;
  }
  const words = normalize(puzzle.answer).split(" ");
  return <View style={{ gap: 8 }}>
    {t.input === "letters" ? <View testID="answer-letter-grid" accessibilityLabel={tr(`${words.length} words`, `${words.length} מילים`)} style={{ direction, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {words.map((word, wi) => <View key={wi} style={{ flexDirection: "row", direction, gap: 3 }}>
        {[...word].map((letter, li) => <View key={li} style={{ width: 12, height: 22, borderBottomWidth: 1, borderColor: t.colors.accent }}>
          <Copy style={{ fontSize: 14, lineHeight: 20, textAlign: "center" }}>{wi === 0 && li === 0 && progress.letter ? letter : " "}</Copy>
        </View>)}
      </View>)}
    </View> : null}
    <TextInput accessibilityLabel={tr("Your answer to the picture puzzle", "התשובה שלך לחידת התמונה")}
      value={progress.draft} placeholder={tr("Name the event", "איזה אירוע רואים?")} placeholderTextColor={t.colors.muted}
      onChangeText={onDraft} editable={!disabled} autoCorrect={false} autoCapitalize="none" maxLength={160} returnKeyType="done"
      onSubmitEditing={() => onGuess(progress.draft, submit.current)} selectionColor={t.colors.accent}
      style={{ ...t.type.body, fontFamily, fontSize: 18, lineHeight: 26, minHeight: 46, paddingHorizontal: 14, paddingVertical: 10,
        direction, writingDirection: direction, textAlign: isHebrew ? "right" : "left", color: t.colors.ink,
        backgroundColor: t.colors.panel, borderWidth: 1, borderColor: t.colors.border, borderRadius: 10, outlineColor: t.colors.accent }} />
    <RoundAction ref={submit} title={tr("Check answer", "בדיקת התשובה")} disabled={disabled || !normalize(progress.draft)} onPress={() => onGuess(progress.draft, submit.current)} />
    {limit > 0 && <RoundAction quiet title={tr("Show answer choices","הצגת אפשרויות התשובה")} disabled={disabled} onPress={() => setPreferTyping(false)}/>}
    {nearHint}
  </View>;
}
