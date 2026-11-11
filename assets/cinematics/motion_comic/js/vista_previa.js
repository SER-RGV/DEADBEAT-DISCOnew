/* DEADBEAT DISCO · Motion comic · vista previa e inspector.
   Reproduce la secuencia y permite revisar viñetas, bocadillos, textos, orden de lectura,
   duración de cada intervención, legibilidad y sincronía. Los cambios se hacen en memoria
   y se guardan descargando guion.json. */

import { Motor, W, H } from "./motor.js";
import { analizar, NOMBRE_TIPO, NOMBRE_ESTADO, DE_LECTURA, GLOBOS } from "./guion.js";
import { fmtTiempo, clamp } from "./util.js";
import { marcado, escaparHtml } from "./dom.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RAIZ = new URL("../", import.meta.url).href;
const params = new URLSearchParams(location.search);
const LIMPIO = params.get("limpio") === "1";
/* Versiones: la vigente está en data/; las anteriores se conservan en data/versiones/<número>/ y se
   abren con ?version=<número> o con el selector de la cabecera. Solo cambia de dónde se leen los datos. */
const VERSION = (params.get("version") || "").replace(/[^0-9a-z.\-]/gi, "");
const DATOS = VERSION ? `data/versiones/${VERSION}/` : "data/";
const coma = (n, d = 2) => n.toFixed(d).replace(".", ",");

const E = {
  motor: null,
  guion: null,
  guionTexto: "",
  comp: null,
  analisis: null,
  pantalla: {},
  sel: null,
  reproduciendo: false,
  velocidad: 1,
  bucle: false,
  sucio: false,
  escala: 1,
};

/* ---------------- Sonido de referencia ---------------- */
const Sonido = {
  ctx: null,
  activar() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  env(g, t, a, pico, d) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  },
  tono(tipo, f0, f1, dur, vol) {
    const c = this.ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  ruido(dur, vol, filtro, frec) {
    const c = this.ctx;
    const t = c.currentTime;
    const n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = filtro;
    f.frequency.value = frec;
    const g = c.createGain();
    this.env(g, t, 0.004, vol, dur);
    s.connect(f).connect(g).connect(c.destination);
    s.start(t);
  },
  pulso(fuerte) {
    if (!this.ctx) return;
    this.tono("square", fuerte ? 1500 : 1000, null, 0.03, fuerte ? 0.07 : 0.04);
  },
  guia(nombre) {
    if (!this.ctx) return;
    if (nombre === "latido") this.tono("sine", 70, 38, 0.3, 0.5);
    else if (nombre === "zumbido") this.tono("sawtooth", 110, 96, 0.5, 0.06);
    else if (nombre === "puerta") this.tono("sawtooth", 180, 520, 0.9, 0.05);
    else if (nombre === "paso") this.ruido(0.08, 0.3, "lowpass", 700);
    else if (nombre === "vapor") this.ruido(1.1, 0.12, "highpass", 3000);
    else if (nombre === "clac") this.ruido(0.04, 0.35, "bandpass", 2600);
    else if (nombre === "impacto") {
      this.tono("sine", 140, 30, 0.7, 0.6);
      this.ruido(0.35, 0.2, "lowpass", 1200);
    }
  },
};

function prepararEventosSonido() {
  const m = E.motor;
  const ev = [];
  for (let b = 0; b < m.pulsosTotales; b++) ev.push({ t: b * m.spb, tipo: "pulso", fuerte: b % (E.guion.tempo.compas || 4) === 0 });
  for (const iv of E.guion.intervenciones) {
    if (iv.activo === false || !iv.sonido_guia) continue;
    const p = m.planos[iv.plano - 1];
    if (!p) continue;
    const tiempos = iv.golpes ? iv.golpes.map((g) => g.en) : iv.animacion === "pasos" ? iv.bloques.map((_, i) => (iv.entra ?? 0) + i * (iv.paso_pulsos ?? 0.5)) : [iv.entra ?? 0];
    for (const tb of tiempos) ev.push({ t: (p.b0 + tb) * m.spb, tipo: "guia", nombre: iv.sonido_guia });
  }
  ev.sort((a, b) => a.t - b.t);
  E.eventos = ev;
}

function dispararSonidos(t0, t1) {
  if (!$("#op-claqueta").checked || !E.eventos) return;
  const conSfx = $("#op-guia-sfx").checked;
  for (const e of E.eventos) {
    if (e.t < t0) continue;
    if (e.t >= t1) break;
    if (e.tipo === "pulso") Sonido.pulso(e.fuerte);
    else if (conSfx) Sonido.guia(e.nombre);
  }
}

/* ---------------- Encaje del lienzo ---------------- */
function ajustar() {
  const hueco = $("#hueco");
  const pad = LIMPIO ? 0 : 20;
  const w = Math.max(160, hueco.clientWidth - pad);
  const h = Math.max(90, hueco.clientHeight - pad);
  const s = Math.min(w / W, h / H);
  E.escala = s;
  const marco = $("#marco");
  marco.style.width = Math.floor(W * s) + "px";
  marco.style.height = Math.floor(H * s) + "px";
  $("#lienzo").style.transform = `scale(${s})`;
}

/* ---------------- Transporte ---------------- */
function irA(t) {
  const m = E.motor;
  m.render(clamp(t, 0, m.duracion));
  actualizarLectura();
}

