# B3 — Contrato común de Telegraph & Attack Communication

**Estado del contrato:** **APROBADO técnicamente** desde los IDs/scheduler reales tras aplicar la excepción limitada autorizada.
**Cierre B3:** **APROBADO** en código e integración; legibilidad/fairness humana permanece **NO VERIFICADA**.

## Identidad y fuente de verdad

| Entidad | Identidad real | Fuente autorizada |
|---|---|---|
| Boss residente | `Ye[].id`: `anden`, `magneta`, `bufe`, `cajero`, `pogo`, `oficiante`, `matarife`, `imitador`, `traidor` | Perfil de combate existente `Ye` |
| Boss final | `nucleo` | Registro final distinto `We`; no inferir por `artId` |
| Ataques de patrón | `fan`, `ring`, `spiral`, `burst`, `summon` | Claves existentes de `Ao`; las listas por boss se leen de `Ye`/`We` |
| Sweep | `phase.sweep` como etiqueta de auditoría; en runtime es el objeto existente `entity.sweep` con fase `sweep`, no una clave inventada de `Ao` | Scheduler de fases `Tf`/`a.run` y actualización/hit-check existentes |
| Zonas | `zone:fire`, `zone:elec`; cada instancia recibe ID runtime `BOSSPAT-*` | `Ye.zones`/etapas de `We`, scheduler `du()` y subsistema `jc` |

El scheduler decide **si, cuándo y dónde** hay ataque, hitbox, proyectil, add, zona, interrupción y recuperación. Una señal visual solo puede reflejar esos registros y tiempos. B2 es observadora de las notificaciones existentes; no controla ni sustituye el scheduler.

## Ciclo visual normativo

1. **Inicio/selección:** comunicar solo después de que el scheduler seleccione un patrón o cree un sweep/zona. Para patrones, `wh()` copia la dirección/corredor vigentes y toma el `warn` de `Ao`; para sweep/zonas, se consumen los campos del propio objeto scheduler.
2. **Anticipación:** progreso basado en el tiempo restante real (`patternWarn71`, `sweep.warn` o `zone.warn`). Dirección y área deben derivar de los mismos campos que usa la ejecución, no de la pose, el atlas, la orientación supuesta o un temporizador paralelo.
3. **Ejecución:** la señal cambia únicamente cuando el scheduler comienza a emitir los proyectiles/adds o cruza la ventana activa del sweep/zona. En patrones la B2 observa `telegraph`, `attackStart` y `attackEnd`; el renderer no debe inventar impactos ni persistencias.
4. **Recuperación:** respetar únicamente `Ao.*.recover`, la cola `.3` del sweep y los ciclos/lifetime existentes de zonas/proyectiles. B3 no introduce retrasos, extensiones ni cooldowns.
5. **Cancelación/defer/muerte/cambio de fase:** limpiar o retirar la señal si el scheduler cancela el objeto; un objeto activo que siga siendo peligro real continúa representado hasta el fin real. No inferir cancelación a partir de clips. `boss.defer` indica que un corredor no fue ejecutable y no debe mostrarse como ataque disparado.

## Geometría existente y contrato medido

| Attack ID / familia | Área/dirección scheduler | Señal actual | Resultado |
|---|---|---|---|
| `fan` | `patternAim71`; cinco proyectiles dentro de `Ao.fan.spread=.64` | `Ch()` dibuja límites ±`.32` y rayo central | **Coincide como envolvente angular**. No predice trayectorias individuales después de disparar. |
| `ring` | `patternGap71`; hueco `Ao.ring.gap=1.1` | Límites cian ±`.55` | **Coincide** con los límites del hueco. El anillo no representa vida/impacto individual de cada proyectil. |
| `spiral` | Los disparos se omiten cuando la distancia angular al corredor no excede `.62` rad | `Ch()` dibuja límites ±`.62` rad | **Coincide:** ambos límites son ±0.62 rad. |
| `burst` | `Th()` emite en `patternAim71 ± .115` rad | `Ch()` marca líneas ±`.115` rad | **Coincide:** el renderer marca los mismos offsets que emite el scheduler. |
| `summon` | `Sh()` crea dos adds a radio 190 con el ángulo guardado | `Ch()` marca los dos puntos/radio | **Coincide para el spawn**. No comunica acciones futuras de los adds. |
| `phase.sweep` | `a0`, `dir`, `arc=2.4`, `warn=.9`, `fire=1.4`, rayo de 720 unidades | `Of()` dibuja sector y rayo usando el objeto scheduler | Coincide durante actividad normal; volley y berserk no-finales limpian ahora el objeto cancelado, sin cambiar el update/hit-test. |
| `zone:fire` / `zone:elec` | Zona real con centro/radio/tipo/warn/life y owner | `jc.drawZones()` dibuja el círculo y progreso del warning | Área/tiempo coinciden por instancia; no se requiere evento FSM individual porque cada objeto es una señal visual independiente y B2 solo conserva una máquina por boss. |

