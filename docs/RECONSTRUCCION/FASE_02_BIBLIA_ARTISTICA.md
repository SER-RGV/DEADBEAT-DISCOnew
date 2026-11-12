# BIBLIA ARTÍSTICA DEFINITIVA — DEADBEAT DISCO
# v2.0 · 2026-11-12 · FASE 02 — RECONSTRUCCIÓN INTEGRAL

**Estado:** `APROBADA COMO BASE PARA PRODUCCIÓN` — Sustituye a `ART_BIBLE.md v1.3` como fuente de verdad visual.  
**Autoridad narrativa:** `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt` v1.0 + `RESOLUCION_DECISIONES_D01-D06.md` (D-01..D-06).  
**Autoridad técnica:** `v9_t3_fase1b_cache_probe.html` / `index.html` 5.48 MB + `src/dd_*.js` (isométrica 2:1, tile 512, `DD_WORLD`, `DD_HUB`, `DD_CINE`).  
**Principio:** La narrativa determina el universo. El arte representa esa narrativa, nunca la sustituye.

> **Resumen de D-01..D-06:** La torre es una estación reconvertida que crece hacia abajo. No hay Dante, no hay infierno, no hay ciudad absorbida. Nueve pistas con nombres y soberanos canónicos (§7–15). Tempo sustituye a Virgilio. Desafinado sustituye a cazador. Alcance integral: arte + mecánicas + rediseño de niveles.

---

## 0. IDENTIDAD VISUAL GENERAL — La torre que recuerda

### 0.1 Tagline visual

**Una discoteca que no pudo despedirse, fosilizada en arquitectura.**

DEADBEAT DISCO es un **club nocturno art-déco/gótico detenido en el instante anterior al amanecer**, estirado verticalmente hacia la oscuridad. No es un infierno punitivo, no es una mazmorra, no es una ciudad, no es un limbo genérico. Es **una sola sala de baile que se repite hasta convertirse en torre**, con cada repetición deformada por un deseo humano concreto.

### 0.2 Tono visual (3 ejes)

| Eje | Polo frío | Polo cálido | Punto de equilibrio |
|---|---|---|---|
| **Luz** | Neón quirúrgico que revela | Terciopelo que oculta | **El neón existe porque la oscuridad lo merece** — ≤15% de superficie neón, todo lo demás es sombra trabajada |
| **Material** | Cromo, cristal, mármol, acero | Terciopelo, madera quemada, papel envejecido | **Lujo abandonado** — Todo fue elegante; ahora es elegante y herido |
| **Emoción** | Melancolía (lo que no pudo terminar) | Tensión (lo que no deja salir) | **Belleza con amenaza** — Ningún espacio es solo bonito; ninguno es solo hostil |

### 0.3 Regla de coherencia (pilares)

Sustituye a los 4 pilares de v1.3:

1. **Toda pieza parece dibujada por el mismo equipo:** misma tinta, mismo volumen, misma luz NW, misma paleta madre. Si dos assets no pudieran estar en la misma sala sin romper la ilusión, uno de ellos está mal.
2. **La silueta precede al detalle:** A escala real (prota 104px mundo ≈ 52px pantalla a 1080p), la identidad se lee por silueta, no por microdetalle. El microdetalle que no sobrevive a esa escala se sustituye por color.
3. **El neón es jerarquía, no decoración:** Magenta = identidad/interacción/atracción. Cian = secundario/peligro frío. Oro = rareza/progresión. Si todo brilla, nada guía.
4. **La pista nunca compite con la acción:** Suelo, muro y decoración tienen saturación/contraste inferiores al actor (prota/enemigo/jefe/proyectil). El ojo prioriza siempre lo que se mueve y lo que mata.

**Desempate:** Legibilidad en combate > coherencia de familia > belleza ilustrada.

---

## 1. LENGUAJE DE FORMAS

### 1.1 Vocabulario base (heredado de la estación)

Toda la torre nace de la **estación de tren reconvertida** (Biblia §2.1): columnas de hierro, techos de cristal, arcos apuntados tardogóticos, artesonados art-déco, mosaicos geométricos, marquesinas, relojes, andenes, taquillas. Ese vocabulario es el **ADN común** que unifica las 9 pistas por debajo de sus diferencias.

| Elemento | Forma canónica | Variación por pista |
|---|---|---|
| **Arcos** | Apuntado gótico + rebaje art-déco | Pista 01: arco carpanel rosado; Pista 03: arco conopial dorado con vitrina; Pista 05: ojival con diapasón; Pista 06: arco blindado con remaches |
| **Columnas** | Fuste estriado + capitel geométrico | Pista 02: columna-vajilla; Pista 04: columna-altavoz; Pista 08: columna-hielo negro |
| **Mosaicos** | Damero 45° art-déco, grecas, filetes | Pista 01: terciopelo-rosa; Pista 07: espejo-oro; Pista 09: tesela-espejo fragmentada |
| **Relojes** | Esfera sin agujas (tiempo detenido) | Pista 03: todos los relojes son tesorería; Pista 09: reloj agrietado que no marca |

### 1.2 Curva vs. recta (diferenciación estructural)

Cada pista elige un **dominante estructural** que la distingue sin depender del color:

