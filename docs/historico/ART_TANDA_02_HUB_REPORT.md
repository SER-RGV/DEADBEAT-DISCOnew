# DEADBEAT DISCO — RECONSTRUCCIÓN INTEGRAL DEL HUB · TANDA 02

**Fecha:** 2026-11-03 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **Build activa:** `DEADBEAT_DISCO.ART.html` (sin modificar)
**Resultado:** 10/10 assets generados, preparados, integrados, visibles y validados · **QA A/B 12/12 `APROBADO`** · TANDA 01 intacta · **PR sin merge**

---

## 0. Resumen ejecutivo

Se partió de la auditoría visual real del HUB (`ART_HUB_TANDA_02_AUDIT.md`, `ART_AUDIT/hub_tanda_02_needs_inventory.json`, 10 capturas y `audit_runtime.json`), no de una lista prefijada. De los 21 slots que el pintor del HUB dibuja por fotograma se eligieron los **10 que seguían en lenguaje legacy** y que además son funcionales, repetidos o están en capas cacheadas muy consultadas. Se generaron 10 fuentes, se prepararon 10 PNG finales con las dimensiones **medidas** en el HUB, se integraron en el registro V5 existente de `ART_PACK/art_pack.js` y se validó con Chromium/Playwright en el juego real.

No se ha creado un segundo motor, ni un canvas superpuesto, ni un HUB estático. No se ha tocado el HTML activo, backups, geometría, colisiones, `sortY`, puertas, `Ot.openT`, estaciones, progresión, combate, armas, enemigos, jefes, música, DJ, HUD ni guardado. No se ha implementado ninguna interacción nueva.

---

## 1. Estado previo comprobado (sin presuponer el PR fusionado)

Antes de empezar se verificó en la rama de sesión:

| Comprobación | Resultado real |
|---|---|
| Rama activa | `arena/109fe45c-deadbeat-disconew` (no se cambió de rama) |
| HEAD al iniciar T02 | `775926a` (entrega TANDA 01), worktree limpio |
| PR #1 | `OPEN`, `mergedAt=null`, base `arte-y-recursos`, **sin merge** |
| TANDA 01 | 10 fuentes + 10 finales + `manifest.json` + `report.json` (12/12) + `hashes.json` (52/52), intactos |
| Preview | `0.0.0.0:8123`, raíz → `DEADBEAT_DISCO.ART.html`; runtime verificado en menú y HUB |
| `ART_PACK/art_pack.js` | 1120 líneas, `node --check OK`, versión `...+hub-tanda01` |

La TANDA 01 estaba disponible en la rama actual, por lo que no fue necesario detenerse a pedir una integración previa. El mandato original de rama `arte-y-recursos` sigue resuelto por la autorización explícita del usuario (`authorize_session_branch`): commit/push en la rama de sesión y PR hacia `arte-y-recursos`, **sin merge** y sin tocar `main`.

---

## 2. Auditoría previa e inventario de necesidades

`ART_TOOLS/qa/hub_tanda_02_audit.js` proxea `__DDM_V5_IMG` / `__DDM_GET_V5` / `drawImage` **sin modificar el juego**, entra al HUB por el flujo real (clic → Enter → Escape 2,8 s) y recorre 10 zonas con `DMO.debug.teleport()`. El conteo se reinicia ya dentro del HUB para excluir menú y cinemática.

- **118 claves V5** registradas, **21 slots dibujados por fotograma en el HUB**, 8 ya sustituidos por T01.
- `DMO_HUB.audit()`: `ok=true`, `location=HUB`, **6 zonas**, **11 estaciones**, 0 `pageerror`.
- Slots cacheados muy consultados: `hub_pista_medallion` (gets 639), `club_wall_sconce_side` (gets 115 / fn 228), `wall_ceiling_neon_fixture` (gets 85 / fn 168), `wall_stained_glass_arch` (gets 31 / fn 56).
- Zonas pobres detectadas: paños de suelo perimetrales O/E/S y corredor norte. **No se rellenaron**: se documentan como `INCOMPLETO` y pasan a la recomendación de TANDA 03.
- Clasificación usada: **6 clases** (1 existente y correcto, 2 existente pero mejorable, 3 incompleto, 4 ausente, 5 interactivo como clase superimpuesta, 6 pendiente de validación). El séptimo punto del pliego es «dirección artística», no un estado.

