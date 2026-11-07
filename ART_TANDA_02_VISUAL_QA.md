# QA visual — Fase 1 · Tanda 02

**Fecha:** 2026-11-03 · **Entorno:** Chromium 153 headless + `playwright-core` 1.64.1,
SwiftShader, sin GUI ni mando. Capturas mediante `Page.captureScreenshot` (CDP)
sobre el juego real servido en `127.0.0.1:8123`. Viewport 1280×900.
**Builds:** `v9_t3_fase1b_cache_probe.html` (antes) y `DEADBEAT_DISCO.ART.html`
(después, T01+T02, HTML sin modificar).

> Todas las capturas son del juego real. Los archivos `*closeup.png` son
> **ampliaciones** de esas capturas y llevan la etiqueta dentro de la imagen.
> `module_strip.png` es una **composición auxiliar de comprobación** y está
> etiquetada explícitamente como «NO captura del juego». No hay capturas
> sintéticas ni pruebas manuales simuladas.

---

## 1. Inventario de evidencia

### `before/` (build original y, para el A/B, la misma build con `restore()`)
| Archivo | Contenido |
|---|---|
| `01_hub.png` | HUB sin ningún arte nuevo |
| `02_room.png` | Sala `r0` original |
| `03_room_modules_off.png` | **Misma build activa**, mismos parámetros, con los 10 módulos T02 retirados (`restore()`); T01 sigue aplicada |

### `after/`
| Archivo | Contenido |
|---|---|
| `01_hub.png` | HUB con T01 + T02 |
| `02_room.png` | Sala `r0` con T01 + T02 |
| `03_room_modules_on.png` | **Misma build activa**, mismos parámetros, con los 10 módulos T02 aplicados (`apply()`) |

### `modular_connections/`
| Archivo | Contenido |
|---|---|
| `before_overview.png`, `after_overview.png` | Vista general de la sala, antes/después |
| `overview_closeup.png` | Ampliación del muro superior de `r0`: módulo A02 (cornisa/columnas doradas) localizado por diferencia A/B `(550,0)-(730,95)` |
| `corner_closeup.png` | Ampliación del muro superior de `r23` (círculo C3 GULA) con los paneles repetidos por `edge` |
| `walls_upper.png` | Captura completa de la sala de combate usada para las puertas |
| `circle_02_gula.png` | Sala real `r23`, C3 GULA, 10 enemigos: **A01 por panel** + A07 + A09 |
| `circle_03_avaricia.png` | Sala real `r34`, C4 AVARICIA, 10 enemigos: **A03** + A01 + A07 + A09 |
| `circle_08_traicion.png` | Sala real `r89`, C9 TRAICIÓN, 29 enemigos (muro fuera de encuadre) |
| `circle_09_nucleo.png` | Intento de NÚCLEO: `setNight(100)` devolvió `ok:false`; **NO VERIFICADO** |
| `module_strip.png` | Composición auxiliar de continuidad A01–A04 (NO captura de juego) |

### `doors/`
| Archivo | Contenido |
|---|---|
| `before_closed.png`, `before_open.png`, `after_closed.png`, `after_open.png` | `r0` (sala `start`): puertas ya abiertas por diseño, sin transición verificable |
| `closed_real.png` | Sala de combate `r23` **sin despejar** (11 enemigos, `secured:0`) → puerta cerrada real |
| `open_real.png` | `r23` **despejada** (0 enemigos, `secured:1`) → puerta abierta real |
| `closed_closeup.png`, `open_closeup.png` | Ampliaciones de la puerta lateral: desplazamiento de la hoja A07 con `Ot.openT` |
| `threshold_closeup.png` | Umbral A09: diamante 2:1 dorado con línea magenta, enrasado en el suelo, localizado por diferencia A/B `(461,770)-(641,831)` |

### `gameplay/`
| Archivo | Contenido |
|---|---|
| `before_player.png`, `after_player.png` | Jugador en pantalla, antes/después |
| `player_closeup.png`, `combat_closeup.png` | Ampliaciones del jugador |
| `combat_player.png` | Jugador en sala de combate `r23` con los 10 módulos aplicados |

### `logs/`
`validation.json`, `extra.json`, `doors.json`, `file_checks.json`, `visual_diff.json`.

---

## 2. Revisión visual realizada

Las siguientes imágenes fueron abiertas y examinadas una a una (no solo
comprobada su existencia):