let planoMostrado = -1;
function actualizarLectura() {
  const m = E.motor;
  const i = m.info();
  $("#lt-tiempo").textContent = fmtTiempo(m.t);
  $("#cabezal").style.left = (m.t / m.duracion) * 100 + "%";
  $("#lt-compas").textContent = `compás ${i.compas}.${i.tiempo}`;
  if (i.plano.i !== planoMostrado) {
    planoMostrado = i.plano.i;
    $("#lt-plano").textContent = String(i.plano.n).padStart(2, "0");
    $("#lt-nombre").textContent = i.plano.nombre;
    const cl = $("#lt-clase");
    if (cl) {
      // Ficha del plano (0.5.0): clasificación a la vista; bloque, encuadre, movimiento y función al pasar el ratón.
      const pc = E.comp.planos[i.plano.i] || {};
      const bl = (E.comp.bloques || []).find((b) => b.n === pc.bloque);
      cl.hidden = !pc.clasificacion;
      cl.textContent = pc.clasificacion === "PROPUESTA" ? "PROPUESTA VISUAL" : pc.clasificacion || "";
      cl.dataset.clase = pc.clasificacion || "";
      cl.title = [bl ? `Bloque ${bl.n} · ${bl.nombre}` : "", pc.encuadre ? "Encuadre: " + pc.encuadre : "", pc.movimiento ? "Cámara: " + pc.movimiento : "", pc.funcion ? "Función: " + pc.funcion : "", pc.clasificacion_nota || ""].filter(Boolean).join("\n");
    }
    $$("#linea-contenido .plano").forEach((e, k) => e.classList.toggle("actual", k === planoMostrado));
  }
}

function reproducir(si) {
  const m = E.motor;
  if (si === E.reproduciendo) return;
  E.reproduciendo = si;
  $("#btn-play").textContent = si ? "Pausar" : "Reproducir";
  if (!si) return;
  if ($("#op-claqueta").checked) Sonido.activar();
  if (m.t >= m.duracion - 0.01) irA(0);
  let antes = performance.now();
  const paso = () => {
    if (!E.reproduciendo) return;
    /* Reloj real (performance.now), no la marca del fotograma: si el equipo dibuja despacio se saltan
       fotogramas, pero los 45 s duran 45 s. Al volver de una pestaña oculta no se salta de golpe. */
    const ahora = performance.now();
    let real = (ahora - antes) / 1000;
    if (E.vuelveDeOculta) {
      real = 0;
      E.vuelveDeOculta = false;
    }
    const dt = Math.max(0, real) * E.velocidad;
    antes = ahora;
    const t0 = m.t;
    let t = t0 + dt;
    if (E.bucle) {
      const p = m.info(t0).plano;
      const fin = p.b1 * m.spb;
      if (t >= fin) t = p.b0 * m.spb;
    }
    if (t >= m.duracion) {
      t = m.duracion;
      reproducir(false);
    }
    if (t > t0) dispararSonidos(t0, t);
    irA(t);
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) E.vuelveDeOculta = true;
});

function irAPlano(n) {
  const p = E.motor.planos[clamp(n, 1, E.motor.planos.length) - 1];
  irA(p.b0 * E.motor.spb + 0.0001);
}

/* Instante en que una pieza ya se ve completa (para revisarla). */
function tiempoDeRevision(it) {
  const m = E.motor;
  const p = it.p;
  let tb;
  if (it.modo === "golpes") tb = it.insts[it.insts.length - 1].t0 + 0.3;
  else {
    const ult = it.tB && it.tB.length ? it.tB[it.tB.length - 1] : it.entra;
    tb = Math.min(ult + 0.75, Math.min(it.sale, p.pulsos) - 0.5);
    tb = Math.max(tb, it.entra + 0.05);
  }
  return (p.b0 + clamp(tb, 0, p.pulsos - 0.01)) * m.spb;
}

/* ---------------- Comprobaciones ---------------- */
function area(a, b) {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return x * y;
}

function comprobarPantalla() {
  const m = E.motor;
  const T = m.textos;
  const L = E.guion.lectura;
  const res = {};
  const t0 = m.t;
  const clases = ["sin-borradores", "solo-arte"].filter((c) => m.lienzo.classList.contains(c));
  clases.forEach((c) => m.lienzo.classList.remove(c));
  const mx = W * L.margen_seguro;
  const my = H * L.margen_seguro;
  for (const it of T.items) {
    const iv = it.iv;
    const avisos = [];
    m.render(tiempoDeRevision(it));
    const lectura = DE_LECTURA.includes(iv.tipo);
    const caja = T.cajaPantalla(it);
    const texto = T.cajaTexto(it);
    const r = { avisos, caja, tam: null };
    if (!caja) avisos.push({ nivel: "error", texto: "No se dibuja en pantalla." });
    else if (caja.x > W || caja.y > H || caja.x + caja.w < 0 || caja.y + caja.h < 0) avisos.push({ nivel: "error", texto: "Queda fuera del encuadre." });
    if (lectura && texto) {
      r.tam = T.tamPantalla(it);
      if (r.tam != null && r.tam < L.tam_minimo_px - 0.5) avisos.push({ nivel: "error", texto: `La letra mide ${coma(r.tam, 0)} px en pantalla; el mínimo es ${L.tam_minimo_px} px.` });
      if (texto.x < mx || texto.y < my || texto.x + texto.w > W - mx || texto.y + texto.h > H - my) avisos.push({ nivel: "aviso", texto: "El texto sale de la zona segura de pantalla." });
      if (GLOBOS.includes(iv.tipo) && iv.cola && iv.cola.hacia && !it.colaOk) avisos.push({ nivel: "aviso", texto: "La cola no llega a dibujarse: el bocadillo está encima de quien habla." });
      for (const o of T.items) {
        if (o === it || !o.viva || o.pantalla) continue;
        const esLectura = DE_LECTURA.includes(o.iv.tipo);
        const c2 = esLectura ? T.cajaTexto(o) : T.cajaPantalla(o);
        if (!c2) continue;
        const frac = area(texto, c2) / Math.max(1, texto.w * texto.h);
        if (frac > (esLectura ? 0.01 : 0.12)) avisos.push({ nivel: esLectura ? "error" : "aviso", texto: `${esLectura ? "Se pisa" : "Puede pisarse"} con «${o.iv.id}».` });
      }
    }
    res[iv.id] = r;
  }
  clases.forEach((c) => m.lienzo.classList.add(c));
  m.render(t0);
  E.pantalla = res;
}

