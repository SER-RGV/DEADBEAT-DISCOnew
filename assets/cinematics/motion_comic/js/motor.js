/* DEADBEAT DISCO · Motion comic de la introducción · motor de reproducción.

   - render(t) es determinista: el mismo instante dibuja siempre el mismo fotograma.
     Sirve para la vista previa, para revisar fotograma a fotograma y, más adelante,
     para exportar el vídeo definitivo capturando fotogramas.
   - Las ilustraciones se cargan desde sus archivos originales y no se modifican.
   - Los textos viven en una capa aparte (guion.json) y se dibujan con vectores y tipografía. */

import { clamp, lerp, invLerp, smooth, ease, rng, hashStr, jitter, golpe } from "./util.js";
import * as F from "./formas.js";
import { crear, crearSvg } from "./dom.js";
import { CapaTextos } from "./textos.js";

export const W = 1920;
export const H = 1080;
export { crear, crearSvg };

const GRANO =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420'><filter id='n' x='0' y='0' width='100%' height='100%'>" +
      "<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='11' stitchTiles='stitch'/>" +
      "<feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0 0.1  0 0 0 1.1 -0.5'/></filter>" +
      "<rect width='100%' height='100%' filter='url(#n)'/></svg>"
  ) +
  "\")";

export class Motor {
  constructor(lienzo, guion, comp, baseUrl) {
    this.lienzo = lienzo;
    this.guion = guion;
    this.comp = comp;
    this.baseUrl = baseUrl;
    this.t = 0;
    this.opciones = { sellos: true, orden: false, guias: false };
    this.prepararTiempos();
  }

  /* ---------------- Tiempo ---------------- */
  prepararTiempos() {
    const g = this.guion;
    this.spb = 60 / g.tempo.bpm;
    let b = 0;
    const vinetas = {};
    for (const pag of this.comp.paginas) for (const v of pag.vinetas) vinetas[v.id] = { pag, v };
    this.planos = this.comp.planos.map((p, i) => {
      const ref = vinetas[p.vineta];
      const o = { ...p, i, b0: b, b1: b + p.pulsos, v: ref.v, pag: ref.pag };
      b += p.pulsos;
      return o;
    });
    this.pulsosTotales = b;
    this.duracion = b * this.spb;
  }
  planoEn(pulso) {
    for (const p of this.planos) if (pulso < p.b1) return p;
    return this.planos[this.planos.length - 1];
  }
  info(t = this.t) {
    const pulso = t / this.spb;
    const p = this.planoEn(pulso);
    const comp = this.guion.tempo.compas || 4;
    return { t, pulso, plano: p, compas: Math.floor(pulso / comp) + 1, tiempo: (Math.floor(pulso) % comp) + 1, pulsoEnPlano: pulso - p.b0 };
  }

  /* ---------------- Carga ---------------- */
  url(src) {
    return new URL(src, this.baseUrl).href;
  }
  async cargar(onProgreso) {
    const rec = this.comp.recursos;
    const ids = Object.keys(rec).filter((k) => !k.startsWith("_"));
    let hechos = 0;
    this.fallos = [];
    await Promise.all(
      ids.map(
        (id) =>
          new Promise((ok) => {
            const im = new Image();
            im.onload = async () => {
              try { if (im.decode) await im.decode(); } catch (e) { /* sigue */ }
              rec[id].ok = true;
              if (!rec[id].w) { rec[id].w = im.naturalWidth; rec[id].h = im.naturalHeight; }
              hechos++;
              if (onProgreso) onProgreso(hechos, ids.length);
              ok();
            };
            im.onerror = () => {
              rec[id].ok = false;
              this.fallos.push(rec[id].src);
              hechos++;
              if (onProgreso) onProgreso(hechos, ids.length);
              ok();
            };
            im.src = this.url(rec[id].src);
          })
      )
    );
    const fuentes = new Set();
    const est = this.guion.estilos;
    for (const k in est) {
      if (est[k].fuente) fuentes.add((est[k].cursiva ? "italic " : "") + "700 30px \"" + est[k].fuente + "\"");
      if (est[k].fuente) fuentes.add("400 30px \"" + est[k].fuente + "\"");
      if (est[k].sub_fuente) fuentes.add("400 30px \"" + est[k].sub_fuente + "\"");
    }
    for (const iv of this.guion.intervenciones) if (iv.letras && iv.letras.fuente) fuentes.add("400 30px \"" + iv.letras.fuente + "\"");
    fuentes.add("400 30px \"Anton\"");
    fuentes.add("italic 700 30px \"Comic Neue\"");
    if (document.fonts && document.fonts.load) {
      await Promise.all([...fuentes].map((f) => document.fonts.load(f, "ÁÑ¡¿abc").catch(() => null)));
      try { await document.fonts.ready; } catch (e) { /* sigue */ }
    }
  }

  /* ---------------- Construcción ---------------- */
  construir() {
    const L = this.lienzo;
    L.innerHTML = "";
    L.classList.add("mc-lienzo");
    L.style.setProperty("--mc-grano", GRANO);
    crear("div", "mc-mesa", L);
    this.paginas = {};
    for (const pag of this.comp.paginas) this.construirPagina(pag);
    this.pantalla = crear("div", "mc-pantalla", L);
    this.pasoSombra = crear("div", "mc-paso-sombra", this.pantalla);
    this.flash = crear("div", "mc-flash", this.pantalla);
    this.cartelas = crear("div", "mc-cartelas", this.pantalla);
    crear("div", "mc-grano-global", this.pantalla);
    crear("div", "mc-vineteado", this.pantalla);
    this.construirGuias();
    this.textos = new CapaTextos(this);
    this.textos.construir();
    this.aplicarOpciones();
    this.render(this.t);
  }

