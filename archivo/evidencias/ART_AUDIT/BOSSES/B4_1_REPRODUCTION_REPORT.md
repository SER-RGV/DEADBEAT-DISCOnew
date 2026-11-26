# B4.1 — Informe de reproducción de riesgos

**Fecha:** 2026-11-04
**Rama / HEAD:** `arena/179474d9-deadbeat-disconew` / `ebb5a27422f630c656539fe31ab2b566deedecd9`
**HTML activo (SHA-256):** `928a03a53399f808a9c557fe90fcc50b21ba2e2070100cdbf67e862bbe897339`
**FSM B2 (SHA-256):** `68910f296b3c736875c45317543ff431103a22bd0d5d9432151306c31b7f9261`
**Cambios de producción B4.1:** ninguno.

## Resumen de clasificación

| Riesgo | Clasificación | Conclusión observada |
|---|---|---|
| Emisiones intentadas vs proyectiles aceptados por `vh()` | **CONFIRMADO / BLOQUEADO** | `Th()` suma los intentos aunque `vh()` rechace todos. El ataque termina como completo; el puente de B2 observa `patternShot71` y puede presentar inicio/fin de ataque sin proyectil creado. Corregir la señal requiere cambiar el contrato de integración B2, para lo que falta autorización específica. |
| Cursor de selección cuando `wh()` no encuentra corredor | **INTENCIONAL** | El cursor avanza y omite el patrón de corredor imposible; tras 0,6 s selecciona un patrón que no requiere ese corredor. Cambia la distribución local, pero no anuncia ni ejecuta el ataque imposible y evita quedar bloqueado en esa opción. |
| Inactividad bajo saturación sostenida | **INTENCIONAL** | El scheduler no selecciona patrones mientras el umbral de carga se mantiene. Con 34 proyectiles sobre el umbral de 33 permanece inactivo; al cesar la carga, los proyectiles vencen a los 3,6 s y el scheduler se recupera en 3,7 s en la prueba controlada. No quedó estado de ataque atascado. |

## Método y límites

Se revisó el HTML activo y se ejecutaron dos formas de reproducción, sin editar el juego:

1. **Chromium sobre el HTML real:** sala de jefe de Pogo (nivel 55, variante `sweeper`), invulnerabilidad de QA, sala despejada, sin enemigos ordinarios ni proyectiles al inicio. Se mantuvieron `Tf()`/`Th()`/`wh()`/`vh()` y el puente B2 reales. La manipulación de radio descrita abajo es una condición artificial y temporal para forzar el rechazo geométrico; **no es una partida ni un playtest**.
2. **VM acoplada a fuente:** se extrajeron literalmente `Th()` y `wh()` del HTML activo. Se controlaron dependencias de arena (`kh`, `vh`, `Ia`, presupuesto) para fijar corredor, rechazo y saturación. Esto confirma transiciones del scheduler, no sustituye una sesión de juego ni comprueba fairness.

En Chromium se tuvo que cerrar la pausa después de la entrada de sala; `debug.tick()` no avanza `Tf()` mientras la pausa está abierta. La prueba B4 se ejecutó con una copia temporal del runner que añadía esa comprobación de pausa; el runner del repositorio no fue alterado.

## B4.1-R1 — `patternShot71` frente a `vh()`

### Condición controlada en el scheduler real

- Pogo, variante `sweeper`, con patrones originales `burst`, `fan`, `spiral`.
- `patternIndex71=1` y `attackTimer=0,01` como entradas de QA; la selección del patrón siguió pasando por el selector real de `Th()` y eligió `fan` (`warn=0,8 s`, índice resultante 2).
- Sin otros proyectiles. Al final del aviso se fijó temporalmente `boss.r=10 000` durante dos pasos reales de 0,05 s y luego se restauró a 34. Esta inyección asegura que las posiciones de aparición fallen la comprobación de geometría de `vh()`; no cambia ningún dato de producción.

### Resultado

