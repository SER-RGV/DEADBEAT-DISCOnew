# FASE 04 — ESPECIFICACIÓN DE COLISIONES Y NAVEGACIÓN
# 2026-11-12

---

## 1. MODELO DE COLISIÓN — CÍRCULO DE SUELO

**Todo lo que bloquea es un círculo en el suelo.** No hay polígonos complejos ni mallas.

```
Actor / Prop / Muro = { x, y, br, r/colisión }
x,y = centro del círculo de colisión en el suelo (world coords)
br  = radio de bounding para pushout visual (props)
r   = radio colisión real (actores)
```

| Entidad | Radio colisión | Altura dibujo | Pivote | Ejemplo |
|---|---|---|---|---|
| Protagonista | `r=14` | 104px | `bottom-center` y+14 | `ye={x:1250,y:925,r:14}` |
| Enemigo Seguridad | `r=13` | 92px | `bottom-center` y+14 | — |
| Enemigo Bailarina | `r=11` | 80px | `bottom-center` y+14 | — |
| Enemigo Tanque | `r=16` | 106px | `bottom-center` y+14 | — |
| Sofá HUB | `br=48 → minD=52.5` | 48px asset | `bottom-center` | `prop_sofa_magenta 745,470 br48` |
| Pilar HUB | `br=44 → minD=49.6` | 44px asset | `bottom-center` | `shelf 430,245 br44` |
| Muro campaña | Rect `x,y,w=320,h=32` | 384px asset | `wall rect` | `DMO_FLOOR wall 320px + esquina` |
| Puerta | `320×64` diamante | 384px asset | `door threshold` | `door_* 320×384` |
| Jefe Véspera | `r=34` | 190px | `foot y+0.8r` | `BOSS_BASE boss_01_magneta h190 halo0.36` |
| Jefe Nix | `r=34` | 200px | `foot y+0.8r` | `h200 halo0.34` |
| Rey | `r=34` | 204px | `foot y+0.8r` | `h204 halo0.30` |
| Altavoz P04 | `br=38 → minD=45.3` | 38px | `prop` | Destructible, 8 impactos |
| Vitrina P03 | `br=40 → minD=46.8` | 40px | `prop` | Refleja, junta atrás única vulnerabilidad |
| Diapasón P05 | `br=36` | 36px | `prop` | No bloquea, pero afina |
| Raíl P08 | Rect `w=8,h=1200` | 8px | `hazard linear` | Tren cruza cada 8s |
| Fragmento P09 | `br=42` | 42px | `floating 20-40px` | Plataforma temporal 2s |

**Pushout:** `minD = br*0.72 + 18` (HUB) o `r_enemy + r_prop` (campaña). Si `d < minD`, `nx = px + (dx/d)*minD`.

---

## 2. MÁSCARA DE SUELO — ZONAS NAVEGABLES

| Zona | navegable | Qué la limita |
|---|---|---|
| **Suelo 512 tileable** | Sí, siempre | Nada — patrón repeat sin colisión |
| **Zona jugable campaña** | 880×460 por sala (margen muro 40px) | Muros rect cada 320px |
| **HUB_BOUNDS** | 1240×760 | `margin 38` + `+24` sur, pushout props |
| **Umbral puerta** | Sí, 320×64 diamante | Solo cuando `Ot.openT < 1` (puerta cerrada = muro) |
| **Pasarela elevada** | Sí, +12/+18/+24px visual | Misma colisión suelo, diferente `drawList.y` (orden dibujo) |
| **Foso / confesionario** | Sí, -8/-12/-24px visual | Misma colisión, `drawSoftShadow` más tenue |
| **Raíl P08** | Parcial — andén sí, vía peligrosa | Vía navegable pero con hazard lineal (tren) |
| **Fragmento P09** | Sí, 2s temporal | Plataforma flotante; tras 2s cae (deja de ser navegable) |

---

## 3. LÍMITES Y CLAMP DE CÁMARA

### Campaña

```
B=1250,L=925 (centro mundo), E=2500,k=1850
B = clamp(E≤2*halfW ? 1250 : max(halfW, min(E-halfW, B)))
Zoom 1.16 base, min1.06 max1.34, lead 44px hacia punto mira
```

### HUB

```
camX = px*0.55 + (x+w*0.5)*0.45
camY = py*0.48 + (y+h*0.42)*0.52
halfW = viewW*0.5/zoom, halfH = viewH*0.5/zoom
x0=260-56, x1=1500+56, y0=210-150, y1=970+56
camX = halfW*2 >= x1-x0 ? (x0+x1)/2 : clamp(x0+halfW, x1-halfW, camX)
camY = halfH*2 >= y1-y0 ? (y0+y1)/2 : clamp(y0+halfH, y1-halfH, camY)
zoom = min(1.6, max(1.02, min(viewW/1150, viewH/780)))
```

---

## 4. ALTURAS Y CONEXIONES VERTICALES

