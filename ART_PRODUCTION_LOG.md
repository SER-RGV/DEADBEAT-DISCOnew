# REGISTRO DE PRODUCCIÓN ARTÍSTICA — DEADBEAT DISCO

> Una entrada por tanda. Los resultados de QA con su clasificación están en `VISUAL_QA_REPORT.md`.
> Convención: `VERIFICADA` / `PARCIALMENTE VERIFICADA` / `NO VERIFICADA` / `FALLIDA` / `BLOQUEADA`.

---

## TANDA 01 — Suelos, identidad de club y primeras familias

**Objetivo:** validar el pipeline completo (referencias → generación → preparación técnica → integración en loaders reales → juego ejecutado → capturas) con un lote pequeño y de alto impacto, sin tocar mecánicas.

**Referencias usadas:** `ART_REFERENCES/REF_01_identidad_banner.png` (logotipo brush, máscara zorro/lobo coronada, protagonista sentado, tagline, luz cian/magenta), `REF_02_circulos_jefes_escenarios.png` (9 bandas de paleta, 9 jefes de silueta diferenciada, 4 ejemplos in-game isométricos), `REF_03_biblioteca_assets_ui.png` (10 materiales de suelo, muros modulares góticos, props, catálogo de armas, pickups, efectos, HUD, menús, HUB isométrico). Analizadas antes de generar. Muestras de color en `ART_AUDIT/reference_palette.json` y `reference_accents.json`.

**Lenguaje extraído:** pintura/cómic de tinta con contorno negro, magenta/oro/cian/rojo sobre negro, bloom controlado, luz volumétrica, negativo oscuro, siluetas limpias, ornamento art-déco/gótico, alto detalle con jerarquía de lectura, **sin pixel art**. Jerarquía de contradicciones aplicada según `ART_BIBLE.md` §1.

**Especificaciones comunes:** isométrica 2:1, luz NW, rim magenta/cian, contorno de tinta cerrado, sin sombras horneadas, sin fondos de croma en el archivo final, sin dithering/ruido/pixelado. Dimensiones **idénticas** a las del recurso sustituido. Pivotes documentados por asset.

### Assets producidos (8)

| ID | Archivo | Dimensiones | Formato | Alpha | Pivote | Loader | Objetivo |
|---|---|---|---|---|---|---|---|
| `t3b_material_00` | `floor_00_obsidian_vein.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(0)` | Mármol negro veteado magenta/oro para campaña |
| `t3b_material_01` | `floor_01_neon_dancefloor.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(1)` | Pista con chevrones neón magenta/cian para HUB |
| `t3b_material_02` | `floor_02_gilded_mosaic.png` | 512×512 | PNG RGB | no | tile | `__T3B.reload(2)` | Mosaico dorado art-déco |
| `hub_fox_crest_emblem` | `hub_fox_crest_emblem.png` | 560×332 | PNG RGBA | sí (127.328 px) | center | `__DDM_V5_IMG` | Emblema zorro coronado, ancla de identidad |
| `decor_neon_rug` | `decor_neon_rug.png` | 456×243 | PNG RGBA | sí (53.528 px) | bottom-center | `__DDM_V5_IMG` | Alfombra isométrica neón/oro |
| `decor_potted_palm` | `decor_potted_palm.png` | 209×147 | PNG RGBA | sí (19.224 px) | bottom-center | `__DDM_V5_IMG` | Palmera en macetero cromado |
| `boss_01_anden` | `boss_01_anden.png` | 400×386 | PNG RGBA | sí (119.329 px) | bottom-center | `DMO_ILT.images/ready/meta` | Residente alto, abrigo negro con piping oro, halo magenta |
| `weapons/weapon_m1911.png` | `weapon_m1911.png` | 160×87 | PNG RGBA | sí (8.699 px) | center | `__HD_DATA` + `__HD_EXTRA` | Arma inicial, acero negro con oro y magenta |

