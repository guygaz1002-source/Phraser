import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { router, useFocusEffect } from "expo-router";
import { Animated, AppState, Easing, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { ThemePreview, useTier } from "../theme/ThemeProvider";
import { Copy } from "./components";
import { useGame } from "./GameProvider";
import { useCharacters } from "./localizedCatalog";
import { LanguageSwitcher, useLocale } from "./LocaleProvider";
import { canBuy, current, normalize, spokenPictureAnswer } from "./game";
import { classifyGuess } from "./puzzleAnswer";
import { expeditionView } from "./expedition";
import { roundArtwork } from "./round";
import { RouteGate } from "./RouteGate";
import { guidedChoices } from "./questionDifficulty";
import { RoundAction, RoundAnswer } from "./RoundAnswer";
import { Coin } from "./RoundEffects";
import { CoinFlight, measureFlight, type ViewHandle } from "./CoinFlight";
import { ChapterApproach } from "./ChapterApproach";
import { companionChapter, companionPassages, guideStage } from "./companionJourney";
import { PuzzleArtwork } from "./PuzzleArtwork";
import { illustrationFile } from "./illustrationFile";
import { LifeSprite } from "./LifeCharacter";
import { useStopImages } from "./useStopImages";
import { VoiceAnswer } from "./VoiceAnswer";
import { CarvedFace, EarthenBackdrop, earthen } from "./EarthenSurface";
import { ClueRail, TreasureLegend, treasureText, type ClueTool, type Treasure } from "./TravelTools";
import { QuestItem } from "./WorldIcons";
import { SoundToggle } from "./SoundToggle";
import { LandmarkBurst } from "./LandmarkBurst";
import { playSound, setSoundScene, vibrate } from "./sound";

type Travel = NonNullable<ReturnType<typeof expeditionView>>;
type Feedback = { view: Travel; choice?: number; draft?: string; correct: boolean; timedOut?: boolean;
  before: number; flight: ReturnType<typeof measureFlight> };
type Panel = "pause"|"legend"|"story"|"journal"|"picture-stories"|null;
const nativeDriver = Platform.OS !== "web";
// Brief swell and settle, used for the heart that was lost and the wallet that was paid.
const bump=(value:Animated.Value)=>Animated.sequence([
  Animated.timing(value,{toValue:1,duration:130,easing:Easing.out(Easing.quad),useNativeDriver:nativeDriver}),
  Animated.timing(value,{toValue:0,duration:260,easing:Easing.inOut(Easing.quad),useNativeDriver:nativeDriver}),
]).start();
const swell=(value:Animated.Value)=>[{scale:value.interpolate({inputRange:[0,1],outputRange:[1,1.35]})}];

function useActiveStage() {
  const [focused,setFocused] = useState(false), [foreground,setForeground] = useState(true);
  useFocusEffect(useCallback(()=>{setFocused(true);return ()=>setFocused(false);},[]));
  useEffect(()=>{
    if (Platform.OS==="web") {
      const update=()=>setForeground(document.visibilityState!=="hidden");
      update();document.addEventListener("visibilitychange",update);
      return ()=>document.removeEventListener("visibilitychange",update);
    }
    const sub=AppState.addEventListener("change",s=>setForeground(s==="active"));return ()=>sub.remove();
  },[]);
  return focused && foreground;
}

export function ChapterGame() {
  const t = useTier();
  const theme = useMemo(()=>({...t,touch:46,radius:10,borderWidth:1,imageMat:4, colors:{...t.colors,
    background:earthen.background,panel:earthen.panel,ink:earthen.ink,accent:earthen.gold,primary:earthen.primary,
    onPrimary:earthen.ink,border:earthen.border,muted:earthen.muted,painting:"#3C291F"}}),[t]);
  return <ThemePreview value={theme}><StageEntry/></ThemePreview>;
}

function StageEntry() {
  const catalog=useCharacters(), {game,ready,dispatch,error}=useGame();
  const {character,journey}=current(game,catalog);
  const view=useMemo(()=>expeditionView(game,catalog),[game,catalog]);
  const seed=useRef<number|undefined>(undefined);
  useEffect(()=>{
    if (ready && !error && character && journey && !view) {
      seed.current ??= Math.floor(Math.random()*0x7fffffff);
      dispatch({type:"expedition-start",seed:seed.current});
    }
  },[ready,error,character,journey,view,dispatch]);
  return <RouteGate route="/journey">{view?<Stage key={`${game.tier}/${game.playMode??"solo"}/${view.character.id}/${view.state.seed}`} live={view}/>:<View style={{flex:1,backgroundColor:earthen.background}}/>}</RouteGate>;
}

function Stage({live}:{live:Travel}) {
  const t=useTier(), {tr,isHebrew,direction,language}=useLocale();
  const {game,dispatch,error}=useGame(), catalog=useCharacters();
  const {profile}=current(game,catalog);
  const {width,height}=useWindowDimensions(), wide=width>=820;
  const active=useActiveStage(), reduced=useReducedMotion();
  const [panel,setPanel]=useState<Panel>(null), [feedback,setFeedback]=useState<Feedback|null>(null);
  const [loadedFile,setLoadedFile]=useState<string>(), [landed,setLanded]=useState(false), [now,setNow]=useState(Date.now);
  const wallet=useRef<ViewHandle>(null), layer=useRef<ViewHandle>(null), voice=useRef<ViewHandle>(null);
  const buttons=useRef<(ViewHandle|null)[]>([]), busy=useRef(false);
  const scroll=useRef<ComponentRef<typeof ScrollView>>(null), heading=useRef<ComponentRef<typeof View>>(null);
  const [voiceOpen,setVoiceOpen]=useState(false);
  const [nearAnswerKey,setNearAnswerKey]=useState<string|null>(null);
  const shake=useRef(new Animated.Value(0)).current, heartBeat=useRef(new Animated.Value(0)).current, walletBeat=useRef(new Animated.Value(0)).current;
  const land=useCallback(()=>setLanded(true),[]);
  const landCoin=useCallback(()=>{playSound("coin");bump(walletBeat);setLanded(true);},[walletBeat]);
  // The theme plays more quietly while a riddle is on screen.
  useFocusEffect(useCallback(()=>{setSoundScene("game");return ()=>setSoundScene("menu");},[]));
  const view=feedback?.view??live, phase=view.state.phase, bonus=phase==="bonus";
  const showingQuestion=phase==="question"||bonus, onMap=phase==="travel"||phase==="discovery";
  const story=(bonus?view.bonusStop:undefined)??view.stop, puzzle=bonus?story.puzzles[0]!:view.puzzle;
  const progress=view.progress, question=bonus?view.bonus:view.question;
  const choiceSeed = view.state.seed ^ Math.imul(1 + view.state.landmark * 6 + (bonus ? 5 : view.step),0x9e3779b9);
  const keepBonusChoices = bonus && (view.state.legacyBonusAt === view.state.landmark || view.state.previousBonusAt === view.state.landmark);
  const choices = question && guidedChoices(question.options.length,question.answer,
    view.map === 1 && !view.previousQuestion && !keepBonusChoices ? 2 : question.options.length,choiceSeed);
  const art=roundArtwork(t.imageSet,bonus?4:view.artStep,question?0:progress.image);
  const file=illustrationFile(puzzle,t.imageSet,art.set,art.index);
  const imageKey=`${t.imageSet}/${file}`;
  const artworkReady=showingQuestion && loadedFile===imageKey;
  const artStatus=useCallback((ok:boolean)=>setLoadedFile(prev=>ok?imageKey:prev===imageKey?undefined:prev),[imageKey]);
  // Start preparing the incoming question as soon as the answer is saved, including during discovery.
  useStopImages(live.bonusStop ?? live.stop, live.bonusStop ? 4 : live.question ? live.artStep : undefined);
  const canRun=active && !panel && !error;
  const locked=!canRun || !!feedback || !artworkReady || (bonus && live.state.deadline===null);
  const duo=game.playMode==="duo", stageIndex=(view.map-1)*4+view.landmark-1;
  const chapter=companionChapter(view.character,stageIndex,language);
  const passages=companionPassages(live.character,live.state.paid);
  const journeyTitle=tr(`Journey with ${view.character.name}`,`המסע של ${view.character.name}`);
  const item=view.bonusItem as Treasure|undefined;
  const treasure=item?treasureText(item,isHebrew):undefined;
  const earned=feedback?profile.tokens-feedback.before:0;
  const flying=!!feedback?.flight && earned>0 && !landed && canRun && !reduced;
  const balance=flying?feedback!.before:profile.tokens;
  const turn=view.state.turn+1;
  // Sound cues for what the player now sees: a finished landmark, a treasure, the end of the journey.
  const shown=useRef({phase,stageIndex}), [bursts,setBursts]=useState(0);
  useEffect(()=>{
    const before=shown.current; shown.current={phase,stageIndex};
    if(phase===before.phase && stageIndex===before.stageIndex)return;
    if(phase==="finished")playSound("fanfare");
    else if(phase==="game-over")playSound("gameOver");
    else if(stageIndex>before.stageIndex){playSound("levelUp");vibrate([30,40,30,40,60]);setBursts(n=>n+1);}
    else if(phase==="discovery")playSound("treasure");
  },[phase,stageIndex]);
  const detailed=question?.explanation ?? story.learned[t.storyEdition].split(/(?<=[.!?])\s/u)[0] ?? puzzle.answer;
  const questionLabel=bonus
    ? tr(`Surprise challenge · ${view.character.name}`,`אתגר ההפתעה של ${view.character.name}`)
    : tr(`Bible picture riddle ${view.step+1} of 5`,`חידת תנ״ך בתמונות ${view.step+1} מתוך 5`);
  const prompt=question?.prompt??view.stop.picturePrompt?.[t.id]??tr("Which event is pictured?","איזה אירוע מסתתר בתמונה?");
  const availableClues: ClueTool[]=[];
  if (phase==="question" && !question && view.step===0) {
    const kinds=["image","hint","letter"] as const;
    for(const kind of kinds) {
      const owned=kind==="hint"?view.state.inventory.lamp:kind==="letter"?view.state.inventory.seal:0;
      const tierClue=t.clues.find(c=>c.key===kind);
      if(kind==="letter" && !tierClue && !owned)continue;
      const price=owned?0:kind==="image"?1:kind==="hint"?2:tierClue?.cost??2;
      const label=kind==="image"?tr("See another picture","הצגת איור נוסף"):kind==="hint"?tr("Read a written hint","קריאת רמז כתוב"):tr("Reveal the first letter","גילוי האות הראשונה");
      availableClues.push({kind,label,price,disabled:locked||!canBuy(kind,progress)||profile.tokens<price});
    }
  }
  const showFeedback=(correct:boolean,origin:ViewHandle|null,choice?:number,draft?:string,timedOut=false)=>{
    busy.current=true; setLanded(false);
    playSound(correct?"correct":"wrong"); vibrate(correct?25:[45,55,45]);
    if(!correct && !reduced){
      // A wrong answer shakes the answer area; an ordinary miss also costs the heart that pulses.
      shake.setValue(0);
      Animated.sequence([1,-1,.6,-.6,0].map(toValue=>Animated.timing(shake,{toValue,duration:55,easing:Easing.linear,useNativeDriver:nativeDriver}))).start();
      if(!bonus)bump(heartBeat);
    }
    setFeedback({view:live,before:profile.tokens,correct,timedOut,choice,draft,
      flight:correct && origin && !reduced?measureFlight(origin,wallet.current,layer.current):null});
    Keyboard.dismiss();
  };
  const respond=(origin:ViewHandle|null,choice?:number,value?:string)=>{
    if(locked||busy.current||!showingQuestion)return;
    if(value!==undefined && !normalize(value))return;
    const time=Date.now(), deadline=live.state.deadline;
    if(bonus && deadline!==null && time>=deadline) {
      showFeedback(false,null,undefined,undefined,true); dispatch({type:"expedition-expire",key:live.key,now:time}); return;
    }
    const result=question ? (choice===question.answer ? "correct" : "wrong") : classifyGuess(value??"",puzzle);
    if(result==="near"){
      setNearAnswerKey(live.key);
      return;
    }
    setNearAnswerKey(null);
    const correct=result==="correct";
    showFeedback(correct,origin,choice,value);
    dispatch({type:"expedition-answer",key:live.key,choice,value,now:time});
  };
  useEffect(()=>{
    if(!feedback)return;
    if(!canRun||reduced)land();
    if(!canRun)return;
    const timer=setTimeout(()=>{setFeedback(null);busy.current=false;},feedback.correct||feedback.view.state.phase==="bonus"?1250:850);
    return ()=>clearTimeout(timer);
  },[feedback,canRun,reduced,land]);
  useEffect(()=>{
    scroll.current?.scrollTo({y:0,animated:false});setVoiceOpen(false);
    if(active&&Platform.OS==="web")(heading.current as unknown as HTMLElement|null)?.focus?.({preventScroll:true});
  },[live.map,live.landmark,view.step,phase,active]);
  // Never leave the answer area off-centre if a shake is cut short (hidden tab, language change).
  useEffect(()=>{if(!feedback){shake.stopAnimation();shake.setValue(0);}},[feedback,shake]);
  const lang=useRef(language);
  useEffect(()=>{if(lang.current!==language){lang.current=language;setFeedback(null);busy.current=false;}},[language]);
  // Hold the bonus clock while its artwork, pause overlay or app is unavailable.
  const clockActive=active&&!panel&&!error&&!feedback&&artworkReady;
  useEffect(()=>{
    if(live.state.phase!=="bonus")return;
    const stamp=Date.now(), key=live.key, deadline=live.state.deadline;
    if(!clockActive){
      if(deadline!==null){
        if(stamp>=deadline && !busy.current)showFeedback(false,null,undefined,undefined,true);
        dispatch({type:"expedition-pause",key,now:stamp});
      }
      return;
    }
    if(deadline===null){dispatch({type:"expedition-resume",key,now:stamp});return;}
    const tick=()=>{
      const stamp=Date.now();setNow(stamp);
      if(stamp>=deadline&&!busy.current){
        showFeedback(false,null,undefined,undefined,true);
        dispatch({type:"expedition-expire",key,now:stamp});
      }
    };
    tick();const timer=setInterval(tick,200);return ()=>clearInterval(timer);
  },[live.key,live.state.phase,live.state.deadline,clockActive,dispatch]);
  const approachDone=()=>dispatch({type:"expedition-arrive",key:live.key,now:Date.now()});
  const artSize=wide?Math.max(225,Math.min(485,height*.54)):Math.min(295,Math.max(157,height*.29),width-(availableClues.length?110:48));
  const helper=feedback?(feedback.correct?tr("Correct!","נכון!"):feedback.timedOut?tr("Time is up.","הזמן נגמר."):bonus?tr("The treasure slips away.","האוצר חמק."):live.state.phase==="game-over"?tr("That was the last heart.","זה היה הלב האחרון."):tr("Look again and try another answer.","התבוננו שוב ונסו תשובה אחרת.")):"";
  const short=(n:number)=>({fontSize:n,lineHeight:Math.ceil(n*1.38)});
  const close=()=>setPanel(null);
  return <SafeAreaView testID="game-stage" style={{flex:1,direction,backgroundColor:earthen.background}}>
    <EarthenBackdrop/>
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
      <View style={{alignSelf:"center",width:"100%",maxWidth:1120,paddingHorizontal:wide?28:12,paddingTop:8,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:6}}>
        <View style={{flexDirection:"row",alignItems:"center",gap:6}}><LanguageSwitcher light compact/><SoundToggle/></View>
        <View style={{flexDirection:"row",alignItems:"center",gap:13}}>
          <View testID="life-balance" accessible accessibilityLiveRegion="polite" accessibilityLabel={live.state.lives===1?tr("1 life","לב אחד"):tr(`${live.state.lives} lives`,`${live.state.lives} לבבות`)} style={{flexDirection:"row",alignItems:"center",gap:4}}>
            <Animated.View style={{transform:swell(heartBeat)}}><Copy style={{...short(20),color:"#FA997F"}}>♥</Copy></Animated.View><Copy style={short(21)}>{live.state.lives}</Copy>
          </View>
          <View testID="token-balance" accessible accessibilityLiveRegion="polite" accessibilityLabel={balance===1?tr("1 token","אסימון אחד"):tr(`${balance} tokens`,`${balance} אסימונים`)} style={{flexDirection:"row",alignItems:"center",gap:5}}>
            <View ref={wallet} collapsable={false} testID="wallet-icon"><Animated.View style={{transform:swell(walletBeat)}}><Coin/></Animated.View></View><Copy style={{...short(21),fontVariant:["tabular-nums"]}}>{balance}</Copy>
          </View>
        </View>
      </View>
      <ScrollView ref={scroll} testID="question-scroll" style={{flex:1}} keyboardShouldPersistTaps="handled" contentContainerStyle={{flexGrow:1}}>
        <View style={{width:"100%",maxWidth:1120,alignSelf:"center",paddingHorizontal:wide?28:13,paddingVertical:wide?20:10,gap:wide?15:9}}>
          <View style={{gap:5}}>
            <Copy testID="companion-chapter" style={{...short(wide?21:18),color:earthen.gold}}>{journeyTitle} · {chapter.title}</Copy>
            <Copy style={{...short(15),color:earthen.muted}}>{tr(`Map ${view.map} of 7 · Landmark ${view.landmark} of 4`,`מפה ${view.map} מתוך 7 · נקודת ציון ${view.landmark} מתוך 4`)}</Copy>
            {duo && <Copy testID="current-player" accessibilityLiveRegion="polite" style={{...short(17),color:earthen.gold}}>
              {tr(`Player ${turn}’s turn · Score ${view.state.scores[0]} – ${view.state.scores[1]}`,`תור שחקן ${turn} · ניקוד ${view.state.scores[0]} – ${view.state.scores[1]}`)}
            </Copy>}
            {phase==="question" && <View testID="round-progress" style={{flexDirection:"row",alignItems:"center",gap:5}}>
              <Copy style={{...short(14),color:earthen.muted}}>{questionLabel}</Copy>
              {[0,1,2,3,4].map(i=><View key={i} style={{flex:1,height:4,borderRadius:2,backgroundColor:i<view.step?earthen.gold:i===view.step?earthen.ink:"#77523B"}}/>)}
            </View>}
          </View>
          {onMap && <View style={panel?{display:"none"}:undefined}>
            <ChapterApproach key={`${phase}/${view.map}/${view.landmark}`} stop={view.mapStop} line={chapter.line} source={chapter.stop.source} map={view.map} landmark={view.landmark} hero={view.character.id}
              discovery={phase==="discovery"?view.bonusItem:undefined} paused={!canRun} onArrival={approachDone}/>
          </View>}
          {panel ? <>

            {panel==="legend" && <TreasureLegend lamp={live.state.inventory.lamp} seal={live.state.inventory.seal}/>}
            {panel==="pause" && <>
              <Copy accessibilityRole="header" style={short(26)}>{tr("Paused","המשחק בהשהיה")}</Copy>
              <RoundAction quiet title={tr("Treasure guide","מקרא האוצרות")} onPress={()=>setPanel("legend")}/>
              {passages.length>0 && <RoundAction quiet title={tr("Journey book","ספר המסע")} onPress={()=>setPanel("journal")}/>}
              {live.completedStops.length>0 && <RoundAction quiet title={tr("Picture stories","סיפורי חידות התמונה")} onPress={()=>setPanel("picture-stories")}/>}
              <RoundAction quiet title={tr("Choose a character","בחירת דמות")} onPress={()=>router.replace("/characters")}/>
            </>}
            {panel==="story" && <View testID="round-story" style={{gap:8}}>
              <Copy accessibilityRole="header" style={short(24)}>{story.solvedTitle??story.title}</Copy>
              <Copy style={short(18)}>{story.passage[t.storyEdition]}</Copy>
              <Copy style={{...short(15),color:earthen.muted}}>{story.source}</Copy>
              {puzzle.sourceUrl && <RoundAction quiet title={tr("Read the biblical passage","קריאת המקור המקראי")} onPress={()=>void Linking.openURL(puzzle.sourceUrl!)}/>}
            </View>}
            {(panel==="journal" || panel==="picture-stories") && <View testID={panel==="journal"?"collected-storybook":"picture-stories"} style={{gap:16}}>
              <Copy accessibilityRole="header" style={short(26)}>{panel==="journal" ? tr(`The journey of ${live.character.name}`,`ספר המסע של ${live.character.name}`) : tr("Picture stories","סיפורי חידות התמונה")}</Copy>
              {(panel==="journal"?passages:live.completedStops).map(s=><View key={s.id} style={{gap:5,padding:14,borderRadius:9,backgroundColor:earthen.panel}}>
                <Copy style={short(21)}>{s.solvedTitle??s.title}</Copy><Copy style={short(17)}>{s.passage[t.storyEdition]}</Copy><Copy style={{...short(14),color:earthen.muted}}>{s.source}</Copy>
              </View>)}
            </View>}
          </>:onMap ? null :phase==="game-over"||phase==="finished"?<View testID={phase} style={{alignItems:"center",gap:15,padding:18,borderRadius:12,borderWidth:1,borderColor:earthen.border,backgroundColor:earthen.panel}}>
            <LifeSprite stage={guideStage(view.character.id,stageIndex)} size={84} frame={0}/>
            <Copy accessibilityRole="header" style={{...short(29),textAlign:"center"}}>{phase==="game-over"?tr("Out of hearts","הלבבות אזלו"):tr("Journey complete","המסע הושלם")}</Copy>
            {duo && <Copy style={short(19)}>{tr(`Player 1: ${live.state.scores[0]}   ·   Player 2: ${live.state.scores[1]}`,`שחקן 1 · ${live.state.scores[0]}     שחקן 2 · ${live.state.scores[1]}`)}</Copy>}
            {phase==="game-over"?<>
              <Copy style={{...short(16),textAlign:"center"}}>{tr("Try this landmark again with three hearts. Earlier landmarks are saved.","אפשר לנסות שוב את נקודת הציון עם שלושה לבבות. נקודות הציון הקודמות שמורות.")}</Copy>
              <RoundAction title={tr("Retry this landmark","ניסיון נוסף בנקודת הציון")} onPress={()=>dispatch({type:"expedition-retry",key:live.key})}/>
            </>:<RoundAction title={tr("Open journey book","פתיחת ספר המסע")} onPress={()=>setPanel("journal")}/>}
            <RoundAction quiet title={tr("Choose a character","בחירת דמות")} onPress={()=>router.replace("/characters")}/>
          </View>:<>
            {bonus && treasure && item && <View testID="surprise-challenge" style={{flexDirection:"row",alignItems:"center",gap:9}}>
              <QuestItem item={item} size={35}/><Copy style={{...short(18),color:earthen.gold}}>{tr(`${treasure.name} · ${treasure.reward}`,`${treasure.name} · ${treasure.reward}`)}</Copy>
            </View>}
            <View testID="question-heading" accessibilityRole="header" tabIndex={-1} ref={heading} style={{outlineWidth:0}}>
              <Copy style={short(wide?29:21)}>{prompt}</Copy>
            </View>
            <View testID={bonus?"bonus-question":`round-question-${view.step+1}`} style={{flexDirection:wide?"row":"column",alignItems:wide?"center":"stretch",gap:wide?28:10}}>
              <View testID="round-picture" style={{flex:wide?1:undefined,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9}}>
                <View style={{width:artSize,flexShrink:1,minWidth:0}}>
                  <PuzzleArtwork key={imageKey} puzzle={puzzle} imageSet={art.set} index={art.index} label={questionLabel} hideLadder maxWidth={artSize} onReadyChange={artStatus}/>
                </View>
                {availableClues.length>0 && <ClueRail tools={availableClues} onBuy={clue=>dispatch({type:"expedition-buy",key:live.key,clue})}/>}
              </View>
              <Animated.View testID="answer-area" style={{flex:wide?1:undefined,gap:8,transform:[{translateX:shake.interpolate({inputRange:[-1,1],outputRange:[-9,9]})}]}}>
                {availableClues.length>0&&progress.hint&&<Copy style={{...short(16),color:earthen.gold}}>{puzzle.textHint}</Copy>}
                {availableClues.length>0&&progress.letter&&<Copy style={{...short(16),color:earthen.gold}}>{tr("First letter","אות ראשונה")} · {normalize(puzzle.answer)[0]}</Copy>}
                {question ? <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
                  {choices!.map(i=>{
                    const option=question.options[i]!;
                    const selected=feedback?.choice===i;
                    return <Pressable key={i} ref={n=>{buttons.current[i]=n;}} testID={`option-${i}`} accessibilityRole="button" accessibilityLabel={option}
                      accessibilityState={{disabled:locked,selected}} disabled={locked} onPress={()=>respond(buttons.current[i]??null,i)}
                      style={{width:"46%",flexGrow:1,minHeight:wide?86:59,padding:12,justifyContent:"center",borderRadius:9}}>
                      {({pressed})=><><CarvedFace pressed={pressed}/>{selected&&<View style={[StyleSheet.absoluteFill,{backgroundColor:feedback.correct?"#294B32":"#732F23",borderColor:feedback.correct?"#A8C997":"#F0AD8D",borderWidth:1.5,borderRadius:9}]}/>}
                        <Copy style={short(wide?19:16)}>{option}</Copy></>}
                    </Pressable>;
                  })}
                </View>:<RoundAnswer key={view.cardId} puzzle={puzzle} map={view.map} previousWording={view.previousQuestion} choiceSeed={choiceSeed} progress={feedback?.draft?{...progress,draft:feedback.draft}:progress} disabled={locked} nearAnswer={nearAnswerKey===view.key}
                  onDraft={value=>dispatch({type:"expedition-draft",key:live.key,value})} onGuess={(value,origin)=>respond(origin,undefined,value)}/>}
                <View style={{minHeight:24}}>
                  {feedback ? <Copy testID="answer-feedback" accessibilityLiveRegion="polite" style={{...short(16),color:feedback.correct?"#D9E7AE":"#FFCCB2"}}>
                    {helper}{feedback.correct||bonus ? ` ${detailed}`:""}
                  </Copy>:bonus && <Copy style={{...short(14),color:earthen.muted}}>{questionLabel}{tr(` · ${Math.ceil(Math.max(0,live.state.deadline===null?live.state.remainingMs??45000:live.state.deadline-now)/1000)}s`,` · ${Math.ceil(Math.max(0,live.state.deadline===null?live.state.remainingMs??45000:live.state.deadline-now)/1000)} שניות`)}</Copy>}
                </View>
              </Animated.View>
            </View>
            {showingQuestion && !feedback && (question ? <Pressable accessibilityRole="button" onPress={()=>setPanel("story")} style={{minHeight:44,justifyContent:"center",alignSelf:"flex-start"}}>
              <Copy style={{...short(14),color:earthen.muted,textDecorationLine:"underline"}}>{tr("Read the story in this picture","הסיפור שבאיור")}</Copy>
            </Pressable>:<View ref={voice} collapsable={false} style={{alignSelf:"flex-start"}}>
              {voiceOpen?<VoiceAnswer disabled={locked} onResult={value=>t.input==="pictures"?respond(voice.current,undefined,spokenPictureAnswer(value,puzzle)):dispatch({type:"expedition-draft",key:live.key,value})}/>:<Pressable onPress={()=>setVoiceOpen(true)} accessibilityRole="button" style={{minHeight:44,justifyContent:"center"}}><Copy style={{...short(14),color:earthen.muted}}>{tr("Voice answer","תשובה בקול")}</Copy></Pressable>}
            </View>)}
          </>}
        </View>
      </ScrollView>
      <View testID="game-dock" style={{direction:"ltr",width:"100%",maxWidth:1120,alignSelf:"center",paddingHorizontal:wide?28:12,paddingBottom:4,flexDirection:"row",alignItems:"flex-end",justifyContent:"space-between"}}>
        <View style={{direction,flexDirection:"row",gap:6,alignItems:"center",flexWrap:"wrap",flex:1}}>
          <RoundAction quiet title={panel?tr("Resume","חזרה למשחק"):tr("Pause","השהיה")} onPress={()=>setPanel(panel?null:"pause")}/>
          {!panel && <RoundAction quiet title={tr("Treasure guide","מקרא האוצרות")} onPress={()=>setPanel("legend")}/>}
        </View>
        <View testID="question-companion" pointerEvents="none"><LifeSprite stage={guideStage(view.character.id,stageIndex)} size={51} frame={reduced||!canRun||!showingQuestion?0:undefined}/></View>
      </View>
    </KeyboardAvoidingView>
    <View ref={layer} collapsable={false} pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill,{direction:"ltr",overflow:"hidden"}]}>
      {flying && feedback?.flight && <CoinFlight path={feedback.flight} onLand={landCoin}/>}
      {bursts>0 && !reduced && <LandmarkBurst key={bursts}/>}
    </View>
  </SafeAreaView>;
}
