# TANDA 09 · «El HUB como lugar habitado» — Fase 0 · Auditoría de NPC y zonas

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **HEAD:** `d0156df`
**PR #1:** `OPEN`, head `d0156df`, `merged=null`, base `arte-y-recursos` · **`main`:** `d75e021` intacta
**Estado de esta fase:** auditoría de SÓLO LECTURA. No se ha modificado el juego, no se han generado recursos, no se ha cambiado de rama.

---

## 1. Preflight (antes de tocar nada)

| Comprobación | Resultado |
|---|---|
| Rama / HEAD | `arena/109fe45c-deadbeat-disconew` / `d0156df` |
| Worktree | limpio |
| PR #1 | `OPEN`, `head=d0156df…`, `merged=null`, base `arte-y-recursos` |
| `main` / `origin/main` | `d75e021fb13418bf49d5853c1a9583e7d11b90f2` (sin cambios) |
| Build activa | `http://127.0.0.1:8123/` HTTP 200, sin reiniciar |
| T01–T08 | T01 21/20, T02 21/47, T03 22/74, T04 0 assets + 83 evidencias (procedural, esperado), T05 21/119, T06 21/109, T07 15/45 `INTEGRADO_VALIDADO`, T08 21/53 `INTEGRADO_VALIDADO` |
| Marcadores | T04 `4/3`, T05 `3/3`, T06 `3/3`, T07 `2/2`, T08 `2/2`; versión pack `+hub-tanda08` |
| HUB real | 178 claves V5, 27 canvas, 11 estaciones, 6 zonas oficiales, 1 secuenciador, `zoom .9375` |

**El estado real coincide con el esperado.** Se mantiene la rama; no hay merge ni trabajo sobre `main`.

---

## 2. Sistemas existentes (contrastados con el código y el runtime)

| Sistema | Realidad medida |
|---|---|
| Render de NPC | `addHubCustomProp()` → `hubCustom:true`, `solid:false`, `tall:true`, `sortY` = línea de pies → `Lc(prop)` → Y-sort. Dos cadenas de pintado (L13271, L15589, L10737) convergen en `prop.hubDraw(g, prop)` |
| Acceso en runtime | **`window.DMO_LAYOUT.propObjects()` devuelve los 62 props REALES**, con `hubDraw` vivo. Permite envolver el pintor de un NPC sin crear props nuevas y sin tocar T01–08 |
| 4 `ambientDancers` | `hub.ambientDancers[]` L8810; `stepIdx = floor(zz*5.6 + phase) & 3`, `bounce = abs(sin(zz*6.8+phase))*2.5`, sprites V5 `hub_clubber_dancer_a/b` según paridad, `Wb` glow, `flip` |
| 6 actores T07 | `ACTORS[]` L7119 con `act` **FIJO** (`dance/talk/rest/walk`), `phase`, `rate`, `flip`, `col`, `span`. `installActors()` L7136; `spriteFor()` L7127 |
| Actividades | **No existe máquina de estados**: `act` se asigna una vez y nunca cambia. No hay `tLeft`, ni transiciones, ni pausas, ni variación de intensidad |
| Patrullas | **`patrol` = 0 coincidencias en todo el HTML.** El único desplazamiento es `t07_recorrido`: `x = 900 + sin(S.clock*1.35*rate + phase)*62` |
| Reacciones | Sólo T07: `react = clamp((185−dist)/85, 0, 1)`; aplica `flip` hacia el jugador + `lean` + `bounce` en 5 actores; `rest` queda excluido. Los 4 dancers y `narr_cliente000` **no reaccionan** |
| Relojes | `Z` (reloj artístico), `zz()` con `hub.ambientFrozenAt`, `S.clock` de T07 acumulado con `dt` real desde `Tf(dt)`, `Yc.reduced` |
| Animaciones | 5 sprites V5 de pie, imagen ÚNICA cada uno (95–131 × 232 px); **no son hojas de frames**. Los 4 índices de `stepIdx` se resuelven alternando 2 imágenes por paridad. `talk`/`rest` usan **1 solo frame** y sólo varían `lean`/`bounce`/`alpha` |
| Direcciones | Sólo `flip` horizontal (`ctx.scale(-1,1)`). No hay sprites por orientación N/S/E/O |
| Pivote | Pie: `translate(x, y+offset)` → `drawImage(im, −w/2, −h, w, h)`; sombra elíptica en `(x,y)` |
| Movimiento reducido | `Yc.reduced` congela `stepIdx=0`, `bounce=0`, `lean=0`. Verificado estático en 2 muestras, 0 `pageerror` |

**Consecuencia:** el sistema de actividades de T07 **no basta** para rutinas, pausas ni transiciones, pero es la base correcta. T09 debe añadir una **capa fina de estados sobre los mismos 10 props**, no un sistema de NPC paralelo.

---

## 3. Inventario de personajes (11 props con `hubDraw`)

`ART_EVIDENCE/hub/tanda_09/inventario_npc.json` contiene la ficha completa. Resumen:

