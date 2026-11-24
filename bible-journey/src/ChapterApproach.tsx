import { useEffect, useMemo, useRef, useState } from "react";
import { Image, View, useWindowDimensions, type ImageStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Circle, Polyline } from "react-native-svg";
import { worldImages } from "../content/world-images.generated";
import { useTier } from "../theme/ThemeProvider";
import { Copy } from "./components";
import { findExplorePath, worlds } from "./exploration";
import { LifeSprite, lifeStageDescription } from "./LifeCharacter";
import { lifeStages, type LifeStageId } from "./lifecycle";
import { useLocale } from "./LocaleProvider";
import { RoundAction } from "./RoundAnswer";
import { QuestItem } from "./WorldIcons";
import { earthen } from "./EarthenSurface";
import type { Stop } from "./types";

const stages: Record<string, readonly [number, LifeStageId][]> = {
  moses: [[0,"moses-baby"],[1,"moses-child"],[3,"moses-young"],[7,"moses-shepherd"],[12,"moses-leader"],[24,"moses-elder"]],
  samson: [[0,"samson-child"],[4,"samson-adult"],[21,"samson-shorn"],[24,"samson-regrowth"]],
  noah: [[0,"noah-builder"],[4,"noah-keeper"],[12,"noah-watcher"],[24,"noah-renewed"]],
};
export function guideStage(hero: string, stopIndex: number) {
  const list = stages[hero]!;
  let selected = list[0]![1];
  for (const [index, id] of list) if (stopIndex >= index) selected = id;
  return lifeStages[selected];
}

