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


## 2026-11-03 · HUB · Tanda 04 (render integration)
- Versión: sin cambio de versión en `ART_PACK/art_pack.js` (byte a byte idéntico, SHA `1df28db436b629610ae47e9a5390e742f48928620d0bd19fa8b4cfdb86d8c8e1`). La integración vive en 3 bloques del HTML activo.
- Archivo modificado: **solo** `DEADBEAT_DISCO.ART.html` (13.381.028 -> 13.384.309 B; SHA `f231cfc7...` -> `f3f5e15d...`; `+59/-2`). Cuatro pares de marcadores `TANDA04:BEGIN/END`; reversible con `--restore` y con `window.__DDM_HUB_T04 = false`.
- Archivos nuevos: `ART_HUB_TANDA_04_AUDIT.md`, `ART_HUB_TANDA_04_MATRIX.md`, `ART_TANDA_04_HUB_REPORT.md`; arneses `ART_TOOLS/qa/hub_tanda_04_audit.js`, `build_hub_tanda_04_matrix.py`, `apply_hub_tanda_04_html.py`, `validate_hub_tanda_04.js`, `finalize_hub_tanda_04.py`; 83 evidencias en `ART_EVIDENCE/hub/tanda_04/`.
- Sistemas afectados: **solo dibujo** en `drawHubFloorLayer()` (`Wf`), `drawHubAerialLayer()` (`Ph`) y `hubDecor`/`addHubCustomProp` (`Lc`). Sin segundo motor, sin caché nueva, sin canvas alternativo, sin loader paralelo, sin sistema de dibujo independiente. Sin cambios en gameplay, colisiones, geometría, puertas, estaciones, música, HUD, guardado, progresión ni IA.
- Pruebas: Chromium 131.0.6778.0 + playwright-core 1.58.2, 1280x900, SwiftShader; A/B de 3 fases con 10 zonas y cámara idéntica; **12/12 `APROBADO`**; 13/13 `drawImage` medidos en el HUB; 0 errores JS, 0 404 locales; `performance.json` (40 rAF, coste de carga separado), `visual_diff.json`, `hashes.json` (114 / 0).
- Resultado: **13/13 unidades integradas, 0 bloqueadas**. Se resuelve el bloqueo de render de TANDA 03 sin reconstruir el motor. T01/T02/T03 y sus evidencias históricas conservadas. T02 sigue con cierre pendiente de performance gate.
- Entrega Git: commit independiente `HUB TANDA 04 — Render integration`, push a `arena/109fe45c-deadbeat-disconew`, PR #1 actualizado **sin merge**. `main` intacta.

<!-- TANDA05:CHANGELOG -->
## TANDA 05 — Equipamiento, vida ambiental e interactividad (2026-11-04)

- Añadidos 10 recursos nuevos en `ART_ASSETS/hub/tanda_05/` (10 fuentes, 10 finales, `manifest.json`) sin repetir T01–T04.
- `ART_PACK/art_pack.js`: `HUB5_*`, `loadHub5()` y API `hub5*` en el registro V5 existente; versión `+hub-tanda05`.
- `DEADBEAT_DISCO.ART.html`: 10 props en `hubDecor` con flag reversible `__DDM_HUB_T05`, pulso de `globalAlpha` en 2 neones y sin sombra en 4 colgantes.
- QA formal A/B de 3 fases y 14 comprobaciones: **14/14 APROBADO**, 10/10 `drawImage` y 10/10 confirmados por diff de píxel; evidencias en `ART_EVIDENCE/hub/tanda_05/`.
- Documentación: informe técnico, matriz de validación, registro de producción, estado de integración e incidencias.
- No se fusiona PR #1; no se modifica `main`.

<!-- TANDA06:CHANGELOG -->
## TANDA 06 — Envolvente arquitectónica y atmósfera (2026-11-04)

