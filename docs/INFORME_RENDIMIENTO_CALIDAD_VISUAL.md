# Informe de rendimiento y calidad visual — DEADBEAT DISCO

Rama de trabajo: `arena/2b6c1d50-deadbeat-disconew` (base `bf91d2d`).
Fecha de las mediciones: 2026-11-19.

Todo lo que sigue se midió en este repositorio, con el juego servido en local y
capturas reales. Lo que no se pudo medir está dicho como tal: **no hay ninguna
cifra estimada ni atribuida a hardware que no sea el de este entorno**.

---

## 0. Resumen

| | Antes (`bf91d2d`) | Después |
| --- | --- | --- |
| Descarga hasta el menú | 316 peticiones · **105,6 MB** | 271 peticiones · **23,8 MB** |
| Arranque (paso `done` del FSM) | **11,6 s** (y 14,6 s en la primera medición) | **7,6–7,9 s** |
| Peticiones duplicadas | 7 sprites pedidos dos veces | 0 |
| Repintado de la interfaz por fotograma | sí (todas las cajas, cada fotograma) | no (sólo cuando cambia el valor) |
| Armería | rejilla vacía, «0 CR» en las 120 armas | 120 tarjetas con nombre, precio y ficha reales |
| Retratos de diálogo | 2 de 3 con fondo negro cocido | los 3 con transparencia |
| Mapa de progresión | 10 filas recortadas a 1024x600 | sin recortes de 800x600 a 2560x1440 |
| Minimapa del Refugio | «SIN INCURSIÓN» siempre | planta del Refugio con jugador y rumbo |
| Panel de opciones | controles nativos en claro, pie recortado | una sola línea visual, pie entero |

Errores de página y peticiones fallidas durante todas las pruebas: **0**.
QA funcional: **30/30 guardas, 4/4 integración, 16/16 flujo** en esta rama **y**
en el commit base con el arnés corregido (ver 3.3).

---

## 1. Diagnóstico inicial

### 1.1 El arranque descargaba el juego entero antes del menú

`dd_asset_registry.js` precargaba en bloque los 277 recursos registrados
(96,9 MB) nada más cargar. De esos, **82,85 MB eran 35 láminas de cinemática**
que ninguna pantalla del menú dibuja. Además, el paso `images` del arranque
volvía a crear objetos `Image()` para 7 sprites que el registro ya estaba
descargando (descarga duplicada) y el paso `fase01` esperaba dos imágenes que
nadie pinta (`menu_backdrop_2k.webp`, 483 KB; `loading_keyart_2k.webp`,
675 KB): 1,16 MB que retrasaban el arranque sin cambiar un píxel.

Traza del arranque, antes:

```
engine 875 ms · assets 875 · images 8914 · fase01 10548 · opening 11611 · done 11618
```

El salto de `assets` (t=875) a `images` (t=8914) son **8 s de descarga**.

### 1.2 La interfaz se repintaba entera en cada fotograma

Con `PerformanceObserver('long-animation-frame')` en el Refugio, a 1280x720:

```
script: 0 ms    style & layout + paint: ~434 ms   (en TODOS los fotogramas)
```

El script no costaba nada: el tiempo se iba en recalcular estilo y pintar. La
causa era `updateHud()`, que se ejecutaba en cada fotograma y reescribía sin
condición el ancho de dos barras, cuatro `textContent` y dos clases. Asignar
`textContent` crea un nodo de texto nuevo y marca la caja como sucia; esas cajas
llevan `clip-path`, sombra y degradado, así que cada fotograma se repintaba toda
la interfaz encima del canvas del juego. El minimapa, además, se redibujaba
entero (fondo, retícula, puertas, halo, aguja) aunque el jugador estuviese
quieto.

### 1.3 Menús con defectos de ejecución

- **Armería**: se abría con la rejilla vacía y el aviso «La armería está
  cargando…» sobre un catálogo ya cargado (120 armas en el motor, 0 tarjetas).
