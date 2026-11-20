# DEADBEAT DISCO — FASE 04 · animación de combate de atuendos

## Implementación integrada

La presentación de los ocho atuendos ahora responde al estado visual existente del protagonista; no se añadieron estados al motor ni se tocaron daño, tiempos de disparo, físicas, balance, armas, IA o partidas guardadas. El renderer modular es `src/dd_world_renderer.js`; `index.html` y `DEADBEAT_DISCO.html` se reconstruyen desde él mediante `python3 tools/build_active_html.py`.

- **Reposo y movimiento:** el aliento lento y el balanceo siguen la fase del motor, con mayor amplitud contenida sobre el dibujo idle. Caminar/correr conserva el ciclo de pasos propio del outfit y la cadencia real del motor.
- **Cambios de pose y dirección:** el renderer funde poses dibujadas durante 105 ms al cambiar de estado/acción o al invertir el lado al que mira. No mueve la posición física ni el ancla de arma.
- **Disparo:** durante el golpe inicial se muestra brevemente el sprite de reacción `hurt` de ese mismo atuendo, se oculta el arma durante ese beat y aparecen destello/estelas de tinta en la línea de fuego; el dibujo vuelve a `aim`.
- **Disparo cargado:** con carga inicial se anticipa con `idle`, después se sostiene `aim`; arcos segmentados aumentan con `chargeT` y un estallido distingue la liberación.
- **Habilidad:** la primera parte usa el sprite compacto `roll` de cada atuendo, luego recupera `aim` y acompaña la acción con un impacto gráfico y trazos ascendentes.
- **Daño y muerte:** se conservan los dibujos canónicos `hurt` y `death`, con transiciones y marcas de impacto en tinta/cel shading.
- **Cobertura:** la selección procede de `DD_APPEARANCE.outfitFrame()`; se verificaron Original, Rapture, Shadow, Apocalypse, Gunslinger, Fight Club, Kitchen Riot y Street Art.

Los ocho showcases y los 48 sprites runtime existentes no se modificaron. Las marcas de acción son primitivas Canvas locales al renderer: no agregan bibliotecas ni llamadas de red.

## Verificación y evidencias

- `node --check src/dd_world_renderer.js` y `node --check tools/qa/test_phase04_combat_animation.js` — PASS.
- `python3 tools/build_active_html.py` — PASS; ambos HTML activos regenerados desde el origen modular.
- `bash tools/qa/run_phase04_visual_matrix.sh` — **PASS 8/8**, cada atuendo cubre caminar/correr, retroceso, carga, habilidad, daño y muerte; sin errores de navegador, consola, peticiones HTTP ni recursos.
- `node tools/qa/test_player_animations.js http://127.0.0.1:8126` — PASS: entradas reales del motor, caminar/disparo, anclas reflejadas, impacto/escudo, habilidad y prioridad de muerte.
- `node tools/qa/test_v2m_outfits.js http://127.0.0.1:8126` — PASS: ocho atuendos equipables durante combate, HUD y transición con enemigo de prueba.
- Matriz/capturas: [`fase04-combat/phase04-animation-matrix.json`](fase04-combat/phase04-animation-matrix.json), 56 capturas por atuendo/estado (siete estados × ocho looks) y hojas [`antes-despues-locomocion.jpg`](fase04-combat/antes-despues-locomocion.jpg) y [`matriz-acciones-fase04.jpg`](fase04-combat/matriz-acciones-fase04.jpg).
- Los test hooks de poses están aislados a la respuesta HTML de Playwright; no se insertan en los HTML entregables ni escriben partidas. Las capturas de antes usan la matriz gameplay guardada de FASE 03; las de después son capturas del renderer activo de FASE 04.

## Límites que siguen visibles

El paquete de arte de atuendos sólo trae una pose de caminata (`walk_a`) más idle; correr conserva ese ciclo a la cadencia del motor. Para disparo se reutiliza intencionadamente el `hurt` auténtico como un beat corto de retroceso, no es un dibujo nuevo de retroceso. La muerte dispone de un fotograma final, no de una caída multipose. Las pruebas cubren una partida de exploración sin IA activa y fuerzan estados visuales aislados para comparar los ocho trajes; no son una campaña natural de combate ni sustituyen una sesión de animación/arte manual. Se rechazó una prueba generada de `walk_b` porque incluía fondo ajedrezado y alteraba detalles canónicos; no se integró.

El reloj del entorno registró `2026-11-20` en el JSON, cinco días por delante de la fecha de esta sesión (`2026-11-15 UTC`); se conserva el dato bruto y no se presenta como fecha civil fiable. No se encontró fallo de ejecución en las verificaciones anteriores.
