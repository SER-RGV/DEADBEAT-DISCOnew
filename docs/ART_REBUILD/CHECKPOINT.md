# CHECKPOINT — DEADBEAT DISCO · reconstrucción de arte

- **Fecha UTC:** `2026-11-15`
- **Rama activa:** `arena/e088e9d7-deadbeat-disconew` (base `main` @ `2d1f6e8`)
- **Línea de producción vigente:** `tools/art_master/` (tandas `R01`, `R02`, …). Ver [`tools/art_master/README.md`](../../tools/art_master/README.md).
- **Tandas completadas y validadas en juego:** `R01_PROTAGONISTA` (27 PNG: 22 ilustraciones, 2 alias cinemáticos, 3 capas derivadas), `R02_ENEMIGOS` (24 ilustraciones: 6 familias × caminar, aviso, ataque y muerte; vistas en los círculos I, II, III, V y VIII), **TANDA 02 del pack 02–07** (6 `hit` + variantes por color; [`TANDA_02_INFORME.md`](TANDA_02_INFORME.md)), **`R03_JEFES` = TANDA 03 del pack — 42 de 42** (reposo y ataque de los 11 jefes, vulnerable y muerte de los 10 residentes; [`TANDA_03_INFORME.md`](TANDA_03_INFORME.md)) y **`T04_ESCENARIOS` = TANDA 04 del pack — 20 de 20** (11 muros, pilastra, 6 puertas y portales, plataforma de descenso y neón del zorro del Refugio; [`TANDA_04_INFORME.md`](TANDA_04_INFORME.md)) y **`T05_ARMAS` = TANDA 05 del pack — 105 de 105** (todas las armas `cNNN_*` sin sprite, con calibración medida `weapon_cal.py` → `manifest.anchors` → `WEAPON_OVERRIDES`/`dt.hd` vía el puente `ddApplyWeaponCalibration`, y verificadas en la mano con `probe_weapons.js`: 16 sondas, 352 capturas, 0 errores; arcos con contrato propio 320×80 + `spriteRot`; [`TANDA_05_INFORME.md`](TANDA_05_INFORME.md)), `T06_OBJETOS` (20 pickups/reliquias; reliquias en cofre y lista de pasivos, reserva al glifo probada), `T07_HUD` (8 iconos del HUD + emblema de victoria; verificados por la ruta real de arranque).
- **Pack visual 02–07 (2026-11-14):** láminas en `ART_REFERENCES/LAMINAS_2026-11-14/`; auditoría y plan en [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md). Orden: 02 enemigos ✔ → 03 jefes ✔ → 04 escenarios ✔ → 05 armas ✔ → **06 objetos (siguiente)** → 07 HUD.
- **Tanda en curso: `T08_EFECTOS` (turno 1 de 2 hecho, 2026-11-15).** Pack 02–07 **completo** (02 ✔ 03 ✔ 04 ✔ 05 ✔ 06 ✔ 07 ✔; T06 [`TANDA_06_INFORME.md`](TANDA_06_INFORME.md), T07 [`TANDA_07_INFORME.md`](TANDA_07_INFORME.md)). T08 produce 13 de los 20 efectos de clase B: los 10 proyectiles `proj_*` ya están generados como efectos de luz (crudo sobre negro → `matte luma`), registrados (caché `20261115.27`) y vistos en vuelo con `probe_projectiles.js`; quedan `vfx_impact_spark`, `vfx_impact_plasma` y `vfx_explosion_inferno` (turno 2), la evidencia definitiva, `mark` y el informe. Ficha: [`batches/T08_EFECTOS.json`](batches/T08_EFECTOS.json). Código ya en sitio: `drawProjectiles` elige por `projectile50` (antes, banderas inexistentes → todo `proj_slug`), partículas `Sa` teñidas con su color, bomba → `DD_WORLD.spawnExplosion` (bloque `1g` del build). Hallazgos heredados pendientes de decisión en `TANDA_07_INFORME.md` §5 (barra de escudo en %, etiqueta ESP de la bomba).
- **Contrato de animación (FASE 02 §4):** [`ANIMATION_CONTRACT.md`](ANIMATION_CONTRACT.md) + `ANIMATION_CONTRACT.json` generados por `tools/art_master/anim_contract.py` desde el registro real (un fotograma por estado + movimiento procedimental; `player_walk_00..03` a 8 fps es la única secuencia); `--check` R1–R4 sin incumplimientos.
- **Inventario clasificado:** 382 assets · A 25 · B 80 · C 0 · D 25 · E 252 (quedan 105 por producir: 80 B + 25 D) — [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md).
- **Fase 08 (escala y cámara, 2026-11-14):** perfil `DD_SCALE` intermedia + cámara `DD_CAMERA` cableados en el build; docs en [`../WORLD_SCALE_REBUILD/README.md`](../WORLD_SCALE_REBUILD/README.md); PR #22. Afecta a las sondas de arte: zoom 1,08 en calma (antes 0,8) y figuras más grandes en pantalla.
- **Auditoría y plan:** [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md).
- **Registro:** 382 assets registrados (caché `20261115.27`), 0 errores; `batch.py audit` sin incidencias.
- **QA del HUD en headless:** `tools/art_master/probe_hud.js` recorre la ruta real (carga → intro → menú → NUEVA PARTIDA → Refugio → incursión) y captura la página tal cual; si aparece `#dd-boot-frame.is-failed` aborta y guarda el registro de `DD_BOOT` (no se oculta). Diagnóstico en `TANDA_07_INFORME.md` §4.1 y `probe_boot_failure.js`.

