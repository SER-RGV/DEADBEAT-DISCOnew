# FASE 03 — FICHAS COMPLETAS DE LAS 9 PISTAS
# DEADBEAT DISCO · 2026-11-12 · 14 atributos por zona + ritmo y objetivo

**Autoridad:** Biblia §7–15 + Biblia Artística v2.0 + FASE_03_DISENO_UNIVERSO.md  
**Formato:** Cada ficha tiene 14 atributos obligatorios + ritmo + conexiones. Si un dato no está en el canon, se marca PROPUESTA o VACÍO.

---

# PISTA 01 — LA INVITACIÓN · VÉSPERA

### 1. Identidad narrativa
La noche aún era una fiesta. Alguien encendía las lámparas con la esperanza de que alguien se quedara cuando se apagaran. La Invitación es ese deseo convertido en sala: terciopelo negro, lámparas rosas que crean escenarios privados, columnas curvas que invitan y luego cierran. Véspera no es cruel: **confunde atención con amor**.

### 2. Función en la historia
**Tutorial emocional.** El jugador descubre que la torre no castiga el deseo de acercarse — lo convierte en encierro. Primera arma legendaria, primera regla musical, primer soberano que no es monstruo sino necesidad fallida. Aquí Tempo aún no habla mucho: observa si el Desafinado cae en la atracción.

### 3. Arquitectura característica
**Abanico de terciopelo.** Salas dispuestas en arco alrededor de una **sala central en forma de corazón roto** (sala 5/8). Columnas curvas con capitel tulipa rosa, arcos carpanel con cortina, suelos damero terciopelo-rosa. Ninguna sala es rectangular pura: todas tienen al menos un muro curvo. Hornacinas con lámparas que actúan como focos de atracción.

### 4. Lenguaje de formas
**Curvas concéntricas.** Círculos que invitan al centro y luego se cierran. Ninguna recta industrial. La diferencia con P08 (raíles) y P05 (verticales) es máxima en grises.

### 5. Paleta cromática
`Terciopelo negro #0a0c12 + lámpara rosa #ff2d7a + crema #e8e0c8 + cable oro #f0e090`. **LUT:** `magenta #ff2d7a / violeta #c026d3` + haze `rgba(255,45,122,0.13)` — la más cálida y seductora.

### 6. Iluminación y haze
Focos rosas cenitales que crean **zonas de luz/penumbra** en suelo. Cada foco es interactivo: si entras, te arrastra. En fase 2 de Véspera, aparece un doble que huye; en fase 3, todos los focos se apagan menos uno sobre el jugador (solo borde de luz muestra ataques). Haze rosado, denso, íntimo.

### 7. Ambientación
Bailarines detenidos a media reverencia, copas a medio brindar, guirnaldas sin encender, columnas con guirnaldas de bombillas rosas, alfombra terciopelo con desgaste circular alrededor de focos.

### 8. Enemigos
**Canónico:** Bailarines comunes (patrón reverencia-giro) + **Sombra abrazadora** (adhesión: se pega a jugador, -30% speed, solo daño de área la desprende). **Familia REF_06:** Bailarina dominante. Variantes que rodean/bloquean rutas.

### 9. Soberana
**Véspera, la Última Invitación** (`boss_01_magneta` → display Véspera). Terciopelo negro, máscara labios dorados, cables-marioneta. Arena corazón roto. 3 fases: arrastre → doble señuelo → foco único.

### 10. Elementos interactivos/destructibles
- **Focos arrastre:** Destructibles temporales (apagas el foco destruyendo su lámpara, pero reaparece en 8s).
- **Columnas curvas:** Bloquean si las rodeas; puedes usarlas como cover.
- **Cortinas rosas:** Al rasgarlas (disparo continuo), abres ruta alternativa 1 sala.

### 11. Mecánicas ambientales y de combate
**Pulsos graves (§7 Regla musical):** Cada 6s, pulsos concéntricos desde lámparas rosas concentran ataques hacia zonas de atracción. Debes **irte antes del pulso** o usar el desplazamiento para reposicionarte. La mecánica enseña a **no quedarse donde la música te quiere**.

### 12. Rutas, verticalidad y desniveles
**8 nodos / 4 capas / 2 rutas.** Ruta A (izquierda, 4 salas) = segura, con tienda y curación. Ruta B (derecha, 3 salas) = corta pero con 2 arenas de Sombra abrazadora. **Verticalidad:** Ningún foso; pequeños desniveles de 12px en alfombra (no afectan colisión). Balcones bajos (solo decoración, no saltables) en salas 2 y 6.

### 13. Secretos y recompensas
- **Secreto:** Cortina rasgada tras foco apagado → sala Archivo con testimonio Véspera (encendía lámparas).
- **Arma legendaria:** **Última Invitación** (pistola-bajo, orbes atracción) — tras Véspera.
- **Recompensa:** Primer CR + vinilo P01 para Archivo.