Manifiesto con SHA-256, bytes, origen y alpha por asset: `ART_ASSETS/tanda_01/manifest.json`. Fuentes originales conservadas en `ART_ASSETS/tanda_01/_source/`. Script de preparación reproducible: `ART_TOOLS/prepare_tanda_01.py`.

**Comprobaciones de archivo (ejecutadas):** 8/8 PNG decodifican, dimensiones exactas, canal alfa real en los 5 recortes, 0 px transparentes en los 3 tiles opacos, sin recortes de silueta ni halos (revisión visual sobre fondo magenta de contraste). → **VERIFICADA**.

### Integración

`ART_PACK/art_pack.js` sustituye entradas de los 4 registros existentes; `DEADBEAT_DISCO.ART.html` lo carga con un único `<script>`. Sin gestores nuevos, sin dependencias nuevas, sin cambios de lógica. Detalle y justificación del flag `__T3B.enabled` en `ASSET_INTEGRATION_GUIDE.md`.

**Resultado de integración:** `DMO_ART_PACK.integrity()` → 8/8 `applied=true`, `live=true`, `exactSize=true` en tres ejecuciones (orden normal e invertido). `__T3B.draws` registró `choice:'candidate'` con el `src` de los assets nuevos en las rutas `hub` y `campaign`. → **VERIFICADA**.

### Pruebas ejecutadas

| Prueba | Herramienta | Resultado | Clasificación |
|---|---|---|---|
| Carga HTTP de build y paquete | `curl` | 200 / 13.381.028 B y 200 / 9.213 B | VERIFICADA |
| Integridad de 8 assets en registros vivos | `DMO_ART_PACK.integrity()` | 8/8 en 3 ejecuciones | VERIFICADA |
| Render real de materiales | `__T3B.draws` + capturas | `choice:'candidate'`, suelos visibles en HUB y `r0` | VERIFICADA |
| Capturas antes/después del juego real | CDP `shot()` | 6 PNG 1280×900 + 4 `roomCapture`; diff HUB 43,0 %, campaña 70,0 % | VERIFICADA |
| Regresión movimiento | `DMO.debug.state().px` | +402 (original) / +398 (con arte) | VERIFICADA |
| Regresión disparo | `shotsFired` + `wa` instrumentado | +3 disparos y 3 proyectiles en `wa` en ambas builds | VERIFICADA |
| Errores JS | `pageerror` / consola | 0 `pageerror`; 2 console errors 404 de Cloudflare (esperados, intactos) | VERIFICADA |
| Transición HUB → campaña `r0` | `DMO_HUB.state()` | completada con `lock:false`, `tc≥1`, control recuperado en ambas builds | VERIFICADA |
| Rendimiento | `tick(0.016,30)`, rAF | ver `VISUAL_QA_REPORT.md` §4 | VERIFICADA / PARCIALMENTE VERIFICADA |
| Pruebas manuales con GUI | — | entorno sin `DISPLAY`; no ejecutadas | **NO VERIFICADA** |
| Mando físico / gamepad | — | sin dispositivo | **NO VERIFICADA** |
| Resoluciones adicionales de HUD | — | solo 1280×900 | **NO VERIFICADA** |

Evidencias: `ART_EVIDENCE/tanda_01/`. Logs: `validation_run1.json`, `validation_run2_roomcapture.json`, `validation.json` (validación limpia), `validation_reverse.json`, `perf_probe.json`, `transition_probe.json`, `roomcapture_probe.json`.

### Problemas / decisiones

