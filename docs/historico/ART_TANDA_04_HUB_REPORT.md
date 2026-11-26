# HUB · TANDA 04 — Render integration · INFORME DE ENTREGA

**Fecha:** 2026-11-03 · **Clasificación: APROBADA (13/13 unidades integradas, 0 bloqueadas).**
**Criterio de cierre cumplido:** los 13 PNG finales de TANDA 03 se dibujan **realmente** en el HUB. `registro ≠ integración`, `carga ≠ visibilidad`, `visibilidad en menú ≠ visibilidad en HUB`.

---

## 1 · Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| Unidades integradas | **13 / 13** (8 unidades de producción) |
| Unidades bloqueadas | **0** |
| `NO_VERIFICADO` | **0** |
| `drawImage` medidos en el renderer del HUB | **13 claves distintas**, todos en el canvas de mundo `1280×900` |
| `drawImage` de T04 en el canvas del MENÚ | **0** |
| QA A/B (3 fases, 1280×900, misma cámara) | **12 / 12 `APROBADO`**, `exit=0` |
| Errores JavaScript / `pageerror` | **0** en las 3 fases |
| 404 locales | **0** (2 rutas externas `/cdn-cgi/challenge-platform/` preexistentes) |
| T01 / T02 | **10/10 + 10/10** intactas |
| Cambio en `ART_PACK/art_pack.js` | **ninguno** (byte a byte idéntico) |
| Cambio en el HTML activo | **3 bloques**, `+59 / −2` líneas, `+3.281 B` |
| Performance (mediana de 40 rAF) | ANTES `16,7 ms` · CONTROL `16,8 ms` · DESPUÉS `16,7 ms` → ratio `0,994` |
| Evidencias | `ART_EVIDENCE/hub/tanda_04/`, **83 archivos / ~90 MB**, `hashes.json` **114 / 0 discrepancias** |

TANDA 04 **no produce assets nuevos**. Activa visualmente los 13 PNG finales ya validados de TANDA 03 conectándolos a renderers **existentes** del HUB. No se reconstruye el motor, no se crea un segundo sistema de cachés, canvas alternativo, loader paralelo ni sistema de dibujo independiente.

---

## 2 · FASE 1 — Auditoría (causa real del bloqueo de T03)

`ART_HUB_TANDA_04_AUDIT.md`, `ART_EVIDENCE/hub/tanda_04/audit_runtime.json`, 11 capturas `audit_*.png`.

- El pintor VIP existe en el código del **MENÚ** (`gv("hub_vip_booth_lounge")` → `drawImage`), pero el bucle de render elige `Qf()` en vez de `cp(e)` porque `#overlay.className = "hidden"`. La portada visible es `ddc-cover-js` (`display:block`, `zIndex:2147483000`).
- `DMO.menu54.stats()` medía `frames:0, resizes:0, phase:"apagado"`; forzar `DMO.menu54.frame(performance.now())` producía `frames:1, phase:"pixel-club"` en `#menu-canvas54` (768×500 al activarse). Ese renderer **dibuja en el menú, no en el HUB**, y su actividad durante el boot es intermitente y preexistente.
- `__DDM_GET_V5("hub_vip_booth_lounge")` resolvía `216×136`, pero había **0 `drawImage` de producción** en el HUB. Conclusión: **el pintor del menú no es reutilizable** para el HUB.
- Renderers reales del HUB auditados: `drawHubFloorLayer()` (hook `Wf`, capa de suelo cacheada 1920×1320 en `(290,265)`), `drawHubAerialLayer()` (hook `Ph`, capa aérea), `drawHubScreenLayer()`, `drawHubMinimap()`, `hubDecor` → `addHubCustomProp()` → `Lc` (Y-sort de props), `__DDM_V5_IMG` / `load()` / `__DDM_GET_V5`, `__T3B` + `__T3B_HUB_QA` y el material `__DDM_PAINT_MATERIAL` (rutas `hub` + `campaign`).

**Ruta elegida para el VIP:** una entrada nueva en `hubDecor` → `addHubCustomProp` / `Lc`, con el alias `h03_vip_booth_lounge`. No se tocó el pintor del menú.

---

## 3 · FASE 2 — Matriz de integración

`ART_EVIDENCE/hub/tanda_04/matriz_integracion.json` y `ART_HUB_TANDA_04_MATRIX.md`. **13 filas**, estado final **`INTEGRADO`** (escrito como `PENDIENTE` antes de implementar, actualizado solo tras la QA formal). 0 solapamientos entre los 4 suelos, 6 anclajes distintos de señalética, 3 props con `solid:false`.

