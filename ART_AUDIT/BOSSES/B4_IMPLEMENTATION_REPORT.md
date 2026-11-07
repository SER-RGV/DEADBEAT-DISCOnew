# B4 — Informe de implementación

**Fecha:** 2026-11-04  
**Auditoría y QA documental:** **COMPLETADAS**.  
**Cambio de gameplay/runtime:** **NO APLICADO**.  
**Mejora total del comportamiento:** **PARCIAL / PENDIENTE** de validación y autorización donde corresponda.

## 1. Motivo del alcance

La inspección del runtime mostró comportamiento definido y ejecutable para los diez perfiles con un scheduler común. Los escenarios Chromium confirmaron selección/fases iniciales con varios estilos de movimiento artificial; no demostraron una anomalía de combate que justificara alterar daño, tiempos o movimiento. Se detectaron riesgos de instrumentación y secuenciación condicionados (B4-01 y B4-02), pero los cambios mínimos afectarían el contrato entre `Th()` y la FSM B2 o podrían provocar repetición de patrones aplazados. No se aplicó una corrección especulativa.

## 2. Archivos B4 añadidos

- `ART_AUDIT/BOSSES/B4_COMBAT_BEHAVIOR_AUDIT.md` — método, conclusiones, hallazgos, severidad, reproducción, impacto, cambio mínimo, riesgos y pruebas.
- `ART_AUDIT/BOSSES/B4_BOSS_COMBAT_MATRIX.md` — matriz estática/escenario de nueve residentes y Núcleo, distinguiendo disponibilidad, selección y contador de intentos.
- `ART_AUDIT/BOSSES/B4_ATTACK_SEQUENCE_ANALYSIS.md` — timers, distancia, fases, recuperación, interrupciones, repetición y presión.
- `ART_AUDIT/BOSSES/B4_IMPLEMENTATION_REPORT.md` — este informe.
- `ART_AUDIT/BOSSES/B4_TEST_REPORT.md` — regresiones y límites de evidencia.
- `ART_TOOLS/qa/test_boss_combat_behavior_b4.js` — harness Chromium sobre el HTML activo.
- `ART_AUDIT/BOSSES/evidence/B4_combat/scenario_matrix.json` — resultado reproducible de diez perfiles/estilos.

## 3. Harness y evidencia

El harness carga el HTML activo, accede a los perfiles con `DMO_ART_TEST`, usa `DMO.debug.tick()` para 320 pasos de 0,05 s, fija `Math.random` por semilla, protege al jugador con `DMO.debug.invuln()` y limpia enemigos ordinarios antes de observar. Los adds quedan bajo control del scheduler real. Reparte conductas scripted estacionaria, órbita horaria y retirada (4/3/3 casos); son coordenadas teleport-inyectadas, no inputs humanos ni bot.

El registro separa `pattern71` (selección), cambios de `patternShot71` (intento scheduler), cambios agregados de balas y eventos FSM. No atribuye balas al boss cuando el API solo da el total. Se registraron 10/10 perfiles previstos, page errors 0, errores locales 0 y respuestas locales fallidas 0. Hubo 20 respuestas externas Cloudflare `/cdn-cgi/...` 404 en este harness; no fueron fallos locales ni errores de página.

## 4. Runtime y límites preservados

- `DEADBEAT_DISCO.ART.html`: sin cambios B4; SHA-256 al cierre `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`.
- `boss_animation_state_machine.js`: sin cambios B4.
- Sin cambios a `Ao`, `Ye`, `We`, selector, fases, scheduler de zonas, `zones.max`, B1, animación B2, geometría/renderer B3, T01/T02, artId, assets, HUB o loader.
- Sin segundo scheduler/director/AI por jefe ni nueva entidad de combate.
- No hubo ajuste de daño, speed, hitboxes, timers, cooldowns, invulnerabilidad, cantidades, HP, movimiento ni duración de fases.
- Los cambios de trabajo preexistentes en `ART_BIBLE.md`, `ART_PACK/art_pack.js`, HTML, assets y otros archivos no relacionados se conservaron; no se hicieron commit ni merge.

## 5. Estado de hallazgos

| ID | Acción B4 | Motivo / gate |
|---|---|---|
| B4-01 — contador de emisión frente a aceptación real de `vh()` | Documentar; no corregir. | Requiere escenario real saturado y autorización específica para tocar integración B2. |
| B4-02 — cursor avanza con `wh()` fallido | Documentar; no corregir. | Skip puede ser una política deliberada; mantener cursor podría repetir aplazamientos. Requiere decisión y fixture. |
| B4-03 — cooldowns sin consumidor | Documentar como S3. | Sin fallo de juego; eliminar sería limpieza no necesaria y puede afectar herramientas/debug. |
| Gate de presión / inactividad | Riesgo S3 no verificado. | No se probó una saturación sostenida; no añadir timeout porque cambiaría presión. |

No se presume que las propuestas sean cambios aprobados. No se avanzó a B5/B6 ni BOSS-T03. El gate GPU de T02 sigue **BLOQUEADO**. Legibilidad y fairness humana continúan **NO VERIFICADAS**.