  construirPagina(pag) {
    const capa = crear("div", "mc-pagina-capa", this.lienzo);
    const hoja = crear("div", "mc-pagina", capa);
    hoja.style.width = pag.w + "px";
    hoja.style.height = pag.h + "px";
    crear("div", "mc-papel", hoja);
    // Salpicaduras de tinta en los márgenes: mismas en cada carga (semilla fija).
    const r = rng("manchas-" + pag.id);
    for (let i = 0; i < 9; i++) {
      const s = crearSvg("svg", { class: "mc-mancha", width: 1, height: 1 }, hoja);
      const lado = r();
      const x = lado < 0.5 ? r() * pag.w : r() < 0.5 ? 10 + r() * 50 : pag.w - 10 - r() * 50;
      const y = lado < 0.5 ? (r() < 0.5 ? 8 + r() * 50 : pag.h - 8 - r() * 50) : r() * pag.h;
      s.style.left = x + "px";
      s.style.top = y + "px";
      crearSvg("path", { d: F.manchaTinta(6 + r() * 22, { semilla: hashStr(pag.id + i) }), fill: "rgba(14,10,18," + (0.5 + r() * 0.45).toFixed(2) + ")" }, s);
    }
    const folio = crear("div", "mc-folio", hoja);
    folio.textContent = "— " + (pag.folio || "") + " —";
    folio.style.left = pag.w / 2 - 40 + "px";
    const P = { def: pag, capa, hoja, vinetas: {} };
    for (const v of pag.vinetas) P.vinetas[v.id] = this.construirVineta(P, v);
    P.insertos = crear("div", "mc-insertos", hoja);
    P.textos = crear("div", "mc-textos", hoja);
    this.paginas[pag.id] = P;
    for (const v of pag.vinetas) this.construirActores(P, P.vinetas[v.id]);
  }

  construirVineta(P, v) {
    const plano = this.planos.find((p) => p.vineta === v.id);
    const raiz = crear("div", "mc-vineta", P.hoja);
    raiz.style.cssText = `left:${v.x}px;top:${v.y}px;width:${v.w}px;height:${v.h}px`;
    const clip = crear("div", "mc-vineta-clip", raiz);
    const forma = v.forma || [[0, 0], [1, 0], [1, 1], [0, 1]];
    if (v.forma) clip.style.clipPath = "polygon(" + forma.map((q) => `${q[0] * 100}% ${q[1] * 100}%`).join(",") + ")";
    const V = { def: v, plano, raiz, clip, cache: {}, fx: [], actores: {} };
    if (plano) {
      plano.V = V;
      plano.P = P;
      const rec = this.comp.recursos[plano.arte.recurso];
      const src = this.url(rec.src);
      for (const cls of ["mc-lapiz", "mc-arte", "mc-fantasma"]) {
        const im = crear("img", cls, clip);
        im.src = src;
        im.width = rec.w;
        im.height = rec.h;
        im.draggable = false;
        im.alt = "";
        V[cls.slice(3)] = im;
      }
      V.fxFondo = crear("div", "mc-fx-fondo", clip);
      V.sfxCapa = crear("div", "mc-sfx-capa", clip);
      V.actoresCapa = crear("div", "mc-actores", clip);
      V.fxFrente = crear("div", "mc-fx-frente", clip);
      V.sfxFrente = crear("div", "mc-sfx-frente", clip);
      V.trama = crear("div", "mc-trama", clip);
      V.tramaLuz = crear("div", "mc-trama-luz", clip);
      V.velo = crear("div", "mc-velo-pasado", clip);
      this.construirFx(V, plano);
    }
    const svg = crearSvg("svg", { class: "mc-borde", width: v.w, height: v.h }, raiz);
    const vert = forma.map((q) => [q[0] * v.w, q[1] * v.h]);
    crearSvg("path", { d: F.poligonoTosco(vert, { semilla: hashStr(v.id), temblor: 2.6 }), "stroke-width": 11 }, svg);
    crearSvg("path", { d: F.poligonoTosco(vert, { semilla: hashStr(v.id + "b"), temblor: 4.5, paso: 170 }), "stroke-width": 3.5, opacity: 0.8 }, svg);
    return V;
  }

