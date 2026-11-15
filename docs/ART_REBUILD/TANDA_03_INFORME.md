# TANDA 03 · JEFES — informe de cierre

Fecha: 2026-11-14 · Rama `arena/e088e9d7-deadbeat-disconew` · Láminas: `ART_REFERENCES/LAMINAS_2026-11-14/`
(`LAM_03` es la ficha de la categoría; las guías aprobadas siguen siendo `REF_03` y los `idle` de R03).
Lote: `batches/R03_JEFES.json` · Evidencia: `evidence/T03_JEFES/` (01–13 + 6 informes de sonda) y `evidence/R03/`.

## 1. Auditoría (lo que había al abrir la tanda)

| Jefe (id) | Círculo del motor | idle | attack | hit | death |
|---|---|---|---|---|---|
| `boss_00_anden` | I Limbo · ANDÉN, el Portero | R03 | R03 | — | — |
| `boss_01_magneta` | II Lujuria · MAGNETA | R03 | R03 | — | — |
| `boss_02_bufe` | III Gula · BUFÉ | R03 | R03 | — | — |
| `boss_03_cajero` | IV Avaricia · EL CAJERO | R03 | — | — | — |
| `boss_04_pogo` | V Ira · EL POGO | R03 | R03 | — | — |
| `boss_05_oficiante` | VI Herejía · EL OFICIANTE | R03 | — | — | — |
| `boss_06_matarife` | VII Violencia · EL MATARIFE | R03 | — | — | — |
| `boss_07_imitador` | VIII Fraude · EL IMITADOR | R03 | — | — | — |
| `boss_08_traidor` | IX Traición · EL TRAIDOR | R03 | — | — | — |
| `boss_09_nucleo` | Núcleo · la Última Canción | R03 | — | — | — |
| `boss_10_arquitecto` | secreto · el Arquitecto | R03 | — | (no aplica) | (no aplica) |

15 de 42. Los 27 PNG pixel art de la línea anterior seguían en `assets/bosses/` pero el renderizador
no los mezcla con la revisión R03: un jefe sin fotograma propio resolvía el estado sobre su `idle`
nuevo con una señal procedimental (aplastado en la muerte, anillo en la ventana expuesta).

## 2. Lo que NO se produce (no existe en el motor; no se inventa)

- Nombres y títulos de las láminas y de la biblia (Véspera, Voraz, Áurea, Brama, Nix, «Rey del Compás»…):
  el juego conserva los del motor (ANDÉN, MAGNETA, BUFÉ, EL CAJERO, EL POGO, EL OFICIANTE, EL MATARIFE,
  EL IMITADOR, EL TRAIDOR, Núcleo, Arquitecto). La correspondencia queda en `NEXT_BATCH.md`.
- Fases visuales distintas por etapa (Núcleo etapas 2–3, Arquitecto fases 2–3): el motor cambia patrones,
  no sprites; no se crean fotogramas por fase.
- Fotograma por impacto de bala: a la cadencia del protagonista sería un parpadeo continuo. El impacto sigue
  siendo un destello breve sobre la pose actual; el `hit` se reserva para la ventana expuesta (`exposedT`).
- `hit` y `death` del Arquitecto: su encuentro no expone ventana de vulnerable como los residentes y su
  muerte abre la pantalla final en el mismo fotograma (igual que la del Núcleo). Contrato: sólo `idle` y `attack`.

## 3. Producido e integrado (27 ilustraciones en esta tanda; R03 queda en 42/42)

Todas generadas por **edición del `idle` limpio del propio jefe** montado en lienzo croma 1,35× más ancho
(`state_ref.py` → `/home/user/dd_work/raw/R03_JEFES/_refs/ref_<nn>_<slug>_wide.png`), tinta negra, cel duro,
filo magenta/cian, perfil a la derecha, «exactly one figure, two arms and two legs». Maestros recortados en
`ART_ASSETS/rebuild_masters/R03_JEFES/<id>.webp`; PNG finales en `assets/bosses/`.

