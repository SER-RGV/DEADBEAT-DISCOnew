# B4 — Análisis de secuencias y combinaciones

**Fuente:** runtime activo `DEADBEAT_DISCO.ART.html`; evidencia de escenario `evidence/B4_combat/scenario_matrix.json`.  
**Alcance:** selección, timers, rango, fases, aplazamientos, recuperación, repetición y cargas simultáneas. No se modifica balance.

## 1. Ciclo real del patrón

1. `su()` crea la entidad con `attackTimer=2.05`, `entrance=1.3`, `phaseTimer=3.2`; copia la lista/atributos del perfil. El update no ejecuta `Th()` durante entrada, freeze o sweep.
2. Sin `pattern71`, `Th()` reduce `attackTimer`. Cuando llega a cero, aplaza 0,3 s si hay láser/hazard activo o demasiados proyectiles respecto al presupuesto dinámico.
3. El selector toma el cursor cíclico del perfil y llama `wh()`. `wh()` prepara mira/hueco, aviso `Ao[id].warn`, exposición visual y `attackTimer=999` mientras corre el aviso. `ring`/`spiral` se aplazan con timer 0,6 s si no hay corredor inicial.
4. Durante aviso, `Th()` reduce `patternWarn71`; luego comprueba otra vez el corredor para ring/spiral. Si ya no existe, limpia el patrón, da 0,5 s de exposición y reintenta tras 0,6 s.
5. Al emitir, `fan`/`ring` solicitan todos sus enlaces de una vez; burst solicita tres por paso; spiral dos por paso; summon llama `Sh()` dos veces. `vh()` es el punto de rechazo por presupuesto, borde u obstáculo.
6. Cuando termina el patrón, `pattern71` se limpia; `exposedT` usa `Ao.recover`; `attackTimer` añade `max(0.65, 1.5/(variantAttack * finalAttackMult))`. La cadencia efectiva no es un solo cooldown `Ao.recover`.

**Distinción crítica:** en la fuente, `patternShot71` avanza con las solicitudes de emisión, no con los booleanos aceptados de `vh()`. El wrapper B2 trata ese avance como señal de inicio de ejecución; por tanto la evidencia separa “intento” de “proyectil confirmado”. Ver B4-01.

## 2. Distancias y fases de movimiento

- **Chase:** boss avanza hacia el jugador a su `speed × speedMul72`; el cuerpo tiene radio lógico inicial `r=34`.
- **Ranged:** objetivo de 310 px para `pulse`, 260 px para los demás. Si está más cerca, se aleja; si más lejos que objetivo +60, se acerca; dentro de la franja queda quieto. El reposicionamiento usa 0,6× velocidad.
- **Fase normal:** inicio hunter/sweeper en chase y pulse en ranged. `phaseTimer` alterna chase/ranged: tras chase, 3,4–5 s; tras ranged, 2,8–4,2 s. Para `sweeper`, al vencer ranged y sin patrón activo, inicia sweep (2,7 s configurados; 0,9 aviso +1,4 barrido +0,3 cola), después vuelve a chase con 3–4,4 s.
- **Volley normal:** bajo ~68% de vida, una vez, entra en `volley` 2,4 s y vuelve a ranged; limpia patrón y sweep activos.
- **Berserk normal:** bajo 35%, limpia patrón/sweep, activa velocidad ×1,55, persigue continuamente y fuerza alternancia burst/spiral; el timer de alternancia normal deja de regir.
- **Núcleo:** umbrales ~70% y 35% cambian etapa, reinician cursor/timer/ataque y limpian patrón/sweep; ×1,12 y ×1,28 respectivamente. Etapa 2 coloca elec cada ~6,6 s; etapa 3 fire cada ~5,35 s. No se alteraron estos valores.

`dashCooldown` y `volleyCooldown` se inicializan y decrementan, pero no aparecen como condiciones del scheduler. No se deben interpretar como gates activos. La cadencia que se observa depende de `attackTimer`, `phaseTimer`, entradas/salidas de sweep, hazards, capacidad de proyectiles, adds y zonas.

