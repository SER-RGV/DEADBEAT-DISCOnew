# RESOLUCIÓN DE DECISIONES — FASE 01
# DEADBEAT DISCO — RECONSTRUCCIÓN INTEGRAL

**Fecha:** 2026-11-12  
**Rama:** `arena/719117d9-deadbeat-disconew`  
**Autoridad:** Respuestas del autor a las 6 decisiones bloqueantes de `FASE_01_AUDITORIA_INTEGRAL.md`.

---

## D-01 — ¿Es la Biblia Maestra v1.0 el lore vigente?

> **Pregunta:** La Biblia se declara «base de trabajo para aprobación del autor» y deja seis propuestas sin aprobar (§41), entre ellas los nombres de las nueve pistas. ¿Es el lore vigente?

**Resolución: SÍ. El §41 entero queda APROBADO.**

La Biblia Maestra v1.0 pasa de «base de trabajo» a **canon vigente**. Las seis propuestas del §41 se canonizan:

1. Renombrar temáticamente las nueve pistas con los títulos descriptivos del documento (§7–15) — **APROBADO**
2. Mostrar en la cinemática la apertura del suelo y el descenso en plataforma hasta el Refugio — **APROBADO**
3. Situar el Refugio como zona segura conectada a la torre, fuera del recuento de nueve pistas — **APROBADO**
4. Unificar el nombre DJ Virgilio como **Tempo** en todo el HUB — **APROBADO**
5. Reinterpretar visualmente las armas heredadas para que compartan la identidad del universo — **APROBADO**
6. Unificar los nombres de enemigos comunes duplicados entre lore y prototipos — **APROBADO**

**Consecuencia inmediata:** Los nombres de las nueve pistas pasan de `PROPUESTA` a `CANON`:

| Pista | Nombre canónico | Soberano canónico |
|---|---|---|
| 01 | **La Invitación** | Véspera, la Última Invitación |
| 02 | **El Banquete** | Voraz, el Anfitrión Hueco |
| 03 | **La Cámara de los Instantes** | Áurea, la Coleccionista de Instantes |
| 04 | **La Amplificación** | Brama, el Santo del Ruido |
| 05 | **La Nota Ausente** | El Obispo de la Nota Ausente |
| 06 | **El Umbral Encadenado** | El Corazón Encadenado |
| 07 | **El Salón de las Mil Voces** | El Crupier de las Mil Voces |
| 08 | **El Andén de la Ausente** | Nix, la Voz que Faltaba |
| 09 | **El Núcleo** | El Rey del Compás |

Estos nombres son ahora los **IDs narrativos** para UI, mapa, cinemáticas, diálogos y Art Bible. Los IDs técnicos de archivo (`boss_01_magneta` etc.) se mantienen por estabilidad pero su `displayName` migra (ver D-03).

---

## D-02 — ¿Es canon «La ciudad que no termina»?

> **Pregunta:** La introducción «La ciudad que no termina» (otra rama, sin aprobar) cuenta que hubo una ciudad y que la torre la absorbió. La biblia no menciona ninguna ciudad. ¿Es canon?

**Resolución: NO. SE DESCARTA.**

«La ciudad que no termina» queda clasificada como **LEGADO NO CANÓNICO**. No se recupera, no se referencia en arte, arquitectura ni diálogos. La torre nace de la Primera Noche en la antigua estación reconvertida, sin ciudad absorbida. Cualquier asset, texto o mapa que mencione "ciudad" como origen queda obsoleto.

**Registro de descartados actualizado:** Dante/infierno + ciudad absorbida + pecados capitales + Limbo como pista.

---

## D-03 — ¿Quiénes son los jefes?

> **Pregunta:** El 12 de noviembre se decidió conservar los nombres del motor (MAGNETA, BUFÉ, EL CAJERO…) y seguir la lámina REF_03. La biblia dice que los nombres de los soberanos (Véspera, Voraz, Áurea…) son canon y describe a cada uno de otra manera. ¿Quiénes son los jefes?

**Resolución: LOS SOBERANOS DE LA BIBLIA.**

Los 9 soberanos descritos en la Biblia §7–15 son los **jefes canónicos**. Los nombres del motor (MAGNETA, BUFÉ, EL CAJERO, POGO, OFICIANTE, MATARIFE, IMITADOR, TRAIDOR, NÚCLEO, ANDÉN) pasan a ser **aliases legacy**. La identidad visual debe representar a los soberanos, no a los alias.

**Tabla de migración definitiva (IDs técnicos conservados, display canónico):**

