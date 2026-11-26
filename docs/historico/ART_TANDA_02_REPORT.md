# DEADBEAT DISCO — Fase 1 · Tanda 02
## Reconstrucción artística: arquitectura modular de la discoteca

**Fecha:** 2026-11-03 · **Rama:** `arena/b89cd6bc-deadbeat-disco`
**Estado:** ejecutado y validado en Chromium headless sobre el juego real.
**Prerrequisito:** Tanda 01 cerrada en `7ce812c` (push confirmado), no regenerada ni modificada.

---

## 1. Qué se pidió y qué se hizo

Se pidió la **primera familia modular completa de arquitectura interior**, máximo 10
assets, generados, preparados, **integrados en el sistema real de construcción de
habitaciones** y visibles en partida, sin tocar geometría, colisiones, combate, IA,
Director, controles, progresión, guardado, economía, balance, oleadas, narrativa,
transiciones ni HUD.

Se entregaron **10 PNG individuales** con sus fuentes originales, un `manifest.json`
completo, la extensión del **loader V5 ya existente**, una demostración en **salas
reales** (`r0`, `r23`, `r34`, `r89`), 3 corridas de QA en Chromium/Playwright, 35
archivos de evidencia y los 3 documentos exigidos.

**Decisión de arquitectura clave: el HTML activo NO se ha modificado.**
`DEADBEAT_DISCO.ART.html` ya cargaba `ART_PACK/art_pack.js`. Se amplió ese mismo
script —el mismo registro, la misma función `load()`, el mismo `applyV5`— con las 10
entradas nuevas. No hay un segundo `<script>`, ni un segundo loader, ni un canvas
superpuesto. Es el propio motor quien dibuja cada módulo dentro de su pipeline.

---

## 2. Inspección previa (estática, sobre el HTML ejecutable real)

| Elemento | Hallazgo real |
|---|---|
| Build activa | `DEADBEAT_DISCO.ART.html`, 13.381.028 B, SHA `f231cfc7…723` (sin modificar en T02) |
| Original / backup | `v9_t3_fase1b_cache_probe.html` y `backups/…ORIGINAL.html`, SHA `b2ef4ad8…d4a` (intactos) |
| Registro de assets | `window.__DDM_V5_IMG` (`Object.create(null)`), leído por `window.__DDM_GET_V5(k)` que exige `complete && naturalWidth>0` |
| Pintor de muros | `$b(ctx, edge, theme, idx)` y su wrapper v8.6: `panelCount = Math.max(1, Math.round(edge.len/230))`, `panelW = edge.len/panelCount`, `ctx.transform(ux,uy,0,1,edge.a.x,edge.a.y)`, `wallH` 180/190/205 |
| Paneles de muro | `_b(ctx,i,y,o,r,t)` → `__DDM_GET_V5("wall_stained_glass_arch")`; `wall_limbo_ticket_window` (círculo 0, `c%3==1`); `wall_avaricia_vault_door` (`o===3`); `wall_traicion_glacier_panel` (`o===8`); `wall_neon_club_crest` (`o===1`, `c%2===0`); `wall_limbo_ticket_window` también actúa como guarda del wrapper procedural |
| Pintor de puertas | `Bg(door)` (definición final en ~5.789.700): `df`/`dl`/`sf`/`sl`/`sg`/`dg`, con `o = min(1, Ot.openT/.8)`; puerta sur `ny>.58` (`df` 192×122, `dl` 60×80 duplicada y desplazada `58*o`), puerta norte `sg` 196×67, laterales `sf` 74×180 + `sl` 48×136 desplazada `118*o`, diagonal `dg` 128×162 |
| Apertura | `Sg(e,a,t)` incrementa `Ot.openT` hasta `.8` si la sala está despejada (`hg(pg())`); `vg()` fija `Ot.openT = hg(o) ? .8 : 0` al entrar |
| Círculos | `Ge = 11` salas/círculo; `Xe(n) = floor((n-1)/11)`; `n>=100` → NÚCLEO. `DMO.debug.setNight(n)` → `_m(n)` → `vg("r"+(n-1))` |
| Profundidad | `sortY` / `wallY` / props `tc` ordenados por `y` en `Qf()`; los muros se pintan antes que entidades |
| Colisiones / límites | Pertenecen al motor (`Ps`, `Rs`, `ic()`, `hasV5Slot()` en props). **No se tocaron.** Los nuevos assets son acabados dibujados por el pintor, no sustitutos de pared ni de colisionador |

