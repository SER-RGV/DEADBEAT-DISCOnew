# DEADBEAT DISCO — AUDITORÍA VISUAL COMPLETA DEL HUB · TANDA 02

- **Fecha:** 2026-11-03.
- **Build:** `DEADBEAT_DISCO.ART.html` servida en `http://127.0.0.1:8123/` (raíz del preview).
- **Método:** `ART_TOOLS/qa/hub_tanda_02_audit.js` con Chromium 131 + Playwright 1.58.2, 1280×900. Se proxya `__DDM_V5_IMG`, se envuelve `__DDM_GET_V5` y `drawImage` **sin modificar el juego**. Se entra al HUB por el flujo real (clic → Enter → Escape) y se recorren **10 zonas** con `DMO.debug.teleport()`: centro, DJ, barra, VIP oeste/este, descenso, oeste, este, norte y sur. El conteo de dibujos se reinicia **ya dentro del HUB** para excluir menú y cinemática.
- **Resultado bruto:** 118 claves V5 registradas, **21 slots dibujados por fotograma en el HUB**, 8 de ellos ya sustituidos por la TANDA 01. `DMO_HUB.audit()`: `ok=true`, `location=HUB`, 6 zonas, 11 estaciones. 0 `pageerror`; 2 404 de Cloudflare (`cdn-cgi/...`) preexistentes.
- **Evidencias:** `ART_EVIDENCE/hub/tanda_02/audit_runtime.json` (por slot: draws, dimensiones naturales, caja, zona, args, etiqueta) y `audit_<zona>.png` (10 capturas reales). Inventario máquina: `ART_AUDIT/hub_tanda_02_needs_inventory.json`.

> **Nota sobre la clasificación:** el pliego enumera siete puntos, pero el séptimo es el apartado «DIRECCIÓN ARTÍSTICA», no un estado. Se usan por tanto las **6 clases** 1–6. «INTERACTIVO» es una clase superimpuesta: un elemento puede ser `1` y `5` a la vez.

---

## 1. Lectura del escenario

El HUB ya no es el club gótico original: la TANDA 01 impuso una familia **art-déco nocturna** (abanicos dorados, latón, magenta/cian, terciopelo granate, negro profundo) en suelo, medallón, cabina, barra, columnas, sofás, lámpara, grieta de descenso y tablón. La comparación `control_01_hub.png` ↔ `despues_01_hub.png` (60,17 % de píxeles cambiados) confirma el cambio.

**Lo que sigue sin resolver:** la segunda capa de objetos. Los 13 props que el pintor dibuja cada fotograma y que **no** son de la TANDA 01 conservan el lenguaje anterior (gótico/industrial, líneas finas, poca masa, glow procedural). Conviven con el art-déco nuevo y son el foco real de la TANDA 02. Además hay paredes y techos cuyos apliques se pintan en **lienzos cacheados al arrancar**, consultados cientos de veces por el HUB (`__DDM_GET_V5`): `wall_ceiling_neon_fixture` (fn=168) y `club_wall_sconce_side` (fn=228).

**Zonas vacías / pobres:** los grandes paños de suelo entre el medallón y el perímetro (O/E/S), el corredor norte junto a la cabina y el borde sur tras la grieta. **No se rellenan con assets decorativos sin función**: se documentan como `INCOMPLETO` y se proponen para la TANDA 03.

**Elementos repetidos:** `club_neon_planter_prop` se dibuja 1.708 veces en el barrido (4 jardineras fijas en `hubDecor`, multiplicadas por fotogramas); `limbo_bench_prop` 868 (bancos gemelos); `descent_abyssal_lift_pad` 440. Repetición estricta sin variantes → empobrecimiento visual.

**Animaciones:** el motor ya anima bailarines (`hub_clubber_dancer_a/b`, `hub_cliente000_npc`), parpadeo de neón y halo de la lámpara con `Wb()`. No se ha detectado un sistema de animación por sprite para el mobiliario. Cualquier animación nueva sería **funcionalidad nueva** y queda como propuesta documentada, sin implementar (apartado 7 del pliego).

