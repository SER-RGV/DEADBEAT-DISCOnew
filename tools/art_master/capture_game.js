#!/usr/bin/env node
/* ==========================================================================
   DEADBEAT DISCO — ART PRODUCTION MASTER · captura de evidencias EN EL JUEGO
   Uso:  node tools/art_master/capture_game.js <carpeta_salida> [--dpr=2] [--circles=1,2,5]
                                               [--weapons=id1,id2] [--bosses=1,5]
   Requiere el entorno de navegador de tools/validate_batch.js
   (/tmp/browser + /tmp/chromium + /tmp/al2023) y un servidor en :8080.

   NO es una maqueta: abre index.html real, espera al cargador DD_ASSETS, salta
   la cinemática, recorre REFUGIO → ARMERÍA → MAPA → INCURSIÓN, invoca enemigos
   y jefes con las utilidades de depuración del propio motor (DMO.debug.*) y
   guarda capturas + un informe JSON (errores JS, HTTP 4xx/5xx, integridad).
   ========================================================================== */
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const browserReq = createRequire("/tmp/browser/package.json");
const { chromium: pw } = browserReq("playwright-core");
process.env.LD_LIBRARY_PATH = "/tmp/al2023/lib:/tmp/al2023:" + (process.env.LD_LIBRARY_PATH || "");
process.env.FONTCONFIG_PATH = "/tmp/fonts";