### 14. Conexiones
**Previa:** Refugio (plataforma). **Posterior:** Portal barroco oro → descenso a Pista 02 (hornos encendidos se oyen al cruzar). **Narrativa:** Testimonio Véspera desbloquea diálogo Tempo sobre lámparas. **Progresión:** Primer neón estable HUB.

**Ritmo/Objetivo:** Lento-introductorio. Enseñar sin castigar. Que el jugador muera por curiosidad (acercarse al foco), no por dificultad.

---

# PISTA 02 — EL BANQUETE · VORAZ

### 1. Identidad narrativa
Alguien vio que llegaban hambrientos tras la guerra y repartió su ración. Cuando amaneció, deseó que nunca faltara nada. La torre entendió "nunca faltará" como "nunca se acabará de servir y de tragar". El Banquete es abundancia grotesca sin saciedad: mesas que no se vacían, hornos que no se apagan, bandejas que no dejan de circular.

### 2. Función
**Presión por acumulación.** Si P01 enseñaba a moverte, P02 enseña a **no alimentar** la amenaza. Todo lo que no gestionas (platos, bocados) te vuelve en contra.

### 3. Arquitectura
**Líneas largas horizontales.** Salas-rectángulo de 2:1 (mesa larga como eje). Pasillos estrechos de 100px entre mesas. Cabeceras con hornos industriales (asset `wall_gula_banquet`). Ninguna curva salvo los hornos circulares. Arcos adintelados con vajilla rota.

### 4. Lenguaje formas
**Horizontalidad.** Mesas, bandejas, hornos — todo se extiende a lo largo. La sala se lee de izquierda a derecha como un banquete.

### 5. Paleta
`Terracota #210e09→#f97316 + crema vajilla #e8e0c8 + rojo horno #ef4444 + ámbar neón #f59e0b`. Haze ámbar 0.10 — cálida, oleosa.

### 6. Iluminación
Luz de hornos (abajo, naranja) + neón ámbar de barras superiores. Contraste alto: mesas iluminadas, pasillos penumbrosos. En fase 2 Voraz absorbe luz hacia su horno ventral.

### 7. Ambientación
Mesas con vajilla rota, manteles quemados, bandejas móviles con manos espectrales, hornos con puertas de cristal agrietado, carritos de servicio volcados.

### 8. Enemigos
**Canónico:** **Comensal insaciable** (devora tus proyectiles, cura a otros; prioriza dispararle primero) + bailarines + mesas-generadoras. **Familia:** Tanque (chef) dominante — empuja mesas.

### 9. Soberano
**Voraz, el Anfitrión Hueco** (`boss_02_bufe`). Vajilla rota, horno manos, cucharones. 3 fases: anillos de platos → absorción → horno abierto expulsando.

### 10. Interactivos
- **Bandejas móviles:** Plataformas que cruzan salas, generan enemigos si no las detienes (disparo al eje).
- **Hornos:** Si disparas a puerta de horno abierta, liberas mano que cura (usar con timing).
- **Mesas:** Destructibles en extremos, crean cover temporal.

### 11. Mecánicas
**Percusión por capas:** Cada enemigo añade capa de percusión. Algunas capas aceleran trampas de suelo (rejillas que se cierran). Debes **identificar qué enemigo sostiene la capa peligrosa** y priorizarlo. No todos los ataques se aceleran — escucha + mira.

### 12. Rutas
**9 nodos / 4 capas / 3 rutas.** Ruta central (5 salas) = balanceada. Ruta izquierda (mesas bajas) = muchos enemigos pero con curación. Ruta derecha (hornos) = trampas rápidas pero tienda. **Verticalidad:** Hornos elevados 18px (requiere esquiva en altura).

### 13. Secretos
- **Secreto:** Horno apagado tras bandeja detenida → sala secreta con Portero sin Rostro (primera aparición).
- **Arma:** **Sobremesa** — escopeta sopera, bocados espectrales.

### 14. Conexiones
**Previa:** P01 corazón roto → portal. **Posterior:** Portal oro a P03 (brillo oro se intensifica). **Narrativa:** Testimonio Voraz (repartió ración) + diálogo Tempo sobre generosidad compulsiva.

**Ritmo/Objetivo:** Creciente, claustrofóbico. Enseñar gestión de espacio largo y priorización de targets sonoros.

---

# PISTA 03 — LA CÁMARA DE LOS INSTANTES · ÁUREA

### 1. Identidad
Alguien guardaba una copa, una cinta, una flor seca como prueba de que algo hermoso había ocurrido. Deseó guardar los instantes completos. La torre le dio vitrinas con bailarines detenidos en su instante feliz. La Cámara es colección, no tesoro: oro que no brilla por riqueza sino por preservación.

### 2. Función
**Geometría.** Si P02 era horizontal, P03 es **ortogonal**. Enseña rebotes, ángulos y a pensar en la sala como espejo. Aquí aprendes que disparar no siempre es bueno.