1. **Pintor de materiales desactivado.** `window.__T3B.enabled=false` en la build original (*cache probe*). Sustituir `__T3B_IMAGES[i]` sin más no produce cambio visible. Resuelto con `setEnabled(true)`, flag exclusivamente visual. Documentado.
2. **Coste de diagnóstico.** `__T3B.roomCapture()` (`toDataURL` sobre canvas grande) tarda ~47,5 s con texturas detalladas en SwiftShader y distorsionaba los tiempos de transición (20–55 s). Aislado con `ART_TOOLS/qa/roomcapture_probe.js`: sin esa llamada la campaña completa en ~2,3–3,2 s. La validación limpia la excluye; no es una regresión del juego.
3. **Orden de sesión.** La diferencia de tiempo de carga (14–31 s) correlaciona con que la build se cargue en segundo lugar en el mismo navegador, no con el paquete de arte (comprobado invirtiendo el orden).
4. **Alfa sobre fondos negros.** Umbral de inundación por asset: 10 por defecto conserva los negros interiores (traje, acero, pelo); 45 para el emblema elimina su halo de glow. Las bolsas negras cerradas grandes (interior del halo del jefe) se eliminan por componente conexo ≥1500 px. Sin halos blancos.
5. **Emblema:** persiste un halo granate muy fino alrededor del neón; sobre el fondo oscuro del HUB no se aprecia. Registrado como **PARCIALMENTE VERIFICADO** (calidad de recorte), sin impacto funcional.

### Pendiente para tandas futuras

Direcciones/animaciones del protagonista no auditadas fotograma a fotograma · 7 materiales T3B restantes · arquitectura modular (prioridad 3) · 10 sprites ILT restantes · 162 armas HD · HUD/menús/transiciones · verificación GUI y en varias resoluciones · reconciliación 4/10 vs 5/10 de Fase 0.3.1 (ver `VISUAL_QA_REPORT.md` §7; no se alteran los estados de INC‑001/INC‑002).

---

## TANDA 02 — Arquitectura modular de la discoteca

**Objetivo:** primera familia modular completa (máximo 10 piezas) generada, preparada e integrada en el sistema real de construcción de habitaciones, visible en partida y sin romper mecánicas.

**Inspección previa:** HTML ejecutable real, `ART_PACK/art_pack.js`, `ART_ASSETS/tanda_01/manifest.json`, `ART_AUDIT/asset_inventory.json` (100 slots V5, 18 de arquitectura), pintor de muros `$b`/`_b` (`panelCount = round(edge.len/230)`), pintor de puertas `Bg` (`df/dl/sf/sl/sg/dg`, `Ot.openT`), `sortY`, `Ps`/`Rs`, colisiones y límites. Las dimensiones de los slots se midieron antes de generar: **no se forzó 512×512**.

**Generación:** 10 ilustraciones HD individuales en `ART_ASSETS/tanda_02/_source/`; 10 PNG finales con las dimensiones exactas de 10 slots V5 reales, alfa real, pivote documentado y recorte reproducible (`ART_TOOLS/prepare_tanda_02.py`). El fondo se detecta por mediana de esquinas: 9 negros y `threshold_entry.png` blanco. Sin lámina, spritesheet, halos ni sombras horneadas.

**Integración:** se **amplió el loader existente** en `ART_PACK/art_pack.js` (`ARCHITECTURE`, `applyArch()`, `restoreArch()`, `architecture()`), usando la misma `load()` y el mismo `window.__DDM_V5_IMG` → `__DDM_GET_V5`. Se conservan las 10 imágenes previas en `ORIGINALS`, se registran alias trazables y se mantiene Tanda 01 intacta (8/8). **El HTML activo no se modificó**: `DEADBEAT_DISCO.ART.html` conserva `f231cfc7…723`. Sin segundo `<script>`, sin gestor de carga nuevo, sin canvas superpuesto. Es el motor quien dibuja cada módulo con sus `transform`, `sortY` y profundidad.

**Adaptaciones documentadas:** el motor no tiene sprite de «puerta abierta» (anima la misma hoja con `Ot.openT`) → A07 adaptada a hoja lateral; no ensambla esquinas como piezas geométricas (muros por `edge` con paneles) → A02/A03/A04 son acabados de panel, no sustitutos de pared/colisión; `campaign_door_leaf` es una sola hoja duplicada y espejada → A06 recorta la media puerta; A09 usa `contain` para conservar el diamante 2:1.

