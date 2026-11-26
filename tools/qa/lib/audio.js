/* ==========================================================================
   Sonda de audio del arnés.

   Qué mide y por qué así:
   - Cada `AudioContext` del juego se engancha en serie justo antes de su
     `destination` con un `ScriptProcessorNode`. El analizador no se conecta «en
     paralelo»: sin entrada devolvería silencio siempre (primer error de esta
     sonda, corregido). El nodo se intercala, de modo que el juego sigue sonando
     igual y la sonda escucha exactamente lo que sale.
   - Pico y RMS se acumulan dentro del propio callback: no dependen de que el
     hilo principal llegue a tiempo. Aun así, `ScriptProcessor` corre en el hilo
     principal, así que bajo carga puede perder bloques. Por eso las pruebas
     usan cotas holgadas (música audible ≥ −24 dBFS) y nunca exigen RMS exacto.
   - También se cuentan las notas programadas (`OscillatorNode.start` y
     `AudioBufferSourceNode.start`) por contexto: es la métrica que delató el
     fallo real de la Fase 2 (1–3 notas/s con 120 ms de adelanto frente a 10/s
     con 1,25 s).
   ========================================================================== */
'use strict';

const INIT = () => {
  const probe = { taps: [], notes: 0, noteByCtx: {}, created: 0 };
  window.__AUDIO_PROBE = probe;

  const AC = window.AudioContext;
  window.AudioContext = class extends AC {
    constructor(...a) {
      super(...a);
      this.__audioId = probe.created++;
    }
  };
  window.webkitAudioContext = window.AudioContext;

  const count = (node) => {
    probe.notes++;
    const id = node.context && node.context.__audioId;
    probe.noteByCtx[id] = (probe.noteByCtx[id] || 0) + 1;
  };
  const OSC = OscillatorNode.prototype.start;
  OscillatorNode.prototype.start = function () { count(this); return OSC.apply(this, arguments); };
  const BUF = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function () { count(this); return BUF.apply(this, arguments); };

  const realConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest) {
    try {
      const ctx = this.context;
      if (dest && dest === ctx.destination) {
        if (!ctx.__tap) {
          const tap = { ctx: ctx.__audioId, ctxObj: ctx, peak: 0, sumSq: 0, frames: 0, clip: 0 };
          const sp = ctx.createScriptProcessor(4096, 1, 1);
          sp.onaudioprocess = (ev) => {
            const d = ev.inputBuffer.getChannelData(0);
            let peak = 0;
            let sum = 0;
            for (let i = 0; i < d.length; i++) {
              const v = d[i];
              const a = v < 0 ? -v : v;
              if (a > peak) peak = a;
              sum += v * v;
            }
            tap.frames++;
            tap.sumSq += sum;
            if (peak > tap.peak) tap.peak = peak;
            if (peak > 0.99) tap.clip++;
          };
          realConnect.call(sp, ctx.destination);
          ctx.__tap = sp;
          probe.taps.push(tap);
        }
        return realConnect.call(this, ctx.__tap);
      }
    } catch (e) { /* sin sonda no se rompe el juego */ }
    return realConnect.apply(this, arguments);
  };
};

/** Instala la sonda antes de cargar el juego (addInitScript). */
async function install(page) {
  await page.addInitScript(INIT);
}

/** Lee y reinicia los acumuladores. `label` solo etiqueta la lectura. */
async function read(page, label) {
  return page.evaluate((label) => {
    const probe = window.__AUDIO_PROBE;
    if (!probe) return { label, ready: false, contexts: [] };
    const db = (x) => (x > 0 ? +(20 * Math.log10(x)).toFixed(1) : -180);
    const contexts = probe.taps.map((t) => {
      const rms = t.frames ? Math.sqrt(t.sumSq / (t.frames * 4096)) : 0;
      const out = {
        ctx: t.ctx,
        state: t.ctxObj.state,
        sec: +(t.frames * 4096 / t.ctxObj.sampleRate).toFixed(2),
        peakdBFS: db(t.peak),
        rmsdBFS: db(rms),
        clips: t.clip,
        notes: probe.noteByCtx[t.ctx] || 0
      };
      t.peak = 0; t.sumSq = 0; t.frames = 0; t.clip = 0;
      delete probe.noteByCtx[t.ctx];
      return out;
    });
    probe.notes = 0;
    return { label, ready: true, contexts, taps: probe.taps.length };
  }, label);
}

/** Dueño declarado del audio y estado de la máquina de estados. */
async function state(page) {
  return page.evaluate(() => {
    const boot = window.DD_BOOT && window.DD_BOOT.getState ? window.DD_BOOT.getState() : null;
    const cover = window.DDC_COVER && window.DDC_COVER.music ? window.DDC_COVER.music : null;
    return {
      state: boot ? boot.state : null,
      owner: boot ? boot.audioOwner : null,
      menuMusic: boot ? boot.menuMusic : null,
      coverPlaying: cover ? !!cover.playing : null,
      hub: !!(window.DD_HUB && window.DD_HUB.isActive && window.DD_HUB.isActive()),
      running: !!(window.__DD_BRIDGE && window.__DD_BRIDGE.isRunning && window.__DD_BRIDGE.isRunning())
    };
  });
}

/** Suma de picos de todos los contextos: el nivel que oye el jugador. */
function loudest(reading) {
  const list = (reading && reading.contexts) || [];
  return list.reduce((m, c) => (c.peakdBFS > m ? c.peakdBFS : m), -180);
}

function quietest(reading) {
  const list = (reading && reading.contexts) || [];
  if (!list.length) return -180;
  return list.reduce((m, c) => (c.peakdBFS < m ? c.peakdBFS : m), 0);
}

function db(x) {
  return x > 0 ? +(20 * Math.log10(x)).toFixed(1) : -180;
}

module.exports = { install, read, state, loudest, quietest, db };
