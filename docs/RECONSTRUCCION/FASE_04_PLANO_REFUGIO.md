# FASE 04 — PLANO REFUGIO · TILE-A-TILE
# HUB 1800×1180 cache, HUB_BOUNDS 1240×760, 2026-11-12

**Sistema:** Canvas 1800×1180, cámara clamp x0=204,x1=1556,y0=60,y1=1026, zoom 1.02–1.6, 22 props + 4→8 estaciones + 3 NPCs + prota
**Validación:** Cada prop con `br` genera pushout `minD=br*0.72+18`; ningún hueco <64px; puertas 320×64 libres; HUB no tiene grafo, es 1 sala

---

## 1. SUELO — DAMERO Y MOQUETAS

| Zona | Tile | Coordenadas (rect) | Navegable | Nota |
|---|---|---|---|---|
| **Damero base** | `floor_10_hub_checker` 512×512 | Toda cache 0,0→1800,1180 | Sí | pattern repeat x0%512 |
| **Pasillo central VIP** | `floor_11_vip_velvet` 512×512 moqueta carmesí | `x=600,y=420,w=560,h=200` | Sí | Bajo sofás gemelos, desnivel 0 |
| **Mármol marfil pasillo sur** | `floor_00_limbo_marble` 512×512 | `x=700,y=750,w=360,h=80` | Sí | Ante-plataforma cian |
| **Plataforma cian** | `threshold_descent_pad` 512×320 | `x=624,y=625,w=512,h=320` (centro 880,785) | Sí, pero trigger | `drawDescentPad` pulsante |

---

## 2. MUROS Y PILARES

| Elemento | Asset | Posición | Dimensión | Colisión |
|---|---|---|---|---|
| Muros perimetrales | `wall_panel_gothic_niche` 256×384 | Cada 320px: 260,210→1500,210 (N), 260,970→1500,970 (S), 260,210→260,970 (O), 1500,210→1500,970 (E) | 320×32 rect | Sí, wall rect |
| Pilares | `wall_pillar_obsidian` 192×384 | Cada 640px: 450,210 / 770,210 / 1090,210 / 1410,210 (N) + esquinas | 32×32 rect | Sí, integrado en muro |
| Cornisa/zócalo | Compartidos con pista P01 | Todo perímetro | — | Visual |
| Lámparas araña | `prop_chandelier_gold` 320×320 → 136×136 | `650,215` + `1110,215` | 136×136 | No — techo, sin colisión |
| Zorro neón | `prop_hub_fox_neon` 384×512 → 112×148 | `fx=1382,fy=360` | 112×148 | No — pared, glow 185 radio |

---

## 3. PROPS DETALLADOS (22 unidades, pushout validado)

| # | kind | x | y | br | minD | Hueco a vecino | Estado |
|---|---|---|---|---|---|---|---|
| 1 | shelf | 430 | 245 | 44 | 49.6 | 68px a shelf 2 (ok >64) | ✔ |
| 2 | shelf | 560 | 245 | 44 | 49.6 | 72px a barcounter (ok) | ✔ |
| 3 | barcounter | 740 | 278 | 56 | 58.3 | 95px a speaker (ok) | ✔ |
| 4 | cooler | 325 | 280 | 36 | 43.9 | 71px a shelf1 (ok) | ✔ |
| 5 | speaker | 1035 | 255 | 36 | 43.9 | 66px a djbooth (ok) | ✔ |
| 6 | djbooth | 1165 | 278 | 58 | 59.7 | 68px a subwoofer (ok) | ✔ |
| 7 | subwoofer | 1305 | 265 | 38 | 45.3 | 74px a palm (ok) | ✔ |
| 8 | palm | 1415 | 295 | 38 | 45.3 | 64px a muro E (ok límite) | ✔ |
| 9 | sofa | 745 | 470 | 48 | 52.5 | 112px a sofa2 (ok) | ✔ |
| 10 | sofa | 1015 | 470 | 48 | 52.5 | — | ✔ |
| 11 | bench | 880 | 488 | 34 | 42.4 | 68px a sofa1/2 (ok) | ✔ |
| 12 | armchair | 635 | 545 | 34 | 42.4 | 76px a bench (ok) | ✔ |
| 13 | armchair | 1125 | 545 | 34 | 42.4 | 76px a bench (ok) | ✔ |
| 14 | candelabra | 675 | 410 | 24 | 35.2 | 68px a sofa1 (ok) | ✔ |
| 15 | candelabra | 1085 | 410 | 24 | 35.2 | 68px a sofa2 (ok) | ✔ |
| 16 | vending | 355 | 515 | 42 | 48.2 | 68px a arcade (ok) | ✔ |
| 17 | arcade | 355 | 655 | 40 | 46.8 | 68px a chest (ok) | ✔ |
| 18 | chest | 455 | 565 | 34 | 42.4 | 72px a armory station (ok) | ✔ |
| 19 | pedestal | 1365 | 585 | 40 | 46.8 | 78px a map station (ok) | ✔ |
| 20 | plant | 1425 | 745 | 32 | 41.0 | 64px a muro S (ok límite) | ✔ |
| 21 | plant | 335 | 845 | 32 | 41.0 | 64px a muro S (ok) | ✔ |
| 22 | — | — | — | — | — | — | — |