| Familia | Unidades | Claves V5 | Renderer / slot |
|---|---|---|---|
| A · SUELOS | T03-01…04 | `h03_floor_patch_o`, `_e`, `_s_crack`, `h03_floor_north_dj` | `drawHubFloorLayer()` / `Wf`, tras `hubCachedFloorCv` |
| B · MOBILIARIO | T03-05, T03-06 | `h03_planter_variant_02`, `h03_bench_variant_02` | `hubDecor` → `addHubCustomProp` → `Lc` |
| C · VIP | T03-07 | `h03_vip_booth_lounge` | `hubDecor` → `addHubCustomProp` → `Lc` |
| D · SEÑALÉTICA | T03-08-A…F | `h03_zone_signage_a…f` | `drawHubAerialLayer()` / `Ph`, tras los rótulos de neón |

Coordenadas mundo **medidas**, no inventadas: suelos O `[290,720,580,430]`, E `[1630,720,580,430]`, S `[870,1256,760,329]`, N `[870,265,760,224]`; props `[413,812,78,88]`, `[2000,826,96,74]`, VIP `[677,624,216,136]`; señales A–F en `[958,565]`, `[1178,431]`, `[1178,1363]`, `[633,781]`, `[1718,781]`, `[583,1133]`, todas `144×96`.

Anclajes derivados de geometría y referencias reales: `Ps=(290,265,1920,1320)` y el medallón para los suelos; `dw = round(h × naturalWidth / naturalHeight)` con dibujo en `x−(dw>>1), y−h` para los props; `signY` real de 6 estaciones (`dj +42`, `lift +134`, `cliente000 +34`, `arsenal/bar +62`, `arcade/seals +134`, resto `−84`) con la placa 136 px por encima para la señalética.

---

## 4 · FASE 3 — Cambios exactos

### HTML activo (`DEADBEAT_DISCO.ART.html`)

| | ANTES (T03) | DESPUÉS (T04) |
|---|---|---|
| Bytes | 13.381.028 | **13.384.309** (`+3.281`) |
| SHA-256 | `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723` | `f3f5e15d06492fb3b511b6c8d8f3c7d3be51f93332d6408d47a432ac744c9865` |
| Diff | — | **`+59 / −2`**, 4 marcadores `TANDA04:BEGIN` y 4 `TANDA04:END` |

Tres inserciones, todas entre marcadores y todas en renderers **ya existentes**:

1. **línea ~7883 (`hubDecor`)** — 3 entradas nuevas (`t04: "T03-05"|"T03-06"|"T03-07"`) con `solid:false, tall:false`; se añade un guard `if (dc.t04 && window.__DDM_HUB_T04 === false) return;` dentro del `hubDraw` ya existente y `imageSmoothingEnabled = !!dc.t04` para que el arte pintado no se muestre como pixel art. La línea anterior `hub_decor_vending_e` solo recibe una coma.
2. **línea ~9357 (`drawHubFloorLayer`, hook `Wf`)** — bloque con 4 `drawImage` sobre la capa de suelo cacheada y antes del medallón, guardado/restaurado de `imageSmoothingEnabled`.
3. **línea ~9601 (`drawHubAerialLayer`, hook `Ph`)** — bloque con 6 `drawImage` de `144×96`, dibujado **después** de los props y de los rótulos de neón para que ninguna placa quede oculta.

Flag único y reversible: `window.__DDM_HUB_T04 !== false` (**activo por defecto**). Con `__DDM_HUB_T04 = false` antes del boot se obtiene exactamente el estado visual de T03. `ART_TOOLS/qa/apply_hub_tanda_04_html.py --restore` revierte los tres bloques; copia de seguridad en `/tmp/t4/DEADBEAT_DISCO.ART.PRE_T04.html`.

### JavaScript

**`ART_PACK/art_pack.js`: sin cambios** (SHA `1df28db436b629610ae47e9a5390e742f48928620d0bd19fa8b4cfdb86d8c8e1`). Permanecen intactos `__DDM_V5_IMG`, `load()`, el bloque `HUB3_*` con sus 13 alias `h03_*`, `hub3()`, `hub3Restore()`, `hub3Apply()`, `HUB2_*`, `hub2Invalidate()` y todas las APIs de invalidación. T01, T02 y T03 no se modificaron; `ART_ASSETS/hub/tanda_03/manifest.json` y `ART_EVIDENCE/hub/tanda_03/report.json` siguen siendo el **histórico** de T03 con sus estados `BLOQUEADO`, sin reescribir.