  construirActores(P, V) {
    const plano = V.plano;
    if (!plano) return;
    const v = V.def;
    for (const a of plano.actores || []) {
      const A = { def: a };
      if (a.tipo === "sprite") {
        const raiz = crear("div", "mc-actor mc-actor-tinta" + (a.estilo === "silueta" ? " silueta" : "") + (a.reflejo ? " reflejo" : ""), V.actoresCapa);
        if (a.sombra) crear("div", "mc-sombra", raiz);
        A.raiz = raiz;
        A.imgs = {};
        for (const pose of a.poses) {
          for (const id of pose.cuadros) {
            if (A.imgs[id]) continue;
            const rec = this.comp.recursos[id];
            const im = crear("img", "", raiz);
            im.src = this.url(rec.src);
            im.draggable = false;
            im.alt = "";
            A.imgs[id] = im;
          }
        }
      } else if (a.tipo === "inserto") {
        const lado = a.ancho * v.w;
        const alto = lado * (a.proporcion || 1);
        const raiz = crear("div", "mc-inserto " + (a.forma === "rect" ? "rect" : "circulo"), P.insertos);
        raiz.style.width = lado + "px";
        raiz.style.height = alto + "px";
        const caja = crear("div", "mc-inserto-caja", raiz);
        const im = crear("img", "", caja);
        im.src = this.url(this.comp.recursos[a.recurso].src);
        im.draggable = false;
        im.alt = "";
        if (a.recorte) {
          // Viñeta de detalle: muestra solo una zona de la imagen original.
          const [x0, y0, x1, y1] = a.recorte;
          const w = lado / (x1 - x0);
          const h = alto / (y1 - y0);
          im.className = "recorte" + (a.pixelado ? " pixelado" : "");
          im.style.cssText = `left:${-x0 * w}px;top:${-y0 * h}px;width:${w}px;height:${h}px`;
        }
        const svg = crearSvg("svg", { width: lado, height: alto }, raiz);
        if (a.forma === "rect") {
          const d = F.rectTosco(0, 0, lado, alto, { semilla: hashStr(plano.id + a.id), temblor: 2.2, paso: 60 });
          crearSvg("path", { class: "marco2", d }, svg);
          crearSvg("path", { class: "marco", d }, svg);
        } else {
          crearSvg("circle", { class: "marco2", cx: lado / 2, cy: lado / 2, r: lado / 2 }, svg);
          crearSvg("circle", { class: "marco", cx: lado / 2, cy: lado / 2, r: lado / 2 }, svg);
        }
        A.raiz = raiz;
        A.lado = lado;
        A.altoPx = alto;
        A.cx = v.x + a.centro[0] * v.w;
        A.cy = v.y + a.centro[1] * v.h;
      } else if (a.tipo === "imagen") {
        const rec = this.comp.recursos[a.recurso];
        const raiz = crear("div", "mc-imagen", V.actoresCapa);
        const ancho = a.ancho * v.w;
        raiz.style.width = ancho + "px";
        const im = crear("img", "", raiz);
        im.src = this.url(rec.src);
        im.draggable = false;
        im.alt = "";
        A.raiz = raiz;
        A.ancho = ancho;
        A.alto = (ancho * rec.h) / rec.w;
      }
      V.actores[a.id] = A;
    }
  }

  construirFx(V, plano) {
    const v = V.def;
    for (const fx of plano.fx || []) {
      const X = { def: fx };
      const fondo = V.fxFondo;
      const frente = V.fxFrente;
      switch (fx.tipo) {
        case "niebla":
          X.el = crear("div", "mc-fx mc-fx-niebla", frente);
          X.el.style.setProperty("--c", fx.color || "rgba(140,80,220,.25)");
          break;
        case "fuga_luz":
          X.halo = crear("div", "mc-fx mc-fx-fuga-halo", fondo);
          X.halo.style.setProperty("--x", fx.x * 100 + "%");
          X.el = crear("div", "mc-fx mc-fx-fuga", fondo);
          break;
        case "contraluz":
          X.el = crear("div", "mc-fx mc-fx-contraluz", fondo);
          X.el.style.background = `radial-gradient(46% 58% at ${fx.x * 100}% ${fx.y * 100}%, #fff 0, ${fx.color} 34%, transparent 78%)`;
          X.osc = crear("div", "mc-fx mc-fx-oscurecer", fondo);
          break;
        case "columnas":
          X.cols = [];
          for (let i = 0; i < (fx.n || 3); i++) {
            const c = crear("div", "mc-fx mc-fx-columna", frente);
            c.style.width = v.w * 0.085 + "px";
            X.cols.push(c);
          }
          break;
        case "laseres":
          X.haces = (fx.origenes || []).map((o, i) => {
            const h = crear("div", "mc-fx mc-fx-laser", fondo);
            const ancho = v.w * 0.34;
            h.style.width = ancho + "px";
            h.style.height = v.h * 1.3 + "px";
            h.style.left = o[0] * v.w - ancho / 2 + "px";
            h.style.top = o[1] * v.h + "px";
            const c = (fx.colores || [])[i] || "rgba(255,45,149,.5)";
            h.style.background = `linear-gradient(180deg, ${c}, transparent 85%)`;
            h._fase = i * 2.1;
            return h;
          });
          break;
        case "vapor":
          X.el = crear("div", "mc-fx mc-fx-vapor", frente);
          break;
        case "color_pulso":
          // Una capa fija por color: en cada pulso solo cambia la opacidad (nada que volver a pintar).
          X.capas = (fx.colores || ["rgba(255,45,149,.6)"]).map((color) => {
            const el = crear("div", "mc-fx mc-fx-color-pulso", fondo);
            el.style.setProperty("--x", (fx.x ?? 0.5) * 100 + "%");
            el.style.setProperty("--y", (fx.y ?? 0.8) * 100 + "%");
            el.style.setProperty("--c", color);
            return el;
          });
          break;
        case "circulos": {
          // Columna de discos (uno por círculo). El último es mayor: es el que late.
          const cols = fx.colores || [];
          const n = cols.length;
          const y0 = fx.y0 * v.h;
          const y1 = fx.y1 * v.h;
          const paso = (y1 - y0) / (n - 1);
          const d = Math.min(paso * 0.9, v.h * 0.07);
          const caja = crear("div", "mc-fx mc-fx-circulos", frente);
          caja.style.left = fx.x * v.w + "px";
          caja.style.top = "0px";
          const rail = crear("div", "rail", caja);
          rail.style.cssText = `top:${y0 - d * 0.9}px;height:${y1 - y0 + d * 2.3}px;width:${d * 1.9}px;margin-left:${-d * 0.95}px;border-radius:${d}px`;
          const hilo = crear("div", "hilo", caja);
          hilo.style.cssText = `top:${y0}px;height:${y1 - y0}px`;
          X.discos = cols.map((color, i) => {
            const ult = i === n - 1;
            const dd = ult ? d * 1.75 : d;
            const o = crear("div", "disco" + (ult ? " nucleo" : ""), caja);
            o.style.cssText = `width:${dd}px;height:${dd}px;margin:${-dd / 2}px 0 0 ${-dd / 2}px;top:${y0 + paso * i + (ult ? d * 0.3 : 0)}px;--c:${color}`;
            return o;
          });
          X.hilo = hilo;
          break;
        }
        case "estrobo":
          X.el = crear("div", "mc-fx mc-fx-estrobo", frente);
          break;
        case "impacto": {
          const s = crearSvg("svg", { class: "mc-fx mc-fx-impacto", width: 1, height: 1 }, fondo);
          s.style.left = fx.centro[0] * v.w + "px";
          s.style.top = fx.centro[1] * v.h + "px";
          // Un trazado por línea (cada una es un triángulo convexo) en lugar de uno solo con las 54.
          for (const d of F.lineasImpacto(v.h * 0.2, v.w * 0.9, { semilla: hashStr(plano.id), n: 54 }).split(/(?=M)/)) crearSvg("path", { d }, s);
          X.el = s;
          break;
        }
        case "foco":
          X.el = crear("div", "mc-fx mc-fx-foco", frente);
          X.el.style.setProperty("--x", fx.x * 100 + "%");
          X.el.style.setProperty("--y", fx.y * 100 + "%");
          break;
        default:
          break; // latido, temblor y silencio no necesitan elementos propios
      }
      V.fx.push(X);
    }
  }

