# FASE 01 — INFORME FINAL (A–T)

**Proyecto:** DEADBEAT DISCO · build v3.3.0 (`3.3.0-floorbag-auditfix`) · motor DMO 2.86.0
**Rama:** `arena/0b7be6f7-deadbeat-disconew` · base `0bd6a54`
**Artefacto:** `index.html` = `DEADBEAT_DISCO.html` (idénticos byte a byte), **5.331.831 B**
**Entorno de prueba:** Chromium headless sin GPU (ver §N), suite reproducible en `tools/fase01_qa/`

Clasificación usada en todo el informe:

| Etiqueta | Significado |
|---|---|
| **VERIFICADO** | Existe evidencia ejecutada y adjunta en este repositorio. |
| **IMPLEMENTADO PERO NO VERIFICADO** | Está construido y el código se ejecuta sin errores, pero no se pudo medir/ver en las condiciones que exige la especificación. |
| **PENDIENTE** | No está hecho. |
| **BLOQUEADO** | No se puede completar sin una decisión o un dato externo. |

---

## A. ESTADO INICIAL

Antes de tocar nada se auditó e inventarió la build publicada (`FASE_01_AUDITORIA.md`, H1–H10). Resumen:

- El juego **ya arrancaba** con una portada/pantalla de carga propia (`#boot-screen`, contrato `DMO_BOOT46`, 12 referencias en el backup), y esa pantalla **funcionaba**: no era el problema.
- El menú existente (`#overlay` + `#menu-scene53` + `#menu-card`) es la pantalla real de arranque: 12 capas CSS animadas más un canvas propio de escena de club. **Sí tenía** música de portada (`DDC_COVER.music`) y navegación de botones.
- La build trae ya un HUD/UI HD (`src/dd_ui_system.js`, `dd_hub_system.js`, `dd_cinematic_camera.js`, `dd_asset_registry.js`) generado por `tools/build_active_html.py`.
- **No existían**: pantalla de carga con progreso real por etapas, cinemática de intro enlazada al menú, menú con estados hover/seleccionado/pulsado, submenús de OPCIONES/CRÉDITOS/SELECCIÓN DE PARTIDA, ni navegación por teclado/mando del menú.
- Reproducibilidad comprobada: el build previo daba siempre el mismo hash (`483fc9c9675d05dd`).

## B. AUDITORÍA (resumen operativo; detalle en `FASE_01_AUDITORIA.md`)

- **Assets:** 225 entradas en el registro en uso; key art de menú limpio (`assets/ui/menu_main_backdrop.png` 1280×720), panorama de intro (`assets/cinematics/cine_intro_club_panorama.png` 1280×720), logos con alfa, hoja de referencia aprobada `REF_05`.
- **Sistemas auditados (12):** motor/render, estados de partida, escenas, cargador de assets, animación, audio, guardado, entrada, resolución/cámara, menú actual, arte (logos/portada/sprites/texturas/fuentes/iconos), build/publicación.
- **Hallazgo que corrigió la auditoría:** las afirmaciones iniciales sobre "doble logo / botones quemados en la portada" eran **falsas**: el key art está limpio; el quemado pertenece al `#ddc-img` legado. Las entradas §2.2 (1–3), H8 y D-01 del documento de auditoría están marcadas como erróneas y corregidas en la cabecera del propio fichero.
- **Decisión de arquitectura (D-01 revisada):** no se rehace el menú desde cero; se sustituye la **presentación** y se conserva el **contrato** (`#overlay`, `#menu-card`, `start-btn`, `DMO_BOOT46` siguen en el DOM). El motor nunca se modifica.

## C. ASSETS CONSERVADOS / RECONSTRUIDOS / NUEVOS

| Tipo | Pieza | Estado | Detalle |
|---|---|---|---|
| Conservado | Todo el arte del juego (personajes, armas, pickups, jefes, HUB, panorama, portada) | Sin tocar | No se rediseña nada: la auditoría lo marca como aprobado. |
| Conservado | `assets/ui/menu_main_backdrop.png` (1280×720) | Sin tocar | Se usa como fuente; el menú lo muestra a pantalla completa con `object-fit: cover`. |
| Derivado | `assets/fase01/menu_backdrop_2k.webp` | Nuevo (derivado) | 2560×1440, 472,5 KB. Lanczos + unsharp. **No aporta detalle nuevo**: reescala limpia del arte aprobado. |
| Derivado | `assets/fase01/loading_keyart_2k.webp` | Nuevo (derivado) | 2560×1440, 659,8 KB. Fondo de la pantalla de carga. |
| Derivado | `assets/fase01/emblem_fox_glow.png` | Nuevo (derivado) | 768×768. **El emblema no se modifica**: el halo se calcula a partir de su propio canal alfa. |
| Derivado | `assets/fase01/logo_deadbeat_trim.png` | Nuevo (derivado) | 756×630. Recorte por caja alfa + 8 px de margen. Sin retoques de forma. |
| Derivado | `assets/fase01/brand_divider.png` | Nuevo | 1200×64, divisor de marca. |
| Derivado | `assets/fase01/menu_icon_{new,cont,load,opts,cred}_{idle,sel}.png` | Nuevos | 10 iconos 64×64, dos estados (`#ff2d7a` reposo / crema seleccionado). |

Total: **15 piezas, 1.628 KB**, generadas por `tools/fase01_build_assets.py` a partir **exclusivamente** de arte ya presente en el repositorio. El generador es **determinista**: dos ejecuciones producen los mismos SHA-256 (comprobado con `diff` de sumas).

> Límite declarado: el key art original es 1280×720. Las versiones "2K" son reescalados de calidad para que en 1440p no haya interpolación del navegador; **no son arte nuevo a 2K**. Si en el futuro se aprueba arte nativo a 2K, basta con sustituir los dos ficheros y volver a ejecutar el generador.

## D. ARQUITECTURA

```
BOOT ──► LOADING ──► INTRO ──► MAIN_MENU ◄──► SUBMENU
                                    │
                                    └──► PLAYING ──► (ESC/pausa del motor) ──► MAIN_MENU
                                                                  │
                                                                  └──► EXIT (despedida)
```

