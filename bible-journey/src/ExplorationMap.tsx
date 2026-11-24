import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, View, type ImageStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { worldImages } from "../content/world-images.generated";
import { useTier } from "../theme/ThemeProvider";
import { bonusesFor } from "./round";
import { useGame } from "./GameProvider";
import { Button, Copy } from "./components";
import { LifeCharacter, LifeSprite, lifeStageDescription } from "./LifeCharacter";
import { useLocale } from "./LocaleProvider";
import { lifeStageFor } from "./lifecycle";
import { ArrowIcon, QuestItem, ScrollIcon } from "./WorldIcons";
import { canExplore, explorePosition, findExplorePath, sameTile, vectors, worlds, type Direction } from "./exploration";
import type { Character, Journey, Stop, Tile } from "./types";

const keys: Record<string, Direction> = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
};
const itemNames: Record<string, [string, string]> = { jar: ["Clay jar", "כד חרס"], staff: ["Wooden staff", "מטה עץ"], seal: ["Bronze seal", "חותם ברונזה"], lamp: ["Oil lamp", "נר שמן"] };
const directions = { up: "למעלה", down: "למטה", left: "שמאלה", right: "ימינה" };
type Notice = "find" | "scroll" | "bonus" | "moving" | "blocked";

type ExplorationMapProps = {
  character: Character; stop: Stop; journey: Journey; paused: boolean;
  onScroll: () => void; onBonus: (id: string) => void;
};

export function ExplorationMap(props: ExplorationMapProps) {
  // Each chapter owns its image request and movement state. A late image callback
  // from the previous chapter must never enable movement on the new map.
  return <ChapterMap key={props.stop.id} {...props} />;
}

