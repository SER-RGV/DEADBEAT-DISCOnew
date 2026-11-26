# Personajes, atuendos y NPCs

> Incluye el protagonista (diseño maestro), los 22 sprites del diseño anterior (en combate), NPCs del Refugio (DJ, bartender, armera), el dron compañero y los 8 atuendos. **Los sprites del protagonista NO se regeneran sin aprobación explícita del autor (el IDLE 07B está cerrado).**

**Nº de assets en esta categoría:** 31

## characters

### `companion_drone_ally`

- **Nombre:** Personaje · Dron Aliado / Torreta Sónica
- **Ruta:** `assets/characters/companion_drone_ally.png`
- **Tamaño lienzo:** 224×224 px
- **Pivote:** `center`
- **Canal alfa:** True
- **Vistas necesarias:** una o pocas poses según uso en código
- **Referencia:** personaje existente companion_drone_ally
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. Personaje NPC: Personaje · Dron Aliado / Torreta Sónica. Seguir la dirección de NPC de club (bartender, armera, DJ, compañero dron) manteniendo coherencia de trazo y luz con el protagonista.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado
```

---

### `hero_idle_00`

- **Nombre:** Protagonista Cinemático · Pose Estática (Idle)
- **Ruta:** `assets/cinematics/characters/protagonist/hero_idle_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Cinemática de entrada, planos 08 y 10 (DD_CINE usa hero_idle_00 antes que player_idle_00).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: de pie en reposo, perfil mirando a la derecha, brazos relajados, manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `hero_shoot_00`

- **Nombre:** Protagonista Cinemático · Guardia de disparo
- **Ruta:** `assets/cinematics/characters/protagonist/hero_shoot_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Cinemática de entrada, planos 08 y 09 (DD_CINE usa hero_shoot_00 antes que player_shoot_00).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: guardia de disparo con pistola: rodillas algo flexionadas, ambos puños juntos ante el pecho a la altura de la barbilla como empuñando una pistola invisible; manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `hero_walk_00`

- **Nombre:** Protagonista · Caminata cuerpo entero 1/4 (zancada máxima (contacto))
- **Ruta:** `assets/cinematics/characters/protagonist/hero_walk_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Ciclo de caminata de CUERPO ENTERO: Refugio (HUB) y cinemática de entrada (planos 3-7, DD_CINE usa hero_walk_0X antes que player_walk_0X).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha de cuerpo entero con los brazos al costado; fase 1/4 del ciclo: zancada máxima (contacto). Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `hero_walk_01`

- **Nombre:** Protagonista · Caminata cuerpo entero 2/4 (zancada cerrándose (carga de peso))
- **Ruta:** `assets/cinematics/characters/protagonist/hero_walk_01.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Ciclo de caminata de CUERPO ENTERO: Refugio (HUB) y cinemática de entrada (planos 3-7, DD_CINE usa hero_walk_0X antes que player_walk_0X).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha de cuerpo entero con los brazos al costado; fase 2/4 del ciclo: zancada cerrándose (carga de peso). Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `hero_walk_02`

- **Nombre:** Protagonista · Caminata cuerpo entero 3/4 (paso (piernas juntas, rodilla adelantada))
- **Ruta:** `assets/cinematics/characters/protagonist/hero_walk_02.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Ciclo de caminata de CUERPO ENTERO: Refugio (HUB) y cinemática de entrada (planos 3-7, DD_CINE usa hero_walk_0X antes que player_walk_0X).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha de cuerpo entero con los brazos al costado; fase 3/4 del ciclo: paso (piernas juntas, rodilla adelantada). Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `hero_walk_03`

