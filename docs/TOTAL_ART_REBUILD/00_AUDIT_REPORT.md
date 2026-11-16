# FASE 0 — INFORME DE AUDITORÍA
# DEADBEAT DISCO — Reconstrucción total del arte y sustitución de assets en el juego real

**Fecha:** 2026-11-15 · **Rama de trabajo:** `arena/7e0496dc-deadbeat-disconew` (activa, `active`) · **Base:** `main` @ `2d1f6e838005e879f05e2cadcc9ba7d3d42a4439` · **HEAD:** `2d1f6e8` «menuycinematcicanuevosytydefeinitivos» (2026-11-13)
**Alcance de este documento:** auditoría completa previa a construir. Nada del juego se ha modificado todavía.

---

## 0. Método y fuentes verificadas

Lectura directa del repositorio (no de informes previos): `git`, `gh pr list`, el árbol completo, los tres HTML grandes, `backups/`, `src/`, `tools/build_active_html.py`, `tools/asset_pipeline.py`, `src/dd_asset_registry.js`, `src/dd_world_renderer.js`, `src/dd_hub_system.js`, `ART_PACK/art_pack.js`, `ART_AUDIT/`, `docs/`, `ART_BIBLE.md`, `CURRENT_STATE.md`, `CHANGELOG.md`, `ASSET_INVENTORY.md`, `ASSET_REPLACEMENT_PLAN.md` y `/tmp/arena-coding-uploads/loreybibilia.txt` + las 12 láminas de referencia adjuntas.

---

## 1. Estado Git y PRs (verificado, no asumido)

| Elemento | Valor verificado |
|---|---|
| Rama de trabajo | `arena/7e0496dc-deadbeat-disconew` — **activa**; árbol limpio; sin cambios sin confirmar; nada que perder |
| `main` / `origin/main` | `2d1f6e8` — sin tocar por esta sesión; **no** se fusionará nada automáticamente |
| Historial visible | 1 commit (`2d1f6e8`) — instantánea del proyecto; no hay rama paralela que conservar dentro de esta |
| PRs abiertos | **#22** «Fase 08 · World Scale & Proportion Rebuild» (OPEN, base `main`), **#30** «integration: consolidar FASE 08, diseño y UI responsive (PR #22–#29)» (OPEN), #21 (OPEN), #18 (OPEN), #23/#24/#25/#26/#27/#28/#29 (DRAFT), #17 (DRAFT) |
| PR #22 / #30 | Tocan escala de mundo/proporciones y UI responsive. **Riesgo de solape con la reconstrucción de arte de escenarios.** No se interfiere con ellos; el trabajo de esta rama se integrará después por orden normal de PR |
| Remoto | `origin` = `https://github.com/SER-RGV/DEADBEAT-DISCOnew.git` (GitHub) |

Regla mantenida: rama específica, commits pequeños, sin merge a `main`.

---

## 2. HAY TRES «JUEGOS» EN EL REPO — cuál es el real

| Artefacto | Tamaño | Qué es | ¿Build activo? |
|---|---|---|---|
| `index.html` ≡ `DEADBEAT_DISCO.html` | 5.585.605 B (md5 idéntico en ambos) | **BUILD ACTIVO.** Se regenera con `tools/build_active_html.py` desde `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` + `src/*.js` + `src/dd_rebuild_ui.css`. Lo reproduce el workflow `.github/workflows/rebuild-active-html.yml` en cada push a `main`/`fix/**`/`arena/**` | **SÍ** |
| `DEADBEAT_DISCO.ART.html` | 13.490.978 B | Artefacto **congelado** (3–9 nov 2026) de la era ART_PACK: motor monolítico + recursos **Base64 embebidos** + `<script src="ART_PACK/art_pack.js">`. Contiene la reconstrucción del HUB de las Tandas 01–09 (`drawHubFloorLayer`, `__DDM_V5_IMG`, `hubPack`, `startCampaignFromHub`, `CAMPAIGN_ROOM`). **No lo genera ningún build ni workflow; no recibe lo nuevo.** | No (legado) |
| `v9_t3_fase1b_cache_probe.html` | 13,4 MB | Build de referencia/sonda congelado del 3-nov. Solo lectura histórica | No |