type Props = {
  stop: Stop; previous?: Stop; map: number; landmark: number; hero: string;
  discovery?: string; paused: boolean; onArrival: () => void;
};
export function ChapterApproach({ stop, previous, map, landmark, hero, discovery, paused, onArrival }: Props) {
  const t = useTier(), { tr, direction, isHebrew } = useLocale(), reduced = useReducedMotion();
  const { height, width: screenWidth } = useWindowDimensions();
  const world = worlds[stop.id]!;
  const path = useMemo(() => [world.start, ...findExplorePath(world, world.start, world.checkpoint)], [world]);
  const marks = [1,2,3,4].map(n => Math.round((path.length-1)*n/4));
  const [width, setWidth] = useState(0), [elapsed, setElapsed] = useState(0);
  const [artwork, setArtwork] = useState<"loading"|"ready"|"error">("loading"), [attempt, setAttempt] = useState(0);
  const time = useRef(0), sent = useRef(false), callback = useRef(onArrival), request = useRef(0);
  callback.current = onArrival;
  const running = !paused && artwork === "ready" && width > 0;
  const duration = discovery ? 1400 : 3500;
  useEffect(() => {
    if (!running || sent.current) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      time.current = Math.min(duration, time.current + Math.max(0,now-last));
      last = now; setElapsed(time.current);
      if (time.current >= duration) {clearInterval(timer); sent.current = true; callback.current();}
    }, 50);
    return () => clearInterval(timer);
  }, [running,duration]);
  const start = landmark === 1 ? 0 : marks[landmark-2]!;
  const end = marks[landmark-1]!;
  const part = reduced ? Number(elapsed >= duration-250) : Math.min(1,elapsed/(duration-250));
  const frame = discovery ? end : start + (end-start)*part;
  const from = path[Math.floor(frame)]!, to = path[Math.min(path.length-1,Math.ceil(frame))]!;
  const f = frame-Math.floor(frame), x = from.x + (to.x-from.x)*f, y = from.y + (to.y-from.y)*f;
  const index = (map-1)*4+landmark-1;
  const before = guideStage(hero, Math.max(0,index-1)), after = guideStage(hero,index);
  const evolving = !discovery && before.id !== after.id, stage = evolving && elapsed<1200 ? before : after;
  const cell = width/world.width, avatar = Math.max(33,Math.min(68,cell*1.9));
  const walking = running && !discovery && !reduced && part < 1;
  const summary = previous?.learned[t.storyEdition].match(/^.+?[.!?](?=\s|$)/u)?.[0] ?? previous?.learned[t.storyEdition];
  const points = path.map(p => (p.x+0.5)+","+(p.y+0.5)).join(" ");
  const limit = Math.max(205, Math.min(485, height*(screenWidth<750 ? .46 : .52)));
  return <View testID="chapter-approach" style={{gap:9}}>
    <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} testID="approach-world" style={{direction:"ltr", width:"100%", maxWidth:limit*world.width/world.height, alignSelf:"center", aspectRatio:world.width/world.height, overflow:"hidden", backgroundColor:earthen.panel, borderRadius:12}}>
      <Image key={attempt} source={worldImages[stop.id]} onLoad={()=>{if(request.current===attempt)setArtwork("ready");}} onError={()=>{if(request.current===attempt)setArtwork("error");}}
        accessibilityLabel={tr(`Map ${map}, four landmarks`,`מפה ${map}, ארבע נקודות ציון`)} resizeMode="stretch" style={{position:"absolute",width:"100%",height:"100%",imageRendering:"pixelated"} as ImageStyle}/>
      {width>0 && artwork==="ready" && <>
        <Svg width="100%" height="100%" viewBox={`0 0 ${world.width} ${world.height}`} style={{position:"absolute"}} aria-hidden>
          <Polyline points={points} fill="none" stroke="#362112" strokeWidth={.28} opacity={.8}/>
          <Polyline points={points} fill="none" stroke="#FFE2A3" strokeWidth={.12} strokeDasharray=".28 .22"/>
          {marks.map((at,i)=><Circle key={i} cx={path[at]!.x+.5} cy={path[at]!.y+.5} r={i+1 === landmark ? .53 : .38}
            stroke="#482819" strokeWidth={.17} fill={i+1<=landmark?"#FFE09C":"#A58765"}/>)}
        </Svg>
        {summary && !discovery && <View testID="chapter-transition" style={{position:"absolute",top:7,left:9,right:9,alignItems:"center"}}><View style={{direction,maxWidth:550,paddingHorizontal:13,paddingVertical:6,backgroundColor:"#FFF0D5F2",borderColor:"#8A6243",borderWidth:1,borderRadius:13}}>
          <Copy numberOfLines={3} style={{color:"#392417",fontSize:screenWidth<500?14:17,lineHeight:screenWidth<500?18:23,textAlign:"center"}}>{summary}</Copy>
          <Copy style={{color:"#75472C",fontSize:12,lineHeight:16,textAlign:"center"}}>{previous?.source}</Copy>
        </View></View>}
        <View testID="approach-player" pointerEvents="none" style={{position:"absolute",left:(x+.5)*cell-avatar/2,top:(y+.5)*cell-avatar*1.27,
          transform:[{scaleX:!reduced && to.x<from.x?-1:1}]}}>
          <View testID={`evolution-${stage.id}`}><LifeSprite stage={stage} size={avatar} walking={walking} frame={walking?2+Math.floor(elapsed/140)%2:0}/></View>
        </View>
        {discovery && <View testID="treasure-emerges" style={{position:"absolute",left:Math.min(width-42,(x+.7)*cell),top:Math.max(10,(y-.5)*cell-32-(reduced?0:Math.min(1,elapsed/750)*12)),borderRadius:20,backgroundColor:"#FFF0D5F5",padding:4,borderColor:earthen.gold,borderWidth:2}}><QuestItem item={discovery} size={30}/></View>}
      </>}
      {artwork!=="ready" && <View style={{position:"absolute",inset:0,backgroundColor:earthen.panel,alignItems:"center",justifyContent:"center",gap:10}}>
        <Copy style={{fontSize:16,lineHeight:22,color:earthen.ink}}>{artwork==="error"?tr("The map could not load.","המפה לא נטענה."):tr("Opening the map…","פותחים את המפה…")}</Copy>
        {artwork==="error" && <RoundAction title={tr("Reload map","טעינה חוזרת של המפה")} onPress={()=>{setArtwork("loading");setAttempt(++request.current);}}/>}
      </View>}
    </View>
    <Copy accessibilityLiveRegion="polite" style={{textAlign:"center",fontSize:17,lineHeight:24,color:earthen.ink}}>
      {discovery?tr("Something glints beside the path…","משהו מנצנץ לצד השביל…"):evolving && elapsed>=1200?lifeStageDescription(after,isHebrew):tr(`On the way to landmark ${landmark}…`,`בדרך לנקודת ציון ${landmark}…`)}
    </Copy>
  </View>;
}
