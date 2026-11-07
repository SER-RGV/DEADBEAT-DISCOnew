# B4 — Informe de pruebas

**Fecha:** 2026-11-04  
**Estado técnico:** regresiones solicitadas **PASS**; simulación B4 **PASS como fixture**.  
**Fairness / legibilidad humana:** **NO VERIFICADAS**.  
**GPU real T02:** **BLOQUEADO**, sin medición en esta tarea.

## 1. Regresiones solicitadas — ejecutadas en esta pasada

| Suite | Ejecución | Resultado | Alcance del resultado |
|---|---|---|---|
| B1 `test_boss_zone_max_b1.js` | Node, extractor de `du()` y scheduler determinista | **PASS**, exit code 0; 13 escenarios heredados más checks de owner, caps, tipos, limpieza y límites inválidos. | Scheduler de zonas en VM con geometría determinista stub; no gameplay/fairness browser. |
| B2 `test_boss_animation_fsm_b2.js` | Node determinista | **51/51 PASS**, 13 estados; diez perfiles registrados. | FSM/contrato y hooks source-coupled; no fairness. |
| B3 `test_boss_telegraph_b3.js` | Node source-coupled | **156/156 PASS**; matriz 42 enlaces: 42 C, 0 P, 0 sin señal. | Contrato de señal/telegraph; no juego natural. |
| B3 Browser `test_boss_telegraph_browser_b3.js` | Chromium, HTML activo, scheduler/render | **PASS**: burst y spiral entran en TELEGRAPH; volley/berserk cancelan sweep residual; FSM termina ENRAGED. | 0 page errors, 0 fallos locales; 2 respuestas externas `/cdn-cgi/...` 404 y 2 errores de consola correspondientes. |
| T01 `validate_boss_tanda_01.js` | Chromium, HTML activo | **17/17 PASS**, 0 errores de página, 0 respuestas fallidas. | Integración/render/arte; no AI ni fairness. |
| T02 `validate_boss_tanda_02.js` | Chromium, HTML activo | **16/16 PASS**, 0 errores de página, 0 respuestas malas. | Integración/render/arte; no gate GPU. |
| T02 GPU real | No ejecutada | **BLOQUEADA** | El sandbox previo no expone GPU real; SwiftShader no cuenta. |

## 2. Escenarios B4 de navegador

Comando utilizado:

```bash
NODE_PATH=/tmp/deadbeat-boss-qa/node_modules \
DMO_B4_URL=http://127.0.0.1:4176/DEADBEAT_DISCO.ART.html \
node ART_TOOLS/qa/test_boss_combat_behavior_b4.js
```

**Resultado: PASS, 10/10 selecciones de perfil.** Cada caso ejecutó 320 ticks × 0,05 s de `DMO.debug.tick()` (16 s simulados), con PRNG fijo por caso, vida protegida por god mode de debug y sala limpiada de enemigos ordinarios. Se observaron tres estilos scripted: quieto 4 casos, órbita horaria 3, retirada 3. Se registró al menos una selección por encuentro; Pogo, Matarife, Traidor y Núcleo transitaron a sweep durante la muestra. No hubo page errors (0) ni fallos locales (0). Hubo 20 peticiones externas Cloudflare `/cdn-cgi/challenge-platform/scripts/jsd/main.js` con HTTP 404 (y mensajes de consola asociados); se excluyeron de fallos locales.

La evidencia detallada está en `evidence/B4_combat/scenario_matrix.json`: semilla, conducta, perfil real, orden seleccionado, contador de intentos, eventos FSM, fases, total agregado de balas, adds y limitaciones por caso.

### Cómo interpretar esta prueba

- Es **simulación de navegador**, no partida observada, bot ni playtest. Las rutas del jugador se inyectan por teletransporte y no prueban física/controles.
- `DMO.debug.invuln()` evita que la muerte termine el bucle; no se miden hits, supervivencia, tiempo de victoria ni balance.
- `pattern71` prueba selección; el delta `patternShot71` prueba intento de emisión; el total de balas no está atribuido a boss/add. No se afirma que todos los disparos fueran aceptados o impactaran.
- Ventana de 16 s: patrones iniciados cerca del corte pueden seguir en aviso/ejecución. No son diez ciclos naturales completos.
- Los escenarios no forzaron el umbral de saturación ni cambios de HP a volley/berserk. Estas ramas están cubiertas por inspección y por regresiones B2/B3 previas; no por esta matriz.

## 3. Validaciones locales de archivos

- `node --check ART_TOOLS/qa/test_boss_combat_behavior_b4.js`: PASS.
- `git diff --check`: PASS.
- SHA-256 de HTML activo al cierre: `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`; sin cambio de producción B4.
- Resultado B4 adicional: `evidence/B4_combat/scenario_matrix.json`; runner: `ART_TOOLS/qa/test_boss_combat_behavior_b4.js`.

## 4. Pendiente fuera de estas pruebas

1. Reproducir un patrón con el presupuesto de proyectiles ocupado después de su aviso para contrastar intento (`patternShot71`), retorno real de `vh()`, FSM y proyectiles aceptados (B4-01).
2. Fijar `kh()` sin corredor y confirmar política de avance del cursor de selección (B4-02).
3. Probar fase por HP en los diez perfiles, incluir fases 2/3 del Núcleo y observar ciclos naturales sin fixture.
4. Ejecutar playtesting humano de legibilidad, salida, carga simultánea y fairness; no hay claim hasta tenerlo.
5. Mantener el gate GPU T02 bloqueado; no iniciar B5/B6 ni BOSS-T03.

**Cierre:** regresiones B1/B2/B3/T01/T02 pasan. La auditoría técnica está documentada; el comportamiento natural completo y la evaluación humana permanecen **NO VERIFICADOS**.