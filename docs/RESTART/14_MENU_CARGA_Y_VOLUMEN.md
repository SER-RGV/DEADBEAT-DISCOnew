# RESTART 14 — Respuesta del menú, pantalla de carga y equilibrio de volumen

Fecha: 2026-11-13. Parte de `f034ba0`. No se ha reconstruido la intro ni rediseñado el menú.

## 1. Volumen de la intro y del menú

| | Antes (`f034ba0`) | Ahora |
|---|---|---|
| Intro (planos 01–07, media) | ≈ −26 dB | ≈ −21,6 dB (entre −20,0 y −22,5 según el plano) |
| Música del menú | −13,7 dB | −20,7 dB |
| Diferencia | ≈ 12 dB | ≈ 1 dB |
| Descenso | −33,3 dB | −28,7 dB |
| Refugio | silencio | silencio |

- `src/dd_opening.js`: nivel maestro `0,5 → 0,7` y limitador a la salida.
- `tools/build_active_html.py` (paso 1b): la música del menú la toca el motor de la portada antigua; su factor fijo pasa de `0,9` a `0,4`. Se aplica en el build; el HTML original de `backups/` no se toca.
- Los controles de volumen del jugador significan lo mismo que antes.
- Medición: `evidencia_intro_comic/medicion_audio.json`. Pico registrado 0,979, ninguna muestra saturada.

**ESTADO DEL AUDIO: MEDIDO, NO ESCUCHADO.** El entorno de trabajo no tiene altavoz. La igualdad es de nivel medio medido; la sensación de volumen al oído puede diferir y la tiene que confirmar una persona. El pico de 0,979 queda cerca del máximo: si al oírlo algún golpe suena áspero, hay que bajar el nivel maestro.

## 2. Menú: qué fallaba y qué se ha corregido

| Fallo encontrado | Corrección |
|---|---|
| Al abrir OPCIONES por segunda vez, la mezcla del juego (maestro, música, efectos, voz, gráficos, destellos, sacudida) desaparecía hasta recargar la página | El panel del motor vuelve a su sitio al cerrar el submenú |
| ESC no cerraba OPCIONES con el foco en un selector | ESC vuelve siempre |
| ENTER no marcaba las casillas | ENTER y ESPACIO marcan y desmarcan |
| Los selectores abrían la lista del navegador (no manejable con mando) | ← → y ENTER cambian de opción en el sitio |
| Los deslizadores se movían de 1 en 1 | De 5 en 5; mantener la tecla arrastra |
| En SALIR y BORRAR DATOS, ← → no pasaban de un botón a otro | Pasan |
| CRÉDITOS no recibía el foco | El foco entra en VOLVER |
| TAB sacaba el foco del menú; un clic en el fondo lo perdía | TAB recorre las opciones; el clic en vacío no quita el foco |
| El control enfocado no siempre se distinguía | Contorno visible en todos |
| En ventanas bajas el control elegido podía quedar fuera de la vista | Se desplaza hasta él |
| «◀» y «↑↓» salían como cuadros vacíos | Sustituidos por texto |

Los controles repetidos de OPCIONES (calidad gráfica aparece en las dos columnas) se mantienen: funcionan los dos y quitarlos sería rediseñar el panel.

### 2 bis. Corrección posterior (aviso del usuario): los volúmenes de OPCIONES no se oían

El usuario avisó de que los controles de OPCIONES no subían ni bajaban el volumen. Era cierto, y la prueba anterior no lo detectaba porque comprobaba el número del deslizador y no el sonido.

| Control | Qué pasaba | Ahora |
|---|---|---|
| VOLUMEN DEL MENÚ | Guardaba el valor, pero el motor de la música lo ignoraba hasta recargar (`setVol` no aceptaba argumento) | Cambia al instante |
| MAESTRO | Sólo actuaba sobre el motor de la partida, callado en el menú | Manda sobre música del menú, sonidos de interfaz, intro y descenso |
| MÚSICA | Igual | Manda también sobre la música del menú |
| EFECTOS | Igual | Manda también sobre los sonidos de interfaz; al soltar el deslizador suena un toque al nuevo nivel |
| VOZ DJ | Sólo suena en partida | Sin cambios; el panel lo dice |

Con la mezcla por defecto el nivel calibrado no cambia. La prueba mide ahora la **salida real de audio** al arrastrar cada deslizador con el ratón (100 % → 25 % → 0 % → 90 %) y con el teclado.

## 3. Pantalla de carga

- Quedan el logotipo y la barra de progreso sobre fondo liso. Se han retirado de la vista el rótulo superior, la versión, el porcentaje, la lista de diez pasos, el pie y la imagen de fondo.
- «PULSA CUALQUIER TECLA PARA EMPEZAR» aparece sólo cuando el navegador exige una pulsación para poder sonar.
- Si el arranque falla, vuelven la lista de pasos, el motivo y los botones REINTENTAR / MODO SEGURO.

## 4. Portada antigua

Causa: la portada antigua se ocultaba con una clase que un script añadía tarde, así que se veía mientras tanto. Ahora la oculta la hoja de estilos sin condición, y la carga ya no usa esa imagen de fondo.

Comprobación: vídeo del arranque revisado fotograma a fotograma (25 fps), sin límite de red y a 12 Mbps. En ninguno aparece la portada: `evidencia_intro_comic/menu_y_carga/arranque_fotograma_a_fotograma*.jpg`.

## 5. Pruebas ejecutadas sobre el build final

| Prueba | Resultado |
|---|---|
| `tools/qa/test_menu_respuesta.js` (nueva) | 53 de 53, dos ejecuciones (incluye 5 comprobaciones de salida real de audio) |
| `tools/qa/test_restart_flow.js` | 65 de 65 |
| `tools/qa/test_persistencia.js` | 39 de 39 |
| OPCIONES a 1920×1080 y 2560×1440 | los 12 controles alcanzables con teclado; capturas en la carpeta de evidencias |

## 6. Limitaciones

- Sonido no escuchado.
- Mando: probado sólo con un mando simulado por programa.
- Sólo Chromium; Firefox y Safari sin probar.
- A 2560×1440 el panel de OPCIONES funciona pero se ve pequeño (no escala con la pantalla). Ya era así; no se ha cambiado.
- La comprobación de la portada es en Chromium con render por software; no se ha visto en el equipo del usuario.

## 7. Archivos

`src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, `src/dd_boot.js`, `src/dd_opening.js`, `tools/build_active_html.py`, `tools/qa/test_menu_respuesta.js` (nuevo), `index.html` y `DEADBEAT_DISCO.html` (regenerados), evidencias en `docs/RESTART/evidencia_intro_comic/`.
