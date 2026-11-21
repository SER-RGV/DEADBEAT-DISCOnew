# Dice Combat · entrega para revisión

## Jugar

Abre `index.html` servido desde la raíz. En el refugio, E/A junto a **The Dice Vault** abre la colección. El D6 comienza desbloqueado. En la arena, apunta y suelta el botón de ataque; mantenerlo aumenta la carga. Puedes moverte y esquivar incluso durante el retorno. Q/LB consume una carga de sobrecarga para potenciar el próximo dado, no para detonar una bomba. Z/Y inspecciona la cara. El control táctil conserva la asistencia nativa.

Una tirada con al menos un impacto da **un sello**, no uno por víctima. Los umbrales de los dados son 0 (D6), 3 (D4), 7 (D8), 12 (D10), 18 (D12) y 25 (D20). Diez sellos adicionales sobre cada umbral habilitan su edición grabada. Los sellos no se gastan al equipar. Colección, dado y edición seleccionados se conservan en `dd.dice.v1`; las demás inscripciones son de la incursión.

## Inventario de la referencia `arcane_dice_oak_ruin.html`

| Fuente real | Adaptación y diferencias |
|---|---|
| `FACE_NORMALS`, `ResinDieActor`, `createDieFaceTexture` | Se conserva en D6 +Y=1, −Y=6, +Z=2, −Z=5, +X=3, −X=4. En lugar de `BoxGeometry`, materiales de resina y mapas de Canvas en Three, polígonos convexos iluminados y numerados directamente en Canvas 2D. |
| `attemptThrowDie`, `throwFrom`, `updateAimFromPointer`, `autoAimNearestEnemy` | Un único actor disponible. Origen elevado, velocidad hacia el objetivo, giro inicial y alcance limitado. Las coordenadas las da DEADBEAT; no se importa el raycaster. La carga al soltar es nueva. |
| `ResinDieActor.update`, `getTopFace`, `computeFlatQuaternion` | Altura y gravedad independientes de XY, disipación de suelo y muros, límite temporal de 1,15 s. Se conserva el máximo producto escalar con la vertical y se alinea esa cara, sin volver a sortear. Dos ángulos de rotación en lugar de cuaterniones y slerp. La restitución de suelo del D6 es 0,36 y la retención horizontal 0,62. |
| `handleDieKineticImpact`, `getPreviewRadius`, `resolveDieBlast`, `damageEnemy` | Contacto/impacto y explosión son dos eventos distintos. Radio basado en `2.35 + 0.44 × cara`, reescalado para las unidades y poliedros de DEADBEAT. La referencia limita impactos con un cooldown; aquí un objetivo recibe como máximo un impacto cinético y una resolución por tirada. Fragmentos y cadenas comparten el registro de la resolución. Se usan las bajas, resistencias y recompensas nativas. |
| `RUNE_TYPES`, `faces`, `updateFaceTexture`, `resetAllFaces`, `openUpgradeModal`, `renderUpgradeModal` | Mapa cara → efecto. `meteor`, `frost`, `chain` y `multiplier` inspiran fuego, hielo, cadena y sobrecarga. `vampire` se adapta a recuperación de esquiva en lugar de curación del mago. Las elecciones nativas ofrecen pares cara/runa explícitos, no el selector independiente de dos pasos de ARCANE. |
| `createAimVisuals`, `renderDieFacesStrip`, `showRollBanner`, `spawnShockwaveRing`, `spawnBurstParticles`, `SoundEngine` | Retícula de primera caída, radio móvil, números de caras, HUD y colección en el estilo local. Se reutilizan partículas, texto flotante, ondas y síntesis del juego destino; no se copia un contexto de audio. |

El original vuelve de `settling` a `held`: **no** contiene los seis poliedros jugables, la carga, la colección permanente ni el vuelo de retorno implementados aquí. Tampoco se importan el tablero, el mago, los enemigos, las oleadas o la tabla de puntuaciones de ARCANE.

## Archivos y responsabilidades

**Nuevos:** `src/dd_dice_geometry.js` (mallas, normales, proyección y grabado), `src/dd_dice.js` (catálogo, entrada muestreada, estados, física, retorno y persistencia), `src/dd_dice_rules.js` (contacto, cara, runas, cadenas y fragmentos), `src/dd_dice_native.js` (adaptador dentro del cierre del motor), `tools/qa/dice_cycle.cjs`, `tools/qa/dice_engine.cjs` y este informe.

