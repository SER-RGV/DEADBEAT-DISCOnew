# HERRAMIENTAS DEL PROYECTO

Aquí están los programas que ayudan con tareas del juego, como preparar archivos y hacer comprobaciones.

| Carpeta o archivo | Para qué sirve |
|---|---|
| [`build_active_html.py`](build_active_html.py) | Genera `index.html` y `DEADBEAT_DISCO.html` a partir del motor base y de `src/`. Nunca editar esos HTML a mano. |
| [`art_master/`](art_master/README.md) | **Línea vigente de producción de arte por tandas** (R01, R02, …): croma → PNG, registro, sondas dentro del juego, auditoría A–E. |
| `asset_pipeline.py`, `validate_batch.js` | Línea anterior (TANDA_01…TANDA_23). Se conservan como histórico; no usar `rebuild_registry()`. |
| `qa/`, `fase01_qa/` | Pruebas de fases anteriores. |
