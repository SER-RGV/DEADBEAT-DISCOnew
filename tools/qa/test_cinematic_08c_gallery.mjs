// Revisión técnica de la galería y manifiestos locales; no aprueba arte ni capas.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFileSync, readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root = 'assets/cinematics/backgrounds/definitive';
const dirs = readdirSync(root).filter(n => n.startsWith('scene_')).sort();
if (dirs.length !== 6) throw Error('Se esperan seis carpetas de escena');
for (const dir of dirs) {
  const manifest = JSON.parse(readFileSync(path.join(root, dir, 'manifest.json'), 'utf8'));
  const bytes = readFileSync(path.join(root, dir, manifest.master.file));
  if (manifest.scene !== dir || bytes.length !== manifest.master.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== manifest.master.sha256 || manifest.layers.length !== 0)
    throw Error('Manifiesto local inconsistente: ' + dir);
  for (const ref of [manifest.references.old_master, manifest.references.current_rebuild, ...manifest.references.historical_layers])
    readFileSync(ref);
}
const rq = createRequire(path.join(process.env.DD_QA_MODULES || process.cwd(), 'package.json'));
const puppeteer = (await import(pathToFileURL(rq.resolve('puppeteer-core')).href)).default;
const chromium = (await import(pathToFileURL(rq.resolve('@sparticuz/chromium')).href)).default;
const browser = await puppeteer.launch({executablePath:await chromium.executablePath(), headless:true, args:[...chromium.args, '--no-sandbox']});
try {
  const page = await browser.newPage(); await page.setViewport({width:1600,height:900});
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto((process.env.DD_QA_URL || 'http://127.0.0.1:8012') + '/docs/CINEMATIC_STORYBOARD/FASE_08C_GALERIA_COMPARATIVA.html', {waitUntil:'load',timeout:120000});
  const info = await page.evaluate(async () => {
    const imgs = [...document.images];
    await Promise.all(imgs.map(img => { img.loading='eager'; return img.decode(); }));
    return imgs.map(i => ({w:i.naturalWidth,h:i.naturalHeight,box:[i.getBoundingClientRect().width,i.getBoundingClientRect().height]}));
  });
  if (info.length !== 18 || errors.length) throw Error(JSON.stringify({info,errors}));
  for (let i=0; i<6; i++) {
    const trio=info.slice(i*3,i*3+3);
    if (trio[0].w!==2560 || trio[0].h!==1440 || trio.slice(1).some(x=>x.w!==1376||x.h!==768) ||
        trio.some(x=>Math.abs(x.box[0]-trio[0].box[0])>0.1||Math.abs(x.box[1]-trio[0].box[1])>0.1))
      throw Error('Tamaño o comparativa inconsistente: '+JSON.stringify(trio));
  }
  console.log(JSON.stringify({scenes:dirs.length,images:info.length,comparisonBoxes:'igual por fila',original:'2560x1440',rebuild:'1376x768',proposal:'1376x768',pageErrors:errors}));
} finally { await browser.close(); }