`ART_AUDIT/asset_inventory.json` (Tanda 01) confirmó 100 slots V5 y 18 relacionados
con arquitectura. Las dimensiones naturales de los slots elegidos se midieron antes
de decidir el tamaño de los PNG: **no se forzó 512×512**.

---

## 3. Los 10 assets y su mapeo a slots reales

| ID | Módulo | Slot V5 consumido por el motor | PNG final | Pivote | Consumidor real |
|---|---|---|---|---|---|
| A01 | `wall_straight` | `wall_stained_glass_arch` | 120×176 RGBA | bottom-center | `_b()` por panel |
| A02 | `wall_corner_inner` | `wall_limbo_ticket_window` | 144×144 RGBA | bottom-center | `$b` wrapper, `o===0 && c%3==1` |
| A03 | `wall_corner_outer` | `wall_avaricia_vault_door` | 150×86 RGBA | bottom-center | `$b` wrapper, `o===3` |
| A04 | `wall_end_cap` | `wall_traicion_glacier_panel` | 124×64 RGBA | bottom-center | `$b` wrapper, `o===8` |
| A05 | `wall_pillar` | `nucleo_pillar_prop` | 204×505 RGBA | bottom-center | `hasV5Slot()` / props con colisionador |
| A06 | `door_closed` | `campaign_door_leaf` | 76×54 RGBA | center | `Bg` puerta sur, `58*o` |
| A07 | `door_open` | `campaign_door_side_leaf` | 52×136 RGBA | center | `Bg` puerta lateral, `118*o` |
| A08 | `doorway_frame` | `campaign_door_frame` | 196×124 RGBA | center | `Bg` puerta sur, 192×122 |
| A09 | `threshold_entry` | `campaign_door_south_gate` | 196×67 RGBA | center | `Bg` puerta norte, 196×67 |
| A10 | `wall_neon_detail` | `wall_neon_club_crest` | 84×84 RGBA | center | `$b` / HUD escénico 44×44, 48×48, 52×52 |

Detalle completo (dimensiones, alfa, umbral de recorte, recorte reproducible,
pivote, loader, referencias de código, adaptación, estado y evidencia) en
`ART_ASSETS/tanda_02/manifest.json` y `ART_TANDA_02_MANIFEST.md`.

### Dirección artística
Ilustración HD, contorno de tinta oscuro y cerrado, volúmenes legibles, cornisa y
zócalo Art Deco en oro compartidos por los 4 módulos de muro, neón magenta/cian
contenido, luz NW con rim magenta/cian, diamante 2:1 en el umbral. Paleta
`#0a0c12 #191a25 #2d0619 #ff2d95 #facc15 #f0e090 #38bdf8 #22d3ee #c084fc`.
Sin pixel art, dithering, ruido, fondos croma ni sombras horneadas.

### Preparación reproducible
`ART_TOOLS/prepare_tanda_02.py` (Pillow): detecta el color de fondo **por mediana de
las 4 esquinas** (9 fuentes con fondo negro, `threshold_entry.png` con fondo
**blanco**), clave por distancia con umbral por asset y rampa de antialias, cierra
huecos interiores legítimos por componentes conexas que no tocan el borde, recorta
al bbox alfa, escala con LANCZOS al tamaño exacto del slot (`fit` o `contain`) y
guarda RGBA. Las 10 fuentes se conservan íntegras en `ART_ASSETS/tanda_02/_source/`.

---

## 4. Integración (código)

`ART_PACK/art_pack.js` pasó de 9.213 B a 16.692 B. Cambios:

- `ARCHITECTURE[]`: las 10 entradas con `slot` real + `alias` trazable
  (`t02_A01_wall_straight`, …), mismas `load()` y `applyV5()` de Tanda 01.