  construirGuias() {
    const g = crear("div", "mc-guias", this.lienzo);
    const m = this.guion.lectura.margen_seguro ?? 0.035;
    const s = crear("div", "mc-guia-segura", g);
    s.style.cssText = `left:${W * m}px;top:${H * m}px;width:${W * (1 - 2 * m)}px;height:${H * (1 - 2 * m)}px`;
    for (const k of [1 / 3, 2 / 3]) {
      crear("div", "mc-guia-tercio", g).style.cssText = `left:${W * k}px;top:0;width:1px;height:${H}px`;
      crear("div", "mc-guia-tercio", g).style.cssText = `left:0;top:${H * k}px;width:${W}px;height:1px`;
    }
  }

  aplicarOpciones(nuevas) {
    if (nuevas) Object.assign(this.opciones, nuevas);
    const o = this.opciones;
    const L = this.lienzo.classList;
    L.toggle("con-sellos", !!o.sellos);
    L.toggle("con-orden", !!o.orden);
    L.toggle("con-guias", !!o.guias);
    L.toggle("sin-borradores", !!o.sinBorradores);
    L.toggle("solo-arte", !!o.soloArte);
    L.toggle("solo-texto", !!o.soloTexto);
  }

  /* ---------------- Cámara ---------------- */
  camBase(p) {
    const v = p.v;
    const c = p.camara || {};
    const m = c.margen ?? 0.05;
    const an = c.ancla || [0.5, 0.5];
    const fitW = Math.max(v.w, (v.h * 16) / 9) / (1 - 2 * m);
    return { fitW, cx: v.x + v.w * an[0], cy: v.y + v.h * an[1] };
  }
  camEn(p, u) {
    const b = this.camBase(p);
    const c = p.camara || {};
    const de = c.de || {};
    const a = c.a || {};
    const k = ease.inOutSine(clamp(u));
    const z = lerp(de.zoom ?? 1, a.zoom ?? 1, k);
    return {
      cx: b.cx + lerp(de.dx ?? 0, a.dx ?? 0, k) * b.fitW,
      cy: b.cy + ((lerp(de.dy ?? 0, a.dy ?? 0, k) * b.fitW * 9) / 16),
      w: b.fitW / z,
      giro: lerp(de.giro ?? 0, a.giro ?? 0, k),
    };
  }
  /* Tamaño de los textos: se diseñan en píxeles de pantalla (1080p) y se convierten a unidades de lámina. */
  escalaTexto(p) {
    return this.camEn(p, 0.5).w / W;
  }
  aplicarCamara(P, cam) {
    const k = W / cam.w;
    P.cam = cam;
    P.hoja.style.transform = `translate(${W / 2}px,${H / 2}px) rotate(${(-cam.giro).toFixed(3)}deg) scale(${k.toFixed(5)}) translate(${(-cam.cx).toFixed(2)}px,${(-cam.cy).toFixed(2)}px)`;
  }
  /* Punto de lámina → punto de pantalla (para comprobaciones y edición). */
  aPantalla(P, x, y) {
    const cam = P.cam;
    if (!cam) return [0, 0];
    const k = W / cam.w;
    const a = (-cam.giro * Math.PI) / 180;
    const dx = (x - cam.cx) * k;
    const dy = (y - cam.cy) * k;
    return [W / 2 + dx * Math.cos(a) - dy * Math.sin(a), H / 2 + dx * Math.sin(a) + dy * Math.cos(a)];
  }
  aLamina(P, sx, sy) {
    const cam = P.cam;
    const k = W / cam.w;
    const a = (cam.giro * Math.PI) / 180;
    const dx = sx - W / 2;
    const dy = sy - H / 2;
    return [cam.cx + (dx * Math.cos(a) - dy * Math.sin(a)) / k, cam.cy + (dx * Math.sin(a) + dy * Math.cos(a)) / k];
  }

