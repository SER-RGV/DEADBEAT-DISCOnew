# 13 · Cierre de intro, protagonista en el Refugio y persistencia

Fecha: 2026-11-13. Parte del commit `572a704`. No se ha reconstruido la intro ni el menú.

## A. Cartelas

Tres textos cambiados (dos indicados por dirección y uno por correspondencia literal con
la biblia: «canción» → «nota»). Detalle y un punto pendiente de decisión en
`10_INTRO_COMIC_NARRACION.md`, revisión 3.

## B. IDLE 07B en el Refugio

- `src/dd_hub_system.js` dibuja `assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png`
  en lugar de la figura anterior. El PNG y la lámina maestra no se han tocado.
- Sin sombrero. Mismo tamaño que la figura anterior (112 unidades de alto de cuerpo) y
  mismos pies; se ordena en profundidad con el mobiliario como antes.
- Siempre el PNG completo, a escala uniforme (288:512). Sin espejar: espejarlo cambiaría
  de brazo los tatuajes.
- No se ha tocado el motor, el registro de recursos ni los sprites de combate. Si el PNG
  no carga, el Refugio vuelve a pintar la figura anterior.

**Consecuencias que conviene saber:**
1. Es un único fotograma de perfil. Al andar se desplaza con un pequeño rebote, **sin
   animación de paso y sin girarse** hacia donde camina. Arreglarlo exige sprites nuevos,
   no autorizados en esta fase.
2. Al salir del Refugio a una incursión, el motor vuelve a los sprites de combate
   anteriores (con su diseño antiguo). Es lo pedido, pero el cambio de aspecto se nota.
3. El retrato del HUD (arriba a la izquierda) sigue siendo el antiguo: pertenece al motor.

Capturas: `evidencia_intro_comic/refugio_idle07b_*.jpg|png` (llegada, detalle, andando,
borde superior, 1920×1080, 2560×1440, entrada por CONTINUAR).

## C. Persistencia

### Auditoría (todo en `localStorage`; no hay otro almacenamiento)

| Grupo | Claves | Quién las escribe |
|---|---|---|
| **Run** | `dd_save_v1` (ficha: creación, última visita, visitas), `dmo_floor_v32` (planta generada de la última incursión) | interfaz / motor |
| **Permanente** | `dmodisco_currency_v1`, `dmodisco_upgrades_v1`, `dmodisco_weapon_prestige_v1`, `dmodisco_ach_v1`, `dmodisco_best_v5`, `dmodisco_best_round_v1`, `dmodisco_best_combo_v216`, `dmodisco_hist_v3`, `dmo_victories_v214`, `dmo_secret_route_v32` | motor |
| **Ajustes** | `dmodisco_vol_v1`, `dmodisco_muted_v1`, `ddc_cover_settings_v1`, `dmodisco_a11y_v1`, `dmo_roll_v271` | motor / interfaz |

El motor **no guarda incursiones a medias**: `dmo_floor_v32` se escribe pero ninguna parte
del código la vuelve a leer para reanudar. Antes de esta fase NUEVA PARTIDA ya no borraba
el progreso permanente; faltaba reiniciar el estado de run y no existía forma de borrar.

### Reglas implantadas (`src/dd_ui_system.js`, tabla `STORAGE`)

| Acción | Qué hace |
|---|---|
| NUEVA PARTIDA | Ficha nueva (creación de hoy, visitas a 1; el formato sigue siendo `v: 1`, con un campo opcional `runs` que cuenta las partidas empezadas). Elimina `dmo_floor_v32`. No toca nada permanente ni los ajustes. Sin confirmaciones. |
| CONTINUAR | Entra al Refugio sin descenso. Conserva la ficha (suma una visita), el estado de run y todo lo permanente. |
| BORRAR DATOS | OPCIONES → DATOS GUARDADOS → BORRAR DATOS…: pantalla propia que lista los 12 conceptos que se eliminan con su valor actual y los ajustes que se conservan. El foco entra en CANCELAR. Sólo «SÍ, BORRAR TODO» borra; después el juego se recarga para que el motor no reescriba lo que tenía en memoria. |

