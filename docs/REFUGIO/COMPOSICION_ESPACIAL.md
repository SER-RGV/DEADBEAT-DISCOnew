# Refugio · reconstrucción espacial

[Inventario de colocación antes/después (CSV)](INVENTARIO_ESPACIAL.csv) · [Comparativa visual](../../ART_EVIDENCE/HUB_ESPACIAL/comparacion.jpg) · [Capturas originales](../../ART_EVIDENCE/HUB_ESPACIAL/antes/) · [Capturas finales](../../ART_EVIDENCE/HUB_ESPACIAL/despues/)

## Implementado

La composición conserva la planta y los nueve sectores de juego. La intervención establece tres niveles: **Mesa Astral, protagonista y grieta** sobre el eje central; **residentes, puestos y vitrinas** en los flancos; **lámparas, bancos, flores, cartelería y brillos** como acompañamiento. No hay portales nuevos, ni estaciones trasladadas, ni nuevas piezas gráficas.

| Zona | Diagnóstico y decisión espacial |
|---|---|
| Centro y archivo | Las velas altas, las anillas y dieciséis cartelas competían con la proyección. Las velas enmarcan la mesa a menor escala. La luz de restauración sigue sus coordenadas. Sólo la estación activa lleva texto en el suelo; las cercanas conservan una señal tenue y el localizador y el prompt siguen disponibles. El halo bajo el protagonista ya no parece una plataforma blanca. |
| Barra / arsenal | El mostrador y el contrabar tapaban la lectura del camarero; el cofre competía con la Armera. Estantes al fondo, barra más corta, camarero en el extremo de servicio, bancos separados y cofre lateral. La vitrina de dados sigue siendo el dado real del Vault, no el antiguo expositor de armas. |
| Escenario / taller | Tempo aparecía superpuesto a la cabina. Ahora ocupa su lateral; el desplazamiento del monitor restaurado se conserva. Se redujeron los equipos auxiliares, el orbe y los colgantes. El mural queda en el perímetro norte-este, no en mitad del espacio de trabajo. |
| Habitación / colecciones | Sofá y estante se separan; el recuerdo se pinta sobre la balda en vez de flotar junto al sofá. El sello y el pedestal de galería no invaden la lectura de la mesa ni del arcade. Las placas antes bajo muebles se sitúan en suelo visible. |
| Descanso / galería | Cuatro asientos se amontonaban en una fila sobre la alfombra. Dos sofás en el fondo y dos sillones en los extremos delanteros forman una U, con la flor en el centro y el banco en el borde. Se conserva el espejo horizontal de los asientos derechos. Arcade y banco de galería quedan a distinta profundidad. |

**Cómo leer el CSV.** Una fila por instancia o grupo repetido; incluye variantes condicionadas, imágenes directas, materiales y respaldos. Dimensiones y transparencia se leyeron de los ficheros. `W`/`H` indican unidades de mundo; la otra dimensión sigue la proporción nativa. Los PNG de mobiliario se apoyan por su borde inferior con el ajuste del renderer `max(24,br) × 0,42`; sombra y colisión parten del mismo centro de planta. La colisión es circular aproximada, no una máscara por píxel. Poses de marcha y respiración mantienen su animación. El minimapa, las anillas, la luz y la señalética no tienen fichero raster. El alcance del inventario es el **escenario del HUB y su presentación**, no el catálogo interno de cada menú que se abre desde él.

**Reutilizaciones comprobadas:** estantes, bancos, sofás, emblemas de zorro y pedestales aparecen en varios puntos con funciones distintas. No se borró ninguno. `weaponrack` es el identificador heredado de una colocación, pero en el HUB activo se dibuja como vitrina procedural de dados; no se sustituyó por un PNG de armas.

## Validado

- Capturas a 1280×720 en Chromium, con el zoom y seguimiento normales, no renders a cámara libre. Hay **18 vistas antes y 18 después**: entrada, dieciséis puntos de interacción y estado restaurado. El diálogo de pantalla es parte de la escena real; no se ocultó para mejorar la captura.
- La inspección visual intermedia reveló que el Bartender se perdía bajo el HUD en la toma de la barra. Se ajustó su anclaje, se repitió el recorrido y se inspeccionaron de nuevo barra y escenario. La ordenación por Y sigue siendo única; la excepción deliberada es el recuerdo, que se apoya sobre la balda y se compone justo después de ella.
- `tools/qa/refuge_walkthrough.cjs`: pasó antes y después. Verifica recorrido físico por los 16 puntos, interacción con E/A simulada, compra real, tres restauraciones, hallazgos, retorno tras derrota y datos al reabrir. Los muebles sólidos trasladados conservan su radio y comparten posición con su obstáculo: no se desplazó sólo la textura.
- `tools/qa/test_map_atlas.cjs`: pasó. Atlas, foco, puertas y geometría continúan funcionando. `cmp index.html DEADBEAT_DISCO.html` y `git diff --check` sin diferencias inesperadas.
- Repetir capturas: `DD_HUB_CAPTURES=ruta/salida node tools/qa/refuge_walkthrough.cjs http://localhost:8000` con la build servida, `playwright-core` y Chromium configurados.

## Archivos de esta intervención

**Modificados:** `src/dd_hub_system.js` (colocación, etiquetas y composición); `tools/qa/refuge_walkthrough.cjs` (capturas opcionales); `index.html`, `DEADBEAT_DISCO.html` (regenerados). **Creados:** este informe, el CSV y las evidencias en `ART_EVIDENCE/HUB_ESPACIAL/`. **Eliminados:** ninguno. Sin cambios en las imágenes fuente, cámara, guardado, diálogos, condiciones de desbloqueo, radios de interacción o transiciones.

## Pendiente / límites

No se ha hecho un barrido píxel a píxel desde cada posición posible, con todos los atuendos y relaciones de aspecto. El recorrido verifica el recuerdo exhibido, no cada permutación cosmética en la misma vista. No se ha probado mando físico. El diálogo y el HUD pueden cubrir temporalmente parte del escenario: no se han movido ni desactivado para enmascararlo.
