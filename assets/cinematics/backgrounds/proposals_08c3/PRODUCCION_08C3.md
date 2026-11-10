# 08C3 · Tres propuestas de fondos para revisión

**Estado: criterios de aceptación NO alcanzados; revisión humana pendiente.** Son imágenes generadas como propuestas independientes, sin integrar en producción. Se usó BG04 seleccionado como referencia visual de las otras dos y la planta/vistas de 08C2.4 como guía, pero esto no garantiza geometría 3D compartida. No se autoriza ningún cambio en el juego por elegir imágenes en la comparación.

[Comparativa local](COMPARATIVA_08C3.html) · [Propuesta espacial 08C2.4](../../../../docs/CINEMATIC_STORYBOARD/FASE_08C24_GALERIA_PROPUESTA.html).

## Archivos y resolución real

Todos son PNG RGB opacos, sin compresión destructiva. Los tres primeros son resultados nativos seleccionados; no son 2560 × 1440 ni 16:9 exacto. Los tres últimos son **derivados interpolados, no maestros nativos**: recorte central a relación 16:9 exacta y ampliación Pillow Lanczos, sin síntesis de detalle ni garantía de calidad final. Se conservan los nativos sin modificar.

| Vista | Ruta nativa | Dimensiones nativas | Derivado 16:9 interpolado | Recorte L/T/R/B, píxeles | Factor |
|---|---|---:|---|---|---:|
| BG04 | `assets/cinematics/backgrounds/proposals_08c3/bg04_revelacion.png` | 1377 × 761 | `assets/cinematics/backgrounds/proposals_08c3/bg04_revelacion_2560x1440_lanczos.png` | 16 / 2 / 17 / 3; conserva 1344 × 756 | 1,90476× |
| BG05 | `assets/cinematics/backgrounds/proposals_08c3/bg05_nave.png` | 1672 × 941 | `assets/cinematics/backgrounds/proposals_08c3/bg05_nave_2560x1440_lanczos.png` | 4 / 2 / 4 / 3; conserva 1664 × 936 | 1,53846× |
| BG06 | `assets/cinematics/backgrounds/proposals_08c3/bg06_central.png` | 1376 × 768 | `assets/cinematics/backgrounds/proposals_08c3/bg06_central_2560x1440_lanczos.png` | 8 / 1 / 8 / 2; conserva 1360 × 765 | 1,88235× |

El procedimiento de ampliación disponible es interpolación Lanczos y recorte proporcional, no aumenta la información nativa ni acredita acabado de alta definición. Se optó por no deformar. Las propuestas no cuentan con separaciones de profundidad ni zonas ocultas: son imágenes planas, no capas de paralaje.

## Composición y continuidad observada

Las tres imágenes muestran una nave axial oscura, estructura de arcos, balcones, altavoces colgados y dos torres, un escenario con una escalera central, cabina y motivo romboidal cian, banda longitudinal y un aro pequeño integrado en el suelo. BG04 conserva una barandilla inferior próxima; BG05 muestra un encuadre más bajo y cercano, mientras BG06 vuelve a una composición elevada casi idéntica a BG04 pero sin esa barandilla. Los tres dejan suelo central libre sin introducir personajes generados. Se usó el BG04 elegido como referencia de imagen para BG05 y BG06, más la planta y vista respectivas de la galería 08C2.4; no son tres imágenes generadas sin referencia común.

**Diferencias y riesgos que impiden aceptar como final:**

- BG06 se parece demasiado a BG04: comparte prácticamente la misma perspectiva elevada y no ofrece el encuadre central más cercano previsto. BG05 parece más bajo y cercano, pero su altura y perspectiva tampoco están contrastadas con una cámara física ni con sprite oficial.
- Los altavoces suspendidos, columnas y sistemas de iluminación muestran diferencias de cantidad, módulo o colocación aparente; no se puede demostrar que sean el mismo espacio 3D. No hay modelo compartido que haya generado estas tres imágenes: son reinterpretaciones condicionadas por una referencia.
- Las tres imágenes siguen dominadas por arcos apuntados, candelabros y cortinajes; el resultado se aproxima a una catedral y carece de la materialidad industrial/art déco solicitada. La sala queda demasiado vacía para transmitir actividad; no se inventaron personas.
- El aro es pequeño y no parece una plataforma, pero su perspectiva, distancia a la escalera y proporciones no se han medido. La barra de la cabina, los escalones y el fondo deben compararse contra una planta y cámaras físicamente verificadas; sus cantidades y escala aparentes varían. El rombo no es logo oficial.
- Las luces sugieren fuentes pero su montaje físico no se demuestra. No se han probado ausencias de marcas de agua o texto mediante inspección automática; en la revisión visual no se observaron textos ni marcas evidentes. No se han probado sprite, logo, capas, overscan, GPU ni montaje con los diez planos.

En 08C2.4 el esquema incluye público lateral abstracto, estructura más industrial y una cámara BG06 más cercana y baja; aquí no hay personas generadas y esa perspectiva no se consiguió suficientemente. La planta anterior no se modificó. Recomendación: **no integrar ni declarar los tres finales**; revisión artística y nueva producción con geometría 3D común o un proceso con control de cámara antes de validar continuidad. No editar las imágenes para fingir que encajan.

## Auditoría y QA

La rama empezó limpia en `2808b75`, con PR #17 abierto y en borrador. Manifiesto: BG04/05/06 usan `rebuild_hall.png`, `rebuild_dancefloor.png`, `rebuild_hero.png` (PNG RGB 1376 × 768, `aspect_fill`); sus fallbacks históricos `cine_bg04_main_hall.png`, `cine_bg05_dancefloor.png`, `cine_bg06_hero.png` son PNG RGB 2560 × 1440. Los maestros 08C y variantes 08C1 inspeccionados son 1376 × 768. Los nuevos fondos no figuran en el manifiesto y no se han integrado.

La inspección humana del agente es visual y no equivale a aprobación de dirección. Las comprobaciones técnicas de formato/medidas, funcionamiento de la comparativa e integridad de recursos previos se detallan al final tras ejecutarlas. No hay certificación de calidad de producción, movimiento, geometría o rendimiento.

### Resultados ejecutados

Pillow decodificó los seis PNG RGB y confirmó las dimensiones de la tabla. Se comprobaron todos los enlaces locales de la comparativa; Chromium headless cargó y decodificó sus nueve imágenes tanto con JavaScript como sin él, sin errores de página, red ni HTTP; captura revisada visualmente. `python3 tools/qa/test_cinematic_08c22.py` pasó comprobando integridad de modelo, planta, alzados y referencias principales. Git inició limpio y no registra modificaciones de archivos previos rastreados: originales, propuestas anteriores y producción permanecen intactos. Estas pruebas no validan calidad, continuidad o integración.
