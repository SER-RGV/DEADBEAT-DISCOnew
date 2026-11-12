# FASE 01 — AUDITORÍA NARRATIVA Y DOCUMENTAL
# DEADBEAT DISCO — RECONSTRUCCIÓN INTEGRAL DEL CONTENIDO

**Rama:** `arena/719117d9-deadbeat-disconew` · **Base:** `000e7c6` (`main`)  
**Fecha:** 2026-11-12 · **Estado de fase:** `AUDITORÍA COMPLETA — PENDIENTE DE DECISIONES`  
**Autoridad narrativa:** `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` (2971 líneas, v1.0)  
**Metodología:** Inspección estática completa + lectura de código de runtime + contraste de inventarios + ejecución conceptual. No se ha generado, sustituido ni eliminado ningún asset en esta fase.

> **Regla de esta fase:** La narrativa determina el universo. El arte representa esa narrativa, nunca la sustituye. Si algo no está en el canon vigente, no se recupera por estar en un PNG antiguo ni por aparecer en la wiki de Dante.

---

## TABLA DE CONTENIDOS

1. [Principio fundamental — Lore como autoridad](#1-principio)
2. [Inventario documental localizado](#2-inventario-docs)
3. [Canon vigente — Síntesis de la Biblia Maestra v1.0](#3-canon)
4. [Cambios narrativos aprobados (ruptura con el legado)](#4-cambios)
5. [Matriz de autoridad: canónico / provisional / descartado](#5-matriz-autoridad)
6. [Elementos obsoletos detectados](#6-obsoletos)
7. [Contradicciones activas (triple desalineación)](#7-contradicciones)
8. [Estructura del universo jugable — 9 pistas + refundación del HUB](#8-universo)
9. [Matriz pista ↔ soberano ↔ jefe motor ↔ arma legendaria](#9-matriz-pistas)
10. [Auditoría técnica del proyecto real](#10-tecnica)
11. [Estado del arte visual — 374 assets clasificados](#11-arte)
12. [Reglas innegociables — verificación en Fase 01](#12-reglas)
13. [Decisiones bloqueantes — se requiere resolución del autor](#13-decisiones)
14. [Criterios de aceptación de Fase 01](#14-criterios)
15. [Hoja de ruta Fases 02–10](#15-hoja)
16. [Anexos: fuentes, evidencias, glosario de migración](#16-anexos)

---

<a id="1-principio"></a>
## 1. PRINCIPIO FUNDAMENTAL — EL LORE ACTUAL ES LA AUTORIDAD

La auditoría confirma que **existe un documento de autoridad narrativa explícito y vigente**:

| Documento | Ubicación | Versión / Líneas | Rol |
|---|---|---|---|
| **Biblia Maestra del Universo, la Torre y la Progresión** | `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` | v1.0 · 2971 líneas | **Fuente primaria canónica** |
| `lore.txt` / `lore(2).txt` | Citadas en Biblia §Fuentes | — | Canon narrativo base para Primera Noche, Escucha, Tempo, Desafinado, 9 soberanos, armas legendarias y finales |
| `DEADBEAT_DISCO_DOCUMENTO_MAESTRO_CONSOLIDADO_v1.0.md` | Citado en Biblia | — | Diseño definido: estructura, salas, Refugio, economía, arsenal, bestiario |
| `DEADBEAT_DISCO_120_HD_CADERA(1).html` | Citado en Biblia | — | Catálogo heredado de 120 armas (familias técnicas) |
| `FASE 08 — La noche que vuelve` | Citado en Biblia | — | Propuesta cinemática Refugio (apertura de suelo + plataforma de descenso) |

**Etiquetas de autoridad usadas por la propia Biblia (§0):**

- **CANON** — Establecido en la biblia narrativa y conservado.
- **DISEÑO DEFINIDO** — Regla descrita en el Documento Maestro, no necesariamente implementada.
- **PROPUESTA** — Ampliación para conectar piezas; requiere aprobación antes de ser canon.
- **LEGADO DE PROTOTIPO** — Contenido heredado; no es automáticamente canon.
- **PENDIENTE** — Contradicción que exige decisión.

**Aplicación en esta auditoría:** Toda pieza de arte, arquitectura, enemigo, jefe o sistema que contradiga la Biblia v1.0 se clasifica como **LEGADO** o **DESCARTADO**, sin importar cuántas ramas, capturas o assets antiguos la contengan.

---

<a id="2-inventario-docs"></a>
## 2. INVENTARIO DOCUMENTAL LOCALIZADO

### 2.1 Documentos canónicos (vigentes)

- `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` — **Única biblia vigente.**
- `docs/README.md` — Índice maestro de documentación.
- `ASSET_INVENTORY.md`, `ASSET_INTEGRATION_GUIDE.md`, `ASSET_REPLACEMENT_PLAN.md` — Estado de assets.
- `CURRENT_STATE.md` (17 KB, historial Tandas HUB 01–09) — Estado de producción incremental.
- `PROJECT_INVENTORY.md`, `VALIDATION_PLAN.md`, `CHANGELOG.md` — Estado general.

### 2.2 Documentos de reconstrucción artística (histórico-técnico)

- `docs/ART_REBUILD/AUDITORIA_VISUAL.md` — Auditoría visual 2026-11-11/12 (374 assets, método completo).
- `docs/ART_REBUILD/AUDIT_INVENTORY.md` — Inventario A/B/C/D/E.
- `docs/ART_REBUILD/AUDIT_CLASSIFICATION.json` — Datos máquina de la clasificación.
- `docs/ART_REBUILD/ASSET_REPLACEMENT_MAP.json` — Mapa de reemplazo de IDs legacy → IDs nuevos.
- `docs/ART_REBUILD/MASTER_INVENTORY.md` · `MASTER_INVENTORY.json` — 330 recursos planificados (225 verificados).
- `docs/ART_REBUILD/NEXT_BATCH.md`, `CHECKPOINT.md`, `PRODUCTION_LOG.md` — Plan incremental por tandas R01–R33.
- `ART_BIBLE.md` (v1.3), `ART_AUDIT/`, `ART_EVIDENCE/` — Biblia visual y evidencias por tanda.

### 2.3 Documentos de fase previa (conservados como evidencia)

- `FASE_01_AUDITORIA.md` + `FASE_01_INFORME_FINAL.md` — Auditoría de Fase 01 anterior (boot/loading/intro/menú). **No es canónica para esta reconstrucción integral:** auditó el sistema de presentación, no el universo narrativo.
- `FASE_0_2_REPORT.md`, `FASE_0_3_*`, `ART_TANDA_*.md` — Historiales de integración HUB y QA. Conservados sin tocar.

### 2.4 Código fuente vigente (superficie real del juego)

| Archivo | Líneas | Función |
|---|---|---|
| `index.html` = `DEADBEAT_DISCO.html` | 9.200 · 5.23 MB | **Build publicada** (GitHub Pages). CSS/JS inline. |
| `src/dd_asset_registry.js` | 122 | `window.DD_ASSETS` — 269 entradas registradas / 345 planificadas |
| `src/dd_world_renderer.js` | 762 | Render isométrico (`DD_WORLD`) — sustituye pixel art por ilustración |
| `src/dd_hub_system.js` | 468 | HUB jugable (`DD_HUB` / `DMO_HUB`) — 4 estaciones actuales |
| `src/dd_cinematic_camera.js` | 464 | Cinemáticas (`DD_CINE`) — intro, descensos, tarjetas de círculo |
| `src/dd_ui_system.js` | 767 | Menú, HUD, tienda, mapa |
| `src/dd_rebuild_ui.css` | 799 | Estilos HD |
| `src/dd_boot.js` | ~1000 | FSM de arranque Fase 01 previa (boot→loading→intro→main_menu) |
| `tools/build_active_html.py` | 26 KB | Generador de `index.html` desde `src/*` + `assets/` |
| `assets/manifest.json` | 269 entradas | Registro técnico (id, ruta, w, h, alpha, pivot, sha16) |
| `DEADBEAT_DISCO.ART.html` | 21.922 · 13.49 MB | **Build I+D artística** (HUB Tandas 01–09). Histórica. Sin `DD_UI/DD_HUB` reales. |

### 2.5 Assets físicos (disco)

- `assets/{bosses,characters,enemies,weapons,pickups,effects,floors,walls,props,ui,logos,cinematics}` — 269 registrados + 76 pendientes = 345 planificados.
- `ART_ASSETS/`, `ART_PACK/`, `ART_TOOLS/`, `ART_AUDIT/`, `ART_EVIDENCE/`, `ART_REFERENCES/` — Material de producción artística.
- `CINEMATIC_ASSETS/`, `artevi2/`, `backups/` — Históricos; no se tocan en esta fase.

---

<a id="3-canon"></a>
## 3. CANON VIGENTE — SÍNTESIS DE LA BIBLIA MAESTRA v1.0

### 3.1 Premisa

> **Tagline:** *La noche que devoró el amanecer.*  
> **Ley del mundo:** *La torre no encierra a quienes disfrutan de la fiesta. Encierra a quienes ya no soportan que termine.*

DEADBEAT DISCO es un **roguelike shooter isométrico**. El jugador es el **Desafinado**, anomalía nacida de decisiones descartadas por la torre. La torre es un edificio que crece hacia abajo; cada pista convierte un deseo de la Primera Noche en una regla física, musical y emocional.

El jugador **no dispara al ritmo**. La música organiza ataques enemigos y peligros ambientales. Toda señal sonora tiene equivalente visual.

### 3.2 Conceptos fundacionales (CANON)

| Elemento | Estado | Síntesis |
|---|---|---|
| **Primera Noche** | CANON | Fiesta post-guerra en una antigua estación reconvertida en sala de baile. |
| **La Escucha** | CANON | Presencia sin rostro bajo el salón. No es dios/demonio. No comprende "para siempre". Solo devuelve lo que recibe. |
| **Petición original** | CANON | El anfitrión (futuro Rey del Compás) pide que la noche no termine. La Escucha la repite. El salón crece hacia abajo. |
| **Ley fundamental** | CANON | *Cada deseo se convierte en un ritmo; cada ritmo, en una prisión.* |
| **Tempo** | CANON | DJ que detectó el bucle y enlazó otra canción por compasión. Recuerda todas las vueltas. Sus auriculares escuchan todas las versiones. Nombre vigente: **Tempo** (sustituye "DJ Virgilio"). |
| **Desafinado** | CANON | No es heredero, elegido ni visitante externo. Es el fragmento que Tempo no consiguió repetir — decisiones descartadas acumuladas. Tatuajes = partitura incompleta. Le duele la torre porque no puede corregirlo. Sin biografía previa inventada. |
| **Refugio (HUB)** | DISEÑO DEFINIDO | Zona segura fuera del recuento de 9 pistas. Plataforma de incursión, armería, espacio de Tempo, mapa, tocadiscos central, archivo, mesa de mezclas, espejo agrietado, sofá, ventanas circulares. Evolución visual por finales. |
| **Cinemática de llegada** | PROPUESTA | Apertura circular del suelo en la pista principal + plataforma de descenso vertical que revela balcones de otras pistas. Explica: discoteca y torre son la misma estructura; la torre continúa; el Refugio es tregua. No se atribuye causa ni origen externo. |
| **Estructura de run** | DISEÑO DEFINIDO | Refugio → Acceso → Pistas 01–08 → Núcleo (Pista 09 → Rey del Compás) → Decisión de final. Grafo 8–12 nodos/pista, 4–5 capas, 2–3 rutas paralelas, tienda/curación/armería garantizadas cuando proceda. |
| **Salas** | DISEÑO DEFINIDO | Combate, Tesoro, Armería, Tienda, Afinación, Pacto, Sacrificio, Secreta, Archivo, Jefe. |
| **Finales** | CANON | 3 finales: Compás, Silencio, Contratiempo. |
| **Subjefes y secretos** | CANON | Portero sin Rostro, Afinador, Eco del Pasillo, Archivista, Rey del Contratiempo (DJ-Director/Aquitecto) — ver §17 de la Biblia. |

### 3.3 Torre, no Infierno

La Biblia §0.2 establece explícitamente que **el mundo ya no es una adaptación de los círculos del infierno de Dante**. Es una **construcción musical y sobrenatural propia**: una torre-discoteca que crece hacia abajo. Cualquier referencia a "infierno", "inframundo", "pecados capitales" o "9 círculos dantescos" es **terminología heredada descartada**.

---

<a id="4-cambios"></a>
## 4. CAMBIOS NARRATIVOS APROBADOS (RUPTURA CON EL LEGADO)

| Terminología heredada | Terminología vigente | Estado del cambio |
|---|---|---|
| Círculo | **Pista** o **nivel** | Aprobado §0.2 — Aplicación pendiente en código/UI |
| Nueve círculos | **Nueve pistas de la torre** | Aprobado |
| Descenso por los círculos | **Descenso por la torre** | Aprobado |
| Círculo final | **Núcleo** (Pista 09) | Aprobado |
| DJ Virgilio | **Tempo** | Aprobado — Pendiente unificación en `dialogue_portrait_dj`, `DMO_HUB`, `DD_HUB` y diálogos |
| Infierno / inframundo | **Torre / estructura subterránea** | Aprobado |
| Pecados capitales | **Deseos convertidos en leyes de la pista** | Aprobado |
| Limbo (como Círculo 0) | **Refugio** (HUB, fuera del recuento) | Aprobado — El "Limbo" no existe como pista numerada |
| Nombres temáticos de círculos infernales | **Nombres descriptivos de pistas** (propuestas §7–15) | Propuesta — Requiere aprobación antes de ser canon |

**Implicación artística:** Los 9 entornos no deben copiar la iconografía dantesca (fuego infernal, hielo punitivo genérico, etc.). Cada pista tiene identidad propia derivada de un **deseo humano concreto** (ser elegida, saciedad, conservar instantes, ser escuchado, etc.) y una **regla musical jugable** (bajo, percusión, metales, distorsión…).

---

<a id="5-matriz-autoridad"></a>
## 5. MATRIZ DE AUTORIDAD: CANÓNICO / PROVISIONAL / DESCARTADO

### 5.1 CANÓNICO (intocable sin decisión del autor)

- Primera Noche, Escucha, petición, ley fundamental.
- Tempo (identidad, castigo, motivación, voz).
- Desafinado (origen como descarte, naturaleza de anomalía, tatuajes-partitura).
- 9 soberanos + sus deseos + sus historias personales (Véspera → Rey del Compás).
- 9 armas legendarias + arma del Núcleo (nombres, formas, virtudes/límites/sinergias).
- Reglas musicales por pista.
- 3 finales y sus condiciones de desbloqueo narrativo.
- Subjefes/entidades menores (Portero, Afinadores, Eco, Archivista, Arquitecto).
- Estructura roguelike definida (grafo, capas, tipos de sala, filosofía de progresión).
- Tagline, tono y pilares de experiencia (legibilidad, misterio, melancolía, variación, decisiones).

### 5.2 DISEÑO DEFINIDO (regla estable, implementación pendiente)

- Refugio y sus 9 zonas funcionales (§5.4).
- Evolución visual del Refugio por progreso (§5.5).
- Bucle de incursión y composición de cada nivel (§6).
- 120 armas heredadas como **familias técnicas** (no como lore cerrado).

### 5.3 PROPUESTA (requiere aprobación antes de ser canon)

| Propuesta | Ubicación en Biblia | Qué falta para canonizar |
|---|---|---|
| Nombres temáticos de las 9 pistas ("La Invitación", "El Banquete", etc.) | §7–15 | **Aprobación explícita del autor** — Hoy son descriptivos, no definitivos |
| Cinemática de apertura de suelo + plataforma de descenso | §5.3 | Implementación + sincronización musical |
| Refugio como zona segura conectada por mecanismo circular | §5.3 | Geometría y enlace jugable a Pista 01 |
| Unificación DJ Virgilio → Tempo | §3.4 | Barrido de código/UI y diálogos |
| Reinterpretación visual de las 120 armas | §A | Contraste con comportamiento real de cada arma |
| Unificación de nombres de enemigos comunes duplicados | Biblia §40 | Decisión de nomenclatura |

### 5.4 LEGADO DE PROTOTIPO (no es canon automáticamente)

- Todo `DMO_*` y `DDM_*` heredado en `DEADBEAT_DISCO.ART.html` (HUB modular, 9 círculos numerados, DJ-Director como "Arquitecto del Club").
- Nombres de soberanos y jefes del motor (`MAGNETA, BUFÉ, CAJERO, POGO, OFICIANTE, MATARIFE, IMITADOR, TRAIDOR, NÚCLEO, ARQUITECTO`) — ver §7.
- Mapas de torre con "dos Fraudes/Traiciones como IX" detectados en `assets/ui/map_infernal_tower.png`.
- 105 armas sin arte nuevo (se muestran con sprite heredado del motor).
- Paletas `CIRCLE_THEMES` del HTML (`limbo, lujuria, gula, avaricia, ira, herejia, violencia, fraude, traicion, nucleo`) — Terminología heredada.

### 5.5 VACÍOS DOCUMENTADOS COMO PENDIENTES (Biblia §42)

1. Nombre definitivo de cada pista.
2. Geometría y plano arquitectónico exacto por nivel.
3. Distribución final de salas, rutas y duración por piso.
4. Mecánica individual de las 120 armas heredadas.
5. Lista completa de objetos más allá de los documentados.
6. Costes finales de CR/Ecos/Fragmentos.
7. Curvas de daño/vida/velocidad/dificultad.
8. Diálogos completos de Tempo y desbloqueos de testimonios.
9. Estación física del Archivo en el HUB.
10. Música/FX/animación de la cinemática.
11. Relación plataforma cinemática ↔ acceso jugable.

> **Regla de producción (§43):** Antes de implementar un elemento: 1) Identificar si es canon/diseño/propuesta/legado/pendiente. 2) Comprobar si existe. 3) Conservar sistemas válidos. 4) No inventar assets inexistentes. 5) Registrar cambios. 6) Validar sin confundir pruebas automatizadas con validación real.

---

<a id="6-obsoletos"></a>
## 6. ELEMENTOS OBSOLETOS DETECTADOS

### 6.1 Narrativa descartada (no se recupera aunque aparezca en assets viejos)

| Elemento obsoleto | Dónde aún aparece | Acción requerida |
|---|---|---|
| **Dante / Divina Comedia / 9 círculos del infierno** | Históricos `DEADBEAT_DISCO.ART.html`, `CIRCLE_THEMES`, `cine_circle_*`, `map_infernal_tower`, `explore72-map`, `DMO_CINE` | **Descartar toda referencia explícita.** Sustituir por "pistas de la torre" y deseos. No usar iconografía dantesca en arte nuevo. |
| **"Infierno / inframundo / pecados capitales"** | Nombres de círculos, docs antiguos, comentarios de código | Reemplazar por "torre / estructura subterránea / deseos convertidos en leyes" |
| **"Limbo" como Círculo 0 jugable** | `CIRCLE_CONFIG[0]=limbo`, `floor_00_limbo_marble`, `wall_panel_gothic_niche` etiquetado `wall_limbo`, `boss_00_anden` como "I Limbo · ANDÉN" | **Reclasificar:** el Limbo no es pista numerada. `floor_00` es suelo de Refugio/acceso, no pista de combate. `boss_00_anden` es **subjefe Portero sin Rostro** (§17.1), no soberano de pista. |
| **"DJ Virgilio"** | `dialogue_portrait_dj.png` ("DJ Virgilio"), `DD_HUB.stations.dj` ("CABINA DE DJ VIRGILIO"), `DJ_QUOTES`, `DD_CINE` | Renombrar a **Tempo** en UI/diálogos/docs. Conservar `dialogue_portrait_dj` como archivo hasta re-render, pero etiquetar como `tempo` en registro. |
| **"Summon infernal" (arma 118)** | `weapon_c118_summon_infernal` + lore de invocación infernal | Revisar nombre por directiva Biblia §A — Propuesta: *"Convocador disonante" / "Llamada hueca"* |
| **"Nueve círculos + Núcleo Final como 10º"** | Motor: 10 `CIRCLE_CONFIG` (0=limbo … 9=core), 10 suelos, 10 muros base | **Corregir a 9 pistas + Refugio.** El 10º slot es redundancia legacy. Ver §13 decisiones. |

### 6.2 Arte obsoleto (defectos técnicos que impiden reutilización)

Detectados por `docs/ART_REBUILD/AUDIT_INVENTORY.md` — **37 assets clase D** (defecto visible en archivo):

- `boss_06_matarife_attack`, `boss_09_nucleo_attack` — damero horneado
- `boss_03_cajero_hit/attack`, `boss_05_oficiante_hit`, `boss_09_nucleo_hit` — fotogramas basura
- `boss_02_bufe_hit` — identidad distinta
- `wall_panel_gothic_niche` — huecos blancos horneados
- `door_gothic_closed` — damero, `door_gothic_open` — huecos blancos, `portal_avaricia_gold` — halo punteado
- `cine_bg01…06` (6 fondos con muestras de paleta, marco y texto "OR"/"AL" horneados) — no utilizables sin la barra panorámica
- `ui_victory_emblem` — halo claro

**Estos 37 no se conservan.** Se rehacen en tandas R03/R09/R10.

### 6.3 Nomenclatura de archivo obsoleta (legado técnico)

- `DDC_COVER`, `DDC_IMG`, `DDC_BG`, `DMO_HUB`, `DMO_FLOOR`, `DMO_MUSIC` — Prefijos heredados del motor monolito. Se mantienen como identificadores internos por dependencia de `tools/build_active_html.py`, pero su **presentación al jugador** debe migrar a terminología de torre/pista/Tempo.

---

<a id="7-contradicciones"></a>
## 7. CONTRADICCIONES ACTIVAS (TRIPLE DESALINEACIÓN)

La auditoría detecta **tres capas de nomenclatura que no coinciden entre sí**. Ninguna puede usarse como referencia automática sin esta tabla de correspondencia.

### 7.1 Triple tabla de jefes/soberanos

| Motor (lo que el juego muestra hoy) | Biblia v1.0 (canon narrativo) | Arte / Guía REF_03 | Estado |
|---|---|---|---|
| **I Limbo · ANDÉN, el Portero** (`boss_00_anden`, 196 px) | §17.1 **Portero sin Rostro** — subjefe, no soberano | No existe en REF_03 | **DESALINEADO:** El motor lo lista como Círculo I; el canon lo rebaja a encuentro secreto. |
| **II Lujuria · MAGNETA** (`boss_01_magneta`, 190 px) | **Pista 01 · Véspera, la Última Invitación** | I Lujuria | Coinciden en tema; divergen en nombre/lectura visual |
| **III Gula · BUFÉ** (`boss_02_bufe`, 178 px) | **Pista 02 · Voraz, el Anfitrión Hueco** | II Gula | Ídem |
| **IV Avaricia · EL CAJERO** (`boss_03_cajero`, 190 px) | **Pista 03 · Áurea, la Coleccionista** | III Avaricia | Divergencia de género (biblia: mujer / motor: "EL CAJERO") — resuelto en arte como figura enmascarada ambigua |
| **V Ira · EL POGO** (`boss_04_pogo`, 186 px) | **Pista 04 · Brama, el Santo del Ruido** | IV Ira | Ídem |
| **VI Herejía · EL OFICIANTE** (`boss_05_oficiante`, 194 px) | **Pista 05 · Obispo de la Nota Ausente** | V Herejía | Coinciden en arquetipo |
| **VII Violencia · EL MATARIFE** (`boss_06_matarife`, 188 px) | **Pista 06 · Corazón Encadenado** | VI Violencia | Divergencia mayor (biblia: guardián encadenado / motor: carnicero) |
| **VIII Fraude · EL IMITADOR** (`boss_07_imitador`, 192 px) | **Pista 07 · Crupier de las Mil Voces** | VII Fraude | Coinciden en engaño/duplicación |
| **IX Traición · EL TRAIDOR** (`boss_08_traidor`, 200 px) | **Pista 08 · Nix, la Voz que Faltaba** | VIII Traición | Divergencia de género y motivo (biblia: Nix + hermana / motor: traidor genérico) |
| **Núcleo · La Última Canción** (`boss_09_nucleo`, 204 px) | **Pista 09 · Rey del Compás** (3 fases: espejo/corona/última vuelta) | IX Núcleo | Coinciden en Núcleo; biblia detalla 3 fases no implementadas |
| **Secreto · Arquitecto del Club** (`boss_10_arquitecto`, 192 px) | §17 **Arquitecto / Rey del Contratiempo** (DJ-Director) | — | Existe en motor como secreto; en biblia como jefe secreto — **Coherente, pero nombre "Arquitecto del Club" sugiere club genérico, no torre** |

**Consecuencia:** Hoy el juego tiene **10 jefes numerados + 1 secreto = 11**, mientras el canon tiene **9 soberanos + 1 Rey + subjefes + 1 secreto**. El slot `boss_00_anden` / `limbo` es el excedente que debe reclasificarse.

### 7.2 Contradicción de conteo de niveles

| Fuente | Conteo | Detalle |
|---|---|---|
| **Biblia v1.0** | **9 pistas + Refugio (fuera de recuento)** | Pistas 01–08 + Pista 09 Núcleo (Rey). Refugio no es pista. |
| **Motor (`CIRCLE_CONFIG`)** | **10 slots (0–9)** | 0=limbo, 1=lust, 2=gula, 3=greed, 4=wrath, 5=pride, 6=violence, 7=envy, 8=ice, 9=core |
| **ARTE (suelos/muros)** | **12 suelos** (00 limbo … 09 core + 10 checker + 11 vip_velvet) | 10 suelos de círculos + 2 de HUB/VIP sobrantes |
| **DOC Tandas R02/R03** | Habla de "Círculos I–IX + Núcleo" (9 + 1) | Arrastra terminología heredada |
| **UI (`DD_CINE`, `DD_UI`)** | 9 tarjetas `cine_circle_01…09` + tarjeta `00_hub` | 9 círculos + hub |

**Diagnóstico:** La desalineación es de **+1 slot**. El motor cuenta Limbo como nivel jugable; el canon lo elimina. La solución requiere decidir qué hacer con el slot 0 (ver §13).

### 7.3 Contradicción DJ Virgilio ↔ Tempo

| Ubicación | Nombre actual | Canon vigente |
|---|---|---|
| `assets/ui/dialogue_portrait_dj.png` | "DJ Virgilio" | **Tempo** |
| `src/dd_hub_system.js` `STATIONS.dj` | "CABINA DE DJ VIRGILIO" | **Tempo** |
| `DD_HUB` / `DMO_HUB` / `DDC_COVER` | `Virgilio` / `DJ` | **Tempo** |
| Biblia §3 | — | **Tempo** (DJ que recuerda) |

**Técnicamente sin riesgo:** es solo texto/diálogo. **Narrativamente crítico:** todo el pacto de memoria y la relación con el Desafinado dependen de que el jugador entienda que Tempo es quien recuerda.

### 7.4 Otras contradicciones menores

- **Armas 120 vs 121 vs 269:** Biblia anexo A lista 120 armas heredadas; motor/lore histórico habla de "121 HD weapons"; `DD_ASSETS` registra 269 entradas (incluye chars/bosses/props/etc.). No es contradicción real, sino mezcla de conteos. **Real: 120 armas + 9 legendarias + 1 de Núcleo = familias coherentes.**
- **Mapa de progresión:** `map_infernal_tower` (640×640) trae "dos Fraudes y Traiciones como IX" — error de arte heredado. Debe rehacerse con 9 pistas + Refugio.
- **Armerías:** `src/dd_ui_system.js` bug "La armería se abre vacía" — filtro usa `TODAS`/`ALL` pero entradas traen `family`. Es bug técnico de la Fase 01 previa, no narrativo, pero bloquea validación de armas legendarias.

---

<a id="8-universo"></a>
## 8. ESTRUCTURA DEL UNIVERSO JUGABLE — 9 PISTAS + REFUGIO

### 8.1 Principio rector

> No se presupone que los nueve círculos, sus nombres, su orden o sus temáticas anteriores siguen siendo canónicos. Primero se determina cuántas zonas necesita la historia actual.

**Resultado de la auditoría:** La historia actual necesita **exactamente 9 pistas** (8 + Núcleo) más un **Refugio** no numerado. No 8, no 10, no "9 + limbo". El conteo está justificado por: 9 deseos → 9 soberanos → 9 armas legendarias → 9 niveles.

### 8.2 Refugio — HUB de progresión (no es pista)

| Atributo | Canon / Diseño definido |
|---|---|
| **Función narrativa** | Tregua sagrada mientras el zorro de neón siga encendido. Lugar donde Tempo recuerda. |
| **Función jugable** | Preparar incursión, cambiar armas, pactar, consultar mapa, gestionar progresión permanente |
| **Zonas (Biblia §5.4)** | Armería, Espacio de Tempo, Mapa, Plataforma de incursión, Tocadiscos central, Archivo/vinilos, Mesa de mezclas, Espejo agrietado, Sofá roto, Ventanas circulares |
| **Estado actual en motor** | **4/10 implementadas:** `descent` (880,785), `armory` (415,535), `dj` (1165,335), `map` (1345,605). Faltan: Tocadiscos central, Archivo, Mesa de mezclas, Espejo, Sofá, Ventanas. Plataforma cian (`threshold_descent_pad`) existe como asset pero no como zona interactiva completa. |
| **Evolución visual** | §5.5: Refugio cambia con progreso (neones tras 1er jefe → archivo tras testimonios → bola de espejos en Compás → amanecer en Silencio → puerta abierta en Contratiempo). Hoy el HUB es estático. |
| **Cinemática de llegada** | Apertura circular de suelo + plataforma de descenso vertical (260u expand, 84→374px ventana, 5 planos parallax .92/.66/.40/.20/.08). Ya prototipada en Tandas HUB 08/09 pero desconectada del canon de Tempo. |

**Implicación para Art Bible:** El Refugio debe tener identidad **no infernal**: estación de tren reconvertida en sala de baile (columnas de hierro, techos de cristal, art-déco) + neón magenta/cian. No es cripta ni prisión.

### 8.3 Las 9 pistas — Ficha normativa mínima

Cada pista debe definirse con los 14 atributos exigidos por el brief (§4). La Biblia ya provee 8 de ellos; quedan 6 por diseño de niveles.

| # | Pista (propuesta) | Soberano (canon) | Deseo original | Tema musical | Identidad visual (Biblia) | Jefe motor actual | Enemigo propio (Biblia) | Arma legendaria |
|---|---|---|---|---|---|---|---|---|
| **01** | **La Invitación** | **Véspera, la Última Invitación** | Ser elegida; que alguien se quedara | Bajo | Terciopelo negro, lámparas rosas, columnas curvas, zonas rosas de arrastre | MAGNETA | Bailarines + sombra abrazadora | *Última Invitación* — pistola-bajo con orbes de atracción |
| **02** | **El Banquete** | **Voraz, el Anfitrión Hueco** | Que nunca faltara nada en la mesa | Percusión | Mesas interminables, vajilla rota, hornos industriales | BUFÉ | Comensal insaciable + mesas generadoras | *Sobremesa* — escopeta sopera que deja bocados espectrales |
| **03** | **La Cámara de los Instantes** | **Áurea, la Coleccionista** | Conservar momentos hermosos | Metales | Oro envejecido, vitrinas, relojes sin agujas | CAJERO | Vitrina ambulante (refleja) | *El Último Centavo* — revólver de rebotes con marca dorada |
| **04** | **La Amplificación** | **Brama, el Santo del Ruido** | Tener voz imposible de ignorar | Distorsión | Amplificadores, altavoces, metal ennegrecido | POGO | Altavoz viviente (conos de presión) | *(Biblia §10: arma de Brama — por consolidar)* |
| **05** | **La Nota Ausente** | **Obispo de la Nota Ausente** | — (fe y silencio) | Ausencia / hueco | Catedral profanada, órgano, diapasones, vidrieras rotas | OFICIANTE | Afinadores / coros silenciados | *(Biblia §11)* |
| **06** | **El Umbral Encadenado** | **Corazón Encadenado** | Protección que se hizo prisión | Latido / cadenas | Puerta blindada, tambor, cadenas, acero ritual | MATARIFE | Guardianes de umbral | *Primer Latido* — cañón-tambor de doble pulso |
| **07** | **El Salón de las Mil Voces** | **Crupier de las Mil Voces** | Dar a cada uno lo que quería escuchar | Voz | Casino de espejos, palcos, máscaras | IMITADOR | Eco falso (solo el real proyecta sombra) | *Palabra Prestada* — micrófono-réplica que deja doble estacionario |
| **08** | **El Andén de la Ausente** | **Nix, la Voz que Faltaba** | Permanecer juntas; cruzar la salida | Coro | Andén helado, hielo negro, raíles, velos, trenes espectrales | TRAIDOR | Espejo viviente (repite último ataque) | *Venías Detrás* — arma especular con eco posicional |
| **09** | **El Núcleo** | **Rey del Compás** | No tener que despedirse | Nota sostenida | Vacío con fragmentos flotantes de todas las pistas | NÚCLEO (3 fases) | Fragmentos combinados + anclajes | *Punto Final / Silencio* — grieta negra que disuelve proyectiles |

> **Nota:** Los nombres temáticos de pistas ("La Invitación" etc.) son **propuestas** de la Biblia, no nombres definitivos aprobados. No se usan como IDs técnicos hasta aprobación.

### 8.4 Diferenciación estructural (no solo cromática)

El brief exige que los espacios se diferencien por **estructura**, no solo por color. La auditoría confirma que el motor actual **no cumple**: todas las salas comparten el mismo grafo rectangular con cambio de textura de suelo/muro. Propuesta normativa (Fase 03):

- **P01 Invitación:** Salas privadas en abanico, focos que se cierran, corazón roto central.
- **P02 Banquete:** Mesas largas como barreras móviles, hornos como hazards, bandejas que generan enemigos.
- **P03 Cámara:** Vitrinas como paredes reflectantes, mecanismos de almacenar/devolver proyectiles.
- **P04 Amplificación:** Stacks de altavoces como pilares destructibles, conos de presión.
- **P05 Nota Ausente:** Nave de catedral, órgano como hazard, diapasones como affordances.
- **P06 Umbral:** Puerta monumental, tambores como timers, cadenas como gates.
- **P07 Mil Voces:** Casino laberíntico, espejos que ocultan rutas reales, máscaras como señuelos.
- **P08 Andén:** Raíles rectilíneos, trenes espectrales como hazards lineales, línea divisoria de sala.
- **P09 Núcleo:** Arena blanca reconstruida por fragmentos, anclajes destructibles.

Cada pista requiere **paleta, arquitectura, iluminación y mobiliario propios** — no una variación de matiz del mismo tileset.

---

<a id="9-matriz-pistas"></a>
## 9. MATRIZ PISTA ↔ SOBERANO ↔ JEFE MOTOR ↔ ARMA LEGENDARIA

Matriz canónica para trazar reemplazos de arte sin inventar narrativa:

| Pista | Soberano (Biblia) | Jefe motor (ID asset) | Altura mundo | Boss art legacy | Arma legendaria (Biblia) | Mecánica de pista |
|---|---|---|---|---|---|---|
| 01 | Véspera | `boss_01_magneta` | 190 px | `boss_art_boss_01_djdoom` (alias) | Última Invitación (pistola-bajo, orbes de atracción) | Pulsos graves → zonas de arrastre |
| 02 | Voraz | `boss_02_bufe` | 178 px | `boss_art_boss_02_reinaespectro` | Sobremesa (escopeta sopera, bocados) | Percusión por capas → acelerar trampas |
| 03 | Áurea | `boss_03_cajero` | 190 px | `boss_art_boss_03_reydisco` | El Último Centavo (revólver rebote) | Mecanismos recoger/guardar/expulsar proyectiles |
| 04 | Brama | `boss_04_pogo` | 186 px | `boss_art_boss_04_entidadvoraz` | *(P05–09: consolidar)* | Sobrecargas de altavoces → conos incendiados |
| 05 | Obispo | `boss_05_oficiante` | 194 px | `boss_art_boss_05_fusioncosmica` | — | Silencio como amenaza (nota ausente) |
| 06 | Corazón Encadenado | `boss_06_matarife` | 188 px | `boss_art_boss_06_djabismo` | Primer Latido (cañón-tambor, doble pulso) | Protección → prisión (puerta que no abre) |
| 07 | Crupier | `boss_07_imitador` | 192 px | `boss_art_boss_07_altavoztitan` | Palabra Prestada (micrófono-doble) | Voces señuelo; pista visual identifica amenazas reales |
| 08 | Nix | `boss_08_traidor` | 200 px | `boss_art_boss_08_djcalavera` | Venías Detrás (placas espejo, eco) | Sala reproduce ataques del jugador |
| 09 | Rey del Compás | `boss_09_nucleo` | 204 px | `boss_art_boss_09_nucleofinal` | Punto Final / Silencio (grieta negra, disuelve) | Sin acompañamiento; combinaciones de todas las pistas |
| — | Portero sin Rostro (subjefe) | `boss_00_anden` | 196 px | — | — | Guardián de acceso, no de pista |
| — | Arquitecto / Rey Contratiempo (secreto) | `boss_10_arquitecto` | 192 px | — | — | Mezcla de dos pistas; platos muestran combinación |

**Alturas protagonistas/enemigos como referencia:** Protagonista 104 px; enemigos 80–106 px; minijefe usa familia del motor escalada. Halos: Andén 0.46, Magneta 0.36, etc. (ver `BOSS_BASE` en `dd_world_renderer.js`).

---

<a id="10-tecnica"></a>
## 10. AUDITORÍA TÉCNICA DEL PROYECTO REAL

### 10.1 Motor y renderizador

- **Build publicada:** `index.html` (5.23 MB, 9.200 líneas) generada por `tools/build_active_html.py` desde `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` + 7 módulos `src/*`. No se edita a mano.
- **Motor base:** Monolito minificado (~8.5M chars) con `__DD_BRIDGE` (escala a DPR), `DMO_CINE.activeSeq`, `DMO_HUB`, `DMO_FLOOR`, `DMO_MUSIC`, `DMO_PROG`, etc. FSM implícita (body classes + visibilidad de overlays).
- **Render HD:** `DD_WORLD` (762 líneas) sustituye blitting pixel art por `drawImage` de ilustración. Usa `CIRCLE_CONFIG[10]`, `PROP_KIND_TO_ASSET`, `BOSS_INDEX_TO_SLUG`, `patternCache`, `drawSoftShadow`, `drawNeonGlow`. Convención: `(x,y)` = círculo de colisión en suelo; suelas en `y+14`; almas ordenadas por `ddGroundY`.
- **Build I+D:** `DEADBEAT_DISCO.ART.html` (13.49 MB, 21.922 líneas) — Histórica de HUB Tandas 01–09. Sin `#dd-main-menu` ni `DD_*` reales. **Se conserva intacta.**
- **Publicación:** GitHub Pages sirve `main` en `/`. `index.html` es superficie visible.

### 10.2 Registro de assets y carga

- **Manifiesto:** `assets/manifest.json` — 269 entradas (id, ruta, w/h, alpha, pivot, sha16). `src/dd_asset_registry.js` → `window.DD_ASSETS` con precarga por `Image()` + fallback a sprite heredado si falta ID.
- **Planificación:** 345 slots planificados, 269 registrados, 76 pendientes (todas armas C). Ver `ASSET_REPLACEMENT_MAP.json` y `MASTER_INVENTORY.json`.
- **Integración:** `batch.py audit --fix` verifica alfa real (corrige `cine_bg*_03_*` opacos mal registrados), `batch.py process/register`, `layout.py --write`, `preview_actors.py --bosses`, `probe_bosses.js`. Evidencias en `docs/ART_REBUILD/evidence/`.
- **Peligro de duplicación:** 105 armas C se renderizan hoy con sprite heredado del motor (pixel art) — no es bug, es fallback documentado.

### 10.3 Módulos y dependencias

| Módulo | Estado | Riesgo |
|---|---|---|
| `DD_ASSETS` | Vivo, 0 rutas rotas, 10.86 MB, 225 recursos decodificados OK | — |
| `DD_HUB` (safe zone) | Vivo, 4 estaciones, geometría/progresión intactas, `setPaused(true)` durante HUB | Faltan 6 estaciones; `hub:fox_neon` vs canon de estación ferroviaria |
| `DD_CINE` | Vivo, 7 cinemáticas + 9 círculos + 6 fondos de club | 6 fondos son láminas de presentación con paleta/marco/texto horneados — no válidos para nueva cinemática |
| `DD_UI` | Vivo, armería vacía por bug filtro `TODAS/ALL` vs `family` | Bloquea validación de armas legendarias |
| `DMO_MUSIC` + `DDC_COVER.music` | Dos motores conviviendo (juego vs menú) sin árbitro | Ya arbitrado por `DD_BOOT` en Fase 01 previa; conservar |
| `DD_BOOT` (FSM) | Vivo, `boot→loading→intro→main_menu→submenu→playing` | Hereda terminología "Círculo" — debe migrar |
| `__DD_BRIDGE` | Vivo, `startRun()`, `getSnapshot()`, `setPaused()`, DPR | Contrato estable |

### 10.4 HUB — Estado real vs diseño definido

- **Real:** 182 claves V5 (178 T01–08 + 4 alias T09), 27 canvas, 62 props, 11 estaciones (documentado en `CURRENT_STATE.md` pero solo 4 interactivas), zoom .9375, plataforma de descenso prototipada (260u expand, cutaway parallax, 56 brasas + 26 cenizas).
- **Falta:** Tocadiscos central, Archivo físico, Mesa de mezclas, Espejo, Sofá interactivo, Ventanas circulares, evolución visual por finales.
- **Legibilidad HUB:** Tandas correctivas 04–06 ya aplicaron: línea magenta recta 1089→0 px, bloom screen de niebla reducido (opacity 1→ controlado), saturación art-déco atenuada, separación de planos 17.95→23.65. Estado: `APROBADO` en `ART_CORRECCION_LEGIBILIDAD_HUB.md`.

### 10.5 Contratos que no se tocan en Fase 01

- Motor de colisiones, navegación, combate, progresión, guardado (`localStorage` 15+ claves), economía, audio.
- Geometría de salas, generación de grafo, transiciones `Ot.openT`, `floorDrop`.
- APIs: `DD_ASSETS.get()`, `DD_WORLD.draw*`, `DD_HUB.enter/exitToRun`, `DD_CINE.playIntro/playCircleDescent`, `DD_UI.showDialogue`, `__DD_BRIDGE.startRun/setPaused`.

---

<a id="11-arte"></a>
## 11. ESTADO DEL ARTE VISUAL — 374 ASSETS CLASIFICADOS

Fuente: `docs/ART_REBUILD/AUDIT_INVENTORY.md` + `AUDIT_CLASSIFICATION.json` (2026-11-12).

| Clase | Significado | Count | % |
|---|---|---|---|
| **A** | Conservar: ilustración sin defectos | 25 | 6.7% |
| **B** | Rehacer por estilo: pixel art / no sigue guías | 141 | 37.7% |
| **C** | Falta: sprite heredado del motor | 105 | 28.1% |
| **D** | Defectuoso: damero/huecos/fotograma basura | 37 | 9.9% |
| **E** | Rehecho y validado en juego (R01 27 + R02 24 + R03 15) | 66 | 17.6% |
| **Total** | | **374** | |

**Restan 283 por producir (B+C+D).** Capacidad: 10/sesión → ~29 tandas.

| Familia | Total | A | B | C | D | E | Próxima tanda |
|---|---|---|---|---|---|---|---|
| characters | 31 | 0 | 3 | 0 | 1 | 27 | R04 |
| enemies | 24 | 0 | 0 | 0 | 0 | 24 | ✔ R02 |
| bosses | 42 | 0 | 20 | 0 | 7 | 15 | R03 (27 restantes) |
| weapons | 121 | 0 | 16 | 105 | 0 | 0 | R05 |
| pickups | 20 | 0 | 20 | 0 | 0 | 0 | R06 |
| effects | 22 | 2 | 20 | 0 | 0 | 0 | R07 |
| props | 30 | 0 | 30 | 0 | 0 | 0 | R08 |
| floors | 12 | 12 | 0 | 0 | 0 | 0 | ✔ A |
| walls | 10 | 0 | 9 | 0 | 1 | 0 | R09 |
| environments | 8 | 0 | 5 | 0 | 3 | 0 | R09 |
| ui | 15 | 7 | 7 | 0 | 1 | 0 | R04/R09 |
| logos | 3 | 3 | 0 | 0 | 0 | 0 | ✔ A |
| cinematics | 35 | 0 | 11 | 0 | 24 | 0 | R10 |

**Fases R completadas y validadas en runtime** (evidencias `docs/ART_REBUILD/evidence/R*`):
- **R01 Protagonista (27):** Rehechos idle/walk/aim/shoot/roll/hurt/death + arms separados. Corregido fantasma de walk (9%→24% cobertura) y arma flotante (pies y balas recalibrados).
- **R02 Enemigos (24):** 6 familias × 4 estados (walk/windup/attack/death). Corregidos: frame fijo, balas 43px bajas, sort por `ddGroundY`, halos por familia.
- **R03 Jefes (15/42):** Reposo de 11 + ataque de 4. Corregidos: estado real `ddBossView`, señales de barrido/vida/vulnerable, muerte de 1s, tarjeta de presentación. Faltan 27 estados.

**Defectos de código ya corregidos (no se revertirán):** ver `AUDITORIA_VISUAL.md` §4bis/4ter.

---

<a id="12-reglas"></a>
## 12. REGLAS INNEGOCIABLES — VERIFICACIÓN EN FASE 01

| Regla del brief | Estado en Fase 01 | Evidencia |
|---|---|---|
| Lore vigente priorizado sobre referencias antiguas | ✅ Aplicado | Toda clasificación usa Biblia v1.0 como árbitro |
| No inventar acontecimientos para justificar diseños | ✅ Aplicado | Vacíos listados como PENDIENTES (§42), no rellenados |
| No conservar diseños obsoletos por comodidad | ✅ Aplicado | 37D + 141B marcados para rehacer; ningún "círculo infernal" conservado como identidad |
| No copiar literalmente imágenes de referencia | ✅ Aplicado | `ART_REFERENCES/` son guía de riqueza ambiental, no asset fuente |
| No convertir escenarios en variaciones cromáticas | ✅ Aplicado | Propuesta §8.3 exige diferenciación estructural |
| No generar recursos redundantes | ✅ Aplicado | Cero assets generados en esta fase; inventario 1:1 |
| No alterar sistemas funcionales sin necesidad | ✅ Aplicado | Motor/colisiones/progresión/audio intactos; solo documentación |
| No declarar integrado algo solo generado | ✅ Aplicado | Distinción GENERADO/INTEGRADO/VALIDADO respetada |
| No declarar aprobado algo no probado | ✅ Aplicado | Auditoría marca BLOQUEADO donde no hay QA de runtime |
| No ocultar defectos | ✅ Aplicado | §7 defectos del juego listados sin corregir |
| No sacrificar legibilidad por espectacularidad | ✅ Aplicado | Corrección HUB (bloom, saturación, línea magenta) ya aprobada |

---

<a id="13-decisiones"></a>
## 13. DECISIONES BLOQUEANTES — SE REQUIERE RESOLUCIÓN DEL AUTOR

La auditoría **se detiene aquí** para las siguientes decisiones que no pueden resolverse documentalmente:

### D-01. ¿Qué se hace con el slot "Limbo" / boss_00_anden?

| Opción | Implicación | Recomendación auditoría |
|---|---|---|
| **A. Reclasificar como Refugio/Acceso** | `floor_00_limbo_marble` → suelo de Refugio; `boss_00_anden` → subjefe Portero sin Rostro (§17.1) en sala secreta; `CIRCLE_CONFIG[0]` se elimina o se reetiqueta `refugio`. | **Recomendada** — Alinea conteo con canon (9 pistas). |
| B. Mantener como Pista 00 jugable | Se conserva "Limbo" como pista de tutorial | Rompe canon; requiere justificación narrativa nueva |
| C. Mantener como slot técnico invisible | Motor sigue con 10 slots, UI muestra 9 | Deuda técnica permanente; confunde auditoría futura |

**Bloquea:** Fase 03 (estructura del universo), Fase 04 (mapas jugables), Fase 09 (QA).

### D-02. Nombres definitivos de las 9 pistas

Los nombres "La Invitación" … "El Núcleo" son **propuestas**. ¿Se aprueban como nombres finales de pista para UI/mapa/diálogos?

| Si se aprueban | Si no se aprueban |
|---|---|
| Se usan en `CIRCLE_CONFIG`, `DD_CINE` tarjetas, `DD_UI` mapa, armería, cinemáticas. Requiere barrido de `CÍRCULO I·LUJURIA` → `PISTA 01·LA INVITACIÓN`. | Se mantienen como títulos de trabajo; IDs técnicos usan `pista_01 … pista_09` neutros hasta bautizo final. |

**Bloquea:** Fase 02 (Art Bible §Arquitectura/Paletas), Fase 04 (rótulos de sala), Fase 07 (cinemáticas).

### D-03. Soberanos: ¿se adoptan los nombres de la Biblia o se conservan los del motor?

| Opción | Ejemplo P01 | Implicación |
|---|---|---|
| **A. Canon narrativo** | Véspera | Coherencia con Biblia, lore y arma legendaria; requiere rewrite de tarjetas `MAGNETA → VÉSPERA` |
| B. Nombres del motor | Magneta | Coherencia con builds publicadas; fractura narrativa |
| **C. Alias dual (recomendado)** | `Véspera — la Anfitriona` (magneta como epíteto) | Transición sin romper saves/IDs: `boss_01_magneta` conserva ID, `displayName` usa canon |

**Recomendación:** C — IDs técnicos estables (`boss_01_magneta` etc.) + `displayName` canónico. Ya aplicado parcialmente en R03 (títulos del motor por jefe).

### D-04. DJ Virgilio → Tempo — ¿barrido inmediato o coexistencia?

| Opción | Implicación |
|---|---|
| A. Barrido completo (assets + código + diálogos) | Requiere re-render de `dialogue_portrait_dj` y rewrite de `DD_HUB` quotes |
| **B. Alias progresivo (recomendado)** | Código usa `Tempo` en UI nueva; `dialogue_portrait_dj` conserva archivo hasta R04, con etiqueta `tempo` en manifiesto |

**Bloquea:** R04 (PNJ del Refugio), diálogos del HUB.

### D-05. "Summon infernal" y otros nombres con "infernal"

Biblia §A ordena revisar nombres que rompan nomenclatura no-infernal. ¿Se aprueban renames?

| ID | Nombre actual | Propuesta |
|---|---|---|
| `c118_summon_infernal` | Summon infernal | **Convocador disonante** / **Llamada hueca** / **Invocador del eco** |
| `portal_avaricia_gold` etc. | "avaricia" | Revisar si se conserva "avaricia" como término de pista o se migra a "Cámara de los Instantes" |

### D-06. ¿Se reordena CIRCLE_CONFIG para alinear índices con pistas 01–09?

Hoy: `0=limbo, 1=lust, 2=gula, 3=greed … 9=core` (10 entradas). Propuesta: `1=invitacion … 9=nucleo` + `hub=refugio` separado.

| Sí | No |
|---|---|
| Requiere migración de `DD_WORLD.getCircleCfg()`, `CIRCLE_THEMES`, `DD_CINE` y saves | Se mantiene mapeo 0–9 legacy y se documenta alias `limbo→refugio` |

**Recomendación:** Sí, en Fase 03, con migración de saves y QA de regresión. No tocar en Fase 01.

### D-07. ¿Se autoriza modificar `index.html` generado (barrido terminológico)?

Toda corrección de "Círculo → Pista" implica regenerar `index.html` vía `tools/build_active_html.py`. ¿Se autoriza el diff para revisión?

**Respuesta esperada:** Sí, tras aprobar D-01/D-02.

---

<a id="14-criterios"></a>
## 14. CRITERIOS DE ACEPTACIÓN DE FASE 01

La fase se marca **APROBADA** cuando:

- [ ] Este documento es revisado y las **7 decisiones (D-01 a D-07)** reciben resolución escrita (aprobada/rechazada/pospuesta con owner).
- [ ] Se congela la **lista canónica de 9 pistas** (provisional o definitiva) y su correspondencia con soberanos/jefes motor.
- [ ] Se congela la **nomenclatura de migración** (términos heredados → vigentes) para uso en código/UI/docs.
- [ ] No se ha generado ni sustituido ningún asset (verificación: `git diff --stat assets/` vacío para esta fase).
- [ ] No se ha modificado ningún sistema de combate/progresión/movimiento (verificación: `git diff --stat src/` solo documental si se autoriza D-07).
- [ ] El **inventario 374A/B/C/D/E** es aceptado como baseline para plan de tandas.
- [ ] Los **vacíos §42** son aceptados como pendientes, no como deudas ocultas.

**Entregables de Fase 01 (esta tanda):**

- `docs/RECONSTRUCCION/FASE_01_AUDITORIA_INTEGRAL.md` (este archivo) — VERIFICADO
- `docs/RECONSTRUCCION/FASE_01_MATRIZ_CANON.json` — pendiente de generar tras D-01/D-02 (mapeo máquina)
- Evidencias: hojas de contacto, capturas HUB/círculos, `AUDIT_INVENTORY.md` — ya existentes y referenciadas

---

<a id="15-hoja"></a>
## 15. HOJA DE RUTA FASES 02–10

| Fase | Nombre | Entregables clave | Dependencia |
|---|---|---|---|
| **01** | **Auditoría narrativa y documental** | Auditoría integral + matriz canon + decisiones D-01…D-07 | — (actual) |
| **02** | **Nueva Art Bible** | Biblia artística definitiva: identidad general, lenguaje de formas, proporciones/siluetas, materiales/texturas, iluminación, paletas por pista, arquitectura, perspectiva, escala, animación, VFX, legibilidad en combate | D-01, D-02 |
| **03** | **Diseño del universo y escenarios** | Ficha de cada pista con 14 atributos (§4 del brief): identidad narrativa/función/arquitectura/paleta/iluminación/ambientación/enemigos/jefes/interactivos/mecánicas/rutas/secretos/conexiones. Diferenciación estructural. | 02 + D-03 |
| **04** | **Arquitectura espacial y mapas jugables** | Mapas con entrada → exploración → combates → rutas alternativas → secretos → jefe → salidas. Verticalidad con utilidad. Conteo de salas motivado, no "20 por escenario". | 03 |
| **05** | **Personajes, enemigos y jefes — diseño** | Diseño canónico por personaje: silueta, paleta, proporciones, equipamiento, expresiones, animaciones necesarias, estados de combate, variantes justificadas. Familias visuales coherentes. | 02, 03 |
| **06** | **Producción de escenarios y recursos** | Props, suelos, muros, puertas, mobiliario, umbrales por pista. Estructura de producción: nombre/categoría/ubicación/dimensiones/formato/transparencia/ID/relación narrativa/estado. | 02, 04 |
| **07** | **Animaciones, efectos y cinemáticas** | Idle/move/run/attack/habilidades/daño/muerte/interacciones + estados de jefe. Respeto de direcciones/proporciones. VFX legibles. | 05 |
| **08** | **Integración en el motor** | Sustitución de funciones de dibujo, registro de IDs, atlas/manifests, QA de carga/render/escala/perspectiva/iluminación/capas/colisiones/animaciones/HUD/legibilidad/rendimiento/resoluciones. Por pista. | 06, 07 |
| **09** | **QA visual, técnico y jugable** | Capturas reales + pruebas reproducibles. Matriz de validación por resolución. Métricas de rendimiento. Regresión de T01–T08. Distinción generado/integrado/validado. | 08 |
| **10** | **Consolidación y entrega** | Build unificada + documentación de sustituciones + changelog + plan de validación + evidencias. | 09 |

**Capacidad estimada:** 283 assets restantes a 10/sesión = ~29 tandas de arte + 3–5 tandas de integración/QA por fase de universo.

---

<a id="16-anexos"></a>
## 16. ANEXOS

### 16.1 Fuentes primarias

- `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` — Capítulos 0–17 + Anexos A/B + Parte XI (vacíos).
- `docs/ART_REBUILD/AUDITORIA_VISUAL.md` — Método, hallazgos por familia, §4bis/4ter (defectos de código ya corregidos).
- `docs/ART_REBUILD/AUDIT_INVENTORY.md` / `AUDIT_CLASSIFICATION.json` — 374 assets A–E.
- `docs/ART_REBUILD/MASTER_INVENTORY.md` — 330 recursos planificados (225 verificados).
- `ART_BIBLE.md` v1.3 — Identidad visual vigente (cyber-gothic nightclub, negro/rojo/magenta/cian/oro, luz NW, contornos near-black, sin sombras horneadas, diamante 2:1).
- `CURRENT_STATE.md` — Historial de HUB T01–09 + corrección legibilidad (bloom, magenta, separación 17.95→23.65).

### 16.2 Glosario de migración (términos heredados → vigentes)

| Heredado | Vigente | Ámbito |
|---|---|---|
| Círculo N · [Pecado] | Pista N · [Deseo] | UI, mapa, código, docs |
| Nueve círculos | Nueve pistas | Lore, tutorial, diálogos |
| Círculo final | Núcleo (Pista 09) | UI, DD_CINE |
| DJ Virgilio | Tempo | Diálogos, HUB, retrato |
| Infierno / inframundo | Torre / estructura subterránea | Lore, descripciones |
| Pecados capitales | Deseos convertidos en leyes de la pista | Tutorial, códex |
| Limbo (Círculo 0) | Refugio (HUB, no numerado) / Acceso | Motor, CIRCLE_CONFIG, suelos |
| Bajada por los círculos | Descenso por la torre | Cinemática, DD_HUB |
| Summon infernal | Convocador disonante (propuesta) | Armas |

### 16.3 IDs técnicos que se conservan (estabilidad)

Aunque la presentación migre a "pista/Tempo", los **IDs de archivo y registro** se conservan para no romper `assets/manifest.json`, `DD_ASSETS`, saves y `tools/build_active_html.py`:

- `boss_00_anden` … `boss_09_nucleo`, `boss_10_arquitecto` (IDs de asset)
- `floor_00_limbo_marble` … `floor_09_core_cosmic_vein` (IDs de suelo — reetiquetados en displayName, no renombrados en disco hasta Fase 03)
- `wall_panel_gothic_niche` etc. (muros — idem)
- `dialogue_portrait_dj` (re-etiquetado a `tempo` en `displayName`)

### 16.4 Estado de integración al cierre de Fase 01

- **Sin modificaciones de motor ni assets en esta fase:** `git status` limpio salvo este documento.
- **Builds intactas:** `index.html` SHA `41fce97f…` (según `FASE_01_AUDITORIA.md`), `DEADBEAT_DISCO.ART.html` 13.49 MB.
- **HUB:** 182 claves V5, 27 canvas, 62 props, 4 estaciones interactivas — Estado `INTEGRADO_VALIDADO` T09 (con flag `__DDM_HUB_T09=false` reversible y corrección legibilidad `__DDM_HUB_LEGIBILIDAD=true`).
- **QA pendiente para reconstrucción integral:** Regresión completa T01–09, performance gate T02, 8 BLOQUEADO T03 — heredados, no bloquean Fase 01.

---

## FIRMA DE FASE

**Fase 01 — Auditoría narrativa y documental:** `COMPLETADA — PENDIENTE DE DECISIONES D-01…D-07`  
**Próxima fase:** `FASE 02 — Nueva Biblia Artística` (no se inicia hasta resolver D-01/D-02)  
**Responsabilidad:** El lore vigente es la autoridad. El arte representará esa narrativa, nunca la sustituirá.

> *Cada deseo se convierte en un ritmo; cada ritmo, en una prisión.* — Ley fundamental (§2.4)