**Consecuencia crítica:** el trabajo de HUB de noviembre (Tandas 01–09) vive **solo** en `DEADBEAT_DISCO.ART.html` + `ART_PACK/art_pack.js`. En el build activo ese código y esos assets **no existen** (0 coincidencias de `__DDM_V5_IMG`, `drawHubFloorLayer`, `ART_PACK`, `CAMPAIGN_ROOM`, `startCampaignFromHub` en `index.html`). Cualquier reconstrucción honesta debe integrarse en el **build activo** (`src/` + `assets/` + registry), no en el legado.

Infraestructura compartida que sí se conserva y se respeta:
`tools/build_active_html.py` (inyector verificado: asserts de anclajes, SHA estable), `.github/workflows/rebuild-active-html.yml`, `assets/manifest.json`, `docs/ART_REBUILD/MASTER_INVENTORY.json` (345 planificados / 33 tandas × 10).

---

## 3. Motor y renderizado del build activo (verificado con `grep` sobre artefactos reales)

### 3.1 Arquitectura

```
backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html  (motor minificado: física, combate, IA, Director, DJ, floorgen 99 pisos, guardado)
        │  tools/build_active_html.py  (strip Cloudflare + asserts + inyección)
        ▼
index.html / DEADBEAT_DISCO.html
   ├── Script legado (motor)  → mundo Canvas 2D, habitaciones procedurales, definición de círculos
   └── __DD_BRIDGE (inyectado) → desvía los hot-paths de dibujo a los módulos src/
        ├── src/dd_asset_registry.js  → DD_ASSETS: manifiesto autogenerado (tools/asset_pipeline.py), 269 entradas, carga assets/*, ?v=20261112.6, puente a __HD_ASSETS
        ├── src/dd_world_renderer.js  → DD_WORLD: buildHighResRoomCache (suelo por patrón, paredes, glow neón, AO), drawProp/drawDoor/drawDescentPad/drawEnemy/drawBoss/drawProtagonist/proyectiles/partículas
        ├── src/dd_hub_system.js      → DD_HUB: Refugio/HUB jugable (teclado/ratón/gamepad), NPCs, estaciones, pad de descenso, IDLE 07B del protagonista
        ├── src/dd_ui_system.js + dd_rebuild_ui.css → HUD/menús alta resolución
        ├── src/dd_opening.js         → intro en cómic animado (RESTART)
        ├── src/dd_cinematic_camera.js→ cámara cinematográfica
        └── src/dd_boot.js            → arranque
```

### 3.2 Respuestas a las comprobaciones exigidas

- **¿Canvas 2D?** Sí. Todo el mundo se dibuja en `<canvas>` 2D. No hay WebGL ni Pixi.
- **¿Renderizado por capas?** Sí, por cachés y orden de pintado del motor (cubierta `drawImage` por unidad, medida en tandas anteriores); el HUB activo es una escena propia (`DD_HUB.render`) sobre el mismo canvas.
- **¿ART_PACK sigue siendo el sistema de recursos del build activo?** **NO.** `ART_PACK/art_pack.js` (2.211 líneas) solo lo carga `DEADBEAT_DISCO.ART.html`. El mecanismo equivalente **del build activo** es: `tools/asset_pipeline.py` → `src/dd_asset_registry.js` (DD_ASSETS) → `src/dd_world_renderer.js` (DD_WORLD). **Este es el mecanismo de sustitución vigente y el que se reutilizará** (no se duplica ningún sistema de carga).
- **Orden de dibujo / profundidad:** lo dicta el motor (sortY por entidades; el HUB pinta su propio orden). DD_WORLD inserta suelo → AO → paredes/pilares → props → entidades → VFX sin alterar hitboxes.
- **Colisiones / hitboxes / mecánicas / progresión / stats:** viven en el motor legado; **no se tocan**. Ningún asset nuevo condiciona hitboxes.
- **floorgen:** salas procedurales; las láminas de referencia (20 salas por círculo) se adaptan como **kit modular** (suelos/muros/props/puertas/luz), no como 20 imágenes pegadas.

