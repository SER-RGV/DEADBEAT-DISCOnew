/* DEADBEAT DISCO · Motion comic · creación de elementos. */

const SVGNS = "http://www.w3.org/2000/svg";

export function crear(tag, cls, padre) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (padre) padre.appendChild(e);
  return e;
}

export function crearSvg(tag, attrs, padre) {
  const e = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (padre) padre.appendChild(e);
  return e;
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escaparHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/* Marca de énfasis del guion: *así* → <em>así</em>. */
export const marcado = (s) => escaparHtml(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");
