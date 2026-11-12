# PROJECT RESTART — Inicio del juego

## Etapas A y B: auditoría y propuesta (pendiente de aprobación)

- **Fecha:** 2026-11-12
- **Rama:** `arena/1a801cc0-deadbeat-disconew` (base `main` @ `000e7c6`)
- **Estado:** nada del juego se ha modificado. Este commit solo añade la carpeta `docs/RESTART/`.
- **Alcance:** cinemática de introducción, menú principal, transición a nueva partida y llegada al Refugio. Quedan fuera las nueve pistas, enemigos, progresión y animaciones generales.

Las tres láminas nuevas están archivadas en [`referencias/`](referencias/) como `LAMINA_A`, `LAMINA_B` y `LAMINA_C`. Las capturas de la auditoría están en [`evidencia_auditoria/`](evidencia_auditoria/).

---

# PARTE 1 — AUDITORÍA

## 1.1 Cómo se ha auditado

El juego se ha ejecutado de verdad: `index.html` servido por HTTP y abierto en Chromium 153 sin cabeza (render por software), a 1280×720 y 1920×1080. Se dejó correr la introducción completa (35 s), se probó el salto con Espacio y se leyó el estado interno en cada paso.

No se ha podido comprobar: audio audible (el navegador de pruebas no tiene salida de sonido), mando físico y rendimiento en hardware real.

## 1.2 Qué se ejecuta realmente

| Tema | Hallazgo |
|---|---|
| HTML activo | `index.html` y `DEADBEAT_DISCO.html` (idénticos, 5,5 MB). Son builds: no se editan a mano. |
| Construcción | `tools/build_active_html.py` parte de `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html`, incrusta `src/dd_rebuild_ui.css`, inyecta el puente `__DD_BRIDGE` y añade seis módulos de `src/`. Un workflow de GitHub lo regenera al subir cambios en `src/`. |
| Otra línea de build | `DEADBEAT_DISCO.ART.html` (13,5 MB) + `ART_PACK/art_pack.js`: la línea de las tandas T01–T09 del HUB. `CURRENT_STATE.md` y `ART_BIBLE.md` todavía la llaman «build activa», pero el README, el workflow y el trabajo más reciente (R01–R03, 12 de noviembre) usan `index.html`. **Esta tarea trabaja solo sobre `index.html`/`src/`.** |
| Git | Rama limpia, sin cambios pendientes. Clon superficial (1 commit visible). Repositorio de 1,4 GB; `assets/cinematics/` pesa 132 MB. |

## 1.3 Sistemas existentes

| Sistema | Dónde | Estado |
|---|---|---|
| Arranque y máquina de estados | `src/dd_boot.js` (`DD_BOOT`) — `BOOT → LOADING → INTRO → MAIN_MENU ↔ SUBMENU → PLAYING` | Sólido: carga con hitos reales, panel de error, reintento, modo seguro, perro guardián. **Se reutiliza.** |
| Cinemáticas y cámara | `src/dd_cinematic_camera.js` (`DD_CINE`) — intro, transición de sala, descenso, jefe, derrota, victoria | El reproductor (reloj, salto, bandas, finalización única) funciona. El contenido de la intro hay que rehacerlo. |
| Menú e interfaz | `src/dd_ui_system.js` (`DD_UI`) + `src/dd_rebuild_ui.css` | Menú completo con teclado, ratón y lectura de mando; submenús de opciones, créditos y partida. **Se reutiliza la lógica, se rehace el aspecto.** |
| Refugio | `src/dd_hub_system.js` (`DD_HUB`) — entrada en `(880, 615)`, salida a incursión | Funciona. Fuera de alcance salvo el punto de llegada. |
| Recursos | `src/dd_asset_registry.js` (`DD_ASSETS`, 269 entradas, 0 errores) y `tools/art_master/batch.py` para altas | **Se reutiliza.** |
| Audio | Dos motores WebAudio sintetizados ya incluidos en el HTML base: `DDC_COVER.music` (menú) y `DMO_MUSIC` (partida). No hay archivos de audio. `DD_BOOT.audio` arbitra quién suena. | Se reutiliza. Ver problema P6. |
| Render | Canvas 2D a resolución nativa; la intro se pinta en `DD_CINE.renderOverlay`. El menú es HTML/CSS sobre el canvas. | Se reutiliza. |

