# Manifiesto de arte nuevo · motion comic 0.3.1

**Nada de esta carpeta es arte oficial del juego.** Son ilustraciones creadas para la versión
0.3.1-preview de la introducción con una herramienta de generación de imagen por IA, dentro de la
sesión de trabajo. Están pendientes de aprobación de dirección de arte.

- No sustituyen ni modifican ningún archivo original: el arte del juego sigue intacto en
  `assets/cinematics/`, `assets/characters/`, `assets/enemies/`, `assets/environments/` y `assets/ui/`.
- En la vista previa, cada plano que usa algo de esta carpeta lleva el sello azul
  **«ARTE NUEVO · SIN APROBAR»**. El validador da error si un plano usa un recurso nuevo sin sello o si
  un recurso nuevo no figura en este manifiesto.
- `generado/` guarda la salida de la herramienta tal cual, sin retocar. Los archivos de esta carpeta
  son los que usa el motion comic.

## Recursos

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

## Revisión hecha

Se miraron las cinco imágenes una a una antes de integrarlas. Ninguna contiene texto, logotipos, el
rostro del anfitrión, a Tempo ni al protagonista.

## Lo que queda por decidir

1. **Aprobación de estilo.** La estación tiene un acabado de ilustración con línea, más limpio que el
   pixel art de los fondos oficiales. Convive bien dentro de la viñeta de cómic, pero es una decisión
   de dirección de arte.
2. **Resolución.** La estación y el pozo están ampliados. Si se aprueban como diseño, conviene
   redibujarlos o regenerarlos al tamaño final.
3. **Sustitución.** Si dirección encarga ilustraciones definitivas, basta con cambiar `src` en
   `data/composicion.json` (generado por la herramienta de composición), quitar `"nuevo": true` y
   retirar el sello del plano.
