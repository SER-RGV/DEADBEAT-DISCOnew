# Inventario de patrones de ataque de jefes

**Fecha:** 2026-11-04
**Fuente primaria:** `Ao`, `wh()`, `Th()`, `vh()`, `Sh()`, update de `sr` y `du()` dentro de `DEADBEAT_DISCO.ART.html`.
**Alcance:** inventario de lo que está implementado en el árbol actual, no diseño nuevo ni validación de balance.

## Patrones compartidos (`Ao` → `wh()`/`Th()`)

| ID interno | Aviso | Emisión declarada | Geometría/ejecución | Recuperación | Estado |
|---|---:|---:|---|---:|---|
| `fan` | 0,80 s | 5 proyectiles, velocidad base 245, spread total 0,64 rad | Abanico dirigido al ángulo fijado al anunciar; velocidades alternan +18. En berserk se usan 7 tiros. | 0,80 s | **IMPLEMENTADO** |
| `ring` | 1,05 s | 18, velocidad base 185 | Anillo radial; deja un hueco angular de 1,1 rad elegido mediante corredor (`kh`/`Eh`). Enemigo vuelve a comprobar ruta antes de disparar; velocidad alterna +22. | 1,05 s | **IMPLEMENTADO** |
| `spiral` | 1,10 s | 20, velocidad base 180 | Dos brazos opuestos; emite 2 por paso, separados por 0,115 s, con incremento angular de 0,23 rad por índice; filtra ángulos cerca del hueco de salida. | 1,15 s | **IMPLEMENTADO** |
| `burst` | 0,82 s | 9, velocidad base 265 | Tres tiros por emisión en un abanico estrecho (±0,115 rad); repite cada 0,18 s, tres emisiones. La mira queda fijada durante el aviso. | 0,95 s | **IMPLEMENTADO** |
| `summon` | 1,20 s | 2 solicitudes de esbirro | Llama `Sh()`; no dispara los dos proyectiles indicados por otros patrones. La aparición se marca para que el jugador priorice a los adds. Límite real depende de `addsMax`, `addsSpawned`, capacidad y `noAdds`. | 1,20 s | **IMPLEMENTADO**; ejecución puede ser limitada por capacidad |

`vh()` crea cada proyectil enemigo con radio 5, vida máxima 3,6 s y color del residente. Su creación se deniega si se alcanza el presupuesto de `Ia`, si el origen queda fuera de área o si un obstáculo lo bloquea. `Th()` también difiere un ataque si hay eventos de láser/otros hazards o exceso de proyectiles. El límite temporal de proyectiles se calcula con `Gr.budget.projectiles` y límites 18–60 (42 bajo la condición `yl`); es un guardarraíl compartido, no una cantidad fija por boss.

## Ataque de barrido (`sweep`), independiente de `Ao`

| Aviso | Ejecución | Geometría/hitbox | Fin |
|---:|---|---|---|
| 0,90 s | El foco rota en un arco de 2,4 rad durante 1,4 s; la dirección es aleatoria. | Segmento de longitud 720 desde el centro del boss; golpe si la distancia a segmento es menor que `ye.r + 22`; como máximo un hit por barrido. | El estado dura hasta aviso + fuego + 0,3 s y vuelve a `chase`. |

El sweep se inicia en el ciclo de la variante `sweeper` cuando el temporizador de su fase `ranged` vence. Se anuncia como `¡BARRIDO!`; al entrar en sweep no se ejecuta `Th()` hasta volver a otra fase. **IMPLEMENTADO** en código; legibilidad y tasa de colisión **NO VERIFICADAS** por playtest.

## Zonas de suelo

