# TANDA 08 · «El abismo vivo» — Informe técnico final

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **PR #1:** `OPEN`, sin merge · **`main`:** intacta
**Estado:** `INTEGRADO_VALIDADO` · **Prueba de composición:** 16/16 APROBADA · **QA:** 33 APROBADO / 0 FALLIDO / 0 BLOQUEADO / 4 NO VERIFICADO

---

## 1. Resultado

El HUB ya no termina en una banda de roca y un fondo negro. Bajo el borde sur se abre un **cutaway en espacio de pantalla** con cinco planos de profundidad, parallax derivado de la cámara real, formaciones ilustradas, humo, brasas, ceniza y luces infernales lejanas. La grieta central dejó de ser un agujero negro: ahora emite luz desde abajo y deja ver una banda diminuta de luces profundas. Durante el descenso de T07 el abismo **se abre de 84 a 374 px** gobernado por `shaftOpen`, sin modificar la cámara, el audio ni la lógica de llegada.

No es un fondo animado: cada plano tiene identidad, escala, contraste y velocidad de parallax diferentes, y la profundidad se interpreta por luces lejanas y compresión geométrica.

---

## 2. Fase 0 — Auditoría global y mapa de profundidad

Preflight coincidente: HEAD `3a8e58f`, worktree limpio, PR `OPEN/head=3a8e58f/merged=null`, T01–T07 presentes, `main` `d75e021`, build activa HTTP 200. Sin cambiar de rama.

Auditoría sin tocar el juego: `ART_TOOLS/qa/hub_tanda_08_audit_global.js` → `ART_EVIDENCE/hub/tanda_08/audit_global.json` + 12 capturas. **168 claves V5, 27 canvas, 1 secuenciador, `DMO_ATMOS.degraded=false`, 0 `pageerror`.**

| Hallazgo | Consecuencia |
|---|---|
| La caché de suelo llega a `y=1585` y con `cam.y=1195` el mundo visible es `y715…1675` | Sólo ~84 px bajo el borde del acantilado |
| Durante `plunge` la cámara **sube** (`1195→1306→985`) y en `skyfall` sigue `925→895` | Apilar imágenes en coordenadas mundo por debajo de `y1675` es inútil |
| `hub_abyss_stair_crack` resuelve al PNG T01 `hub_09_puertas_accesos.png` (320×175) | La «grieta» es una escotilla dorada con interior negro opaco, no un abismo |
| `DMO_ATMOS` es un overlay de bloom/vignette/grain/grade | **No** es un motor de partículas; no sirve para brasas/humo |

➡️ Decisión de dirección de arte: **cutaway en espacio de pantalla anclado al borde real `y1585`**, con parallax aritmético sobre `DMO.camera()` y apertura gobernada por el progreso real de `floorDropAnim`. Documento completo: `ART_TANDA_08_FASE0_1_MAPA_Y_COMPOSICION.md`; versión legible por máquina: `ART_EVIDENCE/hub/tanda_08/mapa_profundidad.json`.

**Carencias priorizadas y su resolución**

| Pr. | Carencia | Resolución |
|---|---|---|
| P1 | Grieta = agujero negro sin distancia | Resplandor aditivo + banda de luces lejanas + brasas dentro de la elipse interior |
| P2 | Bajo el acantilado, una sola banda plana | 5 planos con trapezoide convergente |
| P3 | Sin animación ambiental con sistema propio | 56 brasas + 26 cenizas + 4 columnas de humo + 3 luces lejanas, todo preasignado |
| P4 | Sin parallax de profundidad | Factores `.92 / .66 / .40 / .20 / .08` |
| P5 | El descenso no revelaba nuevas capas | `expand = 260·shaftOpen`, ventana `84→374 px`, densidad ligada a `stairProgress` |

**Ya resuelto y NO tocado:** superficie transitable, medallón, 11 estaciones, 10 NPC, paramentos T06, labio/estrato T07, llegada breve, Y-sort, colisiones, audio.

---

