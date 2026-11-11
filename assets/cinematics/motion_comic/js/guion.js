/* DEADBEAT DISCO · Motion comic · lectura y comprobación del guion.
   Sin dependencias del navegador: lo usan la vista previa y el validador (validar_guion.mjs). */

import { textoPlano } from "./util.js";

export const GLOBOS = ["dialogo", "pensamiento", "grito", "susurro"];
/* Textos que el espectador tiene que leer (las onomatopeyas, el neón y las cartelas se captan de un vistazo). */
export const DE_LECTURA = ["dialogo", "pensamiento", "grito", "susurro", "narrador", "rotulo"];

export const NOMBRE_TIPO = {
  dialogo: "Diálogo",
  pensamiento: "Pensamiento",
  grito: "Grito",
  susurro: "Susurro",
  narrador: "Narrador",
  rotulo: "Rótulo",
  cartela: "Cartela",
  onomatopeya: "Onomatopeya",
  neon: "Rótulo integrado",
};

export const NOMBRE_ESTADO = {
  juego: "Texto del juego",
  juego_fragmento: "Fragmento del juego",
  juego_reubicado: "Del juego, reubicado",
  storyboard: "Del storyboard",
  borrador: "BORRADOR",
};

export function planosConTiempos(comp, guion) {
  const spb = 60 / guion.tempo.bpm;
  let b = 0;
  return comp.planos.map((p, i) => {
    const o = { n: p.n, i, id: p.id, nombre: p.nombre, pulsos: p.pulsos, b0: b, b1: b + p.pulsos, t0: b * spb, t1: (b + p.pulsos) * spb };
    b += p.pulsos;
    return o;
  });
}

export const primeraEntrada = (iv) => (iv.golpes && iv.golpes.length ? Math.min(...iv.golpes.map((g) => g.en)) : iv.entra ?? 0);

export function ultimaSalida(iv, pulsosPlano) {
  if (iv.golpes && iv.golpes.length) return Math.min(pulsosPlano, Math.max(...iv.golpes.map((g) => g.en)) + (iv.dura_golpe ?? 1));
  return Math.min(iv.sale ?? pulsosPlano, pulsosPlano);
}

/* Momento (en pulsos desde el inicio del plano) en que aparece cada bloque de texto.
   Cada bloque espera a que dé tiempo a leer el anterior y cae en un medio pulso de la música. */
export function tiemposBloques(iv, pulsosPlano, guion) {
  const n = (iv.bloques || []).length;
  if (Array.isArray(iv.bloques_en) && iv.bloques_en.length === n) return iv.bloques_en.slice();
  const entra = iv.entra ?? 0;
  if (iv.tipo === "rotulo" || iv.tipo === "cartela") return iv.bloques.map((_, i) => entra + i * 0.75);
  if (iv.tipo === "onomatopeya" || iv.tipo === "neon") return iv.bloques.map((_, i) => entra + i * (iv.paso_pulsos ?? 0));
  const spb = 60 / guion.tempo.bpm;
  const cps = guion.lectura.cps_comodo;
  const fin = Math.min(iv.sale ?? pulsosPlano, pulsosPlano);
  const ini = entra + (iv.tipo === "pensamiento" ? 0.75 : GLOBOS.includes(iv.tipo) ? 0.25 : 0);
  const necesita = iv.bloques.map((b) => Math.max(0.75, textoPlano(b).length / cps / spb));
  const total = necesita.reduce((a, b) => a + b, 0);
  const disponible = Math.max(0.5, fin - ini);
  const f = total > disponible ? disponible / total : 1;
  const out = [];
  let t = ini;
  for (let i = 0; i < n; i++) {
    let v = i === 0 ? t : Math.round(t * 2) / 2;
    if (i > 0 && v <= out[i - 1]) v = out[i - 1] + 0.5;
    out.push(v);
    t += necesita[i] * f;
  }
  return out;
}

/* Normaliza para comparar con la cita literal: quita las marcas de énfasis y los signos
   que solo son de maquetación (comillas de voz en off y separador de líneas). */
