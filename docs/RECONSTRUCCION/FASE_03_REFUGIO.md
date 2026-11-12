# FASE 03 — EL REFUGIO
# HUB COMO ESPACIO INDEPENDIENTE · 2026-11-12

**Autoridad:** Biblia §5.4 (zonas) + §5.5 (evolución) + §5.3 (cinemática descenso) + Biblia Artística v2.0 §12  
**IDs técnicos existentes:** `CIRCLE_CONFIG[0]=Refugio` (alias limbo legacy), `floor_00_limbo_marble`, `HUB_BOUNDS {260,210,1240×760}`, 4 estaciones interactivas.  
**Principio:** El Refugio no es la Pista 00. Es el negativo de las pistas: donde ellas encierran, él reúne.

---

## 1. IDENTIDAD NARRATIVA

**Concepto:** El Refugio es la **única sala que no quiso ser otra cosa**. Cuando la Escucha repitió la noche y la estación se deformó en torre, un vestíbulo de la antigua estación ferroviaria resistió la metamorfosis: su damero blanco-negro, su marquesina de hierro, su barra de latón, sus sofás de terciopelo, su cabina de DJ.

No es un refugio construido a posteriori: es **la última pieza intacta de la Primera Noche**. Por eso Tempo la eligió como tregua; por eso el zorro de neón sigue encendido mientras esta sala exista.

**Ley:** Mientras el zorro siga encendido, la repetición no puede entrar. Aquí no hay pulsos graves, ni vitrinas que reflejan, ni ecos que repiten tus disparos. Aquí la única regla es que puedes elegir.

**Dolor:** El Refugio recuerda lo que las pistas olvidaron. Cada zona que recuperas (Archivo, Mesa de mezclas, etc.) es un fragmento de la noche original que vuelve a tener lugar.

---

## 2. FUNCIÓN DENTRO DE LA HISTORIA

| Función narrativa | Cómo se vive por el jugador |
|---|---|
| **Memoria** | Tempo recuerda todas las vueltas aquí. Cada diálogo nuevo es porque has cambiado algo. |
| **Tregua** | No spawnean enemigos. La cámara es fija suave (no persecución). La música es la del Refugio (`DMO_MUSIC.state=HUB`), no la de combate. |
| **Preparación** | Cambias de arma, compras, pactas, consultas el mapa. Cada run empieza aquí; cada muerte termina aquí. |
| **Progresión** | Gastas CR/Ecos en desbloqueos permanentes (Mesa de mezclas), revisas finales, miras por las ventanas circulares cómo cambia el mundo. |
| **Puente** | La plataforma cian es la única conexión física con la torre (D-01 canonizada). No hay otra salida. |

**Cinemática de llegada (§5.3 canonizada):** Apertura circular del suelo en la pista principal + plataforma que desciende por interior de torre revelando balcones de otras pistas → aterrizaje en Refugio. Dura ~8s, sin diálogo, explica sin palabras que discoteca y torre son la misma estructura.

---

## 3. ARQUITECTURA CARACTERÍSTICA

**Estilo:** Estación de tren reconvertida en club — **no cripta, no búnker, no loft**. Art-déco ferroviario:

- **Suelo:** Damero clásico blanco-negro `floor_10_hub_checker` 512×512 + moqueta terciopelo carmesí VIP `floor_11_vip_velvet` + mármol marfil `floor_00_limbo_marble` en pasillo de acceso.
- **Muros:** Obsidiana gótica con hornacina `wall_panel_gothic_niche` (ya reparado) + pilares `wall_pillar_obsidian` cada 320px + cornisa/zócalo compartidos.
- **Techos:** Artesonado art-déco + lucernarios de cristal (luz principal NW) + 2 lámparas araña oro `prop_chandelier_gold` en `[650,215],[1110,215]`.
- **Marquesina:** Arco principal de hierro forjado (entrada a plataforma descenso) — motivo que se repite deformado en cada pista.

**Bounds:** `HUB_BOUNDS {x:260,y:210,w:1240,h:760}` — sala-rectángulo apaisada con esquinas achaflanadas (marca de antiguos andenes).

---

