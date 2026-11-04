# AUDITORÍA VISUAL DEL HUB (T01–T08) — Modificación prioritaria

**Fecha:** 2026-11-04 · **Rama:** `arena/109fe45c-deadbeat-disconew` · **HEAD:** `3a22d5b`
**Estado:** `AUDITORÍA COMPLETADA · CORRECCIÓN P1/P2 PROBADA · P3–P5 EN PROPUESTA, SIN IMPLEMENTAR`
**Juego sin modificar:** el HTML activo fue restaurado bit a bit tras la prueba (SHA-256 `3e82dc77b9fd4c59d01e016628b204b1b07042c7f8f9085de3433141e5429011`, idéntico al publicado). `ART_PACK/art_pack.js` intacto.

> **Nota de estado:** la TANDA 09 ya estaba publicada en esta sesión (`3a22d5b`). Su flag `window.__DDM_HUB_T09 = false` se usó **desde el arranque** en toda la auditoría, de modo que lo medido es estrictamente T01–T08. Las 4 posturas de T09 no se dibujan ni sus rutinas se ejecutan en ninguna captura. No se ha generado **ningún asset nuevo** en esta fase.

---

## 1. Método obligatorio (pasos 1–7)

| Paso | Ejecución | Evidencia |
|---|---|---|
| 1 · Capturar desde diferentes posiciones | 16 posiciones de cámara real | `ART_EVIDENCE/hub/legibilidad/sweep_*.jpg`, `sweep_sheet` |
| 2 · Zonas saturadas | Densidad de props por zona + energía de borde | `matriz_incidencias.json`, `metricas_correccion.json` |
| 3 · Localizar niebla y fuentes | A/B de 7 variantes de capa en 3 posiciones | `ab_*.jpg`, `metricas_ab.json`, `auditoria_legibilidad.json` |
| 4 · Assets mal orientados | Revisión individual con cámara real | `sweep_03/05/07/10`, matriz S-07…S-09, S-14 |
| 5 · Relación grieta ↔ descenso | `startCampaignFromHub(0)` y 8 fotogramas de transición | `descenso_*.jpg`, `auditoria_descenso.json` |
| 6 · Matriz de incidencias | **79 filas** con las 6 clasificaciones pedidas | `matriz_incidencias.json` |
| 7 · Proponer correcciones mínimas | Este documento + `ART_PROPUESTA_CORRECCION_PRECIPICIO.md` | — |

**Después:** prueba visual de corrección (§6), realizada en copia temporal con módulo reversible y restauración verificada por SHA-256.

---

## 2. Saturación visual

**Densidad de props por zona:** A 20 · B 8 · C 6 · D 10 · E 14 · F 4 (62 props).

### Hallazgos

- **El suelo es la principal fuente de saturación, no los props.** El patrón art-déco de abanicos dorados se repite con la misma densidad y el mismo contraste sobre pista, corredores, zona de estaciones **y franja sur del acantilado**. No hay jerarquía de planos: todo compite con todo (S-01, S-16).
- **Repeticiones sin información:** `hub_decor_t06_06` y `hub_decor_t06_07` aparecen **3 veces cada uno** (y780 / y1160 / y1540); `hub_decor_t06_10` está a **10 u** de `hub_decor_t06_08` en el mismo eje central; `hub_decor_planter_v02`, `hub_decor_bench_v02`, `hub_decor_speaker_w/e` duplican elementos ya presentes.
- **Solapamientos de texto:** en el noroeste, «LA DISCOTECA / DJ STAGE» se superpone a «CABINA · VIRGILIO»; en el sur, «GRIETA DE DESCENSO» se superpone a «0/8 … DESCENSO» y a la flecha de interacción (S-06).
- **Competencia con el acceso:** el medallón y los anillos de la pista dominan el centro, pero el patrón del suelo llega con el mismo brillo hasta la grieta, de modo que el acceso al descenso no destaca.
- **Zona más densa:** A (20 props) y E (14). La franja norte y=330–430 concentra 10 props decorativos en 100 u de altura.
- **Dos props decorativos por debajo del acantilado** (`hub_decor_t06_06_rep2`, `…07_rep2`, y=1540): decoración flotando en el vacío.

### Clasificación (79 filas)

| Clasificación | Nº | Criterio |
|---|---:|---|
| ESENCIAL | 6 | Medallón/anillos, cabina DJ, pilones del acceso, aura de la grieta |
| FUNCIONAL | 21 | 6 estaciones, mostradores, sofás VIP, altavoces funcionales, 10 NPC, narrativos |
| AMBIENTAL | 29 | Decoración T05/T06 con aporte de atmósfera; conservar |
| REDUNDANTE | 8 | Instancias repetidas o duplicados: **ocultar, no borrar** |
| MAL UBICADO | 8 | Eje central, sur del borde, plataformas planas |
| PENDIENTE DE CORREGIR | 7 | Niebla, patrón, etiquetas, borde, grieta, cutaway, jerarquía |

