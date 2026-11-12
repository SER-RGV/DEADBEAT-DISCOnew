# FASE 03 — DECISIONES PENDIENTES Y VACÍOS SEÑALADOS
# 2026-11-12 · No se inventa lore para rellenar apartados

**Autoridad:** Biblia §42 (11 vacíos oficiales) + Fichas Pistas (propuestas FASE 03)

---

## 1. VACÍOS OFICIALES HEREDADOS (§42 Biblia) — SIGUEN ABIERTOS

| # | Vacío | Estado FASE 03 | Propuesta Fase 03 (no canon hasta validación) |
|---|---|---|---|
| 1 | Nombre definitivo cada pista | **Cerrado D-01:** La Invitación..El Núcleo ya son canon | — |
| 2 | Geometría y plano exacto por nivel | **Propuesto:** Mapas conceptuales 8–10 nodos (no 20), formas abanico/horizontal/retícula/estrella/cruz/masa/diamante/lineal/vacío. Falta plano tile-a-tile. | Validar en FASE 04 (mapas jugables con colisiones reales) |
| 3 | Distribución final salas/rutas/duración | **Propuesto:** Nodos por pista (01:8, 02:9, 03:10, 04:9, 05:10, 06:8, 07:10, 08:9, 09:6). Tiempo estimado pista: 12–18 min. | Medir en playtest FASE 04 |
| 4 | Mecánica individual 120 armas heredadas | Vacío — No se ha tocado. 16 B + 105 C pendientes R05. | R05 con Biblia Artística v2.0 |
| 5 | Lista completa objetos más allá de documentados | Vacío — 20 pickups B pendientes R06. | R06 |
| 6 | Costes CR/Ecos/Fragmentos | Vacío — No fijado. Afecta Mesa mezclas HUB. | Diseño economía FASE 08 |
| 7 | Curvas daño/vida/velocidad/dificultad | Vacío — No balanceado. Acto I/II/III/IV propuesto pero sin números. | QA FASE 09 |
| 8 | Diálogos completos Tempo + desbloqueos testimonios | Vacío — Solo 4 DJ_QUOTES legacy (Tempo migrado). 9 testimonios pista + 3 finales pendientes. | Escritura FASE 07–08 |
| 9 | Estación física Archivo en HUB | **Propuesto:** Archivo en `480,300` HUB (estantería bar), pero sin asset ni interacción. | Arte R10 + código HUB FASE 08 |
| 10 | Música/FX/animación cinemática | Vacío — BPM por pista definidos en `CIRCLE_META` (124–160), pero tracks no producidos. | Audio FASE 07 |
| 11 | Relación plataforma cinemática ↔ acceso jugable | **Propuesto:** Plataforma descenso = única conexión HUB↔P01 (shaft 260·shaftOpen, 5 planos parallax). Coherencia cinemática↔gameplay validada conceptualmente, no en runtime. | Validación FASE 08 (descenso jugable) |

---

## 2. PROPUESTAS NUEVAS DE FASE 03 — REQUIEREN VALIDACIÓN

| Propuesta | Riesgo si no se valida | Cómo se valida |
|---|---|---|
| **Nº nodos por pista (8–10, no 20)** | Si P06 búnker de 8 nodos resulta vacío, necesitará 10. Si P03 retícula de 10 resulta densa, bajará a 8. | FASE 04: jugar cada pista completa; medir tiempo sala vacía vs llena |
| **Verticalidad +12/+18/+24px y fosos -8/-12/-24px** | Si desnivel 12px no se lee, subir a 18px. Si 24px bloquea colisión, bajar. | FASE 04: probar con `drawGroundY` + colisión real; capturas grises |
| **Enemigo nuevo por pista (8 canónicos nuevos)** | Si Sombra abrazadora es frustrante (adhesión), ajustar a ralentiza 20% en vez de 30%. | FASE 05–06: prototipar 1 pista con enemigo nuevo |
| **Armas 04–05 por canonizar (Grito Hueco, Diapasón)** | Si no se canonizan, P04/P05 se quedan sin legendaria. | Autorización narrativa + diseño arma FASE 05 |
| **Destructibles (focos, bandejas, vitrinas, altavoces, diapasones, cadenas, espejos, raíles)** | Si destructible tiene 8 impactos y nadie lo destruye, bajar a 4. Si es de 1 disparo y todos lo destruyen, subir. | Playtest FASE 04 por pista |
| **Arena corazón roto / horno ventral / vitrina central etc. como salas especiales** | Si sala especial es indistinguible de combate normal, añadir elemento escenográfico protagonista. | Screenshots FASE 04 + feedback jugador |

