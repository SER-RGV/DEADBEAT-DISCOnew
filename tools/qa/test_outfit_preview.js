/* Fresh profile: all cosmetic options available, without changing progression. */
const {chromium}=require('playwright-core'),assert=require('assert'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3];
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>errors.push(r.url()));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU'&&DD_APPEARANCE.list().filter(x=>x.unlocked).length===15,null,{timeout:30000});
 await p.locator('[data-action=customize]').click();const cards=p.locator('[data-look]');assert.equal(await cards.count(),15);assert.equal(await p.locator('[data-look]:disabled').count(),0);assert.equal(await p.locator('.dd-look-description').count(),15);
 assert(await p.locator('#dd-submenu-body').textContent().then(t=>t.includes('disponibles para probar')));
 for(let i=0;i<15;i++){let card=cards.nth(i);assert((await card.locator('.dd-look-description').textContent()).trim().length>15);}
 if(out){fs.mkdirSync(out,{recursive:true});await p.waitForTimeout(1500);await p.screenshot({path:path.join(out,'camerino-descripciones.png')});}
 await p.waitForFunction(()=>DD_APPEARANCE.outfitReady('painter'));await p.locator('[data-look=painter]').click();assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'painter');
 assert.equal(await p.evaluate(()=>localStorage.getItem('dmodisco_best_round_v1')),null);assert.equal(await p.evaluate(()=>localStorage.getItem('dmo_victories_v214')),null);
 await p.reload();await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU');assert.equal(await p.evaluate(()=>DD_APPEARANCE.current().id),'painter');
 await p.locator('[data-action=extras]').click();assert.equal(await p.locator('.dd-extra-look-description').count(),15);assert((await p.locator('.dd-extra-looks').textContent()).includes('El menú del día'));
 await p.keyboard.press('Escape');await p.locator('[data-action=customize]').click();await p.setViewportSize({width:375,height:812});await p.locator('[data-look=painter]').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('[data-look=painter]').getAttribute('aria-pressed'),'true');
 const dims=await p.locator('.dd-look-description').last().evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));assert(dims.scroll<=dims.client+1,'sin desbordamiento horizontal');
 assert.deepEqual(errors,[]);console.log('PASS 15 aspectos disponibles sin récord, descripciones, equipar, persistencia, Extras y teclado móvil');await ctx.close();
 }finally{await browser.close()}})().catch(e=>{console.error('FAIL',e);process.exit(1)});