- **Una única máquina de estados:** `src/dd_boot.js` (`window.DD_BOOT`), exportada congelada. `document.body[data-dd-state]` refleja el estado (`boot|loading|intro|main_menu|submenu|playing`).
- **Reparto de responsabilidades:** `DD_BOOT` decide transiciones y es dueño del audio; `DD_UI` construye y pinta menú/HUD y pide transiciones; `DD_CINE` (existente) ejecuta las cinemáticas; el motor no se toca.
- **Sin sistemas en paralelo:** la música es la del motor (`DDC_COVER.music`), el panel de mezcla es el del motor (se incrusta, no se copia), el audio de juego es el del motor, y las cinemáticas son las de `DD_CINE`.
- **Degradación:** si el armazón de carga estático no existe, `dd_boot.js` crea una versión mínima. Si un paso crítico falla → panel de error con REINTENTAR / MODO SEGURO. Un perro guardián de 20 s evita la pantalla negra indefinida.
- **Ficheros:** `src/dd_boot.js` (nuevo), `src/dd_ui_system.js` (reescrito), `src/dd_rebuild_ui.css` (+≈1.100 líneas), `tools/build_active_html.py` (armazón estático + orden de módulos), `tools/fase01_build_assets.py` (nuevo), `tools/fase01_qa/*` (nuevo).

## E. CARGA (LOADING)

**9 pasos reales**, ejecutados en serie; el porcentaje es `pasos_completados / 9`, **no un temporizador**:

| # | Paso | Qué comprueba de verdad |
|---|---|---|
| 1 | `engine` | El canvas `#game` existe y su contexto 2D es real. |
| 2 | `assets` | Manifiesto del registro de assets del motor. |
| 3 | `images` | Decodificación real de logo, emblema, fondo de menú y panorama de intro. |
| 4 | `fase01` | Se decodifican los 15 assets nuevos. |
| 5 | `fonts` | `document.fonts.load()` de `DDPixel` (fuente real de la build). |
| 6 | `ui` | `DD_UI` y `DD_CINE` presentes y con API. |
| 7 | `audio` | Contexto de audio del motor disponible. |
| 8 | `storage` | Lectura/escritura real en `localStorage`. |
| 9 | `final` | Comprobaciones finales (canvas con tamaño, sin errores acumulados). |

- El armazón es **markup estático** emitido por el build justo después de `<body>`, para que pinte **mientras se parsea el documento de 5,3 MB**. Ningún script puede pintar antes de eso.
- **Única espera no ligada a tarea:** 520 ms de retención visual al llegar al 100 % (200 ms con `prefers-reduced-motion`). Está declarada en el informe y en el código.
- Traza real medida (`DD_BOOT.getTrace()`): `0,11,22,33,44,56,67,78,89,100 %` — 9 pasos distintos, monótona, `loadMs = 448–583 ms` con todo en caliente.

## F. INTRO

- Es la **cinemática canónica** del juego (`DD_CINE.playIntro`), duración nominal **4,4 s**: fondo → iluminación → protagonista → logotipo → subtítulos. No se rehace ni se duplica.
- **Saltable** con Espacio / Esc / Enter / clic / botón (A) de mando.
- **No se reinicia** al recuperar el foco: no hay ningún listener de `focus`/`visibilitychange` que la relance (verificado en B4).
- **Corrección de un fallo real:** la salvaguarda original cortaba la intro a los 9 s **de reloj de pared**, lo que en equipos lentos truncaba la cinemática a la mitad. Ahora la salvaguarda es un **detector de estancamiento** (si el reloj interno de la cinemática no avanza en 4 s, se fuerza la salida). Bajo render normal la cinemática termina por sí sola (`introEndedBy: "complete"`).

## G. MENÚ PRINCIPAL

- Key art aprobado a pantalla completa con deriva lenta, viñeta, partículas, emblema flotante, ayuda de controles y versión real leída de `<meta name="version">`.
- **Protagonista completo y con proporción correcta**: la composición deja el personaje entero a la vista (no se recorta contra el borde) en 720p, 1080p, 1440p y 21:9.
- **Estados de botón reales:** reposo, `hover` (ratón), seleccionado (teclado/mando, con foco real compartido), pulsado (`:active`) y deshabilitado (`[disabled]` con `cursor:not-allowed` y sin foco). El icono cambia de estado con el botón.
- **Escala por altura de ventana:** la columna y la tipografía crecen con `vh`, no con `vw`, para que en 21:9 el menú no quede diminuto y en 720p no se coma la pantalla.
- El menú legado **no se borra**: se conserva como contrato del motor y su escena animada se **pausa** mientras el menú de Fase 01 es dueño de la pantalla (12 capas animadas detrás de una capa opaca sólo consumían compositor).

## H. BOTONES

| Botón | Comportamiento implementado | Estado |
|---|---|---|
| **NUEVA PARTIDA** | Pasa por la cinemática **real** de descenso (`DD_CINE.playCircleDescent`) y arranca el motor (`__DD_BRIDGE.startRun`). `PLAYING` se declara **sólo cuando el motor confirma**. Doble pulsación bloqueada (`busy`) hasta esa confirmación. | VERIFICADO (G1–G4) |
| **CONTINUAR** | Lee el progreso persistente real (`dmodisco_best_v5`, `dmodisco_best_round_v1`, `dmodisco_hist_v3`, fichas, mejoras, logros, victorias). Sin progreso → **no arranca**: abre la pantalla honesta de "sin partida" y explica la limitación. | VERIFICADO (C9, C10) |
| **SELECCIONAR PARTIDA** | El motor **no soporta ranuras múltiples** (es una decisión de diseño del juego: «el club no guarda partidas a medias»). Se documenta la limitación en la propia pantalla y se implementa la integración mínima compatible: **estado persistente único** (círculo más profundo, fichas, mejoras, logros, victorias) + **historial real de descensos** y acción de reanudación en ese punto. **No se inventan ranuras vacías.** | VERIFICADO (C9, captura `09_slots`) |
| **OPCIONES** | Mezcla del motor **incrustada** (maestro/música/efectos/voz DJ: mismos controles, ni un duplicado), volumen de música del menú con persistencia (`ddc_cover_settings_v1`), calidad gráfica espejada al panel nativo del motor, pantalla completa con `requestFullscreen`, y **estado real** de teclado y mando. | VERIFICADO (C4–C8) |
| **CRÉDITOS** | Sólo datos verificables del repositorio: autoría del proyecto, `DDPixel` (fuente incluida en la propia build, comprobada con `document.fonts.check`), motor leído en tiempo de ejecución (`window.DMO.version`), síntesis WebAudio propia. **Cero nombres inventados.** | VERIFICADO (C11, captura `08_credits`) |
| **SALIR** | Detiene la música del menú, pasa a pantalla de despedida y **dice la verdad**: un navegador no permite que una pestaña se cierre a sí misma. Ofrece la alternativa real (cerrar con Ctrl+W) y un botón para volver a entrar. Si la ventana fue abierta por script, intenta `window.close()`. | VERIFICADO (C12–C14) |

