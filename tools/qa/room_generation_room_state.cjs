// Diagnostic: in-run revisit and reload behavior, seed 0, isolated browser profile.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM,args:['--no-sandbox','--disable-gpu']});const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 const url=(process.argv[2]||'http://127.0.0.1:8000')+'/?roomDebug&roomSeed=0';
 async function boot(){await p.waitForFunction(()=>DD_BOOT?.getState().state==='MAIN_MENU');await p.evaluate(()=>{DD_HUB.enter();DD_HUB.exitToRun();});await p.waitForFunction(()=>__DD_BRIDGE.isRunning());}
 async function go(key){await p.evaluate(k=>DMO.explore.debug({action:'goto',key:k}),key);await p.waitForFunction(k=>DMO.explore.state().key===k,key);await p.waitForTimeout(350);}
 await p.goto(url);await boot();const secret=await p.evaluate(()=>DD_ROOM_DEBUG.current().nodes.find(n=>n.type==='secret').key);
 const initial=await p.evaluate(k=>{let s=DMO.explore.state();return {visited:s.nodes.find(n=>n.key===k).visited,known:s.nodes.find(n=>n.key===k).known};},secret);
 await go('r1');await p.evaluate(()=>DMO.explore.debug({action:'clear'}));await p.waitForFunction(()=>{const s=DMO.explore.state();return s.cleared&&s.doors.length>0&&s.doors.every(d=>d.open);});
 const cleared=await p.evaluate(()=>{let s=DMO.explore.state();return {cleared:s.cleared,doors:s.doors.map(d=>({to:d.to,open:d.open})),visited:s.visited};});
 await go(secret);const revealed=await p.evaluate(k=>{let n=DMO.explore.state().nodes.find(n=>n.key===k);return {visited:n.visited,known:n.known};},secret);await go('r1');
 const revisit=await p.evaluate(()=>{let s=DMO.explore.state();return {cleared:s.cleared,doors:s.doors.map(d=>({to:d.to,open:d.open})),visited:s.visited,snapshots:s.snapshots};});
 assert(cleared.cleared&&revisit.cleared);assert.deepEqual(revisit.doors,cleared.doors);assert(!initial.visited&&revealed.visited&&revealed.known);assert(revisit.visited.includes(secret));
 await p.reload();await boot();const restarted=await p.evaluate(k=>{let s=DMO.explore.state(),n=s.nodes.find(n=>n.key===k);return {current:s.key,clearedR1:s.nodes.find(n=>n.key==='r1').cleared,secretVisited:n.visited,secretKnown:n.known,visited:s.visited,seed:JSON.parse(localStorage.getItem('dmo_floor_v32')).seed};},secret);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({seed:0,secret,initial,cleared,revealed,revisit,restarted,scope:'Debug teleport and clear; restart via HUB.exitToRun, not a claimed save/resume of an active run. Does not test looted chests or natural combat.'},null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
