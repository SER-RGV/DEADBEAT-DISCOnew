# TANDA EN CURSO: `T04_ESCENARIOS` (TANDA 04 del pack 02–07)

- **Estado:** en producción (2026-11-14): auditoría hecha, ficha `batches/T04_ESCENARIOS.json`
  (20 ilustraciones), turno 1 generado y registrado (4/20: `wall_panel_gothic_niche`,
  `door_gothic_closed`, `door_gothic_open`, `portal_avaricia_gold`). R03 (jefes) **cerrada 42/42**: informe en
  [`TANDA_03_INFORME.md`](TANDA_03_INFORME.md) (incluye la correspondencia de jefes, las seis
  decisiones por defecto sin confirmar y el contrato del renderizador).
- **Alcance (plan, [`PLAN_PRODUCCION_02-07.md`](PLAN_PRODUCCION_02-07.md) §3):** rehacer los elementos
  de escenario defectuosos (clase D) y las piezas que el motor consume en pixel art (clase B) de
  `CIRCLE_CONFIG`, `drawDoor` y `drawDescentPad`; en el Refugio, sólo lo que `DD_HUB` consume.
  No se producen fondos planos: el motor compone cada sala con suelo, franja de muro norte, pilastras,
  puertas y props.
- **Herramienta nueva:** `tools/art_master/probe_rooms.js OUT --circles=1..9 --rooms=2,10` — recorre el
  Refugio y salas de cada círculo sobre `index.html` real y guarda cuadro completo, recorte de cada puerta
  (posición de `getSnapshot().doors`) y franja del muro norte; `probe_report.json` con errores de página
  y de red.

## Qué consume el motor (lo que se ve) y en qué estado está

| Pieza | Id | Lienzo | Dónde se dibuja | Clase |
|---|---|---|---|---|
| Muro norte Limbo + **Refugio** + respaldo general | `wall_panel_gothic_niche` | 256×384 | `buildHighResRoomCache` (módulos de 128×132) | **D** (damero/huecos horneados) |
| Muro Lujuria | `wall_panel_neon_crown` | 256×384 | ídem | B |
| Muro Gula **y Avaricia** (compartido) | `wall_gula_banquet` | 256×384 | ídem | B |
| Muro Ira **y Violencia** (compartido) | `wall_wrath_furnace` | 256×384 | ídem | B |
| Muro Herejía | `wall_panel_heavy_base` | 256×384 | ídem | B |
| Muro Fraude | `wall_panel_vip_window` | 256×384 | ídem | B |
| Muro Traición | `wall_ice_glacier` | 256×384 | ídem | B |
| Muro Núcleo | `wall_core_monolith` | 256×384 | ídem | B |
| Pilastra (todos los círculos y Refugio) | `wall_pillar_obsidian` | 192×384 | cada 320 px y esquinas (56×148) | B |
| Puerta cerrada / abierta, círculos I–IV | `door_stained_closed` / `door_arched_open` | 320×384 | `drawDoor` (136 px de ancho) | B |
| Puerta cerrada / abierta, círculos V–IX | `door_gothic_closed` / `door_gothic_open` | 320×384 | `drawDoor` | **D** (damero horneado) |
| Puerta de tienda | `door_vip_crimson` | 288×384 | `drawDoor` | B |
| Puerta de tesoro / élite | `portal_avaricia_gold` | 320×384 | `drawDoor` | **D** (halo) |
| Puerta de jefe | `portal_baroque_gold` | 320×416 | `drawDoor` | B |
| Plataforma de descenso | `threshold_descent_pad` | 512×320 | `drawDescentPad` (196 px) y respaldo de puerta | B |
| Neón del zorro (muro norte y Refugio) | `prop_hub_fox_neon` | 384×512 | fachada (82×108) y Refugio (112×148) | B |

No consumido por el motor (no se produce): `wall_panel_tall_neon` (ningún círculo lo usa). Suelos: los 12
son clase A (se conservan). Props, NPC del Refugio y lámpara pertenecen a mobiliario (R08), no a esta tanda;
el protagonista del Refugio es el IDLE 07B aprobado (`pm_idle_fid_00.png`) y no se toca.

Piezas que faltan en `CIRCLE_CONFIG`: Avaricia y Violencia no tienen muro propio (reutilizan el de Gula y
el de Ira). Decidido: se producen `wall_greed_vault` y `wall_violence_chains` (dos ids nuevos; al registrarlos
se añaden sus cadenas a `CIRCLE_CONFIG`, índices 3 y 6).

## Auditoría en juego (sondas t04a/t04b, 18 salas de los nueve círculos + Refugio)

