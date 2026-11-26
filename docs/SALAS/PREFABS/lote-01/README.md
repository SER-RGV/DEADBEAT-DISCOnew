# Lote 01 · arquitectura y cota / candidatos a registro

[Prueba de montaje con los PNG reales](prueba.jpg) · [20 másteres raster](png/) · [20 prompts independientes](prompts.md) · [dimensiones, pivotes y destinos](kit.json)

Piezas procedurales de arte técnico, sin muebles, cobertura ni avisos de combate. Producción **no registrada**: no se ha añadido nada al manifiesto ni a los HTML jugables. La textura no define el suelo transitable. La prueba superior de las escaleras es una composición de revisión y no un sprite para cargar en el juego.

| Familia | Másteres | Contrato de montaje |
|---|---:|---|
| Suelo, tapa, cara | 3 | Materiales opacos sin perspectiva pintada. Recortar al polígono y al tramo resuelto. Tapa de 24 u, cara hasta 72 u. No repetir a través de un corte. |
| Tarima, canto, pisadas 5/7, contrahuella | 5 | Origen de cabina (928,87), planta 205 × 94 u. Tarima elevada y faja de canto aparte. Huella cenital con nariz al sur; contrahuella frontal de 6 u. |
| Umbrales | 4 | Un PNG por vista interior. Luz 170 × 86 u; pivote en `opening.origin`; pase de suelo sin sombra propia. |
| Jambas | 8 | Un PNG por vista y extremo de tangente (`0=t−`, `1=t+`); huella 10 × 24 u. Bisel dirigido al vano; pivote en centro de apoyo y `sortY` por borde de base, no por el techo. |

**Escala y capas:** 2 px/u, jugador de contraste 128 × 192 px. `kit.json` expresa tamaños lógicos en u, lienzo y pivote en px. En jambas, el tercer valor de `nominalU` es altura, no profundidad de planta. Colocar el pivote en `(anchorX, anchorY − z)` para una prueba con relieve. En materiales UV el pivote `[0,0]` es la esquina de muestreo, **no** una entidad para ordenar entre actores. Pisada: proyectar `treads[i].y − treads[i].z`; cara vertical desde su borde sur. Solo el sombreador o una capa independiente aporta sombra corta en el pie; no sumar una sombra por cada textura.

## Checklist de aceptación, antes del manifiesto

- [ ] **Inventario:** ejecutar `node tools/prefabs/sprite-order.cjs`. Cruzar los nombres con [la ficha](../FICHA_SPRITES.md) y las órdenes base. 20 salidas arquitectónicas únicas; las 7 salidas de mobiliario/estados pertenecen al lote siguiente. Ninguna puerta cerrada o escalera completa incrustada en un material.
- [ ] **Suelo/tapa/cara:** mosaico de suelo 3 × 3 a escala 1:1; buscar costuras no intencionadas y repetición demasiado dominante. Probar tapa y cara sobre un retranqueo y chaflán de [palco-r1.svg](../palco-r1.svg). El UV puede seguir la arista; jamás usar una placa cardinal girada como falso alzado.
- [ ] **Puertas:** en `/?roomDebug&roomSeed=0`, consultar `DD_ROOM_DEBUG.prefab('r1').openings` y repetir con `'r2'`. r1: `dockE→r7` W / 34 u, `dockS→r2` N / 22 u y `dockW→r0` E / 36 u. r2: `dockN→r1` S / 72 u y `dockW→r3` E / 36 u. **El mostrador norte de r1 no es una abertura norte.** Verificar las cinco colocaciones incluso donde se reutiliza el mismo PNG E. Ambos biseles miran al centro, sin invertir luz o tangente.
- [ ] **Umbral/jambas:** alinear el píxel pivote del JSON con el punto del plano, revisar márgenes alfa de 4 px a zoom alto y contorno sobre fondo claro/oscuro. La jamba se apoya fuera de la luz. La placa se interna 86 u: no centrarla sobre el muro. No dibujar sombra o dintel que visualmente cierre la entrada.
- [ ] **Cotas:** contrastar con `prefab('r1').decks[0]` y `prefab('r2').decks[0]`. Palco: 7 peldaños de 15 u, avance 105, subida 42. Nave: 5 de 14,8 u, avance 74, subida 30. Los dos PNG de pisada miden 410 × 30 px: en nave, **no** interpretar cada raster como 15 u. Redondear extremos acumulados al componer; total de huellas 148 px, no 150. Sin salto de pivote, z-fighting simulado ni filas oscuras dobles entre nariz y contrahuella.
- [ ] **Orden por base:** prueba aislada con silueta patrón antes y después del apoyo, con y sin sombra de contacto. Comprobar que una cara alta no cambia de profundidad al cambiar su altura. No usar los PNG para validar colisión ni para pintar un pasillo en la partida real.
- [ ] **Lectura en movimiento, pendiente de revisión humana:** en composición aislada con referencias nativas, contrastar sprint coral, carga ámbar, abanico turquesa, rombo élite violeta y barrido rojo con sus temporizadores sobre juntas, umbrales, tarima y narices de escalón. Revisar tamaño objetivo y movimiento reducido; rechazar un brillo fijo que parezca un aviso o un material que esconda un contador. La prueba de montaje no certifica RAVE ni rendimiento.

**Reproducir:** `python tools/prefabs/architecture-art.py` (Python con Pillow, Node y fuentes DejaVu opcionales para la lámina). Lee `inspect.cjs` y `sprite-order.cjs` en modo offline. No requiere un guardado ni arranca el juego.
