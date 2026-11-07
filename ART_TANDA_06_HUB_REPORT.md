# HUB · TANDA 06 — Envolvente arquitectónica y atmósfera

**Veredicto final: `APROBADO` · 14/14 comprobaciones APROBADO.**
Generado el `2026-11-04T01:53:30.096319+00:00` sobre el HUB real (`0.0.0.0:8123`, Chromium 131 / Playwright).
PR #1 abierto, **sin merge**; `main` intacta.

## 1. Qué se ha producido

10 recursos RGBA nuevos en `ART_ASSETS/hub/tanda_06/` (10 fuentes 1408×768 en
`_source/`, 10 finales recortados por conectividad y `manifest.json`), integrados
como **14 entradas `hubDecor` sobre 10 PNG únicos**: `T06-06` y `T06-07` se
repiten en `y=780` y `y=1540` para que los paramentos laterales cubran
`y=400..1540` sin huecos. Los hashes de los 10 PNG **no cambiaron** tras el
segundo `prepare_hub_tanda_06.py` (determinista).

| Pieza | Función |
|---|---|
| T06-01/02/03 | Tres tramos de fachada norte, cara SUR, abutados `x=500→1856` (gaps 0) |
| T06-04/05 | Machones de esquina a inglete (NO→SE y NE→SO) |
| T06-06/07 | Paramentos laterales, caras ESTE / OESTE, 3 anclajes contiguos de 380 u |
| T06-08 | Viga / casetón de techo, solo cara INFERIOR |
| T06-09 | Cortinaje frontal colgado de la cornisa |
| T06-10 | Zócalo cenital, plano de suelo sin altura |

Preparación: `flood_alpha` por conectividad (`tol=10`) + `despill_dark`.
**10/10** `exactSize`, `RGBA`, extremos de alfa `[0,255]`, esquinas transparentes,
halo claro **0,0 %**, cobertura **64,99–88,89 %**, `incidencias=[]`.

## 2. Cámara y proyección (medidas, no teóricas)

`translate(640,450) → scale(0,9375) → translate(-B,-L)`; matriz `a=d=0,9375`,
`b=c=0` en 39 muestras, sin rotación, cizalla ni escala por profundidad.
`zoom=0,9375`, `viewW=1365`, `viewH=960`, `lead={0,10}`. Octógono real
`Ps=(290,265,1920,1320)`, `cut=210`, mundo `2500×1850`. **No se ha modificado**
cámara, proyección, geometría general, colisiones, puertas ni estaciones.
`ART_HUB_TANDA_06_CAMERA_AUDIT.md` documenta las caras visibles y
`composicion.json` proyecta las **14 cajas** sobre capturas reales
(3 zonas primarias + 7 de apoyo, cobertura 14/14, veredicto `APROBADA`).

## 3. Integración (solo 2 archivos del juego)

* `ART_PACK/art_pack.js`: `HUB6_ASSETS` (10), `loadHub6()` tras `loadHub5()`,
  API `hub6*`/`hub6Manifest`/`hub6Restore`/`hub6Apply`/`hub6Invalidate`,
  versión `+hub-tanda06`. **Mismo `load()` y mismo registro V5**: 152 → 162 claves.
* `DEADBEAT_DISCO.ART.html`: bloque `TANDA06:BEGIN/END` con 14 props
  `hubDecor` → `addHubCustomProp` → `Lc` → `hubDraw`, `solid:false`,
  `tall:false`, `sortY=dc.y`, `flip:false`×14, `t06hang`×2, `t06flat`×1,
  sombra `Vb` omitida en colgantes/zócalo, `imageSmoothingEnabled` con `dc.t06`.
  Flag reversible `window.__DDM_HUB_T06`.

Sin canvas, motor, caché, loader, listener, guardado, audio ni `requestAnimationFrame`
nuevos. `node --check ART_PACK/art_pack.js` OK.

## 4. QA formal A/B de 3 fases

`ART_TOOLS/qa/validate_hub_tanda_06.js`: ANTES (flag `false` antes del boot),
CONTROL (`OFF → OFF → ON` por zona, `hub6Restore/hub6Apply`) y DESPUÉS
(integración activa), 10 zonas de cámara idénticas, proxy de solo lectura sobre
`drawImage` y `page.screenshot()`.

| # | Comprobación | Estado |
|---|---|---|
| 1 | Carga de los 10 recursos: load(), registro V5, tamaño exacto y 0 errores de loader | **APROBADO** |
| 2 | Visibilidad: 10/10 drawImage medidos en el canvas de mundo 1280x900 con caja en pantalla | **APROBADO** |
| 3 | Orientación espacial: caras SUR/ESTE/OESTE/INFERIOR/SUELO y planos correctos | **APROBADO** |
| 4 | Perspectiva: proyección ortográfica 2.5D real, sin isometría impuesta ni cambio de cámara | **APROBADO** |
| 5 | Continuidad de paredes/estructuras: 0 huecos en el muro norte y en las aristas laterales | **APROBADO** |
| 6 | Escala relativa: aspecto del PNG conservado, sin estirar ni deformar | **APROBADO** |
| 7 | Anclajes: cajas mundo medidas iguales al manifiesto, dentro del octógono real | **APROBADO** |
| 8 | Orden de capas: cola Y-sort compartida, 0 dibujos en menú, 0 canvas nuevos | **APROBADO** |
| 9 | Oclusión: jugador/arquitectura/decoración en la misma cola de profundidad | **APROBADO** |
| 10 | Transparencias: alfa real, bordes limpios, sin halos blancos ni franjas | **APROBADO** |
| 11 | Movimiento: idéntico con el flag activado y desactivado | **APROBADO** |
| 12 | Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases | **APROBADO** |
| 13 | Puertas y estaciones: sala r23, 11 estaciones y modal sin regresión | **APROBADO** |
| 14 | Regresión T01–T05: 10/10, 10/10, 13/13, 10/10, 152 claves base y cachés intactas | **APROBADO** |

