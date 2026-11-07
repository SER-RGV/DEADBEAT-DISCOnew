# Matriz de comportamiento de bosses

**Fecha:** 2026-11-04
**Fuente:** tablas `Ye`/`We`, constructor `su()`, selector `Th()`, ejecución `wh()`/`vh()` y update de `sr` en `DEADBEAT_DISCO.ART.html`.
**Lectura importante:** «IMPLEMENTADO» significa que la configuración/control está en el código. No significa que el boss se haya validado en juego, sea justo o esté balanceado.

## Conteo e identidades

La campaña selecciona **nueve residentes de círculo** y un **Núcleo Final separado**. Si «nueve bosses» incluye el final, el inventario de encuentros contiene uno adicional (nueve residentes + final); si «nueve» significa residentes, el Núcleo se suma como jefe final. Las rondas de residentes son 11, 22…99; el final está en 100. **Detalle de datos:** `Ye` contiene diez registros, incluido uno llamado `nucleo`, además de `We`; `aa(100)` elige `We`, no la entrada `Ye[9]`. La matriz trata al Núcleo como entidad/encuentro separado sin ocultar esa duplicación de perfiles.

| # | Identidad de combate y sala | Alias de animación residente / key de atlas | Registro de nombre visual estable que comparte key | AI/configuración en combate | Estado estático |
|---:|---|---|---|---|---|
| 1 | ANDÉN · El Portero — círculo I / ronda 11 | `resident_01_anden` / `boss0` | DJ Doom / `boss_01_djdoom` / `boss0` | hunter; fan/burst/ring; sin adds; escala velocidad. | **IMPLEMENTADO** |
| 2 | MAGNETA · La Anfitriona — círculo II / ronda 22 | `resident_02_magneta` / `boss1` | Reina Espectro / `boss_02_reinaespectro` / `boss1` | hunter; burst/fan/ring; 4 adds rápidos; protección si viven. | **IMPLEMENTADO** |
| 3 | BUFÉ · El Anfitrión sin Fondo — círculo III / ronda 33 | `resident_03_bufe` / `boss2` | Rey Disco / `boss_03_reydisco` / `boss2` | pulse; ring/spiral/burst; 4 adds; zonas de fuego. | **IMPLEMENTADO** |
| 4 | EL CAJERO · El que Cobra la Entrada — círculo IV / ronda 44 | `resident_04_cajero` / `boss3` | Entidad Voraz / `boss_04_entidadvoraz` / `boss3` | hunter; ring/fan/spiral; 3 adds y 22 créditos por baja. | **IMPLEMENTADO** |
| 5 | EL POGO · El que Abre la Pista — círculo V / ronda 55 | `resident_05_pogo` / `boss4` | Fusión Cósmica / `boss_05_fusioncosmica` / `boss4` | sweeper; burst/fan/spiral; 5 adds, sweep, escalado de velocidad. | **IMPLEMENTADO** |
| 6 | EL OFICIANTE · El que Oficia el Ruido — círculo VI / ronda 66 | `resident_06_oficiante` / `boss5` | DJ Abismo / `boss_06_djabismo` / `boss5` | pulse; summon/ring/spiral; 2 adds; zonas eléctricas. | **IMPLEMENTADO** |
| 7 | EL MATARIFE · El que Despiece el Set — círculo VII / ronda 77 | `resident_07_matarife` / `boss6` | Altavoz Titán / `boss_07_altavoztitan` / `boss6` | sweeper; spiral/burst/fan; 5 adds rápidos; fuego. | **IMPLEMENTADO** |
| 8 | EL IMITADOR · El que Duplica la Pista — círculo VIII / ronda 88 | `resident_08_imitador` / `boss7` | DJ Calavera / `boss_08_djcalavera` / `boss7` | hunter; fan/ring/burst; 4 adds; escalado de velocidad. | **IMPLEMENTADO** |
| 9 | EL TRAIDOR · El Último Residente — círculo IX / ronda 99 | `resident_09_traidor` / `boss8` | **No hay perfil estable no-final correspondiente en la lista de ocho.** | sweeper; ring/burst/spiral; 3 adds; electricidad y escalado. | **IMPLEMENTADO** en combate; **NO VERIFICADO** el emparejamiento de identidad visual estable |
| F | NÚCLEO FINAL · La Última Canción — ronda 100 | `resident_nucleo` / `boss9` (también perfil `boss_09_nucleofinal`, key `boss9`) | Núcleo Final / `boss_09_nucleofinal` / `boss9` | final/sweeper; fan/ring/burst/spiral; 5 adds; tres etapas. | **IMPLEMENTADO** |

### Cómo interpretar el conflicto de nombres

Las dos columnas de identidad son registros diferentes. El código de animación declara nueve registros de residente con keys `boss0`…`boss8`, además del final con key `boss9`; a su vez declara ocho nombres visuales estables no-finales con keys `boss0`…`boss7` y un final con key `boss9`. Los IDs estables no-finales fueron nombrados DJ Doom, Reina Espectro, Rey Disco, Entidad Voraz, Fusión Cósmica, DJ Abismo, Altavoz Titán y DJ Calavera. **La coincidencia de key/índice expresa reutilización de frame/atlas, no prueba que Andén sea DJ Doom, Magneta sea Reina Espectro, etc.** La entrada del Traidor (`boss8`) hace visible el hueco: no hay un noveno perfil estable no-final en esa lista.