| Imagen | Observación real |
|---|---|
| `ART_ASSETS/tanda_02/_source/wall_straight.png` | Panel isométrico con cornisa y zócalo dorados, pilastras estriadas, franja magenta central, cara lateral derecha con rim cian; fondo negro limpio |
| `ART_ASSETS/tanda_02/_source/door_open.png` | Puerta doble abierta con marco Art Deco dorado y hueco cian; composición frontal, coherente con la orientación frontal de `Bg` |
| `ART_ASSETS/tanda_02/_source/threshold_entry.png` | Diamante 2:1 con doble borde dorado y línea magenta; **fondo blanco**, corregido en el recorte por detección de esquinas |
| `/tmp/t02_diag.png` (diagnóstico, no entregable) | Los 10 PNG sobre magenta: sin halos, sin restos de fondo, sin recortes de bordes; alfa real |
| `module_strip.png` | A01–A04 comparten cornisa/zócalo/contorno/luz NW; A02 esquina interior, A03 esquina exterior en V, A04 terminal |
| `/tmp/t02_ab.png` (diagnóstico) | Comparativa directa OFF/ON en la misma build: cambio visible en muro superior (módulo dorado) y en el umbral inferior |
| `corner_closeup.png` (primera versión) | Mostraba suelo/jugador, **no** esquinas → recorte corregido, documentado, sin tocar el sistema |
| `after/01_hub.png` | HUB con suelos T01, emblema, neón; A10 registrado pero no aislable visualmente entre la decoración |
| `circle_02_gula.png` | **A01 claramente visible** en el muro superior (columnas doradas) y umbral A09 en la puerta sur; enemigos presentes |
| `circle_03_avaricia.png` | **A03 visible** en panel superior izquierdo, A01 en el centro, A09 abajo, puertas laterales con A07 |
| `circle_08_traicion.png` | Cámara centrada en la pista; el muro superior queda fuera del encuadre → A04 no aislable |
| `modular_connections/overview_closeup.png` | Módulo A02 en el muro superior de `r0`, parcialmente cubierto por el indicador «01» del HUD (HUD intacto, no modificado) |
| `doors/threshold_closeup.png` | Diamante 2:1 dorado con línea magenta central integrado en el suelo, sin escalón ni falso obstáculo; se lee «SALA 03» |
| `doors/closed_closeup.png` | Puerta lateral `sellada`: marco metálico original + hoja A07 con hueco cian; **DEF-001** |
| `doors/open_closeup.png` | Misma puerta tras despejar: la hoja se ha desplazado y el hueco queda oscuro; apertura por animación, no por cambio de sprite |
| `gameplay/…` | Jugador visible en el centro de la pista en `r0` y en `r23`; los módulos no lo tapan |

---

## 3. Diferencias medidas (Pillow, umbral 18)

| Comparación | Píxeles | Ratio | Interpretación |
|---|---|---|---|
| A/B misma build (`03_room_modules_off` vs `_on`) | 12.437 | 1,08 % | **Aislada de T02**. Cambios en `(550,0)-(730,95)` y `(461,770)-(641,831)` |
| Build original vs build activa (`02_room`) | 474.476 | 41,19 % | Incluye T01 + T02, **no** es medida de T02 |
| `r0` `after_closed` vs `after_open` | 246 | 0,021 % | Sala `start` ya abierta: sin transición verificable |
| `r23` `closed_real` vs `open_real` | 615.489 | 53,43 % | Incluye desaparición de 11 enemigos y cambios de HUD; **no atribuible solo a la puerta** |

---

## 4. Continuidad de la familia de muro

`logs/file_checks.json` → `edgeContinuity`:

| Asset | Cornisa (fila) | Zócalo (fila) | Desajuste de bordes | Interpretación |
|---|---|---|---|---|
| A01 `wall_straight` | 0 | 175 | 93,75 % | **NO APLICABLE**: isométrico con cara lateral, siluetas distintas por diseño |
| A02 `wall_corner_inner` | 0 | 143 | 0,69 % | Bordes equivalentes |
| A03 `wall_corner_outer` | 0 | 85 | 1,16 % | Bordes equivalentes |
| A04 `wall_end_cap` | 0 | 63 | 10,94 % | Bordes equivalentes |

Los 4 módulos sitúan la cornisa en la fila 0 y el zócalo en la última fila:
**no hay escalón de moldura** al concatenar. La ausencia de huecos en el juego se
comprueba visualmente en `r0`, `r23` y `r34`: el motor sigue dibujando el cuerpo
procedural del muro por `edge` detrás de los acabados, por lo que un panel nunca
deja un vacío. Clasificación: **PARCIALMENTE VERIFICADO** (métrica válida solo en
módulos de frente plano; A01 evaluado visualmente).

---

## 5. Defectos registrados con evidencia