Todos los submenús tienen **volver** por botón, `Esc` y botón (B) de mando.

## I. AUDIO

- **Propietario único por estado**, usando el motor de audio existente:
  - MENÚ → música de portada (`DDC_COVER.music`) + SFX de navegación del mismo motor.
  - INTRO → la música arranca con la cinemática; la cinemática no añade otra pista.
  - JUEGO → **se corta** la música de menú (`stopMenuMusic`) antes de entrar; el audio de partida es el del motor.
  - SALIR → se detiene la música del menú.
- **Sin duplicación:** sólo se llama al motor; no hay un segundo reproductor.
- **Política de autoplay:** el `AudioContext` del motor se desbloquea con la primera interacción; la pantalla de carga lo indica explícitamente («PULSA UNA TECLA PARA HABILITAR EL AUDIO»).
- Verificado por estado (E-720p/1080p/1440p/ultrawide: `music.playing === true`) y al entrar a partida (`false`, prueba G2).

> Límite declarado: **no se ha podido verificar el audio a oído** en este entorno (headless, sin salida de sonido). Lo verificado es el **estado del motor** (propietario, arranque y parada), no la mezcla subjetiva.

## J. CONTROLES

| Entrada | Acción | Estado |
|---|---|---|
| Ratón | Hover mueve la selección, clic activa, submenús con botón VOLVER | VERIFICADO |
| Teclado | ↑/↓ (y W/S) navegan, Home/End, Enter/Espacio confirman, Esc vuelve | VERIFICADO (D1, D2) |
| Mando Xbox (EMULADO) | D-pad y stick izquierdo mueven, (A) confirma, (B) vuelve | VERIFICADO **con mando emulado** (D3) |
| Mando Xbox (FÍSICO) | — | **PENDIENTE**: no hay hardware en el entorno. El código usa la API estándar `navigator.getGamepads()` y el mapeo estándar (12/13 D-pad, 0/1 A/B). |
| Foco | Selección y foco real comparten un único indicador; no se pierde el foco al cerrar un submenú | VERIFICADO (D1, C14) |
| Doble activación | Bloqueo `busy` hasta confirmación del motor | VERIFICADO (G1, arranque único) |

## K. RESOLUCIONES

Probadas con captura real en `docs/FASE_01_EVIDENCE/`:

| Resolución | Fondo | Recorte | Logo deformado | Resultado |
|---|---|---|---|---|
| 1280×720 | cubre | no | no (contain, 1,501) | VERIFICADO |
| 1920×1080 | cubre | no | no | VERIFICADO |
| 2560×1440 | cubre | no | no | VERIFICADO |
| 3440×1440 (21:9) | cubre | no | no | VERIFICADO |

La escala se calcula por **altura de ventana** para que ultrapanorámico no reduzca el menú. El canvas del motor mantiene su DPR nativo (no se toca la cámara).

## L. PRUEBAS

Suite reproducible: **`tools/fase01_qa/`** (`run.sh` prepara Chromium y sirve el repo; `suite.js` ejecuta las pruebas).

```
== 41/41 PASS ==   (ejecución original de Fase 01)
```

> **Actualización de Fase 01.1:** estas 41 se conservan, pero dos de ellas (C8 y D3) medían mal y se reescribieron, y se añadieron 23 más. Ejecución de esa fase: **64 PASS · 0 FAIL · 0 SKIP · 0 NV**. El detalle está en §**Fase 01.1-E**.
>
> **Actualización de Fase 01.2:** cinco defectos más, de los cuales uno era un falso PASS (`H-D2`, sustituido por `H-D2a`…`H-D2e`). Ejecución vigente: **84 PASS · 0 FAIL · 0 SKIP · 0 NV**. El detalle está en §**Fase 01.2**.

| Bloque | Pruebas | Resultado |
|---|---|---|
| A · Arranque | A1 progreso por pasos reales · A2 los 9 pasos OK · A3 sin paso crítico en error · A4 sin errores de página/consola/red | 4/4 |
| B · Intro | B1 arranca sola y avanza · B2 duración 3–5 s · B3 saltables · B4 no se reinicia al recuperar foco | 4/4 |
| C · Botones | C1–C3 menú · C4–C8 opciones · C9–C10 continuar/selección · C11 créditos · C12–C14 salir | 14/14 |
| D · Controles | D1 flechas+foco · D2 End · D3 mando emulado | 3/3 |
| E · Audio | música activa en menú en 4 resoluciones | 4/4 |
| F · Resoluciones | sin recorte/deformación + sin errores en 4 resoluciones | 8/8 |
| G · Partida | G1 entra y arranca el motor · G2 corta música de menú · G3 menú oculta/HUD aparece · G4 sin errores | 4/4 |

Evidencia adicional: traza de carga real, `getEvidence()` (`stepsDone: 9`, `finalPct: 100 %`), y capturas listadas en §P.

## M. ERRORES ENCONTRADOS Y CORREGIDOS

Durante la implementación, la propia suite detectó **siete fallos reales** (no cosméticos). Todos corregidos y re-verificados:

1. **`PLAYING` no existía en la lista de estados** de la FSM → entrar a partida lanzaba `estado desconocido: PLAYING`. El botón NUEVA PARTIDA era inservible.
2. **`ReferenceError` en `setProgress`** (variable `id` inexistente) → el primer paso de carga lanzaba excepción y el arranque se quedaba colgado en la pantalla de carga.
3. **Guard de intro por tiempo total (9 s)** → truncaba la cinemática en equipos lentos. Sustituido por detector de estancamiento.
4. **Enfriamiento del mando por fotograma** → con render lento el mando dejaba de responder. Ahora se mide con reloj de pared.
5. **Panel de mezcla del motor invisible** (vivía dentro de un `<details>` cerrado, con caja 0×0) → OPCIONES salía vacío. Ahora se abre el `<details>` y se incrusta el panel real.
6. **Créditos con versiones escritas a mano** (`DMO 2.86.0`, `Pixelify Sans`) que no coincidían con el artefacto → ahora se leen del propio runtime y de la fuente realmente incluida (`DDPixel`).
7. **Coste de composición**: `filter: blur` sobre haces de 34vw×165vh y `filter` de capa completa en el fondo del menú → sustituidos por degradados equivalentes (mismo look, sin pase offscreen por fotograma).

