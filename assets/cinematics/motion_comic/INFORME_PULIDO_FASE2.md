# Informe de producción · Fase de pulido artístico y narrativo

Motion comic de la introducción de DEADBEAT DISCO, versión **0.2.0-preview**.
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

- **Aprobar o cambiar «Traigo percusión.»** y la grafía de las onomatopeyas.
- **«INVITACIÓN 001 / salida pendiente.»** pertenece en el juego al Círculo I (Limbo). Aquí se usa en
  el umbral del club. Si ese texto debe reservarse para el Limbo, basta con desactivar la pieza
  `p04_rotulo_invitacion`.
- **Fluidez.** Sigue sin medirse en un equipo con tarjeta gráfica. En el entorno de pruebas, que no la
  tiene, el plano 07 va algo más lento que antes (entre 7 y 8 fotogramas por segundo frente a entre 9
  y 11, con pocas muestras y mucha variación). `?ligero=1` quita el baño de color además de las tramas.
- No se ha probado en Firefox, Safari ni en móvil.
