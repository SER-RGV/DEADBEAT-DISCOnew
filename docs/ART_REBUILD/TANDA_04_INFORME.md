# TANDA 04 · ESCENARIOS — informe de cierre

Fecha: 2026-11-15 · Rama `arena/e088e9d7-deadbeat-disconew` · Láminas: `ART_REFERENCES/LAMINAS_2026-11-14/`
(`LAM_04` es la ficha de la categoría; las guías aprobadas son `REF_05_master_sheet_assets_ui_hub.png` y
`REF_06_guia_visual_maestra.png`; la forma del neón del zorro sale de `assets/logos/emblem_fox_crown.png`).
Lote: `batches/T04_ESCENARIOS.json` · Evidencia: `evidence/T04_ESCENARIOS/` (00–13) · Sonda: `tools/art_master/probe_rooms.js`.

## 1. Auditoría (lo que había al abrir la tanda)

Sondas t04a/t04b sobre `index.html` real: Refugio + 18 salas de los nueve círculos, 0 errores de página y de red
(`evidence/T04_ESCENARIOS/00_auditoria_salas_actual.jpg`, `01_parche_modulos.jpg`).

| Pieza (id) | Dónde la dibuja el motor | Estado al abrir |
|---|---|---|
| `wall_panel_gothic_niche` (Limbo, Refugio, respaldo) | `buildHighResRoomCache` (franja norte) | **D** damero y huecos horneados |
| `wall_panel_neon_crown`, `wall_gula_banquet`, `wall_wrath_furnace`, `wall_panel_heavy_base`, `wall_panel_vip_window`, `wall_ice_glacier`, `wall_core_monolith` | ídem, un muro por círculo (Avaricia y Violencia compartían el de Gula y el de Ira) | B pixel art 256×384 |
| `wall_pillar_obsidian` | pilastras cada 320 px y esquinas | B |
| `door_stained_closed` / `door_arched_open` (I–IV) | `drawDoor` | B |
| `door_gothic_closed` / `door_gothic_open` (V–IX) | `drawDoor` | **D** damero horneado |
| `door_vip_crimson` (tienda) · `portal_baroque_gold` (jefe) | `drawDoor` | B |
| `portal_avaricia_gold` | `drawDoor` | **D** halo verdoso |
| `threshold_descent_pad` | `drawDescentPad` (196 px) y Refugio | B |
| `prop_hub_fox_neon` | fachada del muro norte y `DD_HUB.foxSign` | B |

Además del arte, tres defectos **del dibujo**, no del asset:

1. **Muro norte aplastado 2:1.** Cada PNG 2:3 se pintaba en módulos de 128×132: arcos y hornacinas achatados
   en los nueve círculos. Corregido en `src/dd_world_renderer.js` (`modW = round(132·w/h)`, `pilW = round(148·w/h)`).
2. **Las puertas nunca cambiaban de estado ni de clase.** El puente no derivaba `open`/`kind` de
   `Mg`/`Ot.openT`/`shop`/`final`/`lift`: `DD_WORLD.drawDoor` sólo veía puertas cerradas y genéricas (ni hojas
   abiertas, ni tienda, ni retablo del Residente, ni plataforma de descenso en su sitio). Corregido en
   `tools/build_active_html.py` (`ddDoorState`; `WA` a 98 px de la puerta del ascensor; gancho QA
   `__DD_BRIDGE.setDoorsUnlocked`).
3. **Avaricia y Violencia sin muro propio.** Se producen `wall_greed_vault` y `wall_violence_chains` y se enlazan en
   `CIRCLE_CONFIG` (índices 3 y 6) al registrarlos.

## 2. Lo que NO se produce (no existe en el motor; no se inventa)

- Fondos planos por círculo: el motor compone cada sala con suelo, franja de muro norte, pilastras, puertas y props.
- `wall_panel_tall_neon`: ningún círculo lo consume. Se deja como está (clase B histórica, sin uso).
- Los 12 suelos (clase A): correctos en todos los círculos, no se tocan.
- Salas de tesoro: no existen en el motor. Decisión por defecto: el **portal relicario dorado** (`portal_avaricia_gold`)
  señala la puerta de **descenso** al círculo siguiente, acompañado de la plataforma.
- Props, NPC del Refugio y lámparas: mobiliario (R08), fuera de esta tanda. El protagonista del Refugio es el IDLE 07B
  aprobado y no se toca.
- Colocación del neón del zorro en los flancos del muro norte (a veces flotando sobre el vacío en salas sin franja
  visible): es del motor; sólo se rehace el asset.

## 3. Producido e integrado (20 ilustraciones; T04 queda en 20/20)

