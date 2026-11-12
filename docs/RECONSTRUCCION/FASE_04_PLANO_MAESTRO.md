# FASE 04 — PLANO MAESTRO
# Arquitectura espacial · 9 pistas + Refugio · 2026-11-12

**Autoridad:** ART_BIBLE v2.0 + FASE_03_DISENO_UNIVERSO.md + FICHAS_PISTAS.md + REFUGIO.md + MAPAS_CONCEPTUALES.md + MATRIZ_DIFERENCIACION.json  
**Motor:** `E=2500, k=1850` mundo campaña · `HUB_BOUNDS {260,210,1240×760}` Refugio · tile isométrico 2:1 · suelos 512×512 · muros 256×384 · `DD_WORLD.buildHighResRoomCache` + `DMO_DUNGEON` grafo 8–12 nodos  
**Estado:** FASE 04 — Planos técnicamente implementables, no assets definitivos

---

## 1. SISTEMA DE COORDENADAS

### 1.1 Mundo campaña (pistas 01–09)

```
Origen (0,0) = esquina NW mundo
E=2500 (ancho mundo), k=1850 (alto mundo)
Cada sala = 960×540 viewport → 480×640 canvas lógico → 12×9 tiles diamante
Tile isométrico: diamante 2:1 — ancho 64px mundo (32px tile base), alto 32px
Suelo: pattern 512×512 tileable, offset x0%512
Muro: 256×384 por panel, cada 320px + esquinas; pilar 192×384 cada 640px
Puerta: 320×384 (arco vitral/dorado/gótico) + umbral 320×64 diamante 2:1
```

### 1.2 Refugio (HUB)

```
Canvas HUB: 1800×1180 cache (ensureHubCache)
Bounds: x=260,y=210,w=1240,h=760 (clamp cámara)
Zoom: min(1.6, max(1.02, min(viewW/1150, viewH/780)))
Cámara: lerp 0.55 px + 0.45 centro bounds; clamped a x0-56,x1+56,y0-150,y1+56
Props: 22 unidades con br 24–58, pushout minD = br*0.72+18
```

---

## 2. PLANO VERTICAL — TORRE EN SECCIÓN

```
Z (altura torre, no mundo Y) ↑
  +5  Refugio (Z=9) —— damero + marquesina hierro (HUB_BOUNDS)
       │ shaft circular 260·shaftOpen (84→374px ventana, 5 planos parallax .92/.66/.40/.20/.08)
  +4  P01 La Invitación (Z=8) ── corazón roto a Z=8.2, balcones +12px
  +3  P02 El Banquete (Z=7) ── hornos +18px, mesas 2:1
  +2  P03 Cámara (Z=6) ── caja fuerte 4×4 vitrinas, relojes +32px cover
  +1  P04 Amplificación (Z=5) ── escenario -24px, pasarela +24px, stacks altavoz
   0  P05 Nota Ausente (Z=4) ── nave cruz latina, coro +24px, órgano +32px, confesionario -12px
  -1  P06 Umbral (Z=3) ── búnker 0/+18px 2 alturas, tambor +32px, puerta blindada Z=3.1
  -2  P07 Mil Voces (Z=2) ── palcos +18px, camerinos -12px, ruleta 0
  -3  P08 Andén (Z=1) ── andenes +12px, vías -8px, trenes lineales
  -4  P09 Núcleo (Z=0) ── vacío + fragmentos 20–40px flotantes, anclajes 0, suelo blanco final -60px
  -5  Vacío blanco (Z=-1) —— corona/cadena finales (3 finales)
```

**Conexión física:** Cada pista desciende por `DMO_FLOOR` shaft vertical (cadena/cuerda/plataforma). No hay ascensor genérico; cada descenso tiene motivo (cadenas P06, fragmentos P09, etc.).

---

## 3. CAPAS POR SALA (4 capas técnicas)

