# Manifiesto de assets — Fase 1 · Tanda 02

**Familia:** arquitectura interior modular de la discoteca
**Fecha:** 2026-11-03 · **Rama:** `arena/b89cd6bc-deadbeat-disco`
**Fuente de verdad:** `ART_ASSETS/tanda_02/manifest.json` (JSON con todos los campos,
incluidos `backgroundDetected`, `threshold`, `sourceCrop`, `placeGeometry`,
`alphaExtrema`, `opaqueRatio`, `bytes`, `evidence`, `validationClassification`).

**Regla de tamaño:** ningún asset es 512×512. Cada PNG tiene **exactamente las
dimensiones naturales del slot V5 que el motor consulta**, medidas en
`ART_AUDIT/asset_inventory.json` y en el HTML antes de generar. 10 PNG individuales,
no lámina ni spritesheet.

---

## Loader y referencias de código (comunes a los 10)

```
window.__DDM_V5_IMG[slot] = Image  ->  window.__DDM_GET_V5(slot)
```

`__DDM_GET_V5` se define en el HTML como
`function(k){ var m = window.__DDM_V5_IMG && window.__DDM_V5_IMG[k];
return (m && m.complete && m.naturalWidth > 0) ? m : null; }`.
La ampliación vive en `ART_PACK/art_pack.js` (`ARCHITECTURE`, `applyArch()`,
`restoreArch()`, `architecture()`), reutilizando la `load()` y el `applyV5()` de la
Tanda 01. **No hay loader nuevo ni segundo `<script>`.** El HTML activo conserva su
hash (`f231cfc7…723`). Cada módulo registra además un `alias` trazable
`t02_A01_…` en el mismo registro y preserva la imagen previa del slot en
`ORIGINALS`.

Consumidores reales: pintor de muros `$b` / `_b` (paneles por `edge`,
`panelCount = round(edge.len/230)`) y pintor de puertas `Bg(door)`
(`df/dl/sf/sl/sg/dg`, `Ot.openT`). Profundidad/oclusión: `Qf()` ordena props y
entidades por `sortY`. Colisiones y límites: intactos en el motor.

---

## Tabla de los 10 assets

| ID | Nombre | PNG final | Dim. | Formato / alfa | Pivote | Slot V5 | Uso previsto | Referencia de código | Integración | Validación |
|---|---|---|---|---|---|---|---|---|---|---|
| A01 | `wall_straight` | `wall_straight.png` | 120×176 | PNG RGBA, alfa real 0–255 | bottom-center | `wall_stained_glass_arch` | Panel recto base repetido por panel a lo largo de cada `edge` | `_b(ctx,i,y,o,r,t)`; wrapper `$b` v8.6 `panelCount` | VERIFICADO | VERIFICADO · visible en `r23`/`r34` |
| A02 | `wall_corner_inner` | `wall_corner_inner.png` | 144×144 | PNG RGBA | bottom-center | `wall_limbo_ticket_window` | Esquina interior / unión, círculo 0 (`c%3==1`) | `$b` wrapper `drawImage(lw, i-68, -160, 136, 136)` | VERIFICADO | VERIFICADO · `overview_closeup.png` |
| A03 | `wall_corner_outer` | `wall_corner_outer.png` | 150×86 | PNG RGBA | bottom-center | `wall_avaricia_vault_door` | Esquina exterior / cambio de orientación, `o===3` | `$b` wrapper `drawImage(vd, i-84, -132, 168, 96)` | VERIFICADO | VERIFICADO · `circle_03_avaricia.png` |
| A04 | `wall_end_cap` | `wall_end_cap.png` | 124×64 | PNG RGBA | bottom-center | `wall_traicion_glacier_panel` | Remate terminal de tramo, `o===8` | `$b` wrapper `drawImage(gw, i-84, -128, 168, 87)` | VERIFICADO | PARCIALMENTE VERIFICADO · muro fuera de encuadre en `r89` |
| A05 | `wall_pillar` | `wall_pillar.png` | 204×505 | PNG RGBA | bottom-center | `nucleo_pillar_prop` | Pilar estructural con colisionador propio de prop | `hasV5Slot('nucleo_pillar_prop')` en `resolvePropV5` v8.2 | VERIFICADO | **NO VERIFICADO** en sala real (NÚCLEO inalcanzable) |
| A06 | `door_closed` | `door_closed.png` | 76×54 | PNG RGBA | center | `campaign_door_leaf` | Hoja única de puerta cerrada (el motor la duplica/espeja) | `Bg` `drawImage(dl, wx-60-58*o, wy-86, 60, 80)` | VERIFICADO | PARCIALMENTE VERIFICADO · `r0` ya abierta |
| A07 | `door_open` | `door_open.png` | 52×136 | PNG RGBA | center | `campaign_door_side_leaf` | Hoja lateral de paso; **adaptada**, no es un estado del motor | `Bg` `drawImage(sl, -8, -88-118*o, 48, 136)` | VERIFICADO | VERIFICADO · `closed_closeup.png` / `open_closeup.png` |
| A08 | `doorway_frame` | `doorway_frame.png` | 196×124 | PNG RGBA | center | `campaign_door_frame` | Marco de portal con centro vacío (no tapa el paso) | `Bg` `drawImage(df, wx-96, wy-114, 192, 122)` | VERIFICADO | PARCIALMENTE VERIFICADO |
| A09 | `threshold_entry` | `threshold_entry.png` | 196×67 | PNG RGBA | center | `campaign_door_south_gate` | Umbral enrasado con el suelo, diamante 2:1 | `Bg` `drawImage(sg, wx-98, wy-46, 196, 67)` | VERIFICADO | VERIFICADO · `threshold_closeup.png` |
| A10 | `wall_neon_detail` | `wall_neon_detail.png` | 84×84 | PNG RGBA | center | `wall_neon_club_crest` | Módulo de neón complementario, no dominante | `$b` `drawImage(cr, i-26, -172, 52, 52)`; HUB 44×44 / 48×48 | VERIFICADO | PARCIALMENTE VERIFICADO |

