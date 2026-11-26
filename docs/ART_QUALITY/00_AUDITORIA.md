# FASE 0 · AUDITORÍA GRÁFICA — DEADBEAT DISCO

**Fecha:** 2026-11-26 · **Rama:** `arena/46b8bb0f-deadbeat-disconew` · **Commit base:** `60870577628825c5cbd6e764ca214c3f106a3433`
**Estado de la fase:** EN REVISIÓN (evidencia completa: 87 capturas × 3 resoluciones, 0 errores; pendiente de la revisión final del responsable)
**Alcance:** auditoría **sin cambiar arte**. No se ha modificado ningún asset, ni una línea de `src/`, ni las builds. Sólo se añade esta auditoría, el arnés de captura (`tools/qa/capture_art_audit_fase0.js`) y la evidencia.

---

## 1. Qué se ha auditado y cómo

### 1.1 Build auditada

| Archivo | SHA-256 | Bytes | Nota |
|---|---|---|---|
| `index.html` | `6fdba6c41e3c05119ab36e103e5045c8259137a2fd5b2cd0c4bc0f731050b31b` | 5.726.853 | build activa (idéntica a `DEADBEAT_DISCO.html`) |
| `DEADBEAT_DISCO.html` | `6fdba6c41e3c05119ab36e103e5045c8259137a2fd5b2cd0c4bc0f731050b31b` | 5.726.853 | build activa (gemela) |
| `DEADBEAT_DISCO.ART.html` | — | 13.490.978 | build del linaje `ART_PACK`/TANDA (otra rama); **no auditada** en esta fase |
| `v9_t3_fase1b_cache_probe.html` | — | 13.380.910 | sonda histórica; no auditada |

Generada por `tools/build_active_html.py` desde `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` + `src/`. No se han editado las builds a mano.

### 1.2 Método

- Navegador: Chromium headless `@sparticuz/chromium` 138.0.2 + `playwright-core` 1.49.1 (mismo arnés fijado que `tools/fase01_qa/run.sh`), rasterizador SwiftShader.
- Tres resoluciones por pantalla: **1280×900**, **1920×1080** y **390×844**.
- Recorrido: `carga (arranque congelado en LOADING) → menú principal → PERSONALIZAR (atuendos) → EXTRAS → JUGAR → NUEVA PARTIDA → intro (2,5 s) → seek 31,9 s (descenso) → seek 4,55 s → HUB (El Refugio) → [E]/salida a la torre → cartel de círculo → 10 salas normales (salas 2, 13, 24, 35, 46, 57, 68, 79, 90 y 100) → 10 arenas de jefe (salas 11, 22, 33, 44, 55, 66, 77, 88, 99 y 100) con `DMO.debug.boss()` → pantallas de resultado (derrota y victoria escenificadas con `DD_UI.showResults`)`.
- Vida del jugador: `DMO.debug.heal()` antes de cada captura de combate (`DMO.debug.invuln(true)` sólo concede i-frames breves; **no** evita el daño — verificado). Las llamadas de depuración marcan la partida como modificada: deliberado y sin interés para la auditoría visual.
- Rendimiento: mediana de fotogramas por segundo vía `requestAnimationFrame` en ventanas ≥1,5 s; memoria vía `performance.memory.usedJSHeapSize`. **SwiftShader es un rasterizador por software: los fps absolutos no representan un PC real ni un móvil.** Se usan sólo como señal relativa entre pantallas; la medición válida en hardware llegará con el presupuesto de CI de la FASE 6.
- Errores de consola/red registrados en `captures.json` (`errors[]`).

### 1.3 Evidencia

`ART_EVIDENCE/art_quality/fase0/` — **87 capturas JPEG** (q80; 29 pantallas × 3 resoluciones: 1280×900, 1920×1080, 390×844) + `captures.json` (**90 entradas** = 87 capturas + 3 `meta-post-bosses`; metadatos por captura: fps, heap, errores). Generada 2026-11-26T01:59:39Z. `errors: []` — ver anexo A.

| Prefijo | Pantalla |
|---|---|
| `00-carga` | Pantalla de carga |
| `01-menu` | Menú principal |
| `02-atuendos` | Selector de atuendos (camerino / PERSONALIZAR) |
| `03-extras` | EXTRAS (archivo del club) |
| `04-cinematica-intro` | Cinemática de intro (2,5 s tras «Nueva partida») |
| `05-hub` | HUB · El Refugio |
| `06-cartel-circulo` | Cartel de transición de círculo (descenso) |
| `07-hud-*` | HUD en combate, una sala por círculo (I LIMBO … X NÚCLEO FINAL) |
| `08-jefe-*` | Arena y carta de presentación del jefe por círculo |
| `09-resultado-derrota` / `10-resultado-victoria` | Pantallas de resultado |

Nombres de fichero: `<prefijo>-<resolución>.jpg`, p. ej. `07-hud-05-ira-1280x900.jpg`.

### 1.4 Cómo leer las puntuaciones

1–5 por criterio: **coherencia con la guía visual (REF_06) · legibilidad · nitidez/resolución · animación · contraste · rendimiento relativo**. 5 = sobresaliente, 4 = bien, 3 = aceptable con fallos, 2 = deficiente, 1 = inaceptable. La media por pantalla es la media aritmética de los seis criterios. Las notas al margen recogen lo específico de cada resolución.

---

## 2. Inventario por pantalla y puntuación

### 2.1 Tabla resumen (una fila por pantalla × resolución, notas al pie por círculo)

