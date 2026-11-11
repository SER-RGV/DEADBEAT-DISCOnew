# Informe de producción · Fase de pulido artístico y narrativo

Motion comic de la introducción de DEADBEAT DISCO, versión **0.2.0-preview**.

> **Actualización: cierre de pulido (0.2.1-preview).** Los apartados A a G describen la fase de pulido
> tal como se entregó en el commit `f3935c1` y se conservan como registro. Dos cosas de esos apartados
> ya no valen: «Traigo percusión.» está aprobada y el rótulo «INVITACIÓN 001 / salida pendiente.» se
> retiró del plano 04. Lo vigente está en el [apartado H](#h-cierre-de-pulido-021-preview).

Siguen siendo **45,000 s y diez planos**. No se ha generado ninguna imagen nueva: todo lo añadido es
dibujo vectorial, tipografía y efectos sobre el arte que ya había. No se ha tocado `main`, el PR #17,
el HUB ni el motor del juego.

## Resumen

- Se cambian siete planos (01, 02, 04, 06, 07, 08 y 09) y se retoca el 10. Los planos 03 y 05 se
  quedan como estaban.
- De los nueve textos señalados para revisión, **seis se mantienen letra por letra** porque son
  frases literales del juego y funcionan; lo que se ajustó en ellos fue el tiempo en pantalla. Dos se
  retiran y uno se sustituye.
- Borradores: de 13 a **11** (la frase del protagonista y la grafía de las 10 onomatopeyas).
- Validador: 0 errores, 0 avisos (antes había 1). Texto más rápido: 16,8 caracteres por segundo.

**Una desviación del método pedido.** Se pidió entregar la revisión de los diez planos antes de
editar. La revisión se hizo antes de editar, sobre las capturas de la primera versión y el guion, pero
se redactó después, junto con este informe: no se entregó como paso previo para aprobar.

## A. Revisión de los diez planos

| Plano | Qué funcionaba | Qué no funcionaba | Decisión |
|---|---|---|---|
| 01 El mundo | El título sobre negro y la ciudad con el tren | La cartela era una pantalla quieta; el rótulo «AFUERA / De noche.» describía lo que ya se ve | Mejorar |
| 02 El club | Neón, fachada y forma del grito | La megafonía entraba casi con el corte y se leía a 17,6 caracteres por segundo, por encima de lo cómodo | Mejorar el tiempo, no el texto |
| 03 La entrada | La frase del guardarropa presenta el humor del juego en una sola línea; el haz de la puerta y el «ÑIIIEEEC» | Nada relevante | **No tocar** |
| 04 Aparición | La silueta a contraluz y «Umbral cruzado» | El pensamiento del protagonista explicaba el chiste del plano 03 y lo hacía hablar antes de su presentación | Mejorar |
| 05 Caminata | La voz del DJ en caja de narrador y los pasos | Nada relevante | **No tocar** |
| 06 El interior | El plano general y la frase de los nueve círculos | Los nueve círculos solo se decían; en la imagen no había nada que contar | Mejorar |
| 07 La pista | El «¡¡BOOOM!!» y las líneas de impacto | Tras el golpe inicial el plano se quedaba quieto doce pulsos; pocos láseres y un solo color | Mejorar |
| 08 Presentación | El silencio en gris, el inserto de la cara y el de la pistola | El «CLAC-CLAC» llegaba sin golpe visual; «Pon la siguiente.» la podría decir cualquiera | Mejorar |
| 09 Identidad | El logotipo como sello y las líneas de impacto | La onomatopeya, centrada y enorme, tapaba la silueta del protagonista y competía con el logotipo | Mejorar |
| 10 Transición | El cambio de paleta, el retrato del DJ y «cazador» | El rótulo en una sola línea larga se leía como una etiqueta técnica | Retoque |

Lectura de la secuencia completa: los planos 01 a 05 bajan hacia el club con humor seco, el 06 explica
el lugar, el 07 lo hace estallar, el 08 corta en seco y presenta al protagonista, el 09 firma y el 10
entrega al jugador. El punto débil era el centro (06 y 07, más dicho que mostrado) y la voz del
protagonista (dos frases flojas). El DJ lleva ahora toda la palabra hasta el plano 08 y el protagonista
habla una sola vez.

## B. Los textos señalados para revisión

| # | Texto | Origen | Decisión | Motivo |
|---|---|---|---|---|
| 1 | «AFUERA / De noche.» | Borrador | **Retirado** (desactivado) | Relleno genérico. Lo sustituye una línea literal de la propia intro: «DESCENSO AL CLUB» |
| 2 | «¡La dirección recuerda que el infierno no devuelve las entradas!» | Literal (DJ, `rave.on`) | **Se mantiene** | Es de las mejores frases del juego. El problema era de tiempo: ahora tiene un compás más y baja a 14,4 caracteres por segundo |
| 3 | «Mejor no dejo nada en el guardarropa.» | Borrador | **Retirado** (desactivado) | Explicaba el chiste anterior. En su lugar, un rótulo literal: «INVITACIÓN 001 / salida pendiente.» |
| 4 | «Te guardaron sitio. Eso debería preocuparte más que el portero.» | Literal (DJ, al superar la sala 1) | **Se mantiene** | Suena al personaje y enlaza con la invitación del plano 04 |
| 5 | «Nueve círculos, nueve residentes y el Núcleo latiendo al fondo.» | Literal (DJ, Refugio) | **Se mantiene** | Ahora la imagen la acompaña: nueve discos se encienden mientras la dice |
| 6 | «Si pierdes el compás, la pista te traga.» | Literal (DJ, Refugio) | **Se mantiene** | Es la regla del juego en ocho palabras |
| 7 | «Silencio incómodo. Me encantan los silencios antes de la matanza.» | Literal (DJ, `calm`) | **Se mantiene** | Da pie a la frase del protagonista |
| 8 | «Pon la siguiente.» | Borrador | **Sustituido** por «Traigo percusión.» (borrador) | Ver apartado D |
| 9 | «EL REFUGIO · COLA DEL CLUB» | Literal | **Se mantiene**, partido en dos líneas | «Tregua Sagrada · Zona Segura» sigue desactivado: un segundo rótulo sobraba |

## C. Tabla de cambios

Estado del texto: **literal** (frase del juego en su sitio), **reutilizado** (frase o fragmento literal
del juego colocado en otro momento) o **borrador** (propuesta sin aprobar).

| Plano | Problema detectado | Cambio realizado | Motivo | Estado del texto |
|---|---|---|---|---|
| 01 | La cartela era estática | Dos anillos de neón laten detrás del título en los pulsos 0 y 2 | El bajo se ve antes de que aparezca la ciudad y enlaza con los cuatro «DUM» | Sin texto nuevo |
| 01 | Rótulo «AFUERA / De noche.» genérico | Desactivado. Nueva línea bajo el título: «DESCENSO AL CLUB» | Da nombre de capítulo con palabras del juego | Reutilizado (fragmento de «DIEZ PLANOS · SEIS ESCENARIOS · DESCENSO AL CLUB», `src/dd_cinematic_camera.js`) |
| 01 | El narrador entraba tarde | La ciudad se descubre en el pulso 3,3 y el narrador entra en el 5,5 (antes 6) | Más tiempo de lectura: 13,1 caracteres por segundo | Reutilizado, sin cambios de texto |
| 02 | Megafonía a 17,6 caracteres por segundo y pegada al corte | El plano pasa de 8 a 12 pulsos; el grito entra en el pulso 2,5 | Primero se ve el club y luego se oye; lectura a 14,4 sin tocar la frase | Reutilizado, sin cambios de texto |
| 03 | Ninguno | Ninguno | Funciona | Literal |
| 04 | El pensamiento explicaba el chiste | Desactivado. Nuevo rótulo ladeado: «INVITACIÓN 001 / salida pendiente.» | Humor negro sin que nadie hable; el protagonista calla hasta el plano 08 | Reutilizado (fragmento de «SALA DE ESPERA · INVITACIÓN 001 · salida pendiente.», `index.html`, Círculo I) |
| 05 | Ninguno | Ninguno | Funciona | Reutilizado, sin cambios |
| 06 | Los nueve círculos no se veían | Columna de nueve discos junto al DJ: se encienden de arriba abajo mientras habla y el noveno late | Convierte la frase en imagen. Colores tomados de la tabla de círculos del juego (`accent`, I a IX) | Reutilizado, sin cambios de texto |
| 06 | Onomatopeya demasiado larga | «FSSSSHHHH» pasa a «FSSSHHH» | Se lee de un golpe | Borrador |
| 07 | Plano largo y quieto tras el golpe | De 12 a 8 pulsos; cuatro láseres en abanico; la pista cambia de color en cada pulso (cian, fucsia, oro); el DJ entra antes | El storyboard pide un estallido; el compás sobrante se lo lleva el plano 02 | Reutilizado, sin cambios de texto |
| 07 | Demasiados «UNTZ» | De ocho golpes a cinco, recolocados | Menos palabras grandes a la vez | Borrador |
| 08 | El «CLAC-CLAC» no pegaba | Líneas de impacto, destello y más temblor en el pulso 8 | Es el momento que rompe el silencio | Borrador (grafía) |
| 08 | Frase del protagonista sin carácter | «Pon la siguiente.» pasa a «Traigo *percusión*.», con letra algo mayor | Responde al «silencio incómodo» con la pistola recién montada | **Borrador** |
| 09 | La onomatopeya tapaba la silueta y competía con el logotipo | Logotipo un 25 % más grande; «¡KRA-KOOOM!» pasa a «¡KRAKOOOM!», más pequeña, ladeada y en la esquina inferior izquierda | El logotipo manda; la silueta con la pistola queda limpia | Borrador (grafía) |
| 10 | Rótulo en una línea larga | «EL REFUGIO» como titular y «COLA DEL CLUB» debajo; entra antes, igual que el DJ | Se lee como rótulo de lugar y deja más tiempo a la última frase | Literal, sin cambios de texto |

Onomatopeyas, las diez revisadas: «DUM», «BZZZT», «ÑIIIEEEC», «TOMP», «TAC» y «CLAC-CLAC» se
quedan igual; cada una corresponde al sonido que el storyboard pide para su plano. Cambian «FSSSHHH»,
«UNTZ» (menos golpes) y «¡KRAKOOOM!». «¡¡BOOOM!!» no cambia de forma, solo dura menos porque el plano
es más corto. Todas siguen en borrador.

## D. El protagonista

El juego no le da nombre, pasado ni frases; el DJ lo llama «cazador». No se ha inventado nada de eso.
En esta versión **habla una sola vez**, en el plano 08, justo después de montar la pistola.

| Propuesta | Estado | Comentario |
|---|---|---|
| «Traigo percusión.» | Borrador, **colocada** | Tres palabras. Une arma y música y contesta al «silencio incómodo» del DJ |
| «El compás lo marco yo.» | Borrador | Contesta al aviso del plano 07. Más chulesca que irónica |
| «Pon la siguiente.» | Borrador | La versión anterior. Funciona, pero es impersonal |
| «Sube el volumen.» | Borrador | Neutra |
| Sin frase | Opción | Se desactiva la pieza y el «CLAC-CLAC» hace de respuesta |

Están en `data/guion.json → banco_de_alternativas.propuestas_protagonista`. Para cambiarla: pestaña
Guion, pieza `p08_dialogo_heroe`.

## E. Duración y legibilidad

| Plano | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Pulsos antes | 12 | 8 | 8 | 8 | 8 | 12 | 12 | 12 | 8 | 8 |
| Pulsos ahora | 12 | **12** | 8 | 8 | 8 | 12 | **8** | 12 | 8 | 8 |

Total: 96 pulsos a 128 por minuto, 45,000 s. Ningún diálogo se ha acelerado: todos los que cambiaron
de tiempo tienen ahora más margen. El validador incorpora una comprobación nueva: que todo el texto
de un plano, leído en orden a ritmo cómodo, quepa antes del corte.

## F. Comprobaciones realizadas

| Prueba | Resultado |
|---|---|
| `node validar_guion.mjs` | 0 errores, 0 avisos; 37 de 37 citas encontradas en su archivo de origen |
| Piezas | 28 en total, 25 activas: 3 literales, 6 fragmentos, 4 reubicadas, 1 del storyboard, 11 borradores |
| Reproducción completa de 0 a 45 s (Chromium sin interfaz, 1920×1080) | Llega a 45,000 s; sin errores en consola; sin recursos fallidos; el motor no registra fallos |
| `node --check` de todos los `.js` y `.mjs` | Correcto |
| Capturas | `evidence/`: 13 de planos, 3 del inspector y `hoja_de_contacto.jpg`, todas rehechas |

## G. Lo que queda por decidir o comprobar

*(Estado al entregar la 0.2.0. Los dos primeros puntos se resolvieron en el cierre; ver apartado H.)*

- **Aprobar o cambiar «Traigo percusión.»** y la grafía de las onomatopeyas.
- **«INVITACIÓN 001 / salida pendiente.»** pertenece en el juego al Círculo I (Limbo). Aquí se usa en
  el umbral del club. Si ese texto debe reservarse para el Limbo, basta con desactivar la pieza
  `p04_rotulo_invitacion`.
- **Fluidez.** Sigue sin medirse en un equipo con tarjeta gráfica. En el entorno de pruebas, que no la
  tiene, el plano 07 va algo más lento que antes (entre 7 y 8 fotogramas por segundo frente a entre 9
  y 11, con pocas muestras y mucha variación). `?ligero=1` quita el baño de color además de las tramas.
- No se ha probado en Firefox, Safari ni en móvil.

## H. Cierre de pulido (0.2.1-preview)

No es un rediseño. Se aplican dos decisiones editoriales y se reduce el trabajo de dibujo del plano 07.
Siguen siendo 45,000 s y diez planos, sin imágenes nuevas.

**Lo esencial:** las dos decisiones están aplicadas y comprobadas. El plano 07 dibuja bastante menos
por fotograma y conserva todos sus efectos, pero **no afirmo que la regresión esté resuelta**: en el
entorno de pruebas siguen apareciendo parones de unos 2 s que no dependen de este trabajo, y no hay
ninguna medida en un equipo con tarjeta gráfica.

### H.1 Commits

| | Commit |
|---|---|
| Inicio | `f3935c1` (0.2.0-preview) |
| Resultado | `57d33d9` (0.2.1-preview: código, guion, capturas y README) |
| Informe | El commit siguiente a `57d33d9`, que solo añade este apartado |

Rama `arena/94a36df1-deadbeat-disconew`. Sin PR. No se ha tocado `main`, el PR #17, `src/`, el HUB, el
HTML generado ni el motor del juego: los dos commits solo cambian archivos de
`assets/cinematics/motion_comic/`.

### H.2 Archivos modificados

| Archivo | Cambio |
|---|---|
| `data/guion.json` | Se elimina la pieza `p04_rotulo_invitacion`. `p08_dialogo_heroe` pasa a estado `aprobado`, con el texto fijado en `fuente.aprobado`. Estado nuevo `aprobado` en `estados`. Versión 0.2.1-preview |
| `data/composicion.json` | Solo el número de versión |
| `js/guion.js` | Reconoce el estado `aprobado`: el texto debe coincidir con `fuente.aprobado` |
| `js/vista_previa.js`, `vista_previa.css` | Etiqueta «Aprobado», recuento y comprobación en el panel |
| `validar_guion.mjs` | Solo el comentario de cabecera (la regla está en `js/guion.js`) |
| `js/motor.js` | Optimización del plano 07: baño de color, líneas de impacto y caja del personaje |
| `js/textos.js` | La onomatopeya se marca como «asentada» cuando termina de entrar |
| `comic.css` | Capas propias (`will-change`) para los elementos que solo cambian de opacidad o de escala |
| `README.md` | Versión, tabla de estados, decisiones cerradas y apartado de fluidez |
| `evidence/` | Las 13 capturas de planos, las 3 del inspector y la hoja de contacto, rehechas |
| `INFORME_PULIDO_FASE2.md` | Nota inicial y este apartado |

### H.3 Decisiones narrativas aplicadas

**Plano 08: «Traigo percusión.» aprobada.** La frase no se ha tocado. Deja de llevar el sello
«BORRADOR».

- Para marcarla hizo falta un estado nuevo, **Aprobado**: texto nuevo aceptado por dirección que no
  procede del juego. Sin él, el validador solo distingue entre cita literal y borrador. Es el único
  añadido al editor (una opción más en el desplegable de estado). Si se retoca el texto, la pieza
  vuelve sola a BORRADOR.
- Aparece una sola vez: una pieza entre las intervenciones del guion y un elemento en pantalla. Es la
  única intervención del protagonista en toda la secuencia. (El archivo conserva además, fuera de la
  secuencia, el registro de las alternativas que se barajaron, ya marcado como decisión cerrada.)
- El guion no le da nombre, pasado ni biografía. La ficha del personaje lo dice de forma expresa.
- La pistola se reconoce cuando aparece el bocadillo: la viñeta del arma entra en el pulso 8 del
  plano, junto al «CLAC-CLAC» (35,63 s), y el bocadillo llega en 36,09 s. Comprobado en las capturas
  de 36,2 y 36,9 s (`evidence/plano08_36.9s_presentacion.jpg`).

**Plano 04: se retira «INVITACIÓN 001 / salida pendiente.».** La pieza se ha eliminado del guion, no
solo desactivado, y nada la sustituye. El plano conserva la silueta, «Umbral cruzado» y «TOMP». El
texto ya no figura en ningún punto de `data/guion.json`.

Un efecto visible fuera del plano 04: como la viñeta 04 sigue en página durante el plano 05, el rótulo
también desaparece de esas capturas.

Recuento resultante: 27 piezas, 24 activas (3 literales, 5 fragmentos, 4 reubicadas, 1 del storyboard,
1 aprobada y 10 borradores, que son las 10 onomatopeyas).

### H.4 Qué se optimizó en el plano 07

**Qué costaba.** El cálculo en JavaScript no era el problema: unos 0,2 ms por fotograma antes y
después. El coste estaba en volver a dibujar píxeles. En `f3935c1`, de los 75 fotogramas del plano:

| Elemento | Qué pasaba | Veces que se repintaba |
|---|---|---|
| Letras de «¡¡BOOOM!!» | El latido y el temblor cambiaban su escala y obligaban a redibujar el texto con su degradado, contorno y sombra | 75 de 75 |
| Protagonista | Crecía cambiando el ancho y el alto de la caja, lo que redibujaba el sprite y su filtro de tinta | 75 de 75 |
| Líneas de impacto | Al escalarse dentro de la capa de fondo, redibujaban esa capa entera | 20 |
| Baño de color | Cada cambio de color repintaba una capa a pantalla completa | 8 (una por pulso) |

Los cuatro láseres y el estrobo apenas pesaban en el dibujo: ya eran solo giros y opacidad.

**Qué se cambió.** Ningún efecto se ha quitado, ni cambian el ritmo, los colores o la composición.

1. **Baño de color.** Antes, una capa a la que se le cambiaba el color en cada pulso. Ahora, una capa
   fija por color (cian, fucsia y oro) creada una sola vez; cada pulso solo cambia la opacidad, y solo
   se escribe cuando el valor cambia.
2. **Líneas de impacto.** Una forma por línea, en capa propia: la geometría se dibuja una vez y la
   expansión es una escala de la capa.
3. **Protagonista.** La caja se maqueta una vez, al mayor tamaño del plano, y el crecimiento es una
   escala. Afecta también a los planos 04 y 06, que animan el tamaño del personaje.
4. **Onomatopeya.** Cuando la palabra termina de entrar, pasa a capa propia; el latido y el temblor la
   mueven sin redibujar las letras.
5. **Estrobo y destellos.** Capa propia, porque solo cambian de opacidad.

**Probado y descartado.** Dos variantes de las líneas de impacto salieron peor y no se quedaron:
dibujarlas al tamaño máximo y reducirlas (una capa de 4678×4679 px, unos 125 ms por fotograma) y
dejarlas como una sola forma sin capa propia (unos 210 ms). La que se queda mide entre 73 y 81 ms.

**Qué no se pudo quitar.** Los parones largos que quedan no son dibujo del motion comic. La traza del
navegador los sitúa en la composición final de la imagen, que en este entorno se hace por software
(`FinishPaintRenderPass`, entre 0,45 y 1,9 s cada uno). Su coste crece con el número de capas a
pantalla completa que se mezclan, y las que más pesan son las tramas de puntos y el grano de papel:
sin ellas (`?ligero=1`) el plano va a ritmo constante. Forman parte del acabado, así que se quedan.

**Comparación visual.** Capturas de `f3935c1` y de la versión nueva en 30 momentos de la secuencia, a
1920×1080. Aparte del rótulo retirado, las diferencias son de suavizado en los bordes del personaje y
de las letras, y de un píxel de posición en alguna onomatopeya (media de 0,9 sobre 255 como máximo).
Ampliadas en los planos 05, 07, 08 y 09, no cambian el aspecto. El plano 04 se miró a tamaño de
captura.

### H.5 Medidas del plano 07, antes y después

**Entorno:** Chromium sin interfaz, dibujo y composición por software, sin tarjeta gráfica, 2
núcleos, 1920×1080, solo la imagen (`?limpio=1`). Las tres versiones se sirvieron a la vez desde
copias de cada commit y se midieron por turnos en la misma sesión. Los tiempos varían mucho de una
muestra a otra; los recuentos de teselas y repintados son estables.

| Medida | Fase 1 `a98d963` | Antes `f3935c1` | Después `57d33d9` |
|---|---|---|---|
| Teselas dibujadas por fotograma | 9,7 | 13,3 | **4,4** |
| Dibujo en el hilo gráfico, por fotograma | 274 ms | 294 a 378 ms | **17 a 39 ms** |
| Capas repintadas en los 75 fotogramas | sin medir | 2 | **0** (la que más, 33: el bocadillo al entrar) |
| Paso a paso, media por fotograma (4 muestras) | 333 a 346 ms | 357 a 380 ms | **73 a 81 ms** |
| Paso a paso, percentil 90 | 636 a 716 ms | 834 a 986 ms | **34 a 36 ms** |
| Paso a paso, peor fotograma | 3,0 a 3,5 s | 1,9 a 2,3 s | 1,7 a 2,2 s |
| Plano 07 en bucle a tiempo real, 12 s (3 muestras) | 3,0 a 5,2 fps | 1,6 a 1,9 fps | **8,4 a 9,8 fps** |
| Reproducción real de 27 a 35 s (3 muestras de 8 s) | 9,2 a 11,7 fps | 6,9 a 8,7 fps | 8,7 a 9,1 fps |
| La misma, peor fotograma | 1,3 a 1,8 s | 1,4 a 1,9 s | 1,9 a 2,0 s |

Cómo leerla:

- **«Paso a paso»** avanza el plano 07 a 20 fotogramas por segundo de plano y mide cuánto tarda el
  navegador en presentar cada uno. La mediana es la misma en las tres versiones (unos 33,5 ms, el
  ritmo de la prueba); la media la mueven los parones.
- **La última medida es la del informe anterior** (entre 7 y 8 fps frente a entre 9 y 11). Con ella,
  la mejora es pequeña: de 7,6 a 8,9 fps de media, por debajo de los 10,6 de la fase 1. Los rangos de
  antes y después casi se tocan, y el peor fotograma no mejora.
- **La columna de la fase 1 no es el mismo plano**: allí el plano 07 duraba 12 pulsos, con dos láseres
  y sin baño de color. Sirve de referencia, no de comparación directa.
- En el bucle a tiempo real, de los 12 s de cada muestra, entre 10,5 y 13,7 s caen en fotogramas de
  más de 100 ms en las tres versiones. Mejora cuántos fotogramas salen, no que deje de haber parones.

Reparto del coste que queda, ocultando un elemento cada vez (media por fotograma, 2 muestras; base 74
a 80 ms): sin láseres 38 a 39; sin baño de color 42 a 47; sin estrobo 44 a 50; sin líneas de impacto
52 a 57; sin tramas ni grano 34 (el mínimo que permite la prueba). Ningún efecto concentra el coste:
lo que pesa es la suma de capas a pantalla completa.

Resto de planos, una muestra de 40 fotogramas por plano: ninguno sale más lento que antes (planos 03,
04, 06 y 09 algo más rápidos; con una sola muestra, es indicio y no medida).

### H.6 Validación

| Prueba | Resultado |
|---|---|
| `node validar_guion.mjs` | 0 errores, 0 avisos; 36 de 36 citas encontradas en su archivo de origen |
| Reproducción completa de 0 a 45 s | Llega a 45,000 s; el motor no registra fallos; comprobaciones del panel: 0 errores, 0 avisos |
| Consola y red durante la reproducción | Sin errores de consola; ninguna respuesta con código 400 o superior |
| «Traigo percusión.» | 1 pieza en el guion y 1 elemento en pantalla (36,9 s); estado Aprobado; sin sello |
| «INVITACIÓN 001 / salida pendiente.» | 0 piezas en el guion y 0 elementos en pantalla; ausente en la captura del plano 04 (18,3 s) |
| Plano 04 | Silueta, «Umbral cruzado» (15,00 a 16,41 s) y «TOMP» |
| Plano 07 | Cuatro láseres, baño de color por pulso, líneas de impacto, estrobo, «¡¡BOOOM!!» y «UNTZ», como en la 0.2.0 |
| Plano 08 | Pistola montada visible cuando entra el bocadillo |
| `node --check` de todos los `.js` y `.mjs` | Correcto |

### H.7 Qué está verificado y qué no

**Verificado** (comprobado directamente sobre el resultado):

- Las dos decisiones editoriales, en el guion y en pantalla.
- La frase del protagonista aparece una sola vez y no ha cambiado.
- Validador sin errores ni avisos; la secuencia llega a 45 s sin errores de consola.
- El plano 07 conserva todos sus efectos, y su aspecto coincide con el de la 0.2.0 salvo diferencias
  de suavizado en los bordes.
- El plano 07 dibuja menos: 4,4 teselas por fotograma frente a 13,3, y ninguna capa se repinta en
  todos los fotogramas. Es un recuento, no un tiempo, y no depende del equipo.

**Medido en entorno limitado** (sin tarjeta gráfica, pocas muestras, mucha variación):

- Los tiempos y los fotogramas por segundo de la tabla H.5.
- La mejora es clara en la prueba paso a paso y en el bucle del plano 07, y pequeña en la reproducción
  real de 27 a 35 s.
- Los parones de unos 2 s siguen presentes. Se atribuyen a la composición por software de este
  entorno, a partir de la traza; esa atribución no está contrastada en otro equipo.

**No comprobado:**

- Ningún equipo con tarjeta gráfica. No sé cuántos fotogramas por segundo da allí, ni antes ni
  después, ni si los parones desaparecen.
- Firefox, Safari y móvil. Solo se ha ejecutado en Chromium.
- Que la regresión que se vio en el entorno de pruebas quede resuelta en un equipo real.

### H.8 Pendiente

- Abrir la vista previa en un equipo con tarjeta gráfica y mirar el plano 07 (`?plano=7`). Es la
  comprobación que falta para cerrar el punto de rendimiento.
- Probar en Firefox, Safari y móvil.
- Aprobar o cambiar la grafía de las 10 onomatopeyas, que son los únicos borradores que quedan.