- `ORIGINALS{}`: **se conserva la imagen previa de cada slot** antes de sustituirla.
- `applyArch()` / `restoreArch()` / `loadArchitecture()`: un único registro
  `window.__DDM_V5_IMG`. No hay gestor de carga nuevo.
- `architecture()`: comprueba en vivo `loaded`, `natural`, `exactSize`, `live`,
  `loaderResolves`, `aliasRegistered`, `originalPreserved`.
- `restore()` / `apply()`: **solo para QA A/B** en la misma build; no participan
  en el render del juego.
- `st.archErrors` separado de `st.errors`: un fallo de T02 no reclasifica el estado
  ya verificado de T01.

**No se modificó:** el HTML activo, el HTML original, el backup, `main`, ni ningún
sistema ajeno al arte. No se añadieron dependencias.

### Incompatibilidades documentadas (no forzadas)

1. **El motor no tiene un sprite de "puerta abierta".** La apertura es animación
   por desplazamiento de la **misma** hoja (`58*o` sur, `118*o` lateral) gobernada
   por `Ot.openT`. A07 se adaptó a la franja central del hueco y se registró como
   hoja lateral; **no se cambió la lógica de apertura**.
2. **El motor no ensambla esquinas como piezas geométricas.** Construye muros por
   `edge` continuo con paneles; A02/A03/A04 son acabados de panel dentro de ese
   sistema, no piezas con geometría/colisión propias. La continuidad la garantiza
   el cuerpo de muro procedural que el motor sigue dibujando detrás.
3. **A06 es una sola hoja.** El slot `campaign_door_leaf` se dibuja dos veces
   (la segunda espejada), por lo que se recortó la media puerta izquierda de la
   fuente en lugar de usar la puerta doble completa.
4. **A09 se integró con `contain`** (padding transparente) para conservar el
   diamante 2:1 completo sin deformarlo en un slot 196×67 (2,93:1).

---

## 5. Evidencia y validación

`ART_EVIDENCE/tanda_02/` con las carpetas exigidas: `before/`, `after/`,
`modular_connections/`, `doors/`, `gameplay/`, `logs/`. 35 archivos; todas las
capturas son `Page.captureScreenshot` (CDP) del **juego real**. Los `*closeup.png`
son ampliaciones de esas capturas (etiquetadas como tales); `module_strip.png` es
una composición auxiliar de comprobación de continuidad, **no** una captura de
juego, y así se etiqueta dentro de la propia imagen.

Scripts ejecutados (todos con `exit_code 0`):

| Script | Resultado |
|---|---|
| `ART_TOOLS/qa/validate_tanda_02.js` | antes/después, HUB→`r0`, A/B misma build, regresión, rendimiento, consola |
| `ART_TOOLS/qa/validate_tanda_02_extra.js` | aislamiento del disparo con ticks forzados, recorrido de círculos reales |
| `ART_TOOLS/qa/validate_tanda_02_doors.js` | puerta cerrada/abierta en sala de combate `r23` |
| `ART_TOOLS/qa/evidence_tanda_02.py` | decodificación PNG, alfa, dimensiones, diferencias, recortes |
| `ART_TOOLS/qa/finalize_manifest_tanda_02.py` | cierre del manifest con resultados reales |

### 5.1 Integridad (build activa)

- `DMO_ART_PACK.architecture()`: **10/10 aplicados**, `enabled:true`,
  `originalsPreserved:10`, `errors:[]`. Los 10 con `exactSize:true`, `live:true`,
  `loaderResolves:true`, `aliasRegistered:true`, `originalPreserved:true`.
- `DMO_ART_PACK.integrity()` (Tanda 01): `status:"applied"`, **8/8** `live/exactSize`,
  `errors:[]` → T01 intacta.
- `DMO_REFERENCE_ROOM_ASSETS.state()`: **100/100** V5, 0 errores.
- `DMO_ILT.audit()`: **11/11**, 0 errores.
- 10 peticiones HTTP de `ART_ASSETS/tanda_02/*.png`, **0 errores HTTP de arte**.
- `pageerror`: **0 en ambas builds**. `consoleErrors`: 2 en ambas (los 2 404 de
  Cloudflare heredados, también presentes en el original). `httpErrors`:
  `[404, 404]` en ambas → sin errores nuevos.
