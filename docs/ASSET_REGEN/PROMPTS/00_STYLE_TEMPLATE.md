# 00 · PLANTILLAS DE ESTILO Y BLOQUES REUTILIZABLES

> Este archivo define los bloques de prompt que se comparten por categoría y círculo.
> Cada ficha de asset en `01_personajes.md…12_cinematicas.md` rellena los campos específicos y concatena estos bloques en el orden indicado.
> **Idioma:** los prompts se escriben en español; se dirigen a un generador de imágenes que entiende instrucciones en español.
> **Versión del contrato:** 1.0 (2026-11-26) — derivada de ART_BIBLE.md y docs/TOTAL_ART_REBUILD/03_ASSET_CONTRACT.md.

---

## 1. Bloques universales

### B0 · Encabezado de proyecto (obligatorio en todos los prompts)

```
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art.
```

### B1 · Línea y volumen

```
Contorno de tinta negra nítido y cerrado (el borde exterior es la línea más oscura del dibujo). Sombreado cel con 2–3 tonos por material (base, sombra, reflejo), sin degradados suaves infinitos.
```

### B2 · Iluminación (luz NW)

```
Iluminación principal desde el noroeste (arriba-izquierda del artista). Rim light magenta (#ff2d95) al lado derecho/espalda y rim light cian (#38bdf8) al lado izquierdo/frente cuando aporten lectura.
```

### B3 · Sombra y fondo (croma)

```
Fondo verde croma liso y uniforme (#00ff00). Sin suelo dibujado, sin sombra de contacto (la sombra la pinta el motor), sin luz ambiental de suelo. Esquinas transparentes (canal alfa) en sprites que lo requieran.
```

### B4 · Prohibiciones absolutas (negative prompt)

```
SIN texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano ni ruido. SIN sombras horneadas, halos blancos, restos de verde croma en bordes. SIN blanco puro ni verde brillante fuera de los emisores. SIN varios personajes, sin patrón múltiple, sin collage de vistas. SIN marcas de agua ni firmas.
```

### B5 · Estilo suelos (tileables)

```
Perspectiva ortográfica cenital 2.5D, diamante de suelo 2:1. Tile de 512×512 px repetible en dos ejes (seamless), opaco (sin alfa). Sin viñeta, sin objetos, sin bordes, sin escalera ni marco. Juntas/discontinuidades naturales del material.
```

### B6 · Estilo muros/paneles

```
Perspectiva isométrica ortográfica 2.5D. Muro modular de 256×384 px (paneles) o 192×384 px (pilares). Baseline inferior = línea de suelo del sprite (el motor sitúa la base sobre el suelo). RGBA con borde exterior limpio. Misma familia de cornisa, zócalo y contorno para todos los paneles del mismo círculo.
```

### B7 · Estilo props/muebles

```
Perspectiva isométrica 2.5D, pivote bottom-center. Silueta reconocible antes del detalle. Sombra de contacto NO pintada (la pinta el motor). El ancho a escala de juego debe leerse en ~1–2,5× el diámetro de apoyo (ver pivote y `br` del código). Sin marco ni sombra proyectada larga.
```

### B8 · Estilo personajes/enemigos/jefes

```
Figura completa de pie (o pose indicada), de perfil mirando a la derecha. Pivote bottom-center, pies en el ~90 % de la altura del PNG (≈ 8–10 % de margen bajo los pies para que el motor apoye correctamente). Silueta con contorno más oscuro que cualquier línea interior. Halo de separación silueta clara en espalda cuando se necesite lectura sobre suelos oscuros (se pinta en código; NO dibujar halo en el sprite).
```

### B9 · Estilo proyectiles/efectos

```
Sprite RGBA centrado, borde aditivo/fundido donde proceda (destello, humo). Efectos breves, sin saturar la pantalla. NO deben tapar sprites de amenazas. El proyectil enemigo (Ia) y el del jugador (wa) deben distinguirse por color/temperatura a primera vista.
```

### B10 · Estilo UI/iconos

