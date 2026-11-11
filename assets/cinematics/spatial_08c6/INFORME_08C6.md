# 08C6 · Art pass en escena 3D compartida

**Resultado: continuidad geométrica conservada; calidad artística final NO alcanzada.** Esta entrega es una propuesta de trabajo no aprobada y no integrada, no fondos finales. [Comparativa](COMPARATIVA_08C6.html) · [Escena](ESCENA_08C6.html) · [Planta](PLANTA_08C6.svg).

## Punto de partida y archivos

Se partió de `f29b757` (`a57a846` más corrección de enlace), árbol limpio y PR #17 abierto/borrador. En 08C5 `scene.js` es fuente maestra y `club_08c5.glb` una exportación. Esta fase crea una copia independiente en `assets/cinematics/spatial_08c6/`; no modifica 08C3, 08C4 ni 08C5.

| Entregable | Ruta |
|---|---|
| Fuente editable y visor | `assets/cinematics/spatial_08c6/scene.js`, `ESCENA_08C6.html` |
| Exportación editable | `assets/cinematics/spatial_08c6/club_08c6.glb` |
| Renders | `assets/cinematics/spatial_08c6/bg04.png`, `bg05.png`, `bg06.png` |
| Comparativa / planta | `assets/cinematics/spatial_08c6/COMPARATIVA_08C6.html`, `PLANTA_08C6.svg` |
| Dependencias | `assets/cinematics/spatial_08c6/package.json`, `package-lock.json` |

Tres PNG RGBA, 2560 × 1440, alfa opaco, generados directamente a resolución nativa con WebGL, no ampliados. El GLB es una exportación estática con geometría y cámaras editables, no el archivo maestro del render.

## Cambios compartidos

Se conservan las **316 mallas originales** con el mismo nombre, geometría, posición, rotación y escala y las tres cámaras de 08C5 sin cambios. Se añaden detalles comunes a la única escena: juntas de pavimento, bridas y remaches, diagonales de barandas, costillas y cables de pasarelas, rejillas de altavoces, racks, mandos de cabina, pantalla escénica abstracta y paneles de servicio. Las tres cámaras ven la misma geometría según su encuadre y oclusiones; no hay cambios por cámara. La planta base no se alteró; la copia de referencia muestra las mismas coordenadas.

Materiales locales procedimentales: metal negro envejecido, acero con textura y relieve, hormigón oscuro, obsidiana, superficie de cristal oscuro estilizada, latón envejecido y superficies emisivas cian/magenta/violeta. Las texturas se generan en `scene.js` con semilla fija; no se usan imágenes externas. Se redujo brillo y saturación y se añadió luz direccional con mapa de sombras 2048 y relleno de cabina. Dos conos translúcidos fijos sugieren haces: son una **aproximación gráfica**, no volumetría física. La luz y los materiales también se comparten entre vistas. No se ha movido el aro, cambiado su función ni añadido otro.

Las cámaras mantienen las posiciones, objetivos y FOV vertical de 08C5: BG04 (−8,3,14) → (0,3,−12), 66°; BG05 (0;10,6;17,6) → (0;2,2;−3,5), 73°; BG06 (0;2,7;8) → (0;3,1;−14), 57°. Unidades relativas, no cámaras de producción.

## Reproducción

```sh
cd assets/cinematics/spatial_08c6
npm ci
python3 -m http.server 8015 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8015/ESCENA_08C6.html` en navegador con WebGL, seleccionar cada cámara y pulsar **Guardar PNG 2560 × 1440**. El botón **Exportar GLB** permite volver a generar el modelo tras editar la fuente. Tras instalar Three.js 0.170.0 los recursos son locales. Para vista previa remota enlazar el servidor a `0.0.0.0` y usar la URL de preview, no localhost en el navegador del usuario.

El GLB se verificó reimportándolo; incluye 783 mallas y tres cámaras. La exportación glTF no preserva luz hemisférica, niebla, tono/exposición ni garantiza dirección de la luz direccional (advertencia del exportador), y los mapas de relieve pueden interpretarse de forma distinta. Por ello **no reproduce el render fielmente** en cualquier editor. `scene.js` y el visor WebGL son la fuente autoritativa para generar los PNG; el GLB es una copia editable para interoperabilidad.

## Limitaciones y decisión

Aunque hay más detalle geométrico y sombras, el resultado **sigue teniendo aspecto de maqueta**, con superficies y composición demasiado simples y oscuras, reflejos limitados, atmósfera y actividad insuficientes; no alcanza el acabado indie premium de 08C4. El cristal no es físicamente transmisivo, las sombras son mapas rasterizados y los haces no son iluminación volumétrica real. No hay prueba de integración, personajes oficiales, logo, escala ni GPU física. Los renders no deben sustituir originales ni integrarse hasta una revisión artística y un tratamiento de materiales, luces y modelos significativamente más completo.

## QA ejecutado

Three.js 0.170.0 y Chromium headless con SwiftShader: se compararon las mallas de 08C5 y 08C6 una por una, sin cambios en las 316 previas; cámaras idénticas y un solo aro. El modelo exportado volvió a abrirse con GLTFLoader y contiene las 783 mallas y tres cámaras. Se regeneraron los tres PNG desde la escena abierta: sus hashes coincidieron con los entregados en ese entorno. Estos controles no prueban calidad artística, oclusión para un sprite, rendimiento ni render idéntico en otra GPU. No se modificó el manifiesto ni el juego; PR #17 continúa abierto en borrador y la aprobación humana queda pendiente.

Pillow confirmó los tres PNG RGBA 2560 × 1440 con alfa 255. La galería cargó cuatro imágenes con y sin JavaScript, sin errores de página, red o HTTP; enlaces locales comprobados. `npm ci` completado y `git diff --check` sin incidencias. Estas pruebas solo certifican propiedades técnicas.
