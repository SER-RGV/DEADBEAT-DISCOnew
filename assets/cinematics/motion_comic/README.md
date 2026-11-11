# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la secuencia de introducción de 10 planos: viñetas, bocadillos, cajas de
narrador, rótulos, onomatopeyas y transiciones, montados sobre los fondos y personajes que ya existen
en `assets/cinematics/`. Dura **45,000 s** (96 pulsos a 128 por minuto).

Versión actual: **0.2.1-preview** (pulido artístico y narrativo, con el cierre de pulido aplicado).
Qué cambió respecto a la primera versión y por qué, plano a plano, y las medidas de rendimiento del
cierre están en [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

| Plano | Empieza | Dura | Contenido |
|---|---|---|---|
| 01 El mundo | 0,000 s | 12 pulsos | Cartela con latido, ciudad, narrador |
| 02 El club | 5,625 s | 12 pulsos | Fachada, neón, megafonía |
| 03 La entrada | 11,250 s | 8 pulsos | Puerta, primera frase de DJ Virgilio |
| 04 Aparición | 15,000 s | 8 pulsos | El protagonista cruza el umbral |
| 05 Caminata | 18,750 s | 8 pulsos | Pasillo, voz del DJ |
| 06 El interior | 22,500 s | 12 pulsos | La sala y los nueve círculos |
| 07 La pista | 28,125 s | 8 pulsos | El drop |
| 08 Presentación | 31,875 s | 12 pulsos | Silencio, pistola y frase del protagonista |
| 09 Identidad | 37,500 s | 8 pulsos | Logotipo |
| 10 Transición | 41,250 s | 8 pulsos | El Refugio |

Es una **vista previa aislada**. No toca `src/`, ni el HUB, ni los HTML generados, ni los originales
de arte: las imágenes se leen por ruta relativa y los defectos de los fondos se ocultan por recorte.

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
| `?sel=p03_dialogo_bienvenido` | Abre con esa pieza de texto seleccionada |
| `?pestana=guion` · `comprobar` · `ver` | Pestaña abierta del panel |
| `?limpio=1` | Solo la imagen, sin panel ni línea de tiempo |
| `?ligero=1` | Quita las tramas de puntos, el grano de papel y el baño de color de la pista (equipos sin aceleración gráfica) |
| `?sellos=0` | Oculta los sellos «BORRADOR» |
| `?borradores=0` | Oculta los textos en borrador (queda lo que ya existe en el juego y lo aprobado) |
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

No existe en el repositorio un guion de introducción aprobado ni un documento de historia, y el
protagonista no tiene nombre ni frases. Por eso cada texto lleva un estado visible:

| Estado | Significado | Piezas |
|---|---|---|
| Texto del juego | Frase literal que ya existe, usada en su sitio | 3 |
| Fragmento del juego | Parte literal de una frase existente | 5 |
| Del juego, reubicado | Frase literal existente, colocada en otro momento | 4 |
| Del storyboard | Texto que figura en el storyboard aprobado | 1 |
| Aprobado | Texto nuevo aprobado por dirección. No procede del juego | 1 |
| **BORRADOR** | Propuesta sin aprobar. No es canon | 10 |

Son 24 piezas activas de 27. El texto aprobado es la única frase del protagonista, «Traigo
percusión.» (plano 08). Los 10 borradores son la grafía de las 10 onomatopeyas (el storyboard describe
cada sonido, pero no cómo se escribe). En pantalla llevan un sello rojo «BORRADOR», que se oculta con
`?sellos=0`.

Hay 3 piezas desactivadas (`"activo": false`), que siguen en el guion y se pueden reactivar desde el
editor: el rótulo «AFUERA / De noche.», el pensamiento «Mejor no dejo nada en el guardarropa.» y el
rótulo «Tregua Sagrada · Zona Segura».

Si en el editor se cambia un texto con cita de modo que deja de coincidir con ella, pasa solo a
BORRADOR. Lo mismo ocurre con un texto aprobado: su redacción exacta está fijada en
`fuente.aprobado` y cualquier retoque lo devuelve a BORRADOR. El validador comprueba además que cada
cita está, letra por letra, en el archivo que se indica como origen. `banco_de_alternativas` reúne 12
frases literales del juego sin colocar y, en `propuestas_protagonista`, el registro de las opciones
que se barajaron para la frase del protagonista (decisión ya cerrada).

## Opciones de composición añadidas en la versión 0.2.0

| Dónde | Opción | Efecto |
|---|---|---|
| `guion.json`, cartela | `"variante": "pie"` | Línea pequeña sobre banda amarilla bajo el título de la cartela |
| `guion.json`, cartela de título | `"latidos": [0, 2]` | Pulsos en los que late un anillo detrás del título |
| `guion.json`, cualquier pieza | `"estilo": { "tam": 42 }` | Cambia el tamaño de letra solo en esa pieza |
| `composicion.json`, `fx` | `circulos` (`x`, `y0`, `y1`, `desde`, `paso`, `colores`) | Columna de discos que se encienden uno a uno; el último late |
| `composicion.json`, `fx` | `color_pulso` (`x`, `y`, `colores`) | Baño de color que cambia en cada pulso |
| `composicion.json`, `fx` | `laseres` admite `abanico` y `velocidad` | Apertura y velocidad del barrido |

## Qué comprueba cada herramienta

| Comprobación | Vista previa (pestaña Comprobaciones) | `validar_guion.mjs` |
|---|---|---|
| Duración 45 s y 10 planos | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Carga de lectura del plano (todo su texto, leído en orden, cabe antes del corte) | sí | sí |
| Texto igual a su cita, o al texto aprobado | sí | sí |
| La cita existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |

Resultado actual: 0 errores y 0 avisos. El texto más rápido se lee a 16,8 caracteres por segundo
(cómodo hasta 17, máximo 21). El aviso de la primera versión (grito del plano 02, 17,6) se resolvió
dándole al plano un compás más, no acortando ni acelerando la frase.

## Decisiones que conviene revisar

- **Duración.** El motor del juego (`src/dd_cinematic_camera.js`) y el manifiesto dan 35,0 s a la
  intro. Los 45 s son una línea de tiempo propia de este cómic; no se ha cambiado el motor.
- **Sonido.** El repositorio no tiene música ni efectos. La sincronía es con la rejilla de pulsos; la
  claqueta y los sonidos guía son sintetizados y solo sirven de referencia.
- **Megafonía del plano 02.** La frase es literal del juego (DJ Virgilio), pero presentarla como
  megafonía del club es una propuesta de puesta en escena.
- **Reparto de compases.** El plano 02 gana un compás (de 8 a 12 pulsos) y el 07 lo pierde (de 12 a
  8). El total sigue en 96 pulsos.
- **Protagonista.** Los cuadros `hero_walk_00`, `01` y `02` son tres vestuarios distintos y
  `hero_shoot_00` un cuarto, así que no hay ciclo de caminata: se usa un solo dibujo (`hero_walk_01`)
  con un vaivén. `hero_shoot_00` solo aparece como silueta (plano 09) y como recorte de la pistola
  (plano 08). `hero_idle_00` y `hero_walk_03` están rotos y no se usan.
- **Fondos.** Todos traen marcos, muestras de color y letras sueltas incrustados; se ocultan con el
  recorte `seguro` de `data/composicion.json`.

## Decisiones cerradas

- **Frase del protagonista (plano 08).** «Traigo percusión.» está aprobada. Es su única frase en toda
  la secuencia y no le da nombre ni pasado.
- **Plano 04.** Lleva solo la silueta, «Umbral cruzado» y «TOMP». El rótulo «INVITACIÓN 001 / salida
  pendiente.» se retiró del guion: pertenece al Limbo y se reserva para ese contexto.

## Fluidez

La reproducción sigue el reloj real: si el equipo dibuja despacio se saltan fotogramas, pero los 45 s
duran 45 s y los textos entran en su pulso.

Solo se ha medido en el entorno de pruebas, que no tiene tarjeta gráfica (Chromium sin interfaz,
dibujo por software, 2 núcleos, 1920×1080). Allí la mayoría de fotogramas salen a tiempo y la media
baja por parones aislados de hasta unos 2 s, que vienen de componer la imagen por software.

En el cierre de pulido (0.2.1) se optimizó el plano 07 sin quitarle ningún efecto. En ese mismo
entorno, el tramo de 27 a 35 s pasa de entre 7 y 9 fotogramas por segundo a unos 9 (tres muestras de
8 s por versión), y el trabajo de dibujo por fotograma baja a un tercio. Los parones largos siguen
ahí, así que **no se puede afirmar que la reproducción sea fluida**. Las cifras completas y el método
están en el apartado H de [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

`?ligero=1` quita las tramas, el grano y el baño de color para equipos sin aceleración gráfica.
**No se ha medido en un equipo con tarjeta gráfica, ni en Firefox, Safari o móvil**; es lo primero que
hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa e inspector |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos, efectos |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Páginas, viñetas, cámara, recortes, personajes y efectos por plano |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/` | Capturas a 1920×1080 de cada plano y del inspector (versión 0.2.1) |
| `INFORME_PULIDO_FASE2.md` | Revisión de los diez planos, tabla de cambios y cierre de pulido con medidas de rendimiento |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- Aprobar o sustituir los 10 borradores (la grafía de las onomatopeyas).
- No hay exportación a vídeo: es una vista previa en el navegador.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir entre 35 y 45 s.
- Probada en Chromium de escritorio. No se ha probado en Firefox, Safari ni en móvil.
