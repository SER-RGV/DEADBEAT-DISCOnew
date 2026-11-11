# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la introducción: viñetas, bocadillos, cajas de narrador, onomatopeyas y
transiciones de página. Dura **45,000 s** (96 pulsos a 128 por minuto).

Versión actual: **0.4.0-preview**. Cuenta la misma historia que la 0.3.1, en el mismo orden (cronología
de la biblia narrativa, §38), pero montada de otra manera: **quince planos en seis bloques**, con el
protagonista como hilo. Primero se ve un paso de baile; luego, rastros azules de pasos a destiempo;
luego esos rastros toman cuerpo; y desde ahí la cámara lo sigue hasta el Refugio.

- Qué cambió respecto a la 0.3.1, por qué, los tiempos, las pruebas y lo que está sin comprobar:
  [`INFORME_DIRECCION_NARRATIVA.md`](INFORME_DIRECCION_NARRATIVA.md), **Parte 4**.
- Versiones anteriores: partes 1 y 2 (0.3.0) y parte 3 (0.3.1) del mismo informe.
- Arte nuevo y su origen: [`arte_nuevo/MANIFIESTO.md`](arte_nuevo/MANIFIESTO.md).
- Historia del pulido artístico anterior (0.2.x): [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

| Bloque | Plano | Empieza | Dura | Encuadre | Contenido |
|---|---|---|---|---|---|
| 1 | 01 La Primera Noche | 0,000 s | 8 pulsos | General | La estación convertida en sala de baile; la guerra ha terminado |
| 1 | 02 El paso | 3,750 s | 4 | Primer plano de pies | Las parejas, de cintura para abajo, todas a compás |
| 2 | 03 El último deseo | 5,625 s | 5 | Medio, de espaldas | El anfitrión pide que la noche no termine |
| 2 | 04 La Escucha | 7,969 s | 9 | General, en vertical | Bajo el salón, algo recibe el deseo y lo devuelve igual |
| 3 | 05 El nacimiento de la torre | 12,188 s | 7 | General, cámara que baja | Las puertas ya no dan al exterior; la sala se repite hacia abajo |
| 3 | 06 Los deseos se convierten en leyes | 15,469 s | 6 | Mosaico | Las nueve salas se deforman hasta ser lugares distintos |
| 4 | 07 La nota que no termina | 18,281 s | 5 | Detalle | La aguja salta y la nota vuelve a salir; Tempo lo nota |
| 4 | 08 La decisión de Tempo | 20,625 s | 9 | Medio con recuadros | Enlaza otra canción; un invitado pisa tarde y deja un rastro azul |
| 5 | 09 La repetición | 24,844 s | 6 | Montaje en tiras | La misma noche, el mismo paso; en cada vuelta, un rastro más |
| 5 | 10 El paso fuera de tiempo | 27,656 s | 5 | Corto, de cintura para abajo | Uno pisa tarde; la torre lo corrige; el descarte queda fuera |
| 5 | 11 El Desafinado | 30,000 s | 9 | General y recuadro de detalle | Los descartes se juntan y toman cuerpo; hombro y tatuaje |
| 6 | 12 La anomalía | 34,219 s | 5 | Desde el hombro | Él, de espaldas; el suelo se agrieta |
| 6 | 13 El mecanismo | 36,563 s | 4 | Subjetivo | El círculo se abre; aparece la plataforma |
| 6 | 14 El descenso | 38,438 s | 10 | General, acercamiento y recuadro | Baja en la plataforma, llega y sale de ella |
| 6 | 15 El Refugio | 43,125 s | 4 | Desde el hombro | Él, de espaldas, ante el Refugio; título |

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
| Adaptado | Es el texto del encargo; guarda el pasaje de la biblia que adapta | 10 |
| **Nuevo propuesto** | No está en la biblia. Lleva el sello «PROPUESTA». No es canon | 2 |
| **BORRADOR** | Texto retocado en el editor y sin revisar | 0 |

Son 12 piezas (la 0.3.1 tenía 14). Las dos propuestas son la onomatopeya «TAC» de los planos 07 y 12.
La frase de Tempo es ahora narración en tercera persona («Los vio felices. Pensó que unos minutos más
no podían hacer daño.») y adapta casi palabra por palabra el apartado 3.1 de la biblia. Se han retirado
«El salón dejó de tener salida.» y «La despedida nunca llegó.»: lo primero ya lo enseña la imagen y lo
segundo repetía el deseo. El protagonista no habla y los planos 13, 14 y 15 no llevan texto.

- Si en el editor se cambia un texto, deja de coincidir con la redacción fijada y pasa solo a
  BORRADOR.
- `banco_de_alternativas` guarda diez frases literales de la biblia sin colocar, por si se prefiere
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
| Duración 45 s y número de planos (el que declara `tempo.planos` en el guion: 15) | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Carga de lectura del plano (todo su texto, leído en orden, cabe antes del corte) | sí | sí |
| Estado de cada texto y coincidencia con la redacción fijada | sí | sí |
| El pasaje citado existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |
| Planos con arte nuevo o provisional | sí (los enumera) | sí (error si falta el sello) |
| Cada recurso existe en disco; el arte nuevo está en `arte_nuevo/` y en su manifiesto | no | sí |
| Frases reservadas | no | sí |

Resultado actual: 0 errores y 0 avisos; 20 de 20 citas encontradas; 26 recursos comprobados. El texto
más rápido se lee a 16,8 caracteres por segundo (cómodo hasta 17, máximo 21). La letra de lectura más
pequeña mide 30 px a 1080p (mínimo 26).

## Decisiones que conviene revisar

Están explicadas en el informe (apartados 3.3, 3.6 y 4.13). En resumen:

- **Dos textos son propuesta**, no canon: las dos onomatopeyas.
- **El nombre de Tempo ya no sale en pantalla.** Su frase es narración y no lleva rótulo. Está por
  decidir si debe aparecer.
- **Entre los planos 13 y 14 hay una elipsis**: no se ve cómo queda sobre la plataforma. No hay
  ningún dibujo que lo permita sin inventarlo.
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

- Con composición por software, la 0.4.0 dibuja 1.863 fotogramas en 45 s (41 por segundo de media)
  y pierde 2,5 s en parones de entre 0,15 y 0,4 s, casi todos en los cambios de plano. La 0.3.1 daba
  unos 1.900 fotogramas y 3,9 s perdidos. Entre dos pasadas iguales estas cifras varían entre un 10 y
  un 30 %, así que **la diferencia no demuestra una mejora**: solo que no ha empeorado.
- Con el modo gráfico emulado del mismo entorno, los resultados son peores y cambian mucho de una
  pasada a otra: quedan parones de hasta 3 o 4 s. No es una medida fiable de un equipo real.
- Lo que se cambió: las tramas y el grano ya no usan modos de mezcla, las capas del revelado dejan de
  componerse cuando no se ven, el filtro del fondo ya no se recalcula en cada fotograma y el latido
  de luz es un velo que solo cambia de opacidad. El aspecto se comparó antes y después en capturas:
  la diferencia media es de menos de 3 niveles sobre 255.
- En la 0.3.1 el más pesado era el montaje de la repetición (ahora plano 09), con unos 25 fotogramas
  por segundo en este entorno. En la 0.4.0 no se ha vuelto a medir por separado.
- La reproducción sigue el reloj real: los 45 s duran 45 s y los textos entran en su pulso aunque se
  salten fotogramas.

Cifras y método en los apartados 3.9 y 4.12 del informe. **No se ha medido en un equipo con tarjeta gráfica,
ni en Firefox, Safari o móvil**; es lo primero que hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa e inspector |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos |
| `js/efectos.js` | Efectos narrativos: siluetas (con paso a destiempo), ondas, puertas, niveles, mosaico de pistas, tocadiscos, montaje (con rastros), compás, fragmentos, barrido y descenso |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Páginas, viñetas, cámara, recursos, personajes y efectos por plano |
| `arte_nuevo/` | Ilustraciones nuevas sin aprobar, su manifiesto y, en `generado/`, la salida original de la herramienta |
| `fuentes/biblia_extractos.md` | Extractos literales de la biblia, para comprobar las citas |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/0.4.0/` | Capturas a 1920×1080 de la 0.4.0: 35 fotogramas, 3 del inspector, la hoja de contacto, las secuencias del protagonista y del descenso, y dos hojas de antes y después |
| `evidence/` (raíz) | Capturas de la 0.3.1, sin tocar |
| `INFORME_DIRECCION_NARRATIVA.md` | Análisis y resultado de la 0.3.0 (partes 1 y 2), de la 0.3.1 (parte 3) y de la 0.4.0 (parte 4) |
| `INFORME_PULIDO_FASE2.md` | Informe del pulido de la versión 0.2.x (historia anterior) |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- Aprobar o sustituir el arte nuevo, y decidir sobre las dos onomatopeyas.
- Resolver los puntos de coherencia con la biblia (apartados 3.6 y 4.13 del informe).
- Comprobar la fluidez en un equipo real y en Firefox, Safari y móvil.
- **Prueba de comprensión, sin hacer**: enseñarla a alguien que no conozca el juego y hacerle las
  cuatro preguntas del apartado 4.12. No está comprobado que la historia se entienda.
- Las teclas 1 a 9 y 0 saltan a los planos 1 a 10; a los planos 11 a 15 se llega con los botones o
  con la línea de tiempo.
- No hay exportación a vídeo ni sonido real.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir entre 35 y 45 s.
