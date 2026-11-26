# Cierre de inventario: imágenes fuera del registro principal

Ámbito: archivos PNG, JPEG, WebP, GIF, SVG y AVIF dentro de `assets/`. No incluye gráficos procedimentales del canvas, imágenes incrustadas, audio ni medios fuera de esa carpeta. Base de comparación: `60870577628825c5cbd6e764ca214c3f106a3433`.

De 884 imágenes, 277 tienen ruta en `assets/manifest.json` y 607 quedan fuera. El detalle de estas últimas está en `arte_recursos_externos.csv`, una fila por archivo. Las columnas son independientes:

- **Respuesta HTTP 200**: observada por Playwright durante `test_menu_visuals.js`, `test_map_atlas.cjs` y `test_equipped_walk.cjs` en el HTML activo. Incluye precargas, no sólo imágenes dibujadas. El recorrido cubrió arranque, menú y extras, atlas y los ocho atuendos al caminar. No prueba que un archivo no observado sea inalcanzable.
- **Ruta literal**: la ruta completa aparece en `index.html`. Puede pertenecer a un selector antiguo; no detecta rutas construidas dinámicamente.
- **Distinto de base o nuevo**: diferencia de archivo en el checkout o recurso nuevo, no una medida de calidad visual.

86 imágenes externas devolvieron HTTP 200, 21 tenían ruta literal y 106 diferían de la base o eran nuevas. Todas las observadas o referenciadas literalmente diferían de la base al cierre. Las otras 501 no se han marcado como obsoletas: entre ellas hay referencias aprobadas, conceptos, respaldos de vestuario, ensayos de pose y material de producción cinematográfica. No eliminarlas ni sobrescribirlas por descarte.

El último fondo tratado, `op_02_tower.jpg`, aparece en una regla CSS del atlas y no se observó su descarga en estos recorridos. **No es el plano 03**: la sección narrativa y la proyección de la Mesa siguen usando `mc_03_nine.jpg`. El sello `vault-stamp.svg` ya era arte nuevo de esta rama y se conservó.