- **Nombre:** Protagonista · Caminata cuerpo entero 4/4 (zancada abriéndose (impulso))
- **Ruta:** `assets/cinematics/characters/protagonist/hero_walk_03.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Ciclo de caminata de CUERPO ENTERO: Refugio (HUB) y cinemática de entrada (planos 3-7, DD_CINE usa hero_walk_0X antes que player_walk_0X).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha de cuerpo entero con los brazos al costado; fase 4/4 del ciclo: zancada abriéndose (impulso). Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `npc_armorer_hub`

- **Nombre:** Personaje · Armera del Refugio HUB
- **Ruta:** `assets/characters/npc_armorer_hub.png`
- **Tamaño lienzo:** 256×320 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** una o pocas poses según uso en código
- **Referencia:** personaje existente npc_armorer_hub
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. Personaje NPC: Personaje · Armera del Refugio HUB. Seguir la dirección de NPC de club (bartender, armera, DJ, compañero dron) manteniendo coherencia de trazo y luz con el protagonista.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado
```

---

### `npc_bartender_hub`

- **Nombre:** Personaje · Camarero Sombrío del Refugio
- **Ruta:** `assets/characters/npc_bartender_hub.png`
- **Tamaño lienzo:** 256×320 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** una o pocas poses según uso en código
- **Referencia:** personaje existente npc_bartender_hub
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. Personaje NPC: Personaje · Camarero Sombrío del Refugio. Seguir la dirección de NPC de club (bartender, armera, DJ, compañero dron) manteniendo coherencia de trazo y luz con el protagonista.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado
```

---

### `npc_dj_booth_world`

- **Nombre:** Personaje · DJ Virgilio en Cabina (Mundo)
- **Ruta:** `assets/characters/npc_dj_booth_world.png`
- **Tamaño lienzo:** 384×320 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** una o pocas poses según uso en código
- **Referencia:** personaje existente npc_dj_booth_world
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. Personaje NPC: Personaje · DJ Virgilio en Cabina (Mundo). Seguir la dirección de NPC de club (bartender, armera, DJ, compañero dron) manteniendo coherencia de trazo y luz con el protagonista.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado
```

---

### `player_aim_down_01`

- **Nombre:** Protagonista · Puntería baja 1 (≈ −30°)
- **Ruta:** `assets/characters/player_aim_down_01.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ −30° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: he aims diagonally DOWNWARD: both arms fully extended together, down and forward at a 45-degree angle below horizontal, both hands clasped together in a two-handed pistol grip (hands EMPTY, no weapon, no gun) out in front of his hips, held well away from the body so that green background is clearly visible between the arms and the legs, head tilted down, eyes looking down along the arms. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_down_02`

- **Nombre:** Protagonista · Puntería baja 2 (≈ −52°)
- **Ruta:** `assets/characters/player_aim_down_02.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ −52° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: he aims steeply DOWN at the floor just ahead of his boots: torso bent slightly forward at the waist, both arms fully extended together pointing down and a little forward (about 70 degrees below horizontal), both hands clasped together in a two-handed pistol grip (hands EMPTY, no weapon, no gun) in front of his knees, held clearly in front of the legs so that a strip of green background is visible between the forearms/hands and the legs; head bowed, looking down at the floor. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_down_02_arms`

- **Nombre:** Protagonista · Antebrazos y puños de la puntería baja 2 (capa sobre el corte de cintura)
- **Ruta:** `assets/characters/player_aim_down_02_arms.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Capa derivada de la MISMA ilustración que player_aim_down_02 (mismo maestro, mismo encaje): sólo las muñecas y puños que quedan por debajo del cinturón. DD_WORLD.drawProtagonist la dibuja encima de las piernas; sin ella el corte de cintura los amputaría.
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: he aims steeply DOWN at the floor just ahead of his boots: torso bent slightly forward at the waist, both arms fully extended together pointing down and a little forward (about 70 degrees below horizontal), both hands clasped together in a two-handed pistol grip (hands EMPTY, no weapon, no gun) in front of his knees, held clearly in front of the legs so that a strip of green background is visible between the forearms/hands and the legs; head bowed, looking down at the floor. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_down_03`

