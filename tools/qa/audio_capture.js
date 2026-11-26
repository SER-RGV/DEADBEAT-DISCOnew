/* ==========================================================================
   CAPTURA Y MEDIDA DE AUDIO · Fase 2

   Por qué existe: el `ScriptProcessor` de `tools/qa/lib/audio.js` vive en el hilo
   principal y, bajo carga (render por software), pierde bloques: sus picos
   bailaban ±5 dB entre pasadas. Este script graba la salida REAL de cada
   `AudioContext` con `MediaRecorder` (hilo de audio, sin pérdidas), decodifica
   lo grabado con `decodeAudioData` y calcula pico/RMS exactos por tramo.

   Uso:
     node tools/qa/audio_capture.js [--out=docs/evidence/fase2]

   Escribe `audio_measures.json` con los números de cada tramo (portada, Refugio
   y partida). No se guardan ficheros de audio: el transporte del comprimido por
   el canal de `evaluate` llegaba corrupto y lo que se audita son las medidas.
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');
const { open } = require('./lib/chrome.js');
const G = require('./lib/game.js');
const server = require('./lib/server.js');

const ROOT = path.resolve(__dirname, '..', '..');
const arg = process.argv.find((a) => a.startsWith('--out='));
const OUT = path.resolve(ROOT, arg ? arg.slice(6) : 'docs/evidence/fase2');

const INIT = () => {
  const rec = { tracks: [], marks: [], created: 0 };
  window.__AUDIO_REC = rec;
  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) {
      super(...a);
      this.__recId = rec.created++;
    }
  };
  window.webkitAudioContext = window.AudioContext;
  const realConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      const ctx = this.context;
      if (dest && dest === ctx.destination) {
        if (!ctx.__stream) {
          const msd = ctx.createMediaStreamDestination();
          const chunks = [];
          const mr = new MediaRecorder(msd.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
          mr.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          mr.start(500);
          ctx.__stream = msd;
          rec.tracks.push({ ctx: ctx.__recId, chunks, mr, ctxObj: ctx, start: performance.now() });
        }
        return realConnect.call(this, ctx.__stream);
      }
    } catch (e) { /* sin captura no se rompe el juego */ }
    return realConnect.apply(this, arguments);
  };
  window.__mark = (name) => rec.marks.push({ name, t: Math.round(performance.now()) });
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await server.start(ROOT);
  const { page, errors, close } = await open({ width: 1280, height: 900 });
  await page.addInitScript(INIT);
  try {
    await G.boot(page, srv.url);
    await page.mouse.click(640, 450);
    await sleep(6000);
    await page.evaluate(() => window.__mark('portada'));

    const entry = await G.enterGame(page);
    await sleep(4000);
    await page.evaluate(() => window.__mark('refugio'));

    await page.evaluate(() => window.DD_HUB.exitToRun());
    await page.waitForFunction(() => window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning(), null, { timeout: 120000 }).catch(() => {});
    await sleep(8000);
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(480 + (i % 5) * 110, 300 + (i % 3) * 80);
      await page.mouse.down();
      await page.mouse.up();
      await sleep(90);
    }
    await sleep(3000);
    await page.evaluate(() => window.__mark('partida'));

    const out = await page.evaluate(async () => {
      const rec = window.__AUDIO_REC;
      const db = (x) => (x > 0 ? +(20 * Math.log10(x)).toFixed(1) : -180);
      const result = { marks: rec.marks, tracks: [], created: rec.created };
      for (const tr of rec.tracks) {
        await new Promise((res) => { tr.mr.onstop = res; tr.mr.stop(); });
        const blob = new Blob(tr.chunks, { type: 'audio/webm' });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const probe = new AudioContext();
        let stats = { error: 'no se pudo decodificar' };
        try {
          const buf = await probe.decodeAudioData(await blob.arrayBuffer());
          const data = buf.getChannelData(0);
          const sr = buf.sampleRate;
          const win = (fromMs, toMs) => {
            const a = Math.max(0, Math.floor(fromMs / 1000 * sr));
            const b = Math.min(data.length, Math.floor(toMs / 1000 * sr));
            if (b <= a) return null;
            let peak = 0;
            let sum = 0;
            for (let i = a; i < b; i++) { const v = data[i]; const m = v < 0 ? -v : v; if (m > peak) peak = m; sum += v * v; }
            return { sec: +((b - a) / sr).toFixed(2), peakdBFS: db(peak), rmsdBFS: db(Math.sqrt(sum / (b - a))) };
          };
          stats = { sampleRate: sr, seconds: +buf.duration.toFixed(2), full: win(0, buf.duration * 1000) };
          /* Ventanas por tramo, ancladas a las marcas del flujo. */
          const mark = (n) => (rec.marks.find((m) => m.name === n) || {}).t;
          const offset = tr.start;
          const end = offset + buf.duration * 1000;
          /* Un tramo solo se mide si la marca cae dentro de la vida de la pista:
             si la pista ya había terminado, no se recoloca la ventana hacia
             atrás (eso medía la portada como si fuera la partida). */
          const stage = (name, span) => {
            const at = mark(name);
            const to = Math.min(end, at);
            const from = Math.max(offset, to - span);
            if (!(at >= offset && at <= end) || !(to > from)) return null;
            return win(from - offset, to - offset);
          };
          stats.windows = {
            portada: stage('portada', 4500),
            refugio: stage('refugio', 3000),
            partida: stage('partida', 8000)
          };
        } catch (e) { stats = { error: String(e && e.message || e) }; }
        await probe.close();
        result.tracks.push({ ctx: tr.ctx, since: Math.round(tr.start), bytes: bytes.length, stats });
      }
      return result;
    });

    const summary = {
      at: new Date().toISOString(),
      metodo: 'MediaRecorder sobre MediaStreamDestination por AudioContext (hilo de audio, sin bloques perdidos) + decodeAudioData para pico/RMS por tramo',
      marks: out.marks,
      contexts: out.created,
      tracks: []
    };
    for (const t of out.tracks) {
      summary.tracks.push({ ctx: t.ctx, bytes: t.bytes, stats: t.stats });
      console.log('ctx' + t.ctx + ' · ' + t.bytes + ' B · ' + JSON.stringify(t.stats.windows || t.stats));
    }
    fs.writeFileSync(path.join(OUT, 'audio_measures.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log('medidas →', path.relative(ROOT, path.join(OUT, 'audio_measures.json')));
    console.log('errores consola:', errors.length);
  } finally {
    await close();
    await srv.close();
  }
})().catch((e) => { console.error('ABORT', e && e.stack || e); process.exit(2); });