Además, la auditoría del Bloque 01 contenía **afirmaciones falsas** (doble logo y botones quemados); están marcadas y corregidas en `FASE_01_AUDITORIA.md`.

## N. PENDIENTES Y LÍMITES

**Sobre el entorno de pruebas (importante para leer las cifras):** el sandbox no tiene GPU y su compositor va por software. Medido con el **mismo binario y sin ejecutar una sola línea de JavaScript**, la página estática ya corre a **8,7 fps**; con el juego, a **~2 fps**. Por eso:

- **No se reporta ninguna cifra de FPS como rendimiento del juego.** El perfil de CPU real muestra **98,3 % de tiempo inactivo**: el juego no consume CPU, el cuello de botella es la composición por software del entorno.
- Todas las pruebas esperan **estados**, nunca tiempos fijos. Los tiempos de reloj de pared que aparecen (p. ej. «111.000 ms» para entrar a partida) son artefactos de ese entorno, no del juego.
- **PENDIENTE: medir en hardware real con GPU** (Chrome/Edge de escritorio, 1080p y 1440p) y anotar FPS, tiempo de arranque real y consumo. Es la única medición de rendimiento que la especificación debería aceptar, y no puede hacerse aquí.

Otros límites honestos:

- **Mando físico:** la API está implementada y verificada con dispositivo **emulado**; falta probarla con un mando Xbox real (no hay hardware).
- **Rendimiento del motor en juego:** el sprite del protagonista se ve muy tenue sobre la alfombra del Círculo I. **Es preexistente**: se reprodujo en la build base sin mis cambios (captura comparativa). No lo he tocado porque la especificación prohíbe modificar sistemas de combate/render de partida. Se deja anotado.
- **Key art a 2K:** los fondos son reescalados, no arte nativo 2K (ver §C).
- **Audio subjetivo:** no verificable sin salida de sonido (ver §I).
- **Créditos:** sólo se listan datos del repositorio; si falta alguna persona real, es porque **no consta** en el proyecto. No se inventa.

## O. CAPTURAS

En `docs/FASE_01_EVIDENCE/` (13 imágenes, 768 KB, capturadas del juego real, no renders):

| Fichero | Qué muestra |
|---|---|
| `01_loading.webp` | Pantalla de carga con emblema, logo, pasos reales y barra (captura con red ralentizada para poder fotografiarla) |
| `02_intro.webp` | Intro canónica en reproducción (letterbox + subtítulo) |
| `03_menu.webp` | Menú principal definitivo, 1600×900 |
| `04_hover.webp` | Estado **seleccionado/hover** sobre SELECCIONAR PARTIDA |
| `07_options.webp` | OPCIONES con mezcla del motor incrustada |
| `08_credits.webp` | CRÉDITOS con datos reales |
| `09_slots.webp` | SELECCIÓN DE PARTIDA con limitación declarada |
| `10_exit.webp` | SALIR con el límite real del navegador |
| `11_exited.webp` | Pantalla de despedida |
| `12_playing.webp` | Partida iniciada desde el menú (HUD real) |
| `res_720p/1080p/1440p/ultrawide.webp` | Menú en las cuatro resoluciones |

Antes/después: la comparación relevante es **menú legado** (`FASE_01_AUDITORIA.md`, capturas de la build base) frente a las capturas nuevas. No se reemplazó arte aprobado, así que no hay comparativa de assets.

## P. ARCHIVOS MODIFICADOS

**Nuevos**
- `src/dd_boot.js` — FSM, carga, intro, árbitro de audio, submenús.
- `tools/fase01_build_assets.py` — generador determinista de los 15 assets.
- `assets/fase01/` — 15 piezas + `manifest.json` (con SHA-256, tamaño, dimensiones y método).
- `tools/fase01_qa/{run.sh,lib.js,suite.js}` — arnés y suite A–G reproducibles.
- `docs/FASE_01_EVIDENCE/` — 13 capturas.
- `FASE_01_INFORME_FINAL.md` — este documento.

**Modificados**
- `src/dd_ui_system.js` — menú, submenús, arranque de partida, entradas, HUD (reescrito).
- `src/dd_rebuild_ui.css` — estilos del arranque, menú, submenús, HUD (+≈1.100 líneas).
- `tools/build_active_html.py` — armazón estático de carga y orden de módulos.
- `index.html` / `DEADBEAT_DISCO.html` — artefactos regenerados por el build (5.331.831 B, idénticos).

**No modificados (por restricción explícita):** HUB, salas de combate, generación procedural, enemigos, director de dificultad, sistemas de combate, progresión en partida, cámara de juego.

## Q. COMMITS

| Commit | Contenido |
|---|---|
| `e606fbf` | Bloque 01 — Auditoría e inventario de la build publicada |
| `071005d` | Bloques 02–03 — Assets de arranque y secuencia BOOT/LOADING |
| `ef8a7cd` | Bloques 04–06 — Intro, menú definitivo y submenús funcionales |
| (pendiente) | Bloque 07–09 — QA reproducible, evidencia y este informe |

> Nota de continuidad: el sandbox se reinició dos veces durante el trabajo y el clon local se rehízo desde `origin`, perdiendo commits locales. El árbol de trabajo se conservó íntegro y el trabajo se ha vuelto a comprometer **y empujar** a `arena/0b7be6f7-deadbeat-disconew`. El historial anterior a `0bd6a54` es el de `main`.

## R. ACEPTACIÓN (criterio por criterio)

