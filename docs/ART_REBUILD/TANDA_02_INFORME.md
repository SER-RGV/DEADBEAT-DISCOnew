# TANDA 02 · ENEMIGOS Y VARIANTES — informe de cierre

Fecha: 2026-11-14 · Rama `arena/e088e9d7-deadbeat-disconew` · Láminas: `ART_REFERENCES/LAMINAS_2026-11-14/`
(`LAM_05_bestiario_neon.png` es la ficha de la categoría; `LAM_01…04` la resumen).

## 1. Auditoría (lo que había)

| Familia de arte (id) | Tipo del motor | Lámina | walk | windup | attack | death | hit |
|---|---|---|---|---|---|---|---|
| `security` | `dancer` en el círculo I, guardianes, minijefes | Seguridad (Común) | R02 | R02 | R02 | R02 | — (usaba `walk`) |
| `dancer` | `dancer` (círculo II en adelante) | Bailarín (Ágil) | R02 | R02 | R02 | R02 | — |
| `fanatic` | `sprinter` | Sprinter (Veloz) | R02 | R02 | R02 | R02 | — |
| `chef` | `tank`; minijefe del III | Tanque (Élite) | R02 | R02 | R02 | R02 | — |
| `drone` | `speaker` | Tirador (Distancia) | R02 | R02 | R02 | R02 | — |
| `elite` | marca `elite`; minijefe del VIII | Élite / Mascota | R02 | R02 | R02 | R02 | — |

Las 24 ilustraciones R02 están aprobadas y validadas en juego (`evidence/R02/`): **no se sustituyen**.
Faltaba el estado `hit` que el puente ya pedía (`ddEnemyView` → `state: "hit"`) y que el renderizador
resolvía sobre `walk` con un aplastamiento procedimental, y la lectura de **variantes** de la lámina
(el motor sólo pintaba un aro de 2 px y un glifo de 8 px).

## 2. Lo que NO se produce (no existe en el motor; no se inventa)

- Los «estilos» de bailarín de la lámina (errante, de corro, de línea, de pausa, diagonal): el motor tiene un
  solo tipo `dancer`; `anillo/camper/canonico/centro/esquinas/laterales/mobile/norte/pasillo/struggler/tenue`
  son patrones de **sala**, no de enemigo.
- «Mascota (Apoyo)» voladora como enemigo: el ojo volador del juego es el aliado `companion_drone_ally`.
- «Enemigos especiales de pista» (Sombra Abrazadora, Comensal Insaciable, Vitrina Ambulante, Altavoz Viviente,
  Acólito del Tubo, Cadena Errante, Eco Falso) y minijefes temáticos (Discómata, Coleccionista, Amplificador):
  el motor remapea por sala los cuatro tipos base (`DMO_FLOOR.filterEnemyType`); no hay entidades nuevas.
- Modificador «Sintético» (explota al morir) y escala 2,0× del Tanque: serían mecánica/colisión, no arte.

## 3. Producido e integrado

| Asset | Lienzo | Maestro | Uso |
|---|---|---|---|
| `enemy_security_hit` | 352×432 | `ART_ASSETS/rebuild_masters/R02_ENEMIGOS/enemy_security_hit.webp` | impacto (~0,12 s tras `f.damage`) |
| `enemy_dancer_hit` | 288×448 | ídem | |
| `enemy_fanatic_hit` | 352×448 | ídem | |
| `enemy_chef_hit` | 640×512 | ídem | |
| `enemy_drone_hit` | 240×464 | ídem | |
| `enemy_elite_hit` | 320×496 | ídem | |

Generación: edición del `walk` limpio de cada familia (`state_ref.py` → `_refs/ref_<fam>_walk_wide.png`,
lienzo 1,3× más ancho) con la orden «keep EXACTLY… change ONLY the upper body… feet planted». Seis de seis a la
primera; revisado número de figuras y de miembros, perfil derecho y croma. `k` (0,870–0,879) = alto generado /
alto de la referencia; eje de apoyo heredado del `walk` (`(ax_walk + desplazamiento) × k`). Fichas con
`fit`, `anchors_raw`, `rel_scale`, `prompt` y `use` en `batches/R02_ENEMIGOS.json`.

Manifiesto por asset (`assets/manifest.json` / `src/dd_asset_registry.js`): `id, name, src, w, h, alpha, pivot
anchors.foot, anchors.foot [fx, fy], anchors.unit, rev R02_ENEMIGOS, sha16`. Un fotograma por estado (sin
bucle): la duración la fija el motor (`hitFlash`), y el renderizador añade el balanceo.

### Código (sólo dibujo; sin cambios de mecánica)

- `src/dd_world_renderer.js`: `ENEMY_STATE_ASSET.hit = "hit"` (si una familia no tuviera `hit` de la misma
  `rev`, sigue cayendo a `walk`); tabla `ENEMY_VARIANT_RIM` (mismos colores que la tabla `variant86` del motor)
  → filo de color + velo ligero sobre el sprite con los cachés ya existentes (`enemyHaloTinted`,
  `enemyColorSilhouette`, media resolución); destello de impacto con tope 0,5 y caída cuadrática
  (`ENEMY_FLASH_CAP`), como el de los jefes, para que el fotograma `hit` se lea (pendiente histórico «el
  destello vela la figura»).
- `tools/build_active_html.py`: `ddEnemyView` entrega `variant` (clave `variant86`) y el gancho de QA
  `debugPoseEnemies` admite `assign.variant86`.
- `tools/art_master/probe_enemies.js`: captura `variants` (7 claves) y cuadro `frame_variants`.
- `tools/art_master/state_ref.py`: construye la referencia desde el maestro WebP archivado cuando no existe el croma.

Correspondencia de variantes lámina → motor: Blindado/Reforzado→`blindado` (#cbd5e1) · Ígneo/Incendiario→
`incendiario` (#f97316) · Hielo→`criogenico` (#7dd3fc) · Eléctrico→`conductivo` (#fde047) · Tóxico→`toxico`
(#a3e635) · Corrupto→`espectral` (#a855f7) · Experimental/Sangrante→`caotico` (#f472b6).

## 4. Pruebas y QA

- `batch.py process` (6/6 sin avisos: sin fantasma, sin borde, sin verde), `batch.py register`
  (275 registrados, `ASSET_CACHE_VERSION 20261114.x`), `python3 tools/build_active_html.py` (invariantes OK),
  `batch.py audit` (275 · 0 incidencias).
- `probe_enemies.js --circles=2,5` sobre `index.html` en Chromium headless: 149 recortes, 0 errores de página
  y de red, 275/275 assets cargados. Los seis `hit` se resuelven como fotograma propio (`dancer:hit`,
  `fanatic:hit`, `chef:hit`, `drone:hit`, `elite:hit`, `security:hit`, también en minijefe y guardián).
  Evidencia: `evidence/T02_ENEMIGOS/` (01 hoja de los 6 PNG, 02 impactos en juego II y V, 03 variantes en juego,
  04 caminar/aviso/ataque de control, 05–06 cuadros completos, `probe_enemies_report.json`).
- Repetida después del ajuste del destello: ver `02_juego_hit_circulos_II_y_V.jpg` (los recortes previos al
  ajuste se tomaron con tope 0,68; el informe JSON corresponde a la pasada completa).

## 5. Pendientes de la tanda

- Segundo fotograma de zancada por familia (hoy el ciclo de andar es balanceo procedimental): sólo si se
  acepta el coste (6 ilustraciones + lógica de alternancia por `phase`).
- Rotulación de las láminas (p. ej. «Tanque (Élite)») no coincide con el juego; el juego manda.
