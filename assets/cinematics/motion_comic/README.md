# DEADBEAT DISCO · Introducción en motion comic (vista previa)

Versión en cómic animado de la introducción: viñetas, bocadillos, cajas de narrador y transiciones,
montados sobre el arte que ya existe en `assets/`. Dura **45,000 s** (96 pulsos a 128 por minuto).

Versión actual: **0.3.0-preview · «La noche que vuelve»**. Cuenta la historia de la biblia narrativa:
la Primera Noche, el deseo del anfitrión, la Escucha, la decisión de Tempo, el nacimiento de la torre
y del protagonista, y su despertar en el Refugio. Sustituye por completo a la historia de la versión
0.2.1 (el club, los nueve círculos, «DJ Virgilio»).

- Qué cambió y por qué, los textos con su origen, el arte que falta y lo que está sin comprobar:
  [`INFORME_DIRECCION_NARRATIVA.md`](INFORME_DIRECCION_NARRATIVA.md).
- Historia del pulido artístico anterior (0.2.x): [`INFORME_PULIDO_FASE2.md`](INFORME_PULIDO_FASE2.md).

| Plano | Empieza | Dura | Contenido |
|---|---|---|---|
| 01 La Primera Noche | 0,000 s | 10 pulsos | La estación convertida en sala de baile; invitados celebrando |
| 02 El último deseo | 4,688 s | 6 pulsos | Amanece; el anfitrión pide que la noche no termine |
| 03 La Escucha | 7,500 s | 8 pulsos | Bajo el salón, algo recibe el deseo y lo devuelve |
| 04 La nota que no termina | 11,250 s | 8 pulsos | La última nota vuelve a sonar; Tempo lo nota |
| 05 Solo una más | 15,000 s | 6 pulsos | Tempo enlaza otra canción; la sala pasa de ámbar a neón |
| 06 La torre | 17,813 s | 10 pulsos | El salón crece hacia abajo: nueve niveles hasta el Núcleo |
| 07 La repetición | 22,500 s | 10 pulsos | La misma noche, una y otra vez |
| 08 El Desafinado | 27,188 s | 10 pulsos | Un paso fuera del compás, corregido; lo descartado se acumula |
| 09 El nacimiento | 31,875 s | 8 pulsos | Lo descartado toma forma: el protagonista |
| 10 El Refugio | 35,625 s | 20 pulsos | Despierta en el Refugio; Tempo lo recibe; el descenso; título |

Es una **vista previa aislada**. No toca `src/`, ni el HUB, ni los HTML generados, ni los originales
de arte: las imágenes se leen por ruta relativa. No se ha generado ninguna imagen nueva.

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
| `?sel=p10_dialogo_bienvenido` | Abre con esa pieza de texto seleccionada |
| `?pestana=guion` · `comprobar` · `ver` | Pestaña abierta del panel |
| `?limpio=1` | Solo la imagen, sin panel ni línea de tiempo |
| `?ligero=1` | Quita las tramas de puntos y el grano de papel (equipos sin aceleración gráfica) |
| `?sellos=0` | Oculta los sellos «PROPUESTA», «BORRADOR» y «ARTE PROVISIONAL» |
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
| Adaptado | Es el texto del encargo; guarda el pasaje de la biblia que adapta | 13 |
| **Nuevo propuesto** | No está en la biblia. Lleva el sello «PROPUESTA». No es canon | 4 |
| **BORRADOR** | Texto retocado en el editor y sin revisar | 0 |

Son 17 piezas. Las cuatro propuestas son las tres frases de Tempo en el Refugio y la onomatopeya
«TAC». El protagonista no habla.

- Si en el editor se cambia un texto, deja de coincidir con la redacción fijada y pasa solo a
  BORRADOR.
- `banco_de_alternativas` guarda nueve frases literales de la biblia sin colocar, por si se prefiere
  sustituir un texto adaptado por uno literal.
- El validador comprueba que cada pasaje citado existe en el archivo de origen. **No puede comprobar
  que la adaptación sea fiel**: eso lo decide dirección.

## Arte provisional

Falta arte para tres cosas, y en su lugar hay sustitutos hechos con recursos oficiales. Los planos
afectados (01, 02, 03, 04 y 06) llevan el sello «ARTE PROVISIONAL».

| Falta | Sustituto actual |
|---|---|
| La estación de la Primera Noche | `cine_circle_08_traicion.png` virada a ámbar. No tiene nada ferroviario y es de 960×540 |
| El anfitrión | Silueta del NPC de la barra con la copa en alto |
| El tocadiscos de Tempo en primer plano | Disco, brazo y nota dibujados por código |

Los invitados y los bailarines son siluetas del sprite del Bailarín. La lista completa está en el
apartado 2.5 del informe.