## 1.4 Flujo actual medido

`Carga (≈2 s) → Intro de 35 s → Refugio`. **El menú principal no aparece nunca.**

Capturas: [`flujo_actual_1280x720.jpg`](evidencia_auditoria/flujo_actual_1280x720.jpg), [`intro_plano09_y_menu_anterior.jpg`](evidencia_auditoria/intro_plano09_y_menu_anterior.jpg), [`refugio_tras_intro.jpg`](evidencia_auditoria/refugio_tras_intro.jpg).

Resultado de la ejecución: 0 errores JavaScript, 0 avisos de consola, 0 peticiones fallidas.

## 1.5 Problemas encontrados

| # | Problema | Evidencia |
|---|---|---|
| P1 | **El menú está fuera del flujo.** La FASE 06 hizo que la intro termine directamente en el Refugio. | `dd_boot.js`, función `startIntro` → `DD_HUB.enter()`. |
| P2 | **El menú no se puede mostrar con el Refugio activo.** `DD_BOOT.exitGameToMenu()` cambia el estado a `MAIN_MENU`, pero `DD_UI.tick` lo oculta en el siguiente fotograma. Estado y pantalla quedan en desacuerdo. | Probado: estado `MAIN_MENU`, pantalla idéntica al Refugio. |
| P3 | **La intro contradice el lore.** Muestra al protagonista llegando desde una ciudad exterior y entrando por la puerta. La biblia (§4.4 y §5.3) prohíbe presentarlo como visitante del exterior. | `STORYBOARD_DIRECTOR_REPORT.md`, planos 01–04. |
| P4 | **La intro parece una maqueta.** Rótulos técnicos en pantalla («PLANO 09 · DEADBEAT DISCO», «HERO SHOT · LOGOTIPO OFICIAL»), botón de depuración «VISOR & RIG» visible, logotipo cortado (solo se lee «DISCO»), el sprite de juego pegado sobre un fondo de otra escala y estilo. | Captura del plano 09. |
| P5 | **Los seis fondos cinemáticos llevan muestras de paleta horneadas** en las esquinas superiores (restos de la lámina de la que salieron) y rótulos cortados («OR», «AL»). | `assets/cinematics/backgrounds/cine_bg0*.png`. |
| P6 | **La música del menú sigue sonando en el Refugio.** Tras la intro, `menuMusic` continúa en `true` con estado `PLAYING`. | Lectura de `DD_BOOT.getState()`. |
| P7 | **Textos con nomenclatura descartada** en el recorrido inicial: «Desciende al Círculo I · Lujuria» (menú), «CÍRCULO I · LUJURIA» (títulos de descenso), «DJ VIRGILIO» y «cazador» (bienvenida del Refugio). El lore vigente dice pista, Tempo y Desafinado. | `dd_ui_system.js`, `dd_cinematic_camera.js`, `dd_hub_system.js`. |
| P8 | **«Seleccionar partida» promete ranuras que no existen.** El submenú muestra una única ficha de progreso; el motor no guarda partidas a medias. | `dd_ui_system.js`, `renderSlots`. |
| P9 | **«Nueva partida» salta el Refugio.** Lanza la incursión directamente. El flujo pedido termina en el Refugio. | `startRunWithDescent`. |
| P10 | **Tres estilos distintos en 40 segundos:** fondos góticos casi pixelados en la intro, ilustración de línea fina en el menú, y Refugio de baldosa repetida. Ninguno coincide con las láminas nuevas. | Capturas. |

## 1.6 Recursos disponibles