| Turno | Ilustraciones | Resultado |
|---|---|---|
| 1 | `wall_panel_gothic_niche`, `door_gothic_closed`, `door_gothic_open` (edición de la cerrada), `portal_avaricia_gold` | 4/4 a la primera · evidencia 02–06 |
| 2 | muros de Lujuria, Gula, Ira, Herejía, Fraude, Traición, Núcleo + **nuevos** `wall_greed_vault`, `wall_violence_chains` + `wall_pillar_obsidian` | 10/10 a la primera · evidencia 07–09 |
| 3 | `door_stained_closed`, `door_arched_open` (edición de la cerrada), `door_vip_crimson`, `portal_baroque_gold`, `threshold_descent_pad`, `prop_hub_fox_neon` | 6/6 a la primera · evidencia 10–13 |

20 generaciones para 20 válidas (0 repeticiones). Maestros WebP en `ART_ASSETS/rebuild_masters/T04_ESCENARIOS/` (20);
croma originales fuera del repositorio (`/home/user/dd_work/raw/T04_ESCENARIOS/`).

Qué es cada pieza nueva:

- **Muros** (384×576 opacos): Limbo/Refugio hornacina ojival con rosetón; Lujuria terciopelo acolchado y corona de
  neón; Gula aplique de llama y abanico dorado; Avaricia puerta acorazada dorada; Ira rejilla de horno; Herejía vidriera
  púrpura rota; Violencia jaula y cadenas; Fraude ventana VIP cian con siluetas; Traición costillas de cristal glaciar;
  Núcleo losa blanca con grieta magenta. Todos simetrizados con `mirror_half` (`right` en Herejía y Avaricia para
  conservar el cristal roto y quitar la bisagra; `left` en el resto) y encajan sin salto al repetirse.
- **Pilastra** `wall_pillar_obsidian` (288×576, croma): fuste acanalado de obsidiana con filo rosa.
- **Puertas de sala**: círculos I–IV vidriera carmesí con rosetón (`door_stained_closed`) y su hoja abierta con
  corredor cian (`door_arched_open`); círculos V–IX ojiva con calavera en la clave (`door_gothic_closed/open`).
- **Tienda** `door_vip_crimson`: terciopelo rojo acolchado con medallón dorado «VIP» (el generador rotuló el texto
  aunque se pidió sin él; se acepta por legible y coherente con la lámina).
- **Residente** `portal_baroque_gold` (448×576): retablo dorado con calavera de zorro coronada y vano negro.
- **Descenso**: `portal_avaricia_gold` (arco relicario con calaveras, monedas y cadenas) + `threshold_descent_pad`
  (640×400, losa cenital que lee como rombo cian con cristal rojo y flecha; también la usa el Refugio).
- **Neón del zorro** `prop_hub_fox_neon` (384×512): panel de obsidiana con el zorro rosa y la corona cian del emblema.

### Código (sólo dibujo y puente; sin cambios de mecánica)

- `src/dd_world_renderer.js`: módulos del muro norte y pilastras proporcionales; `CIRCLE_CONFIG` con los dos muros nuevos.
- `tools/build_active_html.py`: `ddDoorState` (estado y clase de puerta), plataforma a 98 px hacia dentro,
  `__DD_BRIDGE.setDoorsUnlocked`.
- `tools/art_master/artlib.py`: `mirror_half left|right`; `batch.py register` admite el tamaño declarado en la ficha
  (lienzos mayores que los del manifiesto anterior).
- `tools/art_master/probe_rooms.js` (nueva, v10): ver §4.

## 4. Pruebas y QA

- Por turno: `batch.py process --only …` (20/20 sin avisos; comprobado con PIL/numpy: 0 px de verde residual, alfa 0
  en el borde inferior de las puertas, cajas de recorte correctas) → `batch.py register` (277 registrados, 2 altas,
  `ASSET_CACHE_VERSION 20261115.2 → .4`) → `python3 tools/build_active_html.py` → `batch.py audit`
  (277 · 0 incidencias; alfa de los muros declarado opaco).
- Sondas `probe_rooms.js` sobre `index.html` en Chromium headless, en serie, todas con **0 errores de página y
  0 de red**:

| Pasada | Círculos × salas | Qué verifica | Cuadros / recortes |
|---|---|---|---|
| t04a/t04b | I–IX × 2 salas + Refugio | auditoría; parche de módulos | — |
| t04c | I, V–VII, IX | muro del Limbo, puertas góticas, portal | 31 / 93 |
| t04d | I, V, VIII (puertas abiertas) | hojas abiertas | 27 / 77 |
| t04e | I y V completos | tienda, Residente, descenso | 48 / 133 |
| t04f/t04g | I–IX × sala 2 (paso norte por teletransporte) | los nueve muros + pilastra | 27 / 108 |
| t04h | I, V × 2, 6, 9, 11 | vidriera cerrada/abierta, portal + pad | 24 / 75 |
| t04i | I, V, VIII × 6, 9, 11 (paso `_d_`) | VIP lateral, retablo inferior, pad en tres círculos | 33 / 84 |
| Refugio (`--circles= --rooms=`) | — | muro, pilastra, neón del zorro, pad | 1 |

  Lo que se ve: muros con la proporción correcta y sin costura entre módulos en los nueve círculos; vidriera carmesí
  cerrada y arco abierto con corredor cian en I–IV; ojiva gótica en V–IX; puerta VIP junto al protagonista a izquierda
  y derecha (c01 r06, c08 r06); retablo del Residente en puerta inferior (c01 r09); portal relicario con la plataforma
  en el muro norte y lateral (c01/c05/c08 r11); Refugio con el neón del zorro nuevo y la plataforma nueva.