---

## 2. Inventario de necesidades (clases 1–6)

| Elemento / slot | Dimensión real del slot | Clase | Función y ubicación | Decisión |
|---|---|---|---|---|
| `t3b_material_01` (HUB-01) | 512×512 RGB | 1 | Suelo central, patrón `repeat` | Conservar |
| `hub_pista_medallion` (HUB-02) | 760×430 | 1 | Alfombra/medallón central | Conservar |
| `wall_stained_glass_arch` (HUB-03) | 120×176 | **6** | Panel modular de muro; pintado en caché al arrancar y en salas de campaña | Conservar; investigar desviación (§4) |
| `hub_dj_shrine` (HUB-04) | 720×392 | 1 + **5** | Cabina DJ (1250,445), estación B | Conservar |
| `hub_bar_shrine` (HUB-05) | 380×313 | 1 + **5** | Barra «El Último Trago» (1910,845), estación E | Conservar |
| `club_speaker_tower_prop` (HUB-06) | 76×148 | 1 | Columnas acústicas | Conservar |
| `hub_vip_booth_nw/ne` (HUB-07) | 224×172 ×2 | 1 | Alcobas VIP (785/1715,545) | Conservar |
| `hub_disco_chandelier` (HUB-08) | 67×152 | 1 | Lámpara colgante (1250,615) | Conservar |
| `hub_abyss_stair_crack` (HUB-09) | 320×175 | 1 + **5** | Grieta de descenso (sur) | Conservar |
| `hub_trophy_board_prop` (HUB-10) | 167×136 | 1 | Tablón narrativo junto al escenario | Conservar |
| `hub_fox_crest_emblem` | 560×332 | 1 | Escudo del zorro; **compartido** con portada/HUD/victoria y caché del medallón | Conservar (asset de la TANDA 01) |
| `wall_neon_club_crest` | 84×84 | 1 | Crest de pared; ya servido por `wall_neon_detail.png` (arquitectura TANDA 02, A10) | Conservar |
| `decor_neon_rug/painting/railing/palm` | 456×243 / 176×106 / 148×102 / 209×147 | 1 | Decoración de la TANDA 01 en caché de suelo | Conservar |
| `hub_clubber_dancer_a/b`, `hub_cliente000_npc` | 109×232 / 131×232 / 96×232 | 1 + **6** | Personajes animados; sistema vivo | No sustituir |
| `hub_arcade_shrine` | **264×239** | **2 + 5** | Rincón Arcade, zona F1 (655,1210), estación F | **SELECCIONADO T02-01** |
| `hub_arsenal_shrine` | **360×253** | **2 + 5** | Arsenal de Caronte, zona D (590,845), estación D | **SELECCIONADO T02-02** |
| `hub_seals_shrine` | **244×237** | **2 + 5** | Espejo de los Sellos, zona F2 (1845,1210), estación F | **SELECCIONADO T02-03** |
| `club_vending_machine_prop` | **100×152** | **2** | Máquina expendedora este (2048,692) y decor genérico de salas | **SELECCIONADO T02-04** |
| `club_water_cooler_prop` | **61×136** | **2** | Dispensador oeste (452,692) y decor de aristas | **SELECCIONADO T02-05** |
| `limbo_bench_prop` | **256×198** | **2** | Bancos gemelos junto al descenso (1037,1178) | **SELECCIONADO T02-06** |
| `club_neon_planter_prop` | **96×108** | **2** | 4 jardineras fijas (1005/1495 × 702/1178) y aristas de sala | **SELECCIONADO T02-07 (variante)** |
| `descent_abyssal_lift_pad` | **198×104** | **2 + 5** | Plataforma de descenso, dibujada también en puertas de sala | **SELECCIONADO T02-08** |
| `wall_ceiling_neon_fixture` | **148×38** | **2** | Luminaria horizontal de techo/muro, caché de pared | **SELECCIONADO T02-09** |
| `club_wall_sconce_side` | **48×60** | **2** | Aplique lateral de pared, caché de aristas | **SELECCIONADO T02-10** |
| `hub_vip_booth_lounge` | — | **4** | Clave **consultada** por el pintor de banner y ausente del registro; no se dibuja en el HUB | No activar: sería inventar funcionalidad |
| `club_roadcase_crate_prop`, `club_wall_sconce_torch`, `prop_bench_vertical`, `prop_table_vertical`, `hub_hell_elevator` | 128×86 / 56×92 / 58×168 / 77×172 / 264×313 | **4** | Registrados pero **0 dibujos en el HUB** en las 10 zonas | No activar sin pintor que los consuma |
| Paños de suelo perimetrales O/E/S y corredor norte | — | **3** | Superficie sin identidad propia entre props | **No rellenar**; propuesta TANDA 03 |
| Animación de mobiliario / señalética dinámica | — | **6** | No existe sistema de frames para props | Propuesta documentada, sin implementar |
| `limbo_floor_medallion`, `limbo_gate_stage`, `wall_limbo_ticket_window` | 680×392 / 720×368 / 144×144 | **6** | Dibujados una sola vez al arrancar en cachés; pertenencia al HUB no confirmada | No tocar |