### Prohibiciones respetadas

Sin cambios en gameplay, colisiones, geometría, puertas, estaciones, música, HUD, guardado, progresión ni IA. Sin segundo motor, sin segundo sistema de cachés, sin canvas alternativo, sin loader paralelo, sin sistema de dibujo independiente. Sin recomendar/permitir los 10 puntos fuera de alcance de T02 (`wall_limbo_ticket_window`, `limbo_gate_stage`, animaciones de recreativas/expendedora, efectos ambientales dinámicos, sistemas de estaciones/puertas).

---

## 5 · FASE 4 — `drawImage` verificados por unidad

Proxy de solo lectura sobre `CanvasRenderingContext2D.drawImage` (instalado por el arnés, **no por el juego**), que etiqueta por `__hubTanda03`, registra argumentos, caja de pantalla vía `getTransform()`, canvas y conteo de dibujos en pantalla. Evidencia: `draw_calls.json`, `report.json → perUnit`.

| artId | Familia | Clave V5 | Argumentos mundo medidos | `drawImage` | En pantalla | Canvas |
|---|---|---|---|---:|---:|---|
| T03-01 | A | `h03_floor_patch_o` | `[290,720,580,430]` | 690 | 390 | 1280×900 |
| T03-02 | A | `h03_floor_patch_e` | `[1630,720,580,430]` | 690 | 556 | 1280×900 |
| T03-03 | A | `h03_floor_patch_s_crack` | `[870,1256,760,329]` | 690 | 553 | 1280×900 |
| T03-04 | A | `h03_floor_north_dj` | `[870,265,760,224]` | 690 | 399 | 1280×900 |
| T03-05 | B | `h03_planter_variant_02` | `[413,812,78,88]` | 383 | 100 | 1280×900 |
| T03-06 | B | `h03_bench_variant_02` | `dw=96, dh=74` (flip) | 588 | 286 | 1280×900 |
| T03-07 | C | `h03_vip_booth_lounge` | `[677,624,216,136]` | 687 | 370 | 1280×900 |
| T03-08-A…F | D | `h03_zone_signage_a…f` | 6 × `[x,y,144,96]` | 652 c/u | 348–550 c/u | 1280×900 |

> **Nota técnica sobre T03-06:** usa `flip:true`, por lo que el renderer hace `translate/scale(-1,1)` y `drawImage(im,0,0,dw,dh)`. El proxy registra esas coordenadas **locales** (`[0,0,96,74]`), pero la caja de pantalla se calcula con `getTransform()` y es correcta. La escala y el anclaje se verifican adicionalmente por derivación geométrica (`dw=round(74×256/198)=96`, `x=2048−48=2000`, `y=900−74=826`) contra las entradas reales de `hubDecor` y contra la matriz (`geometryMatchesMatrix=true`).

**Suelos:** 4 cajas disjuntas, todas dentro de `Ps`, orientación O/E/S/N conservada, continuidad con la grieta y la cabina DJ; `argsMatchMatrix=true`, `overlaps=[]`.
**Mobiliario/VIP:** escala derivada del natural del PNG, `solid:false` → 0 colliders nuevos; colisiones A/B/C **idénticas** (`1720 → 1795`, bloqueo antes del collider de la barra).
**Señalética:** 6 anclajes distintos, 6 claves V5 distintas, 6 zonas A–F, escala común `144×96`, **0 ocultas**; cada placa aparece **completa** dentro del viewport en 3–7 de las 10 zonas medidas (`report.json → signVisibility`).
**VIP:** aparece en el HUB real en `(677,624,216,136)`. **No se cuenta el pintor del menú**: 0 `drawImage` de T04 en `MENU` y 0 fuera del canvas `1280×900`.

---

## 6 · FASE 5 — QA A/B

`ART_TOOLS/qa/validate_hub_tanda_04.js` · `report.json` · `resultados_ab.json` · `antes_runtime.json`, `control_runtime.json`, `despues_runtime_full.json`.

**Entorno:** Chromium `131.0.6778.0`, `playwright-core 1.58.2`, `1280×900`, `deviceScaleFactor=1`, SwiftShader, flags `--no-sandbox --disable-dev-shm-usage --disable-gpu --use-gl=swiftshader --disable-background-networking --disable-logging --log-level=3`. Preview `0.0.0.0:8123` (pid 4783, **no reiniciado**). `bootToHub` = click `(640,450)` + `Enter` + `Escape` 2800 ms; `teleport(1250,935)` y **10 zonas idénticas** en las 3 fases. Capturas con `page.screenshot()`.

