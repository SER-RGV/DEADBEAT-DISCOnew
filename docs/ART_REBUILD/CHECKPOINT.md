# CHECKPOINT — DEADBEAT DISCO · reconstrucción de arte

- **Fecha UTC:** `2026-11-15`
- **Rama activa:** `arena/e088e9d7-deadbeat-disconew` (base `main` @ `2d1f6e8`)
- **Línea de producción vigente:** `tools/art_master/` (tandas `R01`, `R02`, …). Ver [`tools/art_master/README.md`](../../tools/art_master/README.md).
- **Tandas completadas y validadas en juego:** `R01_PROTAGONISTA` (27 PNG: 22 ilustraciones, 2 alias cinemáticos, 3 capas derivadas), `R02_ENEMIGOS` (24 ilustraciones: 6 familias × caminar, aviso, ataque y muerte; vistas en los círculos I, II, III, V y VIII), **TANDA 02 del pack 02–07** (6 `hit` + variantes por color; [`TANDA_02_INFORME.md`](TANDA_02_INFORME.md)), **`R03_JEFES` = TANDA 03 del pack — 42 de 42** (reposo y ataque de los 11 jefes, vulnerable y muerte de los 10 residentes; [`TANDA_03_INFORME.md`](TANDA_03_INFORME.md)) y **`T04_ESCENARIOS` = TANDA 04 del pack — 20 de 20** (11 muros, pilastra, 6 puertas y portales, plataforma de descenso y neón del zorro del Refugio; [`TANDA_04_INFORME.md`](TANDA_04_INFORME.md)) y **`T05_ARMAS` = TANDA 05 del pack — 105 de 105** (todas las armas `cNNN_*` sin sprite, con calibración medida `weapon_cal.py` → `manifest.anchors` → `WEAPON_OVERRIDES`/`dt.hd` vía el puente `ddApplyWeaponCalibration`, y verificadas en la mano con `probe_weapons.js`: 16 sondas, 352 capturas, 0 errores; arcos con contrato propio 320×80 + `spriteRot`; [`TANDA_05_INFORME.md`](TANDA_05_INFORME.md)).
- **Pack visual 02–07 (2026-11-14):** láminas en `ART_REFERENCES/LAMINAS_2026-11-14/`; auditoría y plan en [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md). Orden: 02 enemigos ✔ → 03 jefes ✔ → 04 escenarios ✔ → 05 armas ✔ → **06 objetos (siguiente)** → 07 HUD.
- **Tanda en curso: `T06_OBJETOS` (TANDA 06 del pack) — ABIERTA 9/20.** Turno 1 integrado y verificado en juego: ammo, boost, companion, credits, damageup, fireup, heart, mutation, shield (ficha `batches/T06_OBJETOS.json`, evidencias `evidence/T06_OBJETOS/00–03`, sonda `tools/art_master/probe_pickups.js` con el gancho QA `__DD_BRIDGE.spawnPickupAt`). Pendientes: `pickup_bomb_00` (la generación falló por el límite de imágenes del turno), speedup, turret y las 8 reliquias (turno 2). Las figuras se dibujan ahora a 44×1,15 ≈ 51 px de mundo por la Fase 08 (`DD_SCALE.pickup`).
- **Inventario clasificado:** 382 assets · A 25 · B 98 · C 0 · D 26 · E 233 (quedan 124 por producir: 98 B + 26 D) — [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md).
- **Fase 08 (escala y cámara, 2026-11-14):** perfil `DD_SCALE` intermedia + cámara `DD_CAMERA` cableados en el build; docs en [`../WORLD_SCALE_REBUILD/README.md`](../WORLD_SCALE_REBUILD/README.md); PR #22. Afecta a las sondas de arte: zoom 1,08 en calma (antes 0,8) y figuras más grandes en pantalla.
- **Auditoría y plan:** [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md).
- **Registro:** 382 assets registrados (caché `20261115.22`), 0 errores; `batch.py audit` sin incidencias.

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
