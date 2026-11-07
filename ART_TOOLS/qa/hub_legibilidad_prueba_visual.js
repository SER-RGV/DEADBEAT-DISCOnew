/* PRUEBA VISUAL DE CORRECCIÓN (reproducible).
 * Requiere insertar TEMPORALMENTE el módulo reversible documentado en
 * ART_EVIDENCE/hub/legibilidad/propuesta_modulo_reversible.js.txt y
 * restaurar el HTML después (SHA-256 verificado). NO deja cambios en el juego.
 * Uso: node ART_TOOLS/qa/hub_legibilidad_prueba_visual.js
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs=require('fs'); const path=require('path');
const OUT='/home/user/DEADBEAT-DISCOnew/ART_EVIDENCE/hub/legibilidad';
const POS=[['centro',1250,965],['norte',1250,600],['nw',882,655],['este',1622,910],['sur',1250,1250],['borde',1250,1420]];
(async()=>{
  const b=await chromium.launch({executablePath:'/tmp/chromium',headless:true,
    env:{...process.env,LD_LIBRARY_PATH:'/tmp/chromelibs/lib:/tmp'},
    args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking']});
  const c=await b.newContext({viewport:{width:1280,height:900}});
  await c.addInitScript(()=>{window.__DDM_HUB_T09=false;});
  const p=await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html',{waitUntil:'load',timeout:180000});
  await p.waitForFunction(()=>{try{return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status);}catch(e){return false;}},{timeout:90000});
  await p.mouse.click(640,450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(()=>{try{return window.DMO_HUB.state().inHub;}catch(e){return false;}},{timeout:30000});
  await p.waitForTimeout(1800);
  const R={generatedAt:new Date().toISOString(),pageerrors:errs,posiciones:[]};
  R.estadoInicial=await p.evaluate(()=>window.DMO_HUB_LEGIBILIDAD_TEST.state());
  const cap=async(tag,id,x,y)=>{
    await p.evaluate(([a,b2])=>window.DMO.debug.teleport(a,b2),[x,y]);
    await p.waitForTimeout(300);
    const f='prueba_'+tag+'_'+id+'.jpg';
    await p.screenshot({path:path.join(OUT,f),type:'jpeg',quality:90});
    return f;
  };
  for(let i=0;i<POS.length;i++){
    const [id,x,y]=POS[i];
    R.posiciones.push({id,camera:[x,y],antes:await cap('antes',id,x,y)});
  }
  R.estadoAplicado=await p.evaluate(()=>{window.DMO_HUB_LEGIBILIDAD_TEST.setEnabled(true);return window.DMO_HUB_LEGIBILIDAD_TEST.state();});
  await p.waitForTimeout(500);
  for(let i=0;i<POS.length;i++){
    const [id,x,y]=POS[i];
    R.posiciones[i].despues=await cap('despues',id,x,y);
  }
  /* reversibilidad: volver a false y comparar con el ANTES */
  R.estadoRestaurado=await p.evaluate(()=>{window.DMO_HUB_LEGIBILIDAD_TEST.setEnabled(false);return window.DMO_HUB_LEGIBILIDAD_TEST.state();});
  await p.waitForTimeout(400);
  R.restaurado=[];
  for(const [id,x,y] of [POS[0],POS[4]]){
    R.restaurado.push({id,file:await cap('restaurado',id,x,y)});
  }
  fs.writeFileSync(path.join(OUT,'prueba_correccion.json'),JSON.stringify(R,null,2)+'\n');
  console.log('inicial',JSON.stringify(R.estadoInicial));
  console.log('aplicado',JSON.stringify(R.estadoAplicado));
  console.log('restaurado',JSON.stringify(R.estadoRestaurado));
  console.log('pageerrors',errs.length);
  await c.close();await b.close();
})().catch(e=>{console.error('FATAL',e);process.exit(2);});
