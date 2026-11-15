# SIGUIENTE TANDA: `T05_ARMAS` (TANDA 05 del pack 02–07) — ABIERTA

- **Estado (2026-11-15, 13.º tramo):** **99/105 verificadas en mano.** Turnos 1–9 COMPLETOS; turno 10 parcial 9/10
  (`c105_baston_de_viento`, arcos `c106`–`c110`, `c111_devoracaos`, `c112_harvester`, `c113_espada_de_energia`,
  `c114_espada_caos`; falta `c115_lanza_espectral` por cupo). Registro 376, caché `20261115.20`. Evidencias
  `evidence/T05_ARMAS/00–39`. **Último tramo:** `c115_lanza_espectral` (cls lanza, de serie) + turno 11
  (`c116_orbe_del_abismo`, `c117_bomba_flotante`, `c118_summon_infernal` — dispositivos/orbes: revisar `grip`/`grip_v` en la hoja —,
  `c119_dragon_espiritual` y `c120_director` — `xt` cadera → `player_firehip`, sin `sup`). Después: cierre de la tanda
  (`TANDA_05_INFORME.md`, CHECKPOINT, PLAN).
  **Arcos** (cls `arco`): contrato propio — lienzo **320×80** (4:1), `fit {contain, margin 6, anchor bottom}`, `spriteRot +1.5708`,
  hints `grip .35 grip_v .5 sup .37 sup_v .5`; prompt de arco de puente (puntas en los extremos, riser arriba, vientre hacia abajo,
  cuerda fina, sin flecha). Motivo: `it` dibuja el arco en una caja fija `x∈[14−0.65·wLen, 14+0.35·wLen]` respecto a la mano trasera
  de `player_fire2`, con `wLen = 65·(ancho/alto del lienzo)`; cuerda y flecha son procedurales (evidencias `39_turno13_arcos_*`).
- **Ficha:** [`batches/T05_ARMAS.json`](batches/T05_ARMAS.json) — contrato, renderer, 105 assets con prompt y
  `calibrate`, `generation_plan` de 11 turnos (≤10 por mensaje) y `generation_lessons`. Regenerable desde las tablas
  del motor con `/tmp/ddqa/t05/make_ficha.py` (volátil; si se pierde, la ficha ya contiene todo).
- **Flujo por turno (mecánico):**
  1. `generate_image` ×10 con el `prompt` de la ficha → `/home/user/dd_work/raw/T05_ARMAS/weapon_<id>.png`
     (los crudos salen ~1774×887 sobre croma verde plano; revisar la hoja `sheet.py` antes de seguir).
  2. `batch.py process T05_ARMAS.json --only … --no-sheet` → PNG 320×160 + maestro WebP + **anclas medidas**
     (`weapon_cal.py`: grip/axis/tip/sup) en el report.
  3. `batch.py calibrate … --overlay /tmp/ddqa/t05/cal_tN` → mirar la hoja: la mano (rojo) en la empuñadura, el
     apoyo (verde) bajo el guardamanos, el eje (amarillo) en el cañón. Ajustar `calibrate` de la ficha
     (`hang:false`, `grip`, `sup`, `axis_v`, `max_dev`) y repetir `calibrate` si hace falta.
  4. `batch.py register … --only …` → manifest.anchors; `python3 tools/build_active_html.py`.
  5. `node tools/art_master/probe_weapons.js /tmp/ddqa/t05/probe_tN --weapons=a,b,c --poses=quieto,der,arriba,izq,camina`
     (≈1 min por arma; una sola instancia de Chromium) → hoja de recortes → `evidence/T05_ARMAS/`.
  6. `batch.py mark … --evidence docs/ART_REBUILD/evidence/T05_ARMAS` → `audit` → `audit_report.py render` →
     actualizar ficha (`generation_plan[n].estado`), STATUS, CHECKPOINT, LOG → commit + push de la rama.
- **Cómo llega la calibración al juego:** `manifest.entries["weapon_<id>"].anchors` → puente
  `ddApplyWeaponCalibration` (`tools/build_active_html.py`) → `WEAPON_OVERRIDES[id]` (lo que lee el `it` del módulo
  v3.2) y `dt[id].hd` (ft/ddIsLongGun). `oriented:true` anula flipX/cropY/spriteRot heredados; los arcos llevan
  `spriteRot:1.5708` (tumbados, cuerda abajo). Ganchos QA nuevos: `__DD_BRIDGE.getWeaponCalibration(id)`,
  `applyWeaponCalibration(id)`, `getWeaponTelemetry()` (ut._gdb), `setDebugGrip(on)`, `buyOrEquipWeapon(id,true)`.
- **Alcance (plan §3 fila 05):** 105 armas sin sprite (las 16 B existentes no se tocan). Orden de turnos: escopetas
  16–24 → subfusiles/fusiles 25–36 → pesadas 37–48 → energía 49–60 → elementales 61–72 → especiales 73–84 →
  cuerpo a cuerpo 85–96 → míticas 97–120 (arcos 106–110 con `spriteRot`).

## Pendiente arrastrado

De T04 (escenarios): salas en L o en cruz sin franja de muro en los tramos horizontales interiores (geometría de
`buildHighResRoomCache`, no arte); neón del zorro flotando en salas sin franja visible (colocación del motor);
puertas del muro sur achatadas a 0,82 por `drawDoor`; `wall_panel_tall_neon` sin uso en el manifiesto.
Decisiones por defecto sin confirmar en `TANDA_04_INFORME.md` §7 (portal relicario = descenso; «VIP» con texto).

De R03 (jefes): muerte del Núcleo y del Arquitecto no visibles (pantalla final); destello de impacto que
vela la figura; balas de patrones y botín en pixel art (tandas 06–07); con el jefe final muerto, HUD y
diálogo por encima de la pantalla de fin de partida (visto una vez bajo la sonda).

De R01 (protagonista): armas pesadas con postura de cadera en todos los ángulos; vista lateral única
(`REF_06` pide 8 direcciones); pose de daño con arma larga apuntando abajo cruza hombro y cabeza.

De R02 (enemigos): vistos en juego en los círculos I, II, III, V y VIII (faltan IV, VI, VII y IX); un solo
fotograma por estado; proporciones cambiadas por el generador en `windup`/`attack` del Tanque y `death`
del Sprinter; balas enemigas en pixel art.

Defectos de juego anotados en `AUDITORIA_VISUAL.md` §7 y sin corregir (no son arte): armería vacía
(`"TODAS"` vs `"ALL"`), diálogo pegado, minimapa blanco, botón F9, panel «VARÍA TU DISPARO» congela.