- **Nombre:** Protagonista · Puntería vertical abajo (≈ −88°)
- **Ruta:** `assets/characters/player_aim_down_03.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ −88° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_aim_down45 (maestro R01) como imagen de referencia del generador
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: low-ready stance aiming STRAIGHT DOWN at the floor right in front of his boots: both arms straight down in front of his body with elbows locked, both hands clasped together in a two-handed pistol grip (hands EMPTY, no weapon, no gun) in front of his upper thighs just below the belt buckle, fists pointing at the floor; head bowed, looking straight down. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_down_03_arms`

- **Nombre:** Protagonista · Muñecas y puños de la puntería vertical abajo (capa sobre el corte de cintura)
- **Ruta:** `assets/characters/player_aim_down_03_arms.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Capa derivada de la MISMA ilustración que player_aim_down_03 (mismo maestro, mismo encaje): sólo las muñecas y puños que quedan por debajo del cinturón. DD_WORLD.drawProtagonist la dibuja encima de las piernas; sin ella el corte de cintura los amputaría.
- **Entidad:** protagonista
- **Referencia:** player_aim_down45 (maestro R01) como imagen de referencia del generador
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: low-ready stance aiming STRAIGHT DOWN at the floor right in front of his boots: both arms straight down in front of his body with elbows locked, both hands clasped together in a two-handed pistol grip (hands EMPTY, no weapon, no gun) in front of his upper thighs just below the belt buckle, fists pointing at the floor; head bowed, looking straight down. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_up_01`

- **Nombre:** Protagonista · Puntería alta 1 (≈ +38°)
- **Ruta:** `assets/characters/player_aim_up_01.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ +38° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: he aims diagonally UPWARD: both arms fully extended together, up and forward at a 45-degree angle above horizontal, both hands clasped together in a two-handed pistol grip at the end of the arms (hands EMPTY, no weapon, no gun), fists higher than the top of his head, head tilted back, eyes looking up along the arms. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_up_02`

- **Nombre:** Protagonista · Puntería alta 2 (≈ +57°)
- **Ruta:** `assets/characters/player_aim_up_02.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ +57° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: he aims almost STRAIGHT UP at the ceiling: both arms fully extended together almost vertically (about 80 degrees above horizontal, leaning only slightly forward), both hands clasped together high above his head in a two-handed pistol grip (hands EMPTY, no weapon, no gun), head tilted far back, looking up at his hands. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_aim_up_03`

- **Nombre:** Protagonista · Puntería vertical arriba (≈ +88°)
- **Ruta:** `assets/characters/player_aim_up_03.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería del protagonista para el sector de elevación ≈ +88° (brazos a dos manos, manos vacías: el arma la dibuja el motor sobre anchors.hand). DD_WORLD.resolvePlayerPose lo elige según el ángulo de puntería; sólo se dibuja de la cintura hacia arriba (las piernas son las de player_shoot_00 o las de caminata).
- **Entidad:** protagonista
- **Referencia:** player_shoot_00 (maestro R01) como imagen de referencia del generador; diseño según REF_06_guia_visual_maestra.png#protagonista
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character, same outfit, same tattoos, same proportions, same art style and same side view facing right as the reference image, drawn at the same size and in the same position in the frame (belt and boots in the same place as the reference). Full body, standing upright, torso upright, legs straight and close together. NEW POSE: both arms stretched STRAIGHT UP above his head, perfectly vertical like a diver reaching for the ceiling: upper arms right next to his ears, elbows locked, forearms vertical, both hands clasped together DIRECTLY ABOVE the top of his own head (not in front of him) in a two-handed pistol grip, hands EMPTY, no weapon, no gun; head tilted back, face looking straight up at the ceiling between his arms. Stylized digital comic / graffiti illustration: bold black ink outlines, hand-painted cel shading, magenta rim light on his back, cyan rim light on his front. NOT pixel art. Flat uniform chroma green (#00FF00) background, no ground, no cast shadow, no text, nothing cropped.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_boost_00`