### 3. Arquitectura
**Retícula ortogonal perfecta.** Grid 90° con sala central "**caja fuerte**" (4×4 vitrinas). Arcos conopiales dorados con vitrina integrada. Relojes sin agujas en cada intersección. Salas cuadradas de 1:1 con paredes-vitrina.

### 4. Lenguaje
**Retícula.** Todo es ortogonal, alineado, medido. Contraste con P01 curvas y P04 diagonales.

### 5. Paleta
`Pizarra negra #171206 + oro #facc15 + marfil #e8e0c8 + rosa polvo #fb7185`. Haze oro 0.10 — opulenta, fría.

### 6. Iluminación
Luz cenital uniforme (sala de museo) + reflejos oro en vitrinas. Cada vitrina proyecta **zona de reflejo** en suelo (cian sutil) donde tus proyectiles rebotan.

### 7. Ambientación
Vitrinas con bailarines congelados, relojes sin agujas, pedestales con moneda, flor seca en vitrina central (resolución Áurea: cae y marchita).

### 8. Enemigos
**Canónico:** **Vitrina ambulante** (refleja proyectiles; junta expuesta en espalda, único punto vulnerable) + guardianes colección. **Familia:** Tirador dominante.

### 9. Soberana
**Áurea, la Coleccionista** (`boss_03_cajero` → display Áurea). Exoesqueleto oro, trono relojes, dedos-llave, vitrina pecho. 3 fases: paneles reflectantes → encierra recurso en vitrina rompible → sacrifica colección para reparar armadura.

### 10. Interactivos
- **Vitrinas:** Reflejan proyectiles si disparas de frente; debes rodear.
- **Paneles móviles:** Cambian orientación al compás; rebotas usando geometría.
- **Caja fuerte central:** Si la abres sin limpiar vitrinas, libera 3 enemigos reflejados.

### 11. Mecánicas
**Recoger/guardar/expulsar:** Mecanismos alternan 3 estados visibles por icono sobre ellos. Disparar en "guardar" alimenta trampa; en "expulsar" recuperas tu propio disparo con daño ×1.5. Debes **elegir cuándo disparar**.

### 12. Rutas
**10 nodos / 5 capas / 2 rutas.** Ruta ortogonal externa (6 salas) = segura, con tienda. Ruta interna (4 salas) = caja fuerte central + 2 secretos. **Verticalidad:** Vitrinas altas 32px actúan como cover alto (requiere tiro parabólico visual, no colisión distinta).

### 13. Secretos
- **Secreto 1:** Vitrina con junta iluminada → sala Archivo (testimonio Áurea).
- **Secreto 2:** Caja fuerte → arma legendaria alternativa de P03 (si no eliges Último Centavo).
- **Arma:** **El Último Centavo** — revólver rebote + marca dorada.

### 14. Conexiones
**Previa:** P02 hornos → portal oro. **Posterior:** Portal rojo quemado a P04 (aire se enrarece). **Narrativa:** Flor marchita como símbolo de colección vs vida.

**Ritmo/Objetivo:** Táctico, pausado. Enseñar geometría y paciencia; que el jugador falle por impaciencia (disparar en "guardar").

---

# PISTA 04 — LA AMPLIFICACIÓN · BRAMA

### 1. Identidad
Alguien vio que las puertas desaparecían y gritó. Nadie lo oyó sobre la música. Pidió voz imposible de ignorar. La torre le dio un amplificador entre las costillas. La Amplificación es una sala de conciertos destruida y reconstruida: metal ennegrecido, cableado colgando, altavoces que aún pitan.

### 2. Función
**Ruptura.** Si P03 era precisión, P04 es **presión**. Primer contacto con peligro ambiental masivo y fuentes destructibles que son también oportunidad.

### 3. Arquitectura
**Estrella con altavoces en puntas.** Salas en forma de altavoz (trapecio) con paredes-cableado. Stacks de altavoces como pilares en cada esquina. Techo bajo con cables colgando (prop `speaker_tower` + `subwoofer_cyan`). Suelo ceniza industrial `floor_06_violence_ash_slabs` (reuso temático: ceniza de altavoz quemado).

### 4. Lenguaje
**Paralelogramos y conos.** Altavoces = trapecio; conos de presión = triángulo en suelo. Diagonales agresivas, no ortogonales.

### 5. Paleta
`Metal ennegrecido #210709→#ef4444 + carbón rojo + chispas #f97316 + crema membrana`. Haze rojo 0.12 — agresiva, caliente.

### 6. Iluminación
Luz parpadeante de altavoces (strobe) + chispas al moverse Brama + conos rojos en suelo. Bloom solo en membrana altavoz.

### 7. Ambientación
Altavoces reventados, cables pelados chisporroteando, escenario hundido, chandeliers caídos, carteles "SE RUEGA SILENCIO" ironicamente destrozados.

