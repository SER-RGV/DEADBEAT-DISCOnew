# Contrato de animación — DEADBEAT DISCO (FASE 02 §4)

> Fuente de verdad legible por máquina: `docs/ART_REBUILD/ANIMATION_CONTRACT.json`,
> generado por `python3 tools/art_master/anim_contract.py` a partir del registro real
> (`src/dd_asset_registry.js`) y validado con `--check` (R1–R4, abajo). Este documento
> explica el modelo; el JSON lista cada id, su `rev`, sus anclas y si el estado tiene
> fotograma propio. **No se inventan spritesheets**: describe lo que el motor hace.

## 1. Modelo: un fotograma por estado + movimiento procedimental

El proyecto no usa atlas ni controlador de fotogramas. Para cada entidad:

1. El **puente** (`tools/build_active_html.py` → `ddEnemyView`, `ddBossView`, `pAnim` del
   protagonista) aplica las reglas del motor y entrega una *vista*: `family/slug`, `state`,
   `flip`, `flash`, `phase`, `variant`, `frozen`…
2. El **renderizador** (`src/dd_world_renderer.js`) elige el id `<entidad>_<estado>`
   (`ENEMY_STATE_ASSET`, `BOSS_STATE_ASSET`, `PLAYER_POSE_TO_ID`), lo apoya en
   `anchors.foot` a la altura `anchors.unit` y le añade el **movimiento procedimental**:
   zancada, balanceo, respiración, destello de impacto, colapso de muerte, filo de variante.
3. La única secuencia real de varios fotogramas es la caminata del protagonista
   (`player_walk_00..03`, 4 fotogramas a 8 fps, bucle; el motor elige `floor(8·Z) mod 4`).

### Contrato de lienzo (todas las figuras)

| Campo (manifest.entries[id]) | Significado |
|---|---|
| `anchors.foot = [u, v]` | punto de apoyo en el suelo, fracción del lienzo (entre los pies) |
| `anchors.unit` | fracción del alto del lienzo que mide la figura de referencia (`walk`/`idle` erguido). Los estados de una familia comparten escala: `unit × alto` son los mismos px en todos → un ataque no «crece» |
| `pivot` | `anchors.foot` (figuras) · `center` (objetos) |
| `rev` | tanda de arte. **Regla de no mezcla**: si el fotograma de un estado no comparte `rev` con el base (`walk`/`idle`), se dibuja el base con señal procedimental |
| sin anclas (arte heredado) | pivote abajo-centro y figura al 86 % del lienzo |

Convención de suelo del motor: `(x, y)` es el círculo de colisión; los pies caen en `y + 0.65·r`.
Las balas vuelan a ras de suelo pero se dibujan 56 px más arriba (altura del arma).

## 2. Relojes y parámetros (medidos en el código)

| Reloj | Dónde | Valor |
|---|---|---|
| `ye.animT` (protagonista) | motor | `+= dt × (8 moviéndose, 2 parado)` |
| fotograma de caminar | motor | `player_walk_0{floor(8·Z) mod 4}` → **8 fps**, bucle |
| `t.animT` (enemigo) | motor | `+= 4 × dt` |
| `view.phase` | puente | `animT × mult` · tank 1.2 · sprinter 3.4 · resto 2.0 |
| zancada | renderer | `cyc = phase × π/2` → una zancada cada 4 unidades de fase; sólo si velocidad medida > 14 px/s |
| bob / tilt (walk) | renderer | `-|sin cyc| × 2.6 × figH/88` px · `sin cyc × 0.035` rad |
| respiración (parado) | renderer | `sy = 1 + 0.012 · sin(2.6·t + 0.05·x)` |
| impacto (`hit`) | renderer | ventana 0.12 s: tilt −0.10·n, escala (1+0.05·n, 1−0.07·n); destello tope 0.5 con caída cuadrática en 0.14 s |
| `windup` sin fotograma | renderer | tilt −0.15, escala (1.04, 0.96) |
| `attack` sin fotograma | renderer | tilt 0.2, escala (0.97, 1.04), bob −2·k |
| muerte (`death`) | renderer | duración 0.38 s por defecto; retroceso 14·figH/88 px (easing cuadrático); fundido desde el 55 %; destello el primer 18 %; sin fotograma: rotación −0.09 y aplastado hasta 0.24 |
| filo de variante | renderer | `ENEMY_VARIANT_RIM` (blindado, incendiario, criogénico, conductivo, tóxico, espectral, caótico), pulso `0.8 + 0.2·sin(4t)` |
| jefes | renderer | `BOSS_STATE_ASSET` idle/attack/hit(recover)/death; destello tope 0.36; entrada alpha 0.25→1 y escala 0.78→1; balanceo sólo con desplazamiento real |
| objetos | renderer | `drawPickup`: 44 px × escala (perfil *intermedia* 1.15), flotación `sin(4.5t + 0.03x) × 4` px, halo cian `#22d3ee`, sombra en `y+14`; cofre 82 px |

## 3. Tabla por entidad

| Entidad | Estados → id | Fotogramas | fps / bucle | Anclas | Estado |
|---|---|---|---|---|---|
| Protagonista | `player_idle_00`, `player_walk_00..03`, `player_shoot_00`, `player_fire2`, `player_firehip`, `player_hurt_00`, `player_roll_00`, `player_death_00`, `player_boost_00`; puntería por elevación `player_aim_up_01..03` / `player_aim_down_01..03` (+ capas `_arms`); caminata completa `hero_walk_00..03` | 1 por pose; **4** la caminata | 8 fps bucle (caminar); el resto 1 fotograma | `anchors.belt` (corte de cintura torso/piernas) | R01 ✔ |
| Enemigos (6 familias: security, dancer, fanatic, drone, chef, elite) | `enemy_<fam>_{walk,windup,attack,hit,death}` | 1 por estado (30) | procedimental (§2) · `walk` bucle | `foot`, `unit` en los 30 | R02/T02 ✔ misma `rev` por familia |
| Jefes (11) | `boss_<nn>_<slug>_{idle,attack,hit,death}` | 1 por estado (42) | procedimental · `idle` bucle | `foot`, `unit` en los 42 | R03 ✔; `boss_10_arquitecto` sólo `idle`+`attack` por contrato (hit/death → reposo + señal) |
| Objetos (20) | `pickup_*_00` (12), `relic_*` (8) | 1 | sin bucle (flotación procedimental) | `center` | T06: 19/20 nuevos; `relic_tempo` pendiente |

## 4. Validación automática (`anim_contract.py --check`)

- **R1** cada estado declarado existe en el registro y su archivo en disco;
- **R2** todos los estados de una familia/jefe comparten `rev` con su base (`walk`/`idle`);
- **R3** los fotogramas de figura traen `anchors.foot` y `anchors.unit`;
- **R4** los 4 fotogramas de caminar del protagonista existen y miden lo mismo.

Estado actual: **OK (0 incumplimientos)** con la caché `20261115.23`.

## 5. Si algún día hay secuencias reales de varios fotogramas

No basta con añadir PNG: haría falta (a) una tanda de arte nueva con los fotogramas
dibujados (no se derivan de los estáticos), (b) campos `frames/fps/loop/cols` en el
manifiesto y (c) un selector de fotograma en `resolveEnemyFrame`/`resolveBossFrame` que
respete el contrato de lienzo (anclas por fotograma). Hasta entonces, cualquier
«manifiesto de animaciones» debe describir el modelo de este documento.