| Pista | Dominante | Secundario | Qué evita |
|---|---|---|---|
| 01 La Invitación | **Curvas concéntricas** (lámparas, corazón roto, focos) | Columnas curvas | Rectas industriales |
| 02 El Banquete | **Líneas largas horizontales** (mesas interminables, bandejas) | Hornos circulares | Curvas íntimas |
| 03 Cámara Instantes | **Retícula ortogonal** (vitrinas, relojes) | Oro curvo en vitrina central | Diagonales caóticas |
| 04 Amplificación | **Paralelogramos y conos** (altavoces, ondas) | Metal ennegrecido | Oro pulido |
| 05 Nota Ausente | **Verticales góticas** (nave, órgano, diapasones) | Vacío (nota ausente) | Diagonales de casino |
| 06 Umbral Encadenado | **Masa y cierre** (puerta, tambor, cadenas) | Acero ritual | Transparencias |
| 07 Mil Voces | **Fragmentación diagonal** (espejos, palcos, máscaras) | Humo | Masa cerrada |
| 08 Andén Ausente | **Líneas de fuga** (raíles, andén, trenes) | Velos blancos | Curvas concéntricas |
| 09 Núcleo | **Vacío + fragmentos flotantes** | Teselas-espejo | Grafo cerrado |

Esta diferencia garantiza que un daltónico o una captura en grises siga distinguiendo las pistas.

### 1.3 Densidad de detalle

- **Regla 85%:** La figura debe llenar ~85% de la altura del lienzo PNG, centrada, pies en línea de suelo común. Ver `tools/art_master/layout.py`.
- **Regla 3 tonos:** 1 base + 1 sombra + 1 reflejo por material. No hay degradados continuos; hay planos de cel-shading con filo duro.
- **Prohibido:** Ruido, grano, dithering, pixel art simulado, pixelado artificial, desenfoque gaussiano como textura.

---

## 2. PROPORCIONES Y SILUETAS

### 2.1 Protagonista — Desafinado

| Atributo | Valor canónico |
|---|---|
| Altura mundo | **104 px** (unidad base) |
| Proporción | 6.5 cabezas; torso 40%, piernas 60%; hombros 2.2× cabeza |
| Silueta | Pelo despeinado asimétrico + camiseta negra ribetes magenta + tatuajes partitura + pantalón piping neón + zapatillas. **Tatuajes siempre visibles** (brazo/cuello), son lore. |
| Arma | Gira sobre puños; culata en hombro. No cruza cabeza; no atraviesa hombro en pose de daño. |
| Direcciones | 8 según `REF_06`; motor actual solo refleja L/R. Documentar faltantes como pendientes (no simular con espejo vertical). |

**Continuidad:** `player_idle_00/walk_00-03/shoot/firehip/boost/roll/hurt/death` mantienen volumen entre frames. Validado R01: 27 PNG, halo 0.0 (prota no necesita halo, es el punto de referencia).

### 2.2 Enemigos — 6 familias canónicas (REF_06 + Biblia §42unificado)

| Familia | Silueta clave | Altura mundo | Halo | Rasgo de pista |
|---|---|---|---|---|
| **Seguridad** (antidisturbios) | Casco antidisturbios + escudo | 92 px | 0.46 | Pista 06 (umbral) |
| **Bailarina** | Tutú asimétrico + zapatillas de punta | 80 px | 0.38 | Pista 01 (invitación) |
| **Sprinter** (fanático) | Torso desnudo, zancada larga | 88 px | 0.40 | Pista 04 (ruido) |
| **Tanque** | Nudillos en suelo → se yergue 146px al atacar | 106 px (reposo) | 0.42 | Pista 06/02 |
| **Tirador** (dron) | Trípode con visor | 86 px | 0.36 | Pista 05 (nota ausente) |
| **Mascota** (élite) | Cuadrúpedo con zarpas | 94 px | 0.44 | Pista 08 (andén) — usa familia base escalada como minijefe |

**Estados:** `walk/windup/attack/death` (4) + `hit` implícito sobre `walk` (para no parpadear por balas). Validado R02: 24 PNG, proporción conservada K ±1%, halo por familia, `drawGroundY` +14.

### 2.3 Jefes — 9 soberanos + 2 secretos

| ID técnico | Soberano canónico | Altura mundo | Halo | Silueta diagnóstica |
|---|---|---|---|---|
| `boss_00_anden` | **Portero sin Rostro** (§17.1 subjefe) | 196 | 0.46 | Gorra de plato + abrigo cruzado + superficie porcelana lisa + báculo cordón terciopelo rojo |
| `boss_01_magneta` | **Véspera** | 190 | 0.36 | Terciopelo negro + máscara labios dorados + cables-marioneta ascendentes |
| `boss_02_bufe` | **Voraz** | 178 | 0.30 | Abdomen horno transparente con manos + 2 cucharones + vajilla rota |
| `boss_03_cajero` | **Áurea** | 190 | 0.36 | Exoesqueleto oro + trono relojes sin agujas + dedos-llave + vitrina pecho |
| `boss_04_pogo` | **Brama** | 186 | 0.42 | Carbón rojo + amplificador entre costillas + garganta cosida cuerdas guitarra |
| `boss_05_oficiante` | **Obispo** | 194 | 0.34 | Mitra diapasón + casulla órgano silenciado + coro ausente |
| `boss_06_matarife` | **Corazón Encadenado** | 188 | 0.36 | Tambor pecho + cadenas rituales + puerta blindada + acero |
| `boss_07_imitador` | **Crupier** | 192 | 0.46 | Traje humo + cabeza máscaras cambiantes (cantante/niño/anciano/jugador) |
| `boss_08_traidor` | **Nix** | 200 | 0.34 | Hielo negro + velo blanco + 8 siluetas con hueco corazón |
| `boss_09_nucleo` | **Rey del Compás** | 204 | 0.30 | Bola espejos → cuerpo teselas-espejo + corona orejas zorro |
| `boss_10_arquitecto` | **Rey del Contratiempo** | 192 (r38) | 0.42 | Compás de dibujo como cetro + disco |

