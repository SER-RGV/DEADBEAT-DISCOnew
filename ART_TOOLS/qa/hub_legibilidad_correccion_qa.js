/* QA de la MODIFICACIÓN PRIORITARIA A–F (legibilidad + geografía del HUB).
 *
 * NO modifica el juego: usa SOLO la API reversible
 *   window.DMO_HUB_LEGIBILIDAD.setEnabled(v) / .state() / .audit()
 * y dispara la transición YA EXISTENTE startCampaignFromHub(0).
 *
 * T09 se desactiva desde el arranque (`__DDM_HUB_T09 = false`) por decisión
 * del usuario: la corrección se valida sobre T01–T08, sin rutinas nuevas.
 *
 * Salida: ART_EVIDENCE/hub/correccion/
 *   sweep_*.jpg        16 posiciones con la corrección ACTIVA
 *   ab_antes_*.jpg     6 zonas con flag OFF (estado publicado)
 *   ab_despues_*.jpg   las mismas 6 zonas con flag ON, misma página
 *   ab_restaurado_*.jpg  reversibilidad en caliente
 *   descenso_*.jpg     9 fotogramas de startCampaignFromHub(0)
 *   report.json / qa_matrix.json / metricas.json
 */
const { chromium } = require('/tmp/qatools/node_modules/playwright-core');
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, '../../ART_EVIDENCE/hub/correccion');
fs.mkdirSync(OUT, { recursive: true });
const URL = 'http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html';

const POS = [
  ['01_centro_spawn',1250,965], ['02_norte_cabina',1250,600], ['03_noroste_vip',820,640],
  ['04_noreste_vip',1680,640], ['05_oeste_arsenal',720,900], ['06_este_barra',1790,900],
  ['07_suroeste_arcade',700,1150], ['08_sureste_espejo',1820,1150],
  ['09_sur_pregrieta',1250,1250], ['10_borde_acantilado',1250,1420],
  ['11_borde_izq',900,1420], ['12_borde_der',1600,1420],
  ['13_pista_nw',1030,800], ['14_pista_se',1470,1080],
  ['15_corredor_oeste',900,700], ['16_corredor_este',1690,1010]
];
const AB = [
  ['centro',1250,965], ['norte',1250,600], ['nw',820,640],
  ['este',1790,900], ['sur',1250,1250], ['borde',1250,1420]
];

async function boot(b, opts) {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c.addInitScript(o => {
    if (!o.t09On) window.__DDM_HUB_T09 = false;   /* aislada durante toda la QA */
    if (o.legOff) window.__DDM_HUB_LEGIBILIDAD = false;
  }, opts || {});
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => {
    try { return ['applied','applied-with-errors'].includes(window.DMO_ART_PACK.state().status); }
    catch (e) { return false; }
  }, { timeout: 90000 });
  await p.mouse.click(640, 450); await p.waitForTimeout(400);
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.keyboard.down('Escape'); await p.waitForTimeout(1400); await p.keyboard.up('Escape');
  await p.waitForFunction(() => {
    try { return window.DMO_HUB.state().inHub; } catch (e) { return false; }
  }, { timeout: 30000 });
  await p.waitForTimeout(1900);
  return { c, p, errs };
}
const legState = p => p.evaluate(() => window.DMO_HUB_LEGIBILIDAD.state());
const hubState = p => p.evaluate(() => ({
  hub: window.DMO_HUB.audit(), st: window.DMO_HUB.state(),
  t07: window.DMO_HUB_T07.audit(), t08: window.DMO_HUB_T08.state(),
  cam: window.DMO.camera(), props: window.DMO_LAYOUT.props().length,
  stations: window.DMO_HUB.stations().length,
  v5: Object.keys(window.__DDM_V5_IMG || {}).length
}));