## 4. LENGUAJE DE FORMAS DOMINANTE

**Rectángulo sereno con toques curvos.** El Refugio es el único espacio que **no necesita deformar** su geometría para expresar un deseo — porque no tiene soberano.

- **Rectas dominantes:** Damero, barra, estanterías, marquesina — todo ortogonal, ordenado, legible.
- **Curvas cálidas:** Sofás magenta gemelos (`prop_sofa_magenta` en `745,470 + 1015,470`), sillones VIP, zorro neón, plataforma cian.
- **Evita:** Diagonales de casino (P07), líneas fuga de raíles (P08), masas bloqueantes (P06). El Refugio es el único lugar donde las líneas siempre llevan a alguna parte.

---

## 5. PALETA Y LUT

**Paleta Refugio (FASE_02_PALETAS_POR_PISTA.json):**

| Rol | Hex | Elemento |
|---|---|---|
| Suelo damero | `#0e1525/#1e293b/#475569` | Baldosa blanca `#e8f0f8` / negra `#0a0c12` |
| Moqueta VIP | `#2d0619` borgoña | Sofás, pasillo central |
| Neón identidad | `#ff2d7a` magenta | Zorro, anillos de estación |
| Neón descenso | `#22d3ee` cian | Plataforma + glow |
| Oro | `#facc15`/`#f0e090` | Lámparas araña, filetes, marco mapa |
| Superficie | `#191a25` | Muros, barra, armarios |

**Haze:** `rgba(255,45,122,0.08)` — el más sutil de todas las pistas (es tregua, no amenaza).

**LUT por progresión** (§5.5 Biblia → `HUB_LIGHTING`):

| Estado | Luz | Qué cambia |
|---|---|---|
| Inicio | Oscuridad, neones parpadeantes, damero apagado | — |
| Tras P01 Véspera | Neones estables, Tempo aparece, cabina enciende | `zorroIntensity 0.5→0.7` |
| Tras testimonios | Archivo se ilumina, estanterías con vinilos visibles | `archivoGlow +0.2` |
| Compás (victoria) | Neones intensos, bola espejos gira rápido | `chandelier 0.20→0.42`, `zorro 0.36→0.52` |
| Silencio (final) | Ventanas muestran amanecer tenue, música se suaviza | `haze + amanecer #fff6e0 0.12` |
| Contratiempo | Puerta principal abierta, luz dorada entra | `door shaft #facc15 0.35` |

---

## 6. ILUMINACIÓN Y HAZE

- **Principal:** Lucernarios cenitales NW `#fff6e0 1.0` → sombras SE suaves.
- **Zorro neón:** `drawNeonGlow #ff2d7a 0.36` en `fx=1442,fy=360` (112×148), `185` radio. Es el **corazón** del Refugio: si se apaga, la sala muere.
- **Chandeliers:** `drawNeonGlow #facc15 0.20` en 2 puntos, 190 radio + `prop_chandelier_gold` 136×136.
- **Plataforma:** Cyan pulsante `22d3ee` + anillo activo cuando `nearStation=descent`.
- **Spot prota:** `RadialGradient #ffe4f1 0.5` bajo pies + `drawNeonGlow #ffe4f1 0.34` — separa prota oscuro de moqueta carmesí.
- **Sombras:** `drawSoftShadow` radial bajo props (sofa `28×12 0.55`, npc `28×12 0.55`, chandelier sin sombra).

---

## 7. AMBIENTACIÓN Y ESCENOGRAFÍA

**Props existentes (HUB_PROPS 22 unidades):**

| Grupo | Props | Posición clave | Nota |
|---|---|---|---|
| **Norte — Estanterías bar** | `shelf×2, barcounter, cooler, bottles, rack` | `430,245;560,245;740,278;325,280` | Barra de latón + botellas + estanterías góticas |
| **Noreste — Cabina Tempo** | `speaker, djbooth, subwoofer, palm, bottles` | `1035,255;1165,278;1305,265;1415,295` | Cabina completa con altavoces |
| **Centro — Salón VIP** | `sofa×2, bench, armchair×2, candelabra×2` | `745,470;1015,470;880,488;635/1125,545` | Gemelos magenta + mesa baja velas |
| **Oeste — Armería/Arcade** | `vending, arcade, chest` | `355,515;355,655;455,565` | Esquina pacts |
| **Este — Mapa** | `pedestal, plant×2` | `1365,585;1425,745;335,845` | Pedestal torre progresión |