function avisosDe(id) {
  const f = E.analisis.filas.find((x) => x.iv.id === id);
  return [...(f ? f.avisos : []), ...((E.pantalla[id] || {}).avisos || [])];
}

function recomprobar() {
  E.analisis = analizar(E.guion, E.comp);
  if (!E.reproduciendo) comprobarPantalla();
  pintarResumen();
  pintarComprobaciones();
  refrescarPiezas();
  pintarLinea();
}

function totales() {
  let error = 0;
  let aviso = 0;
  for (const f of E.analisis.filas) {
    if (!f.activa) continue;
    for (const a of avisosDe(f.iv.id)) a.nivel === "error" ? error++ : aviso++;
  }
  for (const a of E.analisis.globales) a.nivel === "error" ? error++ : aviso++;
  return { error, aviso };
}

function pintarResumen() {
  const a = E.analisis;
  const t = totales();
  const activas = a.filas.filter((f) => f.activa);
  const borr = activas.filter((f) => f.iv.estado === "borrador").length;
  const cuenta = (e) => activas.filter((f) => f.iv.estado === e).length;
  const lit = cuenta("literal");
  const adap = cuenta("adaptado");
  const prop = cuenta("propuesto");
  const el = $("#resumen");
  el.innerHTML =
    `<span class="pastilla"><b>${coma(a.duracion, 3)} s</b> · ${a.planos.length} planos · ${E.guion.tempo.bpm} pulsos/min</span>` +
    `<span class="pastilla"><b>${activas.length}</b> textos · ${lit} ${lit === 1 ? "literal" : "literales"} · ${adap} ${adap === 1 ? "adaptado" : "adaptados"}</span>` +
    `<span class="pastilla propuesta"><b>${prop}</b> ${prop === 1 ? "PROPUESTA" : "PROPUESTAS"}</span>` +
    (borr ? `<span class="pastilla borrador"><b>${borr}</b> BORRADOR sin aprobar</span>` : "") +
    (t.error ? `<span class="pastilla error"><b>${t.error}</b> ${t.error === 1 ? "error" : "errores"}</span>` : `<span class="pastilla ok">Sin errores</span>`) +
    (t.aviso ? `<span class="pastilla aviso"><b>${t.aviso}</b> ${t.aviso === 1 ? "aviso" : "avisos"}</span>` : "");
  const c = $("#cuenta-avisos");
  c.textContent = t.error + t.aviso || "";
  c.className = "globo-cuenta" + (t.error ? " mal" : t.aviso ? " hay" : "");
}