- **Tarjetas de arma**: las 120 imprimían `0 CR`; los nombres largos se partían
  en tres líneas porque el marcado usaba `<b>`/`<span>` mientras la hoja define
  `.dd-weapon-card-name`/`.dd-weapon-card-price`, clases que no existían.
- **Ficha del arma**: las dos primeras «estadísticas» eran `ID` y `NAME`, y las
  barras se escalaban con el número crudo (coste 120 → 100 %, velocidad 760 →
  100 %, perdigones 1 → 6 %).
- **Minimapa**: leía `getCanvasInfo().world`, que el puente nunca ha expuesto.
- **Mapa de progresión**: a 1024x600 la lista de los nueve círculos (543 px)
  desbordaba el cuerpo (465 px) y las últimas filas quedaban cortadas.
- **Panel de opciones**: `--dd-coral` se usa en diez reglas y no estaba
  declarada en ninguna parte (un `var()` sin valor invalida la declaración
  entera), los controles del motor salían con el estilo nativo del navegador
  (deslizador azul, desplegable blanco) y la nota al pie quedaba recortada por
  el borde de la tarjeta.
- **Pausa**: el HUD (z 6200) y el bocadillo del DJ (z 7500) se dibujaban encima
  del cartel de PAUSA (z 10).
- **Teclas de ayuda**: 8,5 px a 1024x600, 9,8 px a 1280x720 y 9 px en submenús.

### 1.4 Activos

- `dialogue_portrait_bartender.png` y `dialogue_portrait_armorer.png` estaban en
  **RGB plano con el fondo negro dentro de la imagen**, aunque el manifiesto los
  declara `"alpha": true` y sus dos hermanos de juego (el retrato del DJ) sí son
  transparentes: en el diálogo se veía un rectángulo negro tapando el halo rosa
  del marco.
- **Los 18 «planos» de cinemática de segunda y tercera capa son el mismo PNG que
  el máster del escenario**, guardado con otro nombre: `02_*.png` y `03_*.png`
  son idénticos entre sí píxel a píxel (`rgbaEqual = true`) en los seis
  escenarios, y además 100 % opacos. El sistema de paralaje/oclusión que los usa
  (capas 02 y 03, `drawForegroundLayer`) no puede funcionar con eso: no hay
  separación de planos que mover ni transparencia que recorte. Ya existe un
  guardián que impide dibujar como primer plano una capa sin alfa
  (`entries[id].alpha === false`), así que el síntoma visible es «no hay
  paralaje», no «el héroe queda tapado».

---

## 2. Cambios aplicados

Todos los cambios son pequeños, verificables y reversibles, y están en commits
separados por tema.

| Commit | Qué |
| --- | --- |
| `bc4a0dd` | `perf(boot)`: carga por prioridades, sin descargas duplicadas ni muertas |
| `318250d` | `fix(ui)`: mapa sin recortes, minimapa en el Refugio, teclas legibles |
| `c59eadf` | `perf(hud)`: la interfaz deja de repintarse en cada fotograma |
| `94ab731` | `fix(armería)`: precios, nombres y ficha con estadísticas legibles |
| `e6afd46` | `fix(assets)`: transparencia de los retratos del Bartender y la Armera |
| `9c4893e` | `fix(opciones)`: una sola línea visual y el pie del panel, entero |
| `480dcf0` | `fix(pausa)`: la pausa manda sobre la interfaz de juego |
| `e3c061b` | `chore(perf)`: el arnés de medición pasa a `tools/perf/` |

### 2.1 Arranque (`dd_asset_registry.js`, `dd_boot.js`)

- `preloadAll()` pasa a cargar **por prioridades** y se añade `ensure(id)` /
  `request(id)`. `get()` sigue siendo **síncrono** (contrato intacto) y pide en
  el acto lo que falte, así que ningún fotograma se queda sin sprite por haber
  llegado tarde.
- Las 35 láminas de cinemática (82,85 MB) bajan a **bajo demanda**: sólo las
  pide la secuencia que las pinta (`dd_cinematic_camera.js`), con tope de 1,2 s
  y respaldo si no llegan. Una secuencia de descenso pide **su** lámina
  (960x540, ~350 KB), no las diez.
