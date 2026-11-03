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

## 2026-11-03 · HUB · Tanda 02 (expansión visual y arquitectónica)
- Versión: `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02` (`ART_PACK/art_pack.js`, 1314 líneas, `node --check OK`).
- Archivo modificado: **solo** `ART_PACK/art_pack.js`. HTML activo, backups, TANDA 01 y todos los archivos anteriores intactos; nada movido ni renombrado.
- Archivos nuevos: auditoría `ART_HUB_TANDA_02_AUDIT.md` + `ART_AUDIT/hub_tanda_02_needs_inventory.json`; 10 fuentes + 10 finales + `manifest.json` en `ART_ASSETS/hub/tanda_02/`; `ART_TOOLS/prepare_hub_tanda_02.py`; arneses `hub_tanda_02_audit.js`, `validate_hub_tanda_02.js`, `canvas_probe_hub_tanda_02.js`, `finalize_hub_tanda_02.py`; evidencias en `ART_EVIDENCE/hub/tanda_02/`; informe `ART_TANDA_02_HUB_REPORT.md`.
- Selección: 10 slots reales dibujados/consultados por el pintor del HUB, elegidos tras auditoría de 21 slots y 10 zonas. No se repite T01 ni se sustituye lo que funciona. 6 slots son compartidos con salas de campaña: solo cambia el `Image` V5.
- Integración: mismo registro `__DDM_V5_IMG`, mismo `load()`, mismos pintores; mapas `HUB2_IMAGES`/`HUB2_ORIGINALS` independientes de T01; `hub2Invalidate()` usa `DMO_INFERNAL_ART.invalidate()` + `__T3B.setEnabled(true)` para las capas cacheadas T02-09/T02-10. Sin segundo motor, sin canvas superpuesto, sin HUB estático, sin cambios de geometría/colisiones/mecánicas.
- Preparación: 10/10 tamaño exacto, RGBA, esquinas transparentes, bordes limpios, halo ≤ 0,18 %, `contain` sin deformar. La fuente de T02-04 traía dos expendedoras: se aisló una con `sourceCrop=[510,0,925,768]`, conservando la fuente original.
- Pruebas: Chromium 131 + Playwright 1.58.2, A/B real en 3 fases (ANTES / CONTROL restore en caliente / DESPUÉS), **12/12 `APROBADO`**, 10/10 visibles, T01 10/10, V5 100/100, colisión x=1795 idéntica, `r23` puertas `secured 0→1`, disparo `0→4`, regresión explícita en `CAMPAIGN_ROOM`. `report.json`, `visual_diff.json`, `comparativa_antes_despues.jpg`, `hashes.json`.
- Incidencias investigadas y documentadas: 3 criterios erróneos del primer arnés corregidos con mediciones; canvas extra = `hub-portrait-canvas` del modal del propio juego; 2 404 Cloudflare preexistentes; incidencias T01 sin impacto. No se corrigió nada a ciegas ni se modificaron sistemas compartidos sin justificación.
- Resultado: 10/10 generados, integrados, visibles y validados; TANDA 01 intacta; `main` intacta; PR sin merge.

## 2026-11-03 · HUB · Tanda 03 (Environment reconstruction)
- Versión: `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02+hub-tanda03` (`ART_PACK/art_pack.js`, `node --check OK`). Único archivo de código modificado; **HTML activo, backups, TANDA 01 y TANDA 02 intactos**.
- Producción: **8 unidades / 13 PNG finales / 8 fuentes** en `ART_ASSETS/hub/tanda_03/` (4 paños de suelo de una misma familia material, 2 variantes de mobiliario, 1 lounge VIP y 1 sistema de señalética con 6 variantes A–F). `manifest.json` con dimensiones y SHA-256 medidos.
- Preparación: `ART_TOOLS/prepare_hub_tanda_03.py`; 13/13 `exactSize`, RGBA, esquinas transparentes, halo máximo **0,11 %** tras sustituir la descontaminación por **despill de des-premultiplicación + flood-fill** del reflejo exterior. Sin deformaciones.
- Integración: bloque independiente `HUB3_*` en el MISMO `window.__DDM_V5_IMG`, MISMO `load()`, APIs de invalidación existentes, `restoreHub3()` aislado de T01/T02. 13/13 cargados y registrados (`h03_*` + `hub_vip_booth_lounge`). **La integración de RENDER queda BLOQUEADA en las 8 unidades** (D-01…D-07): no se modifica el HTML ni se inventa un pintor nuevo.
- Auditoría: `ART_HUB_TANDA_03_AUDIT.md` + `ART_EVIDENCE/hub/tanda_03/{audit_runtime,slot_probe,geometry_probe,version_probe}.json`. 128→142 claves V5, 21 slots dibujados en el HUB, 0 claves de suelo/variantes/señalética; canvas de suelo 1920×1320 en (290,265); `hub_vip_booth_lounge` tiene pintor en el MENÚ (4 `drawImage` de 108×68) pero su renderer está **inactivo en el build** (0 dibujos en 5 arranques).
- QA: mismo procedimiento A/B de T02, Chromium 131.0.6778.0 + playwright-core 1.58.2, 1280×900, SwiftShader, 3 fases, **12/12 APROBADO** del arnés; 0 errores JS, 0 404 locales, T01 10/10, T02 10/10, V5 completo, colisiones/puertas/estaciones/disparo/`CAMPAIGN_ROOM` sin cambios, rendimiento carga vs render separado. Evidencias: 74 archivos / 79 MB (`report.json`, `visual_diff.json`, 15 comparativas, `comparativa_antes_despues.jpg`, `hashes.json` 152/0 discrepancias, 13 capturas individuales, `incidencias.json`, `resultados_ab.json`, `comprobacion_caches.json`, `verificacion_carga.json`).
- Veredicto: **`APROBADO`** producción + carga + QA + regresión; **`BLOQUEADO`** integración de render (8/8); **`NO VERIFICADO`** visibilidad en producción del VIP. Informe: `ART_TANDA_03_HUB_REPORT.md` (10 apartados).
- Entrega: commit independiente `HUB TANDA 03 — Environment reconstruction` en la rama de sesión, push y actualización de PR #1 si conserva base/head. **Sin merge**, `main` intacta, sin declarar publicado si el push falla.