function pintarComprobaciones() {
  const a = E.analisis;
  const L = E.guion.lectura;
  const activas = a.filas.filter((f) => f.activa);
  const lect = activas.filter((f) => f.lectura && f.chars);
  const maxCps = Math.max(...lect.map((f) => f.cps));
  const rapidas = lect.filter((f) => f.cps > L.cps_comodo).length;
  const tams = lect.map((f) => (E.pantalla[f.iv.id] || {}).tam).filter((x) => x != null);
  const minTam = tams.length ? Math.min(...tams) : null;
  const pisadas = activas.filter((f) => avisosDe(f.iv.id).some((x) => /pisa/.test(x.texto))).length;
  const fuera = activas.filter((f) => avisosDe(f.iv.id).some((x) => /zona segura|encuadre/.test(x.texto))).length;
  const solapes = activas.filter((f) => f.avisos.some((x) => /antes de que dé tiempo/.test(x.texto))).length;
  const noLit = activas.filter((f) => f.avisos.some((x) => /cita|fragmento|origen/.test(x.texto))).length;
  const borr = activas.filter((f) => f.iv.estado === "borrador").length;
  const literales = activas.filter((f) => f.iv.estado === "literal");
  const adaptados = activas.filter((f) => f.iv.estado === "adaptado");
  const propuestos = activas.filter((f) => f.iv.estado === "propuesto");
  const fijMal = activas.filter((f) => f.avisos.some((x) => /fijado/.test(x.texto))).length;
  const fila = (ok, txt) => `<tr><td class="${ok === true ? "si" : ok === false ? "no" : "ojo"}">${ok === true ? "Sí" : ok === false ? "No" : "Ojo"}</td><td>${txt}</td></tr>`;
  let h = `<h3>Resultado</h3><table class="tabla-ok">`;
  h += fila(Math.abs(a.duracion - (E.guion.tempo.duracion_s ?? 45)) < 1e-6, `Duración total: <b>${coma(a.duracion, 3)} s</b> (${E.guion.tempo.pulsos_totales} pulsos a ${E.guion.tempo.bpm} por minuto).`);
  h += fila(a.planos.length === (E.guion.tempo.planos ?? 10), `Planos: <b>${a.planos.length}</b>, uno por viñeta (el guion declara ${E.guion.tempo.planos ?? 10}).`);
  h += fila(rapidas === 0 ? true : maxCps <= L.cps_maximo ? null : false, `Ritmo de lectura: el texto más rápido va a <b>${coma(maxCps, 1)}</b> caracteres por segundo (cómodo hasta ${L.cps_comodo}, máximo ${L.cps_maximo}).`);
  h += fila(solapes === 0 ? true : null, solapes ? `<b>${solapes}</b> ${solapes === 1 ? "texto entra" : "textos entran"} antes de que dé tiempo a leer el anterior.` : `Ningún texto entra antes de que dé tiempo a leer el anterior.`);
  h += fila(pisadas === 0 ? true : null, pisadas ? `<b>${pisadas}</b> ${pisadas === 1 ? "texto se pisa" : "textos se pisan"} con otra pieza en pantalla.` : `Ningún texto se pisa con otro en pantalla.`);
  h += fila(fuera === 0 ? true : null, fuera ? `<b>${fuera}</b> ${fuera === 1 ? "texto sale" : "textos salen"} de la zona segura.` : `Todos los textos están dentro de la zona segura.`);
  if (minTam != null) h += fila(minTam >= L.tam_minimo_px - 0.5, `Letra más pequeña en pantalla: <b>${coma(minTam, 0)} px</b> a 1080p (mínimo ${L.tam_minimo_px} px).`);
  h += fila(noLit === 0, noLit ? `<b>${noLit}</b> ${noLit === 1 ? "texto tiene" : "textos tienen"} un problema con su cita o su origen.` : `<b>${literales.length}</b> ${literales.length === 1 ? "texto literal coincide" : "textos literales coinciden"} letra por letra con su cita; <b>${adaptados.length}</b> ${adaptados.length === 1 ? "adaptado guarda" : "adaptados guardan"} el pasaje que adaptan.`);
  h += fila(fijMal === 0, fijMal ? `<b>${fijMal}</b> ${fijMal === 1 ? "texto ya no coincide" : "textos ya no coinciden"} con el texto fijado por el encargo.` : `Los textos del encargo coinciden letra por letra con lo que se pidió.`);
  h += fila(null, `<b>${propuestos.length}</b> ${propuestos.length === 1 ? "texto es" : "textos son"} PROPUESTA: texto nuevo sin respaldo en la biblia, pendiente de decisión. No es canon.`);
  h += fila(null, `<b>${borr}</b> ${borr === 1 ? "texto es" : "textos son"} BORRADOR: propuestas sin aprobar, no canon.`);
  // Arte: planos que llevan sello de arte nuevo (sin aprobar) o de arte provisional (sustituto).
  const sellosArte = (E.comp.planos || []).flatMap((p) => (!p.provisional ? [] : Array.isArray(p.provisional) ? p.provisional : [p.provisional]).map((pv) => ({ n: p.n, nuevo: pv.tipo === "nuevo" })));
  const dosCifras = (n) => String(n).padStart(2, "0");
  const conNuevo = sellosArte.filter((x) => x.nuevo).map((x) => dosCifras(x.n));
  const conProv = sellosArte.filter((x) => !x.nuevo).map((x) => dosCifras(x.n));
  h += fila(conNuevo.length ? null : true, conNuevo.length ? `<b>${conNuevo.length}</b> ${conNuevo.length === 1 ? "plano usa" : "planos usan"} ARTE NUEVO sin aprobar (${conNuevo.join(", ")}): ilustraciones creadas para esta versión, que no son arte oficial. Ver arte_nuevo/MANIFIESTO.md.` : `Ningún plano usa arte nuevo sin aprobar.`);
  h += fila(conProv.length ? null : true, conProv.length ? `<b>${conProv.length}</b> ${conProv.length === 1 ? "plano usa" : "planos usan"} ARTE PROVISIONAL (${conProv.join(", ")}): sustitutos de un dibujo que falta.` : `Ningún plano usa arte provisional como sustituto.`);
  h += `</table>`;

  const todos = [];
  for (const g of a.globales) todos.push({ nivel: g.nivel, texto: g.texto, id: null });
  for (const f of activas) for (const x of avisosDe(f.iv.id)) todos.push({ nivel: x.nivel, texto: x.texto, id: f.iv.id, plano: f.iv.plano });
  todos.sort((x, y) => (x.nivel === y.nivel ? 0 : x.nivel === "error" ? -1 : 1));
  h += `<h3>Detalle (${todos.length})</h3>`;
  if (!todos.length) h += `<p class="nota">Nada que revisar.</p>`;
  else {
    h += `<div class="lista-avisos">`;
    for (const x of todos) h += `<button type="button" class="${x.nivel}" data-id="${x.id || ""}"><span>${escaparHtml(x.texto)}</span>${x.id ? `<small>Plano ${String(x.plano).padStart(2, "0")} · ${escaparHtml(x.id)}</small>` : ""}</button>`;
    h += `</div>`;
  }
  h += `<p class="nota" style="margin-top:14px">Que cada cita exista de verdad en el archivo indicado lo comprueba <code>validar_guion.mjs</code> (ver README).</p>`;
  const el = $("#comprobaciones");
  el.innerHTML = h;
  $$(".lista-avisos button", el).forEach((b) => b.addEventListener("click", () => b.dataset.id && seleccionar(b.dataset.id, { ir: true, pestana: "guion" })));
}

/* ---------------- Línea de tiempo ---------------- */
const CARRILES = [
  { id: "regla", nombre: "Compases" },
  { id: "planos", nombre: "Planos" },
  { id: "rotulos", nombre: "Cartelas y rótulos", tipos: ["cartela", "rotulo", "neon"] },
  { id: "narrador", nombre: "Narrador", tipos: ["narrador"] },
  { id: "globos", nombre: "Bocadillos", tipos: GLOBOS },
  { id: "sfx", nombre: "Onomatopeyas", tipos: ["onomatopeya"] },
];