| Recurso | Valoración para esta tarea |
|---|---|
| Logotipo `assets/logos/logo_deadbeat_graffiti.png` y emblema del zorro | Aprobados. Se conservan tal cual; coinciden con las láminas. |
| Protagonista R01 (22 ilustraciones de juego, 288×512) | Válidos para el Refugio. Demasiado pequeños para primeros planos. |
| Fondos `cine_bg01…06` y sus capas | No reutilizables en la intro nueva (P3, P5, estilo). Se conservan en el repositorio como histórico. |
| `menu_backdrop_2k.webp` | Buen dibujo del protagonista canónico, pero ciudad exterior de fondo (P3) y estilo de línea fina. Sirve como referencia de identidad. |
| Iconos de menú `assets/fase01/menu_icon_*` | Genéricos (triángulo, engranaje). Se sustituyen por marcas de pincel hechas en CSS. |
| Storyboard anterior (`docs/CINEMATIC_STORYBOARD/`) | Histórico. Se sustituye por el de este documento. |

---

# PARTE 2 — CONFLICTOS DE CANON (requieren tu decisión)

## C1 — El protagonista: hay dos diseños

| | Canon del repositorio | Láminas nuevas |
|---|---|---|
| Cabeza | Pelo negro en puntas, sin sombrero | Sombrero de ala ancha, melena |
| Ropa | Chaleco negro sin mangas, camiseta clara, zorro en la espalda | Gabardina o traje largo salpicado de pintura |
| Brazos | Desnudos y tatuados | Cubiertos |
| Apoyo documental | `ART_BIBLE.md` §1.6, `REF_04`, los 22 sprites R01, retrato del HUD, fondo del menú | Las tres láminas y tu descripción («sombrero, rostro reconocible») |

El lore añade un dato que pesa: los tatuajes del Desafinado «parecen una partitura incompleta» (§4.1). Con gabardina no se ven.

Consecuencia práctica: si la intro y el menú muestran al hombre del sombrero, al llegar al Refugio el jugador controlará al del pelo en puntas. Serían dos personas distintas con 10 segundos de diferencia.

| Opción | Qué implica |
|---|---|
| **A. Mantener el canon del repositorio**, redibujado con el trazo de las láminas | Coherente con el Refugio hoy. No toca el canon. El sombrero no aparece. |
| **B. Híbrido: el Desafinado canónico con sombrero y abrigo abierto sin mangas** (tatuajes visibles) en intro y menú; al caer por el pozo pierde el sombrero | Respeta tu indicación y el lore. La pérdida del sombrero explica la diferencia con el sprite. Es una decisión de canon nueva. |
| **C. Adoptar el diseño de las láminas como canon nuevo** | Obliga a rehacer los 22 sprites R01, el retrato del HUD y la documentación. Amplía el alcance; hasta entonces habría discontinuidad en el Refugio. |

**Recomendación: B.** Es la única que cumple a la vez «sombrero», «no inventes otro protagonista» y continuidad con el Refugio sin ampliar el alcance.

## C2 — El menú de las láminas tiene opciones que no existen

Las láminas muestran JUGAR, ARMAMENTO, GALERÍA, DESAFÍOS, OPCIONES, SALIR. Armamento existe solo dentro del Refugio; galería y desafíos no existen.

**Propuesta:** `NUEVA PARTIDA` · `CONTINUAR` (solo si hay progreso) · `OPCIONES` · `CRÉDITOS` · `SALIR`. La ficha de progreso actual se conserva dentro de `CONTINUAR`; desaparece el rótulo «Seleccionar partida» (P8).

## C3 — Nomenclatura en el recorrido inicial

**Propuesta:** corregir solo los textos que el jugador ve entre el arranque y la llegada al Refugio: subtítulos del menú y la frase de bienvenida («DJ VIRGILIO» → «TEMPO», «cazador» fuera). El resto de apariciones de «Círculo» y «Virgilio» en el juego no se toca en esta tarea; queda anotado.

