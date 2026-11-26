# Plan propuesto de evolución integrada de los sistemas de bosses

**Estado:** propuesta posterior a auditoría; **no implementada**.
**Fecha:** 2026-11-04
**Propósito:** describir cómo evolucionar el sistema que el juego ya tiene, sin crear un segundo sistema de combate ni presentar comportamiento propuesto como funcionalidad existente.

**Estado auditado resumido:** runtime de boss **IMPLEMENTADO**; diferenciación de AI/animación **PARCIAL**; combo authored de jefe **AUSENTE**; fairness, bots y pruebas gameplay **NO VERIFICADO**. Estos estados describen el motor existente, no el plan propuesto.

## 1. Base auditada

El motor selecciona nueve residentes de círculo + Núcleo Final, con constructor `su()`, controlador común `Th()` y arquetipos `hunter`/`pulse`/`sweeper`/`final`, patrones telegráficos, proyectiles, adds, zonas, fases, daño/muerte, combo del jugador y dispatch de animación. El arreglo `Ye` contiene diez perfiles (nueve residentes y una copia de `nucleo`); `aa(100)` usa el perfil `We` separado para el encuentro final. La diferenciación actual vive principalmente en datos de `Ye`/`We`; la AI es compartida. La auditoría no encontró un sistema general de combos authored por boss.

Las brechas inmediatas más relevantes son **de contrato y evidencia**: residentes narrativos y IDs visuales estables son listas distintas que comparten algunas keys de atlas, falta una validación gameplay que cubra los nueve residentes y el Núcleo, y `Ye.zones.max` no coincide necesariamente con el límite global usado por `du()` (Bufé declara fire max 2 y el colocador permite globalmente hasta 3). La solución no es reemplazar el motor ni cambiar el resolver durante esta fase; la diferencia de zonas debe resolverse como decisión explícita sin asumir que cambiar el valor es automáticamente correcto.

## 2. Arquitectura integrada propuesta (sin código nuevo aquí)

### Fuente de verdad

- Conservar `Ye`/`We` como fuente autoritativa de contenido para identidad de combate, arquetipo, patrones, adds, zonas y reglas ya existentes.
- Conservar `su()` como ruta de spawn y la campaña actual como responsable de elegir sala/residente.
- Conservar el update de boss y `Th()`/`wh()` como controlador/scheduler existente. Nuevas variaciones autorizadas se expresarían como datos que este controlador consuma, no como un `BossAI2`, un segundo loop o colisiones paralelas.
- Conservar `lu.applyBoss()`, `wp()`, `Ep()` y el flujo actual de proyectiles/hazards para aplicar daño, vida, progreso, muerte y combo del jugador.
- Conservar `DMO.combatArt.bossState`, `bossId` y el renderer `Of()`/dispatch HD como ruta visual. La presentación consume el estado/evento de la entidad existente; no mantiene un estado de combate alternativo.

### Contrato explícito de identidad

- Antes de mapear nombres, acordar qué significan «nueve bosses»: nueve residentes más final, o nueve en total contando final.
- Para cada encuentro, especificar por separado `residentId` (identidad de combate/círculo) y el `artId` estable elegido, si lo hay. Si no hay mapeo aprobado, dejarlo sin inferir; la coincidencia `boss0`/índice no basta.
- Crear/validar una tabla de contrato en pruebas/datos después de aprobación. **No cambiar ahora** `artId`, el resolver, aliases ni recursos T01/T02.

### Secuencia de ataque/eventos

- Un solo estado de entidad y un solo ciclo de vida: spawn → entrada/aviso → patrón actual → hit/damage/exposure → fase existente → muerte/progreso.
- Los avisos, los ataques y las zonas deben usar las funciones/colliders actuales. Cualquier nueva señal de animación/sonido se vincula al mismo patrón o fase, sin duplicar timers o determinar daño desde el renderer.
- Mantener límites de proyectiles, checks de corredor y protección frente a bloqueo. Cualquier excepción necesita test de geometría antes de revisar balance.

## 3. Fases de trabajo propuestas