**Límite real:** como el motor no guarda incursiones a medias, CONTINUAR recupera la
partida en el Refugio con su progreso, no una incursión interrumpida.

### Pruebas

`tools/qa/test_persistencia.js`: **39 de 39** (`evidencia_intro_comic/qa_persistencia.json`).
Usa un perfil de navegador desechable con datos sembrados por la propia prueba; no toca
datos de nadie. Comprueba, clave por clave, que NUEVA PARTIDA deja idénticas las 10 claves
permanentes y los ajustes, que la única clave que desaparece es `dmo_floor_v32`, que
CONTINUAR no cambia nada, y que BORRAR DATOS no borra al abrirse, ni con CANCELAR, ni con
ESC, y sí al confirmar (comprobado también tras recargar).

## D. Plano 03

Sin cambios. Nueve posiciones; las plantas 5, 6 y 7 son variaciones de otras tres (ver
documento 12). No se han generado recursos.

## E. Plano 06 — caída

Sin sprites nuevos y sin deformar el dibujo. El conjunto plataforma + personaje (IDLE 07B):
se balancea como un péndulo (giro máximo ≈ 3°), da tirones periódicos de cadena en los que
los pies se despegan un instante, y la cámara se acerca un 3–5 %. Añadidos: estela de
copias enteras por encima del cuerpo, trazos de viento a los lados, polvo y esquirlas que
suben, líneas de velocidad radiales y un desplazamiento de la torre que acelera. Lo mismo
se aplica al descenso de NUEVA PARTIDA. Con «movimiento reducido» todo esto se desactiva.
Secuencia: `evidencia_intro_comic/plano_06_caida_secuencia.jpg`.

El cuerpo sigue en pose de pie: no hay animación corporal de caída.

## F. Sonido — **NO ESCUCHADO. NO VALIDADO.**

Este entorno no tiene salida de audio y nadie ha oído el resultado. No se declara
aprobada la sincronización ni la calidad del sonido.

Lo que sí se ha hecho es **grabar la señal** que el juego envía a la salida, en tiempo
real, durante el flujo completo (`tools/qa/capture_audio_flow.js`), para que pueda
escucharse:

- `evidencia_intro_comic/reproduccion_tiempo_real_con_sonido.mp4` — pantalla y sonido del
  juego, carga → intro → título → menú → NUEVA PARTIDA → descenso → Refugio.
- `evidencia_intro_comic/audio_flujo_completo.mp3` — sólo el sonido.

Aviso sobre el vídeo: imagen y sonido se grabaron por separado y se unieron después,
ajustando el desfase con cuatro cortes de la intro. El error de ese montaje es de unos
±0,05 s, así que **el vídeo sirve para oír el conjunto, no para juzgar la sincronía fina**;
esa debe juzgarse en el juego.

### Medición instrumental (no sustituye a la escucha)

`evidencia_intro_comic/medicion_audio.json`. Desfase entre el instante previsto en el
reloj de la imagen y la subida de señal medida:

| Suceso (s) | Desfase |
|---|---|
| puerta 3,98 | +44 ms |
| viñeta 4,5 | +4 ms |
| viñeta 5,0 | +4 ms |
| viñeta 5,5 | +4 ms |
| cartela 6,9 | +114 ms |
| golpe 14,0 | -6 ms |
| viñeta 15,0 | -6 ms |
| viñeta 16,0 | -6 ms |
| bucle 17,0 | -16 ms |
| bucle 17,5 | -16 ms |
| paso tardío 20,25 | -16 ms |
| lámina 20,75 | -26 ms |
| suelo 24,0 | -26 ms |
| página 25,5 | -16 ms |
| picado 27,5 | -26 ms |
| sombrero 28,62 | +4 ms |
| título 29,0 | -6 ms |

(El valor de «cartela 6,9» lo da el detector al engancharse al golpe de compás vecino.)