- Añadidos 10 recursos nuevos en `ART_ASSETS/hub/tanda_06/` (10 fuentes, 10 finales, `manifest.json` con `additionalAnchors` y `additionalWorldBoxes`), sin repetir T01–T05.
- `ART_PACK/art_pack.js`: `HUB6_ASSETS`, `loadHub6()` y API `hub6*` en el registro V5 existente; versión `+hub-tanda06`.
- `DEADBEAT_DISCO.ART.html`: **14 props** `hubDecor` (10 PNG + 4 repeticiones laterales) con flag reversible `__DDM_HUB_T06`, `t06hang`×2, `t06flat`×1 y sombra omitida en colgantes/zócalo.
- QA formal A/B de 3 fases y 14 comprobaciones: **14/14 APROBADO**, 10/10 `drawImage` y 10/10 confirmados por diff de píxel; evidencias en `ART_EVIDENCE/hub/tanda_06/`.
- Documentación: informe técnico, matriz de validación, auditoría de cámara, registro de producción, estado de integración e incidencias.
- No se fusiona PR #1; no se modifica `main`.

<!-- TANDA07:CHANGELOG -->
## TANDA 07 — El umbral del infierno (2026-11-04)

- Añadidos 6 recursos en `ART_ASSETS/hub/tanda_07/` (6 fuentes conservadas, 2 referencias V5, 6 finales, `manifest.json` → `INTEGRADO_VALIDADO`). **Sin sprites de NPC nuevos**.
- `ART_PACK/art_pack.js`: `HUB7_ASSETS`, `loadHub7()` encadenado tras `loadHub6()` y API `hub7*` en el registro V5 existente; versión `+hub-tanda07`; 162 → 168 claves V5.
- `DEADBEAT_DISCO.ART.html`: módulo `T07` en `initDmoHubV35`, 6 props NPC en `buildHubSpace()` y enganches `Wf/Ph/zf/Tf` al final de las cadenas existentes, con flag reversible `__DDM_HUB_T07`. Sin segundo motor, canvas, cámara, audio, rAF ni colisiones.
- Fase 2: llegada breve desde el exterior infernal (1,85 s / 0,95 s reducido), repetible y sin `transitionLock`. Fase 3: 6 actores / 5 actividades con `solid:false`, Y-sort y `Yc.reduced`. Fase 4: continuidad visual del descenso sobre `floorDropAnim` sin pantalla negra.
- Audio intacto: se descartó usar `cineBegin()` para habilitar `cineFilter`/`cineGain` porque fuerza un cambio de pista inmediato; la cadena musical de descenso existente queda verificada por eventos.
- QA formal A/B **35/35 APROBADO** (`ART_TOOLS/qa/validate_hub_tanda_07.js`), 6/6 hashes, 0 `pageerror`, evidencias en `ART_EVIDENCE/hub/tanda_07/`.
- Corrección de integración: los enganches se montan desde `buildHubSpace()` (ámbito de `initDmoHubV35`), no en el cierre exterior del script, donde `Wf` no está definido.
- No se fusiona PR #1; no se modifica `main`.

<!-- TANDA08:CHANGELOG -->
## TANDA 08 — El abismo vivo (2026-11-04)

- Añadidos 10 recursos en `ART_ASSETS/hub/tanda_08/` (10 fuentes, 10 finales RGBA, `manifest.json` → `INTEGRADO_VALIDADO`). Sin NPC, criaturas ni enemigos nuevos; no se repiten assets T01–07.
- `ART_PACK/art_pack.js`: `HUB8_ASSETS`, `loadHub8()` encadenado tras `loadHub7()` y API `hub8*` en el registro V5 existente; versión `+hub-tanda08`; 168 → 178 claves V5.
- `DEADBEAT_DISCO.ART.html`: módulo `T08` dentro de `initDmoHubV35` y `T08.install()` dentro de `buildHubSpace()` sobre `zf`/`Tf`. Cutaway anclado al borde sur con 5 planos de profundidad, parallax derivado de `DMO.camera()`, grieta iluminada y animación ambiental. Flag reversible `__DDM_HUB_T08`.
- Descenso T07 complementado: `expand = 260·shaftOpen` (ventana 84 → 374 px), sin modificar cámara, llegada, control, música ni secuenciador; 0 fotogramas negros.
- **Prueba de composición previa a producción 16/16 APROBADA** (`composition_proof.json`), mapa de profundidad y carencias P1–P5 entregados antes de generar los assets.
- QA formal A/B en 8 zonas **33 APROBADO / 0 FALLIDO / 4 NO VERIFICADO**, 10/10 SHA-256, 0 `pageerror`, 52 evidencias en `ART_EVIDENCE/hub/tanda_08/`.
- No se fusiona PR #1; no se modifica `main`.
