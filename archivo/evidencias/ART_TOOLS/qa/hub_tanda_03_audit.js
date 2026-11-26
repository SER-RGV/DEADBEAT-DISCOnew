/* ============================================================================
 * HUB · TANDA 03 — sonda de AUDITORÍA DE SLOTS (solo lectura)
 * ----------------------------------------------------------------------------
 * Objetivo: determinar, ANTES de producir ningún recurso, si los diez objetivos
 * de la Tanda 03 tienen slot de dibujo real, loader compatible, coordenadas,
 * caja de dibujo y capa. No modifica el juego: proxya el registro V5 existente,
 * __DDM_GET_V5 y drawImage, y mide por separado MENÚ y HUB.
 *
 * Registra además:
 *   - catálogo completo de claves V5 y tamaños naturales
 *   - claves consultadas por el pintor pero AUSENTES del registro
 *   - APIs expuestas (DMO_HUB, DMO_ART_PACK, __T3B, addHubCustomProp)
 *   - geometría del canvas de suelo cacheado (__T3B_HUB_QA)
 *   - zonas/estaciones reales del HUB
 *
 * Uso:
 *   QA_LIB=/tmp/qatools/node_modules/playwright-core \
 *   CHROME_PATH=/tmp/chromium LD_LIB_PATH=/tmp/chromelibs/lib:/tmp \
 *   node ART_TOOLS/qa/hub_tanda_03_audit.js
 * ==========================================================================*/
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.QA_LIB || 'playwright-core');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.env.OUTDIR || path.join(ROOT, 'ART_EVIDENCE', 'hub', 'tanda_03');
const URL = process.env.GAME_URL || 'http://127.0.0.1:8123/';
fs.mkdirSync(OUT, { recursive: true });

/* Claves que el código del HTML consulta estáticamente (extraídas con grep). */
const CONSULTED = [
  'abyssal_portal_pad','allied_combat_turret','campaign_door_diag_gate','campaign_door_frame',
  'campaign_door_leaf','campaign_door_side_frame','campaign_door_side_leaf','campaign_door_south_gate',
  'campaign_loot_chest','campaign_shop_cabina','campaign_weapon_rack','cine_pa_horn_speaker',
  'club_neon_planter_prop','club_speaker_tower_prop','club_wall_sconce_side','club_wall_sconce_torch',
  'combat_proximity_mine','descent_abyssal_lift_pad','floor_seal_limbo','floor_seal_lujuria',
  'fraude_mirror_prop','hub_abyss_stair_crack','hub_arcade_shrine','hub_bartender_npc',
  'hub_bouncer_npc','hub_cliente000_npc','hub_clubber_dancer_a','hub_clubber_dancer_b',
  'hub_disco_chandelier','hub_dj_shrine','hub_seals_shrine','hub_trophy_board_prop',
  'hub_vip_booth_lounge','objective_energy_orb','objective_generator_pylon','player_aegis_shield_aura',
  'route_chest_pedestal','route_elite_blood_altar','stage_abyssal_pit_trap','wall_avaricia_vault_door',
  'wall_ceiling_neon_fixture','wall_gula_bottle_rack','wall_ira_furnace_vent','wall_limbo_ticket_window',
  'wall_neon_club_crest','wall_stained_glass_arch','wall_traicion_glacier_panel','wall_violencia_specimen_vat',
  'avaricia_roulette_prop','club_roadcase_crate_prop','club_vending_machine_prop','club_water_cooler_prop',
  'fraude_card_table_prop','gula_cauldron_prop','herejia_pew_prop','herejia_reliquary_prop',
  'ira_speaker_stack_prop','limbo_bench_prop','lujuria_divan_prop','lujuria_table_prop',
  'nucleo_console_prop','nucleo_pillar_prop','prop_bench_vertical','prop_table_vertical',
  'stage_sonic_barrier_prop','traicion_cryopod_prop','traicion_ice_spike_prop','violencia_biovat_prop',
  'violencia_surgical_table_prop'
];
/* Objetivos de la Tanda 03 tal como los nombra el pliego. */
const TARGETS = [
  'HUB_FLOOR_PATCH_O','HUB_FLOOR_PATCH_E','HUB_FLOOR_PATCH_S_CRACK','HUB_FLOOR_NORTH_DJ',
  'HUB_PLANTER_VARIANT_02','HUB_BENCH_VARIANT_02','HUB_VIP_BOOTH_LOUNGE','HUB_ZONE_SIGNAGE'
];

