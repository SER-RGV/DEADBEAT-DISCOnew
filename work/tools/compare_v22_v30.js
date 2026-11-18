/* ==========================================================================
   Montaje comparativo V2.2 vs V3.0 (entregable 10 de la directiva §11)

   Las dos versiones se renderizan en el MISMO banco, con el MISMO registro de
   recursos, el MISMO tamaño y la MISMA máquina. Lo único que cambia es el
   módulo de la cinemática: `src/dd_opening.js` (V3.0) frente al de `2739f59`
   (V2.2), extraído a un archivo temporal para no tocar el árbol de trabajo.

   No es una comparación de fotogramas equivalentes en tiempo —las dos
   versiones no duran lo mismo ni cuentan lo mismo en el mismo segundo— sino
   de ESTRUCTURA: cada acto de V2.2 contra el acto de V3.0 que ocupa su lugar
   en el relato. Los instantes están elegidos uno a uno por lo que se ve.

     node work/tools/compare_v22_v30.js
   ========================================================================== */
const path = require('path');
const fs = require('fs');
const H = require('./harness.js');
const { createCanvas } = require('/tmp/cvtest/node_modules/@napi-rs/canvas');

const V22 = process.env.DD_V22 || '/tmp/dd_opening_v22.js';
const OUT = path.join(H.ROOT, 'work', 'compare');
fs.mkdirSync(OUT, { recursive: true });

/* Cada fila es un momento del relato. `v22` y `v30` son instantes de cada
   versión; el rótulo dice qué se está comparando, no un número de plano. */
const ROWS = [
  { id: 'acto_I_fiesta',   label: 'Acto I · la celebración',      v22: [2.0],  v30: [2.0]  },
  { id: 'acto_I_cancion',  label: 'Acto I · una canción más',     v22: [6.0],  v30: [10.5] },
  { id: 'acto_II_bucle',   label: 'Acto II · la repetición',      v22: [11.0], v30: [16.0] },
  { id: 'acto_II_desafinado', label: 'Acto II · el que no se repite', v22: [17.5], v30: [23.5] },
  { id: 'acto_III_torre',  label: 'Acto III · la torre reacciona', v22: [24.0], v30: [35.0] },
  /* El golpe en V3.0 son los PIES y el mecanismo circular abriéndose (plano
     09). A 40,0 s aún se ve la sala entera con la figura pequeña; el
     contrapicado de botas y grietas llega al final del plano (medido: 42,0 s). */
  { id: 'acto_III_golpe',  label: 'Acto III · el golpe',           v22: [29.0], v30: [42.0] },
  { id: 'acto_IV_caida',   label: 'Acto IV · la caída',            v22: [33.0], v30: [50.0] },
  { id: 'acto_V_llegada',  label: 'Acto V · el aterrizaje',        v22: [39.5], v30: [61.5] },
];

async function renderVersion(openingPath, times) {
  const sb = H.boot({ w: 960, h: 540, dpr: 1, withWorld: true, openingPath });
  await H.start(sb, 'intro', 0);
  const frames = [];
  for (const t of times) {
    sb.op.debugSeek(t, true);
    /* dos fotogramas de asentado: el primero tras el salto puede llevar
       todavía el estado de interpolación anterior */
    sb.op.debugSeek(t, true);
    frames.push(H.capture(sb, 'cmp_' + String(t).replace('.', '_'), 1));
  }
  return { sb, frames };
}

(async function () {
  if (!fs.existsSync(V22)) {
    console.error('Falta el módulo de V2.2 en', V22);
    process.exit(1);
  }
  const t22 = ROWS.map((r) => r.v22[0]);
  const t30 = ROWS.map((r) => r.v30[0]);

  const A = await renderVersion(V22, t22);
  const B = await renderVersion(path.join(H.ROOT, 'src', 'dd_opening.js'), t30);
  console.log('V2.2 cargadas', A.sb.loaded.length, 'ausentes', A.sb.missing.length, '| dur', A.sb.op.INTRO_DURATION);
  console.log('V3.0 cargadas', B.sb.loaded.length, 'ausentes', B.sb.missing.length, '| dur', B.sb.op.INTRO_DURATION);

  /* ---- montaje ---- */
  const gap = 10, head = 104, capH = 30, foot = 52;
  const tw = 560, th = Math.round(tw * 9 / 16);
  const W = gap + tw + gap + tw + gap;
  const HGT = head + ROWS.length * (th + capH + gap) + foot;
  const cv = createCanvas(W, HGT);
  const g = cv.getContext('2d');

  g.fillStyle = '#0B0812'; g.fillRect(0, 0, W, HGT);

  const { loadImage } = require('/tmp/cvtest/node_modules/@napi-rs/canvas');
  g.fillStyle = '#F5E6D6';
  g.font = 'bold 30px sans-serif';
  g.fillText('DEADBEAT DISCO · la apertura, V2.2 frente a V3.0', gap, 40);
  g.font = '16px sans-serif';
  g.fillStyle = '#9b8fa8';
  g.fillText('Mismo banco, mismo registro de recursos, misma máquina. Sólo cambia el módulo de la cinemática.', gap, 66);

  /* Las dos columnas se miden antes de escribir la segunda: con un
     desplazamiento fijo de 96 px, «V2.2 · 42 s» y su subtítulo se pisaban. */
  const colHead = (x, txt, sub) => {
    g.font = 'bold 19px sans-serif'; g.fillStyle = '#FFB000';
    g.fillText(txt, x, 92);
    const w = g.measureText(txt).width;
    g.font = '14px sans-serif'; g.fillStyle = '#8a7f96';
    g.fillText(sub, x + w + 16, 92);
  };
  colHead(gap, 'V2.2 · 42 s', '8 planos · 5 actos');
  colHead(gap + tw + gap, 'V3.0 · 70 s', '14 planos · 5 actos');

  let y = head;
  for (let i = 0; i < ROWS.length; i++) {
    const r = ROWS[i];
    const a = await loadImage(A.frames[i]);
    const b = await loadImage(B.frames[i]);
    g.drawImage(a, gap, y, tw, th);
    g.drawImage(b, gap + tw + gap, y, tw, th);
    /* separador entre versiones */
    g.fillStyle = 'rgba(255,45,122,0.20)';
    g.fillRect(gap + tw + Math.floor(gap / 2), y, 1, th);

    g.font = 'bold 15px sans-serif'; g.fillStyle = '#F5E6D6';
    g.fillText(r.label, gap, y + th + 20);
    g.font = '13px sans-serif'; g.fillStyle = '#7e7389';
    g.fillText(r.v22[0].toFixed(1) + ' s', tw - 26, y + th + 20);
    g.fillText(r.v30[0].toFixed(1) + ' s', gap + tw + gap + tw - 26, y + th + 20);
    y += th + capH + gap;
  }

  g.font = '13px sans-serif'; g.fillStyle = '#6f6579';
  g.fillText('V2.2 usa 8 planos y entrega en el menú. V3.0 usa 14 planos y entrega el control en el Refugio real.', gap, HGT - 34);
  g.fillText('Los instantes no buscan equivalencia temporal, sino de lugar en el relato.', gap, HGT - 16);

  const file = path.join(OUT, 'comparativa_v22_v30.jpg');
  fs.writeFileSync(file, cv.toBuffer('image/jpeg', 86));
  console.log('montaje', file, W + 'x' + HGT);
})().catch((e) => { console.error(e); process.exit(1); });
