/* === MODIFICACIÓN PRIORITARIA:INICIO · MÓDULO «LEGIBILIDAD Y GEOGRAFÍA DEL HUB» =====
   A–F autorizados el 2026-11-04 tras la auditoría visual T01–T08.

   PRINCIPIO: NO se añade nada. Se ordena, atenúa, ancla, recorta y conecta lo
   que ya existe. Cero assets nuevos, cero props nuevos, cero sistemas nuevos,
   cero cambios de cámara, motor, Director, combate, progresión ni audio.
   La transición sigue siendo `startCampaignFromHub(0)` + T07/T08, SIN segunda
   transición y SIN puerta nueva.

   Reversible con `window.__DDM_HUB_LEGIBILIDAD === false`:
     * se restauran `style.opacity`, `CFG.grade/grain` y `prop.hidden`;
     * los envoltorios delegan íntegramente en los pintores T01–T09;
     * `clipCutaway()` devuelve false y T08 usa su trayectoria original.

   Respeta `__DDM_HUB_T07`, `__DDM_HUB_T08`, `__DDM_HUB_T09` y `Yc.reduced`.
   El módulo se inserta DENTRO de `initDmoHubV35()` para poder envolver las
   funciones ya existentes de ese mismo ámbito (`drawHubFloorLayer`,
   `drawPixelNeonBanner`, `drawDiegeticSign`, `zf`) sin reescribir el motor.
   ================================================================================ */