- **Smoke final** tras el último ajuste del pack (recarga limpia de la build
  activa): `state().status = "applied"`, `architecture()` 10/10 `enabled:true`
  `errors:[]`, `integrity()` 8/8 `errors:[]`, `restore()` → 0 módulos /
  `state().architecture.enabled:false`, `apply()` → 10/10 `enabled:true`,
  V5 con 0 errores, 0 `pageerror`, 2 console errors de Cloudflare.

### 5.2 A/B en la MISMA build (aisla exclusivamente T02)

`restore()` → 10 slots restaurados / 0 módulos aplicados → `apply()` → 10/10.
Diferencia de píxeles entre `before/03_room_modules_off.png` y
`after/03_room_modules_on.png`: **12.437 px (1,08 %)**, localizada en
`(550,0)-(730,95)` (módulo A02 en muro superior) y `(461,770)-(641,831)`
(umbral A09). La diferencia entre builds completas es 474.476 px (41,19 %), que
incluye Tanda 01 + Tanda 02 y **no** es una medida aislada de T02.

### 5.3 Salas reales y sistema modular

| Sala | Círculo | `setNight` | Enemigos | Módulos visibles | Captura |
|---|---|---|---|---|---|
| `r0` | C1 LIMBO (`start`) | — | 0 | A02, A06/A08/A09, A10 (HUB) | `after/02_room.png`, `after/01_hub.png` |
| `r23` | C3 GULA | 24 ✓ | 10 | **A01** por panel, A07, A09 | `circle_02_gula.png` |
| `r34` | C4 AVARICIA | 35 ✓ | 10 | **A03**, A01, A07, A09 | `circle_03_avaricia.png` |
| `r89` | C9 TRAICIÓN | 90 ✓ | 29 | A04 registrado (muro fuera de encuadre) | `circle_08_traicion.png` |
| NÚCLEO | — | 100 ✗ (`ok:false`) | — | A05 **NO VERIFICADO** | `circle_09_nucleo.png` |

`DMO_DUNGEON.state().current` cambió `r0 → r23 → r34 → r89` y `floor` `1 → 3 → 4 → 9`:
**entrada/salida de salas verificada** con la API de depuración del propio motor.

### 5.4 Puertas y umbrales

- `r0` es `start` (sin encuentro): `vg()` entrega `Ot.openT = .8`, las puertas ya
  están abiertas. Diferencia `after_closed` vs `after_open`: **246 px (0,021 %)** →
  **NO hay transición cerrada→abierta verificable en esa sala**; se documenta, no
  se simula.
- Sala de combate `r23` sin despejar: **11 enemigos, `secured:0`** → puerta cerrada
  real (`doors/closed_real.png`). Tras `DMO.debug.clearRound()` + ticks del motor:
  **0 enemigos, `secured:1`** → puerta abierta real (`doors/open_real.png`). La
  diferencia global es 615.489 px (53,43 %), pero **incluye la desaparición de los
  enemigos y cambios de HUD**, por lo que no se atribuye solo a la puerta. La
  evidencia válida es el par de ampliaciones `closed_closeup.png` /
  `open_closeup.png`, donde se ve el desplazamiento de la hoja A07.
- Umbral A09: `threshold_closeup.png` muestra el diamante 2:1 dorado/magenta
  enrasado en el suelo, sin escalón, sin bloque y sin falsa colisión.
- No se tapó al personaje: `gameplay/after_player.png`,
  `gameplay/combat_player.png` y sus ampliaciones muestran al jugador visible.

### 5.5 Regresión funcional

