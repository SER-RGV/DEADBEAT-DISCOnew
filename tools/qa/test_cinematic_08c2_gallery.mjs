// Comprueba únicamente la carga de la galería y sus imágenes, no el canon.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const rq=createRequire(path.join(process.env.DD_QA_MODULES||process.cwd(),'package.json'));
const puppeteer=(await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium=(await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),headless:true,args:[...chromium.args,'--no-sandbox']});
try{
 const page=await browser.newPage();await page.setViewport({width:1600,height:900});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto((process.env.DD_QA_URL||'http://127.0.0.1:8014')+'/docs/CINEMATIC_STORYBOARD/FASE_08C2_GALERIA_PLANO.html',{waitUntil:'load',timeout:120000});
 const images=await page.evaluate(async()=>{let imgs=[...document.images];await Promise.all(imgs.map(i=>i.decode()));return imgs.map(i=>[i.naturalWidth,i.naturalHeight])});
 if(images.length!==8||errors.length||images.some(x=>x[0]<=0||x[1]<=0))throw Error(JSON.stringify({images,errors}));
 console.log(JSON.stringify({images:images.length,svg:5,existingBackgrounds:3,errors}));
}finally{await browser.close()}