## 3. Fase 1 — Diseño espacial y prueba de composición (puerta de entrada a producción)

`ART_TOOLS/qa/composition_hub_tanda_08.py` inyecta el prototipo procedural en una **copia temporal** del HTML (`t08_composition.html`, eliminada al terminar) y ejecuta `t08_composition_probe.js` con Chromium 131. **Sin generar un solo asset**.

```
edgeY   = 450 + zoom*(1585 − cam.y)
expand  = 260 * shaftOpen                    ← progreso REAL del descenso
T       = edgeY − expand ;  Wh = H − T
y(d)    = T + Wh*(0.06 + 0.88·d^0.78)        ← compresión por distancia
h(d)    = Wh*(0.30 − 0.20·d)
offset  = −zoom*(cam.x − 1250)·factor(d)     ← parallax de la cámara EXISTENTE
```

| Plano | d | factor parallax | alpha | Contenido final |
|---|---|---|---|---|
| P1 cercano | 0.00 | 0.92 | 0.98 | Dos paredes rocosas distintas, grietas oro/naranja |
| P2 medio | 0.26 | 0.66 | 0.82 | Estrato geológico + 2 columnas de basalto |
| P3 intermedio | 0.52 | 0.40 | 0.62 | Plataforma suspendida + 2 agrupaciones de rocas |
| P4 lejano | 0.76 | 0.20 | 0.42 | Pared cavernaria + cavidades, contraste atenuado |
| P5 fondo | 0.94 | 0.08 | 0.30 | Luces infernales diminutas |

**`composition_proof.json` — 16/16 APROBADA, 0 `pageerror`, 168 V5, 27 canvas.**

- Ventana sur `winTop 815,6 / winH 84,4`; 5 planos en `y 820,7 → 891,4`, alturas `25,3→9,4`.
- Ningún plano por encima del borde → no tapa la superficie transitable.
- Parallax con Δcámara 734 u: `633 → 454 → 275 → 138 → 55 px`.
- En el centro del HUB `winTop 1013,4` → cutaway oculto, sin intrusión.
- A/B localizado: diff de franja **20,62**; brasas con `t` y posición cambiantes en 8/8 muestras.
- Descenso: `expand 0→260`, `winH 84,4→373`, luminancia mínima **39,48** (sin negro); retirada en `CAMPAIGN_ROOM`.

**Sólo con esta prueba aprobada se autorizó la Fase 2.**

---

## 4. Fase 2 — Producción (10 assets estrictamente necesarios)

`generate_image` ×10 → `ART_TOOLS/prepare_hub_tanda_08.py` → 10 finales RGBA. Preparación reproducible con recorte automático por luminancia, `resize LANCZOS` a tamaño exacto, **gradación de brillo/saturación por plano** (los lejanos se atenúan a 0,46/0,52), máscara de alfa (`band` / `object` / `smoke`) y despill oscuro. 10/10 `exactSize`, esquinas transparentes, halo claro **0,0 %**, `allValid:true`.

| ID | Alias | Tamaño | Plano | Ubicación / anclaje | Función visual |
|---|---|---|---|---|---|
| T08-01 | `h08_pared_cercana_izq` | 900×300 | P1 | Tercio izq. del cutaway, borde `y1585`, factor .92 | Máxima definición; arranca del labio T07 |
| T08-02 | `h08_pared_cercana_der` | 900×300 | P1 | Tercio der., silueta distinta, factor .92 | Evita repetición evidente; contrapunto cian/magenta |
| T08-03 | `h08_estrato_medio` | 1600×220 | P2 | Banda horizontal, factor .66 | Continuidad geológica bajo el borde |
| T08-04 | `h08_columna_natural` | 300×460 | P2 | 2 instancias, escala 1.0/0.72, factor .66 | Escala vertical, lectura de distancia media |
| T08-05 | `h08_plataforma_suspendida` | 700×260 | P3 | Centro con balanceo suave, factor .40 | Elemento suspendido con vida propia |
| T08-06 | `h08_pared_lejana` | 1600×180 | P4 | Banda completa, factor .20 | Atmósfera y disolución de formas |
| T08-07 | `h08_rocas_suspendidas` | 900×260 | P3 | 2 instancias con escala y volteo distintos | Siluetas de escala, movimiento lejano |
| T08-08 | `h08_cavidades_lejanas` | 1600×160 | P4 | Banda completa, factor .20 | Segunda lectura de profundidad |
| T08-09 | `h08_luces_abismo` | 1200×200 | P5 | Fondo del cutaway + elipse de la grieta | Interpretar distancia; crece con `shaftOpen` |
| T08-10 | `h08_humo_infernal` | 360×640 | Ambiente | 4 columnas, escalas y derivas distintas | Corrientes lentas con densidad variable |

