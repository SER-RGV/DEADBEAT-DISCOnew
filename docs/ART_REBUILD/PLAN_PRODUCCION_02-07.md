# DEADBEAT DISCO — Auditoría y plan de producción · Pack visual 02–07

Fecha: 2026-11-14 · Rama de trabajo: `arena/e088e9d7-deadbeat-disconew` (desde `main` @ `2d1f6e8`).
Láminas de referencia recibidas: `ART_REFERENCES/LAMINAS_2026-11-14/LAM_01…LAM_05` (copias sin tocar de las
cinco láminas «Biblia visual · Pack 02–07», «Pack visual producción v2.0», «Pack visual maestro v2.0» y
«Bestiario Neón 02»).

## 1. Qué hay realmente en el repositorio

| Elemento | Realidad comprobada |
|---|---|
| HTML ejecutable | `index.html` (= `DEADBEAT_DISCO.html`). Es una **build generada** por `tools/build_active_html.py` a partir de `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` (motor minificado) + `src/*.js` + `src/dd_rebuild_ui.css`. Nunca se edita a mano. |
| Rama estable / reciente | `main` = `origin/main` = `2d1f6e8` (única rama remota con trabajo; las ramas `arena/*` anteriores están integradas). |
| Render | Canvas 2D. El motor dibuja; el puente (`build_active_html.py`) decide familia/estado (`ddEnemyView`, `ddBossView`) y delega en `src/dd_world_renderer.js` (`DD_WORLD.drawEnemy/drawBoss/drawEnemyDeath/drawBossDeath`, props, suelos, proyectiles, vfx). Orden de dibujado por línea de apoyo (`ddGroundY`). |
| Carga de imágenes | `src/dd_asset_registry.js` (AUTO-GENERADO por `tools/art_master/batch.py register`) + `assets/manifest.json`. `window.DD_ASSETS.get(id)`. No hay atlas binario: cada asset es un PNG individual con `anchors.foot`/`anchors.unit` y `rev` (generación de arte). |
| Arte vigente | R01 protagonista (27) ✔ · R02 enemigos (24 = 6 familias × walk/windup/attack/death) ✔ · TANDA 02 `hit` (6) ✔ · R03 jefes 42/42 ✔ · T04 escenarios 20/20 ✔. Maestros archivados en `ART_ASSETS/rebuild_masters/<TANDA>/*.webp`. Los croma originales (`/home/user/dd_work/raw`) no están en el repo. |
| Armas | Tabla `ja` del motor: **121 ids** (18 con nombre propio + 103 `cNNN_*`, `role:"FAMILIA · NºNN"`). Sprite HD sólo para 16 (`assets/weapons/`, 320×160, `pivot: grip-calibrated`); el resto se dibuja procedimentalmente (`proc`) con `hd:{grip,tip,axis,…}` ya definido por arma. |
| Pickups / reliquias | 20 PNG `assets/pickups/` (TANDA_16, pixel-art, 160×160, pivot center) mapeados en `dd_world_renderer.js` (`pickup_*_00`, `relic_*`). |
| HUD | `src/dd_ui_system.js` usa `hud_portrait_protagonist`, `hud_credit_coin`, `hud_skill_bomb/boost/dodge`, `hud_heart_full/empty` con *fallback* a los pickups. Iconos de vida/escudo/habilidad/moneda y `ui_victory_emblem` marcados «rehacer» en `AUDITORIA_VISUAL.md`. |
| Escenarios | `CIRCLE_CONFIG` + `PROP_KIND_TO_ASSET` en `dd_world_renderer.js`; `assets/floors` 12, `walls` 10, `props` 30, `environments` 8. Defectuosos documentados: `wall_panel_gothic_niche`, `door_gothic_*`, `portal_avaricia_gold`. HUB en `src/dd_hub_system.js` (`DD_HUB`). |
| Herramientas | `tools/art_master/` (chroma → `batch.py process/register/mark`, `layout.py`, `state_ref.py`, `preview_actors.py`, `sheet.py`, sondas Playwright `probe_*.js`). |

### Correspondencia lámina ↔ motor (decisiones)