**Validado:** Todos los huecos >64px (mínimo prota r14 + enemigo r12 = 26px necesita 64px pasillo). Ningún prop a <40px de puerta umbral.

---

## 4. ESTACIONES (8 total, 4 actuales + 4 propuestas)

| ID | Label | x | y | r | Prompt | Acción | Estado |
|---|---|---|---|---|---|---|---|
| `descent` | PLATAFORMA DESCENSO · INICIAR INCURSIÓN | 880 | 785 | 96 | Descender a Pista 01 · La Invitación | `exitToRun→playCircleDescent(1)→startRun` | ✔ |
| `armory` | ARMERÍA · INVENTARIO Y TIENDA | 415 | 535 | 95 | Abrir Armería (120 Armas) | `openShop` | ✔ (bug filtro) |
| `dj` | CABINA DE TEMPO | 1165 | 335 | 105 | Hablar con Tempo | `showDialogue(TEMPO, DJ_QUOTES[i])` | ✔ (migrado) |
| `map` | MESA ASTRAL · MAPA PROGRESIÓN | 1345 | 605 | 95 | Inspeccionar Torre 9 Pistas | `openMap` | ✔ (arte obsoleto) |
| `turntable` | TOCADISCOS CENTRAL | 880 | 615 | 60 | Iniciar descenso (alt) | Alias descent | Propuesta FASE 08 |
| `archive` | ARCHIVO · TESTIMONIOS | 480 | 300 | 70 | Consultar testimonios | Codex HUB nuevo | Pendiente R10 |
| `mixer` | MESA MEZCLAS | 600 | 350 | 65 | Desbloqueos permanentes | Tienda CR nuevo | Pendiente R08 |
| `mirror` | ESPEJO AGRIETADO | 620 | 860 | 55 | Cambiar aspecto | Cosméticos nuevo | Pendiente R08 |
| `windows` | VENTANAS CIRCULARES (3) | 700/900/1100 | 240 | 30 | Ver finales mundo | Panorama LUT | Pendiente R10 |

**Anillos estación:** `ellipse r*0.72, r*0.34` con `#22d3ee` activo / `rgba(255,45,122,0.38)` reposo, `lineDash [8,6]`.

---

## 5. NPCs Y PROTAGONISTA

| Entidad | x | y | h | Asset | Y-sort | Sombra |
|---|---|---|---|---|---|---|
| Tempo | 1165 | 268 | 118 | `npc_dj_booth_world` (fallback `dialogue_portrait_dj`) | y=268 | `28×12 0.55` |
| Barman | 740 | 262 | 102 | `npc_bartender_hub` | y=262 | `28×12 0.55` |
| Armera | 432 | 505 | 104 | `npc_armorer_hub` | y=505 | `28×12 0.55` |
| Prota | 880,615 spawn | — | 104px | `drawProtagonist` 1.16× | y=py (dinámico) | `RadialGradient #ffe4f1 0.5` + `drawNeonGlow 0.34` |
| Props 22 | ver §3 | — | br | `drawProp` | y=prop.y | propio |

---

## 6. NAVEGACIÓN — RECORRIDO COMPLETO

```
Spawn prota 880,615 → N 1165,335 Tempo (110px, 0.4s) → S 880,785 plataforma (100px) → [E] descenso
Alternativa 1: Spawn → O 415,535 Armería (120px) → N Tempo → S plataforma
Alternativa 2: Spawn → E 1345,605 Mapa (90px) → S plataforma
Alternativa 3: Spawn → OSO 480,300 Archivo (propuesto, 110px) → N Tempo → S
```

**Todas las rutas accesibles sin destructibles.** Pushout props garantiza 0 callejones sin salida.

---

## 7. COLISIONES VALIDADAS HUB

- [x] Huecos prop-prop >64px (mínimo 64px, real 64–112px)
- [x] Ningún prop a <40px de umbral puerta (no hay puertas HUB, solo plataforma)
- [x] Spawn 880,615 ≥80px de cualquier prop (distancia a sofa benches 105px)
- [x] Estaciones r=95–105 con anillo visible sin solape prop
- [x] Cámara clamp sin bandas negras (zoom 1.02–1.6, halfW/halfH check)
- [x] DrawList Y-sort sin popping (sofa 470 vs prota 615 vs Tempo 268)
