# SIGUIENTE TANDA — `R02_ENEMIGOS`

- **Contenido:** 6 familias × 4 estados = **24 ilustraciones** (3 turnos de generación a 10 por turno).
- **Por qué ahora:** tras el protagonista, los enemigos son lo más visible en sala; hoy son pixel art y 9 de los 24 tienen defecto visible.
- **Commit previsto:** `feat(art): R02 enemigos en ilustración, validados en juego`

## Contrato que espera el juego (`DD_WORLD.drawEnemy`)

| Dato | Valor |
|---|---|
| Ids | `enemy_<familia>_<estado>` |
| Familias | `security`, `fanatic`, `chef`, `dancer`, `drone`, `elite` |
| Estados | `walk`, `windup` (aviso), `attack`, `death` (se muestra al recibir daño) |
| Lienzo actual | 256×288, pivote abajo-centro, mirando a la derecha (el juego refleja según la velocidad) |
| Tamaño en pantalla | alto = `max(78, r × 3,8)` px de mundo; ancho proporcional al lienzo |
| Rutas | `assets/enemies/enemy_<familia>_<estado>.png` (ya registradas: la tanda **actualiza**, no da de alta) |

## Antes de generar

1. Leer en el motor la tabla de tipos de enemigo y cómo los asigna `resolveEnemyFamily`.
   Medido en juego: los tipos son `dancer`, `sprinter`, `tank`, `speaker`; `tank` cae en
   `chef`, `dancer` en `dancer`, y `sprinter` y `speaker` caen ambos en `security` por
   defecto. Decidir la correspondencia con las familias de `REF_06` (Bailarín, Sprinter,
   Tanque, Tirador, Especial) **antes** de dibujar, y documentar el cambio si se toca.
2. Generar primero una hoja de modelo por familia a partir del recorte de `REF_06` y
   usarla como imagen de referencia de sus otros tres estados.
3. Subir el lienzo si hace falta nitidez (el juego escala por alto): proponer 320×360
   manteniendo la proporción 8:9 y el pivote.

## Orden dentro de la tanda (prioridad a los defectuosos)

| Turno | Familias | Motivo |
|---|---|---|
| 1 | `chef` (4), `security` (4), hoja de modelo de `dancer` y `fanatic` | chef: identidad cambiante en los 4; security: damero y cambio de identidad |
| 2 | `dancer` (3 restantes), `fanatic` (3 restantes), `elite` (4) | damero en los ataques; ataque de élite no representa al personaje |
| 3 | `drone` (4) + repeticiones | sin defectos: sólo estilo |

## Validación obligatoria en juego

- Sala con los cuatro tipos generados con `DMO.debug.spawnEnemyAt` (ver `capture_game.js`).
- Los cuatro estados de cada familia vistos en pantalla, mirando a ambos lados.
- 0 errores de página y de red; `batch.py audit` sin diferencias.
- Evidencia en `docs/ART_REBUILD/evidence/R02/` con antes y después.

## Pendiente arrastrado de R01

- Las armas pesadas (m60, minigun, BFG…) mantienen la postura de cadera en todos los
  ángulos: el arma gira sobre los puños, los brazos no acompañan la elevación.
- Vista lateral única: `REF_06` pide 8 direcciones para el protagonista. Hoy el cuerpo
  sólo se refleja a izquierda y derecha, como en el motor original.
- `capture_game.js --circles=N` no selecciona el círculo N.