| Pantalla | Res. | Coh | Leg | Nit | Ani | Con | Rend | **Media** |
|---|---|---|---|---|---|---|---|---|
| Carga | 1280×900 | 5 | 4 | 5 | 4 | 4 | 5 | **4,5** |
| Carga | 1920×1080 | 5 | 4 | 5 | 4 | 4 | 5 | **4,5** |
| Carga | 390×844 | 5 | 4 | 4 | 4 | 4 | 5 | **4,3** |
| Menú principal | 1280×900 | 5 | 4 | 5 | 4 | 4 | 4 | **4,3** |
| Menú principal | 1920×1080 | 5 | 4 | 5 | 4 | 4 | 4 | **4,3** |
| Menú principal | 390×844 | 5 | 4 | 4 | 4 | 4 | 4 | **4,2** |
| Selector de atuendos | 1280×900 | 5 | 4 | 5 | 4 | 4 | 3 | **4,2** |
| Selector de atuendos | 1920×1080 | 5 | 4 | 5 | 4 | 4 | 3 | **4,2** |
| Selector de atuendos | 390×844 | 5 | 4 | 5 | 4 | 4 | 3 | **4,2** |
| EXTRAS | 1280×900 | 4 | 4 | 5 | 4 | 4 | 3 | **4,0** |
| EXTRAS | 1920×1080 | 4 | 4 | 5 | 4 | 4 | 3 | **4,0** |
| EXTRAS | 390×844 | 4 | 4 | 5 | 4 | 4 | 3 | **4,0** |
| Cinemática intro | 1280×900 | 5 | 4 | 5 | 5 | 4 | 3 | **4,3** |
| Cinemática intro | 1920×1080 | 5 | 4 | 5 | 5 | 4 | 3 | **4,3** |
| Cinemática intro | 390×844 | 5 | 4 | 4 | 5 | 3 | 4 | **4,2** |
| HUB · El Refugio | 1280×900 | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| HUB · El Refugio | 1920×1080 | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| HUB · El Refugio | 390×844 | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| Cartel de círculo | 1280×900 | 2 | 3 | 4 | 3 | 3 | 5 | **3,3** |
| Cartel de círculo | 1920×1080 | 2 | 3 | 4 | 3 | 3 | 5 | **3,3** |
| Cartel de círculo | 390×844 | 2 | 3 | 3 | 3 | 2 | 5 | **3,0** |
| HUD combate · I LIMBO | todas | 3 | 3 | 4 | 4 | 3 | 4 | **3,5** |
| HUD combate · II LUJURIA | todas | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| HUD combate · III GULA | todas | 3 | 3 | 4 | 4 | 3 | 4 | **3,5** |
| HUD combate · IV AVARICIA | todas | 3 | 3 | 3 | 4 | 2 | 4 | **3,2** |
| HUD combate · V IRA | todas | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| HUD combate · VI HEREJÍA | todas | 4 | 3 | 4 | 4 | 2 | 4 | **3,5** |
| HUD combate · VII VIOLENCIA | todas | 4 | 3 | 4 | 4 | 3 | 4 | **3,7** |
| HUD combate · VIII FRAUDE | todas | 4 | 4 | 4 | 4 | 4 | 4 | **4,0** |
| HUD combate · IX TRAICIÓN | todas | 4 | 3 | 4 | 4 | 4 | 4 | **3,8** |
| HUD combate · X NÚCLEO FINAL | todas | 4 | 3 | 4 | 4 | 4 | 4 | **3,8** |
| Jefe · I ANDÉN (Limbo) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · II MAGNETA (Lujuria) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · III BUFÉ (Gula) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · IV EL CAJERO (Avaricia) | todas | 4 | 3 | 4 | 4 | 2 | 3 | **3,3** |
| Jefe · V EL POGO (Ira) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · VI EL OFICIANTE (Herejía) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · VII MATARIFE (Violencia) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · VIII EL IMITADOR (Fraude) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · IX EL TRAIDOR (Traición) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Jefe · X NÚCLEO FINAL (Núcleo) | todas | 5 | 4 | 4 | 4 | 4 | 3 | **4,0** |
| Resultado · derrota | 1280×900 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |
| Resultado · derrota | 1920×1080 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |
| Resultado · derrota | 390×844 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |
| Resultado · victoria | 1280×900 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |
| Resultado · victoria | 1920×1080 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |
| Resultado · victoria | 390×844 | 5 | 5 | 5 | 4 | 5 | 4 | **4,7** |


---

## 3. Hallazgos detallados

### 3.1 Cámara y encuadre (crítico)

| ID | Hallazgo | Evidencia |
|---|---|---|
| CAM-1 | **I LIMBO deja ~1/3 de la pantalla en negro** a la izquierda: la sala no llena el viewport y la cámara no re-encuadra al entrar; enemigos fuera de la sala se dibujan sobre el vacío. | `07-hud-01-limbo-*.jpg` |
| CAM-2 | **La sala no cabe a 1280×900 en varias plantas** (GULA, AVARICIA, IRA, HEREJÍA, VIOLENCIA, FRAUDE, TRAICIÓN, NÚCLEO): los muros y el contorno de choque se cortan por los bordes; en AVARICIA el rombo de la sala y el alfombrado central quedan truncados arriba y abajo. | `07-hud-03..10-*.jpg` |
| CAM-3 | La cámara no ajusta zoom al aspecto de ventana: a 1920×1080 se ve más vacío alrededor; a 390×844 el encuadre no adapta el HUD ni la sala (ver §3.6). | comparativas de resolución |
| CAM-4 | Formas de sala irregulares (polígonos recortados, p. ej. HEREJÍA y NÚCLEO) sin muros coherentes en los cortes: el límite de cámara muestra negro en lugar de arquitectura. | `07-hud-06`, `07-hud-10` |

### 3.2 Suelos, muros y materiales por círculo

