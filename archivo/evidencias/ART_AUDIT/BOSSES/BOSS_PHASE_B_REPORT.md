# DEADBEAT DISCO — Boss Phase B report (B1: ZONES.MAX)

**Resultado B1: APROBADO** para los límites y la atribución de propietario especificados. Implementación incremental completada; **B2–B6 no iniciadas**.
**Fecha:** 2026-11-04
**Alcance:** límites de zonas por tipo y perfil, referencia estable al boss creador, liberación de capacidad, integración/regresión. Sin cambios en daño, duración, cadencia, geometría, hitboxes, patrones, resolver, assets, HUB ni balance deliberado.

**Estados del inventario:** gestión de `zones.max` y ownership **IMPLEMENTADO**; discrepancia previa **PARCIAL (corregida en B1)**; perfiles de zona residentes fuera de los cuatro configurados **AUSENTE**; fairness/playtesting **NO VERIFICADO**.

## Resultado y estados

| Área | Estado | Evidencia |
|---|---|---|
| Cap global eléctrico (2) y fuego (3), contado por tipo | **APROBADO** | Suite determinista y browser integration: se mantienen los topes; un tipo no consume slots del otro. |
| `zonePattern.max` finito y coincidente con el tipo | **APROBADO** | Cuatro perfiles reales comprobados; Bufé ahora queda en 2. |
| Propietario exacto por zona, incluido cuando hay dos objetos boss activos en la lista | **APROBADO** en el scheduler probado | Cada zona conserva referencia directa al objeto creador. Suite determinista cubre dos bosses simultáneos; browser integration cubre el boss real más un owner sintético. El juego de producción sigue teniendo una sola entidad `sr` activa. |
| Limpieza/caducidad/reinicio y referencias obsoletas | **APROBADO** en pruebas de funciones/manejador | Se ejecutaron los helpers reales de purge/clear y el cuerpo real de `jc.reset()` con fixtures; browser integration comprobó limpieza de owner y reset de la lista real. |
| Regresión visual T01/T02 | **APROBADO** | T01 17/17, T02 16/16; informes y capturas archivados bajo `evidence/B1_zone_max/regression/`. |
| Playtesting humano/bots de fairness o validación global de gameplay | **NO VERIFICADO** | No se ejecutaron bots agresivos/evasivos/defensivos ni playtest. Esta limitación no se presenta como fairness validada. |
| Rendimiento GPU | **BLOQUEADO** (gate separado; no ejecutado en B1) | No forma parte de esta corrección; no se afirma ningún resultado de rendimiento. |

## Comportamiento antes/después

| Escenario | Antes | Después | Resultado |
|---|---:|---:|---|
| Bufé: fuego, `zones.max=2` | 3 zonas | Máximo 2 zonas propias | **CORREGIDO** |
| Oficiante: electricidad, máximo 2 | 2 | 2 | Sin regresión |
| Matarife: fuego, máximo 3 | 3 | 3 | Sin regresión |
| Traidor: electricidad, máximo 2 | 2 | 2 | Sin regresión |
| Núcleo, fase 2 / electricidad | 2 | 2 | Fallback global conservado |
| Núcleo, fase 3 / fuego | 3 | 3 | Fallback global conservado |
| Fuego con una zona eléctrica preexistente | 2 disponibles | 3 disponibles, si hay geometría válida | **Corregido según la regla por tipo** |
| Electricidad con una zona de fuego preexistente | 1 disponible | 2 disponibles, si hay geometría válida | **Corregido según la regla por tipo** |

Los 13 escenarios base se conservan: nueve residentes, dos fases del Núcleo y las dos interacciones de tipos mezclados. El JSON `after_fix.json` incorpora el registro histórico previo y el resultado actual. La cantidad de colocaciones observada depende también del filtro geométrico; los valores de esta tabla provienen de arena determinista abierta o de la integración indicada.

## Implementación

### Cálculo de capacidad

`du()` identifica el tipo solicitado y cuenta únicamente zonas del mismo tipo que estén activas (`warn` o `on`; `out` ya no consume capacidad durante su fade final). La capacidad queda limitada por las dos condiciones a la vez:

```text
globalAvailable  = globalCap[type] - activeZonesOfType[type]
profileAvailable = profileMax[type] - activeZonesOfThisBossAndType[type]
available        = max(0, min(globalAvailable, profileAvailable))
```

Límites globales conservados: electricidad 2, fuego 3. Un perfil solo limita el tipo que declara. Un `max` finito y no negativo se trata como entero (floor); `0` es válido y bloquea nuevas zonas. Máximo ausente, no numérico, negativo, no finito o de un tipo distinto usa fallback global. El fallback también se aplica al Núcleo, que no tiene `zonePattern.max`.

El conteo global incluye otras zonas activas del mismo tipo en `jc.zones()`, pero no zonas del tipo opuesto. La capacidad aggregate del escenario puede, por tanto, llegar a 2 eléctricas + 3 de fuego, tal como exige la especificación por tipo; los máximos individuales no pueden superar esos topes.

### Propiedad y ciclo de vida

Antes, las zonas de `du()` solo tenían el booleano `bossZone72`; no guardaban quién las creó. Ahora cada zona lleva `bossZoneOwner72: e`, una referencia directa al objeto boss que invocó `du()`. No se consulta `sr` ni un ID global, y dos objetos con el mismo `resident/id` no comparten contador por accidente.