| Tipo | Radio | Aviso | Vida | Cadencia/uso |
|---|---:|---:|---:|---|
| `fire` | 122 | 1,45 s | 3,55 s | Cadencia y máximo por residente (`zonePattern.every`/`max`) más límite global de 3 zonas fire activas. |
| `elec` | 126 | 1,70 s | 3,35 s | Cadencia y máximo por residente (`zonePattern.every`/`max`) más límite global de 2 zonas elec activas. |
| Núcleo, fase 2 | 126 | 1,70 s | 3,35 s | Cada 6,6 s aprox., zonas eléctricas; crea hasta 2 según ocupación y plazas. |
| Núcleo, fase 3 | 122 | 1,45 s | 3,55 s | Cada 5,35 s aprox., zonas de fuego; crea hasta 3 según ocupación y plazas. |

`du()` elige ubicaciones separadas entre sí, alejadas del jugador, de zonas activas y con alternativas en puntos fijos de la arena. Si no logra colocar zona, el scheduler del Núcleo reintenta con 0,55 s; las zonas declaradas por residentes vuelven a intentarse con intervalo breve (0,9 s) si la colocación falla. Son comprobaciones de colocación, no un resultado de test de evacuación completo.

**Corrección B1 — IMPLEMENTADO:** `du()` calcula capacidad global por tipo (2 `elec`, 3 `fire`) y perfil del boss solicitante. El global cuenta todas las zonas activas del mismo tipo (`warn`/`on`); `out` ya no consume capacidad. El perfil cuenta solo zonas activas del mismo tipo cuyo `bossZoneOwner72` es la referencia exacta al boss. `available = max(0, min(globalCap-globalActiveOfType, profileMax-ownerActiveOfType))`. Zona de un tipo no consume cupo del otro. Máximo ausente/inválido o tipo distinto usa fallback global; cero bloquea. Núcleo mantiene fallback global.

Los cuatro perfiles con config son Bufé fire `max:2`, Oficiante elec `max:2`, Matarife fire `max:3` y Traidor elec `max:2`; hunter y Pogo no declaran zonas. `bossZoneOwner72` queda en cada zona hasta que el manager la elimina. `uu(boss)` solo purga las zonas del objeto boss pasado. Pruebas deterministas, integración de navegador Bufé y regresión visual T01/T02: resultados en `ART_AUDIT/BOSSES/evidence/B1_zone_max/`. Fairness/playtest humano o de bots **NO VERIFICADO**.

## Orden de selección por residente y condiciones

`Th()` rota el array `patterns72`; no sortea patrón nuevo cada disparo. En ausencia de un override usa arrays por arquetipo: `hunter` = fan/burst/ring; `pulse` = ring/fan/spiral; `sweeper` = fan/spiral/burst; `final` = fan/ring/burst/spiral. Los arrays residentes pueden reordenar/restringir ese repertorio. En berserk fuerza burst/spiral alternos. En Núcleo fase ≥2, cada quinta selección puede ser `summon` si queda capacidad de adds.

| Boss / residente | Orden declarado | Habilidades además del patrón | Estado |
|---|---|---|---|
| Andén | fan → burst → ring | Sin adds; velocidad escala +0,012 por segundo hasta ×1,50. | **IMPLEMENTADO** |
| Magneta | burst → fan → ring | 4 adds; intervalo 4,0 s; adds con multiplicador de velocidad 1,22. | **IMPLEMENTADO** |
| Bufé | ring → spiral → burst | 4 adds / 3,2 s; zonas fire cada 6,2 s, máximo 2. | **IMPLEMENTADO** |
| Cajero | ring → fan → spiral | 3 adds / 4,4 s; cada add muerto aporta 22 créditos. | **IMPLEMENTADO** |
| Pogo | burst → fan → spiral | 5 adds / 3,0 s; sweep del arquetipo; escala +0,008/s hasta ×1,35. | **IMPLEMENTADO** |
| Oficiante | summon → ring → spiral | 2 adds / 4,0 s; zonas elec cada 6,6 s, máximo 2. | **IMPLEMENTADO** |
| Matarife | spiral → burst → fan | 5 adds / 2,6 s; zonas fire cada 5,6 s, máximo 3; parámetros de daño/vida superiores a la base. | **IMPLEMENTADO** |
| Imitador | fan → ring → burst | 4 adds / 3,4 s; escala +0,010/s hasta ×1,40. | **IMPLEMENTADO** |
| Traidor | ring → burst → spiral | 3 adds / 3,6 s; escala +0,009/s hasta ×1,40; zonas elec cada 6,0 s, máximo 2. | **IMPLEMENTADO** |
| Núcleo Final | fan → ring → burst → spiral (fase 1) | 5 adds / 3,2 s; sweep; fase 2 elec y fase 3 fuego. | **IMPLEMENTADO** |