| Asset | Lienzo | k (escala real respecto del `idle`) | Cómo se midió | Uso |
|---|---|---|---|---|
| `boss_03_cajero_attack` | 400×560 | 0,861 | factor del lienzo | ataque (`ddBossView` → `attack`) |
| `boss_05_oficiante_attack` | 624×560 | 0,861 | factor del lienzo | ataque |
| `boss_06_matarife_attack` | 720×560 | 0,86 | factor del lienzo | ataque |
| `boss_07_imitador_attack` | 576×560 | 0,86 | factor del lienzo | ataque |
| `boss_08_traidor_attack` | 560×576 | 0,86 | factor del lienzo | ataque |
| `boss_09_nucleo_attack` | 544×608 | 0,85 | factor del lienzo | ataque |
| `boss_10_arquitecto_attack` | 624×608 | 0,85 | factor del lienzo | ataque |
| `boss_00_anden_death` | 528×544 | 0,88 | gorra (NCC) | registro de muerte, 1 s |
| `boss_01_magneta_death` | 464×368 | 1,30 | aro del halo (máscara de color) | muerte |
| `boss_02_bufe_death` | 400×400 | 1,15 | puerta del horno | muerte |
| `boss_03_cajero_death` | 368×560 | 0,85 | halo hexagonal | muerte |
| `boss_04_pogo_death` | 464×448 | 0,93 | amplificador del pecho | muerte |
| `boss_05_oficiante_death` | 464×400 | 1,00 | mitra | muerte |
| `boss_06_matarife_death` | 624×528 | 0,86 | tambor del pecho | muerte |
| `boss_07_imitador_death` | 608×480 | 0,85 | rejilla ×2 a ojo (cabeza girada) | muerte |
| `boss_08_traidor_death` | 528×352 | 1,05 | corona, rejilla ×2 | muerte |
| `boss_09_nucleo_death` | 528×400 | 0,89 | esfera del pecho | muerte |
| `boss_00_anden_hit` | 560×576 | 0,86 | piernas (NCC cuarto inferior, 0,82–0,84) | vulnerable (`recover`) |
| `boss_01_magneta_hit` | 432×544 | 0,86 | piernas | vulnerable |
| `boss_02_bufe_hit` | 528×528 | 0,86 | piernas (cucharones sueltos borrados en el croma) | vulnerable |
| `boss_03_cajero_hit` | 464×560 | 0,86 | piernas (0,94); **2.º intento**: el 1.º salió con el halo gigante | vulnerable |
| `boss_04_pogo_hit` | 560×560 | 0,86 | piernas | vulnerable |
| `boss_05_oficiante_hit` | 528×560 | 0,90 | mitra por área (la túnica abierta baja el NCC a 0,35) | vulnerable |
| `boss_06_matarife_hit` | 656×560 | 0,86 | tambor (0,95) | vulnerable |
| `boss_07_imitador_hit` | 544×560 | 0,86 | piernas (0,81) | vulnerable |
| `boss_08_traidor_hit` | 528×560 | 0,86 | piernas (0,84) | vulnerable |
| `boss_09_nucleo_hit` | 464×592 | 0,86 | piernas (0,87) | vulnerable |

Generaciones: 29 para 27 válidas (`boss_03_cajero_attack` necesitó tres intentos: miembros duplicados; el
`hit` del Cajero, dos: halo gigante). Turnos de 10/10, 10/10, 9/10 y 6/6.

Ficha por asset (`batches/R03_JEFES.json`): `layout {ref, k[, ax]}` → `layout.py --write` calcula `size`,
`fit` (modo `anchor`) y `anchors_raw` (`foot`, `unit_h`) de modo que **todos los fotogramas de un jefe
comparten píxeles por unidad** (ppu 2,8, margen 8). Eje de apoyo del `hit` heredado del `idle`:
`(ax_idle + (ancho_ref − ancho_maestro)/2) · (alto_gen / alto_ref)`. El manifiesto registra `anchors.foot`,
`anchors.unit` y la revisión `R03_JEFES`; el renderizador sólo usa un fotograma de estado si tiene anclas y la
misma revisión que el `idle`.

### Código (sólo dibujo; sin cambios de mecánica)

- `src/dd_world_renderer.js`: tope de `anchors.unit` aceptado de 1,5 a **2,0** en jefes (`resolveBossFrame`)
  y enemigos: las muertes re-encuadradas (Traidor 1,59; Núcleo 1,43; Magneta 1,45) habrían caído a la
  unidad heredada y se habrían visto con otra escala. `drawBossDeath` ya usa el fotograma `death` (destello,
  retroceso y desvanecido sobre la pose, sin aplastar el reposo). `BOSS_STATE_ASSET.hit` se resuelve desde
  `recover` (ventana expuesta) — ya estaba contemplado; sólo cambia la revisión.
- Sin cambios en `tools/build_active_html.py` para esta tanda (el puente `ddBossView` de R03 ya entregaba
  `idle/attack/recover/death`).

## 4. Pruebas y QA

- Por turno: `layout.py --only … --write` → `batch.py process --only …` (27/27 sin avisos salvo un
  `green_spill` inocuo en el `hit` del Bufé, revisado en onion) → `batch.py register` (275 registrados,
  `ASSET_CACHE_VERSION 20261114.3 → .6`) → `python3 tools/build_active_html.py` (invariantes OK) →
  `preview_actors.py --bosses --onion --zoom` (apoyo y escala sobre el `idle`) → `batch.py audit`
  (275 · 0 incidencias).