## C4 — Estilo del Refugio

El Refugio actual no tiene el estilo de las láminas y está fuera de alcance. La transición lo suaviza con un fundido de color, pero la diferencia se notará hasta que se rehaga.

## C5 — Paleta: `ART_BIBLE.md` frente a las láminas

La biblia limita el neón al 15 % de la superficie y usa oro como acento. Las láminas son mucho más saturadas, con magenta dominante y amarillo en lugar de oro.

**Propuesta:** las láminas mandan en intro y menú (pantallas de presentación, sin combate). La regla del 15 % sigue vigente para el juego, donde protege la legibilidad. Se añadirá como anexo a `ART_BIBLE.md`, sin reescribirla.

---

# PARTE 3 — DIRECCIÓN ARTÍSTICA UNIFICADA

## 3.1 Lectura de las láminas

Lo que las tres comparten y se adopta:

- Fondo negro profundo; el color sale de la oscuridad, nunca al revés.
- Contorno negro grueso e irregular, de pincel, más pesado en la silueta que en el interior.
- Sombras por masas negras planas, sin degradado suave.
- Color en manchas: salpicaduras, goteos y brochazos de magenta, cian y amarillo sobre la figura.
- Luz de neón pintada en el material (borde magenta a un lado, cian al otro).
- Rótulos de pincel blanco hueso, inclinados, con subrayado de brochazo amarillo para el elemento activo.
- Marcos de panel de cómic con borde rugoso.

Lo que no se copia: los rostros inconsistentes entre láminas, las manos deformes, los textos ilegibles de los paneles pequeños y los enemigos de ojo gigante que no corresponden a ninguna familia del juego.

## 3.2 Guía aplicable

| Aspecto | Regla |
|---|---|
| Paleta | Negro `#0B0B12` (base) · Magenta `#FF007A` (dominante) · Cian `#00E5FF` (contraste) · Amarillo `#FFD400` (selección y avisos, nunca decoración) · Violeta `#8A00FF` (profundidad) · Hueso `#F0E6DB` (texto y brillos) |
| Reparto de color | 60 % negro, 20 % magenta/violeta, 10 % cian, 5 % hueso, 5 % amarillo como máximo |
| Contorno | Tinta negra, 3 grosores: silueta, forma interior, detalle. Sin líneas de color. |
| Sombras | Una masa negra por figura, borde duro. Sin sombreado suave. |
| Iluminación | Dos luces de borde: magenta (izquierda) y cian (derecha). Sin luz de relleno blanca. |
| Texturas | Salpicadura, goteo y pincel seco. Sin grano fotográfico ni ruido digital. |
| Personajes | Proporciones estilizadas, rasgos angulosos, expresión contenida en el protagonista y exagerada en el resto. |
| Escenarios | La estación convertida en sala de baile: hierro, cristal, reloj, bola de espejos, estandartes del zorro. Multitud en silueta negra. |
| Tipografía | Títulos: rótulo de pincel (el del logotipo). Menú: mayúsculas condensadas inclinadas, hueso sobre negro. Texto pequeño: la sans actual, que ya es legible. |
| Iconografía | Corona, zorro, salpicadura. Sin engranajes ni iconos de sistema. |
| Composición | Peso en diagonal; un solo foco por plano; el tercio izquierdo queda limpio para texto. |
| Efectos | Destellos de pintura en los golpes de bombo, salto de fotograma para la «repetición», temblor breve. Sin destellos de lente ni fallos digitales. |
| Legibilidad | Texto del menú con contraste mínimo 7:1; el elemento activo se distingue por forma (brochazo), no solo por color. |
| Resoluciones | Composición en 16:9 con zona segura central 4:3. En ultrapanorámico se amplía el fondo, no se estira. Probado de 1280×720 a 3440×1440. |
| Movimiento reducido | Con `prefers-reduced-motion` se suprimen temblor y saltos; los planos pasan por fundido. Ya lo respeta el sistema actual. |

