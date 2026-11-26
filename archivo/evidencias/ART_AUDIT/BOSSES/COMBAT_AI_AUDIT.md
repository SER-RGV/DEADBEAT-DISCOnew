# Auditoría del combate y AI de jefes

**Fecha:** 2026-11-04
**Método:** seguimiento estático de selección/spawn, update, patrones, daño, muerte y hooks de juego en `DEADBEAT_DISCO.ART.html`; contraste con QA anterior. No se implementó ni modificó nada para esta auditoría.

## Resumen ejecutivo

**IMPLEMENTADO:** un sistema de boss integrado en la campaña. `su()` crea la entidad `sr`; la configuración procede de residentes `Ye` o del Núcleo `We`; el loop de gameplay actualiza el boss, sus ataques, adiciones, daño y colisión. `Th()` ejecuta los patrones mediante `wh()`/`vh()`. La muerte pasa por `Ep()` y la economía/progresión del residente.

**PARCIAL:** especificidad por boss, fases y protección. El sistema diferencia residentes mediante datos y comparte un controlador/arquetipos; no son nueve árboles de AI separados. Las fases normales son genéricas. El Núcleo sí tiene tres umbrales/fases específicos. El combo del jugador está integrado, pero no equivale a combos authored de jefe.

**NO VERIFICADO:** calidad de decisiones, justicia, hitbox visual-versus-lógica, dificultad real, respuesta de jugadores/bots y estabilidad del balance. Los informes T01/T02 citados abajo son de arte/render/loader y no satisfacen esas validaciones.

## Flujo existente

1. **Ronda y selección — IMPLEMENTADO.** `Xe()`/`Je()` calculan círculo y posición; `Ge` es 11. `su()` llama `aa(Wo)` en fin de círculo (`$e(Wo)`, salas 11, 22…99) y en ronda 100. `aa()` toma los nueve residentes de círculo desde `Ye` y devuelve `We` para el final. **Nota de datos:** `Ye` tiene diez entradas e incluye además un perfil `nucleo` que duplica `We`; la selección final usa `We`. Fuera de la selección hay variantes fallback para bosses genéricos/de prueba.
2. **Inicialización — IMPLEMENTADO.** `su()` construye un boss circular (`r:34`) con HP/velocidad escalados por ronda/dificultad y copia la identidad, variante, lista `patterns72`, límites de esbirros, zona/escalado y multiplicadores del residente. La entrada dura 1,3 s; después anuncia que ataca. `ir` y `sr` guardan existencia y entidad activa.
3. **AI compartida — IMPLEMENTADO.** El loop de `sr` alterna persecución y distancia según arquetipo, administra entrada, fases, temporizadores, esbirros y zonas; `Th()` elige el siguiente patrón de la lista. Los datos de `Ye` varían el repertorio y los parámetros. No hay una clase/controlador independiente por cada residente.
4. **Aviso y ejecución — IMPLEMENTADO.** `wh()` prepara patrón, objetivo, corredor y aviso; los anuncios pasan por `Pp()`. `Th()` espera el telegráfico y ejecuta los proyectiles o la invocación. `vh()` agrega proyectiles hostiles `r:5`, con velocidad configurada y vida máxima 3,6 s, respetando límites dinámicos de proyectiles/escena.
5. **Daño — IMPLEMENTADO.** Los proyectiles de jugador se enfrentan al boss vía la colisión de objetivos (`Ih` en el loop de `wa`) y `lu.applyBoss()`. Daño se multiplica por 1,5 durante `exposedT`; con esbirros vivos usa 0,65 (35% menos). La colisión cuerpo a cuerpo del jugador compara `distancia < sr.r + ye.r`; si impacta se invoca `wp("boss", ...)`. El barrido usa distancia del jugador a un segmento de 720 px y radio de tolerancia `ye.r + 22`.
6. **Muerte y progresión — IMPLEMENTADO.** A HP <= 0 el loop de proyectiles llama `Ep()`, elimina el boss, limpia zonas finales si corresponde y genera efectos; la muerte aumenta puntuación/combo y llama la ruta de pago del residente (`na()`). La entidad activa se limpia con `ir=false`, `sr=null`.
7. **Eventos jugador/sistema — IMPLEMENTADO.** `su()` invoca `_p.onBossSpawn`; cambios de fase llaman `_p.onBossPhase`. `wp()` centraliza daño al jugador, escudo/invulnerabilidad, pérdida de vida y reducción de combo. `Ep()` centraliza kill, score y combo. `DMO.combatArt` observa estado/hit/death para rendering.

## Attack, combo, fase y telemetría

- **Patrones enumerados:** abanico, anillo, espiral doble, ráfaga y summon. Las constantes están en `Ao`; tiempos, número y velocidad de proyectiles constan en `ATTACK_PATTERN_INVENTORY.md`.
- **Fases normales — PARCIAL.** El umbral compartido de ~68% activa `volley`; ~35% activa `berserk`. En `berserk`, movimiento es 1,55× y la selección fuerza alternancia spiral/burst. No se encontraron fases authored con objetivos/reglas diferentes para cada residente.
- **Sweeper — IMPLEMENTADO.** Al vencer temporizador desde ranged inicia barrido rotatorio: aviso de 0,9 s, arco 2,4 rad durante 1,4 s, longitud de prueba 720 px; luego vuelve a chase. Su único hit se resuelve por segmento.
- **Núcleo — IMPLEMENTADO.** Fase 2 y 3, cambio de secuencia/ataque y colocación periódica de zonas eléctricas/fuego (detalle en inventario). Es el único jefe con fases de área definidas expresamente por este código.
- **Esbirros — IMPLEMENTADO, con capacidad variable.** `Sh()` limita cantidad/capacidad global, intervalos y tipo; `bossAdd` permite contar vivos/muertos y desbloquear protección. Traidor, Matarife, Pogo y otros difieren en capacidad/intervalo.
- **Combo del jugador — IMPLEMENTADO.** `Ep()` incrementa kill/score y niveles de combo; `wp()` reduce combo al recibir golpe. No encontré un subsistema que enlace secuencias de ataques del jefe como «combo del jefe»; marcarlo ausente no significa que el jugador carezca de combo.
- **Telemetría/QA de boss — PARCIAL.** Hay datos de boss/daño en `ca`, contadores del registro visual y helpers `DMO_ART_TEST`. Los helpers sirven para escenario/captura; no son bots de combate ni evidencia de una suite de fairness.

