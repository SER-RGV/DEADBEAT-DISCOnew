const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("/tmp/audit_canvas/node_modules/@napi-rs/canvas");

(async () => {
  const outDir = "/tmp/audit_captures";
  const manifest = JSON.parse(fs.readFileSync("assets/manifest.json", "utf8"));
  const diskImages = {};
  for (const [id, meta] of Object.entries(manifest.entries)) {
    const cleanSrc = meta.src.split("?")[0];
    if (fs.existsSync(cleanSrc)) {
      try { diskImages[id] = await loadImage(cleanSrc); } catch (e) {}
    }
  }

  const c = createCanvas(2560, 1820);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#06020c";
  ctx.fillRect(0, 0, 2560, 1820);
  ctx.fillStyle = "#ff2d95";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("AUDITORÍA DE SOBERANOS (11 JEFES × 4 ESTADOS + FASE 2), TANDA E01 (10 ARQUETIPOS) Y LA CABINA (SELECCIÓN DE ARMAS)", 28, 38);

  const bosses = [
    "boss_00_anden", "boss_01_magneta", "boss_02_bufe", "boss_03_cajero",
    "boss_04_pogo", "boss_05_oficiante", "boss_06_matarife", "boss_07_imitador",
    "boss_08_traidor", "boss_09_nucleo", "boss_10_arquitecto"
  ];
  const bStates = ["idle", "attack", "hit", "death"];

  for (let b = 0; b < bosses.length; b++) {
    const slug = bosses[b];
    const col = b % 4;
    const row = Math.floor(b / 4);
    const gx = 24 + col * 630;
    const gy = 58 + row * 390;
    ctx.fillStyle = "#120920";
    ctx.fillRect(gx, gy, 614, 374);
    ctx.strokeStyle = "#ff2d95";
    ctx.strokeRect(gx, gy, 614, 374);
    ctx.fillStyle = "#f6c453";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(slug.toUpperCase(), gx + 10, gy + 22);

    for (let s = 0; s < 4; s++) {
      const st = bStates[s];
      const id = `${slug}_${st}`;
      const im = diskImages[id];
      const sx = gx + 8 + s * 150;
      const sy = gy + 32;
      ctx.fillStyle = "#1c1030";
      ctx.fillRect(sx, sy, 144, 332);
      // Draw baseline
      ctx.strokeStyle = "rgba(34, 197, 94, 0.55)";
      ctx.beginPath(); ctx.moveTo(sx, sy + 298); ctx.lineTo(sx + 144, sy + 298); ctx.stroke();
      if (im) {
        const scale = Math.min(136 / im.width, 280 / im.height);
        const dw = im.width * scale;
        const dh = im.height * scale;
        ctx.drawImage(im, sx + (144 - dw) * 0.5, sy + 298 - dh, dw, dh);
      } else {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("N/A", sx + 55, sy + 160);
      }
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px sans-serif";
      ctx.fillText(st, sx + 6, sy + 322);
    }
  }

  // Slot 12 (row 2, col 3): Tanda E01 10 Enemies
  {
    const gx = 24 + 3 * 630;
    const gy = 58 + 2 * 390;
    ctx.fillStyle = "#120920";
    ctx.fillRect(gx, gy, 614, 374);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(gx, gy, 614, 374);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("TANDA E01 · 10 ARQUETIPOS ENEMIGOS (ART_ASSETS/tanda_E01/)", gx + 10, gy + 22);
    const e01Ids = Object.keys(diskImages).filter(k => k.startsWith("e01_enemy_") && !k.includes("atlas")).sort();
    for (let i = 0; i < e01Ids.length; i++) {
      const im = diskImages[e01Ids[i]];
      const ec = i % 5;
      const er = Math.floor(i / 5);
      const sx = gx + 10 + ec * 119;
      const sy = gy + 34 + er * 164;
      ctx.fillStyle = "#1c1030";
      ctx.fillRect(sx, sy, 113, 154);
      if (im) {
        ctx.drawImage(im, sx + 4, sy + 4, 105, 120);
      }
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "9px sans-serif";
      ctx.fillText(e01Ids[i].replace("e01_enemy_", ""), sx + 3, sy + 146);
    }
  }

  // Bottom strip: Weapon Selection UI (La Cabina) with 24 representative weapons + Phase-2 Bosses
  ctx.fillStyle = "#f6c453";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("LA CABINA · INTERFAZ DE SELECCIÓN DE ARMAS (24 ARMAS DE MUESTRA DE LAS 121) + SPRITES FASE 2 (ART_ASSETS/bosses/)", 28, 1254);

  const wIds = Object.keys(diskImages).filter(k => k.startsWith("weapon_")).sort();
  for (let i = 0; i < 24; i++) {
    const wid = wIds[Math.floor(i * (wIds.length / 24))];
    const im = diskImages[wid];
    const wc = i % 8;
    const wr = Math.floor(i / 8);
    const bx = 24 + wc * 212;
    const by = 1270 + wr * 174;
    ctx.fillStyle = "#120920";
    ctx.fillRect(bx, by, 202, 162);
    ctx.strokeStyle = i === 0 ? "#f6c453" : "#4c1d95";
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.strokeRect(bx, by, 202, 162);
    if (im) {
      ctx.drawImage(im, bx + 11, by + 16, 180, 90);
    }
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(wid.replace("weapon_", "").toUpperCase().slice(0, 22), bx + 8, by + 128);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "10px sans-serif";
    ctx.fillText(i === 0 ? "[EQUIPADA · NIVEL 1]" : "[DESBLOQUEADA · 250 CR]", bx + 8, by + 148);
  }

  // Right bottom: Phase 2 Bosses (ART_ASSETS/bosses/tanda_01 & tanda_02)
  const p2Ids = Object.keys(diskImages).filter(k => k.startsWith("phase2_boss_")).sort();
  for (let i = 0; i < Math.min(12, p2Ids.length); i++) {
    const pid = p2Ids[i];
    const im = diskImages[pid];
    const pc = i % 4;
    const pr = Math.floor(i / 4);
    const bx = 1732 + pc * 204;
    const by = 1270 + pr * 174;
    ctx.fillStyle = "#180b28";
    ctx.fillRect(bx, by, 194, 162);
    ctx.strokeStyle = "#ff2d95";
    ctx.strokeRect(bx, by, 194, 162);
    if (im) {
      const scale = Math.min(176 / im.width, 124 / im.height);
      const dw = im.width * scale;
      const dh = im.height * scale;
      ctx.drawImage(im, bx + (194 - dw) * 0.5, by + 8 + (124 - dh) * 0.5, dw, dh);
    }
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "9px sans-serif";
    ctx.fillText(pid.replace("phase2_boss_", "").slice(0, 25), bx + 6, by + 152);
  }

  fs.writeFileSync(path.join(outDir, "audit_04_bosses_all_states_and_weapons_ui.png"), c.toBuffer("image/png"));
  console.log("Saved audit_04_bosses_all_states_and_weapons_ui.png");
})();