### 3.3 Definición de círculos en el motor (texto HUD real)

`CÍRCULO I · LIMBO` (pisos 1–11) · `CÍRCULO II · LUJURIA` (12–22) · `CÍRCULO III · GULA` · `CÍRCULO IV · AVARICIA` · `CÍRCULO V · IRA` · `CÍRCULO VI · HEREJÍA` · `CÍRCULO VII · VIOLENCIA` · `CÍRCULO VIII · FRAUDE` · `CÍRCULO IX · TRAICIÓN` (pisos 89–99) · más el **NÚCLEO** final (`NUCLEO`, boss `boss_09_nucleofinal`, `Cine` `cine:nucleo`) y un jefe secreto (`boss_10_arquitecto`).

`ART_AUDIT/circle_themes.json` y `CIRCLE_THEMES` coinciden en `limbo/lujuria/gula/avaricia/ira/herejia/violencia/fraude/traicion/nucleo` con numerales I–IX.
`src/dd_world_renderer.js` (CIRCLE_CONFIG, idx 0–9) usa las claves frías `limbo/lust/gula/greed/wrath/pride/violence/envy/ice/core` y los floors/walls registrados.

---

## 4. Inventario de recursos actuales

### 4.1 Registrados y cargados por el build activo (`src/dd_asset_registry.js`, autogenerado)

269 entradas / 345 planificadas (docs/ART_REBUILD/MASTER_INVENTORY.json). Categorías (entradas):

bosses 42 · cinematics 35 · characters 31 · props 30 · enemies 24 · effects 22 · pickups 20 · weapons 16 · ui 15 · **floors 12 · walls 10** · environments 8 · logos 3 · overlays 1.

Comprobación de disco: las 12 `floor_*.png`, las 10 `wall_*.png` y los 30 `assets/props/*.png` existen; todas las rutas referenciadas por `CIRCLE_CONFIG` resuelven.

### 4.2 En disco pero NO registrados (selección verificada)

`assets/characters/protagonist_master/**` (IDLE 07B, usado solo por DD_HUB), `assets/cinematics/**/final/**` (capas BG01–BG06), `assets/fase01/**` (16 archivos de FASE 01), `assets/references/**` (16), `assets/logos/emblem_fox_crown.png` registrado, `assets/fonts/**`. Total imágenes en disco: **448**.

### 4.3 Material fuente de producción (no son del juego, no se cargan)

`ART_ASSETS/` (395 archivos: `tanda_*/`, `hub/tanda_*/`, `bosses/tanda_*/`, `rebuild_masters/R01..R07B/` con `_source/` de alta resolución), `CINEMATIC_ASSETS/`, `artevi2/`, `ART_REFERENCES/` (3 láminas + 16 en assets/references). Se conservan intactos.

### 4.4 Integrados vs provisionales vs duplicados

| Familia | Estado real (build activo) | Provisionalidad |
|---|---|---|
| Suelos (12) | Integrados vía `getFloorPattern`/`buildHighResRoomCache` (512 tileable) | Estilo ilustrado AI, **no** reconstruidos a las láminas nuevas |
| Muros (10) | Integrados (paneles 256×384 + pilares) | Mismo caso |
| Props (30) | Integrados vía `drawProp` (sofa_magenta, dj_booth, candelabra…) | Genéricos; sin sets por círculo salvo el fox neon |
| Puertas/pad (8 environments) | Integrados (`drawDoor`, `drawDescentPad`) | Genéricas |
| Protagonista | 22 sprites `player_*` (diseño anterior) en combate + **IDLE 07B integrado solo en el Refugio**; WALK/SHOOT del diseño maestro **no producidos**; 4F mostró inconsistencia de tatuajes (archivado) | Pendiente de aprobación/animación |
| Enemigos (24) | Registrados (families: magneta/bufe/cajero/pogo/oficiante/matarife/imitador/traidor) | AI, silueta OK, no fidelidad lámina |
| Jefes (42) | 11 jefes × estados idle/attack/hit/death | AI; sin iconografía de láminas |
| HUD/menús | RESTART: HUD alta resolución vía DD_UI; retrato del protagonista pendiente | Provisional |
| Cinemáticas | RESTART: intro cómic (v2 storyboard) integrada; menú «El Centro del Bucle» | Integradas |
| HUB del build activo | Refugio jugable ATT-0 (salón único + pad de descenso), **muy lejos** del HUB panorámico de referencia (portalón LP, 9 accesos, escaleras, balcones, tienda, sala de máquinas, bar infernal, secretos) | Pendiente |
| Legado ART.html | HUB reconstruido T01–09 (60+ assets) | **No está en el build activo** |

