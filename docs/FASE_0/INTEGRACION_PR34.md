# Fase 0 · Integración de #34 después de #36

Fecha: 2026-11-26. Entrega en la rama de sesión y PR #37, por autorización expresa. #34 permanece abierto y en borrador como referencia; no se ha escrito en su rama. No se inicia fase 1 ni se fusiona esta entrega automáticamente.

## Alcance y resolución de conflictos

- Incorporado `main` con #36 mediante merge local `609f4bb`.
- Aplicado el delta de #34 (`bf91d2d..7b35ec0`), excluyendo los HTML generados; resolución manual en fuentes.
- Se conservan la colección de seis dados, el atlas, el minimapa nativo, los textos de controles con dados, la gestión de foco/inert, la escala de HYPE 0–100 y los retratos vigentes de #36. No se restaura el catálogo obsoleto de 120 armas ni el minimapa isométrico antiguo.
- Carga de assets por prioridad; cinemáticas pesadas a demanda. Las notificaciones al render/UI se agrupan, no se elimina ninguna entrada del manifiesto.
- Escrituras de HUD condicionadas al cambio real, sin sustituir vida/escudo/RAVE por las fórmulas antiguas de #34.
- Conservados los ajustes compatibles de opciones, scroll, pausa y estilos de tarjetas.
- Descubierto y corregido un defecto importado de #34: el nuevo cargador nunca intentaba la ruta fallback. Prueba unitaria cubre éxito del respaldo, fallo acotado y deduplicación.

Copia previa: `backups/FASE_0_20261126_pre_PR34/{index.html,DEADBEAT_DISCO.html}`, con SHA256SUMS. Los backups de retratos originales de #34 también se conservan. Builds regenerados exclusivamente con `python3 tools/build_active_html.py`.

## Mediciones repetidas

Comparación contra la copia exacta de #36 `132d5a4` (equivalente al contenido de main tras su merge) servida en :8000; integración en :8123. Tres contextos nuevos por variante, misma instalación Chromium 158/Playwright 1.65.1, sin GPU. No se compara contra el main antiguo de noviembre 19.

`boot_compare.mjs` mide el HTML por separado, suma Resource Timing y espera MAIN_MENU; además toma una muestra dos segundos después. Buffer de 5000 entradas: evita la truncación silenciosa del buffer por defecto de 250. Los MB son decimales, incluyen HTML; las cifras históricas 105,6 → 23,8 MB no son directamente equivalentes a esta metodología ni al juego posterior a #36.