**No se elimina ningún asset.** Las correcciones propuestas son de **visibilidad** (`prop.hidden`, ya contemplado por `Lc`), escala, anclaje y contraste, todas reversibles.

---

## 3. Auditoría de niebla e iluminación

### Fuentes candidatas y medición A/B

`DMO_ATMOS` v9.2 tiene **dos capas apiladas** sobre el canvas del juego:

| Capa | Blend | z-index | Opacidad real | Config |
|---|---|---|---|---|
| `#ilt-atmos-bloom` | `screen` | 3 | **CSS `opacity: 1`** | `CFG.bloom = 1.0`, `bloomScale 6`, `bloomEvery 3` (degradado) |
| `#ilt-atmos-vig` | `normal` | 4 | CSS `opacity: 1` | `CFG.vignette = 0.34` |
| grade / grain | dentro del bloom | — | — | `grade 1.0`, `grain 0.016` |

**Hallazgo técnico:** `CFG.bloom` se documenta como «screen-layer opacity», pero el código sólo lo usa como **interruptor booleano** (`if (CFG.bloom > 0)`). La atenuación real depende del `style.opacity` del canvas, que nadie ajusta. De ahí el velo permanente.

**Mediciones sobre recorte central (120,150)–(1160,780), media de luminancia / contraste / energía de borde:**

| Variante (centro) | Media | Contraste | Bordes | Oscuro % |
|---|---:|---:|---:|---:|
| **base** | 69,97 | 48,81 | 39,56 | 48,11 |
| `sin_atmos` | **55,86** | 49,36 | **40,72** | 61,58 |
| `bloom → 0.35` | 60,67 | 48,93 | 40,38 | 57,16 |
| `sin grade/grain` | 69,49 | 48,74 | 39,55 | 48,44 |
| `vignette → 0.40` | 69,65 | 48,73 | 39,62 | 48,21 |
| `sin T08` | 70,40 | 48,69 | 39,52 | 47,46 |
| combinado legible | 60,08 | 48,99 | 40,40 | 57,76 |

### Determinación

1. **La niebla procede de `DMO_ATMOS`, capa bloom en `screen` a opacidad 1.00.** Aporta **+14 de luminancia** uniforme sin añadir detalle: al desactivarla suben contraste (+0,55) y bordes (+1,16). Es un velo, no iluminación direccional.
2. **No procede de** `grade`/`grain` (Δ ≈ 0,5), ni del vignette (Δ ≈ 0,3, sólo bordes por diseño), ni de T08 (Δ ≈ 0,4 en el centro).
3. **El humo/ceniza/brasas de T08 no es niebla:** sólo se dibuja cuando el cutaway es visible (sur) y representa **profundidad**. Con `T08=false` el centro no cambia. No confundir.
4. **Relación con la cámara:** las capas son **overlay de pantalla**, fijas al viewport, no al mundo. No siguen la cámara y por eso el velo es uniforme en las 16 posiciones: no refuerza la separación entre planos, la aplana.
5. **Solapamiento con sprites:** el bloom toma una copia del canvas completo a 1/3 de resolución (degradado por FPS), la pasa por luminancia² + blur y la compone con `screen` **encima de NPC y arquitectura**, elevando también sus sombras.
6. **Superposiciones ambientales:** no hay niebla adicional en el HUB. `club-haze53` pertenece sólo al menú (`#menu-scene53`). Los gradientes radiales de `floorDropAnim`, cine y `NARR_drawScreen` son de transición/cinemática, no de exploración.

**Conclusión:** la atmósfera debe atenuarse, no eliminarse. Con bloom 0,30 se conserva el resplandor del neón y se recupera el negro de fondo.

---

## 4. Orientación y perspectiva (cámara real, sin tocarla)

| Elemento | Incidencia | Corrección mínima propuesta |
|---|---|---|
| Cabina / escenario DJ (norte) | Rectángulo plano inclinado apoyado en el suelo, sin anclaje vertical ni sombra de contacto (S-07) | Anclar al muro norte, sombra de contacto, corregir escala. **Sin estirar** la ilustración |
| Abanico/estela del arsenal (D) | Gran abanico dorado plano que cruza suelo y mostrador; parece pegatina (S-08) | Reducir escala, anclar al mostrador, añadir oclusión |
| Sofás VIP, altares arcade/sellos | Marcos frontales sobre suelo en perspectiva; escala discutible (S-09) | Revisión individual de pivote y orientación; corregir sólo lo confirmado |
| Línea magenta horizontal del sur | Límite recto de alto contraste: separa HUB y abismo como dos capas pegadas (S-14) | Sustituir por labio rocoso irregular con sombra proyectada |
| Paredes P1 / columnas / rocas T08 | Correctas en el cutaway, pero el patrón del suelo las atraviesa durante el descenso (S-13) | Recortar el suelo en la abertura; no modificar los assets |
| Decoración T06 en y=1540 | Por debajo del acantilado (S-15) | Ocultar o reubicar por encima del labio |

