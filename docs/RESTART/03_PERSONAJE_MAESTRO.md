# PROJECT RESTART — Modelo maestro del protagonista

- **Fecha:** 2026-11-12 · **Rama:** `arena/1a801cc0-deadbeat-disconew`
- **Estado:** la lámina aprobada queda archivada como modelo maestro. No se ha tocado el juego, los sprites, el lore ni el logotipo.

## Qué manda a partir de ahora

La lámina `protagonist_master_approved.png` es la especificación visual del protagonista. **Para producir cualquier ilustración futura se usa la lámina original, no la reproducción**: la reproducción tiene menos resolución y pequeñas desviaciones (ver más abajo).

## Archivos

Carpeta: `assets/cinematics/restart/character_master/`

| Archivo | Qué es | Resolución |
|---|---|---|
| `protagonist_master_approved.png` | **Lámina maestra aprobada.** Copia byte a byte del archivo recibido (SHA-256 `43d9e58f…004e5d`). | 1672 × 941 |
| `protagonist_master_reproduction.png` | Reproducción de Arena, sin retocar | 1376 × 768 |
| `protagonist_master_crop_hero.png` | Recorte de la maestra: ilustración principal | 800 × 941 |
| `protagonist_master_crop_face.png` | Recorte de la maestra: rostro, pelo y sombrero | 390 × 280 |
| `protagonist_master_crop_arm_tattoos.png` | Recorte de la maestra: brazo tatuado | 280 × 630 |
| `protagonist_master_crop_turnaround.png` | Recorte de la maestra: cinco vistas | 856 × 415 |
| `protagonist_master_crop_tattoo_details.png` | Recorte de la maestra: cinco detalles de tatuaje | 856 × 390 |

Maestro de la reproducción: `ART_ASSETS/rebuild_masters/R04_INICIO/protagonist_master_reproduction.webp`.

Los recortes son píxeles de la lámina original sin modificar. Sirven como imagen de referencia al generar retratos, vistas, sprites y planos de cinemática.

## Ficha del diseño (leída de la lámina)

| Elemento | Descripción |
|---|---|
| Sombrero | Ala ancha, oscuro, cinta magenta, salpicaduras amarillas y cian |
| Pelo | Oscuro, despeinado, mechones en punta con reflejos magenta que asoman bajo el ala |
| Rostro | Un ojo en sombra, el otro ámbar encendido; barba de dos días; media sonrisa; dilatación en la oreja |
| Torso | Camiseta blanca de tirantes; chaleco negro abierto sin mangas, solapa con ribete magenta, zorro magenta con goteo en el pecho |
| Espalda | Emblema magenta de corona con tridente (vista trasera) |
| Piernas | Pantalón cargo negro con vivos magenta, cadena de cartera, botas militares |
| Accesorios | Dos cadenas al cuello con placa, cinturón de hebilla, muñequeras |
| Tatuaje 1 | **Ankh** negro en el lateral del cuello |
| Tatuaje 2 | **Sigilo geométrico** en el hombro: estrella dentro de un círculo, rodeado de formas orgánicas |
| Tatuaje 3 | **Lobo** aullando en la parte alta del antebrazo, con rombos y cuatro aros debajo |
| Tatuaje 4 | **Patrón orgánico** de volutas en el antebrazo |
| Tatuaje 5 | **Sigilo circular** con estrella en el dorso de la mano; marcas pequeñas en los dedos |

## Informe de diferencias: reproducción frente a maestra

Comparación hecha superponiendo ambas y ampliando por zonas. Pares lado a lado en `docs/RESTART/evidencia_personaje/`.

**La reproducción no es idéntica.** Es muy cercana en diseño, pero inferior como archivo.

