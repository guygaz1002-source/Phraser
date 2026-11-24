import { Pressable, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { Copy } from "./components";
import { Coin } from "./RoundEffects";
import { CarvedFace, earthen } from "./EarthenSurface";
import { QuestItem } from "./WorldIcons";
import { useLocale } from "./LocaleProvider";
import type { Clue } from "./types";
export type Treasure = "jar" | "staff" | "lamp" | "seal";
const treasures = {
  jar: ["Clay jar", "כד חרס", "One token", "אסימון אחד"],
  staff: ["Wooden staff", "מטה עץ", "One extra life", "לב נוסף"],
  lamp: ["Oil lamp", "נר שמן", "One free written clue", "רמז כתוב במתנה"],
  seal: ["Bronze seal", "חותם ברונזה", "One free letter clue", "רמז אות במתנה"],
} as const;
export function treasureText(item: Treasure, he: boolean) {
  return {name:treasures[item][he?1:0], reward:treasures[item][he?3:2]};
}
export function TreasureLegend({ lamp, seal }: {lamp:number;seal:number}) {
  const {isHebrew,tr,direction}=useLocale();
  return <View testID="treasure-legend" style={{gap:9,backgroundColor:earthen.panel,borderColor:earthen.border,borderWidth:1,borderRadius:10,padding:14}}>
    <Copy accessibilityRole="header" style={{fontSize:22,lineHeight:30}}>{tr("Treasures of the journey","אוצרות המסע")}</Copy>
    {(Object.keys(treasures) as Treasure[]).map(item=>{
      const {name,reward}=treasureText(item,isHebrew);
      const stock=item==="lamp"?lamp:item==="seal"?seal:0;
      return <View key={item} style={{direction,flexDirection:"row",gap:10,alignItems:"center"}}>
        <QuestItem item={item} size={29}/><Copy style={{flex:1,fontSize:16,lineHeight:23}}>{name} · {reward}{stock>0 ? tr(` (${stock} available)`,` (${stock} במלאי)`):""}</Copy>
      </View>;
    })}
  </View>;
}

export type ClueTool = {kind: Exclude<Clue,"answer">; label: string; price: number; disabled: boolean};
export function ClueRail({tools,onBuy}:{tools:ClueTool[];onBuy:(kind:ClueTool["kind"])=>void}) {
  const {tr,isHebrew}=useLocale();
  return <View testID="clue-rail" style={{gap:6}}>{tools.map(tool=>{
    const cost = tool.price===0 ? tr("free","מתנה") : tool.price===1 ? tr("1 token","אסימון אחד") : tr(`${tool.price} tokens`,`${tool.price} אסימונים`);
    return <Pressable key={tool.kind} testID={`clue-${tool.kind}`} accessibilityRole="button" accessibilityLabel={`${tool.label} · ${cost}`} accessibilityState={{disabled:tool.disabled}} disabled={tool.disabled} onPress={()=>onBuy(tool.kind)}
      style={{width:48,minHeight:46,alignItems:"center",justifyContent:"center",gap:2,borderRadius:9,opacity:tool.disabled ? .53 : 1}}>
      {({pressed})=><><CarvedFace pressed={pressed}/>{tool.kind==="letter"?<Copy style={{fontSize:19,lineHeight:21,color:earthen.ink}}>{isHebrew?"א":"A"}</Copy>:
        <View style={{width:21,height:19}}><Svg width={21} height={19} viewBox="0 0 24 22" aria-hidden>
          <Rect x={2} y={2} width={20} height={17} rx={2} fill="none" stroke="#F6D298" strokeWidth={1.6}/>
          <Path d={tool.kind==="image"?"M4 15l5-5 3 3 4-6 4 7 M6 7h2":"M6 7h12 M6 11h10 M6 15h7"} fill="none" stroke="#F6D298" strokeWidth={1.6}/>
        </Svg></View>}
        <View style={{flexDirection:"row",gap:1,alignItems:"center"}}>{tool.price>0?Array.from({length:tool.price},(_,i)=><Coin key={i} size={11}/>):<Copy style={{fontSize:11,lineHeight:14,color:earthen.gold}}>{tr("Free","מתנה")}</Copy>}</View>
      </>}
    </Pressable>;
  })}</View>;
}
