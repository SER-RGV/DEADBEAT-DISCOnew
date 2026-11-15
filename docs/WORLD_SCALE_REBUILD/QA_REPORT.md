# FASE 08 · QA_REPORT

Fecha: 2026-11-14. Build probada: `index.html` generado tras los parches de la
fase (5 668 749 B). Entorno: Chromium headless (`@sparticuz/chromium`,
swiftshader, sin GPU) controlado por playwright; Node 22 para las pruebas
unitarias. **Las cifras de fps/ms de este entorno no son rendimiento real; sólo
sirven para comparar ANTES/DESPUÉS en la misma máquina.**

## 1. Pruebas automatizadas (Node) — `node --test tests/world_scale/`

Resultado: **18/18 OK** (`tests/world_scale/camera.test.mjs`).

| # | Prueba | Qué comprueba |
|---|---|---|
| 1 | mundo→pantalla | `worldToScreen` reproduce `translate(view/2)·scale·translate(−cam)` |
| 2 | pantalla→mundo | inversa exacta en 1920×1080 / 1600×900 / 1280×720 y misma fórmula que `Gu` |
| 3 | seguimiento | converge sin retroceder y acaba dentro de zona muerta + anticipación |
| 4 | anticipación | mira hacia puntería/velocidad con tope `leadMaxFrac` |
| 5 | límites de zoom | siempre en `[zoomMin, zoomMax]·viewH/1080` en las tres resoluciones; nunca más lejos que el 0,8 antiguo |
| 6 | campo vertical | `zoomForViewport` mantiene 1080 px de mundo a zoom 1 en cualquier altura |
| 7 | histéresis | alternar 2↔3 enemigos no cambia el objetivo de zoom |
| 8 | estabilidad de zoom | Δzoom por cuadro ≤ `zoomRate·dt`; con multitud se aleja |
| 9 | zona segura | corriendo a tope sin paredes el jugador no pasa del 36 % del semiancho |
| 10 | pared | pegado al muro el jugador sigue en pantalla y no se enseña más que la franja de muro |
| 11 | sin vibración | jugador quieto ⇒ cámara inmóvil (< 0,01 px/cuadro) |
| 12 | límites de sala | sala menor que la vista ⇒ centrada; mayor ⇒ recorte a sala y a mundo |
| 13 | transiciones | cambio de `roomKey` o salto > 600 px ⇒ recolocación instantánea sin arrastre de anticipación; después vuelve al modo normal |
| 14 | simulación intacta | `step()` no muta entradas congeladas; una bala tiene la misma posición de mundo con cualquier cámara |
| 15 | modo jefe | zoom baja a ≤ 0,84, encuadre desplazado hacia el jefe, jugador y jefe dentro del ancho visible |
| 16 | perfil intermedia | factores dentro de los rangos pedidos; el perfil no contiene claves de colisión/alcance/velocidad |
| 17 | salas | factor por clase, topes 1980×1480, múltiplos de 20, tienda intacta, ranura 5 = minijefe |
| 18 | perfil legacy | todo ×1 y cámara desactivada; vuelta a intermedia reactiva |

## 2. Sonda en juego — `tools/world_scale/probe_scale.js`

Cuatro pasadas, un navegador por resolución, **0 errores de página y 0 errores
de consola** en todas:

| Pasada | Perfil | Resolución | Duración | Carpeta de origen |
|---|---|---|---|---|
| ANTES | `legacy` (= build anterior) | 1920×1080 | 194 s | `BEFORE_AFTER/before/` |
| DESPUÉS | `intermedia` | 1920×1080 | 228 s | `BEFORE_AFTER/after/after_1920x1080_*` |
| DESPUÉS | `intermedia` | 1600×900 | 153 s | `BEFORE_AFTER/after/after_1600x900_*` |
| DESPUÉS | `intermedia` | 1280×720 | 214 s | `BEFORE_AFTER/after/after_1280x720_*` |

Guion de cada pasada: cargar → `DD_CINE.skip()` → HUB → `exitToRun()` →
`holdSpawns(true)` + `killAll()` → nivel 2 (sala de combate): captura vacía,
trayectoria (90 cuadros a la derecha + 90 arriba + 60 quieto con
`__DD_BRIDGE.testStep`), 14 enemigos (`spawnEnemyAt`: 4 bailarines, 4 sprinters,
2 tanques, 2 tiradores, 2 élites), puerta abierta, esquina inferior derecha →
sala más apaisada visitada (pasillo) → **nivel 11 (arena del residente)** con
`DMO.debug.boss()` y el jugador apartado del centro → coste por cuadro.

