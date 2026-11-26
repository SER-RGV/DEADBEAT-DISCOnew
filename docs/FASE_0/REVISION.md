# Fase 0 · Revisión de ramas · 2026-11-26

Estado actualizado: **parcial, #36 fusionado y #21 cerrado con autorización expresa**. No se inicia la fase 1; #34 sigue pendiente. Las secciones de revisión inferiores conservan el diagnóstico previo a las operaciones.

## Ejecución autorizada · 2026-11-26

- `gh pr view 36 --json headRefOid,state,mergeable`: head validado `132d5a4`, OPEN/MERGEABLE.
- `gh pr merge 36 --merge --match-head-commit 132d5a4bd17e2060d699252253fc45bcb74c5bea`: exit 0. Verificado MERGED, merge `29daef875fbe7e911f22de5c032d7753cf70aa57`.
- `gh pr close 21 --comment "…"`: exit 0. Verificado CLOSED; comentario explica que queda como evidencia histórica y no se integran sus builds antiguos.
- #34 verificado OPEN/draft; #32 verificado OPEN.
- Fallos: ninguno en estas operaciones. No se repitieron suites ni se regeneraron builds.
- Pendiente: rebase y validación de #34 en una sesión sobre su propia rama (esta sesión no puede escribir ramas ajenas); integración/QA de #32; fase 1 no iniciada.

## Método

Leídos README.md, CURRENT_STATE.md, src/README.md, tools/README.md y docs/README.md. Rama de sesión: `arena/087c4df2-deadbeat-disconew`, base `60870577628825c5cbd6e764ca214c3f106a3433`.

Consulta: `gh pr view N --json number,title,state,isDraft,mergeable,headRefName,headRefOid,baseRefName,body,statusCheckRollup` para N=36,34,21,32. Código descargado mediante `git fetch origin pull/36/head pull/34/head pull/21/head pull/32/head`. Se revisa #36 en una extracción desechable de `git archive 132d5a4`, dentro de `.cache/phase0/pr36`; no se cambia de rama. Los builds originales no se modifican ni regeneran: no corresponde crear un backup de build en esta revisión sin cambios de código.

## #36 · Listo para solicitar autorización de fusión

- Head validado: `132d5a4bd17e2060d699252253fc45bcb74c5bea`.
- OPEN, no draft, MERGEABLE; 763 archivos cambiados. Sin checks de CI registrados.
- **15/15 scripts solicitados pasan**, sin DD_QUICK. Arranque adicional: MAIN_MENU, criticalErrors=[], errores JS/HTTP=[]; loadMs=1918, bootMs=2533 (una muestra local, no benchmark).
- `prefab_reach`: 108 salas, 223 salidas accesibles; `prefab_progression`: nueve descensos y reconstrucción de diez pisos tras recarga.
- `prefab_touch`: movimiento real a 390×720. `refuge_walkthrough`: nueve sectores, dieciséis estaciones, compra nativa, reapertura y derrota → Refugio.
- `prefab_perf`: 21,4–23,5 ms de media en reposo; 26–27,9 ms con 25 enemigos. Software GL: no representa una GPU física.
- `prefab_rollout` termina con exit 0 pero informa **108 avisos de dressing lint**. No se ocultan ni equivalen a cero defectos; su clasificación/corrección queda pendiente, especialmente ante la fase 1 de orientación.
- Recomendación: listo para autorización de fusión según las suites solicitadas, con los límites anteriores; **no fusionado**. Esta revisión no sustituye una auditoría manual exhaustiva de los 763 archivos.

## #34 · Mantener en borrador por ahora

Head: `7b35ec051244126d5186f2c7bd236a0e16445c97`. OPEN, draft, CONFLICTING respecto a main en la consulta final. Las cifras 105,6 → 23,8 MB proceden de la descripción anterior, **no son mediciones repetidas en esta revisión**.

La secuencia solicitada exige primero fusionar #36, operación aún no autorizada. Además, la sesión solo permite escribir y hacer push en su propia rama: no se ha rebasado ni empujado la rama ajena de #34. Tras autorización e integración de #36, hace falta una sesión sobre la rama de #34 para resolver conflictos, hacer backup de builds, regenerar con tools/build_active_html.py, repetir tools/perf y final_review, y verificar mapa, minimapa, armería, retratos, opciones y pausa. Solo entonces quitar el borrador. No se adelanta la fase 4.

