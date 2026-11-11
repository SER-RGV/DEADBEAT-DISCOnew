/* DEADBEAT DISCO · Motion comic · efectos narrativos de la reconstrucción (versión 0.3).

   Cada efecto se construye una vez y después solo cambia transformaciones y opacidades, igual que
   los del motor. Todo es determinista: el mismo pulso dibuja siempre lo mismo.

   No se añade ninguna ilustración: las figuras son siluetas de sprites que ya existen en el
   repositorio, y el resto (ondas, disco, franjas, esquirlas) es dibujo vectorial. */

import { clamp, lerp, smooth, ease, rng, hashStr, golpe } from "./util.js";
import { crear, crearSvg } from "./dom.js";

const fx3 = (n) => n.toFixed(3);
const fx1 = (n) => n.toFixed(1);
const poner = (el, prop, valor) => {
  const k = "_" + prop;
  if (el[k] !== valor) {
    el.style[prop] = valor;
    el[k] = valor;
  }
};
/* Valor fijo o animado: número, o { de, a, desde, hasta } en pulsos del plano. */
const valor = (v, tb, def = 1) => (v == null ? def : typeof v === "number" ? v : lerp(v.de, v.a, smooth(v.desde ?? 0, v.hasta ?? 1, tb)));

/* Figura recortada por su silueta: un rectángulo de color con el sprite como máscara.
   'caja' (en composicion.json) es la zona del archivo que ocupa el dibujo, para que 'alto' sea la
   altura real de la figura y el punto de apoyo sean sus pies. */
export function figura(M, padre, id, alto, { espejo = false, color = "#0b080c", borde = "", clase = "" } = {}) {
  const rec = M.comp.recursos[id];
  const c = rec.caja || [0, 0, 1, 1];
  const esc = alto / (rec.h * (c[3] - c[1]));
  const w = rec.w * (c[2] - c[0]) * esc;
  const raiz = crear("div", "mc-fig " + clase, padre);
  raiz.style.width = fx1(w) + "px";
  raiz.style.height = fx1(alto) + "px";
  const masc = `url("${M.url(rec.src)}") ${fx1(-c[0] * rec.w * esc)}px ${fx1(-c[1] * rec.h * esc)}px / ${fx1(rec.w * esc)}px ${fx1(rec.h * esc)}px no-repeat`;
  const capa = (cls, fondo) => {
    const e = crear("div", cls, raiz);
    e.style.webkitMask = masc;
    e.style.mask = masc;
    e.style.background = fondo;
    return e;
  };
  // Canto de luz: la misma silueta, un poco más grande y en color, detrás del cuerpo. Sin desenfoques:
  // un filtro por figura obligaba a recalcular el brillo de cada una en cada fotograma.
  if (borde) {
    const k = 1 + Math.min(0.09, 9 / alto);
    capa("canto", borde).style.transform = `scale(${espejo ? -k : k},${k})`;
  }
  const cuerpo = capa("cuerpo", color);
  if (espejo) cuerpo.style.transform = "scaleX(-1)";
  return { raiz, cuerpo, w, alto };
}
const colocar = (f, x, y, extra = "") => poner(f.raiz, "transform", `translate(${fx1(x - f.w / 2)}px,${fx1(y - f.alto)}px)${extra}`);

function esquirla(padre, r, colores) {
  const t = 20 + r() * 34;
  const s = crearSvg("svg", { class: "mc-esquirla", width: t, height: t, viewBox: "0 0 10 10" }, padre);
  const n = r() < 0.5 ? 3 : 4;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.9;
    const d = 2.4 + r() * 2.6;
    pts.push((5 + Math.cos(a) * d).toFixed(2) + "," + (5 + Math.sin(a) * d).toFixed(2));
  }
  crearSvg("polygon", { points: pts.join(" "), fill: colores[Math.floor(r() * colores.length)], stroke: "#0b090d", "stroke-width": 0.7, "stroke-linejoin": "round" }, s);
  return { el: s, t };
}
const COLORES_ESQUIRLA = ["#7df9ff", "#eafcff", "#36e6ff", "#ffe94a", "#b8f6ff"];