**Modificados:** `tools/build_active_html.py`, `src/dd_world_renderer.js`, `src/dd_hub_system.js`, `src/dd_ui_system.js`, y las dos salidas generadas `index.html` y `DEADBEAT_DISCO.html`. No editar esas salidas a mano. El generador trabaja sobre el backup protegido; valida los puntos de inserción antes de escribir. El adaptador utiliza `ec`/`Qs` para colisiones, `As` para generadores, `pc` para cobertura destructible, `lu.applyEnemy`/`lu.applyBoss` para daño, `Ep` para bajas y `di`/`vs`/`Tp` para presentación. Los contadores de disparos y aciertos reciben un evento por lanzamiento y por tirada acertada, respectivamente.

## Estado y pruebas

- **1 — Extracción:** correspondencias y diferencias arriba. Sin Three.js ni dependencias de ejecución añadidas.
- **2–3 — D6 y validación:** lanzamiento breve y cargado, vuelo, rodadura, resolución y segunda tirada verificados. Chromium alcanzó `CHARGING` por eventos de puntero sobre `#game`; durante la salida del dado la tecla Espacio produjo el estado de animación `dodge`.
- **4 — Multidado:** `node tools/qa/dice_cycle.cjs` pasó con los seis. Verifica todas las normales, los estados, velocidad cargada superior, máximo de cuatro rebotes de suelo, una resolución por lanzamiento y retorno al jugador móvil. Con un objetivo que permanece solapado durante dos tiradas hubo cuatro eventos de daño: dos cinéticos y dos de resolución. También se probaron rayos de fragmentación, categorías de D20, hielo, cadena y atracción.
- **5 — Progresión:** en navegador se abrieron las seis tarjetas del Vault, se equipó el D6 y se seleccionó una inscripción real de ronda. Recargar restauró el D20. Para recorrer todo el catálogo la prueba inyecta sellos, no simula 25 victorias naturales.
- **6 — Integración:** `tools/qa/dice_engine.cjs` pasó en Chromium headless. Los seis dados completaron su ciclo en el motor con enemigos nativos; el jugador se desplazó en vuelo y no había balas del jugador. Se usa invulnerabilidad de QA para que una muerte no corte la comparación. En la última ejecución, el jefe pasó de **111 a 106,98 PV**. No equivale a completar todas sus fases.
- **7 — Rendimiento y equilibrio:** mallas construidas una vez, cálculo de cara sin vectores temporales por normal, subpasos de hasta 1/120 s, sin temporizadores ni otro bucle de juego. En la última sonda de jefe, 150 pasos nativos por lotes con 10 dibujos tardaron 125 ms en headless. **No es una medida de FPS interactivos.** El balance de una campaña completa sigue pendiente.

**HUD:** `tools/qa/test_hud_vitals.js` sin adaptar agotó 30 s esperando el gesto/intro (este arranque llegó directamente a `MAIN_MENU`). En una copia temporal, sustituyendo sólo el arranque de la prueba por menú → refugio → incursión, pasaron sus comprobaciones de vidas, escudo, HYPE, RAVE y geometría en cuatro tamaños. No se modificó la suite histórica para ocultar el timeout.

**Reproducir:** `python tools/build_active_html.py`, `node tools/qa/dice_cycle.cjs`, servir la raíz con un servidor HTTP y ejecutar `DD_CHROMIUM=/ruta/a/chromium node tools/qa/dice_engine.cjs http://localhost:8000` con `playwright-core` disponible. Chromium y Playwright se instalaron sólo en `/tmp` para QA.

**Límites de validación:** no se probaron un mando físico, una pantalla táctil física, todos los jefes, cada combinación de inscripciones y pasivos, ni una campaña completa. El catálogo histórico de armas se conserva internamente por compatibilidad con datos y herramientas antiguas, no como despachador de disparos; pueden persistir rótulos históricos en vistas de diagnóstico. No se cambiaron la IA de enemigos ni los patrones de jefe, la cámara, la música, las arenas o el algoritmo de movimiento. Esto describe el alcance del cambio, no una certificación de ausencia de regresiones.