## 3.3 Prueba de convivencia

Antes de producir los planos se generará **una sola imagen de prueba**: el protagonista sobre el fondo de la pista con el logotipo aprobado encima. Si los tres no parecen del mismo dibujante, se ajusta la guía antes de seguir.

---

# PARTE 4 — CINEMÁTICA DE INTRODUCCIÓN

## 4.1 Objetivo

Que el jugador entienda tres cosas sin texto: esta fiesta se repite, algo en ella está mal, y hay alguien que no encaja. No se explica la Escucha, ni el Rey, ni quién es Tempo.

**Título de trabajo:** «La noche que vuelve» (el que ya usa la biblia).
**Duración:** 32 segundos a 120 BPM (un compás = 2 s). Se puede saltar en cualquier momento.

## 4.2 Storyboard

| # | Tiempo | Plano | Qué se ve | Cámara y capas | Sonido |
|---|---|---|---|---|---|
| 1 | 0–4 s | Detalle | Negro. Una aguja cae sobre un vinilo. El surco gira. | Acercamiento lento al surco. | Crujido de aguja. Silencio. Entra un bombo lejano. |
| 2 | 4–9 s | Gran general | El surco se funde con la torre vista en corte: una estación de hierro y cristal arriba, y debajo plantas que bajan hasta perderse. Luna magenta. | Descenso vertical. Tres capas: cielo, edificio, niebla. | El bombo se acerca. Entra el bajo. |
| 3 | 9–14 s | General interior | La pista principal: bola de espejos, reloj de estación, estandartes del zorro, multitud en silueta bailando. | Avance lento. Cuatro capas: arquitectura, luces, multitud, humo. | Tema completo. |
| 4 | 14–18 s | Insertos (3 cortes) | Una mano con auriculares sobre el plato (Tempo, sin rostro). Bailarines de sonrisa fija. Una figura con máscara dorada en un palco (Véspera, en silueta). | Cortes al compás. **El último compás se repite**: la imagen salta atrás un tiempo, dos veces. | La música se repite con el mismo salto. |
| 5 | 18–23 s | Detalle → medio | Pies que pisan a la vez. Una bota pisa tarde. Subida por la figura: el Desafinado, de espaldas, zorro en el abrigo. | Seguimiento vertical. Fondo desenfocado en manchas. | Un golpe de caja fuera de tiempo. |
| 6 | 23–28 s | Primer plano | Se gira. Rostro, media cara en magenta y media en cian. Detrás, la multitud se ha detenido y lo mira. | Fija, con un acercamiento mínimo. | La música se corta. Un golpe grave llega desde abajo. |
| 7 | 28–32 s | Título | Salpicadura de pintura. Logotipo DEADBEAT DISCO. Debajo: «La noche que devoró el amanecer». | El plano 6 se abre hasta la composición del menú. | Golpe final. Arranca el tema del menú. |

## 4.3 Notas de dirección

- **Aparición del protagonista:** primero su error (el paso tarde), después su espalda, por último su cara. No llega de ningún sitio: ya estaba ahí.
- **Relación con el lore:** estación de tren (§2.1), repetición de la música (§2.3), Tempo como mano en el plato (§3), paso fuera de tiempo como origen del Desafinado (§4.1). No se muestra el exterior como lugar del que se viene.
- **Ritmo:** lento, medio, cortes rápidos, parada en seco, golpe.
- **Transiciones:** fundido por forma (surco → torre), corte al compás, y apertura final hacia el menú sin pasar por negro.
- **Sonido:** se construye con el motor sintetizado que ya existe (`DDC_COVER.music` y sus efectos). No se añaden archivos de audio. La repetición y el corte se programan sobre ese motor.

---

# PARTE 5 — MENÚ PRINCIPAL

## 5.1 Diseño

El menú es el último fotograma de la intro que se queda quieto.