---

## Preparación y recorte reproducible

`ART_TOOLS/prepare_tanda_02.py` · Pillow 13.0.0 · LANCZOS.

| ID | Fondo detectado (esquinas) | Umbral | Recorte de fuente | Modo | Geometría de colocación |
|---|---|---|---|---|---|
| A01 | `(1,1,1)` negro | 14 | auto bbox alfa | fit | 120×176 |
| A02 | `(0,1,0)` negro | 14 | auto bbox alfa | fit | 144×144 |
| A03 | `(0,2,2)` negro | 14 | auto bbox alfa | fit | 150×86 |
| A04 | `(1,3,7)` negro | 14 | auto bbox alfa | fit | 124×64 |
| A05 | `(0,1,1)` negro | 14 | auto bbox alfa | fit | 204×505 |
| A06 | `(1,0,1)` negro | 14 | `(0.115,0.055,0.515,0.965)` media puerta izquierda | fit | 76×54 |
| A07 | `(7,9,13)` negro | 16 | `(0.355,0.045,0.585,0.965)` franja central del hueco | fit | 52×136 |
| A08 | `(1,1,2)` negro | 14 | auto bbox alfa | fit | 196×124 |
| A09 | `(253,254,253)` **blanco** | 40 | auto bbox alfa | **contain** | diamante 2:1 completo, padding transparente |
| A10 | `(0,0,1)` negro | 14 | auto bbox alfa | fit | 84×84 |

El algoritmo: distancia por canal al color de fondo → rampa de antialias
(`thr … thr+26`) → cierre de huecos interiores por componentes conexas que no
tocan el borde (`HOLE_MIN`) → blur 0,45 → bbox alfa → escalado → RGBA. Las fuentes
originales permanecen sin alterar en `_source/`.

---

## Verificación técnica de archivos

`ART_EVIDENCE/tanda_02/logs/file_checks.json`:

- **10/10 decodifican** como PNG.
- **10/10** coinciden con las dimensiones del manifiesto.
- **10/10** tienen canal alfa real (`0..255`) con píxeles transparentes.
- **10/10** conservan su fuente original.
- Carga en el juego: **10 peticiones HTTP**, **0 errores HTTP de arte**,
  **0 `pageerror`** en ambas builds.
- `architecture()` en vivo: **10/10** `loaded / exactSize / live /
  loaderResolves / aliasRegistered / originalPreserved`, `errors:[]`.

---

## Adaptaciones e incompatibilidades

1. **A07 `door_open`** — el motor NO tiene sprite alternativo de puerta abierta;
   anima la misma hoja con `Ot.openT`. La pieza se adaptó a la hoja lateral y se
   documenta como incompatibilidad, sin tocar la lógica de apertura.
2. **A02/A03/A04** — el motor no ensambla esquinas como piezas geométricas:
   construye muros por `edge` con paneles. Son acabados de panel, no sustitutos de
   pared, colisión ni geometría.
3. **A06** — el slot es UNA hoja que `Bg` dibuja dos veces (2ª espejada); se recortó
   la media puerta izquierda de la fuente.
4. **A09** — `contain` para no deformar el diamante 2:1 en un slot 2,93:1.
5. **A05** — `204×505` es el slot de pilar más alto del registro; se recortó
   lateralmente sin perder el fuste central.
6. **DEF-001** — `campaign_door_side_frame` se conservó sin sustituir. En `r23` el
   marco metálico original convive con la hoja A07. Registrado con evidencia, sin
   corrección improvisada (ver `ART_TANDA_02_VISUAL_QA.md`).

---

## Estados de integración y validación por asset

| ID | Integración (loader) | Técnica (archivo) | Visibilidad en sala real |
|---|---|---|---|
| A01 | VERIFICADO | VERIFICADO | VERIFICADO |
| A02 | VERIFICADO | VERIFICADO | VERIFICADO |
| A03 | VERIFICADO | VERIFICADO | VERIFICADO |
| A04 | VERIFICADO | VERIFICADO | PARCIALMENTE VERIFICADO |
| A05 | VERIFICADO | VERIFICADO | **NO VERIFICADO** |
| A06 | VERIFICADO | VERIFICADO | PARCIALMENTE VERIFICADO |
| A07 | VERIFICADO | VERIFICADO | VERIFICADO |
| A08 | VERIFICADO | VERIFICADO | PARCIALMENTE VERIFICADO |
| A09 | VERIFICADO | VERIFICADO | VERIFICADO |
| A10 | VERIFICADO | VERIFICADO | PARCIALMENTE VERIFICADO |

Clasificación global de la familia: **PARCIALMENTE VERIFICADA** en visibilidad
(7 aislados en capturas, 3 parciales, 1 no verificada), **VERIFICADA** en
integración, integridad, carga y ausencia de regresión funcional.