| Fase | Configuración | `drawImage` T03 en HUB |
|---|---|---|
| ANTES | `__DDM_HUB_T04 = false` **antes del boot** | **0** |
| CONTROL | activo en el arranque → `false` en caliente → `true` → `hub3Restore()` → `hub3Apply()` | `13 → 0 → 13 → 0 → 13` |
| DESPUÉS | activo por defecto | **13** |

Los 12 checks:

| # | Comprobación | Estado |
|---|---|---|
| 1 | Integridad del HTML, del art pack y de las APIs existentes | `APROBADO` |
| 2 | Recursos cargados: 13/13 PNG, 8 unidades, registro V5 intacto (142 claves) | `APROBADO` |
| 3 | Ausencia de errores JS y de 404 locales | `APROBADO` |
| 4 | **Criterio de integración:** ≥1 `drawImage` efectivo por unidad en el renderer del HUB | `APROBADO` |
| 5 | Visibilidad real: ninguna unidad oculta, ninguna señal recortada | `APROBADO` |
| 6 | Suelos: continuidad, orientación y ausencia de solapamientos | `APROBADO` |
| 7 | Mobiliario y VIP: escala, anclaje y ausencia de cambios de hitbox | `APROBADO` |
| 8 | Señalética: 6 anclajes, 6 referencias diferenciadas, 0 ocultas | `APROBADO` |
| 9 | Cachés de ambas capas y canvas: sin segundo motor, sin canvas nuevo (27 en las 3 fases) | `APROBADO` |
| 10 | Regresión: colisiones, puertas, estaciones, disparo y `CAMPAIGN_ROOM` | `APROBADO` |
| 11 | Regresión T01 10/10, T02 10/10, V5 y arquitectura intactas | `APROBADO` |
| 12 | Performance gate: coste de render separado del coste de carga | `APROBADO` |

**Regresiones:** movimiento `1250 → 1655` (idéntico en ANTES/DESPUÉS), colisión `1720 → 1795` (idéntica en las 3 fases), `hubAudit` 6 zonas / 11 estaciones idéntico, `openStation('bar')`/`closeModal()` correctos, sala real `r23` con `setNight(24)` + `clearRound()`, disparo `0 → 4`, transición a `CAMPAIGN_ROOM` completada, T01 `10/10`, T02 `10/10`, arquitectura `10/10`, 12 poses de jugador, `__DDM_V5_IMG` 142 claves. `__T3B_HUB_QA.available=true` en las 3 fases y `__T3B.draws` con rutas `hub` + `campaign`.

**Rendimiento (coste de carga ≠ coste de render):** la carga de los 13 PNG es un coste **único** de `load()` (`deltaMs` de `state().startedAt → hub3.appliedAt` ≈ 112–197 ms, `loadMs` 1.396/1.649/1.638 ms por fase); el render se mide aparte con 40 rAF consecutivos en el HUB: mediana `16,7 / 16,8 / 16,7 ms`, ratio `0,994` (umbral `≤1,25` y `|Δ| ≤ 4 ms`). Las variaciones aparecen también entre ANTES y CONTROL y **no se atribuyen a los assets** (SwiftShader por software). `performance.json`, `resultados_ab.json`.

**Comparativa visual sin relajar el arnés:** `visual_diff.json` mide una línea base de ruido con **dos fotogramas sin integración** (`antes_01_hub` vs `control_02_off`: `4,83 %` de píxeles cambiados) y una comparativa **limpia en caliente** en el mismo contexto y cámara (`control_02_off` vs `control_03_on`: `11,52 %`). Los 10 pares ANTES/DESPUÉS dan `7,39–11,60 %`. La diferencia sobre la línea base se atribuye a los 13 recursos; el ruido de frame, a SwiftShader.

---

## 7 · FASE 6 — Evidencias

`ART_EVIDENCE/hub/tanda_04/` — **83 archivos, ~90 MB**, `hashes.json` con **114 entradas / 0 discrepancias**.

