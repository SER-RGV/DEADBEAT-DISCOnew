# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la secuencia de introducción de 10 planos: viñetas, bocadillos, cajas de
narrador, rótulos, onomatopeyas y transiciones, montados sobre los fondos y personajes que ya existen
en `assets/cinematics/`. Dura **45,000 s** (96 pulsos a 128 por minuto).

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
| `?ligero=1` | Quita las tramas de puntos y el grano de papel (equipos sin aceleración gráfica) |
| `?sellos=0` | Oculta los sellos «BORRADOR» |
| `?borradores=0` | Oculta los textos en borrador (queda solo lo que ya existe en el juego) |
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
| Fragmento del juego | Parte literal de una frase existente | 4 |
| Del juego, reubicado | Frase literal existente, colocada en otro momento | 4 |
| Del storyboard | Texto que figura en el storyboard aprobado | 1 |
| **BORRADOR** | Propuesta sin aprobar. No es canon | 13 |

Los 13 borradores son: el rótulo «AFUERA / De noche.», las dos frases del protagonista y la grafía de
las 10 onomatopeyas (el storyboard describe cada sonido, pero no cómo se escribe). En pantalla llevan
un sello rojo «BORRADOR», que se oculta con `?sellos=0`.

Si en el editor se cambia un texto con cita de modo que deja de coincidir con ella, pasa solo a
BORRADOR. El validador comprueba además que cada cita está, letra por letra, en el archivo que se
indica como origen. `banco_de_alternativas` reúne otras frases literales del juego sin colocar.

## Qué comprueba cada herramienta

| Comprobación | Vista previa (pestaña Comprobaciones) | `validar_guion.mjs` |
|---|---|---|
| Duración 45 s y 10 planos | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Texto igual a su cita | sí | sí |
| La cita existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |

Resultado actual: 0 errores y 1 aviso (el grito del plano 02 se lee a 17,6 caracteres por segundo;
cómodo hasta 17, máximo 21).

## Decisiones que conviene revisar

- **Duración.** El motor del juego (`src/dd_cinematic_camera.js`) y el manifiesto dan 35,0 s a la
  intro. Los 45 s son una línea de tiempo propia de este cómic; no se ha cambiado el motor.
- **Sonido.** El repositorio no tiene música ni efectos. La sincronía es con la rejilla de pulsos; la
  claqueta y los sonidos guía son sintetizados y solo sirven de referencia.
- **Megafonía del plano 02.** La frase es literal del juego (DJ Virgilio), pero presentarla como
  megafonía del club es una propuesta de puesta en escena.
- **Protagonista.** Los cuadros `hero_walk_00`, `01` y `02` son tres vestuarios distintos y
  `hero_shoot_00` un cuarto, así que no hay ciclo de caminata: se usa un solo dibujo (`hero_walk_01`)
  con un vaivén. `hero_shoot_00` solo aparece como silueta (plano 09) y como recorte de la pistola
  (plano 08). `hero_idle_00` y `hero_walk_03` están rotos y no se usan.
- **Fondos.** Todos traen marcos, muestras de color y letras sueltas incrustados; se ocultan con el
  recorte `seguro` de `data/composicion.json`.

## Fluidez

La reproducción sigue el reloj real: si el equipo dibuja despacio se saltan fotogramas, pero los 45 s
duran 45 s y los textos entran en su pulso.

Solo se ha medido en el entorno de pruebas, que no tiene tarjeta gráfica (Chromium sin interfaz, 2
núcleos, 1920×1080): unos 9 fotogramas por segundo de media, con parones de hasta 1,8 s; con
`?ligero=1`, unos 12. La mayoría de fotogramas salen a 60 por segundo y la media baja por los parones.
**No se ha medido en un equipo con aceleración gráfica**; es lo primero que hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa e inspector |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos, efectos |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Páginas, viñetas, cámara, recortes, personajes y efectos por plano |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/` | Capturas a 1920×1080 de cada plano y del inspector |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- Aprobar o sustituir los 13 borradores.
- No hay exportación a vídeo: es una vista previa en el navegador.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir entre 35 y 45 s.
- Probada en Chromium de escritorio. No se ha probado en Firefox, Safari ni en móvil.
