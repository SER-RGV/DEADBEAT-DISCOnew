/* FASE 08 · pruebas de la cámara dinámica (src/dd_camera.js) y del perfil de
   escala (src/dd_world_scale.js). Se ejecutan con:  node --test tests/world_scale
   Sin navegador: los módulos se cargan en Node (module.exports). */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const SCALE = require("../../src/dd_world_scale.js");
const CAM = require("../../src/dd_camera.js");

const VIEW = { viewW: 1920, viewH: 1080 };
const ROOM = { x: 490, y: 335, w: 1520, h: 1180 };
const WORLD = { worldW: 2500, worldH: 1850 };
const DT = 1 / 60;

function baseInput(over) {
  return Object.assign({ px: 1250, py: 925, vx: 0, vy: 0, aim: 0, camX: 1250, camY: 925, zoom: 0.8,
    room: ROOM, enemies: [], boss: null, roomKey: "r1", running: true, dying: false }, VIEW, WORLD, over || {});
}
function run(frames, mk, state) {
  let cam = state || { x: 1250, y: 925, zoom: 0.8 };
  const rows = [];
  for (let i = 0; i < frames; i++) {
    const inp = mk(i, cam);
    inp.camX = cam.x; inp.camY = cam.y; inp.zoom = cam.zoom;
    const out = CAM.step(DT, inp);
    cam = { x: out.x, y: out.y, zoom: out.zoom };
    rows.push(Object.assign({ px: inp.px, py: inp.py }, out));
  }
  return rows;
}

/* 1. mundo → pantalla */
test("worldToScreen reproduce la transformación del motor (translate(view/2)·scale·translate(-cam))", () => {
  const cam = { x: 1250, y: 925, zoom: 0.98, viewW: 1920, viewH: 1080 };
  const p = CAM.worldToScreen(1250, 925, cam);
  assert.deepEqual([p.x, p.y], [960, 540]);
  const q = CAM.worldToScreen(1250 + 100, 925 - 50, cam);
  assert.ok(Math.abs(q.x - (960 + 98)) < 1e-9 && Math.abs(q.y - (540 - 49)) < 1e-9);
});

/* 2. pantalla → mundo (misma fórmula que Gu del motor) e inversa exacta */
test("screenToWorld es la inversa de worldToScreen en las tres resoluciones", () => {
  for (const [w, h] of [[1920, 1080], [1600, 900], [1280, 720]]) {
    const cam = { x: 1111.5, y: 777.25, zoom: CAM.zoomForViewport(0.98, h, 1080), viewW: w, viewH: h };
    for (const [wx, wy] of [[0, 0], [1250, 925], [2500, 1850], [333.3, 1601.7]]) {
      const s = CAM.worldToScreen(wx, wy, cam);
      const b = CAM.screenToWorld(s.x, s.y, cam);
      assert.ok(Math.abs(b.x - wx) < 1e-6 && Math.abs(b.y - wy) < 1e-6, `${w}x${h} ${wx},${wy}`);
    }
    // fórmula de Gu: B+(n-y/2)/i
    const m = CAM.screenToWorld(100, 200, cam);
    assert.ok(Math.abs(m.x - (cam.x + (100 - w / 2) / cam.zoom)) < 1e-9);
    assert.ok(Math.abs(m.y - (cam.y + (200 - h / 2) / cam.zoom)) < 1e-9);
  }
});

/* 3. seguimiento */
test("la cámara sigue al jugador: converge sin sobrepasar y acaba dentro de la zona muerta", () => {
  CAM.reset();
  let px = 1250;
  const open = { room: null, worldW: 10000, worldH: 10000 };
  const rows = run(240, (i) => { if (i < 120) px += 3.5; return baseInput(Object.assign({ px: px, vx: i < 120 ? 210 : 0, aim: 0 }, open)); });
  const last = rows[rows.length - 1];
  const dz = CAM.config().deadzoneFrac * 1920 / last.zoom;
  // en reposo, la cámara queda delante del jugador (anticipación por puntería) y a menos de zona muerta + anticipación
  assert.ok(Math.abs(last.x - px) <= dz + CAM.config().leadAim + 1, `offset final ${Math.abs(last.x - px)}`);
  // nunca se adelanta más allá del objetivo (sin oscilación): la posición de cámara es monótona creciente mientras el jugador avanza
  for (let i = 2; i < 120; i++) assert.ok(rows[i].x >= rows[i - 1].x - 1e-6, `retrocede en el cuadro ${i}`);
});