A/B de `drawImage` T06 medidos en las ventanas de captura: ANTES `0`,
CONTROL OFF_A/OFF_B `0`, CONTROL ON `895`, `hub6Restore()` `0`,
`hub6Apply()` `72`, DESPUÉS `1048`. En paralelo, el registro
V5 pasa `10 → 0 → 10` con `hub6Restore/hub6Apply`. **0 `pageerror`**,
**0 errores JS**, **0 404 locales**; los 2 `404 /cdn-cgi/challenge-platform/`
son externos y preexistentes.

Confirmación de píxel (`visual_diff.json`): **10/10** assets con señal
`10.934–75.696 %` frente a ruido OFF/OFF `≤1.992 %`, sobre la parte
visible de su caja medida en la fase CONTROL. `alpha_verification.json`:
**10/10** APROBADO por relectura directa de bytes.

## 5. Cobertura por asset

| Asset | Recurso | Cara / plano | Caja mundo | Repeticiones | drawImage | Zonas completas | Señal OFF/ON | Ruido OFF/OFF | Alfa |
|---|---|---|---|---|---|---|---|---|---|
| T06-01 | Fachada norte · tramo A | SUR (+Y) | `500,180,362,150` | 0 | 133 | 2 | 66.294 % | 0.685 % | APROBADO |
| T06-02 | Fachada norte · tramo B | SUR (+Y) | `862,180,504,150` | 0 | 298 | 6 | 52.051 % | 0.569 % | APROBADO |
| T06-03 | Fachada norte · tramo C | SUR (+Y) | `1366,180,490,150` | 0 | 298 | 6 | 50.363 % | 1.992 % | APROBADO |
| T06-04 | Machón de esquina NO→SE | NO→SE (inglete 45°) | `536,180,128,150` | 0 | 133 | 2 | 75.696 % | 0.845 % | APROBADO |
| T06-05 | Machón de esquina NE→SO | NE→SO (inglete 45°) | `1845,180,111,150` | 0 | 255 | 4 | 59.004 % | 0.783 % | APROBADO |
| T06-06 | Paramento oeste (cara ESTE) | ESTE (+X) | `277,780,107,380` | 2 | 383 | 6 | 52.937 % | 1.739 % | APROBADO |
| T06-07 | Paramento este (cara OESTE) | OESTE (-X) | `2129,780,83,380` | 2 | 1013 | 8 | 46.047 % | 1.08 % | APROBADO |
| T06-08 | Viga / casetón de techo | INFERIOR | `991,240,518,90` | 0 | 298 | 7 | 44.457 % | 0.558 % | APROBADO |
| T06-09 | Cortinaje de cornisa | FRONTAL | `1817,200,96,230` | 0 | 711 | 6 | 67.377 % | 0.221 % | APROBADO |
| T06-10 | Zócalo de asiento (cenital) | SUELO (cenital) | `1090,322,321,36` | 0 | 376 | 7 | 10.934 % | 0.02 % | APROBADO |

## 6. Regresión y límites

* T01–T05 intactos (`integridad_t01_t05.json`): `hubAudit` idéntico en las 3
  fases, 11 estaciones, 6 zonas, 27 canvas base, caché de suelo activa,
  152 claves V5 de T05 + 10 de T06 = 162.
* Movimiento y colisiones sin cambios; desviación máxima de `7` px
  entre fases sobre ~400 px de recorrido (variación de fotogramas rAF, tolerancia
  40 px / 10 %), no un collider nuevo. `hubAudit` y `collision` idénticos.
* Puertas/estaciones/campaña: `setNight(24)`, `clearRound()`, sala real `r23`,
  11 estaciones, modal `bar`, disparo y `CAMPAIGN_ROOM` sin regresión.
* Rendimiento: 40 rAF por fase, mediana 16,7–33,3 ms. **No cierra el gate
  pendiente de T02** (decisión del usuario).
* `officialUntainted=false` es efecto del teleport/debug del arnés y aparece
  idéntico en las 3 fases.
* Incidencias completas en `incidencias.json`; SHA-256 de todas las evidencias,
  assets, herramientas y documentos en `hashes.json`.

## 7. Evidencias

`ART_EVIDENCE/hub/tanda_06/` — `report.json`, `resultados_ab.json`,
`visual_diff.json`, `alpha_verification.json`, `verificacion_carga.json`,
`comprobacion_caches.json`, `diff_scope.json`, `integridad_t01_t05.json`,
`version_probe.json`, `incidencias.json`, `draw_calls.json`,
`performance.json`, `composicion.json`, `camera_audit*.json`,
`composicion_*.jpg`, `comparativa_*.jpg`, `plano_caras_visibles.png`,
capturas `antes_*`/`despues_*`/`control_*`, `smoke_*`, `qa_validation.log`,
`qa_finalize.log` y `hashes.json`.

Herramientas: `ART_TOOLS/prepare_hub_tanda_06.py`,
`ART_TOOLS/qa/hub_tanda_06_camera_audit.js`,
`ART_TOOLS/qa/hub_tanda_06_composition.py`,
`ART_TOOLS/qa/apply_hub_tanda_06.py`,
`ART_TOOLS/qa/validate_hub_tanda_06.js`,
`ART_TOOLS/qa/finalize_hub_tanda_06.py`.