| Aspecto | Resultado |
|---|---|
| Resolución | **Menor que la original:** 1376 × 768 frente a 1672 × 941. No se ha conseguido una reproducción de más resolución. |
| Proporción | 1,792 frente a 1,777. La lámina queda un 0,8 % más ancha. |
| Composición | Igual distribución de paneles. El personaje principal está algo más alto: **la copa del sombrero queda cortada por el borde superior.** |
| Silueta y anatomía | Coinciden. Hombro y antebrazo ligeramente más anchos. |
| Rostro | Mismos rasgos y expresión. El ojo ámbar es algo más pequeño y la mandíbula un poco más redondeada. |
| Pelo | Mismo peinado; los mechones difieren en forma y número. |
| Sombrero | Mismo diseño; menos salpicadura amarilla en el ala. |
| Vestuario | Coincide: chaleco, camiseta, zorro, cinturón, cadena. |
| Tatuajes | Los cinco motivos están en su sitio y orientación. Falta el **pequeño acento rojo** dentro del sigilo del hombro; el trazo fino del lobo y del sigilo es más blando. |
| Accesorios | Coinciden. |
| Paleta | Color medio prácticamente igual (maestra 86/39/65, reproducción 84/39/63). |
| Iluminación | Coincide. |
| Texturas | Más suaves; se pierde parte del grano de tinta. |
| Vistas del personaje | Las cinco, con sus rótulos. Detalles menores distintos en cadenas y pliegues. |
| Textos | Todos los rótulos correctos. |
| Diferencia media por píxel | 20–33 sobre 255 según canal, tras igualar tamaños. Incluye el desplazamiento de encuadre. |

## Conflictos con la documentación vigente

No se ha modificado ningún documento de canon. Quedan anotados para tu decisión:

1. **Tatuajes y lore.** La biblia (§4.1) dice que los tatuajes del Desafinado «parecen una partitura incompleta». La lámina aprobada los sustituye por ankh, sigilos, lobo y patrón orgánico. El texto del lore y el diseño ya no coinciden.
2. **Sprites del juego.** Los 22 sprites muestran al personaje sin sombrero, con pelo negro sin reflejos, pantalón recto y tatuajes distintos. Mientras no se rehagan, el personaje del Refugio no coincide con la lámina.
3. **V1 y V2 de la composición.** Ninguna usa este diseño (V2 lleva la partitura). Quedan como histórico de la exploración.
4. **Título de la lámina.** El rótulo «DEADBEAT DISCO» de la lámina es un trazo de pincel distinto del logotipo aprobado (`logo_deadbeat_graffiti.png`). El logotipo del proyecto no cambia.

## Visor

`assets/cinematics/preview/art_direction_test.html` abre ahora en **PERSONAJE**.

| Control | Qué hace | Tecla |
|---|---|---|
| `COMPOSICIÓN` / `PERSONAJE` | Cambia entre la comparación V1–V2 y la lámina del personaje | `C` |
| `MAESTRA` / `REPRODUCCIÓN` | Alterna original y reproducción con el mismo encuadre en pantalla | `V` |
| `ROSTRO` | Amplía rostro, pelo y sombrero | `2` |
| `TATUAJES` | Amplía el brazo de la ilustración principal | `3` |
| `DETALLES` | Amplía el panel de detalles de tatuajes | `4` |
| `VISTAS` | Amplía las cinco vistas | `5` |

El resto (zoom, ajustar, 100 %, arrastrar, solo fondo, abrir original, datos del pie) funciona igual. Para abrir directamente la comparación V1–V2: añadir `?ver=composicion` a la dirección.

## Pruebas

`tools/qa/test_art_direction_viewer.js`, Chromium 153 sin cabeza: **45 de 45 superadas** (`evidencia_visor/qa_visor.json`).

- Las 32 anteriores de la comparación V1–V2 siguen pasando.
- 13 nuevas del personaje: carga de maestra y reproducción con sus resoluciones, los cuatro encuadres de detalle con la misma posición en ambas, vuelta a lámina completa, cambio de conjunto, y comprobación de que la maestra servida es el archivo original byte a byte.
- El juego original arranca (carga → intro → Refugio) sin errores.

Capturas del visor: `evidencia_visor/personaje_*.jpg`.