En runtime, `DMO.combatArt.bossId()` prefiere `artId` válido explícito y después usa final/residente/nombre/círculo. El resolver HD también prioriza `artId` estable y usa aliases de residente para entidades legacy; `RESIDENT_TO_ATLAS_BOSS` hace explícita la ruta residente→atlas (`anden:boss0`…`traidor:boss8`). Esta ruta de dibujo no reconcilia por sí sola la identidad narrativa de los nombres. No se cambia el resolver ni se recomienda un emparejamiento sin aprobación de identidad.

## Parámetros por residente

Multiplicadores de `hp`, `speed` y `attack` relativos a la base común de ronda; `reward` es factor de recompensa de combate. La HP real incluye escala logarítmica de ronda, late-boss y dificultad; la tabla no son HP absolutos.

| Residente | Arquetipo | HP × | Velocidad × | Ataque × | Reward × | Patrones en orden | Adds: máximo / intervalo | Regla especial de configuración |
|---|---|---:|---:|---:|---:|---|---:|---|
| Andén | hunter | 0,95 | 1,12 | 0,94 | 1,30 | fan, burst, ring | 0 / 4,6 s | `noAdds`; escala +0,012 velocidad/s hasta ×1,50. |
| Magneta | hunter | 1,00 | 1,20 | 1,00 | 1,32 | burst, fan, ring | 4 / 4,0 s | Adds ×1,22 velocidad; protegido mientras haya adds. |
| Bufé | pulse | 1,05 | 0,92 | 1,08 | 1,34 | ring, spiral, burst | 4 / 3,2 s | Fire cada 6,2 s; máximo declarado 2 zonas. |
| Cajero | hunter | 1,00 | 1,05 | 1,00 | 1,45 | ring, fan, spiral | 3 / 4,4 s | +22 créditos por add caído. |
| Pogo | sweeper | 1,08 | 1,04 | 1,06 | 1,36 | burst, fan, spiral | 5 / 3,0 s | Sweep; escala +0,008/s hasta ×1,35. |
| Oficiante | pulse | 1,06 | 0,95 | 1,10 | 1,38 | summon, ring, spiral | 2 / 4,0 s | Elec cada 6,6 s; máximo declarado 2 zonas. |
| Matarife | sweeper | 1,20 | 1,02 | 1,22 | 1,50 | spiral, burst, fan | 5 / 2,6 s | Fire cada 5,6 s; máximo declarado 3 zonas. |
| Imitador | hunter | 1,10 | 1,15 | 1,05 | 1,42 | fan, ring, burst | 4 / 3,4 s | Escala +0,010/s hasta ×1,40. |
| Traidor | sweeper | 1,15 | 1,06 | 1,12 | 1,55 | ring, burst, spiral | 3 / 3,6 s | Elec cada 6,0 s; escala +0,009/s hasta ×1,40; máximo declarado 2 zonas. |
| Núcleo | final/sweeper | 1,80 | 1,10 | 1,15 | 2,00 | fan, ring, burst, spiral | 5 / 3,2 s | Etapa 2: electricidad/multiplicador 1,12; etapa 3: fuego/multiplicador 1,28. |

**Nota sobre límites de zonas (B1):** corregido e implementado. `du()` ahora aplica caps globales por tipo (elec 2, fire 3) y cuenta zonas activas del mismo tipo; una zona de otro tipo no consume ese cupo. También aplica `zonePattern.max` contra zonas activas del mismo tipo con `bossZoneOwner72` igual al objeto boss creador. Bufé queda limitado a 2 fuegos; Núcleo, sin max de perfil, usa fallback global. Ver `BOSS_PHASE_B_REPORT.md` y la evidencia en `evidence/B1_zone_max/`.

## Mecánicas globales compartidas

| Mecánica | Estado | Fuente/efecto |
|---|---|---|
| Aviso de patrón antes de daño | **IMPLEMENTADO** | `wh()` anuncia nombre, hueco/objetivo; el timer de `Ao` se consume antes de disparar. |
| Pasillo de seguridad para anillo/espiral | **IMPLEMENTADO** | `kh()` busca 32 direcciones; `Eh()` prueba límite, obstáculo, hueco y zona; revalidación antes de fuego. |
| Defensa por esbirros | **IMPLEMENTADO** | Mientras `addsAlive > 0`, el daño al boss se multiplica por 0,65; `exposedT` multiplica por 1,5. |
| Fases normales por vida | **IMPLEMENTADO**, genérico | ~68% `volley`; <35% `berserk`; en berserk movimiento ×1,55 y patrón burst/spiral alternado. |
| Fases dedicadas del final | **IMPLEMENTADO** | `cu()` cambia etapas 2/3 con reinicio de patrón/temporizador, aviso y audiovisual. |
| Ataque cuerpo a cuerpo | **IMPLEMENTADO** | Colisión circular `sr.r + ye.r`; boss nace con `r=34`. |
| Combo del jugador | **IMPLEMENTADO** | `Ep()` sube combo al matar; `wp()` reduce combo al recibir golpe. |
| Combo authored de boss | **AUSENTE** | Ningún subsistema de combos de jefe fue hallado; el selector recorre patrones y transiciones. |
| Fairness/hitbox validada | **NO VERIFICADO** | No se ejecutó una matriz de tests de colisión/escape/inputs ni playtest durante esta auditoría. |
