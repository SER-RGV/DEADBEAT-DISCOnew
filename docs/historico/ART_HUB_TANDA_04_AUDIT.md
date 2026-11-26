# HUB · TANDA 04 — FASE 1 · AUDITORÍA DEL RENDERER

**Fecha:** 2026-11-03 · **Build:** `DEADBEAT_DISCO.ART.html` · **HTML intacto en el momento de la auditoría**
SHA-256 `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723` · 13.381.028 B / 19.839 líneas
**Evidencia de runtime:** `ART_EVIDENCE/hub/tanda_04/audit_runtime.json` + 11 capturas `audit_*.png`
**Herramienta:** `ART_TOOLS/qa/hub_tanda_04_audit.js` (solo lectura; proxy sobre `drawImage`, sin modificar el juego)

> Esta auditoría se completó **antes** de cualquier modificación del HTML, tal como exige la FASE 3.

---

## 1. Mapa del código del HTML activo

| Elemento | Localización | Qué es |
|---|---|---|
| Motor principal (minificado) | línea **1425** (1.756.566 caracteres) | Núcleo del juego: bucle, cámara, colisiones, menú de píxeles |
| Módulo HUB v3.5 | líneas **7440…10060** | `buildHubSpace()`, props, estaciones, capas de dibujo |
| Registro V5 | línea **13158** `window.__DDM_V5_IMG = Object.create(null)` | Registro único de imágenes |
| Lector V5 | línea **13167** `window.__DDM_GET_V5(k)` | Devuelve `im` solo si `complete && naturalWidth>0` |
| Tinte por círculo | línea **15890** | Envuelve `__DDM_GET_V5`; solo afecta a `club_neon_planter_prop` y `decor_potted_palm` |
| Caché de material | línea **19123** `window.__T3B` / `invalidate()` | `__DDM_PAINT_MATERIAL`, `DMO_INFERNAL_ART.invalidate()`, `setEnabled` |
| Portada DOM | línea **19367** `<script id="ddc-cover-js">` | `#ddc-cover`, `#ddc-img`, overlay de título |
| Carga del art pack | línea **19836** | `<script src="ART_PACK/art_pack.js">` |

## 2. Renderer del HUB (el correcto para TANDA 04)

Los hooks se instalan en las líneas **10010…10040** sobre variables locales del módulo HUB (por eso T03 concluyó que `Wf/Ph/zf` **no son globales** y no podían parchearse desde `art_pack.js`):

| Hook | Función | Línea | Contenido |
|---|---|---|---|
| `Wf` | `drawHubFloorLayer()` | 9309 | Suelo: `hubCachedFloorCv` (1920×1320) en mundo `(290,265)`, medallón, sellos I–IX, pozo de descenso |
| `Ph` | `drawHubAerialLayer()` | 9500 | Bolas de disco, lámparas, **rótulos de neón** y letreros diegéticos de estaciones |
| `zf` | `drawHubScreenLayer()` | 9592 | HUD/alertas de redada en espacio de pantalla |
| `Zf` | `drawHubMinimap()` | 9625 | Minimapa |
| `Lc` | `hubDraw(ctx, prop)` | 9774 (y 12309, 14627) | Renderer de props con **sortY**; `hubDecor` y `addHubCustomProp` |

- `drawHubFloorLayer()` hace `g.save(); g.imageSmoothingEnabled = false; Ls(g); g.clip();` → el `ctx` `g` está en **coordenadas de mundo** con la transformación de cámara y recortado al octógono.
- Geometría medida: `Ps = {x:290, y:265, w:1920, h:1320}`, octógono con `cut=210`, centro `(1250,925)`.
- En runtime, el lienzo de mundo del HUB es un canvas sin id de **1280×900** (16.242 `drawImage` medidos), compuesto luego en `#game` (1280×900).
- `hubCachedFloorCv` se construye **una vez** (`__T3B_HUB_QA.state()`: `builds=1`) y se invalida por `window.__T3B.revision` (medido `revision=29`, `draws=456`, `available=true`).

## 3. Renderer del menú y el pintor VIP

`sp()` (offset 468.647 de la línea 1425) liga el renderer de píxeles a `#menu-canvas54`. La definición **activa** de `cp()` (offset 1.675.305) es:

```js
cp = function (e, a) {
  if (!sp()) return false;
  const t = ip.ctx; ...
  ip.phase = "pixel-club";
  if (ip.canvas.width !== 768 || ip.canvas.height !== 500) { ip.canvas.width = 768; ip.canvas.height = 500; ip.resizes++; }
  (function () { const djReady = ...; if (djReady && !d._v5MenuBuilt) { d.menu = null; d._v5MenuBuilt = true; } })();
  d.menu || (d.menu = function () {
    const a = canvas(768,500).getContext("2d");
    const gv = window.__DDM_GET_V5 || function(){return null};
    const vb = gv("hub_vip_booth_lounge");
    ...
    if (vb) { for (const yy of [284,382]) {
      a.save(), s ? (a.translate(736,yy), a.scale(-1,1), a.drawImage(vb,0,0,108,68))
                  : a.drawImage(vb,32,yy,108,68), a.restore();
    }}
    return e;
  }());
  t.drawImage(d.menu, 0, 0);
  ...
};
```

Es decir: **4 `drawImage` de 108×68** en las cajas `[32,284,108,68]`, `[32,382,108,68]`, `[628,284,108,68]`, `[628,382,108,68]` sobre el canvas **del MENÚ** de 768×500. Está expuesto como `DMO.menu54.frame(t)`.

## 4. Por qué el pintor VIP existe pero no tiene renderer activo — **causa medida**

El bucle principal (offset 664.050 de la línea 1425) elige entre dos ramas:

```js
Tf(n), U || Ln.classList.contains("hidden") ? (ip.visible = false, Qf()) : cp(e)
```

Mediciones en el arranque real (`/tmp/t4/menu_probe.js`, `/tmp/t4/menu_probe2.js`, `audit_runtime.json`):

| Medida | Valor | Interpretación |
|---|---|---|
| `#overlay.className` | `"hidden"` | `Ln.classList.contains("hidden") === true` → se elige **`Qf()`**, nunca `cp(e)` |
| `DMO.observe().hud` | `running:false, overlay:false` | Ni se está jugando ni está abierto el overlay de menú |
| `#ddc-cover` | `display:block`, `zIndex:2147483000`, `class:"ddc-locked"` | La portada visible es el overlay DOM `ddc-cover-js`, **no** el canvas de píxeles |
| `#menu-canvas54` | **960×540** (CSS 1280×900) | Si `cp()` hubiera corrido, sería **768×500** |
| `DMO.menu54.stats()` antes | `frames:0, resizes:0, phase:"apagado", visible:false` | El renderer de píxeles **nunca se ejecutó** |
| `DMO.menu54.frame(performance.now())` forzado | `frames:1, resizes:1, phase:"pixel-club"`, canvas **768×500** | El pintor existe y es alcanzable **solo por la API de depuración** |
| `drawImage` medidos en `menu-canvas54` | **0** | Ni siquiera el blit de `d.menu` ocurre |
| `__DDM_GET_V5("hub_vip_booth_lounge")` | `true`, `216×136`, `complete:true` | Registro y carga correctos; el fallo es **de renderer**, no de asset |
| `drawImage` etiquetados T01/T02/T03 en la fase MENÚ | 0 de `T03-*` | Ninguno de los 13 PNG T03 se dibuja |

**Conclusión:** el pintor VIP pertenece exclusivamente al renderer de píxeles del **título**, cuya rama está desactivada en el build porque `#overlay` está `hidden` y la portada la dibuja `ddc-cover-js`. Además, aunque se fuerce con `DMO.menu54.frame()`, dibuja en `#menu-canvas54`, **no en el HUB**. Por tanto **no existe ruta compatible para reutilizarlo**: la integración del VIP exige conectarlo al renderer del HUB con un anclaje derivado de la geometría real (FASE 2/3). Esto corrige y completa D‑07 de TANDA 03.

## 5. Registro V5, cachés e invalidación

| Sistema | Estado medido |
|---|---|
| `window.__DDM_V5_IMG` | **142 claves** en runtime (128 base + 13 `h03_*` + `hub_vip_booth_lounge`) |
| Alias T03 | `h03_floor_patch_o`, `h03_floor_patch_e`, `h03_floor_patch_s_crack`, `h03_floor_north_dj`, `h03_planter_variant_02`, `h03_bench_variant_02`, `h03_vip_booth_lounge`, `h03_zone_signage_a…f` |
| `DMO_ART_PACK.hub3()` | `registered:13, enabled:true, blocked:13, verifiedDraws:0` |
| `DMO_INFERNAL_ART` | `{version, themes, invalidate:function, audit}` — API de invalidación pública existente |
| `__T3B` | `enabled:true, revision:29, lastInvalidation:"toggle:true"` |
| `__DDM_PAINT_MATERIAL` | dibuja por ruta `hub` (canvas 1920×1320) y `campaign` (2500×1850): **dos capas cacheadas** |
| `__T3B_HUB_QA.state()` | `{revision:29, builds:1, draws:456, available:true}` en el HUB; `available:false` antes de entrar |

No hay que crear ningún sistema nuevo: basta con leer `__DDM_V5_IMG` desde los `ctx` existentes y, si se invalida una caché, usar `DMO_INFERNAL_ART.invalidate()` / `__T3B.setEnabled(true)` ya presentes.