### 8. Enemigos
**Canónico:** **Altavoz viviente** (estacionario, cono presión, al destruirlo descarga eléctrica área) + bailarines fuego/presión. **Familia:** Sprinter dominante — acosa entre conos.

### 9. Soberano
**Brama, el Santo del Ruido** (`boss_04_pogo`). Carbón rojo, amplificador costillas, garganta cosida cuerdas guitarra, chispas. 3 fases: rugidos conos señalados → pecho conectado a altavoces sala (destruir reduce alcance pero libera descargas) → pierde voz, golpea suelo.

### 10. Interactivos
- **Altavoces:** Destructibles. Cada uno destruido reduce alcance de Brama pero crea zona incendiada temporal.
- **Cables colgando:** Si pasas bajo ellos durante sobrecarga, recibes daño; puedes dispararles para cortarlos y crear ruta.
- **Escenario hundido:** Foso central 24px — no afecta colisión pero visualmente es foco de Brama fase 3.

### 11. Mecánicas
**Distorsión anuncia sobrecarga:** Antes de cada sobrecarga, la pantalla vibra (screen shake 2px) y los altavoces se iluminan 0.35s. Puedes **destruir fuentes** o **usarlas** (conos empujan enemigos a zonas incendiadas). La mecánica enseña a convertir peligro en arma.

### 12. Rutas
**9 nodos / 4 capas / 3 rutas.** Ruta central (escenario) = directa al jefe pero con 2 altavoces activos. Rutas laterales (camerinos) = más largas con 1 altavoz cada una + taller donde cortas cables. **Verticalidad:** Escenario hundido -24px + pasarela técnica +24px (balcón donde observas conos desde arriba).

### 13. Secretos
- **Secreto:** Tras altavoz destruido sin recibir daño descarga → sala con afinador dormido (testimonio).
- **Arma:** **Grito Hueco** (por canonizar) — arma Brama.

### 14. Conexiones
**Previa:** P03 pizarra → portal rojo. **Posterior:** Portal violeta a P05 (silencio repentino). **Narrativa:** Primer testimonio de alguien que intentó advertir (conexión con Tempo).

**Ritmo/Objetivo:** Intenso, ruidoso, con ventanas de calma (entre sobrecargas). Que el jugador aprenda a leer el parpadeo.

---

# PISTA 05 — LA NOTA AUSENTE · OBISPO

### 1. Identidad
Una catedral profanada. Un órgano con una nota que ya no suena. El Obispo creyó que el silencio era fe. Pidió pureza. La torre le dio una nave donde el sonido que falta es el que más duele. La Nota Ausente no es vacío: es **presencia de ausencia**.

### 2. Función
**Engaño por omisión.** Si P04 gritaba, P05 **calla**. La amenaza está en lo que no oyes ni ves a tiempo. Aquí aprendes que la información fiable no es la más ruidosa.

### 3. Arquitectura
**Cruz latina.** Nave central muy alta (muros `wall_panel_heavy_base` 384px), naves laterales bajas, órgano al fondo (muro `wall_ice_glacier` reuso hielo como mármol frío). Diapasones gigantes como arcos ojivales. Vitrales rotos con luz violeta.

### 4. Lenguaje
**Verticales góticas.** Todo empuja hacia arriba. Contraste con P04 horizontal y P02 rectangular. El ojo mira al órgano.

### 5. Paleta
`Obsidiana #150826→#c084fc + oro litúrgico #facc15 + violeta #581c87`. Haze violeta 0.11 — solemne, fría.

### 6. Iluminación
Luz cenital violeta filtrada por vitrales rotos + velas que no se apagan (oro 0.5). Órgano emite haze violeta pulsante al ritmo de nota ausente (cada 4 beats, un vacío).

### 7. Ambientación
Bancos volcados, partituras en blanco, diapasones de 2m clavados en suelo, coro vacío con huecos, órgano con tuberías silenciadas, incensarios apagados.

### 8. Enemigos
**Canónico:** **Afinadores** (delgados, diapasones, patrullan, corrigen disonancia — te detectan como "herida" Desafinado) + coro silenciado. **Familia:** Tirador + Seguridad — patrullan nave lateral.

### 9. Soberano
**Obispo de la Nota Ausente** (`boss_05_oficiante`). Mitra diapasón, casulla órgano, coro ausente. 3 fases: nota ausente como hazard silencioso → diapasones que afinan tu posición → coro que canta sin voz.

### 10. Interactivos
- **Diapasones:** Al golpearlos (disparo), emiten nota que revela notas ausentes ocultas (muestra hazard invisible 2s).
- **Órgano:** Si lo activas tras limpiar afinadores, toca la nota ausente y abre ruta alternativa (2 salas atajo).
- **Vitrales:** Destructibles — rompen luz violeta, crean oscuridad donde afinadores no patrullan.

