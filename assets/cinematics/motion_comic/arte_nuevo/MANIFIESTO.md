# Manifiesto de arte nuevo · motion comic 0.3.1 y 0.5.0

**Nada de esta carpeta es arte oficial del juego.** Son ilustraciones creadas para las versiones
0.3.1-preview y 0.5.0-preview de la introducción con una herramienta de generación de imagen por IA,
dentro de la sesión de trabajo. Están pendientes de aprobación de dirección de arte. **Ninguna ha
sido revisada ni aprobada por dirección.**

Las tres ilustraciones de la 0.5.0 se generaron después de presentar el inventario de recursos y con
autorización expresa de dirección para generar esas tres (opción «Sí: 3 imágenes»). Esa autorización
fue para generarlas y probarlas en el montaje, no una aprobación del resultado.

- No sustituyen ni modifican ningún archivo original: el arte del juego sigue intacto en
  `assets/cinematics/`, `assets/characters/`, `assets/enemies/`, `assets/environments/` y `assets/ui/`.
- En la vista previa, cada plano que usa algo de esta carpeta lleva el sello azul
  **«ARTE NUEVO · SIN APROBAR»**. El validador da error si un plano usa un recurso nuevo sin sello o si
  un recurso nuevo no figura en este manifiesto.
- `generado/` guarda la salida de la herramienta tal cual, sin retocar. Los archivos de esta carpeta
  son los que usa el motion comic.

## Recursos de la 0.5.0

La columna «Planos» de esta tabla se refiere a la numeración de la 0.5.0.

| Archivo | Tamaño real | Qué es | Origen y tratamiento | Planos (0.5.0) | Estado |
|---|---|---|---|---|---|
| `ciudad_antes_de_la_noche.png` | 2560×1440 | La ciudad antes de la transformación: ciudad industrial europea de noche, fábricas y chimeneas, casas de ladrillo, viaducto con un tren de vapor, calle empedrada con farolas y, en el centro, la estación de hierro y cristal con torre de reloj, iluminada por dentro y con guirnaldas | Generada a 1376×768 (`generado/ciudad_antes_generado.png`) dando como referencia de composición el fondo oficial `cine_bg01_city.png` y, de estilo, `estacion_primera_noche.png`. Recortada a 16:9 y **ampliada a 2560×1440 por remuestreo Lanczos con un enfoque suave**. No es un dibujo nativo a ese tamaño | 01, 11, 12 | Nueva, sin aprobar. No existía ningún dibujo de la ciudad antes del cambio |
| `estacion_fachada.png` | 2560×1440 | La entrada de la estación desde la calle, de frente: ladrillo y hierro remachado, puerta doble con montante de cristal, reloj sobre la puerta, dos ventanales, farolas, guirnaldas y banderines, carteles, un carro de equipajes. Tras el cristal de la puerta se ven sombras de dos parejas bailando | Generada a 1376×768 (`generado/estacion_fachada_generado.png`) dando como referencia de composición el fondo oficial `cine_bg02_club_exterior.png`: puerta, ventanales y columnas están en el mismo sitio, para que el antes y el después encajen. Mismo tratamiento de ampliación | 02, 10 | Nueva, sin aprobar. No existía ningún dibujo de la estación por fuera |
| `corazon_torre.png` | 2560×1440 | El interior de la torre visto desde arriba, en vertical: anillos concéntricos de niveles con arcos góticos y columnas de hierro, cada uno con una luz de un color, pasarelas y escaleras que cruzan el hueco, y un punto negro en el centro. No se ve el fondo | Generada a 1376×768 (`generado/corazon_torre_generado.png`) dando como referencia de estilo `pozo_torre.png` y el fondo oficial `cine_bg03_entrance.png`. Mismo tratamiento de ampliación | 16 | Nueva, sin aprobar. No existía ninguna vista de la torre por dentro mirando hacia abajo |

## Recursos de la 0.3.1

La columna «Planos» de esta tabla conserva la numeración de la 0.3.1. En la 0.5.0 estos recursos se
usan en los planos 03, 04, 05, 06, 08 y 09 (estación), 05 (anfitrión), 03, 04, 05, 08 y 09
(invitados), 07 y 08 (tocadiscos) y 15 (pozo).

| Archivo | Tamaño real | Qué es | Origen y tratamiento | Planos | Estado |
|---|---|---|---|---|---|
| `estacion_primera_noche.png` | 2560×1440 | Estación de tren europea convertida en sala de baile: arcos y columnas de hierro, bóveda de cristal, reloj, vagón en el andén, vías, guirnaldas, mesas con velas, parejas y soldados bailando, templete con gramófono | Generada a 1376×768 (`generado/estacion_primera_noche_generado.png`). Recortada a 16:9 (1365×768) y **ampliada a 2560×1440 por remuestreo Lanczos con un enfoque suave**. No es un dibujo nativo a 2560×1440 | 01, 02, 03, 04, 05, 07 | Nueva, sin aprobar. Sustituye a `cine_circle_08_traicion.png` virado a ámbar |
| `anfitrion_contraluz.png` | 463×1255, con transparencia | El anfitrión: figura propia, de espaldas, con frac, brazo derecho en alto con una copa. Sin rostro | Generada en negro sobre blanco (`generado/anfitrion_contraluz_generado.png`); el blanco se pasó a transparencia y se recortó al contorno. Se usa solo como silueta | 02 | Nueva, sin aprobar. Sustituye a la silueta del NPC de la barra |
| `invitados_pareja_a.png` | 324×541, con transparencia | Pareja bailando agarrada | Recortada de `generado/invitados_siluetas_generado.png` (cuatro grupos en negro sobre blanco); blanco a transparencia | 01, 02, 05, 07 | Nueva, sin aprobar |
| `invitados_pareja_b.png` | 390×553, con transparencia | Pareja en un giro | Igual | 01, 05, 07 | Nueva, sin aprobar |
| `invitado_soldado.png` | 274×583, con transparencia | Soldado con gorra de cuartel que brinda | Igual | 01, 02, 05, 07 | Nueva, sin aprobar |
| `invitada_copa.png` | 221×540, con transparencia | Invitada con vestido largo y copa | Igual | 01, 02, 05, 07 | Nueva, sin aprobar |
| `tocadiscos_tempo.png` | 1024×1024 | Primer plano del tocadiscos visto desde arriba: plato, disco con etiqueta ámbar sin letras, brazo de latón con la aguja sobre los surcos, mueble de madera con mandos y flexo | Salida de la herramienta sin retocar (movida desde `generado/`) | 06, 07 | Nueva, sin aprobar. Sustituye al disco vectorial de la 0.3.0 |
| `pozo_torre.png` | 768×1376 | Corte vertical del pozo de la torre: hueco central con dos carriles, balcones góticos a ambos lados con una luz distinta por nivel, dos pasarelas, niebla | Salida de la herramienta sin retocar (movida desde `generado/`). En pantalla se amplía 2,6 veces | 10 | Nueva, sin aprobar. No existía ningún dibujo del pozo |

