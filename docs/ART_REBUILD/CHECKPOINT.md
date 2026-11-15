# CHECKPOINT — DEADBEAT DISCO · reconstrucción de arte

- **Fecha UTC:** `2026-11-14`
- **Rama activa:** `arena/e088e9d7-deadbeat-disconew` (base `main` @ `2d1f6e8`)
- **Línea de producción vigente:** `tools/art_master/` (tandas `R01`, `R02`, …). Ver [`tools/art_master/README.md`](../../tools/art_master/README.md).
- **Tandas completadas y validadas en juego:** `R01_PROTAGONISTA` (27 PNG: 22 ilustraciones, 2 alias cinemáticos, 3 capas derivadas), `R02_ENEMIGOS` (24 ilustraciones: 6 familias × caminar, aviso, ataque y muerte; vistas en los círculos I, II, III, V y VIII), **TANDA 02 del pack 02–07** (6 `hit` + variantes por color; [`TANDA_02_INFORME.md`](TANDA_02_INFORME.md)) y **`R03_JEFES` = TANDA 03 del pack — 42 de 42** (reposo y ataque de los 11 jefes, vulnerable y muerte de los 10 residentes; [`TANDA_03_INFORME.md`](TANDA_03_INFORME.md)).
- **Pack visual 02–07 (2026-11-14):** láminas en `ART_REFERENCES/LAMINAS_2026-11-14/`; auditoría y plan en [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md). Orden: 02 enemigos ✔ → 03 jefes ✔ → **04 escenarios (en curso, 4/20)** → 05 armas → 06 objetos → 07 HUD.
- **Tanda en curso:** TANDA 04 ESCENARIOS — ficha [`batches/T04_ESCENARIOS.json`](batches/T04_ESCENARIOS.json) (20 ilustraciones), **turno 1 de 3 integrado y visto en juego (4/20)**: muro del Limbo/Refugio, puerta gótica cerrada y abierta (círculos V–IX) y portal relicario dorado. Auditoría y decisiones en [`NEXT_BATCH.md`](NEXT_BATCH.md); evidencia `evidence/T04_ESCENARIOS/00–06`. Correcciones de código de la tanda: módulos del muro norte proporcionales (antes aplastados 2:1) y estado/clase de puerta en el puente (antes todas las puertas se veían cerradas y genéricas: ni hojas abiertas, ni tienda, ni retablo del Residente, ni plataforma de descenso en su sitio). De R03 quedan seis decisiones de diseño tomadas por defecto y sin confirmar (`TANDA_03_INFORME.md` §8); la muerte del Núcleo y la del Arquitecto no llegan a verse (pantalla final).
- **Inventario clasificado:** 380 assets · A 25 · B 121 · C 105 · D 26 · E 103 (quedan 252 por producir) — [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md).
- **Auditoría y plan:** [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md).
- **Registro:** 275 assets registrados, 275 cargados, 0 errores; `batch.py audit` sin incidencias.

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