Evidencia: `evidence/T04_ESCENARIOS/00_auditoria_salas_actual.jpg` y `01_parche_modulos.jpg`.

1. **Muro norte aplastado 2:1.** `buildHighResRoomCache` dibujaba cada PNG de 256×384 en módulos de
   128×132: arcos, hornacinas y vidrieras salían achatados en los nueve círculos. Corregido en
   `src/dd_world_renderer.js`: módulo `modW = round(132·w/h)` (88 px para un panel 2:3) y pilastras
   `pilW = round(148·w/h)` (74 px). Verificado en t04b (arte anterior, ya sin deformar).
2. **Puertas góticas (círculos V–IX) con damero blanco horneado** y **portal de tesoro con halo verdoso**:
   clase D confirmada; rehechas en el turno 1.
3. **Las puertas nunca cambiaban de estado ni de clase.** El motor no guarda `open`/`kind` en la puerta
   (su `Bg` original lo calculaba al dibujar con `Mg(e)` y `Ot.openT`, y distinguía `shop`/`final`/`lift`
   por banderas), de modo que `DD_WORLD.drawDoor` sólo veía puertas cerradas y genéricas: no se mostraban
   las hojas abiertas, la puerta de la tienda, el retablo del Residente ni la plataforma de descenso en su
   sitio. Corregido en el puente (`tools/build_active_html.py`: `ddDoorState`, `WA` a 98 px de la puerta del
   ascensor, gancho QA `__DD_BRIDGE.setDoorsUnlocked`). Decisión por defecto: el **portal relicario dorado**
   (`portal_avaricia_gold`) señala la puerta de **descenso** al círculo siguiente (no hay salas de tesoro).
4. Recorte «muro norte» de la sonda negro en salas altas: la franja quedaba fuera de cámara. La sonda v5
   añade la captura `_c_norte` con el protagonista pegado al muro.
5. El neón del zorro aparece en los flancos del muro norte y, en salas sin franja visible, flotando sobre
   el vacío: el asset se rehace (clase B); su colocación es del motor y no se toca en esta tanda.
6. Suelos (12, clase A) correctos en todos los círculos: no se tocan. Las cajas `prop_crate_club` de todas las
   salas pertenecen a R08 (mobiliario).

Contrato nuevo de las piezas (en la ficha): muros opacos 384×576 (2:3) sin croma, simetrizados con
`mirror_half left` para que los módulos encajen, media pilastra en cada borde y cornisa continua; puertas
448×544 (jefe 448×576) sobre croma, escalón horizontal abajo; pilastra 288×576; plataforma 640×400; neón del
zorro 384×512. `register` admite el tamaño de la ficha (lienzos mayores que los del manifiesto anterior).

## Plan de producción

| Turno | Ilustraciones | Estado |
|---|---|---|
| 1 | `wall_panel_gothic_niche`, `door_gothic_closed`, `door_gothic_open` (edición de la cerrada), `portal_avaricia_gold` | **hecho** (evidencia 02–03) |
| 2 | muros de Lujuria, Gula, Ira, Herejía, Fraude, Traición, Núcleo + `wall_greed_vault`, `wall_violence_chains` + pilastra (10) | pendiente (referencia de formato: el nicho nuevo) |
| 3 | `door_stained_closed`, `door_arched_open` (edición), `door_vip_crimson`, `portal_baroque_gold`, `threshold_descent_pad`, `prop_hub_fox_neon` (6) | pendiente; cierre T04 |

Validación: `probe_rooms.js` sobre la compilación final (círculos I–IX, salas 2, 5 y 10; Refugio con `--hub=1`),
evidencia en `evidence/T04_ESCENARIOS/`, `batch.py mark`, `audit_report.py render`.

## Pendiente arrastrado

De R03 (jefes): muerte del Núcleo y del Arquitecto no visibles (pantalla final); destello de impacto que
vela la figura; balas de patrones y botín en pixel art (tandas 06–07); con el jefe final muerto, HUD y
diálogo por encima de la pantalla de fin de partida (visto una vez bajo la sonda).

De R01 (protagonista): armas pesadas con postura de cadera en todos los ángulos; vista lateral única
(`REF_06` pide 8 direcciones); pose de daño con arma larga apuntando abajo cruza hombro y cabeza.

De R02 (enemigos): vistos en juego en los círculos I, II, III, V y VIII (faltan IV, VI, VII y IX); un solo
fotograma por estado; proporciones cambiadas por el generador en `windup`/`attack` del Tanque y `death`
del Sprinter; balas enemigas en pixel art.