| ID | Origen | Ubicación | Zona | Actividad actual | Anclaje | Reacción | Movimiento |
|---|---|---|---|---|---|---|---|
| `hub_ambient_dancer_nw` | T01 | 1030, 785 · `sortY 785` | A pista NW | `dance` phase 0.0, sprite `a` | `dancer_0` quiet station r64 | ninguna | **fijo** |
| `hub_ambient_dancer_ne` | T01 | 1470, 785 · `sortY 785` | A pista NE | `dance` phase 1.7, sprite `b` | `dancer_1` r64 | ninguna | **fijo** |
| `hub_ambient_dancer_sw` | T01 | 1015, 1085 · `sortY 1085` | A/F pista SW | `dance` phase 3.1, sprite `a` | `dancer_2` r64 | ninguna | **fijo** |
| `hub_ambient_clubber_bar` | T01 | 1965, 918 · `sortY 918` | E barra | `dance` phase 2.4, sprite `b` | `dancer_3` r64 | ninguna | **fijo** |
| `t07_danza_01` | T07 | 1120, 900 · `sortY 902` | A pista S | `dance` rate 1.00 | pie y900 | `react` (0,467 en spawn → 1,0 cerca) | ±3 u seno |
| `t07_danza_02` | T07 | 1380, 900 · `sortY 902` | A pista S | `dance` rate 0.86 | pie y900 | `react` | ±3 u seno |
| `t07_charla_01` | T07 | 1690, 1010 · `sortY 1012` | E corredor este | `talk` rate 0.55, `hub_bouncer_npc` + 3 puntos | pareja con `charla_02` | `react` (1,0 cerca) | fijo |
| `t07_charla_02` | T07 | 1780, 1010 · `sortY 1012` | E corredor este | `talk` rate 0.48, `hub_clubber_dancer_b` | pareja con `charla_01` | `react` | fijo |
| `t07_descanso` | T07 | 1910, 900 · `sortY 902` | E barra | `rest` rate 0.30, `hub_bartender_npc`, **DE PIE**, alpha 0.86 | junto al mostrador | **ninguna aplicada** | fijo |
| `t07_recorrido` | T07 | 900, 700 · `sortY 702` | D/A corredor oeste | `walk` rate 0.72, seno `±62 u` | ruta seno sobre `S.clock` | `react` | **único en movimiento** |
| `narr_cliente000` | Narrativo | 785, 560 · `sortY 578` | A sofá VIP NW | estático, `breathe`, tarjeta de historia | `cliente000` station r110 + sofá | abre diálogo | **INTOCABLE** |

**Los seis actores de T07:** `t07_danza_01`, `t07_danza_02`, `t07_charla_01`, `t07_charla_02`, `t07_descanso`, `t07_recorrido` (2 `dance`, 2 `talk`, 1 `rest`, 1 `walk`).
**Los cuatro `ambientDancers` originales:** `hub_ambient_dancer_nw/ne/sw` y `hub_ambient_clubber_bar`.

> **Restricción descubierta:** `hub.stations` crea `dancer_0…3` en `NARR_afterBuild()` (L11695) **copiando `dc.x/dc.y`**. Mover cualquiera de los 4 dancers desincronizaría su estación silenciosa. Por tanto sus anclajes son inmutables en T09.

### Sprites disponibles (medidos en runtime)

| Slot V5 | Tamaño | Uso actual |
|---|---|---|
| `hub_clubber_dancer_a` | 109 × 232 | 4 dancers + `dance`/`walk` T07 |
| `hub_clubber_dancer_b` | 131 × 232 | 4 dancers + `dance`/`walk` T07 + `talk` con flip |
| `hub_bouncer_npc` | 101 × 232 | `t07_charla_01` |
| `hub_bartender_npc` | 95 × 232 | `t07_descanso` |
| `hub_cliente000_npc` | 96 × 232 | `narr_cliente000` (intocable) |

No existen frames de sentado, de usar máquina, de saludo, ni sprites direccionales. T07 ya intentó dos variantes de «clubber sentada» y las descartó.

---

## 4. Zonas reales (no asumir los nombres de la petición)

`ART_EVIDENCE/hub/tanda_09/mapa_zonas.json`. El HUB declara **6 zonas oficiales** (`zonesCount: 6`) y 11 estaciones. La petición menciona «Entrada», «Zona de descanso», «Corredores» y «Áreas próximas al acantilado»: **no existen como zonas formales**.

