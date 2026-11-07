// Reproducible source-coupled R1 acceptance/rejection, sequence, cancellation and reset audit. Run from repository root.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=process.cwd(),auditDir=path.resolve(__dirname),FSM=require(path.join(root,'boss_animation_state_machine.js'));
const html=fs.readFileSync(path.join(root,'DEADBEAT_DISCO.ART.html'),'utf8');
const profiles=JSON.parse(fs.readFileSync(path.join(auditDir,'scenario_matrix.json'),'utf8')).cases.map(c=>c.identity);
function balanced(source,marker,open='{'){const at=source.indexOf(marker);if(at<0)throw Error('missing '+marker);const begin=source.indexOf(open,at),close=open==='{'?'}':']';let depth=0,quote='',escaped=false;for(let i=begin;i<source.length;i++){const ch=source[i];if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote='';continue}if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}if(ch===open)depth++;else if(ch===close&&--depth===0)return source.slice(at,i+1)}throw Error('unclosed '+marker)}
const functionSource=s=>balanced(html,s),aoSource=balanced(html,'Ao={');
const ctx={window:{DMO_BOSS_ANIMATION_FSM:FSM},Ao:vm.runInNewContext(`(${aoSource.slice(aoSource.indexOf('{'))})`),Ia:[],Gr:{budget:{projectiles:36}},yl:false,Zr:null,df:null,Da:[],ye:{x:100,y:100},kp:{records:[],add(r){this.records.push(r)}},events:[],vhCalls:0,emissionsBeforeRejection:0,corridor:true,Mh:()=>60,js:()=>true,nc:()=>{ctx.vhCalls++;return ctx.vhCalls>ctx.emissionsBeforeRejection},kh:()=>Math.PI/4,Eh:()=>ctx.corridor,Pp(){},ih:(kind,detail)=>ctx.events.push({kind,detail}),Nd(a,b){let d=Math.abs(a-b)%(2*Math.PI);return Math.min(d,2*Math.PI-d)},Sh(){return false},console};
vm.createContext(ctx);const vh=functionSource('function vh(e,a,t,o)'),wh=functionSource('function wh(e,a)'),th=functionSource('function Th(e,a)'),bridge=balanced(html,'Th=function(e,a)');vm.runInContext(`${vh}\n${wh}\n${th}`,ctx);ctx.Sy=ctx.Th;vm.runInContext(bridge,ctx);
function makeBoss(p){return{resident:p.resident,variant:p.variant,final:!!p.final,finalStage:0,hp:100,x:100,y:100,r:34,phase:'ranged',entrance:0,attackTimer:0,hitFlash:0,addsAlive:0,addsMax:p.configuredAdds||0,addsSpawned:0,exposedT:0,berserk:false,pattern71:'',patternWarn71:0,patternShot71:0,patternStep71:0,patternExec71:0,patternIndex71:0,patterns72:p.patterns.slice(),patternAttempt71:0,patternAccepted71:0,patternCreated71:0,patternCompleted71:false,sweep:null,variantAttack:1};}
function step(e){ctx.Th(e,.05);if(e._ddaAttackT>0)e._ddaAttackT=Math.max(0,e._ddaAttackT-.05);FSM.update(e,.05,{patterns:ctx.Ao,player:ctx.ye});return FSM.drainEvents(e).map(x=>({type:x.type,detail:x.detail||{}}));}
function resetCtx(){ctx.Ia.length=0;ctx.kp.records.length=0;ctx.events.length=0;ctx.vhCalls=0;ctx.corridor=true;}
function chooseProjectile(p){return p.patterns.find(name=>name!=='summon'&&ctx.Ao[name]);}
function execute(p,mode,pattern){resetCtx();const index=p.patterns.indexOf(pattern),e=makeBoss(p);e.patternIndex71=index;ctx.emissionsBeforeRejection=mode==='reject'?0:mode==='partial'?2:1000;
  const b2=[];let steps=0;let selected=[];for(;steps<60&&!e.pattern71;steps++){b2.push(...step(e));if(e.pattern71)selected.push(e.pattern71)}
  if(e.pattern71!==pattern)throw Error(`${p.resident}/${mode}: scheduler selected ${e.pattern71}, expected ${pattern}; profile patterns=${p.patterns}`);
  let warning=0;while(e.patternWarn71>0&&warning++<60)b2.push(...step(e));
  let emissionSteps=0;while(e.pattern71&&emissionSteps++<120)b2.push(...step(e));
  const counts={attempted:e.patternAttempt71||0,accepted:e.patternAccepted71||0,created:e.patternCreated71||0,patternSlots:e.patternShot71||0,schedulerCompleted:e.patternCompleted71===true,patternCleared:!e.pattern71};
  let nextSelection=null;
  if(mode==='reject'){
    let wait=0;for(;wait<100&&!e.pattern71;wait++)b2.push(...step(e));
    if(e.pattern71)nextSelection={pattern:e.pattern71,selectorIndex:e.patternIndex71||0,attempted:e.patternAttempt71||0,accepted:e.patternAccepted71||0,created:e.patternCreated71||0,waitTicks:wait};
  }
  const lifecycle=b2.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type));
  return{resident:p.resident,variant:p.variant,pattern,mode,selectionIndex:index,selectionConfirmed:true,warningTicks:warning,emissionTicks:emissionSteps,counts,nextSelection,b2Lifecycle:lifecycle,hostileProjectiles:ctx.Ia.length,trackingRecords:ctx.kp.records.length};
}
function scriptedSequence(p,length){
  resetCtx();ctx.vhCalls=0;ctx.emissionsBeforeRejection=1000;ctx.corridor=true;
  const catalog=p.patterns.filter(name=>name!=='summon');
  const sequence=Array.from({length},(_,i)=>catalog[i%catalog.length]);
  const e=makeBoss(p);e.patterns72=sequence.slice();e.patternIndex71=0;
  const allEvents=[],attacks=[];let tick=0;
  const advance=()=>{allEvents.push(...step(e));tick++};
  for(let i=0;i<length;i++){
    const eventMark=allEvents.length;let wait=0;
    while(!e.pattern71&&tick<1200){advance();wait++}
    if(!e.pattern71)throw Error(`${p.resident} sequence${length} blocked before attack ${i+1}`);
    const pattern=e.pattern71,selectedAt=Number((tick*.05).toFixed(2));
    if(pattern!==sequence[i])throw Error(`${p.resident} sequence${length}: selected ${pattern}, expected ${sequence[i]}`);
    let warningTicks=0;while(e.patternWarn71>0&&tick<1500){advance();warningTicks++}
    let emissionTicks=0;while(e.pattern71&&tick<2000){advance();emissionTicks++}
    if(e.pattern71)throw Error(`${p.resident} sequence${length} ${pattern} did not complete`);
    const counts={attempted:Number(e.patternAttempt71)||0,accepted:Number(e.patternAccepted71)||0,created:Number(e.patternCreated71)||0,patternSlots:Number(e.patternShot71)||0,schedulerCompleted:e.patternCompleted71===true};
    const lifecycle=allEvents.slice(eventMark).filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type));
    const attackRecord={index:i+1,pattern,selectedAt,waitTicks:wait,warningTicks,emissionTicks,completedAt:Number((tick*.05).toFixed(2)),counts,lifecycle,nextSelection:null};
    if(counts.attempted<=0||counts.accepted!==counts.attempted||counts.created!==counts.accepted||!counts.schedulerCompleted||lifecycle.filter(x=>x.type==='attack.start').length!==1||lifecycle.filter(x=>x.type==='attack.end'&&x.detail.completed===true).length!==1||lifecycle.filter(x=>x.type==='recovery.start').length!==1||lifecycle.some(x=>x.type==='attack.interrupted'))throw Error(`${p.resident} sequence${length} attack ${i+1} lifecycle/count mismatch`);
    attacks.push(attackRecord);
    // Model the already-completed synthetic projectiles expiring before the next scheduler selection.
    ctx.Ia.length=0;ctx.kp.records.length=0;
    if(i<length-1){
      const cooldownStart=tick;let recoveryWait=0;
      while(!e.pattern71&&tick<2500){advance();recoveryWait++}
      if(!e.pattern71||e.pattern71!==sequence[i+1])throw Error(`${p.resident} sequence${length}: next selection after ${pattern} was ${e.pattern71||'none'}, expected ${sequence[i+1]}`);
      attackRecord.nextSelection={pattern:e.pattern71,selectorIndex:e.patternIndex71||0,time:Number((tick*.05).toFixed(2)),recoveryTicks:recoveryWait,recoverySeconds:Number((recoveryWait*.05).toFixed(2)),cooldownTicksFromCompletion:tick-cooldownStart};
    }
  }
  // Let the final normal recovery settle, while remaining inside the existing next-selection cooldown.
  let recoveryTicks=0;while(recoveryTicks<80&&FSM.get(e).state==='ATTACK_RECOVERY'){advance();recoveryTicks++}
  const preResetState=FSM.get(e).state;FSM.drainEvents(e);const resetReturned=FSM.reset(e);const resetState=FSM.get(e),resetEvents=FSM.drainEvents(e);
  const residualLifecycle=resetEvents.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type)).length;
  return{resident:p.resident,length,sequence,attacks,total:{attempted:attacks.reduce((s,x)=>s+x.counts.attempted,0),accepted:attacks.reduce((s,x)=>s+x.counts.accepted,0),created:attacks.reduce((s,x)=>s+x.counts.created,0)},settledRecoveryTicks:recoveryTicks,preResetState,resetReturned,postResetState:resetState.state,residualLifecycleEvents:residualLifecycle,status:residualLifecycle===0&&resetReturned?'PASS':'FAIL'};
}
const out={suite:'B4.2 R1 controlled actual-source scheduler/FSM by profile',status:'PASS',source:'active HTML vh()/wh()/Th()/actual B2 Th observer plus current FSM, extracted verbatim; acceptance/corridor dependencies controlled',profileScenarios:[],checks:{}};
for(const p of profiles){const pattern=chooseProjectile(p);if(!pattern)throw Error('no projectile pattern for '+p.resident);
  const reject=execute(p,'reject',pattern),partial=execute(p,'partial',pattern),full=execute(p,'full',pattern),sequence2=scriptedSequence(p,2),sequence3=scriptedSequence(p,3);
  const zeroPattern=p.patterns.find(name=>['ring','spiral'].includes(name)&&ctx.Ao[name]);resetCtx();const idx=p.patterns.indexOf(zeroPattern),e=makeBoss(p);e.patternIndex71=idx;const cancelEvents=[];let n=0;while(!e.pattern71&&n++<60)cancelEvents.push(...step(e));while(e.patternWarn71>0&&n++<120)cancelEvents.push(...step(e));ctx.corridor=false;while(e.pattern71&&n++<160)cancelEvents.push(...step(e));ctx.corridor=true;
  const cancellation={resident:p.resident,pattern:zeroPattern,attempted:e.patternAttempt71||0,accepted:e.patternAccepted71||0,created:e.patternCreated71||0,patternCompleted:e.patternCompleted71===true,patternCleared:!e.pattern71,b2Lifecycle:cancelEvents.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type))};
  const fresh=FSM.reset(e);const freshSnap=FSM.get(e),freshEvents=FSM.drainEvents(e);const reset={resetReturned:fresh,state:freshSnap.state,pattern:freshSnap.pattern||null,attackLifecycleResidual:freshEvents.filter(x=>['attack.start','attack.end','attack.interrupted','recovery.start'].includes(x.type)).length};
  const record={resident:p.resident,variant:p.variant,patternCatalog:p.patterns,reject,partial,full,sequence2,sequence3,cancellation,reset};out.profileScenarios.push(record);
  const validCase=(x,kind)=>{if(kind==='reject')return x.counts.attempted>0&&x.counts.accepted===0&&x.counts.created===0&&x.counts.schedulerCompleted&&x.counts.patternCleared&&x.b2Lifecycle.length===0&&!!x.nextSelection&&x.nextSelection.attempted===0&&x.nextSelection.accepted===0&&x.nextSelection.created===0;
    if(kind==='partial')return x.counts.attempted>2&&x.counts.accepted===2&&x.counts.accepted<x.counts.attempted&&x.counts.created===x.counts.accepted&&x.counts.schedulerCompleted&&x.b2Lifecycle.filter(e=>e.type==='attack.start').length===1&&x.b2Lifecycle.filter(e=>e.type==='attack.end'&&e.detail.completed===true).length===1&&!x.b2Lifecycle.some(e=>e.type==='attack.interrupted');
    return x.counts.attempted>0&&x.counts.accepted===x.counts.attempted&&x.counts.created===x.counts.accepted&&x.counts.schedulerCompleted&&x.b2Lifecycle.filter(e=>e.type==='attack.start').length===1&&x.b2Lifecycle.filter(e=>e.type==='attack.end'&&e.detail.completed===true).length===1&&!x.b2Lifecycle.some(e=>e.type==='attack.interrupted')};
  if(!validCase(reject,'reject')||!validCase(partial,'partial')||!validCase(full,'full')||sequence2.status!=='PASS'||sequence3.status!=='PASS'||cancellation.attempted!==0||cancellation.accepted!==0||cancellation.created!==0||cancellation.b2Lifecycle.length||reset.attackLifecycleResidual)out.status='FAIL';
}
out.checks={profileCount:out.profileScenarios.length,allTotalRejectCasesPass:out.profileScenarios.every(x=>x.reject.counts.accepted===0&&x.reject.b2Lifecycle.length===0),allPartialCasesPass:out.profileScenarios.every(x=>x.partial.counts.accepted>0&&x.partial.counts.accepted<x.partial.counts.attempted&&x.partial.b2Lifecycle.filter(e=>e.type==='attack.start').length===1&&x.partial.b2Lifecycle.filter(e=>e.type==='attack.end').length===1),allFullCasesPass:out.profileScenarios.every(x=>x.full.counts.accepted===x.full.counts.attempted&&x.full.b2Lifecycle.filter(e=>e.type==='attack.start').length===1&&x.full.b2Lifecycle.filter(e=>e.type==='attack.end').length===1),allTwoAttackSequencesPass:out.profileScenarios.every(x=>x.sequence2.status==='PASS'&&x.sequence2.attacks.length===2),allThreeAttackSequencesPass:out.profileScenarios.every(x=>x.sequence3.status==='PASS'&&x.sequence3.attacks.length===3),allZeroAttemptCancellationsPass:out.profileScenarios.every(x=>x.cancellation.attempted===0&&x.cancellation.b2Lifecycle.length===0),allResetsPass:out.profileScenarios.every(x=>x.reset.attackLifecycleResidual===0)};
console.log(JSON.stringify(out,null,2));if(out.status!=='PASS')process.exitCode=1;