function pintarLinea() {
  const m = E.motor;
  const a = E.analisis;
  const dur = m.duracion;
  const pc = (t) => ((t / dur) * 100).toFixed(4) + "%";
  $("#linea-etiquetas").innerHTML = CARRILES.map((c) => `<div>${c.nombre}</div>`).join("");
  let h = "";
  const comp = E.guion.tempo.compas || 4;
  const nComp = m.pulsosTotales / comp;
  h += `<div class="carril regla" style="background-size:${100 / nComp}% 100%, ${100 / m.pulsosTotales}% 100%">`;
  for (let i = 0; i < nComp; i++) h += `<span style="left:${(i / nComp) * 100}%">${i + 1}</span>`;
  h += `</div><div class="carril">`;
  for (const p of a.planos) h += `<div class="plano" style="left:${pc(p.t0)};width:${pc(p.t1 - p.t0)}" title="Plano ${p.n} · ${escaparHtml(p.nombre)} · ${coma(p.t0)}–${coma(p.t1)} s"><b>${String(p.n).padStart(2, "0")}</b>${escaparHtml(p.nombre)}</div>`;
  h += `</div>`;
  for (const c of CARRILES.slice(2)) {
    h += `<div class="carril">`;
    for (const f of a.filas) {
      if (!f.activa || !c.tipos.includes(f.iv.tipo) || !f.plano) continue;
      const av = avisosDe(f.iv.id);
      const cls = ["barra", "t-" + f.iv.tipo, f.iv.estado === "borrador" ? "borrador" : f.iv.estado === "propuesto" ? "propuesta" : "", av.some((x) => x.nivel === "error") ? "con-error" : av.length ? "con-aviso" : "", E.sel === f.iv.id ? "sel" : ""].join(" ");
      const titulo = `${NOMBRE_TIPO[f.iv.tipo]} · ${f.texto} · ${coma(f.t0)}–${coma(f.t1)} s`;
      if (f.iv.golpes) {
        h += `<div class="${cls}" data-id="${f.iv.id}" style="left:${pc(f.t0)};width:${pc(f.dur)};opacity:.5" title="${escaparHtml(titulo)}"></div>`;
        for (const g of f.iv.golpes) h += `<div class="tic" style="left:${pc(f.plano.t0 + g.en * a.spb)}"></div>`;
      } else {
        let marcas = "";
        f.bloquesEn.slice(1).forEach((tb) => {
          const x = ((tb - f.entra) / Math.max(0.01, f.sale - f.entra)) * 100;
          if (x > 0 && x < 100) marcas += `<i style="left:${x.toFixed(2)}%"></i>`;
        });
        h += `<div class="${cls}" data-id="${f.iv.id}" style="left:${pc(f.t0)};width:${pc(f.dur)}" title="${escaparHtml(titulo)}">${escaparHtml(f.texto)}${marcas}</div>`;
      }
    }
    h += `</div>`;
  }
  $("#linea-contenido").innerHTML = h;
  planoMostrado = -1;
  actualizarLectura();
}

function prepararLinea() {
  const pista = $("#linea-pista");
  let arrastrando = false;
  const buscar = (e) => {
    const r = pista.getBoundingClientRect();
    irA(clamp((e.clientX - r.left) / r.width) * E.motor.duracion);
  };
  pista.addEventListener("pointerdown", (e) => {
    const barra = e.target.closest(".barra");
    if (barra) {
      seleccionar(barra.dataset.id, { ir: true, pestana: "guion" });
      return;
    }
    reproducir(false);
    arrastrando = true;
    pista.setPointerCapture(e.pointerId);
    buscar(e);
  });
  pista.addEventListener("pointermove", (e) => arrastrando && buscar(e));
  const fin = () => (arrastrando = false);
  pista.addEventListener("pointerup", fin);
  pista.addEventListener("pointercancel", fin);
}

/* ---------------- Lista del guion y editor ---------------- */
function pintarLista() {
  const a = E.analisis;
  const cont = $("#lista-guion");
  cont.innerHTML = "";
  for (const p of a.planos) {
    const g = document.createElement("section");
    g.className = "grupo-plano";
    g.innerHTML = `<header title="Ir al plano"><span class="chip-plano">${String(p.n).padStart(2, "0")}</span><b>${escaparHtml(p.nombre)}</b><span class="tiempo">${coma(p.t0)} – ${coma(p.t1)} s</span></header>`;
    g.querySelector("header").addEventListener("click", () => {
      reproducir(false);
      irAPlano(p.n);
    });
    const filas = a.filas.filter((f) => f.plano === p).sort((x, y) => (x.activa === y.activa ? (x.orden || 99) - (y.orden || 99) : x.activa ? -1 : 1));
    for (const f of filas) {
      const d = document.createElement("div");
      d.className = "pieza";
      d.dataset.id = f.iv.id;
      d.innerHTML = `<div class="pieza-cab"></div>`;
      d.querySelector(".pieza-cab").addEventListener("click", () => seleccionar(E.sel === f.iv.id ? null : f.iv.id, { ir: true }));
      g.appendChild(d);
    }
    if (!filas.length) g.insertAdjacentHTML("beforeend", `<p class="nota" style="margin:6px 2px">Sin textos en este plano.</p>`);
    cont.appendChild(g);
  }
  refrescarPiezas();
}

function refrescarPiezas() {
  const a = E.analisis;
  const L = E.guion.lectura;
  for (const d of $$("#lista-guion .pieza")) {
    const f = a.filas.find((x) => x.iv.id === d.dataset.id);
    if (!f) continue;
    const iv = f.iv;
    const av = f.activa ? avisosDe(iv.id) : [];
    d.classList.toggle("inactiva", !f.activa);
    d.classList.toggle("sel", E.sel === iv.id);
    const pj = iv.habla && E.guion.personajes[iv.habla];
    const quien = pj ? pj.nombre || pj.rol || iv.habla : "";
    let cifras = `<span class="cifra">de ${coma(f.t0)} a ${coma(f.t1)} s</span> · <span class="cifra">dura ${coma(f.dur)} s</span>`;
    if (f.lectura && f.chars) {
      const cl = f.cps > L.cps_maximo ? "error" : f.cps > L.cps_comodo ? "aviso" : "";
      cifras += ` · <span class="cifra ${cl}">${coma(f.cps, 1)} car/s</span>`;
      const tam = (E.pantalla[iv.id] || {}).tam;
      if (tam != null) cifras += ` · <span class="cifra">letra ${coma(tam, 0)} px</span>`;
    }
    d.querySelector(".pieza-cab").innerHTML =
      `<div class="pieza-num">${f.activa ? f.orden : "–"}</div><div>` +
      `<div class="pieza-meta"><span class="etq tipo">${NOMBRE_TIPO[iv.tipo] || iv.tipo}</span>` +
      (quien ? `<span>${escaparHtml(quien)}</span>` : "") +
      `<span class="etq e-${iv.estado}">${NOMBRE_ESTADO[iv.estado] || iv.estado}</span>` +
      (f.activa ? "" : `<span class="etq">Desactivada</span>`) +
      `</div><div class="pieza-texto">${iv.bloques.map(marcado).join(' <span class="tenue">/</span> ') || '<span class="tenue">(hueco vacío)</span>'}</div>` +
      `<div class="pieza-meta">${cifras}</div>` +
      (av.length ? `<ul class="avisos">${av.map((x) => `<li class="${x.nivel}">${escaparHtml(x.texto)}</li>`).join("")}</ul>` : "") +
      `</div>`;
  }
}