**Estados soberanos:** `idle/attack/hit/death` (4). `attack` es legible a escala; `hit` = ventana vulnerable (anillo + daño ×1.5); `death` = derrumbe 1s. Nunca mezclar revisiones (si `attack` no es de la misma generación que `idle`, se resuelve sobre `idle` inclinado). Apoyo en `foot` = `(x, y+0.8·r)`, respiración `sin(t·2.1)*0.009`.

---

## 3. MATERIALES Y TEXTURAS

### 3.1 Catálogo maestro (común a toda la torre)

| Material | Base | Sombra | Reflejo | Respuesta especular | Uso |
|---|---|---|---|---|---|
| **Mármol marfil** | `#e8e0c8` | `#c8b98a` | `#fff8e0` | Mate + vena sutil | Refugio / Acceso |
| **Terciopelo negro** | `#0a0c12` | `#060410` | `#1a0a1a` magenta | Pelusa capturada por rim | Pista 01 |
| **Terracota** | `#8b2a1a` | `#5a1a10` | `#c84a30` | Mate rugoso | Pista 02 |
| **Pizarra oro** | `#0a0a0e` | `#050508` | `#facc15` veta | Filo dorado hard-edge | Pista 03 |
| **Obsidiana** | `#080810` | `#050508` | `#1a1a2e` + filo oro | Frío, facetado | Pista 05/09 |
| **Metal ennegrecido** | `#1a1a18` | `#0e0e0c` | `#ff2d7a` quemadura | Cepillado + chispas | Pista 04 |
| **Acero ritual** | `#c0c8d0` | `#8890a0` | `#ffffff` | Pulido, hard highlight | Pista 06 |
| **Hielo negro** | `#0a1820` | `#061018` | `#38bdf8` velo | Translúcido + grieta | Pista 08 |
| **Tesela-espejo** | `#e8f0f8` fragmento | `#a0b8d0` junta | `#ffffff` destello | Espejo quebrado | Pista 09 |

### 3.2 Reglas de textura

- **Vetas/filetes/mosaicos/grecas art-déco** — Desgaste controlado (arañazo fino hard-edge, no ruido).
- **Prohibido:** Grain fotográfico, dithering, pixelado, degradado radial suave como textura principal.
- **Repetición:** Suelos 512×512 tileable sin costura; muros 256×384 con cornisa/zócalo/contorno compartidos.

---

## 4. ILUMINACIÓN

### 4.1 Fuentes (narrativa → técnica)

| Fuente | Naturaleza | Color | Intensidad | Dónde |
|---|---|---|---|---|
| **Luz principal** | Ventanales estación (lucernarios de cristal) | Blanco cálido `#fff6e0` | 1.0 | NW (desde punto de vista artista), sombras al SE |
| **Neón magenta** | Tubos / letreros / lámparas rosas | `#ff2d95` | 0.8–1.2 (pulsante) | Pista 01/07/09 — atracción/interacción |
| **Neón cian** | Plataforma descenso / trenes / hielo | `#38bdf8` / `#22d3ee` | 0.6–1.0 | Pista 08/03/04 — peligro frío/tecnología |
| **Oro** | Vitrinas / relojes / archivo | `#facc15` / `#f0e090` | 0.5–0.8 | Pista 03/09 — rareza |
| **Carbón/rojo** | Horno / amplificador / tambor | `#ef4444` / `#f97316` | 1.5 (furia <35%) | Pista 02/04/06 — fase crítica |

### 4.2 Técnica

- **Rim light doble:** Magenta detrás (back) + cian delante (front) cuando aporta separación sobre fondo oscuro. Nunca ambos al 100% simultáneos.
- **Bloom:** Exclusivamente sobre emisores neón (`globalCompositeOperation: screen`, alpha 0.20–0.36). Nunca sobre piedra/metal/terciopelo.
- **Sombras:** El motor calcula sombras de contacto (`drawSoftShadow` radial). No hornear sombra en sprite. La sombra de contacto es el puente entre figura y suelo; sin ella la figura flota.
- **LUT de pista:** Haze ambiental por pista (`rgba(magenta,0.08–0.13)` etc.) — ver `CIRCLE_CONFIG.haze`. Sutil, no niebla.

### 4.3 Legibilidad lumínica

La iluminación nunca oculta indicadores de peligro (pulsos graves, conos de presión, sectores de barrido). Si una zona de luz se apaga (Véspera fase 3: un solo foco), los ataques llegan desde el borde de esa luz con anticipación de 0.35s mínimo.

---

## 5. PALETAS CROMÁTICAS

### 5.1 Paleta madre (toda la torre)

| Rol | Hex | Uso |
|---|---|---|
| Base oscura | `#0a0c12` | Fondo, masa de sombra, contornos (línea más oscura) |
| Superficie | `#191a25` | Planos medios, piedra, metal mate |
| Borgoña | `#2d0619` | Transición cálida, telas |
| Magenta | `#ff2d95` | Neón principal, identidad, atracción |
| Oro | `#facc15` | Acento rareza, HUD |
| Oro claro | `#f0e090` | Reflejos, filetes |
| Cian | `#38bdf8` | Neón secundario, hielo |
| Cian 2 | `#22d3ee` | Descenso, tecnología |
| Violeta | `#c084fc` | Transición magenta→cian |

