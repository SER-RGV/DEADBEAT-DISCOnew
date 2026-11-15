# FASE 08 · COLLISION_AUDIT — Inventario de colisiones y garantía de no-cambio

Regla de la fase: **ningún radio ni alcance crece porque crezca el sprite**.
La escala visual (`DD_SCALE`) sólo entra en el renderer y en `ng()` (tamaño de
sala). Este documento lista dónde vive cada magnitud para que se pueda
comprobar que no se ha tocado.

## 1. Inventario (ORIGINAL.html; sin cambios en la Fase 08)

| Magnitud | Entidad | Valor / fórmula | Offset |
|---|---|---|---|
| Hitbox jugador | `ye.r` | 14 | 2565951 |
| Clamp jugador contra muro | | 28 px desde el borde de sala | `Q()`-adyacente / colisión de sala |
| Hitbox enemigos | `e.r` | 10–16 por tipo (sprinter 10, security/dancer/drone 12, tank 16, élite 13,92); minijefes suben `r` (p.ej. 26) | tablas de tipo |
| Hitbox jefes | `sr.r` | 34 (`BOSS_REF_R` del renderer refleja ese 34) | |
| Hurtbox balas jugador | `r:4` (p.ej. torreta) y radios por arma en `Et()` | 3162141, 2688333 | |
| Punto de salida de bala | `Et()`/`ft()` usan `ut.h` (95) en simulación | 2681747 / 2688333 |
| Ataque cuerpo a cuerpo dancer | `hypot(ye−e) < e.r + ye.r + 18` | 4005755 |
| Recogida de orbes de objetivo | `< ye.r + e.r + 3` | 3171932 |
| Imán de cabina (reliquia) | 150 px | 2716973 |
| Separación spawn / colocación | `e.r + ye.r + 6`, `inGap(…, ye.r + 4)` | 3292552 |
| Puertas | hueco 70 px (`fd(side, 70)`) | 2975472 |
| Cobertura (atrezo alto) | `ac(t, ye.x, ye.y) < 30` | 3154062+ |

## 2. Qué ha cambiado en la Fase 08 y qué no

| Área | Cambio | Impacto en colisión |
|---|---|---|
| `enemyFigureHeight`, `bossFigureHeight`, `drawPickup`, `drawProtagonist` | altura de figura × factor | **ninguno**: no se lee en la simulación |
| `ut.h` | × 1,18 **sólo** dentro del bloque de dibujo del arma; `Pf` lo restaura al salir | **ninguno** en `Et()/ft()/vt()` (se evalúan en la simulación con 95) |
| `ng()` | w/h de sala × factor de clase, acotado a los topes del motor | la sala es más grande: muros, puertas, atrezo y navegación se generan del rect final (igual que con el azar ±14 % que ya existía) |
| Cámara | `B/L/N.zoom` | **ninguno**: el ratón convierte pantalla→mundo con las mismas variables; la puntería es coherente |

## 3. Consecuencias visuales a vigilar (documentadas, no corregidas automáticamente)

* Un sprite más alto con la misma hitbox hace que las balas "atraviesen" la
  cabeza de tanques/élites un poco más que antes (la hitbox sigue en el
  cuerpo, centrada en `y`). Es el comportamiento pedido (no agrandar hitboxes).
  Si en pruebas con jugadores molesta, la decisión de subir `r` por tipo debe
  tomarse aparte y en el motor, nunca desde `DD_SCALE`.
* El jugador ×1,18 con `r = 14`: la sensación de "escurrirse" entre balas
  aumenta ligeramente (a favor del jugador).
* Los pickups ×1,15 no cambian su distancia de recogida.

## 4. Verificación ejecutada

* `node --test tests/world_scale/` → prueba "perfil intermedia: … hitboxes
  fuera de su alcance" comprueba que el perfil no contiene claves de
  colisión/alcance/velocidad; prueba "step() no muta la entrada".
* Sonda en juego (`probe_scale.js`): `player.r` = 14 en todas las telemetrías
  ANTES/DESPUÉS; `enemies[].r` iguales por tipo en `room_crowd` ANTES y DESPUÉS.
* `grep` en `index.html` generado: las únicas apariciones de `DD_SCALE` están en
  el módulo, el renderer, el bloque de arma del puente y el parche de `ng()`.