- `patternShot71`: **0 → 5**; los cinco intentos solicitados se contabilizaron.
- `DMO.circles.bossShots().n`: **0 antes y 0 después**; no se creó ningún proyectil hostil.
- `pattern71`: se limpió tras la descarga; el enfriamiento se aplicó.
- Sin errores de página.

La VM con los cuerpos reales de `Th()`/`wh()` y `vh()` controlado para rechazar devolvió el mismo resultado: cinco llamadas de emisión, cero aceptadas, contador 5, patrón terminado y `boss.fire` registrado. Por tanto, el contador no significa “proyectiles creados”; significa intentos/cadencia.

En una reproducción Chromium separada iniciada mediante `DMO.debug.pattern('fan')` (esa API omite el selector, pero la descarga posterior fue ejecutada por el `Th()` real), el puente de B2 emitió `attack.start` y `attack.end` con `completed:true` cuando el contador llegó a 5 y el total de proyectiles seguía en cero. Esa reproducción solo se usa para la coherencia de telemetría; **no** se usa para afirmar nada sobre el cursor.

### Efecto y clasificación

La rotación/cooldown del scheduler continúan; no se observó una selección posterior duplicada. Sí queda una discrepancia de combate/animación: B2 recibe el contador de intentos como si representara emisión aceptada y puede marcar completo un ataque sin proyectiles. **Defecto confirmado, bloqueado por el límite B2.** La corrección requiere separar intentos de aceptaciones y hacer que la integración B2 lea la señal aceptada (o equivalente), más cobertura de rechazo/parcial. No se cambió el código B2 ni el HTML.

## B4.1-R2 — fallo de corredor y cursor

Con las funciones reales `Th()`/`wh()`, la dependencia `kh()` controlada para devolver `null`, perfil `pulse` y lista `[ring, fan, spiral]`:

1. `Th()` eligió `ring`; el selector avanzó el índice **0 → 1** antes de llamar a `wh()`.
2. `wh()` devolvió `false`, dejó `pattern71` vacío, no inició aviso y fijó `attackTimer=0,6`; se registró `boss.defer: sin corredor libre`.
3. Tras 13 pasos de 0,05 s (0,65 s por la cuantización de la cuenta atrás), el selector inició `fan` con índice 2. `fan` no necesita hueco de corredor.

Sí hay un salto de selección y la distribución depende de si el corredor está disponible. Lo clasifico **intencional**, no como defecto: el patrón geométricamente inviable se descarta sin telegraph/daño y el scheduler vuelve a un ataque que no necesita ese corredor, en lugar de bloquear todo el repertorio. La cadena `boss.defer` suena a reintento del mismo patrón, pero el estado observable es una omisión segura; no hay evidencia de una regresión jugable que justifique alterar esa política.

## B4.1-R3 — saturación y recuperación

Condición fuente-acoplada, escritorio: `Gr.budget.projectiles=36`, de modo que `t=max(18,min(60,36+24))=60`; el gate usa `Ia.length > 0,55*t`, por lo que 34 proyectiles superan el umbral entero de 33.

- **Carga sostenida:** 34 proyectiles, 200 pasos × 0,05 s = **10,0 s**. No se inició un patrón, no avanzó el cursor y el timer de selección se volvió a diferir aproximadamente 0,3 s cada vez que vencía.
- **Liberación:** se detuvo el aporte de proyectiles; se simularon sus vidas reales de 3,6 s. El scheduler inició `fan` a los **3,7 s** (74 pasos) desde la liberación, sin reinicio manual ni limpieza de estado de ataque.

Conclusión: la inactividad mientras el umbral permanece superado es el gate de carga previsto; la permanencia de una fuente externa de carga mantendría el gate activo. Con carga finita y su expiración normal, hay recuperación automática. No se confirmó un deadlock interno.

## Cierre

R1 está reproducido en el runtime y confirmado; no se implementó porque la corrección toca el contrato B2 y falta autorización. R2 y R3 son comportamientos de omisión/espera segura y recuperación, clasificados intencionales. B4.1 **no puede aprobarse** mientras R1 permanezca sin corregir.
