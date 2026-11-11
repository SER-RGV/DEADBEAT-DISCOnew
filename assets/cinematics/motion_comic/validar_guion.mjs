#!/usr/bin/env node
/* DEADBEAT DISCO · Motion comic · validador del guion.

   Uso (desde cualquier carpeta):
     node assets/cinematics/motion_comic/validar_guion.mjs            informe en texto
     node assets/cinematics/motion_comic/validar_guion.mjs --json     informe en JSON
     node assets/cinematics/motion_comic/validar_guion.mjs otro.json  valida otro guion (p. ej. uno descargado)

   Comprueba, sin navegador:
     1. duración total, número de planos y tiempos de cada texto (mismas reglas que la vista previa);
     2. el estado de cada texto: un LITERAL coincide con su cita; un ADAPTADO guarda el pasaje que adapta
        (fuente.cita) y coincide con el texto del encargo (fuente.fijado); una PROPUESTA explica en
        fuente.nota qué propone y, si viene del encargo, coincide con fuente.fijado;
     3. que cada cita existe, letra por letra, en el archivo del repositorio que se indica como fuente
        (para la biblia narrativa: fuentes/biblia_extractos.md).
     4. que cada recurso de composicion.json existe en disco; que cada recurso nuevo ("nuevo": true) está
        dentro de arte_nuevo/ y aparece en arte_nuevo/MANIFIESTO.md; y que todo plano que usa un recurso
        nuevo lleva su sello de arte;
     5. que el guion no usa las frases que la biblia o el encargo reservan para otros momentos del juego.
   Lo que depende del dibujo en pantalla (tamaño de letra, solapes, colas) solo lo comprueba la vista previa.
   Termina con código 1 si hay errores. No escribe ni modifica ningún archivo. */

import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analizar, NOMBRE_ESTADO, NOMBRE_TIPO } from "./js/guion.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../../..");
const args = process.argv.slice(2);
const enJson = args.includes("--json");
const rutaGuion = args.find((a) => !a.startsWith("--")) || path.join(AQUI, "data/guion.json");

const leerJson = async (r) => JSON.parse(await readFile(r, "utf8"));
const guion = await leerJson(rutaGuion);
const comp = await leerJson(path.join(AQUI, "data/composicion.json"));

const an = analizar(guion, comp);
const errores = [];
const avisos = [];
for (const g of an.globales) (g.nivel === "error" ? errores : avisos).push({ id: "(general)", texto: g.texto });
for (const f of an.filas) for (const a of f.avisos) (a.nivel === "error" ? errores : avisos).push({ id: f.iv.id, texto: a.texto });

if (Math.abs(an.duracion - 45) > 1e-6) errores.push({ id: "(general)", texto: `La duración es ${an.duracion.toFixed(3)} s y debe ser 45,000 s.` });
if (an.planos.length !== 10) errores.push({ id: "(general)", texto: `Hay ${an.planos.length} planos y deben ser 10.` });