## 6. Slots y anclajes reales (medidos, no inventados)

**`hubDecor` (línea 7875)** — 10 props decorativos **no sólidos** (`solid:false, tall:false`) dibujados por `addHubCustomProp` → `Lc`:

| id | slot | x | y | h | flip |
|---|---|---|---|---|---|
| `hub_decor_planter_nw/ne/sw/se` | `club_neon_planter_prop` | 1005 / 1495 | 702 / 1178 | 88 | false/true |
| `hub_decor_bench_w/e` | `limbo_bench_prop` | 1085 / 1415 | 1252 | 74 | false/true |
| `hub_decor_speaker_w/e` | `club_speaker_tower_prop` | 985 / 1515 | 502 | 122 | false/true |
| `hub_decor_cooler_w` | `club_water_cooler_prop` | 452 | 692 | 104 | false |
| `hub_decor_vending_e` | `club_vending_machine_prop` | 2048 | 692 | 118 | true |

`addHubCustomProp()` (línea 7482) empuja en `tc` con `solid` por defecto `true`. **Todos los filtros de colisión** del motor (`i.solid && …`, `onFloor && solid`) excluyen `solid:false`, por lo que añadir props con `solid:false` **no altera hitboxes, colisiones ni `Ac.validate()`**.

**Estaciones (11, medidas en runtime):** `lift(1250,1365)`, `dj(1250,525)`, `arsenal(705,855)`, `bar(1790,855)`, `arcade(655,1135)`, `seals(1845,1135)`, `dancer_0(1030,785)`, `dancer_1(1470,785)`, `dancer_2(1015,1085)`, `dancer_3(1965,918)`, `cliente000(785,600)`.

**Rótulos de neón reales** (`drawHubAerialLayer`, líneas 9559‑9566): `(1250,326)` DJ, `(590,662)` y `(590,690)` arsenal, `(1910,646)` barra, `(1250,1456)` descenso.

**`signY` real por estación** (línea 9577): `dj +42`, `lift +134`, `cliente000 +34`, `arsenal/bar +62`, `arcade/seals +134`, resto `−84`. Es la referencia usada para derivar los 6 anclajes de señalética.

**Sofás VIP T01** (`hub_vip_sofa_nw/ne`, líneas 7695/7718): `(785,545)` y `(1715,545)`, imagen 208×(208·172/224)=208×160 dibujada en `y 439…599`. Referencia para el anclaje del VIP de T03 sin solapar T01.

**Cajas de suelo T03** (manifiesto T03, medidas): O `[290,720,580,430]`, E `[1630,720,580,430]`, S `[870,1256,760,329]`, N `[870,265,760,224]`. Todas dentro de `Ps` y del octógono; **disjuntas entre sí** (O/N comparten x=870 pero `y 720…1150` vs `265…489`; S empieza en `y=1256`).

## 7. Consecuencias para la implementación

1. Los **4 suelos** se conectan a `drawHubFloorLayer()` (hook `Wf`), inmediatamente después del blit de `hubCachedFloorCv` y antes del medallón.
2. Las **6 señales** se conectan a `drawHubAerialLayer()` (hook `Ph`), junto a los rótulos de neón existentes.
3. Las **2 variantes de mobiliario y el VIP** se conectan al renderer de props `Lc` añadiendo 3 entradas derivadas a `hubDecor` con `solid:false, tall:false`.
4. Se mantiene `__DDM_V5_IMG`, `load()` y todas las APIs existentes. No se crea motor, canvas, caché, loader ni sistema de dibujo independiente.
5. Todo el bloque queda detrás de un único flag `window.__DDM_HUB_T04` (por defecto activo) y entre marcadores `TANDA04:BEGIN/END`, lo que lo hace **localizado y reversible** y permite la QA A/B sobre la misma build.
6. No se toca gameplay, colisiones, geometría, puertas, estaciones, música, HUD, guardado, progresión ni IA.

**Discrepancias registradas:**
- **D‑04/T03 corregida:** el VIP sí tiene pintor, pero es del MENÚ y su rama está desactivada; no es integrable por reutilización.
- **D‑07/T03 completada:** causa exacta = rama `Qf()` por `#overlay.hidden` + portada `ddc-cover-js`; 0 ejecuciones de `cp()` en el arranque real.
- **Performance gate de T02:** el estado de partida lo declara pendiente. La QA de TANDA 04 lo cierra explícitamente midiendo el coste de render antes/después con la misma cámara y distinguiéndolo del coste de carga (§FASE 5).
- 2 × 404 `/cdn-cgi/challenge-platform/…` externos y preexistentes; 0 404 locales y 0 `pageerror` (medido en `audit_runtime.json`).