- El paso `images` reutiliza las peticiones del registro; el paso `fase01`
  comprueba sólo lo que la pantalla de carga pinta.
- P1 (contenido de juego) se lanza al terminar la carga; P2, en tiempo ocioso en
  el menú.

### 2.2 Interfaz por fotograma (`dd_ui_system.js`)

- `setText` / `setWidth` / `setClass`: escriben **sólo si el valor cambia**.
  La comparación se hace contra el valor anterior guardado en el nodo, no contra
  el DOM, para no forzar lecturas de layout.
- El minimapa se repinta sólo si cambia algo visible (planta, posición al píxel,
  rumbo al grado, puertas, sitio) y como mucho a 30 Hz.
- Sondeo de mando a 15 Hz en lugar de por fotograma (`navigator.getGamepads()`
  fuerza sincronización con el dispositivo de entrada). Latencia añadida ≤33 ms
  frente a una repetición de 85 ms.
- Las notificaciones de carga de assets se agrupan por fotograma (antes se
  reescribía el DOM del menú en cada uno de los 277 `onload`).

### 2.3 Calidad visual

- **Armería**: categoría inicial `"TODAS"` (era `"ALL"`, que no casaba con
  ningún rótulo y dejaba la rejilla vacía); categorías desde `family` (el campo
  que el catálogo trae de verdad) en vez de `category`; precio desde
  `getWeaponStats().cost` (antes `w.price`, inexistente → `0 CR`); clases CSS
  reales en las tarjetas; ficha con rótulos en castellano y escala real por
  estadística, más rol y rasgo que el motor ya devolvía.
- **Minimapa**: dibuja la planta desde `snapshot.roomRect` (en partida) o desde
  `DD_HUB.getState()` (en el Refugio), con retícula, puertas y rumbo.
- **HUD**: miniatura del arma legible (el `<img>` mide 56x26 y la ilustración
  tiene el arma en un lienzo casi cuadrado: con `contain` quedaba en ~20 px);
  nombre del arma completo en dos líneas en vez de recortado.
- **Mapa de progresión**: las pistas del grid pueden encoger, la lista lleva su
  propio scroll, el marco de la torre cede el alto en pantallas bajas y en
  ventanas estrechas el cuerpo pasa a una columna.
- **Opciones**: `--dd-coral` declarado; controles nativos del motor
  armonizados y `color-scheme: dark`; compactación a ≤780 px para que el pie
  quepa entero (521 px de contenido en 521 disponibles).
- **Pausa**: overlays del motor a z 12000, HUD retirado mientras la pausa está
  abierta (vuelve al cerrar) y bocadillo del DJ por debajo del panel.
- **Textos**: suelo de 11 px en las teclas de ayuda y en el «ESC» del submenú.
- **Retratos**: alfa calculado desde la luminancia del propio archivo (rampa
  3–15), conservando opaco lo oscuro que sí es dibujo (la camisa del Bartender
  mide RGB(33,31,39) y sigue al 100 %). Sin reescalar, recortar ni retocar el
  dibujo: son los mismos archivos. Originales en
  `backups/portraits_pre_alpha_2026-11-19/`.

---

## 3. Antes / después medido

Todas las cifras salen de `tools/perf/` (ver su README). El «antes» es una copia
del commit base servida en otro puerto, sin tocar el árbol de trabajo:

```bash
git archive bf91d2d index.html | tar -x -C /tmp/basecopy
```

### 3.1 Arranque

| Métrica | Antes | Después |
| --- | --- | --- |
| Descarga hasta el menú | 316 pet. / **105,6 MB** | 271 pet. / **23,8 MB** |
| — de ello, cinemática | 92,4 MB | 12,5 MB |
| Peticiones duplicadas | 7 sprites ×2 | 0 |
| Traza `engine → images` | 875 → 8914 ms | 718 → 5537 ms |
| Traza `→ done` | **11,6 s** (14,6 s en frío) | **7,6–7,9 s** |
| Primer píxel (FCP) | 180 ms | 180 ms |
| HTML + CSS + JS a parsear | 5,64 MB | 5,68 MB |

