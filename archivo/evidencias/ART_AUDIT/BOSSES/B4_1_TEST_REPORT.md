# B4.1 — Informe de pruebas

**Fecha:** 2026-11-04
**Resultado B4.1:** **NO APROBADO / BLOQUEADO**: R1 está confirmado y aún no corregido por el límite de alcance B2.
**Cambios de producción:** ninguno. HTML activo y FSM B2 conservan los hashes de línea base.
**Playtest humano:** no realizado; todas las pruebas de combate son fixtures o simulaciones.

## 1. Reproducciones B4.1

| Prueba | Resultado | Condición / límite |
|---|---|---|
| R1 — HTML Chromium, selector y `Th()` reales | **REPRODUCIDO** | Pogo `sweeper`, `fan`, cinco intentos, cero proyectiles aceptados mediante rechazo geométrico QA. `patternShot71` quedó en 5 y el ataque se limpió. La manipulación temporal de radio se describe en `B4_1_REPRODUCTION_REPORT.md`. |
| R1 — coherencia B2 | **REPRODUCIDO** | Con disparo rechazado y contador en 5, la integración B2 informó `attack.start`/`attack.end completed:true` en una repetición Chromium iniciada por `debug.pattern()`. Ese disparador omite el selector, por lo que solo vale para telemetría, no para cursor. |
| R2 — selector `Th()`/`wh()` de fuente exacta | **PASS, INTENCIONAL** | `kh()` controlado sin corredor: omite `ring`, difiere 0,6 s y selecciona `fan` en 13 pasos de 0,05 s. No se crea señal/ataque para `ring`. |
| R3 — carga sostenida | **PASS, INTENCIONAL** | `Ia=34`, umbral 33, 10,0 s; patrón/cursor permanecen quietos mientras dura la saturación. |
| R3 — recuperación | **PASS** | Al detener la carga, vidas de proyectil de 3,6 s; selección de `fan` a los 3,7 s, sin reset manual. |

Los casos VM ejecutan literalmente `Th()`/`wh()` extraídos del HTML activo, con dependencias de geometría/aceptación controladas. Son pruebas fuente-acopladas del scheduler, no simulación de arena completa.

## 2. Suites de regresión ejecutadas sobre la línea base

| Suite | Comando / ejecución | Resultado |
|---|---|---|
| B1 zonas | `node --check ART_TOOLS/qa/test_boss_zone_max_b1.js && node ART_TOOLS/qa/test_boss_zone_max_b1.js` | **PASS**; 13 escenarios y comprobaciones ampliadas de límites/owners/limpieza. |
| B2 FSM | `node --check ART_TOOLS/qa/test_boss_animation_fsm_b2.js && node ART_TOOLS/qa/test_boss_animation_fsm_b2.js` | **51/51 PASS**, 13 estados; no se editó el archivo FSM. |
| B3 telegraph determinista | `node --check ART_TOOLS/qa/test_boss_telegraph_b3.js && node ART_TOOLS/qa/test_boss_telegraph_b3.js` | **156/156 PASS**, 42 enlaces, 42 correctos, 0 parciales, 0 ausentes. |
| B3 Chromium canónico | Runner del repositorio contra `http://127.0.0.1:4176/DEADBEAT_DISCO.ART.html` | **FAIL del fixture de arranque**: el juego quedó en pausa y `debug.tick()` no avanzó; falló la aserción de selección `burst`. No se observó fallo local del juego. El harness B3 no se modificó. |
| B3 Chromium con pausa cerrada | Copia temporal del mismo runner en `/tmp`, con salida redirigida a `/tmp` y un único Escape condicional adicional si aparece `REANUDAR` | **PASS**: burst/spiral en `TELEGRAPH`, cancelación de sweep y estado final `ENRAGED`; 0 errores de página y 0 fallos locales. Hubo 2 respuestas externas Cloudflare `/cdn-cgi/...` 404. |
| T01 navegador | Copia temporal de `validate_boss_tanda_01.js`, solo salida redirigida a `/tmp`; HTML activo en 4176 | **17/17 PASS**, 0 errores de página, 0 respuestas fallidas. |
| T02 navegador | Copia temporal de `validate_boss_tanda_02.js`, solo salida redirigida a `/tmp`; HTML activo en 4176 | **16/16 PASS**, 0 errores de página, 0 respuestas malas. |
| B4 Chromium | Copia temporal de `test_boss_combat_behavior_b4.js`; salida a `/tmp` y cierre condicional de pausa, sin cambiar el cuerpo de escenarios | **10/10 perfiles PASS**, 320 ticks × 0,05 s = 16 s simulados por perfil; 0 page errors, 0 fallos locales, 20 respuestas externas Cloudflare 404. |

Las copias temporales evitaron sobrescribir evidencia previa del usuario. No se alteraron los runners B3/T01/T02/B4 del repositorio.

## 3. Determinismo, carga, recuperación, reinicio y concurrencia

- **Determinismo:** el resultado JSON de la VM con `Th()`/`wh()` se comparó entre dos ejecuciones; coincidencia byte a byte.
- **Carga:** 34 proyectiles frente al umbral de 33; se mantuvo la condición 10,0 s y el scheduler siguió diferido, según política.
- **Recuperación:** sin nuevos proyectiles, la vida máxima controlada fue 3,6 s; el patrón volvió a seleccionarse a los 3,7 s.
- **Reinicio:** el runner B4 hizo una navegación/carga nueva del HTML por perfil (10 inicializaciones de runtime), todas con boss recién creado. **No** se probó recuperación de save, reanudación tras cierre del navegador ni persistencia de partida.
- **Concurrencia:** `Promise.all` de ocho invocaciones al scheduler fuente-acoplado sobre estado compartido y carga sostenida se serializó como corresponde al hilo JavaScript: ninguna selección mientras saturado; tras liberar la carga, una única advertencia/patrón. Esto **no** representa múltiples bosses paralelos; el runtime tiene un scheduler en el hilo principal.

## 4. Alcance del resultado

Las pruebas existentes B1/B2/B3 determinista/T01/T02 y el escenario B4 pasan con las salvedades de arranque anotadas. No se creó una regresión de corrección para R1: su prueba de aceptación debe escribirse junto a la corrección autorizada, para que falle antes y pase después, y para mantener las 51 aserciones B2. No tiene sentido declarar la suite B4.1 verde mientras el defecto R1 sigue presente.

`git diff --check`: **PASS**.
SHA-256 HTML activo al cierre: `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`.
SHA-256 `boss_animation_state_machine.js` al cierre: `68910f296b3c736875c45317543ff431103a22bd0d5d9432151306c31b7f9261`.