**Añadidos FASE 03 (pendientes de modelar, no bloquear producción):**

- **Tocadiscos central** (mesa circular con vinilo girando) — centro exacto `880,615` (donde hoy hay vacío entre sofás).
- **Espejo agrietado** — muro sur, `x=620,y=860` — cosméticos Desafinado.
- **Ventanas circulares** — muro norte, 3 óculos art-déco con vidriera que cambia por final.
- **Sofá roto** — ya existen 2 sofás magenta; añadir desgaste narrativo (uno roto tras P06).
- **Zorro neón** — ya implementado como `prop_hub_fox_neon` 112×148 en pared este.

---

## 8. ENEMIGOS Y FAMILIAS

**Ninguno.** El Refugio es zona segura. `DMO_HUB` `setPaused(true)` congela simulación. Si aparecen "enemigos", son **NPCs aliados** (Tempo, armera, barman) — no atacan, no tienen hitbox hostil.

---

## 9. SOBERANO / JEFE

**Ninguno.** El Refugio no tiene soberano. Su "jefe" narrativo es **Tempo** (no se combate) y su "jefe" mecánico es la **decisión de descender**. La plataforma es el único "portal jefe": pulsas `[E]` y `DD_CINE.playCircleDescent(1, startRun)`.

**Subjefe secreto vinculado:** El **Portero sin Rostro** (§17.1) puede aparecer en una sala secreta conectada al Refugio (acceso por estantería con libro). No es obligatorio; es easter egg para D-03.

---

## 10. ELEMENTOS INTERACTIVOS Y DESTRUCTIBLES

| Estación | ID | Posición | Radio | Prompt | Acción | Estado |
|---|---|---|---|---|---|---|
| **Plataforma descenso** | `descent` | `880,785` | 96 | Descender a Pista 01 | `exitToRun()` → cine descenso → `startRun` | ✔ Implementado |
| **Armería** | `armory` | `415,535` | 95 | Abrir Armería | `DD_UI.openShop()` | ✔ (bug filtro pendiente) |
| **Cabina Tempo** | `dj` | `1165,335` | 105 | Hablar con Tempo | `showDialogue("TEMPO", DJ_QUOTES[i])` | ✔ (texto migrado) |
| **Mapa progresión** | `map` | `1345,605` | 95 | Inspeccionar Torre 9 Pistas | `DD_UI.openMap()` | ✔ (arte obsoleto, rehacer) |
| **Tocadiscos** | `turntable` | `880,615` | 60 | Iniciar descenso (alt) | Alias de `descent` | Propuesta |
| **Archivo** | `archive` | `480,300` | 70 | Consultar testimonios | Codex HUB (nuevo) | Pendiente |
| **Mesa mezclas** | `mixer` | `600,350` | 65 | Desbloqueos permanentes | Tienda CR (nuevo) | Pendiente |
| **Espejo** | `mirror` | `620,860` | 55 | Cambiar aspecto | Cosméticos (nuevo) | Pendiente |
| **Ventanas** | `windows` | `700/900/1100,240` | 30 | Ver finales mundo | Panorama final (nuevo) | Pendiente |

**Destructibles:** Ninguno (tregua). La única "destrucción" es narrativa: el damero puede agrietarse levemente tras P06 como cicatriz.

---

## 11. MECÁNICAS AMBIENTALES Y DE COMBATE

**No hay combate.** Mecánicas son de **navegación social y gestión**:

