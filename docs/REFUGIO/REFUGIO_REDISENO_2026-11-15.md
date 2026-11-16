# DEADBEAT DISCO — REDISEÑO DEL REFUGIO (TR_W15 · 2026-11-15)

**Estado:** entregado y verificado en navegador · `HEAD` en commit de esta tanda · PR #31 sigue BORRADOR (merge solo con visto bueno).
**Alcance:** reconstrucción arquitectónica y funcional del Refugio (único safe hub del juego), conservando identidad visual aprobada, arte existente y sistemas reales. No se inventó ningún sistema nuevo; el sector experimental (D) es decorado temático sin interacción.

---

## 1. Resumen ejecutivo

El Refugio anterior (TR_W14) era «una sala ampliada con muebles recompactados»: una única superficie con props sueltos, sin sectores, sin jerarquía y con la Mesa de progresión como un pedestal aislado en el borde derecho. El rediseño lo reconstruye como un **club-santuario de una sola planta organizado por funciones**, con:

- **7 sectores** diferenciados (E Social ×2, C Armería, A Mando, D Ala Torre, B Salón, F Circulación/salida) con arquitectura pintada en la caché de sala (alfombra, círculo rúnico, scorch, runner de barra, charcos de luz por sector);
- **1 punto de interés central** — la **Mesa Astral** (nuevo asset `prop_astral_table`), que ancla la estación `map` (Torre de los 9 Círculos) y gobierna el eje visual;
- **3 assets nuevos** producidos con el pipeline TR_W (verde chroma #00ff00, despill, pivot bottom-center) y registrados en el sistema de registry (275/275);
- **0 cambios de identidad**: mismo suelo damero (`hub_floor_main`), mismo mezzanine de 9 portales, misma paleta magenta/cian/violeta, mismos sprites aprobables (candelabras, sofás, palms, neón zorro), misma grieta de descenso (TR_W14) y mismas IDs de estaciones y NPCs.

**Verificado en juego real (headless SwiftShader + Chromium):** integridad **275/275**, **0 pageErrors**, **0 console errors**, recorrido completo (spawn → armería → salón → grieta → [E] → cinemática → Círculo I · Vestíbulo) sin roturas.

---

## 2. Auditoría previa (documentada)

Documento completo: `docs/REFUGIO/AUDIT_2026-11-15.md`. Hallazgos del estado anterior:

| # | Hallazgo | Gravedad |
|---|---|---|
| A | Un único vacío: sin sectores ni delimitadores; lectura de «almacén de props» | Alta |
| B | Barra central-izquierda sin asientos ni backbar propio; bartender flotaba tras ella | Media |
| C | Mesa de progresión = pedestal 40px en el borde derecho; peso visual menor que un sofá | Alta |
| D | Armería indistinguible del ocio (vending+arcade juntos); sinRack propio | Alta |
| E | Descanso sin identidad: 2 sofás sin alfombra ni eje de luz propio | Media |
| F | Muro norte/mezzanine sin relación con zonas; muros «mudos» | Media |
| G | Circulación por casualidad; sin pasillo principal legible | Media |
| H | Sin capa arquitectónica intermedia entre «suelo damero» y «props» | Alta |

Dependencias verificadas y congeladas: IDs de estaciones (`descent`/`armory`/`dj`/`map`), IDs de props/NPC/assets usados, cache de sala 2240×1420, `HUB_BOUNDS` 130,145,1560×950, spawn (910,700), `getState()`, `__DD_HUB_REBUILD`.

---

## 3. Qué se hizo (antes → después)

### 3.1 Antes (TR_W14, `13_refugio_w14.png`)
Sala 1560×950: barra arriba-izquierda (estantes+counter), tarima DJ arriba-derecha, salón VIP centrado (sofás enfrentados + bench), armería/arcade izquierda, pedestal-torre derecha, grieta centrada abajo. Sin capa arquitectónica.

### 3.2 Después (TR_W15)
Plano del Refugio rediseñado (coordenadas en world units; sala x 130..1690, y 145..1095):

| Sector | Zona | Contenido y coordenadas |
|---|---|---|
| **E·Social (barra)** | NO (x 230..700, y 240..460) | 3 estanterías-botillero (285/462/640, 268), barra `barcounter` (462,352), cooler neón (648,352), 2 banquetas-neón (368/556, 442); **bartender** detrás de barra (462,300) |
| **E·Social (DJ)** | NE (x 1050..1690, y 240..460) | altavoz (1155,282), subwoofer (1562,288), cabina `djbooth` (1400,300), **DJ Virgilio** detrás (1400,288), 2 palms neón flanqueando (1075/1660, ~348) |
| **C·Armería** | O (x 170..565, y 425..645) | **`prop_weapon_rack` NUEVO** (232,478) contra el muro, estantería-stock (425,452), cofre (285,614), crate (500,622), **armero** (448,520); estación `armory` → **(375,555, r95)** |
| **A·Mando** | Centro (x 700..1130, y 460..720) | **`prop_astral_table` NUEVO** (905,578) con 2 candelabros (742/1070, 500) y círculo rúnico grabado en suelo; estación `map` → **(905,585, r95)** |
| **D·Ala Torre** | E-centro (x 1260..1680, y 430..660) | **`prop_tesla_orb` NUEVO** (1500,468), pedestal reliquia (1355,520), cordón `bollard_pair` (1292,640), planta esquina (1638,648). **Sin interacción** (decorado experimental; la Torre real se gestiona en la Mesa Astral) |
| **B·Salón** | SO (x 180..640, y 730..1010) | 2 sofás enfrentados (300/505, 825), neón-flor centro de mesa (402,842), bench-mesa (402,880), butacas (222/580, 915), candelabro eje (402,748), alfombra violeta de doble ribete neón, plantas (185,985)/(618,985) |
| **E·Ocio** | SE (x 1280..1680, y 740..1010) | 2 arcades (1328/1455, 800/795), vending (1582,795), banquillo (1440,928), planta (1642,988) |
| **F·Salida** | S-centro | **grieta** (910,875, r110) sin cambios; anillo achicharrado pintado en cache; spawn (910,700) |

Circulación natural: entrada/spawn → eje norte al Mando (Mesa Astral) → pasillos a O (armería), NO (barra), NE (DJ), E (Torre), SO (salón), SE (ocio), S (grieta). Ninguna estación quedó bloqueada; ninguna interacción se pierde.

### 3.3 Arquitectura pintada en la caché (una sola vez, `paintRefugeArchitecture`)
1. Charcos de luz por sector (barra ámbar, DJ cian, armería brasa, mando violeta, orbe violeta eléctrico, salón magenta, ocio cian, grieta frío);
2. Runner ámbar frente a la barra (y 388..446);
3. **Alfombra del salón** (x 196..638, y 782..984): relleno violeta radial + doble ribete (magenta 3px + oro 1.5px);
4. **Círculo rúnico de la Mesa Astral**: 3 elipses concéntricas + 8 radios (violeta);
5. **Anillo achicharrado** bajo la grieta (scorch radial, escala y 0.52).

Delimitadores físicos usados (props existentes): cordón de bolardos en el ala Torre, bulbos de plantas en esquinas. **No se levantaron muros**: la línea de visión cenital 2.5D se conserva; los sectores se leen por luz, alfombra y agrupación.

### 3.4 Assets nuevos (3) — pipeline TR_W
| ID | Contenido | Tamaño | Pipeline | Estado |
|---|---|---|---|---|
| `prop_weapon_rack` | Rack gótico de armas con lámparas-brasa y rifles, 3/4 elevado | 288×384 · 14.8 KB | generate → extract_clean_rgba (chroma) → despill → fit bottom-center | registrado TR_W15 · integrado |
| `prop_astral_table` | Mesa Astral: orrería, mapa de constelaciones, velas, brasero violeta | 384×288 · 28.3 KB | ídem | registrado TR_W15 · integrado |
| `prop_tesla_orb` | Orbe Tesla en garra de hierro con caja de control de latón | 256×384 · 18.6 KB | ídem | registrado TR_W15 · integrado |

- Registro: `src/dd_asset_registry.js` (ENTRIES + `byOriginalId` `hub:weapon_rack/astral_table/tesla_orb`, `totalRegistered` 272→275) regenerado con `python3 tools/asset_pipeline.py` (rebuild aditivo: 33 legacy conservadas). `assets/manifest.json` actualizado (sha16: bd74ce27… / 35fa9372… / 6a5e4bff…).
- Glow por asset en `drawProp`: arma/rack → brasa `#fb7185`; mesa → violeta `#a855f7`; orbe → violeta `#8b5cf6`.
- `PROP_KIND_TO_ASSET`: `weaponrack`, `astraltable`, `teslaorb`, `neonflower`, `bollards`/`ropebarrier` (+alias).

### 3.5 Integración y sistemas conservados
- **Estaciones (IDs intactos)**: `descent` (910,875 · r110) — sin tocar; `armory` → (375,555 · r95); `dj` → (1400,305 · r105); `map` → (905,585 · r95) — ahora sobre la Mesa Astral (antes pedestal suelto).
- **NPCs**: bartender (462,300, espalda a estanterías), DJ Virgilio (1400,288, tras cabina), armero (448,520 — separado del punto de interacción).
- **Spawn (910,700)** y `HUB_BOUNDS` sin cambios ⇒ cámara (`zoom = clamp(min(viewW/1150, viewH/780), 1.02, 1.6)` + clamp a bounds) sigue encuadrando bien; verificado visual en 1280×900 y 1920×1080.
- **Colisiones**: círculos `br` de cada prop empujados por `update()`; verificado jugando (armería y salón alcanzables; grieta alcanzable y con near=descent). Sin solapes props↔interactables: el arco Mesa Astral (r_col≈74) deja la estación `map` accesible; la Mesa es el interactable.
- **`getState()`** y todo el contrato con `__DD_BRIDGE`/`DD_UI` intactos; HUD, diálogos y prompts sin cambios (los textos mencionan Armería/Torre/grieta, siguen siendo ciertos).
- **Hook QA** `window.__DD_HUB_DEBUG_ZOOM` (0.585 centra y aleja la cámara para capturas de vista completa): inactivo por defecto; uso exclusivo de QA.
- Regresión cero en `qa_flow.mjs` (275/275, 0 errores).

---

## 4. Validación en navegador (in-situ, 2026-11-15/16)

Capturas en `ART_EVIDENCE/TOTAL_REBUILD/` (SwiftShader; el juego real, no simulación):
- `15_refugio_full_w15.png` — **vista completa** del Refugio rediseñado (todos los sectores legibles).
- `16_refugio_full_1920_w15.png` — vista completa 1920×1080.
- `17_refugio_spawn_w15.png` — gameplay desde spawn: protagonista (IDLE 07B) frente a Mesa Astral y grieta al fondo.
- `18_armeria_w15.png` — junto a la estación: prompt «Pulsa [E] / (A) para abrir Armería (120 Armas)», `near=armory`.
- `19_salon_w15.png` — salón con alfombra, sofás enfrentados y candelabros.
- `20_dj_torre_w15.png` — DJ Virgilio tras la cabina + orbe Tesla + pedestal + cordón (ala Torre).
- `21_ocio_w15.png` — arcades + vending + grieta al fondo.
- `22_grieta_w15.png` — jugador sobre la grieta; prompt «Pulsa [E] / (A) para lanzarte por la grieta · Círculo I · Lujuria», `near=descent`.
- Descenso completo: E → cinemática «descenso al círculo» → Vestíbulo Limbo (`inGame:true`); **0 pageErrors**.
- `03_refugio_hub.png`, `02_menu.png`, `qa_run_report.json` — regenerados por el propio harness (estado actual).
- Antes/después: comparar `13_refugio_w14.png` (antes) con `15_refugio_full_w15.png` (después).
- `qa_flow.mjs` → `integrity {"pass":true, ok:275, checked:275, errors:0}`; `stats {275/275, errors:0}`.

---

## 5. Archivos modificados / nuevos

**Código / build (integrar):**
- `src/dd_hub_system.js` — layout rediseñado (props/estaciones/NPCs/fox mural), `paintRefugeArchitecture()` + `hexA()`, hook `__DD_HUB_DEBUG_ZOOM`, y-sort NPCs.
- `src/dd_world_renderer.js` — `PROP_KIND_TO_ASSET` (weaponrack/astraltable/teslaorb/neonflower/bollards/ropebarrier), glow por asset en `drawProp`.
- `src/dd_asset_registry.js` — 3 entradas nuevas TR_W15 (275 en total).
- `index.html`, `DEADBEAT_DISCO.html` — bundles reconstruidos (`tools/build_active_html.py`).
- `assets/props/prop_weapon_rack.png`, `prop_astral_table.png`, `prop_tesla_orb.png` — **nuevos**.
- `assets/manifest.json` — reescrito por el pipeline (275).
- `ART_TOOLS/prepare_tr_w2_hub_props.py` — jobs + despill TR_W15.

**Docs / QA (sin código):**
- `docs/REFUGIO/AUDIT_2026-11-15.md` (nuevo), `docs/REFUGIO/REFUGIO_REDISENO_2026-11-15.md` (este informe).
- `docs/TOTAL_ART_REBUILD/01_REPLACEMENT_MATRIX.md` (3 filas TR_W15, Apéndice C).
- `ART_EVIDENCE/TOTAL_REBUILD/README.md`, `CURRENT_STATE.md` (secciones TR_W15).
- `ART_EVIDENCE/TOTAL_REBUILD/{15..22}_*_w15.png` (8 capturas nuevas) + `02_menu/03_refugio_hub/04_refugio_walk` y `qa_run_report.json` regenerados por el harness.

---

## 6. Pendientes y límites honestos

1. **Rendimiento headless**: SwiftShader corre ~8 fps (CPU); las capturas tardan y el screenshot necesita reintentos ocasionales (hay reintentos en el harness). En Chrome con GPU esto no aplica; no se ha hecho benchmark formal.
2. **Brillo en caché**: los charcos de luz por sector son estáticos (van en la cache de sala, 0 coste/frame); el glow dinámico queda reservado a grieta, estaciones y props firma.
3. **D (Ala Torre) es decorado**, sin estación propia: la progresión real sigue en la Mesa Astral (`map`). No se inventó interacción «de laboratorio» para no falsear sistemas.
4. **`prop_astral_table` sustituye la identidad visual del pedestal como señal de la estación `map`**, pero `prop_arcane_pedestal` se conserva (ala Torre) — nada se pierde.
5. **El zorro neón** pasó al muro E sobre el ala Torre (antes, NE sobre el DJ) para no tapar la cabina de Virgilio; sigue siendo el cartel del Refugio.
6. **Fuentes/HUD** sin cambios (decisión de identidad). Sin tests automatizados de gameplay (fuera de alcance del rediseño); la validación es QA navegador + E2E de descenso.
7. **Merge PR #31**: no realizado — pendiente de visto bueno del responsable (rama sigue en borrador).

## 7. Reproducir QA
```
python3 -m http.server 8123 --bind 0.0.0.0   # raíz del repo
node /tmp/qa_browser/qa_flow.mjs             # 275/275 esperado
node /tmp/qa_browser/probe_hub_w15c.mjs      # capturas spawn/armería/salón/grieta
node /tmp/qa_browser/probe_hub_w15d.mjs      # DJ/Torre + ocio + E2E descenso
```
(Los `probe_*.mjs` son harness de sesión en /tmp, no del repo; el flujo de descenso ya lo cubre `/tmp/qa_browser/qa_descent.mjs`/W14.)

---

## 8. TR_W15b · «refugio entre runs» + pase de coherencia de escala de assets (2026-11-15)

Encargo: quick wins 1–4 (música, NPCs con diálogo, TEMPO aleatorio, ambiente) **y** el apunte del usuario de que, aunque el resultado mejora, seguía habiendo fallos de distribución de tamaños de assets. Esto los trata y los deja por escrito.

### 8.1 Música del refugio
- Al `enter()` se agenda (+900 ms) `DD_BOOT.audio.startMenuMusic(2.0)` — la pista del club en fundido de entrada; el retardo evita la carrera con `DD_BOOT.enterGame()`, que corta la música del menú tras aceptar el arranque.
- Al `exitToRun()` (descenso/[H]) se ejecuta `stopMenuMusic(0.4)`.
- Verificado en navegador: `DDC_COVER.music.playing === true` dentro del Refugio; al descender no queda la cama sonando (entra el silencio/motor de combate).
- Honestidad: la pista es la del menú (id 4) — es la identidad musical real del juego; no es un tema nuevo de refugio (para eso, ver §6.7).

### 8.2 NPCs con voz (estaciones `bar` y `armorer`)
- `STATIONS` ampliado: `bar` (462,404 · r80) y `armorer` (505,470 · r70); anillos propios en el suelo, IDs existentes intactas, nearest-wins sin solapes efectivos.
- `showDialogue("TEMPO", línea, 5.6)` — **TEMPO narra el intercambio** porque el registry solo tiene UN retrato (`dialogue_portrait_dj`) y esta tanda no toca el registry. Las 8 líneas (4 barra + 4 armero) llevan tips reales: Armería, Torre, Limbo, M1911, combo/RAVE, Cajero.
- TEMPO ahora abre con una cita **aleatoria** al entrar (antes siempre la misma — el Refugio nunca sonaba igual, y ahora tampoco se lee igual).

### 8.3 Ambiente vivo
- Parpadeo en candelabros (doble seno sobre alpha del glow), pulso del orbe Tesla, palms/fox con leve respiración.
- **26 brasas** (rosa/cian/ámbar, aditivas) ascendiendo de la grieta con balanceo senoidal y reaparición; **34 motas** de polvo en 4 charcos (barra, Mesa Astral, salón, escenario). Procedural puro: 0 assets, 0 registry.

### 8.4 Pase de coherencia de escala (`dw`)
`drawProp` acepta `prop.dw` (ancho en world units). Referencia de escala: protagonista ~112 px de alto. Aplicado a las 37 piezas:

| Pieza | Antes (heurística br) | Ahora (dw) | Motivo |
|---|---|---|---|
| `weaponrack` | 158 | 240→228 | pieza-héroe; estaba desproporcionada |
| `astraltable` | 199 | 235 | rey del centro; más presencia |
| `teslaorb` | 143 | 150 | legible junto al zorro y el pedestal |
| `barcounter` | 163 | 262 | barra real (longitud de barra) |
| `shelf`×3 | 112 | 172 | backbar denso pero coherente |
| `sofa`×2 | 122 | 205 | sofá ≥ butaca × ~1.65 |
| `armchair`×2 | 82 | 124 | proporción vs sofá restaurada |
| `bench` salón/ocio | 77/77 | 128/132 | banquetas legibles |
| `neonflower` | 64 | 78 | centro de mesa; **movida sobre el banco** (antes flotaba) |
| `candelabra`×3 | 64 | 92/96 | altura de araña de pie |
| `djbooth` / `speaker` / `subwoofer` | 148/92/97 | 196/96/110 | escenario equilibrado |
| `vending` / `arcade`×2 | 97 | 150 | ocio con masa |
| resto | — | tabla en `HUB_PROPS` | — |

**Arreglos de límites de sala**: weapon rack 248 (dentro del muro W, antes 232 con vertice fuera), palma E 1612 (dentro del muro E, antes 1660 recortada).

### 8.5 Fallos conocidos que PERMANECEN (documentados, no escondidos)
1. Un solo retrato de diálogo: bartender/armero «hablan» con la voz de TEMPO (decisión de esta tanda: sin registry). Para retratos propios haría falta una tanda de assets.
2. Backbar denso contra el muro N: tres estanterías de 172 px compiten con los portales del mezzanine; es lectura "bar-core" deliberada pero puede pedirse más aire (bajar a 2 estanterías o dw 150).
3. El mezzanine sigue parcialmente bajo el HUD superior (260 px de viewport ocupados por HUD a 1280×900) — diseño preexistente.
4. Charcos de luz estáticos en caché (cero coste/frame); el parpadeo dinámico solo afecta a glows.
5. La grieta es un calado cenital con brasas; no es un pozo 3D (coherente con la convención de suelo; ya señalado en TR_W14).
6. Los bevel/diagonales del damero se leen fuertes a cierto zoom (identidad existente, no tocados).
7. Headless SwiftShader ~8 fps — solo afecta al harness de QA; en Chrome/GPU no aplica.
8. Sin tests de gameplay automatizados; validación = QA navegador + E2E de descenso (275/275, 0 pageErrors verificado tras esta tanda).

### 8.6 Capturas de esta tanda
`23_refugio_full_w15b.png` (vista completa, TEMPO aleatorio visible) · `24_spawn_w15b.png` · `25_barra_w15b.png` (near=bar) · `26_bartender_dialogo_w15b.png` (diálogo TEMPO) · `27_armero_w15b.png` (near=armorer) · `27_armero_dialogo_w15b.png` (diálogo armero) · `28_grieta_brasas_w15b.png` (brasas, near=descent).

---

## 9. TR_W16 · cierre de los «fallos conocidos» del Refugio (2026-11-15)

Encargo del usuario: «arreglar lo arreglable ahora» sobre la lista de §8.5.

### 9.1 Retratos propios para bartender y armera (RESUELTO)
- Dos assets NUEVOS generados e integrados en el pipeline: `dialogue_portrait_bartender.png` y `dialogue_portrait_armorer.png` (512×512, fondo negro, rim-light neón magenta/cian, estilo cómic cel-shaded idéntico al de DJ Virgilio; derivados de los sprites de mundo `npc_bartender_hub`/`npc_armorer_hub`).
- Pipeline respetado: alta en `docs/ART_REBUILD/MASTER_INVENTORY.json` como tanda **TR_T02** (índices 348–349, `total_assets` 347→349) y `tools/asset_pipeline.py` (rebuild aditivo) → **registro 275 → 277 entradas, `legacy_kept` intactas**. `assets/manifest.json` regenerado. No se editó el registro a mano.
- `showDialogue(speaker, text, durationSec, portraitId?)`: nuevo 4.º parámetro opcional; sin él, retrato TEMPO (compat total). Altavoz propio: **EL BARTENDER** / **LA ARMERA** con sus retratos; líneas reescritas en primera persona (antes TEMPO narraba).
- Verificado en navegador: capturas `30_bartender_trato_w16.png` y `31_armera_trato_w16.png`; integrity **277/277**, 0 pageErrors.

### 9.2 Backbar denso contra el muro norte (RESUELTO)
- Las 3 estanterías pasan de dw 172 a **150** y se separan: x 285/462/640 → **268/459/650** (hueco ~40 px entre piezas; conviven con los portales del mezzanine sin agotar el muro).

### 9.3 Charcos de luz estáticos (RESUELTO)
- Los 8 charcos ya no se hornean en la caché: se dibujan por frame con respiración sinusoidal lenta e independiente por sector (±18 % de alpha, fases y velocidades propias; el del Tesla late más rápido que el mando). Coste: 8 gradientes radiales por frame.
- `paintRefugeArchitecture()` conserva el resto (alfombra, círculo rúnico, anillo de la grieta, runner ámbar).

### 9.4 Mezzanine parcialmente bajo el HUD (PARCIAL · documentado)
- Banda de arcos bajada yrecortada: `y 188→206`, `h 132→118`. En viewport 1280×900 los arcos quedan por debajo del HUD en la mayoría de ángulos de cámara; el solape residual solo ocurre cuando el jugador se pega al muro norte (cámara al tope) y es inherente al render full-bleed bajo un HUD fijo de ~145 px. La corrección completa exigiría rediseño del HUD o re-layout del mundo (fuera del alcance de esta tanda).

### 9.5 Persisten (documentados, no escondidos)
1. La grieta sigue siendo calado cenital con brasas (no pozo 3D); coherente con la convención de suelo del Refugio. Convertirlo en pozo exigiría geometría/arte nuevos.
2. SwiftShader headless ~8 fps en el harness de QA; en Chrome/GPU no aplica.
3. Sin tests de gameplay automatizados; validación = integrity + E2E navegador (277/277, descenso intacto).
4. Sprites de mundo del bartender/armera siguen siendo los mismos; solo se añadieron retratos de diálogo.

### 9.6 Capturas de esta tanda
`29_refugio_full_w16.png` (vista completa con luz viva y backbar aireado) · `30_bartender_trato_w16.png` (retrato + EL BARTENDER) · `31_armera_trato_w16.png` (retrato + LA ARMERA). QA completo: integrity **277/277**, 0 pageErrors, 0 console errors.

---

## 10. TR_W17 · pase de distribución y orientación (2026-11-15)

Encargo del usuario: «ahora son más grandes, pero siguen estando tirados en cualquier lugar; las barras no están orientadas con respecto a las paredes, etc.». Redistribución completa anclada a muros y a ejes, conservando identidad y assets:

**Principios aplicados**
1. Todo lo destinado a "almacenado/servicio" apoya en el muro norte (línea y≈315-320, bajo los portales) o en el muro oeste (x≈205-235).
2. Simetría en lo social: salón centrado sobre la alfombra (sofás 300/505, butacas flanqueando en 205/600, candelabro en la cabecera del rug, flor sobre el banco).
3. Fila de ocio alineada en el rincón SE sobre la misma línea de apoyo (y≈830-838).
4. Escenario DJ: subwoofer/cabina/altavoz sobre la línea del muro (y≈315-318).
5. Corridor SO→SE→grieta despejado (el harness de paseo antes se atascaba en la armería; ahora llega a (887,754) sin intervención).

**Cambios de layout (world units)**
- Barra: backbar x 235/390/545 y=316 (fuera de la banda de portales, que empieza en x≈616); mostrador centrado x=400 (dw 250); nevera al extremo SE del mostrador (620,432); taburetes en 340/480 y=452; bartender tras el mostrador (400,340); runner ámbar y alfombra coherente; estación `bar` en (400,415).
- Armería: rack contra muro oeste (235,565), estantería bajo el rack (232,690), cofre (430,622) y caja de munición (520,628) a los pies del rack, armera ante él (378,600); anillo de tienda `armory` en (240,615) r75, anillo de armera (378,585) r70 — sin solapes (nearest-wins). La estación de la armera se reetiqueta «la armera».
- Escenario: speaker (1185,318), cabina (1400,315), subwoofer (1572,318), DJ detrás (y=305), palmeras enmarcando (1100/1638,372).
- Centro: Mesa Astral y candelabros intactos (eje visual); charcos de luz y motas siguen el nuevo layout (barra 400,345 · armería 240,640).
- Salón: sofás y=865, butacas (205/600,858), banco (402,912) con la neon-flower encima (878), candelabro en cabecera del rug (402,778), alfombra ensanchada a 470 px.
- Ocio: arcades (1305/1435,838) + vending (1605,830) alineados; banco (1458,935).

**Verificado en navegador**: integrity 277/277, 0 pageErrors, 0 console errors; descenso intacto; prompts «hablar con la armera» y estaciones correctos; capturas `32_refugio_distribucion_w17.png` (vista completa), `33_barra_w17.png`, `34_armeria_w17.png`, `35_centro_w17.png`.

**Nota honesta**: los portales del mezzanine siguen parcialmente tras el backbar en el borde x≈545-616; el corte visual final exige o bien mover la banda de portales (decisión de arte gordo) o aceptar el solape como "mobiliario delante del portal", habitual en escenografía de club. HUD fijo + full-bleed persisten (ver §9.4).

---

## 11. TR_W18 · escala del protagonista y limpieza de decorado (2026-11-15)

Feedback del usuario: «el personaje debería ser un poco más grande para estar en escala con la mesa central y la habitación está sobrecargada de elementos decorativos inútiles».

**Escala**
- REFUGE_IDLE.drawH 112 → **134** (+20 %; referencia protagonista ~134 px; la Mesa Astral, 235 de ancho, vuelve a dominar como pieza central).
- NPCs del Refugio en consonancia: DJ 118→132, bartender 102→116, armera 104→118.
- Collision radii sin cambios (el tamaño lógico y el gameplay no se tocan).

**Limpieza de decorado** (se retiran 5 piezas que no aportaban lectura ni función)
- Bolardos del ala Tesla (interrumpían el ala sin delimitar nada).
- Plantas sueltas (ala Tesla · rincón de ocio) — saturaban las esquinas.
- Palma solitaria del borde sur (618,1010) — leía como pieza perdida.
- Candelabro extra de cabecera del rug — el salón ya habla con sofás/butacas/banco/flor.
- Motas de polvo 34→24 en los charcos de luz.

Verificado: integrity **277/277**, 0 pageErrors, 0 console errors; paseos intactos (grieta alcanzable); capturas `32..35_*_w17.png` regeneradas con este build.