Antes (#36): 115,470 MB al menú y dos segundos después, 374 recursos además del HTML; menú 3069–3224 ms, mediana 3072 ms; marca `done` 2468–2637 ms. Después: 29,569 MB al menú y 51,344 MB dos segundos después; 132 y 330 recursos respectivamente además del HTML; menú 1967–2119 ms, mediana 2043 ms; marca `done` 1382–1553 ms. Resultados íntegros en `integracion34/boot-after.jsonl` y `integracion34/mediciones.json`. La carga P1 continúa después del menú: no se presenta la cifra inicial como descarga total del juego.

Combate integrado: recorrido con teclado hasta la estación leída del plano vivo, interacción E, motor running=true y paused=false, 39 intervalos rAF: media 21,8 ms, p95 33,4 ms; siete enemigos al terminar, desplazamiento real 242 unidades. Es una muestra local con GL por software, **no una promesa de FPS ni de mejora respecto a una GPU real**. `scriptMs`/`renderMs` del arnés acumulan desde el comienzo del recorrido, no exclusivamente dentro de la ventana de combate.

## Arneses adaptados, sin rebajar las aserciones funcionales

- Ruta actual JUGAR → NUEVA PARTIDA; el arranque ya no pasa obligatoriamente por INTRO.
- `walk_to_station.cjs` planifica sobre `DD_HUB.walkable/layout`, ejecutando teclado real. No escribe coordenadas ni omite colisiones; elimina la grieta antigua fijada a (910,875).
- Revisión final: seis botones actuales del menú, movimiento relativo, misma comprobación de guardas, input, dos descensos y pausa.
- Pruebas de ayuda y árbol accesible actualizadas a los nombres actuales (GRABA UNA CARA, Colección de dados, Mesa Astral) y a Q/LB sobrecarga y Z/Y inspección. No se modifica la esquiva ni su configuración.
- `test_phase0_integration.cjs` exige último control de opciones alcanzable, décima ficha del atlas seleccionable incluso a 390 px, seis dados sin recorte de nombre y HUD retirado bajo la pausa. Espera a que termine la transición de opacidad antes de comprobarla.

## Pruebas ejecutadas

Todas desde la raíz, con `DD_CHROMIUM=/tmp/chromium`, `LD_LIBRARY_PATH=/tmp/al2023/lib` y `NODE_PATH=$PWD/.cache/phase0/deps/node_modules`.

- `python3 tools/build_active_html.py`: exit 0. `cmp index.html DEADBEAT_DISCO.html`: exit 0.
- `node tools/qa/test_asset_priorities.cjs`: exit 0; carga crítica inicial, cinemática a demanda, deduplicación, respaldo y error acotado.
- `node tools/perf/boot_compare.mjs <url>`: tres arranques por variante; JSONL íntegros conservados.
- `node tools/perf/{hubperf,combat,sweep,map3,shopshot,walkdraw}.mjs`: ejecutados; logs en `integracion34`. Sweep/map3 son sondas, no pruebas de cero defectos por exit 0.
- Suites `test_ui_results` (sin DD_QUICK), `test_hud_vitals`, `test_minimap_engine`, `test_map_atlas`, `refuge_walkthrough`, `test_options_controls`, `test_modal_input`, `test_accessibility_dodge`, `prefab_touch`: ejecutadas. Resultados finales consolidados en `integracion34/estado_final.tsv`.
- `test_phase0_integration`: pasa opciones en cuatro tamaños, atlas en cuatro (incluido 390 px), Dice Vault y pausa.
- `final_review`: **30/30 guardas, 4/4 integración y 16/16 flujo**, 0 errores de página/HTTP; exit 0. Logs y resultado final conservados en `integracion34`, con intentos previos fallidos registrados en las tablas de ejecución.
- `node --check` en las fuentes JS modificadas: sin errores. `git diff origin/main...HEAD --check -- . ':!backups/FASE_0_20261126_pre_PR34'`: exit 0. El control completo detecta seis avisos de whitespace heredados en las copias exactas de los HTML; no se alteran backups para silenciarlos.
- SHA-256 de ambos HTML finales: `44cc3c3f761cd6b95431a78bffbad169437c57f68bb551c19c3cf71e620337dc`.

## Fallos encontrados

- Conflictos de UI/CSS y retratos resueltos preservando #36; las partes obsoletas de #34 no se importan.
- Los arneses originales fallaban antes de alcanzar su objetivo por rutas, coordenadas y rótulos antiguos. `combat` devolvía exit 0 incluso sin arrancar: ahora exige combate real y devuelve error si no lo alcanza.
- Revisión final tuvo timeouts en intentos intermedios. Además, una corrección intermedia referenciaba una variable de Node dentro del navegador y dejaba una tecla mantenida; corregida antes de la repetición final. Un intento lento se interrumpió explícitamente; no se computa como aprobado.
- La sonda visual detecta contenido fuera de la ventana de opciones en tamaños bajos: el cuerpo es desplazable. Se comprobó con aserciones que sus controles y la última fila del atlas son alcanzables, no se interpreta scroll como contenido perdido.
- La sonda de menú sigue registrando un texto inferior a 10 px y un elemento recortado en tamaños bajos; no se declara cero defectos visuales.
- Fallo inicial del nuevo test de pausa por comprobar la opacidad a mitad de transición; ahora espera al estado final sin cambiar el CSS del juego.

## Pendiente o no verificado

- Autorización para fusionar #37 y decisión sobre el destino de #34 (conservado en borrador conforme al acuerdo); nada se cierra automáticamente.
- #32 sigue abierto: conflictos y QA de intro propios, fuera de esta integración.
- 108 avisos de dressing lint registrados en la revisión previa de #36; no corregidos aquí para no adelantar fase 1.
- GPU real, mando físico, audio audible, campaña larga y balance no verificados.
- Fase 1 no iniciada. El cierre de fase 0 depende de la revisión de esta entrega y de las decisiones anteriores; no se mezcla con fases posteriores.
