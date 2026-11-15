# SIN TANDA EN CURSO — T08_EFECTOS cerrada 13/13 (2026-11-15); pack 02–07 completo

- **Estado:** producción detenida tras T08, a la espera de revisión. Registro 382 assets, caché `20261115.28`; inventario
  A25·B67·C0·D25·E265 (quedan 92 por producir: 67 B + 25 D).
- **Antes de abrir otra tanda, decidir:** (a) `TANDA_08_INFORME.md` §5: tamaño de las balas en pantalla (`PROJECTILE_LEN`, un número por
  tipo), volteo vertical de las balas hacia la izquierda, qué hacer con los 7 `vfx_*` sin consumidor (fogonazo, onda expansiva, humo…: es
  trabajo de motor); (b) `TANDA_07_INFORME.md` §5: barra de escudo en %, tarjeta `ESP` de la bomba (el motor usa `Q`), ids sin consumidor
  `menu_main_backdrop(_a)`, `ui_shop_emblem`.
- **Qué quedaría por producir (clase B/D):** props B 29; armas B 16 (`weapon_*` antiguas); cinemáticas B 11 (`cine_circle_00–09`,
  `cine_intro_club_panorama`) + D 24 (`cine_bg01–04*`); personajes B 3 (`npc_armorer_hub`, `npc_bartender_hub`, `companion_drone_ally`) +
  D 1 (`npc_dj_booth_world`); muros B 1 (`wall_panel_tall_neon`); efectos B 7 sin consumidor. Proponer tanda nueva con ficha propia
  (candidatas: T09 PROPS 29, T10 CINEMÁTICAS 35, T11 PERSONAJES DEL REFUGIO 4).
- **Flujo vigente** (ver `tools/art_master/README.md`): `generate_image` (≤10 por turno) → `batch.py process --only … --no-sheet`
  → `register --only` → `python3 tools/build_active_html.py` → sonda en la build real (`probe_hud.js`/`probe_projectiles.js`
  por la ruta real; `probe_pickups.js`, `probe_weapons.js`, `probe_enemies.js`, `probe_rooms.js` por el atajo de QA) →
  `evidence/<TANDA>/` → `mark --evidence` → `audit` → `audit_report.py render` → STATUS/CHECKPOINT/LOG → commit + push.
- **Regla de QA headless:** una ejecución con `#dd-boot-frame.is-failed` es inválida y se repite; nunca se oculta el panel. Lanzar
  siempre con `LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts`, un Chromium a la vez (`pkill -9 -f /tmp/chromium`
  antes), en segundo plano y con `--mute-audio` (sin él el hilo de audio se atasca y la pestaña se cierra); la intro se salta con
  pulsaciones repetidas de Espacio; a 1920×1080 las capturas tardan 40–50 s y la pestaña puede caer en la incursión.

## Referencia T08 (cerrada): efectos de luz

- Ficha [`batches/T08_EFECTOS.json`](batches/T08_EFECTOS.json); evidencias `evidence/T08_EFECTOS/00–05` + `t08_probe_projectiles_720.json`;
  informe [`TANDA_08_INFORME.md`](TANDA_08_INFORME.md). Contrato: crudo sobre negro puro → `matte luma`; consumo en
  `drawProjectiles` (por `projectile50`), `drawImpactParticles` (tinte por color) y `drawExplosions` (bomba, bloque `1g`).

## Referencia T07 (cerrada): HUD

- Ficha [`batches/T07_HUD.json`](batches/T07_HUD.json); evidencias `evidence/T07_HUD/00–15` + `t07_probe_hud_720.json`,
  `t07_boot_trace_720.json`, `t07_boot_failure_diag_720.json`; informe [`TANDA_07_INFORME.md`](TANDA_07_INFORME.md).
- Consumo: `dd_ui_system.js` `assetSrc(id, reserva)` (corazones 22 px, moneda 16 px, habilidades 44 px, icono de escudo 14 px
  `#dd-hud-shield-img`), `dd_cinematic_camera.js` (`ui_victory_emblem` 280×210). Los estados atenuados por CSS necesitan contorno
  claro: `hud_heart_empty` se deriva con `tools/art_master/derive_hud_heart_empty.py` (no se regenera con IA).

## Referencia T06 (cerrada): objetos y reliquias

- Ficha [`batches/T06_OBJETOS.json`](batches/T06_OBJETOS.json); evidencias `evidence/T06_OBJETOS/00–12` + 3 informes de sonda;
  informe [`TANDA_06_INFORME.md`](TANDA_06_INFORME.md). Reliquias: parche `1f` de `tools/build_active_html.py` (cofre y pausa) con
  reserva al glifo (probada con un doble de `window.DD_ASSETS`, que está congelado). Gancho QA `__DD_BRIDGE.spawnPickupAt`.

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