### 5.2 Paletas por pista (diferenciación cromática + estructural)

| Pista | Suelo | Muro | Neón | Secundario | Haze | Temp. | Saturación entorno |
|---|---|---|---|---|---|---|---|
| **01 Invitación** | `#1b0826→#3b0f4c→#86198f` | Negro terciopelo + rosa | `#ff2d7a` | `#c026d3` violeta | `rgba(255,45,122,0.13)` | Cálida íntima | 45% |
| **02 Banquete** | `#210e09→#7c2d12→#f97316` | Terracota + crema | `#f59e0b` ámbar | `#ef4444` rojo | `rgba(245,158,11,0.10)` | Cálida glotona | 50% |
| **03 Cámara** | `#171206→#854d0e→#facc15` | Pizarra + oro | `#facc15` oro | `#fb7185` rosa polvo | `rgba(250,204,21,0.10)` | Cálida opulenta | 40% |
| **04 Amplificación** | `#210709→#7f1d1d→#ef4444` | Metal ennegrecido + rojo quemado | `#ef4444` | `#f97316` naranja | `rgba(239,68,68,0.12)` | Cálida agresiva | 55% |
| **05 Nota Ausente** | `#150826→#581c87→#c084fc` | Obsidiana + filo oro | `#a855f7` violeta | `#facc15` oro | `rgba(168,85,247,0.11)` | Fría solemne | 35% |
| **06 Umbral** | `#091813→#14532d→#4ade80` | Acero + cadenas + tambor | `#fb7185` rosa acero | `#94a3b8` gris azulado | `rgba(251,113,133,0.09)` | Neutra bloqueada | 30% |
| **07 Mil Voces** | `#081829→#0e7490→#22d3ee` | Espejo + oro + humo | `#22d3ee` cian | `#ff2d7a` magenta trampa | `rgba(34,211,238,0.11)` | Fría espejada | 60% |
| **08 Andén** | `#081526→#0c4a6e→#38bdf8` | Hielo negro + velo blanco | `#38bdf8` cian | `#f43f5e` rojo velo | `rgba(56,189,248,0.12)` | Fría desolada | 25% |
| **09 Núcleo** | `#120924→#3b0764→#e2e8f0` | Obsidiana cósmica + tesela espejo | `#f8fafc` blanco | `#ff2d7a` magenta memoria | `rgba(248,250,252,0.10)` | Neutra vacía | 20% (vacío) |
| **Refugio** | `#0e1525→#1e293b→#475569` | Marfil + hierro + damero | `#ff2d7a` zorro | `#22d3ee` plataforma | `rgba(255,45,122,0.08)` | Neutra cálida | 30% |

**Aplicación:** Cada pista comparte la paleta madre (negros, borgoñas) pero su **neón/secundario/haze** es único. El motor elige suelo/muro/pilar por `CIRCLE_CONFIG[idx]` que ya apunta a los 12 suelos y 10 muros existentes.

---

## 6. ARQUITECTURA

### 6.1 Principios comunes (estación → torre)

- **Modularidad real:** Cada pista usa muros de 256×384 con cornisa/zócalo/contorno/luz compartidos. Diamante 2:1 en umbrales. `wall_panel_gothic_niche/panel_neon_crown/vip_window/pillar_obsidian` etc. ya implementados en Tanda 02.
- **Verticalidad útil:** La torre crece hacia abajo. Balcones, pasarelas y lucernarios deben insinuar que hay pistas por encima/debajo. No es decoración plana: balcones son rutas alternativas, pasarelas son líneas de tiro.
- **Colisión = arquitectura:** Lo que bloquea es lo que parece bloquear. La decoración nunca genera colisión invisible.

### 6.2 Arquitectura por pista (diferenciación estructural)

| Pista | Motivo arquitectónico | Puerta | Detalle canónico |
|---|---|---|---|
| 01 Invitación | **Terciopelo negro + columnas curvas + lámparas rosas** | Arco carpanel con cortina | Corazón roto central (sombra de Véspera) |
| 02 Banquete | **Mesas interminables + hornos industriales + vajilla** | Portal vajilla rota adintelado | Hornos transparentes como hazards |
| 03 Cámara | **Galerías vitrina + relojes sin agujas** | Vitrina-arco dorado con junta expuesta | Vitrina con flor marchita (resolución Áurea) |
| 04 Amplificación | **Stacks altavoz + cableado + metal** | Boca-altavoz con conos | Altavoces destructibles |
| 05 Nota Ausente | **Nave gótica + órgano + diapasones** | Arco ojival con diapasón | Órgano silenciado como barrera sonora |
| 06 Umbral | **Puerta blindada + tambor + cadenas** | Puerta acero ritual con cadenas | Tambor que marca cierre de rutas |
| 07 Mil Voces | **Casino espejos + palcos + máscaras** | Arco espejo con máscara | Palco que oculta ruta real (solo sombra distingue) |
| 08 Andén | **Andén hielo negro + raíles + velos** | Portal velo blanco con raíles | Tren espectral que cruza (hazard lineal) |
| 09 Núcleo | **Vacío con fragmentos flotantes** | No hay puerta: fragmentos reconstruyen salas de la run | Suelo blanco final (último anclaje roto) |
| Refugio | **Estación reconvertida: hierro + cristal + damero** | Plataforma cian de descenso (apertura circular) | Zorro neón + barra + sofás magenta + cabina Tempo |