(async () => {
  const b = await chromium.launch({ executablePath: '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--use-gl=swiftshader','--disable-background-networking'] });
  const R = { generatedAt: new Date().toISOString(),
    phase: 'MODIFICACIÓN PRIORITARIA A–F · corrección aplicada y validada',
    t09: 'DESACTIVADA (flag __DDM_HUB_T09=false desde el arranque)', pageerrors: [] };

  /* ---------- 1. A/B EN LA MISMA PÁGINA (sin recarga, sin deriva animada) ---- */
  const A = await boot(b, {});
  R.pageerrors.push(...A.errs);
  const ab = { before: null, after: null, restored: null, files: [] };
  await A.p.evaluate(() => window.DMO_HUB_LEGIBILIDAD.setEnabled(false));
  await A.p.waitForTimeout(350);
  ab.before = await legState(A.p);
  for (const [nm,x,y] of AB) {
    await A.p.evaluate(([a,c]) => window.DMO.debug.teleport(a,c), [x,y]);
    await A.p.waitForTimeout(260);
    const f = 'ab_antes_' + nm + '.jpg';
    await A.p.screenshot({ path: path.join(OUT,f), type:'jpeg', quality:88 });
    ab.files.push(f);
  }
  await A.p.evaluate(() => window.DMO_HUB_LEGIBILIDAD.setEnabled(true));
  await A.p.waitForTimeout(350);
  ab.after = await legState(A.p);
  for (const [nm,x,y] of AB) {
    await A.p.evaluate(([a,c]) => window.DMO.debug.teleport(a,c), [x,y]);
    await A.p.waitForTimeout(260);
    const f = 'ab_despues_' + nm + '.jpg';
    await A.p.screenshot({ path: path.join(OUT,f), type:'jpeg', quality:88 });
    ab.files.push(f);
  }
  /* reversibilidad en caliente: OFF de nuevo */
  await A.p.evaluate(() => window.DMO_HUB_LEGIBILIDAD.setEnabled(false));
  await A.p.waitForTimeout(350);
  ab.restored = await legState(A.p);
  for (const nm of ['centro','borde']) {
    const q = AB.find(z => z[0] === nm);
    await A.p.evaluate(([a,c]) => window.DMO.debug.teleport(a,c), [q[1],q[2]]);
    await A.p.waitForTimeout(260);
    const f = 'ab_restaurado_' + nm + '.jpg';
    await A.p.screenshot({ path: path.join(OUT,f), type:'jpeg', quality:88 });
    ab.files.push(f);
  }
  await A.p.evaluate(() => window.DMO_HUB_LEGIBILIDAD.setEnabled(true));
  R.ab = ab;
  await A.c.close();

  /* ---------- 2. BARRIDO DE 16 POSICIONES CON LA CORRECCIÓN ----------------- */
  const S = await boot(b, {});
  R.pageerrors.push(...S.errs);
  R.sweep = [];
  for (const [id,x,y] of POS) {
    await S.p.evaluate(([a,c]) => window.DMO.debug.teleport(a,c), [x,y]);
    await S.p.waitForTimeout(280);
    const f = 'sweep_' + id + '.jpg';
    await S.p.screenshot({ path: path.join(OUT,f), type:'jpeg', quality:82 });
    const st = await S.p.evaluate(() => ({ cam: window.DMO.camera(),
      leg: window.DMO_HUB_LEGIBILIDAD.state() }));
    R.sweep.push({ id, camera:[x,y], realCam:st.cam, file:f,
      draws:st.leg.draws, clips:st.leg.clips });
  }
  R.runtime = await hubState(S.p);
  R.leg = await legState(S.p);
  await S.c.close();

  /* ---------- 3. FLAG OFF DESDE EL ARRANQUE --------------------------------- */
  const F = await boot(b, { legOff: true });
  R.pageerrors.push(...F.errs);
  await F.p.evaluate(() => window.DMO.debug.teleport(1250,1420));
  await F.p.waitForTimeout(350);
  R.flagOffBoot = await legState(F.p);
  R.flagOffBootRuntime = await hubState(F.p);
  await F.p.screenshot({ path:path.join(OUT,'flag_off_boot_borde.jpg'), type:'jpeg', quality:88 });
  await F.c.close();

  /* ---------- 4. TRANSICIÓN EXISTENTE (sin segunda transición) -------------- */
  const D = await boot(b, {});
  R.pageerrors.push(...D.errs);
  await D.p.evaluate(() => window.DMO.debug.teleport(1250,1300));
  await D.p.waitForTimeout(350);
  await D.p.screenshot({ path:path.join(OUT,'descenso_00_antes.jpg'), type:'jpeg', quality:82 });
  R.descentStarted = await D.p.evaluate(() => {
    try { return !!window.DMO_HUB.startCampaignFromHub(0); } catch (e) { return String(e); }
  });
  R.descent = [];
  let prev = 0;
  for (const ms of [250,500,900,1400,2000,2800,3600,4600]) {
    await D.p.waitForTimeout(ms - prev); prev = ms;
    const f = 'descenso_' + String(ms).padStart(4,'0') + '.jpg';
    await D.p.screenshot({ path:path.join(OUT,f), type:'jpeg', quality:82 });
    const s = await D.p.evaluate(() => ({
      st: window.DMO_HUB.state(), t08: window.DMO_HUB_T08.state(),
      leg: window.DMO_HUB_LEGIBILIDAD.state() }));
    R.descent.push({ ms, file:f, location:s.st.location, mode:s.st.mode,
      transitionLock:s.st.transitionLock,
      t08:{ visible:s.t08.visible, winTop:s.t08.winTop, winH:s.t08.winH,
            expand:s.t08.expand }, legDraws:s.leg.draws,
      legClips:s.leg.clips, legErrors:s.leg.errors.length });
  }
  R.descentFinal = await hubState(D.p);
  await D.c.close();

  /* ---------- 4b. COMPATIBILIDAD: T09 y LEG por defecto (juego publicado) ---- */
  const B = await boot(b, { t09On: true });
  R.pageerrors.push(...B.errs);
  await B.p.waitForTimeout(2200);
  await B.p.evaluate(() => window.DMO.debug.teleport(1250,1420));
  await B.p.waitForTimeout(400);
  R.compatT09 = await B.p.evaluate(() => ({
    leg: window.DMO_HUB_LEGIBILIDAD.state(),
    t09: window.DMO_HUB_T09.audit(),
    props: window.DMO_LAYOUT.props().length
  }));
  await B.p.screenshot({ path:path.join(OUT,'compatibilidad_t09_legibilidad.jpg'),
                         type:'jpeg', quality:88 });
  await B.c.close();

  /* ---------- 5. MATRIZ QA --------------------------------------------------- */
  const ON = R.leg, OFF = R.flagOffBoot;
  const checks = [
    ['Q01','0 pageerror en todos los contextos', R.pageerrors.length === 0],
    ['Q02','flag ON: 4 envoltorios instalados', ON.installed && ON.wrappers === 4],
    ['Q03','flag ON: dibujo de mundo y de pantalla activos', ON.draws > 0 && ON.screenDraws > 0],
    ['Q04','flag ON: clip del cutaway desde la boca', ON.clips > 0],
    ['Q05','flag OFF desde arranque: 0 dibujos / 0 clips / 0 props ocultos',
      OFF.draws === 0 && OFF.screenDraws === 0 && OFF.clips === 0 && OFF.hidden === 0],
    ['Q06','flag OFF: atmósfera sin tocar (opacity/grade/grain originales)',
      OFF.bloom === '' && OFF.vig === '' && OFF.grade === 1 && OFF.grain === 0.016],
    ['Q07','reversibilidad en caliente: hidden 9 → 0 y atmósfera restaurada',
      ab.after.hidden === 9 && ab.restored.hidden === 0 && ab.restored.atmosApplied === false],
    ['Q08','62 props y 11 estaciones intactos (sin props nuevos)',
      R.runtime.props === 62 && R.runtime.stations === 11 && ON.noNewProps === true],
    ['Q09','T07 y T08 siguen activos',
      !!R.runtime.t07 && !!R.runtime.t08 && R.runtime.t08.errors.length === 0],
    ['Q10','0 errores internos del módulo', ON.errors.length === 0],
    ['Q11','startCampaignFromHub(0) inicia la transición', R.descentStarted === true],
    ['Q12','la transición llega a CAMPAIGN_ROOM sin segunda transición',
      R.descent.some(d => d.location === 'TRANSITION') &&
      R.descentFinal.st.location === 'CAMPAIGN_ROOM'],
    ['Q13','T08 winH crece durante el descenso', Math.max(...R.descent.map(d=>d.t08.winH)) > 300],
    ['Q14','16 capturas de barrido con la corrección', R.sweep.length === 16],
    ['Q15','12 comparativas antes/después en la misma página',
      ab.files.filter(f=>f.startsWith('ab_antes_')).length === 6 &&
      ab.files.filter(f=>f.startsWith('ab_despues_')).length === 6],
    ['Q16','sin cámara, progresión ni audio tocados',
      ON.cameraTouched === false && ON.progressionTouched === false && ON.audioTouched === false],
    ['Q17','sin assets nuevos', ON.noNewAssets === true],
    ['Q18','compatibilidad con T09 activa (10 NPC, 4 posturas, 0 errores)',
      R.compatT09.t09.ok === true && R.compatT09.t09.wrapped === 10 &&
      R.compatT09.t09.assetsLoaded === 4 && R.compatT09.t09.npcs === 10 &&
      R.compatT09.t09.errors.length === 0 && R.compatT09.leg.errors.length === 0 &&
      R.compatT09.props === 62]
  ];
  R.qa_matrix = checks.map(([id,label,ok]) => ({ id, label,
    resultado: ok ? 'APROBADO' : 'FALLIDO' }));
  R.qa_summary = {
    aprobados: R.qa_matrix.filter(q=>q.resultado==='APROBADO').length,
    fallidos: R.qa_matrix.filter(q=>q.resultado==='FALLIDO').length,
    bloqueados: 0, noVerificados: 0
  };
  fs.writeFileSync(path.join(OUT,'report.json'), JSON.stringify(R,null,2)+'\n');
  fs.writeFileSync(path.join(OUT,'qa_matrix.json'), JSON.stringify({
    generatedAt:R.generatedAt, summary:R.qa_summary, matrix:R.qa_matrix },null,2)+'\n');
  console.log('QA', JSON.stringify(R.qa_summary));
  R.qa_matrix.filter(q=>q.resultado==='FALLIDO').forEach(q=>console.log(' FALLO',q.id,q.label));
  console.log('pageerrors', R.pageerrors.length, '| sweep', R.sweep.length,
    '| ab', ab.files.length, '| descenso', R.descent.length,
    '| destino', R.descentFinal.st.location);
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(2); });