**Criterio de selección:** los diez elegidos son los únicos slots que (a) se dibujan o se consultan intensivamente en el HUB, (b) conservan arte legacy incompatible con la familia art-déco y (c) no son personajes, ni assets ya correctos de la TANDA 01 / arquitectura anterior. Las dimensiones de la tabla son las **naturales del recurso que el motor sirve hoy** (`audit_runtime.json → registrySizes`), no estimaciones.

---

## 3. Sistemas compartidos: justificación

`club_vending_machine_prop`, `club_water_cooler_prop`, `club_neon_planter_prop`, `descent_abyssal_lift_pad`, `wall_ceiling_neon_fixture` y `club_wall_sconce_side` los consume también el pintor de aristas/puertas de las **salas de campaña**. Se sustituyen porque:

1. Son **slots de arte V5**, no sistemas: el cambio es únicamente el `Image` registrado en `window.__DDM_V5_IMG[slot]`; no se toca geometría, colisionadores, `sortY`, estaciones, puertas, música ni HUD.
2. Se conservan **dimensiones exactas, canal alfa y pivote**, por lo que todas las cajas `drawImage` del motor siguen siendo válidas.
3. Es coherente con el objetivo «todo el escenario con un mismo lenguaje»: dejar la mitad de los props en estilo antiguo rompería la unidad visual.
4. La validación incluye **regresión explícita en sala de campaña real** (`r23`, puertas y disparo) para demostrar que solo cambia la ilustración.

La caché de lienzos de pared/suelo se invalida con la API existente `DMO_INFERNAL_ART.invalidate()` (la misma que usa `__T3B.setEnabled` y que ya empleó la TANDA 01), sin añadir motores ni lienzos.

---

## 4. Incidencias de la TANDA 01: investigación

| Incidencia | Investigación | Impacto en TANDA 02 | Acción |
|---|---|---|---|
| HUB-01 `loaderResolves=0` | HUB-01 entra por `__T3B_IMAGES[1]` → `createPattern`, **no** por `__DDM_GET_V5`. El contador es específico del loader V5, por tanto 0 es el valor correcto; se verificó con `patterns=2` y `hubFloor.draws`. | Ninguno: los 10 slots de la TANDA 02 son V5 puros y sí resuelven por `__DDM_GET_V5`. | **No corregir a ciegas.** Se mantiene el doble criterio de medición (V5 + patrón T3B) en la QA. |
| HUB-03 desviación 26,92 % | El pintor de muros dibuja el módulo 120×176 en una caja 135×156; es una transformación **preexistente de la arquitectura TANDA 02**, no del PNG. El asset se preparó con `contain` y no está deformado. | Ninguno: la TANDA 02 no usa `wall_stained_glass_arch`. Sí se midió la desviación de cada caja nueva (§ validación) para detectar si el pintor estira otros slots. | **No modificar el motor.** Documentar como limitación conocida. |
| Costura del tile 12,57 | Diferencia media de borde tras la corrección `half-tile offset`; no es una costura perfecta pero no produce bandas visibles en el HUB. | Ninguno: la TANDA 02 no genera tiles ni patrones `repeat`. | Mantener; no tocar el tile. |
| 2 × 404 Cloudflare | `cdn-cgi/challenge-platform/scripts/jsd/main.js` solicitado por la build; sin `pageerror`, sin 404 locales, ya presente en el estado ANTES. | Ninguno, pero condiciona la comprobación 3: se excluyen explícitamente y se cuentan por separado. | **No eliminar scripts** de la build. |