- **Fondo:** la pista de la estación, multitud detenida en silueta, bola de espejos girando despacio.
- **Protagonista:** a la derecha, de medio cuerpo, mirando al jugador. Respira; el humo del fondo se mueve.
- **Logotipo:** arriba a la izquierda, el aprobado, sin cambios.
- **Opciones:** columna a la izquierda, rótulo inclinado en hueso.
- **Pie:** ayuda de controles (cambia sola entre teclado y mando) y versión.

## 5.2 Opciones

| Opción | Qué hace | Condición |
|---|---|---|
| NUEVA PARTIDA | Transición de descenso → Refugio | Siempre |
| CONTINUAR | Abre la ficha de progreso y lleva al Refugio | Solo aparece si hay progreso guardado |
| OPCIONES | Submenú existente (audio, vídeo, controles, accesibilidad) | Siempre |
| CRÉDITOS | Submenú existente | Siempre |
| SALIR | Diálogo de salida existente | Siempre |

## 5.3 Estados de los botones

| Estado | Aspecto |
|---|---|
| Reposo | Texto hueso al 70 % |
| Foco / cursor encima | Brochazo amarillo detrás, texto negro, desplazamiento de 8 px a la derecha, sonido de movimiento |
| Pulsado | El brochazo salpica; sonido de confirmación |
| Bloqueado durante transición | Sin respuesta; no admite segunda pulsación |

## 5.4 Controles

| Acción | Teclado | Mando |
|---|---|---|
| Moverse | ↑ ↓ / W S | Cruceta / palanca izquierda |
| Elegir | Enter / Espacio | A |
| Atrás | Esc | B |
| Saltar intro | Cualquier tecla o clic | A / Start |

La lectura de mando ya existe en `DD_UI.pollGamepad`; se conserva.

## 5.5 Sonido

Tema del menú del motor existente, que arranca en el golpe del título y **se apaga al entrar al Refugio** (corrige P6).

---

# PARTE 6 — TRANSICIÓN Y FLUJO

## 6.1 Recorrido

```
Carga → Intro (32 s, se puede saltar) → Menú → NUEVA PARTIDA → Descenso (7 s, se puede saltar) → Refugio
```

## 6.2 Descenso al Refugio

Sigue la propuesta de la biblia (§5.3):

| Tiempo | Qué ocurre |
|---|---|
| 0–2 s | El golpe grave se repite. Grietas de luz en el suelo bajo el protagonista. Un mecanismo circular se abre. |
| 2–5 s | La plataforma baja por el pozo. Pasan balcones y luces de otras pistas. El sombrero se queda arriba (solo con la opción B de C1). |
| 5–7 s | La plataforma frena. Fundido de color al Refugio, con el protagonista ya en su punto de entrada `(880, 615)`. Bienvenida de Tempo. |

## 6.3 Garantías

| Riesgo | Solución |
|---|---|
| Doble pulsación | El bloqueo `busy` del menú y la finalización única de `DD_CINE`, que ya existen. |
| Intro o descenso que se cuelgan | La salvaguarda por estancamiento que ya tiene `dd_boot.js` se aplica también al descenso. |
| Falta una imagen | Cada plano tiene un fondo de reserva pintado por código (degradado y título); la secuencia nunca se queda en negro. |
| Dos músicas a la vez | `DD_BOOT.audio` pasa a ser el único que arranca y para música en todo el recorrido. |
| Audio bloqueado por el navegador | Se mantiene el aviso «pulsa una tecla para habilitar el audio» de la pantalla de carga. |
| El menú desaparece solo (P2) | Se corrige la regla de `DD_UI.tick`: el menú solo se oculta cuando `DD_BOOT` declara `PLAYING`. |

---

# PARTE 7 — ARQUITECTURA TÉCNICA

## 7.1 Principio

No se crea ningún sistema nuevo. Se cambia contenido y se corrigen conexiones.

## 7.2 Cambios previstos

