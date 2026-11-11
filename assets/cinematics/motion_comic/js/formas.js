/* DEADBEAT DISCO · Motion comic · generadores de formas (SVG).
   Todas las formas se dibujan con vectores a partir del texto: no hay bocadillos pintados
   en las ilustraciones. Las coordenadas son locales, con el centro del bocadillo en (0, 0). */

import { rng } from "./util.js";

const TAU = Math.PI * 2;
const f = (n) => (Math.round(n * 10) / 10).toString();

/* Punto de una superelipse (más "cuadrada" que una elipse: el texto cabe mejor). */
function superelipse(rx, ry, ang, p = 2.5) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const e = 2 / p;
  return [rx * Math.sign(c) * Math.pow(Math.abs(c), e), ry * Math.sign(s) * Math.pow(Math.abs(s), e)];
}

/* Curva suave (Catmull-Rom → Bézier) por una lista abierta de puntos. */
function curvaSuave(pts) {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/* Recorta la cola para que no llegue a tocar al personaje. */
export function puntaCola(rx, ry, objetivo, opciones = {}) {
  if (!objetivo) return null;
  const [tx, ty] = objetivo;
  const dist = Math.hypot(tx, ty);
  if (dist < 1) return null;
  const ang = Math.atan2(ty / ry, tx / rx);
  const borde = superelipse(rx, ry, ang);
  const dBorde = Math.hypot(borde[0], borde[1]);
  const libre = dist - dBorde;
  if (libre < 14) return null; // el objetivo está dentro o pegado al bocadillo
  const fraccion = opciones.largo ?? 0.78;
  const maximo = opciones.maximo ?? 260;
  const largo = Math.min(libre * fraccion, maximo);
  const ux = tx / dist;
  const uy = ty / dist;
  return { ang, punta: [ux * (dBorde + largo), uy * (dBorde + largo)], largo, borde };
}

/* Bocadillo de diálogo clásico: contorno continuo con cola curva. */
export function bocadilloDialogo(rx, ry, objetivo, opciones = {}) {
  const r = rng(opciones.semilla || 1);
  const cola = puntaCola(rx, ry, objetivo, opciones.cola);
  const n = 44;
  const media = (rx + ry) / 2;
  const semi = cola ? Math.min(0.42, (opciones.baseCola ?? 30) / media) : 0;
  const a0 = cola ? cola.ang + semi : 0;
  const a1 = cola ? cola.ang - semi + TAU : TAU;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const p = superelipse(rx, ry, a);
    const w = 1 + (r() - 0.5) * (opciones.temblor ?? 0.022);
    pts.push([p[0] * w, p[1] * w]);
  }
  if (!cola) pts[pts.length - 1] = pts[0];
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}` + curvaSuave(pts);
  if (cola) {
    const ini = pts[pts.length - 1];
    const fin = pts[0];
    const [px, py] = cola.punta;
    // La cola se curva ligeramente, como trazada a mano.
    const nx = -Math.sin(Math.atan2(py, px));
    const ny = Math.cos(Math.atan2(py, px));
    const curva = (opciones.curvaCola ?? 0.16) * cola.largo;
    const c1 = [(ini[0] + px) / 2 + nx * curva, (ini[1] + py) / 2 + ny * curva];
    const c2 = [(fin[0] + px) / 2 + nx * curva, (fin[1] + py) / 2 + ny * curva];
    d += `Q${f(c1[0])} ${f(c1[1])} ${f(px)} ${f(py)}Q${f(c2[0])} ${f(c2[1])} ${f(fin[0])} ${f(fin[1])}`;
  }
  return { d: d + "Z", cola };
}

/* Megafonía: cuerpo de diálogo con cola en zigzag (voz amplificada o eléctrica). */
export function colaRayo(rx, ry, objetivo, opciones = {}) {
  const cola = puntaCola(rx, ry, objetivo, opciones.cola);
  if (!cola) return null;
  const [bx, by] = cola.borde;
  const [px, py] = cola.punta;
  const dx = px - bx;
  const dy = py - by;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const w = opciones.ancho ?? 20;
  const P = (t, lado) => [bx * 0.86 + dx * t + nx * w * lado, by * 0.86 + dy * t + ny * w * lado];
  const pts = [P(-0.05, 1), P(0.42, 0.55), P(0.36, -0.75), [px, py], P(0.56, 0.1), P(0.64, 1.25), P(-0.05, -1)];
  return { d: "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z", cola };
}

/* Nube de pensamiento: lóbulos alrededor del texto y burbujas hacia el personaje. */
export function nubePensamiento(rx, ry, objetivo, opciones = {}) {
  const r = rng(opciones.semilla || 7);
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.max(9, Math.round(perim / (opciones.lobulo ?? 74)));
  const pts = [];
  const giro = r() * TAU;
  for (let i = 0; i < n; i++) {
    const a = giro + (TAU * (i + (r() - 0.5) * 0.3)) / n;
    pts.push([Math.cos(a) * rx * 0.97, Math.sin(a) * ry * 0.97]);
  }
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const cuerda = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const rad = cuerda * (0.58 + r() * 0.1);
    d += `A${f(rad)} ${f(rad)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
  }
  d += "Z";
  const burbujas = [];
  const cola = puntaCola(rx * 1.08, ry * 1.12, objetivo, { largo: 0.86, maximo: 300, ...(opciones.cola || {}) });
  if (cola) {
    const [bx, by] = cola.borde;
    const [px, py] = cola.punta;
    const pasos = [0.2, 0.55, 0.9];
    const radios = [17, 11.5, 7];
    pasos.forEach((t, i) => burbujas.push({ cx: bx + (px - bx) * t, cy: by + (py - by) * t, r: radios[i] }));
  }
  return { d, burbujas, cola };
}