| ID técnico (estable) | Alias motor (obsoleto como display) | Display canónico | Descripción canónica (Biblia) |
|---|---|---|---|
| `boss_00_anden` | ANDÉN, el Portero (Limbo) | **Portero sin Rostro** | §17.1 Subjefe, sala secreta — no es soberano, no es pista |
| `boss_01_magneta` | MAGNETA, la Anfitriona | **Véspera, la Última Invitación** | Terciopelo negro, máscara de labios dorados, cables-marioneta, corazón roto |
| `boss_02_bufe` | BUFÉ, Anfitrión sin Fondo | **Voraz, el Anfitrión Hueco** | Vajilla rota, horno transparente con manos, cucharones de hierro |
| `boss_03_cajero` | EL CAJERO | **Áurea, la Coleccionista de Instantes** | Exoesqueleto de oro, trono de relojes sin agujas, dedos-llave, vitrina en pecho |
| `boss_04_pogo` | EL POGO | **Brama, el Santo del Ruido** | Carbón rojo, amplificador entre costillas, garganta cosida con cuerdas de guitarra |
| `boss_05_oficiante` | EL OFICIANTE | **Obispo de la Nota Ausente** | Mitra-diapasón, órgano silenciado, coro ausente |
| `boss_06_matarife` | EL MATARIFE | **Corazón Encadenado** | Tambor de guerra en pecho, cadenas rituales, puerta blindada |
| `boss_07_imitador` | EL IMITADOR | **Crupier de las Mil Voces** | Traje impecable de humo, cabeza que cambia de máscara |
| `boss_08_traidor` | EL TRAIDOR | **Nix, la Voz que Faltaba** | Hielo negro y velo blanco, 8 siluetas con hueco en corazón |
| `boss_09_nucleo` | La Última Canción (Núcleo) | **Rey del Compás** | 3 fases: Espejo/Corona/Última Vuelta — bola de espejos → cuerpo fragmentado |
| `boss_10_arquitecto` | Arquitecto del Club | **Rey del Contratiempo / Arquitecto** | DJ-Director, jefe secreto Cabina Original (§17) |

**Impacto en R03:** Las 15 ilustraciones validadas bajo REF_03 (Andén/Magneta/Bufé/Cajero/Pogo/Oficiante/Matarife/Imitador/Traidor/Núcleo/Arquitecto) fueron generadas con los alias del motor y la lámina REF_03. **Mantienen su condición técnica E (rehecho_validado) pero pasan a estado narrativo LEGACY.** No se borran del disco ni del juego, pero su **fidelidad canónica es BAJA**: no representan a Véspera/Voraz/Áurea etc. según la Biblia.

**Directriz para las 27 restantes:** Las 27 ilustraciones pendientes (7 attacks, 10 hits, 10 deaths) se generarán **desde cero con los soberanos de la Biblia** como referencia de diseño. Si el resultado exige rehacer los 15 idles legacy para mantener coherencia de familia, se hará como parte de la reconstrucción integral — no se conservarán por comodidad.

**Criterio de reutilización:** Aquellos rasgos compatibles (horno de Voraz, amplificador de Brama, mitra-diapasón del Obispo, tambor del Corazón Encadenado, máscaras del Crupier, velo de Nix, espejos del Rey) pueden conservarse; el resto se reinterpreta.

---

## D-04 — Alcance de la reconstrucción

> **Pregunta:** El canon describe mecánicas que el juego no tiene: reglas musicales por pista, un enemigo propio por pista, jefes de tres fases, nueve armas legendarias, tres finales, el Archivo. ¿Qué alcance tiene la reconstrucción?

**Resolución: LO ANTERIOR MÁS REDISEÑO DE NIVELES.**

Se autoriza reconstrucción integral completa:

- **Arte:** Todos los recursos visuales (prota, NPCs, enemigos y familias, jefes con transformaciones, escenarios/arquitectura, salas especiales, props, armas, VFX, iluminación, cinemáticas, UI/HUB).
- **Mecánicas narrativas por pista:** Reglas musicales (§7–15), peligros ambientales, enemigos propios, fases de jefe — como **diseño de niveles y contenido jugable**, no solo como skin.
- **Niveles:** Rediseño espacial real — entradas, zonas de exploración, arenas de combate, rutas alternativas, secretos, transiciones, encuentros con jefes, verticalidad útil. No 20 salas por obligación; cantidad motivada por diseño.
- **Sistemas de progresión:** Nueve armas legendarias, tres finales, Archivo, pactos, etc. — como parte del HUB y del grafo de salas.

**No se autoriza:** Alterar motor de combate/progresión/colisiones sin necesidad técnica documentada. Cada cambio de sistema debe registrarse y validarse en juego.

---

## D-05 — ¿Se autoriza sustituir texto narrativo?

