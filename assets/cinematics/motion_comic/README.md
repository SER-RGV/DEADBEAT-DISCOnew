# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la introducción: viñetas, bocadillos, cajas de narrador, onomatopeyas y
transiciones de página. Dura **45,000 s** (96 pulsos a 128 por minuto).

Versión actual: **0.3.1-preview**. Cuenta la historia en el orden de la cronología de la biblia
narrativa (§38): la Primera Noche, el deseo del anfitrión, la Escucha, el nacimiento de la torre, las
pistas, la nota que no termina, la decisión de Tempo, la repetición, el Desafinado y su descenso en
plataforma hasta el Refugio.

- Qué cambió respecto a la 0.3.0, los textos con su origen, el arte nuevo, las pruebas y lo que está
  sin comprobar: [`INFORME_DIRECCION_NARRATIVA.md`](INFORME_DIRECCION_NARRATIVA.md), **Parte 3**.
- Arte nuevo y su origen: [`arte_nuevo/MANIFIESTO.md`](arte_nuevo/MANIFIESTO.md).
- Historia del pulido artístico anterior (0.2.x): [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

| Plano | Empieza | Dura | Contenido |
|---|---|---|---|
| 01 La Primera Noche | 0,000 s | 10 pulsos | La estación convertida en sala de baile; la guerra ha terminado |
| 02 El último deseo | 4,688 s | 7 pulsos | La fiesta se acaba; el anfitrión, de espaldas, pide que la noche no termine |
| 03 La Escucha | 7,969 s | 9 pulsos | Bajo el salón, algo recibe el deseo y lo devuelve igual |
| 04 El nacimiento de la torre | 12,188 s | 10 pulsos | Las puertas ya no dan al exterior; la misma sala se repite hacia abajo |
| 05 Los deseos se convierten en leyes | 16,875 s | 9 pulsos | Las nueve salas se deforman, una a una, hasta ser lugares distintos |
| 06 La nota que no termina | 21,094 s | 7 pulsos | El tocadiscos; la aguja salta y la nota vuelve a salir; Tempo lo nota |
| 07 La decisión de Tempo | 24,375 s | 9 pulsos | Ve felices a los invitados y enlaza otra canción |
| 08 La repetición | 28,594 s | 9 pulsos | La misma noche, el mismo paso; la torre lo iguala todo |
| 09 El Desafinado | 32,813 s | 10 pulsos | Un paso a destiempo, corregido; lo descartado se junta y toma forma |
| 10 El descenso al Refugio | 37,500 s | 16 pulsos | El suelo se abre; baja en la plataforma junto a otras pistas; llega al Refugio |

Es una **vista previa aislada**. No toca `src/`, ni el HUB, ni los HTML generados, ni los originales
de arte: las imágenes del juego se leen por ruta relativa. **Esta versión sí incluye ilustraciones
nuevas, generadas por IA y sin aprobar**: están separadas en `arte_nuevo/` y marcadas en pantalla.

## Cómo verla

```
node assets/cinematics/motion_comic/servir.mjs          # http://localhost:8045/
node assets/cinematics/motion_comic/servir.mjs 9000     # otro puerto
```

`servir.mjs` es un servidor de solo lectura de la raíz del repositorio (sin dependencias). Hace falta
porque el cómic carga módulos y JSON, y eso no funciona abriendo `index.html` con doble clic.

| Parámetro de la dirección | Efecto |
|---|---|
| `?t=12.5` | Abre en ese segundo |
| `?plano=7` | Abre al inicio de ese plano |
| `?sel=p07_voz_tempo` | Abre con esa pieza de texto seleccionada |
| `?pestana=guion` · `comprobar` · `ver` | Pestaña abierta del panel |
| `?limpio=1` | Solo la imagen, sin panel ni línea de tiempo |
| `?ligero=1` | Quita las tramas de puntos y el grano de papel (equipos sin aceleración gráfica) |
| `?sellos=0` | Oculta los sellos «PROPUESTA», «BORRADOR», «ARTE NUEVO · SIN APROBAR» y «ARTE PROVISIONAL» |
| `?borradores=0` | Oculta los textos en borrador (ahora no hay ninguno) |
| `?orden=1` · `?guias=1` | Números de orden de lectura · zona segura y tercios |

Teclado: espacio reproduce o pausa; flechas izquierda y derecha mueven un pulso (con Mayús, un
fotograma); `1`…`0` saltan al plano; Inicio vuelve al principio.

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
| Adaptado | Es el texto del encargo; guarda el pasaje de la biblia que adapta | 11 |
| **Nuevo propuesto** | No está en la biblia. Lleva el sello «PROPUESTA». No es canon | 3 |
| **BORRADOR** | Texto retocado en el editor y sin revisar | 0 |

Son 14 piezas. Las tres propuestas son la frase de Tempo del plano 07 («Los vi felices. Creí que unos
minutos más no podían hacer daño.») y la onomatopeya «TAC» de los planos 06 y 10. El protagonista no
habla y el plano 10 no tiene diálogo.

- Si en el editor se cambia un texto, deja de coincidir con la redacción fijada y pasa solo a
  BORRADOR.
- `banco_de_alternativas` guarda nueve frases literales de la biblia sin colocar, por si se prefiere
  sustituir un texto adaptado por uno literal.
- El validador comprueba que cada pasaje citado existe en el archivo de origen. **No puede comprobar
  que la adaptación sea fiel**: eso lo decide dirección.
- El validador da error si el guion usa «Solo una más», «Este no estaba en la mezcla», «No eres una
  visita», «Bienvenido al Refugio» o «nueve círculos»: son frases reservadas para otros momentos.

## Arte nuevo y sellos de arte

Hay dos sellos distintos, visibles solo en la vista previa:

| Sello | Significa | Planos |
|---|---|---|
| **ARTE NUEVO · SIN APROBAR** (azul) | El plano usa una ilustración creada para esta versión, que no es arte oficial | 01, 02, 03, 04, 05, 06, 07, 10 |
| **ARTE PROVISIONAL** (amarillo) | El plano usa un sustituto de un dibujo que falta | ninguno |

Lo nuevo: la estación de la Primera Noche, la silueta del anfitrión, cuatro siluetas de invitados, el
tocadiscos de Tempo y el corte del pozo de la torre. Todo está en `arte_nuevo/`, generado por IA en
esta versión, con su origen, tamaño real y estado en [`arte_nuevo/MANIFIESTO.md`](arte_nuevo/MANIFIESTO.md).
Ya no se usan como sustitutos ni `cine_circle_08_traicion.png` ni la silueta del NPC de la barra.

Dos avisos sobre ese arte:

- La estación se generó a 1376×768 y se amplió a 2560×1440. No es un dibujo nativo a ese tamaño.
- Ninguna de estas imágenes ha pasado por dirección de arte. Si se sustituyen por definitivas, basta
  cambiar la ruta del recurso y retirar el sello (pasos en el manifiesto).

El protagonista, Tempo, la plataforma, el Refugio, la pista y las nueve ilustraciones de las pistas
son arte oficial sin modificar.

## Qué comprueba cada herramienta

| Comprobación | Vista previa (pestaña Comprobaciones) | `validar_guion.mjs` |
|---|---|---|
| Duración 45 s y 10 planos | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Carga de lectura del plano (todo su texto, leído en orden, cabe antes del corte) | sí | sí |
| Estado de cada texto y coincidencia con la redacción fijada | sí | sí |
| El pasaje citado existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |
| Planos con arte nuevo o provisional | sí (los enumera) | sí (error si falta el sello) |
| Cada recurso existe en disco; el arte nuevo está en `arte_nuevo/` y en su manifiesto | no | sí |
| Frases reservadas | no | sí |

Resultado actual: 0 errores y 0 avisos; 20 de 20 citas encontradas; 25 recursos comprobados. El texto
más rápido se lee a 16,8 caracteres por segundo (cómodo hasta 17, máximo 21). La letra de lectura más
pequeña mide 30 px a 1080p (mínimo 26).

## Decisiones que conviene revisar

Están explicadas en el informe (apartados 3.3 y 3.6). En resumen:

- **Tres textos son propuesta**, no canon: la frase de Tempo y las dos onomatopeyas.
- **El descenso al Refugio** sigue el apartado 5.3 de la biblia, que la propia biblia marca como
  «PROPUESTA NARRATIVA». La cronología (§38, punto 13) dice que el Desafinado «despierta en el
  Refugio». La intro muestra el descenso, como pide el encargo.
- **Dónde está el Refugio.** El apartado 5.3 dice que al bajar se ven luces de otras pistas; el
  orden de descenso del apartado 5.1 pone el Refugio antes de la primera pista. No se ha inventado una
  explicación: la intro muestra lo que describe el 5.3.
- **El nombre.** La intro dice «TEMPO» y el HUB sigue diciendo «DJ VIRGILIO».
- **Duración.** El motor del juego (`src/dd_cinematic_camera.js`) da 35,0 s a la intro. Los 45 s son
  la línea de tiempo de este cómic; no se ha cambiado el motor.
- **Sonido.** El repositorio no tiene música ni efectos. La claqueta y los sonidos guía son
  sintetizados y solo sirven de referencia.

## Fluidez

**No se puede afirmar que la reproducción sea fluida.** Solo se ha medido en el entorno de pruebas,
que no tiene tarjeta gráfica (Chromium sin interfaz, 2 núcleos, 1920×1080).

- Con composición por software, la intro completa dibuja unos 1.900 fotogramas en 45 s (42 por
  segundo de media) y pierde 3,9 s en parones de entre 0,15 y 0,6 s, casi todos en los cambios de
  plano. En la misma prueba, la 0.3.0 dibujaba 55 fotogramas en los siete primeros segundos; la
  0.3.1 dibuja 310.
- Con el modo gráfico emulado del mismo entorno, los resultados son peores y cambian mucho de una
  pasada a otra: quedan parones de hasta 3 o 4 s. No es una medida fiable de un equipo real.
- Lo que se cambió: las tramas y el grano ya no usan modos de mezcla, las capas del revelado dejan de
  componerse cuando no se ven, el filtro del fondo ya no se recalcula en cada fotograma y el latido
  de luz es un velo que solo cambia de opacidad. El aspecto se comparó antes y después en capturas:
  la diferencia media es de menos de 3 niveles sobre 255.
- El plano 08 sigue siendo el más pesado (unos 25 fotogramas por segundo en este entorno).
- La reproducción sigue el reloj real: los 45 s duran 45 s y los textos entran en su pulso aunque se
  salten fotogramas.

Cifras y método en el apartado 3.9 del informe. **No se ha medido en un equipo con tarjeta gráfica,
ni en Firefox, Safari o móvil**; es lo primero que hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa e inspector |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos |
| `js/efectos.js` | Efectos narrativos: siluetas, ondas, puertas, niveles, mosaico de pistas, tocadiscos, montaje, compás, fragmentos, barrido y descenso |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Páginas, viñetas, cámara, recursos, personajes y efectos por plano |
| `arte_nuevo/` | Ilustraciones nuevas sin aprobar, su manifiesto y, en `generado/`, la salida original de la herramienta |
| `fuentes/biblia_extractos.md` | Extractos literales de la biblia, para comprobar las citas |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/` | Capturas a 1920×1080 de la 0.3.1: 25 fotogramas, 3 del inspector, la hoja de contacto y las secuencias del nacimiento y del descenso |
| `INFORME_DIRECCION_NARRATIVA.md` | Análisis y resultado de la 0.3.0 (partes 1 y 2) y de la 0.3.1 (parte 3) |
| `INFORME_PULIDO_FASE2.md` | Informe del pulido de la versión 0.2.x (historia anterior) |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- Aprobar o sustituir el arte nuevo, y decidir sobre las tres propuestas de texto.
- Resolver los puntos de coherencia con la biblia (apartado 3.6 del informe).
- Comprobar la fluidez en un equipo real y en Firefox, Safari y móvil.
- Enseñarla a alguien que no conozca el juego: no está comprobado que la historia se entienda.
- No hay exportación a vídeo ni sonido real.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir entre 35 y 45 s.