test("anticipación: mira hacia la puntería y la velocidad pero con tope (fracción del ancho visible)", () => {
  CAM.reset();
  const rows = run(180, () => baseInput({ vx: 400, vy: 0, aim: 0 }));
  const last = rows[rows.length - 1];
  const leadMax = CAM.config().leadMaxFrac * 1920 / last.zoom;
  assert.ok(last.leadX > 20, "debe anticipar hacia la derecha");
  assert.ok(Math.hypot(last.leadX, last.leadY) <= leadMax + 1e-6, "anticipación acotada");
});

/* 4. límites de zoom */
test("el zoom queda siempre entre zoomMin y zoomMax escalados por la altura de la ventana", () => {
  const c = CAM.config();
  for (const [w, h] of [[1920, 1080], [1600, 900], [1280, 720]]) {
    CAM.reset();
    const zs = h / 1080;
    const many = Array.from({ length: 30 }, (_, i) => ({ x: 1250 + Math.cos(i) * 300, y: 925 + Math.sin(i) * 300 }));
    const rows = run(600, (i) => baseInput({ viewW: w, viewH: h, enemies: i < 200 ? [] : many, boss: i > 400 ? { x: 1700, y: 925, h: 243 } : null }), { x: 1250, y: 925, zoom: 0.8 * zs });
    for (const r of rows) {
      assert.ok(r.zoom >= c.zoomMin * zs - 1e-9 && r.zoom <= c.zoomMax * zs + 1e-9, `${w}x${h} zoom ${r.zoom}`);
    }
    // nunca más lejos que la build anterior (0,8 a 1080p)
    assert.ok(Math.min(...rows.map(r => r.zoom)) >= 0.8 * zs - 1e-9);
  }
});

test("zoomForViewport conserva el campo vertical: 1080 px de mundo visibles a zoom 1 en cualquier altura", () => {
  for (const h of [1080, 900, 720]) {
    const z = CAM.zoomForViewport(1.0, h, 1080);
    assert.ok(Math.abs(h / z - 1080) < 1e-9);
  }
});

/* 5. estabilidad del encuadre */
test("histéresis: pequeñas variaciones de amenaza no cambian el objetivo de zoom", () => {
  CAM.reset();
  const two = [{ x: 1400, y: 925 }, { x: 1100, y: 925 }];
  const three = two.concat([{ x: 1250, y: 1100 }]);
  let flips = 0, prev = null;
  run(600, (i) => {
    const inp = baseInput({ enemies: (Math.floor(i / 20) % 2) ? three : two });
    return inp;
  }).forEach(r => { if (prev !== null && Math.abs(r.zoomTarget - prev) > 1e-9) flips++; prev = r.zoomTarget; });
  assert.ok(flips <= 1, `el objetivo cambió ${flips} veces alternando 2↔3 enemigos`);
});

test("el zoom cambia despacio: tasa máxima zoomRate por segundo y sin saltos", () => {
  CAM.reset();
  const many = Array.from({ length: 12 }, (_, i) => ({ x: 1250 + Math.cos(i) * 250, y: 925 + Math.sin(i) * 250 }));
  const rows = run(400, (i) => baseInput({ enemies: i < 120 ? [] : many }));
  const rate = CAM.config().zoomRate;
  for (let i = 2; i < rows.length; i++) {
    const dz = Math.abs(rows[i].zoom - rows[i - 1].zoom);
    assert.ok(dz <= rate * DT + 1e-9, `salto de zoom ${dz} en el cuadro ${i}`);
  }
  assert.ok(rows[rows.length - 1].zoom < rows[100].zoom, "con multitud el zoom se aleja");
});

test("zona segura: con el jugador corriendo a tope (sin paredes), nunca pasa de safeFrac del semiancho", () => {
  CAM.reset();
  let px = 600;
  const rows = run(300, () => { px += 6; return baseInput({ px: px, vx: 360, aim: 0, room: null, worldW: 10000, worldH: 10000 }); });
  const c = CAM.config();
  for (const r of rows) {
    const half = 1920 * 0.5 / r.zoom;
    assert.ok(Math.abs(r.px - r.x) <= c.safeFrac * half + 1e-6, `jugador a ${Math.abs(r.px - r.x)} del centro`);
  }
});

