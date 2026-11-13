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

<!-- TANDA09:CHANGELOG -->
## TANDA 09 — El HUB como lugar habitado (2026-11-04)

- Añadidos 4 recursos en `ART_ASSETS/hub/tanda_09/` (4 fuentes, 4 finales RGBA 131×232, `manifest.json` → `INTEGRADO_VALIDADO`). **Posturas estáticas autorizadas**; sin NPC, animaciones de sentado/usar máquina, mobiliario ni arquitectura nuevos.
- `DEADBEAT_DISCO.ART.html`: módulo `T09` dentro de `initDmoHubV35` y `T09.install()` tras `T08.install()` en `buildHubSpace()`; **2 inserciones, 0 eliminaciones**. **`ART_PACK/art_pack.js` SIN CAMBIOS**: los 4 alias `t09_*` se cargan en caliente y se registran en `__DDM_V5_IMG` (178 → 182 claves).
- Capa de rutinas sobre **los mismos 10 props**: `ACTIVE → PAUSE/SHIFT/OBSERVE/WAIT/POSTURE → RESUME → ACTIVE`, un único acumulador `Tf(dt)`, `seed` determinista, continuidad de frame por `holdOffset` (congelación exacta + recuperación 1,2 s), orientación/intensidad/desplazamiento interpolados.
- Reutilización: 6 actores T07 + 4 `ambientDancers` + `narr_cliente000` intacto; reacciones T07 conservadas con pesos `.90/.55/.45/.25/.35`; 5 de 10 NPC sin reacción y 8 de 10 sin desplazamiento; anclajes de `dancer_0…3` inmutables.
- Identidad por zona A–F y 7 acontecimientos cotidianos raros (≥25 s de separación, 3,0–5,5 s, uno simultáneo, reversibles, sin progresión ni mecánicas).
- **Correcciones de integración:** `DMO_LAYOUT.propObjects()` devuelve clon profundo → enganche sobre el array real `tc`; `buildHubSpace()` recrea props → re-enganche perezoso; orientación intermedia y recuperación de frame suavizadas.
- Flag reversible `window.__DDM_HUB_T09`: con `false`, delegación íntegra al `hubDraw` de T01–T08 y sin carga de sprites nuevos; verificado OFF → ON y con movimiento reducido.
- QA formal de 16 puntos durante **100 s / 400 muestras + 180 a 33 ms**: **16 APROBADO / 0 FALLIDO** (matriz completa 16/0/3/6), 0 `pageerror`, 0 warnings, 39 evidencias, 17 hashes, 4/4 SHA-256 de assets.
- No se fusiona PR #1; no se modifica `main`.

## 2026-11-04 · MODIFICACIÓN PRIORITARIA — Legibilidad y reconstrucción espacial del HUB (A–F)
- Versión: módulo `1.0.0-legibilidad`; HTML `3e82dc77…9011` → 4 inserciones / 0 eliminaciones. `ART_PACK/art_pack.js` **sin cambios**.
- Autorización: usuario eligió alcance **A–F completo** y **T09 desactivada**; la propuesta se entregó antes de modificar porque `lift` no estaba conectado a la grieta.
- Archivos modificados: `DEADBEAT_DISCO.ART.html` (4 enganches: módulo, apertura/cierre de `clipCutaway` en T08, `LEG.install()` en `buildHubSpace()`).
- Archivos nuevos: `ART_TOOLS/hub_legibilidad_block.js`, `ART_TOOLS/apply_hub_legibilidad.py`, `ART_TOOLS/qa/hub_legibilidad_correccion_qa.js`, `ART_TOOLS/qa/hub_legibilidad_metricas.py`, `ART_TOOLS/finalize_hub_legibilidad.py`, `ART_CORRECCION_LEGIBILIDAD_HUB.md`, 46 evidencias en `ART_EVIDENCE/hub/correccion/`. Actualizados: `ART_AUDITORIA_LEGIBILIDAD_HUB.md` (§10), `ART_PROPUESTA_CORRECCION_PRECIPICIO.md`, `CURRENT_STATE.md`, `ART_PRODUCTION_LOG.md`.
- Sistemas afectados: **sólo capas de dibujo y visibilidad** (`style.opacity` de `DMO_ATMOS`, `CFG.grade/grain`, `prop.hidden`, envoltorios de `drawHubFloorLayer`/`drawPixelNeonBanner`/`drawDiegeticSign`/`zf`/`Tf`, clip de `drawCutaway`). Sin cámara global, colisiones, estaciones, progresión, Director, combate ni audio.
- Cambios: bloom 1,00→0,30; vignette 1,00→0,45; grade 1→0,35; grain 0,016→0,006; 9 props redundantes ocultos (reversibles); velo de jerarquía en el suelo; sombras de contacto; oclusión del abanico del arsenal; labio rocoso irregular en lugar de la línea recta; boca oscura con escalera de caracol y luz inferior; cutaway T08 recortado desde la boca; un cartel por POI.
- Pruebas: Chromium 131 + Playwright, A/B en la misma página en 6 zonas, 16 barridos, 9 fotogramas de descenso, flag OFF desde arranque, `startCampaignFromHub(0)` → `CAMPAIGN_ROOM`; `git diff --check`, `node --check`, `py_compile`.
- Resultado: **QA 18/18 APROBADO / 0 FALLIDO**, 0 `pageerror`, 0 assets nuevos, 0 props nuevos, 62 props y 11 estaciones intactos. Línea magenta 1089→0 px (reversible), separación de planos 17,95→23,65 en el borde.
- Entrega Git: rama `arena/109fe45c-deadbeat-disconew`, PR #1 `OPEN` **sin merge**, `main` intacta.