| ID | Círculo | Hallazgo | Evidencia |
|---|---|---|---|
| MAT-1 | III GULA · IV AVARICIA · salas de jefe | **La alfombra de brocado rojo** (prácticamente idéntica en las cuatro apariciones) sustituye al material propio de cada círculo; en LIMBO además choca con la piedra gris. Rompe «un tono por círculo» y la lectura de Avaricia (debería ser oro/bóveda). | `07-hud-01`, `07-hud-03`, `07-hud-04`, `08-jefe-*` |
| MAT-2 | II LUJURIA | El abanico art-déco es el tono correcto, pero se teseliza sin variación de escala ni rotación sobre toda la sala: fatiga visual, bandas y posible moiré al recorrer la sala; los cofres y el jugador se funden con el patrón. | `07-hud-02-lujuria-*.jpg` |
| MAT-3 | III GULA | Damero de mármol herrumbre + fila de taquillas idénticas repetidas 12+ veces (sin variación); patrón de tablero de ajedrez demasiado regular. | `07-hud-03-gula-*.jpg` |
| MAT-4 | IV AVARICIA | Azulejo oro/negro con rejilla de puntos: correcto para avaricia, pero la sala diamante cortada por la cámara lo empeora; el wash rojo del flash de jefe borra la paleta entera (ver FX-2). | `07-hud-04`, `08-jefe-04-avaricia-*.jpg` |
| MAT-5 | V IRA | Grietas de lava: el mejor encaje material↔círculo del juego junto con Herejía. Páralas demasiado uniformes (misma grieta repetida); faltan puntos focales y decales de daño. | `07-hud-05-ira-*.jpg` |
| MAT-6 | VI HEREJÍA | Rejilla violeta con sigilo arcano: tono excelente. Problema: enemigos violeta sobre violeta (ver PJE-1) y contraste del jugador pobre. | `07-hud-06-herejia-*.jpg` |
| MAT-7 | VII VIOLENCIA | Chapa atornillada + verde tóxico: funciona; los cortes de la sala por el viewport y el haz de aviso (buena señal) compiten con el verde. | `07-hud-07-violencia-*.jpg` |
| MAT-8 | VIII FRAUDE | Travertino cian con damero interior: buen casino/trampa; el cofre central de VIP se superpone visualmente sobre el damero y baja su legibilidad. | `07-hud-08-fraude-*.jpg` |
| MAT-9 | IX TRAICIÓN | Placas de hielo azul con rejilla: distintivo y limpio. El marco de la sala (polígono) vuelve a cortarse. | `07-hud-09-traicion-*.jpg` |
| MAT-10 | X NÚCLEO | Concéntricas blancas sobre negro: dramático y coherente; la uniformidad absoluta crea fatiga a los 15–20 s; el blanco puro eleva el contraste sin foco en el jugador. | `07-hud-10-nucleo-*.jpg` |
| MAT-11 | HUB | Damero granate/negro del Refugio: repetitivo y plano a 1280×900/1920 (celdas sin variación de tono ni desgaste); las costuras de baldosa son perfectamente regulares. | `05-hub-*.jpg` |
| MAT-12 | Varios | Se reutilizan los mismos muebles/cofres («baúles negros») idénticos en todas las plantas, sin tinte por círculo ni variación; saturan la silueta del suelo. | todas las `07-*` |

**Lectura global:** el sistema «un tono por círculo» está razonablemente conseguido en paleta global, pero el **material maestro de la alfombra de jefe** y los **cofres transversales** rompen la coherencia; y el **tejido regular de los patrones** (abanicos, damero, sigilo) genera fatiga y camufla amenazas.

### 3.3 Personajes, enemigos, jefes y siluetas

| ID | Hallazgo | Evidencia |
|---|---|---|
| PJE-1 | **Todos los enemigos comunes aparecen como el mismo arquetipo violeta** en las diez plantas; en LUJURIA (magenta), HEREJÍA (violeta) y TRAICIÓN (azul oscuro) el contraste enemigo↔suelo es insuficiente; en IRA (rojo) y AVARICIA (rojo) se funden por temperatura. Existen roles distinguibles (melé/distancia/élite: el «elite» rojo con barra en FRAUDE; brutes dorados y hombres de gris en TRAICIÓN), pero el grueso es intercambiable. | `07-hud-*-*.jpg` |
| PJE-2 | El jugador (~180 px de alto a 1280×900) se pierde sobre suelos ocupados; en el combate real es más pequeño aún. El foco de luz del HUB no existe en combate. | `07-*`, contraste con `05-hub` |
| PJE-3 | **Jefes: el mejor arte del build.** Ilustraciones grandes, silueta clara, nombre + subtítulo (`ANDÉN · EL PORTERO`, `MAGNETA · LA ANFITRIONA`, `BUFÉ · EL ANFITRIÓN SIN FONDO`, `EL CAJERO · EL QUE COBRA LA ENTRADA`, `EL POGO · EL QUE ABRE LA PISTA`, `EL OFICIANTE · EL QUE OFICIA EL RUIDO`, `EL MATARIFE · EL QUE DESPIECE EL SET`, `EL IMITADOR · EL QUE DUPLICA LA PISTA`, `EL TRAIDOR · EL ÚLTIMO RESIDENTE`, `NÚCLEO FINAL · LA ÚLTIMA CANCIÓN`), barra de jefe y tile «CINEMÁTICA EN TIEMPO REAL» con salto. | `08-jefe-*.jpg` |
| PJE-4 | Barra de jefe rosa/magenta idéntica en todas las arenas; no usa el color de círculo del jefe. | `08-jefe-*.jpg` |
| PJE-5 | Borde brillante (rim-light) en ~13–22 % de los píxeles de borde de los sprites legacy `player_*` (p. ej. `player_aim_down_03.png` 20,0 %, `player_walk_00.png` 18,9 %) frente a outfits nuevos (`entrenador/idle.png` 15,4 %, resto ≤13 %). Compatible con la dirección neón intencional, **sin verificación de que no haya halos incrustados**: requiere revisión humana en FASE 5. | análisis §4.4 |
| PJE-6 | Idle/walk del camerino (PERSONALIZAR) usa arte generado por outfit, coherente entre sí, pero con **diseño de protagonista distinto al maestro aprobado** (pelo rojizo vs lámina canónica negra y rasgos diferentes). Ya documentado como «diseño anterior»; pendiente de la Fase 5. | `02-atuendos-*.jpg` |
| PJE-7 | Los NPCs del HUB (TEMPO a la izquierda, DJ en diálogo) son ilustrados y legibles; bien contrastados. | `05-hub-*.jpg` |

### 3.4 Texto, tipografía y contraste de HUD