- Sondas `probe_bosses.js` sobre `index.html` en Chromium headless, en serie, todas con **0 errores de
  página y 0 de red, 275/275 assets cargados**:

| Pasada | Jefes (`--bosses`) | Qué verifica | Recortes |
|---|---|---|---|
| t03 (01–02) | 4, 6 | `attack` Cajero y Oficiante | 38 |
| t03b/c | 7, 8, 9, 10, 11 | `attack` Matarife…Arquitecto | — |
| t03d/e/f | 1, 2, 3, 4, 5 | `death` Andén…Pogo | — |
| t03g | 6, 7, 8, 9, 10 | `death` Oficiante…Núcleo | 94 |
| t03h | 1, 2, 3, 5 | `hit` Andén, Magneta, Bufé, Pogo | 76 |
| t03i | 4, 6, 7, 8, 9, 10 | `hit` Cajero (repetido), Oficiante…Núcleo | 113 (30 cuadros, 464 s) |

  Lo que se ve en los recortes: `attack` con el fotograma nuevo en los once; `recover` con el fotograma `hit`
  y el anillo cian de expuesto en los diez residentes; `death` de rodillas en nueve (00–08); impacto de bala
  = destello sobre la pose vigente, sin cambio de fotograma (por diseño).
- Evidencia `evidence/T03_JEFES/`: `01–02` ataques Cajero/Oficiante, `03–04` ataques 06–10, `05–06` muertes
  00–04, `07–08` muertes 05–09, `09–10` vulnerable 00–04, `11–12` vulnerable 03 y 05–09, `13` hoja de los 42
  PNG; informes `probe_bosses_report_*.json`.
- Límites de la validación: los estados se fuerzan con el gancho de QA (`debugPoseBoss`); no se ha jugado un
  combate completo. Las muertes del **Núcleo** y del **Arquitecto** no llegan a verse: la pantalla final se
  abre en el mismo fotograma (decisión abierta n.º 6 de `NEXT_BATCH.md`; `boss_09_nucleo_death` queda
  registrada por si se retrasa esa pantalla).

## 5. Lecciones de generación (para las tandas siguientes)

- El modo edición con el reposo limpio como referencia es el único que da una sola figura con dos brazos y
  dos piernas; las peticiones «nueva pose» libres duplican miembros.
- «Same pixel width» **no** garantiza la escala: las muertes salen re-encuadradas (k 0,85–1,30) y los
  accesorios con tamaño propio (halo del Cajero) hay que nombrarlos con su tamaño («SMALL… about the width of
  head and shoulders»). Medir siempre: piernas por NCC en `hit` (pies plantados), rasgo rígido en `death`,
  rejilla ×2 a ojo si el rasgo gira.
- Objetos sueltos (cucharones, máscaras, teselas, moneda): si pertenecen a la pose se conservan; si flotan
  sin sentido se borran en el croma **antes** de procesar y se guarda el original (`.ORIG.png`).

## 6. Pendientes de la tanda

- Muerte del Núcleo y del Arquitecto no visibles (pantalla final). Opciones en `NEXT_BATCH.md` (decisión 6).
- Escala variable entre `death` e `idle` en Magneta (1,30) y Bufé (1,15): aceptada porque el apoyo y la
  unidad están medidos, pero el derrumbe «crece» un poco respecto del reposo; repetir sólo si sobra turno.
- El destello de impacto vela la figura en su pico (pendiente histórico; el tope 0,5 de enemigos no se ha
  aplicado a jefes).
- Etapas 2–3 del Núcleo y fases 2–3 del Arquitecto sin capturar en sonda.
- Balas de los patrones y botín siguen en pixel art (tandas 06–07 / R06–R07).

## 7. Quién es cada jefe (tres fuentes que no coinciden)

El motor, las guías visuales y la biblia de lore nombran y describen a los jefes de
forma distinta. Se documenta la correspondencia adoptada; **no se cambia ningún nombre
del juego**.