## Protocolo de eventos y estado

- `wh()`/`Th()` permanecen como autoridad para los patrones y su inicio/fin; el hook B2 ejecuta primero la función real y observa sus cambios.
- `telegraph` corresponde al warning real; `attackStart` requiere emisión efectiva (`patternShot71`/cambio scheduler); `attackEnd` distingue completado/cancelado; `phase.change`, `attack.interrupted`, `boss.defer` y `death` no crean ataques.
- La FSM B2 conserva prioridad y estados existentes. No añadir eventos por zona: los registros de zona y `jc.drawZones()` ya comunican cada peligro por separado.
- `C` en la matriz significa coincidencia estática del contrato espacial/temporal y eventos aplicables. `P` significaría discrepancia de geometría/lifecycle; no quedan enlaces `P` tras la corrección. `NV` significa que el ciclo de ese ataque no se ha observado en navegador. Ninguno de estos códigos certifica legibilidad humana.

## Restricciones preservadas

No añadir arte, sonidos ni identificadores de ataque inventados; no duplicar scheduler/FSM/renderer/cache; no modificar `Ao`, `Ye`, `We`, daño, hitboxes, cooldowns, tiempos, velocidad, patrones, recuperación, `zones.max`, B1, T01/T02, carga de assets, HUB ni resolver de identidad visual. Las correcciones de área y limpieza del sweep se aplicaron dentro de la excepción técnica limitada autorizada. La FSM B2, scheduler, patrones y valores de combate permanecen sin cambios; las zonas continúan comunicadas por cada registro visual existente.

## Matriz fuente (resumen por boss)

| Boss ID | Attack IDs reales | Estado estático | Observación de ejecución real |
|---|---|---|---|
| `anden` | `fan` C, `burst` C, `ring` C | Aprobado | Ciclo natural `fan` únicamente; `burst`/`ring` NV |
| `magneta` | `burst` C, `fan` C, `ring` C | Aprobado | Ataques NV |
| `bufe` | `ring` C, `spiral` C, `burst` C, `zone:fire` C | Aprobado | Ataques NV |
| `cajero` | `ring` C, `fan` C, `spiral` C | Aprobado | Ataques NV |
| `pogo` | `burst` C, `fan` C, `spiral` C, `phase.sweep` C | Aprobado | Sweep/interrupt reproducido con inputs QA; ciclo natural NV |
| `oficiante` | `summon` C, `ring` C, `spiral` C, `zone:elec` C | Aprobado | Ataques NV |
| `matarife` | `spiral` C, `burst` C, `fan` C, `phase.sweep` C, `zone:fire` C | Aprobado | Ataques NV |
| `imitador` | `fan` C, `ring` C, `burst` C | Aprobado | Ataques NV |
| `traidor` | `ring` C, `burst` C, `spiral` C, `phase.sweep` C, `zone:elec` C | Aprobado | Ataques NV |
| `nucleo` | `fan` C, `ring` C, `burst` C, `spiral` C, `phase.sweep` C, `summon` C condicional, `zone:elec` C etapa 2, `zone:fire` C etapa 3 | Aprobado | Ningún ciclo completo verificado |

**Conteo de enlaces:** 42 total = **42 C + 0 P + 0 sin señal estática**. El desglose completo ataque por ataque, timings y evidencia está en `B3_TELEGRAPH_AUDIT.md`.