## Indicaciones que se dieron a la herramienta (resumen)

Resumen de lo que se pidió; no se conserva el texto exacto de cada petición.

- **Estación:** interior de una gran estación europea de principios del siglo XX reconvertida en sala
  de baile para celebrar el final de una guerra; bóveda de cristal, columnas de hierro, andenes y
  vías, luz cálida de celebración, mesas, decoración, invitados; profundidad cinematográfica, 16:9,
  tomando como referencia de estilo las ilustraciones oficiales `cine_circle_00_hub.png` y
  `cine_circle_01_lujuria.png`. El resultado no tiene neones ni elementos de discoteca.
- **Anfitrión:** silueta negra plana sobre blanco, de espaldas, traje de etiqueta, copa en alto, sin
  rostro ni rasgos.
- **Invitados:** cuatro siluetas negras planas sobre blanco, de época: dos parejas de baile, un
  soldado, una invitada.
- **Tocadiscos:** vista cenital, plato, disco, brazo y aguja; latón y madera; etiqueta sin texto.
- **Pozo:** corte vertical 9:16 de una torre gótica por dentro, hueco central vacío con carriles,
  balcones y pasarelas, una luz de color distinta por nivel.

Indicaciones de la 0.5.0 (resumen):

- **Ciudad de antes:** redibujar el fondo oficial de la ciudad como el mismo lugar antes del cambio,
  con la misma cámara y el mismo viaducto, barandilla y pilar; ciudad industrial europea de finales
  de los años cuarenta, recién terminada una guerra; sin neón, sin rosa, sin calaveras ni agujas
  góticas; en el centro, una estación de hierro y cristal con torre de reloj, iluminada y con
  guirnaldas; paleta sepia, hollín, azul noche y ámbar; sin personas, texto ni marcos.
- **Fachada:** redibujar el fondo oficial de la fachada del club como el mismo edificio antes del
  cambio, con la misma cámara frontal y la misma simetría; ladrillo y hierro, reloj donde está el
  escudo, farolas donde están las estatuas, guirnaldas y banderines; luz ámbar de la fiesta por los
  cristales, con sombras de parejas; sin neón ni adornos góticos.
- **Corazón de la torre:** vista en vertical hacia abajo del interior de una torre gótica e industrial
  que no termina; anillos de niveles con arcos, columnas de hierro, balcones y pasarelas; una luz de
  color distinta por nivel; un punto negro en el centro; sin personajes, criaturas, rostros ni ojos.

## Revisión hecha

0.3.1: se miraron las cinco imágenes una a una antes de integrarlas. Ninguna contiene texto,
logotipos, el rostro del anfitrión, a Tempo ni al protagonista.

0.5.0: se miraron las tres imágenes una a una antes de integrarlas.

- Ninguna contiene logotipos, criaturas, rostros, a Tempo, al protagonista, el Refugio ni el HUB.
- La **fachada** tiene carteles con garabatos que imitan letras; no forman palabras legibles, pero a
  tamaño grande se nota que no son texto de verdad. Tiene también un rótulo de madera vacío.
- La **ciudad de antes** no conserva exactamente la composición del fondo oficial: mantiene el pilar
  de la izquierda, el viaducto con el tren y la barandilla, pero el puente del fondo y las casas de
  la derecha son distintos. Por eso el paso de una a otra se hace con un círculo que crece y no con
  un fundido.
- El **corazón de la torre** tiene un acabado de línea limpia, más cercano al del pozo que al pixel
  art de los fondos oficiales.

## Lo que queda por decidir

1. **Aprobación de estilo.** La estación tiene un acabado de ilustración con línea, más limpio que el
   pixel art de los fondos oficiales. Convive bien dentro de la viñeta de cómic, pero es una decisión
   de dirección de arte.
2. **Resolución.** La estación, el pozo y las tres ilustraciones de la 0.5.0 están ampliados. Si se aprueban como diseño, conviene
   redibujarlos o regenerarlos al tamaño final.
3. **Sustitución.** Si dirección encarga ilustraciones definitivas, basta con cambiar `src` en
   `data/composicion.json` (generado por la herramienta de composición), quitar `"nuevo": true` y
   retirar el sello del plano.
4. **La ciudad (0.5.0).** La biblia no describe ninguna ciudad. Aprobar `ciudad_antes_de_la_noche.png`
   y `estacion_fachada.png` es aprobar también cómo era el lugar antes de la Primera Noche: es una
   decisión de dirección narrativa, no solo de arte.
