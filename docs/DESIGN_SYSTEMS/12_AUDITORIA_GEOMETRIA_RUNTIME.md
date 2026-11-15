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