**Comprobación de compatibilidad:** la pasada `legacy` reproduce la build
anterior exactamente: zoom 0,800, figuras 104/94/90/80/106/90/100 y jefes
178–204, `cameraModule.active=false`, trayectoria idéntica a la medición
original (velocidad máx. 4 px/cuadro, desfase final 271 px).

### 2.1 Cámara y campo visible

| Situación | ANTES 1080p | DESPUÉS 1080p | DESPUÉS 900p | DESPUÉS 720p |
|---|---|---|---|---|
| sala vacía (calma) | zoom 0,800 · 2399×1349 | **1,081** · 1777×1000 | 0,900 · 1777×1000 | 0,720 · 1778×1000 |
| 14 enemigos (multitud) | 0,800 | 1,034 · 1856×1044 | 0,862 · 1856×1044 | 0,690 · 1856×1044 |
| pasillo | 0,800 | 1,081 | 0,901 | 0,720 |
| puerta abierta (transición) | 0,800 | 1,080 | 0,897 | 0,720 |
| esquina (borde) | 0,800 · jugador al 78 %/74 % de pantalla | 1,080 · jugador al **83 %/72 %** | 0,900 · 82 %/72 % | 0,720 · 82 %/75 % |
| arena del residente (nivel 11) | 0,800 · arena 1480×1040 | **0,841** · 2283×1284 · arena **1980×1460** · jefe en (1010,364) y jugador en (701,546) px | 0,701 · ídem | 0,561 · ídem |

El campo vertical es el mismo en las tres resoluciones (1000 px de mundo en
calma, 1044 en multitud, 1284 con jefe): el tamaño relativo de las figuras ya
no depende de la resolución. En el borde la pared manda sobre la zona segura
(el jugador queda al 82–83 % del ancho, dentro de pantalla y sin enseñar
vacío más allá de la franja de muro).

### 2.2 Trayectoria de cámara (240 cuadros: correr derecha, arriba, parar)

| Métrica | ANTES 1080p | DESPUÉS 1080p | 900p | 720p |
|---|---|---|---|---|
| velocidad máx. de cámara (px mundo/cuadro) | 4 | 5 | 5 | 5 |
| aceleración máx. / media | 4 / 0,11 | 3 / 0,18 | 3 / 0,22 | 2 / 0,27 |
| inversiones de dirección (vibración) | 0 | **0** | **0** | **0** |
| desfase jugador–cámara máx. / final | 271 / 271 px | 172 / 171 px | 75 / 71 px | 41 / 12 px |
| zoom mín. / máx. durante la carrera | 0,800 / 0,800 | 1,080 / 1,080 | 0,900 / 0,900 | 0,720 / 0,720 |

Los desfases DESPUÉS corresponden a la zona muerta + anticipación en una sala
que la cámara recorre; ANTES la cámara apenas se movía porque la sala cabía
entera. Sin oscilaciones ni cambios de zoom espurios durante el movimiento.
Recolocaciones instantáneas registradas (`snaps`) en la pasada 1080p: 7 al
llegar al nivel 2 (carga, HUB→incursión y saltos de nivel) y 10 al final.

### 2.3 Salas visitadas (niveles 1–6, forma y tamaño; el azar de forma cambia entre pasadas)

| Nivel | ANTES (legacy) | DESPUÉS 1080p | DESPUÉS 900p | DESPUÉS 720p |
|---|---|---|---|---|
| 1 (entrada ×1,10) | wide 1600×820 | slanted-quad 1760×1120 | wide 1760×900 | wide 1760×900 |
| 2 (combate ×1,18) | l-wing 1580×1260 | l-wing 1600×1260 | l-wing 1800×1320 | l-wing 1980×1480 |
| 3 | tower 960×1240 | tall-octagon 1160×1480 | tall-octagon 1200×1480 | beveled-tall 1200×1480 |
| 4 | t-gallery 1740×1320 | t-gallery 1980×1400 | t-gallery 1980×1460 | t-gallery 1980×1360 |
| 5 | diamond 1360×1040 | pentagon 1820×1340 | pentagon 1660×1340 | octagon 1740×1280 |
| 6 | wide-hex 1540×1040 | wide-hex 1980×1340 | wide-hex 1980×1340 | wide-hex 1900×1340 |
| 11 (arena ×1,40) | 1480×1040 | 1980×1460 | 1980×1460 | 1980×1460 |

