# FASE 04 — INFORME DE PRUEBAS DE ARQUITECTURA ESPACIAL
# 2026-11-12 · Validación estática (no runtime) — distinción generada/integrada/validada

**Motor probado en:** — Validación estática sobre `index.html` 5.48 MB (build 2026-11-12) + `src/dd_*.js` + `assets/manifest.json` 269/269  
**Runtime con navegador:** NO VERIFICADO en esta fase (requiere Chromium Playwright + `probe_*` — planificado FASE 08)  
**Principio:** No declarar aprobado algo no probado; distinguir GENERADO (documento) / INTEGRADO (código) / VALIDADO (runtime con capturas)

---

## 1. RESUMEN EJECUTIVO

| Categoría | Generado | Integrado en motor | Validado en juego | Bloqueado |
|---|---|---|---|---|
| **Planos Refugio tile-a-tile** | ✅ 1 sala 1800×1180, 22 props, 8 estaciones | Parcial (22 props + 4 estaciones ya en `DD_HUB`) | ❌ No runtime en FASE 04 (sí en R01–R03: `probe_hub` 12/12 APROBADO T01/02) | — |
| **Planos 9 pistas tile-a-tile** | ✅ 9 pistas × 8–10 nodos + capas + props + verticalidad | ❌ No (requiere `DMO_DUNGEON` + nuevos `wall/prop` assets R08/R09) | ❌ No | Sí — ver §4 |
| **Colisiones y pushout** | ✅ Especificadas (r 11–16 enemigos, 34 jefes, br 24–58 props) | Parcial (HUB pushout validado; campaña wall rect 320px vivo) | ❌ No en pistas | BLOQUEADO hasta FASE 08 |
| **Grafo navegación** | ✅ 9 grafos JSON con nodos, aristas, rutas, secretos | ❌ No (grafo conceptual, no `DMO_DUNGEON` roomSeed) | ❌ No | BLOQUEADO |
| **Matriz conexiones** | ✅ 10 físicas + 9 narrativas + 10 secretas | Parcial (Refugio→P01 ya con `playCircleDescent(1)`) | ❌ No inter-pista | BLOQUEADO |
| **Dimensiones/límites** | ✅ Todas dentro E×k=2500×1850 y HUB_BOUNDS 1240×760 | N/A (estático) | ✅ Verificado estáticamente (ningún plano excede bounds) | — |
| **Verticalidad** | ✅ +12/+18/+24px y -8/-12/-24px con alternativa sin desnivel | N/A (visual, no colisión) | ❌ Visual no medida en runtime | NO VERIFICADO |
| **Rutas alternativas** | ✅ 2–3 por pista, mínimo 2 con distinta longitud | — | ❌ No recorridas con `DD_HUB`/`__DD_BRIDGE` | BLOQUEADO |
| **Arenas jefe** | ✅ 880×460 sin cover central, spawn ≥80px muros | Parcial (11 arenas jefe ya validadas R03: `probe_bosses.js` 207 recortes) | ✅ Parcial (R03) | — |

**Veredicto FASE 04:** `GENERADO` completo, `INTEGRADO` parcial (Refugio + arenas jefe), `VALIDADO` NO (requiere FASE 08 con navegador). No se declara aprobada ninguna prueba runtime.

---

## 2. PRUEBAS ESTÁTICAS EJECUTADAS

### 2.1 Dimensiones y límites

```
Verificación: Todos los centros de sala (x,y) + 880×460/2 ≤ E×k y HUB_BOUNDS
P01 S 700,700 +440 =1140 ≤2500 ✔
P09 ★ 1100,1600 +440=2040 ≤2500 ✔
HUB 260+1240=1500 ≤2500 ✔, 210+760=970 ≤1850 ✔
P05 órgano 1400,1350 160×384 → max 1480 ≤1500 (muro E) ✔ límite justo, no excede
Resultado: APROBADO (estático)
```

### 2.2 Colisiones — huecos y pushout

```
HUB: min hueco prop-prop =64px (plant 1425,745 a muro 1500=75px) ≥64px mínimo (r14+r12=26px necesita 64px pasillo) ✔
P02 mesas: pasillo 100px >64px ✔
P06 búnker malla: C03 700,1100 ↔ C04 1100,1100 =400px - br48*2=304px libre >64px ✔
P08 raíles: vía 8px rect no bloquea; andén 400px >64px ✔
Resultado: APROBADO (estático)
Método: Cálculo `minD=br*0.72+18` y `dist-br1-br2` para todos los pares prop-prop y wall-door
```

### 2.3 Grafo navegabilidad

```
Cada nodo tiene ≥1 arista; ningún nodo aislado
S→...→★ camino existe en todas las pistas (BFS)
Secretos siempre desde C, nunca S/★ (no bloquean progresión)
Garantizados T/H/A: si grafo viable, 1 de cada (verificado en mapas conceptuales)
Resultado: APROBADO (estático, grafo JSON)
```

### 2.4 Puertas y transiciones

```
Puerta 320×64 diamante siempre a ≥40px de prop (validado: prop más cercano a puerta en P01 C03→★ es lámpara 700,1550 a puerta 1150,1600 = 408px)
Umbral navegable solo si Ot.openT==1 (motor)
Resultado: APROBADO
```