**02 Enemigos.** Los tipos reales del motor son `dancer`, `sprinter`, `tank`, `speaker` (+ marcas `elite`, `guardian`,
`mini`). Las familias de arte (ids `enemy_<fam>_<estado>`) ya siguen REF_06 y coinciden con las de la lámina:
Seguridad→`security`, Bailarín→`dancer`, Sprinter→`fanatic`, Tirador→`drone`, Tanque→`chef`, Élite/Mascota→`elite`.
El R02 está aprobado y validado en juego: **no se sustituye**. Lo que falta respecto al contrato del puente:
el estado `hit` (hoy reutiliza `walk` con un aplastamiento procedimental) y la lectura de **variantes** (la lámina pide
«variantes de color»; el motor sólo pinta un aro fino y un glifo de 8 px: `lu.drawVariantCue`).
No existen en el motor y **no se inventan**: los cinco «estilos» de bailarín (errante/corro/línea/pausa/diagonal —
en el motor son patrones de sala: `anillo/camper/canonico/centro/esquinas/laterales/mobile/norte/pasillo/struggler/tenue`),
la «Mascota» voladora como enemigo (el ojo volador del juego es el **aliado** `companion_drone_ally`), los
«especiales por pista» (Sombra Abrazadora, Comensal, Vitrina…), minijefes temáticos (Discómata, Coleccionista, Amplificador)
y el modificador «Sintético». Las variantes reales del motor (`variant86`): `blindado, incendiario, criogenico,
conductivo, toxico, espectral, caotico` ← lámina: Blindado/Reforzado, Ígneo/Incendiario, Hielo, Eléctrico,
Tóxico, Corrupto(espectral), Experimental/Sangrante(caotico).

**03 Jefes.** El juego conserva los nombres del motor y de REF_03: `boss_00_anden` (Portero), `01_magneta` (Véspera),
`02_bufe` (Voraz), `03_cajero` (Áurea), `04_pogo` (Brama), `05_oficiante` (Obispo), `06_matarife` (Corazón
Encadenado), `07_imitador` (Crupier), `08_traidor` (Nix), `09_nucleo` (Rey del Compás), `10_arquitecto` (jefe secreto,
sin lámina). Las etiquetas de las láminas (Lujuria/Placer, Avaricia/Posesión, Fe rota, Lealtad…) **no** se adoptan.
Los `idle` nuevos (R03) son la referencia obligatoria de cada jefe; faltan 7 `attack`, 10 `hit`, 10 `death`.
*Avance 2026-11-14:* hechos los 7 `attack`, las 10 `death` y los 10 `hit` → **R03 42/42, tanda cerrada** ([`TANDA_03_INFORME.md`](TANDA_03_INFORME.md)).

**04 Escenarios.** El motor compone cada sala con suelos, muros, puertas y props individuales (profundidad por línea
de apoyo): no se usan fondos planos. El HUB es DOM + canvas (`DD_HUB`). Las láminas sólo dan ambiente; las referencias
aprobadas siguen siendo REF_07 (hub) y REF_08–16 (círculos).
*Avance 2026-11-14:* auditoría en juego con `probe_rooms.js` (18 salas de los nueve círculos + Refugio): el muro norte
se dibujaba aplastado 2:1 (corregido en el renderizador) y las puertas nunca cambiaban de estado ni de clase (corregido en
el puente). Ficha de 20 ilustraciones con contrato nuevo (muros opacos 384×576 simetrizados, puertas 448×544 sobre croma);
turno 1 hecho y visto en juego: `wall_panel_gothic_niche`, `door_gothic_closed`, `door_gothic_open`, `portal_avaricia_gold`
(este último señala ahora la puerta de descenso). *Turno 2 (2026-11-15):* los ocho muros restantes y la pilastra,
10/10 válidas a la primera; Avaricia y Violencia estrenan muro propio. *Turno 3 (2026-11-15):* vidriera cerrada y arco
abierto (I–IV), puerta VIP de la tienda, retablo del Residente, plataforma de descenso y neón del zorro, 6/6 a la primera.
**Tanda cerrada 20/20**, vista en juego con `probe_rooms.js` (sondas t04c–t04i + Refugio): informe en `TANDA_04_INFORME.md`.

**05 Armas.** Catálogo real = tabla `ja` (120 heredadas + `m1911`). Las 9 legendarias canónicas de la biblia
(Última Invitación, Sobremesa, El Último Centavo, Garganta Roja, Amén Vacío, Primer Latido, Palabra Prestada, Venías
Detrás, Punto Final) **no tienen id en el motor**: no se crean armas nuevas (sería inventar mecánicas); se documentan
como pendientes de diseño. El «Discobreaker» de las láminas tampoco existe en `ja`.

