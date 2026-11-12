# CHECKPOINT — DEADBEAT DISCO · reconstrucción de arte

- **Fecha UTC:** `2026-11-12`
- **Rama activa:** `arena/662f0d27-deadbeat-disconew` (base `main` @ `2d9386f`)
- **Línea de producción vigente:** `tools/art_master/` (tandas `R01`, `R02`, …). Ver [`tools/art_master/README.md`](../../tools/art_master/README.md).
- **Tandas completadas y validadas en juego:** `R01_PROTAGONISTA` (27 PNG: 22 ilustraciones, 2 alias cinemáticos, 3 capas derivadas) y `R02_ENEMIGOS` (24 ilustraciones: 6 familias × caminar, aviso, ataque y muerte; vistas en los círculos I, II, III, V y VIII).
- **Tanda en curso:** `R03_JEFES` — **15 de 42** ilustraciones integradas y vistas en juego: el reposo de los 11 jefes y el ataque de Andén, Magneta, Bufé y El Pogo. Los once jefes se ven ya ilustrados en combate; faltan 27 fotogramas de estado (7 ataques, 10 de vulnerable, 10 muertes), que mientras tanto se resuelven sobre el reposo nuevo. Hay seis decisiones de diseño tomadas por defecto y sin confirmar. Ver [`NEXT_BATCH.md`](NEXT_BATCH.md).
- **Inventario clasificado:** 374 assets · A 25 · B 141 · C 105 · D 37 · E 66 (quedan 283 por producir) — [`AUDIT_INVENTORY.md`](AUDIT_INVENTORY.md).
- **Auditoría y plan:** [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md).
- **Registro:** 269 assets registrados, 269 cargados, 0 errores; `DD_ASSETS.integrity()` pasa (269/269).

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