### 11. Mecánicas
**Silencio como amenaza:** La nota ausente es un ataque que **no suena hasta 0.2s antes del impacto**. Solo indicador es vibración del diapasón en suelo (círculo violeta tenue). La mecánica enseña a **mirar cuando no hay sonido**. Los diapasones afinan: si te quedas quieto, te corrigen (daño); si te mueves, no.

### 12. Rutas
**10 nodos / 5 capas / 2 rutas.** Ruta nave central (6 salas) = directa, con diapasones obligatorios. Ruta naves laterales (4 salas) = oscura, sin órgano pero con afinadores patrulla. **Verticalidad:** Coro elevado +24px (balcón donde ves ataques desde arriba), nave hundida -12px (confesionario secreto).

### 13. Secretos
- **Secreto:** Confesionario tras órgano → sala Archivo con testimonio Obispo + Eco del Pasillo (subjefe §17.1).
- **Arma:** **Diapasón Roto** (por canonizar).

### 14. Conexiones
**Previa:** P04 ruido → portal violeta (silencio). **Posterior:** Portal acero a P06 (puerta). **Narrativa:** Eco del Pasillo explica cómo la torre corrige.

**Ritmo/Objetivo:** Tenso, contemplativo, con sustos. Que el jugador aprenda a desconfiar del silencio.

---

# PISTA 06 — EL UMBRAL ENCADENADO · CORAZÓN ENCADENADO

### 1. Identidad
Alguien vigiló la puerta para que nadie saliera herido. Cerró la puerta. Luego no la abrió. Dijo "detrás de mí estaréis a salvo". Sigue delante de la puerta, cayendo orientado hacia ella. El Umbral es la protección convertida en prisión: una puerta blindada que nunca se abre, un tambor que marca el latido de la cerradura, cadenas que atan al guardián.

### 2. Función
**Cerco.** Si P05 era engaño, P06 es **confrontación frontal**: el espacio te dice "no pasarás" y debes entender cómo hacer que se abra. Enseña ruptura de barreras y gestión de oleadas.

### 3. Arquitectura
**Masa y cierre.** Una gran sala-búnker central (60% nodos) + 2 ante-salas. Puerta blindada al fondo (asset `wall_wrath_furnace` + `wall_panel_heavy_base`) con 4 cadenas radiales ancladas a muros. Tambor central 2m diámetro. Suelo búnker `floor_06_violence_ash_slabs` (reuso ceniza como hormigón). Ninguna curva salvo tambor.

### 4. Lenguaje
**Masa y cierre.** Todo es pesado, cerrado, atornillado. Es la pista más "arquitectónica" — casi sin neón.

### 5. Paleta
`Acero #091813→#4ade80 desaturado + rosa acero #fb7185 + hierro #1a1a18 + gris azulado #94a3b8`. Haze rosa 0.09 — neutra bloqueada, pesada.

### 6. Iluminación
Luz cenital blanca dura (foco sobre tambor) + haze rosa tenue de cadenas tensas. Sin neón pulsante: luz estable, opresiva. Tambor emite pulso luminoso grave cada 4 beats.

### 7. Ambientación
Puerta blindada con mirilla, cadenas con grilletes vacíos, tambor con péndulo roto, sacos de arena, marcas de golpes en puerta, marcas de arrastre hacia puerta (caídos intentando salir).

### 8. Enemigos
**Canónico:** **Guardianes del umbral** (bloquean salidas, se colocan en puertas) + bailarines con escudos mesabarrera. **Familia:** Seguridad + Tanque — bloquean, golpean tambor.

### 9. Soberano
**Corazón Encadenado** (`boss_06_matarife`). Tambor pecho + cadenas a puerta + acero ritual. 3 fases: golpes que cierran rutas → cadenas que tensan (debes romper 2/4 para avanzar) → cae orientado a puerta.

### 10. Interactivos
- **Tambor:** Golpearlo (3 disparos) abre una de las 4 cadenas y desbloquea 1 sala; fallar cierra 1 ruta alternativa.
- **Cadenas:** Destructibles (requieren 8 impactos cada una). Romper las 4 precipita fase 3 Corazón (atajo pero más difícil).
- **Puerta blindada:** No es puerta jugable hasta vencer Corazón; intentarlo antes genera oleada de guardianes.

### 11. Mecánicas
**Golpes que cierran:** El Corazón y sus guardianes golpean el tambor; cada 3 golpes, una salida aleatoria se cierra con cadenas 3s. Debes **posicionarte cerca de salidas que quieres mantener** y usar tambor a favor. La mecánica enseña a leer el espacio como recurso que se cierra.

### 12. Rutas
**8 nodos / 3 capas / 2 rutas (real).** Ante-sala sur (2 salas) → sala-búnker (4 nodos interconectados) → ante-sala norte (1 sala) → jefe. **Verticalidad:** Búnker en dos alturas (+0 y +18px) con pasarela de mantenimiento (ruta alternativa que evita tambor).