Inventario máquina completo: `ART_AUDIT/hub_tanda_02_needs_inventory.json`. Evidencias: `ART_EVIDENCE/hub/tanda_02/audit_runtime.json` y 10 `audit_*.png`.

---

## 3. Los 10 elementos seleccionados (necesidades reales)

Todas las dimensiones son las **naturales del recurso que el motor sirve hoy**, tomadas de `audit_runtime.json → registrySizes`; ninguna se inventó.

| ID | Archivo final | Slot V5 | Tamaño | Caja medida / anclaje | Ubicación real y función | Clase |
|---|---|---|---|---|---|---|
| T02-01 | `hub_t02_01_arcade.png` | `hub_arcade_shrine` | 264×239 | `[0,0,236,214]`, bottom-center | Rincón Arcade F1 (655,1210), estación F · banco de recreativas | 2 + 5 |
| T02-02 | `hub_t02_02_arsenal.png` | `hub_arsenal_shrine` | 360×253 | `[0,0,276,194]`, bottom-center | Arsenal de Caronte D (590,845), estación D · mostrador | 2 + 5 |
| T02-03 | `hub_t02_03_seals.png` | `hub_seals_shrine` | 244×237 | `[1737,1040,216,210]`, bottom-center | Espejo de los Sellos F2 (1845,1210), estación F | 2 + 5 |
| T02-04 | `hub_t02_04_vending.png` | `club_vending_machine_prop` | 100×152 | `[0,0,78,118]`, bottom-center | Expendedora este (2048,692) · compartida con salas | 2 |
| T02-05 | `hub_t02_05_cooler.png` | `club_water_cooler_prop` | 61×136 | `[429,588,47,104]`, bottom-center | Dispensador oeste (452,692) · compartida | 2 |
| T02-06 | `hub_t02_06_bench.png` | `limbo_bench_prop` | 256×198 | `[1037,1178,96,74]`, bottom-center | Bancos gemelos junto al descenso | 2 |
| T02-07 | `hub_t02_07_planter.png` | `club_neon_planter_prop` | 96×108 | `[966,614,78,88]`, bottom-center | 4 jardineras fijas · variante de un mismo slot | 2 |
| T02-08 | `hub_t02_08_liftpad.png` | `descent_abyssal_lift_pad` | 198×104 | `[-99,-52,198,104]`, center | Plataforma de descenso y puertas de sala · `Ot.openT` intacto | 2 + 5 |
| T02-09 | `hub_t02_09_ceiling_fixture.png` | `wall_ceiling_neon_fixture` | 148×38 | `[52,-177,116,30]`, center | Barra de neón de techo/muro en **capa cacheada** | 2 |
| T02-10 | `hub_t02_10_sconce.png` | `club_wall_sconce_side` | 48×60 | `[0,-42,38,48]`, center | Apliques laterales en **capa de aristas cacheada** | 2 |

Se descartaron expresamente `hub_vip_booth_lounge`, `club_roadcase_crate_prop`, `club_wall_sconce_torch`, `prop_bench_vertical`, `prop_table_vertical` y `hub_hell_elevator` (0 dibujos en el HUB), los personajes animados, los recursos ya correctos de T01 y los slots de pertenencia no confirmada (`limbo_floor_medallion`, `limbo_gate_stage`, `wall_limbo_ticket_window`). **No se repitió ninguno de los diez de T01 ni se sustituyó un recurso que funcionara.**

---

## 4. Dirección artística y generación

Isométrica 2D/2.5D, ilustración estilizada de alta calidad, materiales reconocibles (latón, terciopelo, cristal, esmalte, mármol oscuro), negro profundo, rosa eléctrico / cian / violeta / amarillo ácido sobre la paleta oro-magenta-cian de T01, contrastes fuertes, iluminación ambiental coherente con la lámpara central y los neones de pared, siluetas limpias, mismo grosor de trazo y biselado. Sin pixel art, sin assets genéricos, sin sombras de fondo horneadas.