| Prueba | Antes (original) | Después (T01+T02) | Clasificación |
|---|---|---|---|
| Movimiento (`px`) | +205 | +252 | **VERIFICADO** |
| Transición HUB→sala | `completed:true`, 9 polls / 3.369 ms | `completed:true`, 8 polls / 42.751 ms | **VERIFICADO** (tiempo no comparable, ver §6) |
| `transitionsCompleted` / errores | 1 / 0 | 1 / 0 | **VERIFICADO** |
| Disparo en corrida principal | +1 `shotsFired`, +1 `wa` | 0 / 0 | **PARCIALMENTE VERIFICADO** → aislado en §5.6 |
| Enemigos en salas de combate | — | 10 / 10 / 29 | **VERIFICADO** |
| Entrada/salida de salas | — | `r0→r23→r34→r89` | **VERIFICADO** |
| Proyectiles enemigos (`Ia`) | 0 | 0 | **VERIFICADO** |
| V5 / ILT / T01 | 100/100, 11/11, n/a | 100/100, 11/11, 8/8 | **VERIFICADO** |
| Errores JS nuevos | 0 `pageerror`, 2×404 | 0 `pageerror`, 2×404 | **VERIFICADO** |

**Nota sobre `wa`:** se instrumentó `Array.prototype.push` buscando la firma
`weaponSerial + accuracyCohort` creada en `wd()` (proyectiles del **jugador**).
`Ia` / `balas` son proyectiles **enemigos** y no se usaron para esta métrica.

### 5.6 Aislamiento del `shotDelta = 0`

La corrida principal dio 0 disparos en `after` junto con `framesIn2s = 0`
(rAF inanido bajo SwiftShader). `validate_tanda_02_extra.js` repitió el disparo con
**ticks forzados idénticos** y `restore()/apply()` en la misma build:

| Condición | ratón `shotsFired` | ratón `wa` | `setInput` `shotsFired` | `setInput` `wa` |
|---|---|---|---|---|
| T02 ON (1) | +4 | +4 | +4 | +4 |
| T02 OFF (`restore`) | +4 | +4 | +4 | +4 |
| T02 ON (2) | +4 | +4 | +4 | +4 |

**Conclusión: no hay regresión de disparo atribuible a Tanda 02.** El 0 de la
corrida principal fue inanición de `requestAnimationFrame`, no un cambio de
mecánica. En la sala de combate `r23`, con los 10 módulos aplicados, se verificó
además movimiento `px 1266 → 1586` y disparos `0 → 4`.

### 5.7 Continuidad modular

`module_strip.png` muestra cornisa, zócalo, contorno y luz NW compartidos entre
A01–A04. Métrica en `logs/file_checks.json`: los 4 módulos tienen la cornisa en la
fila 0 y el zócalo en la última fila; A02 (0,69 %), A03 (1,16 %) y A04 (10,94 %)
tienen bordes izquierdo/derecho equivalentes. **A01 es isométrico con cara lateral,
por lo que la comparación de columnas de borde NO es aplicable** (93,75 % de
desajuste esperado por diseño, no un hueco). La comprobación de ausencia de huecos
en el juego se realizó visualmente en las capturas de `r0`/`r23`/`r34`: el cuerpo
de muro procedural del motor permanece detrás de los acabados.

### 5.8 Rendimiento (NO comparable)

| Métrica | Antes | Después |
|---|---|---|
| `loadMs` | 16.705 | 29.934 |
| campaña | 3.369 ms / 9 polls | 42.751 ms / 8 polls |
| `tick30Ms` | 2,6 | 2,9 |
| `framesIn2s` / `fps` | 6 / 3 | 0 / 0 |

Bajo SwiftShader sin GUI, `framesIn2s = 0` en `after` y `0` en la corrida limpia
de Tanda 01 demuestran **inanición de rAF**, no coste de render del lote. La carga
de 10 PNG y las capturas CDP de un canvas grande son coste de diagnóstico.
**Rendimiento en hardware real: NO VERIFICADO.** No se ajustaron tiempos, no se
modificó SwiftShader, no se cambió el juego para mejorar rendimiento.

---

## 6. Defectos y límites registrados (sin correcciones improvisadas)

