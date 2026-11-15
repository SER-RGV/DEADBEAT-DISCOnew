# TANDA EN CURSO: T08_EFECTOS — turno 1 de 2 hecho (10 proyectiles); faltan 3 impactos/explosión

- **Estado (2026-11-15):** `batches/T08_EFECTOS.json` ABIERTA. Hechos y registrados (caché `20261115.27`) los 10 `proj_*`
  (`slug heavy pellet cryo plasma ricochet lane flame rail homing`) como efectos de luz: crudo sobre negro puro en
  `/home/user/dd_work/raw/T08_EFECTOS/` → `batch.py process` con **`matte luma`** (nuevo: luminancia → alfa) → maestros en
  `ART_ASSETS/rebuild_masters/T08_EFECTOS/`. Vistos en vuelo (der/izq/arriba) con la nueva sonda `probe_projectiles.js`
  (ruta real de arranque, ~165 s). Inventario sigue en A25·B80·D25 hasta `mark`.
- **Código ya en sitio (commit `a18adaf`):** `drawProjectiles` selecciona el sprite por `b.projectile50` (el motor no pone
  banderas `cryo/flame/…`: antes TODO salía `proj_slug`), longitud por tipo heredada de `Tt()`, cabeza sobre la posición
  lógica; `drawImpactParticles` tiñe cada partícula `Sa` con su color (mezcla `color`, caché); `drawExplosions` +
  `spawnExplosion` conectados a la bomba `tp()` (bloque `1g` de `tools/build_active_html.py`). `__DD_BRIDGE.getActors()`
  expone `bullets[].projectile/weaponId` e `impacts` (nº de partículas).
- **Turno 2 (siguiente):** `generate_image` ×3 con los prompts de la ficha → `vfx_impact_spark`, `vfx_impact_plasma`
  (160², núcleo blanco: la luminancia se conserva al teñir), `vfx_explosion_inferno` (320²) en
  `/home/user/dd_work/raw/T08_EFECTOS/` (comprobar borde negro ≤ 12/255) → `process --only … --no-sheet` → `register --only`
  → `build_active_html.py` (caché `.28`) → `probe_projectiles.js /tmp/ddqa/t08 --bomb=1` → evidencias en
  `evidence/T08_EFECTOS/` (lámina antes/después `t08_antes.jpg` está en `/tmp/ddqa`, regenerable con `sheet.py` desde
  `git show f5a9b87:assets/effects/<id>.png`) → `mark --evidence` → `audit` → `render` → `TANDA_08_INFORME.md`, LOG §19,
  STATUS, CHECKPOINT → commit + push.
- **Fuera de T08 (no se producen, sin consumidor):** `vfx_muzzle_gold/plasma`, `vfx_shockwave_magenta`, `vfx_fire_plume`,
  `vfx_soul_flame`, `vfx_lightning_purple`, `vfx_smoke_cloud`; balas enemigas `Ia` (trazado propio del motor).
- **Decisiones pendientes del usuario** (hallazgos heredados, `TANDA_07_INFORME.md` §5): barra de escudo en %, tarjeta `ESP`
  de la bomba (el motor usa `Q`), ids sin consumidor `menu_main_backdrop(_a)`, `ui_shop_emblem`.
- **Flujo vigente** (ver `tools/art_master/README.md`): `generate_image` (≤10 por turno) → `batch.py process --only … --no-sheet`
  → `register --only` → `python3 tools/build_active_html.py` → sonda en la build real (`probe_hud.js`/`probe_projectiles.js`
  por la ruta real; `probe_pickups.js`, `probe_weapons.js`, `probe_enemies.js`, `probe_rooms.js` por el atajo de QA) →
  `evidence/<TANDA>/` → `mark --evidence` → `audit` → `audit_report.py render` → STATUS/CHECKPOINT/LOG → commit + push.
- **Regla de QA headless:** una ejecución con `#dd-boot-frame.is-failed` es inválida y se repite; nunca se oculta el panel. Lanzar
  siempre con `LD_LIBRARY_PATH=/tmp/al2023/lib FONTCONFIG_PATH=/tmp/fonts`, un Chromium a la vez (`pkill -9 -f /tmp/chromium`
  antes), en segundo plano y con `--mute-audio` (sin él el hilo de audio se atasca y la pestaña se cierra); a 1920×1080 las
  capturas tardan 40–50 s y la pestaña puede caer en la incursión.

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