### 13. Secretos
- **Secreto:** Tras 4 cadenas rotas sin usar tambor → sala con Archivista (testimonio P06) + recompensa CR masiva.
- **Arma:** **Primer Latido** — cañón-tambor, doble pulso.

### 14. Conexiones
**Previa:** P05 catedral → portal acero. **Posterior:** Portal espejo a P07 (luz se fragmenta). **Narrativa:** Resolución "cae orientado a la puerta" + diálogo Tempo sobre proteger vs encerrar.

**Ritmo/Objetivo:** Pesado, claustrofóbico, con decisiones de apertura/cierre. Que el jugador sienta el peso de la puerta.

---

# PISTA 07 — EL SALÓN DE LAS MIL VOCES · CRUPIER

### 1. Identidad
Alguien prometió a cada invitado lo que quería escuchar. Convenció a todos de pedir una última canción. La torre le dio todos los rostros que fingió tener. El Salón es un casino de espejos donde nada es lo que dice ser: palcos, máscaras, camerinos, copias que aplauden. La verdad está solo en la sombra.

### 2. Función
**Discernimiento.** Si P06 era masa, P07 es **fragmentación**. El jugador debe aprender a identificar la señal fiable entre múltiples falsas. Es la pista que usa el lenguaje para engañar.

### 3. Arquitectura
**Casino espejado en diamante.** Salas en forma de rombo con espejos en cada pared; palcos elevados en cada esquina; camerinos que son salas secretas; fieltro verde casino en mesas. Suelo diagonal `floor_07_envy_travertine` (tallado diagonal es perfecto para espejos). Muros `wall_panel_vip_window` (mirador VIP = palco).

### 4. Lenguaje
**Fragmentación diagonal.** Todo es triangular/romboidal, espejado, repetido. Ninguna ortogonalidad (contraste P03). El ojo no sabe dónde acaba la sala.

### 5. Paleta
`Espejo plata + oro #facc15 + humo #081829 + cian #22d3ee + trampa magenta #ff2d7a`. Haze cian 0.11 — fría espejada, tramposa. Magenta solo en falsas, cian en reales.

### 6. Iluminación
Luces de casino parpadeantes (alternan magenta/cian) + foco único sobre mesa central (donde Crupier baraja). Copias no proyectan sombra — única pista fiable. Haze espejado: el brillo se duplica.

### 7. Ambientación
Espejos que no reflejan al jugador, máscaras en perchas, fichas de póker con símbolos pista 01–06, palcos con público quieto, ruleta detenida en 00, camerinos con maquillaje corrido.

### 8. Enemigos
**Canónico:** **Eco falso** (copia apariencia prota; solo real proyecta sombra) + bailarinas que imitan sonidos de disparo. **Familia:** Mascota (élite) + Bailarina — engañan, copian.

### 9. Soberano
**Crupier de las Mil Voces** (`boss_07_imitador`). Humo, máscaras cambiantes, nunca voz propia. 3 fases: copias (solo real sombra) → anuncios falsos (suelo dice verdad) → imita arma prota (oculta procedencia).

### 10. Interactivos
- **Espejos:** Destructibles de un disparo: al romperlos, revelan sala real detrás (ruta alternativa).
- **Máscaras:** Recoger una máscara te hace inmune a 1 voz falsa (consumible, no se guarda).
- **Mesa central:** Interactuar baraja enemigos (aleatoriza pero revela cuál es real por sombra).

### 11. Mecánicas
**Voces señuelo:** Crupier anuncia ataques falsos por audio/diálogo; solo **suelo** (señales `ddBossFloorCues`) es fiable. Vida/controles/opciones nunca mienten (Biblia §13). La mecánica enseña a **no fiarse de la voz, fiarse del suelo**.

### 12. Rutas
**10 nodos / 5 capas / 3 rutas.** Ruta centro (5 salas, mesa central) = engaño máximo. Rutas laterales (palcos elevados +18px, camerinos -12px) = más seguras pero con espejos que ocultan secretos. **Verticalidad:** Palcos elevados son rutas seguras donde ves copias desde arriba.

### 13. Secretos
- **Secreto:** Camerino tras espejo roto → Archivo con testimonio Crupier + voz desconocida preguntando "¿Esta era la mía?".
- **Arma:** **Palabra Prestada** — micrófono cromado, doble estacionario.

### 14. Conexiones
**Previa:** P06 puerta → portal espejo (fragmentación). **Posterior:** Portal hielo a P08 (espejos se congelan). **Narrativa:** Resolución "¿Esta era la mía?" + diálogo Tempo sobre identidad prestada.

**Ritmo/Objetivo:** Desorientador, juguetón, paranoico. Que el jugador dude de su propia arma (cuando Crupier la imita).

---

# PISTA 08 — EL ANDÉN DE LA AUSENTE · NIX