### 4.5 Duplicados / huérfanos detectados

- Dos builds grandes con mundos divergentes (`.ART.html` vs `index.html`). Conviven por diseño del workflow, pero los artistas deben saber cuál es la fuente de verdad: **`src/` + `index.html`**.
- `DEADBEAT_DISCO.ART.html` duplica parcialmente `assets/` como Base64 (13 MB); no borrar, solo dejar de contar con él.
- `assets/fase01/` y `assets/references/` no registrados (correcto; son material de referencia).
- `ART_PACK/art_pack.js` y `src/dd_asset_registry.js` son dos sistemas de carga — **no se duplicará un tercero**; se usa el activo.

---

## 5. Registro de DISCREPANCIAS CANÓNICAS (no se resuelven arbitrariamente)

Autoridad (ART_BIBLE §1 + decisiones cerradas del autor): (1) decisiones cerradas del autor > (2) etiquetas de láminas = **codenames cromáticos**, no lore ni progresión > (3) el grafo real del juego manda en geometría/progresión > (4) catálogos de láminas ≠ autorización de producción masiva > (5) texto del HUD no se renombra en fases de arte > (6) nomenclatura inglesa fría del código (`lust/greed/ice…`) es interna y no visible.

| # | Lámina / doc | Etiqueta | Contradicción | Resolución registrada (canónica del proyecto) |
|---|---|---|---|---|
| D1 | Collage «Collage neón de los nueve círculos» | `I·LUJURIA … IX·NÚCLEO` | Referencia numera Núcleo como IX | **Visual only.** En el build activo el TRAÍSCION es el círculo IX y NÚCLEO es el jefe final post-99. Las láminas se leen como lenguaje visual del tramo final |
| D2 | «Mapa neón del Círculo de Fraude» | `CÍRCULO VIII FRAUDE` | Desplazamiento +1 respecto al collage | El collage y la ficha corta concuerdan en **VII·FRAUDE**; la ficha larga dice VIII. El motor dice **VIII · FRAUDE** (pisos 78–88). Se conserva el **motor** (VIII) y se usan ambas fichas como referencia visual intercambiable (mismo círculo) |
| D3 | «Mapa de fraude_ Deadbeat Disco» | `CÍRCULO VII FRAUDE` | Ídem | Ídem D2 |
| D4 | «Mapa infernal_ Círculo IX, Traición» | `CÍRCULO IX TRAICIÓN` | Ídem | Motor y collage: Traición es el último círculo antes del Núcleo. Se describe visualmente como «la última sala»; Núcleo = jefe final |
| D5 | «Guía visual neon» (master pack) | Soberanos: Véspera/Gula/Avaricia/Ira/Herejía/Violencia/Fraude/Traición/Núcleo (Placer/Exceso/Propiedad/Violencia/Fe/Dominio/Engaño/Lealtad/Repetición) | Nombres de soberanos ≠ biblia | **Visual only** para iconografía de jefes; los nombres visibles del HUD no cambian esta fase |
| D6 | `loreybibilia.txt` (fuente narrativa) | Pistas 01–09: Véspera («La Invitación»), Voraz («El Banquete»), Áurea («La Cámara de los Instantes»), Brama («La Amplificación»), El Obispo de la Nota Ausente, El Corazón Encadenado («El Umbral Encadenado»), El Crupier de las Mil Voces («El Salón de las Mil Voces»), Nix («El Andén de la Ausente»), Rey del Compás («El Núcleo») | Nombres temáticos = **propuestas** según el propio documento; los soberanos se conservan | La biblia alinea 1:1 **por posición** con las láminas (01↔I … 09↔Núcleo/Rey del Compás). Se usa como referencia de tono y reglas, no se renombra el HUD |
| D7 | Motor (`backup` HTML) | `CÍRCULO I · LIMBO … CÍRCULO IX · TRAICIÓN`, 99 pisos | Desplazamiento +1 completo vs láminas | **Se conserva** (ART_BIBLE §1.7). Cualquier renombrado requiere tanda narrativa/UI propia con pruebas |
| D8 | `ART_AUDIT/circle_themes.json` vs `CIRCLE_CONFIG` | numerales vs claves frías | Sin contradicción, doble idioma | Claves frías = solo código; numerales = HUD; láminas = paleta/material |
| D9 | «Guía visual neon» Fases de jefe (Véspera 3 fases) | 3 fases por jefe | El motor ya tiene 2–3 fases por boss? (no auditado aquí; ASSET_AUDIT/BOSSES sí) | Sin efecto en assets: las fases de jefe se producen como estados existentes (idle/attack/hit/death + especiales ya auditadas) |
| D10 | Biblia vs láminas Fraude/Traición/IX | Nº de círculos (8 vs 9) | Documentado arriba | Sin resolución arbitraria; queda registrado aquí |

