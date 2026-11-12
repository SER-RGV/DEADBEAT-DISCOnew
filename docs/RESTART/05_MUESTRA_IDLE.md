# DEADBEAT DISCO — Fase 06 · Muestra IDLE del protagonista

- **Fecha:** 2026-11-12 · **Rama:** `arena/1a801cc0-deadbeat-disconew`
- **Estado:** muestra producida y visor en marcha. **Pendiente de tu evaluación.** No se ha empezado ninguna otra animación.
- **Canon:** lámina maestra intacta (SHA-256 `43d9e58f…004e5d`, comprobado al terminar).

## Veredicto

**La muestra no supera el criterio de continuidad de tatuajes.** Lo demás se mantiene estable.

| Criterio | Resultado | Detalle |
|---|---|---|
| Rostro | Estable | Mismo perfil, ojo, barba y media sonrisa en los cuatro. Varía ligeramente el sombreado de la mandíbula entre los fotogramas 2 y 3 |
| Pelo | Estable | Misma silueta y mismos mechones |
| Anatomía | Estable | Misma altura (462 px) y misma cabeza en los cuatro |
| Pies | Estables | Suelas en y=504 en los cuatro; botas entre x=97 y x=189–190 |
| Vestuario | Casi estable | En los fotogramas 3 y 4 aparecen dos pequeños remaches claros en el delantero del chaleco que no están en el 1 y el 2 |
| **Tatuajes** | **No estable** | Los motivos están en el mismo sitio, pero el trazo interior de la tinta del hombro y del antebrazo cambia entre el fotograma 2 y el 3, y vuelve a cambiar al cerrar el ciclo |
| Respiración | Sutil | El torso pasa de 77 a 83 px de fondo en el lienzo: 1,3 px en pantalla a tamaño de juego |

- A tamaño de juego (figura de ~106 px) el cambio de tinta **no se aprecia**. Ampliado en el visor, **sí**: la tinta «hierve» dos veces por ciclo.
- Causa: el generador de imágenes vuelve a entintar los tatuajes en cada fotograma. Los fotogramas 1–2 proceden de una generación y los 3–4 de otra; dentro de cada pareja la tinta coincide.
- Evidencia: `evidencia_idle/detalle_tatuajes_maestros_x4.jpg`, `detalle_torso_brazo_x4.jpg`, `detalle_cabeza_x4.jpg`, `medidas_deriva.json`.

## Fidelidad a la lámina (vista «PERFIL D.»)

Comparación: `evidencia_idle/lamina_perfil_d_frente_a_muestra.jpg`.

| Aspecto | Resultado |
|---|---|
| Silueta, proporciones, postura | Coinciden con el perfil de la lámina |
| Chaleco, cargo con bolsillo lateral, muñequera, botas | Coinciden |
| Paleta, contorno de tinta, contraluz magenta y cian | Coinciden |
| Pelo descubierto | Tomado del sprite antiguo `player_idle_00`: negro en punta, con filo magenta atrás y cian delante |
| Chaleco | Se lee más magenta que en la lámina, donde domina el negro |
| Cadenas del cuello y camiseta blanca | No se ven. En el perfil de la lámina tampoco se distinguen |
| Cinturón y hebilla | Ocultos por el chaleco y el brazo |
| Ankh del cuello | Presente. En el «PERFIL D.» de la lámina no se distingue a su tamaño; lo he incluido porque es canon |
| Sigilo del hombro | **No fiel:** es una masa de formas orgánicas, sin la estrella dentro del círculo |
| Lobo del antebrazo | **No reconocible** como lobo |
| Sigilo de la mano | Presente, simplificado |

El perfil de la lámina mide 370 px de alto: a ese tamaño no contiene el dibujo de los tatuajes, y el generador no los ha trasladado desde los detalles ampliados.

## Qué se ha producido

| Archivo | Qué es |
|---|---|
| `assets/characters/protagonist_master/pm_idle_00…03.png` | Los cuatro fotogramas, 288×512, RGBA, mirando a la derecha |
| `assets/characters/protagonist_master/pm_idle.manifest.json` | Entradas con el formato del registro del juego, más tiempos (4 × 560 ms, en bucle) |
| `ART_ASSETS/rebuild_masters/R05_PROTAGONISTA_MAESTRO/*.webp` | Maestros archivados |
| `docs/ART_REBUILD/batches/R05_PROTAGONISTA_MAESTRO.json` y `.report.json` | Descripción de la tanda e informe del proceso |
| `assets/cinematics/preview/protagonist_anim_test.html` | Visor independiente |
| `tools/qa/test_protagonist_anim_viewer.js` | Pruebas del visor |
| `docs/RESTART/evidencia_idle/` | Capturas, hojas de comparación, medidas y `pm_idle_animacion.gif` |

**Orden de los fotogramas:** reposo → inspirando → pecho alto → espirando.