```
Diseño sobre chasis oscuro #0a0c12. Trazo nítido ≥ 2 px a tamaño final (44/64/128 px). Sin texto incrustado cuando el texto lo pinta la UI. Pivote center. Iconos con silueta limpia; chasis con opcional brillo neón en identidad del juego (magenta/oro/cian según tipo).
```

### B11 · Estilo cinemáticas (key art)

```
Composición cinematográfica 16:9 (2560×1440 para fondos maestros, 1920×1080 para capas de paralaje). Capas de paralaje con canal alfa donde corresponda. Iluminación de club: columna de luz desde el escenario, neones como emisores, humo/volumen sin bloquear al protagonista. Las capas de paralaje se entregan como PNG independientes; el master composite no sustituye a las capas.
```

---

## 2. Paleta por círculo

Estas son las identidades cromáticas vinculantes (ver `ART_AUDIT/circle_themes.json` y `CIRCLE_CONFIG`).
En cada prompt de asset de entorno/prop/enemigo/jefe de un círculo concreto se inserta el bloque `CÍRCULO <N>`.

| Círculo (HUD) | idx motor | bg | mid | hi | neón | acento | Bloque Círculo |
|---|---|---|---|---|---|---|---|
| Refugio (HUB) | 0 | `#0e1525` | `#1e293b` | `#475569` | `#38bdf8` (cian) | `#facc15` (oro) | `CÍRCULO 0 · REFUGIO` |
| CÍRCULO II · LUJURIA | 1 | `#1b0826` | `#3b0f4c` | `#86198f` | `#ff2d95` (magenta) | `#c084fc` (violeta) | `CÍRCULO I · LUJURIA` |
| CÍRCULO III · GULA | 2 | `#210e09` | `#431a0e` | `#9a3412` | `#f97316` (naranja) | `#facc15` (amarillo) | `CÍRCULO II · GULA` |
| CÍRCULO IV · AVARICIA | 3 | `#171206` | `#36280a` | `#854d0e` | `#facc15` (oro) | `#fef08a` (oro claro) | `CÍRCULO III · AVARICIA` |
| CÍRCULO V · IRA | 4 | `#210709` | `#450a0a` | `#991b1b` | `#ef4444` (rojo) | `#fb923c` (naranja) | `CÍRCULO IV · IRA` |
| CÍRCULO VI · HEREJÍA | 5 | `#150826` | `#2e1065` | `#6b21a8` | `#a855f7` (violeta) | `#c084fc` (lila) | `CÍRCULO V · HEREJÍA` |
| CÍRCULO VII · VIOLENCIA | 6 | `#091813` | `#102a1e` | `#166534` | `#4ade80` (verde tóxico) | `#86efac` | `CÍRCULO VI · VIOLENCIA` |
| CÍRCULO VIII · FRAUDE | 7 | `#081829` | `#0c2438` | `#155e75` | `#22d3ee` (cian) | `#ff2d7a` (magenta) | `CÍRCULO VII · FRAUDE` |
| CÍRCULO IX · TRAICIÓN | 8 | `#081526` | `#0f1f3a` | `#1e3a5f` | `#7dd3fc` (hielo) | `#f43f5e` (rojo frío) | `CÍRCULO VIII · TRAICIÓN` |
| NÚCLEO | 9 | `#120924` | `#241234` | `#3b2a4f` | `#e2e8f0` (blanco platino) | `#ff2d7a` (magenta) | `CÍRCULO IX · NÚCLEO` |

### Bloque de círculo (plantilla)

```
CÍRCULO <N> · <NOMBRE>. Paleta dominante: fondo <bg>, superficie <mid>, alto <hi>, neón <neón>, acento <acento>. Saturación del entorno baja; neón ≤ ~15 % de la superficie; materiales característicos: <materiales>.
```

Materiales por círculo (para insertar en el bloque):