## 3. Composición y repetición

- La base es **rotación fija**, no sorteo: los perfiles repiten su orden declarado. No hay reglas generales de “no repetir ataque”, anti-streak, adaptación al jugador o combo de jefe.
- Berserk reemplaza la lista normal por burst/spiral alternos basados en índice. Núcleo etapas 2/3 puede sustituir cada quinta selección por summon si conserva capacidad; después de agotar adds, retorna al orden final.
- `sweep` y las zonas no avanzan `patternIndex71`; se programan desde el update de fase/oleada. Por ello una secuencia real puede intercalar proyectiles, sweep y zonas aunque el cursor `patterns72` sea estrictamente cíclico.
- Añadir define presión adicional: `addTimer` se reinicia al intervalo configurado y `Sh()` puede rechazar por distancia, gap o cap. Si una llamada falla, no se incrementa `addsSpawned`, pero la próxima oportunidad espera otro intervalo.
- `du()` limita zonas por tipo y owner según B1. Si no encuentra espacio, residente reintenta en 0,9 s; Núcleo en 0,55 s. Zonas activas/warn ocupan slots hasta `out`.
- No se encontró una cadena authored que enlace ataque A→B por el input, posición o error del jugador. Esos elementos son capas independientes compartidas por el controlador.

## 4. Presión, inactividad y combinaciones simultáneas

El scheduler cede cuando `Zr`, `df`, `Da.length` o la carga `Ia` rebasa el umbral calculado con presupuesto. Esta puerta se evalúa antes de iniciar un patrón; el timer se repone a 0,3 s. No se halló duración máxima de cesión ni evento de telemetría propio para este bloqueo. Por fuente, puede haber pausas repetidas si los blockers siguen presentes; la duración/percepción real no se probó.

Durante una ejecución, `vh()` vuelve a filtrar cada proyectil. La mezcla posible en un encuentro incluye:

- patrón `Ao` en curso;
- sweep (solo al cerrar su fase ranged y si no está activo un patrón);
- adds por `addTimer`, cuyas propias amenazas no son parte de `patterns72`;
- zonas periódicas fire/elec (hasta límites B1);
- hazards externos/láseres y el resto del combate de sala.

No se observó en B4 el cruce de vida que activa volley/berserk ni se ejecutó un stress test que mantuviese ocupado el cap. Las 10 simulaciones se limitaron a observar el ciclo inicial con jugador quieto, en órbita o en retirada; invulnerabilidad y teleport son fixtures. El número de balas agregadas no permite asignar cada proyectil a boss, add o hazard.

## 5. Lecturas de B4 y propuestas acotadas

La selección observada en los diez perfiles siguió el orden declarado durante ventanas de 16 s; se vieron sweeps en Pogo, Matarife, Traidor y Núcleo. Los cortes finales incluyen patrones que quizá seguían en aviso o ejecución. No se infiere ritmo natural completo a partir de la muestra.

- **B4-01:** separar intentos y emisiones aceptadas para no sobrerrepresentar un ataque en FSM/telemetría. No tocar B2 sin autorización específica.
- **B4-02:** registrar el avance del cursor cuando `wh()` devuelve falso; decidir explícitamente entre skip adaptativo y conservar patrón. La corrección tiene riesgo de repetición/aplazamiento persistente.
- **Riesgo de saturación:** instrumentar tiempo/causa de gate antes de considerar cualquier timeout que cambie presión.
- **S3 campos inertes:** aclarar o retirar los counters cooldown solo después de confirmar que ninguna herramienta externa los consume.

Ninguna propuesta modifica daño, cantidad/velocidad de proyectiles, hitbox, ventana de aviso/recuperación, movimiento, invulnerabilidad, adds, vida, fase ni límite de zonas. Se requiere prueba reproducible antes de aplicar un cambio.