Las 24 peticiones y 12,5 MB que quedan de cinemática después del arranque son
P2 en tiempo ocioso ya en el menú; ninguna bloquea la interacción.

### 3.2 Fotogramas (Refugio, 1280x720)

| | Antes | Después |
| --- | --- | --- |
| Script por fotograma | 0 ms | 0 ms (igual) |
| Escrituras al DOM por fotograma | ~8 siempre | 0 cuando nada cambia |
| Redibujado del minimapa | cada fotograma | sólo al cambiar |

**Aviso de entorno:** no hay GPU. Chromium rasteriza con **SwiftShader (CPU)
sobre 2 núcleos**, así que los milisegundos absolutos de pintado **no**
representan el rendimiento en una GPU real y aquí varían mucho entre pasadas
(±30 %). Lo que sí es sólido es el reparto script/pintado (el script nunca fue
el problema) y la comparación relativa. Por eso este informe **no** presenta una
tabla de FPS antes/después como si fueran cifras de producto: no sería honesta.

### 3.2b Combate en marcha (tramo antes inalcanzable)

Medido con `tools/perf/combat.mjs`, que recorre el camino completo —menú →
descenso → Refugio → pad de descenso → `[E]` → partida— y muestrea el compás de
`requestAnimationFrame` **sólo cuando `isRunning()` ya es cierto**. Es la
primera vez que este tramo se mide: el arnés anterior no llegaba a él.

| 1280x720, CPU | Antes (`bf91d2d`) | Después |
| --- | --- | --- |
| Combate · media entre fotogramas | 284,6 ms | 262,4 ms |
| Combate · fps equivalentes | 3,5 | 3,8 |
| Combate · fotogramas >100 ms | 13/39 (33 %) | 13/39 (33 %) |
| Refugio · media entre fotogramas | 598,8 ms | 583,9 ms |
| Menú · media entre fotogramas | 385,0 ms | 393,1 ms |
| Long tasks (ventana medida) | 149 | 123 |
| script / pintado acumulados | 915 / 1132 ms | 910 / 1021 ms |

Qué se puede y qué no se puede leer de esta tabla:

- **Sí:** la partida arranca y corre con input real (el jugador se desplazó
  150 px antes / 158 px después y aparecieron enemigos durante la medida), y el
  trabajo de script por ventana es prácticamente el mismo (915 → 910 ms), es
  decir, estos cambios **no** han añadido coste al bucle de combate.
- **No:** ni los 3,5 ni los 3,8 fps son cifras de producto. El navegador del
  sandbox pinta con CPU sobre 2 núcleos y el compás es **bimodal** —muchos
  fotogramas a 16,7 ms seguidos de huecos de 300–1500 ms—, así que la media
  describe el entorno, no el juego. La diferencia entre columnas está dentro del
  ruido (±30 % ya observado entre pasadas) y **no se afirma mejora alguna**.
- El 33 % de fotogramas >100 ms en combate **antes y después** dice que el
  problema del banco es el rasterizado por software, no este trabajo. Para saber
  si en combate hay margen real hace falta medir en hardware con GPU.

### 3.3 QA funcional

`tools/qa/final_review.js` (arnés del propio repositorio):

| | Antes (`bf91d2d`) | Después |
| --- | --- | --- |
| Guardas | 30/30 | 30/30 |
| Integración | 4/4 | 4/4 |
| Flujo | **16/16** | **16/16** |
| Errores de página | 0 | 0 |
| Incidencias HTTP | 0 | 0 |

**Corrección respecto a la primera versión de este informe.** Aquí decía
«Flujo 7/16 antes y después» y se atribuían los 9 fallos a la copia base. La
causa era otra: **eran defectos del propio arnés**, no del juego. Se han
corregido en `tools/qa/final_review.js` (sólo herramienta de pruebas, no toca
código de juego):