- **Nombre:** Protagonista · Impulso / Dash Sónico
- **Ruta:** `assets/characters/player_boost_00.png`
- **Tamaño lienzo:** 512×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [512, 512]
- **Uso en el juego:** Estado ability (impulso / bomba).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: embestida explosiva hacia la derecha: cuerpo muy inclinado, puño adelantado, pierna trasera extendida, rayos finos cian y magenta en puños y botas. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_death_00`

- **Nombre:** Protagonista · Caído / Derrota
- **Ruta:** `assets/characters/player_death_00.png`
- **Tamaño lienzo:** 640×320 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [640, 320]
- **Uso en el juego:** Estado death (pantalla de derrota).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: derribado, tumbado boca arriba en horizontal, cabeza a la izquierda y botas a la derecha, ojos cerrados. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_fire2`

- **Nombre:** Protagonista · Disparo 2 Manos Rifle
- **Ruta:** `assets/characters/player_fire2.png`
- **Tamaño lienzo:** 384×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [384, 512]
- **Uso en el juego:** Postura de fusil a dos manos: la elige DD_WORLD.resolvePlayerPose para armas largas (regla del puente: apoyo a ≥10 px de la empuñadura) en el sector horizontal de puntería.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: postura de fusil a dos manos: piernas abiertas, brazo delantero extendido como sosteniendo el cañón de un arma larga invisible, mano trasera junto al hombro; manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_firehip`

- **Nombre:** Protagonista · Disparo Cadera Arma Pesada
- **Ruta:** `assets/characters/player_firehip.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de combate para armas pesadas (xt[...]: minigun, LMG, BFG, m60…).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: disparo pesado desde la cadera: piernas muy abiertas, torso echado atrás, puños a la altura de la cintura como sujetando una ametralladora invisible; manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_firehip_arms`

- **Nombre:** Protagonista · Antebrazos y puños de la pose de cadera (capa sobre el corte de cintura)
- **Ruta:** `assets/characters/player_firehip_arms.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Capa derivada de la MISMA ilustración que player_firehip (mismo maestro, mismo encaje): sólo los antebrazos y puños que quedan por debajo del cinturón. DD_WORLD.drawProtagonist la dibuja encima cuando el torso de cadera se combina con las piernas de caminata; sin ella el corte de cintura amputaba ambos puños.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: disparo pesado desde la cadera: piernas muy abiertas, torso echado atrás, puños a la altura de la cintura como sujetando una ametralladora invisible; manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_hurt_00`

- **Nombre:** Protagonista · Impacto / Daño
- **Ruta:** `assets/characters/player_hurt_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Estados hurt / stun.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: recibiendo un golpe: cabeza y hombros hacia atrás, antebrazo alzado cubriendo la cara, rodillas cediendo, mueca de dolor. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_idle_00`

- **Nombre:** Protagonista · Pose Idle Respiración
- **Ruta:** `assets/characters/player_idle_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Reposo SIN arma: Refugio (DD_HUB) y pose base de las cinemáticas. En sala, con el arma a la vista, el reposo usa la familia de puntería (DD_WORLD.resolvePlayerPose).
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: de pie en reposo, perfil mirando a la derecha, brazos relajados, manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_roll_00`

- **Nombre:** Protagonista · Esquiva Acrobática
- **Ruta:** `assets/characters/player_roll_00.png`
- **Tamaño lienzo:** 384×384 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [384, 384]
- **Uso en el juego:** Estado dodge (voltereta); el renderizador lo hace girar alrededor del centro del lienzo.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: voltereta de esquiva: cuerpo recogido en bola, rodillas al pecho, brazos abrazando las espinillas. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_shoot_00`