> **Pregunta:** El juego dice «círculos», «infierno», «DJ Virgilio» y «cazador». ¿Se autoriza a sustituir ese texto narrativo (zonas, narrador, rótulos, victoria y derrota)?

**Resolución: SÍ, TODO.**

Se autoriza barrido completo de terminología heredada en **código, UI, diálogos, cinemáticas, HUB y docs**:

| Heredado | Canónico |
|---|---|
| Círculo N · Lujuria/Gula… | **Pista N · La Invitación/El Banquete…** (D-01) |
| Nueve Círculos | **Nueve Pistas de la Torre** |
| Círculo Final | **Núcleo (Pista 09)** |
| DJ Virgilio / DJ | **Tempo** |
| cazador | **Desafinado** (o 2ª persona neutra cuando convenga) |
| Infierno / inframundo | **Torre / estructura subterránea** |
| Pecados capitales | **Deseos convertidos en leyes de la pista** |
| Limbo (como pista) | **Refugio** (HUB) / Acceso |
| Summon infernal (arma 118) | **Convocador disonante** — ver glosario |

**Ámbitos afectados:** `CIRCLE_CONFIG` / `CIRCLE_META` / `CIRCLES_INFO` / `DD_CINE` tarjetas / `DD_HUB` prompts / `DD_UI` mapa y modales / pantallas de victoria-derrota / `CLOUDFLARE` n/a.

**Ejecución:** Fase 02 (Art Bible) y Fase 03 (diseño de universo) llevarán el glosario a código mediante `tools/build_active_html.py`. Cada tanda incluirá barrido de strings con QA de no-regresión (screenshots ANTES/DESPUÉS).

---

## D-06 — Trabajo R03 interrumpido (24/42)

> **Pregunta:** El turno anterior se interrumpió con trabajo de R03 sin confirmar en el árbol: 9 ilustraciones más (24 de 42), destello de impacto, espera de la pantalla final y sondas de combate. Está validado en juego, pero sin commit. ¿Qué hago con ello?

**Resolución: COMMIT DE RESPALDO.**

Se ordena **commit de respaldo** que preserve el trabajo validado aunque su identidad narrativa haya quedado legacy por D-03.

**Contenido respaldado (24/42):**

- **15 previos (commit 4d2e949):** `idle` de 11 jefes + `attack` de Andén/Magneta/Bufé/Pogo — validados `probe_bosses.js` 207 recortes / 55 cuadros / 0 pageerror.
- **9 nuevos validados sin commit:** `attack` de Cajero, Oficiante, Matarife, Imitador, Traidor, Núcleo, Arquitecto (7) + `hit` de Andén y Magneta (2) — integrados, 269/269 assets, `drawImage` medido, `hubPack` intacto.

**Código validado sin commit:**
- Destello de impacto: corrección de `tint`/`globalAlpha` que velaba la figura en su pico → halo controlado `flashCap 0.68` + `blitBossFrame` con `rim` sin sobreexposición.
- Espera de pantalla final: `DMO_PROG` `victoryDelay` + `DD_WORLD` `deathHoldMs` — Núcleo y Arquitecto ya no se tapan en el mismo frame; 1s de derrumbe visible antes de `fin de partida`.
- Sondas de combate: `probe_bosses_combat.js` (combate completo simulado por ronda, no solo estados forzados) + `probe_final_flow.js` (muerte→UI→fin).

**Estado tras respaldo:** Las 24 ilustraciones y los 3 fixes quedan guardados en el historial como `BACKUP_R03_24DE42`. Su `displayName` es legacy (REF_03/motor) y queda marcado para **revisión canónica** en Fase 05. No se borran; se documenta su obsolescencia narrativa.

---

## EFECTOS SOBRE DOCUMENTACIÓN

- `FASE_01_AUDITORIA_INTEGRAL.md` §4, §8, §9 — pista names pasan de PROPUESTA a CANON.
- `FASE_01_MATRIZ_CANON.json` — `estado_nombre` de P01–P08 → `CANON` (P09 ya era CANON).
- `docs/ART_REBUILD/NEXT_BATCH.md` y `CHECKPOINT.md` — correspondencia de jefes actualizada a soberanos (sección «Quién es cada jefe»).
- `docs/ART_REBUILD/MASTER_INVENTORY.json` — 24/42 backup añadido como tanda intermedia `R03b` (no cierra R03).
- `ART_BIBLE.md` — §9 (extensión visual de jefes) queda obsoleto; será reemplazado en Fase 02 por la Biblia Artística de soberanos.

---

**Firma:** Auditoría FASE 01 cerrada con decisiones D-01…D-06 resueltas. Próxima fase: **FASE 02 — Nueva Biblia Artística** (identidad visual de la torre redimida, no infernal).
