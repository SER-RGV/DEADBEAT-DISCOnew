# HUB · TANDA 04 — FASE 2 · MATRIZ DE INTEGRACIÓN

Generada por `ART_TOOLS/qa/build_hub_tanda_04_matrix.py` a partir de coordenadas **medidas** en `audit_runtime.json` y del manifiesto T03; escrita **antes** de modificar el HTML y **actualizada tras la QA formal de FASE 5** por `finalize_hub_tanda_04.py`. JSON: `ART_EVIDENCE/hub/tanda_04/matriz_integracion.json` (estado `INTEGRADO`).

| Familia | Asset / artId | Clave V5 | Slot / renderer | Coordenadas mundo | Dimensiones | Función de render | Estado |
|---|---|---|---|---|---|---|---|
| A · SUELOS | `HUB_FLOOR_PATCH_O`<br>`T03-01` | `h03_floor_patch_o` | `drawHubFloorLayer() tras hubCachedFloorCv` | `[290, 720, 580, 430]` | 580×430 → 580×430 | `drawHubFloorLayer() / Wf` | **INTEGRADO** |
| A · SUELOS | `HUB_FLOOR_PATCH_E`<br>`T03-02` | `h03_floor_patch_e` | `drawHubFloorLayer() tras hubCachedFloorCv` | `[1630, 720, 580, 430]` | 580×430 → 580×430 | `drawHubFloorLayer() / Wf` | **INTEGRADO** |
| A · SUELOS | `HUB_FLOOR_PATCH_S_CRACK`<br>`T03-03` | `h03_floor_patch_s_crack` | `drawHubFloorLayer() tras hubCachedFloorCv` | `[870, 1256, 760, 329]` | 760×329 → 760×329 | `drawHubFloorLayer() / Wf` | **INTEGRADO** |
| A · SUELOS | `HUB_FLOOR_NORTH_DJ`<br>`T03-04` | `h03_floor_north_dj` | `drawHubFloorLayer() tras hubCachedFloorCv` | `[870, 265, 760, 224]` | 760×224 → 760×224 | `drawHubFloorLayer() / Wf` | **INTEGRADO** |
| B · MOBILIARIO | `HUB_PLANTER_VARIANT_02`<br>`T03-05` | `h03_planter_variant_02` | `hubDecor[T03-05] → addHubCustomProp → Lc` | `[413, 812, 78, 88]` | 96×108 → 78×88 | `hubDecor / Lc (addHubCustomProp, solid:false)` | **INTEGRADO** |
| B · MOBILIARIO | `HUB_BENCH_VARIANT_02`<br>`T03-06` | `h03_bench_variant_02` | `hubDecor[T03-06] → addHubCustomProp → Lc` | `[2000, 826, 96, 74]` | 256×198 → 96×74 | `hubDecor / Lc (addHubCustomProp, solid:false)` | **INTEGRADO** |
| C · VIP | `HUB_VIP_BOOTH_LOUNGE`<br>`T03-07` | `h03_vip_booth_lounge` | `hubDecor[T03-07] → addHubCustomProp → Lc` | `[677, 624, 216, 136]` | 216×136 → 216×136 | `hubDecor / Lc (addHubCustomProp, solid:false)` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/A · PISTA`<br>`T03-08-A` | `h03_zone_signage_a` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[958, 565, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/B · CABINA DJ`<br>`T03-08-B` | `h03_zone_signage_b` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[1178, 431, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/C · DESCENSO`<br>`T03-08-C` | `h03_zone_signage_c` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[1178, 1363, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/D · ARSENAL`<br>`T03-08-D` | `h03_zone_signage_d` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[633, 781, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/E · BARRA`<br>`T03-08-E` | `h03_zone_signage_e` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[1718, 781, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |
| D · SEÑALÉTICA | `HUB_ZONE_SIGNAGE/F · ARCADE`<br>`T03-08-F` | `h03_zone_signage_f` | `drawHubAerialLayer() tras los rótulos de neón existentes` | `[583, 1133, 144, 96]` | 192×128 → 144×96 | `drawHubAerialLayer() / Ph` | **INTEGRADO** |

## Derivación de anclajes (sin inventar)

- **A · Suelos:** `worldBox` medido en T03 sobre `Ps=(290,265,1920,1320)`; las cuatro cajas son disjuntas y están dentro del octógono (`cut=210`). Orientación O/E/S/N conservada; `drawImage(im,x,y,w,h)` sin deformar.
- **B · Mobiliario:** se añaden 2 entradas al array real `hubDecor` (línea 7875). `h` e `y` se derivan de las jardineras/bancos existentes y de las cajas de los paños O/E. `solid:false, tall:false` → sin colliders ni cambios de hitbox.
- **C · VIP:** `hub_vip_sofa_nw` (785,545) dibuja `208×160` en `y 439…599`; el nuevo anclaje `(785,760)` con `h=136` ocupa `y 624…760`, 25 px por debajo, sin solapar T01. **No se usa el pintor del menú** (FASE 1 §4).
- **D · Señalética:** el HUB calcula `signY` por estación (`dj +42`, `lift +134`, `cliente000 +34`, `arsenal/bar +62`, `arcade/seals +134`, resto `−84`). Cada placa se sitúa 136 px por encima de ese letrero diegético, con tamaño común 144×96 (aspecto 1,5 = 192/128). Seis zonas A–F → seis estaciones reales → seis coordenadas distintas.

## Comprobaciones geométricas previas

| Comprobación | Resultado |
|---|---|
| Solapamientos entre los 4 suelos | 0 (cajas disjuntas) |
| Anclajes de señalética distintos | 6 de 6 |
| Claves V5 de señalética distintas | 6 de 6 |
| Placas dentro del octógono (x 290…2210, y 265…1585) | 6 de 6 |
| Props nuevos con `solid:false` | 3 de 3 (sin colliders) |

## Verificación posterior (FASE 4 / 5) — estado final `INTEGRADO`

| Comprobación | Resultado |
|---|---|
| `drawImage` efectivos por unidad en el HUB | **13 / 13** claves `HUB|T03-*`, todas en el canvas de mundo `1280x900` |
| `drawImage` de T04 en el MENÚ o fuera del canvas de mundo | **0** |
| ANTES (`__DDM_HUB_T04=false`) / CONTROL off / CONTROL on / restore / apply | **0 / 0 / 13 / 0 / 13** |
| Señales con la placa COMPLETA dentro del viewport | **6 / 6** (3–7 zonas cada una) |
| Suelos con argumentos medidos iguales a la matriz | **4 / 4**, 0 solapamientos |
| Derivación geométrica de escala/anclaje de props | **3 / 3** (`geometryMatchesMatrix=true`) |
| Colisiones A/B/C | **idénticas** (`1720 -> 1795`); `solid:false` |
| QA A/B 3 fases, 1280x900, misma cámara | **12 / 12 `APROBADO`**, 0 errores, 0 404 locales |

**Estado final de integración: `INTEGRADO` en las 13 filas. 0 bloqueadas, 0 `NO_VERIFICADO`.**
Evidencia: `ART_EVIDENCE/hub/tanda_04/report.json`, `draw_calls.json`, `resultados_ab.json`, `comparativa_antes_despues.jpg`. Informe de entrega: `ART_TANDA_04_HUB_REPORT.md`.
