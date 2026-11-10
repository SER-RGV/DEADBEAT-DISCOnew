// Valida archivos y visualización de la galería; no valida la dirección artística.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const index = JSON.parse(readFileSync('assets/cinematics/backgrounds/continuity_08c1/manifest.json','utf8'));
if (index.scenes.length !== 6 || index.layers.length) throw Error('Índice inválido');
for (const scene of index.scenes) {
 const png = readFileSync(scene.selected); readFileSync(scene.previous);
 const hash = createHash('sha256').update(png).digest('hex');
 if (png.toString('hex',0,8)!=='89504e470d0a1a0a' || png.readUInt32BE(16)!==scene.width || png.readUInt32BE(20)!==scene.height || png[25]!==2 || scene.mode!=='RGB' || scene.bytes!==png.length || scene.sha256!==hash || scene.layers.length) throw Error('Metadatos incorrectos: '+scene.scene);
 if ((scene.scene==='04') !== (scene.previous===scene.selected)) throw Error('Referencia 04 o edición inconsistente');
}
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try {
 const page=await browser.newPage();await page.setViewport({width:1600,height:900});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8013')+'/docs/CINEMATIC_STORYBOARD/FASE_08C1_GALERIA_CONTINUIDAD.html',{waitUntil:'load',timeout:120000});
 const sizes=await page.evaluate(async()=>{const imgs=[...document.images];await Promise.all(imgs.map(i=>{i.loading='eager';return i.decode()}));return imgs.map(i=>({w:i.naturalWidth,h:i.naturalHeight,box:[i.getBoundingClientRect().width,i.getBoundingClientRect().height]}))});
 if(sizes.length!==12||errors.length||sizes.some(x=>x.w!==1376||x.h!==768))throw Error(JSON.stringify({sizes,errors}));
 for(let i=0;i<12;i+=2)if(Math.abs(sizes[i].box[0]-sizes[i+1].box[0])>.1||Math.abs(sizes[i].box[1]-sizes[i+1].box[1])>.1)throw Error('Tamaños de comparación distintos');
 console.log(JSON.stringify({scenes:index.scenes.length,changed:5,reference:'04',images:sizes.length,dimensions:'1376x768 RGB',pageErrors:errors}));
}finally{await browser.close()}
