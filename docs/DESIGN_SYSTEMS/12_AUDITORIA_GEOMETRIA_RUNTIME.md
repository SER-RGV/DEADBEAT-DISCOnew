# 12 — Auditoría de geometría de campaña y extracción runtime

**Estado:** análisis estático completado parcialmente; sonda runtime preparada, aún no ejecutada en este entorno.  
**Base inspeccionada:** main, árbol de archivos, PROJECT_INVENTORY.md, CURRENT_STATE.md, src/dd_world_renderer.js, src/dd_hub_system.js, ART_EVIDENCE/tanda_01/tanda_01/validation_run2_roomcapture.json y logs FASE 0.3.  
**Objetivo:** identificar la fuente de verdad de geometría, puertas, colisiones y spawns sin intervenir en FASE 08.

## 1. Hallazgo arquitectónico

El repositorio no contiene un módulo independiente de campaña dentro de src/. Según PROJECT_INVENTORY.md, el HTML original tiene 12 bloques script; el bloque 6 contiene el motor principal minificado y ocupa 8.552.970 caracteres. El inventario identifica allí los globales DMO_FLOOR, DMO_FLOOR_ANIM, DMO_LAYOUT y DMO_DUNGEON, pero clasifica su comportamiento como declarado/no probado en aquella auditoría estática.

El renderer de alta resolución sí está modularizado:

- src/dd_world_renderer.js expone DD_WORLD.buildHighResRoomCache(ctx, worldW, worldH, roomRect, circleIdx, roomSeed, clipRoomFn).
- Consume roomRect y un callback opcional clipRoomFn.
- Si no recibe callback, usa un rectángulo.
- Dibuja el suelo, la fachada, el borde y el tratamiento visual.
- Expone también drawDoor, pero esta función dibuja una puerta que recibe; no crea conexiones de campaña.

**Conclusión:** el renderer no es la fuente de verdad del generador. Las dimensiones y la forma real se calculan antes de llamar a buildHighResRoomCache.

El HUB también es un sistema distinto: src/dd_hub_system.js define HUB_BOUNDS, props y colisiones propias del refugio. No se deben reutilizar sus límites para inferir dimensiones de las salas de campaña.

## 2. Evidencia real de topología y runtime

La evidencia validation_run2_roomcapture.json contiene dos builds de prueba y dos semillas:

| Dato | Build A | Build B |
|---|---:|---:|
| Semilla | 17.677.515 | 502.304.869 |
| Nodos | 12 | 12 |
| Tipo de inicio | start | start |
| Salas de combate | 8 | 8 |
| Tesoro | 1 | 1 |
| Tienda | 1 | 1 |
| Jefe | 1 | 1 |
| Distancia de grafo al jefe | 6 | 6 |
| Salidas de r0 | 2 | 3 |

Las conexiones de cada nodo incluyen side y to, por ejemplo {side: "top", to: "r2"}. Es una fuente más precisa para estudiar puertas que una imagen del minimapa: ya indica el lado lógico de cada enlace.

La evidencia log_campaign_progression.json registra otra ejecución con semilla 117.123.191 y bossDistance: 5. Por tanto, la distancia 6 no es una constante universal.

La evidencia log_combat_rooms_resize.json registra:
- Tres transiciones de nodo: r0 → r1 → r2 → r3.
- Movimiento lateral con desplazamientos medidos.
- Un spawn confirmado con un enemigo.
- Una prueba de resize con viewport 900×700 y rectW: 900.

Ese rectW pertenece a una prueba concreta; no es un inventario de tamaños de todas las salas.

## 3. Límites de acceso a la fuente principal

La lectura de DEADBEAT_DISCO.ART.html a través de la integración GitHub devuelve contenido vacío, incluso solicitando rangos de líneas. La lectura de los HTML de backup de varios megabytes también devuelve vacío. La descarga de contenido por la API de GitHub falla por tamaño/soporte.

No se debe afirmar que se ha inspeccionado el código minificado completo ni intentar reconstruirlo a partir de capturas.

El inventario estático anterior sí documenta:
- 12 bloques script.
- El bloque 6 como motor principal.
- Los globales de campaña y generación.
- Compilación sintáctica estática del archivo completo en la auditoría original.

## 4. Sonda añadida

Archivo: tools/qa/audit_campaign_geometry.js

La sonda:
1. Abre la build activa mediante Chromium y Playwright.
2. Sigue el flujo de menú → HUB ya usado por los scripts de QA del repositorio.
3. Llama a DMO_HUB.startCampaignFromHub(0), la ruta existente de entrada a campaña.
4. Espera hasta que el estado indique CAMPAIGN_ROOM, HUB inactivo y transición terminada.
5. Inspecciona por reflexión los miembros de DMO_DUNGEON, DMO_LAYOUT, DMO_FLOOR, DMO_FLOOR_ANIM y DMO.
6. Registra resultados de DMO_DUNGEON.state(), DMO_LAYOUT.propObjects(), DMO.debug.state(), DMO.camera(), DMO.observe() y DMO.testStats().
7. Guarda JSON y una captura de r0.

No redefine métodos del juego, no modifica arrays, no teletransporta actores y no activa hooks de depuración que alteren la simulación. La inspección de propiedades evita invocar getters. El navegador usa un contexto aislado para que el guardado de prueba no contamine la sesión normal.

### Ejecución local