Ningún tamaño supera 1980×1480; el validador del motor no ha fallado en
ninguna pasada (0 errores).

### 2.4 Figuras (px de mundo, `DD_WORLD.__scaleDebug()`)

| | ANTES | DESPUÉS |
|---|---|---|
| jugador | 104 | 122,7 |
| security / dancer / fanatic / drone | 94 / 90 / 80 / 90 | 99,6 / 93,6 / 78,4 / 85,5 |
| chef (tanque) / élite | 106 / 100 | 144,2 / 142,0 |
| residentes | 178–204 | 227,8–250,9 |
| pickup | 44 | 50,6 |
| `player.r` / `enemies[].r` | 14 / 12 · 13,92 (muestra) | **14 / 12 · 13,92** (sin cambio) |

### 2.5 Coste por cuadro (headless swiftshader; sólo comparativo)

| | ANTES 1080p | DESPUÉS 1080p | DESPUÉS 900p | DESPUÉS 720p |
|---|---|---|---|---|
| `renderNow()` (ms, media de 30) | 1,40 | 1,76 | 1,44 | 2,05 |
| `testStep()` sim+dibujo (ms, media de 30) | 10,27 | 8,10 | 6,44 | 11,25 |
| memoria JS (MB) | 15 | 13 | 18 | 20 |

Diferencias dentro del ruido de la máquina (sin GPU). El trabajo por cuadro no
cambia de naturaleza: mismo número de `drawImage`, figuras algo más grandes,
suelo cacheado igual. Pendiente medir con GPU real (ver §4).

## 3. Inspección visual (capturas en `BEFORE_AFTER/`)

| Captura | Observación |
|---|---|
| `compare_room_normal_1080` | ANTES: sala pequeña centrada en negro; DESPUÉS: la sala llena la pantalla, protagonista 133 px, sin vacío |
| `compare_room_crowd_1080` | 14 enemigos legibles, jerarquía rápido < normal < tanque/élite; zoom 1,03 sin recortar a nadie |
| `compare_boss_arena_1080` | arena 1980×1460 ocupando el ancho, residente 2× el protagonista, los dos en pantalla, encuadre desplazado hacia el jefe |
| `compare_corridor_1080` | sala apaisada; la cámara recorre en vez de mostrar negro |
| `compare_transition_1080` | protagonista junto a la puerta; monedas 55 px |
| `compare_edge_1080` | esquina inferior derecha: franja de muro visible, nada de vacío extra |
| `after/after_1600x900_*`, `after/after_1280x720_*` | mismo encuadre relativo que 1080p |

## 4. No ejecutado / limitaciones (declarado expresamente)

* **Mando (gamepad)**: no hay dispositivo en el entorno; no se ha ejecutado
  ninguna prueba con mando. El código de mando (`Mu`) no se ha modificado y no
  lee la cámara, pero la sensación de puntería con stick **no está verificada**.
* **Táctil**: no probado.
* **Rendimiento con GPU real / fps**: no medible aquí (swiftshader ≈ 1 fps).
* **Sesión de juego humana**: no realizada; los valores de zona segura, franja
  de muro y factor de jefes pueden necesitar ajuste.
* **Salas de tienda, HUB, cinemáticas**: comprobado sólo que no fallan
  (0 errores) y que el HUB se captura igual (`compare_hub_1080`); no se han
  medido porque no cambian por diseño.

## 5. Problemas encontrados durante la QA

1. `Cannot access 'y' before initialization` al leer las dimensiones de
   ventana dentro de `Tf` → resuelto con el accesor `__ddViewDims` (ámbito superior).
2. La primera "arena" medida (nivel 10) era una sala de combate con jefe
   forzado; la arena real es el nivel 11 (ranura 10) → sonda corregida y
   mediciones repetidas.
3. Con un solo navegador para varias resoluciones Chromium (`--single-process`)
   moría al cerrar el contexto → un navegador por resolución.