| Comprobación | Método | Resultado | Clasificación |
|---|---|---|---|
| 10 PNG: existencia, decodificación, dimensiones, alfa, fuentes | Pillow / `logs/file_checks.json` | 10/10 en los 4 apartados | VERIFICADA |
| Carga sin recursos faltantes | Playwright `requests` / `response` | 10 peticiones, 0 errores HTTP de arte | VERIFICADA |
| Referencias válidas en vivo | `DMO_ART_PACK.architecture()` | 10/10 `live`, `loaderResolves`, `aliasRegistered`, `originalPreserved`, `errors:[]` | VERIFICADA |
| Recursos anteriores | `integrity()` / V5 / ILT | T01 8/8, V5 100/100, ILT 11/11, 10 originales preservados | VERIFICADA |
| A/B en la MISMA build | `restore()` / `apply()` | 10 → 0 → 10; 12.437 px (1,08 %) de cambio aislado | VERIFICADA |
| Salas reales | `DMO.debug.setNight(24/35/90)` | `r0 → r23 → r34 → r89`; `floor 1→3→4→9`; 10/10/29 enemigos | VERIFICADA |
| NÚCLEO / A05 | `setNight(100)` | `ok:false`, sin cambio de sala | **NO VERIFICADA** |
| Puerta cerrada / abierta | `r23` sin despejar / `clearRound()` | 11 enemigos `secured:0` → 0 enemigos `secured:1` | VERIFICADA en `r23`; NO VERIFICADA en `r0` (`start` ya abierta) |
| Umbral sin falso obstáculo | captura + bbox A/B `(461,770)-(641,831)` | diamante 2:1 enrasado, jugador visible | VERIFICADA |
| Movimiento | `DMO.debug.state().px` | +205 (original) / +252 (activa) / +320 (`r23`) | VERIFICADA |
| Disparo + proyectiles `wa` | ticks forzados, ON/OFF/ON | +4 disparos y +4 `wa` en las 3 condiciones y por las 2 vías de entrada | VERIFICADA |
| Errores JS nuevos | `pageerror` / consola | 0 `pageerror` en ambas; 2×404 Cloudflare en ambas | VERIFICADA |
| Rendimiento hardware real | `tick30Ms`, rAF | 2,6 → 2,9 ms; `framesIn2s 6 → 0` bajo SwiftShader | **NO VERIFICADA** |
| GUI / mando | — | entorno sin `DISPLAY` | **NO VERIFICADA** |

Evidencias: `ART_EVIDENCE/tanda_02/{before,after,modular_connections,doors,gameplay,logs}/` (35 archivos). Logs: `validation.json`, `extra.json`, `doors.json`, `file_checks.json`, `visual_diff.json`.

### Problemas / decisiones de la Tanda 02

1. **HTML intacto.** Al ampliar el pack ya cargado no hubo que insertar un segundo `<script>`: se evitó cualquier riesgo sobre la build protegida y su hash.
2. **`shotDelta = 0` en la corrida principal.** Aislado con `validate_tanda_02_extra.js`: con ticks forzados, el disparo da +4/+4 con T02 ON, OFF y ON de nuevo. Causa: inanición de `requestAnimationFrame` bajo SwiftShader (`framesIn2s = 0`), **no** regresión del lote.
3. **`r0` no sirve para puerta cerrada.** Es sala `start` sin encuentro y `vg()` entrega `Ot.openT = .8`. Se usó `r23` de combate para la verificación real.
4. **DEF-001 (mezcla estilística).** `campaign_door_side_frame` se conservó sin sustituir para no exceder 10 assets ni deformar un marco horizontal en un slot vertical 72×176. Registrado con `doors/closed_closeup.png`, sin corrección improvisada.
5. **DEF-002.** A07 muestra el hueco cian en `t=0` y oscuro en `t=1`: es la animación de la hoja, no un cambio de sprite. Lógica de apertura intacta.
6. **Recortes de evidencia reencuadrados.** La cámara cambia entre salas; las regiones se localizaron por diferencia de píxeles A/B, no por coordenadas inventadas.
7. **Continuidad.** Cornisa en fila 0 y zócalo en la última fila en A01–A04; A02/A03/A04 con bordes equivalentes. A01 es isométrico con cara lateral: la métrica de columnas de borde no aplica, se evaluó visualmente.