## 2026-11-07 · ARRANQUE, HUB Y CONTROLES — reparación del flujo oficial (`index.html`)
- Versión: build oficial `index.html` regenerada (5.230.025 B, SHA-256 `cc3bf39b…`); original protegido `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` **sin cambios**; copia pre-modificación de `index.html` en `backups/index_PRE-HUBFIX_2026-11-07.html`.
- Archivos modificados: `tools/build_active_html.py` (inlinea `src/dd_rebuild_ui.css` + los 5 módulos `src/dd_*.js` dentro de `index.html`; añade KEYBOARD TAKEOVER GUARD y `__DD_BRIDGE.setPaused/isPaused` al puente), `src/dd_hub_system.js` (pausa del motor al entrar al HUB y reanudación al descender; cámara con zoom ≥1,02 y clamp a la sala; foco de suelo + halo y escala 1,16 del protagonista; fallback `DDC_COVER.start()`), `src/dd_ui_system.js` (guarda `#dd-chrome-guard` que oculta `#ddc-cover` aunque falte el CSS externo; fallback de arranque vía `DDC_COVER.start()`), `src/dd_world_renderer.js` (parámetro opcional `scaleVal` en `drawProtagonist`, retrocompatible), `src/dd_rebuild_ui.css` (`#ddc-cover` oculto por completo en modo HD). `DEADBEAT_DISCO.html` regenerado idéntico. **`index.html` sigue siendo la única build oficial**; no se ha sustituido ni rediseñado.
- Causas raíces corregidas (verificados en runtime, no hipótesis): (1) `index.html` dependía de `src/*.css|js` externos → publicado solo, no existían menú nuevo, HUB, cinemática ni puente visual (menú antiguo visible, todo lo demás caído); ahora la build es autocontenida. (2) El cover legacy ddc registra `keydown/keyup` en **fase de captura sobre `window`** y, con su flag interno `Z`, llama a `stopImmediatePropagation()` → ese secuestro mataba WASD/flechas, la navegación del menú HD y ESPACIO (saltar cinemática); el guard del puente neutraliza exactamente esos dos listeners mientras `body.dd-highres-edition` esté activo (retirable; el input del motor es bubble y queda intacto). (3) La cinemática no dejaba al jugador en el HUB utilizable porque el HUB no llegaba a existir (1) o el teclado estaba secuestrado (2); el callback `DD_HUB.enter()` y la liberación de `isBlocking` ya eran correctos. (4) Entrar al HUB con una partida viva no pausaba la simulación (`Tf`) ni bloqueaba el estado; ahora `setPaused(true)` congela el mundo tras la cámara del HUB y `setPaused(false)` + `rp()` reanudan al descender. (5) Composición del HUB: el zoom <1 dejaba bandas negras de vacío y el protagonista (sprite oscuro ~104 px) se leía mal sobre la alfombra; corregido con zoom adaptativo con clamp, foco de luz y halo.
- Pruebas (Chromium headless `@sparticuz/chromium` + puppeteer-core, entorno sin GUI, rAF ≈5–22 fps, dt clamp ×4): flujo completo `carga → menú (único) → navegación teclado y mando → cinemática (fin + skip ESPACIO) → HUB activo → WASD/flechas → estación descenso [E] → cinemática círculo → partida iniciada → teclado en partida → [H] vuelve al HUB con motor pausado`: **13/13 checkpoints en modo ficheros completos y en modo fichero único (sin `src/` ni `assets/`)**; mando **emulado** (stick, D-pad, A) 8/8; `pageerror` 0, panel de error fatal 0, `DMO.diag.errors` 0. Mando físico y GUI real: **NO VERIFICADO** (sin hardware ni display en el sandbox). Detalle en el informe de esta sesión.
- Sin cambios en: balance, enemigos, armas, progresión, economía, scripts Cloudflare, mecánicas, `v9_t3_fase1b_cache_probe.html`, `DEADBEAT_DISCO.ART.html` ni assets. Ningún sistema heredado eliminado: ddc cover y `#overlay` siguen vivos en el DOM y recuperan su comportamiento si se retira la clase `dd-highres-edition`.