**Decisión operativa:** las láminas aportan **lenguaje visual** (paleta, material, iluminación, densidad, props). Nada de su numeración cambia motor, HUD ni progresión. La tabla de equivalencia visual↔motor queda fijada así para toda la producción:

| Lámina | Paleta dominante | idx `CIRCLE_CONFIG` | Motor HUD | floor | wall | boss (asset) |
|---|---|---|---|---|---|---|
| I · Lujuria | rosa/magenta/rojo `#ff2d95` | 1 | CÍRCULO II · LUJURIA | floor_01 | wall_panel_neon_crown | resident_01_magneta (boss_01) |
| II · Gula | naranja/rojo `#f97316` | 2 | CÍRCULO III · GULA | floor_02 | wall_gula_banquet | resident_02/03_bufe |
| III · Avaricia | oro/bronce `#facc15` | 3 | CÍRCULO IV · AVARICIA | floor_03 | wall_gula_banquet (oro) | resident_04_cajero |
| IV · Ira | rojo/metal `#ef4444` | 4 | CÍRCULO V · IRA | floor_04 | wall_wrath_furnace | resident_05_pogo |
| V · Herejía | violeta/gótico `#a855f7` | 5 | CÍRCULO VI · HEREJÍA | floor_05 | wall_panel_heavy_base | resident_06_oficiante |
| VI · Violencia | verde tóxico `#4ade80` | 6 | CÍRCULO VII · VIOLENCIA | floor_06 | wall_wrath_furnace (tox) | resident_07_matarife |
| VII · Fraude | azul/cian `#22d3ee` | 7 | CÍRCULO VIII · FRAUDE | floor_07 | wall_panel_vip_window | resident_08_imitador |
| VIII · Traición | rojo/negro/hielo `#7dd3fc` | 8 | CÍRCULO IX · TRAICIÓN | floor_08 | wall_ice_glacier | resident_09_traidor |
| IX · Núcleo | blanco/plata/obsidiana `#e2e8f0` | 9 | NÚCLEO (jefe final) | floor_09 | wall_core_monolith | boss_09_nucleofinal |
| Hub / Refugio | magenta+oro+cian | 0 | REFUGIO (DD_HUB) | floor_10_hub_checker | wall_panel_gothic_niche | — |

Referencias obligatorias de dirección artística (adjuntas, en `/tmp/arena-coding-uploads/`): 12 láminas PNG (HUB panorámico, 9 fichas de círculo, collage de 9, guía visual maestra, 2 variantes Fraude) + `loreybibilia.txt`.

---

## 6. Dependencias gráficas ↔ motor/hitboxes/animaciones (mapa corto)