export function normalizar(s) {
  return String(s || "")
    .replace(/\*/g, "")
    .replace(/[«»]/g, "")
    .replace(/\s*·\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Comprobaciones que no necesitan pantalla: tiempos, ritmo de lectura, contraste, estado y cita. */
export function analizar(guion, comp) {
  const spb = 60 / guion.tempo.bpm;
  const L = guion.lectura;
  const planos = planosConTiempos(comp, guion);
  const filas = [];
  const globales = [];
  const total = planos.reduce((a, p) => a + p.pulsos, 0);
  if (total !== guion.tempo.pulsos_totales) globales.push({ nivel: "error", texto: `Los planos suman ${total} pulsos y el guion declara ${guion.tempo.pulsos_totales}.` });
  if (planos.length !== 10) globales.push({ nivel: "error", texto: `Hay ${planos.length} planos; deben ser 10.` });
  const ids = new Set();

  for (const iv of guion.intervenciones) {
    const p = planos[iv.plano - 1];
    const avisos = [];
    const fila = { iv, plano: p, avisos, activa: iv.activo !== false };
    filas.push(fila);
    if (ids.has(iv.id)) avisos.push({ nivel: "error", texto: "Identificador repetido." });
    ids.add(iv.id);
    if (!p) {
      avisos.push({ nivel: "error", texto: `El plano ${iv.plano} no existe.` });
      continue;
    }
    const entra = primeraEntrada(iv);
    const sale = ultimaSalida(iv, p.pulsos);
    fila.entra = entra;
    fila.sale = sale;
    fila.t0 = p.t0 + entra * spb;
    fila.t1 = p.t0 + sale * spb;
    fila.dur = fila.t1 - fila.t0;
    fila.texto = textoPlano(iv.bloques);
    fila.chars = fila.texto.length;
    fila.palabras = fila.texto ? fila.texto.split(" ").length : 0;
    fila.lectura = DE_LECTURA.includes(iv.tipo);
    fila.bloquesEn = tiemposBloques(iv, p.pulsos, guion);
    fila.cps = fila.dur > 0 ? fila.chars / fila.dur : Infinity;
    const est = guion.estilos[iv.tipo === "narrador" && iv.variante === "voz" ? "narrador_voz" : iv.tipo] || {};
    fila.estilo = est;

    if (entra < 0 || sale > p.pulsos + 1e-9 || entra >= sale) avisos.push({ nivel: "error", texto: `Entra en ${entra} y sale en ${sale}; el plano dura ${p.pulsos} pulsos.` });
    if (!guion.estados[iv.estado]) avisos.push({ nivel: "error", texto: `Estado desconocido: ${iv.estado}.` });
    if (!fila.chars && fila.activa) avisos.push({ nivel: "aviso", texto: "Hueco vacío: no se dibuja nada." });

    if (fila.lectura && fila.chars && fila.activa) {
      if (fila.dur < L.minimo_s) avisos.push({ nivel: "error", texto: `En pantalla ${fila.dur.toFixed(2)} s; el mínimo es ${L.minimo_s} s.` });
      if (fila.cps > L.cps_maximo) avisos.push({ nivel: "error", texto: `No da tiempo a leerlo: ${fila.cps.toFixed(1)} caracteres por segundo (máximo ${L.cps_maximo}).` });
      else if (fila.cps > L.cps_comodo) avisos.push({ nivel: "aviso", texto: `Lectura rápida: ${fila.cps.toFixed(1)} caracteres por segundo (cómodo hasta ${L.cps_comodo}).` });
      // El último bloque también necesita su tiempo
      const ult = iv.bloques.length - 1;
      const queda = (sale - fila.bloquesEn[ult]) * spb;
      const cpsUlt = textoPlano(iv.bloques[ult]).length / Math.max(0.01, queda);
      if (iv.bloques.length > 1 && cpsUlt > L.cps_maximo) avisos.push({ nivel: "error", texto: `El último bloque solo está ${queda.toFixed(2)} s en pantalla (${cpsUlt.toFixed(1)} caracteres por segundo).` });
      if (est.tam && est.tam < L.tam_minimo_px) avisos.push({ nivel: "error", texto: `Letra de ${est.tam} px; el mínimo es ${L.tam_minimo_px} px.` });
    }

    // Estado y procedencia
    const f = iv.fuente || {};
    if (iv.estado === "borrador") {
      fila.literal = null;
    } else {
      if (!f.archivo || !f.cita) avisos.push({ nivel: "error", texto: "No es borrador, así que necesita archivo de origen y cita literal." });
      const texto = normalizar(fila.texto);
      const cita = normalizar(f.cita);
      if (iv.estado === "juego_fragmento") {
        const lit = normalizar(iv.literal);
        if (!lit) avisos.push({ nivel: "error", texto: "Un fragmento necesita el campo 'literal'." });
        else if (!cita.includes(lit)) avisos.push({ nivel: "error", texto: "El fragmento no está dentro de la cita original." });
        else if (texto !== lit) avisos.push({ nivel: "error", texto: "El texto ya no coincide con el fragmento literal: márcalo como BORRADOR o restaura la cita." });
      } else if (texto !== cita) {
        avisos.push({ nivel: "error", texto: "El texto ya no coincide con la cita literal: márcalo como BORRADOR o restaura la cita." });
      }
    }
  }

  // Textos de lectura que se pisan en el tiempo dentro de un mismo plano
  for (const p of planos) {
    const fs = filas.filter((f) => f.plano === p && f.lectura && f.activa && f.chars).sort((a, b) => a.entra - b.entra);
    for (let i = 1; i < fs.length; i++) {
      const prev = fs[i - 1];
      const necesita = prev.chars / L.cps_maximo / spb;
      const libre = Math.min(prev.sale, prev.entra + necesita);
      if (fs[i].entra < libre - 1e-9) {
        fs[i].avisos.push({ nivel: "aviso", texto: `Entra ${((libre - fs[i].entra) * spb).toFixed(2)} s antes de que dé tiempo a leer «${prev.iv.id}».` });
      }
    }
    // Orden de lectura dentro del plano
    const orden = filas.filter((f) => f.plano === p && f.activa).sort((a, b) => a.entra - b.entra);
    orden.forEach((f, i) => (f.orden = i + 1));
  }

  const cuenta = { error: 0, aviso: 0 };
  for (const f of filas) for (const a of f.avisos) cuenta[a.nivel]++;
  for (const a of globales) cuenta[a.nivel]++;
  const porEstado = {};
  for (const f of filas) if (f.activa) porEstado[f.iv.estado] = (porEstado[f.iv.estado] || 0) + 1;
  return { planos, filas, globales, cuenta, porEstado, duracion: total * spb, spb };
}