function seleccionar(id, op = {}) {
  const antes = E.sel;
  E.sel = id;
  const T = E.motor.textos;
  $$(".mc-el.seleccionada, .mc-cartela.seleccionada").forEach((e) => e.classList.remove("seleccionada"));
  if (op.pestana) abrirPestana(op.pestana);
  if (antes !== id) {
    $$("#lista-guion .editor").forEach((e) => e.remove());
    if (id) montarEditor(id);
  }
  $$("#lista-guion .pieza").forEach((d) => d.classList.toggle("sel", d.dataset.id === id));
  $$("#linea-contenido .barra").forEach((b) => b.classList.toggle("sel", b.dataset.id === id));
  if (!id) return;
  const it = T.porId[id];
  if (it) {
    it.raiz.classList.add("seleccionada");
    if (op.ir) {
      reproducir(false);
      irA(tiempoDeRevision(it));
    }
  } else if (op.ir) {
    const f = E.analisis.filas.find((x) => x.iv.id === id);
    if (f && f.plano) irA(f.t0 + 0.2);
  }
  if (op.ir || op.pestana) {
    const d = $(`#lista-guion .pieza[data-id="${CSS.escape(id)}"]`);
    if (d) d.scrollIntoView({ block: "nearest" });
  }
}

function montarEditor(id) {
  const iv = E.guion.intervenciones.find((x) => x.id === id);
  const d = $(`#lista-guion .pieza[data-id="${CSS.escape(id)}"]`);
  if (!iv || !d) return;
  const p = E.motor.planos[iv.plano - 1];
  const f = iv.fuente || {};
  const ed = document.createElement("div");
  ed.className = "editor";
  const estados = Object.keys(E.guion.estados).map((k) => `<option value="${k}">${NOMBRE_ESTADO[k] || k}</option>`).join("");
  let h = `<label>Texto (cada línea es un bloque que aparece por separado; *así* se marca el énfasis)<textarea data-c="bloques" rows="3" spellcheck="true" lang="es"></textarea></label>`;
  h += `<div class="dos"><label>Estado<select data-c="estado">${estados}</select></label><label class="marca-op" style="align-self:end;padding-bottom:6px"><input type="checkbox" data-c="activo"> Se muestra</label></div>`;
  if (iv.golpes) h += `<div class="ayuda">Golpes en los pulsos ${iv.golpes.map((g) => coma(g.en, g.en % 1 ? 2 : 0)).join(", ")} del plano (se editan en <code>guion.json</code>).</div>`;
  else {
    h += `<div class="cuatro"><label>Entra (pulso)<input type="number" data-c="entra" step="0.25" min="0" max="${p.pulsos}"></label><label>Sale (pulso)<input type="number" data-c="sale" step="0.25" min="0" max="${p.pulsos}"></label>`;
    h += iv.pos ? `<label>Posición X<input type="number" data-c="x" step="0.005"></label><label>Posición Y<input type="number" data-c="y" step="0.005"></label>` : `<span></span><span></span>`;
    h += `</div><div class="ayuda">El plano dura ${p.pulsos} pulsos (${coma(p.pulsos * E.motor.spb)} s). Un pulso son ${coma(E.motor.spb, 3)} s.</div>`;
  }
  h += `<div class="origen">`;
  if (f.cita) h += `<b>Cita literal:</b> <q>${escaparHtml(f.cita)}</q><br>`;
  if (f.aprobado) h += `<b>Texto aprobado:</b> <q>${escaparHtml(f.aprobado)}</q><br>`;
  if (f.fijado) h += `<b>Texto del encargo:</b> <q>${escaparHtml(f.fijado)}</q><br>`;
  if (f.archivo) h += `<b>Origen:</b> ${escaparHtml(f.archivo)}${f.donde ? " · " + escaparHtml(f.donde) : ""}<br>`;
  if (f.nota) h += escaparHtml(f.nota);
  h += `</div>`;
  h += `<div><button type="button" class="secundario" data-c="restaurar">Restaurar esta pieza</button></div>`;
  ed.innerHTML = h;
  d.appendChild(ed);

  const c = (n) => ed.querySelector(`[data-c="${n}"]`);
  const volcar = () => {
    c("bloques").value = iv.bloques.join("\n");
    c("estado").value = iv.estado;
    c("activo").checked = iv.activo !== false;
    if (c("entra")) {
      c("entra").value = iv.entra ?? 0;
      c("sale").value = iv.sale ?? p.pulsos;
    }
    if (c("x") && iv.pos) {
      c("x").value = +iv.pos.x.toFixed(4);
      c("y").value = +iv.pos.y.toFixed(4);
    }
  };
  volcar();
  E.volcarEditor = volcar;

  let temporizador = 0;
  const aplicar = (origen) => {
    iv.bloques = c("bloques").value.split("\n").map((s) => s.trim()).filter(Boolean);
    iv.estado = c("estado").value;
    if (c("activo").checked) delete iv.activo;
    else iv.activo = false;
    if (c("entra")) {
      const en = parseFloat(c("entra").value);
      const sa = parseFloat(c("sale").value);
      if (isFinite(en)) iv.entra = clamp(en, 0, p.pulsos);
      if (isFinite(sa)) iv.sale = clamp(sa, 0, p.pulsos);
    }
    if (c("x") && iv.pos) {
      const x = parseFloat(c("x").value);
      const y = parseFloat(c("y").value);
      if (isFinite(x)) iv.pos.x = x;
      if (isFinite(y)) iv.pos.y = y;
    }
    // Un texto retocado deja de ser una cita: pasa a BORRADOR para que nunca se presente como texto del juego.
    if (iv.estado !== "borrador" && origen !== "estado") {
      const fila = analizar(E.guion, E.comp).filas.find((x) => x.iv === iv);
      if (fila && fila.avisos.some((x) => /ya no coincide/.test(x.texto))) {
        iv.estado = "borrador";
        c("estado").value = "borrador";
        avisar("El texto ya no coincide con su cita o con el texto del encargo: la pieza pasa a BORRADOR.");
      }
    }
    marcarSucio();
    reconstruir();
  };
  ed.addEventListener("input", (e) => {
    const origen = e.target.dataset.c;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => aplicar(origen), origen === "bloques" ? 280 : 60);
  });
  c("restaurar").addEventListener("click", () => {
    const orig = JSON.parse(E.guionTexto).intervenciones.find((x) => x.id === id);
    if (!orig) return;
    for (const k of Object.keys(iv)) delete iv[k];
    Object.assign(iv, orig);
    volcar();
    marcarSucio();
    reconstruir();
  });
}

