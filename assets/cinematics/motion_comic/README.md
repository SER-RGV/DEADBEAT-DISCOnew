# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la introducción: viñetas, bocadillos, cajas de narrador, onomatopeyas y
transiciones de página.

Versión actual: **0.5.0-preview · «La ciudad que no termina»**. Dura **48,750 s** (104 pulsos a 128
por minuto): **dieciséis planos en seis bloques**.

Es una reconstrucción completa. La historia ya no ocurre solo dentro del salón: empieza en una ciudad,
entra en la estación donde se celebra la fiesta, cuenta el deseo y la respuesta, y después retrocede
con el cambio, del salón a la fachada, a la calle y a la ciudad entera, hasta que la ciudad resulta
ser un solo nivel de la torre. Termina mirando hacia abajo por el interior de la torre.
**No aparecen el protagonista, el Refugio ni el HUB.**

- Diagnóstico de la 0.4.0, concepto, recursos, guion gráfico, tiempos, pruebas y lo que está sin
  comprobar: [`INFORME_DIRECCION_NARRATIVA.md`](INFORME_DIRECCION_NARRATIVA.md), **Parte 5**.
- Versiones anteriores: partes 1 y 2 (0.3.0), parte 3 (0.3.1) y parte 4 (0.4.0) del mismo informe.
  La 0.4.0 y la 0.3.1 se pueden reproducir (ver «Versiones anteriores»).