### 6.3 Puertas y portales

| Tipo | Asset actual | Estado | Uso canónico |
|---|---|---|---|
| Arco vitral carmesí | `door_stained_closed` | E · validado | Pistas 01/03 |
| Umbral dorado | `door_arched_open` | E | Pistas 02/03/07 |
| Gótico apuntado | `door_gothic_closed/open` | D→E (huecos reparados en R09) | Pistas 05/06 |
| VIP acolchada | `door_vip_crimson` | E | HUB / tienda |
| Retablo barroco | `portal_baroque_gold` | E | Jefe (cámara) |
| Relicario dorado | `portal_avaricia_gold` | D→E (halo reparado) | Tesoro/élite |

---

## 7. PERSPECTIVA Y COMPOSICIÓN

### 7.1 Isométrica real

- **Diamante de suelo 2:1** (ortográfica, sin fuga). Suelos 512×512 `repeat` con desplazamiento `x0%512`.
- **Cámara:** `DD_CINE.getCamera()` + `HUB_BOUNDS` clamp. Zoom Refugio `Math.min(1.6, max(1.02, min(viewW/1150, viewH/780)))`. Zoom pistas `1.16` (base) + `look` `44px` lead.
- **Parallax cinemático:** Plataforma descenso usa 5 planos `factor .92/.66/.40/.20/.08` sobre `DMO.camera()` + `expand 260·shaftOpen` (84→374px ventana).

### 7.2 Composición de sala

| Elemento | Posición | Prioridad |
|---|---|---|
| **Suelo** | `patternCache` 256px tile, `haze` overlay | 1 (fondo) |
| **Muro/pilar** | `buildHighResRoomCache` cada 320px + esquinas | 2 |
| **Prop** | `PROP_KIND_TO_ASSET` por `ddGroundY` sort | 3 |
| **Enemigo** | `ddEnemyView` → `drawEnemy` | 4 |
| **Protagonista** | `drawProtagonist` con `bobY` + `stridePhase` | 5 (foco) |
| **Jefe** | `drawBoss` + `ddBossRings/FloorCues` | 6 (foco) |
| **VFX** | `drawNeonGlow/SoftShadow` screen blend | 7 (encima, nunca tapando hitbox) |
| **UI** | `dd_rebuild_ui.css` `z:9500` | 8 |

**Regla de oro:** La decoración nunca tapa al actor; el VFX nunca tapa el indicador de peligro.

---

## 8. ESCALA DE PERSONAJES Y ESCENARIOS

| Elemento | Alto mundo | Alto pantalla (~) | Relación con prota (104px) |
|---|---|---|---|
| Protagonista | 104 px | 52 px @1080p | 1.0× |
| Enemigos | 80–106 px | 40–53 px | 0.77–1.02× |
| Minijefe | ~130 px | ~65 px | 1.25× |
| Jefes soberanos | 178–204 px | 89–102 px | 1.7–1.96× |
| Arquitecto (r38) | 192 (209 radio) | 96 px | 1.85× |
| Muros | 384 px asset → ~160 px mundo | 80 px | 1.5× prota |
| Puertas | 384–416 px asset → ~170 px mundo | 85 px | 1.6× |
| Props | 40–118 br → 60–180 px mundo | 30–90 px | 0.5–1.7× |

**Pivotes:** `bottom-center` para actores/props con apoyo en suelo (`foot` en `y+0.8·r`); `center` para armas/iconos/emblemas; `tile` para suelos.

---

## 9. ESTILO DE ANIMACIÓN

### 9.1 Principios (cel-shading + hard-edge)

- **12 fps lógico** (cada frame dura 3–5 ticks de motor; `ANIMATION_FRAME_DURATIONS`); el motor interpola con `requestAnimationFrame`.
- **Silueta limpia:** Cada frame mantiene contorno cerrado near-black más oscuro que cualquier interior. No hay gaps, no hay halos accidentales.
- **Continuidad de volumen:** Entre `idle/walk/attack/hit/death` no cambia proporción de cabeza/torso ni ropa. Ver lecciones R01–R03: zancada de estilo contaminó al Cajero; hoja de 3 vistas del Oficiante — ambas corregidas con `state_ref.py` + `ONE single figure`.
- **Direccionalidad:** Arte mira a derecha; `flip` por `facingLeft` cuando prota está a izquierda (jefes/enemigos siempre encaran al prota).

### 9.2 Frames por actor

| Actor | Estados | Frames | Transición |
|---|---|---|---|
| **Protagonista** | idle/walk_00-03/aim_up-down/shoot/firehip/boost/roll/hurt/death | 27 PNG | `playerAnim.stridePhase` (zancada 9.5 rad/s) + `breathePhase` 2.8 rad/s + `bobY` |
| **Enemigo** | walk/windup/attack/death + hit implícito | 4 PNG/familia | `flash` 0.12s (tint blanca con `flashCap 0.68`, sin velo total) |
| **Soberano** | idle/attack/hit/death + recover | 4 PNG/soberano | `idle` inclinado si falta `attack`; `hit` = `recover` (ventana vulnerable ×1.5); `death` = derrumbe 1s con `victoryDelay 1000ms` |
| **Rey Compás** | 3 fases (Espejo/Corona/Última Vuelta) | 4 PNG fase 1 + 2 PNG fases 2–3 pendientes | Fragmentos anticipan regla (siluetas en espejo antes de combinación) |