- Evidencia `evidence/T04_ESCENARIOS/`: `00–01` auditoría y parche, `02–06` turno 1, `07–09` muros y pilastra,
  `10` puertas del círculo I, `11` tienda/Residente/descenso en tres círculos, `12` Refugio con el neón, `13` hoja
  de los 6 PNG del turno 3.
- Límites de la validación: las puertas se abren con el gancho de QA (`setDoorsUnlocked`) y el protagonista se
  teletransporta; no se ha jugado un descenso completo ni comprado en la tienda. Las salas son aleatorias por ejecución,
  así que las capturas no son reproducibles sala a sala (sí por círculo y tipo de puerta).

## 5. Lecciones de generación (para las tandas siguientes)

- **Muros modulares**: el bloque «strictly orthographic, fills the ENTIRE image edge to edge, perfectly symmetric,
  continuous cornice and baseboard, exactly HALF of a fluted pilaster at left and right edges» dio 11/11 muros válidos.
  La simetría perfecta no la garantiza el generador: `mirror_half` la impone, y hay que elegir la mitad buena
  (`right` cuando la izquierda trae un elemento que no debe duplicarse).
- **Hoja abierta** = edición de la cerrada («EDIT the reference image. Keep EXACTLY the same frame … change ONLY the
  door leaf»): mismo marco, mismo anclaje, tres de tres.
- **Croma**: «flat solid chroma green (#00FF00), nothing green on the object, glow as flat cel bands not halo» evita
  el halo verdoso que tenía el portal viejo; con `matte: hard` el borde inferior queda limpio (escalón horizontal).
- **Vista cenital**: para losas en el suelo pedir «steep top-down ~60°, reads as flattened rhombus, fills 90 % width»;
  de frente el pad no encajaba con la perspectiva del motor.
- El generador rotula texto cuando el objeto lo sugiere (medallón «VIP») aunque se pida «no text»: decidir si se acepta
  antes de procesar.

## 6. Pendientes de la tanda

- Salas en L o en cruz: los tramos horizontales interiores no tienen franja de muro (sólo la línea de neón). Es
  geometría de `buildHighResRoomCache` (una única franja por sala), no arte; corregir en el motor si se decide.
- El neón del zorro aparece en los flancos del muro norte y, en salas sin franja visible, flotando: colocación del motor.
- En el muro sur `drawDoor` achata las puertas a 0,82: aceptable con los assets nuevos, pero una revisión del
  renderizador podría usar la hoja a tamaño completo con el pie más alto.
- `wall_panel_tall_neon` queda sin uso en el manifiesto (clase B): candidato a retirarse en una limpieza de inventario.

## 7. Decisiones tomadas por defecto (pendientes de confirmar)

1. El portal relicario (`portal_avaricia_gold`) marca la puerta de **descenso**; el motor no tiene salas de tesoro.
2. Las puertas de sala se reparten por círculo: vidriera (I–IV) y gótica (V–IX), como estaba mapeado en `drawDoor`.
3. El medallón «VIP» de la puerta de la tienda se mantiene con texto.
4. Avaricia y Violencia dejan de compartir muro (dos ids nuevos en el manifiesto y en `CIRCLE_CONFIG`).
5. El Refugio reutiliza el muro del Limbo (`wall_panel_gothic_niche`) y la plataforma de descenso común.

## 8. Contrato de los escenarios

- **Muros** (`CIRCLE_CONFIG.wall`): PNG **opaco** 384×576 (2:3), `alpha=false`, `matte: none`, `fit: cover`,
  `mirror_half: left|right`; media pilastra en cada borde y cornisa continua. En pantalla, módulos de 88 px y
  pilastras de 74 px cada 320 px: formas legibles a ~100 px.
- **Puertas** (`drawDoor`): croma `#00FF00`, `matte: hard`, 448×544 (jefe 448×576), `fit: contain` con margen 6 y
  ancla inferior; 136 px de ancho en pantalla con el pie en la posición de la puerta. Hoja abierta por edición de la cerrada.
- **Clases de puerta** (`ddDoorState`): `room` → vidriera I–IV / gótica V–IX; `shop` → `door_vip_crimson`;
  `boss` (local 10) → `portal_baroque_gold`; `lift` (local 11) → `portal_avaricia_gold` + `threshold_descent_pad`
  98 px hacia dentro.
- **Plataforma**: 640×400 croma, `anchor: center`, cenital. **Pilastra**: 288×576 croma. **Neón del zorro**: 384×512 croma.
- QA: `probe_rooms.js OUT --circles=… --rooms=… --hub=0` (pasos a/b/c/d); Refugio con `--circles= --rooms=`;
  una sola instancia de Chromium a la vez.