**Cómo se hicieron.** Un fotograma base generado con la lámina, el recorte «PERFIL D.» y el sprite antiguo como referencias; los demás, como ediciones de ese fotograma. Hubo siete generaciones: se usan cuatro y se descartaron dos (una hinchaba el pecho en exceso, otra cambiaba la expresión). Los croma pasaron por `tools/art_master/batch.py process`, con el mismo encaje para los cuatro y sin ajustes por fotograma.

**Contrato de lienzo:** figura de 462 px, suelas en y=504, eje centrado, ancla de cinturón 0,511 (estimada: el cinturón no se ve), ancla de mano 0,58 / 0,577.

## Integración: qué es real y qué no

- **Real:** los PNG los pinta `DD_WORLD.drawProtagonist` de `src/dd_world_renderer.js`, cargado tal cual, con su sombra, su escala y su reflejo.
- **Adaptación del visor:** el renderizador solo conoce el identificador `player_idle_00`. El visor le entrega en ese hueco el fotograma en curso.
- **No existe en el juego:** el cambio de fotograma por tiempo. Lo hace el visor. El motor sigue dibujando un único fotograma por pose.
- **No registrado:** los `pm_idle_*` no están en `src/dd_asset_registry.js`. El juego sigue usando `assets/characters/player_idle_00.png`.

## Visor

`http://localhost:8080/assets/cinematics/preview/protagonist_anim_test.html`

| Control | Qué hace | Tecla |
|---|---|---|
| `PAUSA` / `REPRODUCIR` | Detiene o reanuda | Espacio |
| `ANTERIOR` / `SIGUIENTE` | Cambia de fotograma y pausa | ← → |
| `¼×` `½×` `1×` `2×` | Velocidad | — |
| `−` `+` | Tamaño | − + o rueda |
| `AJUSTAR` | Figura a pantalla completa | A |
| `TAMAÑO DE JUEGO` | Zoom real de combate (1,16) | J |
| `TRANSPARENTE` `OSCURO` `CLARO` `MAGENTA` | Fondo | — |
| `PAPEL CEBOLLA` | Superpone el fotograma anterior | C |
| `REFLEJO` | Mirando a la izquierda, como lo haría el motor | R |
| `BALANCEO DEL MOTOR` | Suma el balanceo vertical que el motor aplica en el Refugio | — |
| `SPRITE ANTIGUO` | Dibuja al lado `player_idle_00` a la misma escala | — |
| `GUÍAS` | Suelo, eje, anclas, lienzo y círculo de colisión | G |

El pie muestra fotograma, archivo, dimensiones del lienzo y de la figura, milisegundos por fotograma, ciclo, anclas y tiempo de dibujo.

## Pruebas ejecutadas

`tools/qa/test_protagonist_anim_viewer.js`, Chromium 153 sin cabeza: **37 de 37 superadas** (`evidencia_idle/qa_visor_idle.json`).

**De animación (medidas con la reproducción en marcha):**

- Orden 1 → 2 → 3 → 4 → 1, en bucle.
- Duración por fotograma: 550–567 ms. Ciclo: 2,25 s.
- A 2×: 267–283 ms por fotograma.
- Pausa: el fotograma no cambia en 900 ms; reanuda con Espacio.
- 226 cuadros pintados por el renderizador real sin fallos.
- Tiempo medio de dibujo: 0,08 ms por cuadro.

**Estáticas (archivos o fotograma parado):**

- Cuatro PNG de 288×512, esquinas transparentes, figura sin tocar bordes.
- Misma línea de suelas y misma altura en los cuatro.
- El visor carga un único script: el renderizador real. No arranca el juego.
- Tamaño de juego: figura de 106 px. Reflejo: figura espejada.
- Ajuste correcto a 1280×720, 1366×768, 1920×1080 y 2560×1440.
- Sin errores de consola ni peticiones fallidas. Mensaje claro si falta un fotograma.
- El juego original arranca, no contiene entradas `pm_*` y sigue usando el sprite antiguo.

**Aparte:** las 48 pruebas del visor de dirección artística siguen pasando.

**Juicio visual, no automatizado:** la estabilidad de rostro, pelo, vestuario y tatuajes se ha valorado mirando los recortes ampliados y las medidas de `medidas_deriva.json`.

**No probado:** la muestra dentro de una partida (no está registrada), otros navegadores, pantallas táctiles, mando.

## Opciones para seguir

1. **Aceptar la deriva a tamaño de juego.** No se ve a la escala real; sí en ampliaciones.
2. **IDLE de un solo fotograma** con la respiración que ya hace el motor. Sin deriva posible y sin tocar código. Es lo que previó la especificación como salida si la muestra fallaba.
3. **Fijar los tatuajes a mano.** Copiar el brazo de un fotograma a los otros tres y dejar que solo respire el torso. Elimina el hervor; el brazo queda inmóvil.
4. **Repetir la generación** encadenando los cuatro fotogramas desde una sola base. Puede reducir la deriva, sin garantía.

La fidelidad de los tatuajes al diseño (sigilo y lobo) es un problema distinto y afecta a las cuatro opciones: a 462 px de figura, el brazo mide unos 40 px de ancho.