## 2026-11-12 · PROJECT RESTART · cierre del diseño del protagonista
- Archivos modificados: `docs/RESTART/03_PERSONAJE_MAESTRO.md` (ficha consolidada), `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` (§4.1, §4.4), `ART_BIBLE.md`, `docs/ART_REBUILD/VISUAL_REFERENCE_GUIDE.md`, `docs/RESTART/01_…` y `02_…` (notas), `CURRENT_STATE.md`, visor `assets/cinematics/preview/art_direction_test.html`, `tools/qa/test_art_direction_viewer.js`.
- Archivos nuevos: `docs/LORE/historico/` (biblia anterior sin modificar).
- Sistemas afectados: ninguno del juego (solo documentación y visor de arte).
- Pruebas: QA del visor y huella SHA-256 de la lámina maestra (`docs/RESTART/evidencia_visor/qa_visor.json`).

## 2026-11-12 · PROJECT RESTART · protagonista: IDLE de fotograma único
- Archivos nuevos: `assets/characters/protagonist_master/pm_idle_00.png` y `pm_idle.manifest.json` (IDLE_1F), maestro webp y tanda `R05_PROTAGONISTA_MAESTRO`, `docs/RESTART/06_IDLE_FOTOGRAMA_UNICO.md`, `docs/RESTART/evidencia_idle_1f/`, `tools/qa/probe_idle_1f_in_game.js`.
- Archivos modificados: `assets/cinematics/preview/protagonist_anim_test.html`, `tools/qa/test_protagonist_anim_viewer.js`, `docs/RESTART/04_PROTAGONISTA_PRODUCCION.md`, `docs/RESTART/05_MUESTRA_IDLE.md`.
- Archivos movidos (sin borrar): la muestra de 4 fotogramas, a carpetas `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY`.
- Sistemas afectados: ninguno del juego. Sin cambios en `src/`, sprites `player_*`, registro, `index.html`, menú, cinemática ni Refugio. Recurso no registrado.
- Pruebas: visor 61/61; visor de arte 48/48; sonda en el Refugio con sustitución solo en el navegador de prueba (control y nuevo, sin errores).
- Resultado: pendiente de aprobación. Quedan sin corregir el sigilo del hombro y el lobo respecto a la lámina.

## 2026-11-12 · PROJECT RESTART · protagonista: corrección de fidelidad del IDLE
- Archivos nuevos: `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` y `pm_idle_fid.manifest.json`, maestro y tanda `R05B_PROTAGONISTA_MAESTRO_FIDELIDAD`, `docs/RESTART/07_IDLE_FIDELIDAD.md`, `docs/RESTART/evidencia_fidelidad/`.
- Archivos modificados: visor `protagonist_anim_test.html` (recurso «CORREGIDO · POR VALIDAR», comparación lado a lado, panel de lámina y tatuajes), `tools/qa/test_protagonist_anim_viewer.js`, `docs/RESTART/04_…md`, `06_…md`.
- Sistemas afectados: ninguno del juego. `pm_idle_00.png` sin cambios. Nada registrado.
- Pruebas: visor 74/74; visor de arte 48/48. Sin prueba en partida de la versión corregida.
- Resultado: pendiente de validación visual.

## 2026-11-12 · PROJECT RESTART · protagonista: FASE 07B, última corrección de fidelidad del IDLE
- Archivos modificados: `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png` (v2) y su manifiesto, maestro y tanda `R05B`; visor `protagonist_anim_test.html` (fila actual · anterior · nueva y tres ampliaciones); `tools/qa/test_protagonist_anim_viewer.js`; `docs/RESTART/04_…md`, `07_…md`.
- Archivos nuevos: `fidelidad/versiones/` (v1 conservada), `docs/RESTART/08_IDLE_FIDELIDAD_07B.md`, `docs/RESTART/evidencia_fidelidad_07b/`.
- Sistemas afectados: ninguno del juego. `pm_idle_00.png`, lámina, `src/`, sprites y registro sin cambios (hashes en la evidencia).
- Pruebas: visor 76/76; visor de arte 48/48. Sin prueba en partida.
- Resultado: pendiente de aprobación.

