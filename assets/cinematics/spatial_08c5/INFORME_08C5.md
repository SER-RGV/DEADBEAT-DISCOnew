# 08C5 · Modelo espacial compartido

**Resultado: continuidad geométrica interna demostrada; acabado artístico pendiente.** Los tres PNG se renderizaron desde una misma escena 3D, con los mismos objetos, materiales y luces; únicamente se cambió la cámara. Es una propuesta independiente y un blockout iluminado, no un fondo final ni una validación de los PNG de 08C4. [Comparativa](COMPARATIVA_08C5.html).

## Archivos y reproducción

Todos en `assets/cinematics/spatial_08c5/`:

- `scene.js`: **fuente autoritativa editable** de la escena, geometría, materiales, luces y cámaras; `ESCENA_08C5.html` abre las tres vistas y guarda PNG nativos.
- `club_08c5.glb`: modelo 3D editable exportado con geometría, materiales, luces puntuales y tres cámaras; importable por editores compatibles con glTF 2.0. El GLB no conserva la luz hemisférica, niebla, configuración de exposición/tono ni el mismo motor de render: no promete reproducir exactamente los PNG. Usar la escena web para reproducción fiel.
- `PLANTA_08C5.svg`: planta proporcional de la geometría y posiciones de cámara; no es un plano medido del juego.
- `bg04.png`, `bg05.png`, `bg06.png`: renders **PNG RGBA 2560 × 1440**, alfa completamente opaco, generados directamente por WebGL a esa resolución; sin escalado interpolado.
- `COMPARATIVA_08C5.html`: comparación local de renders y planta; `package.json` y `package-lock.json`: dependencia reproducible de Three.js 0.170.0.

Para abrir y renderizar de nuevo, desde la raíz del repositorio:

```sh
cd assets/cinematics/spatial_08c5
npm ci
python3 -m http.server 8015 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8015/ESCENA_08C5.html` en un navegador con WebGL, seleccionar cada cámara y pulsar **Guardar PNG nativo 2560 × 1440**. El servidor solo distribuye archivos locales; no se necesitan servicios externos tras instalar Three.js. Para revisar en el entorno de vista previa remota, enlazar el servidor a `0.0.0.0` y usar la URL de la vista previa, no localhost del navegador remoto. Al editar `scene.js`, recargar y guardar cada vista; el GLB es una exportación estática anterior y no se actualiza automáticamente. Distintos navegadores/GPU pueden producir pequeñas diferencias de rasterización.

## Geometría y cámaras

Coordenadas Three.js: X transversal, Y vertical, Z negativo hacia escenario; unidades de diseño, no metros del juego. Sala 28 × 36, pista 17 × 29 en y≈0; banda en x=±4,3 y un aro horizontal único centrado en (x=0,z=1), radio 2,25. Suelo continuo: aro como inlay decorativo, no apertura, mecanismo ni descenso. Escenario centrado en z=−14, 16 × 6, altura 1,3; cabina en z=−15; una escalera central entre pista y escenario; dos torres sobre escenario. Dos balcones laterales y dos pasarelas transversales elevadas con barandas, cerchas, soportes, altavoces suspendidos, columnas y racks son objetos 3D compartidos. Hay escaleras laterales de acceso a balcones. Materiales procedurales oscuros, metálicos y dorados; paneles de cristal estilizados y luces cian, magenta, violeta y ámbar. Los valores son una nueva propuesta inspirada por 08C4, no cambios al modelo anterior ni mediciones verificadas.

| Cámara | Posición (x,y,z) | Objetivo (x,y,z) | FOV vertical | Función |
|---|---|---|---|---|
| BG04 | (−8, 3, 14) | (0, 3, −12) | 66° | Entrada oblicua desde izquierda, con estructura en primer plano. |
| BG05 | (0; 10,6; 17,6) | (0; 2,2; −3,5) | 73° | General elevada hacia escenario y pista. |
| BG06 | (0; 2,7; 8) | (0; 3,1; −14) | 57° | Vista baja central al escenario. |

Aspecto 16:9, planos de recorte 0,1–200. Las tres cámaras coexisten en la misma escena; cambiar entre ellas no modifica geometría ni luces. FOV es **vertical**, no el FOV horizontal de 08C2.1. No son cámaras de producción.

## Ambigüedades y límites

- La cabina contiene tres consolas geométricas y ningún personaje o figura. El modelo tiene un solo objeto de aro; en BG06 se ve parcialmente por el encuadre, no aparece un segundo arco en el suelo. Escalera y escenario son objetos físicos fijos; no se ocultan contradicciones mediante cambios por cámara.
- Las imágenes son renders del **nuevo modelo**: esto demuestra una base común de esta propuesta, pero no que las imágenes generadas 08C4 correspondan a ella. El modelo no reconstruye sus detalles ni verifica sus perspectivas.
- El acabado es deliberadamente básico: superficies simplificadas, materiales procedurales, luces puntuales sin sombras proyectadas ni volumetría real; espacios todavía vacíos, sin público, texturizado premium ni decoración detallada. No se cumple el nivel artístico cinematográfico de 08C4 y no debe sustituir fondos existentes. El cristal se representa como material oscuro brillante, no transmisión física.
- No se ha compuesto ni validado sprite o logo oficial, pivote de pies, ocupación, overscan ni transición al HUB. No hay garantía de fluidez, calidad en GPU física o apariencia consistente entre dispositivos. No se ha añadido arte o personaje generado.

## Herramientas y pruebas

La generación usa Three.js 0.170.0 / WebGL con Chromium headless; se probó en software SwiftShader, no GPU física. El módulo oficial de Blender `bpy` 4.2.0 se instaló fuera del repositorio, pero no arrancó por bibliotecas del sistema ausentes; no se ha usado ni se afirma que exista un archivo Blender. El GLB se exportó con `GLTFExporter` y se verificó con `GLTFLoader`.

QA: escena abierta en Chromium, 326 objetos raíz, 316 mallas y un único aro; GLB reabierto con las mismas 316 mallas y cámaras BG04/BG05/BG06. Los tres renders se volvieron a guardar desde la escena abierta y los SHA-256 coincidieron con los entregados en ese entorno. Pillow comprobó 2560 × 1440, PNG RGBA y alfa 255 para los tres. La comparativa cargó sus cuatro imágenes sin JavaScript y sin errores de red/página; las pruebas no evalúan el acabado artístico. La rama partió limpia en `c5df720`; ningún archivo previo rastreado, manifiesto ni código de juego se modificó. Sin integración en producción; aprobación humana pendiente.
