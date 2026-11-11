/* DEADBEAT DISCO · Motion comic · capa de textos.

   Dibuja cada intervención de guion.json con vectores y tipografía, encima de las ilustraciones:
   bocadillos (diálogo, pensamiento, grito, susurro), cajas de narrador, rótulos, cartelas,
   onomatopeyas y el rótulo integrado en la fachada. Nada de esto se pinta en los fondos. */

import { clamp, lerp, ease, rng, hashStr, jitter, golpe } from "./util.js";
import * as F from "./formas.js";
import { crear, crearSvg, marcado } from "./dom.js";
import { GLOBOS, tiemposBloques, primeraEntrada } from "./guion.js";

const W = 1920;
const H = 1080;
const px = (n) => n.toFixed(2) + "px";

export class CapaTextos {
  constructor(motor) {
    this.m = motor;
    this.items = [];
    this.porId = {};
  }

  construir() {
    const m = this.m;
    for (const it of this.items) it.raiz.remove();
    this.items = [];
    this.porId = {};
    if (this.medidor) this.medidor.remove();
    this.medidor = crear("div", "mc-medidor", m.lienzo);

    // Orden de lectura dentro de cada plano
    const porPlano = {};
    for (const iv of m.guion.intervenciones) {
      if (iv.activo === false) continue;
      (porPlano[iv.plano] = porPlano[iv.plano] || []).push(iv);
    }
    const orden = {};
    for (const n in porPlano) {
      porPlano[n]
        .map((iv, i) => ({ iv, i, e: primeraEntrada(iv) }))
        .sort((a, b) => a.e - b.e || a.i - b.i)
        .forEach((o, i) => (orden[o.iv.id] = i + 1));
    }

    for (const iv of m.guion.intervenciones) {
      if (iv.activo === false) continue;
      const p = m.planos[iv.plano - 1];
      if (!p || !iv.bloques || !iv.bloques.join("").trim()) continue;
      const it = {
        iv,
        p,
        k: m.escalaTexto(p),
        entra: iv.entra ?? 0,
        sale: iv.sale ?? p.pulsos,
        orden: orden[iv.id],
        borrador: iv.estado === "borrador",
        medibles: [],
        textosEl: [],
      };
      it.tB = tiemposBloques(iv, p.pulsos, m.guion);
      try {
        if (GLOBOS.includes(iv.tipo)) this.crearGlobo(it);
        else if (iv.tipo === "narrador") this.crearNarrador(it);
        else if (iv.tipo === "rotulo") this.crearRotulo(it);
        else if (iv.tipo === "onomatopeya") this.crearSfx(it);
        else if (iv.tipo === "neon") this.crearNeon(it);
        else if (iv.tipo === "cartela") this.crearCartela(it);
        else continue;
      } catch (e) {
        console.error("No se pudo dibujar la intervención " + iv.id, e);
        continue;
      }
      it.raiz.dataset.id = iv.id;
      if (it.borrador) it.raiz.classList.add("es-borrador");
      this.items.push(it);
      this.porId[iv.id] = it;
    }
    this.medidor.innerHTML = "";
  }

  /* ---------- piezas comunes ---------- */
  sello(it, padre, x, y) {
    if (!it.borrador) return null;
    const s = crear("div", "mc-sello", padre);
    s.textContent = "BORRADOR";
    if (x != null) {
      s.style.left = px(x);
      s.style.top = px(y);
    }
    return s;
  }
  numero(it, padre, x, y) {
    const o = crear("div", "mc-orden", padre);
    o.textContent = it.orden;
    if (x != null) {
      o.style.left = px(x);
      o.style.top = px(y);
    }
    return o;
  }
  etiqueta(it, padre, x, y) {
    const pj = this.m.guion.personajes[it.iv.habla];
    if (!it.iv.etiqueta || !pj || !pj.nombre) return null;
    const e = crear("div", "mc-etiqueta", padre);
    e.textContent = pj.nombre;
    e.style.left = px(x);
    e.style.top = px(y);
    return e;
  }
  fuenteCss(est, interlinea = 1.1) {
    const peso = est.peso ?? (est.fuente === "Comic Neue" ? 700 : 400);
    return `${est.cursiva ? "italic " : ""}${peso} ${est.tam}px/${interlinea} "${est.fuente}", sans-serif`;
  }
  posPagina(it) {
    const v = it.p.v;
    const pos = it.iv.pos || { x: 0.5, y: 0.5 };
    return [v.x + pos.x * v.w, v.y + pos.y * v.h];
  }