| Capa | Z-index | Contenido | Asset | Colisión |
|---|---|---|---|---|
| **Suelo** | 0 | `floor_*` pattern 512 tileable + haze `rgba()` | `getFloorPattern` 256×256 cache | No — navegación libre, haze no colisiona |
| **Estructura** | 1 | Muros `wall_*` cada 320px + pilares `wall_pillar_obsidian` + puertas `door_*` | `buildHighResRoomCache` | Sí — `HUB_PROPS` style pushout o `DMO_FLOOR` wall rect |
| **Decoración** | 2 | Props `prop_*` (sofa, mesa, vitrina, altavoz, diapasón, tambor, espejo, raíl) | `PROP_KIND_TO_ASSET` + `drawProp` | Depende: `prop` con `br` genera pushout; decor puro no |
| **Interactivo** | 3 | Altavoces destructibles, vitrinas reflejo, tambor, trenes, anclajes | `enemy`/`prop` con hitbox | Sí — hitT + br |
| **Actor** | 4 | Prota 104px, enemigos 80–106px, soberanos 178–204px, halo | `drawProtagonist/drawEnemy/drawBoss` | Sí — círculo colisión suelo `r=14` prota, `r=12–18` enemigos, `r=34` soberanos |
| **VFX/Efectos** | 5 | `drawNeonGlow` screen, `drawSoftShadow`, sector barrido, conos | — | No — nunca tapa hitbox |

**Orden dibujo:** Suelo → muros → props → actores (`drawList.sort(y)`) → VFX → UI `z:9500`.

---

## 4. ESTÁNDARES DE SALA

### 4.1 Sala campaña (pistas)

```
Dimensión lógica: 960×540 viewport = 480×640 canvas = 12×9 tiles diamante
Zona jugable: 880×460 (margen muro 40px cada lado)
Muros: 4 lados, puertas en ejes N/S/E/O (según grafo DMO_DUNGEON)
Gravedad visual: sombra contacto bajo todo actor (radial 0.55)
Nodos: 8–10 por pista (no 20), capas 3–5, rutas 2–3 (ver FASE_03_MAPAS_CONCEPTUALES)
Garantizados si grafo viable: 1 tienda (T) + 1 curación (H) + 1 armería (A)
Secretos: siempre desde C (combate), nunca desde S/★
```

### 4.2 Sala Refugio (HUB)

```
Dimensión: 1800×1180 cache → viewport escalado por zoom
Zona jugable: HUB_BOUNDS 1240×760 (clamp), pushout props
Estaciones: 4 actuales + 4 propuestas FASE 03 (tocadiscos, archivo, mesa mezclas, espejo, ventanas)
NPCs: Tempo 1165,278 h118 + armera 432,278 h104 + barman 740,278 h102 (drawList Y-sort)
```

---

## 5. PLANO POR PISTA — RESUMEN DE IMPLEMENTACIÓN