## Integración con escenario y seguridad

- `Eh()` prueba el corredor hacia un punto de 220 px: límites transitables, obstáculos sólidos/gaps y zonas activas fire/elec/pressure. `kh()` inspecciona 32 orientaciones y prioriza una salida razonable respecto del jugador.
- `wh()` solo exige hueco válido a ring/spiral; si no lo hay, aplaza el disparo. Antes de ejecución vuelve a comprobar el corredor; si quedó bloqueado, cancela/aplaza y crea una ventana `exposedT` de 0,5 s.
- El loop rechaza/retarda ataques ante hazards activos o alta ocupación de proyectiles (`Zr`, `df`, `Da`, `Ia` y presupuesto). `vh()` comprueba límite espacial/obstáculo al crear un proyectil.
- **Límites por perfil y tipo — IMPLEMENTADO (B1):** `du()` respeta un `zonePattern.max` finito, no negativo y coincidente con el tipo; cuenta zonas activas (`warn`/`on`) del mismo tipo y cuyo `bossZoneOwner72` es el mismo objeto boss. Conserva los caps globales por tipo (elec 2, fire 3); tipos distintos no consumen capacidad entre sí. Máximo ausente/inválido o mismatch de tipo usa cap global; Núcleo sigue este fallback.
- **Propiedad/limpieza — IMPLEMENTADO (B1):** las zonas creadas por `du()` conservan referencia directa `bossZoneOwner72:e`; no se resuelve el owner mirando `sr`. `uu(boss)` purga las zonas del owner pasado y las tres rutas del final pasan `sr`. El engine sigue usando un solo `sr` activo; dos owners simultáneos están comprobados en el scheduler de prueba, no añadidos como mecánica de gameplay.
- **Validación — PARCIAL:** suite determinista source-coupled, browser integration con Bufé real y regresiones T01/T02 pasan. Fairness/playtesting humano o de bots sigue **NO VERIFICADO**.
- **Justicia percibida/real: NO VERIFICADO.** Estas salvaguardas son comprobables en código; no prueban que toda arena/configuración deje una ruta humana suficiente, que las advertencias sean legibles ni que hitbox y sprite coincidan.

## Matriz identidad/AI: hallazgos compactos

| Residente | Control | Diferenciador observado |
|---|---|---|
| Andén | hunter | Sin esbirros ni blindaje por esbirros; acelera con el tiempo. |
| Magneta | hunter | Cuatro esbirros; velocidad de esbirros aumentada. |
| Bufé | pulse | Cuatro esbirros; zonas de fuego periódicas. |
| Cajero | hunter | Tres esbirros; créditos por sus bajas. |
| Pogo | sweeper | Cinco esbirros; barrido y aceleración limitada. |
| Oficiante | pulse | Dos esbirros; zonas eléctricas periódicas. |
| Matarife | sweeper | Mayor carga base; cinco esbirros frecuentes y fuego periódico. |
| Imitador | hunter | Cuatro esbirros y aceleración limitada. |
| Traidor | sweeper | Tres esbirros, aceleración limitada y zonas eléctricas. |
| Núcleo Final | final/sweeper | Fases de umbral 1–3; sweep, adds y hazards de fase. |

Los valores exactos y patrones por orden están en `BOSS_BEHAVIOR_MATRIX.md`. Las anteriores son diferencias declaradas en código, no prueba de que cada habilidad se perciba o funcione bien en todas las condiciones.

## Estados y riesgos no cubiertos

| Tema | Estado | Razón |
|---|---|---|
| Hitboxes/sprites cotejados en 10/10 encuentros | **NO VERIFICADO** | No hay evidencia de pruebas geométricas end-to-end. La lógica emplea círculos, proyectiles, segmentos y zonas; render QA no valida sus tamaños. |
| Bots evasivos / navegación | **AUSENTE** en evidencia auditada | No se halló una batería de bots que reproduzca input, aprenda telegráficos y reporte colisiones. |
| Test determinista de patrón por semilla | **NO VERIFICADO** | Hay índices de patrón y debug helpers, pero no se observó una suite que fije semilla, simule fases y afirme resultados de gameplay. |
| Balance entre residentes / victorias y derrotas | **NO VERIFICADO** | Atributos existen, pero no hay ensayo nuevo con una matriz de jugadores/dificultad. No se tocaron valores. |
| Rendimiento GPU real | **NO VERIFICADO / gate separado BLOQUEADO** | El paquete externo está preparado, pero no hay benchmark de GPU real. SwiftShader queda excluido. |

## Evidencia preexistente y alcance de sus claims

- `BOSS-T01_REPORT.md`: reporta QA de integración visual 17/17 y declara que la lógica de combate no se sustituyó.
- `BOSS-T02_REPORT.md`: reporta 16/16 checks visuales y regresión T01; sus capturas no validan AI.
- `EXTERNAL_GPU_VALIDATION_REPORT.md`: estado bloqueado por ausencia de hardware GPU real.
- Los informes son evidencia previa del repositorio, no pruebas reejecutadas durante esta auditoría.