  /* ---------- Bocadillos ---------- */
  crearGlobo(it) {
    const { iv, p } = it;
    const m = this.m;
    const est = { ...m.guion.estilos[iv.tipo], ...(iv.estilo || {}) };
    it.est = est;
    const raiz = crear("div", `mc-el mc-${iv.tipo}`, this.medidor);
    const inn = crear("div", "mc-el-in", raiz);
    const svg = crearSvg("svg", { class: "mc-forma" }, inn);
    const txt = crear("div", "mc-txt", inn);
    txt.style.cssText =
      `font:${this.fuenteCss(est, iv.tipo === "grito" ? 1.02 : 1.1)};color:${est.color};width:max-content;max-width:${iv.ancho || est.ancho}px;text-wrap:balance;` +
      (est.mayusculas ? "text-transform:uppercase;" : "");
    const n = iv.bloques.length;
    it.bloquesEl = iv.bloques.map((b, i) => {
      const s = crear("span", "mc-bloque", txt);
      s.innerHTML = marcado(b) + (i < n - 1 ? " " : "");
      return s;
    });
    const w = txt.offsetWidth;
    const h = txt.offsetHeight;
    let rx, ry;
    if (iv.tipo === "grito") {
      rx = (w / 2) * 1.2 + 30;
      ry = (h / 2) * 1.28 + 26;
    } else if (iv.tipo === "pensamiento") {
      rx = (w / 2) * 1.14 + 26;
      ry = (h / 2) * 1.2 + 24;
    } else {
      rx = (w / 2) * 1.16 + 26;
      ry = (h / 2) * 1.22 + 22;
    }
    it.rx = rx;
    it.ry = ry;
    txt.style.left = px(-w / 2);
    txt.style.top = px(-h / 2 + est.tam * 0.03);

    const gSombra = crearSvg("g", { class: "sombra", transform: "translate(8 9)" }, svg);
    const gBorde = crearSvg("g", { fill: "none", stroke: est.borde, "stroke-width": est.grosor * 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    if (est.discontinuo) gBorde.setAttribute("stroke-dasharray", est.discontinuo);
    const gRelleno = crearSvg("g", { fill: est.fondo, stroke: "none" }, svg);
    it.g = { gSombra, gBorde, gRelleno };
    it.semilla = hashStr(iv.id);

    const alto = iv.tipo === "grito" ? ry * 1.3 : ry;
    it.etiquetaEl = this.etiqueta(it, inn, -rx * 0.74, -alto - 15);
    it.selloEl = this.sello(it, inn, rx * 0.2, alto * 0.86);
    this.numero(it, inn, -rx * 0.96, -ry * 0.55);

    it.pos = this.posPagina(it);
    raiz.style.transform = `translate(${px(it.pos[0])},${px(it.pos[1])})`;
    p.P.textos.appendChild(raiz);
    it.raiz = raiz;
    it.inn = inn;
    it.txt = txt;
    it.tamBase = est.tam;
    it.textosEl = [txt];
    it.medibles = [gRelleno];
    it.colaClave = null;
    this.trazarGlobo(it, null);
  }

  trazarGlobo(it, obj) {
    const { iv, rx, ry, est } = it;
    const c = iv.cola || {};
    const optCola = { largo: c.largo ?? (obj && obj.borde ? 0.97 : 0.8), maximo: c.maximo ?? 300 };
    const o = obj ? obj.pt : null;
    const partes = [];
    let burbujas = [];
    let cola = null;
    if (iv.tipo === "grito") {
      if (c.rayo) {
        partes.push(F.estallidoGrito(rx, ry, null, { semilla: it.semilla }).d);
        cola = F.colaRayo(rx * 1.1, ry * 1.1, o, { cola: optCola, ancho: 24 });
        if (cola) partes.push(cola.d);
      } else {
        const g = F.estallidoGrito(rx, ry, o, { semilla: it.semilla, cola: optCola });
        partes.push(g.d);
        cola = g.cola;
      }
    } else if (iv.tipo === "pensamiento") {
      const n = F.nubePensamiento(rx, ry, o, { semilla: it.semilla, cola: optCola });
      partes.push(n.d);
      burbujas = n.burbujas;
      cola = n.cola;
    } else if (c.rayo) {
      partes.push(F.bocadilloDialogo(rx, ry, null, { semilla: it.semilla }).d);
      cola = F.colaRayo(rx, ry, o, { cola: optCola });
      if (cola) partes.push(cola.d);
    } else {
      const g = F.bocadilloDialogo(rx, ry, o, { semilla: it.semilla, cola: optCola, baseCola: iv.tipo === "susurro" ? 24 : 32 });
      partes.push(g.d);
      cola = g.cola;
    }
    it.colaOk = !!cola;
    const { gSombra, gBorde, gRelleno } = it.g;
    for (const g of [gSombra, gBorde, gRelleno]) {
      while (g.firstChild) g.removeChild(g.firstChild);
      for (const d of partes) crearSvg("path", { d }, g);
    }
    it.burbujasEl = burbujas.map((b) => {
      const e = crearSvg("g", {}, it.g.gRelleno.parentNode);
      crearSvg("circle", { cx: b.cx + 5, cy: b.cy + 6, r: b.r, class: "sombra" }, e);
      crearSvg("circle", { cx: b.cx, cy: b.cy, r: b.r, fill: est.fondo, stroke: est.borde, "stroke-width": est.grosor * 0.85, class: "burbuja" }, e);
      return e;
    });
    if (it.burbujasViejas) for (const e of it.burbujasViejas) e.remove();
    it.burbujasViejas = it.burbujasEl;
  }

  /* Punto al que apunta la cola, en coordenadas locales del bocadillo. */
  objetivoLocal(it) {
    const c = it.iv.cola;
    if (!c || !c.hacia) return null;
    const o = this.m.objetivo(it.p, c.hacia);
    if (!o) return null;
    let pt = o.pt;
    let borde = false;
    if (o.radio && o.centro) {
      // Retrato en inserto: la cola llega hasta el borde del marco, del lado del bocadillo.
      const dx = it.pos[0] - o.centro[0];
      const dy = it.pos[1] - o.centro[1];
      const d = Math.hypot(dx, dy) || 1;
      pt = [o.centro[0] + (dx / d) * o.radio * 1.04, o.centro[1] + (dy / d) * o.radio * 1.04];
      borde = true;
    }
    return { pt: [(pt[0] - it.pos[0]) / it.k, (pt[1] - it.pos[1]) / it.k], borde };
  }

  renderGlobo(it, tb, pasado) {
    const tipo = it.iv.tipo;
    const obj = this.objetivoLocal(it);
    const clave = obj ? Math.round(obj.pt[0] / 2) + "," + Math.round(obj.pt[1] / 2) : "-";
    if (clave !== it.colaClave) {
      it.colaClave = clave;
      this.trazarGlobo(it, obj);
    }
    const t = tb - it.entra;
    let esc = 1;
    let op = 1;
    let dx = 0;
    let dy = 0;
    let rot = 0;
    if (!pasado) {
      if (tipo === "dialogo") {
        const q = clamp(t / 0.5);
        esc = 0.12 + 0.88 * ease.backOut(q);
        op = clamp(t / 0.12);
        rot = (1 - ease.out(q)) * -5;
      } else if (tipo === "grito") {
        const q = clamp(t / 0.6);
        esc = 0.1 + 0.9 * ease.elasticOut(q);
        op = clamp(t / 0.08);
        const amp = 7 * Math.exp(-t * 2.2);
        if (amp > 0.3) {
          const j = jitter(it.iv.id, this.m.t, 30);
          dx = j[0] * amp;
          dy = j[1] * amp;
        }
      } else if (tipo === "susurro") {
        const q = clamp(t / 0.9);
        esc = lerp(0.9, 1, ease.out(q));
        op = ease.out(q);
      } else if (tipo === "pensamiento") {
        // Primero las burbujas, desde el personaje; luego se abre la nube.
        const nb = it.burbujasEl.length;
        it.burbujasEl.forEach((e, i) => {
          const tq = clamp((t - (nb - 1 - i) * 0.2) / 0.2);
          e.style.opacity = tq;
        });
        const q = clamp((t - 0.45) / 0.5);
        esc = ease.backOut(q);
        op = 1;
        it.txt.style.opacity = clamp((t - 0.6) / 0.15);
      }
      if (it.sale < it.p.pulsos) {
        const qo = clamp((tb - (it.sale - 0.35)) / 0.35);
        esc *= 1 - 0.25 * ease.in(qo);
        op *= 1 - qo;
      }
    } else if (tipo === "pensamiento") {
      it.burbujasEl.forEach((e) => (e.style.opacity = 1));
      it.txt.style.opacity = 1;
    }
    if (tipo === "pensamiento") {
      // La nube crece sola: las burbujas no se escalan con ella.
      const g = it.g;
      const tf = `scale(${esc.toFixed(4)})`;
      g.gSombra.setAttribute("transform", `translate(8 9) ${tf}`);
      g.gBorde.setAttribute("transform", tf);
      g.gRelleno.setAttribute("transform", tf);
      it.txt.style.transform = tf;
      if (it.etiquetaEl) it.etiquetaEl.style.opacity = esc > 0.9 ? 1 : 0;
      if (it.selloEl) it.selloEl.style.opacity = esc > 0.9 ? 1 : 0;
      it.inn.style.transform = `scale(${it.k.toFixed(4)})`;
      it.inn.style.opacity = op.toFixed(3);
    } else {
      it.inn.style.transform = `translate(${px(dx)},${px(dy)}) rotate(${rot.toFixed(2)}deg) scale(${(it.k * esc).toFixed(4)})`;
      it.inn.style.opacity = op.toFixed(3);
    }
    this.renderBloques(it, tb, pasado);
  }

  renderBloques(it, tb, pasado) {
    const els = it.bloquesEl;
    for (let i = 0; i < els.length; i++) {
      // Antes de su momento, el bloque está "a lápiz" (rotulación pendiente de entintar); luego se entinta.
      const o = pasado ? 1 : clamp((tb - it.tB[i]) / 0.16);
      if (els[i]._o !== o) {
        els[i].style.opacity = (0.2 + 0.8 * o).toFixed(3);
        els[i].style.color = o < 0.5 ? "#4f7fb5" : "";
        els[i]._o = o;
      }
    }
  }

  /* ---------- Cajas de narrador ---------- */
  crearNarrador(it) {
    const { iv, p } = it;
    const m = this.m;
    const voz = iv.variante === "voz";
    const est = { ...m.guion.estilos[voz ? "narrador_voz" : "narrador"], ...(iv.estilo || {}) };
    it.est = est;
    const raiz = crear("div", "mc-el mc-narrador" + (iv.capitular ? " capitular" : "") + (voz ? " voz" : ""), this.medidor);
    const inn = crear("div", "mc-el-in", raiz);
    const cajas = iv.bloques.map((b) => {
      const caja = crear("div", "mc-caja", inn);
      const svg = crearSvg("svg", { class: "mc-forma" }, caja);
      const txt = crear("div", "mc-txt", caja);
      txt.style.cssText =
        `font:${this.fuenteCss(est, 1.16)};color:${est.color};width:max-content;max-width:${iv.ancho || est.ancho}px;` + (est.mayusculas ? "text-transform:uppercase;" : "");
      txt.innerHTML = marcado(b);
      return { caja, svg, txt };
    });
    const padX = 22;
    const padY = 15;
    let y = 0;
    let anchoTotal = 0;
    cajas.forEach((c, i) => {
      c.w = c.txt.offsetWidth + padX * 2;
      c.h = c.txt.offsetHeight + padY * 2;
      c.x = i * 38;
      c.y = y;
      y += c.h - 5;
      anchoTotal = Math.max(anchoTotal, c.x + c.w);
    });
    const altoTotal = y + 5;
    cajas.forEach((c, i) => {
      c.caja.style.left = px(c.x - anchoTotal / 2);
      c.caja.style.top = px(c.y - altoTotal / 2);
      c.caja.style.width = px(c.w);
      c.caja.style.height = px(c.h);
      c.caja.style.zIndex = i + 1;
      c.txt.style.left = px(padX);
      c.txt.style.top = px(padY + est.tam * 0.06);
      const d = F.rectTosco(0, 0, c.w, c.h, { semilla: hashStr(iv.id + i), temblor: 2.4, paso: 70 });
      crearSvg("path", { d, class: "sombra", transform: "translate(8 9)" }, c.svg);
      crearSvg("path", { d, fill: est.fondo, stroke: est.borde, "stroke-width": est.grosor, "stroke-linejoin": "miter" }, c.svg);
    });
    it.cajas = cajas;
    it.etiquetaEl = this.etiqueta(it, inn, -anchoTotal / 2 + 10, -altoTotal / 2 - 27);
    if (it.etiquetaEl) it.etiquetaEl.style.zIndex = 9;
    it.selloEl = this.sello(it, inn, anchoTotal / 2 - 110, altoTotal / 2 - 8);
    this.numero(it, inn, -anchoTotal / 2 - 6, -altoTotal / 2 + 12);
    it.pos = this.posPagina(it);
    raiz.style.transform = `translate(${px(it.pos[0])},${px(it.pos[1])})`;
    inn.style.transform = `rotate(${iv.giro ?? -1.2}deg) scale(${it.k.toFixed(4)})`;
    p.P.textos.appendChild(raiz);
    it.raiz = raiz;
    it.inn = inn;
    it.tamBase = est.tam;
    it.textosEl = cajas.map((c) => c.txt);
    it.medibles = cajas.map((c) => c.caja);
  }

  renderNarrador(it, tb, pasado) {
    it.cajas.forEach((c, i) => {
      const q = pasado ? 1 : clamp((tb - it.tB[i]) / 0.45);
      const k = ease.out(q);
      if (c._q === q) return;
      c._q = q;
      c.caja.style.clipPath = q >= 1 ? "" : `inset(-30px ${((1 - k) * 100).toFixed(2)}% -30px -30px)`;
      c.caja.style.transform = `translateX(${px((1 - k) * -26)})`;
      c.caja.style.opacity = q <= 0 ? 0 : 1;
    });
    if (it.etiquetaEl) it.etiquetaEl.style.opacity = pasado ? 1 : clamp((tb - it.entra - 0.2) / 0.2);
    if (it.selloEl) it.selloEl.style.opacity = pasado ? 1 : clamp((tb - it.entra - 0.4) / 0.2);
    let op = 1;
    if (!pasado && it.sale < it.p.pulsos) op = 1 - clamp((tb - (it.sale - 0.35)) / 0.35);
    it.inn.style.opacity = op.toFixed(3);
  }

  /* ---------- Rótulos de localización y tiempo ---------- */
  crearRotulo(it) {
    const { iv, p } = it;
    const est = { ...this.m.guion.estilos.rotulo, ...(iv.estilo || {}) };
    it.est = est;
    const raiz = crear("div", "mc-el mc-rotulo", this.medidor);
    const inn = crear("div", "mc-el-in", raiz);
    const l1 = crear("div", "mc-linea mc-linea-1", inn);
    l1.style.cssText = `font:${this.fuenteCss(est, 1)};color:${est.color};background:${est.fondo};` + (est.mayusculas ? "text-transform:uppercase;" : "");
    crear("span", "", l1).innerHTML = marcado(iv.bloques[0]);
    const h1 = l1.offsetHeight;
    const w1 = l1.offsetWidth;
    l1.style.top = px(-h1 / 2);
    it.lineas = [l1];
    let w2 = 0;
    let h2 = 0;
    if (iv.bloques[1]) {
      const l2 = crear("div", "mc-linea mc-linea-2", inn);
      l2.style.cssText = `font:400 ${est.sub_tam}px/1 "${est.sub_fuente}", monospace;color:${est.sub_color};background:${est.sub_fondo};left:30px;`;
      l2.innerHTML = marcado(iv.bloques.slice(1).join(" "));
      h2 = l2.offsetHeight;
      w2 = l2.offsetWidth + 30;
      l2.style.top = px(h1 / 2 + 5);
      it.lineas.push(l2);
    }
    it.selloEl = this.sello(it, inn, Math.max(w1, w2) - 60, h1 / 2 + h2 + 2);
    this.numero(it, inn, w1 + 8, -h1 / 2 + 6);
    it.pos = this.posPagina(it);
    raiz.style.transform = `translate(${px(it.pos[0])},${px(it.pos[1])})`;
    inn.style.transform = `rotate(${iv.giro ?? -2}deg) scale(${it.k.toFixed(4)})`;
    p.P.textos.appendChild(raiz);
    it.raiz = raiz;
    it.inn = inn;
    it.tamBase = iv.bloques[1] ? est.sub_tam : est.tam;
    it.textosEl = it.lineas;
    it.medibles = it.lineas;
  }

  renderRotulo(it, tb, pasado) {
    it.lineas.forEach((l, i) => {
      const q = pasado ? 1 : clamp((tb - it.tB[Math.min(i, it.tB.length - 1)]) / 0.45);
      if (l._q === q) return;
      l._q = q;
      const k = ease.outQuint(q);
      l.style.clipPath = q >= 1 ? "" : `inset(-12px ${((1 - k) * 100).toFixed(2)}% -12px -12px)`;
      l.style.opacity = q <= 0 ? 0 : 1;
    });
    if (it.selloEl) it.selloEl.style.opacity = pasado ? 1 : clamp((tb - it.entra - 0.8) / 0.2);
    let op = 1;
    if (!pasado && it.sale < it.p.pulsos) op = 1 - clamp((tb - (it.sale - 0.35)) / 0.35);
    it.inn.style.opacity = op.toFixed(3);
  }

  /* ---------- Onomatopeyas ---------- */
  palabraSfx(it, texto, L, tam, padre, conSello) {
    const inst = crear("div", "mc-sfx-inst", padre);
    const pal = crear("div", "mc-sfx-palabra", inst);
    pal.style.font = `400 ${tam.toFixed(1)}px/1 "${L.fuente}", sans-serif`;
    pal.style.setProperty("--relleno", L.color);
    pal.style.setProperty("--relleno2", L.color2 || L.color);
    pal.style.setProperty("--borde", L.borde || "#111016");
    pal.style.setProperty("--grosor", Math.max(4, tam * 0.085).toFixed(1) + "px");
    const r = rng(hashStr(it.iv.id + texto));
    const letras = [];
    for (const ch of [...texto]) {
      const c = ch === " " ? "\u00a0" : ch;
      const l = crear("span", "l" + (L.color2 ? " dos" : ""), pal);
      l.dataset.c = c;
      crear("span", "g", l).textContent = c;
      const caos = L.caos ?? 1;
      l.style.transform = `translateY(${((r() - 0.5) * 0.09 * caos).toFixed(3)}em) rotate(${((r() - 0.5) * 11 * caos).toFixed(2)}deg) scale(${(1 + (r() - 0.5) * 0.16 * caos).toFixed(3)})`;
      letras.push(l);
    }
    const w = pal.offsetWidth;
    const h = pal.offsetHeight;
    pal.style.left = px(-w / 2);
    pal.style.top = px(-h / 2);
    const o = { inst, pal, letras, w, h };
    if (conSello) {
      o.sello = this.sello(it, inst, -44, h * 0.42);
    }
    return o;
  }

  crearSfx(it) {
    const { iv, p } = it;
    const v = p.v;
    const L = { ...this.m.guion.estilos.onomatopeya, ...(iv.letras || {}) };
    it.L = L;
    const raiz = crear("div", "mc-el mc-sfx", this.medidor);
    const inn = crear("div", "mc-el-in", raiz);
    const tam = L.tam * it.k;
    it.insts = [];
    if (iv.golpes && iv.golpes.length) {
      const texto = iv.bloques.join(" ");
      iv.golpes.forEach((g) => {
        const o = this.palabraSfx(it, texto, L, tam, inn, true);
        o.t0 = g.en;
        o.t1 = g.en + (iv.dura_golpe ?? 1);
        o.x = g.x * v.w;
        o.y = g.y * v.h;
        o.esc = g.escala ?? 1;
        o.giro = (L.giro || 0) + (g.giro || 0);
        it.insts.push(o);
      });
      it.entra = primeraEntrada(iv);
      it.sale = Math.max(...it.insts.map((o) => o.t1));
      it.modo = "golpes";
    } else if (iv.animacion === "pasos") {
      const pos = iv.pos || { x: 0.5, y: 0.5 };
      iv.bloques.forEach((b, i) => {
        const o = this.palabraSfx(it, b, L, tam, inn, i === iv.bloques.length - 1);
        o.t0 = it.tB[i];
        o.x = pos.x * v.w + i * tam * 0.75;
        o.y = pos.y * v.h + i * tam * 0.92;
        o.esc = 1;
        o.giro = L.giro || 0;
        it.insts.push(o);
      });
      it.modo = "pasos";
    } else {
      const pos = iv.pos || { x: 0.5, y: 0.5 };
      const o = this.palabraSfx(it, iv.bloques.join(" "), L, tam, inn, true);
      o.t0 = it.entra;
      o.x = pos.x * v.w;
      o.y = pos.y * v.h;
      o.esc = 1;
      o.giro = L.giro || 0;
      it.insts.push(o);
      it.modo = iv.animacion || "impacto";
    }
    this.numero(it, it.insts[0].inst, -it.insts[0].w / 2, -it.insts[0].h / 2);
    (iv.capa === "fondo" ? p.V.sfxCapa : p.V.sfxFrente).appendChild(raiz);
    it.raiz = raiz;
    it.inn = inn;
    it.medibles = it.insts.map((o) => o.pal);
    it.rastro = iv.rastro ?? 0;
  }

  renderSfx(it, tb, pasado) {
    const iv = it.iv;
    const modo = it.modo;
    let ultimo = -1;
    it.insts.forEach((o, i) => {
      const t = tb - o.t0;
      let esc = o.esc;
      let op = 1;
      let dx = 0;
      let dy = 0;
      let giro = o.giro;
      if (modo === "golpes") {
        const dur = o.t1 - o.t0;
        const q = t / dur;
        if (t < 0) op = 0;
        else {
          ultimo = i;
          const ent = clamp(t / 0.28);
          esc *= (0.45 + 0.55 * ease.backOut(ent)) * (1 + 0.07 * clamp(q));
          op = Math.max(it.rastro, q < 0.65 ? 1 : 1 - clamp((q - 0.65) / 0.35));
          giro += (1 - ent) * 8;
        }
      } else if (t < 0) {
        op = 0;
      } else if (!pasado) {
        ultimo = i;
        if (modo === "impacto" || modo === "pasos") {
          const q = clamp(t / (modo === "pasos" ? 0.28 : 0.4));
          esc *= lerp(modo === "pasos" ? 2.2 : 3.1, 1, ease.outQuint(q));
          op = clamp(t / 0.07);
          const amp = (modo === "pasos" ? 7 : 16) * it.k * Math.exp(-t * 2.6);
          if (amp > 0.4) {
            const j = jitter(iv.id + i, this.m.t, 30);
            dx = j[0] * amp;
            dy = j[1] * amp;
          }
          esc *= 1 + 0.035 * golpe(tb % 1, [0], 5);
        } else if (modo === "crecer") {
          const dur = Math.max(0.5, Math.min(it.sale, it.p.pulsos) - o.t0);
          const q = clamp(t / dur);
          esc *= lerp(0.72, 1.06, ease.out(q));
          const n = o.letras.length;
          const paso = (dur * 0.5) / n;
          o.letras.forEach((l, j) => {
            const a = clamp((t - j * paso) / 0.2);
            if (l._o !== a) {
              l.style.opacity = a;
              l._o = a;
            }
          });
          const j = jitter(iv.id, this.m.t, 24);
          dx = j[0] * 2.2 * it.k;
          dy = j[1] * 2.2 * it.k;
        } else if (modo === "parpadeo") {
          const j = jitter(iv.id, this.m.t, 16);
          op = t < 0.15 ? 1 : j[0] > -0.25 ? 1 : 0.18;
          esc *= 1 + 0.03 * j[1];
        }
        if (it.sale < it.p.pulsos) op *= 1 - clamp((tb - (it.sale - 0.4)) / 0.4);
      } else {
        ultimo = i;
        if (modo === "crecer") o.letras.forEach((l) => { if (l._o !== 1) { l.style.opacity = 1; l._o = 1; } });
        if (it.sale < it.p.pulsos) op = 0;
      }
      o.inst.style.opacity = op.toFixed(3);
      o.op = op;
      if (op > 0) {
        o.inst.style.transform = `translate(${px(o.x + dx)},${px(o.y + dy)})`;
        o.pal.style.transform = `rotate(${giro.toFixed(2)}deg) scale(${esc.toFixed(4)})`;
      }
    });
    if (modo === "golpes") it.insts.forEach((o, i) => { if (o.sello) o.sello.style.visibility = i === ultimo ? "" : "hidden"; });
  }

  /* ---------- Rótulo integrado en la ilustración (neón de la fachada) ---------- */
  crearNeon(it) {
    const { iv, p } = it;
    const est = { ...this.m.guion.estilos.neon, ...(iv.estilo || {}) };
    it.est = est;
    const rec = this.m.comp.recursos[p.arte.recurso];
    const raiz = crear("div", "mc-el mc-neon", this.medidor);
    const inn = crear("div", "mc-el-in", raiz);
    const caja = crear("div", "mc-neon-in", inn);
    const tam = (iv.tam_arte ?? 0.034) * rec.w;
    caja.style.font = `400 ${tam.toFixed(1)}px/0.92 "${est.fuente}", sans-serif`;
    caja.style.color = est.color;
    caja.style.textShadow = `0 0 ${tam * 0.05}px #fff, 0 0 ${tam * 0.16}px ${est.brillo}, 0 0 ${tam * 0.4}px ${est.brillo}, 0 0 ${tam * 0.9}px ${est.brillo}`;
    crear("div", "placa", caja);
    it.lineas = iv.bloques.map((b) => {
      const s = crear("span", "", caja);
      s.innerHTML = marcado(b);
      return s;
    });
    this.numero(it, inn, -tam * 2.6, -tam * 0.9);
    p.V.sfxCapa.appendChild(raiz);
    it.raiz = raiz;
    it.inn = inn;
    it.caja = caja;
    it.medibles = [caja];
  }

  renderNeon(it, tb, pasado) {
    const a = it.p.arteTf;
    const pos = it.iv.pos || { x: 0.5, y: 0.5 };
    if (a) it.inn.style.transform = `translate(${px(a.left + pos.x * a.rw * a.s)},${px(a.top + pos.y * a.rh * a.s)}) scale(${a.s.toFixed(5)})`;
    let luz = 1;
    if (!pasado) {
      const t = tb - it.entra;
      if (t < 1.6) {
        const j = jitter(it.iv.id, this.m.t, 18);
        luz = j[0] > 0.1 - t * 0.6 ? 1 : 0.16;
      } else {
        luz = 0.9 + 0.1 * golpe(tb % 1, [0], 4);
        const j = jitter(it.iv.id + "x", this.m.t, 9);
        if (j[0] > 0.93) luz = 0.4;
      }
    }
    it.lineas.forEach((l, i) => {
      // La segunda palabra tarda un poco más en encender
      const v = !pasado && tb - it.entra < 0.5 * i ? 0.12 : luz;
      l.style.opacity = v.toFixed(3);
    });
  }

  /* ---------- Cartelas de transición (a pantalla completa) ---------- */
  crearCartela(it) {
    const { iv } = it;
    const m = this.m;
    const est = { ...m.guion.estilos.cartela, ...(iv.estilo || {}) };
    it.est = est;
    const banda = iv.variante === "banda";
    const raiz = crear("div", "mc-cartela " + (banda ? "mc-cartela-banda" : "mc-cartela-titulo"), m.cartelas);
    if (banda) {
      const b = crear("div", "mc-banda", raiz);
      const pos = iv.pos || { x: 0.5, y: 0.5 };
      b.style.left = pos.x * 100 + "%";
      b.style.top = pos.y * 100 + "%";
      const tam = iv.tam || est.tam * 0.9;
      const alto = tam * 1.75;
      const svg = crearSvg("svg", { width: 1, height: 1 }, b);
      crearSvg("path", { d: F.bandaRasgada(2600, alto, { semilla: hashStr(iv.id) }), fill: est.acento, transform: "translate(14 16)" }, svg);
      crearSvg("path", { d: F.bandaRasgada(2600, alto, { semilla: hashStr(iv.id) }), fill: est.fondo, stroke: est.acento, "stroke-width": 5 }, svg);
      const t = crear("div", "txt", b);
      t.style.font = `400 ${tam}px/1 "${est.fuente}", serif`;
      t.style.color = est.color;
      if (est.mayusculas) t.style.textTransform = "uppercase";
      t.innerHTML = iv.bloques.map(marcado).join(" ");
      it.banda = b;
      it.txt = t;
      it.medibles = [t];
    } else {
      const l2 = crear("div", "l2", raiz);
      l2.style.font = `400 ${est.tam}px/1 "${est.fuente}", serif`;
      l2.style.color = est.color;
      l2.innerHTML = marcado(iv.bloques[0]);
      const regla = crear("div", "regla", raiz);
      const l1 = crear("div", "l1", raiz);
      l1.innerHTML = marcado(iv.bloques.slice(1).join(" · "));
      if (est.mayusculas) l1.style.textTransform = l2.style.textTransform = "uppercase";
      it.partes = { l1, l2, regla };
      it.medibles = [l2, l1];
    }
    this.sello(it, raiz);
    it.raiz = raiz;
    it.pantalla = true;
  }

  renderCartela(it, tb) {
    const t = tb - it.entra;
    const dur = it.sale - it.entra;
    if (it.banda) {
      const qi = clamp(t / 0.4);
      const qo = clamp((t - (dur - 0.45)) / 0.45);
      const x = lerp(-2700, 0, ease.outQuint(qi)) + lerp(0, 2800, ease.in(qo));
      it.banda.style.transform = `translateX(${px(x)}) rotate(${it.iv.giro ?? -4}deg)`;
      it.txt.style.transform = `translate(-50%,-50%) scale(${lerp(1.25, 1, ease.out(clamp((t - 0.15) / 0.5))).toFixed(4)})`;
      it.txt.style.opacity = clamp((t - 0.12) / 0.15);
    } else {
      const { l1, l2, regla } = it.partes;
      const a = clamp((t - 0.25) / 0.6);
      l2.style.opacity = a.toFixed(3);
      l2.style.transform = `scale(${lerp(1.12, 1, ease.out(a)).toFixed(4)})`;
      l2.style.letterSpacing = lerp(18, 6, ease.out(a)).toFixed(2) + "px";
      const t1 = (it.tB[1] ?? it.entra + 0.75) - it.entra;
      regla.style.transform = `scaleX(${ease.outQuint(clamp((t - t1) / 0.6)).toFixed(4)})`;
      l1.style.opacity = clamp((t - t1 - 0.15) / 0.4).toFixed(3);
      // Salida: la cartela se rasga en diagonal y deja ver la lámina.
      const dOut = Math.min(1.1, dur * 0.4);
      const qo = clamp((t - (dur - dOut)) / dOut);
      if (qo > 0) {
        const x = lerp(-320, W + 320, ease.inOut(qo));
        it.raiz.style.clipPath = `polygon(${px(x + 160)} 0px, ${W}px 0px, ${W}px ${H}px, ${px(x - 160)} ${H}px)`;
      } else if (it.raiz.style.clipPath) it.raiz.style.clipPath = "";
    }
  }

  /* ---------- Fotograma ---------- */
  render(pulso, si) {
    for (const it of this.items) {
      const p = it.p;
      const pasado = p.i < si;
      const futuro = p.i > si;
      const tb = pasado ? p.pulsos : futuro ? -1 : pulso - p.b0;
      let viva;
      if (futuro) viva = false;
      else if (pasado) viva = !it.pantalla && (it.sale >= p.pulsos || (it.modo === "golpes" && it.rastro > 0));
      else viva = tb >= it.entra && (tb < it.sale || it.sale >= p.pulsos || (it.modo === "golpes" && it.rastro > 0));
      if (it.viva !== viva) {
        it.raiz.classList.toggle("viva", viva);
        it.viva = viva;
      }
      if (it.pasada !== pasado) {
        it.raiz.classList.toggle("pasada", pasado);
        it.pasada = pasado;
      }
      if (!viva) continue;
      const clave = pasado ? "p" : pulso;
      if (it.clave === clave && pasado) continue;
      it.clave = clave;
      const tipo = it.iv.tipo;
      if (GLOBOS.includes(tipo)) this.renderGlobo(it, tb, pasado);
      else if (tipo === "narrador") this.renderNarrador(it, tb, pasado);
      else if (tipo === "rotulo") this.renderRotulo(it, tb, pasado);
      else if (tipo === "onomatopeya") this.renderSfx(it, tb, pasado);
      else if (tipo === "neon") this.renderNeon(it, tb, pasado);
      else if (tipo === "cartela") this.renderCartela(it, tb);
    }
  }

  /* ---------- Medidas en pantalla (para las comprobaciones de la vista previa) ---------- */
  union(els) {
    const L = this.m.lienzo.getBoundingClientRect();
    const k = L.width / W || 1;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const e of els) {
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      x0 = Math.min(x0, (r.left - L.left) / k);
      y0 = Math.min(y0, (r.top - L.top) / k);
      x1 = Math.max(x1, (r.right - L.left) / k);
      y1 = Math.max(y1, (r.bottom - L.top) / k);
    }
    return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  cajaPantalla(it) {
    if (it.insts) return this.union(it.insts.filter((o) => o.op > 0).map((o) => o.pal));
    return this.union(it.medibles);
  }
  cajaTexto(it) {
    return this.union(it.textosEl && it.textosEl.length ? it.textosEl : it.medibles);
  }
  /* Tamaño real de la letra en pantalla (px a 1080p) en el fotograma actual. */
  tamPantalla(it) {
    if (!it.tamBase) return null;
    if (it.pantalla) return it.tamBase;
    const cam = it.p.P.cam;
    return cam ? (it.tamBase * it.k * W) / cam.w : null;
  }
}