| Pista | Nodos | Capas | Forma dominante | Sala especial | Verticalidad jugable | Puerta | Jefe |
|---|---|---|---|---|---|---|---|
| 01 Invitación | 8 | 4 | Abanico + corazón roto | Corazón roto central (sala 5) | Desniveles 12px alfombra + balcones 0px | Arco carpanel cortina | Véspera (corazón roto arena) |
| 02 Banquete | 9 | 4 | Rectángulos 2:1 mesas | Hornos + mesas largas | Hornos +18px | Adintelado vajilla rota | Voraz (horno ventral) |
| 03 Cámara | 10 | 5 | Grid ortogonal + caja fuerte 4×4 | Caja fuerte central | Vitrinas 32px cover | Vitrina-arco dorado | Áurea (trono relojes) |
| 04 Amplificación | 9 | 4 | Estrella trapecio + altavoces | Escenario hundido -24px | Escenario -24px + pasarela +24px | Boca-altavoz | Brama (altavoz costillas) |
| 05 Nota Ausente | 10 | 5 | Cruz latina + nave | Nave + órgano fondo | Coro +24px + confesionario -12px | Ojival diapasón | Obispo (mitra diapasón) |
| 06 Umbral | 8 | 3 | Sala-búnker 60% + ante-salas | Búnker 4 nodos malla + tambor | Búnker 0/+18px pasarela | Blindada 4 cadenas | Corazón (tambor pecho) |
| 07 Mil Voces | 10 | 5 | Diamante/rombo + palcos | Casino espejos + ruleta | Palcos +18px + camerinos -12px | Arco espejo | Crupier (humo máscaras) |
| 08 Andén | 9 | 4 | Andén 3:1 + 3 vías | Andén central + 2 vías | Andenes +12px vs vías -8px (20px) | Velo blanco raíles | Nix (línea divisoria) |
| 09 Núcleo | 6 | 5 | Vacío + fragmentos flotantes | Sala blanca + anclajes | Fragmentos 20–40px plataformas | Sin puerta (fragmentos) | Rey (3 fases) |
| Refugio | 1 | 1 | Rectángulo damero sereno | Damero + marquesina + zorro | Ninguna (plataforma shaft) | Plataforma cian circular | Tempo (no combate) |

---

## 6. COMPATIBILIDAD CON MOTOR ACTUAL

| Sistema | Estado | Compatibilidad plano |
|---|---|---|
| `DMO_DUNGEON` grafo 8–12 nodos | Vivo | Directa — planos respetan 8–10 nodos, capas 3–5, rutas 2–3 |
| `DMO_FLOOR` walls/doors/floors | Vivo | Directa — muros 256×384 cada 320px, suelos 512 tileable, puertas 320×384 |
| `DD_WORLD.buildHighResRoomCache` | Vivo | Directa — 1800×1180 HUB + 960×540 campaña, patternCache 256×256 |
| `DD_WORLD.drawProtagonist` | Vivo (R01) | Directa — 104px prota, bobY 2.4, stridePhase 9.5 rad/s |
| `DD_WORLD.drawEnemy` | Vivo (R02) | Directa — 6 familias 80–106px, halo 0.30–0.46, flashCap 0.68 |
| `DD_WORLD.drawBoss` | Vivo (R03 24/42) | Directa — 11 soberanos 178–204px, foot y+0.8r, victoryDelay 1000ms |
| `DD_HUB` | Vivo | Directa — HUB_BOUNDS 1240×760, 22 props pushout, 4→8 estaciones |
| `DD_CINE` | Vivo (D-05 migrado) | Directa — 10 PISTA meta (REFUGIO→P09), 7 cinemáticas |
| `DD_ASSETS` 269/269 | Vivo | Directa — suelos 12 + muros 10 + puertas 8 + props 30 registrados; P04 altavoz/ P05 diapasón requieren nuevos props (R08) |
| `__DD_BRIDGE` | Vivo | Directa — setPaused, startRun, drawPlayerAt fallback |

**Nada de lo planificado exige modificar motor.** Solo nuevos assets R08/R09 (altavoces, diapasones, cadenas, espejos, raíles) y nuevas props posiciones por pista.

---

## 7. VALIDACIÓN — CRITERIOS FASE 04

Cada plano debe superar (ver Informe Pruebas):

- Dimensiones/límites dentro de E×k y HUB_BOUNDS
- Colisiones: pushout props + walls rect sin huecos ni bloqueos invisibles
- Recorrido completo jugador: S→C→T/H/$/A→★ sin callejón sin salida
- Rutas alternativas accesibles (mínimo 2 con distinta longitud)
- Navegación nodo-a-nodo: cada arista grafo tiene puerta/portal físico
- Combate: arena jefe ≥ 880×460 con cover no dominante
- Verticalidad: cada desnivel tiene rampa visual (no teleport) y alternativa sin desnivel para accesibilidad
- Motor: `DD_WORLD` puede construir sala con `circleIdx` y `roomSeed` sin errores