| Criterio de la especificación | Resultado |
|---|---|
| Pantalla de carga propia, con progreso real por etapas | **VERIFICADO** |
| Sin porcentajes falsos, sin esperas artificiales (salvo 520 ms declarados) | **VERIFICADO** |
| Manejo de errores con reintento | **IMPLEMENTADO PERO NO VERIFICADO** (el panel existe y el perro guardián está probado por código; no se ha forzado un fallo real para fotografiarlo) |
| Intro de 3–5 s, saltables, sin reinicio al recuperar foco | **VERIFICADO** |
| Menú definitivo con protagonista completo y proporción correcta | **VERIFICADO** (4 resoluciones) |
| Animación idle permanente y sutil | **VERIFICADO** |
| Estados hover / seleccionado / pulsado / deshabilitado | **VERIFICADO** (pulsado y deshabilitado por CSS, sin captura dedicada) |
| NUEVA PARTIDA sin duplicar arranque | **VERIFICADO** |
| CONTINUAR validando guardado real | **VERIFICADO** |
| SELECCIONAR PARTIDA sin fingir soporte inexistente | **VERIFICADO** (limitación documentada en pantalla) |
| OPCIONES aplicadas y persistidas | **VERIFICADO** (volumen y calidad; resolución la gestiona el sistema operativo/ventana) |
| CRÉDITOS sólo con nombres reales | **VERIFICADO** |
| SALIR con mecanismo real o alternativa honesta | **VERIFICADO** |
| Audio con dueño único por estado | **VERIFICADO** (por estado del motor, no a oído) |
| Ratón + teclado + mando | **VERIFICADO** (mando **emulado**) · mando físico **PENDIENTE** |
| 4 resoluciones sin distorsión ni recorte | **VERIFICADO** |
| Pruebas A–G con evidencia | **VERIFICADO** (41/41) |
| Rendimiento real | **BLOQUEADO/PENDIENTE**: el entorno no tiene GPU; se aporta el dato que lo demuestra (8,7 fps sin JS) |

## S. CÓMO REPRODUCIR

```bash
# 1. Build (determinista)
python3 tools/fase01_build_assets.py     # 15 assets + manifest
python3 tools/build_active_html.py       # index.html + DEADBEAT_DISCO.html

# 2. QA (prepara Chromium headless y sirve el repo)
bash tools/fase01_qa/run.sh
# → out/results.json y out/*.png ; salida esperada: 41/41 PASS
```

## T. CONCLUSIÓN

La Fase 01 está **implementada e integrada** en el juego real, no es una maqueta: el arranque, la carga con progreso real, la intro canónica, el menú definitivo con sus estados, los seis botones con lógica real y los submenús funcionan sobre los sistemas existentes (motor, `DD_CINE`, `DDC_COVER.music`), sin duplicarlos y sin tocar combate, HUB ni progresión.

Lo que queda abierto no es código pendiente de escribir, sino **verificación que este entorno no permite**: rendimiento con GPU y mando físico. Ambas están aisladas, documentadas y con el camino preparado para medirlas en cuanto haya hardware.

Y sobre lo demás: los siete fallos que encontré mientras probaba eran reales y habrían llegado al jugador (el botón de jugar no funcionaba; el arranque se colgaba). Están corregidos y cada uno tiene su prueba.

---

# FASE 01.1 — CIERRE TÉCNICO, CORRECCIÓN DE QA Y VALIDACIÓN FINAL

> Esta sección **se añade** al informe de Fase 01. No sustituye ni borra nada de lo anterior: el historial de decisiones, los 41 resultados originales y las limitaciones ya declaradas siguen vigentes. Aquí se documenta qué se auditó, qué estaba mal, qué se corrigió, cómo se probó y qué queda abierto.

## 01.1-A. RESUMEN

La Fase 01 estaba entregada y publicada en el PR #9, pero su QA **sobrevaloraba** varios resultados. La auditoría de cierre encontró cuatro defectos reales, tres de ellos en el producto y no en la prueba:

| # | Defecto | Gravedad | Estado |
|---|---|---|---|
| F1 | `LOADING` estaba declarado en `STATES` pero **nunca se entraba**: la secuencia real era `BOOT → INTRO → MAIN_MENU` | Media (criterio de la especificación) | **CORREGIDO** |
| F2 | El **modo seguro destruía la integridad**: con un recurso indispensable ausente se llegaba a un menú donde ningún botón podía actuar | Alta | **CORREGIDO** |
| F3 | `PLAYING` se declaraba de forma **optimista**, sin comprobar que el motor hubiera arrancado | Alta | **CORREGIDO** |
| F4 | El arnés de QA **no era portable**: rutas personales fijas (`/tmp/chromium`, `/home/user/_qa/al/lib`) | Media | **CORREGIDO** |

Y dos defectos más que aparecieron **durante** la corrección, al dejar de fiarse de las pruebas existentes:

| # | Defecto | Gravedad | Estado |
|---|---|---|---|
| F5 | Con el menú de Fase 01 abierto, el **mando no respondía**: su sondeo vivía en un `tick()` que dejaba de recibir frames | Alta | **CORREGIDO** |
| F6 | El FSM podía quedarse en `SUBMENU` con el submenú ya cerrado; a partir de ahí las acciones dejaban de responder | Alta | **CORREGIDO** |

Además, la prueba **C8 (pantalla completa) no medía nada**: daba PASS con sólo comprobar que el clic no lanzaba una excepción. Reescrita, hoy mide el efecto real y lo demuestra en este entorno.

Resultado final de la suite: **64 PASS · 0 FAIL · 0 SKIP · 0 NV**, sobre las 41 originales (que se conservan) más 23 nuevas.

## 01.1-B. PROBLEMAS ENCONTRADOS (con la evidencia que los sostiene)

### F1 · `LOADING` nunca ocurría

`STATES` declaraba `["BOOT","LOADING","INTRO",…]`, pero `boot()` pasaba de `BOOT` a `startIntro()`. Sondeando el FSM durante el arranque real se observó:

```
BOOT -> INTRO -> MAIN_MENU
body[data-dd-state] = boot, intro, main_menu
```

El estado existía en el array; la transición no existía en el código. Un estado declarado no es un estado implementado.

### F2 · El modo seguro desactivaba la integridad

`allowSafeMode` neutralizaba **todos** los pasos `critical: true`, que eran `assets`, `images` y `ui`. Es decir: ante la falta de un recurso indispensable, el botón de modo seguro ofrecía continuar y entregaba un menú sin sistema de menú. Medido con `DD_UI` ausente:

```
panel:  {visible:true, title:"NO SE PUDO ABRIR EL CLUB",
         body:"El sistema de menú (DD_UI) no está disponible…",
         errors:[{id:"ui", fatal:true}]}
tras pulsar MODO SEGURO:
        {state:"MAIN_MENU", ddUI:"undefined"}
```

