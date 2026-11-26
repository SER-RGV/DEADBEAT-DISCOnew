# Tanda 03 · FASE C · 8 familias de animación — **CERRADA**

**Fecha:** 2026-11-03 · **Rama:** `arena/3f148aa7-deadbeat-disco` · **HEAD:** `897ff85dcbd937a9458d2300a5643de094374f27`
**Disparador:** tras entregar la **FASE B CERRADA** y ofrecer explícitamente la FASE C, el usuario respondió «sigue». Autoriza **únicamente FASE C**.
**Estado:** **FASE C CERRADA.** 8 poses clave como assets individuales, identidad coherente, lienzo canónico compartido y continuidad medida. **NO integradas en el juego.**

---

## 1. Alcance y protección

| Comprobación | Resultado |
|---|---|
| `DEADBEAT_DISCO.ART.html` | SHA `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`, 13.381.028 B — **sin cambios** |
| `v9_t3_fase1b_cache_probe.html` + `backups/*.ORIGINAL.html` | SHA `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` — **sin cambios** |
| `main`, `ART_PACK/art_pack.js`, `ART_BIBLE.md`, `ART_PRODUCTION_LOG.md`, `README.md` | **sin modificaciones** (`git diff --stat` de protegidos: sin salida) |
| T01 / T02 / FASE A / FASE B | 8 PNG / 10 PNG + 5 logs / 4 láminas + ficha / 8 orientaciones — **todo conservado** |

**No** se ha integrado nada en el HTML, **no** se ha tocado el render, **no** se han cambiado mecánicas, armas, colisiones, controles, HUD, IA, Director, progresión, guardado, economía, balance, oleadas ni transiciones. **No** se ha creado un segundo sistema de animación ni un spritesheet definitivo. **No** se ha hecho commit ni push de T03.

---

## 2. Qué se entrega exactamente

8 **assets individuales** en `ART_ASSETS/tanda_03/fase_c/`, uno por familia. Son **poses clave de diseño**, no una secuencia de N fotogramas por familia: el límite es 10 assets por tanda y la secuenciación real depende del controlador del motor, que pertenece a la FASE D.

| Asset | Estado real del motor | Prioridad | SHA-256 (16) | Bytes | Silueta (h×w) |
|---|---|---|---|---|---|
| `IDLE` | `idle` | 10 | `6cfef72542f8033d…` | 347.628 | 1128×257 |
| `CAMINAR` | `walk` | 15 | `33eb77e0f2e8e7fb…` | 377.093 | 1125×319 |
| `CORRER` | `run` | 20 | `74df389227ae4bdb…` | 386.875 | 1127×268 |
| `DISPARAR` | `shoot` | 60 | `bcb9307f7c852013…` | 406.058 | 1124×427 |
| `DISPARO_CARGADO` | `charged` | 65 | `b4af7f4cec820882…` | 446.725 | 1125×455 |
| `HABILIDAD` | `ability` | 70 | `b959a8b1ab41f8cb…` | 336.986 | 1129×256 |
| `DANO` | `hurt` | 80 | `898734553cbcdad0…` | 353.139 | 1126×262 |
| `MUERTE` | `death` | 100 | `a0f3f87e5cdc4183…` | 134.152 | **181×558** |

Los nombres de estado y las prioridades proceden de `STATE_PRIORITIES` en `ART_AUDIT/player_render_audit.json`; **no se han inventado** claves, `animFrame`, `frameT`, `spriteSheet` ni APIs. `MUERTE` es la única silueta ancha y baja: cuerpo abatido horizontal, cabeza a la izquierda, botas a la derecha, ojos cerrados — no una figura de pie.

Identidad heredada y respetada en las 8: `ART_ASSETS/tanda_03/master_full_body.png` y orientación `fase_b/SE.png`; cabello negro voluminoso despeinado, rostro realista desafiante, tank top negro sin mangas, tatuajes ornamentales en ambos brazos, pantalón negro con ribete magenta, botas oscuras lisas sin cordones, complexión delgada, luz magenta/cian, **manos vacías**. Sin arma dibujada (el motor superpone armas), sin armadura, logo, zorro coronado, texto, escenario, multitud, accesorios inventados, efectos, partículas, energía, pixel art, dithering, ruido, fondo incrustado ni halos claros.

Archivos: `ART_ASSETS/tanda_03/fase_c/*.png` (8 RGBA) + `manifest.json`; fuentes RGB en `_source/`; pipeline en `ART_TOOLS/prepare_tanda_03_fase_c.py`; composición de control en `ART_EVIDENCE/tanda_03/fase_c_familias_QA.png` (**evidencia auxiliar de QA sobre checker: NO es captura de juego ni spritesheet definitivo**).

---

## 3. Continuidad de fotogramas: cómo se garantiza

El problema de la continuidad no es dibujar 8 poses parecidas, sino que **compartan coordenadas**. Se resolvió con un único lienzo canónico para los 8 assets:

- **560×1130 RGBA**, suelo en `y = 1130`, anclaje **bottom-center** (`x = 280`, `y = 1130`).
- Cada fuente se recorta, se escala con `factor = min(560/ancho, 1130/alto)` y se pega centrada en x con el borde inferior en `y = 1130`. Ningún asset lleva su propio bbox como lienzo.
- Consecuencia: el pie de apoyo, la escala corporal y el pivote propuesto son **idénticos** en las 7 familias erguidas; `MUERTE` queda en la franja inferior sin ser forzada a 1130 px de alto.

**Continuidad medida** (`manifest.json → continuity_qa`):