**No se acepta ningún asset como pegatina plana.** No se ha modificado la cámara global (prohibido) ni se ha estirado ninguna ilustración.

---

## 5. El acantilado y la grieta (hallazgo crítico)

### Lo que el jugador ve hoy (`sweep_10_borde_acantilado.jpg`)

- El patrón de suelo **continúa sin interrupción** hasta una línea magenta horizontal (pantalla y≈710) y más allá.
- La «grieta» es un **decal de 330 px** (`hub_abyss_stair_crack`) en (1250,1436) con un icono «III / DESCENSO», relámpagos y un **prompt HUD**.
- Bajo la línea magenta hay una **franja oscura de ~185 px** con rocas y lava: el cutaway de T08.
- La cámara está **fijada en y≈1198** (las peticiones y=1420 no la mueven). No se puede modificar.

**No se identifica:** dónde termina el terreno transitable · dónde empieza el borde · qué profundidad hay debajo · dónde está la abertura · qué recorrido baja.

### Relación con el descenso (paso 5)

`startCampaignFromHub(0)` **funciona**: `TRANSITION` → 94 fotogramas de descenso T07 → T08 `winH 84 → 374` → `CAMPAIGN_ROOM`. 0 `pageerror`, sin segunda transición.

Pero en `descenso_0500.jpg` se ve que:

- El abismo se abre como una **ventana rectangular** debajo de un suelo que sigue intacto.
- El patrón dorado continúa **a ambos lados** de la ventana: la geografía no se rompe.
- La grieta/decal queda **encima** de la ventana, sin conexión con sus paredes.

> **Conclusión obligatoria:** el acceso actual (`lift`, 1250,1365, r142) es un **radio lógico + HUD** y **NO está físicamente conectado a la grieta**. La grieta es decorativa; la transición es correcta pero nace de otro sitio.
>
> Por la instrucción «*Si el acceso actual no está físicamente conectado a la grieta, presenta una propuesta de corrección antes de modificarlo*», **no se ha modificado nada**. La propuesta está en `ART_PROPUESTA_CORRECCION_PRECIPICIO.md`.

### Jerarquía visual actual

No existe: suelo, decoración, NPC, arquitectura y abismo comparten contraste y densidad de línea. La discoteca destaca por el medallón, pero el precipicio **no es reconocible** y la decoración compite con el acceso.

**Criterio de aprobación:** hoy una persona que entra por primera vez reconoce la discoteca, pero **necesitaría explicación** para saber dónde está el precipicio y que la grieta es la entrada al infierno → **composición NO resuelta**.

---

## 6. Prueba visual de corrección (P1/P2)

Realizada en **copia temporal** del HTML con un módulo reversible (`propuesta_modulo_reversible.js.txt`), capturando ANTES/DESPUÉS en la **misma página**, sin recarga, y restaurando el HTML por SHA-256 exacto al terminar.

**Cambios aplicados (sólo en la prueba):**

- `#ilt-atmos-bloom` `opacity 1.00 → 0.30`
- `#ilt-atmos-vig` `opacity 1.00 → 0.45`
- `DMO_ATMOS.config.grade 1.0 → 0.35`, `grain 0.016 → 0.006`
- **9 props** REDUNDANTES/MAL UBICADOS ocultados con `prop.hidden` (ninguno eliminado)

**Resultados (`metricas_correccion.json`):**

| Zona | Δ luminancia media | Δ contraste | Δ bordes |
|---|---:|---:|---:|
| centro | −9,99 | +0,26 | +0,94 |
| norte | −8,83 | +0,46 | +0,22 |
| noroeste | −11,71 | +0,52 | +1,05 |
| este | −9,16 | +0,43 | +0,38 |
| sur | −8,22 | +0,32 | +0,68 |
| borde | −8,71 | +0,37 | +0,52 |

- **0 `pageerror`**, 0 warnings, 62 props antes y después.
- **Reversibilidad verificada:** `setEnabled(false)` devolvió `hidden` de 9 → 0 y restauró opacity/grade/grain; diff de píxel antes↔restaurado 3,63 en centro (animación de fondo). En sur 15,99 por humo/brasas animados de T08, no por estado residual.
- El juego publicado **no conserva ninguno de estos cambios**.

**Límite honesto:** esta prueba corrige **niebla y redundancia**, no la saturación del patrón de suelo (S-01), ni la orientación (P3), ni el precipicio (P4), ni la conexión grieta-descenso (P5). Por el orden de prioridades, **no se avanza** a esas fases sin propuesta aprobada.

