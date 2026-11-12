# PROJECT RESTART — Prueba visual y visor

- **Fecha:** 2026-11-12 · **Rama:** `arena/1a801cc0-deadbeat-disconew`
- **Estado:** prueba de dirección artística, **pendiente de tu evaluación**. No sustituye nada del juego.

## Cómo abrirla

1. Servidor estático en la raíz del repositorio: `python3 -m http.server 8080`
2. Abrir `http://localhost:8080/assets/cinematics/preview/art_direction_test.html`

## Composición

| Archivo | Qué es | Resolución |
|---|---|---|
| `assets/cinematics/restart/art_direction_test.png` | Composición completa, con logotipo | 1920 × 1080 |
| `assets/cinematics/restart/art_direction_test_plate.png` | La misma ilustración sin logotipo | 1920 × 1080 |
| `ART_ASSETS/rebuild_masters/R04_INICIO/art_direction_test_plate.webp` | Maestro sin recortar | 1536 × 1024 |

Cómo se hizo:

- **Ilustración:** generada con cuatro imágenes de referencia: el protagonista canónico (`assets/fase01/menu_backdrop_2k.webp` y `assets/characters/player_idle_00.png`) y las láminas B y C de `docs/RESTART/referencias/`. Elegiste la opción 1 de 2.
- **Encuadre:** el maestro es 3:2. Se recortó la franja inferior para llevarlo a 16:9 y se amplió un 25 % hasta 1920 × 1080.
- **Logotipo:** no lo dibuja el generador. Es el archivo aprobado `assets/logos/logo_deadbeat_graffiti.png`, superpuesto sin modificar, con una sombra suave y un halo magenta detrás.

## Visor

`assets/cinematics/preview/art_direction_test.html` — un solo archivo HTML, sin dependencias. Carga las imágenes por ruta relativa.

| Control | Ratón | Teclado |
|---|---|---|
| Ampliar / reducir | Botones `+` `−`, rueda | `+` `−` |
| Ajustar a la ventana | `AJUSTAR`, doble clic | `0` |
| Tamaño real | `100 %`, doble clic | `1` |
| Mover la imagen ampliada | Arrastrar | Flechas |
| Con o sin logotipo | `LOGOTIPO` | `L` |
| Ocultar la imagen (solo fondo oscuro) | `SOLO FONDO` | `F` |
| Abrir el archivo original | `ABRIR ORIGINAL` | — |

El pie muestra archivo, ruta, resolución original, escala actual y estado de carga. Si la imagen no existe, aparece un mensaje con la ruta que falló.

## Pruebas

Script: `tools/qa/test_art_direction_viewer.js`. Ejecutado en Chromium 153 sin cabeza. Resultado: **26 de 26 superadas** (`evidencia_visor/qa_visor.json`).

| Comprobación | Resultado |
|---|---|
| La página carga y la imagen aparece completa | Superada |
| Sin errores de rutas ni de JavaScript | Superada (0 errores) |
| Proporción 16:9 conservada, ajustada y ampliada | Superada |
| Zoom con botones, 100 % y rueda | Superada |
| Ajuste a pantalla | Superada |
| Desplazamiento con ratón y flechas, sin sacar la imagen del lienzo | Superada |
| Sin recorte a 1280×720, 1366×768, 1920×1080, 2560×1440 y 3440×1440 | Superada |
| Alternar logotipo, solo fondo, abrir original | Superada |
| Mensaje claro si falta el recurso | Superada |
| El visor no carga el juego | Superada |
| El juego original sigue arrancando (carga → intro → Refugio) | Superada (0 errores) |

No probado: pantallas táctiles y navegadores distintos de Chromium.

## Observaciones sobre la imagen

- El abrigo tiene cuello alto y solapas, más cercano a una cazadora larga que al chaleco de los sprites.
- El pelo bajo el sombrero cae más largo y liso que las puntas del sprite.
- Los tatuajes son calaveras y rosas; no se lee la «partitura incompleta» del lore.
- El zorro aparece en la solapa, no en la espalda (que no se ve en este encuadre).
- La multitud de ojos encendidos ocupa solo la esquina inferior izquierda.
