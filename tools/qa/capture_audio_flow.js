/* Graba lo que el juego envía a la salida de audio durante el flujo completo, en tiempo real. */
const { chromium } = require("playwright-core"); const fs=require("fs");
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM || undefined,headless:true,args:["--no-sandbox","--disable-gpu","--autoplay-policy=no-user-gesture-required"]});
const pg=await (await b.newContext({viewport:{width:960,height:540},recordVideo:{dir:"/tmp/aud/video",size:{width:960,height:540}}})).newPage(); pg.on("pageerror",e=>console.log("ERR",e.message));
await pg.addInitScript(()=>{
  const taps=new Map(); window.__rec={chunks:[],marks:[],ctxs:0,t0:0};
  const orig=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(dest){
    const r=orig.apply(this,arguments);
    try{ if(dest&&dest===this.context.destination){ let tap=taps.get(this.context);
      if(!tap){ tap=this.context.createMediaStreamDestination(); taps.set(this.context,tap); window.__rec.ctxs++;
        const mr=new MediaRecorder(tap.stream,{mimeType:"audio/webm;codecs=opus",audioBitsPerSecond:128000}); const idx=window.__rec.ctxs; const my=[];
        mr.ondataavailable=e=>{ if(e.data.size) my.push(e.data); }; mr.start(250); window.__rec["mr"+idx]=mr; window.__rec["ch"+idx]=my; window.__rec["start"+idx]=performance.now(); }
      orig.call(this,tap); } }catch(e){}
    return r; };
  window.__mark=n=>window.__rec.marks.push({n,t:performance.now()});
});
await pg.goto("http://localhost:8080/index.html",{waitUntil:"domcontentloaded"});
await pg.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state!=='BOOT');
/* pulsación real para entrar */
for(let i=0;i<90;i++){ if(await pg.evaluate(()=>DD_BOOT.getState().state)==='INTRO') break; await pg.mouse.click(480,270); await pg.waitForTimeout(400); }
await pg.evaluate(()=>{ __mark("intro_inicio"); let last=0,title=false; (function f(){ const s=DD_OPENING.getState&&DD_OPENING.getState(); const st=DD_BOOT.getState().state;
  if(s&&s.shot&&s.shot!==last&&st==='INTRO'){ last=s.shot; __mark("plano_"+s.shot+"@"+(s.t||0).toFixed(3)); }
  if(st==='MAIN_MENU'&&!title){ title=true; __mark("menu"); }
  if(!window.__stopMarks) requestAnimationFrame(f); })(); });
await pg.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU',null,{timeout:60000});
await pg.waitForTimeout(6000);
console.log("estado audio intro en menú",JSON.stringify(await pg.evaluate(()=>DD_OPENING.audioState())));
await pg.evaluate(()=>{document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="new"]').focus(); __mark("nueva_partida");}); await pg.keyboard.press("Enter");
await pg.waitForFunction(()=>DD_BOOT.getState().state==='PLAYING'&&DD_HUB.isActive(),null,{timeout:30000}); await pg.evaluate(()=>__mark("refugio"));
await pg.waitForTimeout(8000); await pg.evaluate(()=>{__mark("fin");window.__stopMarks=true;});
const out=await pg.evaluate(async()=>{ const R=window.__rec, res={marks:R.marks,ctxs:R.ctxs,tracks:[]};
  for(let i=1;i<=R.ctxs;i++){ const mr=R["mr"+i]; await new Promise(r=>{mr.onstop=r;mr.stop();}); const blob=new Blob(R["ch"+i],{type:"audio/webm"}); const buf=new Uint8Array(await blob.arrayBuffer()); let s=""; for(let j=0;j<buf.length;j+=0x8000) s+=String.fromCharCode.apply(null,buf.subarray(j,j+0x8000)); res.tracks.push({i,start:R["start"+i],b64:btoa(s)}); }
  return res; });
fs.mkdirSync("/tmp/aud",{recursive:true});
for(const t of out.tracks){ fs.writeFileSync(`/tmp/aud/ctx${t.i}.webm`,Buffer.from(t.b64,"base64")); console.log("pista",t.i,"inicio",t.start.toFixed(0),"bytes",Buffer.from(t.b64,"base64").length); delete t.b64; }
fs.writeFileSync("/tmp/aud/marks.json",JSON.stringify(out,null,1)); console.log(out.marks.map(m=>m.n+":"+m.t.toFixed(0)).join("  "));
await pg.context().close(); await b.close();})().catch(e=>{console.error("ABORT",e);process.exit(2);});