| Evidencia | Archivos |
|---|---|
| Auditoría FASE 1 | `audit_runtime.json`, `audit_00_menu.png`, `audit_01_hub.png`, 10 `audit_<zona>.png` |
| Baseline de integridad | `baseline.json` (SHA antes/después del HTML y de `art_pack.js`) |
| Matriz de slots | `matriz_integracion.json` (**`INTEGRADO`**), `ART_HUB_TANDA_04_MATRIX.md` |
| `drawImage` por unidad | `draw_calls.json`, `report.json → perUnit`, `despues_runtime_full.json` |
| A/B 3 fases | `antes_*` / `control_*` / `despues_*` PNG, `*_runtime.json`, `resultados_ab.json` |
| Capturas del HUB real | `despues_01_hub.png`, 10 `despues_<zona>.png`, 10 `hub_real_<zona>.jpg`, `control_02_off.png`, `control_03_on.png`, `doors_*.png`, `regresion_campaign.png` |
| Comparativas visuales | `comparativa_antes_despues.jpg` (índice 2×5), 10 `comparativa_<zona>.jpg`, `comparativa_control_off_on.jpg`, `visual_diff.json` |
| Carga / cachés / rendimiento | `verificacion_carga.json`, `comprobacion_caches.json`, `performance.json` |
| Incidencias / entorno | `incidencias.json`, `version_probe.json` |
| Informe y hashes | `report.json`, `hashes.json` |

### Incidencias

| ID | Estado | Resumen |
|---|---|---|
| I-01 | CERRADA | D-07 de T03: el pintor VIP del menú no se reutilizó; T03-07 se integró por `hubDecor`/`Lc`. Su activación intermitente en el boot es preexistente y no dibuja ningún asset T04. |
| I-02 | CERRADA | Performance gate pendiente de T02: medido en el check 12 con 40 rAF y coste de carga separado. **T02 sigue descrita como "cierre pendiente de performance gate" según la indicación del usuario; no se declara completamente cerrada.** |
| I-03 | DOCUMENTADA | La placa C roza ~3–5 px el borde del rótulo de neón `CIRCULOS · DESCENSO` en la zona de descenso. Placa completa y legible, texto del banner legible. No se corrige para no romper la regla geométrica común de las 6 señales ni alterar rótulos existentes. |
| I-04 | PREEXISTENTE | 2 × 404 externos de `/cdn-cgi/challenge-platform/`. 0 404 locales. |
| I-05 | CERRADA | Ruido de frame de SwiftShader cuantificado con línea base y comparativa off/on en caliente; no se atribuye a los assets. |

`openBlockers: 0`, `regressions: 0`.

---

## 8 · FASE 7 — Estado Git y PR

- Rama de sesión: **`arena/109fe45c-deadbeat-disconew`** (única rama de trabajo). `main` / `origin/main` en `d75e021` **intactos**; `arte-y-recursos` en `7653ce6`.
- PR **#1** `OPEN`, `mergedAt=null`, base `arte-y-recursos`, head rama de sesión. **Sin fusionar.**
- Commit independiente: **`HUB TANDA 04 — Render integration`**, seguido de `git push origin arena/109fe45c-deadbeat-disconew` y actualización del PR #1 solo si conserva base/head. El hash exacto se consigna en la respuesta de entrega; no se declara publicado si el push falla.
- T01 (`775926a`), T02 (`888f338`) y T03 (`c5c2aea`) permanecen en el historial del mismo PR, sin reescribir ni sobrescribir sus evidencias.
- Antes del commit: `git diff --check`, `node --check` de los 3 arneses, `py_compile` de los 2 scripts Python, verificación de SHA del HTML y de `art_pack.js`, y revisión de `git status` / `git diff --stat`.

---

## 9 · Estado de las tandas anteriores

| Tanda | Estado |
|---|---|
| T01 | **APROBADA** — 10/10 assets, 12/12 QA, 52/52 hashes. |
| T02 | Integrada y verificada (12/12 QA, 81 hashes), **cierre pendiente de performance gate** según el usuario. No se describe como completamente cerrada. |
| T03 | Producción, carga y QA A/B aprobadas (12/12), **render 8/8 bloqueado** en su informe histórico. Sus documentos y `report.json` se conservan intactos como snapshot; T04 no los reescribe. |
| T04 | **APROBADA** — 13/13 integradas, 0 bloqueadas, QA 12/12. |

---

## 10 · Conclusión

TANDA 04 cumple el criterio de cierre: **los recursos se dibujan realmente en el HUB**. Se demostró con `drawImage` medidos por unidad en el canvas de mundo, con A/B reversible (`0 → 13 → 0 → 13`), con visibilidad real en 10 zonas y con capturas del HUB. Se integró **sin reconstruir el motor y sin alterar gameplay**: el único archivo de producción modificado es el HTML activo, en 3 bloques localizados y reversibles, y `art_pack.js` queda byte a byte idéntico.