1. **Selector inventado.** El paso `menu.enter-hub + cinematic` pulsaba
   `data-action="hub"`, un botón que **nunca ha existido** (`MENU_ITEMS` es
   nueva / continuar / opciones / créditos / salir). Fallaba con
   `hub button missing` y arrastraba los 8 pasos siguientes. Ahora usa
   `data-action="new"` (NUEVA PARTIDA), que es la ruta real: reproduce el
   descenso de apertura y termina en el Refugio.
2. **Paseo al pad de descenso sin realimentación.** Encadenaba retenciones de
   tecla a ciegas y oscilaba hasta (1025,843) con `nearStation=null`. Ahora es un
   bucle cerrado: lee `x/y`, corrige y camina hasta `nearStation === "descent"`.
3. **Presupuesto por número de pasos en vez de por tiempo.** El HUB avanza con
   `dt` acotado (`Math.min(0.05, dt)`), así que sin GPU cada pulsación mueve
   pocos píxeles; un tope fijo de 24 iteraciones se quedaba corto aunque el
   movimiento fuese correcto. Ahora hay un presupuesto de tiempo.
4. **Espera demasiado justa tras NUEVA PARTIDA.** El descenso dura 4,6 s de
   reloj interno, pero avanza con `dt` acotado dentro de `rAF`; en este entorno
   baja a ~1–2 fps, así que 4,6 s de secuencia tardan ~16 s de reloj de pared y
   la ruta completa se midió en **21,5 s**. El tope era de 25 s: pasaba o no
   según la pasada. Ahora son 45 s.

Con el arnés corregido, **la copia del commit base también da 16/16**, lo que
confirma que los 9 fallos eran del instrumento y no del juego, y que estos
cambios **no introducen regresiones** en el flujo (se ejecutan los 16 pasos
completos, con 0 errores de página y 0 incidencias HTTP en ambas versiones).

---

## 4. Activos: lo que se pidió verificar

### `player_idle_00.png` y `player_walk_03.png`

**Existen y están integrados.** No hay que inventar sustitutos.

- `assets/characters/player_idle_00.png` (288x512, alfa) → id `player_idle_00`.
- `assets/characters/player_walk_03.png` (336x512, alfa) → id `player_walk_03`.
- Los dos están en el manifiesto, en `CRITICAL_IDS` (prioridad 0) y en
  `PLAYER_POSE_TO_ID` (`dd_world_renderer.js`): son los que el motor dibuja al
  andar y al estar quieto en partida.
- Los cuatro fotogramas de caminar son **distintos de verdad** (diferencia
  media 12,8–17,7 entre pares): no son copias.
- La referencia antigua `assets/player/player_idle_00.png` que aparece en el
  mapa de alias es **legado**: ese directorio no existe. El arte canónico vive
  en `assets/characters/`.

En el Refugio el protagonista se dibuja con
`assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png`, que es el
retrato de cuerpo entero del máster aprobado (no un sustituto): el HUB usa su
propia ilustración y eso es intencionado.

### Duplicados de contenido y activos no registrados

- **10 grupos de archivos idénticos** byte a byte. Dos son alias legítimos de
  uso (`player_idle_00` == `hero_idle_00`), el logo del arranque coincide con el
  logo cinematográfico, y el resto son los seis máster de escenario guardados a
  la vez en `backgrounds/` y en `backgrounds/final/<escenario>/`. Los que usa el
  juego son los de `final/`.
- **179 archivos de imagen (115,4 MB) no están registrados** y el juego nunca
  los pide: 110 en `backgrounds/` (47,5 MB), 25 en `restart/` (25,5 MB, placas
  de prueba de dirección de arte y el máster del protagonista) y las
  comparativas/`references`.
- **No se ha borrado nada**: son material de trabajo y de auditoría, y la
  instrucción es no perder trazabilidad. Si se quiere aligerar el repositorio,
  es una decisión aparte (mover a almacenamiento externo), no un cambio de
  código.

### Estado del manifiesto

- 277 entradas · **0 archivos ausentes** · **0 discrepancias de tamaño** entre
  lo declarado y el archivo real.

---

## 5. Necesita intervención de arte (no es un defecto de ejecución)