## #21 · Propuesta: cerrar como superado, previa confirmación

Head: `d2ebe832b77398d6d860912cf52373a143865092`. OPEN, CONFLICTING. Se revisaron la lista de archivos y los documentos FINAL_RECOMMENDATION y 08_QA_REPORT del head.

La auditoría propone conservar 1240×760, cuatro estaciones y escala antigua; su QA declara expresamente NO EJECUTADO. #36 documenta y prueba ya nueve sectores y dieciséis estaciones. #21 incluye también cambios de manifiesto y ambos HTML, por lo que no es una integración puramente documental y no conviene fusionar sus builds antiguos. Faltaría reconciliar sus recomendaciones y referencias de assets con el estado actual y ejecutar su plan actualizado. Propuesta: conservar la auditoría como evidencia histórica si se desea, pero cerrar el PR como superado, **solo con confirmación**. No cerrado.

## #32 · Propuesta: conservar abierto, no fusionar todavía

Head: `b15a57bd10bbb67f9d305fb44a92d2673505dc48`. OPEN, CONFLICTING. La descripción anuncia ocho planos/42 s; el código del head declara INTRO_DURATION=70 y catorce planos, coincidente con evidencia_cine_v30/informe_navegador.json. La descripción necesita actualización; también contiene cambios de boot, UI y CSS además de opening, manifiesto y QA.

Falta resolver conflictos tras #36, regenerar con backup, ejecutar test_restart_flow.js sobre el resultado integrado, revisar continuidad intro → menú → descenso → Refugio y validar resoluciones, audio audible y mando físico. El SHA-256 de src/dd_opening.js difiere entre el head de #32 y main/#36: no se ha demostrado que sea redundante. Recomendación: mantenerlo abierto hasta completar esas comprobaciones, no fusionarlo ni cerrarlo ahora. Esta revisión no ejecutó sus suites.

## Pruebas ejecutadas

Servidor sobre la copia exacta de #36: `python3 -m http.server 8000 --bind 0.0.0.0`.

Entorno: Node 22.22.3, playwright-core 1.65.1, Chromium 158.0.8127.0 headless. Dependencias temporales en .cache; libnspr/NSS extraídas del paquete npm @sparticuz/chromium 131.0.1. El ejecutable usado sigue siendo Chromium 158 (comprobado con --version).

Para cada script listado en evidencias/results.tsv se ejecutó desde la copia:

```sh
LD_LIBRARY_PATH=/tmp/al2023/lib \
NODE_PATH=/home/user/DEADBEAT-DISCOnew/.cache/phase0/deps/node_modules \
DD_CHROMIUM=/tmp/chromium \
timeout 240 node tools/qa/<script> http://localhost:8000
```

Todos: exit 0. Logs completos en `evidencias/`: dice_cycle, dice_engine, dice_feedback, prefab_art_preview, prefab_boss, prefab_floors, prefab_legibility, prefab_perf, prefab_progression, prefab_rave, prefab_reach, prefab_rollout, prefab_touch, refuge_walkthrough y test_ui_results.

- `cmp .cache/phase0/pr36/index.html .cache/phase0/pr36/DEADBEAT_DISCO.html`: exit 0.
- `node docs/FASE_0/smoke.cjs` con las mismas variables: exit 0; carga index.html, espera MAIN_MENU, registra pageerror y HTTP >=400. Resultado en evidencias/smoke.log.

## Fallos encontrados

- Primer intento: suites de navegador bloqueadas por libnspr4.so ausente. Solucionado en el entorno, sin modificar código del juego; repetición completa satisfactoria.
- #34, #21 y #32 presentan conflictos de fusión según GitHub.
- #32: descripción no representa su duración, planos ni alcance actuales.
- #36: 108 avisos de dressing lint pese a exit 0, pendientes de clasificación. No se detectaron fallos de aserción en la repetición.

## Pendiente o no verificado

- Confirmación para fusionar #36; revalidar si su head cambia.
- Completar #34 después de esa fusión; la fase 0 no se declara terminada.
- Decisión de cierre de #21; integración y QA de #32.
- Inspección humana de capturas RAVE/táctil, mando físico, audio audible, GPU real y campaña larga/balance. Los tests usan ayudas QA según sus propios arneses.
- Fase 1 y fases posteriores no iniciadas. No se han eliminado assets, backups ni evidencias históricas.
