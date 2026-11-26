# B3 — Decisión de auditoría: eventos de comunicación para las seis zonas

**Decisión documentada antes de cambiar runtime/B2:** no ampliar B2 ni emitir seis notificaciones FSM adicionales.

## Enlaces auditados

- `bufe / zone:fire`
- `oficiante / zone:elec`
- `matarife / zone:fire`
- `traidor / zone:elec`
- `nucleo / zone:elec` (etapa 2)
- `nucleo / zone:fire` (etapa 3)

## Datos observados

Cada zona es ya un registro independiente creado por `du()` en el arreglo real `jc.zones`: tiene `id: BOSSPAT-*`, `kind: zone`, `type`, `x/y`, `r`, `warn`, `life`, `t`, `state: "warn"` y, para zonas de boss, el owner real `bossZoneOwner72`. `jc.drawZones()` itera esos mismos registros, dibuja su círculo en la posición/radio reales y calcula el progreso del aviso con `e.t/e.warn`; el update existente convierte el mismo registro de `warn` a activo. Por tanto, si coexisten dos zonas, sus dos marcadores y temporizadores siguen separados y ligados a sus amenazas reales.

B2, en cambio, guarda una sola máquina de estados por boss y acepta los eventos de ciclo del ataque de patrón/sweep. Enviar varios `telegraph` al mismo registro FSM del boss haría que el último patrón sobrescribiera el primero, y `attackStart`/`attackEnd` no podrían modelar correctamente instancias de zonas concurrentes. No se debe usar la FSM del boss como segundo scheduler de amenazas.

El `ih("boss.warn", ...)` encontrado en `wh()` escribe un registro en `mo.log`; no es la notificación de `DMO_BOSS_ANIMATION_FSM` ni una señal visual. Cambiar su payload o emitirlo por instancia alteraría el contrato del log sin resolver concurrencia. El toast `Pp` de patrones tampoco sustituye ni necesita duplicar los marcadores espaciales de cada zona.

## Decisión y alcance

Las seis zonas **no necesitan un evento individual B2**: la comunicación ya es individual por instancia mediante el objeto scheduler real y `jc.drawZones()`. Se conserva esa señal; no se añaden eventos, temporizadores, entidades o canales paralelos, y no se toca B2 por las zonas. En la matriz B3, las seis pasan de `P` a `C` por coincidencia de objeto, radio, posición y ventana de warning. La legibilidad humana y la interpretación durante concurrencia permanecen **NO VERIFICADAS** hasta playtesting.

Este análisis no cambia código de producción. Solo después de esta decisión documentada se aplicarán las correcciones autorizadas de geometría `burst`/`spiral` y la limpieza del sweep interrumpido.