  /* ---------------- Fotograma ---------------- */
  render(t) {
    t = clamp(t, 0, this.duracion);
    this.t = t;
    const pulso = Math.min(t / this.spb, this.pulsosTotales - 1e-6);
    const cur = this.planoEn(pulso);
    const si = cur.i;
    const tb = pulso - cur.b0;
    const u = clamp(tb / cur.pulsos);
    const prev = this.planos[si - 1];
    const next = this.planos[si + 1];
    this.temblor = [0, 0];

    // Qué láminas se ven en este fotograma
    const capas = {};
    capas[cur.pagina] = { z: 2, clip: null };
    const tr = cur.transicion || {};
    let sombraPaso = null;
    if (prev && prev.pagina !== cur.pagina && tr.tipo === "pagina" && tb < (tr.despues || 0)) {
      const q = ((tr.antes || 0) + tb) / ((tr.antes || 0) + (tr.despues || 0));
      capas[prev.pagina] = { z: 1, clip: null, camFija: this.camEn(prev, 1) };
      capas[cur.pagina].clip = q;
    }
    if (next && next.pagina !== cur.pagina) {
      const tn = next.transicion || {};
      const antes = tn.antes || 0;
      if (tn.tipo === "pagina" && antes > 0 && pulso >= next.b0 - antes) {
        const q = (pulso - (next.b0 - antes)) / (antes + (tn.despues || 0));
        capas[next.pagina] = { z: 3, clip: q, camFija: this.camEn(next, 0) };
      }
    }

    // Estado de cada plano (viñeta, arte, personajes y efectos)
    for (const p of this.planos) {
      const visible = !!capas[p.pagina];
      this.actualizarPlano(p, pulso, si, visible);
    }

    // Cámara del plano activo (con transición desde el anterior si están en la misma lámina)
    let cam = this.camEn(cur, u);
    if (prev && prev.pagina === cur.pagina && (tr.tipo === "deslizar" || tr.tipo === "latigazo")) {
      const d = tr.despues || 0.8;
      if (tb < d) {
        const k = tr.tipo === "latigazo" ? ease.outQuint(tb / d) : ease.inOut(tb / d);
        const a = this.camEn(prev, 1);
        cam = { cx: lerp(a.cx, cam.cx, k), cy: lerp(a.cy, cam.cy, k), w: lerp(a.w, cam.w, k), giro: lerp(a.giro, cam.giro, k) };
      }
    }
    cam.cx += (this.temblor[0] * cam.w) / W;
    cam.cy += (this.temblor[1] * cam.w) / W;

    for (const id in this.paginas) {
      const P = this.paginas[id];
      const c = capas[id];
      const vis = !!c;
      if (P.visible !== vis) {
        P.capa.classList.toggle("visible", vis);
        P.visible = vis;
      }
      if (!vis) continue;
      P.capa.style.zIndex = c.z;
      this.aplicarCamara(P, c.camFija || cam);
      if (c.clip != null && c.clip < 1) {
        const q = ease.inOut(clamp(c.clip));
        const x = lerp(W + 300, -300, q);
        P.capa.style.clipPath = `polygon(${x + 130}px 0px, ${W}px 0px, ${W}px ${H}px, ${x - 130}px ${H}px)`;
        sombraPaso = { x, a: Math.sin(Math.PI * clamp(c.clip)) };
      } else if (P.capa.style.clipPath) {
        P.capa.style.clipPath = "";
      }
    }
    if (sombraPaso) {
      this.pasoSombra.style.opacity = sombraPaso.a.toFixed(3);
      this.pasoSombra.style.transform = `translateX(${sombraPaso.x - 220}px) skewX(-13.5deg)`;
      this.pasoSombra.style.zIndex = 2;
    } else if (this.pasoSombra.style.opacity !== "0") {
      this.pasoSombra.style.opacity = "0";
    }

    // Destellos de corte
    let fl = 0;
    if (tr.tipo === "flash" && tb < (tr.despues || 0)) fl = Math.max(fl, 1 - ease.out(tb / tr.despues));
    if (tr.tipo === "impacto" && tb < (tr.despues || 0)) fl = Math.max(fl, Math.pow(1 - tb / tr.despues, 2) * 0.95);
    if (tr.tipo === "pagina" && tb < 0.5) fl = Math.max(fl, Math.pow(1 - tb / 0.5, 2) * 0.85);
    if (next) {
      const tn = next.transicion || {};
      if (tn.tipo === "flash" && tn.antes > 0 && pulso >= next.b0 - tn.antes) fl = Math.max(fl, Math.pow((pulso - (next.b0 - tn.antes)) / tn.antes, 2));
    }
    this.flash.style.opacity = fl.toFixed(3);

    this.textos.render(pulso, si);
  }

