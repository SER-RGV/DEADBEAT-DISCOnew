// Reproducible source-coupled saturation gate audit. Run from repository root.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const FSM=require('/home/user/DEADBEAT-DISCOnew/boss_animation_state_machine.js');
const root=process.cwd(),auditDir=path.resolve(__dirname);
const html=fs.readFileSync(path.join(root,'DEADBEAT_DISCO.ART.html'),'utf8');
const profiles=JSON.parse(fs.readFileSync(path.join(auditDir,'scenario_matrix.json'),'utf8')).cases.map(c=>c.identity);
function balanced(source,marker,open='{') { const at=source.indexOf(marker); if(at<0)throw Error('missing '+marker);const begin=source.indexOf(open,at),close=open==='{'?'}':']';let depth=0,quote='',escaped=false;for(let i=begin;i<source.length;i++){const ch=source[i];if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote='';continue;}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}if(ch===open)depth++;else if(ch===close&&--depth===0)return source.slice(at,i+1);}throw Error('unclosed '+marker);}
const func=sig=>balanced(html,sig),aoSource=balanced(html,'Ao={');
const ctx={window:{DMO_BOSS_ANIMATION_FSM:FSM},Ao:vm.runInNewContext(`(${aoSource.slice(aoSource.indexOf('{'))})`),Ia:[],Gr:{budget:{projectiles:36}},yl:false,Zr:null,df:null,Da:[],ye:{x:100,y:100},kp:{records:[],add(record){this.records.push(record);}},events:[],vhCalls:0,nc:()=>{ctx.vhCalls++;return true;},corridor:true,Mh:()=>60,js:()=>true,kh:()=>Math.PI/4,Eh:()=>ctx.corridor,Pp(){},ih:(kind,detail)=>ctx.events.push({kind,detail}),Nd(a,b){let d=Math.abs(a-b)%(2*Math.PI);return Math.min(d,2*Math.PI-d);},Sh(){return false;},console};
vm.createContext(ctx);
const vh=func('function vh(e,a,t,o)'),wh=func('function wh(e,a)'),th=func('function Th(e,a)'),bridge=balanced(html,'Th=function(e,a)');
vm.runInContext(`${vh}\n${wh}\n${th}`,ctx);ctx.Sy=ctx.Th;vm.runInContext(bridge,ctx);
function step(e,dt=.05){ctx.Th(e,dt);if(e._ddaAttackT>0)e._ddaAttackT=Math.max(0,e._ddaAttackT-dt);FSM.update(e,dt,{patterns:ctx.Ao,player:ctx.ye});return FSM.drainEvents(e).map(x=>({type:x.type,detail:x.detail||{}}));}
function boss(p){return{resident:p.resident,variant:p.variant,final:!!p.final,finalStage:0,hp:100,x:100,y:100,r:34,phase:'ranged',entrance:0,attackTimer:0,hitFlash:0,addsAlive:0,addsMax:p.configuredAdds||0,addsSpawned:0,exposedT:0,berserk:false,pattern71:'',patternWarn71:0,patternShot71:0,patternStep71:0,patternExec71:0,patternIndex71:0,patterns72:p.patterns.slice(),patternAttempt71:0,patternAccepted71:0,patternCreated71:0,patternCompleted71:false,sweep:null,variantAttack:1};}
const out={suite:'B4.2 source-coupled post-R1 saturation across active profile configs',status:'PASS',source:'actual DEADBEAT_DISCO.ART.html vh()/wh()/Th()/B2 observer and actual FSM; only synthetic Ia load/lifetime controlled',load:{projectileBudget:36,thresholdFormula:'t=max(18,min(60,budget+24)) = 60',gate:'Ia.length > 0.55*t; 34 > 33',heldSeconds:10,heldCount:34,expirySeconds:3.6},profiles:[]};
for(const p of profiles){const e=boss(p);ctx.Ia.length=0;ctx.events.length=0;ctx.kp.records.length=0;ctx.vhCalls=0;
  for(let i=0;i<34;i++)ctx.Ia.push({life:3.6,syntheticLoad:true});
  let selectedDuringHold=false,lifeTicks=200,holdAttackEvents=0,holdB2=[];
  for(let i=0;i<lifeTicks;i++){
    for(const bullet of ctx.Ia)bullet.life-=.05;
    for(let j=ctx.Ia.length-1;j>=0;j--)if(ctx.Ia[j].life<=0)ctx.Ia.splice(j,1);
    while(ctx.Ia.length<34)ctx.Ia.push({life:3.6,syntheticLoad:true});
    for(const bullet of ctx.Ia)bullet.life=3.6; // active source continuously refreshes the sustained 34-count load
    const events=step(e);if(e.pattern71)selectedDuringHold=true;
    holdB2.push(...events.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type)));
  }
  const indexHeld=e.patternIndex71,timerHeld=+e.attackTimer.toFixed(2),activeHeld=e.pattern71||'';
  let expiredAt=null,selectedAt=null,selectedPattern=null,releaseTick=0,releaseB2=[];
  for(;releaseTick<140;releaseTick++){
    for(const bullet of ctx.Ia)bullet.life-=.05;
    for(let j=ctx.Ia.length-1;j>=0;j--)if(ctx.Ia[j].life<=0)ctx.Ia.splice(j,1);
    if(expiredAt===null&&ctx.Ia.length<=33)expiredAt=+(releaseTick+1)*.05;
    const events=step(e);releaseB2.push(...events.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type)));
    if(e.pattern71){selectedAt=+(releaseTick+1)*.05;selectedPattern=e.pattern71;break;}
  }
  const record={resident:p.resident,variant:p.variant,patterns:p.patterns,holdSeconds:10,loadCountMax:34,selectedDuringHold,selectorIndexDuringHold:indexHeld,activePatternDuringHold:activeHeld,attackTimerAtHoldEnd:timerHeld,b2AttackEventsDuringHold:holdB2.length,syntheticProjectilesExpiredBy:expiredAt,selectedAfterReleaseSeconds:selectedAt,selectedPatternAfterRelease:selectedPattern,attemptedAtNewSelection:e.patternAttempt71,acceptedAtNewSelection:e.patternAccepted71,createdAtNewSelection:e.patternCreated71,releaseAttackEvents:releaseB2.map(x=>x.type),recoveryWithin5s:selectedAt!==null};
  if(record.selectedDuringHold||record.selectorIndexDuringHold!==0||record.activePatternDuringHold||record.b2AttackEventsDuringHold||record.selectedAfterReleaseSeconds===null||record.attemptedAtNewSelection||record.acceptedAtNewSelection||record.createdAtNewSelection)out.status='FAIL';
  out.profiles.push(record);
}
console.log(JSON.stringify(out,null,2));