## 2026-11-12 · PROJECT RESTART · Cierre del protagonista e inicio del juego
- Protagonista: diseño CERRADO, lámina CANÓNICA, IDLE 07B ACEPTADO COMO REFERENCIA, experimentos ARCHIVADOS, resto de animaciones PENDIENTES. Sin cambios en sus archivos.
- Nuevo `src/dd_opening.js`: intro «La noche que vuelve» (32 s, 7 planos) y descenso al Refugio (7 s).
- Flujo: carga → intro → menú → nueva partida → descenso → Refugio. Antes la intro entraba directamente al Refugio.
- Menú: NUEVA PARTIDA, CONTINUAR (sólo con partida), OPCIONES, CRÉDITOS, SALIR; aspecto nuevo; guardado `dd_save_v1`.
- Archivos: `src/dd_boot.js`, `src/dd_ui_system.js`, `src/dd_hub_system.js` (textos), `src/dd_rebuild_ui.css`, `tools/build_active_html.py`, `assets/cinematics/restart/opening/`, `ART_ASSETS/rebuild_masters/R06_INICIO/`, `tools/qa/test_restart_flow.js`.
- QA: 62 de 62. Detalle y limitaciones en `docs/RESTART/09_CIERRE_PROTAGONISTA_E_INICIO.md`.

## 2026-11-13 · PROJECT RESTART · Intro en cómic animado
- La intro pasa a ser un cómic animado de siete planos (viñetas, cartelas, onomatopeyas, transiciones de tinta); mismos 32 s.
- El descenso se reparte: inicio y sombrero en la intro; NUEVA PARTIDA completa la caída en 4,6 s.
- Fondo del menú: pozo y sombrero. Fuentes definitivas en `assets/fonts/` (Barlow Condensed, Bangers; OFL).
- Protagonista en pantalla sólo con la lámina maestra y el IDLE 07B.
- Archivos: `src/dd_opening.js`, `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, `tools/qa/test_restart_flow.js`, láminas `mc_*`. QA 65 de 65. Detalle: `docs/RESTART/12_INTRO_COMIC_PRODUCCION.md`.

## 2026-11-13 · PROJECT RESTART · Cierre de intro, IDLE 07B en el Refugio y persistencia
- Cartelas: dos textos sustituidos por indicación de dirección y «canción» → «nota» por correspondencia con la biblia.
- Refugio: el protagonista se dibuja con el IDLE 07B aprobado (`src/dd_hub_system.js`); sprites de combate sin cambios.
- Persistencia: NUEVA PARTIDA reinicia sólo el estado de run; nueva acción BORRAR DATOS en OPCIONES con confirmación (`src/dd_ui_system.js`, `src/dd_rebuild_ui.css`).
- Plano 06 y descenso: balanceo, tirones, estela, viento y polvo sobre el mismo dibujo (`src/dd_opening.js`).
- Pruebas: `tools/qa/test_persistencia.js` (39 de 39); flujo 65 de 65. Sonido grabado y medido, no escuchado.
- Storyboard v2 vigente; v1 marcado como histórico. Detalle: `docs/RESTART/13_CIERRE_INTRO_REFUGIO_PERSISTENCIA.md`.

## 2026-11-13 · RESTART 14 · Menú, pantalla de carga y volumen
- Volumen: intro ≈ −21,6 dB y música del menú −20,7 dB (antes ≈ −26 y −13,7). Medido, no escuchado.
- Menú: corregida la desaparición de la mezcla del juego al reabrir OPCIONES; ESC, ENTER, ← →, TAB, foco y mando en todos los submenús.
- Carga: sólo logotipo y barra; la portada antigua ya no se ve en ningún fotograma.
- Archivos: `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, `src/dd_boot.js`, `src/dd_opening.js`, `tools/build_active_html.py`, `tools/qa/test_menu_respuesta.js`, builds.
- Pruebas: menú 48 de 48, inicio 65 de 65, persistencia 39 de 39. Detalle en `docs/RESTART/14_MENU_CARGA_Y_VOLUMEN.md`.

## 2026-11-13 · RESTART 14b · Los volúmenes de OPCIONES se oyen
- VOLUMEN DEL MENÚ, MAESTRO, MÚSICA y EFECTOS cambian al instante lo que suena en el menú (antes sólo guardaban el número).
- Archivos: `src/dd_ui_system.js`, `src/dd_opening.js`, `tools/build_active_html.py`, `tools/qa/test_menu_respuesta.js`, builds.
- Pruebas: menú 53 de 53 (con medición de salida real), inicio 65 de 65, persistencia 39 de 39.