/* ------------------------------------------------------------------ construcción */
export function construir(M, V, plano, fx, X) {
  const v = V.def;
  const fondo = V.fxFondo;
  const frente = V.fxFrente;
  const capa = fx.frente ? frente : fondo;
  switch (fx.tipo) {
    case "luz": {
      X.el = crear("div", "mc-fx mc-fx-luz", capa);
      const f = fx.forma === "lineal"
        ? `linear-gradient(${fx.angulo ?? 180}deg, ${fx.color}, transparent ${fx.alcance ?? 70}%)`
        : `radial-gradient(${(fx.rx ?? 0.5) * 100}% ${(fx.ry ?? 0.5) * 100}% at ${(fx.x ?? 0.5) * 100}% ${(fx.y ?? 0.5) * 100}%, ${fx.color}, transparent 75%)`;
      X.el.style.background = f;
      X.el.style.mixBlendMode = fx.mezcla || "screen";
      return true;
    }
    case "figuras": {
      X.figs = (fx.lista || []).map((o) => {
        const f = figura(M, capa, o.r, o.alto * v.h, { espejo: o.espejo, color: o.color || fx.color || "#0b080c", borde: o.borde ?? fx.borde });
        f.x = o.x * v.w;
        f.y = o.y * v.h;
        f.o = o;
        if (o.opacidad != null) f.raiz.style.opacity = o.opacidad;
        return f;
      });
      return true;
    }
    case "ondas": {
      const d = 2 * (fx.radio ?? 0.8) * v.h;
      X.anillos = [];
      for (let i = 0; i < (fx.n || 5); i++) {
        const a = crear("div", "mc-fx mc-fx-onda", capa);
        a.style.cssText = `width:${d}px;height:${d}px;left:${fx.x * v.w - d / 2}px;top:${fx.y * v.h - d / 2}px;border-color:${fx.color};border-width:${fx.grosor ?? 14}px`;
        if (fx.discontinua) a.style.borderStyle = "dashed";
        X.anillos.push(a);
      }
      return true;
    }
    case "espejo_acustico": {
      // Una superficie curva, sin rostro ni forma de criatura: lo que llega, rebota.
      const w = (fx.ancho ?? 0.8) * v.w;
      const h = (fx.flecha ?? 0.1) * v.h;
      const s = crearSvg("svg", { class: "mc-fx mc-fx-espejo", width: w, height: h + 40, viewBox: `0 0 ${w} ${h + 40}` }, capa);
      s.style.left = fx.x * v.w - w / 2 + "px";
      s.style.top = fx.y * v.h - 20 + "px";
      const d = `M 0 20 Q ${w / 2} ${20 + h * 2} ${w} 20`;
      crearSvg("path", { d, class: "halo" }, s);
      crearSvg("path", { d, class: "tinta" }, s);
      crearSvg("path", { d, class: "luz" }, s);
      X.el = s;
      return true;
    }
    case "disco": {
      const r = fx.radio * v.h;
      const s = crearSvg("svg", { class: "mc-fx mc-fx-disco", width: 1, height: 1 }, capa);
      s.style.left = fx.x * v.w + "px";
      s.style.top = fx.y * v.h + "px";
      crearSvg("ellipse", { cx: r * 0.06, cy: r * 0.09, rx: r * 1.03, ry: r * 1.03, fill: "rgba(8,4,12,.55)" }, s);
      const g = crearSvg("g", { class: "giro" }, s);
      crearSvg("circle", { r, fill: "#0d0a10", stroke: "#0b090d", "stroke-width": r * 0.03 }, g);
      for (let i = 0; i < 9; i++) crearSvg("circle", { r: r * (0.42 + i * 0.06), fill: "none", stroke: i % 3 === 0 ? "rgba(255,236,200,.2)" : "rgba(255,236,200,.09)", "stroke-width": r * 0.008 }, g);
      // Brillos del vinilo: dos cuñas enfrentadas, para que se vea girar (y saltar).
      for (const a0 of [-0.42, Math.PI - 0.42]) {
        const a1 = a0 + 0.5;
        crearSvg("path", { d: `M ${Math.cos(a0) * r * 0.4} ${Math.sin(a0) * r * 0.4} L ${Math.cos(a0) * r * 0.97} ${Math.sin(a0) * r * 0.97} A ${r * 0.97} ${r * 0.97} 0 0 1 ${Math.cos(a1) * r * 0.97} ${Math.sin(a1) * r * 0.97} L ${Math.cos(a1) * r * 0.4} ${Math.sin(a1) * r * 0.4} Z`, fill: "rgba(255,240,210,.16)" }, g);
      }
      crearSvg("circle", { r: r * 0.36, fill: fx.etiqueta || "#e8a544", stroke: "#0b090d", "stroke-width": r * 0.02 }, g);
      crearSvg("path", { d: `M ${r * 0.1} 0 L ${r * 0.31} 0`, stroke: "#0b090d", "stroke-width": r * 0.035, "stroke-linecap": "round" }, g);
      crearSvg("circle", { cx: -r * 0.17, cy: r * 0.1, r: r * 0.05, fill: "#0b090d" }, g);
      crearSvg("circle", { r: r * 0.035, fill: "#0b090d" }, g);
      X.giro = g;
      // Brazo y aguja
      const b = crearSvg("g", { class: "brazo" }, s);
      const px = r * 1.06;
      const py = -r * 0.98;
      b.style.transformOrigin = `${px}px ${py}px`;
      const hx = r * 0.63;
      const hy = -r * 0.22;
      crearSvg("path", { d: `M ${px} ${py} L ${hx} ${hy}`, stroke: "#0b090d", "stroke-width": r * 0.085, "stroke-linecap": "round" }, b);
      crearSvg("path", { d: `M ${px} ${py} L ${hx} ${hy}`, stroke: "#d9cfb6", "stroke-width": r * 0.045, "stroke-linecap": "round" }, b);
      crearSvg("circle", { cx: px, cy: py, r: r * 0.12, fill: "#d9cfb6", stroke: "#0b090d", "stroke-width": r * 0.03 }, b);
      crearSvg("rect", { x: hx - r * 0.1, y: hy - r * 0.06, width: r * 0.2, height: r * 0.13, rx: r * 0.02, fill: "#f3ecd6", stroke: "#0b090d", "stroke-width": r * 0.03, transform: `rotate(-58 ${hx} ${hy})` }, b);
      X.brazo = b;
      // La nota: sale de la aguja, recorre su arco y, antes de llegar al final, vuelve a salir.
      const n = crearSvg("g", { class: "nota" }, s);
      const k = r * 0.11;
      crearSvg("ellipse", { cx: 0, cy: 0, rx: k, ry: k * 0.74, fill: "#fff3d6", stroke: "#0b090d", "stroke-width": k * 0.3, transform: "rotate(-22)" }, n);
      crearSvg("path", { d: `M ${k * 0.9} ${-k * 0.2} L ${k * 0.9} ${-k * 3.1} Q ${k * 2.4} ${-k * 2.7} ${k * 2.2} ${-k * 1.3}`, fill: "none", stroke: "#0b090d", "stroke-width": k * 0.62, "stroke-linecap": "round", "stroke-linejoin": "round" }, n);
      crearSvg("path", { d: `M ${k * 0.9} ${-k * 0.2} L ${k * 0.9} ${-k * 3.1} Q ${k * 2.4} ${-k * 2.7} ${k * 2.2} ${-k * 1.3}`, fill: "none", stroke: "#fff3d6", "stroke-width": k * 0.3, "stroke-linecap": "round", "stroke-linejoin": "round" }, n);
      X.nota = n;
      X.ruta = { x0: hx + r * 0.1, y0: hy - r * 0.2, x1: (fx.nota_hasta?.[0] ?? 1.0) * v.w - fx.x * v.w, y1: (fx.nota_hasta?.[1] ?? 0.2) * v.h - fx.y * v.h, arco: r * 0.5 };
      // Final de la nota: un punto al que nunca llega.
      const fin = crearSvg("circle", { class: "fin", cx: X.ruta.x1, cy: X.ruta.y1, r: k * 1.25 }, s);
      X.fin = fin;
      const tr = crearSvg("path", { class: "trazo", d: `M ${X.ruta.x0} ${X.ruta.y0} Q ${(X.ruta.x0 + X.ruta.x1) / 2} ${Math.min(X.ruta.y0, X.ruta.y1) - X.ruta.arco} ${X.ruta.x1} ${X.ruta.y1}` }, s);
      s.insertBefore(tr, n);
      X.el = s;
      return true;
    }
    case "ecualizador": {
      const n = fx.n || 14;
      const x0 = fx.x0 * v.w;
      const paso = ((fx.x1 - fx.x0) * v.w) / n;
      X.barras = [];
      for (let i = 0; i < n; i++) {
        const b = crear("div", "mc-fx mc-fx-barra", capa);
        b.style.cssText = `left:${x0 + i * paso + paso * 0.14}px;width:${paso * 0.72}px;top:${(fx.y - fx.alto) * v.h}px;height:${fx.alto * v.h}px;--c:${(fx.colores || ["#36e6ff"])[i % (fx.colores || [1]).length]}`;
        X.barras.push(b);
      }
      return true;
    }
    case "niveles": {
      const ids = fx.recursos || [];
      const n = ids.length;
      const y0 = fx.y0 * v.h;
      const y1 = fx.y1 * v.h;
      const hueco = (fx.hueco ?? 0.16) * ((y1 - y0) / n);
      const alto = (y1 - y0 - hueco * (n - 1)) / n;
      const ancho = fx.ancho * v.w;
      const x = fx.x * v.w - ancho / 2;
      const caja = crear("div", "mc-fx mc-fx-niveles", capa);
      X.caja = caja;
      if (fx.pozo) {
        const pz = crear("div", "pozo", caja);
        pz.style.cssText = `left:${x - ancho * 0.09}px;width:${ancho * 1.18}px;top:${(fx.pozo.y0 ?? fx.y0 - 0.05) * v.h}px;height:${((fx.pozo.y1 ?? fx.y1 + 0.03) - (fx.pozo.y0 ?? fx.y0 - 0.05)) * v.h}px`;
        X.pozo = pz;
      }
      if (fx.columnas) {
        X.cols = [0.07, 0.93].map((k) => {
          const c = crear("div", "columna", caja);
          c.style.cssText = `left:${x + ancho * k - ancho * 0.03}px;width:${ancho * 0.06}px;top:${y0 - alto * 0.4}px;height:${y1 - y0 + alto * 0.55}px`;
          return c;
        });
      }
      const r = rng("niveles-" + plano.id);
      X.franjas = ids.map((id, i) => {
        const rec = M.comp.recursos[id];
        const f = crear("div", "franja" + (i === n - 1 && fx.nucleo ? " nucleo" : ""), caja);
        const foco = rec.foco || [0.5, 0.5];
        f.style.cssText = `left:${x}px;width:${ancho}px;top:${y0 + i * (alto + hueco)}px;height:${alto}px;background-image:url("${M.url(rec.src)}");background-position:${foco[0] * 100}% ${foco[1] * 100}%`;
        f._giro = (r() - 0.5) * (fx.torcer ?? 1.6);
        f._dx = (r() - 0.5) * ancho * (fx.desplazar ?? 0.05);
        return f;
      });
      if (fx.hilo) {
        const h = crear("div", "hilo", caja);
        h.style.cssText = `left:${fx.x * v.w - 5}px;top:${(fx.hilo.y0 ?? fx.y0) * v.h}px;height:${(fx.y1 - (fx.hilo.y0 ?? fx.y0)) * v.h + alto * 0.1}px`;
        X.hilo = h;
      }
      return true;
    }
    case "montaje": {
      const n = fx.tiras || 5;
      const caja = crear("div", "mc-fx mc-fx-montaje", capa);
      const w = v.w / n;
      X.tiras = [];
      for (let i = 0; i < n; i++) {
        const t = crear("div", "tira", caja);
        const inc = v.h * 0.07;
        t.style.cssText = `left:${i * w - inc / 2 - 2}px;width:${w + inc + 4}px;clip-path:polygon(${inc}px 0, 100% 0, calc(100% - ${inc}px) 100%, 0 100%)`;
        const fondos = (fx.rondas || []).map((ronda) => {
          const rec = M.comp.recursos[ronda[i % ronda.length]];
          const f = crear("div", "fondo", t);
          const foco = rec.foco || [0.5, 0.5];
          f.style.cssText = `background-image:url("${M.url(rec.src)}");background-position:${foco[0] * 100}% ${foco[1] * 100}%`;
          return f;
        });
        crear("div", "sombra", t);
        // El paso que se repite: dos tiempos, dos siluetas, siempre en el mismo orden.
        const figs = (fx.figuras || [fx.figura]).map((o) => {
          const f = figura(M, t, o.r || o, fx.alto * v.h, { espejo: !!o.espejo, color: "#0b080c", borde: fx.borde || "rgba(255,45,149,.95)" });
          f.x = (w + inc + 4) / 2;
          f.y = (fx.y ?? 0.96) * v.h;
          return f;
        });
        X.tiras.push({ t, fondos, figs });
      }
      X.destello = crear("div", "mc-fx mc-fx-estrobo", frente);
      return true;
    }
    case "palotes": {
      const alto = fx.alto * v.h;
      const paso = alto * 0.42;
      const s = crearSvg("svg", { class: "mc-fx mc-fx-palotes", width: 1, height: 1 }, frente);
      s.style.left = fx.x * v.w + "px";
      s.style.top = fx.y * v.h + "px";
      const r = rng("palotes-" + plano.id);
      X.palos = (fx.en || []).map((_, i) => {
        const grupo = Math.floor(i / 5);
        const k = i % 5;
        const x0 = grupo * paso * 5.4;
        let d;
        if (k < 4) {
          const x = x0 + k * paso;
          d = `M ${x + (r() - 0.5) * 6} ${(r() - 0.5) * 6} L ${x + (r() - 0.5) * 9} ${alto + (r() - 0.5) * 6}`;
        } else {
          d = `M ${x0 - paso * 0.55} ${alto * 0.72} L ${x0 + paso * 3.6} ${alto * 0.24}`;
        }
        const g = crearSvg("g", {}, s);
        crearSvg("path", { d, class: "borde" }, g);
        crearSvg("path", { d, class: "tiza" }, g);
        return g;
      });
      return true;
    }
    case "compas": {
      // Una fila de bailarines idénticos que repiten el mismo gesto en cada pulso; uno da un paso a destiempo.
      const alto = fx.alto * v.h;
      const y = fx.y * v.h;
      X.fila = [];
      for (let i = 0; i < fx.n; i++) {
        const f = figura(M, capa, fx.r, alto, { espejo: false, color: "#0b080c", borde: fx.borde || "rgba(255,45,149,.95)" });
        f.x = lerp(fx.x0, fx.x1, fx.n > 1 ? i / (fx.n - 1) : 0.5) * v.w;
        f.y = y;
        X.fila.push(f);
      }
      const fuera = X.fila[fx.fuera];
      X.dx = (fx.desvio ?? 0.04) * v.w;
      // El gesto descartado: la misma silueta, en otro color, donde la torre no la quiere.
      X.eco = figura(M, capa, fx.r, alto, { color: fx.color_fuera || "#7df9ff", borde: "rgba(125,249,255,.85)", clase: "eco" });
      X.eco.x = fuera.x + X.dx;
      X.eco.y = y;
      X.marca = figura(M, capa, fx.r, alto, { color: fx.color_fuera || "#7df9ff", borde: "rgba(125,249,255,.9)", clase: "fuera" });
      // Barrido de corrección
      X.barra = crear("div", "mc-fx mc-fx-barrido", frente);
      X.barra.style.width = v.w * 0.09 + "px";
      // Esquirlas: más variaciones descartadas que se van juntando alrededor de la primera
      const r = rng("compas-" + plano.id);
      const fr = fx.fragmentos || { n: 0 };
      X.esq = [];
      for (let i = 0; i < (fr.n || 0); i++) {
        const e = esquirla(frente, r, COLORES_ESQUIRLA);
        const origen = X.fila[Math.floor(r() * fx.n)];
        const a = r() * Math.PI * 2;
        const d = (0.25 + r() * 0.75) * alto * 0.42;
        e.x0 = origen.x + (r() - 0.5) * origen.w * 0.5;
        e.y0 = y - alto * (0.35 + r() * 0.5);
        e.x1 = X.eco.x + Math.cos(a) * d * 0.8;
        e.y1 = y - alto * 0.52 + Math.sin(a) * d;
        e.en = lerp(fr.desde, fr.hasta, (i + r() * 0.6) / fr.n);
        e.giro = (r() - 0.5) * 500;
        e.fase = r() * 6.28;
        X.esq.push(e);
      }
      return true;
    }
    case "fragmentos": {
      // Las esquirlas convergen en un punto y dejan de verse cuando la figura ya está formada.
      const r = rng("fragmentos-" + plano.id);
      X.esq = [];
      const cx = fx.centro[0] * v.w;
      const cy = fx.centro[1] * v.h;
      for (let i = 0; i < (fx.n || 40); i++) {
        const e = esquirla(capa, r, COLORES_ESQUIRLA);
        const a = r() * Math.PI * 2;
        const d = (0.16 + r() * 0.5) * v.w;
        e.a = a;
        e.d = d;
        e.x1 = cx + (r() - 0.5) * (fx.ancho ?? 0.07) * v.w;
        e.y1 = cy + (r() - 0.5) * (fx.alto ?? 0.5) * v.h;
        e.retraso = r() * 0.35;
        e.giro = (r() - 0.5) * 900;
        e.vueltas = 0.5 + r() * 0.9;
        X.esq.push(e);
      }
      X.cx = cx;
      X.cy = cy;
      return true;
    }
    case "barrido": {
      X.barra = crear("div", "mc-fx mc-fx-barrido", frente);
      X.barra.style.width = v.w * 0.07 + "px";
      return true;
    }
    default:
      return false;
  }
}