## Qué comprueba cada herramienta

| Comprobación | Vista previa (pestaña Comprobaciones) | `validar_guion.mjs` |
|---|---|---|
| Duración 45 s y 10 planos | sí | sí |
| Ritmo de lectura y orden de entrada | sí | sí |
| Carga de lectura del plano (todo su texto, leído en orden, cabe antes del corte) | sí | sí |
| Estado de cada texto y coincidencia con la redacción fijada | sí | sí |
| El pasaje citado existe en el archivo de origen | no | sí |
| Tamaño de letra, zona segura, solapes, colas | sí | no (depende del dibujo) |

Resultado actual: 0 errores y 0 avisos; 22 de 22 citas encontradas. El texto más rápido se lee a
17,0 caracteres por segundo (cómodo hasta 17, máximo 21). La letra más pequeña mide 29 px a 1080p
(mínimo 26).

## Decisiones que conviene revisar

Están explicadas en el informe (apartados 1.7 y 2.6). En resumen:

- **Orden de los hechos.** La biblia pone el crecimiento de la torre antes de que Tempo note el
  bucle; la intro lo cuenta al revés, como pide el encargo.
- **«Solo una más.»** La biblia reserva esa frase para la última grabación que encuentra el jugador.
- **Tempo en el Refugio desde el principio.** La biblia propone que aparezca tras el primer jefe.
- **La llegada al Refugio.** La biblia propone un descenso en plataforma; aquí despierta allí.
- **El nombre.** La intro dice «TEMPO» y el HUB sigue diciendo «DJ VIRGILIO».
- **Duración.** El motor del juego (`src/dd_cinematic_camera.js`) da 35,0 s a la intro. Los 45 s son
  la línea de tiempo de este cómic; no se ha cambiado el motor.
- **Sonido.** El repositorio no tiene música ni efectos. La claqueta y los sonidos guía son
  sintetizados y solo sirven de referencia.

## Fluidez

**No se puede afirmar que la reproducción sea fluida.** Solo se ha medido en el entorno de pruebas,
que no tiene tarjeta gráfica (Chromium sin interfaz, dibujo por software, 2 núcleos, 1920×1080).

- En tramos cortos (2,6 s) va a entre 54 y 60 fotogramas por segundo.
- En reproducción seguida aparecen, a los pocos segundos, parones de entre 0,6 y 2,5 s. La intro
  completa dibujó 184 fotogramas en 45 s. La versión 0.2.1 se comporta igual en la misma prueba.
- La reproducción sigue el reloj real: los 45 s duran 45 s y los textos entran en su pulso aunque se
  salten fotogramas.

Cifras y método en el apartado 2.8 del informe. **No se ha medido en un equipo con tarjeta gráfica,
ni en Firefox, Safari o móvil**; es lo primero que hay que comprobar al abrirla.

## Archivos

| Ruta | Contenido |
|---|---|
| `index.html`, `vista_previa.css`, `js/vista_previa.js` | Vista previa e inspector |
| `comic.css`, `js/motor.js`, `js/textos.js`, `js/formas.js` | El cómic: páginas, cámara, bocadillos |
| `js/efectos.js` | Efectos narrativos: siluetas, ondas, disco, niveles, montaje, fragmentos, barrido |
| `js/guion.js` | Lectura y comprobación del guion (navegador y Node) |
| `data/guion.json` | Textos, tiempos, estados y fuentes |
| `data/composicion.json` | Páginas, viñetas, cámara, recursos, personajes y efectos por plano |
| `fuentes/biblia_extractos.md` | Extractos literales de la biblia, para comprobar las citas |
| `fonts/` | Tipografías libres y sus licencias (ver `fonts/README.md`) |
| `evidence/` | Capturas a 1920×1080 de cada plano y del inspector (versión 0.3.0) y hoja de contacto |
| `INFORME_DIRECCION_NARRATIVA.md` | Análisis previo y resultado de la reconstrucción narrativa |
| `INFORME_PULIDO_FASE2.md` | Informe del pulido de la versión 0.2.x (historia anterior) |
| `servir.mjs`, `validar_guion.mjs` | Servidor local y validador |

## Pendiente

- Decidir sobre las cuatro propuestas de texto y los cinco puntos de coherencia con la biblia.
- Encargar el arte que falta: la estación, el anfitrión y el tocadiscos.
- Comprobar la fluidez en un equipo real y en Firefox, Safari y móvil.
- Enseñarla a alguien que no conozca el juego: no está comprobado que la historia se entienda.
- No hay exportación a vídeo ni sonido real.
- No está integrada en el juego; hacerlo exigiría tocar `src/` y decidir entre 35 y 45 s.