### 1. Identidad
Dos hermanas prometieron cruzar juntas la salida. Solo una podía cruzar antes del siguiente compás. Nix cruzó. La torre conservó el instante anterior: andén, trenes, velos, la promesa rota. El Andén es el momento exacto antes de la separación, congelado. Todo está listo para partir pero nadie puede irse.

### 2. Función
**Retrospección.** Si P07 te engañaba con lo que ves, P08 te engaña con **lo que hiciste**. La sala recuerda tus disparos y los vuelve contra ti. Es la pista más personal: te enfrenta a tu propio patrón.

### 3. Arquitectura
**Andén recto de 3 vías.** Sala principal 3:1 (andén central 400×1200 + 2 vías laterales rail). Andenes elevados +12px, vías hundidas -8px. Raíles de acero con traviesas, bancos de estación, marquesina hielo negro, velos blancos colgando. Muros `wall_ice_glacier` + suelo `floor_08_ice_abyssal` abisal glaciar.

### 4. Lenguaje
**Líneas de fuga.** Todo lleva al punto de fuga (trenes). El ojo viaja horizontalmente, no en abanico (P01) ni en estrella (P04). Es la pista más "realista" — por eso el dolor es concreto.

### 5. Paleta
`Hielo negro #081526 + velo blanco #e8f0f8 + raíles acero #c0c8d0 + cian tren #38bdf8 + rojo velo #f43f5e`. Haze cian 0.12 — fría desolada, limpia.

### 6. Iluminación
Luz fría de fluorescentes de estación (blanco-azulado) + velo blanco que difumina + trenes espectrales con faro cian que barre andén. Hielo negro refleja cian, no magenta.

### 7. Ambientación
Bancos con maletas abandonadas, relojes de estación parados, velos blancos colgando de marquesina, raíles con escarcha, trenes espectrales detenidos y uno que cruza, altavoces de estación con anuncio inaudible.

### 8. Enemigos
**Canónico:** **Espejo viviente** (repite tu último ataque tras demora; prioriza no disparar a tontas) + ecos contrarios (disparan desde lado opuesto de línea divisoria). **Familia:** Sprinter + Tirador — cruzan vías.

### 9. Soberana
**Nix, la Voz que Faltaba** (`boss_08_traidor` → display Nix). Hielo negro, velo blanco, 8 siluetas huecas. 3 fases: repite tus ataques → línea divisoria (lado contrario dispara) → acumula proyectiles de frase y los devuelve.

### 10. Interactivos
- **Raíles:** Hazard lineal: tren espectral cruza cada 8s en vía señalada (carrera roja en suelo 1s antes). Puedes subir a andén para evitarlo o usar tren para atropellar enemigos.
- **Línea divisoria Nix:** Trazo cian en suelo que divide sala en 2; de un lado estás seguro de ecos del otro. Mueve con fase.
- **Velos:** Dañan si los tocas (corte frío), pero bloquean proyectiles espejo (cover).

### 11. Mecánicas
**Memoria de proyectiles:** Sala recuerda tus últimos 8 disparos y los reproduce con demora desde ecos (§14). Si disparas mucho, te cierras rutas futuras. **Dejar de disparar** no daña a Nix mágicamente: impide que cargue contraataque y abre ventana segura. La mecánica enseña a **controlar tu propia agresividad**.

### 12. Rutas
**9 nodos / 4 capas / 2 rutas.** Ruta andén central (5 salas) = directa con trenes + línea divisoria. Ruta andenes laterales (4 salas) = elevada, sin trenes pero con velos y espejos. **Verticalidad:** Andenes +12px vs vías -8px = desnivel 20px (visible, no bloqueante; trenes solo afectan a vías).

### 13. Secretos
- **Secreto:** Vagón detenido con puerta entreabierta → sala Archivo con testimonio Nix/hermana + novena voz "Lo sé".
- **Arma:** **Venías Detrás** — placas espejo, eco posicional.

### 14. Conexiones
**Previa:** P07 espejos congelados → portal hielo. **Posterior:** Ascensor de fragmentos a P09 (teselas del andén se desprenden). **Narrativa:** Testimonio hermanas + diálogo Tempo sobre cruzar vs quedarse.

**Ritmo/Objetivo:** Melancólico, tenso, reflexivo. Que el jugador sienta que su propio fuego le pesa.

---

# PISTA 09 — EL NÚCLEO · REY DEL COMPÁS

### 1. Identidad
No es una sala. Es el lugar donde la repetición se sostiene. Fragmentos de las 8 pistas flotan o se reconstruyen como memoria incompleta. El centro de la torre parece recordar cómo era toda la fiesta pero no puede reproducirla entera. El suelo es blanco porque ya no queda nada que poner encima.

### 2. Función
**Juicio y síntesis.** El Núcleo no enseña nada nuevo: **te pide que demuestres que aprendiste**. Sin música, solo con anticipaciones visuales. Es el examen final antes del Rey.

