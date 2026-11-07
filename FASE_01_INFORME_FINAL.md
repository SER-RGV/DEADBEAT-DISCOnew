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
== 41/41 PASS ==
```

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
