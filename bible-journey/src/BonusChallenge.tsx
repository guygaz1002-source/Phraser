import { useEffect, useState } from "react";
import { useCharacters } from "./localizedCatalog";
import { useLocale } from "./LocaleProvider";
import { useTier } from "../theme/ThemeProvider";
import { useGame } from "./GameProvider";
import { current } from "./game";
import { Button, Copy, Panel } from "./components";
import type { BonusQuestion } from "./types";
export function BonusChallenge({question,stopId}:{question:BonusQuestion;stopId?:string}){
 const t=useTier();const {tr}=useLocale();const characters=useCharacters();const {game,dispatch}=useGame();const {journey}=current(game,characters);
 const attempt=journey?.bonus[question.id];
 const [now,setNow]=useState(Date.now);
 useEffect(()=>{if(attempt?.status!=="playing")return;const timer=setInterval(()=>{const n=Date.now();setNow(n);if(n>=attempt.deadline)dispatch({type:"bonus-expire",id:question.id,stopId,now:n});},250);return()=>clearInterval(timer);},[attempt?.status,attempt?.deadline,dispatch,question.id,stopId]);
 const started=attempt?.status==="playing";
 return <Panel><Copy style={{fontSize:20,lineHeight:28}}>{question.title}</Copy>
  {!attempt || attempt.status==="expired" || attempt.status==="wrong" ? <>
   {attempt ? <Copy style={{fontSize:16,lineHeight:25}}>{attempt.status==="expired"?tr("Time is up. You can try again.", "הזמן נגמר. אפשר לנסות שוב."):tr("Keep exploring. You can try again.", "ממשיכים לגלות. אפשר לנסות שוב.")}</Copy>:<Copy style={{fontSize:16,lineHeight:25}}>{tr("An optional 45-second question. Earn one extra token.", "שאלת רשות עם 45 שניות למחשבה. תשובה נכונה מעניקה אסימון נוסף.")}</Copy>}
   <Button title={attempt?tr("Try bonus again", "ניסיון נוסף"):tr("Start bonus question", "התחלת שאלת הבונוס")} onPress={()=>{const n=Date.now();setNow(n);dispatch({type:"bonus-start",id:question.id,stopId,now:n});}} />
  </>:null}
  {started ? <><Copy accessibilityLiveRegion="none" style={{fontSize:16,lineHeight:24}}>{tr(`${Math.max(0,Math.ceil((attempt.deadline-now)/1000))} seconds left`, `נותרו ${Math.max(0,Math.ceil((attempt.deadline-now)/1000))} שניות`)}</Copy><Copy style={{fontSize:t.id==="a"?21:18,lineHeight:29}}>{question.prompt}</Copy>
   {question.options.map((option,i)=><Button key={option} quiet align="start" title={option} onPress={()=>dispatch({type:"bonus-answer",id:question.id,stopId,choice:i,now:Date.now()})} />)}
  </>:null}
  {attempt?.status==="correct"?<><Copy>{tr("Correct! One token earned.", "נכון! קיבלת אסימון נוסף.")}</Copy><Copy style={{fontSize:18,lineHeight:28}}>{question.explanation}</Copy></>:null}
 </Panel>;
}