### 3. Arquitectura
**Vacío + fragmentos flotantes.** Sala base 1:1 blanca (floor_09_core_cosmic_vein pero desaturado a #e2e8f0) con fragmentos de todas las pistas flotando a distintas alturas (mesa P02, vitrina P03, altavoz P04, diapasón P05, tambor P06, espejo P07, raíl P08). Nada toca el suelo hasta que lo liberas.

### 4. Lenguaje
**Vacío.** Anti-arquitectura: lo que hay es lo que flota. Contraste total con P03 retícula llena. El vacío es la forma.

### 5. Paleta
`Obsidiana cósmica #120924 + tesela espejo #e2e8f0 + blanco vacío + magenta memoria #ff2d7a`. Haze blanco 0.10 — neutra vacía, luminosa pero sin calor.

### 6. Iluminación
Sin acompañamiento (§15): luz blanca difusa uniforme + haze blanco. Cada fragmento emite su propio neón original (magenta P01, ámbar P02 etc.) como memoria. Anticipaciones visuales (suelo) son únicas fuentes de aviso.

### 7. Ambientación
Suelo blanco con grietas, fragmentos flotantes a 20–40px altura, corona orejas zorro suspendida, cadena central, anclajes cristalinos que sostienen repetición.

### 8. Enemigos
**Fragmentos:** Combinan comportamientos de 2 pistas (ej: Sombra abrazadora + Eco falso = sombra que solo la real proyecta; Vitrina + Altavoz = altavoz que refleja). + Anclajes (no atacan, sostienen arena; destruirlos quita 1 capa escenario).

### 9. Soberano
**Rey del Compás** (`boss_09_nucleo`). Bola espejos → cuerpo teselas. 3 fases: Espejo (reproduce ataques jefes anteriores, siluetas anticipan) → Corona (usa rasgo de tus armas, legible) → Última Vuelta (reconstruye salas de run, destruyes anclajes).

### 10. Interactivos
- **Anclajes:** 4 cadenas cristalinas (40px br). Cada una rota quita 1 capa fragmento y acerca a suelo blanco. Son el objetivo de P09, no el Rey directamente.
- **Fragmentos:** Plataformas temporales: puedes subir a fragmento flotante para esquivar, pero caen si te quedas (2s).
- **Corona/cadena finales:** 2 interactivos tras caída Rey: corona y cadena = 3 finales (Compás/Silencio/Contratiempo).

### 11. Mecánicas
**Sin acompañamiento:** Desaparece la canción, permanecen anticipaciones visuales y SFX combate. Debes reconocer patrones **sin contexto musical** (§15). Combinaciones de peligros nunca todas a la vez; legibles por siluetas previas (2 fragmentos muestran siluetas de soberanos antes de mezclar).

### 12. Rutas
**6 nodos / 5 capas / 1 ruta principal.** Núcleo es lineal: 2 salas fragmento (P01–04) → 2 salas anclaje (P05–08) → arena Rey (5 pisos con 3 fases). **Verticalidad:** Fragmentos flotantes como plataformas + caída final a suelo blanco (desnivel 60px narrativo).

### 13. Secretos
- **Secreto:** Fragmento P08 con velos intactos → última sala Archivo con Rey ("No quería que el mañana les quitara lo que tenían") + Tempo ("Y por eso les quitamos todos los mañanas").
- **Arma:** **Punto Final / Silencio** — grieta negra, disuelve proyectiles, interrumpe mecanismos. Lore: "No mata la canción. Le permite terminar".

### 14. Conexiones
**Previa:** P08 ascensor fragmentos. **Posterior:** 3 finales. **Narrativa:** Golpe final deja a Rey de rodillas sin corona; Tempo aparece al otro lado de cadena; elección explícita corona vs cadena.

**Ritmo/Objetivo:** Solemne, claro, conclusivo. Que el jugador sienta que está desmontando la torre pieza a pieza.

---

## APÉNDICE — RITMO GLOBAL Y VALIDACIÓN

**Nº salas por pista (motivado, no impuesto):**

| Pista | Nodos | Por qué ese número |
|---|---|---|
| 01 | 8 | Tutorial: menos salas, más tiempo en cada una |
| 02 | 9 | Horizontalidad necesita pasillos |
| 03 | 10 | Retícula necesita caja fuerte central |
| 04 | 9 | Estrella necesita puntas |
| 05 | 10 | Cruz latina necesita 4 brazos |
| 06 | 8 | Masa: gran sala + 2 ante-salas, no laberinto |
| 07 | 10 | Casino necesita espejos y palcos |
| 08 | 9 | Andén necesita 3 vías |
| 09 | 6 | Lineal fragmentado: menos es más |

**Vacíos señalados (no inventados):** Costes CR/Ecos/Fragmentos, curvas daño/vida, diálogos Tempo completos, música por pista, testimonios exactos, relación exacta plataforma descenso/acceso jugable (§42 PENDIENTES Biblia).

