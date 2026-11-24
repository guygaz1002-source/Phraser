import { useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useTier } from "../theme/ThemeProvider";
import { Copy } from "./components";
import { speech } from "./speech";
import { useLocale } from "./LocaleProvider";
type VoiceMessage = "" | "denied" | "silent" | "unavailable";

export function VoiceAnswer({
  onResult,
  disabled = false,
}: {
  onResult: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTier();
  const { tr, language, isHebrew, direction } = useLocale();
  const [listening, setListening] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<VoiceMessage>("");
  const [transcript, setTranscript] = useState("");
  const callback = useRef(onResult);
  callback.current = onResult;
  const active = useRef(false);
  const mounted = useRef(true);
  // Ignore permission completions belonging to a cancelled or older attempt.
  const requestId = useRef(0);
  const recognitionStarted = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const cancel = () => {
    requestId.current++;
    active.current = false;
    recognitionStarted.current = false;
    speech?.abort();
    if (mounted.current) {
      setListening(false);
      setPending(false);
    }
  };
  const available = !!speech?.isRecognitionAvailable();
  useEffect(() => {
    mounted.current = true;
    if (!speech) return;
    const listeners = [
      speech.addListener("start", () => {
        if (mounted.current && active.current && recognitionStarted.current) {
          setListening(true);
          setPending(false);
        }
      }),
      speech.addListener("end", () => {
        if (!mounted.current || !active.current || !recognitionStarted.current)
          return;
        requestId.current++;
        recognitionStarted.current = false;
        active.current = false;
        setListening(false);
        setPending(false);
      }),
      speech.addListener("result", (event) => {
        if (!mounted.current || !active.current || !recognitionStarted.current)
          return;
        const words = event.results[0]?.transcript?.trim() ?? "";
        setTranscript(words);
        if (event.isFinal && words) {
          requestId.current++;
          active.current = false;
          recognitionStarted.current = false;
          setListening(false);
          setPending(false);
          speech?.stop();
          callback.current(words);
        }
      }),
      speech.addListener("error", (event) => {
        if (!mounted.current || !active.current || !recognitionStarted.current)
          return;
        requestId.current++;
        active.current = false;
        recognitionStarted.current = false;
        setListening(false);
        setPending(false);
        if (event.error === "aborted") return;
        setMessage(
          event.error === "not-allowed"
            ? "denied"
            : event.error === "no-speech" || event.error === "speech-timeout"
              ? "silent"
              : "unavailable",
        );
      }),
    ];
    const appState = AppState.addEventListener("change", (state) => {
      // Native permission dialogs can briefly make the app inactive.
      // Real backgrounding cancels pending permission requests as well.
      if (
        state === "background" ||
        (state === "inactive" && recognitionStarted.current)
      )
        cancel();
    });
    return () => {
      mounted.current = false;
      cancel();
      listeners.forEach((l) => l.remove());
      appState.remove();
    };
  }, []);
  useEffect(() => {
    if (disabled && active.current) cancel();
  }, [disabled]);
  useEffect(() => {
    cancel();
    setMessage("");
    setTranscript("");
  }, [language]);
  const start = async () => {
    if (!speech || !available || disabled) return;
    if (active.current) {
      if (listening) speech.stop();
      else cancel();
      return;
    }
    const id = ++requestId.current;
    setMessage("");
    setTranscript("");
    setPending(true);
    active.current = true;
    recognitionStarted.current = false;
    const isCurrent = () =>
      mounted.current &&
      active.current &&
      requestId.current === id &&
      !disabledRef.current;
    try {
      if (Platform.OS !== "web") {
        const permission = await speech.requestPermissionsAsync();
        if (!isCurrent()) return;
        if (!permission.granted) {
          active.current = false;
          setPending(false);
          setMessage("denied");
          return;
        }
      }
      if (!isCurrent()) return;
      recognitionStarted.current = true;
      speech.start({
        lang: isHebrew ? "he-IL" : "en-US",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        recordingOptions: { persist: false },
      });
    } catch {
      if (!isCurrent()) return;
      requestId.current++;
      active.current = false;
      recognitionStarted.current = false;
      setPending(false);
      setListening(false);
      setMessage("unavailable");
    }
  };
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          listening ? tr("Finish spoken answer", "סיום התשובה הקולית") : tr("Say your answer in English", "אמירת התשובה בעברית")
        }
        accessibilityState={{ disabled: disabled || !available, busy: pending }}
        disabled={disabled || !available}
        onPress={start}
        style={{
          minHeight: t.touch,
          borderWidth: t.borderWidth,
          borderColor: t.colors.border,
          borderRadius: t.radius,
          backgroundColor: listening ? t.colors.panel : t.colors.background,
          paddingHorizontal: 14,
          direction,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: disabled || !available ? 0.5 : 1,
        }}
      >
        <Svg width={22} height={26} viewBox="0 0 22 26" aria-hidden>
          <Rect
            x={7}
            y={1}
            width={8}
            height={15}
            rx={4}
            fill={t.colors.accent}
          />
          <Path
            d="M3 11v2a8 8 0 0016 0v-2M11 21v4M6 25h10"
            stroke={t.colors.accent}
            strokeWidth={2}
            fill="none"
          />
        </Svg>
        <Copy style={{ flexShrink: 1 }}>
          {listening
            ? tr("Listening… tap to finish", "מקשיבים… לחיצה לסיום")
            : pending
              ? tr("Opening microphone…", "פותחים את המיקרופון…")
              : tr("Say your answer", "אפשר לענות בקול")}
        </Copy>
      </Pressable>
      {transcript && listening ? (
        <Copy kind="label" accessibilityLiveRegion="polite">
          {transcript}
        </Copy>
      ) : null}
      {message || !available ? (
        <Copy kind="label" accessibilityLiveRegion="polite">
          {message === "denied"
            ? tr("Microphone access was not allowed. You can still choose or type.", "לא ניתנה גישה למיקרופון. אפשר לבחור תשובה או להקליד.")
            : message === "silent"
              ? tr("No words heard. Tap the microphone to try again.", "לא נקלטו מילים. אפשר ללחוץ על המיקרופון ולנסות שוב.")
              : message === "unavailable"
                ? tr("Voice is unavailable right now. You can still choose or type.", "הקלט הקולי לא זמין כרגע. אפשר לבחור תשובה או להקליד.")
                : Platform.OS === "web"
                  ? tr("Voice is not available in this browser. Choose or type instead.", "הקלט הקולי אינו זמין בדפדפן הזה. אפשר לבחור תשובה או להקליד.")
                  : tr("Voice is not available in this app. Choose or type instead.", "הקלט הקולי אינו זמין ביישומון הזה. אפשר לבחור תשובה או להקליד.")}
        </Copy>
      ) : null}
    </View>
  );
}