### Pendiente para tandas futuras

Visibilidad aislada de A04/A06/A08/A10 y de A05 en el NÚCLEO · corrección de DEF-001 si se autoriza un asset adicional · 7 materiales T3B restantes · 10 sprites ILT restantes · 162 armas HD · HUD/menús/transiciones · verificación GUI, mando y varias resoluciones · rendimiento en hardware real.


---

## HUB · TANDA 01 — Reconstrucción de escenarios (2026-11-03)

**Objetivo:** diez assets reales con una sola familia visual, integrados en el HUB de la build activa y verificados en juego ejecutado.

**Auditoría previa:** `DEADBEAT_DISCO.ART.html` (Tanda 03 `faseD.2` presente), `ART_PACK/art_pack.js`, `ART_AUDIT/asset_inventory.json`, `ART_BIBLE.md`, `ASSET_INVENTORY.md`, informes de Tandas 01/02/03 y medición en runtime de los `drawImage` del HUB. Dimensiones tomadas del inventario y de la sonda, no inventadas.

**Generación:** 10 fuentes en `ART_ASSETS/hub/tanda_01/_source/` (HUB-01 1024×1024 con fondo oscuro; HUB-02 1376×768; HUB-03…10 1408×768 con fondo blanco). Pipeline `ART_TOOLS/prepare_hub_tanda_01.py`: `contain` + pivote sin deformar, extracción por esquinas, descontaminación, compatibilidad con el filtro del medallón y corrección de costura para el tile. 10/10 dimensiones exactas, 9/9 RGBA con alfa y bordes limpios, halo residual ≤4,48 %.

**Integración:** `ART_PACK/art_pack.js`, reutilizando `__T3B_IMAGES[1]` (HUB-01), el manifiesto de Tanda 02 (HUB-03) y `__DDM_V5_IMG` para los otros ocho. `restoreHub()` permite A/B sin recargar. Sin canvas nuevo, sin HUB estático, sin cambios de motor.

**QA:** `ART_TOOLS/qa/validate_hub_tanda_01.js`, Chromium 131 + Playwright 1.58.2, 12 comprobaciones ejecutadas → **12/12 APROBADO**. Capturas ANTES/CONTROL/DESPUÉS, por zona, puertas y campaña; `report.json`, `visual_diff.json` (60,17 % de píxeles cambiados control↔después), `hashes.json`.

**Clasificación de esta tanda:** **VERIFICADA** en lo técnico y visual; entrega Git **APROBADA** por autorización del usuario (commit/push en la rama de sesión + PR hacia `arte-y-recursos`, sin merge). Ver `ART_TANDA_01_HUB_REPORT.md`, sección 9.

---

## HUB · TANDA 02 — Expansión visual y arquitectónica (2026-11-03)

**Objetivo:** completar la segunda capa de objetos del HUB sin repetir la TANDA 01, partiendo de una auditoría visual real y sin tocar sistemas.

**Auditoría previa:** `ART_TOOLS/qa/hub_tanda_02_audit.js` sobre Chromium 131 + Playwright, 10 zonas del HUB real, 21 slots dibujados por fotograma, 118 claves V5, 6 zonas y 11 estaciones. Inventario de necesidades con 6 clases (más `INTERACTIVO` superimpuesta) en `ART_AUDIT/hub_tanda_02_needs_inventory.json` y `ART_HUB_TANDA_02_AUDIT.md`. Se descartaron los slots con 0 dibujos y los paños de suelo sin función.

