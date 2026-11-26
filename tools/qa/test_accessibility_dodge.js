/* Browser accessibility tree and dodge configuration integration.
   Test-only hook is injected into the HTTP response, never production files.
   No physical controller or assistive technology is emulated or claimed. */
const {chromium}=require('playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert');
const base=process.argv[2]||'http://localhost:8080',delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 const anchor='    const ddOriginalEndRun = fp;';assert.equal(html.split(anchor).length,2);
 const body=html.replace(anchor,anchor+`\n    window.__QA_DODGE = {
      set: function(key){ fr('qa:dodge'); return _h({key:key}); },
      get: function(){ return {key:zt.key, rollT:ye.rollT, cooldown:ye.rollCD}; },
      choice: function(){ fr('qa:choice'); return et(true); }
    };`);
 const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const cdp=await ctx.newCDPSession(p);
 const ax=async()=>{const tree=await cdp.send('Accessibility.getFullAXTree');return tree.nodes.filter(n=>!n.ignored).map(n=>({role:n.role?.value,name:n.name?.value,props:n.properties}));};
 const has=(nodes,role,name)=>nodes.some(n=>n.role===role&&n.name===name);
 try{
 await p.route('**/index.html',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body}));
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
 let tree=await ax();assert(has(tree,'navigation','Opciones del menú principal'),'navegación principal');
 assert(has(tree,'button','OPCIONES Audio, vídeo, controles y accesibilidad')||tree.some(n=>n.role==='button'&&n.name?.includes('OPCIONES')),'opciones accesible');
 for(const [key,label] of [['Space','ESPACIO'],['KeyV','V'],['AltLeft','ALT IZQUIERDO']]){
  await p.evaluate(k=>__QA_DODGE.set(k),key);assert.equal(await p.evaluate(()=>__QA_DODGE.get().key),key);
  await p.evaluate(()=>DD_UI.triggerMenuAction('options'));await p.waitForSelector('#dd-submenu.is-open');
  assert((await p.locator('#dd-controls-keyboard').innerText()).includes(label+': esquivar'));
  tree=await ax();assert(has(tree,'dialog','OPCIONES'),'diálogo de opciones nombrado');
  assert(!tree.some(n=>n.role==='navigation'&&n.name==='Opciones del menú principal'),'menú detrás excluido');
  assert(tree.some(n=>n.name?.includes(label+': esquivar')),'texto accesible '+key);
  assert(tree.some(n=>n.role==='slider'&&n.name?.toUpperCase().includes('MAESTRO')),'control de audio accesible');
  await p.locator('#dd-submenu-back').click();await p.waitForSelector('#dd-submenu.is-open',{state:'hidden'});
 }
 console.log('PASS ayuda y árbol accesible para ESPACIO, V y ALT IZQUIERDO; deslizador de audio nombrado');
 await (await import('../perf/lib.mjs')).enterHub(p);await p.evaluate(()=>DD_HUB.exitToRun());await p.waitForFunction(()=>__DD_BRIDGE.isRunning());
 await p.evaluate(()=>{DMO.debug.exploreNoEnemies(true);DMO.debug.holdSpawns(true)});
 for(const [code,key,hud] of [['Space','Space','ESP'],['KeyV','v','V'],['AltLeft','Alt','ALT']]){
  await p.evaluate(k=>__QA_DODGE.set(k),code);await p.waitForFunction(v=>document.querySelector('#dd-skill-dodge-key')?.textContent===v,hud);
  await p.waitForFunction(()=>__QA_DODGE.get().cooldown<=0,null,{timeout:5000});
  await p.keyboard.down(key);await p.waitForFunction(()=>__QA_DODGE.get().rollT>0,null,{timeout:3000});await p.keyboard.up(key);
  console.log('PASS '+code+': HUD y esquiva del motor');
 }
 await p.waitForFunction(()=>__QA_DODGE.get().cooldown<=0,null,{timeout:5000});
 assert(await p.evaluate(()=>__QA_DODGE.choice()));await p.waitForSelector('#shot-choice-overlay.visible');
 tree=await ax();assert(has(tree,'dialog','GRABA UNA CARA'),'diálogo nombrado');assert(has(tree,'group','Opciones disponibles'),'grupo nombrado');
 const buttons=tree.filter(n=>n.role==='button'&&/^[123]\. /.test(n.name||''));assert.equal(buttons.length,3,'tres botones con nombres accesibles');
 await p.keyboard.press('Enter');await p.waitForSelector('#shot-choice-overlay.visible',{state:'hidden'});
 console.log('PASS árbol accesible de elección: diálogo, grupo y tres opciones');
 await p.evaluate(()=>DD_UI.openShop());await p.waitForSelector('#dd-shop-modal:not(.dd-hidden)');
 tree=await ax();assert(has(tree,'dialog','Colección de dados'),'diálogo armería');
 assert(!has(tree,'button','DICE VAULT'),'HUD detrás excluido del árbol');
 await p.locator('#dd-shop-close').click();await p.evaluate(()=>DD_UI.openMap());await p.waitForSelector('#dd-map-modal:not(.dd-hidden)');
 tree=await ax();assert(has(tree,'dialog','Mesa Astral: sección narrativa y registro de incursión'),'diálogo mapa');
 await p.locator('#dd-map-close').click();await p.evaluate(()=>DMO.playtest.hurt(20));await p.waitForSelector('#dd-results:not(.dd-hidden)');
 tree=await ax();assert(has(tree,'dialog','FIN DEL DESCENSO'),'resultados nombrados');assert(has(tree,'button','REINTENTAR'));assert(has(tree,'button','MENÚ PRINCIPAL'));
 assert.deepEqual(errors,[]);console.log('PASS árbol accesible de armería, mapa y resultados; sin errores de navegador');
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