const INIT = `(() => {
  const W = window;
  const P = W.__HUB3AUDIT = { phase: 'MENU', draws: {}, gets: {}, fn: {}, errors: [], allDraws: [] };
  let _v5 = null;
  Object.defineProperty(W, '__DDM_V5_IMG', {
    configurable: true,
    get() { return _v5; },
    set(v) {
      if (!v || typeof v !== 'object' || v.__hub3Proxied) { _v5 = v; return; }
      const target = v;
      _v5 = new Proxy(target, {
        get(t, k) {
          if (typeof k === 'string') {
            P.gets[k] = (P.gets[k] || 0) + 1;
            if (t[k] && typeof t[k] === 'object') { try { t[k].__v5key = k; } catch (e) {} }
          }
          return Reflect.get(t, k);
        },
        set(t, k, val) {
          if (typeof k === 'string' && val && typeof val === 'object') {
            try { val.__v5key = k; } catch (e) {}
          }
          return Reflect.set(t, k, val);
        }
      });
      Object.defineProperty(_v5, '__hub3Proxied', { value: true });
    }
  });
  let _get = null;
  Object.defineProperty(W, '__DDM_GET_V5', {
    configurable: true,
    get() { return _get; },
    set(f) {
      _get = (typeof f === 'function') ? function (k) {
        if (typeof k === 'string') P.fn[k] = (P.fn[k] || 0) + 1;
        const im = f.apply(this, arguments);
        if (im && typeof k === 'string') { try { im.__v5key = k; } catch (e) {} }
        return im;
      } : f;
    }
  });
  const orig = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (src) {
    const k = src && src.__v5key;
    if (k) {
      const id = P.phase + '|' + k;
      const d = P.draws[id] || (P.draws[id] = { phase: P.phase, slot: k, count: 0,
        boxes: [], natural: null, args: {}, source: null });
      d.count++;
      d.args[arguments.length] = (d.args[arguments.length] || 0) + 1;
      d.natural = [src.naturalWidth || src.width || 0, src.naturalHeight || src.height || 0];
      d.source = (src instanceof HTMLCanvasElement) ? 'canvas' : 'image';
      if (arguments.length >= 5 && d.boxes.length < 6) {
        const a = arguments;
        d.boxes.push([Math.round(a[1]), Math.round(a[2]), Math.round(a[3]), Math.round(a[4])]);
      }
    }
    /* Cualquier drawImage con caja grande se registra para medir la capa de suelo. */
    if (arguments.length >= 5 && P.allDraws.length < 400) {
      const a = arguments, sw = a[3], sh = a[4];
      if (sw > 300 || sh > 300) P.allDraws.push({ phase: P.phase,
        src: src && src.__v5key || (src instanceof HTMLCanvasElement ? 'canvas' : 'image'),
        box: [Math.round(a[1]), Math.round(a[2]), Math.round(sw), Math.round(sh)],
        canvas: [this.canvas.width, this.canvas.height] });
    }
    return orig.apply(this, arguments);
  };
  W.addEventListener('error', e => P.errors.push(String(e.message).slice(0, 200)));
})()`;

async function bootToHub(page) {
  await page.mouse.click(640, 450); await page.waitForTimeout(600);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  await page.keyboard.down('Escape'); await page.waitForTimeout(2800);
  await page.keyboard.up('Escape'); await page.waitForTimeout(900);
}