1. **Planos de cinemática (18 archivos, seis escenarios).** Cada escenario tiene
   `02_*.png` y `03_*.png` idénticos al máster y 100 % opacos. Para que el
   paralaje y la oclusión funcionen hacen falta **capas separadas de verdad**
   (fondo, medios con alfa, primer plano con alfa). No se puede arreglar por
   código y no se ha inventado nada: se mantiene el guardián que evita que una
   capa opaca tape al héroe.
2. **Variantes transparentes de esos planos.** Ya existen en el repositorio
   (`06_*.png`) con alfa parcial y podrían ser el punto de partida, pero no
   están registradas ni verificadas por arte; usarlas sería cambiar el arte
   aprobado, así que queda a decisión del equipo.
3. Las ventanas de diálogo de BAR y ARMERÍA no tienen fondo opaco propio: el
   retrato es transparente y se apoya en el halo del marco. Es intencionado y se
   ve bien, pero conviene confirmarlo con dirección de arte.

---

## 6. Pruebas realizadas

- Arranque en frío y en caliente (2 pasadas antes / 2 después), traza del FSM y
  red contada por respuestas HTTP.
- Barrido de resoluciones: **1024x600, 800x600, 1280x720, 1920x1080, 2560x1080,
  2560x1440** con recuento de recortes, texto por debajo de 10 px y desbordes en
  menú principal y panel de opciones.
- Menú principal, OPCIONES, CRÉDITOS, HUB, ARMERÍA (filtros, tarjetas, ficha,
  equipar y comprobar que el HUD se actualiza), MAPA DE PROGRESIÓN, diálogos de
  TEMPO / BARTENDER / ARMERA, y pausa.
- `tools/qa/final_review.js` completo, antes y después, comparando el conjunto
  de fallos por nombre.
- Carga por `file://`: 0 peticiones fallidas, 0 errores (los recursos se
  resuelven desde disco).
- Recuento de `drawImage` en el HUB para saber qué sprites se dibujan de verdad.

### No se pudo probar aquí

- **Partida jugable completa**: se llega al descenso y al arranque de partida
  (ver 3.2b y el paso 10 del arnés), y el combate **ya está medido** en cuanto a
  compás de fotogramas y reparto script/pintado. Lo que no se ha recorrido es
  una partida entera: varias salas, oleadas completas, jefes y victoria.
- **Game Over y resultados**: requieren una partida en curso; el arnés confirma
  que no se produce muerte ni fuga de estado en el tramo medido
  (`hp 3 → 3`, `guardRegistry: 2`), pero las pantallas de derrota y resultados no
  se han abierto.
- **FPS con GPU**: no hay GPU en el entorno (ver 3.2 y 3.2b). Las cifras de
  fotogramas de 3.2b describen el rasterizado por software, no el juego.

---

## 7. Siguiente paso sugerido

El bloqueo anterior —el fallo de entrada al HUB/descenso del arnés— **está
resuelto**: era del arnés, no del juego (ver 3.3), y ahora los 16 pasos de flujo
pasan tanto en esta rama como en el commit base. Con eso, el combate ya no es
una estimación: hay compás de fotogramas y reparto script/pintado en 3.2b.

Lo que queda, por orden de valor:

1. **Medir en hardware con GPU.** Es el único modo de saber si el combate tiene
   margen real. Todo lo de la sección 3.2b está medido con rasterizado por
   software a ~2–4 fps y no sirve como cifra de producto.
2. **Decidir sobre los 179 activos no registrados (115,4 MB)** — sobre todo los
   110 fondos de `backgrounds/` (47,5 MB) y los 25 de `restart/` (25,5 MB):
   registrarlos o sacarlos del paquete. No se ha borrado nada.
3. **Intervención de arte** en las capas de cinemática `02_*` / `03_*`: son
   idénticas píxel a píxel a la lámina maestra y 100 % opacas, así que el
   parallax no se puede hacer en código sin sustituir arte aprobado.
4. Recorrer una partida completa (varias salas, oleadas, jefe y victoria) y las
   pantallas de derrota y resultados, que siguen sin abrirse.
