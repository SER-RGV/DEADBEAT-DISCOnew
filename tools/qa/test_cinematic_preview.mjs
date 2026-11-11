// Preview smoke test; no avance artificial del reloj ni afirmaciones de fluidez.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const requireQA = createRequire(path.join(process.env.DD_QA_MODULES || process.cwd(), 'package.json'));
const puppeteer = (await import(pathToFileURL(requireQA.resolve('puppeteer-core')).href)).default;
const chromium = (await import(pathToFileURL(requireQA.resolve('@sparticuz/chromium')).href)).default;
const browser = await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
const failures=[];
try {
 for (const [width,height,deviceScaleFactor] of [[1920,1080,1],[1600,900,1],[1366,768,1],[1280,720,1],[1280,720,2]]) {
  const page=await browser.newPage(); await page.setViewport({width,height,deviceScaleFactor});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await page.goto((process.env.DD_QA_URL || 'http://127.0.0.1:8000')+'/assets/cinematics/preview/player.html',{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>window.DD_CINE?.getState()?.type==='intro',{timeout:60000});
  const playing = await page.evaluate(()=>({cine:DD_CINE.getState(),stats:DD_ASSETS.stats(),hub:!!window.DD_HUB,canvas:[document.querySelector('canvas').width,document.querySelector('canvas').height]}));
  await page.click('#skip');
  const skipped=await page.evaluate(()=>({state:DD_CINE.getState(),text:document.querySelector('#status').textContent}));
  await page.click('#replay');
  const replay=await page.evaluate(()=>DD_CINE.getState());
  if (playing.hub || skipped.state !== null || replay?.type !== 'intro' || errors.length) failures.push({width,height,errors,playing,skipped,replay});
  console.log(JSON.stringify({width,height,deviceScaleFactor,playing,skipped,replay,errors}));
  await page.close();
 }
} finally { await browser.close(); }
if(failures.length){console.error(JSON.stringify(failures));process.exitCode=1;}