test("recorte a la sala: pegado a una pared el jugador sigue en pantalla (la pared manda sobre la zona segura, nunca se enseña vacío)", () => {
  CAM.reset();
  const big = { x: 260, y: 185, w: 1980, h: 1480 };
  let px = 1250;
  const rows = run(400, () => { px = Math.min(2240 - 14, px + 5); return baseInput({ px: px, vx: 300, aim: 0, room: big }); });
  const c = CAM.config();
  for (const r of rows) {
    const half = 1920 * 0.5 / r.zoom;
    assert.ok(Math.abs(r.px - r.x) < half - 20, "jugador fuera de pantalla");
    assert.ok(r.x + half <= big.x + big.w + c.roomMargin.right + 1e-6, "se ve más allá de la franja de muro");
  }
});

test("sin vibración: con el jugador quieto la cámara no se mueve", () => {
  CAM.reset();
  const rows = run(120, () => baseInput({}));
  for (let i = 30; i < rows.length; i++) {
    assert.ok(Math.abs(rows[i].x - rows[i - 1].x) < 0.01 && Math.abs(rows[i].y - rows[i - 1].y) < 0.01);
  }
});

/* 8. límites de habitaciones */
test("recorte a la sala: con sala más pequeña que la vista se centra; si es mayor, nunca enseña más que la franja de muro", () => {
  const small = { x: 820, y: 575, w: 860, h: 700 };
  const b = CAM.roomBounds(small, { w: 2500, h: 1850 }, CAM.config().roomMargin);
  const c1 = CAM.clampCenterToBounds(100, 100, 960 / 0.8, 540 / 0.8, b);
  assert.ok(Math.abs(c1.x - (b.x0 + b.x1) / 2) < 1e-9 && Math.abs(c1.y - (b.y0 + b.y1) / 2) < 1e-9);
  const big = { x: 260, y: 185, w: 1980, h: 1480 };
  const b2 = CAM.roomBounds(big, { w: 2500, h: 1850 }, CAM.config().roomMargin);
  const halfW = 960 / 1.08, halfH = 540 / 1.08;
  const c2 = CAM.clampCenterToBounds(0, 0, halfW, halfH, b2);
  assert.ok(c2.x - halfW >= b2.x0 - 1e-9 && c2.y - halfH >= b2.y0 - 1e-9);
  const c3 = CAM.clampCenterToBounds(9999, 9999, halfW, halfH, b2);
  assert.ok(c3.x + halfW <= b2.x1 + 1e-9 && c3.y + halfH <= b2.y1 + 1e-9);
  // y nunca fuera del mundo
  assert.ok(b2.x0 >= 0 && b2.y0 >= 0 && b2.x1 <= 2500 && b2.y1 <= 1850);
});

/* 10. transiciones */
test("cambio de sala o teletransporte: la cámara se recoloca de golpe (sin barrido largo) y resetea la anticipación", () => {
  CAM.reset();
  run(60, () => baseInput({ vx: 300, aim: 0, roomKey: "a" }));
  const after = CAM.step(DT, baseInput({ px: 700, py: 500, camX: 1250, camY: 925, zoom: 0.9, roomKey: "b" }));
  assert.equal(after.snap, true);
  // sin arrastre de la anticipación anterior (≈110 px corriendo): sólo la de puntería en reposo (14 px)
  assert.ok(Math.abs(after.leadX) <= 14 + 1e-9 && Math.abs(after.leadY) <= 14 + 1e-9, `lead ${after.leadX},${after.leadY}`);
  assert.ok(Math.abs(after.x - 700) < 1920);
  const tele = CAM.step(DT, baseInput({ px: 1900, py: 1400, camX: after.x, camY: after.y, zoom: after.zoom, roomKey: "b" }));
  assert.equal(tele.snap, true, "un salto de más de snapDist también recoloca");
  const normal = CAM.step(DT, baseInput({ px: 1903, py: 1400, camX: tele.x, camY: tele.y, zoom: tele.zoom, roomKey: "b" }));
  assert.equal(normal.snap, false);
});