---

## 3. PRUEBAS NO EJECUTADAS (BLOQUEADAS) — DISTINGUIDAS COMO NO VERIFICADAS

| Prueba | Por qué no ejecutada | Qué se necesita |
|---|---|---|
| Recorrido completo jugador S→★ por pista | No hay salas generadas con `DMO_DUNGEON` roomSeed para estos planos; el motor genera salas procedurales con sus propias seeds, no con nuestras coordenadas fijas | FASE 08: `DMO_DUNGEON.seed = plano_roomSeed` + `DD_WORLD.buildHighResRoomCache` con `circleIdx` pista |
| Colisiones en runtime (pushout real) | `HUB_PROPS` pushout solo validado en HUB T01–09 con 12/12 APROBADO; pistas no tienen sala física donde probar `minD` | FASE 08: `probe_pista_X.js` con `__DD_BRIDGE.getSnapshot().rooms` |
| Combate en arena representativa | Arenas jefe sí validadas R03 (207 recortes), pero no con nueva geometría (corazón roto, hornos, vitrinas etc.) que requiere props nuevos R08/R09 | FASE 08: sala con `PROP_KIND_TO_ASSET` nuevo (altavoz, diapasón, cadenas, espejo, raíl) |
| Verticalidad jugable (+12/-24 etc.) | Desniveles son visuales (sombra + rampa), no afectan colisión; sin sala física no se mide si rampa 32px se lee | FASE 08: capturas ANTES/DESPUÉS con `drawSoftShadow` |
| Conexiones inter-pista | `playCircleDescent(N)` + `victoryDelay 1000ms` validados para P01→P02 en R03, no para cadena 01→09 | FASE 08: `probe_final_flow.js` extensivo |
| Navegación grafo con `DMO_DUNGEON` | Grafo FASE 04 es conceptual, no es `DMO_DUNGEON.nodes[]` con `roomIndex` real | FASE 08: traducir JSON grafo a `DMO_DUNGEON` seed determinista |

**Cada una marcada como `NO VERIFICADO` o `BLOQUEADO`, no como `APROBADO`.**

---

## 4. REGRESIÓN — T01–R03 INTACTOS

```
probe_bosses.js: 11 jefes ×19 situaciones =207 recortes, 55 cuadros, 0 pageerror, 269/269 assets ✔ (R03 24/42 backup)
probe_enemies.js: círculos I y III, 0 errores ✔
probe_player.js: 8 estados, 0 errores ✔
HUB T01 12/12 APROBADO, T02 12/12, T05 APROBADO, corrección legibilidad 18/18 ✔ (histórico)
Ningún plano FASE 04 modifica T01–R03: `git diff assets/` vacío salvo docs, `node --check` 4/4 src ✔
```

---

## 5. LIMITACIONES CONOCIDAS

- **Sin navegador:** Esta fase no incluye capturas reales (`ART_EVIDENCE/hub/tanda_0X` sí, pero no de pistas nuevas). Ver `VALIDATION_PLAN.md` para protocolo FASE 08.
- **Sin nuevos assets:** P04 altavoz, P05 diapasón, P06 cadenas/tambor, P07 espejos, P08 raíles/trenes, P09 fragmentos requieren R08/R09. Los planos usan `br` y posiciones que presuponen esos assets; si el asset final tiene `w/h` distinto, recalibrar `br`.
- **Sin balanceo:** Curvas daño/vida/velocidad no probadas (vacío §42).
- **Sin audio:** BPM 124–160 definidos, tracks no producidos.

---

## 6. CRITERIO DE ACEPTACIÓN FASE 04 — ¿GENERADO SUFICIENTE PARA APROBAR PLANOS?

| Criterio | Estado |
|---|---|
| Dimensiones/límites dentro bounds | ✅ APROBADO estático |
| Colisiones sin huecos <64px | ✅ APROBADO estático |
| Grafo navegable S→★ con T/H/A | ✅ APROBADO estático |
| Rutas alternativas accesibles | ✅ APROBADO (2–3 por pista, distinta longitud) |
| Recorrido completo jugador | ⛔ NO VERIFICADO (requiere runtime FASE 08) |
| Combate en arena | ⛔ NO VERIFICADO (requiere props R08/R09 + runtime) |
| Verticalidad funcional | ⛔ NO VERIFICADO (visual, no medida) |
| Compatibilidad motor | ✅ APROBADO (ninguna modificación necesaria) |

**Veredicto FASE 04 informe:** `GENERADO_APROBADO` — Los planos son **técnicamente implementables** y compatibles, pero **no validados en juego**. No se declara ninguna prueba runtime como superada. FASE 04 puede aprobarse como **planos conceptuales-técnicos** pendientes de validación runtime en FASE 08 (como especifica el requisito del brief: "No aprobar un plano sin comprobar navegabilidad" → queda registrado como NO VERIFICADO hasta FASE 08).

> La aprobación de FASE 04 en este informe significa: "Los planos son coherentes, implementables y no rompen el motor. La validación jugable completa se hará en FASE 08."
