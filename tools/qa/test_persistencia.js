/* Pruebas de persistencia. Perfil de navegador nuevo y desechable: no toca datos de nadie. */
const { chromium } = require("playwright-core"); const fs=require("fs");
const URL=process.argv[2]||"http://localhost:8080", OUT=process.argv[3]||"/tmp/evp"; fs.mkdirSync(OUT,{recursive:true});
const res=[]; const check=(n,ok,d)=>{res.push({name:n,ok:!!ok,detail:d===undefined?"":String(d)});console.log((ok?"PASS ":"FAIL ")+n+(d!==undefined?"  ["+d+"]":""));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SEED={dmodisco_currency_v1:"1234",dmodisco_upgrades_v1:JSON.stringify({hp:2,dmg:1}),dmodisco_weapon_prestige_v1:JSON.stringify({m1911:1}),dmodisco_ach_v1:JSON.stringify({first_blood:true,combo10:true}),dmodisco_best_v5:"98765",dmodisco_best_round_v1:"7",dmodisco_best_combo_v216:"33",dmodisco_hist_v3:JSON.stringify([{score:98765,round:7,date:"2026-11-01"}]),dmo_victories_v214:JSON.stringify({count:2,best:311.5}),dmo_secret_route_v32:JSON.stringify({version:"3.2",unlockedEver:true,victories:1,bestTime:400}),
 dmodisco_vol_v1:JSON.stringify({master:0.5,music:0.4,sfx:0.6,dj:0.3}),dmodisco_a11y_v1:JSON.stringify({gfx:"low",flash:false,shake:true}),
 dd_save_v1:JSON.stringify({v:1,created:"2026-10-01T10:00:00.000Z",last:"2026-10-02T10:00:00.000Z",visits:5}),dmo_floor_v32:JSON.stringify({v:1,seed:42,circle:3,floors:{}})};
const dump=pg=>pg.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k);}return o;});
async function toMenu(pg){await pg.waitForFunction(()=>window.DD_BOOT&&DD_BOOT.getState().state==='INTRO',null,{timeout:60000});await pg.evaluate(()=>DD_OPENING.debugSeek(31.7,false));await pg.waitForFunction(()=>DD_BOOT.getState().state==='MAIN_MENU');await sleep(700);}
async function act(pg,a){await pg.evaluate(a=>{const b=document.querySelector('#dd-menu-nav .dd-menu-btn[data-action="'+a+'"]');b.focus();},a);await pg.keyboard.press("Enter");}
(async()=>{const b=await chromium.launch({executablePath:process.env.DD_CHROMIUM || undefined,headless:true,args:["--no-sandbox","--disable-gpu"]});
const cxt=await b.newContext({viewport:{width:1280,height:720}}); const pg=await cxt.newPage(); const errs=[]; pg.on("pageerror",e=>errs.push(e.message));
await pg.goto(URL+"/index.html",{waitUntil:"domcontentloaded"});
await pg.evaluate(S=>{localStorage.clear();for(const k in S)localStorage.setItem(k,S[k]);},SEED);
await pg.reload({waitUntil:"domcontentloaded"}); await toMenu(pg);
const G=await pg.evaluate(()=>({run:DD_UI.storageKeys("RUN"),perm:DD_UI.storageKeys("PERMANENT"),set:DD_UI.storageKeys("SETTINGS")}));
const before=await dump(pg);
check("[AUDITORÍA] toda clave sembrada pertenece a un grupo declarado (run, permanente o ajustes)",Object.keys(SEED).every(k=>G.run.concat(G.perm,G.set).includes(k)));
check("[MENÚ] con partida guardada, CONTINUAR está disponible",await pg.evaluate(()=>!document.querySelector('[data-action="continue"]').hidden));
/* ---- CONTINUAR */
await act(pg,"continue"); const sawDescent=await pg.evaluate(()=>new Promise(r=>{let seen=false;const t0=performance.now();(function f(){if(DD_OPENING.isActive())seen=true;if(DD_BOOT.getState().state==='PLAYING'&&DD_HUB.isActive()||performance.now()-t0>8000)return r(seen);requestAnimationFrame(f);})();})); await sleep(500);
let d=await dump(pg); let sv=JSON.parse(d.dd_save_v1);
check("[CONTINUAR] entra al Refugio sin reproducir el descenso",sawDescent===false&&await pg.evaluate(()=>DD_BOOT.getState().state==='PLAYING'&&DD_HUB.isActive()));
check("[CONTINUAR] conserva la ficha: misma fecha de creación, una visita más",sv.created===JSON.parse(SEED.dd_save_v1).created&&sv.visits===6,sv.created+" · visitas "+sv.visits);
check("[CONTINUAR] no borra el estado de run (planta guardada intacta)",d.dmo_floor_v32===SEED.dmo_floor_v32);
check("[CONTINUAR] progreso permanente idéntico byte a byte",G.perm.every(k=>d[k]===before[k]),G.perm.filter(k=>d[k]!==before[k]).join(",")||"10 claves iguales");
await pg.screenshot({path:OUT+"/refugio_idle07b_continuar.jpg",type:"jpeg",quality:90});
/* ---- NUEVA PARTIDA */
await pg.reload({waitUntil:"domcontentloaded"}); await toMenu(pg);
const b2=await dump(pg);
await act(pg,"new"); await pg.waitForFunction(()=>DD_OPENING.isActive());
const mid=await dump(pg);
check("[NUEVA PARTIDA] al pulsar no aparece ninguna confirmación de borrado ni se borra nada",G.perm.every(k=>mid[k]===b2[k])&&await pg.evaluate(()=>!document.getElementById("dd-erase-yes")));
await pg.waitForFunction(()=>DD_BOOT.getState().state==='PLAYING'&&DD_HUB.isActive(),null,{timeout:20000}); await sleep(500);
d=await dump(pg); sv=JSON.parse(d.dd_save_v1);
check("[NUEVA PARTIDA] ficha nueva: fecha de creación de hoy y visitas a 1",sv.created!==JSON.parse(SEED.dd_save_v1).created&&sv.visits===1&&sv.v===1,sv.created+" · visitas "+sv.visits+" · partida nº "+sv.runs);
check("[NUEVA PARTIDA] reinicia el estado de run: la planta de la incursión anterior ya no está",!("dmo_floor_v32" in d));
for(const k of G.perm) check("[NUEVA PARTIDA] conserva "+k,d[k]===b2[k],String(d[k]).slice(0,40));
check("[NUEVA PARTIDA] conserva los ajustes",G.set.filter(k=>k in b2).every(k=>d[k]===b2[k]),G.set.filter(k=>k in b2).length+" claves");
check("[NUEVA PARTIDA] no elimina ninguna otra clave del almacenamiento",Object.keys(b2).filter(k=>!(k in d)).join(",")==="dmo_floor_v32",Object.keys(b2).filter(k=>!(k in d)).join(","));
const eng=await pg.evaluate(()=>{const p=DD_UI.readProgress();return {currency:p.currency,best:p.best,ach:p.achievements.length};});
check("[NUEVA PARTIDA] el juego sigue leyendo el progreso: 1234 fichas, récord 98765, 2 logros",eng.currency===1234&&eng.best===98765&&eng.ach===2,JSON.stringify(eng));
const hub=await pg.evaluate(()=>DD_HUB.getState());
check("[REFUGIO] el protagonista es el IDLE 07B (PNG aprobado)",hub.protagonist==="idle_07b"&&/fidelidad\/pm_idle_fid_00\.png$/.test(hub.protagonistSrc),hub.protagonist);
check("[REFUGIO] sin deformar: proporción 288:512 exacta",Math.abs(hub.protagonistAspect-288/512)<0.001,hub.protagonistAspect);
const r=hub.protagonistRect, gm=await pg.evaluate(()=>{const c=document.getElementById("game");return {w:c.width,h:c.height};});
check("[REFUGIO] se dibuja el PNG completo (288×512 a escala uniforme), no un recorte",!!r&&Math.abs(r.w/288-r.h/512)<0.001&&r.h>100&&r.h<140,JSON.stringify(r)+" · el encuadre en pantalla se revisa a ojo en las capturas");
await pg.screenshot({path:OUT+"/refugio_idle07b_1280x720.jpg",type:"jpeg",quality:92});
await pg.screenshot({path:OUT+"/refugio_idle07b_detalle.png",clip:{x:500,y:240,width:280,height:240}});
await pg.keyboard.down("a"); await sleep(900); await pg.screenshot({path:OUT+"/refugio_idle07b_andando.jpg",type:"jpeg",quality:90}); await pg.keyboard.up("a");
await pg.keyboard.down("w"); await sleep(1400); await pg.keyboard.up("w"); await sleep(300); await pg.screenshot({path:OUT+"/refugio_idle07b_borde_superior.jpg",type:"jpeg",quality:90});
const h2=await pg.evaluate(()=>DD_HUB.getState());
check("[REFUGIO] al andar sigue siendo el mismo dibujo, con la misma proporción",h2.protagonist==="idle_07b"&&Math.abs(h2.protagonistAspect-288/512)<0.001&&(h2.x!==hub.x||h2.y!==hub.y),"de "+hub.x+","+hub.y+" a "+h2.x+","+h2.y);
for(const [w,h] of [[1920,1080],[2560,1440]]){await pg.setViewportSize({width:w,height:h});await sleep(500);await pg.screenshot({path:OUT+`/refugio_idle07b_${w}x${h}.jpg`,type:"jpeg",quality:85});const hh=await pg.evaluate(()=>DD_HUB.getState());check(`[REFUGIO] ${w}×${h}: IDLE 07B con proporción correcta`,hh.protagonist==="idle_07b"&&Math.abs(hh.protagonistAspect-0.5625)<0.001);}
await pg.setViewportSize({width:1280,height:720});
/* ---- BORRAR DATOS */
await pg.reload({waitUntil:"domcontentloaded"}); await toMenu(pg);
const b3=await dump(pg);
await act(pg,"options"); await pg.waitForSelector("#dd-opt-erase"); await sleep(300);
await pg.screenshot({path:OUT+"/opciones_datos_guardados.jpg",type:"jpeg",quality:88});
check("[BORRAR DATOS] es una acción aparte, dentro de OPCIONES; no está en el menú principal",await pg.evaluate(()=>!!document.getElementById("dd-opt-erase")&&!document.querySelector('#dd-menu-nav [data-action="erase"]')));
await pg.evaluate(()=>document.getElementById("dd-opt-erase").scrollIntoView()); await pg.click("#dd-opt-erase"); await pg.waitForSelector("#dd-erase-yes"); await sleep(300);
await pg.screenshot({path:OUT+"/borrar_datos_confirmacion.jpg",type:"jpeg",quality:88});
let cur=await dump(pg);
check("[BORRAR DATOS] abrir la pantalla no borra nada",Object.keys(b3).every(k=>cur[k]===b3[k]));
const info=await pg.evaluate(()=>({list:document.getElementById("dd-erase-list").innerText,keep:document.getElementById("dd-erase-keep").innerText,focus:document.activeElement&&document.activeElement.id}));
check("[BORRAR DATOS] informa de qué se elimina (12 conceptos, con su valor actual)",/FICHAS/i.test(info.list)&&/1234/.test(info.list)&&/LOGROS/i.test(info.list)&&/MEJORAS/i.test(info.list)&&/FICHA DE LA PARTIDA/i.test(info.list)&&(info.list.match(/\n/g)||[]).length>=20,info.list.replace(/\n/g," ").slice(0,110));
check("[BORRAR DATOS] informa de qué se conserva (ajustes)",/ajustes/i.test(info.keep));
check("[BORRAR DATOS] el foco entra en CANCELAR",info.focus==="dd-erase-no",info.focus);
await pg.keyboard.press("Enter"); await sleep(400); cur=await dump(pg);
check("[BORRAR DATOS] CANCELAR (Enter con el foco inicial) no borra nada y vuelve al menú",Object.keys(b3).every(k=>cur[k]===b3[k])&&await pg.evaluate(()=>DD_BOOT.getState().state==='MAIN_MENU'));
await act(pg,"options"); await pg.waitForSelector("#dd-opt-erase"); await pg.evaluate(()=>document.getElementById("dd-opt-erase").scrollIntoView()); await pg.click("#dd-opt-erase"); await pg.waitForSelector("#dd-erase-yes"); await sleep(200);
await pg.keyboard.press("Escape"); await sleep(400); cur=await dump(pg);
check("[BORRAR DATOS] ESC tampoco borra",Object.keys(b3).every(k=>cur[k]===b3[k]));
await act(pg,"options"); await pg.waitForSelector("#dd-opt-erase"); await pg.evaluate(()=>document.getElementById("dd-opt-erase").scrollIntoView()); await pg.click("#dd-opt-erase"); await pg.waitForSelector("#dd-erase-yes"); await sleep(200);
await Promise.all([pg.waitForNavigation({waitUntil:"domcontentloaded"}),pg.click("#dd-erase-yes")]);
await toMenu(pg); cur=await dump(pg);
check("[BORRAR DATOS] tras confirmar: partida y progreso permanente eliminados (también después de recargar)",G.run.concat(G.perm).every(k=>!(k in cur)),G.run.concat(G.perm).filter(k=>k in cur).join(",")||"12 claves fuera");
check("[BORRAR DATOS] los ajustes siguen intactos",cur.dmodisco_vol_v1===SEED.dmodisco_vol_v1&&cur.dmodisco_a11y_v1===SEED.dmodisco_a11y_v1);
check("[BORRAR DATOS] sin partida, CONTINUAR desaparece del menú",await pg.evaluate(()=>document.querySelector('[data-action="continue"]').hidden));
await pg.screenshot({path:OUT+"/menu_tras_borrar_datos.jpg",type:"jpeg",quality:88});
check("[GENERAL] sin errores de JavaScript durante la prueba",errs.length===0,errs.slice(0,2).join(" | "));
const okN=res.filter(r=>r.ok).length; console.log("\n"+okN+" de "+res.length+" superadas");
fs.writeFileSync(OUT+"/qa_persistencia.json",JSON.stringify({fecha:new Date().toISOString(),url:URL,nota:"Perfil de navegador desechable con datos sembrados por la prueba.",superadas:okN,total:res.length,resultados:res},null,1));
await b.close(); process.exit(okN===res.length?0:1);})().catch(e=>{console.error("ABORT",e);process.exit(2);});