  actualizarPlano(p, pulso, si, visible) {
    const V = p.V;
    if (!V) return;
    const estado = p.i < si ? "pasado" : p.i > si ? "futuro" : "activo";
    const tb = estado === "pasado" ? p.pulsos : estado === "futuro" ? 0 : pulso - p.b0;
    const u = clamp(tb / p.pulsos);
    p.estado = estado;
    p.tb = tb;
    p.u = u;
    const clave = estado === "activo" ? "a" + pulso.toFixed(4) : estado;
    if (!visible && V.cache.clave === clave) return;
    if (estado !== "activo" && V.cache.clave === clave) return;
    V.cache.clave = clave;
    const v = V.def;

    // Recorte del arte original (sin tocar el archivo): encuadre + pequeño movimiento de cámara
    const rec = this.comp.recursos[p.arte.recurso];
    const k = ease.inOutSine(u);
    const de = p.arte.de;
    const a = p.arte.a || de;
    const ancho = lerp(de.ancho, a.ancho, k);
    const cx = lerp(de.cx, a.cx, k);
    const cy = lerp(de.cy, a.cy, k);
    const s = v.w / (ancho * rec.w);
    const left = v.w / 2 - cx * rec.w * s;
    const top = v.h / 2 - cy * rec.h * s;
    p.arteTf = { left, top, s, rw: rec.w, rh: rec.h };
    const tf = `translate(${left.toFixed(2)}px,${top.toFixed(2)}px) scale(${s.toFixed(5)})`;
    V.lapiz.style.transform = tf;
    V.arte.style.transform = tf;

    // Revelado: lápiz → tinta en blanco y negro → color (con el registro de imprenta asentándose)
    const rv = p.revelado || {};
    const rev = estado === "pasado" ? 1 : estado === "futuro" ? 0 : clamp((tb - (rv.desde || 0)) / (rv.pulsos || 1));
    p.rev = rev;
    const barrido = invLerp(0, 0.62, rev);
    if (rev >= 1) {
      V.arte.style.webkitMaskImage = V.arte.style.maskImage = "";
      V.arte.style.opacity = 1;
    } else if (rev <= 0) {
      V.arte.style.opacity = 0;
    } else {
      // El degradado se da en coordenadas de la imagen original: se compensa la escala.
      const w0 = barrido * 135 - 14;
      const m = `linear-gradient(104deg, #000 ${w0.toFixed(2)}%, transparent ${(w0 + 12).toFixed(2)}%)`;
      V.arte.style.webkitMaskImage = V.arte.style.maskImage = m;
      V.arte.style.opacity = 1;
    }
    V.lapiz.style.opacity = rev >= 1 ? 0 : 0.2;
    const fant = rev > 0.04 && rev < 1 ? 0.55 * (1 - smooth(0.45, 1, rev)) : 0;
    if (fant > 0) {
      const off = (1 - rev) * 18;
      V.fantasma.style.transform = `translate(${(left + off).toFixed(2)}px,${(top - off * 0.5).toFixed(2)}px) scale(${s.toFixed(5)})`;
      V.fantasma.style.webkitMaskImage = V.fantasma.style.maskImage = V.arte.style.maskImage;
    }
    V.fantasma.style.opacity = fant.toFixed(3);
    const color = smooth(0.35, 0.95, rev);
    V.trama.style.opacity = lerp(0.75, 0.2, color).toFixed(3);
    V.tramaLuz.style.opacity = (0.1 * color).toFixed(3);
    V.actoresCapa.style.opacity = smooth(0.2, 0.6, rev).toFixed(3);
    V.fxFondo.style.opacity = V.fxFrente.style.opacity = smooth(0.3, 0.8, rev).toFixed(3);
    V.velo.style.opacity = estado === "pasado" ? 1 : 0;

    // Efectos
    const acc = { brillo: 1, sat: 1 };
    const ctx = { tb, u, pulso, estado, rev, v, p, acc };
    for (const X of V.fx) this.actualizarFx(X, ctx);
    const gris = 1 - color;
    const filtro = `grayscale(${gris.toFixed(3)}) contrast(${lerp(2.1, 1.06, color).toFixed(3)}) brightness(${(lerp(1.15, 1, color) * acc.brillo).toFixed(3)}) saturate(${(acc.sat * 1.08).toFixed(3)})`;
    if (V.cache.filtro !== filtro) {
      V.arte.style.filter = filtro;
      V.cache.filtro = filtro;
    }

    const fa = acc.sat < 0.995 ? `saturate(${acc.sat.toFixed(3)})` : "";
    if (V.cache.fa !== fa) {
      V.actoresCapa.style.filter = fa;
      V.cache.fa = fa;
    }

    // Personajes
    for (const id in V.actores) this.actualizarActor(V.actores[id], ctx);
  }