Se abría el club, pero ningún botón podía hacer nada. Es peor que un error: es una salida falsa.

### F3 · `PLAYING` optimista

`launch()` llamaba a `window.DD_BOOT.enterGame()` **incondicionalmente**, ignorando si `startRun()` había devuelto `false`. El jugador podía ver el estado de partida sobre un motor parado. La primera tentativa de probarlo falló porque el puente se crea con `Object.freeze()` y la inyección no surtía efecto; hubo que neutralizar el congelado para poder inyectar el fallo y observar la reacción real.

### F4 · Arnés de QA atado a rutas personales

`lib.js` tenía escritas a mano la ruta del binario de Chromium y la del directorio de librerías. El arnés funcionaba sólo en esta máquina y sólo si alguien había preparado antes esos directorios. No era reproducible desde un clon limpio.

### F5 · El mando no respondía en el menú (encontrado al dejar de fiarse de D3)

El sondeo del gamepad vive dentro de `DD_UI.tick()`, y a `tick()` sólo lo llamaba el bucle de render del motor. Ese bucle **se retira** cuando la escena legada (`#overlay`) está oculta, que es exactamente el caso en el que el menú de Fase 01 es dueño de la pantalla. Medido: **0 llamadas a `tick()` en 5 s** con el menú abierto.

Consecuencia: el menú anuncia `A ELEGIR · B ATRÁS` y el mando no hacía nada. Es la clase de control que parece funcional y no lo es, y la prueba D3 original lo daba por bueno porque pulsaba un tiempo fijo y no verificaba el efecto.

### F6 · `SUBMENU` sin submenú

`closeSubmenuImmediate()` cerraba la interfaz del submenú **sin avisar al FSM**. Y `hideMainMenu()` marcaba el menú como no visible **antes** de llamarlo, así que un primer intento de sincronización no cubría ese camino. Resultado observable: `state = SUBMENU`, `submenu = null`. Como el sondeo consulta `uiState.submenu`, las acciones dejaban de responder.

## 01.1-C. CORRECCIONES APLICADAS

Todas son **localizadas**: ningún fichero se ha reescrito entero y no se ha tocado nada del motor, del HUB, del combate ni de la progresión.

| Defecto | Fichero | Corrección |
|---|---|---|
| F1 | `src/dd_boot.js` | `setState("LOADING")` al empezar los pasos reales |
| F2 | `src/dd_boot.js` | `ESSENTIAL_IDS = [engine, assets, images, ui]`. Si falla uno, el botón de modo seguro queda **desactivado**, con el motivo escrito, y sólo queda REINTENTAR. Degradables siguen siendo `fase01, fonts, audio, storage` |
| F3 | `src/dd_ui_system.js` + `src/dd_boot.js` | `launch()` confirma el motor (`isRunning`/`getSnapshot`) antes de declarar `PLAYING`; si no arranca en 3 s vuelve al menú y avisa. `enterGame()` rechaza la transición si el estado no lo permite **o si el motor no está en marcha** |
| F4 | `tools/fase01_qa/lib.js`, `run.sh` | Rutas derivadas de `QA_WORK`/`QA_MODULES`; Chromium lo resuelve `@sparticuz/chromium`; las librerías NSS se extraen solas del propio paquete; mensajes de error accionables |
| F5 | `src/dd_ui_system.js` | **Latido propio**: mientras el menú está visible y el motor no entrega frames, la UI se late con `requestAnimationFrame`; si el motor vuelve, el latido se retira. `tick()`/`tickInner()` separados para no confundirse con el motor |
| F6 | `src/dd_ui_system.js` | Invariante **incondicional**: si el FSM dice `SUBMENU` y la UI ya no tiene submenú, el FSM vuelve a `MAIN_MENU` |
| C8 | `src/dd_ui_system.js` | El botón sincroniza su estado con el evento `fullscreenchange` real; si el navegador rechaza la petición se explica; si el contexto no permite la API, el control se muestra **desactivado** |

## 01.1-D. C8 · PANTALLA COMPLETA, MEDIDA DE VERDAD

La versión anterior de C8 daba PASS así:

```js
const fsTry = await p.evaluate(() => { try { document.getElementById('dd-opt-fs').click(); return 'clicked'; }
                                       catch (e) { return 'err'; } });
ok('C8 pantalla completa usa el API real', fsTry === 'clicked', …);
```

Eso sólo demuestra que hacer clic no lanza una excepción. No dice si la pantalla completa ocurrió.

La prueba nueva separa **tres hechos distintos** y exige el tercero:

| Hecho | Medición | Resultado |
|---|---|---|
| (a) la API está expuesta | `requestFullscreen` presente y `fullscreenEnabled` | `true` |
| (b) el botón es operativo | no está desactivado | operativo |
| (c) la pantalla completa **ocurrió** | `document.fullscreenElement` + evento `fullscreenchange` | `false → true`, eventos `[true]`, `aria-pressed=true` |

Y además comprueba la **salida**: `exitFullscreen()` deja `fullscreenElement` en `false` (C8b). Si el entorno no lo concediera, la prueba queda en **SKIP**, nunca en PASS. En este entorno se concede, así que C8 pasa con evidencia y no por convenio.

## 01.1-E. PRUEBAS: 41 ORIGINALES + 23 NUEVAS

Las 41 originales se conservan íntegras. Se añaden 23:

| Bloque | Prueba | Qué comprueba |
|---|---|---|
| Panel de error · A | H-A1, H-A2, H-A3 | Con `DD_UI` ausente: el fallo crítico se detecta, el panel aparece, el mensaje **nombra el recurso** que falta y se ofrece REINTENTAR |
| Panel de error · B | H-B1, H-B2 | REINTENTAR pide un arranque nuevo; un contexto limpio no hereda el estado de error |
| Panel de error · C | H-C1, H-C2 | Sin recurso indispensable el modo seguro está desactivado y pulsarlo **no** entrega un menú inutilizable |
| Modo degradado | H-D1, H-D2 | Un fallo **no** esencial no impide abrir el menú y queda registrado como degradado, no como fatal |
| Accesibilidad | H-E1…H-E5 | seis etiquetas accesibles, foco visible dentro del menú, `role=menu`, ninguna acción desactivada que parezca funcional, flechas que mueven la selección, con `prefers-reduced-motion` |
| Máquina de estados | H-F1…H-F4 | `BOOT → LOADING → INTRO → MAIN_MENU` observado; traza monótona 0→100 %; ida y vuelta al submenú; transiciones inválidas rechazadas sin corromper el estado |
| Mando emulado | D3a, D3b, D3c, D3d, D3e | D-pad mueve, A abre, B vuelve, en reposo no se mueve solo, y el menú **sigue sondeando** con la escena legada oculta |