| Desnivel | Cómo se ve | Colisión | Alternativa accesible |
|---|---|---|---|
| `+12px` (P01 alfombra) | Sutil, textura distinta | Misma | Siempre hay ruta sin desnivel |
| `+18px` (P06 pasarela, P07 palcos) | Madera/metal elevado, sombra 0.30 | Misma, pero `drawList.y` prioriza | Rampa visual 32px largo |
| `+24px` (P04 pasarela, P05 coro) | Escalones 2×12px visibles | Misma | Ruta nave central sin coro |
| `-8px` (P08 vías) | Raíl hundido, traviesas | Misma, pero hazard tren | Andén lateral sin vías |
| `-12px` (P05 confesionario, P07 camerinos, P01 foso) | Escalón 12px, sombra tenue | Misma | Ruta principal sin foso |
| `-24px` (P04 escenario) | Foso con barandilla, sombra 0.55 | Misma | Pasarela superior lo evita |
| `+32px` (P03 vitrina cover) | Vitrina alta, no saltable | Cover visual, no navegable | Rodear vitrina |
| `20-40px` flotante (P09) | Sombra 60% + glow | Temporal (2s) | No necesaria (sala pequeña) |

**Regla accesibilidad:** Ninguna ruta principal exige usar desnivel; es siempre atajo o ventaja táctica (cover, línea de tiro).

---

## 5. PUNTOS DE APARICIÓN (SPAWN)

| Tipo | Dónde | Evita | Ejemplo P01 |
|---|---|---|---|
| **Protagonista** | Centro sur sala S, `x=640,y=540` (880×460/2 + margen) | <80px de muro/puerta | S (abano entrada) |
| **Enemigo oleada** | 80px de borde, mínimo 120px entre sí, nunca en puerta | Zona arrastre activa (P01) / vía tren (P08) | C01: 3 bailarinas en arco 60° |
| **Tienda/Curación** | Centro sala T/H, props alrededor como marco | Ruta alternativa (siempre accesible) | T (vitrina oro) en C03 |
| **Soberano** | Centro arena jefe, `r=34` + margen 80px a muros | Cualquier cover (arena limpia) | Véspera en corazón roto centro |
| **Secreto** | Tras destructible (cortina/vitrina/altavoz) | Sala S/★ (nunca bloquea progresión) | Archivo tras cortina rasgada C03 |

---

## 6. COBERTURAS Y OBSTÁCULOS POR PISTA

| Pista | Cover protagonista | Obstáculo enemigo | Hazard ambiental |
|---|---|---|---|
| 01 | Columnas curvas `br38` | Focos arrastre (atraen 30px/s) | Zona arrastre rosa |
| 02 | Mesas 2:1 `320×80 rect` | Bandejas móviles `br36` | Hornos `+18px` |
| 03 | Vitrinas 32px altas `br40` | Paneles orientación compás | Reflejo (rebote) |
| 04 | Altavoces `br38` destructibles | Cables colgando `br12` | Conos presión + zonas incendiadas |
| 05 | Diapasones `br36` | Vitrales `br42` | Silencio (hazard invisible) |
| 06 | Tambor `br48` + cadenas | Puerta blindada `320×32 rect` | Cierre salidas por golpes |
| 07 | Palcos `+18px` + espejos `br40` | Máscaras `br24` | Voces falsas (no colisión) |
| 08 | Andenes `+12px` + velos `br30` | Raíles `8×1200 rect` | Trenes lineales 8s |
| 09 | Fragmentos `br42` flotantes | Anclajes `br40` | Combinación 2 pistas |

---

## 7. TRANSICIONES ENTRE ZONAS

| Transición | Trigger | Cinemática | Destino |
|---|---|---|---|
| **Refugio → P01** | `[E]` en `descent 880,785 r96` | `playCircleDescent(1)` 2.9s + shaft parallax 5 planos | `DMO_DUNGEON room 0` P01 S |
| **Sala → Sala** | Cruzar umbral puerta (diamante 320×64) cuando `Ot.openT==1` | `playRoomTransition` 1.15s no bloqueante | `DMO_DUNGEON` siguiente nodo |
| **Pista → Soberano** | Portal barroco oro `portal_baroque_gold 320×416` (centro sala ★) | `playBossIntro` 2.5s | Arena jefe 880×460 |
| **Soberano → Siguiente pista** | `victoryDelay 1000ms` + portal descenso | `playCircleDescent(N+1)` | Siguiente P pista S |
| **P09 → Finales** | Destruir 4 anclajes → corona/cadena | `playVictory` 4.2s final | 3 finales (Compás/Silencio/Contratiempo) |
| **Secreta** | Destruir interactivo (cortina/vitrina/altavoz) | `playSpecialEvent` 1.05s | Sala `?` con Portero/Archivo |

---

## 8. VALIDACIÓN DE COLISIÓN — CHECKLIST FASE 04

- [ ] Ningún prop `br` genera hueco < 64px (prota `r14` + enemigo `r12` = 26px necesita 64px pasillo mínimo)
- [ ] Pasillos P02 (mesas) ≥ 100px ancho libre (validado: 100px > 64px mínimo)
- [ ] Puertas 320×64 siempre libres (ningún prop a <40px de umbral)
- [ ] Arena jefe 880×460 sin cover central (solo laterales)
- [ ] Spawn soberano ≥80px de cualquier muro/prop
- [ ] Ruta alternativa nunca requiere destructible obligatorio (solo atajo)
- [ ] Desniveles siempre con alternativa sin desnivel
- [ ] `drawList.sort(y)` no genera popping en props con `br` grande (sofa 48)
