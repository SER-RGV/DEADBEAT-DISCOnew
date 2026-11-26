# El centro del bucle · revisión de identidad

| Decisión | Inventario activo y criterio |
|---|---|
| CONSERVAR | Carga `loading_keyart_2k.webp` (2560×1440), logotipo, separador, porcentaje comprobado por el arranque y movimiento reducido. Portada real `portada_descenso.jpg` (1376×768), no el fondo 2K histórico. El Desafinado está pintado a la derecha; el pozo ocupa el centro ambiental. No se recortó ni duplicó al personaje para centrarlo literalmente. |
| MEJORAR | Contraste de tinta sobre el trazo amarillo de foco; luz musical localizada junto al protagonista. Mantener barridos, seis opciones, música y SFX de selección y confirmación; no superponer otro sonido. |
| COMPLETAR | Camerino: inspección con foco o movimiento de puntero sin equipar; ficha con nombre, hito y estado. Se conservan retratos, cuerpos y ocho fichas de Extras. |
| INTEGRAR CON DICE COMBAT | Dirección: pequeño grabado de tres caras en metal cálido y cian, no magia sobre la piel. El mismo sello une tarjeta de carga, pozo, camerino y nota de archivo. No representa un resultado de tirada. |

**Catálogo real (sala):** original 0, Rapture 30, Shadow 10, Apocalypse 5, Gunslinger 25, Fight Club 50, Kitchen Riot 45 y Street Art 55. `PREVIEW_UNLOCK_ALL` sigue activo: «En prueba» es equipable pero no acredita el hito. No se fabricaron bloqueos para la captura. Las claves de apariencia y récord, las migraciones y los fotogramas de juego se conservan.

**Canon frente a propuesta:** la biblia vigente presenta al Desafinado como fragmento que Tempo no pudo repetir y habla de pistas. Se corrige la rotulación de portada. Son texto editorial nuevo la nota del Refugio sobre el dado, el consejo de carga y la frase de Gunslinger; no se cambió la biblia, la intro, los tatuajes ni la historia de los atuendos.