function ChapterMap({ character, stop, journey, paused, onScroll, onBonus }: ExplorationMapProps) {
  const t = useTier(), { dispatch, error } = useGame(), world = worlds[stop.id]!;
  const reduced = useReducedMotion();
  const { tr, direction } = useLocale();
  const stage = lifeStageFor(stop.id, journey.awards)!;
  const bonuses = bonusesFor(stop, t.id);
  const floating = stage.motion === "float", travelVerb = floating ? "Float" : "Walk";
  const position = explorePosition(journey, stop.id);
  const [width, setWidth] = useState(0), [walking, setWalking] = useState(false), [frame, setFrame] = useState(0);
  const [artwork, setArtwork] = useState<{ attempt: number; status: "loading" | "ready" | "error" }>({ attempt: 0, status: "loading" });
  const activeAttempt = useRef(0);
  const unavailable = artwork.status !== "ready";
  const movementPaused = paused || unavailable || error !== null;
  const [notice, setNotice] = useState<Notice>("find");
  const notices: Record<Notice, string> = {
    find: tr("Find the scroll. Two bonus treasures are waiting along the way.", "חפשו את המגילה. בדרך מחכים שני אוצרות בונוס."),
    scroll: tr("You reached the story scroll.", "הגעתם למגילת הסיפור."),
    bonus: tr("You found a bonus treasure.", "מצאתם אוצר בונוס."),
    moving: tr("On the way…", "בדרך…"),
    blocked: tr("That spot is blocked. Choose an open path.", "המקום הזה חסום. בחרו שביל פתוח."),
  };
  const [facing, setFacing] = useState<Direction>("right");
  const route = useRef<Tile[]>([]), held = useRef<Direction | null>(null);
  const destination = useRef<string | null>(null);
  const state = useRef({ position, paused: movementPaused, onScroll, onBonus });
  state.current = { position, paused: movementPaused, onScroll, onBonus };
  const stopMoving = useCallback(() => { route.current = []; held.current = null; destination.current = null; setWalking(false); }, []);
  useEffect(() => { if (movementPaused) stopMoving(); }, [movementPaused, stopMoving]);
  const finishArtwork = (status: "ready" | "error") => {
    if (activeAttempt.current !== artwork.attempt) return;
    setArtwork({ attempt: artwork.attempt, status });
  };
  const retryArtwork = () => {
    stopMoving();
    setArtwork({ attempt: ++activeAttempt.current, status: "loading" });
  };
  const arrive = useCallback((point: Tile, manual: boolean) => {
    if (sameTile(point, world.checkpoint)) {
      stopMoving(); setNotice("scroll"); state.current.onScroll(); return;
    }
    const index = world.bonusSpots.findIndex(p => sameTile(point, p));
    const quest = bonuses[index];
    if (quest && (manual || destination.current === quest.id)) {
      stopMoving(); setNotice("bonus"); state.current.onBonus(quest.id);
    }
  }, [world, bonuses, stopMoving]);
  const move = useCallback((target: Tile, manual: boolean) => {
    const from = state.current.position;
    if (state.current.paused || !canExplore(world, target) || sameTile(from, target)) return;
    setFacing(target.x > from.x ? "right" : target.x < from.x ? "left" : target.y > from.y ? "down" : "up");
    state.current.position = target;
    dispatch({ type: "move", stopId: stop.id, position: target });
    setWalking(true); setFrame(f => 1 - f);
    arrive(target, manual);
  }, [world, dispatch, stop.id, arrive]);
  const step = useCallback((direction: Direction) => {
    const from = state.current.position, v = vectors[direction];
    move({ x: from.x + v.x, y: from.y + v.y }, true);
  }, [move]);
  const hold = useCallback((direction: Direction) => {
    if (state.current.paused) return;
    route.current = []; destination.current = null; held.current = direction; step(direction);
  }, [step]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (state.current.paused) { stopMoving(); return; }
      if (held.current) { step(held.current); return; }
      const target = route.current.shift();
      if (target) move(target, false); else setWalking(false);
    }, 130);
    return () => clearInterval(timer);
  }, [move, step, stopMoving]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const down = (event: KeyboardEvent) => {
      if (state.current.paused || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && event.target.closest("input,textarea,select"))) return;
      const direction = keys[event.code];
      if (!direction) return;
      event.preventDefault();
      if (!event.repeat) hold(direction);
    };
    const up = (event: KeyboardEvent) => { if (keys[event.code] === held.current) { held.current = null; setWalking(false); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", stopMoving);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stopMoving); };
  }, [hold, stopMoving]);
  const travel = (target: Tile, questId: string | null = null) => {
    if (state.current.paused) return;
    held.current = null; destination.current = questId;
    if (sameTile(state.current.position, target)) { arrive(target, true); return; }
    route.current = findExplorePath(world, state.current.position, target);
    setNotice(route.current.length ? "moving" : "blocked");
  };
  const cell = width / world.width, avatar = floating ? Math.max(28, Math.min(42, cell * 1.8)) : Math.max(24, Math.min(38, cell * 1.6));
  const solved = journey.awards[stop.id] !== undefined;
  const collected = bonuses.filter(q => journey.bonus[q.id]?.status === "correct").length;
  const markerStyle = (point: Tile) => ({ position: "absolute" as const, left: (point.x + 0.5) * cell - 22, top: (point.y + 0.5) * cell - 28, width: 44, height: 44, alignItems: "center" as const, justifyContent: "center" as const, backgroundColor: "#F7E8BCD9", borderColor: "#65451F", borderWidth: 1, borderRadius: 8 });
  const padButton = (direction: Direction) => <Pressable key={direction} accessibilityRole="button" accessibilityLabel={tr(`Move ${direction}`, `תנועה ${directions[direction]}`)} disabled={movementPaused} accessibilityState={{ disabled: movementPaused }}
    onPressIn={() => hold(direction)} onPressOut={() => { held.current = null; setWalking(false); }}
    onPress={Platform.OS === "web" ? (e) => { if (e.nativeEvent.pageX === 0 && e.nativeEvent.pageY === 0) step(direction); } : undefined}
    style={({ pressed }) => ({ width: t.id === "a" ? 64 : 48, height: t.id === "a" ? 64 : 48, backgroundColor: t.colors.panel, borderColor: t.colors.border, borderWidth: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", outlineColor: t.colors.ink, opacity: movementPaused ? 0.45 : pressed ? 0.7 : 1 })}>
    <ArrowIcon direction={direction} color={t.colors.ink} />
  </Pressable>;
  return <View style={{ gap: 12 }}>
    <LifeCharacter character={character} stage={stage} still={journey.phase === "finished" && stop.id === "life-samson-5"} />
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ direction: "ltr", width: "100%", aspectRatio: world.width / world.height, overflow: "hidden", borderRadius: 12, borderWidth: 2, borderColor: t.colors.border, backgroundColor: t.terrain.grass }} testID="chapter-world">
      <Image key={artwork.attempt} source={worldImages[stop.id]} onLoad={() => finishArtwork("ready")} onError={() => finishArtwork("error")} accessibilityLabel={tr(`Chapter ${character.stops.indexOf(stop) + 1} exploration map`, `מפת הסיור של פרק ${character.stops.indexOf(stop) + 1}`)} style={{ width: "100%", height: "100%", imageRendering: "pixelated" } as ImageStyle} resizeMode="stretch" />
      <Pressable testID="world-ground" accessibilityRole="button" accessibilityLabel={tr("Choose a destination on the map", "בחירת יעד על המפה")} disabled={movementPaused} accessibilityState={{ disabled: movementPaused }}
        onPress={e => {
          let { locationX: x, locationY: y } = e.nativeEvent;
          let mapWidth = width - 4, mapHeight = width * world.height / world.width - 4;
          // Web press events carry viewport coordinates; native events are local.
          if (Platform.OS === "web") {
            const bounds = (e.currentTarget as unknown as HTMLElement).getBoundingClientRect();
            const pointer = e.nativeEvent as unknown as MouseEvent;
            x = pointer.clientX - bounds.left; y = pointer.clientY - bounds.top;
            mapWidth = bounds.width; mapHeight = bounds.height;
          }
          if (mapWidth > 0 && mapHeight > 0 && Number.isFinite(x) && Number.isFinite(y))
            travel({ x: Math.floor(x / mapWidth * world.width), y: Math.floor(y / mapHeight * world.height) });
        }}
        style={{ position: "absolute", inset: 0 }} />
      {width > 0 ? <>
        <Pressable accessibilityRole="button" accessibilityLabel={tr(`${travelVerb} to the story scroll`, floating ? "שיט אל מגילת הסיפור" : "הליכה אל מגילת הסיפור")} disabled={movementPaused} accessibilityState={{ disabled: movementPaused }} onPress={() => travel(world.checkpoint)} style={markerStyle(world.checkpoint)}><ScrollIcon /></Pressable>
        {bonuses.map((quest, index) => <Pressable key={quest.id} accessibilityRole="button" accessibilityLabel={tr(`${travelVerb} to bonus item ${index + 1}${journey.bonus[quest.id]?.status === "correct" ? ". Collected" : ""}`, `${floating ? "שיט" : "הליכה"} אל אוצר בונוס ${index + 1}${journey.bonus[quest.id]?.status === "correct" ? ". נאסף" : ""}`)} disabled={movementPaused} accessibilityState={{ disabled: movementPaused }}
          onPress={() => travel(world.bonusSpots[index]!, quest.id)} style={markerStyle(world.bonusSpots[index]!)}>
          <QuestItem item={quest.item} />
          {journey.bonus[quest.id]?.status === "correct" ? <View style={{ position: "absolute", right: 0, top: -8, backgroundColor: t.colors.background, borderRadius: 8, paddingHorizontal: 3 }}><Copy style={{ fontSize: 16, lineHeight: 20 }}>✓</Copy></View> : null}
        </Pressable>)}
        <View testID="world-player" accessibilityLabel={tr(`${stage.description}, map position ${position.x}, ${position.y}`, `${lifeStageDescription(stage, true)}, מיקום במפה ${position.x}, ${position.y}`)} pointerEvents="none"
          style={{ position: "absolute", left: (position.x + 0.5) * cell - avatar / 2, top: (position.y + 0.5) * cell - avatar * (176 / 128), transform: [{ scaleX: facing === "left" ? -1 : 1 }] }}>
          <LifeSprite stage={stage} size={avatar} walking={walking} frame={reduced || (journey.phase === "finished" && stop.id === "life-samson-5") ? 0 : walking ? 2 + frame : undefined} />
        </View>
      </> : null}
      {unavailable ? <View testID="world-artwork-status" style={{ position: "absolute", inset: 0, direction, backgroundColor: t.colors.background, padding: 12, justifyContent: "center", alignItems: "center", gap: 8 }}>
        <Copy accessibilityLiveRegion="polite" style={{ fontSize: 16, lineHeight: 24, textAlign: "center" }}>{artwork.status === "error" ? tr("The map could not load. Your position is saved.", "לא הצלחנו לטעון את המפה. המיקום שלך נשמר.") : tr("Loading the map…", "טוענים את המפה…")}</Copy>
        {artwork.status === "error" ? <Button title={tr("Try map again", "טעינה חוזרת של המפה")} onPress={retryArtwork} /> : null}
      </View> : null}
    </View>
    <Copy accessibilityLiveRegion="polite" style={{ fontSize: 16, lineHeight: 24, textAlign: "center" }}>{unavailable ? tr("Movement will be available when the map loads.", "אפשר יהיה להמשיך לנוע כשהמפה תיטען.") : notices[notice]}</Copy>
    <View style={{ direction, flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-around", gap: 12 }}>
      <View style={{ direction: "ltr", alignItems: "center", gap: 4 }}>
        {padButton("up")}<View style={{ flexDirection: "row", gap: 4 }}>{padButton("left")}{padButton("down")}{padButton("right")}</View>
      </View>
      <View style={{ flexGrow: 1, maxWidth: 300 }}><Button title={solved ? tr("Read the story scroll", "קריאת מגילת הסיפור") : tr(`${travelVerb} to the scroll`, floating ? "שיט אל המגילה" : "הליכה אל המגילה")} onPress={() => travel(world.checkpoint)} disabled={movementPaused} /></View>
    </View>
    <Copy style={{ fontSize: 14, lineHeight: 22, textAlign: "center" }}>{tr("Arrow keys / WASD, direction buttons, or tap an open path.", "זזים עם החצים במקלדת, מקשי WASD, כפתורי הכיוון או נגיעה בשביל פתוח.")}</Copy>
    <View style={{ gap: 8, borderTopWidth: 1, borderColor: t.colors.border, paddingTop: 12 }}>
      <Copy style={{ fontSize: 20, lineHeight: 28 }}>{tr(`Treasures collected · ${collected} / 2`, `אוצרות שנאספו · ${collected} מתוך 2`)}</Copy>
      <View style={{ direction, flexDirection: "row", gap: 8 }}>
        {bonuses.map((quest, index) => <Pressable key={quest.id} accessibilityRole="button" accessibilityLabel={tr(`Find bonus item ${index + 1}`, `מציאת אוצר בונוס ${index + 1}`)} disabled={movementPaused} accessibilityState={{ disabled: movementPaused }}
          onPress={() => travel(world.bonusSpots[index]!, quest.id)} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, minHeight: 64, alignItems: "center", borderWidth: 1, borderColor: t.colors.border, borderRadius: 8, backgroundColor: t.colors.panel }}>
          <QuestItem item={quest.item} /><Copy style={{ fontSize: 16, lineHeight: 24, textAlign: "center" }}>{tr(...(itemNames[quest.item] ?? itemNames.lamp!))}</Copy>
          <Copy style={{ fontSize: 14, lineHeight: 22 }}>{journey.bonus[quest.id]?.status === "correct" ? tr("Collected ✓", "נאסף ✓") : solved ? tr("Bonus ready", "הבונוס פתוח") : tr("Discover it", "בואו לגלות")}</Copy>
        </Pressable>)}
      </View>
      <Copy style={{ fontSize: 15, lineHeight: 23 }}>{solved ? tr("Each optional challenge gives you 45 seconds. Collect the item and earn one token.", "לכל שאלת בונוס יש 45 שניות. תשובה נכונה מזכה באוצר ובאסימון אחד.") : tr("Solve the picture mystery to unlock the two bonus challenges.", "פתרו את חידת התמונה כדי לפתוח את שתי שאלות הבונוס.")}</Copy>
    </View>
  </View>;
}