Pivote centro en todos; anclaje en espacio de pantalla derivado de `DMO.camera()`, **no** en coordenadas mundo nuevas. **0 sprites, 0 NPC, 0 criaturas, 0 enemigos, 0 ilustraciones no integrables.** Las dos paredes próximas son fuentes distintas. Fuentes conservadas en `_source/`.

---

## 5. Fases 3 y 4 — Integración y animación ambiental

**`ART_PACK/art_pack.js`** (4 inserciones, 0 líneas de T01–07 eliminadas): bloque `HUB8_*`, `loadHub8()` encadenado tras `loadHub7()` en el **mismo `load()`**, exports `hub8*`, versión `+hub-tanda08`. 168 → **178 claves V5**.

**`DEADBEAT_DISCO.ART.html`** (2 inserciones, **0 líneas eliminadas**): módulo `T08` dentro de `initDmoHubV35` y `T08.install()` dentro de `buildHubSpace()`, justo tras `T07.installHooks()`. Enganches sobre `zf` (dibujo) y `Tf` (dt del motor) ya encadenados: T08 queda debajo de los overlays de descenso de T07 y del HUD.

| Elemento | Implementación |
|---|---|
| Profundidad | Trapezoide convergente + 5 planos; vacío central (las paredes ocupan los tercios laterales) |
| Parallax | `−zoom·(cam.x−1250)·factor(d)` sobre `DMO.camera()`; sin segunda cámara |
| Grieta | Resplandor aditivo + banda de luces lejanas dentro de la elipse interior, sin tapar el marco ni `III · DESCENSO` |
| Brasas | 56 objetos preasignados, tamaños/velocidades/duraciones/fade distintos, confinadas al abismo |
| Ceniza / polvo | 26 motas con corrientes de aire sinusoidales, alpha ≤ 0,10 |
| Humo | 4 columnas con densidad variable, deriva lenta e integración con las luces |
| Luz del abismo | 3 luces lejanas móviles + 7 glows infernales; **sólo dentro del cutaway**, la escena no parpadea |
| Movimiento lejano | Plataforma con balanceo, rocas y columnas con deriva, luces con fase propia |
| Descenso | `shaftOpen` gobierna `expand`; `stairProgress` gobierna densidad; retirada en `CAMPAIGN_ROOM` |
| Movimiento reducido | `Yc.reduced` congela geometría, brasas y humo |
| Coste | Cero `new`/arrays por fotograma; `update()` sale temprano si el cutaway no es visible; carga separada del render |

**Flag reversible:** `window.__DDM_HUB_T08 = false` detiene todos los contadores de dibujo T08 (`frames 145 → 145`), deja de alterar los píxeles y **no afecta a T01–07** (los contadores de T07 siguen creciendo). Un arranque con el flag en `false` es equivalente a T07 (diff `0,20`). `true` restaura sin residuos.

**No se ha creado:** canvas, motor, cámara, loader duplicado, rAF, temporizador propio, audio, colisiones, geometría transitable, puertas, estaciones, progresión, NPC ni sistema de partículas paralelo.

---

## 6. Fase 5 — QA y evidencias

Arnés: `ART_TOOLS/qa/validate_hub_tanda_08.js` sobre la build real con Chromium/Playwright. Resultado: **`qa_tanda08.json` → 33 APROBADO / 0 FALLIDO / 4 NO VERIFICADO, `verdict: APROBADO`**.