---

## 5. Propuestas NO implementadas (requieren autorización)

- Animación por frames de las máquinas recreativas y de la expendedora (parpadeo de pantalla).
- Señalética dinámica que muestre el círculo activo.
- Nuevas interacciones en bancos/jardineras.

Se documentan como `PENDIENTE DE VALIDACIÓN` / `INCOMPLETO` y **no se implementan**: el pliego prohíbe inventar funcionalidades y modificar sistemas compartidos sin autorización.

---

## 6. Dirección artística aplicable a la TANDA 02

Isométrica 2D/2.5D, ilustración estilizada de alta calidad, volúmenes y materiales reconocibles (latón, terciopelo, cristal, esmalte, mármol oscuro). Base **negro profundo**; acentos **rosa eléctrico, cian, violeta y amarillo ácido** sobre la paleta oro/magenta/cian ya asentada. Contrastes fuertes, iluminación ambiental coherente con las fuentes del HUB (lámpara central, neones de pared), siluetas limpias y humor negro. Sin pixel art, sin plantillas genéricas, sin sombras de fondo horneadas. Los diez recursos se generan como una sola familia con la misma línea, grosor de trazo, biselado y nivel de detalle que la TANDA 01.

---

## 7. Cierre: integración y QA (añadido al completar la tanda)

La auditoría de los apartados 1–6 se ejecutó **antes** de generar ningún recurso; de ella salieron los 10 slots de la tabla. Cierre real:

- **Integración:** `ART_PACK/art_pack.js` (único archivo de código modificado), bloque `HUB2_*` independiente de T01, mismo registro `__DDM_V5_IMG` y mismo `load()`. `hub2Invalidate()` usa `DMO_INFERNAL_ART.invalidate()` + `__T3B.setEnabled(true)` exclusivamente para recomponer las capas cacheadas T02-09/T02-10. Sin motor nuevo, canvas nuevo, HUB estático ni cambios de geometría/mecánicas. HTML activo y backups intactos.
- **Preparación:** `ART_TOOLS/prepare_hub_tanda_02.py` → 10/10 tamaño exacto, alfa, esquinas transparentes, bordes limpios, halo ≤ 0,18 %, `contain` sin deformar. La fuente de T02-04 se conservó íntegra y se aisló con `sourceCrop=[510,0,925,768]`.
- **QA:** `ART_TOOLS/qa/validate_hub_tanda_02.js`, 3 fases A/B, **12/12 `APROBADO`** (`report.json`). Los 10 slots tienen `drawImage` real en el HUB (T02-09: 30, T02-10: 20 en capa cacheada). T01 10/10, V5 100/100, colisión x=1795 idéntica, `r23` `secured 0→1`, regresión en `CAMPAIGN_ROOM`.
- **Incidencias:** 3 criterios erróneos del primer arnés corregidos; canvas extra identificado como `hub-portrait-canvas` del juego (`canvas_probe.json`); 2 404 Cloudflare preexistentes. Las 4 incidencias heredadas de T01 se confirman **sin impacto** y no se corrigen a ciegas.
- **Propuestas del apartado 5:** siguen **sin implementar**, a la espera de autorización.
- **TANDA 03:** 10 recomendaciones derivadas de las necesidades aún abiertas en `ART_TANDA_02_HUB_REPORT.md` §11.