- Arte nuevo y su origen: [`arte_nuevo/MANIFIESTO.md`](arte_nuevo/MANIFIESTO.md).
- Historia del pulido artístico anterior (0.2.x): [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

| Bloque | Plano | Empieza | Dura | Encuadre | Contenido | Clasificación |
|---|---|---|---|---|---|---|
| 1 | 01 La ciudad | 0,000 s | 8 pulsos | Gran plano general | Una ciudad industrial de noche; la estación es el único edificio encendido | Propuesta visual |
| 1 | 02 La estación | 3,750 s | 5 | General frontal | La fachada; tras los cristales, gente bailando | Propuesta visual |
| 2 | 03 La Primera Noche | 6,094 s | 8 | General del interior | La estación convertida en salón; se celebra el final de una guerra | Canon |
| 2 | 04 Los que sobrevivieron | 9,844 s | 5 | Plano medio de grupo | La fiesta de cerca, a contraluz | Diseño definido |
| 3 | 05 El deseo | 12,188 s | 5 | Medio, de espaldas | El anfitrión pide que la noche no termine | Canon |
| 3 | 06 La Escucha | 14,531 s | 9 | General, en vertical | Bajo el salón, algo recibe el deseo y lo devuelve igual | Canon |
| 3 | 07 La nota que no termina | 18,750 s | 4 | Detalle | La aguja salta; Tempo lo nota | Canon |
| 3 | 08 Unos minutos más | 20,625 s | 7 | Medio con recuadros | Tempo enlaza otro disco; la sala se enciende otra vez | Canon |
| 4 | 09 El salón cambia | 23,906 s | 7 | El encuadre del 03 | Un aro de luz sale de la música; dentro, la estación ya es una pista | Propuesta visual |
| 4 | 10 Las puertas | 27,188 s | 5 | El encuadre del 02 | El aro sale por la puerta y rehace la fachada | Propuesta visual |
| 4 | 11 La calle | 29,531 s | 6 | Conjunto | La estación es una torre; el aro alcanza las primeras casas | Propuesta visual |
| 5 | 12 Los barrios | 32,344 s | 8 | El encuadre del 01 | El aro crece a golpes hasta cubrir la ciudad | Propuesta visual |
| 5 | 13 La ciudad devorada | 36,094 s | 7 | Gran plano general que se abre | A los lados y debajo, la misma ciudad repetida: es un solo nivel | Propuesta visual |
| 6 | 14 Hacia el centro | 39,375 s | 4 | Frontal, avance rápido | La cámara atraviesa la puerta: un pasillo de arcos iguales | Diseño definido |
| 6 | 15 Los niveles | 41,250 s | 8 | Corte vertical | El pozo: salas iguales, cada una con una luz distinta | Canon |
| 6 | 16 El corazón de la torre | 45,000 s | 8 | Picado total | Anillos de niveles hasta un punto negro; corte a negro | Propuesta visual |

**Propuesta visual** quiere decir que la biblia no lo respalda. La biblia dice que el salón era una
antigua estación de tren; **no menciona ninguna ciudad**. Todo lo que se ve de la ciudad y de cómo
la alcanza el cambio es una interpretación cinematográfica del encargo, no canon (informe, 5.8). En la
vista previa, la clasificación de cada plano se lee junto a su nombre.

Es una **vista previa aislada**. No toca `src/`, ni el HUB, ni los HTML generados, ni los originales
de arte: las imágenes del juego se leen por ruta relativa. **Incluye ilustraciones nuevas, generadas
por IA y sin aprobar**: están separadas en `arte_nuevo/` y marcadas en pantalla.

## Cómo verla

```
node assets/cinematics/motion_comic/servir.mjs          # http://localhost:8045/
node assets/cinematics/motion_comic/servir.mjs 9000     # otro puerto
```

`servir.mjs` es un servidor de solo lectura de la raíz del repositorio (sin dependencias). Hace falta
porque el cómic carga módulos y JSON, y eso no funciona abriendo `index.html` con doble clic.

| Parámetro de la dirección | Efecto |
|---|---|
| `?version=0.4.0` · `0.3.1` | Reproduce una versión anterior |
| `?t=12.5` | Abre en ese segundo |
| `?plano=7` | Abre al inicio de ese plano |
| `?sel=p08_narrador_tempo` | Abre con esa pieza de texto seleccionada |
| `?pestana=guion` · `comprobar` · `ver` | Pestaña abierta del panel |
| `?limpio=1` | Solo la imagen, sin panel ni línea de tiempo |
| `?ligero=1` | Quita las tramas de puntos y el grano de papel (equipos sin aceleración gráfica) |
| `?sellos=0` | Oculta los sellos «PROPUESTA», «BORRADOR», «ARTE NUEVO · SIN APROBAR» y «ARTE PROVISIONAL» |
| `?borradores=0` | Oculta los textos en borrador (ahora no hay ninguno) |
| `?orden=1` · `?guias=1` | Números de orden de lectura · zona segura y tercios |

Teclado: espacio reproduce o pausa; flechas izquierda y derecha mueven un pulso (con Mayús, un
fotograma); `1`…`0` saltan a los planos 1 a 10 y, con Mayús o Alt, a los planos 11 a 16; Inicio vuelve
al principio.

## Versiones anteriores

La cabecera de la vista previa tiene un selector de versión. Las anteriores se cargan desde
`data/versiones/<número>/` y se reproducen con el motor actual.

| Versión | Datos | Commit | Duración |
|---|---|---|---|
| 0.5.0 (vigente) | `data/` y copia en `data/versiones/0.5.0/` | el de esta entrega | 48,750 s · 16 planos |
| 0.4.0 | `data/versiones/0.4.0/` | `6dd62ae` | 45,000 s · 15 planos |
| 0.3.1 | `data/versiones/0.3.1/` | `0dd82f2` | 45,000 s · 10 planos |

Los datos de la 0.4.0 y de la 0.3.1 son copias exactas de los de su commit. Para validar una:
`node assets/cinematics/motion_comic/validar_guion.mjs --version 0.4.0`.

## Cómo corregir un texto

1. Pestaña **Guion**: pulsa una pieza. Se abre su editor (texto, estado, entrada y salida en pulsos,
   posición). También se puede arrastrar sobre la imagen con la reproducción en pausa.
2. Los cambios viven en la memoria del navegador. Para guardarlos, pulsa **Descargar guion.json** y
   sustituye `data/guion.json` por el archivo descargado.
3. Comprueba el resultado: `node assets/cinematics/motion_comic/validar_guion.mjs`
   (acepta `--json` y la ruta de otro guion, por ejemplo el recién descargado).

Cada texto es una pieza suelta de `data/guion.json → intervenciones`. Los tiempos van en pulsos desde
el inicio de su plano (1 pulso = 0,469 s). El énfasis se escribe `*así*`.

## De dónde sale cada texto

La fuente es la biblia narrativa del proyecto. No está en el repositorio, así que los apartados que
respaldan la intro están copiados, letra por letra, en
[`fuentes/biblia_extractos.md`](fuentes/biblia_extractos.md). Cada texto lleva un estado visible:

| Estado | Significado | Piezas |
|---|---|---|
| Literal | Coincide letra por letra con un pasaje de la biblia | 0 |
| Adaptado | Acorta un pasaje de la biblia y guarda el pasaje que adapta | 8 |
| **Nuevo propuesto** | No está en la biblia. Lleva el sello «PROPUESTA». No es canon | 1 |
| **BORRADOR** | Texto retocado en el editor y sin revisar | 0 |

Son 9 piezas (la 0.4.0 tenía 12). La propuesta es la onomatopeya «TAC» del plano 07.

Tres de las adaptaciones son **redacciones nuevas de esta versión, pendientes de visto bueno**:
«Por una noche, pudieron reunirse sin miedo.», «Y siguió creciendo hacia abajo.» y «Cada deseo se
hizo ley.». Las otras cinco ya estaban en la 0.4.0. Ningún texto habla de la ciudad, y los planos 02,
04, 09 a 14 y 16 no llevan texto: del segundo 23,9 al 41,3 la historia se cuenta solo con imagen.

- Si en el editor se cambia un texto, deja de coincidir con la redacción fijada y pasa solo a
  BORRADOR.
- `banco_de_alternativas` guarda frases literales de la biblia sin colocar, por si se prefiere
  sustituir un texto adaptado por uno literal.
- El validador comprueba que cada pasaje citado existe en el archivo de origen. **No puede comprobar
  que la adaptación sea fiel**: eso lo decide dirección.
- El validador da error si el guion usa «Solo una más», «Este no estaba en la mezcla», «No eres una
  visita», «Bienvenido al Refugio» o «nueve círculos»: son frases reservadas para otros momentos.

## Arte nuevo y sellos de arte

Hay dos sellos distintos, visibles solo en la vista previa:

| Sello | Significa | Planos |
|---|---|---|
| **ARTE NUEVO · SIN APROBAR** (azul) | El plano usa una ilustración creada para esta introducción, que no es arte oficial | 01 a 12, 15 y 16 |
| **ARTE PROVISIONAL** (amarillo) | El plano usa un sustituto de un dibujo que falta | ninguno |

Nuevo en la 0.5.0, con autorización de dirección para generar exactamente tres imágenes:

| Archivo | Qué es | Planos |
|---|---|---|
| `arte_nuevo/ciudad_antes_de_la_noche.png` | La ciudad antes del cambio, con la estación encendida | 01, 11, 12 |
| `arte_nuevo/estacion_fachada.png` | La entrada de la estación desde la calle | 02, 10 |
| `arte_nuevo/corazon_torre.png` | La torre por dentro, mirando hacia abajo | 16 |

De la 0.3.1 se siguen usando la estación de la Primera Noche, la silueta del anfitrión, cuatro
siluetas de invitados, el tocadiscos y el corte del pozo. Todo está en `arte_nuevo/`, con su origen,
tamaño real y estado en [`arte_nuevo/MANIFIESTO.md`](arte_nuevo/MANIFIESTO.md).

Avisos sobre ese arte:

- **Ninguna de estas imágenes ha pasado por dirección de arte.** La autorización fue para generarlas
  y probarlas, no una aprobación.
- Las ilustraciones grandes se generaron a 1376×768 y se ampliaron a 2560×1440. No son dibujos
  nativos a ese tamaño.
- Los carteles de la fachada llevan letras ilegibles; la ciudad de antes no coincide edificio por
  edificio con la oficial; el corazón de la torre es de línea limpia, no de píxel marcado.
- Si se sustituyen por definitivas, basta cambiar la ruta del recurso y retirar el sello (pasos en el
  manifiesto).

Arte oficial, sin modificar: los fondos `cine_bg01_city`, `cine_bg02_club_exterior`,
`cine_bg03_entrance` y `cine_bg05_dancefloor`, y el retrato de Tempo. Los planos 13 y 14 están hechos
solo con arte oficial.

## Qué comprueba cada herramienta

| Comprobación | Vista previa (pestaña Comprobaciones) | `validar_guion.mjs` |
|---|---|---|
| Duración y número de planos (los que declara el guion en `tempo`: 48,750 s y 16) | sí | sí |
| Cada plano tiene clasificación y ficha (encuadre, movimiento, acción, función) | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Carga de lectura del plano (todo su texto, leído en orden, cabe antes del corte) | sí | sí |
| Estado de cada texto y coincidencia con la redacción fijada | sí | sí |
| El pasaje citado existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |
| Planos con arte nuevo o provisional | sí (los enumera) | sí (error si falta el sello) |
| Cada recurso existe en disco; el arte nuevo está en `arte_nuevo/` y en su manifiesto | no | sí |
| Frases reservadas | no | sí |

Resultado actual: 0 errores y 0 avisos; 15 de 15 citas encontradas; 16 recursos comprobados, 11 de
ellos nuevos sin aprobar. El texto más rápido se lee a 16,8 caracteres por segundo (cómodo hasta 17,
máximo 21). La letra de lectura más pequeña mide 30 px a 1080p (mínimo 26).

## Decisiones que conviene revisar

Están explicadas en el informe (apartados 5.7, 5.8 y 5.11). En resumen:

- **La ciudad no está en la biblia.** Aceptar esta introducción es aceptar que hubo una ciudad y que
  la torre la absorbió. Es una decisión narrativa.
- **Todo el arte nuevo está sin aprobar**, y catorce de los dieciséis planos dependen de él.
- **Tres textos son redacciones nuevas** y una onomatopeya es propuesta.
- **El nombre de Tempo no sale en pantalla.** Pendiente desde la 0.4.0. El HUB sigue diciendo
  «DJ VIRGILIO».
- **El retrato de Tempo** (planos 07 y 08) es el oficial del juego, con su aspecto dentro de la torre.
  En la Primera Noche es un anacronismo; no existe un dibujo suyo de época.
- **Duración.** El motor del juego (`src/dd_cinematic_camera.js`) da 35,0 s a la intro. Los 48,750 s
  son la línea de tiempo de este cómic; no se ha cambiado el motor.
- **Sonido.** El repositorio no tiene música ni efectos, y esta versión no añade audio. La claqueta y
  los sonidos guía son sintetizados y solo sirven de referencia.

## Fluidez

**No se puede afirmar que la reproducción sea fluida.** Solo se ha medido en el entorno de pruebas,
que no tiene tarjeta gráfica (Chromium sin interfaz, 2 núcleos, 1920×1080).

- La secuencia llega al final a tiempo: 48,750 s en 48,91 s de reloj, 2.229 fotogramas, sin errores.
- En dos pasadas de medida, perdió 2,6 s en 10 parones y 3,7 s en 16. El peor, de unos 0,6 s, al
  entrar el plano 03; los demás, de 0,16 a 0,36 s, casi todos en cambios de plano.
- Esas cifras varían mucho entre pasadas iguales. No son una medida de un equipo real.
- La reproducción sigue el reloj real: los textos entran en su pulso aunque se salten fotogramas.

Cifras y método en el apartado 5.10 del informe. **No se ha medido en un equipo con tarjeta gráfica,
ni en Firefox, Safari o móvil**; es lo primero que hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa, inspector y selector de versión |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos |
| `js/efectos.js` | Efectos narrativos. Nuevos en la 0.5.0: `transforma` (una imagen sustituye a otra dentro de un aro que crece) y `repite` (una ilustración repetida en niveles) |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Bloques, páginas, viñetas, cámara, recursos, efectos y ficha de cada plano |
| `data/versiones/` | `indice.json` y los datos de la 0.5.0, la 0.4.0 y la 0.3.1 |
| `arte_nuevo/` | Ilustraciones nuevas sin aprobar, su manifiesto y, en `generado/`, la salida original de la herramienta |
| `fuentes/biblia_extractos.md` | Extractos literales de la biblia, para comprobar las citas |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/0.5.0/` | Capturas a 1920×1080 de la 0.5.0: 47 fotogramas, 3 del inspector, 2 del selector de versión, 2 sin sellos, la hoja de contacto y cuatro hojas de secuencia y comparación |
| `evidence/0.4.0/`, `evidence/` (raíz) | Capturas de la 0.4.0 y de la 0.3.1, sin tocar |
| `INFORME_DIRECCION_NARRATIVA.md` | Análisis y resultado de la 0.3.0 (partes 1 y 2), la 0.3.1 (parte 3), la 0.4.0 (parte 4) y la 0.5.0 (parte 5) |
| `INFORME_PULIDO_FASE2.md` | Informe del pulido de la versión 0.2.x (historia anterior) |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- **Prueba de comprensión, sin hacer**: enseñarla, sin explicación, a alguien que no conozca el juego
  y hacerle las cinco preguntas del encargo. No está comprobado que la historia se entienda.
- Decidir si la ciudad entra en la biblia.
- Aprobar o sustituir el arte nuevo; dar el visto bueno a los tres textos nuevos y a la onomatopeya.
- Decidir si el nombre de Tempo sale en pantalla y con qué retrato.
- Comprobar la fluidez en un equipo real y en Firefox, Safari y móvil.
- No hay exportación a vídeo ni sonido real.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir la duración.
