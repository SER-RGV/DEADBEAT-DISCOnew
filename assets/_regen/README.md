# assets/_regen/

Directorio de salida de la FASE 3 (regeneración por lotes).

Cada lote genera aquí su salida:
- `LOTE_XX/<category>/<id>.png` — PNG finales procesados (con alfa/mate).
- `LOTE_XX/_masters/<id>.webp` — maestros WebP sin pérdida.
- `LOTE_XX/_raw/<id>.png` — PNG crudos del generador sobre verde croma (entrada).
- `LOTE_XX/_qc/contact_sheet.jpg` — hoja de contacto para aprobación visual.
- `LOTE_XX/<LOTE>.report.json` — informe de postproceso.
- `LOTE_XX/<LOTE>.validation.json` — informe de validación.
- `LOTE_XX/<LOTE>.applied.json` — registro de aplicación (si se aplicó al juego).

Estos archivos son **generados** y no se trackean en Git (excepto este README).
Los backups previos a aplicar se guardan en `backups/regen/LOTE_XX_pre*/` (tampoco trackeados).

Flujo:
1. Colocar PNG raw (verde croma) en `LOTE_XX/_raw/`.
2. `python3 tools/regen/process_lote.py docs/ASSET_REGEN/LOTES/LOTE_XX.sample.json`.
3. `python3 tools/regen/validate_lote.py LOTE_XX.sample`.
4. Revisar la hoja de contacto; aprobar visualmente.
5. `python3 tools/regen/apply_lote.py LOTE_XX.sample --dry-run` → sin `--dry-run` para aplicar.
6. Si hay que revertir: `python3 tools/regen/rollback_lote.py LOTE_XX`.
