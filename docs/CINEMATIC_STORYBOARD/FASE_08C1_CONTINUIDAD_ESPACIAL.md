# Fase 08C.1 — Continuidad espacial y dirección artística

**Estado: propuestas revisadas, provisionales y pendientes de aprobación; no son recursos definitivos ni están integradas.** [Galería comparativa](FASE_08C1_GALERIA_CONTINUIDAD.html) · [Informe 08C](FASE_08C_DIRECCION_ARTISTICA_Y_FONDOS.md) · [Galería 08C](FASE_08C_GALERIA_COMPARATIVA.html).

Se consultaron los seis maestros de 08C, su informe y la galería. Se realizaron ediciones generadas por IA de BG01, BG02, BG03, BG05 y BG06 usando sus imágenes 08C como base; BG04 se preserva sin cambios como ancla. Los seis PNG anteriores, sus manifiestos y todos los originales permanecen intactos. Cada versión nueva se guarda en `assets/cinematics/backgrounds/continuity_08c1/`, separada de las anteriores; `manifest.json` de esa carpeta es un índice de revisión **no conectado al juego**. No se modificaron motor, controlador, HUB, sprites ni manifiesto de producción.

## Guía espacial: nave de BG04

**Esto es una guía de diseño derivada de la imagen, no un plano medido ni canon aprobado.** BG04 es una vista elevada desde la parte posterior de una gran nave mirando hacia el escenario en el extremo opuesto:

```text
            CABECERA DE LA NAVE / fondo de imagen
     [altavoces]    estructura angular cian     [altavoces]
                  escenario elevado / escalera
  balcones  ───── pista y eje visual ───── balcones
       barandilla elevada / cámara BG04 (parte posterior)
```

- **Arquitectura:** eje de simetría longitudinal, bóvedas de nervios apuntados, columnas de piedra oscura y elementos metálicos envejecidos. Arcos laterales, cortinas burdeos y candelabros cálidos; debe equilibrarse el carácter eclesiástico con el industrial/art déco.
- **Escenario y cabina:** escenario centrado elevado con escalera frontal; detrás, estructura luminosa cian de líneas angulares. La cabina no se lee con nitidez en BG04; su ubicación centrada frente a esa estructura es una propuesta de continuidad, pendiente de aprobación, no geometría demostrada.
- **Público y escala:** BG04 lo muestra pequeño en el nivel inferior. BG05 aproxima esa altura a una cámara al nivel de pista; no debe interpretarse el tamaño de una figura como medición física ya calibrada.
- **Balcones:** una galería elevada recorre ambos lados de la nave y una barandilla cercana enmarca la cámara de BG04; las alturas no se han medido ni se conoce el empalme real con el HUB.
- **Altavoces:** stacks junto al escenario y arreglos colgados a los lados; sus módulos, cantidad y anclajes deben corresponder entre planos. **Luces:** haces cian y magenta cruzados, neblina en profundidad y acentos cálidos dorados; materiales oscuros de metal, piedra y bronce. No se han separado como capas.
- **Suelo:** BG04 presenta un dibujo alargado complejo, no un círculo inequívocamente idéntico al de BG05/BG06. El círculo de esas vistas es decoración arquitectónica fija, no plataforma ni mecanismo de descenso. Hay que diseñar una retícula compartida antes de dar continuidad exacta por resuelta.

## Revisión de los seis escenarios

| Escena | Recurso seleccionado para revisión | Medidas verificadas | Modificación y observaciones |
|---|---|---|---|
| BG01 · Ciudad | `assets/cinematics/backgrounds/continuity_08c1/scene_01_city.png` | PNG 1376×768, RGB opaco; 2614608 B | Ciudad: edificio central ajustado con portal y rosetón más cercanos a BG02; se elimina la esfera planetaria, se conserva la luna creciente y los trenes. El club ahora ocupa más encuadre y queda cortado arriba, por lo que se perdió parte de la panorámica anterior; siguen presentes trenes y cielo: su lectura canónica y la escala requieren aprobación. |
| BG02 · Fachada | `assets/cinematics/backgrounds/continuity_08c1/scene_02_exterior.png` | PNG 1376×768, RGB opaco; 2560959 B | Se sustituyeron las estatuas, gárgolas y zorro por metal geométrico, altavoces y portal en profundidad. El rosetón y la fachada siguen siendo muy catedralicios; la entrada al fondo no reproduce exactamente el corredor de BG03. |
| BG03 · Entrada | `assets/cinematics/backgrounds/continuity_08c1/scene_03_entrance.png` | PNG 1376×768, RGB opaco; 2553328 B | Se conservó el corredor y se añadió al fondo un escenario cian angular con escaleras y estructuras metálicas; la entrada sugiere la nave de BG04. La transición del corredor hacia una nave de mayor anchura no está geométricamente probada y falta señal física REFUGIO. |
| BG04 · Nave principal | `assets/cinematics/backgrounds/definitive/scene_04_main_hall/master.png` | PNG 1376×768, RGB opaco; 2755468 B | Imagen 08C conservada sin cambios: referencia espacial. La cabina no se distingue con claridad en la vista elevada, y el motivo de suelo longitudinal no es idéntico al círculo de BG05/BG06. |
| BG05 · Pista | `assets/cinematics/backgrounds/continuity_08c1/scene_05_dancefloor.png` | PNG 1376×768, RGB opaco; 2583693 B | Se sustituyó el zorro por una estructura cian angular y cabina central, se introdujeron torres y luces relacionados con BG04 y público a menor escala. El público forma hileras visualmente repetitivas; la correspondencia de escalones, cabina, público y geometría del suelo con BG04 sigue aproximada. |
| BG06 · Protagonista | `assets/cinematics/backgrounds/continuity_08c1/scene_06_hero.png` | PNG 1376×768, RGB opaco; 2510329 B | Se retiraron rosetón dominante y calaveras y se reemplazaron con el escenario angular cian; existe zona inferior libre para el protagonista y zona oscura arriba para el logo. El DJ y el público visibles en BG05 no aparecen en BG06, y las formas y tamaños del fondo no son proyecciones exactas. No se dibujó protagonista. |