**06 Objetos.** Pickups y reliquias existen y están mapeados; están en pixel-art de otra época (B · rehacer estilo).
Efectos y proyectiles: `proj_*`/vfx procedimentales del renderizador.

**07 HUD.** El HUD es DOM funcional (`dd_ui_system.js`): sólo se sustituyen **imágenes** (`<img>` de corazones,
escudo, habilidades, moneda, emblemas); botones y lógica no se tocan.

## 2. Pipeline (el oficial del repo, sin herramientas nuevas)

1. Referencia limpia del reposo: `state_ref.py <tanda.json> --only id` → `dd_work/raw/<TANDA>/_refs/ref_*_wide.png`
   (ahora también parte del maestro archivado cuando no hay croma: cambio mínimo en `state_ref.py`).
2. Generación del croma verde (generador de imágenes de la sesión, prompt de la ficha + referencia) →
   `dd_work/raw/<TANDA>/<id>.png`. Un fotograma = una imagen; se revisa a ojo y se repite si hay brazos/piernas
   duplicados, línea de suelo, glow o croma sobre la figura.
3. Ficha en `docs/ART_REBUILD/batches/<TANDA>.json` (`layout: {ref, k, ax}`; `k` = alto de la imagen generada /
   alto de la referencia ancha; `ax` = eje de apoyo en px del croma).
4. `layout.py --only … --write` → `batch.py process --only …` (recorte, limpieza, lienzo, `anchors`, maestro WebP,
   hoja de QC) → `batch.py register` (manifest + registro) → `python3 tools/build_active_html.py`.
5. Sondas reales (`probe_enemies.js`, `probe_bosses.js`, `capture_game.js`) sobre `http://127.0.0.1:8080/index.html`
   con Chromium headless → evidencias en `docs/ART_REBUILD/evidence/<TANDA>/`.
6. `batch.py mark` + `audit_report.py render` + CHECKPOINT/NEXT_BATCH/PRODUCTION_STATUS/PRODUCTION_LOG.

## 3. Plan por tandas (alcance real)

| Tanda | Alcance | Assets nuevos | Integración |
|---|---|---|---|
| **02 Enemigos** | `hit` × 6 familias; lectura de variantes por color (tinte de contorno por `variant86`) sobre los sprites R02; mapa lámina↔motor; QA con sonda | 6 PNG + 6 maestros | `ENEMY_STATE_ASSET.hit`, `view.variant` en puente, tinte cacheado en `blitEnemyFrame` |
| **03 Jefes** | 7 `attack` + 10 `hit` + 10 `death` (27) con el reposo nuevo como referencia; fin de R03 — **27/27 hechos, cerrada 2026-11-14** (7 `attack`, 10 `death`, 10 `hit`) | 27 PNG + 27 maestros | ya contemplada (`BOSS_STATE_ASSET`), sólo `rev` nueva |
| **04 Escenarios** | Rehacer los 4 elementos defectuosos (nicho gótico, 2 puertas góticas, portal Avaricia) y las 14 piezas en pixel art que consumen `CIRCLE_CONFIG`/`drawDoor`/`drawDescentPad`/`DD_HUB` + 2 muros nuevos (Avaricia, Violencia) — ficha `batches/T04_ESCENARIOS.json`, **20/20 hechos, cerrada 2026-11-15** ([`TANDA_04_INFORME.md`](TANDA_04_INFORME.md)) | 20 PNG + 20 maestros | módulos del muro proporcionales; estado/clase de puerta en el puente (`ddDoorState`); 2 cadenas nuevas en `CIRCLE_CONFIG` al registrar los muros nuevos |
| **05 Armas** | Sprites HD 320×160 para las 105 armas `cNNN_*` sin sprite, por familias (pistola → … → míticas), con calibración `hd.grip/tip` real; icono = mismo PNG (el motor ya lo reutiliza) | hasta 105 PNG | `__HD_ASSETS.images["weapon_"+id]` / `DD_ASSETS` (ya enganchado) |
| **06 Objetos** | 20 pickups/reliquias en el estilo neón; efectos sólo si el renderizador los consume | 20 PNG | ids existentes (sin código) |
| **07 HUD** | corazón lleno/vacío, escudo, 3 habilidades, moneda, emblema victoria | ~8 PNG | ids ya consultados por `dd_ui_system.js` |

Limitaciones declaradas: cada tanda sólo se cierra con la sonda ejecutada sobre la build (`index.html`) y la
evidencia guardada; si una sonda no puede correr, se anota en el informe de la tanda y no se da por validada.
