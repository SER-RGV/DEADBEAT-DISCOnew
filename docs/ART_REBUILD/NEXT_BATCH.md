# TANDA EN CURSO: `T06_OBJETOS` (TANDA 06 del pack 02–07) — ABIERTA 19/20 · siguiente: turno 3 (`relic_tempo`) y T07_HUD

- **Estado T06 (2026-11-15, turno 2):** 19/20 integrados y VERIFIED (caché `20261115.23`); inventario A25·B88·C0·D26·E243.
  Turno 2: `pickup_bomb_00`, `pickup_speedup_00`, `pickup_turret_00` + `relic_{needle,lowpass,magnet,pact,echo,coil,prism}`.
  Las reliquias NO son botín de suelo (`drawPickup` nunca las recibe): su consumidor real son las tarjetas del cofre
  (`#shot-choice-overlay .shot-card50 .shot-icon`) y la lista de pasivos de la pausa (`#rogue71-inventory .rogue71-items`);
  el bloque `1f` de `tools/build_active_html.py` sustituye el glifo por `relic_<id>` si existe (CSS `.dd-relic-icon` en
  `src/dd_rebuild_ui.css`). Evidencias `evidence/T06_OBJETOS/04_ingame_turno2_pickups_crop.jpg`, `06_relic_cofre_tarjetas.jpg`,
  `08_relic_pausa_lista_pasivos.jpg`, `09_hoja_turno2_procesados.jpg`, `t06_probe_turno2.json` (0 errores).
  **Turno 3:** `relic_tempo` (prompt en la ficha) → `batch.py process --only relic_tempo --no-sheet` → `register --only` → build →
  `node tools/art_master/probe_pickups.js OUT` (ya abre el cofre con `DMO.rogue.debug({action:"chest"})`+`{action:"open"}`, concede 6
  pasivos con `{action:"item",id}` y captura la lista de la pausa) → `mark --only --evidence` → `audit` → `render` → docs → commit.
  Nota: en headless el HUD queda tapado por `#dd-boot-frame.is-failed`/menú; la evidencia del HUD de reserva (corazón, escudo,
  moneda, habilidades) sigue pendiente de una captura manual.
- **Contrato de animación:** `python3 tools/art_master/anim_contract.py` regenera `ANIMATION_CONTRACT.json` (y `--check` valida
  R1–R4) tras cada `register` que toque figuras; `ANIMATION_CONTRACT.md` explica el modelo.
- **Estado T05 (2026-11-15):** `T05_ARMAS` **CERRADA 105/105** (14.º y último tramo: lanza espectral, orbe del abismo, bomba
  flotante, summon infernal, dragón espiritual y Director). Registro 382, caché `20261115.21`; inventario
  A25·B107·C0·D26·E224. Informe: [`TANDA_05_INFORME.md`](TANDA_05_INFORME.md); evidencias `evidence/T05_ARMAS/00–43`
  (`43_catalogo_105_sprites.jpg` = catálogo completo).
- **Alcance T06 (plan §3 fila 06):** los 20 PNG de `assets/pickups/` (12 `pickup_*_00`: ammo, bomb, boost, companion,
  credits, damageup, fireup, heart, mutation, shield, speedup, turret; 8 `relic_*`: coil, echo, lowpass, magnet, needle,
  pact, prism, tempo) en el estilo neón del pack. Ids existentes, mapeados en `src/dd_world_renderer.js` (~l.1592,
  por `kind`) y consultados también como *fallback* del HUD (`dd_ui_system.js`). **Sin código.** Lienzo actual 160×160,
  pivot center (TANDA_16); confirmar en el registro antes de fijar el contrato.
- **Cómo abrir:** 1) auditar en `AUDIT_INVENTORY.md` las 20 entradas (clase B) y cómo las dibuja `drawPickup`
  (escala, flotación, brillo); 2) crear `batches/T06_OBJETOS.json` con la estructura de `T05_ARMAS.json`
  (`contract`, `defaults`, `assets[].prompt`, `generation_plan` de 2 turnos de 10, `generation_lessons`); 3) flujo
  `generate_image` → `sheet.py` → `batch.py process --no-sheet` → `register --only` → `build_active_html.py` → sonda
  (adaptar `probe_enemies.js`: matar enemigos con `killAllEnemies` y capturar el botín; reliquias en la tienda con
  `DD_UI.openShop`) → `evidence/T06_OBJETOS/` → `mark` → `audit` → `render` → STATUS/CHECKPOINT/LOG → commit + push.
- **Después:** T07 HUD (~8 PNG: corazón lleno/vacío, escudo, 3 habilidades, moneda, emblema de victoria).

## Referencia T05 (cerrada): flujo de armas, por si hay que regenerar alguna

- **Ficha:** [`batches/T05_ARMAS.json`](batches/T05_ARMAS.json) — contrato, renderer, 105 assets con prompt y
  `calibrate`, `generation_plan` de 11 turnos y 16 `generation_lessons`.
- **Flujo por arma:** `generate_image` con el `prompt` de la ficha → `/home/user/dd_work/raw/T05_ARMAS/weapon_<id>.png`
  → `batch.py process docs/ART_REBUILD/batches/T05_ARMAS.json --only weapon_<id> --no-sheet` → `batch.py calibrate …
  --only … --overlay DIR` (revisar la hoja: mano roja en la empuñadura, apoyo verde en el guardamanos, eje amarillo en
  el cañón; ajustar `calibrate` de la ficha y repetir) → `batch.py register … --only …` → `python3 tools/build_active_html.py`
  → `node tools/art_master/probe_weapons.js OUT --weapons=<id> --poses=der,arriba,izq` → `mark --evidence` → `audit` → `render`.
- **Cómo llega la calibración al juego:** `manifest.entries["weapon_<id>"].anchors` → puente
  `ddApplyWeaponCalibration` (`tools/build_active_html.py`, bloque `1d. ARMAS (T05)`) → `WEAPON_OVERRIDES[id]` (lo que lee
  el `it` del módulo v3.2) y `dt[id].hd` (ft/ddIsLongGun). `oriented:true` anula flipX/cropY/spriteRot heredados; los arcos
  llevan `spriteRot:1.5708` y lienzo 320×80 con `fit.anchor: bottom`. Ganchos QA: `__DD_BRIDGE.getWeaponCalibration(id)`,
  `applyWeaponCalibration(id)`, `getWeaponTelemetry()`, `setDebugGrip(on)`, `buyOrEquipWeapon(id,true)`.
- **Reglas de hint por forma:** ver `TANDA_05_INFORME.md` §8 y `generation_lessons` de la ficha.

## Pendiente arrastrado

De T05 (armas): V de 2–3 px de la cuerda procedural del arco en reposo (geometría `riserX`/`pullDist` de `it`);
puño delantero del sprite ≈19 px por delante de la mano en armas con `sup` corto (pose, no calibración); las 16 B
antiguas (`m1911`, `magnum`, `olympia`, …) siguen con calibración manual y otro estilo; decisiones por defecto
sin confirmar en `TANDA_05_INFORME.md` §7 (arcos sin flecha pintada, espadones a dos manos, bomba a una mano).

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