| ID | Defecto / límite | Evidencia | Decisión |
|---|---|---|---|
| DEF-001 | `campaign_door_side_frame` se conservó sin sustituir: en `r23` el marco metálico original convive con la hoja A07 Art Deco | `doors/closed_closeup.png` | Registrado. Corregirlo exigiría un asset 11 o deformar un marco horizontal en un slot vertical 72×176; fuera de alcance y de la restricción de máximo 10. |
| DEF-002 | A07 se concibió como "puerta abierta" pero el motor no cambia de sprite: en `t=0` se ve el hueco cian y en `t=1` el hueco oscuro tras desplazar la hoja | `doors/closed_closeup.png`, `doors/open_closeup.png` | Documentado como incompatibilidad adaptada; lógica de apertura intacta. |
| DEF-003 | A04, A05, A06, A08, A10 integrados y vivos 10/10, pero su visibilidad individual no se aisló en una captura dedicada | `circle_08_traicion.png`, `after/01_hub.png`, `after/02_room.png` | `PARCIALMENTE VERIFICADO`; A05 `NO VERIFICADO` (NÚCLEO inalcanzable con `setNight(100)`). |
| DEF-004 | `r0` no permite verificar puerta cerrada (sala `start` ya abierta) | `logs/visual_diff.json` | Se usó `r23` de combate para la verificación real. |
| DEF-005 | `shotDelta=0` en la corrida principal | `logs/extra.json` | Causa aislada: inanición rAF. Sin regresión (§5.6). |
| DEF-006 | Rendimiento antes/después no comparable | `logs/validation.json` | `NO VERIFICADO`, sin atribuir variación al lote. |

---

## 7. Archivos

**Nuevos**
```
ART_ASSETS/tanda_02/_source/            10 ilustraciones fuente
ART_ASSETS/tanda_02/                    10 PNG finales + manifest.json
ART_EVIDENCE/tanda_02/{before,after,modular_connections,doors,gameplay,logs}/
ART_TOOLS/prepare_tanda_02.py
ART_TOOLS/qa/validate_tanda_02.js
ART_TOOLS/qa/validate_tanda_02_extra.js
ART_TOOLS/qa/validate_tanda_02_doors.js
ART_TOOLS/qa/evidence_tanda_02.py
ART_TOOLS/qa/finalize_manifest_tanda_02.py
ART_TANDA_02_REPORT.md
ART_TANDA_02_MANIFEST.md
ART_TANDA_02_VISUAL_QA.md
```

**Modificados**
```
ART_PACK/art_pack.js                    +Tanda 02 (mismo loader V5)
README.md                               documento maestro
ART_BIBLE.md                            control de versiones
ART_PRODUCTION_LOG.md                   registro de producción
```

**Intactos (verificados por SHA)**
```
DEADBEAT_DISCO.ART.html                 f231cfc7…723 · 13.381.028 B
v9_t3_fase1b_cache_probe.html           b2ef4ad8…d4a
backups/v9_t3_fase1b_cache_probe.ORIGINAL.html  b2ef4ad8…d4a
main / origin/main                      09df237… (sin tocar)
```

---

## 8. Clasificación global

| Ámbito | Clasificación |
|---|---|
| 10 assets generados, recortados y con alfa real | **VERIFICADO** |
| Integración en loaders reales (10/10, recursos previos conservados) | **VERIFICADO** |
| Sistema modular reutilizable en salas reales | **VERIFICADO** |
| Conexiones sin huecos / sin escalón de cornisa | **PARCIALMENTE VERIFICADO** (métrica válida en A02–A04; A01 isométrico, revisión visual) |
| Puerta cerrada / abierta / umbral | **PARCIALMENTE VERIFICADO** (r23 real; r0 no aplicable; A07 adaptada) |
| Jugabilidad sin regresión | **VERIFICADO** (causa del 0 aislada) |
| Sin errores JS nuevos ni recursos faltantes | **VERIFICADO** |
| Visibilidad de los 10 módulos en partida | **PARCIALMENTE VERIFICADO** (7 aislados, A05 `NO VERIFICADO`) |
| Rendimiento antes/después en hardware real | **NO VERIFICADO** |
| NÚCLEO / A05 | **NO VERIFICADO** (`setNight(100)` → `ok:false`) |
| Pruebas manuales con GUI / mando | **NO VERIFICADAS** (entorno sin GUI, heredado de Fase 0.3.1) |