| Id del asset | Círculo y jefe según el motor (lo que el juego muestra) | Guía `REF_03` | Biblia de lore | Alto en el mundo |
|---|---|---|---|---:|
| `boss_00_anden` | I Limbo · ANDÉN, el Portero | — (no hay Limbo en la guía) | §17.1 El Portero sin Rostro (subjefe) | 196 |
| `boss_01_magneta` | II Lujuria · MAGNETA, la Anfitriona | I Lujuria | Véspera, la Última Invitación | 190 |
| `boss_02_bufe` | III Gula · BUFÉ, el Anfitrión sin Fondo | II Gula | Voraz, el Anfitrión Hueco | 178 |
| `boss_03_cajero` | IV Avaricia · EL CAJERO, el que cobra la entrada | III Avaricia | Áurea, la Coleccionista de Instantes | 190 |
| `boss_04_pogo` | V Ira · EL POGO, el que abre la pista | IV Ira | Brama, el Santo del Ruido | 186 |
| `boss_05_oficiante` | VI Herejía · EL OFICIANTE, el que oficia el ruido | V Herejía | El Obispo de la Nota Ausente | 194 |
| `boss_06_matarife` | VII Violencia · EL MATARIFE, el que despieza el set | VI Violencia | El Corazón Encadenado | 188 |
| `boss_07_imitador` | VIII Fraude · EL IMITADOR, el que duplica la pista | VII Fraude | El Crupier de las Mil Voces | 192 |
| `boss_08_traidor` | IX Traición · EL TRAIDOR, el último residente | VIII Traición | Nix, la Voz que Faltaba | 200 |
| `boss_09_nucleo` | Núcleo final · la Última Canción | IX Núcleo | El Rey del Compás | 204 |
| `boss_10_arquitecto` | Jefe secreto · el Arquitecto del Club (DJ-Director) | — | — | 192 (unos 209 con su radio de 38) |

El protagonista mide 104 px de mundo: los jefes van de 1,7 a 2 veces su altura.

## 8. Decisiones tomadas por defecto (pendientes de confirmar)

Ninguna está respondida. Los 42 fotogramas ya están hechos sobre estas decisiones; cambiar
una supone regenerar los cuatro estados del jefe afectado.

1. **Aspecto.** Sigue la guía `REF_03`, emparejada con el jefe del motor por el tema
   del círculo (Lujuria, Gula, Avaricia…), no por el número: el motor tiene un círculo
   más (Limbo). Nombre, título y color son los del motor. De la biblia se toman los
   motivos compatibles (horno en el vientre del Bufé, amplificador entre las costillas
   del Pogo, mitra en forma de diapasón del Oficiante, tambor en el pecho del Matarife,
   máscaras del Imitador).
2. **El Cajero.** La guía y la biblia muestran a una mujer; el motor lo llama «EL
   CAJERO». Resuelto con una figura enmascarada de género ambiguo.
3. **El Núcleo.** La guía sólo muestra una esfera negra. Se ha dibujado un humanoide
   de teselas de espejo con esa esfera en el pecho (el cuerpo sale de la biblia, §15).
4. **El Arquitecto.** No tiene lámina. Diseñado a partir del sprite antiguo, con un
   compás de dibujo como cetro.
5. **El Traidor.** Lleva un báculo; la lámina muestra dos.
6. **Muerte del Núcleo.** Hoy no se ve (la pantalla final la tapa). Opciones: retrasar
   esa pantalla 1 s para que se vea el derrumbe, o dejarlo y no producir
   `boss_09_nucleo_death`. Por defecto no se toca el flujo del juego y esa ilustración
   queda la última de la lista.

## 9. Incidencias del arte generado (reposos, R03 inicial)

Detalle por asset, con el texto de cada petición, en
[`batches/R03_JEFES.json`](batches/R03_JEFES.json).

| Jefe | Incidencia | Estado |
|---|---|---|
| Cajero | Salió dos veces caminando (copiaba la zancada de la imagen de estilo) | Rehecho de pie al tercer intento |
| Oficiante | Volvió como hoja de tres vistas | Rehecho a figura única |
| Magneta, Bufé, Pogo, Matarife y los `attack` de Magneta, Bufé y Pogo | Línea fina de suelo bajo los pies | Borrada al procesar (`ground_line`) |
| Magneta, Imitador | Cables e hilos que llegaban al borde superior | Fundidos al procesar (`fade`) |
| Bufé, `attack` | El cristal de la puerta del horno salió en verde croma y se recortó: queda el aro sin cristal | Se ve en juego; repetir si sobra una generación |
| Bufé, `idle` | Aviso automático de «posible damero horneado» | Revisado en juego: no se aprecia |
| Matarife | Vista frontal, no de tres cuartos | Aceptado |

## 10. Contrato de los jefes

Texto completo en [`tools/art_master/README.md`](../../tools/art_master/README.md),
apartado «Contrato de los jefes (R03)». Resumen:

| Dato | Valor |
|---|---|
| Ids | `boss_00_anden` … `boss_09_nucleo` × `idle`, `attack`, `hit`, `death`; `boss_10_arquitecto_idle`, `boss_10_arquitecto_attack` |
| Punto de apoyo | ancla `foot` en `(x, y + 0,8 · r)`; `r` = 34 (Arquitecto 38) |
| Alto de la figura | el de la tabla × `(r / 34)^0,75` |
| Orientación | el arte mira a la derecha; se refleja cuando el protagonista está a la izquierda |
| Fotograma de estado | sólo se usa si tiene anclas y la misma revisión que el `idle` |
| Muerte | registro de 1 s; sin fotograma `death`, derrumbe procedural del `idle` |
