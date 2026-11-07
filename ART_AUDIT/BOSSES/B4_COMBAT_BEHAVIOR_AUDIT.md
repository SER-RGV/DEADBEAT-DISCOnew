# B4 — Auditoría de comportamiento de combate

**Fecha:** 2026-11-04  
**Rama:** `arena/179474d9-deadbeat-disconew` · **HEAD inspeccionado:** `ebb5a27422f630c656539fe31ab2b566deedecd9`  
**HTML activo:** `DEADBEAT_DISCO.ART.html` · SHA-256 al cierre: `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`  
**Resultado:** auditoría y QA B4 completadas; **mejora de runtime no aplicada**. Justicia, legibilidad, dificultad y diversión humanas: **NO VERIFICADAS**.

## 1. Alcance y método

Se revisó el controlador activo, no un modelo hipotético: `su()` construye `sr`; `Tf()` administra su ciclo y fases; `Th()` selecciona/ejecuta ataques; `wh()` abre el aviso; `vh()` crea proyectiles; `Sh()` solicita esbirros; `du()` coloca zonas; `Ao`, `Ye` y `We` contienen los datos de ataque/perfil. Se contrastó el contrato B2/B3 y se ejecutaron diez escenarios Chromium con el scheduler real y trayectorias simuladas. La lectura de código no prueba justicia ni comportamiento humano.

Convenciones de esta auditoría:

- **Definido:** existe en el catálogo/configuración.
- **Disponible:** el selector puede elegirlo para ese perfil/fase.
- **Seleccionado:** el scheduler puso el patrón en `pattern71` e inició su aviso.
- **Intento de emisión:** el contador `patternShot71` avanzó durante la ejecución.
- **Ejecutado/impacto:** requiere comprobar que `vh()` aceptó cada proyectil y observar la colisión posterior. El runtime no conserva un contador persistente por patrón ni por jefe; el contador de intentos no basta para certificarlo.
- **IMPLEMENTADO** no significa justo, legible, equilibrado ni probado en partidas naturales.

## 2. Conclusión ejecutiva

El combate usa **un scheduler compartido** con diferencias de contenido, orden, arquetipo, esbirros, zonas y escalado por residente. No son diez árboles de AI separados ni existe un combo authored que reaccione a la conducta del jugador. La lista de patrones es cíclica; `ring`/`spiral` pueden aplazarse por geometría y todos los ataques pueden demorarse por carga de hazards/proyectiles. El Núcleo tiene la excepción de fases/zonas propia.

Las pruebas B4 activaron los diez perfiles mediante `DMO_ART_TEST`, con una conducta simulada distinta en rotación y pasos de 50 ms durante 16 s. Los patrones/estados observados son compatibles con el código, incluidos sweeps en los perfiles `sweeper`. No se observó una anomalía de daño, cooldown o transición que justificara cambiar parámetros o el scheduler. Se añadieron el probe y su evidencia, **no código de producción**.

## 3. Hallazgos y riesgos

### B4-01 — «emisión» de FSM significa intento del scheduler, no éxito de `vh()`

**Severidad: S2 — moderada, condicional; ocurrencia bajo saturación no reproducida en la matriz.**

- **Evidencia:** `Th()` ignora el booleano de retorno de `vh()` y aumenta `patternShot71` incluso si uno o más proyectiles son rechazados por presupuesto, límites, obstáculo o borde. El wrapper B2 observa ese contador y notifica `attackStart` cuando avanza. En abanico, por ejemplo, el contador se asigna al total solicitado aunque `vh()` pueda rechazar enlaces individuales.
- **Reproducción de fuente:** durante una ejecución de `fan`/`burst`/`spiral`, hacer que `vh()` devuelva `false`; observar que `patternShot71` aumenta y que el wrapper B2 emite `attack.start`. Esto prueba el desacople lógico; **no** demuestra que ocurra con frecuencia en partidas reales. La matriz Chromium mide el contador y una cantidad agregada de balas, no atribuye cada bala a su creador.
- **Consecuencia:** la telemetría/estado semántico puede llamar «inicio de ataque» a una emisión parcial o vacía. No se ha demostrado una alteración de daño ni de cooldown de combate.
- **Cambio mínimo posible:** contar aceptaciones de `vh()` por separado de solicitudes y hacer que el evento visual use el contador aceptado, dejando intactos duración, recuperación y daño.
- **Riesgo:** exigir autorización específica para tocar el enlace B2; una corrección incorrecta podría dejar la FSM esperando o desincronizar el cierre. No se modificó B2.
- **Prueba requerida:** Chromium determinista que llene el presupuesto *después* del aviso, compruebe retornos `false`, balas aceptadas, `attack.start/end` y recuperación; regresión B2 51 y B3 156.

### B4-02 — el índice cíclico avanza si `wh()` rechaza `ring`/`spiral`

**Severidad: S2 — moderada-baja; secuenciación comprobada en fuente, impacto de gameplay no verificado.**