| Cód. | Nombre real | Centro / puntos | NPC asignados | Identidad que puede construirse |
|---|---|---|---|---|
| A | Plaza central / pista + sofá VIP noroeste (`ZONA A · SOFÁ VIP NOROESTE`) | spawn (1250,965); dancer_0…2; sofás (785/1715,545); `cliente000` | 6 | Energía con pausas desincronizadas |
| B | `ZONA B · CABINA ACÚSTICA NORTE` | cabina (1250,445), `dj` (1250,525 r132) | **0 ambientales** | Foco musical y quietud (Virgilio es NPC de historia) |
| C | `ZONA C · GRIETA SUR · ESCALERA DE CARACOL` | `lift` (1250,1365 r142), borde `y1585` | **0 permanentes** | Contemplación y tensión; acontecimiento raro |
| D | `ZONA D · ARMERÍA Y TALLER TÁCTICO` | `arsenal` (705,855 r136), mostrador (590,845) | `t07_recorrido` (limítrofe, 900,700) | Tránsito y curiosidad |
| E | `ZONA E · RESERVADO ESTE` / barra | `bar` (1790,855 r136), mostrador (1910,845) | 4 | Conversación, espera y descanso |
| F | `ZONA F · RECREATIVAS SUROESTE` + `ALTAR SURESTE` | `arcade` (655,1135 r124), banco (655,1210); `seals` (1845,1135 r124) | **0 propios** | Curiosidad/entretenimiento por orientación |
| — | Anillo perimetral / bancos (1085/1415,1252) | no es zona oficial | `t07_recorrido` | Tránsito, sin patrulla |

La «Entrada» es el spawn (1250,965) **dentro de A**; el «descanso» son sofás/bancos dentro de A y E; el «acantilado» es la franja sur `y1470…1585` de T07/T08.

---

## 5. Comportamiento REAL medido en 24 muestras (~6 s, cámara estática)

| Actor | Frames distintos | Cambios de frame | Cambios de X | ΔX | Cambios de flip | Actividades observadas |
|---|---|---|---|---|---|---|
| `t07_danza_01` | 4 | 22 | 7 | 6 u | 0 | `dance` |
| `t07_danza_02` | 4 | 22 | 7 | 6 u | 0 | `dance` |
| `t07_charla_01` | **1** | **0** | 1 | 0 | 0 | `talk` |
| `t07_charla_02` | **1** | **0** | 1 | 0 | 0 | `talk` |
| `t07_descanso` | **1** | **0** | 1 | 0 | 0 | `rest` |
| `t07_recorrido` | 4 | 21 | 23 | **124 u** | 2 | `walk` |

**La actividad nunca cambia en ningún NPC.** Lo que hoy se percibe es un bucle: mismos 4 frames para quien baila/camina, y un sprite inmóvil con `lean`/`bounce` para quien conversa o descansa. Los 4 `ambientDancers` tienen el mismo patrón con `phase` distinta y posiciones fijas. Ésta es la carencia central que T09 debe resolver.

Reacciones medidas: en el spawn `react=0,467` para `t07_danza_01` (el radio de 185 u cubre casi toda la plaza), y `1,0` al acercarse. `t07_descanso` registra `lastReact=1` **pero no lo aplica** (`act === 'rest'` está excluido). Movimiento reducido: estático, 0 `pageerror`, 0 warnings.

---

## 6. Carencias y límites (sin generar recursos)

| Pr. | Carencia | Estado | Propuesta (NO ejecutada) |
|---|---|---|---|
| P1 | Actividades fijas, sin pausas ni transiciones | `BLOQUEADO` hoy / resoluble en T09 | Capa de estados sobre los mismos props |
| P2 | `talk` y `rest` con 1 solo frame | `BLOQUEADO` | Alternar postura/orientación/intensidad, no inventar frames |
| P3 | **No existe animación de sentado** | `BLOQUEADO` | `t07_descanso` seguirá de pie. Propuesta de 1 sprite sentado, **sin generar sin autorización** |
| P4 | **No existe animación de usar/mirar arcade** | `BLOQUEADO` | Orientación + pausa de `hub_ambient_dancer_sw`; zona F sin NPC propio |
| P5 | No existe animación de saludo dedicada | `BLOQUEADO` | Reutilizar `lean` + `flip` existentes |
| P6 | **No hay sistema de patrulla** (`patrol=0`) | `BLOQUEADO` | No crear rutas nuevas; conservar la ruta seno ±62 u |
| P7 | Zonas B y F sin NPC ambiental | `BLOQUEADO` | No se añaden NPC nuevos en esta tanda |
| P8 | 4 dancers con estaciones ancladas | Restricción | Anclajes inmutables; variar sólo postura/intensidad/orientación |
| P9 | `narr_cliente000` ligado a historia/diálogo | Restricción | Queda intacto |

Heredados `NO VERIFICADO`: vídeo continuo, mando físico, audio audible/latencia, rendimiento sostenido y regresión visual formal completa T01–08 en hardware real.

---

## 7. Matriz de auditoría

`ART_EVIDENCE/hub/tanda_09/matriz_auditoria.json` — **20 filas: 14 APROBADO / 0 FALLIDO / 4 BLOQUEADO / 2 NO VERIFICADO**, `erroresCriticos: 0`, `permiteFase1: true`.

**Evidencias:** `ART_EVIDENCE/hub/tanda_09/audit_npc.json` (inventario runtime, 24 muestras de ciclo, reacciones, movimiento reducido) y 9 capturas `audit_zona_*.jpg` + `audit_borde_acantilado.jpg`. Arnés reproducible: `ART_TOOLS/qa/hub_tanda_09_audit.js` (sólo lectura).

**No se ha modificado código ni se ha generado ningún recurso.** El siguiente paso es la Fase 1: `ART_TANDA_09_FASE1_MATRIZ_RUTINAS.md` y `matriz_rutinas.json`.
