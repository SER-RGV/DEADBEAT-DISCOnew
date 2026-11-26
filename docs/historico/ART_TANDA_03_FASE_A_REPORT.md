# Tanda 03 · FASE A · Reporte de ejecución

**Fecha:** 2026-11-03 · **Rama:** `arena/3f148aa7-deadbeat-disco` · **HEAD:** `897ff85dcbd937a9458d2300a5643de094374f27`
**Estado:** **FASE A APROBADA POR EL USUARIO el 2026-11-03** (mensaje: "apruebo"). FASE B desbloqueada.
Se han generado realmente las imágenes y la ficha; **no** se entrega únicamente análisis o un plan.

---

## 1. Protección (verificada antes de producir)

| Comprobación | Resultado |
|---|---|
| Sesión de continuación | Rama activa y escribible; el bloqueo `pr_merged` de la ventana anterior **no está vigente** |
| `git status` inicial | Limpio |
| `DEADBEAT_DISCO.ART.html` | SHA `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`, 13.381.028 B — **sin cambios** |
| `v9_t3_fase1b_cache_probe.html` y su `backups/*.ORIGINAL.html` | SHA `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` en ambos — **sin cambios** |
| Recursos T01 | 8 PNG presentes |
| Recursos T02 | 10 PNG + 5 logs JSON + manifiesto/documentos presentes |
| `main` / HTML / `art_pack.js` / `ART_BIBLE.md` / `ART_PRODUCTION_LOG.md` / `README.md` | **Sin modificaciones** (`git diff --stat` vacío para esos archivos) |

Nota de historial: este clon es shallow/squashed y el objeto `f574fc0` (commit de cierre de T02 en la rama anterior) no existe aquí. Los **archivos** de T02 sí persisten íntegros; no se reconstruyó el repo ni se exigió ese objeto.

---

## 2. Auditoría obligatoria (antes de generar imágenes)

Guardada en `ART_AUDIT/player_render_audit.json` (5.487 B). Inspección estática del HTML activo: `drawPlayer`, `ye.aimAngle`, `playerSkinChanged`, `collisionContract`, `ANATOMY_SPINE`, `pAnim`, `PLAYER_ASSET_MAP`, `ensureHdImg`, `__HD_GET`, armas `it("back"/"front")`, `wo()`, `Qf()`.

**Conclusión corregida:** el motor es **híbrido** — atlas pixel legacy `2.83.0-pixel` + **10 sprites HD** `player/*.png` + `ANATOMY_SPINE` + `DMO.playerAnim`/`pAnim` + `STATE_PRIORITIES` (16 estados) — pero **no tiene 8 orientaciones discretas**: `facingLeft` es un espejo `g.scale(-1,1)` y `g.rotate(aimA)` rota el arma. `playerSkinChanged:false` y `collisionContract:"original"` son flags de `audit()`, no gestores de skins/colisión. No se inventaron `DMO_PLAYER`, `animFrame`, `frameT` ni un segundo sistema de animación.

El sprite idle actual (`player_idle_00.png`, 36×96) es un personaje de **camisa azul clara sin tatuajes visibles**: no corresponde a la referencia oficial, lo que confirma la necesidad del rediseño.

---

## 3. Producción real

| Entregable | Archivo |
|---|---|
| 1. Imagen maestra de cuerpo entero | `ART_ASSETS/tanda_03/master_full_body.png` (364×1130 RGBA) |
| 2. Vista frontal isométrica | `ART_ASSETS/tanda_03/view_front.png` (363×1122 RGBA) |
| 3. Vista lateral | `ART_ASSETS/tanda_03/view_side.png` (233×1128 RGBA) |
| 4. Vista posterior | `ART_ASSETS/tanda_03/view_back.png` (367×1195 RGBA) |
| 5. Ficha de identidad visual | `ART_TANDA_03_FASE_A_FICHA_IDENTIDAD.md` |
| 6. Análisis de compatibilidad conceptual | `ART_TANDA_03_FASE_A_COMPATIBILIDAD.md` |
| Metadatos / QA / SHA-256 | `ART_ASSETS/tanda_03/manifest.json` |

Apoyo: `ART_REFERENCES/REF_04_protagonista_banner.png` (823×212, copia de la referencia adjunta), `ART_TOOLS/prepare_tanda_03.py`, `ART_TOOLS/qa/calibrate_tanda_03_alpha.py`.

**Iteraciones de producción documentadas:**
- La primera generación devolvió un **turnaround de 7 figuras**, no una imagen maestra única: se conservó como `_source/DISCARDED_turnaround_draft.png` y se regeneró una sola figura.
- La primera vista lateral traía **botas con cordones** incoherentes con la maestra: se regeneró con botas lisas.
- El intento de forzar una frontal recta a 0° fue rechazado por el generador: `view_front.png` es una **frontal isométrica** (admitida por el pliego), casi coincidente en ángulo con la maestra. Queda registrado en la ficha como comprobación de identidad, no como ángulo nuevo.
- El fondo negro incrustado se eliminó con un pipeline calibrado: flood-fill estricto + envoltura de proximidad + banda suave **sin des-premultiplicación**. Dos intentos previos (region-growing acumulativo y umbral alto) agujereaban pelo/camiseta/pantalón o producían halos y se descartaron. La calibración barren 27 combinaciones y fija `BG_TOL=10`, `STRONG=45`, `NEAR_BLUR=50`, `NEAR_THR=1`.