**El arnés ahora distingue PASS / FAIL / SKIP / NV.** Un `SKIP` no cuenta como `PASS` y se informa aparte con su motivo. Un `NV` (no verificable) tampoco.

Resultado de la ejecución completa:

```
== 64 PASS · 0 FAIL · 0 SKIP · 0 NV · 64 TOTAL ==
```

`docs/FASE_01_EVIDENCE/results_11.json` contiene los 64 registros con su detalle de medición.

## 01.1-F. REGRESIONES

Ninguna de las 41 pruebas originales se perdió: las 41 se ejecutan y pasan dentro de las 64.

Dos pruebas originales **cambiaron de forma** porque medían mal, no porque el producto empeorara:

- **D3** (mando emulado) se dividió en D3a–D3e. La versión anterior pulsaba un tiempo fijo mientras el sondeo ocurre en el bucle de render; medía la velocidad del entorno, no el juego. Se comprobó contra el build anterior (`9bcc6c6`) y **tampoco pasaba allí**: no era una regresión introducida, era una prueba mal construida.
- **C8** se reescribió para medir el efecto real en lugar de la ausencia de excepción.

Un fallo de la propia suite encontró un problema real de producto (F5/F6), que es exactamente lo que debe pasar cuando una prueba deja de conformarse con poco.

## 01.1-G. PENDIENTES Y LÍMITES QUE SIGUEN ABIERTOS

Nada de esto se ha maquillado:

| Elemento | Estado | Motivo |
|---|---|---|
| **Mando FÍSICO** | PENDIENTE | No hay hardware en este entorno. Lo probado es un **mando emulado** (`navigator.getGamepads` sintético) y así se etiqueta en las cinco pruebas D3 |
| **Rendimiento con GPU** | PENDIENTE | El entorno es headless sin GPU. Las cifras de fps del sandbox **no** son rendimiento del juego y no se reportan como tal |
| **Audio audible** | NO VERIFICABLE | Se comprueba el estado del motor de audio (propiedad, arranque y corte), no la salida por altavoz |
| **Pantalla completa** | VERIFICADO aquí | Se concede en este contexto; en un navegador que la bloquee, la prueba sería SKIP y el botón aparecería desactivado |
| Traza de `getTrace()` | Menor | Registra algunos pct repetidos (100,100,100) al final del arranque; no afecta a la monotonía ni al resultado |

## 01.1-H. CÓMO REPRODUCIR FASE 01.1

```bash
# 1. Build
python3 tools/build_active_html.py        # index.html == DEADBEAT_DISCO.html

# 2. QA completa (prepara todo en ~/.dd_fase01_qa y sirve el repo)
bash tools/fase01_qa/run.sh
# → 64 PASS · 0 FAIL · 0 SKIP · 0 NV
# → resultados y capturas en ~/.dd_fase01_qa/out
```

Desde un clon limpio **no hace falta preparar nada a mano**: `run.sh` instala el Chromium headless, extrae las librerías del propio paquete, sirve el repositorio y ejecuta la suite. Se puede redirigir todo con `QA_WORK`, `QA_PORT`, `QA_OUT`, `QA_URL` y `QA_CHROME`. No hay ninguna ruta personal en el código.

## 01.1-I. ARCHIVOS TOCADOS EN ESTA FASE

| Fichero | Cambio |
|---|---|
| `src/dd_boot.js` | `LOADING` real; `ESSENTIAL_IDS` y modo seguro íntegro; `enterGame()` con guardas de estado y de motor |
| `src/dd_ui_system.js` | `PLAYING` confirmado contra el motor; latido propio; invariante `SUBMENU`; pantalla completa honesta |
| `tools/fase01_qa/lib.js` | Portable: rutas derivadas, Chromium del paquete, extracción automática de librerías |
| `tools/fase01_qa/run.sh` | Portable, `--keep` / `--setup-only`, mensajes accionables |
| `tools/fase01_qa/suite.js` | PASS/FAIL/SKIP/NV; C8 honesto; D3a–D3e; bloques H-A…H-F; capturas no fatales |
| `index.html`, `DEADBEAT_DISCO.html` | Build regenerado (idénticos entre sí) |
| `docs/FASE_01_EVIDENCE/` | `13_error_panel`, `14_a11y_reduced_motion`, `res_*` (4 resoluciones) y `results_11.json` |

Sin cambios en: assets aprobados, identidad visual, HUB, salas, combate, generación procedural, cámara, progresión ni motor.

---

# FASE 01.2 — CORRECCIÓN DE INTEGRIDAD DEL ARRANQUE, RECUPERACIÓN Y QA

> Esta sección **se añade**. No sustituye ni borra nada de las fases anteriores: sus resultados, decisiones y limitaciones siguen vigentes. Aquí se documenta la revisión independiente del patch de Fase 01.1, los cinco defectos que encontró, cómo se corrigieron y qué se midió.

## 01.2-A. DIAGNÓSTICO

Los cinco hallazgos se **confirmaron contra el código actual**, ninguno estaba ya corregido:

| ID | Defecto | Confirmación en el código |
|---|---|---|
| **F1** | El perro guardián no vigilaba | Se armaba tras `setState("LOADING")` pero su condición era `if (state.current === "BOOT")`. Estando en `LOADING`, nunca disparaba |
| **F2** | `getEvidence()` no exponía `errors` | Devolvía sólo `finalPct`, `stepsDone`, `at`, `loadMs`. H-D2 leía `ev.errors \|\| []` → `[]` → `[].every(...)` → **`true`**: PASS sin comprobar nada |
| **F3** | `engine` no era crítico | Estaba en `ESSENTIAL_IDS` pero **no** tenía `critical: true`, y la fatalidad se decidía con `step.critical`. Un canvas ausente no era fatal |
| **F4** | La prueba de REINTENTAR no probaba producción | Sustituía `r.onclick` por una función de la propia prueba y comprobaba esa función |
| **F5** | `PLAYING` optimista | `else engineUp = true`: sin puente o sin poder consultar `isRunning()`, se daba el motor por activo |