### 9.3 Lo que NO se anima

- **Armas:** No hay animación de recarga separada; el arma es estática en mano y gira sobre puños. La postura de cadera para pesadas (m60/minigun/BFG) es conocida como limitación R01 — se documenta, no se simula con espejo.
- **Puertas:** `Ot.openT` anima apertura; el asset `door_arched_open` adapta `edge` + paneles. No se duplica animación.

---

## 10. EFECTOS VISUALES

| Tipo | Implementación | Color | Duración | Regla legibilidad |
|---|---|---|---|---|
| **Muzzle** | `vfx_muzzle_gold/plasma` | Oro / cian | 2 frames (80ms) | Nunca tapa silueta del prota |
| **Impacto** | `vfx_impact_spark/plasma` + `drawSoftShadow` | Blanco + chispa magenta | 6 frames flash | `flashCap 0.68`; si hay `hit` propio, flash reducido 50% |
| **Explosión** | `vfx_explosion_inferno` | `#f97316→#ef4444` | 12 frames | Halo `drawNeonGlow` screen 0.25 |
| **Shockwave** | `vfx_shockwave_magenta` | `#ff2d95` | 8 frames | Anillo fino, no relleno opaco |
| **Fuego/humo** | `vfx_fire_plume/smoke_cloud` | `#facc15→#1a0a1a` | Loop | Detrás de actores, alpha <0.4 |
| **Alma** | `vfx_soul_flame` | `#c084fc` | 10 frames | Solo sobre muerte soberano |
| **Rayo** | `vfx_lightning_purple` | `#a855f7` | 4 frames | Cono de presión dibujado en suelo (`ddBossFloorCues`) antes del rayo |
| **Barrido** | Sector + rayo (motor) | `#ff2d7a→#38bdf8` | Pre-aviso 0.35s | **Siempre visible** — bug corregido en R03 (antes invisible con arte HD) |
| **Neón** | `drawNeonGlow` screen | Magenta/cian/oro | Persistente | Solo sobre emisores, nunca sobre VFX que oculte hitbox |

**Prioridad:** Peligro ambiental (pulsos graves, conos, trenes) > proyectiles enemigos > VFX propio. El jugador debe ver el suelo donde va a pisar.

---

## 11. REGLAS DE LEGIBILIDAD DURANTE COMBATE

**Norma suprema:** Ningún recurso nuevo puede reducir la legibilidad del combate.

| Regla | Cómo se cumple | Verificación |
|---|---|---|
| **Hitbox = suelo** | Círculo de colisión en `y`; suelas en `y+14`; balas a altura cañón (corregido R02: antes 43px bajas) | `probe_bosses_combat.js` mide `ddGroundY` |
| **Halo por hostilidad** | Enemigos oscuros sobre suelos oscuros → halo claro difuso (`halo 0.30–0.46` por familia/boss) | Validado R02/R03: Imitador 0.46 visible sobre `floor_07_travertine` |
| **Orden por `ddGroundY`** | Actores y props ordenados por línea de apoyo, no por centro de círculo (corregido R02: figura detrás de caja) | `drawList.sort((a,b)=>a.y-b.y)` |
| **Vida sobre borde real** | Barra de vida sobre borde superior del dibujo, no a 50px fijos (corregido R03) | `probe_bosses.js` captura barra |
| **Furia inequívoca** | <35% vida: aura roja motor + filo rojo pulsante alrededor figura (corregido R03: aura sola invisible sobre suelos rojos) | `drawBoss` `if (hp<0.35) drawRim("#ef4444")` |
| **Flash sin ceguera** | Destello de impacto no vela figura (corregido backup R03: `flashCap 0.68`) | `blitBossFrame` `Math.min(flashCap,6*flash)` |
| **Aviso antes que daño** | Barrido, conos, pulso grave, trenes — todos con sector/aviso 0.35s previo | `ddBossFloorCues` repone sector |
| **Vulnerable claro** | Anillo `exposedT` + postura `hit` (o `idle` sin `hit` + anillo) | `BOSS_STATE_ASSET.recover: "hit"` |
| **Muerte visible** | Derrumbe 1s antes de `fin de partida` (corregido backup: `victoryDelay 1000ms`; antes Núcleo tapado mismo frame) | `probe_final_flow.js` 900–1100ms |
| **Bloom controlado** | `opacity 1` → controlado; línea magenta recta 1089→0px; separación planos 17.95→23.65 | `ART_CORRECCION_LEGIBILIDAD_HUB.md` |

---

## 12. HUB — EL REFUGIO, ESPACIO DE PROGRESIÓN

### 12.1 Identidad arquitectónica

**No es un HUB genérico.** Es la **estación reconvertida** de la Biblia §2.1/§5.4: techos de cristal, columnas de hierro, damero blanco-negro, terciopelo magenta, neón zorro, cabina Tempo, barra, sofás VIP, marquesina.