| Fase | Trabajo | Resultado verificable | Autorización requerida |
|---|---|---|---|
| A — Auditoría | Cinco documentos entregados; status por área; diferencia entre residente, artId, propuesta y evidencia. | Inventario estático legible y rastreable. **Esta fase se completa con los cinco archivos de esta entrega.** | Ya solicitada. |
| B — Decisión de identidad | Usuario/producto confirma conteo y relaciones canónicas residentes↔artIds; se revisa un diff/documento antes de tocar recursos/resolver. | Tabla aprobada; sin cambio de gameplay. | **Sí; no inferir en implementación.** |
| C — Especificación integrada | Convertir cualquier pedido de ataques/combos en requisitos que usen `Ye`/`Th`/`Ao`; marcar explícitamente qué es existente y qué cambia. Conservar balance salvo solicitud específica. | Especificación revisada y criterios de aceptación antes de código. | **Sí; aún no autorizada.** |
| D — Implementación mínima | Solo los cambios aprobados, dentro del sistema existente; no añadir nueva fase, personaje, patrón o retoque visual no solicitado. Un conjunto por PR/diff pequeño, preservar cambios preexistentes. | Cambios del motor integrados en la ruta actual y diff auditable. | **Autorización separada necesaria.** |
| E — Validación gameplay | Tests deterministas/unitarios de datos y estados; escenarios de navegador para cada residente/final; geometría de proyectiles, pasillos, paredes, gaps, zonas y telegráficos; tests de muerte/progresión/combo/hooks; playtest de fairness y revisión de legibilidad. | Evidencia separada por combate, animación y visual; fallos reproducibles. | **Autorización separada necesaria.** |
| F — Rendimiento GPU | Ejecutar solo con el gate/harness externo en hardware GPU real y matriz comparativa válida. | Gate externo aprobado con evidencia comparable. | Trabajo independiente; sigue **BLOCKED**. |

## 4. Propuesta de pruebas mínimas para la futura fase E

1. **Integridad de datos:** todas las claves de `patterns` existen en el catálogo actual (`Ao`); los índices/limits de `Ye`/`We` son válidos; cada residencia esperada se selecciona en su ronda y Núcleo en la 100.
2. **Ciclo de patrón:** para cada arquetipo y residente, verificar selección repetible con semilla/estado controlado, aviso antes de ejecución, recuperación, aplazamiento de corredor y limpieza al morir/cambiar fase.
3. **Adds y vulnerabilidad:** verificar límites/capacidad, conteo `addsAlive`, protección ×0,65, exposición ×1,5 y muerte/pago del Cajero; no reequilibrar coeficientes en un test de regresión.
4. **Colisión/hazards:** swept projectile vs jugador/pared, contacto boss, arco sweep, ring/spiral gap, zonas warn→active→expire y colocación con todas las rutas de salida representativas.
5. **Eventos del jugador:** cada source de boss damage atraviesa la ruta de vida/invulnerabilidad existente; muerte dispara una sola vez score/combo/progreso/pago y final limpia sus zonas sin borrar otras entidades.
6. **Identidad y rendering:** probar entidad con artId válido, alias legacy de residente y Núcleo; comprobar estado idle/attack/hit/death con recursos existentes y fallback. Esta prueba valida dispatch visual, no identidad narrativa ni gameplay.
7. **Playtest:** revisar telegráficos/contraste, rutas de escape, sensibilidad a input/frame pacing y variedad/percepción de los diez encuentros; registrar versión, opciones, resoluciones y resultados. El resultado debe distinguirse de los checks de assets.

Los tests de bots, si se autorizan, deben ejercer el juego por input y medir ruta de escape/tasa de daño; `DMO_ART_TEST` no debe presentarse como bot ni como prueba de fairness.

## 5. Restricciones de alcance y criterios de salida

- Nada de sistema paralelo de combate/AI o de muerte/colisión; reutilizar ciclo existente.
- No cambiar `BOSS-T02`, recursos visuales T01/T02, `ART_PACK` o prioridad de `artId` como parte de la auditoría; evitar `DEADBEAT_DISCO.ART.html` hasta que una fase con código sea autorizada y técnicamente justificada.
- No cambiar balance ni introducir fases/patrones/combos de jefe sin solicitud explícita. La única referencia a fases de Núcleo documenta las tres que ya existen.
- No marcar «AI probada» por render, loader, captura de boss o benchmark de arte; no marcar rendimiento como aprobado con SwiftShader.
- Mantener la puerta de GPU real fuera de la validación gameplay; `T02` sigue integrado/verificado, pero no cerrado. No abrir T03 por esta propuesta.
- Antes de cualquier implementación posterior: presentar el diff previsto y casos de prueba; respetar modificaciones no relacionadas existentes.

## 6. Estado actual del trabajo

Se añadieron los cinco informes de Phase A. **No se modificó código de combate, balance, renderer, resolver ni arte para esta auditoría.** No se ejecutaron tests de gameplay/bot ni benchmark de rendimiento. El gate GPU sigue bloqueado, aparte de este trabajo.


## Actualización de alcance — B2 autorizada y completada (2026-11-04)

La tarea B2 autorizó una integración acotada de animación, no la implementación del plan de combate por fases descrito arriba. Se reusó el controlador/runtime de animación compartido; no se alteraron scheduler, patrones, fases de gameplay, daño o hitboxes. B2 y sus límites están registrados en `BOSS_B2_ANIMATION_REPORT.md` y los tres documentos de contrato/cobertura de animación. La integración de código y las regresiones técnicas están **APROBADAS**; fairness/legibilidad humana continúan **NO VERIFICADAS** y rendimiento GPU **BLOQUEADO**. Las fases de implementación A, C–F de este plan no se ejecutaron por esta tarea. En particular, **B3, B4, B5 y B6 no se iniciaron**; cualquier trabajo posterior requiere autorización separada.