/* 9. proyectiles / simulación: la cámara no toca el estado físico */
test("step() no muta la entrada (posiciones, enemigos, jefe) y es independiente de la simulación", () => {
  CAM.reset();
  const enemies = Object.freeze([Object.freeze({ x: 1400, y: 925 })]);
  const boss = Object.freeze({ x: 1700, y: 925, h: 243 });
  const inp = Object.freeze(baseInput({ enemies: enemies, boss: boss, room: Object.freeze(Object.assign({}, ROOM)) }));
  assert.doesNotThrow(() => CAM.step(DT, inp));
  // una bala sigue en el mismo sitio del mundo sea cual sea la cámara: sólo cambia dónde se pinta
  const bullet = { x: 1300, y: 900 };
  const camA = { x: 1250, y: 925, zoom: 0.8, viewW: 1920, viewH: 1080 };
  const camB = { x: 1400, y: 1000, zoom: 1.05, viewW: 1920, viewH: 1080 };
  const a = CAM.screenToWorld(CAM.worldToScreen(bullet.x, bullet.y, camA).x, CAM.worldToScreen(bullet.x, bullet.y, camA).y, camA);
  const b = CAM.screenToWorld(CAM.worldToScreen(bullet.x, bullet.y, camB).x, CAM.worldToScreen(bullet.x, bullet.y, camB).y, camB);
  assert.ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9);
});

/* encuentro con jefe */
test("con jefe: el zoom se aleja hasta encuadrar a jugador y jefe y el encuadre se desplaza hacia el jefe", () => {
  CAM.reset();
  const arena = { x: 260, y: 185, w: 1980, h: 1480 };
  const rows = run(600, (i) => baseInput({ room: arena, boss: i > 60 ? { x: 1250 + 700, y: 925, h: 243 } : null }));
  const last = rows[rows.length - 1];
  assert.ok(last.zoom <= CAM.config().bossMin + 1e-3, `zoom con jefe ${last.zoom}`);
  assert.ok(last.x > 1250 + 20, "el encuadre se desplaza hacia el jefe");
  const half = 1920 * 0.5 / last.zoom;
  assert.ok(Math.abs(1950 - last.x) < half && Math.abs(1250 - last.x) < half, "jugador y jefe dentro del ancho visible");
});

/* perfil de escala */
test("perfil intermedia: factores dentro de los rangos aprobados y hitboxes fuera de su alcance", () => {
  const d = SCALE.describe();
  assert.equal(d.profile, "intermedia");
  assert.ok(d.player >= 1.15 && d.player <= 1.25);
  for (const f of ["security", "dancer"]) assert.ok(d.enemy[f] >= 0.95 && d.enemy[f] <= 1.15, f);
  for (const f of ["fanatic", "drone"]) assert.ok(d.enemy[f] >= 0.85 && d.enemy[f] <= 1.05, f);
  assert.ok(d.enemy.chef >= 1.35 && d.enemy.chef <= 1.60);
  assert.ok(d.enemy.elite >= 1.40 && d.enemy.elite <= 1.80);
  assert.ok(d.pickup >= 1.10 && d.pickup <= 1.20);
  assert.ok(d.room.combat >= 1.15 && d.room.combat <= 1.40);
  assert.ok(d.room.boss >= 1.40 && d.room.boss <= 1.60);
  // el perfil no define nada de colisión
  for (const k of Object.keys(SCALE.profiles.intermedia)) assert.ok(!/hit|hurt|radius|reach|speed/i.test(k), k);
});

test("salas: el factor por función respeta los topes del motor (1980×1480) y los múltiplos de 20", () => {
  const s1 = SCALE.scaledRoomSize(1440, 980, { index: 3, slot: 3 });
  assert.equal(s1.cls, "combat");
  assert.equal(s1.w, 20 * Math.round(1440 * 1.18 / 20));
  const s2 = SCALE.scaledRoomSize(1480, 1040, { index: 10, slot: 10, boss: true });
  assert.equal(s2.cls, "boss");
  assert.ok(s2.w <= 1980 && s2.h <= 1480 && s2.w % 20 === 0 && s2.h % 20 === 0);
  const s3 = SCALE.scaledRoomSize(1600, 820, { index: 0, slot: 0, first: true });
  assert.equal(s3.cls, "entrance");
  assert.equal(SCALE.scaledRoomSize(1040, 780, { shop: true }).w, 1040);
  assert.equal(SCALE.roomClass({ slot: 5, boss: true }), "miniboss");
});

test("perfil legacy: todo a 1 y cámara desactivada", () => {
  const ok = SCALE.setProfile("legacy");
  assert.equal(ok, true);
  assert.equal(SCALE.player, 1);
  assert.equal(SCALE.enemyScale("chef", true), 1);
  assert.equal(SCALE.bossScale("boss_09_nucleo"), 1);
  assert.equal(CAM.isActive(), false);
  assert.equal(SCALE.scaledRoomSize(1440, 980, { slot: 3 }).w, 1440);
  SCALE.setProfile("intermedia");
  assert.equal(CAM.isActive(), true);
});
