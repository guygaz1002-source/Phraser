import { useEffect } from "react";
import { usePathname } from "expo-router";
import { LanguageSwitcher, useLocale } from "./LocaleProvider";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SceneBackdrop, type SceneKind } from "./SceneBackdrop";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTier } from "../theme/ThemeProvider";
import { ClayTablet, Grain, Olive } from "../components/motifs";
export function Copy({
  kind = "body",
  tone = "ink",
  style,
  ...props
}: TextProps & {
  kind?: "display" | "body" | "label";
  tone?: "ink" | "accent" | "muted" | "onPrimary";
}) {
  const t = useTier();
  const { isHebrew, direction, fontFamily } = useLocale();
  return (
    <Text {...props} style={[t.type[kind], { color: t.colors[tone], direction, writingDirection: direction, textAlign: isHebrew ? "right" : "left", fontFamily }, style]} />
  );
}
export function Screen({
  children,
  style,
  keyboard = false,
  fixed = false,
  scene,
}: React.PropsWithChildren<{
  style?: ViewStyle;
  keyboard?: boolean;
  fixed?: boolean;
  scene?: SceneKind;
}>) {
  const t = useTier();
  const { direction } = useLocale();
  const pathname = usePathname();
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: t.motion.duration,
      easing: Easing.inOut(Easing.ease),
    });
  }, [opacity, t.motion.duration]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const content = (
    <Animated.View
      style={[
        {
          width: "100%",
          direction,
          maxWidth: 760,
          alignSelf: "center",
          paddingHorizontal: t.padding,
          paddingTop: 24,
          paddingBottom: 24,
          gap: t.gap,
          flexGrow: 1,
          ...(fixed ? { flex: 1, minHeight: 0 } : {}),
        },
        anim,
        style,
      ]}
    >
      {pathname !== "/" && pathname !== "/home" ? <LanguageSwitcher compact /> : null}
      {children}
    </Animated.View>
  );
  return (
    <SafeAreaView style={{ flex: 1, direction, backgroundColor: t.colors.background }}>
      {scene ? <SceneBackdrop scene={scene} /> : null}
      <Grain />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={keyboard && Platform.OS === "ios" ? "padding" : undefined}
      >
        {fixed ? (
          content
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {content}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  quiet = false,
  align = "center",
  label,
  children,
}: React.PropsWithChildren<{
  title: string;
  onPress: () => void;
  disabled?: boolean;
  quiet?: boolean;
  align?: "center" | "start";
  label?: string;
}>) {
  const { direction, isHebrew } = useLocale();
  const t = useTier(),
    scale = useSharedValue(1),
    opacity = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  const release = () => {
    if (t.motion.press === "bounce")
      scale.value = withSequence(
        withTiming(1.04, { duration: 140 }),
        withTiming(1, { duration: 210 }),
      );
    else if (t.motion.press === "overshoot")
      scale.value = withSequence(
        withTiming(1.015, { duration: 70 }),
        withTiming(1, { duration: 110 }),
      );
    else opacity.value = withTiming(1, { duration: 400 });
  };
  return (
    <Animated.View style={anim}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ?? title}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          if (t.motion.press === "fade")
            opacity.value = withTiming(0.7, { duration: 200 });
          else scale.value = withTiming(0.96, { duration: 70 });
        }}
        onPressOut={release}
        style={{
          direction,
          outlineColor: t.colors.accent,
          minHeight: t.touch,
          paddingHorizontal: 20,
          paddingVertical: 12,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.45 : 1,
        }}
      >
        {quiet ? null : (
          <ClayTablet fill={t.colors.primary} stroke={t.colors.border} />
        )}
        <View
          style={{
            direction,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: align === "start" ? "flex-start" : "center",
            width: align === "start" ? "100%" : undefined,
            gap: 12,
          }}
        >
          {children}
          <Copy tone={quiet ? "ink" : "onPrimary"} style={{ textAlign: align === "start" ? (isHebrew ? "right" : "left") : "center", flexShrink: 1, flex: align === "start" ? 1 : undefined }}>{title}</Copy>
        </View>
      </Pressable>
    </Animated.View>
  );
}
export function Divider() {
  const t = useTier();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        alignSelf: "center",
        width: 140,
      }}
    >
      <View style={{ height: 1, backgroundColor: t.colors.border, flex: 1 }} />
      <Olive />
      <View style={{ height: 1, backgroundColor: t.colors.border, flex: 1 }} />
    </View>
  );
}
export function Header({
  title,
  kicker,
  center = false,
}: {
  title: string;
  kicker?: string;
  center?: boolean;
}) {
  const { isHebrew } = useLocale();
  return (
    <View style={{ gap: 8, alignItems: center ? "center" : undefined }}>
      {kicker ? (
        <Copy
          kind="label"
          tone="muted"
          style={{ textAlign: center ? "center" : isHebrew ? "right" : "left" }}
        >
          {kicker}
        </Copy>
      ) : null}
      <Copy
        kind="display"
        accessibilityRole="header"
        style={{ textAlign: center ? "center" : isHebrew ? "right" : "left" }}
      >
        {title}
      </Copy>
    </View>
  );
}
export function Panel({
  children,
  style,
}: React.PropsWithChildren<{ style?: ViewStyle }>) {
  const t = useTier();
  const { direction } = useLocale();
  return (
    <View
      style={[
        {
          direction,
          backgroundColor: t.colors.panel,
          borderWidth: t.borderWidth,
          borderColor: t.colors.border,
          borderRadius: t.radius,
          padding: 20,
          gap: 16,
        },
        style,
      ]}
    >
      <Grain />
      {children}
    </View>
  );
}