| ID | Hallazgo | Evidencia |
|---|---|---|
| TXT-1 | **Microtipografía 8–12 px** generalizada en `src/dd_rebuild_ui.css`: 18×`12px`, 15×`11px`, 9×`10px`, 6×`9px`, 2×`8px` (+ 11,5/10,5/9,5/11 px sueltos). Las etiquetas de sala/círculo, `NV.1`, `ESC` y la ayuda inferior quedan pequeñas a 1280 y testimoniales a 390. | inspección CSS |
| TXT-2 | **Minimapa casi ilegible**: caja negra sin leyenda ni contraste interno; sólo puntos blancos/amarillos/cian visibles a máxima atención. | `07-*`, `05-hub` |
| TXT-3 | **«ARMERÍA · TORRE · [H] REFUGIO» visibles también en combate** durante toda la partida (mismo bloque de botones que en el HUB): ruido visual permanente y riesgo de salida accidental (o percepción del mismo). | `07-*`, `08-*` |
| TXT-4 | Panel **«SIN INCURSIÓN»** (HUB, arriba-derecha): negro muerto con marco magenta, vacío de datos; delata que el estado «expedición no iniciada» no tiene diseño propio. | `05-hub-*.jpg` |
| TXT-5 | «ESPACIO · SALTAR» dorado (#ffca28 aprox.) sobre fondo claro en la cinemática: contraste insuficiente en frames brillantes; y sin barra de progreso de la intro. | `04-cinematica-intro-*.jpg` |
| TXT-6 | Botones del resultado (`REINTENTAR` con foco rosa, `MENÚ PRINCIPAL`): contraste y jerarquía correctos; tipografía display consistente con la guía. | `09/10-resultado-*.jpg` |
| TXT-7 | Subtítulo de sala en combate `SALA DEL TORNO · CÍRCULO II · LUJURIA`: legible, con buen marco; el mismo rótulo cambia de y/posición según el círculo (salta de línea en NÚCLEO). | `07-*` |
| TXT-8 | Nombre de la sala de jefe: **«CÁMARA DEL RESIDENTE»** idéntico en las diez arenas; no nombra al Residente ni al círculo. | `08-*` |
| TXT-9 | Modales de resultado: `SALA / PUNTUACIÓN / BAJAS / TIEMPO` en grid de 4 tarjetas — legible a las tres resoluciones (verificar 390). | `09/10-*` |
| TXT-10 | El rótulo de estado inferior de carga (`PREPARANDO EL CLUB`, `0 %`, `PULSA UNA TECLA…`) usa mono-espaciada pequeña pero sobre casi-negro: contraste suficiente; el `0 %` congelado es artefacto del arranque congelado, no un fallo. | `00-carga-*.jpg` |

### 3.5 Cinemáticas y carteles

| ID | Hallazgo | Evidencia |
|---|---|---|
| CIN-1 | Intro: ilustración de gran calidad y dirección consistente (capullo de neón, chapa y silueta). Sin letras de título animadas visibles en el frame capturado (2,5 s); no hay indicador de progreso ni duración restante. | `04-cinematica-intro-*.jpg` |
| CIN-2 | «ESPACIO · SALTAR» y la ayuda inferior insuficiente (ver TXT-5); la intro se puede saltar (verificado en flujo) pero el affordance es discreto. | `04-cinematica-intro-*.jpg` |
| CIN-3 | **Cartel de círculo (descenso I): pantalla infra-producida** — caja blanca fina centrada, microtipo sobre un fondo casi negro (~80 % vacío), «LA SALA DE ESPERA · 118 BPM» en 11 px; no usa el color de círculo, ni arte, ni silueta del Residente. Es la primera impresión de cada planta. | `06-cartel-circulo-*.jpg` |
| CIN-4 | **Jefes (carta de presentación): excelente estructura** — «AMENAZA RESIDENTE · <nombre>» arriba, ilustración grande a la derecha, nombre + subtítulo en placa inferior izquierda, telegrafos en el suelo (avisos circulares de BUFÉ), `SALTAR [ESPACIO]` arriba-derecha, `CINEMÁTICA EN TIEMPO REAL` abajo. La carta persiste sobre el mundo: identidad clara. | `08-jefe-*.jpg` |
| CIN-5 | **Wash rojo integral en el flash de entrada del jefe de AVARICIA** («EL CAJERO»): toda la escena se tiñe de rojo saturado y el contraste se desploma durante ~0,5–1 s; si coincide con su llegada real es intencional, pero es excesivo y debería vetarse o moverse tras «reducir destellos». | `08-jefe-04-avaricia-*.jpg` |
| CIN-6 | La letra «CINEMÁTICA EN TIEMPO REAL» en cian sobre la banda inferior: legible, discreta, correcta. | `08-jefe-*.jpg` |
| CIN-7 | El HUD NO se oculta durante la carta de jefe: los corazones y el panel superior quedan **cortados por la barra «AMENAZA RESIDENTE»** (solape del chrome de cinemática sobre el HUD). | `08-jefe-*.jpg` |

### 3.6 Resolución 390 px (móvil)

Pasada completa: **29/29 pantallas** (`*-390x844.jpg`). Lectura por grupos (evidencia entre paréntesis):

| ID | Hallazgo | Evidencia |
|---|---|---|
| MOB-1 | **HUD superior recortado por el borde del viewport**: la fila de corazones y la placa del jugador quedan cortadas por el borde superior en combate y en arenas de jefe; la placa de nombre («EL…», «MA…») queda **debajo del minimapa**, solapándose (el minimapa es una caja negra enorme que ocupa ~30 % del ancho). | `07-hud-*-390x844.jpg`, `08-jefe-01..10-390x844.jpg` |
| MOB-2 | **Botones «ARMERÍA · TORRE · [H] REFUGIO» visibles también en 390** (TXT-3 confirmado en móvil). | `05-hub`, `07-hud-*`, `08-jefe-*` 390 |
| MOB-3 | **HUB**: el panel «SIN INCURSIÓN» se **sale por el borde derecho** (marco magenta truncado); el retrato + corazones + «M1911 · ∞» caben pero justos; el damero granate se lee mejor en pequeño. | `05-hub-390x844.jpg` |
| MOB-4 | **Jefes**: la carta «REGLA · …» inferior es legible y de buen tamaño; nombre del jefe («ANDÉN · EL PORTERO», «MAGNETA · LA ANFITRIONA», «EL CAJERO · EL QUE COBRA LA ENTRADA») con contraste correcto sobre barra magenta. El HUD superior (corazones, HYPE) sigue recortado (MOB-1) y el nombre de sala «CÁMARA DEL RESIDENTE · CÍRCULO N · …» legible en 2 líneas. | `08-jefe-01..10-390x844.jpg` |
| MOB-5 | **Cartel de círculo**: microtipo inferior («LA SALA DE ESPERA · 118 BPM» / «CINEMÁTICA EN TIEMPO REAL») envuelve a 2 líneas; la caja central sigue siendo ~70 % vacío (CIN-3 se agrava en móvil); «SALTAR [ESPACIO]» sigue visible (botonera táctil no presente). | `06-cartel-circulo-390x844.jpg` |
| MOB-6 | **Cinemática de intro**: key art se recorta lateralmente (encuadre pensado para 16:9); «ESPACIO · SALTAR» apenas visible (tenue, esquina inferior derecha) — no existe affordance táctil alternativa. | `04-cinematica-intro-390x844.jpg` |
| MOB-7 | **Menú principal**: key art recortado lateralmente pero correcto; «LA NOCHE QUE DEVORÓ…» solapa con «NUEVE CÍRCULOS · UN ÚLTIMO BAILE» en 2 líneas; «JUGAR» mantiene el amarillo fuera de paleta (ACC-3); ayuda inferior con kbd legible. | `01-menu-390x844.jpg` |
| MOB-8 | **Atuendos y EXTRAS en 390 funcionan bien**: layout vertical, tarjetas y textos legibles, foco claro; el camerino es el mejor caso de adaptación del build. | `02-atuendos`, `03-extras` 390 |
| MOB-9 | **Resultados en 390 correctos**: grid 2×2 legible, `REINTENTAR` con foco rosa y `MENÚ PRINCIPAL` distinguibles; nota «Partida modificada · sin récords ni recompensas oficiales.» se lee completa. | `09-resultado-derrota`, `10-resultado-victoria` 390 |
| MOB-10 | **La barra de habilidades inferior (Q / SHIFT / ESP) en combate** se ve completa y legible en 390 (contra 1280/1920 donde compite con el HUD superior) — único elemento del HUD que mejora en móvil. | `07-hud-03-gula`, `07-hud-10-nucleo`, `07-hud-02-lujuria` 390 |
| MOB-11 | **Cámara/encuadre**: salas más grandes que el viewport también en 390 (CAM-2/3 confirmado); el mapa táctil no existe; jugar un combate en 390 exige explorar a ciegas en salas grandes. | `07-hud-10-nucleo-390x844.jpg` |

**Lectura global 390:** cero pantallas «rotas» — el juego **arranca, menús, resultados y cartas de jefe son usables**; el **HUD superior es el fallo sistémico** (recorte + solape placa/minimapa, MOB-1) y **el no-apoyo de controles táctiles** (MOB-5/6) es la carencia de fondo para el caso «móvil». Como en 1280/1920, se confirma **microtipografía** (TXT-1) en rótulos de sala y ayuda inferior. **Movilidad:** ningún elemento del 390 merece puntuación distinta de 4/3 en legibilidad salvo el HUD y el cartel (2–3).

**Nota de método (transparencia):** la primera pasada de capturas 390 (coexistente con la de 1280/1920) dejó ficheros de arenas de jefe **idénticos** (40655 B, todos) por un fallo de flujo (`DMO.debug.boss()` no llegó a tiempo y la arena quedó sustituida por la pantalla de resultado tras la derrota del jugador). La pasada final regrabó **las 87 capturas**; los md5 de los diez `08-jefe-*-390x844.jpg` finales son distintos entre sí y corresponden a arenas reales (verificado visualmente en 01/02/03/04). `captures.json` refleja exclusivamente la pasada final.

### 3.7 Carga y arranque

| ID | Hallazgo | Evidencia |
|---|---|---|
| ARR-1 | Pantalla de carga **fuerte**: key art 2K, logotipo, progreso real por hitos, marca «DEADBEAT DISCO · SISTEMA DE PISTA», `v3.3.0`, ayuda de salto. Muy por encima del estándar del género. | `00-carga-*.jpg` |
| ARR-2 | Arranque medido (SwiftShader): hasta `MAIN_MENU` ≈ **15,15 MB transferidos**, **250 recursos**, `index.html` casi siemprecacheado = 5,46 MB (navegación). Descomposición: 5,46 MB HTML (contiene base64) + ~9,7 MB en imágenes/fuentes (png ≈ 226 KB, webp ≈ 676 KB, woff2 ≈ 24 KB). | sonda §4.3 |
| ARR-3 | `assets/` pesa **435 MB** en disco (903 ficheros; 639 PNG vs 210 WebP); los **fondos cinemáticos maestros son PNG de 3,0–4,3 MB** (p. ej. `cine_bg05_dancefloor.png` 4,28 MB) sin respaldo WebP/AVIF. | §4.2 |
| ARR-4 | El `index.html` autocontenido inline bloquea el caché granular (un cambio de un asset invalida 5,7 MB); la estrategia de carga diferida por pantalla no existe aún (preload de todo). | lectura del build |

### 3.8 Assets, manifiesto y duplicados

| ID | Hallazgo | Detalle |
|---|---|---|
| AST-1 | Manifiesto **277 registrados / 349 planificados**; **los 105 no registrados son armas (`assets/weapons/weapon_*.png`, estado `PENDING`)** que no existen en disco → no es un bug: es producción pendiente (15 armas sí existen y están registradas). El juego pinta armas inexistentes con… verificar comportamiento en Fase 6 (`assetSrc`/`weaponImgSrc`). | análisis §4.5 |
| AST-2 | **0 entradas registradas ausentes en disco**; **0 entradas del manifiesto sin referenciar** en `src/`+build+tools (búsqueda por nombre de fichero y por id). | análisis §4.5 |
| AST-3 | **70 grupos de duplicados por SHA-256** en el repositorio. La mayoría son copias de archivo (`assets/characters/outfits/concepts/archive/phase03-before/*` frente a `assets/characters/outfits/*`, cifras idénticas) y pares exactos `assets/characters/player_*.png` ↔ `assets/cinematics/characters/protagonist/hero_*.png` (2 ficheros), `cine_bg0*.png` ↔ `backgrounds/final/...` (6), `assets/fase01/logo_deadbeat_trim.png` ↔ `cinematics/logos/logo_deadbeat_cinematic.png`. **No se borra nada en Fase 0**; lista completa en §4.6. | análisis §4.6 |
| AST-4 | No hay assets duplicados **registrados en el manifiesto** (misma fuente en dos claves): el duplicado es de disco, no de registro. | análisis §4.6 |
| AST-5 | `REF_06` (guía maestra) numera LUJURIA como «I» y NÚCLEO como «IX», mientras el motor arranca en **LIMBO «I»** y acaba en **NÚCLEO FINAL** como 10.º destino; la guía no contempla LIMBO. Deriva de nomenclatura del diseño, no del arte. Se documenta; **no se cambia en esta fase** (afectaría a textos y a la guía: decisión de dirección pendiente). | REF_06, `__DD_BRIDGE.getCircles()` |
| AST-6 | Los sprites de combate del protagonista siguen siendo del diseño anterior (22 `player_*`), el camerino y el HUB usan piezas del diseño en transición (IDLE 07B, descenso), y la lámina canónica no se refleja aún en combate. Conocido y documentado en CURRENT_STATE; la continuidad real llegará con la Fase 5. | docs/RESTART, CURRENT_STATE |

### 3.9 Rendimiento (señal relativa, SwiftShader)

Medianas de `captures.json` (pasada final, ≥1,5 s por muestra):

| Pantalla | 1280×900 | 1920×1080 | 390×844 | heap (MB) |
|---|---|---|---|---|
| Carga | — | — | — | — |
| Menú principal | 5,9 | 4,4 | 20,3 | 16,3 / 15,4 / 16,3 |
| Camerino (atuendos) | 2,9 | 2,5 | 10,5 | ídem |
| EXTRAS | 3,5 | 1,7 | 9,2 | ídem |
| Cinemática intro | 4,0 | 5,9 | 52,6 | ídem |
| HUB | 9,3 | 4,7 | 52,9 | ídem |
| Cartel de círculo | 14,4 | 8,2 | 60,4 | ídem |
| HUD I LIMBO | 4,4 | 7,7 | 60,3 | ídem |
| HUD II LUJURIA | 13,7 | 7,7 | 57,9 | ídem |
| HUD III GULA | 15,8 | 12,8 | 57,1 | ídem |
| HUD IV AVARICIA | 16,3 | 13,3 | 57,1 | ídem |
| HUD V IRA | 12,2 | 13,7 | 59,1 | ídem |
| HUD VI HEREJÍA | 12,3 | 11,5 | 60,0 | ídem |
| HUD VII VIOLENCIA | 14,8 | 13,5 | 59,8 | ídem |
| HUD VIII FRAUDE | 12,1 | 13,2 | 53,9 | ídem |
| HUD IX TRAICIÓN | 9,1 | 13,2 | 60,5 | ídem |
| HUD X NÚCLEO | 10,8 | 12,7 | 59,9 | ídem |
| Jefes I–X | 6,9–13,7 | 9,9–12,5 | 34,8–58,7 | ídem |
| Arenas de jefe (media) | ~11,7 | ~11,2 | ~47 | ídem |
| Resultado · derrota | 13,6 | 13,4 | 60,5 | ídem |
| Resultado · victoria | 15,9 | 14,0 | 60,4 | ídem |

**Lectura:** el orden relativo es coherente (las pantallas DOM con pocos sprites van primero; EXTRAS/camerino rinden por debajo por los paneles grandes de imagen; el menú es DOM pesado). **En 390 los fps medidos son muy superiores a 1280/1920: NO es que el juego vaya mejor en un móvil real — es que hay la mitad de píxeles a rasterizar por SwiftShader.** **Estos números no sirven como puerta de rendimiento** (SwiftShader + headless); se apuntan como línea base para comparar en Fase 6 con GPU real. Memoria heap plana (~15,4–16,3 MB) en todas las pantallas y resoluciones — sin fuga evidente durante el recorrido. **Estado tras jefes: `hp: 3, dead: false` en las tres resoluciones** (`meta-post-bosses`): las llamadas de depuración no mataron al jugador.

**FPS reales esperados:** desconocidos. **Nada de lo anterior debe leerse como «el juego va a X fps».**

### 3.10 Accesibilidad y movimiento

| ID | Hallazgo | Evidencia |
|---|---|---|
| ACC-1 | `prefers-reduced-motion` se respeta en el menú (medido: `animationName: none` en `dd-menu-logo`, `dd-menu-beat-light` y `dd-menu-vig::after` con `reducedMotion:'reduce'`). Sin defectos detectados en esta sonda. | sonda §4.7 |
| ACC-2 | Flashes de cámara del menú (`dd-flash-a/b/c`) y estrobo de beat-light (`dd-strobe`) existen pero quedan tras el bloque `@media (prefers-reduced-motion: reduce)`; **no existe** una opción «reducir destellos» independiente (requisito de Fase 2). | CSS, sonda §4.7 |
| ACC-3 | El botón enfocado del menú (`JUGAR`) es un bloque amarillo plano (#facc15-like) con texto degradado naranja: legible pero **rompe el contrastar neón/illustration** del resto; el estado de foco no sigue el sistema (¿token? ¿borde? — a definir en Fase 1/2). | `01-menu-*.jpg` |
| ACC-4 | La ayuda inferior del menú (`W S MOVER · ENTER ELEGIR · ESC ATRÁS` + `TECLADO · RATÓN · MANDO V3.3.0`) es correcta y con kbd reales. | `01-menu-*.jpg` |

---

## 4. Análisis estático de artefactos (métodos y cifras)

### 4.1 Peso de la build y del repositorio
- `index.html` / `DEADBEAT_DISCO.html`: **5.726.853 bytes** cada uno (idénticos, SHA `6fdba6c4…`). 5,46 MB por transferencia de navegación (gzip/brotli no aplicado por el servidor de desarrollo; en producción con `Content-Encoding` el coste real será menor, pero el HTML sigue conteniendo el base64 inline).
- Arranque hasta `MAIN_MENU` (sonda `performance.getEntriesByType('resource')` tras boot completo): **250 recursos, ≈15,15 MB transferidos** (5,46 MB HTML/nav + ≈9,7 MB imágenes/fuentes). Desglose del rastreo: `png ≈ 226 KB`, `webp ≈ 676 KB`, `woff2 ≈ 24 KB`, y ≈14,9 MB sin extensión en la ruta del nombre (recursos del propio HTML, incl. data-URIs ya contabilizados en el HTML).
- `assets/` = **435 MB** en disco; 903 ficheros versionados con extensión de imagen/audio (639 PNG, 210 WebP, 28 JPG, 6 GIF, 2 WOFF2, 4 MD, 9 JSON).

### 4.2 Fondos cinemáticos
- `assets/cinematics/backgrounds/final/*/{cine_bgNN_*.png}`: 3,0–4,3 MB por maestro (6 maestros ≈ 24,8 MB) + capas 2.5D de 2,4–3,9 MB (6 capas × 6 escenas ≈ 82 MB adicionales en `final/`). Formatos: PNG; **sin respaldo WebP/AVIF** en el propio árbol de cinemáticas. ROI inmediato de compresión: WebP q80 estimado −70..85 % de bytes sin pérdida visible para ilustración; con respaldo PNG/JPG para navegadores sin WebP (cobertura ya práctica: WebP es universal desde 2020).
- La cinemática de intro (`dd_opening.js`) y el canvas del motor (`dd_world_renderer.js`) dibujan estas capas; la conversión a WebP es cambio de formato, no de dirección: se hará en Fase 6 con medición antes/después.

### 4.3 Arranque (sonda)
Comandos y resultado ya en §1.2/§4.1. `DOMContentLoaded ≈ 1,29 s`, `load ≈ 7,66 s` (SwiftShader + disco local; no representativo de la red de un jugador).

### 4.4 Bordes y halos (heurística automatizada)
Métrica: fracción de píxeles de borde opacos (alpha>12) con luminosidad >200 y vecino transparente, sobre 107 sprites (jugador, outfits, enemigos, jefes). Resultado:
- `player_aim_down_03.png` 20,0 % · `player_walk_00.png` 18,9 % · `player_aim_up_02.png` 16,1 % · `player_boost_00.png` 15,0 % (legacy «diseño anterior»).
- Outfits nuevos: `entrenador/idle.png` 15,4 % · `aventurero/idle.png` 12,9 %; resto en torno a 8–13 %.

**Interpretación:** compatible con el *rim light* neón exigido por la dirección (no es per se un halo de recorte). Sin verificación visual individual no se puede separar rim intencional de halo incrustado. Acción: revisión humana en Fase 5 con muestras en game y en fondo tanto oscuro como claro; no se borra ni se toca nada aquí.

### 4.5 Manifiesto vs disco
- `assets/manifest.json`: `totalRegistered=277`, `totalPlanned=349`, `entries=277`.
- **0** entradas registradas con ruta ausente en disco. **0** entradas sin referencia en `src/` + build + tools + ART_PACK (búsqueda por `src` completo, basename e id).
- Los **105 huecos** frente a lo planificado son **armas** `assets/weapons/weapon_*.png` con `integration_status=PENDING`, inexistentes en disco y en el build; el juego resuelve armas no dibujadas con el icono/recurso que corresponda en runtime (a confirmar en Fase 6). En disco sólo hay 15 PNG de armas (registrados).
- Categorías registradas: bosses 42 · cinematics 35 · props 34 · characters 31 · enemies 24 · effects 22 · pickups 20 · ui 17 · weapons 16 · floors 13 · walls 10 · environments 9 · logos 3 · overlays 1.

### 4.6 Duplicados exactos (SHA-256 sobre `git ls-files`, carpetas de arte)
**70 grupos · 71 ficheros de más · ≈53,6 MB redundantes**, repartidos:
- `assets/characters/…`: 49 ficheros extra — casi todos `assets/characters/outfits/<outfit>/{8 poses}.png` frente a `assets/characters/outfits/concepts/archive/phase03-before/<outfit>/*.png` (copias de respaldo idénticas ordenadas por la política de archivo).
- `assets/cinematics/…`: 9 — pares `backgrounds/cine_bgNN_*.png` ↔ `backgrounds/final/cine_bgNN_*/cine_bgNN_*.png` (los 6 maestros de 4 MB), `cinematics/characters/protagonist/hero_{idle,shoot}_00.png` ↔ `characters/player_{idle,shoot}_00.png` (2), `cinematics/logos/logo_deadbeat_cinematic.png` ↔ `fase01/logo_deadbeat_trim.png` (1).
- `assets/references/…`: 8 — láminas de referencia con nombre distinto por carpeta (`REF_*` histórico duplicado en `ART_REFERENCES/`).
- `ART_ASSETS/tanda_03/fase_b/_candidates/…`: 3 — candidatos desechables conservados como histórico.
- `ART_REFERENCES/REF_04_protagonista_banner.png`: 1.
- `assets/fase01/…`: 1.

**Nada de esto se borra en Fase 0.** La lista es la materia prima de la tarea de limpieza de Fase 6 (y esa fase exige comprobar rutas/scripts/builds antes de borrar).

### 4.7 Movimiento y destellos
- `prefers-reduced-motion: reduce` **verificado** en el menú real: `animationName = none` en `dd-menu-logo`, `dd-menu-beat-light`, `dd-menu-vig::after` (sonda con `reducedMotion:'reduce'`).
- Flashes de cámara (`dd-flash-a/b/c`) y estrobo (`dd-strobe`) existen; ambos quedan bajo `@media (prefers-reduced-motion: reduce)`; **no existe** opción independiente «reducir destellos» (Fase 2).
- 106 colores hex sueltos y 29 `--dd-*` en `src/dd_rebuild_ui.css`: no hay escala de espaciado, ni tokens semánticos de contraste; base directa para la Fase 1.

### 4.8 Consola, red y errores
- `captures.json → errors[]`: **`[]`** (literal, pasada final; ver anexo A). Ningún `pageerror`, ningún 404 local ni externo registrado en las tres resoluciones.
- `captures.json → captures[].meta`: incógnita `meta-post-bosses` (`hp: 3, dead: false`) en las tres resoluciones.

---

## 5. Tabla priorizada (impacto en el jugador × esfuerzo)

Escala de impacto: 5 = el jugador lo sufre en cada partida · 1 = cosmético. Esfuerzo: S < 1 día · M = 1–3 días · L > 3 días (estimación orientativa, sin contrato).

| ID | Hallazgo (ref.) | Pantallas | Impacto | Esfuerzo | Fase | Prioridad |
|---|---|---|---|---|---|---|
| CAM-1 | Void negro en I LIMBO y salas más grandes que el viewport | HUD todas | 5 | M | 4 | **P0** |
| CAM-2/3 | Encuadre no adapta zoom al aspecto (16:9 ↔ 390 px) | HUD todas | 5 | M | 4 | **P0** |
| MAT-1 | Alfombra de brocado rojo fuera de lugar (Limbo/Avaricia/jefes) | HUD, jefes | 4 | M | 4 | **P0** |
| TXT-1 | Microtipografía 8–12 px; HUD ilegible en móvil | HUD, resultados | 4 | M | 1·2 | **P0** |
| MOB-1 | HUD superior recortado en 390 px (corazones, placa, minimapa) | HUB, combate, jefes | 3 | S | 1·2 | **P1** |
| TXT-3 | Botones «ARMERÍA · TORRE · [H] REFUGIO» visibles en combate | HUD combate | 4 | S | 1·2 | **P0** |
| CIN-3 | Cartel de círculo infra-producido (1.er contacto de cada planta) | transición | 4 | M | 3 | **P0** |
| PJE-1 | Enemigos intercambiables; violeta/magenta/rojo ilegibles | HUD todas | 4 | L | 5 | **P0** |
| F6 | Sin sistema de tokens (106 hex sueltos) | todo | 4 | M | 1 | **P0** |
| FX-2/CIN-5 | Wash rojo integral del flash de AVARICIA | jefe IV | 3 | S | 5 | **P1** |
| TXT-2 | Minimapa casi ilegible | HUD | 3 | S | 1·4 | **P1** |
| TXT-4 | Panel «SIN INCURSIÓN» vacío y negro muerto | HUB | 3 | S | 2 | **P1** |
| CIN-7 | HUD cortado por la barra «AMENAZA RESIDENTE» | jefes | 3 | S | 3 | **P1** |
| CIN-2 | «ESPACIO · SALTAR» dorado sobre claro; sin progreso de intro | cinemáticas | 3 | S | 3 | **P1** |
| MAT-2 | Tejido de abanicos LUJURIA sin variación (fatiga, moiré, camuflaje) | HUD II | 3 | M | 4 | **P1** |
| MAT-11 | Damero HUB plano y repetitivo | HUB | 3 | M | 4 | **P1** |
| MAT-12 | Cofres transversales sin tinte ni variación | HUD todas | 2 | M | 4 | **P1** |
| PJE-4 | Barra de jefe no usa el color del círculo | jefes | 2 | S | 5·1 | **P1** |
| PJE-5 | Halos/rim legacy sin verificación humana | combate | 3 | M | 5 | **P1** |
| CIN-4-bis | Cartas de jefe: bien — pero nombre de sala genérico (TXT-8) | jefes | 2 | S | 2·3 | **P1** |
| ARR-2/3 | Arranque ≈15 MB; PNGs 3–4 MB sin WebP/AVIF ni respaldo | todo | 4 | M | 6 | **P1** |
| AST-1 | 105 armas pendientes de producción (no tocadas en Fase 0) | armería | 3 | L | 6+producción | **P1** |
| AST-3 | 70 grupos duplicados ≈53,6 MB | repo | 2 | M | 6 | **P2** |
| AST-5 | Nomenclatura círculos guía vs motor (LIMBO inexistente en REF_06) | docs/guía | 2 | S | dirección | **P2** |
| H | Limpieza de `concepts/archive` y pares jugador/héroe | repo | 2 | M | 6 | **P2** |
| ARR-4 | Build autocontenida sin carga diferida ni caché granular | todo | 3 | L | 6 | **P2** |
| TXT-5 | «SALTAR»/ayuda con contraste insuficiente (cinemática) | cinemáticas | 2 | S | 3 | **P2** |

---

## Anexo A · Errores y metadatos de `captures.json` (transcripción literal)

Fuente: `ART_EVIDENCE/art_quality/fase0/captures.json`, generado `2026-11-26T01:59:39.765Z`, 90 entradas (87 capturas + 3 metadatos).

```json
"errors": []
```

Entradas sin fichero (`meta-post-bosses`, instante posterior a las diez arenas de jefe):

```json
{ "screen": "meta-post-bosses", "viewport": "1280x900", "meta": { "hp": 3, "dead": false } }
{ "screen": "meta-post-bosses", "viewport": "1920x1080", "meta": { "hp": 3, "dead": false } }
{ "screen": "meta-post-bosses", "viewport": "390x844", "meta": { "hp": 3, "dead": false } }
```

- Cero `pageerror` en las tres resoluciones durante todo el recorrido (carga → menú → camerino → extras → intro → HUB → cartel → 10 salas → 10 jefes → resultados).
- Cero peticiones de red fallidas (404/5xx/abort) desde el origen local del build.
- La captura de `00-carga` no ofrece fps (la página está congelada en `LOADING` por diseño de la sonda); fps en el resto de entradas según §3.9.
- **Nota de integridad:** los diez `08-jefe-*-390x844.jpg` finales tienen md5 distintos entre sí y muestran arenas reales (verificado visualmente en ANDÉN, MAGNETA, BUFÉ y EL CAJERO); una tanda intermedia había dejado ficheros de jefe idénticos (artefacto regrabado antes de generar este JSON).
