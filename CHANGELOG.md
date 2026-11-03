# CHANGELOG — DEADBEAT DISCO

## v9_t3_fase1b_cache_probe
- Incorporación de build HTML de referencia.
- Conservación de recursos integrados.
- Identificación de sistemas y metadatos.
- Preparación para migración a GitHub.

## Próximas versiones
Registrar aquí cada modificación:
- Fecha.
- Versión.
- Archivos modificados.
- Sistemas afectados.
- Pruebas realizadas.
- Resultado.

## 2026-11-03 · HUB · Tanda 01 (reconstrucción de escenarios)
- Versión: `fase1-tanda01+tanda02+tanda03+hub-tanda01` (`ART_PACK/art_pack.js`).
- Archivos modificados: `ART_PACK/art_pack.js`. HTML activo y backups intactos.
- Archivos nuevos: 10 assets finales + 10 fuentes + `manifest.json` en `ART_ASSETS/hub/tanda_01/`; evidencias en `ART_EVIDENCE/hub/tanda_01/`; pipelines y arneses en `ART_TOOLS/`; `ART_TANDA_01_HUB_REPORT.md`; `.gitignore`.
- Sistemas afectados: **solo el registro de imágenes** (`__T3B_IMAGES[1]`, `__DDM_V5_IMG`) que consultan los pintores reales del HUB. Sin cambios en geometría, colisiones, puertas, estaciones, música ni mecánicas.
- Pruebas: Chromium 131 + Playwright, A/B control/DESPUÉS, 12/12 `APROBADO`; `report.json`, `visual_diff.json`, `hashes.json`.
- Resultado: 10/10 generados, integrados, visibles y validados; `main` intacta.
- Entrega Git: el usuario autorizó commit/push en `arena/109fe45c-deadbeat-disconew` y PR hacia `arte-y-recursos` **sin merge** (la rama obligatoria remota solo contiene `README.md` y Arena fija la rama de sesión). `main` intacta. Ver informe, sección 9.