- 10 fuentes originales **conservadas íntegras** en `ART_ASSETS/hub/tanda_02/_source/`.
- Incidencia documentada: la fuente `hub_t02_04_vending.png` contenía **dos** expendedoras. Se alcanzó el límite de 10 generaciones del turno al intentar regenerarla, se informó al usuario y se resolvió sin tocar la fuente: `sourceCrop=[510,0,925,768]` aísla una sola máquina. Queda registrado en `ART_TOOLS/prepare_hub_tanda_02.py` y en `manifest.json`. No se hizo una generación sustitutiva innecesaria.
- Cada asset documenta función, ubicación, dimensiones, diseño, fuente, archivo final, transparencia, bordes, escala, pivote y anclaje en `manifest.json`.

---

## 5. Preparación técnica verificada

`ART_TOOLS/prepare_hub_tanda_02.py` reutiliza `build_alpha()` / `crop_alpha()` del pipeline anterior, aplica `contain` + descontaminación de croma y RGB neutro en transparentes.

| Métrica | Resultado |
|---|---|
| Tamaño exacto | **10/10** (`exactSize=true`) |
| Canal alfa | **10/10** RGBA, extremos `[0,255]` |
| Esquinas transparentes / bordes limpios | **10/10** |
| Halo blanco residual | **≤ 0,18 %** (máx. T02-01; T02-09 0,16 %; T02-07 0,07 %) |
| Cobertura | 42,9 – 63,8 % |
| Deformación | **ninguna** (`contain`, `deformed=false`) |
| SHA-256 por asset | registrado en `manifest.json` |

---

## 6. Integración real (sin motor nuevo)

Único archivo de código modificado: **`ART_PACK/art_pack.js`** (1120 → 1314 líneas, `node --check OK`), versión `fase1-tanda01+tanda02+tanda03+hub-tanda01+hub-tanda02`.

Se añadió un bloque **independiente** de T01:

| Elemento | Función |
|---|---|
| `BASEH2`, `HUB2_ASSETS` | 10 registros con tamaño, slot, pivote, clasificación, rol y marca `cached` |
| `HUB2_IMAGES`, `HUB2_ORIGINALS` | `Image` decodificados y recursos anteriores **preservados** por slot |
| `loadHub2()` | usa el **mismo `load()`** del art pack; comprueba dimensiones naturales |
| `applyHub2()` | escribe `window.__DDM_V5_IMG[slot]` + alias `h02_*` trazable; no crea lienzos |
| `restoreHub2()` | devuelve solo los 10 slots de T02 a sus `Image`/canvas originales; **no puede deshacer T01** |
| `hub2Invalidate()` | `DMO_INFERNAL_ART.invalidate()` + `__T3B.setEnabled(true)` (API visual existente) para recomponer las capas cacheadas T02-09/T02-10 |
| `hub2()`, `hub2Tag()` | estado vivo de solo lectura y etiquetado para QA |
| `run()` | carga T01 → arquitectura → HUB-T01 → **HUB-T02** sobre el mismo registro |
| API | `DMO_ART_PACK.hub2 / hub2Manifest / hub2Restore / hub2Apply / hub2Tag` |

Seis slots son **compartidos con salas de campaña**: solo cambia el `Image`, no geometría, colisionadores, `sortY`, estaciones, puertas, música ni HUD. `hub2Invalidate()` está justificado porque T02-09/T02-10 se pintan una sola vez al construir los lienzos de pared/aristas; sin invalidación seguiría viéndose el arte anterior. No se ha modificado ningún otro sistema compartido.

**HTML activo, backups y todos los archivos anteriores permanecen intactos; no se ha movido ni renombrado nada.**

---

## 7. QA A/B real — 12 comprobaciones

`ART_TOOLS/qa/validate_hub_tanda_02.js`, Chromium 131.0.6778.0 + `playwright-core` 1.58.2, SwiftShader, 1280×900, servidor real en `0.0.0.0:8123`. Tres fases sobre la **misma build**:

- **ANTES**: T01 aplicada, T02 revertida con `hub2Restore()` antes de entrar al HUB (estado previo real).
- **CONTROL**: T02 revertida **en caliente** ya dentro del HUB.
- **DESPUÉS**: T02 aplicada por el arranque normal.

Las capturas principales de las tres fases se toman en la **misma cámara** (`teleport 1250,935`), y se recorren las mismas 10 zonas para que la comparación de píxeles sea válida. Instrumentación de solo lectura sobre `drawImage` / `createPattern`; API de depuración existente.