---

## 4. QA técnica de los PNG

| Métrica | master | frontal | lateral | posterior |
|---|---|---|---|---|
| Modo | RGBA | RGBA | RGBA | RGBA |
| Alfa | 0–255 | 0–255 | 0–255 | 0–255 |
| Píxeles de borde suave | 300 | 474 | 229 | 99 |
| **Halos claros** | **0** | **0** | **0** | **0** |
| Puntos de control de interior (pelo/camiseta/pantalón/botas) | 5/5 | 5/5 | 5/5 | 5/5 |
| Puntos de control de fondo (perímetro + interior) | 10/10 | 10/10 | 10/10 | 10/10 |

`python3 -m py_compile` de ambos scripts y `node --check ART_PACK/art_pack.js`: OK. CJK residual en los documentos y en el manifest: 0. Sin `__pycache__` en el árbol.

**Desviación registrada para la aprobación:** los acentos de las láminas son versiones **desaturadas** de la paleta (magenta medio ≈`#733859`, cian ≈`#608d87`; oro ausente), no los hex literales `#ff2d95` / `#38bdf8` / `#c084fc`. Se midió y se documentó en la ficha; **NO VERIFICADO** que satisfaga el requisito de "paleta exacta".

---

## 5. Separación VERIFICADO / NO VERIFICADO

**VERIFICADO**
- Identidad reconocible frente a la referencia en las 4 láminas: cabello negro voluminoso despeinado, tank top negro sin mangas, tatuajes ornamentales en ambos brazos, complexión delgada, rostro de proporciones realistas, actitud desafiante, luz magenta/cian.
- Cuerpo entero de pie, postura neutral, brazos y piernas separados, manos vacías, sin arma, armadura ni accesorios inventados.
- Sin logotipo, zorro coronado, textos, escenario, multitud ni postura sentada. Sin pixel art, dithering, ruido, fondo de color sólido incrustado ni halos.
- Coherencia de vestuario, tatuajes, calzado y proporciones entre las 4 vistas.
- Auditoría estática del render y existencia de una interfaz real de sustitución (`__HD_DATA` / `__HD_EXTRA`).
- Integridad de HTML activo, backup, `main` y recursos T01/T02.

**NO VERIFICADO**
- Cualquier comportamiento **en el juego real**: escala en pantalla, pivote, apoyo de pies, orientación por movimiento, cambios de animación, continuidad de fotogramas, profundidad, compatibilidad con armas, impactos, muerte y mando. No se han generado capturas ni logs de juego en FASE A.
- Legibilidad de tatuajes/mechones al reducir a 31–74 px de ancho / 96 px de alto.
- Coincidencia de las manos con `handDom=[32,5,53]` y del arma superpuesta con `muzzleWorld`.
- Compatibilidad de 8 orientaciones con un motor que solo tiene 2 espejos + rotación continua del arma.
- Literalidad de la paleta exacta.

---

## 6. Lo que **NO** se ha hecho

- No se han generado las **8 orientaciones jugables** (S, SO, O, NO, N, NE, E, SE).
- No se han generado las **8 familias de animación** ni ningún spritesheet definitivo.
- No se ha modificado `DEADBEAT_DISCO.ART.html`, su backup, `main`, `ART_PACK/art_pack.js`, `ART_BIBLE.md`, `ART_PRODUCTION_LOG.md` ni `README.md`.
- No se ha sustituido el render procedural, no se ha creado un segundo sistema de animación, no se han tocado mecánicas, armas, estadísticas, IA, Director, progresión, colisiones, controles, HUD, combate, guardado, economía, balance, oleadas ni transiciones.
- No se han regenerado T01/T02, no se ha clonado encima del workspace, no se ha reconstruido el repo ni se han eliminado archivos del proyecto.
- No se ha hecho commit ni push de T03: los archivos quedan en el worktree para revisión.

---

## 7. DETENERSE AQUÍ

FASE A completa y a la espera de **aprobación explícita** del diseño maestro. No se pasará a la FASE B (8 orientaciones), ni a la C (8 animaciones), ni a la D (integración en el controlador real) ni a la validación con juego real sin esa aprobación. La aprobación debe cubrir también los dos puntos abiertos: la interpretación desaturada de la paleta y el hecho de que `view_front.png` repite el ángulo 3/4 de la maestra.

---

## 8. Aprobación (2026-11-03)

El usuario aprobó explícitamente el diseño maestro con el mensaje **"apruebo"**. Quedan por tanto aceptados, sin corrección solicitada, los dos puntos abiertos registrados en la ficha: la interpretación desaturada de los acentos de paleta y el hecho de que `view_front.png` repite el ángulo 3/4 de la maestra.

La aprobación **desbloquea únicamente la FASE B** (8 orientaciones isométricas). No autoriza por sí misma la integración en el HTML, la sustitución del render, cambios de mecánicas ni la ejecución adelantada de las fases C y D.
