# TANDA EN CURSO: `T04_ESCENARIOS` (TANDA 04 del pack 02–07)

- **Estado:** auditoría en juego (2026-11-14). R03 (jefes) **cerrada 42/42**: informe en
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
el de Ira). Candidatas: `wall_greed_vault` y `wall_violence_chains` (dos ids nuevos + dos cadenas en
`CIRCLE_CONFIG`). Pendiente de decidir tras ver las capturas.

## Plan de producción (provisional, a confirmar con la auditoría)

| Turno | Ilustraciones | Notas |
|---|---|---|
| 1 | 4 defectuosas (`wall_panel_gothic_niche`, `door_gothic_closed`, `door_gothic_open`, `portal_avaricia_gold`) + muros de Lujuria, Gula, Ira, Herejía, Fraude, Traición (10) | los muros con el mismo encuadre y módulo que el nicho nuevo |
| 2 | muro Núcleo, pilastra, 3 puertas I–IV + tienda, portal de jefe, plataforma, neón del zorro, muros nuevos de Avaricia y Violencia (10) | cierre T04 |

Validación: `probe_rooms.js` sobre la compilación final (círculos I–IX, salas 2 y 10, Refugio), evidencia
en `evidence/T04_ESCENARIOS/`, `batch.py mark`, `audit_report.py render`.

## Pendiente arrastrado

De R03 (jefes): muerte del Núcleo y del Arquitecto no visibles (pantalla final); destello de impacto que
vela la figura; balas de patrones y botín en pixel art (tandas 06–07); con el jefe final muerto, HUD y
diálogo por encima de la pantalla de fin de partida (visto una vez bajo la sonda).

De R01 (protagonista): armas pesadas con postura de cadera en todos los ángulos; vista lateral única
(`REF_06` pide 8 direcciones); pose de daño con arma larga apuntando abajo cruza hombro y cabeza.

De R02 (enemigos): vistos en juego en los círculos I, II, III, V y VIII (faltan IV, VI, VII y IX); un solo
fotograma por estado; proporciones cambiadas por el generador en `windup`/`attack` del Tanque y `death`
del Sprinter; balas enemigas en pixel art.