function reconstruir() {
  const m = E.motor;
  m.textos.construir();
  m.render(m.t);
  prepararEventosSonido();
  recomprobar();
  if (E.sel && m.textos.porId[E.sel]) m.textos.porId[E.sel].raiz.classList.add("seleccionada");
}

function marcarSucio() {
  E.sucio = JSON.stringify(E.guion) !== JSON.stringify(JSON.parse(E.guionTexto));
  $("#sin-guardar").hidden = !E.sucio;
  $("#btn-restaurar").hidden = !E.sucio;
}

let temporizadorAviso = 0;
function avisar(texto) {
  const el = $("#aviso-flotante");
  el.textContent = texto;
  el.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => (el.hidden = true), 4200);
}

function abrirPestana(nombre) {
  $$(".pestanas button").forEach((b) => b.classList.toggle("activa", b.dataset.pestana === nombre));
  $$(".hoja").forEach((h) => h.classList.toggle("activa", h.dataset.hoja === nombre));
}

/* ---------------- Arrastrar piezas sobre la imagen ---------------- */
function prepararArrastre() {
  const lienzo = $("#lienzo");
  let arr = null;
  lienzo.addEventListener("pointerdown", (e) => {
    const el = e.target.closest("[data-id]");
    if (!el || !lienzo.contains(el)) return;
    const id = el.dataset.id;
    const it = E.motor.textos.porId[id];
    if (!it) return;
    reproducir(false);
    seleccionar(id, { pestana: "guion" });
    const iv = it.iv;
    if (!iv.pos || iv.pos.arte || iv.golpes || it.pantalla) return;
    arr = { id, iv, p: it.p, x: e.clientX, y: e.clientY, px: iv.pos.x, py: iv.pos.y, movido: false };
    lienzo.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  let pendiente = false;
  lienzo.addEventListener("pointermove", (e) => {
    if (!arr) return;
    const cam = arr.p.P.cam;
    if (!cam) return;
    const k = cam.w / W / E.escala;
    const a = (cam.giro * Math.PI) / 180;
    const dx = (e.clientX - arr.x) * k;
    const dy = (e.clientY - arr.y) * k;
    if (Math.abs(dx) + Math.abs(dy) < 2 && !arr.movido) return;
    arr.movido = true;
    arr.iv.pos.x = +(arr.px + (dx * Math.cos(a) - dy * Math.sin(a)) / arr.p.v.w).toFixed(4);
    arr.iv.pos.y = +(arr.py + (dx * Math.sin(a) + dy * Math.cos(a)) / arr.p.v.h).toFixed(4);
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      const m = E.motor;
      m.textos.construir();
      m.render(m.t);
      const it = m.textos.porId[arr ? arr.id : E.sel];
      if (it) it.raiz.classList.add("seleccionada");
      if (E.volcarEditor && E.sel) E.volcarEditor();
    });
  });
  const fin = () => {
    if (arr && arr.movido) {
      marcarSucio();
      reconstruir();
    }
    arr = null;
  };
  lienzo.addEventListener("pointerup", fin);
  lienzo.addEventListener("pointercancel", fin);
}