| ID | Defecto | Evidencia | Decisión |
|---|---|---|---|
| **DEF-001** | `campaign_door_side_frame` se conservó sin sustituir (máximo 10 assets, y un marco horizontal 196×124 se deformaría en un slot vertical 72×176). En `r23` el marco metálico con franjas amarillas convive con la hoja Art Deco A07: mezcla estilística visible. | `doors/closed_closeup.png`, `doors/open_closeup.png` | Registrado. No se improvisa corrección que afecte al sistema ni se añade un asset 11. |
| **DEF-002** | A07, concebida como «puerta abierta», muestra el hueco cian en `t=0` y el hueco oscuro en `t=1`, porque el motor anima la misma hoja y no cambia de sprite. | `doors/closed_closeup.png` vs `doors/open_closeup.png`; `logs/doors.json` | Incompatibilidad documentada y adaptada; lógica de apertura intacta. |
| **DEF-003** | Primer `corner_closeup.png` y primeros recortes de puerta apuntaban a zonas equivocadas al cambiar la cámara entre salas. | versión sustituida; `logs/visual_diff.json` con bbox localizados | Recortes reencuadrados por diferencia de píxeles, no por coordenadas inventadas. Sin cambios en el juego. |
| **DEF-004** | En `r89` el muro superior queda fuera del encuadre; A04 no se aísla. NÚCLEO inalcanzable (`setNight(100)` → `ok:false`), A05 sin verificación visual. | `circle_08_traicion.png`, `circle_09_nucleo.png`, `logs/extra.json` | `PARCIALMENTE VERIFICADO` / `NO VERIFICADO`. |
| **DEF-005** | HUD (indicador «01», carteles de sala) cubre parcialmente algunos módulos de muro. | `overview_closeup.png`, `threshold_closeup.png` | HUD intacto por restricción absoluta; se documenta, no se modifica. |

---

## 6. Comprobaciones técnicas (resumen)

| Comprobación | Resultado | Clasificación |
|---|---|---|
| Los 10 archivos existen y decodifican como PNG | 10/10 | VERIFICADO |
| Dimensiones coinciden con el manifiesto | 10/10 | VERIFICADO |
| Canal alfa real con transparencia | 10/10 (`0..255`) | VERIFICADO |
| Fuentes originales conservadas | 10/10 | VERIFICADO |
| Carga sin errores / sin recursos faltantes | 10 peticiones, 0 errores HTTP de arte | VERIFICADO |
| Referencias válidas en vivo | 10/10 `live`, `loaderResolves`, `aliasRegistered`, `originalPreserved` | VERIFICADO |
| Recursos previos conservados | 10 originales + T01 8/8 + V5 100/100 + ILT 11/11 | VERIFICADO |
| Sin errores JS nuevos | 0 `pageerror` en ambas; 2×404 Cloudflare en ambas | VERIFICADO |
| Sin colisiones inesperadas / movimiento | `+205` px antes, `+252` px después; `+320` px en `r23` | VERIFICADO |
| Disparo y proyectiles del jugador (`wa`) | +4/+4 con y sin T02 (ticks forzados) | VERIFICADO |
| Comportamiento de puertas | cerrada (11 enemigos) → abierta (0 enemigos, `secured:1`) | VERIFICADO en `r23`; NO VERIFICADO en `r0` |
| Umbrales sin obstáculo ni falsa colisión | diamante enrasado, jugador cruza la zona | VERIFICADO |
| Sin huecos / solapamientos | revisión visual + cornisa compartida | PARCIALMENTE VERIFICADO |
| Que los módulos no tapen al personaje | jugador visible en 3 capturas | VERIFICADO |
| Profundidad / oclusión | pintor real `$b`/`Bg` conserva `sortY` | VERIFICADO (por diseño, sin cambios) |
| Rendimiento antes/después en hardware real | `tick30Ms 2,6 → 2,9`, `framesIn2s 6 → 0` bajo SwiftShader | **NO VERIFICADO** |
| Pruebas con GUI / mando real | entorno sin GUI (heredado de Fase 0.3.1) | **NO VERIFICADAS** |

---

## 7. Clasificación final del QA visual

**PARCIALMENTE VERIFICADO.**

La familia modular está integrada en el sistema real, es visible en partida en
varias salas, conserva todos los recursos anteriores, no rompe mecánicas y cuenta
con capturas antes/después, de conexiones, esquinas, puerta cerrada, puerta
abierta, umbrales y jugador. Quedan sin verificación: la visibilidad aislada de
A05 en el NÚCLEO, la de A04/A06/A08/A10, el rendimiento en hardware real y las
pruebas manuales con GUI. DEF-001 (mezcla estilística del marco lateral) queda
registrado con evidencia y sin corrección improvisada.
