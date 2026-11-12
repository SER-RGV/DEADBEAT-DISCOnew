# SIGUIENTE TANDA: `R03_JEFES`

- **Contenido:** 10 jefes × 4 estados + Arquitecto × 2 = **42 ilustraciones** (cinco turnos de generación a 10 por turno).
- **Por qué ahora:** tras protagonista y enemigos son lo más visible; hoy son pixel art
  y 10 de los 42 tienen defecto visible (damero horneado, fotogramas basura, cambios
  de identidad; lista en [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md), apartado 4).
- **Commit previsto:** `feat(art): R03 jefes en ilustración, validados en juego`

## Quién es cada jefe (tres fuentes que no coinciden)

El motor, las guías visuales y la biblia de lore nombran y describen a los jefes de
forma distinta. Se documenta la correspondencia que se adopta; **no se cambia ningún
nombre del juego**.

| Id del asset | Círculo y jefe según el motor (lo que el juego muestra) | Guía `REF_03` | Biblia de lore |
|---|---|---|---|
| `boss_00_anden` | I Limbo · ANDÉN, el Portero | — (no hay Limbo en la guía) | §17.1 El Portero sin Rostro (subjefe) |
| `boss_01_magneta` | II Lujuria · MAGNETA, la Anfitriona | I Lujuria | Véspera, la Última Invitación |
| `boss_02_bufe` | III Gula · BUFÉ, el Anfitrión sin Fondo | II Gula | Voraz, el Anfitrión Hueco |
| `boss_03_cajero` | IV Avaricia · EL CAJERO, el que cobra la entrada | III Avaricia | Áurea, la Coleccionista de Instantes |
| `boss_04_pogo` | V Ira · EL POGO, el que abre la pista | IV Ira | Brama, el Santo del Ruido |
| `boss_05_oficiante` | VI Herejía · EL OFICIANTE, el que oficia el ruido | V Herejía | El Obispo de la Nota Ausente |
| `boss_06_matarife` | VII Violencia · EL MATARIFE, el que despieza el set | VI Violencia | El Corazón Encadenado |
| `boss_07_imitador` | VIII Fraude · EL IMITADOR, el que duplica la pista | VII Fraude | El Crupier de las Mil Voces |
| `boss_08_traidor` | IX Traición · EL TRAIDOR, el último residente | VIII Traición | Nix, la Voz que Faltaba |
| `boss_09_nucleo` | Núcleo final · la Última Canción | IX Núcleo | El Rey del Compás |
| `boss_10_arquitecto` | Jefe secreto · el Arquitecto del Club (DJ-Director) | — | — |

Criterio de diseño adoptado:

1. **El aspecto sigue la guía `REF_03`** (es la referencia visual que manda en esta
   reconstrucción), emparejada con el jefe del motor **por el tema del círculo**
   (Lujuria, Gula, Avaricia…), no por el número: el motor tiene un círculo más (Limbo)
   y por eso sus números van uno por delante de los de la guía.
2. **Nombre, título y color** son los del motor (son los que el juego enseña).
3. **De la biblia** se toman los motivos que no contradicen a la guía (el horno en el
   vientre del Bufé, el amplificador entre las costillas del Pogo, la mitra en forma de
   diapasón del Oficiante, el tambor en el pecho del Matarife, las máscaras del Imitador).
4. El Portero no está en la guía: se diseña con el título del motor y el subjefe §17.1.

Si este criterio no es el deseado, hay que decirlo antes de producir los estados
`attack`, `hit` y `death`, que se generan a partir del `idle` de cada jefe.

## Contrato que espera el juego

| Dato | Valor |
|---|---|
| Ids | `boss_00_anden` … `boss_09_nucleo` × `idle`, `attack`, `hit`, `death`; `boss_10_arquitecto_idle`, `boss_10_arquitecto_attack` |
| Rutas | `assets/bosses/…` (ya registradas: la tanda **actualiza**, no da de alta) |
| Radio de colisión en el motor | 34 px |
| Alto del sprite heredado | 4,2 × radio |
| Estado real (`f.bossState`) | muerte > impacto > ataque (`_ddaAttackT`, `pattern71`, fases `sweep`, `volley`, `berserk`) > reposo |
| Muertes | registro `f.bossDeaths`, 0,48 s; hoy las dibuja el motor en pixel art |

## Defecto de código ya localizado (hay que corregirlo antes de integrar)

`DD_WORLD.drawBoss` decide el estado leyendo `hurtT`, `attackT`, `castT`, `dashT`,
`phaseT` y `vx` del jefe, y el puente le pasa el objeto del motor tal cual. En el
código del motor `attackT`, `castT` y `dashT` no existen (0 apariciones): el estado
real lo decide `f.bossState` con `_ddaDead`, `hitFlash`, `_ddaAttackT`, `pattern71` y
`phase`. Es el mismo patrón que impedía ver los estados de los enemigos; lo más
probable es que el jefe se vea siempre en `idle` y mirando a la derecha. **Falta
comprobarlo en juego** (nunca se ha capturado un combate contra un jefe) y sustituirlo
por una vista del puente (`ddBossView`: estado de `f.bossState`, orientación hacia el
protagonista). La muerte del jefe la sigue pintando el motor (`f.drawBossDeath`).

## Pasos

1. `ddBossView` en el puente y `drawBoss` / `drawBossDeath` nuevos en `DD_WORLD` con el
   contrato de R02: anclas `foot` y `unit`, **sin mezcla de revisiones** (mientras un
   jefe no tenga sus cuatro estados nuevos, se usa su `idle` nuevo con señal
   procedural), halo de separación, orden por línea de apoyo.
2. `probe_bosses.js` sobre el modelo de `probe_enemies.js` (`DMO.debug.boss()` invoca
   al jefe del círculo; última sala del círculo `c` = nivel `c × 11`).
3. `idle` de cada jefe (hoja de modelo) y, a partir de él, los otros tres estados.
   Vista de tres cuartos mirando a la derecha: en perfil estricto se perderían los
   rasgos del pecho (horno, amplificador, tambor, núcleo).

## Validación obligatoria en juego

- Cada jefe invocado en su círculo, con los cuatro estados vistos en pantalla, mirando
  a ambos lados, junto al protagonista y a enemigos comunes (escala relativa).
- 0 errores de página y de red; `batch.py audit` sin diferencias.
- Evidencia en `docs/ART_REBUILD/evidence/R03/` con antes y después.

## Pendiente arrastrado

De R01 (protagonista):

- Las armas pesadas (m60, minigun, BFG…) mantienen la postura de cadera en todos los
  ángulos: el arma gira sobre los puños, los brazos no acompañan la elevación.
- Vista lateral única: `REF_06` pide 8 direcciones para el protagonista. Hoy el cuerpo
  sólo se refleja a izquierda y derecha, como en el motor original.
- Pose de daño con arma larga apuntando hacia abajo: el arma cruza hombro y cabeza.

De R02 (enemigos):

- Vistos en juego en los círculos I, II, III, V y VIII; faltan IV, VI, VII y IX.
- Un solo fotograma por estado: el cambio de caminar a aviso o a ataque no tiene
  intermedios (se nota sobre todo en el Tanque, que se yergue de golpe).
- Proporciones que el generador cambió entre fotogramas: cabeza del Tanque más pequeña
  en `windup` y `attack`; cabeza y torso del Sprinter un 15 % menores en `death`.
- Balas enemigas todavía en pixel art (van en R07).