| Métrica | Resultado |
|---|---|
| Apoyo en el suelo | **8/8** |
| Dispersión de alturas de silueta en las 7 erguidas | **5 px** (1124–1129) |
| `MUERTE` horizontal y baja | **sí** (181 px de alto, 558 de ancho) |
| RGBA con alfa real (0…255) | **8/8** |
| Perímetros libres de fondo incrustado | **8/8** |
| Halos claros neutros | **0** |
| Agujeros internos de alfa reparados | **5** |
| Motas blancas del generador corregidas | **25** |
| Reflexiones horizontales usadas como entregable | **0** |

Orden de transición documentado: `IDLE → CAMINAR → CORRER → DISPARAR → DISPARO_CARGADO → HABILIDAD → DANO → MUERTE`. Es un **orden de diseño**, no una animación reproducida. La secuenciación real de fotogramas sigue **NO VERIFICADA**.

---

## 4. Desviaciones detectadas y cómo se resolvieron

| Defecto | Causa | Resolución |
|---|---|---|
| `CORRER` salió con **fondo blanco** y `HABILIDAD` con mancha blanca | El generador ignoró «PURE BLACK background» en 2 de 8 fuentes | **No** se aplicó el flood-fill de color fijo `(8,8,6)` de FASE A (habría tratado el blanco como personaje). El pipeline detecta el fondo oscuro por mediana de píxeles oscuros del perímetro y **además** elimina claros neutros (`min>150`, `max−min<35`) conectados al borde. Sin regenerar ni usar reflejos |
| Primera `MUERTE` era una figura de pie con los ojos cerrados | El prompt «collapsed/horizontal» fue ignorado | Única regeneración: lienzo apaisado 3:1, cabeza a la izquierda, botas a la derecha, silueta ≥3× más ancha que alta. Resultado 1792×592, inspeccionado y validado |
| 5 agujeros rectangulares de alfa en `IDLE`, `CORRER` (2), `DISPARAR`, `DANO` | Parches negros muy lisos en camiseta/pantalón clasificados como fondo por el flood-fill | `fill_internal_holes()`: componentes transparentes **que no tocan el borde** y ≤8000 px se rellenan con el **color original de la fuente** y alfa 255. Las aberturas reales (entre piernas, entre brazo y torso) sí tocan el exterior y se respetan |
| 25 motas blancas/grises (raya en la pierna de `CORRER`, etc.) | Artefactos del generador | `repair_white_specks()`: inpainting por propagación del color medio de vecinos opacos, solo para `min>210` y neutro. Los brillos de piel llegan a ~207 con tinte, y los dientes de `DANO` se verificaron visualmente **intactos** |

**Sobre las métricas descartadas:** un primer cierre usó `light_neutral_opaque_px` y `sum(c) > sum(bg)+120` como criterios y dio **NO CERRADA** por falsos positivos de piel, tatuajes y rim magenta/cian. Se sustituyeron por comprobaciones que sí distinguen un fondo incrustado: perímetro transparente (umbral α>128, excluyendo el borde inferior, que **es** el suelo) y halo exclusivamente **neutro** semitransparente. La inspección visual ampliada sobre checker confirmó los 8 assets limpios.

---

## 5. VERIFICADO / NO VERIFICADO

**VERIFICADO (estático, sobre los archivos entregados)**

- 8/8 RGBA con alfa real 0…255, sin fondo incrustado en el perímetro, sin halos claros neutros, sin reflejos.
- 8/8 con el mismo lienzo 560×1130, suelo en `y=1130`, anclaje bottom-center.
- Continuidad geométrica: 8/8 apoyados en el suelo, dispersión de alturas de 5 px, `MUERTE` horizontal.
- Identidad coherente y manos vacías en las 8 poses (inspección visual ampliada).
- Corrección de agujeros y motas sin dañar rostro, dientes, tatuajes ni rim.
- `py_compile` de los 4 scripts de T03 y `node --check ART_PACK/art_pack.js` sin errores; 0 caracteres CJK accidentales.
- Archivos protegidos intactos (SHA y `git diff --stat` sin salida).

**NO VERIFICADO (y no simulado)**

- Mapeo real de estas poses a `__HD_DATA` / `__HD_EXTRA` / `PLAYER_ASSET_MAP` / `ANATOMY_SPINE` dentro de `Pf()`.
- Comportamiento con `aimAngle` continuo, `facingLeft = cos(aimA) < 0` y `g.rotate(aimA)`.
- Escala en pantalla (`canonH = 95`), pivote real, `footGroundY = 0.9·r + bobY`, waist-split.
- Armas independientes (`it("back"/"front")`, `organicHandFrame()`, `wo()`), profundidad, impactos, muerte, mando.
- Secuenciación real de fotogramas, tiempos de animación, transiciones entre estados por `STATE_PRIORITIES`.
- Cualquier prueba manual en el juego. **No** se ha abierto el HTML en ejecución para esta fase y **no** se presenta la composición de QA como captura.

El conflicto estructural documentado en FASE A sigue vigente: el motor usa **2 espejos** y rotación continua de arma, no 8 orientaciones discretas. Estas 8 familias son **diseño**, todavía no están conectadas al render.

---

## 6. Siguiente paso (bloqueado)

La **FASE D** —sustitución/integración dentro de `Pf()` usando la interfaz real `__HD_DATA`/`__HD_EXTRA`/`PLAYER_ASSET_MAP`/`ANATOMY_SPINE`, con los 8 sectores de 45° (`E=0`, `SE=45`, `S=90`, `SO=135`, `O=180`, `NO=225`, `N=270`, `NE=315`)— **NO se ha iniciado**. Requiere autorización explícita: implica tocar el HTML activo y el render, algo que «sigue» no autoriza. Tampoco se ha creado un segundo sistema de animación.

Quedo a la espera de tu señal para abordar la FASE D o para cualquier corrección de estas 8 familias.