- `DD_WORLD.buildHighResRoomCache(ctx, worldW, worldH, roomRect, circleIdx, roomSeed, clipRoomFn)` dibuja suelo/VIP/AO/paredes/pilares **antes** de entidades. Cambiar `floor_*`/`wall_*` solo afecta a la imagen; la geometría, los límites de sala y colisiones **no** dependen de sprites.
- `drawProp` escala por `prop.br` (radio base) → el arte nuevo debe respetar los anchos equivalentes (~1–2,5× el diámetro de apoyo) para no invadir zonas jugables.
- `drawDoor` / `drawDescentPad` / `drawDescentPad` usan la lógica de `door.kind/open/unlocked` del motor: solo cambia el bitmap, nunca la regla.
- Enemigos/jefes: ancla `bottom-center`, pies en baseline del motor; `enemyGeometry`/`ENEMY_FOOT_K`/`BOSS_FOOT_K` ya calibrados → los sprites nuevos deben entregarse con el mismo baseline (pies en el ~90 % inferior, sin margen muerto).
- Protagonista: en combate usa `player_*` (motor); en Refugio usa IDLE 07B vía DD_HUB. No se toca ninguna hitbox.
- Sonidos/animaciones/director: sin dependencias de imagen.
- Manifiesto: `assets/manifest.json` + `src/dd_asset_registry.js` deben regenerarse con `python3 tools/asset_pipeline.py` tras añadir PNGs (o editar a mano con el mismo esquema + bump `?v=`).

---

## 7. Rendimiento y calidad (estado y reglas)

- Suelos: patrón `repeat` cacheado por `getFloorPattern` (canvas tile 512); AO y glows son gradientes cacheados por sala. Nada nuevo puede crear gradientes/patrones por frame.
- Room cache por sala (`buildHighResRoomCache`): invalida solo al cambiar sala.
- Presupuesto de partículas/luces: mantener los emisores actuales; los nuevos glow assets van en `effects`, no en luces por píxel.
- Memoria: no duplicar atlas existentes; PNG optimizados; WebP solo si el pipeline lo soporta (hoy: PNG).
- **No** se hornean sombras de contacto (las pone el motor); **no** texto incrustado en assets con texto de UI.

---

## 8. Capacidades y límites de ESTA sesión (declarado, no excusado)

- **No hay navegador ni red hacia CDNs de Playwright/Chromium en este entorno** (verificado: `registry.npmjs.org` accesible; `cdn.playwright.dev`/`playwright.azureedge.net` inalcanzables; Playwright no instalado; ningún chromium en el sistema). Por tanto **no puedo ejecutar el juego ni producir capturas reales aquí y ahora**.
- Sí puedo y haré: build reproducible (`tools/build_active_html.py`), `node --check` de JS inyectado, validación JSON/manifiestos/dimensiones/alpha/hash de cada PNG, y QA estática A/B por hashes.
- Las capturas reales y el veredicto «PASS/APROBADO» de integración visual **quedan pendientes de una sesión con navegador** (las tandas anteriores usaron Chromium 131 + playwright-core 1.58.2; los arneses en `tools/qa/*.js` se reutilizan tal cual cuando haya navegador; no se declarará nada APROBADO sin ejecutarlos).

---

## 9. Veredicto y condiciones para construir

1. El build activo es `index.html` (generado) — todo el trabajo nuevo se integra ahí vía `src/` + `assets/` + registry. **`DEADBEAT_DISCO.ART.html` y `ART_PACK/` no se tocan** (solo se consulta el legado como fuente de decisiones y como museo de Tandas).
2. La integración de assets nuevos usa el mecanismo existente (registry → DD_WORLD / DD_HUB / DD_UI). Nada de sistemas paralelos.
3. Las láminas se usan como dirección artística; se reconstruyen componentes modulares; nada de fondos pegados.
4. Numeración: registrada en §5; se conserva la del motor; cero renombrados de HUD en esta fase.
5. Bloqueos externos: PRs #22/#30 (escala de mundo) — si aterrizan antes, las pantallas se recapturan; no condicionan el pipeline de assets.
6. **Próximo entregable:** `01_REPLACEMENT_MATRIX.md` (matriz recurso→recurso) y `02_TECHNICAL_PLAN.md` (plan por fases y riesgos). Después, FASE 1 (contrato de asset) y FASE 2 (HUB).