  actualizarFx(X, c) {
    const fx = X.def;
    const { tb, u, v } = c;
    const activo = c.estado === "activo";
    switch (fx.tipo) {
      case "niebla":
        X.el.style.transform = `translateX(${(-12 + u * 20).toFixed(2)}%)`;
        break;
      case "latido":
        if (activo) c.acc.brillo += (fx.intensidad || 0.1) * golpe(tb, fx.golpes || [], 4.5);
        break;
      case "silencio": {
        const h = fx.hasta ?? c.p.pulsos;
        const q = tb < h ? smooth(0, 0.8, tb) : 1 - smooth(h, h + 0.25, tb);
        c.acc.sat *= lerp(1, 0.22, q);
        c.acc.brillo *= lerp(1, 0.9, q);
        break;
      }
      case "fuga_luz": {
        const q = smooth(fx.desde || 0, c.p.pulsos, tb);
        const ancho = v.w * lerp(0.004, 0.2, ease.in(q));
        X.el.style.left = fx.x * v.w - ancho / 2 + "px";
        X.el.style.width = ancho + "px";
        X.el.style.opacity = smooth(fx.desde || 0, (fx.desde || 0) + 0.4, tb).toFixed(3);
        X.halo.style.opacity = (q * 0.95).toFixed(3);
        break;
      }
      case "contraluz":
        X.el.style.opacity = (0.82 + 0.18 * golpe(tb % 1, [0], 4)).toFixed(3);
        break;
      case "columnas": {
        const n = X.cols.length;
        X.cols.forEach((col, i) => {
          let x = (i + 0.6) / n + 0.55 - u * (fx.recorrido || 1.6);
          x = ((x % 1.3) + 1.3) % 1.3 - 0.15;
          col.style.transform = `translateX(${(x * v.w).toFixed(2)}px)`;
        });
        break;
      }
      case "laseres":
        X.haces.forEach((h, i) => {
          const ang = Math.sin(tb * 0.55 * (fx.velocidad || 1) + h._fase) * (fx.abanico || 24) + (i % 2 ? -14 : 12);
          h.style.transform = `rotate(${ang.toFixed(2)}deg)`;
          h.style.opacity = (0.7 + 0.3 * golpe(tb % 1, [0], 3.5)).toFixed(3);
        });
        break;
      case "vapor": {
        const q = smooth(fx.desde || 0, Math.min(c.p.pulsos, (fx.desde || 0) + (fx.pulsos || 2.5)), tb);
        X.el.style.opacity = (q * 0.95).toFixed(3);
        X.el.style.transform = `translateY(${((1 - q) * 32).toFixed(2)}%) scaleX(${(0.85 + q * 0.3).toFixed(3)})`;
        break;
      }
      case "estrobo":
        X.el.style.opacity = activo ? ((fx.intensidad || 0.3) * golpe(tb, fx.golpes || [], 7)).toFixed(3) : "0";
        break;
      case "color_pulso": {
        const n = X.capas.length;
        const k = ((Math.floor(tb) % n) + n) % n;
        const op = (c.estado === "futuro" ? 0 : 0.35 + 0.65 * golpe(tb % 1, [0], 3)).toFixed(3);
        for (let i = 0; i < n; i++) {
          const o = i === k ? op : "0";
          const el = X.capas[i];
          if (el._op !== o) {
            el.style.opacity = o;
            el._op = o;
          }
        }
        break;
      }
      case "circulos": {
        const t0 = fx.desde || 0;
        const paso = fx.paso || 0.5;
        const n = X.discos.length;
        X.discos.forEach((o, i) => {
          const q = c.estado === "pasado" ? 1 : c.estado === "futuro" ? 0 : clamp((tb - (t0 + i * paso)) / 0.45);
          let esc = q <= 0 ? 0 : lerp(0.2, 1, ease.outQuint(q)) + (1 - q) * 0.35 * Math.sin(q * Math.PI);
          if (i === n - 1 && q >= 1 && activo) esc *= 1 + 0.22 * golpe(tb % 1, [0], 4);
          const tr = `scale(${esc.toFixed(3)})`;
          if (o._tr !== tr) {
            o.style.transform = tr;
            o._tr = tr;
          }
        });
        const qh = c.estado === "pasado" ? 1 : c.estado === "futuro" ? 0 : clamp((tb - t0) / (paso * (n - 1) + 0.3));
        X.hilo.style.transform = `scaleY(${qh.toFixed(3)})`;
        X.hilo.parentNode.style.opacity = c.estado === "futuro" ? "0" : clamp((tb - t0 + 0.4) / 0.4).toFixed(3);
        break;
      }
      case "impacto": {
        const t0 = fx.desde || 0;
        const d = fx.pulsos || 2;
        const q = clamp((tb - t0) / d);
        const vivo = activo && tb >= t0 && q < 1;
        X.el.style.opacity = vivo ? (0.85 * (1 - ease.in(q))).toFixed(3) : "0";
        if (vivo) X.el.style.transform = `scale(${(0.55 + ease.out(q) * 0.75).toFixed(3)}) rotate(${(q * 5).toFixed(2)}deg)`;
        break;
      }
      case "temblor":
        if (activo) {
          let amp = 0;
          (fx.golpes || []).forEach((g, i) => {
            if (tb >= g) amp = Math.max(amp, (i === 0 && fx.primero ? fx.primero : fx.amplitud || 4) * Math.exp(-(tb - g) * 6));
          });
          if (amp > 0.15) {
            const j = jitter(c.p.id, this.t, 30);
            this.temblor[0] += j[0] * amp;
            this.temblor[1] += j[1] * amp;
          }
        }
        break;
      default:
        break;
    }
  }

