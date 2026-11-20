/* Captura del escenario Extras con el catálogo de aspectos al día. */
const {chromium}=require('playwright-core'),fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://localhost:8081',out=process.argv[3]||'docs/evidence/atuendos';
(async()=>{const browser=await chromium.launch({executablePath:process.env.DD_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-gpu','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720}}),p=await ctx.newPage();
 await p.goto(base+'/index.html');await p.waitForFunction(()=>window.DD_BOOT?.getState().state==='MAIN_MENU',null,{timeout:30000});
 await p.locator('[data-action=extras]').click();
 await p.waitForTimeout(1500);
 fs.mkdirSync(out,{recursive:true});
 await p.screenshot({path:path.join(out,'extras-catalogo.png')});
 console.log('PASS captura Extras guardada');
}finally{await browser.close();}})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