| Zona canónica (Biblia §5.4) | Estado actual | Asset | Función jugable |
|---|---|---|---|
| **Plataforma incursión** | Implementado | `threshold_descent_pad` 512×320, `drawDescentPad` + anillo cyan | Inicia run → `DD_CINE.playCircleDescent` → `__DD_BRIDGE.startRun` |
| **Armería** | Implementado (bug filtro `TODAS→ALL` pendiente) | — | Cambia arma (120 + 9 legendarias) |
| **Espacio Tempo** | Implementado (texto migrado D-05) | `npc_dj_booth_world` + `dialogue_portrait_dj` (Tempo) | Pactos, comentarios, memoria |
| **Mapa** | Implementado (mapa `map_infernal_tower` obsoleto — rehacer con 9 pistas) | `map_infernal_tower` 640×640 | Progresión, rutas |
| **Tocadiscos central** | Pendiente FASE 03 | — | Inicia run / selecciona opciones |
| **Archivo/vinilos** | Pendiente (estación física no verificada) | — | Testimonios, bestiario, lore |
| **Mesa mezclas** | Pendiente | — | Desbloqueos permanentes (CR) |
| **Espejo agrietado** | Pendiente | — | Cosméticos / variantes Desafinado |
| **Sofá roto** | Pendiente (sofa_magenta existe pero no interactivo) | `prop_sofa_magenta` | Conversaciones Tempo |
| **Ventanas circulares** | Pendiente | — | Finales (neones/amanecer/puerta abierta) |

### 12.2 Iluminación y atmósfera

- **Base:** Luz cenital de lucernarios (blanco cálido) + viñeta suave.
- **Foco:** Zorro neón magenta `drawNeonGlow #ff2d7a 0.36` en `x=1365,y=150` + chandeliers oro `facc15 0.20` en `[650,215],[1110,215]`.
- **Plataforma:** Cyan `22d3ee` pulsante + anillo de estación activo (cuando `nearStation=descent`).
- **Evolución por progreso** (Biblia §5.5): Oscuridad inicial → Tempo aparece tras 1er soberano → Archivo tras testimonios → Neones intensos bola espejos (Compás) → Amanecer tenue (Silencio) → Puerta abierta luz dorada (Contratiempo). Implementar como `HUB_LIGHTING` LUT por `DMO_PROG.victories`.

### 12.3 Legibilidad HUB

Ya validada: niebla bloom `opacity 1` → 0.42, saturación art-déco atenuada, línea magenta recta eliminada, grieta decorativa reconectada a descenso. Métricas: props 62/11 estaciones intactas, `startCampaignFromHub(0)` → `CAMPAIGN_ROOM` sin cambios.

---

## 13. INTERFAZ Y ELEMENTOS VISUALES

| Elemento | Estado | Regla canónica |
|---|---|---|
| **HUD** | Implementado | Chasis `#0a0c12`, texto crema `#f0e090`, magenta `#ff2d95` para atención, oro para rareza. Nunca blanco puro. Vida/escudo `hud_heart_full/empty/shield_badge` 128px, `skill_bomb/boost/dodge` 160px, `credit_coin` 128px. Barra vida jefe sobre borde real. |
| **Minimapa** | Parcial (blanco en bug report) | Marco `hud_heart_full` como `minimap_frame`; contenido isométrico por `DMO_LAYOUT`. |
| **Mapa progresión** | Obsoleto (doble Fraude/Traición) | Rehacer 640×640 con 9 pistas + Refugio + conexiones + soberanos. |
| **Diálogo** | Implementado (Tempo migrado) | `hud_portrait_protagonist` + `dialogue_portrait_dj` (renombrar a Tempo), `DD_UI.showDialogue("TEMPO", quote, 5.5)` |
| **Armería** | Bug filtro | Arreglar `TODAS/ALL` → `family` antes de introducir legendarias. |
| **Victoria/Derrota** | Implementado D-05 | `SEÑAL PERDIDA·PISTA CERRADA`, `SOBERANO DERROTADO`/`REDENCIÓN EN EL NÚCLEO`, `Has quebrado el bucle de las Nueve Pistas`. Emblemas `ui_victory/defeat_emblem` sin halo. |
| **Cinemática** | Implementado | `DD_CINE` 7 categorías (intro/room/circle/boss/defeat/victory/special) + letterbox. Títulos migrados a PISTA 01–09. |

---

## 14. CINEMÁTICAS

### 14.1 Intro — La noche que no termina (~35s, 10 planos, 128 BPM)

6 fondos oficiales `cine_bg01_city … cine_bg06_hero` (3 capas cada uno: fondo/medio/frente) + protagonista isométrico. Sincronía `0.46875s` beat. Secuencia: ciudad → club exterior → entrada → nave → dancefloor → héroe. Letterbox + `SALTAR [ESPACIO]`.

**Estado:** Fondos son láminas de presentación con paleta/marco/texto horneados → pendientes R10 (capas con transparencia real). `DD_CINE.playIntro` no relanza en `focus` (fix R01).

### 14.2 Descenso — Apertura de suelo + plataforma (propuesta §5.3 canonizada D-01)

Mecanismo circular se abre (golpe grave bajo suelo), plataforma de servicio desciende por interior de torre, revela balcones/pasarelas de otras pistas a profundidades imposibles, llega a Refugio. Sin diálogo. Prototipada en HUB T08/09: `expand 260·shaftOpen`, 5 planos parallax, 56 brasas + 26 cenizas. Debe sincronizar con `DMO_MUSIC` descenso.

### 14.3 Transiciones

| Cinemática | Duración | Bloquea | Tag |
|---|---|---|---|
| Sala 7 pasos | 1.15s | No | Sala N |
| Pista descenso | 2.9s | Sí | PISTA 0N · LA … |
| Jefe | 2.5s | No | AMENAZA SOBERANA · VÉSPERA… |
| Derrota | 2.1s | No | SEÑAL PERDIDA |
| Victoria | 2.2s (4.2s final) | No | SOBERANO DERROTADO / REDENCIÓN EN EL NÚCLEO |