- **Evidencia:** en `Th()` se incrementa `patternIndex71` al calcular el candidato antes de llamar a `wh()`. Si `kh()` no encuentra corredor seguro, `wh()` devuelve `false`, deja `attackTimer=.6` y no crea `pattern71`, pero el índice ya avanzó.
- **Reproducción:** iniciar una selección con `ring` o `spiral` y hacer que `kh()` devuelva `null`; constatar que no aparece aviso y que el índice pasa al siguiente elemento. El mismo camino es observable en el source actual; la matriz de escenarios no fuerza una arena sin corredor.
- **Consecuencia:** un ataque disponible puede omitirse de la rotación cuando no se puede anunciar. Es un «skip» seguro frente a un ataque sin salida, pero cambia el orden ejecutado respecto del orden declarado; no se afirma que sea un defecto de fairness.
- **Cambio mínimo posible:** confirmar el índice solo si `wh()` acepta el patrón, o registrar explícitamente una selección aplazada sin cambiar el cursor.
- **Riesgo:** repetir el mismo patrón podría producir aplazamientos seguidos hasta que exista corredor; el comportamiento actual probablemente prioriza avanzar y no atascar el selector. No se cambió.
- **Prueba requerida:** fixture con `kh()` primero sin corredor y luego con corredor; comprobar orden, ausencia de daño antes de aviso, recuperación y que el selector no se atasque.

### B4-03 — `dashCooldown` y `volleyCooldown` son contadores sin consumidor de combate

**Severidad: S3 — baja / deuda de claridad; sin fallo de juego demostrado.**

- **Evidencia:** en el runtime se inicializan en `su()` y se decrementan en el update de `sr`; no aparecen como condición de selección/ejecución. La cadencia efectiva usa `attackTimer`, `phaseTimer`, temporizadores de adds/zonas y las puertas globales.
- **Reproducción:** cambiar esos dos campos sin cambiar el resto; ninguna rama de `Th()` o de fase los consulta. Se comprueba por sus referencias en el HTML activo.
- **Consecuencia:** sus nombres sugieren gates de dash/volley que no están conectados. No implican cooldown real ni prueba de dash inexistente por sí sola.
- **Cambio mínimo posible:** documentar o retirar los campos y sus decrementos solo si no hay consumidores externos dependientes.
- **Riesgo:** modificación innecesaria de compatibilidad/debug. No se tocó el runtime.
- **Prueba requerida:** búsqueda source-coupled de usos más regresión de scheduler.

### Riesgo no confirmado — inactividad durante presión sostenida

`Th()` pone `attackTimer=.3` mientras hay láser/hazard (`Zr`, `df`, `Da`) o el número de balas excede el umbral dinámico. Al desaparecer el bloqueo, el selector vuelve a intentar; no hay timeout máximo ni evento específico para este gate. La fuente demuestra el aplazamiento, **no** starvation permanente. El muestreo B4 no saturó deliberadamente ese umbral. Registrar como **S3 / NO VERIFICADO**, no como bug reproducido.

- **Reproducción de fuente:** mantener verdadera una de esas condiciones, observar que `pattern71` sigue vacío y el timer se repone a `.3`; liberar la condición y comprobar que vuelve a seleccionar.
- **Cambio mínimo posible:** instrumentar duración/causa de aplazamiento antes de contemplar cambios de prioridad o cadencia.
- **Riesgo:** un timeout que ataque durante saturación podría aumentar carga visual y cambiar balance. No se autoriza ni se aplicó.

## 4. Estado de arquitectura y cobertura

| Área | Estado B4 | Evidencia / límite |
|---|---|---|
| Conteo e identidad | 9 residentes de círculo + Núcleo Final; `Ye` aún contiene un registro `nucleo` duplicado; ronda 100 usa `We`. | Fuente de `aa()`/`su()` y matriz B4. No se infiere identidad de `artId`. |
| Catálogo / disponibilidad | 5 IDs `Ao`: `fan`, `ring`, `spiral`, `burst`, `summon`; sweep separado; zonas gestionadas por update; adds por timer. | Tablas `Ye`/`We`, selector `Th()`, `du()`/`Sh()`. |
| Diferenciación | Datos/orden/arquetipo (`hunter`, `pulse`, `sweeper`, `final`), HP/velocidad/ataque/recompensa, adds, zonas, aceleración. | Control compartido en `Tf()`/`Th()`, no AI individual. |
| Cooldown y movimiento | `attackTimer`/warn/recovery gobiernan patrones; `phaseTimer` alterna fases; distancia de referencia 260 (hunter/sweeper) o 310 (pulse), banda de reposicionamiento de 60; berserk persigue a ×1,55. | Lectura de update; ver análisis de secuencias. No se validó balance de distancias. |
| Interrupciones | Umbrales de vida limpian patrón/warning/sweep; ring/spiral vuelven a validar corredor; sweep interrumpe la selección de patrón mientras está activo. | B3 corrigió limpieza residual de sweep; B3 browser regresión vuelve a pasar. |
| Ejecución | Telegráfico observado y contadores de intentos observados en navegador. Aceptación individual de proyectiles no se cuenta persistentemente por patrón. | `B4_combat/scenario_matrix.json`; 10 fixtures, no 10 partidas naturales. |
| Feedback y fairness | **NO VERIFICADOS**. | Sin humano ni bot de esquiva; T01/T02 son pruebas de arte/render, no IA. |

## 5. Límites preservados y estado final

No se cambió `DEADBEAT_DISCO.ART.html`, el scheduler, `boss_animation_state_machine.js`, parámetros de balance, hitboxes, movimiento, fases, zonas, T01/T02, assets ni renderer. No se creó otro scheduler ni otro sistema de IA. B1/B2/B3 y T01/T02 regresan aprobados en esta pasada. El gate GPU real de T02 continúa **BLOQUEADO**. No se inició B5/B6 ni T03.

**Estado:** los cinco entregables de auditoría están completos. **Mejora de comportamiento en runtime: parcial/no aplicada**; los cambios propuestos requieren validar sus riesgos y, para el primer hallazgo, autorización específica sobre B2. Legibilidad, fairness, diversión y ciclos naturales completos permanecen **NO VERIFICADOS**.