**Protección por adds:** el daño recibido usa multiplicador 0,65 cuando `addsAlive > 0`; durante `exposedT` usa 1,5. Aplican ambas condiciones en el mismo cálculo si coinciden (0,65 × 1,5). Andén evita adds con `noAdds`; otras configuraciones pueden tener adds aun cuando sus ciclos incluyan patrones de disparo.

## Fases y composición de ataques

- **Bosses no-finales — PARCIAL:** a menos de ~68% de vida se activa `volley`; a menos de 35%, `berserk`. Es un cambio compartido de ritmo/fase. No es una secuencia de combo única por boss.
- **Núcleo Final — IMPLEMENTADO:** etapa inicial 1; `cu()` inicia etapa 2 bajo ~70% y etapa 3 bajo 35%. Cada cambio reinicia patrón/temporizador e incrementa multiplicador de ataque a 1,12 (fase 2) / 1,28 (fase 3). Las fases configuran sus ataques de zona; no se añade fase propuesta.
- **Combos de jefe — AUSENTE** como mecánica dedicada. Hay ciclos de patrón, interrupciones por fase, adds, sweep y zonas. No se encontró disparador de combo authored equivalente a combinar ataques según acciones del jugador. El combo del jugador es otro subsistema (`Ep()`/`wp()`).

## Hitboxes y daño: hechos estáticos, sin certificación

| Fuente de golpe | Prueba/collider observado | Estado de existencia | Calidad/tolerancia |
|---|---|---|---|
| Contacto con cuerpo | Distancia centros `< sr.r + ye.r`; `sr.r` inicia en 34. | **IMPLEMENTADO** | **NO VERIFICADO** con contorno renderizado o medición visual. |
| Proyectil hostil | Movimiento por frame, chequeo `Ah(t, ye)` y radio `t.r`; trayectoria se recorta contra obstáculos y bordes. | **IMPLEMENTADO** | **NO VERIFICADO** en barridos de alta velocidad, frames bajos o esquiva. |
| Sweep | Distancia a segmento + `ye.r + 22`; un solo golpe. | **IMPLEMENTADO** | **NO VERIFICADO** por playtest. |
| Zonas | Zonas `jc` con estado `warn` y luego activas; radio definido por tipo y daño por el subsistema de zonas. | **IMPLEMENTADO** | **NO VERIFICADO** si aviso/gráfico y ventana de salida se sienten justos. |
| Anillo/espiral de proyectiles | Proyectiles individuales omiten sector; pasillo comprobado antes/después del aviso. | **IMPLEMENTADO** | **NO VERIFICADO** en todas las geometrías y combinaciones de hazards. |

No se alteró ningún radio, daño, duración, cadencia, multipler ni regla de spawn. La comprobación estática no constituye una prueba de hitbox completa.


## Nota B2 — presentación animada (2026-11-04)

El inventario de patrones y sus tiempos de ejecución no cambia. La FSM compartida consume `Ao[pattern].warn`/`recover`, la emisión real observada por `Th()` y la ventana de sweep para representar telegraph, windup, ataque y recovery; no modifica `Ao`, selección, cadencia, proyectiles, hitboxes ni daño. Ver `BOSS_B2_ANIMATION_REPORT.md` y `BOSS_ANIMATION_TRANSITIONS.md` para el contrato de sincronización.