| # | Comprobación | Estado | Resultado real |
|---|---|---|---|
| 1 | Carga del HTML y del art pack | **APROBADO** | HTTP 200, `loadMs=1426`, `readyState=complete`, `status=applied`, `hub2AppliedAtBoot=10` |
| 2 | Carga e integración de los 10 | **APROBADO** | `10/10 applied`, `enabled=true`, `slotsApplied=10`, `errors=[]`, 10 HTTP 200, 10/10 `exactSize` + `live` + `loaderResolves=1` + `originalsPreserved` |
| 3 | Ausencia de errores JavaScript | **APROBADO** | 0 `pageerror`, 0 errores de consola inesperados, 0 404 locales; 2 404 `cdn-cgi/challenge-platform` preexistentes y sus `ERR_ABORTED` |
| 4 | Visibilidad en el HUB real | **APROBADO** | 10/10 con `drawImage` real: T02-01 656, T02-02 350, T02-03 561, T02-04 561, T02-05 333, T02-06 1338, T02-07 2678, T02-08 669, T02-09 30, T02-10 20 dibujos; 10/10 en pantalla |
| 5 | Perspectiva, escala, pivote y anclaje | **APROBADO** | 10/10 `contain` sin deformar; cajas del motor medidas y registradas por asset |
| 6 | Transparencias, bordes y alfa | **APROBADO** | 10/10 RGBA, esquinas transparentes, bordes limpios, halo ≤ 0,18 % |
| 7 | Profundidad / capas / sin canvas nuevo | **APROBADO** | capas cacheadas → suelo → props `sortY`; secuencia de los 10 slots T01 **idéntica** en las 3 fases; inventario base de canvases **27/27/27** |
| 8 | Movimiento | **APROBADO** | `1250 → 1652` (Δ 402) con `d`; mismo punto de partida y sentido en las 3 fases |
| 9 | Colisiones, zonas y estaciones | **APROBADO** | `hubAudit` y 11 estaciones idénticos; bloqueo en `x=1795` (Δ 75) con tolerancia 0,01 px en ANTES/CONTROL/DESPUÉS |
| 10 | Transición y puertas (`Ot.openT`) | **APROBADO** | campaña completada, sala real `r23`, `secured 0 → 1`, capturas cerradas/abiertas |
| 11 | Interactivos existentes | **APROBADO** | 11 estaciones, `openStation('bar') → active='bar' → closeModal()`, 4 slots funcionales vivos; **sin interacción nueva** |
| 12 | Regresión de sistemas + T01 + sala de campaña | **APROBADO** | T01 10/10, integridad 8/8, arquitectura 10/10, T03 12 poses, V5 100/100, disparo `0→4`; en `CAMPAIGN_ROOM`: `hub2Applied=10`, V5 100/100, 0 errores |

**`report.json`: `{"APROBADO":12}` — 0 FALLIDO, 0 BLOQUEADO, 0 NO VERIFICADO.** Tabla por asset: 10/10 Generado · Integrado · Visible · Validado.

### Incidencias encontradas durante la QA (investigadas, no ocultadas)

1. **Primer arnés: 9/12.** Tres criterios del propio arnés eran incorrectos, no fallos del juego: (a) los 2 404 de Cloudflare se contaban como «locales» por_HOST en lugar de por ruta; (b) se suponía que todo T02 se dibuja después del suelo, cuando las capas cacheadas de muro/aristas se componen **antes** por el pintor existente (igual que HUB-03); (c) se exigía igualdad exacta de Δ de movimiento en un bucle `rAF` real (varía 4–7 px también entre ANTES y CONTROL). Se corrigieron con mediciones reales y se añadió una comprobación nueva: **número de canvases**.
2. **Canvas 28 vs 27 en DESPUÉS.** Diagnóstico ejecutado (`ART_TOOLS/qa/canvas_probe_hub_tanda_02.js` → `canvas_probe.json`): el canvas adicional es `canvas.hub-portrait-canvas` de 72×72, creado por el **propio juego** al abrir `openStation('bar')` en la comprobación 11; ANTES y CONTROL no abren estaciones. **Ningún canvas procede del art pack.**
3. **Dos 404 Cloudflare / `ERR_ABORTED`.** `cdn-cgi/challenge-platform/scripts/jsd/main.js`, presentes ya en el estado ANTES y en T01; 0 `pageerror`, 0 recursos locales fallidos. No se eliminaron scripts del HTML activo.

