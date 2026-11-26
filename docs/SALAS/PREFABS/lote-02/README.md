# Lote 02 · mobiliario y cobertura cardinal

[Prueba de silueta](prueba.jpg) · [7 sprites + 7 sombras RGBA](png/) · [pivotes y destinos](kit.json) · [órdenes de arte individuales](prompts.md)

Candidatos procedurales de revisión, no registrados. El generador lee las dos salas y las órdenes de arte mediante herramientas offline. Mantiene los ejes de pantalla: el monitor muestra los conos al sur, los conectores del panel salen al este, la cara de atención del puesto está al norte y el respaldo del sofá queda al este del asiento.

| Pieza | Sala | Variantes |
|---|---|---|
| Monitor S | r1 / r2 | Intacto; cambia la cota del ancla (42 / 30 u), no el lienzo. |
| Panel E | r1 / r2 | Intacto; no sólido, sin acción. |
| Puesto N | r1 | Intacto; no caja de compra ni puerta norte. |
| Sofá W | r1 / r2 | Intacto y roto, abertura al oeste. |
| Mesa N | r2 | Intacta y rota; no añadir mesa al palco. |

**Montaje de prueba:** 2 px/u, jugador de referencia 64 × 96 u. Los archivos de `kit.json` son relativos a `png/`. Alinear el pivote en píxeles con la proyección del apoyo: `origenPNG = 2 × (anchor.x, anchor.y − elevation) − pivotPx`. Pegar primero `shadowFile` y después `file`, sin rotación y sin recortar; intercalar sprites por `sortY`, no por el borde superior del bitmap. Los campos de colisión de `uses` documentan la pieza original y no son instrucciones para crear o reactivar sólidos en estado roto.

**Antes de registrar:** alternar los pares roto/intacto sin mover el pivote, superponer las huellas de `DD_ROOM_DEBUG.prefab('r1')` y `('r2')` y comparar con [la ficha](../FICHA_SPRITES.md). Comprobar a escala de juego que los restos no parecen obstáculos altos y que el respaldo no invade la cara útil. Revisar sprint coral, carga ámbar, ráfaga turquesa, rombo violeta y láser rojo con sus temporizadores en una composición separada; esta lámina no certifica legibilidad durante una partida.

Reproducción: `python tools/prefabs/furniture-art.py` (Pillow + Node). El generador comprueba correspondencia con las órdenes y que cada pareja comparte dimensiones y pivote, con los restos más bajos. No se modifica el render, RG2, la colisión ni el manifiesto de producción.