| Bloque | Comprobaciones destacadas |
|---|---|
| Carga | pack `applied`, 10/10 assets `exactSize`, 178 V5, 27 canvas, 1 secuenciador, 0 `pageerror` |
| Geometría | 5 planos monótonos; `winTop = 450+zoom·(1585−cam.y)` con error máximo **0,05 px** en 8 zonas; zoom/límites intactos |
| Parallax | `633 → 454 → 275 → 138 → 55 px` con Δcámara 734 u |
| A/B | 8 zonas con diff medible; `false` retira todo; arranque `false` ≡ T07 (diff 0,20); `true` restaura |
| Animación | **8/8 brasas cambian de posición Y de fase** con cámara estática; humo/ceniza/luces/formaciones dibujados; Δluminancia global **−0,04** (sin parpadeo); confinadas bajo `winTop`; 0 cambios cuando el cutaway es invisible |
| Descenso | `expand 0→260`, `winH 84→374`, correlación con `shaftOpen` error máximo **0,16**; luminancia mínima **38,45**; retirada en 10/10 muestras de `CAMPAIGN_ROOM`; T07 `descentScreen` activo |
| Regresión | `hub/hub2/hub3/hub5/hub6/hub7` con sus counts originales; T07 con 6 actores y llegada; estaciones, canvas, V5 y secuenciador sin cambios |
| Rendimiento | 90 frames: media **29,07 ms**, máx **50 ms**, 0 frames >50 ms; partículas acotadas y reutilizadas |

**Clasificación de lo no verificable en esta sesión** (documentado, no presentado como aprobado):

| ID | Estado | Motivo |
|---|---|---|
| T08-33 | `NO VERIFICADO` | Coste de frame medido en Chromium headless, no extrapolable a hardware real |
| T08-35 | `NO VERIFICADO` | Vídeo continuo y mando físico requieren sesión interactiva |
| T08-36 | `NO VERIFICADO` | Audio audible / latencia: sólo se verifica la cadena lógica de `DMO_MUSIC` |
| T08-37 | `NO VERIFICADO` | Rendimiento sostenido y regresión visual formal completa T01–07 en hardware real |

Heredados de tandas anteriores y aún vigentes: vídeo continuo, mando físico, audio audible, inventario total de frames NPC, performance gate de T02 y 8 `BLOQUEADO` de T03.

**Evidencias** en `ART_EVIDENCE/hub/tanda_08/` (52 ficheros): `audit_global.json` + 12 JPG de auditoría, `composition_proof.json` + 12 capturas de composición, `qa_tanda08.json`, `report.json`, `hashes.json` (10/10 SHA-256, 0 discrepancias), `mapa_profundidad.json`, 16 JPG A/B en 8 zonas, 3 comparativas lado a lado y 4 JPG de descenso. `ART_ASSETS/hub/tanda_08/manifest.json` → `INTEGRADO_VALIDADO`.

**Límites declarados:** en reposo en el centro del HUB el acantilado cae fuera de pantalla por la cámara real (no por T08). Los puntos de lectura en juego normal son la grieta iluminada y la aproximación al borde sur; la inmensidad se revela al descender. No se ha modificado la cámara para forzar otra vista.

---

## 7. Publicación

Antes del commit: `git diff --check`, revisión del diff completo (**HTML: 2 inserciones y 0 eliminaciones**; `art_pack.js`: sólo la línea de versión y el cuerpo de la cadena de carga, reemplazados por su equivalente anidado), verificación de que el prefijo del HTML hasta `TANDA07:END (módulo)` es idéntico al backup `.PRE_T08`, comprobación de marcadores T01–07, `node --check` de los 6 JS, `py_compile` de los 5 Python y funcionamiento del flag por QA.

Commit independiente en `arena/109fe45c-deadbeat-disconew`, actualización del PR #1, **sin merge y sin modificar `main`**.