- Las zonas conservan la referencia durante `warn`, `on` y `out`; la capacidad solo cuenta las activas (`warn`/`on`).
- El manager elimina zonas `out` al terminar el fade; `jc.clearZonesGaps()` y `jc.reset()` vacían sus arrays y liberan las referencias.
- `uu(boss)` ahora elimina solo las zonas de ese objeto propietario. Sus tres rutas de muerte del Núcleo pasan `sr` explícitamente; no puede purgar zonas de otro boss.
- `jc.state()` construye un resumen por whitelist y no serializa la referencia al objeto propietario.
- El juego de producción sigue teniendo un único boss activo (`sr`/`ir`). Los casos con dos objetos verifican que el scheduler/contador no dependa de un singleton; no añaden una mecánica de bosses simultáneos al juego.

## Pruebas y resultados

### Deterministas, source-coupled

Se amplió `ART_TOOLS/qa/test_boss_zone_max_b1.js`; no se sustituyó por una prueba simplificada. Extrae los datos reales `Ye`/`We`, ejecuta la función `du()` real y ejecuta los helpers reales `uu()`/`ee()` y el cuerpo real de `jc.reset()` con dependencias de arena controladas.

- 13 escenarios base preservados y aprobados.
- 13 grupos de comprobaciones ampliadas aprobados: Bufé 2/rechazo/refill; los otros residentes configurados; topes globales; separación por tipo; dos propietarios distintos; sharing del límite global para el mismo tipo; valores ausentes/invalid/zero/fractional; zonas `out`; fallback del Núcleo; purge por propietario; clear; reset; salida del serializer.
- No se requiere navegador para esta suite.

Comandos ejecutados:

```sh
node --check ART_TOOLS/qa/test_boss_zone_max_b1.js
node ART_TOOLS/qa/test_boss_zone_max_b1.js
python -m json.tool ART_AUDIT/BOSSES/evidence/B1_zone_max/after_fix.json
```

Todos pasaron. Evidencia: `current_behavior.json` (baseline), `after_fix.json` (comparación y casos actuales), `browser_integration.json`, `regression/T01_browser/qa_report.json`, `regression/T02_browser/qa_report.json` y `SHA256SUMS.txt`.

### Browser integration del juego real

Se cargó el HTML actual (HTTP 200) en Chromium headless y se usó una inyección efímera, solo del servidor de prueba, para invocar las funciones léxicas reales; no se añadió hook de QA al HTML del repositorio. El constructor real produjo al residente Bufé en ronda 33 con `zonePattern.type=fire,max=2`. Con `Qs`, `jc`, `du` y `jc.reset()` reales:

- colocación inicial Bufé = 2; solicitud siguiente rechazada;
- retirar una zona permite rellenar hasta 2;
- un boss eléctrico sintético puede colocar 2 eléctricas mientras Bufé conserva sus 2 de fuego;
- `uu(Bufé)` quita únicamente las suyas y deja las eléctricas del otro owner;
- `jc.reset()` deja 0 zonas; cero errores de página.

Clasificación: **prueba de integración en navegador**, no una sesión de combate controlada. La inyección y el servidor temporales no se guardaron como código de producto.

### Regresiones visuales disponibles

Se ejecutaron los validadores existentes contra el mismo HTML servido con la inyección temporal; las salidas se redirigieron a carpetas temporales para no sobrescribir la evidencia histórica:

- BOSS-T01 **17/17 checks**, 0 errores de página, 0 respuestas fallidas.
- BOSS-T02 **16/16 checks**, 0 errores de página, 0 respuestas fallidas.
- Informes y capturas generadas se copiaron a `ART_AUDIT/BOSSES/evidence/B1_zone_max/regression/`.

Estas regresiones validan arte/render/dispatch, no fairness de combate. No se ejecutó una prueba de rendimiento ni se utilizó SwiftShader para declarar rendimiento.

## Archivos modificados

- `DEADBEAT_DISCO.ART.html`: `du()` calcula límites globales y por propietario/tipo; las zonas conservan `bossZoneOwner72`; `uu(boss)` y sus tres call sites limpian por propietario.
- `ART_TOOLS/qa/test_boss_zone_max_b1.js`: ampliación de la prueba previa, conservando los 13 escenarios base.
- `ART_AUDIT/BOSSES/BOSS_PHASE_B_REPORT.md`: este informe.
- `ART_AUDIT/BOSSES/COMBAT_AI_AUDIT.md` y `ART_AUDIT/BOSSES/ATTACK_PATTERN_INVENTORY.md`: estado B1 actualizado.
- `ART_AUDIT/BOSSES/evidence/B1_zone_max/`: JSON antes/después, browser integration, informes/capturas de regresión y hashes.

No se modificaron `ART_PACK/art_pack.js`, resolver `artId`, assets BOSS-T01/T02, balance, daño, duración, cadencia, hitboxes, patrones, HUB ni rendimiento GPU. El HTML ya estaba modificado por trabajo previo; la edición B1 se limitó a los puntos citados y no revirtió cambios ajenos.

## Git, incidencias y limitaciones

- Rama conservada: `arena/179474d9-deadbeat-disconew` (**active**). No se creó commit.
- El worktree ya contenía cambios/untracked previos; se conservaron. El listado completo sigue disponible con `git status --short`.
- Incidencia de prueba inicial: el puerto 4173 estaba ocupado; la integración se sirvió en 4174. No afecta al juego ni al resultado.
- Dos bosses simultáneos se ejercitaron como objetos distintos compartiendo la lista real/fixture de zonas, pero el motor no tiene spawn simultáneo de bosses. Ningún test afirma lo contrario.
- No se hicieron bots ni playtesting humano; fairness permanece **NO VERIFICADO**. No se midió GPU.

## Cierre de alcance

**B1: APROBADO** para los requisitos de conteo, propiedad, límites, liberación/reset y regresiones automatizadas disponibles. La validación de fairness del combate queda **NO VERIFICADO**, fuera del alcance del cambio B1. **Detenerse aquí:** no se inició B2, B3, B4, B5 ni B6.