| Círculo | Materiales característicos |
|---|---|
| Refugio | damero negro/blanco, moqueta VIP carmesí, nichos góticos de obsidiana, altavoces, barra de ébano, neón cian y magenta |
| Lujuria (I) | terciopelo magenta, columnas neón corona, espejos venecianos, cadena dorada, pista de baile reflectante, cristal ahumado |
| Gula (II) | terracota carmesí, mármol veteado banquetas, manteles burdeos, loza dorada, cristal oscuro (no verde), ganchos de carne, hierro forjado naranja |
| Avaricia (III) | pizarra negra con vetas de oro, bronce pulido, bóveda de acero, monedas, mármol financiero, mármol travertino dorado, luz cálida de candelabros |
| Ira (IV) | piedra burdeos quebrada, forja, metal industrial al rojo, óxido, rejas, respiraderos de vapor, lava en las juntas |
| Herejía (V) | obsidiana gótica con filo dorado, vidrieras de violeta, altares, cirios, reclinatorios, libros antiguos, arcos apuntados |
| Violencia (VI) | losas de ceniza industrial, planchas de acero remachado, tanques tóxicos verde, óxido, maquinaria pesada, tanques de éxtasis/químicos, verjas de seguridad |
| Fraude (VII) | travertino azul/turquesa tallado en diagonal, espejos diamante, cartas, fichas de casino, croupier, dados, trampas, vidrio azul, mesas de juego |
| Traición (VIII) | piedra abisal glaciar, hielo negro azulado, cadenas, cuchillas, espejo negro, luz fría, hielo resquebrajado, cúpula agrietada |
| Núcleo (IX) | obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito, arquitectura no euclidiana, brillo metálico |

---

## 3. Bloques de personaje (protagonista)

### P0 · Descripción canónica del protagonista (Diseño Maestro Aprobado)

```
Protagonista (el Desafinado): joven delgado, pelo negro de punta recogido en una coleta deshecha, tatuaje de lobo en el hombro izquierdo, estrella en círculo en el hombro derecho, partitura incompleta en el antebrazo; chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes en tono hueso, muñequeras de pinchos, cinturón de tachuelas, cadena colgando de los vaqueros negros, botas militares.
```

> ⚠ El diseño canónico es la lámina `assets/cinematics/restart/character_master/protagonist_master_approved.png`.
> Los sprites `player_*` del diseño anterior NO se usan como referencia visual al regenerar.

### PF · Personaje femenino (DJ, armera, bartender, NPCs)

```
Mujer con silueta y ropa de club infernal (especificar por NPC), mismo tratamiento de línea/luz que el protagonista. Cabello y maquillaje coherentes con el rol (DJ = pelo eléctrico, auriculares; armera = delantal y guantes de cuero; bartender = chaleco de camarero y pajarita).
```

---

## 4. Bloques de enemigos por familia

| Familia (motor) | Clave visual (insertar en prompt) | Paleta dominante |
|---|---|---|
| `security` (guardián) | Figura de seguridad del club, portero gorila, gafas oscuras, auriculares, porra eléctrica, uniforme negro con reflectantes neón | Negro, cian/rojo de alerta |
| `dancer` | Bailarina/o espectral del círculo correspondiente, movimiento fluido, vestimenta del círculo, halos de neón | Magenta/violeta |
| `fanatic` (sprinter) | Fanático enloquecido, camiseta desgarrada del club, rostro desencajado, poses de carga | Rojo/naranja |
| `chef` (tank) | Chef infernal corpulento, delantal manchado, gorro de cocinero deformado, utensilios de carnicero, delantal de cuero | Terracota/carmesí |
| `drone` (speaker) | Dron altavoz flotante, rejilla de altavoz como cara, cables, luces led, levitación | Cian/morado |
| `elite` | Figura del tipo base pero con emblema de ÉLITE (corona/cresta), armadura más pesada, paleta más fría/oscura, efectos de energía | Fría/magenta |

---

## 5. Bloques de jefes por residente

Los 11 jefes ya tienen direcciones visuales definidas. El bloque J-ID se inserta cuando se regenera un jefe de ese círculo.