const ZONES = [
  ['centro', 1250, 935], ['dj', 1250, 445], ['barra', 1910, 845],
  ['vip_oeste', 785, 545], ['vip_este', 1715, 545],
  ['descenso', 1250, 1365], ['oeste', 480, 965], ['este', 2050, 965],
  ['norte', 1250, 300], ['sur', 1250, 1500]
];

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/tmp/chromium', headless: true,
    env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIB_PATH || '/tmp/chromelibs/lib:/tmp' },
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
           '--use-gl=swiftshader', '--disable-background-networking',
           '--disable-logging', '--log-level=3']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [], local404 = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 200)));
  page.on('response', r => {
    if (r.status() >= 400 && r.url().indexOf(':8123') >= 0)
      local404.push(r.status() + ' ' + r.url().split('/').pop().slice(0, 90));
  });
  await page.addInitScript(INIT);
  const t0 = Date.now();
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => {
    try { return window.DMO_ART_PACK && window.DMO_ART_PACK.state().status === 'applied'; }
    catch (e) { return false; }
  }, { timeout: 60000 });

  /* ---- FASE MENÚ: el banner 'pixel-club' se construye aquí ---- */
  await page.waitForTimeout(1400);
  await page.screenshot({ path: path.join(OUT, 'audit_00_menu.png') });
  const menuProbe = await page.evaluate(() => {
    const W = window, P = W.__HUB3AUDIT;
    const safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
    return {
      title: document.title,
      hub: safe(() => W.DMO_HUB.state().location),
      menuDraws: Object.values(P.draws).filter(d => d.phase === 'MENU'),
      menuV5Keys: safe(() => Object.keys(W.__DDM_V5_IMG || {}).length),
      vipLoungeRegistered: safe(() => !!W.__DDM_GET_V5('hub_vip_booth_lounge')),
      vipLoungeFn: P.fn['hub_vip_booth_lounge'] || 0,
      vipLoungeGets: P.gets['hub_vip_booth_lounge'] || 0
    };
  });

  /* ---- FASE HUB ---- */
  await page.evaluate(() => { window.__HUB3AUDIT.phase = 'HUB'; });
  await bootToHub(page);
  await page.evaluate(() => {
    const P = window.__HUB3AUDIT;
    P.draws = {}; P.allDraws = [];
    try { window.DMO_ART_PACK.hubTag(); } catch (e) {}
    try { window.DMO_ART_PACK.hub2Tag(); } catch (e) {}
  });
  const shots = {};
  for (const [name, x, y] of ZONES) {
    await page.evaluate(([a, c]) => {
      try { window.DMO.debug.teleport(a, c); } catch (e) {}
      try { window.DMO.debug.tick(0.016, 30); } catch (e) {}
    }, [x, y]);
    await page.waitForTimeout(600);
    const f = 'audit_' + name + '.png';
    await page.screenshot({ path: path.join(OUT, f) });
    shots[name] = { file: f, at: [x, y] };
  }

  const out = await page.evaluate(() => {
    const W = window, P = W.__HUB3AUDIT;
    const safe = f => { try { return f(); } catch (e) { return 'ERR:' + e.message; } };
    const reg = W.__DDM_V5_IMG || {};
    const sizes = {};
    Object.keys(reg).forEach(k => {
      const im = reg[k];
      sizes[k] = im ? [im.naturalWidth || im.width || 0, im.naturalHeight || im.height || 0] : null;
    });
    const rows = Object.values(P.draws).map(d => ({
      slot: d.slot, draws: d.count, natural: d.natural, boxes: d.boxes,
      args: d.args, source: d.source, gets: P.gets[d.slot] || 0, fn: P.fn[d.slot] || 0
    })).sort((a, b) => b.draws - a.draws);
    return {
      ts: new Date().toISOString(), url: location.href,
      hub: safe(() => { const a = W.DMO_HUB.audit(); return { ok: a.ok,
        location: a.location, zones: a.zonesCount, stations: a.stationsCount }; }),
      state: safe(() => W.DMO_ART_PACK.state().status),
      version: safe(() => W.DMO_ART_PACK.state().version),
      hubPack: safe(() => { const h = W.DMO_ART_PACK.hub(); return { applied: h.applied, enabled: h.enabled }; }),
      hub2Pack: safe(() => { const h = W.DMO_ART_PACK.hub2(); return { applied: h.applied, enabled: h.enabled }; }),
      zones: safe(() => W.DMO_HUB.zones ? W.DMO_HUB.zones() : null),
      stations: safe(() => W.DMO_HUB.stations().map(s => ({ id: s.id, zone: s.zone, x: s.x, y: s.y, radius: s.radius }))),
      apis: {
        DMO_HUB: safe(() => Object.keys(W.DMO_HUB)),
        DMO_ART_PACK: safe(() => Object.keys(W.DMO_ART_PACK)),
        __T3B: safe(() => W.__T3B ? Object.keys(W.__T3B) : null),
        __T3B_HUB_QA: safe(() => W.__T3B_HUB_QA ? Object.keys(W.__T3B_HUB_QA) : null),
        addHubCustomPropExposed: safe(() => typeof W.addHubCustomProp),
        DMO_INFERNAL_ART: safe(() => W.DMO_INFERNAL_ART ? Object.keys(W.DMO_INFERNAL_ART) : null)
      },
      hubFloorQA: safe(() => W.__T3B_HUB_QA.state()),
      hubFloorCaptureSize: safe(() => {
        const u = W.__T3B_HUB_QA.capture();
        if (!u) return null;
        return new Promise(res => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = u; });
      }),
      v5Keys: Object.keys(reg).length,
      registrySizes: sizes,
      drawnSlotsHUB: rows.length,
      rowsHUB: rows,
      allDrawsLarge: P.allDraws,
      allGets: P.gets, allFn: P.fn,
      errors: P.errors
    };
  });
  out.httpStatus = resp && resp.status();
  out.loadMs = Date.now() - t0;
  out.menu = menuProbe;
  out.shots = shots;
  out.pageErrors = pageErrors;
  out.local404 = local404;
  out.consultedKeys = CONSULTED;
  out.consultedAbsent = CONSULTED.filter(k => !(k in out.registrySizes));
  out.targets = TARGETS;
  fs.writeFileSync(path.join(OUT, 'audit_runtime.json'), JSON.stringify(out, null, 2));

  console.log('===== AUDITORÍA TANDA 03 =====');
  console.log('HTTP', out.httpStatus, 'loadMs', out.loadMs, 'estado', out.state, out.version);
  console.log('HUB', JSON.stringify(out.hub), '| V5', out.v5Keys, '| slots dibujados HUB', out.drawnSlotsHUB);
  console.log('MENÚ: vipLoungeRegistered=', menuProbe.vipLoungeRegistered,
              'consultas gv=', menuProbe.vipLoungeFn, 'gets=', menuProbe.vipLoungeGets,
              'dibujos V5 en menú=', menuProbe.menuDraws.length);
  console.log('claves consultadas AUSENTES:', out.consultedAbsent.length, out.consultedAbsent.join(', '));
  console.log('APIs:', JSON.stringify(out.apis));
  console.log('suelo cacheado:', JSON.stringify(out.hubFloorQA));
  console.log('slots HUB (top 25):');
  out.rowsHUB.slice(0, 25).forEach(r => console.log('  %s draws=%s natural=%s box=%s',
    r.slot.padEnd(34), String(r.draws).padStart(5), (r.natural || []).join('x').padEnd(9),
    JSON.stringify(r.boxes[0] || null)));
  console.log('JSON:', path.join(OUT, 'audit_runtime.json'));
  await ctx.close(); await browser.close();
})().catch(e => { console.error('AUDIT FAIL', e && e.stack || e); process.exit(1); });
