# HUB · TANDA 05 — INFORME TÉCNICO DE INTEGRACIÓN

**Estado:** `APROBADO` · QA formal **14/14 APROBADO** · 0 FALLIDO · 0 BLOQUEADO · 0 NO VERIFICADO.
**Generado:** 2026-11-04T00:24:01.270076+00:00
**Build:** `DEADBEAT_DISCO.ART.html` (SHA `167a781261cf169c`) + `ART_PACK/art_pack.js` (SHA `335a4672c935afad`).

## 1. Trabajo recuperado (no se reconstruyó nada)

El sandbox anterior cayó durante el cierre. Se verificó antes de continuar: rama `arena/109fe45c-deadbeat-disconew`, HEAD `873f2b0`, `main`/`origin/main` en `d75e021`, PR #1 abierto sin merge, preview 8123 vivo (pid 4783), worktree con 2 archivos modificados y los árboles nuevos de TANDA 05. NO se regeneraron assets, NO se repitió la integración, NO se ejecutó `apply_hub_tanda_05.py`, NO hubo `git reset`/`git clean`. Se continuó desde el arnés A/B.

## 2. Auditoría del HUB real (ya realizada, conservada)

`ART_EVIDENCE/hub/tanda_05/audit_runtime.json` + 12 `audit_*.png`: 12 zonas, 27 canvas base, 142 claves V5, 11 estaciones, 32 assets de T01–T04 dibujados, 0 `pageerror`, 0 404 locales. Huecos: flancos norte del DJ, perímetros O/SW y E/SE, corredor central, barra sin rótulo y VIP sin límite de circulación.

## 3. Los diez recursos

| ID | Recurso | Categoría | Clase | Anclaje (x,y,h) | PNG | Mundo | Fuente → Final |
|---|---|---|---|---|---|---|---|
| T05-01 | Garra del Limbo | A · Máquinas y entretenimiento | Funcional (sin lógica nueva) | (455, 1310, 180) | 147×280 | [408, 1130, 95, 180] | `_source/…png` → `hub_t05_01_garra_del_limbo.png` |
| T05-02 | Banco del Olvido | A/D · Máquinas y terminales | Funcional (sin lógica nueva) | (2040, 1160, 150) | 133×240 | [1999, 1010, 83, 150] | `_source/…png` → `hub_t05_02_banco_del_olvido.png` |
| T05-03 | Stack de Subwoofers | B · Equipamiento de discoteca | Decorativo / equipamiento | (905, 430, 120) | 253×160 | [810, 310, 190, 120] | `_source/…png` → `hub_t05_03_subwoofer_stack.png` |
| T05-04 | Videowall | B/C · Equipamiento audiovisual y decoración | Ambiental animado | (1560, 360, 110) | 249×144 | [1465, 250, 190, 110] | `_source/…png` → `hub_t05_04_video_wall.png` |
| T05-05 | Consola Auxiliar | B · Equipamiento de discoteca | Funcional / decorativo | (1560, 520, 70) | 150×140 | [1523, 450, 75, 70] | `_source/…png` → `hub_t05_05_consola_aux.png` |
| T05-06 | Neón Último Trago | C · Decoración ambiental | Ambiental animado | (1910, 640, 96) | 201×192 | [1860, 544, 101, 96] | `_source/…png` → `hub_t05_06_neon_ultimo_trago.png` |
| T05-07 | Cartel Última Sesión | C · Decoración ambiental / objeto narrativo | Decorativo narrativo | (600, 760, 120) | 196×130 | [510, 640, 181, 120] | `_source/…png` → `hub_t05_07_cartel_ultima_sesion.png` |
| T05-08 | Line Array Colgante | B/C · Equipamiento / elemento colgante | Arquitectónico / ambiental | (1250, 720, 170) | 68×178 | [1218, 550, 65, 170] | `_source/…png` → `hub_t05_08_line_array.png` |
| T05-09 | Cordón VIP | C/D · Decoración y circulación | Arquitectónico (sin collider) | (930, 560, 80) | 128×120 | [888, 480, 85, 80] | `_source/…png` → `hub_t05_09_cordon_vip.png` |
| T05-10 | Confesionario de Quejas | A/D · Dispositivo del universo / interactividad potencial | Funcional (sin lógica nueva) | (1715, 700, 150) | 158×260 | [1670, 550, 91, 150] | `_source/…png` → `hub_t05_10_confesionario.png` |

