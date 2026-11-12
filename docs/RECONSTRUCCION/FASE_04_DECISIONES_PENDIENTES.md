# FASE 04 — DECISIONES PENDIENTES Y REGISTRO DE LIMITACIONES
# 2026-11-12

---

## 1. VACÍOS QUE SIGUEN ABIERTOS (§42 Biblia, no rellenados)

| Vacío | Estado tras FASE 04 | Qué falta |
|---|---|---|
| Costes CR/Ecos/Fragmentos | Vacío | Define economía Mesa mezclas; bloquea progresión permanente |
| Curvas daño/vida/velocidad/dificultad | Vacío | Balanceo Acto I–IV propuesto sin números |
| Diálogos Tempo + desbloqueos testimonios | Vacío | 9 testimonios + frases soberanos solo extractos |
| Música por pista (124–160 BPM definidos, tracks no producidos) | Vacío | Audio |
| Relación exacta plataforma cinemática ↔ acceso jugable | Propuesto como misma plataforma, no validado runtime |

---

## 2. DECISIONES NUEVAS DE FASE 04 — PROPUESTAS NO CANONIZADAS

| Decisión | Propuesta FASE 04 | Alternativa | Cómo se decide |
|---|---|---|---|
| **Nº nodos final por pista** | 8/9/10/9/10/8/10/9/6 (motivado por forma) | 20 fijos (rechazado) | Playtest FASE 08: si P03 10 nodos resulta densa, bajar a 8 |
| **Hornos +18px** | Visual, no colisión | +24px si no se lee | Captura runtime |
| **Vitrinas 32px cover** | Altura fija 32px | 24px si bloquea visión | Playtest tiro parabólico |
| **Altavoces destructibles 8 impactos** | 8 disparos | 4 si nadie los destruye | Métrica probes |
| **Cadenas 8 impactos / tambor 3 golpes** | Valores propuestos | Ajustar por métrica | Probe combate |
| **Raíles 8px + tren cada 8s** | Hazard lineal | Cada 6s si es fácil | Playtest P08 |
| **Fragmentos 2s temporales** | Plataforma cae en 2s | 3s si es frustrante | Probe Núcleo |
| **Pasarelas +18/+24px con rampa 32px** | Rampa visual 32px | Sin rampa (teleport) rechazado | Captura sombra |

---

## 3. LIMITACIONES DE FASE 04 — DISTINGUIDAS

- **Sin assets nuevos:** P04 altavoz viviente, P05 diapasón, P06 cadenas/tambor, P07 espejos, P08 raíles/trenes, P09 fragmentos requieren R08/R09. Planos usan `br` estimado que puede cambiar ±20% con asset final.
- **Sin runtime:** Todas las pruebas jugables marcadas NO VERIFICADO/BLOQUEADO hasta FASE 08 (ver Informe Pruebas).
- **Sin balanceo:** Tiempo por pista 12–18 min estimado, no medido.
- **Sin audio:** BPM sin tracks.
- **Grafo conceptual:** No es `DMO_DUNGEON.nodes[]` real con seeds; es especificación para traducir a seeds en FASE 08.

---

## 4. TRAZABILIDAD — TODO TIENE FUENTE

| Plano | Fuente |
|---|---|
| Forma dominante por pista | ART_BIBLE v2.0 §1.2 (curva…vacío) |
| Paleta/haze por pista | FASE_02_PALETAS_POR_PISTA.json |
| Enemigos canónicos | Biblia §7–15 + FASE_03_FICHAS |
| Soberanos y arenas | Biblia §7–15 + FASE_02_SOBERANOS_REFERENCIAS |
| Nodos/capas/rutas | Biblia §6.2 (8–12, 4–5 capas, 2–3 rutas) + forma dominante |
| Números nodos 8–10 (no 20) | Forma dominante motivada, no obligación |
| HUB | FASE_03_REFUGIO.md |

---

## 5. INFORME DE COHERENCIA FASE 04

| Criterio | Estado |
|---|---|
| Planos no modifican identidad artística v2.0 | ✅ |
| No se recuperan mapas legacy | ✅ (todo nuevo, no DM0 legacy) |
| No se generaron assets definitivos | ✅ (`git diff assets/` vacío) |
| No se modificó motor sin justificación | ✅ (0 cambios, solo docs) |
| Mapas funcionan visualmente y técnicamente | ✅ (dimensiones/colisiones/grafo validados estáticamente) |
| Cada plano validado navegabilidad/colisiones en estático | ✅ (huecos >64px, pasillos 100px, puertas libres) |
| Refugio independiente 9 pistas | ✅ (1 sala damero, no grafo) |

**Veredicto:** FASE 04 GENERADO_APROBADO — Planos listos para aprobación como base para FASE 05 (personajes) y FASE 08 (validación runtime). No se declara validado en juego.