/* Citas contra los archivos del repositorio. */
const cache = new Map();
async function contenido(rel) {
  if (!cache.has(rel)) {
    const abs = path.resolve(RAIZ, rel);
    if (!abs.startsWith(RAIZ + path.sep)) cache.set(rel, null);
    else cache.set(rel, await readFile(abs, "utf8").catch(() => null));
  }
  return cache.get(rel);
}
const escapeJs = (s) => s.replace(/[^\x20-\x7e]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

const citas = [];
async function comprobarCita(id, fuente, obligatoria) {
  if (!fuente || !fuente.cita) return;
  if (!fuente.archivo) {
    (obligatoria ? errores : avisos).push({ id, texto: "La cita no indica en qué archivo está." });
    return;
  }
  const txt = await contenido(fuente.archivo);
  if (txt === null) {
    (obligatoria ? errores : avisos).push({ id, texto: `No se puede leer la fuente «${fuente.archivo}».` });
    citas.push({ id, archivo: fuente.archivo, cita: fuente.cita, veces: null });
    return;
  }
  const veces = txt.split(fuente.cita).length - 1 || txt.split(escapeJs(fuente.cita)).length - 1;
  citas.push({ id, archivo: fuente.archivo, cita: fuente.cita, veces });
  if (!veces) (obligatoria ? errores : avisos).push({ id, texto: `La cita «${fuente.cita}» no aparece en «${fuente.archivo}».` });
}
for (const iv of guion.intervenciones) await comprobarCita(iv.id, iv.fuente, iv.estado !== "borrador");
for (const [i, fr] of ((guion.banco_de_alternativas || {}).frases || []).entries()) await comprobarCita(`banco_de_alternativas[${i}]`, fr, true);

/* Recursos: existencia, manifiesto del arte nuevo y sellos. */
const recursos = comp.recursos || {};
const existe = (r) => access(r).then(() => true, () => false);
const manifiesto = await readFile(path.join(AQUI, "arte_nuevo/MANIFIESTO.md"), "utf8").catch(() => null);
const nuevos = [];
let recursosComprobados = 0;
for (const [id, rec] of Object.entries(recursos)) {
  if (!rec || typeof rec !== "object" || !rec.src) continue;
  recursosComprobados++;
  if (!(await existe(path.resolve(AQUI, rec.src)))) errores.push({ id: `recursos.${id}`, texto: `No existe el archivo «${rec.src}».` });
  if (rec.nuevo) {
    nuevos.push(id);
    const nombre = path.basename(rec.src);
    if (!rec.src.startsWith("arte_nuevo/")) errores.push({ id: `recursos.${id}`, texto: "Un recurso nuevo tiene que estar en arte_nuevo/, separado del arte original." });
    if (manifiesto === null) errores.push({ id: `recursos.${id}`, texto: "Falta arte_nuevo/MANIFIESTO.md." });
    else if (!manifiesto.includes(nombre)) errores.push({ id: `recursos.${id}`, texto: `«${nombre}» no aparece en arte_nuevo/MANIFIESTO.md.` });
  }
}
/* Recursos que usa cada plano (arte, actores y efectos), buscados por nombre en su definición. */
const sellosArte = [];
for (const p of comp.planos || []) {
  const usados = new Set();
  JSON.stringify(p, (k, v) => {
    if (typeof v === "string" && recursos[v] && recursos[v].src && k !== "id" && k !== "tipo") usados.add(v);
    return v;
  });
  const usaNuevo = [...usados].filter((id) => recursos[id].nuevo);
  const lista = !p.provisional ? [] : Array.isArray(p.provisional) ? p.provisional : [p.provisional];
  for (const pv of lista) sellosArte.push({ plano: p.n, tipo: pv.tipo === "nuevo" ? "nuevo" : "provisional", motivo: pv.motivo || "" });
  if (usaNuevo.length && !lista.length) errores.push({ id: p.id, texto: `Usa arte nuevo sin aprobar (${usaNuevo.join(", ")}) y no lleva sello de arte.` });
  for (const pv of lista) if (!pv.motivo) avisos.push({ id: p.id, texto: "El sello de arte no explica su motivo." });
}

/* Frases reservadas: no pueden aparecer en la introducción (encargo 0.3.1 y biblia §29.5). */
const RESERVADAS = ["Solo una más", "Este no estaba en la mezcla", "No eres una visita", "Bienvenido al Refugio", "nueve círculos"];
const plano = (t) => String(t || "").replace(/\*/g, "").toLowerCase();
for (const iv of guion.intervenciones) {
  if (iv.activo === false) continue;
  const t = plano((iv.bloques || []).join(" "));
  for (const fr of RESERVADAS) if (t.includes(fr.toLowerCase())) errores.push({ id: iv.id, texto: `Usa la frase reservada «${fr}», que no puede aparecer en la introducción.` });
}

const resumen = {
  recursos_comprobados: recursosComprobados,
  recursos_nuevos: nuevos,
  sellos_de_arte: sellosArte,
  guion: path.relative(process.cwd(), rutaGuion) || rutaGuion,
  duracion_s: an.duracion,
  planos: an.planos.length,
  bpm: guion.tempo.bpm,
  textos_activos: an.filas.filter((f) => f.activa).length,
  por_estado: an.porEstado,
  citas_comprobadas: citas.length,
  citas_encontradas: citas.filter((c) => c.veces).length,
  errores,
  avisos,
};

if (enJson) {
  console.log(JSON.stringify({ ...resumen, citas, filas: an.filas.map((f) => ({ id: f.iv.id, plano: f.plano.n, tipo: f.iv.tipo, estado: f.iv.estado, activa: f.activa, t0: f.t0, t1: f.t1, texto: f.texto, cps: f.cps })) }, null, 2));
} else {
  const s = (x) => x.toFixed(2).padStart(6);
  console.log(`Guion: ${resumen.guion}`);
  console.log(`Duración ${an.duracion.toFixed(3)} s · ${an.planos.length} planos · ${guion.tempo.bpm} pulsos por minuto · ${resumen.textos_activos} textos activos`);
  console.log("Estados: " + Object.entries(an.porEstado).map(([k, v]) => `${NOMBRE_ESTADO[k] || k} ${v}`).join(" · "));
  console.log("");
  for (const p of an.planos) {
    console.log(`Plano ${String(p.n).padStart(2, "0")} · ${p.nombre} · de ${s(p.t0)} a ${s(p.t1)} s`);
    for (const f of an.filas.filter((x) => x.plano.n === p.n)) {
      const vel = f.cps && Number.isFinite(f.cps) && f.lectura !== false && f.cps > 0 ? ` · ${f.cps.toFixed(1)} car/s` : "";
      console.log(`   ${f.activa ? " " : "×"} ${s(f.t0)}-${s(f.t1)}  ${(NOMBRE_TIPO[f.iv.tipo] || f.iv.tipo).padEnd(16)} ${(NOMBRE_ESTADO[f.iv.estado] || f.iv.estado).padEnd(20)} ${f.texto}${vel}`);
    }
  }
  console.log("");
  console.log(`Citas: ${resumen.citas_encontradas} de ${resumen.citas_comprobadas} encontradas en su archivo de origen.`);
  for (const c of citas.filter((x) => !x.veces)) console.log(`   falta: ${c.id} · «${c.cita}» en ${c.archivo}`);
  console.log(`Recursos: ${recursosComprobados} comprobados en disco · ${nuevos.length} nuevos sin aprobar (${nuevos.join(", ") || "ninguno"}).`);
  console.log(`Sellos de arte: ${sellosArte.filter((x) => x.tipo === "nuevo").length} planos con «ARTE NUEVO · SIN APROBAR» (${sellosArte.filter((x) => x.tipo === "nuevo").map((x) => x.plano).join(", ") || "ninguno"}) · ${sellosArte.filter((x) => x.tipo === "provisional").length} con «ARTE PROVISIONAL».`);
  console.log(`Errores: ${errores.length}`);
  for (const e of errores) console.log(`   ${e.id}: ${e.texto}`);
  console.log(`Avisos: ${avisos.length}`);
  for (const a of avisos) console.log(`   ${a.id}: ${a.texto}`);
}
process.exit(errores.length ? 1 : 0);