- **Movimiento:** WASD + gamepad `pollGamepad()` 285 speed, clamp en `HUB_BOUNDS`, pushout por `HUB_PROPS` (`minD = br*0.72+18`).
- **Interacción:** `nearStation` por distancia `<= r`, prompt flotante abajo-centro `700 14px Inter`, `38px` alto, `border #22d3ee 2px`. `[E]/Enter` con `interactCooldown 0.35s`.
- **Modal lock:** Mientras `DD_UI.isModalOpen() || DD_CINE.isBlocking()` el HUB pausa `update()`.
- **Animación:** `playerAnim` con `stridePhase 9.5 rad/s` si `speed>12` → `walkFrame` 0-3 + `bobY sin(stridePhase*PI)*2.4`, else `breathePhase 2.8 rad/s`.

---

## 12. RUTAS, VERTICALIDAD Y TRANSICIONES

**Grafo:** No existe grafo de salas. El Refugio es **una sola sala** de 1800×1180 con cámara suave clamped.

**Rutas:** 4 cuadrantes conectados por pasillos de 140px ancho entre props. No hay ruta principal vs alternativa (es paseo, no dungeon). La única "ruta" es **estética**: norte (Tempo) = arriba, sur (plataforma) = abajo = descenso.

**Verticalidad:** Ninguna (una planta). La verticalidad del Refugio es **simbólica**: plataforma que perfora el suelo (shaft vertical) es la única conexión con la torre.

**Transiciones:**
- **Entrada:** Desde cinemática descenso superior: plataforma aterriza en `880,785`, `DD_HUB.enter()` congela run, `hideMainMenu`, `showDialogue("TEMPO", ...)`.
- **Salida:** `exitToRun()` → `setPaused(false)` → `playCircleDescent(1)` (2.9s) → `startRun()` (o `DDC_COVER.start()` fallback).

---

## 13. SECRETOS, RECOMPENSAS Y DESCUBRIMIENTOS

| Secreto | Condición | Recompensa | Pista narrativa |
|---|---|---|---|
| **Portero sin Rostro** | Interactuar 3× con estantería norte sin hablar con Tempo | Encounter secreto + sello caucho (cosmético) | §17.1 |
| **Testimonio Primera Noche** | Hallar 1er vinilo en P01 y traerlo al Archivo | Memoria desbloqueada + diálogo Tempo único | §5.5 |
| **Vinilo legendario** | 1 por pista (9 total) → Archivo completo | Lore completo + arma legendaria pista respectiva | §7–15 |
| **Zorro parpadeo** | Mirar zorro 10s sin moverse tras P07 | Guiño neón + frase secreta Tempo | Easter egg |
| **Puerta trasera** | Tras P09 Rey del Compás (final Contratiempo) | Puerta norte abierta con luz dorada → Cabina Original | Final |

---

## 14. CONEXIONES

| Conexión | Tipo | Destino | Mecánica |
|---|---|---|---|
| **Plataforma descenso** | Física + cinemática | Pista 01 La Invitación | Shaft circular 260·shaftOpen, 5 planos parallax, 56 brasas |
| **Mapa** | UI | Pistas 01–09 (progresión) | `CIRCLES_INFO` ahora 9 pistas canon |
| **Archivo** | Narrativa | Todas las pistas (testimonios) | Vinilos traídos de cada pista |
| **Mesa mezclas** | Progresión | Todas | CR → desbloqueos permanentes |
| **Ventanas** | Narrativa | Finales (Compás/Silencio/Contratiempo) | LUT HUB_LIGHTING |
| **Tempo** | Narrativa | Todas | Recuerda nombres, pactos, finales |

**Progresión:** Cada pista superada desbloquea 1 zona visual HUB + 1 diálogo Tempo + 1 testimonio Archivo. No hay bloqueo duro: puedes ir de P01 a P09 sin explorar secretos, pero perderás finales.

---

## 15. RITMO Y OBJETIVO DE DISEÑO

**Ritmo:** Lento, exploratorio, seguro. El jugador debe **respirar** aquí. Tiempo medio estimado: 2–4 min entre runs (cambiar arma, hablar, mirar mapa). No es un menú: es un lugar.

**Objetivo:** Que el jugador **extrañe** el Refugio cuando esté en P08. Que Tempo sea un amigo, no un tutorial. Que la plataforma cian dé miedo y ganas a la vez.

**Métrica de éxito:** En playtest, el jugador debe pararse 5s frente al zorro sin que el juego se lo pida.
