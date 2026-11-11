/* DEADBEAT DISCO · Motion comic · utilidades compartidas (navegador y Node). */

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (a === b ? (v >= b ? 1 : 0) : clamp((v - a) / (b - a)));
export const smooth = (a, b, v) => {
  const t = invLerp(a, b, v);
  return t * t * (3 - 2 * t);
};

export const ease = {
  linear: (t) => t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  out: (t) => 1 - Math.pow(1 - t, 3),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  in: (t) => t * t * t,
  // Rebote corto: la forma se expande, se pasa un poco y asienta.
  backOut: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elasticOut: (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
};

/* Generador pseudoaleatorio con semilla: el mismo texto dibuja siempre la misma forma. */
export function hashStr(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function rng(seed) {
  let s = (typeof seed === "string" ? hashStr(seed) : seed >>> 0) || 1;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Ruido determinista por fotograma (para temblores): mismo tiempo, mismo valor. */
export function jitter(seed, t, hz = 30) {
  const k = Math.floor(t * hz);
  const r = rng((hashStr(String(seed)) ^ Math.imul(k + 1, 2654435761)) >>> 0);
  return [r() * 2 - 1, r() * 2 - 1];
}

/* Texto limpio de una intervención: sin marcas de énfasis (*así*). */
export function textoPlano(bloques) {
  const arr = Array.isArray(bloques) ? bloques : [bloques || ""];
  return arr.join(" ").replace(/\*/g, "").replace(/\s+/g, " ").trim();
}

export const contarCaracteres = (bloques) => textoPlano(bloques).length;
export const contarPalabras = (bloques) => {
  const t = textoPlano(bloques);
  return t ? t.split(" ").length : 0;
};

/* Contraste WCAG entre dos colores #rrggbb. */
export function luminancia(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  if (la == null || lb == null) return null;
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function fmtTiempo(seg) {
  const s = Math.max(0, seg);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return String(m).padStart(2, "0") + ":" + r.toFixed(2).padStart(5, "0");
}

/* Golpe rítmico: vale 1 en el instante del golpe y cae deprisa. */
export function golpe(tb, golpes, caida = 5) {
  let m = 0;
  for (const g of golpes) {
    if (tb >= g) m = Math.max(m, Math.exp(-(tb - g) * caida));
  }
  return m;
}