**Detalle por asset** (ubicación, función, escala, transparencia, bordes/halos, pivote y anclaje):

- **T05-01 Garra del Limbo** — Máquina de garra con peluches fantasma; da identidad al cuadrante SW.. La auditoría visual muestra el perímetro suroeste (x 300-520, y 1150-1350) completamente vacío salvo el banco de recreativas en (655,1210). Es una máquina distinta del shrine de T02-01 (batería de 3 cabinas) y de la expendedora T02-04. Ubicación/anclaje `(455,1310)`, altura mundo `180`, pivote `bottom-center`, caja `[408, 1130, 95, 180]`, `flip=False`. PNG `147×280` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.002 %`, halo exterior eliminado en preparación. `drawImage=513`, `onScreen=172`, zonas completas: `vip_este, arcade, sellos`. Diff OFF/ON: señal `53.201 %` frente a ruido `0.685 %` (arcade).
- **T05-02 Banco del Olvido** — Terminal de fichas con mano esquelética; cierra el perímetro SE.. El cuadrante sureste (x 1980-2100, y 1000-1200) está vacío: el espejo de sellos está en (1845,1210) y la expendedora en (2048,692). No repite ningún terminal de T01-T04. Ubicación/anclaje `(2040,1160)`, altura mundo `150`, pivote `bottom-center`, caja `[1999, 1010, 83, 150]`, `flip=False`. PNG `133×240` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=726`, `onScreen=387`, zonas completas: `dj, bar, arcade, sellos, norte`. Diff OFF/ON: señal `43.662 %` frente a ruido `0.0 %` (pared_este).
- **T05-03 Stack de Subwoofers** — Cuerpo grave junto al flanco izquierdo de la cabina DJ.. El flanco norte izquierdo (x 800-1010, y 300-440) solo tiene el cartel narrativo y el sofá VIP; las torres de T01-06 son columnas estrechas (club_speaker_tower_prop). Falta un equipo de graves de gran volumen. Ubicación/anclaje `(905,430)`, altura mundo `120`, pivote `bottom-center`, caja `[810, 310, 190, 120]`, `flip=False`. PNG `253×160` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=748`, `onScreen=349`, zonas completas: `centro, bar, pared_oeste`. Diff OFF/ON: señal `21.669 %` frente a ruido `1.008 %` (vip_oeste).
- **T05-04 Videowall** — Pantalla modular sobre el muro norte; primera pantalla del HUB.. El muro norte a la derecha del DJ (x 1450-1680, y 230-370) está vacío; no existe ninguna pantalla ni panel AV en el HUB (solo letreros diegéticos). Ubicación/anclaje `(1560,360)`, altura mundo `110`, pivote `bottom-center`, caja `[1465, 250, 190, 110]`, `flip=False`. PNG `249×144` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=541`, `onScreen=225`, zonas completas: `centro, vip_oeste, vip_este, pared_oeste, norte`. Diff OFF/ON: señal `42.337 %` frente a ruido `0.0 %` (norte).
- **T05-05 Consola Auxiliar** — Equipo de control junto al flanco derecho de la cabina.. La cabina DJ de T01-04 es un único bloque; a su derecha (x 1500-1630, y 450-520) no hay equipo auxiliar. Complementa, no sustituye, el shrine. Ubicación/anclaje `(1560,520)`, altura mundo `70`, pivote `bottom-center`, caja `[1523, 450, 75, 70]`, `flip=True`. PNG `150×140` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=755`, `onScreen=748`, zonas completas: `centro, dj, vip_oeste, vip_este, pared_oeste`. Diff OFF/ON: señal `31.516 %` frente a ruido `0.0 %` (norte).
- **T05-06 Neón Último Trago** — Hito vertical luminoso sobre la barra «El Último Trago».. La barra (1910,845) tiene mostrador y botellas pero ningún rótulo colgante; la lámpara T01-08 es una araña central y T02-10 son apliques laterales. El neón no repite las 6 placas de T04. Ubicación/anclaje `(1910,640)`, altura mundo `96`, pivote `bottom-center`, caja `[1860, 544, 101, 96]`, `flip=False`. PNG `201×192` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=705`, `onScreen=643`, zonas completas: `dj, bar, vip_oeste, vip_este, norte`. Diff OFF/ON: señal `26.257 %` frente a ruido `1.392 %` (pared_este).
- **T05-07 Cartel Última Sesión** — Objeto narrativo en el muro oeste, entre arsenal y refrigerador.. El muro oeste (x 510-610, y 640-760) solo tiene el mostrador del arsenal más abajo; falta un objeto de pared con historia. No repite el tablón de trofeos T01-10 ni la señalética T04. Ubicación/anclaje `(600,760)`, altura mundo `120`, pivote `bottom-center`, caja `[510, 640, 181, 120]`, `flip=False`. PNG `196×130` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=530`, `onScreen=501`, zonas completas: `bar, vip_oeste, sellos`. Diff OFF/ON: señal `29.78 %` frente a ruido `0.22 %` (pared_oeste).
- **T05-08 Line Array Colgante** — Rigging aéreo sobre el corredor central de la pista.. El corredor central entre la cabina y el medallón (x 1130-1370, y 610-700) solo tiene haces de luz; falta equipamiento suspendido. Es un cluster volado, distinto de las torres de suelo T01-06 y de la araña T01-08. Ubicación/anclaje `(1250,720)`, altura mundo `170`, pivote `bottom-center`, caja `[1218, 550, 65, 170]`, `flip=False`. PNG `68×178` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=889`, `onScreen=876`, zonas completas: `centro, dj, bar, vip_oeste, sellos, pared_oeste, norte, pared_este`. Diff OFF/ON: señal `11.094 %` frente a ruido `0.619 %` (norte).
- **T05-09 Cordón VIP** — Delimita el acceso a la zona VIP oeste sin bloquear el paso.. La zona VIP oeste tiene sofá (785,545) y alcoba T03-07, pero ningún límite visual de circulación. solid:false -> 0 cambios de hitbox. Ubicación/anclaje `(930,560)`, altura mundo `80`, pivote `bottom-center`, caja `[888, 480, 85, 80]`, `flip=False`. PNG `128×120` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=759`, `onScreen=748`, zonas completas: `centro, bar, pared_oeste`. Diff OFF/ON: señal `19.224 %` frente a ruido `0.0 %` (norte).
- **T05-10 Confesionario de Quejas** — Terminal narrativa en la zona VIP este; humor negro.. La zona VIP este (x 1660-1780, y 550-690) está vacía entre el sofá (1715,545) y la placa E (1718,781). Aporta un dispositivo propio del universo sin repetir el espejo de sellos ni la barra. Ubicación/anclaje `(1715,700)`, altura mundo `150`, pivote `bottom-center`, caja `[1670, 550, 91, 150]`, `flip=False`. PNG `158×260` RGBA, alfa `[0, 255]`, esquinas transparentes, borde limpio, franja clara `0.0 %`, halo exterior eliminado en preparación. `drawImage=887`, `onScreen=645`, zonas completas: `centro, dj, vip_oeste, pared_oeste, norte, pared_este`. Diff OFF/ON: señal `46.94 %` frente a ruido `0.0 %` (bar).

**T05-08 conserva la composición VERTICAL (68×178) con escala ajustada a su bbox alfa; NO se regeneró horizontalmente** por el límite de 10 generaciones de imagen del turno de producción. Se documenta como incidencia `T05-08-VERTICAL`.

## 4. Integración (mínima, localizada, reversible)

- `ART_PACK/art_pack.js`: bloque `HUB5_*`, mismo `load()`, mismo `window.__DDM_V5_IMG` (142 → **152** claves), mismas invalidaciones (`DMO_INFERNAL_ART`, `__DDM_V5_MED_NO_SKULL`, `__T3B.setEnabled`). `loadHub5()` encadenado tras `loadHub2()`. API pública `hub5/hub5Manifest/hub5Restore/hub5Apply/hub5Tag`.
- `DEADBEAT_DISCO.ART.html`: 3 pares `TANDA05:BEGIN/END`, 10 entradas en el array REAL `hubDecor` → `addHubCustomProp` → `Lc` (Y-sort, `solid:false`, `tall:false`, `sortY=dc.y`). `imageSmoothingEnabled` para arte pintado, pulso de `globalAlpha` del ctx existente en T05-04/T05-06 y supresión de sombra `Vb` en los 4 colgantes. Flag reversible `window.__DDM_HUB_T05 !== false`.
- **Sin** segundo motor, canvas alternativo, caché nueva, loader paralelo, HUB estático, reescritura del HTML, geometría nueva, colisiones, estaciones, interacciones, progresión, combate, inventario, economía, guardado, música o DJ.

## 5. QA formal A/B de tres fases

`ART_TOOLS/qa/validate_hub_tanda_05.js` · Chromium 131 + Playwright-core · 1280×900 · SwiftShader · `page.screenshot()` · `bootToHub` = click(640,450)+Enter+Escape 2800 ms · 10 zonas idénticas.

| Fase | Flag | drawImage T05 | Mediana 40 rAF | pageErrors |
|---|---|---|---|---|
| ANTES | `false` | 0 | 16,7 ms | 0 |
| CONTROL | `true→false→true` | 0 → 10 → 0 → 10 | 16,7 ms | 0 |
| DESPUÉS | `activo` | 10 | 16,7 ms | 0 |

`hub5Restore()` → 0 dibujos; `hub5Apply()` → 10 dibujos. 0 dibujos en `menu-canvas54` (960×540) y en cualquier canvas ajeno al mundo. Los dibujos del HUB bajo la portada antes del boot se registran pero **NO se cuentan como integración**.

### 14 comprobaciones

| # | Comprobación | Estado |
|---|---|---|
| 1 | Carga de los diez assets: 10/10 PNG por HTTP 200, load() y registro V5 | APROBADO |
| 2 | Visibilidad: 10/10 drawImage medidos en el canvas de mundo, A/B 0→10→0→10 | APROBADO |
| 3 | Escala y dimensiones: aspecto nativo conservado, sin deformación | APROBADO |
| 4 | Perspectiva isométrica: misma proyección, pivote y Y-sort que T01–T04 | APROBADO |
| 5 | Transparencias y halos: alfa real, sin franja blanca ni halo exterior | APROBADO |
| 6 | Orden de capas y oclusión: Y-sort compartido, sin canvas nuevo ni sombra en colgantes | APROBADO |
| 7 | Movimiento del jugador: idéntico con el flag activado y desactivado | APROBADO |
| 8 | Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases | APROBADO |
| 9 | Puertas: ciclo noche/ronda, sala real r23 y arquitectura intacta | APROBADO |
| 10 | Estaciones: 11 intactas, apertura y cierre de modal sin cambios | APROBADO |
| 11 | Interacciones existentes: campaña, disparo y transición sin regresión | APROBADO |
| 12 | Regresión T01–T04: 10/10, 10/10, 13/13, 142 claves base y cachés intactas | APROBADO |
| 13 | Errores JavaScript y de carga: 0 errores JS, 0 404 locales, 0 errores de loader | APROBADO |
| 14 | Rendimiento: coste de render separado del coste de carga (sin cerrar el gate de T02) | APROBADO |

Prueba visual separada de la de carga: `visual_diff.json` mide, por caja de asset, dos capturas OFF (ruido) frente a OFF→ON en caliente (señal) en el MISMO contexto y cámara. **10/10 confirmados**, señal mínima 11.094 %, ruido máximo 1.392 %.

## 6. Tabla final de entrega

| Asset | Generado | Integrado | Visible | Validado |
|---|---|---|---|---|
| T05-01 Garra del Limbo | SÍ | SÍ (513 drawImage) | SÍ (172 en pantalla, 3 zonas completas) | APROBADO |
| T05-02 Banco del Olvido | SÍ | SÍ (726 drawImage) | SÍ (387 en pantalla, 5 zonas completas) | APROBADO |
| T05-03 Stack de Subwoofers | SÍ | SÍ (748 drawImage) | SÍ (349 en pantalla, 3 zonas completas) | APROBADO |
| T05-04 Videowall | SÍ | SÍ (541 drawImage) | SÍ (225 en pantalla, 5 zonas completas) | APROBADO |
| T05-05 Consola Auxiliar | SÍ | SÍ (755 drawImage) | SÍ (748 en pantalla, 5 zonas completas) | APROBADO |
| T05-06 Neón Último Trago | SÍ | SÍ (705 drawImage) | SÍ (643 en pantalla, 5 zonas completas) | APROBADO |
| T05-07 Cartel Última Sesión | SÍ | SÍ (530 drawImage) | SÍ (501 en pantalla, 3 zonas completas) | APROBADO |
| T05-08 Line Array Colgante | SÍ | SÍ (889 drawImage) | SÍ (876 en pantalla, 8 zonas completas) | APROBADO |
| T05-09 Cordón VIP | SÍ | SÍ (759 drawImage) | SÍ (748 en pantalla, 3 zonas completas) | APROBADO |
| T05-10 Confesionario de Quejas | SÍ | SÍ (887 drawImage) | SÍ (645 en pantalla, 6 zonas completas) | APROBADO |

## 7. Incidencias históricas (sin corregir a ciegas)

`HUB-01` loaderResolves=0, desviación 26,92 % de `HUB-03`, costura 12,57 de T01, rozamiento 3–5 px de placa C de T04 y **gate de rendimiento de T02 pendiente de cierre formal** se conservan. Ninguna afecta a TANDA 05: `incidencias.json` registra estado y evidencia de cada una.

## 8. Propuestas NO implementadas (sin sistemas nuevos)

T05-01, T05-02, T05-05 y T05-10 son **funcionales solo en apariencia**. Cualquier interacción real exigiría programación nueva (inventario, economía, diálogo, guardado, estaciones o UI) y queda documentada como PROPUESTA: `NO VERIFICADO`, sin implementar, sin autorización.

## 9. Zonas que siguen necesitando reconstrucción · recomendación TANDA 06

Con T05 quedan equipados los flancos, el corredor central, la barra y el VIP, pero la **envolvente arquitectónica sigue siendo la capa más débil**: paramentos y techos sin acabado, columnas y luminarias de techo genéricas, bordes de suelo y transiciones de acceso, cortinajes/absorbentes acústicos y atmósfera volumétrica (humo, haces de luz, reflejos). Se recomienda **TANDA 06 — «Envolvente arquitectónica y atmósfera»**: 10 recursos nuevos para techos, paramentos, columnas, remates de suelo, cortinajes, luminarias colgantes y capas de luz ambiental, integrados con los mismos `load()`/`hubDecor`/Y-sort y el mismo arnés A/B. Quedan FUERA de alcance, salvo autorización explícita: animación de recreativas/expendedora, `wall_limbo_ticket_window`, `limbo_gate_stage`, efectos dinámicos y sistemas de estaciones/puertas; además debe resolverse formalmente el gate de T02 sin sobreescribir los históricos `BLOQUEADO` de T03.

## 10. Evidencias

`report.json`, `resultados_ab.json`, `draw_calls.json`, `performance.json`, `visual_diff.json`, `alpha_verification.json`, `verificacion_carga.json`, `comprobacion_caches.json`, `diff_scope.json`, `integridad_t01_t04.json`, `incidencias.json`, `version_probe.json`, `hashes.json`, `qa_validation.log`, `qa_finalize.log`, 12 `audit_*.png`, 10 pares `antes_*/despues_*`, 10 `comparativa_*.jpg`, tripletas `control_off_a_*/control_off_b_*/control_on_*`, `comparativa_control_off_on.jpg` y `comparativa_antes_despues.jpg`.