const args = process.argv.slice(2);
const OUT = path.resolve(args.find(a => !a.startsWith("--")) || "/tmp/ddqa/capture");
const opt = (k, d) => { const a = args.find(x => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const DPR = Number(opt("dpr", "1"));
const URL = opt("url", "http://127.0.0.1:8080/index.html");
const CIRCLES = opt("circles", "1").split(",").filter(Boolean).map(Number);
const WEAPONS = opt("weapons", "").split(",").filter(Boolean);
const BOSSES = opt("bosses", "").split(",").filter(Boolean).map(Number);
const EXT = opt("ext", "jpg");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const sparticuz = (await import("file:///tmp/browser/node_modules/@sparticuz/chromium/build/index.js")).default;
  const browser = await pw.launch({
    executablePath: "/tmp/chromium",
    args: [...sparticuz.args.filter(a => !a.startsWith("--headless") && !a.startsWith("--window-size")), "--no-sandbox"],
    headless: true
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const report = { url: URL, dpr: DPR, startedAt: new Date().toISOString(), pageErrors: [], httpErrors: [], consoleErrors: [], shots: [], steps: {} };
  page.on("pageerror", e => report.pageErrors.push(String(e.message).slice(0, 400)));
  page.on("console", m => { if (m.type() === "error") report.consoleErrors.push(m.text().slice(0, 300)); });
  page.on("response", r => { if (r.status() >= 400) report.httpErrors.push(r.status() + " " + r.url()); });
  page.on("requestfailed", r => report.httpErrors.push("FAILED " + r.url()));

  const shot = async (name) => {
    const file = path.join(OUT, name + "." + EXT);
    await page.screenshot(EXT === "jpg" ? { path: file, type: "jpeg", quality: 90 } : { path: file });
    report.shots.push(path.basename(file));
  };
  const step = (inp, frames) => page.evaluate(([i, f]) => { try { window.DMO.debug.heal(); } catch (e) {} return window.__DD_BRIDGE.testStep(i, f); }, [inp || {}, frames || 10]);

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.DD_ASSETS && (() => { const s = window.DD_ASSETS.stats(); return s.loaded + s.errors >= s.registered; })(), { timeout: 60000 });
  await page.waitForTimeout(700);
  report.steps.assets = await page.evaluate(() => ({ stats: window.DD_ASSETS.stats(), integrity: window.DD_ASSETS.integrity ? window.DD_ASSETS.integrity() : null }));
  await shot("00_intro_cinematica");
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(900);

  /* ---- REFUGIO / HUB ---- */
  report.steps.hub = await page.evaluate(() => window.DD_HUB.getState());
  await page.waitForTimeout(5600); /* deja que se cierre el diálogo de bienvenida */
  await shot("01_hub_refugio");
  await page.keyboard.down("KeyD"); await page.waitForTimeout(450); await page.keyboard.up("KeyD");
  await page.waitForTimeout(120);
  await shot("02_hub_caminando");

  /* ---- ARMERÍA + MAPA ---- */
  await page.evaluate(() => window.DD_UI.openShop());
  await page.waitForTimeout(700);
  await shot("03_armeria_tienda");
  for (const wid of WEAPONS) {
    const ok = await page.evaluate((w) => {
      const card = document.querySelector('[data-weapon-id="' + w + '"],[data-wid="' + w + '"],[data-id="' + w + '"]');
      if (card) { card.scrollIntoView({ block: "center" }); card.click(); return true; }
      return false;
    }, wid);
    await page.waitForTimeout(350);
    if (ok) await shot("03_armeria_" + wid);
  }
  await page.evaluate(() => window.DD_UI.openMap());
  await page.waitForTimeout(600);
  await shot("04_mapa_torre");
  await page.evaluate(() => window.DD_UI.closeModals());
  await page.waitForTimeout(250);

  /* ---- INCURSIÓN ---- */
  await page.evaluate(() => window.DD_HUB.exitToRun());
  await page.waitForTimeout(500);
  await shot("05_descenso_cinematica");
  await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
  await page.waitForTimeout(900);
  /* NO usar DMO.debug.invuln(): pone el temporizador de invulnerabilidad a 1e9 y el
     motor muestra entonces al protagonista en pose de DAÑO de forma permanente (las
     capturas de combate no serían representativas). Se cura antes de cada paso. */
  await page.evaluate(() => { try { window.DMO.debug.holdSpawns(true); } catch (e) {} });

  const spawnPack = async () => page.evaluate(() => {
    const s = window.__DD_BRIDGE.getSnapshot(); const p = s.player; const out = [];
    const types = [["dancer", -190, -70, false], ["sprinter", 190, -80, false], ["tank", -230, 80, false], ["speaker", 240, 70, false], ["dancer", 0, -170, true], ["sprinter", -90, 150, false]];
    /* spawnEnemyAt(tipo, x, y, élite, esbirroDeJefe). Hasta R02 esta sonda pasaba
       `true` como 4.º argumento y TODOS salían élite. */
    for (const [t, dx, dy, elite] of types) { try { out.push([t, !!window.DMO.debug.spawnEnemyAt(t, p.x + dx, p.y + dy, elite, false)]); } catch (e) { out.push([t, String(e)]); } }
    return out;
  });

  for (const c of CIRCLES) {
    /* El motor reparte 11 salas por círculo: círculo c (1-9) = niveles (c-1)·11+1 … c·11.
       Se entra en la sala 2 del círculo. El círculo REAL de cada captura queda además en
       capture_report.json (steps.cNN.snap.circle, índice 0) y debe valer c-1.
       (Hasta R02 se usaba una fórmula de 10 salas por círculo y `--circles=4` caía en el III.) */
    const level = (c - 1) * 11 + 2;
    const went = await page.evaluate((lv) => { try { return window.DMO.debug.exploreGoTo(lv); } catch (e) { return String(e); } }, level);
    await page.waitForTimeout(500);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await page.waitForTimeout(400);
    await step({}, 20);
    const tag = "c" + String(c).padStart(2, "0");
    await shot("06_" + tag + "_sala_vacia");
    const spawned = await spawnPack();
    await step({ right: true, fire: true, aim: 0.0 }, 14);
    await shot("07_" + tag + "_combate_a");
    await step({ left: true, up: true, fire: true, aim: 3.3 }, 16);
    await shot("08_" + tag + "_combate_b");
    report.steps[tag] = { level, went, spawned, snap: await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); return { circle: s.circle, room: s.room, roomName: s.roomName, enemies: (s.enemies || []).length, weapon: s.weapon }; }) };
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} });
    await step({}, 30);
  }

  /* ---- ARMAS EN MANO ---- */
  for (const wid of WEAPONS) {
    const eq = await page.evaluate((w) => window.__DD_BRIDGE.buyOrEquipWeapon(w, true), wid);
    await step({ fire: true, aim: 0.0 }, 8);
    await shot("09_arma_" + wid);
    report.steps["weapon_" + wid] = eq;
  }

  /* ---- JEFES ---- */
  for (const c of BOSSES) {
    const level = c * 11;  /* última sala del círculo c (11 salas por círculo); el círculo real queda en el informe */
    await page.evaluate((lv) => { try { window.DMO.debug.exploreGoTo(lv); } catch (e) {} }, level);
    await page.waitForTimeout(500);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    const b = await page.evaluate(() => { try { return !!window.DMO.debug.boss(); } catch (e) { return String(e); } });
    await page.waitForTimeout(400);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await step({}, 90);
    await page.evaluate(() => window.DD_CINE && window.DD_CINE.skip());
    await step({ fire: true, aim: -1.57 }, 30);
    const tag = "jefe_c" + String(c).padStart(2, "0");
    await shot("10_" + tag);
    report.steps[tag] = { level, boss: b, snap: await page.evaluate(() => { const s = window.__DD_BRIDGE.getSnapshot(); return { circle: s.circle, bossActive: s.bossActive, boss: s.boss }; }) };
    await page.evaluate(() => { try { window.DMO.debug.killAll(); } catch (e) {} });
  }

  report.steps.final = await page.evaluate(() => ({ stats: window.DD_ASSETS.stats(), canvas: window.__DD_BRIDGE.getCanvasInfo(), boot: window.DD_BOOT.getState() }));
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, "capture_report.json"), JSON.stringify(report, null, 1));
  console.log(JSON.stringify({ out: OUT, shots: report.shots.length, pageErrors: report.pageErrors, httpErrors: report.httpErrors.slice(0, 10), consoleErrors: report.consoleErrors.slice(0, 5), final: report.steps.final }, null, 1));
  await browser.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