| ID asset | Resident (motor HUD) | Bloque visual |
|---|---|---|
| `boss_00_anden` | DJ DOOM (Limbo) | DJ esquelético en andén de metro, auriculares vinilo, asta de controlador, gabán negro, neón cian de limbo |
| `boss_01_magneta` | MAGNETA (Lujuria) | Reina/dominatriz magenta con látigo de cuentas de neón, corona de cables, halo de altavoces, magenta y violeta |
| `boss_02_bufe` | BUFE (Gula) | Entidad voraz masiva con boca en el vientre, delantal, cubiertos gigantes, terracota/naranja/amarillo |
| `boss_03_cajero` | CAJERO (Avaricia) | Banquero/cajero dorado con máscara de contador, fichas de casino como dientes, capa de monedas, oro/negro |
| `boss_04_pogo` | POGO (Ira) | Figura sobre pogo de altavoz rebotando, puño en alto, tachuelas y cuero, rojo burdeos |
| `boss_05_oficiante` | OFICIANTE (Herejía) | Obispo hereje con mitra de neón violeta, báculo-cruz de discoteca, capa pluvial gótica, violeta/morado |
| `boss_06_matarife` | MATARIFE (Violencia) | Carnicero industrial gigante con sierra de discos y delantal de cuero verde tóxico, verde/óxido |
| `boss_07_imitador` | IMITADOR (Fraude) | Crupier enmascarado con múltiples rostros/naipes, cartas flotantes, traje esmoquin azul cian, magenta como trampa |
| `boss_08_traidor` | TRAIDOR (Traición) | Caballero de hielo negro con espada doble, corona de escarcha rota, azul glacial y magenta |
| `boss_09_nucleo` | NÚCLEO | Esfera ocular cósmica fracturada, órbitas de luz blanca/platino, extremidades mecánicas, blanco/magenta |
| `boss_10_arquitecto` | ARQUITECTO (secreto) | Mimo blanco con casco de obra y planos flotantes, o Mr. Blanks del collage, monocromo negro/blanco |

---

## 6. Ensamblaje de un prompt completo

Un prompt positivo se ensambla en este orden:

```
[B0] [B1] [B2] [bloque de categoría: B5/B6/B7/B8/B9/B10/B11]
[BLOQUE DE CÍRCULO si aplica]
[Descripción ESPECÍFICA del asset: material, silueta, detalle]
[POSE / VISTA / ESTADO]
[B3]
```

El prompt negativo es siempre B4, más las restricciones específicas del estado (ej. para `_death`: sin estar de pie, cuerpo colapsando).

---

## 7. Reglas de entrega por familia (recordatorio del contrato)

| Familia | Tamaño lienzo | Pivote | Alfa | Tileable |
|---|---|---|---|---|
| floor_* | 512×512 | top-left | NO | SÍ |
| wall_panel_* | 256×384 | bottom-center | SÍ | NO (modular) |
| wall_pillar_* | 192×384 | bottom-center | SÍ | NO |
| environments (puertas/pad) | 256–512 | bottom-center | SÍ | NO |
| prop_* | 128–384 (ancho) | bottom-center | SÍ | NO |
| enemy_*_walk | 256×256 (estándar) | bottom-center | SÍ | NO |
| enemy_*_windup/attack/death | 256–384 | bottom-center | SÍ | NO |
| boss_*_idle | 384–512 | bottom-center | SÍ | NO |
| boss_*_attack/hit/death | 384–512 | bottom-center | SÍ | NO |
| weapon_* | 320×160 | center | SÍ | NO |
| proj_* / vfx_* | 128–256 | center | SÍ (aditivo) | NO |
| pickup_* / relic_* | 64–128 | center | SÍ | NO |
| hud/ui_* | 44/64/128/256/1280×720 | center/top-left | SÍ/SI/NO (backdrop) | NO |
| logos | 512–1024 | center | SÍ | NO |
| cine_bg*_master | 2560×1440 | top-left | NO | NO |
| cine_bg*_capas | 1920×1080 | top-left | SÍ | NO |
| hero/player_* (cuerpo) | 288×512 | bottom-center | SÍ | NO |