---

## 3. DECISIONES QUE NO SE HAN TOMADO (y no deben tomarse sin playtest)

1. **¿El Banquete necesita 9 nodos o 8?** Propuesto 9, pero si bandejas móviles hacen pasillos estrechos injugables, reducir a 8.
2. **¿La Nota Ausente debe tener niebla o no?** Propuesto sin niebla (verticalidad basta), pero si diapasón no se lee, añadir haze +0.03.
3. **¿El Umbral debe tener ante-sala norte o ser búnker directo?** Propuesto con ante-sala para no clavar jefe tras 4 nodos malla, pero podría ser 7 nodos totales.
4. **¿El Núcleo debe tener 6 nodos o 5+1 (Rey separado)?** Propuesto 6 con Rey en capa 5; si 3 fases requieren más espacio, separar en 7.
5. **¿Refugio necesita Tocadiscos como segunda entrada o solo Plataforma?** Propuesto tocadiscos como alias, pero si confunde, mantener solo plataforma.

---

## 4. CONTRADICCIONES RESUELTAS EN FASE 03

| Contradicción anterior | Resolución |
|---|---|
| 9 vs 10 pistas (limbo) | Limbo → Refugio no numerado (§1 Diseño Universo vertical). `CIRCLE_CONFIG[0]` es alias Refugio, no pista. |
| MAGNETA vs Véspera | Véspera canónica (D-03); `boss_01_magneta` display migrado a Véspera (D-05). |
| REF_03 vs Biblia §7–15 | REF_03 obsoleta; fichas pista usan Biblia + Biblia Artística v2.0 |
| Ciudad absorbida | Descartada D-02; ni mapas ni diálogos la mencionan. |
| 20 salas por pista por obligación | Nodos motivados (6–10) según forma dominante, no 20 fijos. |
| Variación cromática pura | Curva/recta/retícula/cono/vertical/masa/diagonal/lineal/vacío + paleta + arquitectura garantizan grises distintos. |

---

## 5. PRÓXIMA FASE — QUÉ SE NECESITA PARA FASE 04

**FASE 04 — Arquitectura espacial y mapas jugables** requiere:

- Plano tile-a-tile de cada pista (no solo conceptual) con colisiones `HUB_BOUNDS` + `HUB_PROPS` por pista
- Validación de `buildHighResRoomCache` con nuevos `wall_*` por pista (P04 necesita `wall_altavoz`, P08 `wall_hielo` ya existe)
- Playtest de 1 pista completa (P01 recomendada) con nodos propuestos para medir ritmo

**Bloqueante:** Ninguno. FASE 03 está lista para aprobación.

---

## 6. INFORME DE COHERENCIA FASE 03

| Criterio aceptación | Estado |
|---|---|
| 9 pistas con identidad propia | ✅ Cada una con forma, paleta, arquitectura, enemigo, soberano, mecánica, mapa únicos |
| Refugio diferenciado | ✅ 1 sala damero-estación, no grafo; tregua vs pistas; 10 zonas Biblia, 4→10 estaciones planificadas |
| Soberanos vinculados a escenarios | ✅ Arquitectura/material/símbolo/arena jefe refuerzan identidad (ej: vitrina central Áurea, corazón roto Véspera, raíles Nix) |
| Mecánicas con sentido en espacio | ✅ Pulsos en focos curvos, bandejas en mesas largas, reflejo en vitrinas, conos en estrella, silencio en nave, cadenas en puerta, espejos en diamante, trenes en raíles, fragmentos en vacío |
| Mapas con recorridos diferenciados | ✅ 8–10 nodos con 2–3 rutas + verticalidad funcional; matriz similitud max 1.33/3 (umbral 2) |
| Sin contradicciones Biblia v2.0/lore | ✅ Nombres pista D-01, soberanos D-03, texto D-05, ciudad descartada D-02, alcance D-04 respetados; vacíos §42 señalados no rellenados |

**Veredicto:** FASE 03 APROBABLE — pendiente tu aprobación para FASE 04.