- **Nombre:** Protagonista · Disparo 1 Mano
- **Ruta:** `assets/characters/player_shoot_00.png`
- **Tamaño lienzo:** 288×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [288, 512]
- **Uso en el juego:** Torso de puntería HORIZONTAL (sector −15°…+19°) para armas cortas, y PIERNAS en parado de toda la familia de puntería. El arma la dibuja el motor sobre anchors.hand.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: guardia de disparo con pistola: rodillas algo flexionadas, ambos puños juntos ante el pecho a la altura de la barbilla como empuñando una pistola invisible; manos vacías. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_walk_00`

- **Nombre:** Protagonista · Piernas de caminata en guardia 1/4 (zancada máxima)
- **Ruta:** `assets/characters/player_walk_00.png`
- **Tamaño lienzo:** 336×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 512]
- **Uso en el juego:** Fuente de PIERNAS del corte de cintura en combate: sólo se dibuja de SU cinturón hacia abajo, bajo el torso de puntería, cadera o daño. Los brazos van alzados para que ninguna mano cuelgue por debajo del cinturón.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha con el torso en guardia de disparo (ambos puños alzados ante el pecho, sin arma); fase 1/4 del ciclo: zancada máxima. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_walk_01`

- **Nombre:** Protagonista · Piernas de caminata en guardia 2/4 (zancada cerrándose)
- **Ruta:** `assets/characters/player_walk_01.png`
- **Tamaño lienzo:** 336×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 512]
- **Uso en el juego:** Fuente de PIERNAS del corte de cintura en combate: sólo se dibuja de SU cinturón hacia abajo, bajo el torso de puntería, cadera o daño. Los brazos van alzados para que ninguna mano cuelgue por debajo del cinturón.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha con el torso en guardia de disparo (ambos puños alzados ante el pecho, sin arma); fase 2/4 del ciclo: zancada cerrándose. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_walk_02`

- **Nombre:** Protagonista · Piernas de caminata en guardia 3/4 (paso, pierna adelantando)
- **Ruta:** `assets/characters/player_walk_02.png`
- **Tamaño lienzo:** 336×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 512]
- **Uso en el juego:** Fuente de PIERNAS del corte de cintura en combate: sólo se dibuja de SU cinturón hacia abajo, bajo el torso de puntería, cadera o daño. Los brazos van alzados para que ninguna mano cuelgue por debajo del cinturón.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha con el torso en guardia de disparo (ambos puños alzados ante el pecho, sin arma); fase 3/4 del ciclo: paso — pierna de apoyo recta bajo la cadera, la otra adelanta con la rodilla apenas flexionada y la bota a pocos centímetros del suelo; SIN rodilla alta. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `player_walk_03`

- **Nombre:** Protagonista · Piernas de caminata en guardia 4/4 (zancada abriéndose)
- **Ruta:** `assets/characters/player_walk_03.png`
- **Tamaño lienzo:** 336×512 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 512]
- **Uso en el juego:** Fuente de PIERNAS del corte de cintura en combate: sólo se dibuja de SU cinturón hacia abajo, bajo el torso de puntería, cadera o daño. Los brazos van alzados para que ninguna mano cuelgue por debajo del cinturón.
- **Entidad:** protagonista
- **Referencia:** REF_06_guia_visual_maestra.png#protagonista + REF_01_neon_fox_disco_muerto.png (diseño); player_idle_00 como hoja de modelo del resto de poses
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Protagonista (el Desafinado): joven delgado, pelo negro de punta, chaleco de cuero negro sin mangas con cuello alto y tachuelas rojas, camiseta de tirantes hueso, ambos brazos tatuados, muñequeras de pinchos, cinturón de tachuelas, vaqueros negros con cadena, botas militares. POSE: caminando hacia la derecha con el torso en guardia de disparo (ambos puños alzados ante el pecho, sin arma); fase 4/4 del ciclo: zancada abriéndose. Ilustración digital estilizada tipo cómic/graffiti: contorno de tinta negra, sombreado cel pintado a mano, luz de contorno magenta (espalda) y cian (frente). NO pixel art. Fondo croma verde liso; sin suelo, sin sombra, sin texto.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---