---

## 7. Orden de prioridades y estado

| Prioridad | Estado |
|---|---|
| 1 · Legibilidad | **Parcial**: niebla y redundancia corregidas y probadas; saturación del patrón y jerarquía siguen `PENDIENTE DE CORREGIR` |
| 2 · Niebla y saturación | **Niebla resuelta y medida**; saturación parcial (9 props), patrón pendiente |
| 3 · Perspectiva y orientación | **En propuesta**, sin implementar |
| 4 · Grieta geográfica y jugable | **En propuesta**, sin implementar (bloqueo crítico: no hay borde legible) |
| 5 · Transición de descenso | **Auditada y funcional**; conexión visual pendiente de la propuesta |
| 6 · Rutinas NPC T09 | **Ya publicadas**, desactivadas durante la auditoría; no se amplían hasta resolver P1–P5 |

**No se ha avanzado a P3–P5 porque P1/P4 siguen teniendo problemas críticos.**

---

## 8. Protección y límites

- T01–T08 **sin modificar**: `git diff` del HTML y de `art_pack.js` vacío; SHA-256 del HTML idéntico al publicado.
- Sin sistemas funcionales eliminados, sin cambios de cámara, motor, Director, combate, progresión ni audio.
- Sin assets nuevos generados. Sin sprites, mobiliario ni arquitectura añadidos.
- Toda corrección probada es reversible por `window.__DDM_HUB_LEGIBILIDAD` (módulo propuesto, aún no aplicado) y por el flag ya existente `__DDM_HUB_T09`.
- **NO VERIFICADO:** vídeo continuo, mando físico, audio audible, coste real de frame, regresión formal en hardware real; heredados de T02/T03.
- **Discrepancias heredadas sin corregir:** informe T07 dice 12 capturas (hay 11); informe T08 dice 52 evidencias (hay 53).

---

## 9. Evidencias

`ART_EVIDENCE/hub/legibilidad/`: 16 `sweep_*.jpg` · 21 `ab_*.jpg` · 12 `prueba_*.jpg` · 9 `descenso_*.jpg` · `auditoria_legibilidad.json`, `auditoria_descenso.json`, `matriz_incidencias.json`, `metricas_ab.json`, `metricas_correccion.json`, `prueba_correccion.json`, `propuesta_modulo_reversible.js.txt`.

Arnés: `ART_TOOLS/qa/hub_legibilidad_audit.js`, `hub_legibilidad_descenso.js`, `hub_legibilidad_prueba_visual.js`.

**Siguiente paso (histórico):** revisar `ART_PROPUESTA_CORRECCION_PRECIPICIO.md` y autorizar (o ajustar) las correcciones mínimas de P3–P5.

---

## 10. ACTUALIZACIÓN · 2026-11-04 — corrección A–F autorizada y aplicada

El usuario autorizó **A–F completos** en orden, con parada ante problemas críticos, y decidió mantener **T09 desactivada** (`__DDM_HUB_T09 = false`). Este documento conserva la auditoría original (estado `3a22d5b`, juego sin modificar) como línea base; la ejecución y sus resultados están en **`ART_CORRECCION_LEGIBILIDAD_HUB.md`** y en `ART_EVIDENCE/hub/correccion/`.

| Prioridad | Estado tras la corrección |
|---|---|
| 1 · Legibilidad | **RESUELTA** — A/B en 6 zonas, Δmedia −7,60…−13,50, separación de planos +32…33 % en sur/borde |
| 2 · Niebla y saturación | **RESUELTA** — bloom 0,30, vig 0,45, grade 0,35, grain 0,006; velo de suelo; 9 props ocultos (reversibles) |
| 3 · Perspectiva y orientación | **PARCIALMENTE RESUELTA** — sombras de contacto, oclusión del abanico (sin reescalar T04), línea recta magenta eliminada (1089→0 px) |
| 4 · Grieta geográfica y jugable | **RESUELTA** — final del terreno, labio irregular con grosor, abertura, escalera descendente y luz inferior |
| 5 · Transición de descenso | **RESUELTA VISUALMENTE** — `clipCutaway` hace crecer T08 desde la boca; `startCampaignFromHub(0)` intacta, llega a `CAMPAIGN_ROOM` |
| 6 · Rutinas NPC T09 | **NO AMPLIADAS**, desactivadas por decisión del usuario |

**QA:** 18/18 `APROBADO`, 0 `FALLIDO`, 0 `pageerror`. **Permanecen `NO VERIFICADO`:** prueba con personas que entren por primera vez sin documentación, vídeo continuo, mando físico, audio audible, coste real de fotograma, rendimiento sostenido >100 s y regresión en hardware real. Las discrepancias documentales heredadas (T07 «12 capturas» / hay 11; T08 «52 evidencias» / hay 53) siguen sin corregir.