const LEG = (function () {
  const VER = '1.0.0-legibilidad';
  /* A · niebla y redundancia (valores medidos en la prueba visual P1/P2) */
  const BLOOM = 0.30, VIG = 0.45, GRADE = 0.35, GRAIN = 0.006;
  const HIDE = [
    'hub_decor_t06_10', 'hub_decor_t06_06_rep1', 'hub_decor_t06_06_rep2',
    'hub_decor_t06_07_rep1', 'hub_decor_t06_07_rep2', 'hub_decor_planter_v02',
    'hub_decor_bench_v02', 'hub_decor_speaker_w', 'hub_decor_speaker_e'
  ];
  /* Geografía existente T07 que se REUTILIZA, no se sustituye */
  const CX = 1250, LIP_Y = 1470, MOUTH_Y = 1420, ABYSS_Y = 1585;

  const S = {
    enabled: window.__DDM_HUB_LEGIBILIDAD !== false,
    installed: false, wrappers: 0, draws: 0, screenDraws: 0, clips: 0,
    frames: 0, lastOn: null, worldTr: null, liftSign: null,
    hidden: 0, atmosApplied: false,
    bannersHidden: 0, signsHidden: 0, errors: [], lastError: ''
  };
  const saved = { bloom: null, vig: null, grade: null, grain: null };
  let bound = null, savedHidden = [];

  function note(tag, e) {
    try {
      const m = tag + ': ' + String((e && (e.message || e)) || e);
      S.errors.push(m); if (S.errors.length > 24) S.errors.shift(); S.lastError = m;
    } catch (_) {}
  }
  function on() { return S.enabled && window.__DDM_HUB_LEGIBILIDAD !== false; }
  function geoOn() {
    return on() && window.__DDM_HUB_T07 !== false && window.__DDM_HUB_T08 !== false;
  }
  function openness() {
    try {
      const t = window.DMO_HUB_T08 && window.DMO_HUB_T08.state();
      return Math.max(0, Math.min(1, (Number(t && t.expand) || 0) / 260));
    } catch (e) { return 0; }
  }
  function props() {
    /* `tc` es el array VIVO que recorre Lc; DMO_LAYOUT.propObjects() es un clon. */
    try { if (typeof tc !== 'undefined' && Array.isArray(tc)) return tc; } catch (e) {}
    return [];
  }

  /* ---- A1–A3 · atmósfera (guarda y restaura estado original) ---------------- */
  function applyAtmos() {
    if (S.atmosApplied) return;
    try {
      const bl = document.getElementById('ilt-atmos-bloom');
      const vg = document.getElementById('ilt-atmos-vig');
      if (bl) { saved.bloom = bl.style.opacity; bl.style.opacity = String(BLOOM); }
      if (vg) { saved.vig = vg.style.opacity; vg.style.opacity = String(VIG); }
      const cfg = window.DMO_ATMOS && window.DMO_ATMOS.config;
      if (cfg) {
        saved.grade = cfg.grade; saved.grain = cfg.grain;
        cfg.grade = GRADE; cfg.grain = GRAIN;
      }
      S.atmosApplied = true;
    } catch (e) { note('atmos/apply', e); }
  }
  function restoreAtmos() {
    if (!S.atmosApplied) return;
    try {
      const bl = document.getElementById('ilt-atmos-bloom');
      const vg = document.getElementById('ilt-atmos-vig');
      if (bl && saved.bloom !== null) bl.style.opacity = saved.bloom;
      if (vg && saved.vig !== null) vg.style.opacity = saved.vig;
      const cfg = window.DMO_ATMOS && window.DMO_ATMOS.config;
      if (cfg) {
        if (saved.grade !== null) cfg.grade = saved.grade;
        if (saved.grain !== null) cfg.grain = saved.grain;
      }
    } catch (e) { note('atmos/restore', e); }
    saved.bloom = saved.vig = saved.grade = saved.grain = null;
    S.atmosApplied = false;
  }

  /* ---- A4/C5 · visibilidad reversible de props (ninguno se elimina) --------- */
  function releaseProps() {
    for (let i = 0; i < savedHidden.length; i++) {
      const r = savedHidden[i];
      try { if (r.had) r.p.hidden = r.v; else delete r.p.hidden; } catch (e) {}
    }
    savedHidden.length = 0; bound = null; S.hidden = 0;
  }
  function syncProps() {
    const list = props();
    if (list === bound) return;
    releaseProps();
    bound = list;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (!p || HIDE.indexOf(p.id) < 0) continue;
      savedHidden.push({ p: p, v: p.hidden, had: Object.prototype.hasOwnProperty.call(p, 'hidden') });
      p.hidden = true;
    }
    S.hidden = savedHidden.length;
  }
  function sync() {
    if (on()) { applyAtmos(); syncProps(); }
    else { restoreAtmos(); releaseProps(); }
  }

  /* ---- B1 · jerarquía del suelo: el patrón se atenúa fuera de la pista ------
     Se dibuja en Wf, ANTES de props/NPC/jugador: nadie pierde contraste.
     El medallón queda intacto (el velo empieza en y=1080 con alfa 0). */
  function floorVeil(c) {
    c.save();
    c.globalCompositeOperation = 'source-over';
    const south = c.createLinearGradient(0, 1080, 0, 1585);
    south.addColorStop(0.00, 'rgba(3,4,12,0)');
    south.addColorStop(0.48, 'rgba(3,4,12,0.16)');
    south.addColorStop(0.78, 'rgba(3,4,12,0.34)');
    south.addColorStop(1.00, 'rgba(3,4,12,0.46)');
    c.fillStyle = south; c.fillRect(290, 1080, 1920, 505);
    const west = c.createLinearGradient(290, 0, 790, 0);
    west.addColorStop(0, 'rgba(3,4,12,0.26)'); west.addColorStop(1, 'rgba(3,4,12,0)');
    c.fillStyle = west; c.fillRect(290, 560, 500, 900);
    const east = c.createLinearGradient(1710, 0, 2210, 0);
    east.addColorStop(0, 'rgba(3,4,12,0)'); east.addColorStop(1, 'rgba(3,4,12,0.26)');
    c.fillStyle = east; c.fillRect(1710, 560, 500, 900);
    c.restore();
  }

  /* ---- C1/C3 · anclaje: sombra de contacto, SIN estirar ni rotar ilustraciones */
  function contact(c, x, y, rx, ry) {
    c.save();
    for (let k = 0; k < 3; k++) {
      c.globalAlpha = 0.20 - k * 0.055;
      c.fillStyle = '#02030a';
      c.beginPath();
      c.ellipse(x, y + k * 2, rx * (1 + k * 0.16), ry * (1 + k * 0.30), 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  function anchors(c) {
    contact(c, 1250, 462, 168, 20);   /* cabina DJ / muro norte */
    contact(c, 590, 866, 128, 18);    /* mostrador arsenal */
    contact(c, 1910, 866, 132, 18);   /* barra */
    contact(c, 785, 560, 96, 14);     /* sofá VIP NO */
    contact(c, 1715, 560, 96, 14);    /* sofá VIP NE */
    contact(c, 655, 1224, 104, 16);   /* altares arcade */
    contact(c, 1845, 1224, 96, 16);   /* espejo de los sellos */
    /* C2 · el gran abanico dorado del arsenal competía con el mostrador.
       Se atenúa con oclusión local (NO se reescala ni se estira el asset
       T04, para no modificar T01–08) y se ancla al mostrador con su sombra. */
    c.save();
    const occ = c.createRadialGradient(590, 905, 30, 590, 905, 250);
    occ.addColorStop(0, 'rgba(3,4,12,0.34)');
    occ.addColorStop(0.62, 'rgba(3,4,12,0.20)');
    occ.addColorStop(1, 'rgba(3,4,12,0)');
    c.fillStyle = occ;
    c.fillRect(340, 760, 500, 290);
    c.restore();
  }

  function jag(x) {
    return LIP_Y - 12 + 8 * Math.sin(x * 0.021) + 5 * Math.sin(x * 0.057 + 1.3)
           + 3 * Math.sin(x * 0.133 + 0.6);
  }
  function halfWidth(open) { return 150 + 40 * open; }

  /* ---- D6/E3 · acento cian continuo desde la pista hasta la boca.
     Reutiliza el color de la estación `lift`; no crea HUD ni flechas. */
  function signal(c) {
    c.save();
    const path = c.createLinearGradient(0, 1190, 0, MOUTH_Y);
    path.addColorStop(0, 'rgba(34,211,238,0)');
    path.addColorStop(0.55, 'rgba(34,211,238,0.10)');
    path.addColorStop(1, 'rgba(34,211,238,0.20)');
    c.fillStyle = path;
    c.beginPath();
    c.moveTo(CX - 118, 1190); c.lineTo(CX + 118, 1190);
    c.lineTo(CX + 52, MOUTH_Y); c.lineTo(CX - 52, MOUTH_Y);
    c.closePath(); c.fill();
    c.restore();
  }

  /* Escalera de caracol descendente: mismo lenguaje que el fallback v7.7
     (escalones oscuros con filo cian), reutilizado SIN nuevo asset. */
  function spiral(c, y0, y1, rad0, rad1) {
    for (let k = 15; k >= 0; k--) {
      const u = k / 15;
      const ang = k * 0.62 + 0.4;
      const rad = rad0 + (rad1 - rad0) * (1 - u);
      const sx = CX + Math.cos(ang) * rad * 0.86;
      const sy = y0 + (y1 - y0) * u + Math.sin(ang) * rad * 0.26;
      const sw = 26 + (1 - u) * 26;
      c.globalAlpha = 0.95;
      c.fillStyle = k > 9 ? '#241a3f' : '#33265a';
      c.fillRect(Math.round(sx - sw / 2), Math.round(sy), sw, 10);
      c.fillStyle = '#22d3ee';
      c.globalAlpha = 0.42 + 0.26 * (1 - u);
      c.fillRect(Math.round(sx - sw / 2), Math.round(sy), sw, 2);
    }
    c.globalAlpha = 1;
  }

  /* ---- D1/D3/D4/D5 · la grieta pasa a ser GEOGRAFÍA: boca, grosor,
     profundidad, escalera y luz inferior. Se dibuja en Wf (por DEBAJO de
     props y jugador) para que el panel «III · DESCENSO» siga en primer plano. */
  function chasm(c, open) {
    const half = halfWidth(open);
    const topY = MOUTH_Y - 18 * open;
    c.save();
    c.globalCompositeOperation = 'source-over';
    c.beginPath();
    c.moveTo(CX - half * 0.94, topY);
    c.lineTo(CX - half * 1.02, topY + 46);
    c.lineTo(CX - half * 1.12, LIP_Y + 6);
    c.lineTo(CX - half * 1.34, ABYSS_Y);
    c.lineTo(CX - half * 1.52, ABYSS_Y + 150);
    c.lineTo(CX + half * 1.52, ABYSS_Y + 150);
    c.lineTo(CX + half * 1.34, ABYSS_Y);
    c.lineTo(CX + half * 1.12, LIP_Y + 6);
    c.lineTo(CX + half * 1.02, topY + 46);
    c.lineTo(CX + half * 0.94, topY);
    c.closePath();
    const hole = c.createLinearGradient(0, topY, 0, ABYSS_Y + 150);
    hole.addColorStop(0.00, '#04030b');
    hole.addColorStop(0.42, 'rgba(7,5,17,0.98)');
    hole.addColorStop(0.78, 'rgba(12,6,20,0.96)');
    hole.addColorStop(1.00, 'rgba(28,10,18,0.92)');
    c.fillStyle = hole; c.fill();
    c.strokeStyle = 'rgba(126,74,168,0.22)'; c.lineWidth = 4; c.stroke();
    c.save();
    c.clip();
    for (const s of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const y = topY + 24 + i * 34;
        const hw = half * (0.72 + i * 0.105);
        c.globalAlpha = 0.34 - i * 0.02;
        c.fillStyle = i % 3 === 0 ? '#7c3a2e' : '#241a3f';
        c.beginPath();
        c.moveTo(CX + s * hw, y);
        c.lineTo(CX + s * (hw + 26), y + 9);
        c.lineTo(CX + s * (hw + 12), y + 21);
        c.closePath(); c.fill();
      }
    }
    spiral(c, topY + 56, ABYSS_Y + 90, 96, 26);
    const glow = c.createRadialGradient(CX, 1630, 6, CX, 1630, 210);
    glow.addColorStop(0, 'rgba(251,146,60,0.32)');
    glow.addColorStop(0.5, 'rgba(34,211,238,0.10)');
    glow.addColorStop(1, 'rgba(2,3,10,0)');
    c.globalAlpha = 1; c.fillStyle = glow;
    c.fillRect(CX - 220, 1500, 440, 280);
    c.restore();
    c.restore();
  }

  /* ---- C4/D2/E1 · labio rocoso irregular con sombra de caída.
     Se dibuja en zf (DESPUÉS del borde neón recto de la arquitectura, pero
     ANTES del HUD) para SUSTITUIR la línea magenta por geografía con grosor.
     Después se reabre la boca con `mouthCut` para que el hueco la atraviese. */
  function lip(c) {
    c.save();
    c.globalCompositeOperation = 'source-over';
    const x0 = 300, x1 = 2200;
    c.beginPath();
    c.moveTo(x0, jag(x0));
    for (let x = x0 + 20; x <= x1; x += 20) c.lineTo(x, jag(x));
    c.lineTo(x1, jag(x1));
    c.lineTo(x1, 1532); c.lineTo(x0, 1532);
    c.closePath();
    const face = c.createLinearGradient(0, 1450, 0, 1532);
    face.addColorStop(0.00, 'rgba(26,16,40,0.97)');
    face.addColorStop(0.34, 'rgba(12,8,24,0.95)');
    face.addColorStop(1.00, 'rgba(4,3,12,0.88)');
    c.fillStyle = face; c.fill();
    /* estratos: reutiliza el lenguaje rocoso de T07, sin asset nuevo */
    for (let i = 0; i < 4; i++) {
      c.globalAlpha = 0.16 - i * 0.025;
      c.strokeStyle = i % 2 ? '#7c3a2e' : '#6d28d9';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, 1482 + i * 14);
      for (let x = x0 + 30; x <= x1; x += 30) {
        c.lineTo(x, 1482 + i * 14 + Math.sin(x * 0.018 + i) * 3);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    /* sombra de caída + filo iluminado: grosor legible del borde */
    c.save();
    c.beginPath();
    c.moveTo(x0, jag(x0));
    for (let x = x0 + 20; x <= x1; x += 20) c.lineTo(x, jag(x));
    c.lineWidth = 9; c.globalAlpha = 0.20;
    c.strokeStyle = '#02030a'; c.translate(0, 10); c.stroke();
    c.restore();
    c.beginPath();
    c.moveTo(x0, jag(x0));
    for (let x = x0 + 20; x <= x1; x += 20) c.lineTo(x, jag(x));
    c.lineWidth = 3; c.strokeStyle = 'rgba(244,114,182,0.36)'; c.stroke();
    c.restore();
  }

  /* Reabre el hueco por encima de la capa del labio: el terreno TERMINA
     aquí y la escalera baja hacia la luz inferior. */
  function mouthCut(c, open) {
    const half = halfWidth(open);
    /* Borde IRREGULAR (no recto): 9 vértices por lado con perturbación fija. */
    const L = [], R = [];
    for (let i = 0; i <= 9; i++) {
      const u = i / 9;
      const y = 1442 + u * 220;
      const hw = half * (0.98 + 0.40 * u) + Math.sin(i * 2.7 + 0.6) * 11 * u;
      L.push([CX - hw, y]); R.push([CX + hw, y]);
    }
    c.save();
    c.globalCompositeOperation = 'source-over';
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < L.length; i++) c.lineTo(L[i][0], L[i][1]);
    for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath();
    const hole = c.createLinearGradient(0, 1442, 0, 1662);
    hole.addColorStop(0.00, '#04030b');
    hole.addColorStop(0.55, 'rgba(7,5,17,0.98)');
    hole.addColorStop(1.00, 'rgba(30,10,18,0.94)');
    c.fillStyle = hole; c.fill();
    c.save(); c.clip();
    /* paredes rocosas con grosor, mismas tonalidades de T07/T08 */
    for (const s of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        const u = i / 8, y = 1458 + u * 196;
        const hw = half * (1.00 + 0.36 * u);
        c.globalAlpha = 0.34 - u * 0.16;
        c.fillStyle = i % 3 === 0 ? '#7c3a2e' : '#241a3f';
        c.beginPath();
        c.moveTo(CX + s * hw, y);
        c.lineTo(CX + s * (hw + 30), y + 12);
        c.lineTo(CX + s * (hw + 14), y + 26);
        c.closePath(); c.fill();
      }
    }
    spiral(c, 1470, 1620, 88, 22);
    /* luz cálida de las profundidades: ya usada por T07 en (1250,1630) */
    const glow = c.createRadialGradient(CX, 1630, 6, CX, 1630, 230);
    glow.addColorStop(0, 'rgba(251,146,60,0.46)');
    glow.addColorStop(0.45, 'rgba(34,211,238,0.10)');
    glow.addColorStop(1, 'rgba(2,3,10,0)');
    c.globalAlpha = 1; c.fillStyle = glow;
    c.fillRect(CX - 230, 1480, 460, 260);
    c.restore();
    /* filos de roca: acento, NO contorno de pegatina */
    for (const edge of [L, R]) {
      c.beginPath();
      c.moveTo(edge[0][0], edge[0][1]);
      for (let i = 1; i < edge.length; i++) c.lineTo(edge[i][0], edge[i][1]);
      c.globalAlpha = 0.30; c.lineWidth = 3;
      c.strokeStyle = 'rgba(168,85,247,0.42)'; c.stroke();
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function worldCorrection() {
    if (!geoOn()) return;
    try {
      if (typeof hub === 'undefined' || !hub.inHub) return;
      const c = g, open = openness();
      /* Guardamos el transform de MUNDO real de este fotograma: zf se ejecuta
         con setTransform(identidad), así que el labio necesita esta matriz. */
      try { S.worldTr = c.getTransform(); } catch (e) {}
      c.save();              /* usa el transform de cámara REAL, sin modificarlo */
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      floorVeil(c);
      anchors(c);
      signal(c);
      chasm(c, open);
      c.restore();
      S.draws++;
    } catch (e) { note('world', e); }
  }

  function screenCorrection(tr) {
    if (!geoOn()) return;
    try {
      if (typeof hub === 'undefined' || !hub.inHub) return;
      const c = g, open = openness();
      /* zf trabaja en espacio de PANTALLA (identidad). Se recupera la matriz
         de mundo capturada en Wf; si falta, se reconstruye de la cámara real. */
      let m = S.worldTr;
      if (!m && tr && Math.abs(tr.a - 1) > 0.001) m = tr;
      if (!m) {
        const cm = cam(), W = c.canvas ? c.canvas.width : 1280,
              H = c.canvas ? c.canvas.height : 900;
        m = { a: cm.zoom, b: 0, c: 0, d: cm.zoom,
              e: W * 0.5 - cm.zoom * cm.x, f: H * 0.5 - cm.zoom * cm.y };
      }
      c.save();
      c.setTransform(m);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      lip(c);
      mouthCut(c, open);
      /* E4 · el cartel de la grieta se repinta ENCIMA del labio con sus
         argumentos reales (prompt, color y estado «cerca» del motor),
         para que no desaparezca ni se duplique el texto. */
      const quiet = (function () {
        try { return !(floorDropAnim && floorDropAnim.active) && !hub.cineActive; }
        catch (e) { return true; }
      })();
      if (quiet && S.liftSign && API.__orig_drawDiegeticSign) {
        API.__orig_drawDiegeticSign.apply(c, S.liftSign);
      }
      c.restore();
      S.screenDraws++;
    } catch (e) { note('screen', e); }
  }

  /* ---- E1 · el cutaway T08 nace del HUECO, no de una línea horizontal fija.
     Se engancha con 2 inserciones (0 eliminaciones) en `drawCutaway()`.
     Con flag=false devuelve false y T08 usa su trayectoria ORIGINAL. */
  function clipCutaway(c, q) {
    if (!geoOn()) return false;
    try {
      const W = q.W, H = q.H, T = q.T, cm = q.cm, open = q.de.open || 0;
      const cx = W * 0.5 + cm.zoom * (CX - cm.x);
      const yTop = Math.min(T, 450 + cm.zoom * (MOUTH_Y - cm.y));
      const halfTop = (118 + 62 * open) * cm.zoom;
      const halfBot = W * 0.31;
      const edges = [];
      for (let i = 0; i <= 9; i++) {
        const u = i / 9;
        const y = yTop + (H + 20 - yTop) * u;
        const hw = halfTop + (halfBot - halfTop) * Math.pow(u, 0.72);
        edges.push([y, hw, Math.sin(i * 2.31 + 0.7) * 9 * u]);
      }
      c.beginPath();
      c.moveTo(cx - edges[0][1], edges[0][0]);
      for (let i = 1; i < edges.length; i++) c.lineTo(cx - edges[i][1] + edges[i][2], edges[i][0]);
      for (let i = edges.length - 1; i >= 0; i--) c.lineTo(cx + edges[i][1] + edges[i][2], edges[i][0]);
      c.closePath(); c.clip();
      S.clips++;
      return true;
    } catch (e) { note('clip', e); return false; }
  }

  /* ---- B3 · una etiqueta por POI (sin borrar ningún asset) ------------------ */
  function hideBanner(text) {
    if (!on()) return false;
    if (String(text).indexOf('CÍRCULOS · DESCENSO') >= 0) { S.bannersHidden++; return true; }
    return false;
  }
  function hideSign(text, activeNear) {
    if (!on()) return false;
    /* El rótulo «LA DISCOTECA · DJ STAGE» y la placa «II · CABINA DJ» ya
       identifican la cabina; se retira sólo el cartel pasivo «ZONA B».
       El prompt de interacción ([E/A]) se conserva al acercarse. */
    if (String(text).indexOf('CABINA · VIRGILIO') >= 0 && !activeNear) {
      S.signsHidden++; return true;
    }
    return false;
  }

  /* ---- Envoltorios sobre funciones YA existentes del mismo ámbito -----------
     No se usa eval: las funciones están declaradas en initDmoHubV35(), el
     mismo ámbito léxico de este módulo, y sus enlaces son reasignables. */
  function install() {
    if (S.installed) return false;
    S.installed = true;
    const API = window.DMO_HUB_LEGIBILIDAD;
    API.__orig_drawPixelNeonBanner = drawPixelNeonBanner;
    API.__orig_drawDiegeticSign = drawDiegeticSign;
    API.__orig_drawHubFloorLayer = drawHubFloorLayer;
    drawPixelNeonBanner = function () {
      if (hideBanner(arguments[1])) return;
      return API.__orig_drawPixelNeonBanner.apply(this, arguments);
    };
    drawDiegeticSign = function () {
      if (on() && String(arguments[0]).indexOf('GRIETA DE DESCENSO') >= 0) {
        S.liftSign = Array.prototype.slice.call(arguments);
      }
      if (hideSign(arguments[0], arguments[5])) return;
      return API.__orig_drawDiegeticSign.apply(this, arguments);
    };
    drawHubFloorLayer = function () {
      const r = API.__orig_drawHubFloorLayer.apply(this, arguments);
      worldCorrection();
      return r;
    };
    /* zf se monta DESPUÉS de T08.install(): el labio y la boca quedan por
       ENCIMA del borde neón y del cutaway, pero DEBAJO del HUD de V3.5. */
    const prevZf = zf;
    zf = function () {
      let tr = null;
      try { tr = g.getTransform(); } catch (e) {}
      const r = prevZf.apply(this, arguments);
      if (tr) screenCorrection(tr);
      return r;
    };
    S.wrappers = 4;
    /* Un único acumulador Tf: reenganche perezoso de props y estado del flag. */
    const prevTf = Tf;
    Tf = function (dt) {
      const r = prevTf.apply(this, arguments);
      try {
        S.frames++;
        if ((S.frames & 15) === 0 || on() !== S.lastOn) {
          S.lastOn = on(); sync();
        } else if (on() && bound !== props()) sync();
      } catch (e) { note('update', e); }
      return r;
    };
    sync();
    return true;
  }

  function snapshot() {
    const bl = document.getElementById('ilt-atmos-bloom');
    const vg = document.getElementById('ilt-atmos-vig');
    const cfg = (window.DMO_ATMOS && window.DMO_ATMOS.config) || {};
    return JSON.parse(JSON.stringify({
      version: VER, enabled: S.enabled,
      flag: window.__DDM_HUB_LEGIBILIDAD === false ? 'OFF' : 'ON',
      installed: S.installed, wrappers: S.wrappers, frames: S.frames,
      draws: S.draws, screenDraws: S.screenDraws, clips: S.clips,
      hidden: S.hidden, atmosApplied: S.atmosApplied,
      bannersHidden: S.bannersHidden, signsHidden: S.signsHidden,
      bloom: bl ? bl.style.opacity : null, vig: vg ? vg.style.opacity : null,
      grade: cfg.grade, grain: cfg.grain,
      props: props().length, hiddenIds: HIDE.slice(),
      t07: window.__DDM_HUB_T07 !== false, t08: window.__DDM_HUB_T08 !== false,
      t09: window.__DDM_HUB_T09 !== false,
      errors: S.errors.slice(), lastError: S.lastError,
      noNewAssets: true, noNewProps: true, cameraTouched: false,
      progressionTouched: false, audioTouched: false
    }));
  }

  const API = {
    version: VER,
    state: snapshot, audit: snapshot, debug: snapshot,
    setEnabled: function (v) { S.enabled = !!v; sync(); return S.enabled; },
    install: install,
    clipCutaway: clipCutaway,
    hideBanner: hideBanner,
    hideSign: hideSign,
    S: S
  };
  if (window.__DDM_HUB_LEGIBILIDAD === undefined) window.__DDM_HUB_LEGIBILIDAD = true;
  window.DMO_HUB_LEGIBILIDAD = API;
  return API;
})();
/* === MODIFICACIÓN PRIORITARIA:FIN · MÓDULO ==================================== */