### Revisión de las incidencias heredadas de T01

| Incidencia | Investigación | Impacto en T02 | Acción |
|---|---|---|---|
| HUB-01 `loaderResolves=0` | HUB-01 entra por `__T3B_IMAGES[1]` → `createPattern`, no por `__DDM_GET_V5`. El 0 es correcto. | Ninguno: los 10 de T02 son V5 puros y resuelven `1/1`. | No corregir a ciegas; doble criterio V5 + patrón T3B en QA. |
| HUB-03 desviación 26,92 % | Caja `135×156` que el pintor de muros aplicaba **antes** de T01; el PNG no está deformado. | Ninguno; se midieron las cajas nuevas para detectar estiramientos. | No modificar el motor. |
| Costura media 12,57 | Métrica del tile de HUB-01; sin bandas visibles. | Ninguno: T02 no genera tiles ni `repeat`. | Mantener; no tocar el tile. |
| 2 × 404 Cloudflare | Externos y preexistentes. | Condicionan la comprobación 3: se clasifican por ruta. | No eliminar scripts. |

**No se ha modificado ningún sistema compartido sin justificación.**

### Evidencias

`ART_EVIDENCE/hub/tanda_02/`: `report.json`, `antes_runtime.json`, `control_runtime.json`, `despues_runtime.json` / `despues_runtime_full.json`, `audit_runtime.json`, `canvas_probe.json`, `visual_diff.json`, `comparativa_antes_despues.jpg`, `hashes.json`, 10 `audit_*.png`, 11 `antes_*.png`, `control_01_hub.png`, 15 `despues_*.png`, `doors_closed.png`, `doors_open.png`, `regresion_campaign.png`. **47 archivos, 71 MB; 37 capturas PNG reales del juego en ejecución.**

**Diferencias de píxel** (`visual_diff.json`, umbral 12 por canal, 15 comparativas; las capturas ANTES/CONTROL/DESPUÉS están en la misma cámara): principal ANTES↔DESPUÉS **9,84 %**, CONTROL↔DESPUÉS **12,59 %**, ANTES↔CONTROL **3,60 %**, zona central **8,55 %**, arcade **8,15 %**, arsenal **11,26 %**, sellos **4,45 %**, descenso **8,30 %**, pared este **8,23 %**, puertas cerradas↔abiertas **5,38 %**. ANTES↔CONTROL no es 0 % porque el HUB tiene animación continua (bailarines, neón, halo); el diferencial atribuible a T02 es el salto hasta DESPUÉS. Hoja visual lado a lado: `comparativa_antes_despues.jpg`.

---

## 8. Archivos de la entrega

**Modificado (1):** `ART_PACK/art_pack.js`.

**Nuevos — assets:** `ART_ASSETS/hub/tanda_02/manifest.json`, 10 PNG finales, 10 fuentes `_source/`.
**Nuevos — auditoría e inventario:** `ART_HUB_TANDA_02_AUDIT.md`, `ART_AUDIT/hub_tanda_02_needs_inventory.json`.
**Nuevos — herramientas:** `ART_TOOLS/prepare_hub_tanda_02.py`, `ART_TOOLS/qa/hub_tanda_02_audit.js`, `ART_TOOLS/qa/validate_hub_tanda_02.js`, `ART_TOOLS/qa/canvas_probe_hub_tanda_02.js`, `ART_TOOLS/qa/finalize_hub_tanda_02.py`.
**Nuevos — evidencias:** todo `ART_EVIDENCE/hub/tanda_02/`.
**Actualizados:** `CHANGELOG.md`, `ART_PRODUCTION_LOG.md`, `ASSET_INVENTORY.md`, `CURRENT_STATE.md`, `VISUAL_QA_REPORT.md`, este informe.

**Hashes:** `ART_EVIDENCE/hub/tanda_02/hashes.json` (SHA-256 de todos los archivos de la entrega, `report.json` firmado en último lugar). Los SHA-256 individuales de los 10 PNG están además en `manifest.json`.

---

## 9. Git

