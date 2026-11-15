# FASE 08 · ENTITY_SCALE_SPEC — Escala visual de entidades

Toda la escala de entidades vive en el **dibujo** (`src/dd_world_renderer.js`
+ puente del build). Los PNG aprobados no se regeneran; los radios del motor
no se tocan.

## 1. Ganchos añadidos en el renderer

| Función | Línea aprox. | Cambio |
|---|---|---|
| `scaleOf(kind, key, mini)` | 863 | lee `window.DD_SCALE` (player / enemyScale / bossScale / pickup); devuelve 1 si no existe |
| `enemyFigureHeight(family, r, mini)` | 875 | `× scaleOf("enemy", family, mini)` |
| `enemyGeometry(enemy)` | 926 | pasa `enemy.mini` |
| `drawEnemyDeath` | 1291 | pasa `rec.mini` (el puente guarda `rec.mini` al crear el registro) ⇒ la muerte mide lo mismo que el vivo |
| `bossFigureHeight(slug, r)` | ≈1410 | `× scaleOf("boss", slug)` |
| `drawPickup` | ≈1600 | `44 × scaleOf("pickup")` (cofres 82 sin cambio) |
| `__scaleDebug()` (export) | ≈1720 | alturas efectivas por familia/residente para QA (`DD_WORLD.__scaleDebug()`) |

Jugador: el puente (`tools/build_active_html.py`, bloque ARMAS) ya llamaba a
`drawProtagonist(..., scaleVal)` y `getPlayerWeaponMount(pA, aimA, scale)`;
ahora pasa `DD_SCALE.player` en ambos y pone `ut.h = 95 · DD_SCALE.player`
**sólo durante el dibujo del arma** (`Pf` lo restaura; `ft/vt/Et` —boca,
hombro y punto de salida de bala— se evalúan en la simulación con `ut.h`
original, así que el spawn de proyectiles no cambia).

## 2. Anclajes (sin cambios de contrato)

| Entidad | Anclaje | Comprobación |
|---|---|---|
| Jugador | pies en `(ye.x, ye.y)`; `drawProtagonist` dibuja desde los pies hacia arriba `PLAYER_BASE_H·scl`; todas las poses/direcciones y la capa de arma usan la misma `scl` | capturas DESPUÉS: el protagonista pisa su sombra/halo en `room_normal`, `edge`, `transition`, `corridor` |
| Enemigos | pies en `y + .65·r` (`ENEMY_FOOT_K`); el alto crece hacia arriba | `room_crowd` DESPUÉS: 14 enemigos (4 bailarines, 4 sprinters, 2 tanques, 2 tiradores, 2 élites) sin solapes anómalos; los dos tanques `mini` ×1,36×1,12 destacan |
| Jefes | pies en `y + .8·r`; `BOSS_BASE.h × factor` | `boss_arena` DESPUÉS: `boss_01_magneta` 243 px de mundo, entero en pantalla a zoom 0,848 |
| Pickups | centro en `(x,y)` | `transition` DESPUÉS: monedas 50,6 px |
| Orden de pintado | `renderQueue` por `y` de suelo | sin cambio (la escala no mueve el suelo) |

## 3. Tabla de alturas efectivas (perfil intermedia, `DD_WORLD.__scaleDebug()` en la build)

```
playerH 122.72   pickup 50.6
enemies: security 99.6 · dancer 93.6 · fanatic 78.4 · chef 144.2 · drone 85.5 · elite 142.0
bosses:  anden 250.9 · magneta 243.2 · bufe 227.8 · cajero 243.2 · pogo 238.1 · oficiante 248.3
         matarife 240.6 · imitador 245.8 · traidor 248.0 · nucleo 248.9 · arquitecto 245.8
```

Relaciones: jefe / jugador = 1,86–2,04; tanque / jugador = 1,18; élite / jugador
= 1,16; rápido / normal = 0,79–0,91.

## 4. Lo que no cambia

* `ye.r = 14`, `r` de enemigos y jefes, `hitFlash`, marcadores de élite/
  guardián/minijefe (se dibujan sobre la figura escalada, el ancho de barra de
  vida es el de siempre).
* Las hojas de animación (poses, direcciones, armas) no se regeneran:
  el escalado es un `drawImage` con alto mayor; a 1,18–1,42 no aparece
  pixelado apreciable (PNG 160–512 px por figura).
* Los jefes con hojas más justas (`nucleo`, `traidor`) tienen factor propio
  (1,22 / 1,24) para no recortar el tocado.