Requisitos existentes del proyecto: Node.js, Playwright Core, Chromium y servidor HTTP local sirviendo la raíz del repositorio.

    QA_LIB=/tmp/qatools/node_modules/playwright-core \
    node tools/qa/audit_campaign_geometry.js \
    http://127.0.0.1:8123/DEADBEAT_DISCO.ART.html

Variables opcionales:
- CHROME_PATH: ruta al ejecutable Chromium.
- LD_LIB_PATH: librerías del Chromium.
- Argumento 1: URL.
- Argumento 2: directorio de salida.

Salida esperada:
- ART_EVIDENCE/campaign_geometry/campaign_geometry_probe.json
- ART_EVIDENCE/campaign_geometry/campaign_r0_1280x900.png

**Importante:** la sonda está añadida al repositorio, pero no se ha ejecutado desde esta conexión. Los resultados siguen pendientes.

## 5. Qué buscar en el resultado

Orden de prioridad para encontrar la fuente de verdad:

1. Método de DMO_DUNGEON que genera o devuelve el grafo.
2. Método que construye la sala actual y su roomRect.
3. Método que produce la silueta o el callback de clipping.
4. Estructura de puertas: lado, posición, anchura, destino, estado abierto/cerrado.
5. Objetos sólidos y sus radios/rectángulos de colisión.
6. Generador de puntos de spawn y validación de distancia al jugador/puertas.
7. Método que prepara la caché de sala y llama al renderer.
8. Relación entre el nodo del grafo y el encuentro que se activa.

Si las funciones se encuentran como closures privadas y no aparecen en los objetos globales, la siguiente vía será usar una sonda temporal de QA en un checkout local para observar argumentos de llamada sin alterar sus resultados. No se debe parchear el HTML activo ni crear un segundo generador.

## 6. Riesgos que deben evitarse

- No cambiar roomRect en el renderer para simular una ampliación.
- No reutilizar HUB_BOUNDS como dimensión de campaña.
- No deducir colisiones a partir de los límites visuales de la sala.
- No colocar puertas según coordenadas de minimapa: usar los lados reales del grafo.
- No tratar coordenadas lógicas x/y del grafo como unidades de mundo.
- No añadir formas geométricas hasta confirmar que el generador las soporta.
- No modificar el motor principal mientras Arena integra FASE 08.

## 7. Próxima decisión técnica

Cuando exista el JSON runtime:
- Si la API expone las funciones y datos necesarios, documentar su contrato y diseñar pruebas deterministas sobre ella.
- Si solo expone estado resumido, crear una sonda local temporal que capture argumentos en el punto de llamada al renderer y al generador de puertas.
- Si la geometría está encerrada en closures inaccesibles, extraer el bloque 6 desde el checkout local y crear un mapa de funciones estático antes de proponer cualquier refactor.

No se inicia implementación de geometría ni cambio de balance hasta completar esa extracción.

## 8. Revisión de seguridad de la sonda — 2026-11-15

La revisión posterior del arnés QA existente ha detectado que la sonda todavía **no está lista para ejecutarse** sin adaptar su entrada al build que se quiera inspeccionar:

- `tools/qa/test_restart_flow.js` describe el flujo real de `index.html`: `DD_BOOT` espera gesto, `KeyX` inicia la intro, `Space` llega al menú y «Nueva partida» ejecuta el descenso hasta el HUB.
- `src/dd_hub_system.js` de `main` expone el ciclo del HUB por `DD_HUB`; la estación `descent` llama a `exitToRun()`, que reanuda/inicia la partida. No expone en este módulo `DMO_HUB.startCampaignFromHub()`.
- La sonda actual apunta por defecto a `DEADBEAT_DISCO.ART.html`, espera los globales `DMO_*` y usa una secuencia de clic/Enter/Escape distinta del flujo QA documentado. Esa ruta puede ser válida para otra build, pero no está justificada por el arnés de `index.html`.
- La documentación de TANDA 09 indica que `DMO_LAYOUT.propObjects()` devuelve un clon profundo de los props para inventario, no el array vivo usado por el renderer. La sonda sólo lee una muestra, así que no muta esos objetos; aun así, esa API no sirve para interceptar el pintor real.
- Los métodos `DMO_HUB.state()`, `DMO_DUNGEON.state()`, `DMO.debug.state()`, `DMO.camera()`, `DMO.observe()` y `DMO.testStats()` deben verificarse en la build exacta antes de dar por válida la extracción.

**Decisión:** mantener el script como prototipo no ejecutado. No se debe lanzar ni etiquetar como «sonda de solo lectura validada» hasta fijar explícitamente el HTML objetivo, confirmar sus globales y reproducir su flujo de entrada real. El siguiente cambio de QA debe ser una sonda específica por build, no una secuencia híbrida.

### Ruta segura de validación

1. Elegir explícitamente la build de campaña que se considera fuente de verdad.
2. Ejecutar primero el flujo QA existente hasta llegar al HUB, sin modificar archivos del juego.
3. Capturar el estado expuesto y comprobar qué API inicia la incursión desde esa build.
4. Entrar a una sola sala usando la interacción real del juego; no llamar a métodos supuestos.
5. Extraer los argumentos de geometría mediante observación temporal, sin cambiar sus valores ni el resultado de las funciones.
6. Guardar JSON/captura en un contexto de navegador desechable y comprobar errores, semilla, nodo y estado de transición.