/* Grito: estallido irregular de puntas; la más larga apunta a quien grita. */
export function estallidoGrito(rx, ry, objetivo, opciones = {}) {
  const r = rng(opciones.semilla || 3);
  const puntas = opciones.puntas ?? 17;
  const cola = puntaCola(rx * 1.05, ry * 1.05, objetivo, { largo: 0.82, maximo: 300, ...(opciones.cola || {}) });
  const pts = [];
  const total = puntas * 2;
  for (let i = 0; i < total; i++) {
    const a = (TAU * i) / total + (r() - 0.5) * 0.09;
    const fuera = i % 2 === 0;
    const k = fuera ? 1.2 + r() * 0.3 : 0.96 + r() * 0.06;
    const p = superelipse(rx, ry, a, 2.2);
    pts.push({ a, x: p[0] * k, y: p[1] * k, fuera });
  }
  if (cola) {
    // Sustituye la punta exterior más cercana a la dirección del personaje por la cola.
    let mejor = -1;
    let dif = 9;
    pts.forEach((p, i) => {
      if (!p.fuera) return;
      let dd = Math.abs(Math.atan2(Math.sin(p.a - cola.ang), Math.cos(p.a - cola.ang)));
      if (dd < dif) {
        dif = dd;
        mejor = i;
      }
    });
    if (mejor >= 0) {
      pts[mejor].x = cola.punta[0];
      pts[mejor].y = cola.punta[1];
    }
  }
  const d = "M" + pts.map((p) => `${f(p.x)} ${f(p.y)}`).join("L") + "Z";
  return { d, cola };
}

/* Rectángulo trazado a mano (cajas de narrador y marcos de viñeta). */
export function rectTosco(x, y, w, h, opciones = {}) {
  const r = rng(opciones.semilla || 11);
  const j = opciones.temblor ?? 2.2;
  const paso = opciones.paso ?? 90;
  const pts = [];
  const lado = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(len / paso));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const nx = (y1 - y0) / len;
      const ny = -(x1 - x0) / len;
      const k = i === 0 ? 0.4 : 1;
      const o = (r() - 0.5) * 2 * j * k;
      pts.push([x0 + (x1 - x0) * t + nx * o, y0 + (y1 - y0) * t + ny * o]);
    }
  };
  lado(x, y, x + w, y);
  lado(x + w, y, x + w, y + h);
  lado(x + w, y + h, x, y + h);
  lado(x, y + h, x, y);
  return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
}

/* Polígono trazado a mano a partir de vértices (viñetas inclinadas). */
export function poligonoTosco(vertices, opciones = {}) {
  const r = rng(opciones.semilla || 13);
  const j = opciones.temblor ?? 2.4;
  const paso = opciones.paso ?? 110;
  const pts = [];
  for (let v = 0; v < vertices.length; v++) {
    const [x0, y0] = vertices[v];
    const [x1, y1] = vertices[(v + 1) % vertices.length];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const n = Math.max(1, Math.round(len / paso));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const nx = (y1 - y0) / len;
      const ny = -(x1 - x0) / len;
      const o = i === 0 ? 0 : (r() - 0.5) * 2 * j;
      pts.push([x0 + (x1 - x0) * t + nx * o, y0 + (y1 - y0) * t + ny * o]);
    }
  }
  return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
}

/* Banda rasgada para cartelas de transición. */
export function bandaRasgada(w, h, opciones = {}) {
  const r = rng(opciones.semilla || 17);
  const paso = opciones.paso ?? 38;
  const diente = opciones.diente ?? 15;
  const arriba = [];
  const abajo = [];
  for (let x = -w / 2; x <= w / 2 + 1; x += paso) {
    arriba.push([x, -h / 2 + (r() - 0.5) * 2 * diente]);
    abajo.push([x, h / 2 + (r() - 0.5) * 2 * diente]);
  }
  const pts = arriba.concat(abajo.reverse());
  return "M" + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + "Z";
}

/* Mancha de tinta (salpicaduras decorativas y transiciones). */
export function manchaTinta(radio, opciones = {}) {
  const r = rng(opciones.semilla || 23);
  const n = opciones.puntos ?? 14;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (TAU * i) / n;
    const k = 0.72 + r() * 0.5 + (r() > 0.82 ? 0.45 : 0);
    pts.push([Math.cos(a) * radio * k, Math.sin(a) * radio * k]);
  }
  pts[n] = pts[0];
  return `M${f(pts[0][0])} ${f(pts[0][1])}` + curvaSuave(pts) + "Z";
}

/* Líneas cinéticas radiales (impactos). Devuelve un único path de cuñas. */
export function lineasImpacto(radioInt, radioExt, opciones = {}) {
  const r = rng(opciones.semilla || 29);
  const n = opciones.n ?? 46;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (TAU * (i + r() * 0.7)) / n;
    const ancho = 0.008 + r() * 0.022;
    const r0 = radioInt * (0.85 + r() * 0.5);
    const p0 = [Math.cos(a) * r0, Math.sin(a) * r0];
    const p1 = [Math.cos(a - ancho) * radioExt, Math.sin(a - ancho) * radioExt];
    const p2 = [Math.cos(a + ancho) * radioExt, Math.sin(a + ancho) * radioExt];
    d += `M${f(p0[0])} ${f(p0[1])}L${f(p1[0])} ${f(p1[1])}L${f(p2[0])} ${f(p2[1])}Z`;
  }
  return d;
}