## 01.2-B. CAMBIOS

| Fichero | Motivo exacto |
|---|---|
| `src/dd_boot.js` | **F1**: watchdog con token de intento, vigilando `LOADING`/`BOOT`, cancelado al terminar la carga. **F2**: `recordError()` como registro centralizado (id, mensaje, `severity`, `fatal`, `degraded`, `essential`, `kind`, `at`) expuesto por `getEvidence().errors` y `getErrorRegistry()`; el paso `audio` registra su degradación con motivo. **F3**: `engine` declara `critical: true` y `runSteps()` clasifica la gravedad con una sola fuente (`ESSENTIAL_IDS`). **F5**: se elimina `else engineUp = true`; sólo evidencia positiva. Además, el título del panel distingue bloqueo de degradación |
| `tools/fase01_qa/suite.js` | **F2**: H-D2 se parte en H-D2a…H-D2e y deja de usar `\|\| []`. **F4**: H-B1/H-B2 usan el botón real y observan la navegación. Nuevos bloques **W**, **E**, **P**. Helper `shot()` para que ninguna captura pueda tumbar la suite |
| `index.html`, `DEADBEAT_DISCO.html` | Build regenerado (idénticos entre sí) |
| `docs/FASE_01_EVIDENCE/` | `results_12.json`, `15_watchdog_blocked.webp` |

**Sin cambios** en HUB, combate, enemigos, jefes, Director, generación procedural, progresión, cámara, assets ni identidad visual.

## 01.2-C. RESULTADOS

```
== 84 PASS · 0 FAIL · 0 SKIP · 0 NV · 84 TOTAL ==
```

**Las 84 se ejecutaron de verdad en este entorno.** Las 64 de Fase 01.1 se conservan con sus identificadores, salvo una excepción deliberada y documentada:

> **`H-D2` desaparece como identificador** porque era precisamente el falso PASS. Su contenido se reemplaza por **`H-D2a`…`H-D2e`**, que sí comprueban el registro real. No se ha eliminado cobertura: se ha sustituido una prueba vacía por cinco con condición observada. Un ID que medía mal no debe conservarse para poder decir "64 intactas".

| Grupo | Pruebas | Qué mide |
|---|---|---|
| **W · watchdog** | W1–W6 | Carga normal sin interrupción; `loadFinished`/`watchdogFired` coherentes; **carga bloqueada real** que dispara el panel; título honesto; motivo con el límite |
| **D · registro de errores** | H-D2a–e | El registro existe y no está vacío; la entrada de audio existe y nombra el motivo; marcada `warning`/`degraded`/no fatal/no esencial; sistema degradado; campos y marca de tiempo |
| **E · motor esencial** | E1–E5 | Control con canvas; `engine` en `ESSENTIAL_IDS`; sin canvas el fallo es **fatal**; **nunca** `MAIN_MENU`; modo seguro bloqueado |
| **R · reintento real** | H-B1, H-B2 | Botón real, handler intacto, **navegación observada** (`navigate → reload`) y recuperación hasta `INTRO` |
| **P · PLAYING** | P ×4, P+ | Cuatro escenarios negativos comprobando el **estado final real**, más el positivo sin regresión |

## 01.2-D. EVIDENCIAS

Mediciones reales de esta ejecución:

| Prueba | Evidencia observada |
|---|---|
| **W2** | `loadFinished=true`, `watchdogFired=false`, `loadMs=894`, límite `20000 ms` |
| **W3** | Panel a los **23.806 ms** con `watchdogFired=true`; estado `LOADING` |
| **W4** | Título `"NO SE PUDO ABRIR EL CLUB"` (antes decía "EL CLUB ABRE EN MODO DEGRADADO") |
| **W5** | `"El arranque tardó demasiado (20000 ms)…"` |
| **E3** | Fatales: `["engine"]` |
| **E4** | Estado final `LOADING`, **nunca** `MAIN_MENU` |
| **E5** | `safe.disabled = true` |
| **H-B1** | `nav: "navigate" → "reload"`, `handlerIsReal: true`, `marker: null`, estado `INTRO` |
| **H-B2** | `state: "INTRO"`, `errVisible: false` |
| **H-D2b** | `{"id":"audio","severity":"warning","fatal":false,"degraded":true,"essential":false,"kind":"degraded","at":2354}` |
| **P (×4)** | `enterGame() = false` en los cuatro casos; estado final `MAIN_MENU` |
| **P+** | `{"state":"PLAYING","running":true}` |

Captura: `docs/FASE_01_EVIDENCE/15_watchdog_blocked.webp` — carga detenida en **IMÁGENES ESENCIALES (33 %)**, título y motivo correctos. Registro completo en `results_12.json`.

## 01.2-E. REGRESIONES

Verificado en la misma ejecución de 84:

- Carga de **9 pasos** con progreso monótono 0→100 %.
- Intro canónica de **4,4 s** y salto de intro.
- Menú principal, seis acciones, submenús, opciones y mezcla de audio, créditos.
- Ratón y teclado (D1, D2) y **mando emulado** (D3a–D3e, `getGamepads` leído 53 veces).
- **C8 fullscreen real**: `fullscreenElement false→true` con evento `fullscreenchange` y salida verificada.
- Transición al juego por cinemática de descenso (G1–G4).
- Cuatro resoluciones: 1280×720, 1920×1080, 2560×1440, 3440×1440.

**No comprobado:** regresión visual píxel a píxel contra Fase 01.1 (no se hizo diff de imagen) y comportamiento en navegadores distintos de Chromium.

## 01.2-F. LIMITACIONES

Se mantienen, sin cambios, y **no se presentan como verificadas**:

1. **Mando físico — NO PROBADO.** Sólo mando emulado.
2. **Rendimiento con GPU — PENDIENTE.** Las cifras del entorno headless no son rendimiento del juego.
3. **Audio audible — NO VERIFICADO.** Se comprueba el estado del motor, no la salida por altavoz.

## 01.2-G. VEREDICTO

**APTO CON LIMITACIONES DOCUMENTADAS.**

Los cinco defectos están corregidos y cada corrección tiene una prueba que mide el comportamiento real, no la apariencia. Ningún PASS depende de una condición que la prueba no haya comprobado. Las tres limitaciones físicas siguen abiertas y así se declaran.