---

## 15. PROHIBICIONES ABSOLUTAS (v2.0)

1. **Dante/infierno/pecados/Limbo/círculos** en cualquier asset, texto o doc nuevo.
2. **Ciudad absorbida** (D-02) en narrativa o arquitectura.
3. **Pixel art o degradación de definición** (ruido, grano, dithering, filtro baja res).
4. **Fondos croma horneados** o halos blancos sin limpiar.
5. **Sombras horneadas** en sprite (las calcula el motor).
6. **Bloom sobre no-neón** (piedra/metal/terciopelo nunca brillan).
7. **Estilos mezclados** entre pistas (cada pista usa paleta madre + neón propio, no importado).
8. **Decoración sobre jugabilidad** (colisión invisible, prop que tapa hitbox).
9. **Cambiar mecánicas para acomodar imagen** (si la imagen no cabe en la colisión, se rehace la imagen).
10. **Duplicar loaders/managers** (un solo `DD_ASSETS`, un solo `DD_WORLD`, un solo `DD_CINE`).
11. **Mezclar revisiones** (un jefe sin `attack` de su misma generación usa `idle` inclinado, no pixel art viejo).
12. **Inventar lore para justificar diseño** (si la Biblia no lo dice, se propone, no se canoniza).

---

## 16. PLAN DE APLICACIÓN POR TANDAS (actualizado D-03)

| Tanda | Contenido canónico | Ilus. | Estado | Nota |
|---|---|---|---|---|
| **R01** | Protagonista Desafinado (27) | 27 | ✔ E | R01 validada; tatuajes partitura |
| **R02** | 6 familias enemigos (24) | 24 | ✔ E | R02 validada; halos |
| **R03** | **9 Soberanos + 2 secretos** (canónicos D-03) | 42 | **24/42 [BACKUP]** | 15 REF_03 legacy + 9 backup legacy — **pendiente reinterpretación a soberanos** |
| R03c | Reinterpretación soberanos (27 pendientes) | 27 | Pendiente | Prioridad 1 tras esta biblia |
| **R04** | PNJ Refugio (Tempo, armera, bar), dron, HUD iconos, emblemas victoria/derrota | 12+8 | B | `npc_dj_booth_world` ≠ `dialogue_portrait_dj` — unificar a Tempo |
| **R05** | Armas 121 (120 heredadas reinterpretadas + 9 legendarias canónicas §7–15) | 121 | B16/C105 | Legendarias con virtud/límite/sinergia definidos |
| **R06** | Recogibles/reliquias (20) | 20 | B | — |
| **R07** | Proyectiles/VFX (22) | 22 | B2/E20 | `vfx_*` base existente |
| **R08** | Mobiliario (30) | 30 | B | — |
| **R09** | Muros/puertas/portales (18) | 18 | D4/B14 | Reparar 3 puertas + 1 muro |
| **R10** | Cinemática 6 fondos con capas reales + 11 tarjetas pista | 17+capas | B11/D24 | Láminas presentación no válidas |

**Capacidad:** 10 ilustraciones por turno. R03c (27) = 3 turnos. Total 283 pendientes = ~29 turnos.

---

## 17. CONTROL DE VERSIONES

| Versión | Cambio | Motivo |
|---|---|---|
| 1.0 | Creación; identidad cyber-gothic nightclub, paletas, reglas | Tanda 01 |
| 1.1 | Arquitectura modular 10 piezas; diamante 2:1 | Tanda 02 |
| 1.2 | 9 jefes motor vinculados; BOSS-T01 | Motor legacy |
| 1.3 | BOSS-T02 4 estados nuevos | Motor legacy |
| **2.0** | **Reescritura integral sobre lore canónico:** 9 pistas + Refugio, 9 soberanos (no motor), paletas por pista con estructura, curvas vs rectas, materiales estación→torre, luz NW + haze por pista, escala soberanos, animación cel-shading, VFX con legibilidad, HUB estación reconvertida, cinemática descenso canonizada, prohibiciones Dante/ciudad/infierno; R03 legacy marcado para reinterpretación | **D-01..D-06 + auditoría integral** |

---

## 18. ENTREGABLES DE FASE 02

- [x] `docs/RECONSTRUCCION/FASE_02_BIBLIA_ARTISTICA.md` (este archivo)
- [ ] `ART_BIBLE.md` actualizado a v2.0 (copia canónica en raíz para `tools/art_master` y CI)
- [ ] `docs/RECONSTRUCCION/FASE_02_PALETAS_POR_PISTA.json` (LUT máquina para `DD_WORLD.CIRCLE_CONFIG.haze` + CSS vars)
- [ ] `docs/RECONSTRUCCION/FASE_02_SOBERANOS_REFERENCIAS.md` (fichas visuales de 9 soberanos con lore §7–15)

**Criterios de aceptación FASE 02:** Paleta madre + 9 paletas pista sin variación cromática pura, lenguaje de formas Curva/Recta/Retícula/Cono/Vertical/Masa/Fragmentación/Lineal/Vacío, 11 siluetas jefe con halo, prohibiciones verificables, plan R03c con reinterpretación, sin contradicción con Biblia v1.0.

---

> *Cada deseo se convierte en un ritmo; cada ritmo, en una prisión.* — La torre no encierra a quienes disfrutan de la fiesta. Encierra a quienes ya no soportan que termine.