**Lenguaje:** continuidad estricta con T01 — art-déco nocturna, latón/terciopelo/cristal/esmalte, negro profundo, rosa eléctrico, cian, violeta y amarillo ácido, perspectiva isométrica, ilustración estilizada, sin pixel art ni assets genéricos.

**Assets producidos (10)**

| ID | Archivo | Dimensiones | Slot V5 | Rol | Clase |
|---|---|---|---|---|---|
| T02-01 | `hub_t02_01_arcade.png` | 264×239 | `hub_arcade_shrine` | Recreativas F1 | 2 + 5 |
| T02-02 | `hub_t02_02_arsenal.png` | 360×253 | `hub_arsenal_shrine` | Arsenal D | 2 + 5 |
| T02-03 | `hub_t02_03_seals.png` | 244×237 | `hub_seals_shrine` | Espejo de Sellos F2 | 2 + 5 |
| T02-04 | `hub_t02_04_vending.png` | 100×152 | `club_vending_machine_prop` | Expendedora este | 2 |
| T02-05 | `hub_t02_05_cooler.png` | 61×136 | `club_water_cooler_prop` | Dispensador oeste | 2 |
| T02-06 | `hub_t02_06_bench.png` | 256×198 | `limbo_bench_prop` | Bancos del descenso | 2 |
| T02-07 | `hub_t02_07_planter.png` | 96×108 | `club_neon_planter_prop` | 4 jardineras | 2 |
| T02-08 | `hub_t02_08_liftpad.png` | 198×104 | `descent_abyssal_lift_pad` | Plataforma de descenso | 2 + 5 |
| T02-09 | `hub_t02_09_ceiling_fixture.png` | 148×38 | `wall_ceiling_neon_fixture` | Neón de techo (caché) | 2 |
| T02-10 | `hub_t02_10_sconce.png` | 48×60 | `club_wall_sconce_side` | Aplique de pared (caché) | 2 |

Fuentes originales conservadas en `_source/`. T02-04 se aisló con `sourceCrop=[510,0,925,768]` sin alterar la fuente. Preparación `contain` sin deformación: 10/10 tamaño exacto, alfa, esquinas transparentes, bordes limpios y halo ≤ 0,18 %. `manifest.json` registra función, ubicación, caja medida, anclaje, pivote y SHA-256.

**Integración:** `ART_PACK/art_pack.js`, mismo registro `__DDM_V5_IMG` y mismo `load()`. `applyHub2()` / `restoreHub2()` independientes de T01, `hub2Invalidate()` para las capas cacheadas, `run()` encadena T01 → arquitectura → HUB-T01 → HUB-T02. Sin segundo motor, sin canvas nuevo, sin cambios de geometría, colisiones, puertas, estaciones, música, HUD ni guardado. Sin interacciones nuevas.

**Clasificación de esta tanda:** **VERIFICADA**. QA A/B en 3 fases, 12/12 `APROBADO` (`ART_EVIDENCE/hub/tanda_02/report.json`), 10/10 visibles, T01 10/10 intacta, regresión en sala `r23`/`CAMPAIGN_ROOM`, `visual_diff.json`, `comparativa_antes_despues.jpg`, `hashes.json`. Informe: `ART_TANDA_02_HUB_REPORT.md`.

---

## Historial de versiones

| Fecha | Entrada |
|---|---|
| 2026-11-03 | Tanda 01: auditoría de 300 recursos, 8 assets generados e integrados, validación y cierre documental |
| 2026-11-03 | Tanda 02: 10 módulos de arquitectura integrados en el loader V5 real, HTML intacto, QA en 4 salas reales y cierre documental |
| 2026-11-03 | HUB · Tanda 01: 10 assets, 10 fuentes, integración real en loaders existentes, QA 12/12 y cierre documental |
| 2026-11-03 | HUB · Tanda 02: auditoría de 21 slots, 10 assets nuevos, integración V5, QA A/B 12/12 y cierre documental |