**Archivos de esta revisión:** `assets/ui/vault-stamp.svg` (único arte nuevo), `src/dd_appearance.js`, `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, `tools/build_active_html.py`, las dos entradas HTML generadas, `tools/qa/test_vault_identity.cjs` y `ART_EVIDENCE/IDENTIDAD/menu.jpg`. Sin dependencias nuevas.

**Verificación:** Chromium headless. `test_outfit_preview.js` pasó catálogo, equipar, persistencia y teclado móvil. `test_menu_visuals.js` pasó carga, reducción de movimiento, cinco escenas y archivo. En el build final `test_vault_identity.cjs` pasó seis botones, inspección sin equipar, estados con récord 10 y selección persistente tras recarga. Se revisaron capturas y se corrigió el dorado sobre amarillo. Menú 1280×720, 120 intervalos rAF con GPU deshabilitada: mediana 100 ms, p95 133,4 ms; no demuestra fluidez en hardware real. `test_menu_scenes.js` no terminó: timeout en reapertura rápida; una ejecución diagnóstica confirmó el foco en Volver pero se detuvo en el retorno con mando simulado. Pendiente estabilizar ese recorrido y comprobar rendimiento, audio y mando físicos. No se alteraron controles para hacer pasar el test.

## Fase 08 · estabilidad de navegación y pulido (3.3.0)

**Inventario antes de editar.** CONSERVAR: armazón de carga, `setProgress` (mismo valor de paso para barra, porcentaje y ARIA), portada A, seis opciones, música y controles. MEJORAR: luz sobre el protagonista, salida de carga, viaje entre estancias y lectura del camerino. COMPLETAR: pruebas de flancos consecutivos, foco inmediato y listeners. CORREGIR: propiedad del foco durante el fundido y descarte de pulsaciones A/B ya observadas.

**Diagnóstico y corrección.** Los timeouts anteriores no eran deterministas: el recorrido instrumentado previo también pudo terminar. El cuerpo del panel se repuebla, pero el diálogo y su botón Volver se reutilizan. Cinco escenas tenían una regla más específica que seguía interpolando `visibility` durante 480 ms. El foco dependía de tres reintentos a 30/200/550 ms. El ensayo de reapertura inmediata detectó que modificar sólo la regla genérica no bastaba. Ahora sólo se difiere ocultar al salir; al entrar la visibilidad es inmediata, se entrega el foco al control y, si no admite foco, a Volver. El panel saliente queda `inert`. No hay reintentos programados.

El sondeo marcaba A/B como vistos **antes** de comprobar un enfriamiento compartido. Un B nuevo tras A podía perderse incluso manteniéndolo pulsado. En portada y submenús basta el flanco físico; mantener A no genera otra confirmación. No se tocó la esquiva ni el tratamiento de modales de partida. El antiguo pulso simulado de duración fija además podía caer entre sondeos en render por software: la prueba de ida/vuelta rápida mantiene la entrada hasta observar su efecto real y pulsa B inmediatamente después de A, sin ampliar timeouts.

**Tratamiento visual.** El viaje usa la portada que realmente se ve, dura 680 ms en lugar de dos segundos y se recoge por `animationend`, no por otro reloj JS. Se mantiene una sola capa no interactiva. Menos destello sobre el rostro: luz fija tenue de ambiente y acento de compás dirigido por la mezcla existente. En carga se suaviza el acercamiento de salida y se separa el consejo de la barra. En camerino el ribete cian indica la ficha inspeccionada, sin sustituir el estado equipado. Sin arte nuevo, cambios editoriales, de requisitos ni de persistencia en esta fase.

**Archivos:** `src/dd_ui_system.js`, `src/dd_rebuild_ui.css`, salidas `index.html` y `DEADBEAT_DISCO.html`; QA en `tools/qa/test_menu_{scenes,passage}.js` y `tools/qa/test_outfit_preview.js`. Capturas reales en `ART_EVIDENCE/IDENTIDAD/fase08/` (carga, menú, camerino y Extras); ilustran composición, no demuestran interacción.

**Pruebas en Chromium, build final:**

- `test_menu_scenes.js`: 24 ciclos consecutivos de camerino/Extras con foco comprobado sin esperar ni un frame, recuperación en progresión, teclado, ratón, A→B estándar simulado, dos tamaños adicionales, partida y resultados. Sin errores de consola, JS ni peticiones fallidas. Mismos conteos CDP antes/después: window 38, document 13, diálogo 0, capa de viaje 1. Es un control de acumulación en esos destinos, no una auditoría completa de heap.
- `test_menu_passage.js` y `test_menu_visuals.js`: ida/vuelta, origen/destino, retirada de la capa antes de intro, carga y progreso, cinco escenas y movimiento reducido.
- `test_outfit_preview.js` y `test_vault_identity.cjs`: ocho inspecciones sin equipar, ocho requisitos, prueba vs. hito con récord 0/10, equipar explícitamente y recargar, Extras y vista estrecha. Los números de sala siguen siendo los de la tabla histórica.
- `test_menu_respuesta.js`: ejecución completa aislada **52/52**. En una ejecución agrupada anterior un pulso direccional simulado no cambió el selector y el proceso alcanzó el límite externo antes de completar la suite. El retorno B sí pasó en ambas. Sigue habiendo sensibilidad del ensayo de pulsos temporizados bajo carga.
- Build reproducida y entradas comparadas byte a byte; `git diff --check` limpio. Muestra de menú 1280×720, 120 intervalos rAF, GPU deshabilitada: mediana **99,9 ms**, p95 **183,2 ms**. No hay evidencia de mejora de FPS frente a la primera revisión.

**Pendientes:** mando Xbox físico, GPU/dispositivos reales y escucha en equipo final; verificar allí latencia y cadencia. La cobertura móvil es de viewport en Chromium, no de un teléfono físico.
