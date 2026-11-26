# Tanda 03 · FASE B · 8 orientaciones isométricas — **CERRADA**

**Fecha:** 2026-11-03 · **Rama:** `arena/3f148aa7-deadbeat-disco` · **HEAD:** `897ff85dcbd937a9458d2300a5643de094374f27`
**Disparador:** FASE A aprobada por el usuario («apruebo»); continuación solicitada («continuaç»).
**Estado:** **FASE B CERRADA.** 8 orientaciones únicas, misma identidad y escala, sin reflejos horizontales ni ángulos duplicados. **NO integradas en el juego.**

La fase se entregó inicialmente como **PARCIAL** (6 ángulos únicos, 2 duplicados, 1 postura desviada) por el límite de 10 generaciones de imagen del turno. En el turno de continuación se generaron **9 candidatos** más, se seleccionaron los válidos con métricas objetivas y se resolvieron los tres defectos. Este documento sustituye al reporte parcial anterior.

---

## 1. Protección

| Comprobación | Resultado |
|---|---|
| `DEADBEAT_DISCO.ART.html` | SHA `f231cfc7e2c634095d767e321d71155d1a9a9c6c661a008274e5989d97230723`, 13.381.028 B — **sin cambios** |
| `v9_t3_fase1b_cache_probe.html` + `backups/*.ORIGINAL.html` | SHA `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` — **sin cambios** |
| `main`, `ART_PACK/art_pack.js`, `ART_BIBLE.md`, `ART_PRODUCTION_LOG.md`, `README.md` | **sin modificaciones** |
| T01 / T02 / FASE A | 8 PNG / 10 PNG + 5 logs / 4 láminas + ficha + compatibilidad, todo conservado |

No se ha integrado nada en el HTML, no se ha tocado el render, no se han cambiado mecánicas, no se han creado animaciones ni spritesheet y no se ha hecho commit ni push de T03.

---

## 2. Convención de ángulos (para la FASE D)

`aimAngle = atan2(dy, dx)` en coordenadas de canvas: `+x` = este (derecha en pantalla), `+y` = sur (hacia la cámara). Ocho sectores de 45°. En el motor actual `facingLeft = cos(aimA) < 0`.

| Clave | Grados | Ángulo | Tamaño RGBA | `head_bias` | Estado |
|---|---|---|---|---|---|
| `E` | 0 | Perfil hacia el este (derecha) | 234×1130 | +0,0537 | **VERIFICADO** |
| `SE` | 45 | 3/4 frontal sureste, hombro derecho cercano | 256×1130 | +0,0535 | **VERIFICADO** |
| `S` | 90 | Frontal recta simétrica, ambos ojos | 338×1130 | −0,0068 | **VERIFICADO** |
| `SO` | 135 | 3/4 frontal suroeste, hombro izquierdo cercano | 363×1130 | +0,0308 | **VERIFICADO** |
| `O` | 180 | Perfil hacia el oeste (izquierda) | 225×1130 | −0,0190 | **VERIFICADO** |
| `NO` | 225 | 3/4 espaldas noroeste, rostro oculto | 342×1130 | −0,0011 | **VERIFICADO** |
| `N` | 270 | Espalda recta simétrica, rostro oculto | 347×1130 | +0,0023 | **VERIFICADO** |
| `NE` | 315 | 3/4 espaldas noreste, rostro oculto | 314×1130 | +0,0252 | **VERIFICADO** |

La secuencia **N → NE → E → SE → S → SO → O → NO** es un giro completo y coherente; los anchos siguen la perspectiva (perfiles 225–234 px, frontales 338–363 px). Todas las vistas están normalizadas a **1130 px de alto** (la altura de la maestra de FASE A) con pivote bottom-center y el pie de apoyo en el borde inferior.

Archivos: `ART_ASSETS/tanda_03/fase_b/{E,SE,S,SO,O,NO,N,NE}.png`; fuentes RGB en `_source/`; `manifest.json`; preparación en `ART_TOOLS/prepare_tanda_03_fase_b.py`; composición de control en `ART_EVIDENCE/tanda_03/fase_b_orientaciones_QA.png` (**evidencia de QA, no spritesheet ni entregable jugable**). Los borradores de selección quedan en `fase_b/_candidates/` y **no cuentan como assets finales**.

---

## 3. Resolución de los tres defectos del turno anterior

| Defecto | Causa | Resolución | Evidencia |
|---|---|---|---|
| `E` y `O` repetían el perfil este | Al regenerar `E` se usó `O.png` como referencia y el modelo copió su orientación | Se generaron 3 candidatos (`O1/O2/O3`) **sin vistas sesgadas como referencia** (solo `S`/`N`, banner/`view_back`, `NO`/`S`). Se adoptó **O2**: perfil oeste real, con tatuajes, mechón y pies dibujados de forma independiente | IoU directo `E`/`O`: **0,9569 → 0,5390**; reflejo 0,6205 |
| `SE` y `SO` repetían el 3/4 frontal izquierdo | El generador ignoró el giro a la derecha en el prompt de `SE` | 3 candidatos (`SE1/SE2/SE3`); se adoptó **SE2**, 3/4 frontal hacia la derecha con hombro derecho cercano y brazo/tatuaje distintos | IoU directo `SE`/`SO`: **0,8439 → 0,4972**; reflejo 0,5108 |
| `NE` con zancada y luego duplicado de `NO` | `NE1` corrigió la postura pero se volvió casi idéntico a `NO` (IoU 0,9028) | Se generaron `NE2`/`NE3` con giro derecho forzado y se adoptó **NE2**: 3/4 espaldas noreste, piernas paralelas, sin artefactos | IoU `NO`/`NE`: 0,9028 → **0,6228**; reflejo 0,6512 |