| Archivo | Cambio |
|---|---|
| `src/dd_cinematic_camera.js` | Sustituir la tabla y el pintor de la intro de 10 planos por los 7 nuevos, descritos como datos (capas, movimiento, tiempos). Añadir la secuencia `arrival` (descenso). Quitar rótulos técnicos. |
| `src/dd_boot.js` | La intro vuelve a terminar en `MAIN_MENU`. Precarga de los recursos nuevos. La música se detiene al entrar al Refugio. |
| `src/dd_ui_system.js` | Lista de opciones nueva, `NUEVA PARTIDA` → descenso → `DD_HUB.enter()`, corrección de P2, ocultar el botón de depuración fuera de modo QA. |
| `src/dd_rebuild_ui.css` | Aspecto nuevo del menú y sus estados. |
| `src/dd_hub_system.js` | Solo la frase de bienvenida (C3). |
| `src/dd_asset_registry.js` | Altas con `tools/art_master/batch.py register` (aditivo, no borra nada). |
| `tools/build_active_html.py` | Sin cambios previstos; se ejecuta para regenerar los dos HTML. |

## 7.3 Recursos nuevos (máximo 10 ilustraciones)

Ubicación: `assets/cinematics/restart/`. Maestros en `ART_ASSETS/rebuild_masters/R04_INICIO/`.

| # | Recurso | Uso |
|---|---|---|
| 1 | Vinilo y aguja | Plano 1 |
| 2 | Torre en corte | Plano 2 y pozo del descenso |
| 3 | Pista de la estación (fondo) | Planos 3, 6, 7 y menú |
| 4 | Multitud en silueta (capa) | Planos 3, 6 y menú |
| 5 | Mano de Tempo en el plato | Plano 4 |
| 6 | Bailarines de sonrisa fija | Plano 4 |
| 7 | Véspera en el palco | Plano 4 |
| 8 | Pies y bota | Plano 5 |
| 9 | Protagonista de espaldas | Plano 5 |
| 10 | Protagonista de frente, medio cuerpo | Planos 6, 7 y menú |

Humo, luces, salpicaduras, grietas y el mecanismo del suelo se pintan por código. Todas las ilustraciones se generan con las láminas y el protagonista canónico como imagen de referencia, siguiendo el flujo de `tools/art_master/`.

Los recursos antiguos (`cine_bg01…06`, storyboard anterior) no se borran: dejan de precargarse y se anotan como histórico.

## 7.4 Plan de pruebas

Se automatizará en `tools/qa/test_restart_flow.js` con el mismo navegador usado en la auditoría:

| Prueba | Cómo |
|---|---|
| Apertura, carga, errores de consola | Automática |
| Intro completa: 7 planos en sus tiempos | Lectura del reloj de `DD_CINE` y capturas por plano |
| Salto en cada plano | Automática, 7 veces |
| Menú: navegación, estados, cada opción | Teclado real del navegador |
| Mando | API Gamepad simulada. **Un mando físico no se puede probar aquí.** |
| Nueva partida → Refugio, sin doble activación | Pulsaciones repetidas |
| Resoluciones | 1280×720, 1366×768, 1920×1080, 2560×1440, 3440×1440 |
| Repetición del flujo | 3 vueltas completas seguidas |
| Audio | Solo estado lógico (qué motor está activo en cada estado). **El sonido audible no se puede verificar aquí.** |
| Animación | Secuencias de fotogramas con diferencia medida entre ellos; no capturas sueltas |

---

# PARTE 8 — DECISIONES QUE NECESITO

1. **C1 — Protagonista:** A, B o C. Recomiendo B.
2. **C2 — Opciones del menú:** ¿apruebas la lista de cinco?
3. **C3 — Textos:** ¿autorizas cambiar «DJ VIRGILIO» por «TEMPO» en la bienvenida del Refugio?
4. **Storyboard y descenso:** ¿aprobados, o qué cambiarías?
5. **Idioma:** el menú y la intro quedan en español, como el resto del juego.

Con tu respuesta empiezo la Etapa D por la imagen de prueba de convivencia (§3.3).