## Estado de la línea anterior (TANDA_01 … TANDA_23)

Las tandas anteriores dejaron 225 assets «verificados» con el criterio de entonces
(carga sin error). La auditoría de 2026-11-11 los reclasifica por calidad visual: la
mayoría son pixel art (clase B) y 25 tienen defectos visibles (clase D). Sus documentos
y evidencias (`evidence/tanda_XX/`) se conservan como histórico; `tools/asset_pipeline.py`
y `tools/validate_batch.js` ya no se usan para tandas nuevas.

## Cómo reanudar

1. Leer [`NEXT_BATCH.md`](NEXT_BATCH.md) y [`tools/art_master/README.md`](../../tools/art_master/README.md).
2. Levantar el servidor estático en `:8080` y comprobar el estado: `batch.py audit` debe terminar sin diferencias.
3. Generar las ilustraciones de la tanda (máximo 10 por turno de trabajo) con la hoja de modelo como referencia. Los maestros croma viven fuera del repositorio (`/home/user/dd_work/raw/<TANDA>/`); en el repositorio queda el maestro ya recortado (`ART_ASSETS/rebuild_masters/<TANDA>/`, WebP), del que `batch.py process` regenera los PNG en un clon limpio: mismo recorte y misma transparencia; el color difiere unos 2 niveles de 255 de media (compresión con pérdida), así que el resultado es equivalente a la vista pero no idéntico byte a byte (comprobado con 23 fotogramas de R02).
   Un fotograma de estado (ataque, vulnerable, muerte) se pide con el reposo del personaje como referencia, montado con `state_ref.py`; las de los 11 jefes ya están en `/home/user/dd_work/raw/R03_JEFES/_refs/`.
4. `batch.py process` → `batch.py register` → `python3 tools/build_active_html.py`.
5. Validar **dentro del juego** y guardar evidencia en `evidence/<TANDA>/`.
6. `batch.py mark` → `audit_report.py render` → actualizar este archivo, `NEXT_BATCH.md`, `PRODUCTION_STATUS.json` y `PRODUCTION_LOG.md`.
7. `git commit` y `git push origin <rama de la sesión>`. Nunca a `main` ni fusionar.