  actualizarActor(A, c) {
    const a = A.def;
    const { tb, u, v, p } = c;
    const k = ease.inOutSine(u);
    if (a.tipo === "sprite") {
      let pose = a.poses[0];
      for (const q of a.poses) if (tb >= (q.desde || 0)) pose = q;
      const n = pose.cuadros.length;
      const idx = n > 1 ? Math.floor((tb - (pose.desde || 0)) * (pose.por_pulso || 2)) % n : 0;
      const idAct = pose.cuadros[c.estado === "futuro" ? 0 : idx];
      for (const id in A.imgs) {
        const on = id === idAct;
        const im = A.imgs[id];
        if (im._on !== on) {
          im.classList.toggle("activo", on);
          im._on = on;
        }
      }
      const imAct = A.imgs[idAct];
      const masc = pose.mascara || "";
      if (imAct._masc !== masc) {
        imAct.style.clipPath = masc;
        imAct._masc = masc;
      }
      const rec = this.comp.recursos[idAct];
      const alto = (typeof a.alto === "number" ? a.alto : lerp(a.alto.de, a.alto.a, k)) * v.h;
      const ancho = (alto * rec.w) / rec.h;
      // La caja se maqueta una sola vez, al mayor tamaño del plano; crecer o encoger es una escala de la
      // capa (≤ 1), no un cambio de tamaño que obligue a volver a pintar el dibujo y sus filtros.
      const altoCaja = (typeof a.alto === "number" ? a.alto : Math.max(a.alto.de, a.alto.a)) * v.h;
      const anchoCaja = (altoCaja * rec.w) / rec.h;
      const escCaja = alto / altoCaja;
      const x = lerp(a.pos.de[0], a.pos.a[0], k) * v.w;
      // Pequeño vaivén vertical al caminar (solo si la pose tiene ciclo)
      const anda = a.paso && c.estado === "activo";
      const bote = anda ? Math.abs(Math.sin(tb * Math.PI * a.paso)) * alto * 0.014 : 0;
      const balanceo = anda ? Math.sin(tb * Math.PI * a.paso) * 1.3 : 0;
      const y = lerp(a.pos.de[1], a.pos.a[1], k) * v.h - bote;
      if (A._w !== anchoCaja || A._h !== altoCaja) {
        A.raiz.style.width = anchoCaja + "px";
        A.raiz.style.height = altoCaja + "px";
        A._w = anchoCaja;
        A._h = altoCaja;
      }
      A.raiz.style.transform = `translate(${(x - anchoCaja / 2).toFixed(2)}px,${(y - altoCaja).toFixed(2)}px) rotate(${balanceo.toFixed(2)}deg)${escCaja === 1 ? "" : ` scale(${escCaja.toFixed(5)})`}`;
      const boca = a.boca || [0.5, 0.13];
      A.punto = [v.x + x + (boca[0] - 0.5) * ancho, v.y + y - alto + boca[1] * alto];
    } else if (a.tipo === "inserto") {
      const t0 = a.entra || 0;
      const q = c.estado === "pasado" ? 1 : c.estado === "futuro" ? 0 : clamp((tb - t0) / 0.7);
      const esc = q <= 0 ? 0 : ease.backOut(q);
      A.raiz.style.opacity = q <= 0 ? 0 : 1;
      A.raiz.style.transform = `translate(${(A.cx - A.lado / 2).toFixed(2)}px,${(A.cy - A.altoPx / 2).toFixed(2)}px) rotate(${a.giro || 0}deg) scale(${esc.toFixed(4)})`;
      const boca = a.boca || [0.5, 0.6];
      A.punto = [A.cx + (boca[0] - 0.5) * A.lado, A.cy + (boca[1] - 0.5) * A.altoPx];
      A.radio = A.lado / 2;
    } else if (a.tipo === "imagen") {
      const t0 = a.entra || 0;
      const d = 0.55;
      const q = c.estado === "pasado" ? 1 : clamp((tb - t0) / d);
      let esc = 1;
      let rot = 0;
      let op = 1;
      if (a.animacion === "sello") {
        esc = q < 1 ? lerp(3.4, 1, ease.outQuint(q)) : 1 + 0.035 * golpe(tb % 1, [0], 5);
        rot = (1 - ease.out(q)) * -9;
        op = c.estado === "futuro" ? 0 : Math.min(1, q * 6);
      }
      const x = a.centro[0] * v.w - A.ancho / 2;
      const y = a.centro[1] * v.h - A.alto / 2;
      A.raiz.style.opacity = op;
      A.raiz.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${esc.toFixed(4)})`;
      A.punto = [v.x + a.centro[0] * v.w, v.y + a.centro[1] * v.h];
    }
  }

  /* Punto de lámina al que apunta una cola. */
  objetivo(p, hacia) {
    if (!hacia) return null;
    const v = p.v;
    if (hacia.actor) {
      const A = p.V.actores[hacia.actor];
      return A && A.punto ? { pt: A.punto, radio: A.radio || 0, centro: A.radio ? [A.cx, A.cy] : null } : null;
    }
    if (hacia.arte && p.arteTf) {
      const a = p.arteTf;
      return { pt: [v.x + a.left + hacia.x * a.rw * a.s, v.y + a.top + hacia.y * a.rh * a.s], radio: 0 };
    }
    return { pt: [v.x + hacia.x * v.w, v.y + hacia.y * v.h], radio: 0 };
  }
}
