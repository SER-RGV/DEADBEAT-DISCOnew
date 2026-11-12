# SIGUIENTE TRABAJO

1. **Cerrar `R02_ENEMIGOS`** — falta 1 ilustración de 24.
2. **Empezar `R03_JEFES`** — 42 ilustraciones (cinco turnos de generación a 10 por turno).

---

## 1. Lo que queda de `R02_ENEMIGOS`

| Pendiente | Detalle |
|---|---|
| `enemy_chef_death` | Muerte del Tanque. El único intento devolvió dos figuras superpuestas (la de caminar y la que cae) y no quedaban generaciones en el turno. Hasta entonces el juego desploma el fotograma de caminar: nunca mezcla el pixel art antiguo con el arte nuevo |

Cómo repetirla (ver «Generar una pose que no cabe…» en [`tools/art_master/README.md`](../../tools/art_master/README.md)):

- Referencia: el `walk` del Tanque pegado **centrado** sobre un lienzo de croma de unos
  1500×1300 (`dd_work/raw/R02_ENEMIGOS/_refs/`); la del intento fallido lo tenía
  descentrado.
- Texto: «ONE single character only… Replace the reference pose completely…»; cae de
  espaldas hacia la **izquierda**, cabeza a la izquierda y pies a la derecha, ninguna
  mano en el suelo.
- Alternativa si vuelve a fallar: desplome hacia delante sobre el lienzo original
  (1240×864), que no necesita ampliar la referencia.
- Después: contar miembros, medir la escala relativa por el área de las botas
  (`--rel`), `--ax` en el pie plantado, `batch.py process|register`, reconstruir,
  `probe_enemies.js --circles=3` (en el círculo III el minijefe es un Tanque) y
  `batch.py mark`.

Mejoras opcionales, si sobran generaciones:

- `enemy_fanatic_death`: la cabeza y el torso salieron un 15 % más pequeños que en el
  resto de sus fotogramas (se compensó a medias con la escala).
- `enemy_chef_windup`: la cabeza es más pequeña en proporción que en `walk`.

## 2. `R03_JEFES`

- **Contenido:** 10 jefes × 4 estados + Arquitecto × 2 = **42 ilustraciones**.
- **Por qué ahora:** tras protagonista y enemigos son lo más visible; hoy son pixel art
  y 10 de los 42 tienen defecto visible (damero horneado, fotogramas basura, cambios
  de identidad; lista en [`AUDITORIA_VISUAL.md`](AUDITORIA_VISUAL.md), apartado 4).
- **Commit previsto:** `feat(art): R03 jefes en ilustración, validados en juego`

### Contrato que espera el juego

| Dato | Valor |
|---|---|
| Ids | `boss_00_anden` … `boss_09_nucleo` × `idle`, `attack`, `hit`, `death`; `boss_10_arquitecto_idle`, `boss_10_arquitecto_attack` |
| Rutas | `assets/bosses/…` (ya registradas: la tanda **actualiza**, no da de alta) |
| Radio de colisión en el motor | 34 px |
| Alto del sprite heredado | 4,2 × radio |
| Estado (`f.bossState`) | muerte > impacto > ataque (`_ddaAttackT`, `pattern71`, fases `sweep`, `volley`, `berserk`) > reposo |
| Muertes | registro `f.bossDeaths`, 0,48 s |

### Antes de generar

1. Leer cómo dibuja hoy `DD_WORLD` al jefe (`resolveBossSlug` y lo que sigue) y qué le
   pasa el puente. Con los enemigos, el renderizador leía campos que el motor no tiene
   y sólo enseñaba un fotograma: **comprobar lo mismo aquí antes de dibujar nada**.
2. Llevar a los jefes el contrato de R02: anclas `foot` y `unit` en el registro, sin
   mezcla de revisiones, halo de separación, orden por línea de apoyo, y una vista del
   puente (`ddBossView`) con las mismas reglas que el motor.
3. Escribir `probe_bosses.js` sobre el modelo de `probe_enemies.js`
   (`DMO.debug.boss()` invoca al jefe del círculo; última sala del círculo `c` = nivel `c × 11`).
4. Decidir el diseño de cada jefe con la biblia de lore y `REF_06`…`REF_16`. Los
   nombres de los soberanos en la biblia no coinciden con los residentes del motor:
   documentar la correspondencia que se adopte, no resolverla en silencio.
5. Hoja de modelo por jefe (su `idle`) y, a partir de ella, los otros tres estados.

### Orden dentro de la tanda (prioridad a los defectuosos)

| Turno | Contenido |
|---|---|
| 1 | Cierre de R02 (1) + contrato y sonda de jefes + `idle` de los jefes 00–08 (9) |
| 2 | `idle` de 09 y Arquitecto (2) + `attack` de 00–07 (8) |
| 3 | `attack` de 08, 09 y Arquitecto (3) + `hit` de 00–06 (7) |
| 4 | `hit` de 07–09 (3) + `death` de 00–06 (7) |
| 5 | `death` de 07–09 (3) + repeticiones |

### Validación obligatoria en juego

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
- Balas enemigas todavía en pixel art (van en R07).