- Trabajo exclusivo en `arena/109fe45c-deadbeat-disconew`. **No se cambió de rama, no se tocó `main` ni `origin/main`, no se hizo merge automático.**
- PR #1 (TANDA 01) sigue `OPEN` / `mergedAt=null`; no se fusionó.
- Entrega: **commit + push en la rama de sesión y Pull Request hacia `arte-y-recursos` SIN fusionar**, según autorización explícita del usuario. `arte-y-recursos` contiene solo `README.md` en `origin`; el PR añade el árbol completo del proyecto sobre esa base.

---

## 10. Limitaciones y propuestas NO implementadas

- No se han añadido interacciones nuevas: animación por frames de recreativas/expendedora, señalética dinámica del círculo activo e interacciones en bancos/jardineras quedan **documentadas como propuesta** en `ART_HUB_TANDA_02_AUDIT.md` §5, a la espera de autorización.
- Los paños de suelo perimetrales y el corredor norte siguen sin identidad propia; se dejaron vacíos a propósito, no se generó nada «por rellenar una lista».
- Las capas cacheadas de `limbo_floor_medallion`, `limbo_gate_stage` y `wall_limbo_ticket_window` no se tocaron: su pertenencia al HUB no está confirmada.
- La comparación de píxeles mide cambio visual, no igualdad pixel a pixel: el HUB tiene animación continua (bailarines, neón, halo), por lo que ANTES↔CONTROL nunca es 0 %.

---

## 11. Recomendación de 10 elementos para la TANDA 03

Basada en las necesidades reales aún abiertas del inventario, sin repetir T01/T02:

| # | Elemento | Clase | Justificación |
|---|---|---|---|
| 1 | Paño de suelo perimetral O (O/E/S) | 3 | Superficie sin identidad entre medallón y muro; requiere tile o alfombra con función de zonificación |
| 2 | Paño de suelo perimetral E | 3 | Idem, con lectura de la zona de sellos y vending |
| 3 | Paño de suelo S / borde tras la grieta | 3 | Cierra visualmente el descenso sin tapar la grieta |
| 4 | Corredor norte junto a la cabina DJ | 3 | Zona de tránsito pobre; señalética de suelo o friso |
| 5 | Variante 2 de `club_neon_planter_prop` | 2 | Cuatro jardineras idénticas: romper repetición con un segundo diseño del mismo slot |
| 6 | Variante 2 de `limbo_bench_prop` | 2 | Bancos gemelos del descenso; variante de material/respaldo |
| 7 | `hub_vip_booth_lounge` | 4 | Clave consultada por el pintor de banner y ausente del registro; requiere pintor que la consuma |
| 8 | Cartel / señalética de zona (estática) | 4 | Las 6 zonas solo se leen por HUD; falta rotulación diegética art-déco |
| 9 | `wall_limbo_ticket_window` / `limbo_gate_stage` | 6 | Confirmar pertenencia al HUB antes de sustituir; están en cachés de arranque |
| 10 | Animación de pantallas de recreativas y expendedora | 6 | Propuesta de funcionalidad nueva: **requiere autorización previa**, no implementar sin ella |

Los puntos 1–4 deben resolverse como una **familia de suelos con función**, no como 4 decoraciones sueltas. Los puntos 7–10 exigen antes una auditoría de pintores/cachés como la realizada en T02.

---

## 12. Reproducción

```bash
# Preview (ya activo): python3 http.server en 0.0.0.0:8123 con / -> DEADBEAT_DISCO.ART.html
node --check ART_PACK/art_pack.js
PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/prepare_hub_tanda_02.py
QA_LIB=/tmp/qatools/node_modules/playwright-core CHROME_PATH=/tmp/chromium \
LD_LIB_PATH=/tmp/chromelibs/lib:/tmp node ART_TOOLS/qa/validate_hub_tanda_02.js
QA_LIB=/tmp/qatools/node_modules/playwright-core CHROME_PATH=/tmp/chromium \
LD_LIB_PATH=/tmp/chromelibs/lib:/tmp node ART_TOOLS/qa/canvas_probe_hub_tanda_02.js
PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_02.py
```

Detalle completo de cada comprobación, datos por asset, logs HTTP, secuencias de dibujo y hashes: `ART_EVIDENCE/hub/tanda_02/report.json` y los `*_runtime.json`.