## Evaluación de continuidad

- **BG01 → BG02:** el edificio central incorpora un rosetón y portal relacionados con la fachada, pero la perspectiva de BG01 no permite demostrar que cada torre y acceso coincidan. La ciudad incluye trenes y cielo; el personaje no aparece y no se narra que venga de fuera. La interpretación y composición siguen pendientes de aprobación canónica.
- **BG02 → BG03:** el portal muestra un corredor, y BG03 muestra un corredor de arcos y estructuras industriales. No se han proyectado las posiciones para demostrar que se trata exactamente del mismo tramo; BG02 tiene un final azul profundo que no coincide inequívocamente con el escenario visible en BG03.
- **BG03 → BG04:** se introduce en el corredor la figura angular cian del escenario, pero puede parecer demasiado cercana o directamente alineada con el corredor; no se ha modelado el cambio de anchura, la entrada a pista ni la distancia de cámara.
- **BG04 → BG05/BG06:** se elimina el zorro no oficial y el rosetón con calaveras, y se repiten estructura cian, escaleras, altavoces, arcos y cortinas. La forma del escenario, los haces, la multitud y la pista siguen variando; BG06 no muestra el DJ/público de BG05. No se ha probado correspondencia geométrica ni movimientos de cámara entre planos.
- **Protagonista/logo:** BG06 reserva zonas libres, pero no se ha hecho una prueba de composición con los sprites y logo oficiales; la legibilidad, escala y posibles oclusiones permanecen pendientes. No se ha generado ningún protagonista.

## Resolución, capas y aprobación

Las cinco imágenes editadas y la referencia BG04 son PNG RGB opacos **1376×768**; no son 2560×1440. No se ha hecho interpolación ni se afirma calidad nativa superior. Todos los recursos siguen **PROVISIONALES / PENDIENTES DE APROBACIÓN ARTÍSTICA**. Son imágenes planas; **no hay capas auténticas nuevas** ni se han generado recortes o transparencias ficticias. La ausencia de alfa en RGB descarta bordes transparentes del maestro, pero no certifica geometría, cobertura para cámara o limpieza de detalles.

Pendiente: aprobación de la dirección, emblemas y canon; fijar un plano común de suelo, escala, escenario, posición del DJ, continuidad del público y cámaras; revisar repetición de personajes; resolver señal REFUGIO, anomalía, capas auténticas, overscan y versiones nativas de 2560×1440 o más. La posible relación con el descenso se diseñará después; no hay plataforma funcional ni animación de descenso nueva.

## Verificación

- Comparación visual de los seis maestros 08C y de las cinco ediciones, con BG04 como referencia; la revisión humana de dirección continúa pendiente.
- Se registraron rutas, medidas, modo, tamaño y SHA-256 en `assets/cinematics/backgrounds/continuity_08c1/manifest.json`. El índice guarda `layers: []` y referencia BG04 sin copiarla.
- `tools/qa/test_cinematic_08c1_gallery.mjs`: Chromium headless/SwiftShader a 1600×900 decodificó las 12 imágenes de la galería, confirmó contenedores iguales por fila y no registró errores de página. Comprobó tamaño y SHA-256 de los seis recursos seleccionados; Pillow también decodificó los seis como PNG RGB 1376×768. BG04 usa el mismo archivo en ambas columnas, explícitamente rotulado como referencia conservada. Esta prueba no valida la continuidad artística.
- Sin cambios en recursos de producción ni prueba de ejecución en juego; las imágenes no se han integrado en la cinemática. Fase 08 permanece abierta y el PR #17 no se ha fusionado.