/* ------------------------------------------------------------------ fotograma */
export function actualizar(M, X, c) {
  const fx = X.def;
  const { tb, v } = c;
  const activo = c.estado === "activo";
  const pasado = c.estado === "pasado";
  switch (fx.tipo) {
    case "luz": {
      let o = c.estado === "futuro" ? 0 : valor(fx.opacidad, tb, 1);
      if (fx.late && activo) o *= 0.8 + 0.2 * golpe(tb % 1, [0], 3.5);
      if (fx.golpes && activo) o *= golpe(tb, fx.golpes, fx.caida ?? 4);
      else if (fx.golpes) o = 0;
      poner(X.el, "opacity", fx3(o));
      return true;
    }
    case "figuras": {
      const amp = (fx.bote ?? 9) * (activo ? valor(fx.energia, tb, 1) : 0);
      const desde = fx.desde ?? 0;
      for (const f of X.figs) {
        const fase = f.o.fase || 0;
        const g = activo && tb >= desde ? golpe((((tb + fase) % 1) + 1) % 1, [0], 4) : 0;
        const lado = f.o.espejo ? -1 : 1;
        colocar(f, f.x, f.y - g * amp * (f.o.bote ?? 1), ` rotate(${(lado * (fx.giro ?? 2.2) * (g - 0.35) * (amp > 0 ? 1 : 0)).toFixed(2)}deg)`);
      }
      return true;
    }
    case "ondas": {
      const t0 = fx.desde ?? 0;
      const cada = fx.cada ?? 0.5;
      const dura = fx.dura ?? 2.5;
      X.anillos.forEach((a, i) => {
        const q = (tb - t0 - i * cada) / dura;
        const vivo = activo && q > 0 && q < 1;
        poner(a, "opacity", vivo ? fx3((fx.opacidad ?? 0.9) * Math.pow(1 - q, 1.3)) : "0");
        if (vivo) a.style.transform = `scale(${fx3(0.04 + ease.out(q) * 0.96)})`;
      });
      return true;
    }
    case "espejo_acustico": {
      const o = c.estado === "futuro" ? 0 : smooth(fx.desde ?? 0, (fx.desde ?? 0) + 1.2, tb);
      const g = activo ? golpe(tb, fx.golpes || [], 2.2) : 0;
      poner(X.el, "opacity", fx3(o * (0.55 + 0.45 * g)));
      X.el.style.transform = `scaleY(${fx3(1 + g * 0.22)})`;
      X.el.classList.toggle("devuelve", tb >= (fx.devuelve ?? 99));
      return true;
    }
    case "disco": {
      const w = 360 / (fx.vuelta || 4);
      const saltos = fx.saltos || [];
      const tramo = fx.tramo || 1;
      const s0 = saltos.length ? saltos[0] : Infinity;
      let ang;
      let q; // posición de la nota en su recorrido, de 0 a 1
      let sacudida = 0;
      const t = pasado ? c.p.pulsos : tb;
      if (t < s0) {
        ang = w * t;
        q = (t - (s0 - tramo)) / tramo;
      } else {
        let ult = s0;
        for (const s of saltos) if (t >= s) ult = s;
        ang = w * (s0 - tramo + (t - ult));
        q = (t - ult) / tramo;
        sacudida = Math.exp(-(t - ult) * 9);
      }
      X.giro.style.transform = `rotate(${ang.toFixed(2)}deg)`;
      X.brazo.style.transform = `rotate(${(sacudida * 3.2 * Math.sin(t * 40)).toFixed(2)}deg)`;
      const R = X.ruta;
      const visible = q >= 0 && c.estado !== "futuro";
      // La nota recorre el 82 % de su arco y vuelve al principio.
      const u = clamp(q) * 0.82;
      const mx = (R.x0 + R.x1) / 2;
      const my = Math.min(R.y0, R.y1) - R.arco;
      const bx = (1 - u) * (1 - u) * R.x0 + 2 * (1 - u) * u * mx + u * u * R.x1;
      const by = (1 - u) * (1 - u) * R.y0 + 2 * (1 - u) * u * my + u * u * R.y1;
      X.nota.style.transform = `translate(${fx1(bx)}px,${fx1(by)}px) scale(${fx3(0.75 + 0.35 * Math.sin(Math.PI * clamp(q)))})`;
      poner(X.nota, "opacity", visible ? "1" : "0");
      poner(X.fin, "opacity", t >= s0 - tramo * 0.5 ? "1" : "0");
      return true;
    }
    case "ecualizador": {
      const env = c.estado === "futuro" ? 0 : pasado ? 1 : valor(fx.energia, tb, 1);
      const g = activo ? golpe(tb % 1, [0], 3) : 0.3;
      X.barras.forEach((b, i) => {
        const base = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + Math.floor(tb * 2) * 2.3 + i * i * 0.31));
        b.style.transform = `scaleY(${fx3(0.06 + env * base * (0.55 + 0.45 * g))})`;
      });
      return true;
    }
    case "niveles": {
      const t0 = fx.desde ?? 0;
      const paso = fx.paso ?? 0.6;
      const n = X.franjas.length;
      const aten = fx.atenuado ?? 1;
      X.franjas.forEach((f, i) => {
        const q = pasado ? 1 : c.estado === "futuro" ? 0 : clamp((tb - (t0 + i * paso)) / 0.7);
        poner(f, "opacity", fx3(Math.min(1, q * 3) * lerp(aten, aten * (fx.fundir ?? 1), i / Math.max(1, n - 1))));
        let esc = 1;
        if (i === n - 1 && fx.nucleo && q >= 1 && activo) esc = 1 + 0.035 * golpe(tb % 1, [0], 4);
        f.style.transform = `translate(${fx1(f._dx)}px,${fx1((1 - ease.outQuint(q)) * -70)}px) rotate(${f._giro.toFixed(2)}deg) scale(${fx3(esc)})`;
      });
      const qt = pasado ? 1 : c.estado === "futuro" ? 0 : clamp((tb - t0 + 0.4) / (paso * (n - 1) + 0.9));
      if (X.cols) for (const col of X.cols) col.style.transform = `scaleY(${fx3(qt)})`;
      if (X.hilo) X.hilo.style.transform = `scaleY(${fx3(qt)})`;
      if (X.pozo) poner(X.pozo, "opacity", fx3(pasado ? 1 : c.estado === "futuro" ? 0 : smooth(t0 - 1.2, t0, tb)));
      return true;
    }
    case "montaje": {
      const cada = fx.cada || 2;
      const reinicio = fx.reinicio ?? Infinity;
      const nr = (fx.rondas || []).length;
      const t = pasado ? c.p.pulsos : tb;
      const local = t >= reinicio ? t - reinicio : t;
      const ronda = c.estado === "futuro" ? 0 : Math.min(nr - 1, Math.floor(local / cada));
      const g = activo ? golpe(tb % 1, [0], 4) : 0;
      for (const T of X.tiras) {
        T.fondos.forEach((f, k) => poner(f, "opacity", k === ronda ? "1" : "0"));
        const paso = c.estado === "futuro" ? 0 : Math.floor(local + 1e-6) % T.figs.length;
        T.figs.forEach((f, k) => {
          poner(f.raiz, "opacity", k === paso ? "1" : "0");
          if (k === paso) colocar(f, f.x, f.y - g * (fx.bote ?? 12), ` rotate(${((g - 0.35) * 2.4).toFixed(2)}deg)`);
        });
      }
      // Corte entre rondas; el reinicio es más fuerte: la noche vuelve a empezar.
      const cortes = [];
      for (let k = cada; k < c.p.pulsos; k += cada) if (Math.abs(k - reinicio) > 1e-6) cortes.push(k);
      let d = activo ? 0.28 * golpe(tb, cortes, 9) : 0;
      if (activo && tb >= reinicio) d = Math.max(d, 0.95 * Math.exp(-(tb - reinicio) * 5));
      poner(X.destello, "opacity", fx3(d));
      return true;
    }
    case "palotes": {
      X.palos.forEach((p, i) => {
        const q = pasado ? 1 : c.estado === "futuro" ? 0 : clamp((tb - fx.en[i]) / 0.3);
        poner(p, "opacity", q > 0 ? "1" : "0");
        if (q > 0 && q < 1) p.style.transform = `scale(${fx3(1 + (1 - q) * 0.5)})`;
        else poner(p, "transform", "");
      });
      return true;
    }
    case "compas": {
      const t = pasado ? c.p.pulsos : c.estado === "futuro" ? 0 : tb;
      const b = fx.barrido || {};
      const xb = lerp(-0.12, 1.12, clamp((t - b.desde) / b.dura)) * v.w;
      const fuera = X.fila[fx.fuera];
      const corregido = xb >= fuera.x + X.dx; // el barrido ya ha pasado por el que iba a destiempo
      const desviado = t >= fx.sale && !corregido;
      const amp = fx.bote ?? 12;
      X.fila.forEach((f, i) => {
        const g = activo ? golpe(tb % 1, [0], 4) : 0;
        if (i === fx.fuera && desviado) {
          poner(f.raiz, "opacity", "0");
          return;
        }
        poner(f.raiz, "opacity", "1");
        colocar(f, f.x, f.y - g * amp, ` rotate(${((g - 0.35) * 2.2).toFixed(2)}deg)`);
      });
      // El que va a destiempo: medio pulso tarde, inclinado y en otro color.
      const g2 = activo ? golpe((((tb + 0.5) % 1) + 1) % 1, [0], 4) : 0;
      const entra = clamp((t - fx.sale) / 0.25);
      poner(X.marca.raiz, "opacity", desviado ? "1" : "0");
      if (desviado) colocar(X.marca, fuera.x + X.dx * ease.out(entra), fuera.y - g2 * amp * 1.5, ` rotate(${(7 + (g2 - 0.35) * 5).toFixed(2)}deg)`);
      // Lo descartado no desaparece: queda el eco, parpadeando, donde estuvo.
      const parpadeo = activo ? 0.74 + 0.16 * Math.sin(t * 19) + 0.1 * Math.sin(t * 53) : 0.7;
      poner(X.eco.raiz, "opacity", corregido ? fx3(parpadeo) : "0");
      if (corregido) colocar(X.eco, X.eco.x, X.eco.y - g2 * amp * 0.7, ` rotate(${(7 + (g2 - 0.35) * 4).toFixed(2)}deg)`);
      const enBarrido = activo && t >= b.desde && t <= b.desde + b.dura;
      poner(X.barra, "opacity", enBarrido ? "1" : "0");
      if (enBarrido) X.barra.style.transform = `translateX(${fx1(xb - v.w * 0.045)}px)`;
      for (const e of X.esq) {
        const q = clamp((t - e.en) / 1.3);
        if (q <= 0) {
          poner(e.el, "opacity", "0");
          continue;
        }
        const k = ease.out(q);
        const o = q < 1 ? 0 : 1;
        const x = lerp(e.x0, e.x1, k) + o * Math.cos(t * 1.7 + e.fase) * 7;
        const y = lerp(e.y0, e.y1, k) - Math.sin(Math.PI * q) * v.h * 0.08 + o * Math.sin(t * 2.1 + e.fase) * 7;
        poner(e.el, "opacity", fx3(Math.min(1, q * 5)));
        e.el.style.transform = `translate(${fx1(x - e.t / 2)}px,${fx1(y - e.t / 2)}px) rotate(${(e.giro * (1 - k) + t * 14 + e.fase * 57).toFixed(1)}deg)`;
      }
      return true;
    }
    case "fragmentos": {
      const t0 = fx.desde ?? 0;
      const t1 = fx.hasta ?? 3;
      const t = pasado ? c.p.pulsos : tb;
      const fuera = c.estado === "futuro" ? 0 : 1 - smooth(t1, t1 + (fx.funde ?? 0.8), t);
      for (const e of X.esq) {
        if (fuera <= 0) {
          poner(e.el, "opacity", "0");
          continue;
        }
        const q = clamp((t - t0 - e.retraso * (t1 - t0)) / ((t1 - t0) * (1 - e.retraso)));
        const k = ease.inOut(q);
        const a = e.a + (1 - k) * e.vueltas * 2.4;
        const d = e.d * (1 - k);
        const x = lerp(X.cx + Math.cos(a) * d, e.x1, k * k);
        const y = lerp(X.cy + Math.sin(a) * d * 0.62, e.y1, k * k);
        poner(e.el, "opacity", fx3(fuera));
        e.el.style.transform = `translate(${fx1(x - e.t / 2)}px,${fx1(y - e.t / 2)}px) rotate(${(e.giro * (1 - k) + t * 22).toFixed(1)}deg) scale(${fx3(1.25 - 0.45 * k)})`;
      }
      return true;
    }
    case "barrido": {
      const q = (tb - fx.desde) / fx.dura;
      const hasta = fx.hasta_x ?? 1.12;
      const x = lerp(-0.12, hasta, clamp(q));
      let o = activo && q >= 0 && q <= 1 ? 1 : 0;
      // Al llegar a lo que no puede corregir, el barrido se rompe.
      if (fx.falla && activo && q > 1 && q < 1 + (fx.agonia ?? 0.9) / fx.dura) o = Math.sin(tb * 61) > -0.2 ? 0.85 * (1 - (q - 1) / ((fx.agonia ?? 0.9) / fx.dura)) : 0;
      poner(X.barra, "opacity", fx3(o));
      if (o > 0) X.barra.style.transform = `translateX(${fx1(x * v.w - v.w * 0.035 + (q > 1 ? Math.sin(tb * 47) * 9 : 0))}px)`;
      return true;
    }
    default:
      return false;
  }
}