`NE1` tenía además un residuo de fondo con distancia 11 al color de fondo; se comprobó que `bg_tol=14` lo eliminaba sin agujerear el cabello, pero al adoptar `NE2` (sin artefactos) se volvió al `bg_tol=10` calibrado en FASE A. No se usó ningún reflejo horizontal para rellenar ángulos.

---

## 4. QA final

| Métrica | Resultado |
|---|---|
| Assets finales | **8** (límite 10 respetado) |
| Modo / alfa | 8/8 RGBA, alfa 0–255 |
| Escala | 8/8 a 1130 px, LANCZOS, mismo pivote y pie de apoyo |
| Fondo / halos | 8/8 esquinas transparentes, **0 halos claros** |
| Centro del torso opaco | 8/8 |
| Pares comparados | **28** (todas las combinaciones) |
| Reflejos horizontales puros | **0** (umbral IoU > 0,90 contra reflejo) |
| Duplicados de ángulo | **0** (umbral IoU directo > 0,90) |
| Pares opuestos | `E/O` 0,5390 / 0,6205 · `SE/SO` 0,4972 / 0,5108 · `NO/NE` 0,6228 / 0,6512 (directo / reflejo) |
| `head_bias` | `E` +0,0537 vs `O` −0,0190 y `NE` +0,0252 vs `NO` −0,0011: signos contrarios. Señal **auxiliar**, poco sensible en 3/4 sutiles (`SE`/`SO` +0,0535 / +0,0308), por lo que **no** se usa como criterio de cierre |
| Validación de código | `py_compile` de los 3 scripts y `node --check ART_PACK/art_pack.js`: OK |

La evidencia principal de que los ángulos son opuestos y no reflejos es la **inspección visual ampliada** de los pares (`E`/`O2`, `SO`/`SE2`, `NO`/`NE2`) más el IoU directo/reflejo. La diferencia RGB media es poco discriminativa por la dominancia de negros; se conserva solo como dato auxiliar en el manifest.

---

## 5. Identidad y dirección artística

**VERIFICADO en las 8 vistas:** cabello negro voluminoso y despeinado con mechones irregulares; tank top negro sin mangas; tatuajes ornamentales circulares y paisley en ambos brazos con disposiciones distintas según el ángulo; complexión delgada y estilizada; rostro de proporciones realistas en las vistas frontales y de perfil; pantalón negro con ribete magenta; botas lisas sin cordones; manos vacías sin arma; actitud desafiante; luz magenta/cian sobre negros profundos; contornos limpios; sin pixel art, dithering, ruido, fondo incrustado ni halos. Rostro completamente ausente en `N`, `NE` y `NO`. Sin logotipo, zorro coronado, textos, escenario, armadura ni accesorios inventados.

Las 8 vistas comparten postura idle neutral (excepto ligeras variaciones de apoyo de pies propias de la perspectiva), y las diferencias de hombros, brazos, piernas, cabello y tatuajes son reales, no espejos.

---

## 6. Separación VERIFICADO / NO VERIFICADO

**VERIFICADO**
- 8 orientaciones únicas con identidad, proporción y escala coherentes; 0 reflejos y 0 duplicados.
- Calidad técnica de los PNG (alfa, halos, normalización, pivote propuesto).
- Protección de HTML activo, backup, `main` y todos los recursos anteriores.
- Auditoría estática del render (FASE A) y existencia de `__HD_DATA` / `__HD_EXTRA` como interfaz de sustitución.

**NO VERIFICADO**
- Cualquier comportamiento **en el juego real**: mapeo de `aimAngle` a 8 sectores, cambio de orientación por movimiento, movimiento diagonal, compatibilidad con armas, pivote real con `ANATOMY_SPINE`, orden de profundidad, animaciones, impactos, muerte y mando. **No hay capturas ni logs de juego en FASE B.**
- Legibilidad de tatuajes y mechones al reducir a 36–74 px de ancho / 96 px de alto.
- Que el motor (2 espejos + rotación continua del arma) acepte 8 variantes sin modificar `Pf()`; eso es materia de la FASE D.
- Literalidad de los hex de la paleta (desviación ya registrada y aceptada en la aprobación de FASE A).

---

## 7. Lo que **NO** se ha hecho

- No se han generado las **8 familias de animación** (FASE C) ni ningún spritesheet definitivo.
- No se ha examinado ni adaptado el controlador de animaciones (FASE D).
- No se ha modificado `DEADBEAT_DISCO.ART.html`, su backup, `main`, `art_pack.js`, biblia visual, log de producción ni README.
- No se ha sustituido el render, no se ha creado un segundo sistema de animación y no se han tocado mecánicas, armas, estadísticas, IA, Director, progresión, colisiones, controles, HUD, combate, guardado, economía, balance, oleadas ni transiciones.
- No se han usado reflejos horizontales como entregables.
- No se ha hecho commit ni push de T03.

---

## 8. Siguiente paso

FASE B cerrada. Queda a la espera de tu señal para abordar la **FASE C** (8 familias IDLE, CAMINAR, CORRER, DISPARAR, DISPARO_CARGADO, HABILIDAD, DAÑO, MUERTE, máximo 10 assets por tanda, coherencia anatómica y continuidad de fotogramas) y, después, la **FASE D** (adaptación al controlador real) y la validación con juego real. No se adelantarán fases sin tu confirmación.