/* ---------------- Controles ---------------- */
function prepararControles() {
  const m = E.motor;
  $("#btn-play").addEventListener("click", () => reproducir(!E.reproduciendo));
  $("#btn-inicio").addEventListener("click", () => irA(0));
  $("#btn-ant").addEventListener("click", () => {
    const i = m.info();
    irAPlano(i.pulsoEnPlano > 0.5 ? i.plano.n : i.plano.n - 1);
  });
  $("#btn-sig").addEventListener("click", () => irAPlano(m.info().plano.n + 1));
  $("#op-bucle").addEventListener("change", (e) => (E.bucle = e.target.checked));
  $("#op-velocidad").addEventListener("change", (e) => (E.velocidad = parseFloat(e.target.value) || 1));
  $("#op-claqueta").addEventListener("change", (e) => e.target.checked && Sonido.activar());
  const opciones = () =>
    m.aplicarOpciones({
      sellos: $("#op-sellos").checked,
      orden: $("#op-orden").checked,
      guias: $("#op-guias").checked,
      sinBorradores: $("#op-sin-borradores").checked,
      soloArte: $("#op-solo-arte").checked,
      soloTexto: $("#op-solo-texto").checked,
    });
  ["sellos", "orden", "guias", "sin-borradores", "solo-arte", "solo-texto"].forEach((n) => $("#op-" + n).addEventListener("change", opciones));
  E.aplicarOpciones = opciones;
  $$(".pestanas button").forEach((b) => b.addEventListener("click", () => abrirPestana(b.dataset.pestana)));

  $("#btn-descargar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(E.guion, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "guion.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    avisar("Descargado. Para conservar los cambios, sustituye data/guion.json por este archivo.");
  });
  $("#btn-restaurar").addEventListener("click", () => {
    E.guion = JSON.parse(E.guionTexto);
    m.guion = E.guion;
    seleccionar(null);
    marcarSucio();
    reconstruir();
    pintarLista();
  });

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey) return;
    // Dígitos: saltan al plano. Con Mayús o con Alt, a los planos 11 a 20. Se lee la tecla física (e.code)
    // porque con Mayús o Alt la tecla produce otro carácter según el teclado.
    const dig = /^(Digit|Numpad)([0-9])$/.exec(e.code || "");
    if (dig) {
      e.preventDefault();
      reproducir(false);
      const n = (dig[2] === "0" ? 10 : +dig[2]) + (e.altKey || e.shiftKey ? 10 : 0);
      if (n <= m.planos.length) irAPlano(n);
      return;
    }
    if (e.altKey) return;
    if (e.code === "Space") {
      e.preventDefault();
      reproducir(!E.reproduciendo);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      reproducir(false);
      const paso = e.shiftKey ? 1 / 30 : m.spb;
      irA(m.t + (e.key === "ArrowRight" ? paso : -paso));
    } else if (e.key === "Home") irA(0);
  });
  window.addEventListener("beforeunload", (e) => {
    if (E.sucio) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
}

/* ---------------- Versiones ---------------- */
function prepararVersiones() {
  const sel = $("#op-version");
  if (!sel) return;
  const vigente = String(E.guion.version || "").replace(/-preview$/, "");
  $("#version-actual").textContent = (E.guion.version || "") + (VERSION ? " · versión anterior" : "");
  document.body.classList.toggle("version-anterior", !!VERSION);
  fetch(RAIZ + "data/versiones/indice.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { versiones: [] }))
    .catch(() => ({ versiones: [] }))
    .then((ind) => {
      sel.innerHTML = "";
      for (const v of ind.versiones || []) {
        const o = document.createElement("option");
        o.value = v.vigente ? "" : v.id;
        o.textContent = v.id + (v.vigente ? " (vigente)" : "") + (v.titulo ? " · " + v.titulo : "");
        o.selected = VERSION ? v.id === VERSION : !!v.vigente;
        sel.appendChild(o);
      }
      if (!sel.options.length) {
        const o = document.createElement("option");
        o.textContent = vigente || "vigente";
        o.value = "";
        sel.appendChild(o);
      }
      sel.addEventListener("change", () => {
        if (E.sucio && !confirm("Hay cambios sin guardar en el guion. ¿Cambiar de versión y perderlos?")) {
          sel.value = VERSION;
          return;
        }
        E.sucio = false;
        const q = new URLSearchParams(location.search);
        for (const k of ["t", "plano", "sel"]) q.delete(k);
        if (sel.value) q.set("version", sel.value);
        else q.delete("version");
        location.search = q.toString();
      });
    });
}

/* ---------------- Arranque ---------------- */
async function iniciar() {
  if (LIMPIO) document.body.classList.add("limpio");
  if (params.get("ligero") === "1") document.body.classList.add("ligero");
  const detalle = $("#carga-detalle");
  try {
    const [gt, comp] = await Promise.all([
      fetch(RAIZ + DATOS + "guion.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("No se pudo leer " + DATOS + "guion.json (" + r.status + ")");
        return r.text();
      }),
      fetch(RAIZ + DATOS + "composicion.json", { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("No se pudo leer " + DATOS + "composicion.json (" + r.status + ")");
        return r.json();
      }),
    ]);
    E.guionTexto = gt;
    E.guion = JSON.parse(gt);
    E.comp = comp;
  } catch (err) {
    detalle.textContent = "No se pudo cargar el guion.\n" + err.message + "\n\nEsta página necesita abrirse desde un servidor local (ver README.md).";
    return;
  }
  const m = (E.motor = new Motor($("#lienzo"), E.guion, E.comp, RAIZ));
  ajustar();
  new ResizeObserver(ajustar).observe($("#hueco"));
  await m.cargar((n, total) => ($("#carga-progreso").style.width = (n / total) * 100 + "%"));
  if (m.fallos.length) {
    detalle.textContent = "No se encontraron estas ilustraciones:\n" + m.fallos.join("\n");
    return;
  }
  m.construir();
  $("#lt-total").textContent = fmtTiempo(m.duracion);
  prepararVersiones();
  prepararControles();
  prepararLinea();
  prepararArrastre();
  prepararEventosSonido();

  // Opciones por dirección: ?t=12.5 ?plano=4 ?sellos=0 ?orden=1 ?guias=1 ?limpio=1 ?ligero=1 ?sel=id ?pestana=comprobar
  if (params.get("sellos") === "0") $("#op-sellos").checked = false;
  if (params.get("orden") === "1") $("#op-orden").checked = true;
  if (params.get("guias") === "1") $("#op-guias").checked = true;
  if (params.get("borradores") === "0") $("#op-sin-borradores").checked = true;
  E.aplicarOpciones();

  E.analisis = analizar(E.guion, E.comp);
  pintarLista();
  recomprobar();
  $("#carga").hidden = true;

  if (params.get("pestana")) abrirPestana(params.get("pestana"));
  if (params.get("sel")) seleccionar(params.get("sel"), { ir: true });
  if (params.has("t")) irA(parseFloat(params.get("t")) || 0);
  else if (params.has("plano")) irAPlano(parseInt(params.get("plano"), 10) || 1);
  else if (!params.get("sel")) irA(0);

  window.MC = { version: E.guion.version, datos: DATOS, motor: m, estado: E, irA, irAPlano, seleccionar, reproducir, comprobar: recomprobar, totales };
  document.documentElement.dataset.listo = "1";
}

iniciar().catch((err) => {
  console.error(err);
  const d = $("#carga-detalle");
  if (d) d.textContent = "Error al iniciar la vista previa:\n" + (err && err.message ? err.message : err);
});