| Tramo | Nivel medio |
|---|---|
| plano 01 | -26.7 dB |
| plano 02 | -26.5 dB |
| plano 03 | -27.1 dB |
| plano 04 | -25.3 dB |
| plano 05 hasta el paso | -26.2 dB |
| silencio tras el paso (20,30–20,70) | -49.7 dB |
| plano 05 resto | -29.7 dB |
| plano 06 | -24.8 dB |
| plano 07 (solo intro) | -26.8 dB |

- Intro: 32.02 s. Tras el paso tardío la música se corta de verdad. Sin muestras saturadas.
- La señal de la intro queda a cero al terminar; la del descenso, a cero al llegar al Refugio.
- La música del menú empieza en el segundo 28.99 de la intro (con el título) y se apaga 1.06 s después de pulsar NUEVA PARTIDA. No queda música duplicada ni persistente.
- Descenso: 4.7 s; golpe más fuerte a los 3.89 s (previsto 3,85).

**Dos hallazgos que alguien debe oír y decidir:**
1. **Salto de volumen en el título.** La música del menú suena a ≈ -13.7 dB de media; la intro, a ≈ −26 dB. Son unos 13 dB de diferencia: la intro probablemente suene floja y el menú entre de golpe. No lo he corregido a ciegas.
2. **El Refugio está en silencio.** En los 8 s grabados tras la llegada no hay ninguna señal: ni música ni ambiente.

### Lista para la escucha (rellenar por quien escuche)

| Punto | Resultado |
|---|---|
| Inicio y final de la música | pendiente |
| Golpes de cada viñeta | pendiente |
| Cartelas | pendiente |
| Onomatopeyas | pendiente |
| Transiciones | pendiente |
| Corte al título | pendiente |
| Menú | pendiente |
| Descenso de NUEVA PARTIDA | pendiente |
| Entrada al Refugio | pendiente |
| Música duplicada o persistente | pendiente (la medición no detecta ninguna) |

## G. QA

| Prueba | Resultado |
|---|---|
| `tools/qa/test_restart_flow.js` (flujo completo, 7 resoluciones) | Tres ejecuciones en esta fase: **una se interrumpió** por tiempo de espera al volver al menú tras recargar y saltar la intro; las dos siguientes dieron 65 de 65 (la última, sobre el build final). El fallo no se ha reproducido y no se ha encontrado su causa. |
| `tools/qa/test_persistencia.js` | 39 de 39 en tres ejecuciones (la última, sobre el build final) |
| Revisión a ojo | Refugio a 1280×720 y 1920×1080, pantalla de borrado, opciones, caída del plano 06, cartelas nuevas |

No probado: escucha real; mando físico; Firefox y Safari; hardware real; el Refugio a
2560×1440 sólo por prueba automática (captura guardada, no revisada a ojo).

## Archivos

**Modificados:** `src/dd_opening.js`, `src/dd_hub_system.js`, `src/dd_ui_system.js`,
`src/dd_rebuild_ui.css`, `index.html` y `DEADBEAT_DISCO.html` (regenerados),
`docs/RESTART/10`, `11`, `12`, `storyboard_intro/storyboard_v2_motor.jpg`,
`CURRENT_STATE.md`, `CHANGELOG.md`.

**Nuevos:** `tools/qa/test_persistencia.js`, `tools/qa/capture_audio_flow.js`,
`tools/qa/mux_audio_video.py`, este documento, y en `evidencia_intro_comic/` las capturas
del Refugio, de la persistencia, el vídeo con sonido, el audio y las mediciones.

**Retirado:** `evidencia_intro_comic/reproduccion_completa_sin_sonido.mp4` (mostraba las
cartelas antiguas; lo sustituye el vídeo en tiempo real).

**Sin tocar:** motor, `dd_asset_registry.js`, `dd_world_renderer.js`, `dd_boot.js`,
`dd_cinematic_camera.js`, lámina maestra, PNG del IDLE 07B, sprites `player_*`, láminas
de la intro.
