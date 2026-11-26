# Jefes

> 11 jefes × 4 estados (idle/attack/hit/death), más el jefe secreto Arquitecto (solo idle/attack). Los jefes ya fueron regenerados en TR_W7–W12; las fichas recogen sus prompts para repetibilidad.

**Nº de assets en esta categoría:** 42

## bosses

### `boss_00_anden_attack`

- **Nombre:** ANDÉN · El Portero (Limbo) · ataque
- **Ruta:** `assets/bosses/boss_00_anden_attack.png`
- **Tamaño lienzo:** 464×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [464, 576]
- **Uso en el juego:** Jefe `boss_00_anden`, fotograma de ataque: se muestra mientras el motor avisa o ejecuta un patrón (`pattern71`), durante el barrido (`phase` = sweep) y 0,28 s al cambiar de fase (`_ddaAttackT`). No se usa para la fase berserk entera (duraría todo el último tercio del combate).
- **Entidad:** ANDÉN · EL PORTERO (I Limbo)
- **Referencia:** dd_work/raw/R03_JEFES/_refs/ref_00_anden_wide.png: el `idle` del mismo jefe centrado sobre un lienzo de croma un 30–40 % más ancho, para que quepan los brazos extendidos
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
attack_prompt con <pose> = he thrusts the white-gloved hand that held the counter straight forward toward the RIGHT side of the image, arm fully extended at shoulder height, palm open and fingers up in a firm STOP gesture. His other hand slams the brass stanchion post down on the ground beside him, and the red velvet rope whips forward. Shoulders squared, the skirts of the greatcoat flaring behind him.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_00_anden_death`

- **Nombre:** ANDÉN · El Portero (Limbo) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_00_anden_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 0 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO REFUGIO. Paleta: fondo #0e1525, superficie #1e293b, alto #475569, neón #38bdf8 (#facc15 acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: damero negro/blanco clásico de club, moqueta terciopelo carmesí VIP, nichos góticos de obsidiana, neón cian y magenta, oro como acento. JEFE 'DJ DOOM / Andén (Limbo)': DJ esquelético en andén, gabán negro, auriculares de vinilo, asta de controlador, neón cian. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_00_anden_hit`

- **Nombre:** ANDÉN · El Portero (Limbo) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_00_anden_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 0 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO REFUGIO. Paleta: fondo #0e1525, superficie #1e293b, alto #475569, neón #38bdf8 (#facc15 acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: damero negro/blanco clásico de club, moqueta terciopelo carmesí VIP, nichos góticos de obsidiana, neón cian y magenta, oro como acento. JEFE 'DJ DOOM / Andén (Limbo)': DJ esquelético en andén, gabán negro, auriculares de vinilo, asta de controlador, neón cian. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_00_anden_idle`

- **Nombre:** ANDÉN · El Portero (Limbo) · reposo
- **Ruta:** `assets/bosses/boss_00_anden_idle.png`
- **Tamaño lienzo:** 304×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [304, 576]
- **Uso en el juego:** Jefe `boss_00_anden`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** ANDÉN · EL PORTERO (I Limbo)
- **Referencia:** ninguna (sólo referencia de estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_01_magneta_attack`

- **Nombre:** MAGNETA · La Anfitriona (Lujuria) · ataque
- **Ruta:** `assets/bosses/boss_01_magneta_attack.png`
- **Tamaño lienzo:** 352×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [496, 576]
- **Uso en el juego:** Jefe `boss_01_magneta`, fotograma de ataque: se muestra mientras el motor avisa o ejecuta un patrón (`pattern71`), durante el barrido (`phase` = sweep) y 0,28 s al cambiar de fase (`_ddaAttackT`). No se usa para la fase berserk entera (duraría todo el último tercio del combate).
- **Entidad:** MAGNETA · LA ANFITRIONA (II Lujuria)
- **Referencia:** dd_work/raw/R03_JEFES/_refs/ref_01_magneta_wide.png: el `idle` del mismo jefe centrado sobre un lienzo de croma un 30–40 % más ancho, para que quepan los brazos extendidos
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
attack_prompt con <pose> = she thrusts both arms straight forward toward the RIGHT side of the image, palms open and fingers spread, as if pulling someone toward her with invisible strings. Her long hair and her skirt blow backward to the left. Chin lowered, intense stare. The pink ring stays behind her head.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_01_magneta_death`

- **Nombre:** MAGNETA · La Anfitriona (I Lujuria) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_01_magneta_death.png`
- **Tamaño lienzo:** 448×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 1 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO LUJURIA. Paleta: fondo #1b0826, superficie #3b0f4c, alto #86198f, neón #ff2d95 (#c084fc acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: terciopelo magenta, columnas neón corona, espejos venecianos, cadena dorada, pista de baile reflectante, cristal ahumado oscuro. JEFE 'MAGNETA (Lujuria)': reina/dominatriz magenta con látigo de cuentas de neón y corona de cables, halo de altavoces. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_01_magneta_hit`

- **Nombre:** MAGNETA · La Anfitriona (I Lujuria) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_01_magneta_hit.png`
- **Tamaño lienzo:** 352×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 1 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO LUJURIA. Paleta: fondo #1b0826, superficie #3b0f4c, alto #86198f, neón #ff2d95 (#c084fc acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: terciopelo magenta, columnas neón corona, espejos venecianos, cadena dorada, pista de baile reflectante, cristal ahumado oscuro. JEFE 'MAGNETA (Lujuria)': reina/dominatriz magenta con látigo de cuentas de neón y corona de cables, halo de altavoces. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_01_magneta_idle`

- **Nombre:** MAGNETA · La Anfitriona (Lujuria) · reposo
- **Ruta:** `assets/bosses/boss_01_magneta_idle.png`
- **Tamaño lienzo:** 352×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [352, 576]
- **Uso en el juego:** Jefe `boss_01_magneta`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** MAGNETA · LA ANFITRIONA (II Lujuria)
- **Referencia:** REF_03 · I Lujuria
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_02_bufe_attack`

- **Nombre:** BUFÉ · El Anfitrión Sin Fondo (Gula) · ataque
- **Ruta:** `assets/bosses/boss_02_bufe_attack.png`
- **Tamaño lienzo:** 592×528 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [592, 528]
- **Uso en el juego:** Jefe `boss_02_bufe`, fotograma de ataque: se muestra mientras el motor avisa o ejecuta un patrón (`pattern71`), durante el barrido (`phase` = sweep) y 0,28 s al cambiar de fase (`_ddaAttackT`). No se usa para la fase berserk entera (duraría todo el último tercio del combate).
- **Entidad:** BUFÉ · EL ANFITRIÓN SIN FONDO (III Gula)
- **Referencia:** dd_work/raw/R03_JEFES/_refs/ref_02_bufe_wide.png: el `idle` del mismo jefe centrado sobre un lienzo de croma un 30–40 % más ancho, para que quepan los brazos extendidos
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
attack_prompt con <pose> = he swings one iron ladle forward in a wide strike toward the RIGHT side of the image, arm fully extended at chest height, while the other ladle is raised back over his shoulder, ready for the next blow. The round oven door in his belly is flung open and the fire inside burns high: solid stylised flames with ink outlines, kept inside the oven opening. Mouth wide open, laughing.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_02_bufe_death`

- **Nombre:** BUFÉ · El Anfitrión Sin Fondo (II Gula) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_02_bufe_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 2 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO GULA. Paleta: fondo #210e09, superficie #431a0e, alto #9a3412, neón #f97316 (#facc15 acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: terracota carmesí, mármol veteado, manteles burdeos, loza dorada, ganchos de carne, hierro forjado naranja. JEFE 'BUFE (Gula)': entidad voraz con boca en el vientre, delantal y cubiertos gigantes. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_02_bufe_hit`

- **Nombre:** BUFÉ · El Anfitrión Sin Fondo (II Gula) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_02_bufe_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 2 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO GULA. Paleta: fondo #210e09, superficie #431a0e, alto #9a3412, neón #f97316 (#facc15 acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: terracota carmesí, mármol veteado, manteles burdeos, loza dorada, ganchos de carne, hierro forjado naranja. JEFE 'BUFE (Gula)': entidad voraz con boca en el vientre, delantal y cubiertos gigantes. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_02_bufe_idle`

- **Nombre:** BUFÉ · El Anfitrión Sin Fondo (Gula) · reposo
- **Ruta:** `assets/bosses/boss_02_bufe_idle.png`
- **Tamaño lienzo:** 464×528 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [464, 528]
- **Uso en el juego:** Jefe `boss_02_bufe`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** BUFÉ · EL ANFITRIÓN SIN FONDO (III Gula)
- **Referencia:** REF_03 · II Gula
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_03_cajero_attack`

- **Nombre:** EL CAJERO · Señor del VIP (III Avaricia) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_03_cajero_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 3 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO AVARICIA. Paleta: fondo #171206, superficie #36280a, alto #854d0e, neón #facc15 (#fef08a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: pizarra negra con vetas de oro, bronce pulido, bóveda de acero, monedas doradas, mármol financiero, luz cálida. JEFE 'CAJERO (Avaricia)': cajero/banquero dorado con máscara, capa de monedas. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_03_cajero_death`

- **Nombre:** EL CAJERO · Señor del VIP (III Avaricia) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_03_cajero_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 3 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO AVARICIA. Paleta: fondo #171206, superficie #36280a, alto #854d0e, neón #facc15 (#fef08a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: pizarra negra con vetas de oro, bronce pulido, bóveda de acero, monedas doradas, mármol financiero, luz cálida. JEFE 'CAJERO (Avaricia)': cajero/banquero dorado con máscara, capa de monedas. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_03_cajero_hit`

- **Nombre:** EL CAJERO · Señor del VIP (III Avaricia) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_03_cajero_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 3 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO AVARICIA. Paleta: fondo #171206, superficie #36280a, alto #854d0e, neón #facc15 (#fef08a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: pizarra negra con vetas de oro, bronce pulido, bóveda de acero, monedas doradas, mármol financiero, luz cálida. JEFE 'CAJERO (Avaricia)': cajero/banquero dorado con máscara, capa de monedas. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_03_cajero_idle`

- **Nombre:** EL CAJERO · Señor del VIP (Avaricia) · reposo
- **Ruta:** `assets/bosses/boss_03_cajero_idle.png`
- **Tamaño lienzo:** 304×560 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [304, 560]
- **Uso en el juego:** Jefe `boss_03_cajero`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL CAJERO · EL QUE COBRA LA ENTRADA (IV Avaricia)
- **Referencia:** _refs/ref_03_cajero_4x5.png (2.º intento reencuadrado a 4:5) + boss_00_anden_idle.png (pose de pie y estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Create a new video game boss character sprite. IMAGE 1 is the character design reference. Redraw THIS exact character with the same costume, colours and attributes […]. Give the character a completely NEW pose; do not copy the walking pose of image 1. IMAGE 2 is the POSE and style reference. Copy its stance: standing still, perfectly upright, both legs straight and close together, both feet planted side by side on the ground, whole figure visible. Copy also its drawing style. Do NOT copy the character or clothes of image 2. POSE, IDLE: standing still like a statue, haughty, legs straight and together. One key-fingered hand is extended forward at waist height, palm up, demanding payment. The other hand holds up a single golden coin between two fingers at shoulder height. + prompt_tail_v2
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_04_pogo_attack`

- **Nombre:** EL POGO · Demonio de la Fosa (Ira) · ataque
- **Ruta:** `assets/bosses/boss_04_pogo_attack.png`
- **Tamaño lienzo:** 576×544 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [576, 544]
- **Uso en el juego:** Jefe `boss_04_pogo`, fotograma de ataque: se muestra mientras el motor avisa o ejecuta un patrón (`pattern71`), durante el barrido (`phase` = sweep) y 0,28 s al cambiar de fase (`_ddaAttackT`). No se usa para la fase berserk entera (duraría todo el último tercio del combate).
- **Entidad:** EL POGO · EL QUE ABRE LA PISTA (V Ira)
- **Referencia:** dd_work/raw/R03_JEFES/_refs/ref_04_pogo_wide.png: el `idle` del mismo jefe centrado sobre un lienzo de croma un 30–40 % más ancho, para que quepan los brazos extendidos
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
attack_prompt con <pose> = he roars with his head pushed forward and his mouth wide open, both clawed arms flung wide open to the sides at shoulder height, chest thrust out, the speaker cone of the amplifier in his ribcage bulging outward. Legs wide apart as in the reference.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_04_pogo_death`

- **Nombre:** EL POGO · Demonio de la Fosa (IV Ira) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_04_pogo_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 4 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO IRA. Paleta: fondo #210709, superficie #450a0a, alto #991b1b, neón #ef4444 (#fb923c acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: piedra burdeos quebrada, forja roja, metal industrial al rojo, óxido, rejas, respiraderos. JEFE 'POGO (Ira)': figura sobre pogo de altavoz rebotando, puño en alto. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_04_pogo_hit`

- **Nombre:** EL POGO · Demonio de la Fosa (IV Ira) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_04_pogo_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 4 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO IRA. Paleta: fondo #210709, superficie #450a0a, alto #991b1b, neón #ef4444 (#fb923c acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: piedra burdeos quebrada, forja roja, metal industrial al rojo, óxido, rejas, respiraderos. JEFE 'POGO (Ira)': figura sobre pogo de altavoz rebotando, puño en alto. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_04_pogo_idle`

- **Nombre:** EL POGO · Demonio de la Fosa (Ira) · reposo
- **Ruta:** `assets/bosses/boss_04_pogo_idle.png`
- **Tamaño lienzo:** 448×544 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [448, 544]
- **Uso en el juego:** Jefe `boss_04_pogo`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL POGO · EL QUE ABRE LA PISTA (V Ira)
- **Referencia:** REF_03 · IV Ira
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_05_oficiante_attack`

- **Nombre:** EL OFICIANTE · Pontífice del Ruido (V Herejía) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_05_oficiante_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 5 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO HEREJIA. Paleta: fondo #150826, superficie #2e1065, alto #6b21a8, neón #a855f7 (#c084fc acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana gótica, vidrieras violeta, altares, cirios, reclinatorios, arcos apuntados. JEFE 'OFICIANTE (Herejía)': obispo hereje con mitra de neón violeta y báculo de discoteca. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_05_oficiante_death`

- **Nombre:** EL OFICIANTE · Pontífice del Ruido (V Herejía) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_05_oficiante_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 5 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO HEREJIA. Paleta: fondo #150826, superficie #2e1065, alto #6b21a8, neón #a855f7 (#c084fc acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana gótica, vidrieras violeta, altares, cirios, reclinatorios, arcos apuntados. JEFE 'OFICIANTE (Herejía)': obispo hereje con mitra de neón violeta y báculo de discoteca. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_05_oficiante_hit`

- **Nombre:** EL OFICIANTE · Pontífice del Ruido (V Herejía) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_05_oficiante_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 5 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO HEREJIA. Paleta: fondo #150826, superficie #2e1065, alto #6b21a8, neón #a855f7 (#c084fc acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana gótica, vidrieras violeta, altares, cirios, reclinatorios, arcos apuntados. JEFE 'OFICIANTE (Herejía)': obispo hereje con mitra de neón violeta y báculo de discoteca. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_05_oficiante_idle`

- **Nombre:** EL OFICIANTE · Pontífice del Ruido (Herejía) · reposo
- **Ruta:** `assets/bosses/boss_05_oficiante_idle.png`
- **Tamaño lienzo:** 352×560 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [352, 560]
- **Uso en el juego:** Jefe `boss_05_oficiante`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL OFICIANTE · EL QUE OFICIA EL RUIDO (VI Herejía)
- **Referencia:** _refs/ref_05_oficiante_central.png (figura central del 1.er intento, 880×1100)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Same character as in the reference image, drawn at the same size […]. ONE single figure only: not a model sheet, not a turnaround, exactly one character in the whole image. NEW POSE, IDLE: standing perfectly upright and solemn, in three-quarter view turned toward the RIGHT side of the image. His left hand holds a tall staff topped with brass organ pipes, planted on the ground in front of him. His right hand is raised with two fingers extended as if conducting. + encuadre, estilo y fondo de la tanda
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_06_matarife_attack`

- **Nombre:** EL MATARIFE · Coloso del Matadero (VI Violencia) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_06_matarife_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 6 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO VIOLENCIA. Paleta: fondo #091813, superficie #102a1e, alto #166534, neón #4ade80 (#86efac acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: losas de ceniza industrial, planchas de acero remachado, tanques tóxicos verde, óxido, maquinaria pesada. JEFE 'MATARIFE (Violencia)': carnicero industrial gigante con sierra de discos. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_06_matarife_death`

- **Nombre:** EL MATARIFE · Coloso del Matadero (VI Violencia) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_06_matarife_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 6 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO VIOLENCIA. Paleta: fondo #091813, superficie #102a1e, alto #166534, neón #4ade80 (#86efac acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: losas de ceniza industrial, planchas de acero remachado, tanques tóxicos verde, óxido, maquinaria pesada. JEFE 'MATARIFE (Violencia)': carnicero industrial gigante con sierra de discos. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_06_matarife_hit`

- **Nombre:** EL MATARIFE · Coloso del Matadero (VI Violencia) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_06_matarife_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 6 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO VIOLENCIA. Paleta: fondo #091813, superficie #102a1e, alto #166534, neón #4ade80 (#86efac acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: losas de ceniza industrial, planchas de acero remachado, tanques tóxicos verde, óxido, maquinaria pesada. JEFE 'MATARIFE (Violencia)': carnicero industrial gigante con sierra de discos. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_06_matarife_idle`

- **Nombre:** EL MATARIFE · Coloso del Matadero (Violencia) · reposo
- **Ruta:** `assets/bosses/boss_06_matarife_idle.png`
- **Tamaño lienzo:** 496×544 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [496, 544]
- **Uso en el juego:** Jefe `boss_06_matarife`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL MATARIFE · EL QUE DESPIEZA EL SET (VII Violencia)
- **Referencia:** REF_03 · VI Violencia
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_07_imitador_attack`

- **Nombre:** EL IMITADOR · Dama de los Espejos (VII Fraude) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_07_imitador_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 7 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO FRAUDE. Paleta: fondo #081829, superficie #0c2438, alto #155e75, neón #22d3ee (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: travertino azul turquesa, espejos diamante, cartas, fichas de casino, vidrio azul. JEFE 'IMITADOR (Fraude)': crupier enmascarado con múltiples rostros/naipes. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_07_imitador_death`

- **Nombre:** EL IMITADOR · Dama de los Espejos (VII Fraude) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_07_imitador_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 7 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO FRAUDE. Paleta: fondo #081829, superficie #0c2438, alto #155e75, neón #22d3ee (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: travertino azul turquesa, espejos diamante, cartas, fichas de casino, vidrio azul. JEFE 'IMITADOR (Fraude)': crupier enmascarado con múltiples rostros/naipes. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_07_imitador_hit`

- **Nombre:** EL IMITADOR · Dama de los Espejos (VII Fraude) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_07_imitador_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 7 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO FRAUDE. Paleta: fondo #081829, superficie #0c2438, alto #155e75, neón #22d3ee (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: travertino azul turquesa, espejos diamante, cartas, fichas de casino, vidrio azul. JEFE 'IMITADOR (Fraude)': crupier enmascarado con múltiples rostros/naipes. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_07_imitador_idle`

- **Nombre:** EL IMITADOR · Dama de los Espejos (Fraude) · reposo
- **Ruta:** `assets/bosses/boss_07_imitador_idle.png`
- **Tamaño lienzo:** 336×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 576]
- **Uso en el juego:** Jefe `boss_07_imitador`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL IMITADOR · EL QUE DUPLICA LA PISTA (VIII Fraude)
- **Referencia:** REF_03 · VII Fraude
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
prompt_head + CHARACTER (el texto de `design`, en inglés) + POSE, IDLE + prompt_tail
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_08_traidor_attack`

- **Nombre:** EL TRAIDOR · Monarca Glacial (VIII Traición) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_08_traidor_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 8 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO TRAICION. Paleta: fondo #081526, superficie #0f1f3a, alto #1e3a5f, neón #7dd3fc (#f43f5e acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: piedra abisal glaciar, hielo negro azulado, cadenas, cuchillas, luz fría azul. JEFE 'TRAIDOR (Traición)': caballero de hielo negro con espada doble. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_08_traidor_death`

- **Nombre:** EL TRAIDOR · Monarca Glacial (VIII Traición) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_08_traidor_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 8 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO TRAICION. Paleta: fondo #081526, superficie #0f1f3a, alto #1e3a5f, neón #7dd3fc (#f43f5e acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: piedra abisal glaciar, hielo negro azulado, cadenas, cuchillas, luz fría azul. JEFE 'TRAIDOR (Traición)': caballero de hielo negro con espada doble. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_08_traidor_hit`

- **Nombre:** EL TRAIDOR · Monarca Glacial (VIII Traición) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_08_traidor_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 8 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO TRAICION. Paleta: fondo #081526, superficie #0f1f3a, alto #1e3a5f, neón #7dd3fc (#f43f5e acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: piedra abisal glaciar, hielo negro azulado, cadenas, cuchillas, luz fría azul. JEFE 'TRAIDOR (Traición)': caballero de hielo negro con espada doble. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_08_traidor_idle`

- **Nombre:** EL TRAIDOR · Monarca Glacial (Traición) · reposo
- **Ruta:** `assets/bosses/boss_08_traidor_idle.png`
- **Tamaño lienzo:** 368×576 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [368, 576]
- **Uso en el juego:** Jefe `boss_08_traidor`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL TRAIDOR · EL ÚLTIMO RESIDENTE (IX Traición)
- **Referencia:** dd_work/refcrops/bosses/design_08_traicion.png (tarjeta de REF_03) + boss_00_anden_idle.png (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Create a new video game boss character sprite. IMAGE 1 is the character design reference: a small, low-resolution concept thumbnail. Redraw THIS character (same costume, colours, silhouette and attributes) as a clean full-body standing figure. Leave out everything around the character in the thumbnail. IMAGE 2 is ONLY a rendering style reference. Copy its drawing style: black ink outlines, hard-edged cel shading, magenta rim light on the back of the figure, cyan rim light on the front, flat chroma green background, whole figure visible, standing. Do NOT copy the character of image 2. CHARACTER: THE TRAITOR ("El Traidor"), the last resident, sovereign of the frozen final circle of a damned nightclub. A tall, regal, pale monarch as in the reference: a tall golden spiked crown, long pale hair, a cold expressionless white face, a heavy teal-blue ceremonial robe with wide sleeves and gold trim, and a long white tabard down the front embroidered with red medallions. Black ice crystals grow on the shoulders and along the hem of the robe, and a long white veil falls from the crown down the back. He holds ONE tall ornate golden staff. Palette: ice blue, teal, gold, white, black ice. POSE, IDLE: standing perfectly upright and motionless, the staff planted on the ground in one hand, the other hand resting on the chest. VIEW: three-quarter view; body and face turned toward the RIGHT side of the image. FRAMING: ONE single figure, not a model sheet, not a turnaround. Whole body visible from the top of the headgear to the feet, nothing cropped, the figure fills about 85 percent of the image height and is centred. STYLE: high resolution stylised digital illustration, NOT pixel art; crisp black ink outlines, hard-edged cel shading, magenta rim light along the back, cyan rim light along the front. Every part of the character is solid and opaque with an ink outline: no soft glows, no smoke, no particles, no motion lines. BACKGROUND: flat solid chroma green (#00FF00) filling the entire image. No floor, no ground line, no cast shadow, no scenery, no text, no frame. Nothing green on the character.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_09_nucleo_attack`

- **Nombre:** NÚCLEO FINAL · La Última Canción (IX Núcleo) · Ataque / Despliegue
- **Ruta:** `assets/bosses/boss_09_nucleo_attack.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 9 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO NUCLEO. Paleta: fondo #120924, superficie #241234, alto #3b2a4f, neón #e2e8f0 (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito. JEFE 'NÚCLEO': esfera ocular cósmica fracturada con órbitas de luz blanca. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_09_nucleo_death`

- **Nombre:** NÚCLEO FINAL · La Última Canción (IX Núcleo) · Colapso Cinematográfico
- **Ruta:** `assets/bosses/boss_09_nucleo_death.png`
- **Tamaño lienzo:** 416×352 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = death
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 9 death existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO NUCLEO. Paleta: fondo #120924, superficie #241234, alto #3b2a4f, neón #e2e8f0 (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito. JEFE 'NÚCLEO': esfera ocular cósmica fracturada con órbitas de luz blanca. POSE: muriendo/derrotado, cuerpo desplomándose o fragmentándose. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_09_nucleo_hit`

- **Nombre:** NÚCLEO FINAL · La Última Canción (IX Núcleo) · Impacto / Daño
- **Ruta:** `assets/bosses/boss_09_nucleo_hit.png`
- **Tamaño lienzo:** 384×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = hit
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 9 hit existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO NUCLEO. Paleta: fondo #120924, superficie #241234, alto #3b2a4f, neón #e2e8f0 (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito. JEFE 'NÚCLEO': esfera ocular cósmica fracturada con órbitas de luz blanca. POSE: recibiendo impacto, encogido o retrocediendo, destello de golpe. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_09_nucleo_idle`

- **Nombre:** NÚCLEO FINAL · La Última Canción (Núcleo) · reposo
- **Ruta:** `assets/bosses/boss_09_nucleo_idle.png`
- **Tamaño lienzo:** 352×592 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [352, 592]
- **Uso en el juego:** Jefe `boss_09_nucleo`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** NÚCLEO FINAL · LA ÚLTIMA CANCIÓN (Núcleo final)
- **Referencia:** _refs/ref_09_nucleo_motivo.png (tarjeta IX de REF_03 sobre lienzo 4:5) + boss_00_anden_idle.png (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Create a new video game boss character sprite. IMAGE 1 is a motif reference: a small concept thumbnail of the final core of a damned nightclub, a glossy black sphere hanging from a chain. Do NOT copy its composition; use its motifs (the black sphere, the chains, the black and white palette). IMAGE 2 is ONLY a rendering style reference […]. CHARACTER: THE CORE ("Núcleo Final", the King of the Beat), final boss of the nightclub. A tall, majestic humanoid figure whose whole body is built from hundreds of small square mirror tiles like a cracked disco ball, with dark gaps between the fragments. In the middle of its chest sits a large glossy black sphere, the same sphere as in the reference, held in place by short broken chains. It has no face: the head is a smooth faceted mirror surface. On its head it wears a golden crown whose two tall points are shaped like the pointed ears of a fox. A long tattered cape made of mirror shards hangs from its shoulders. Palette: silver mirror, black, gold and warm yellow accents, white highlights. POSE, IDLE: standing upright with regal calm, arms slightly open at its sides, palms turned forward. VIEW: three-quarter view; body and face turned toward the RIGHT side of the image. FRAMING: ONE single figure, not a model sheet, not a turnaround. Whole body visible from the top of the headgear to the feet, nothing cropped, the figure fills about 85 percent of the image height and is centred. STYLE: high resolution stylised digital illustration, NOT pixel art; crisp black ink outlines, hard-edged cel shading, magenta rim light along the back, cyan rim light along the front. Every part of the character is solid and opaque with an ink outline: no soft glows, no smoke, no particles, no motion lines. BACKGROUND: flat solid chroma green (#00FF00) filling the entire image. No floor, no ground line, no cast shadow, no scenery, no text, no frame. Nothing green on the character. …and the mirrors must not reflect green.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `boss_10_arquitecto_attack`

- **Nombre:** Jefe Secreto · El Arquitecto (Sobrecarga)
- **Ruta:** `assets/bosses/boss_10_arquitecto_attack.png`
- **Tamaño lienzo:** 448×448 px
- **Pivote:** `bottom-center`
- **Canal alfa:** True
- **Vistas necesarias:** 4 estados: idle/attack/hit/death (arquitecto solo idle/attack). Este = attack
- **Anclas:** foot=apoyo, unit=altura de referencia (BOSS_BASE[slug].h)
- **Referencia:** batch R03_JEFES; boss 10 attack existente; lámina del círculo
- **Fuente prompt:** `generated-template-v1`

**Prompt positivo:**
```text
DEADBEAT DISCO · ilustración digital estilizada tipo cómic/graffiti, no pixel art. Contorno de tinta negra nítido y cerrado. Sombreado cel con 2-3 tonos por material. Iluminación principal desde el noroeste, rim light magenta a la derecha y cian a la izquierda cuando aporten lectura. CÍRCULO NUCLEO. Paleta: fondo #120924, superficie #241234, alto #3b2a4f, neón #e2e8f0 (#ff2d7a acento). Saturación del entorno baja; neón ≤15% de superficie. Materiales: obsidiana cósmica, blanco platino, venas magenta, fractura dimensional, monolito. JEFE 'ARQUITECTO (secreto)': mimo blanco con casco de obra y planos flotantes. POSE: en pleno ataque, pose ofensiva, extremidad/arma extendida hacia el jugador. Figura imponente ocupando ~80% del lienzo, de perfil mirando a la derecha. Pivote bottom-center, punto de apoyo al ~85% del alto del PNG. Presencia escénica, sin halo en el sprite (lo pinta el motor). RGBA.  Fondo verde croma liso (#00ff00). Sin suelo dibujado, sin sombra de contacto (la pinta el motor). Sin texto, letras, números, logotipos ni marcas. SIN pixel art, dithering, grano, ruido ni sombras horneadas. Sin halos blancos ni restos de croma. SIN varios personajes, sin collage de vistas, sin marcas de agua.
```

**Prompt negativo:**
```text
texto, letras, números, marcas, pixel art, dithering, grano, sombras horneadas, halos blancos, restos de verde croma en bordes, blanco puro, collage de vistas, varios personajes, marcas de agua, piso de más, sombra de suelo, suelo dibujado, humano genérico, pocas extremidades, texto
```

---

### `boss_10_arquitecto_idle`

- **Nombre:** Jefe secreto · El Arquitecto · reposo
- **Ruta:** `assets/bosses/boss_10_arquitecto_idle.png`
- **Tamaño lienzo:** 496×560 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [496, 560]
- **Uso en el juego:** Jefe `boss_10_arquitecto`, fotograma de reposo. Lo dibuja DD_WORLD.drawBoss con la vista que entrega el puente (ddBossView): apoyado en y + 0,8·r, de cara al protagonista, con respiración, balanceo al andar y destello de impacto. Mientras no existan `hit` y `death` de esta misma revisión, esos estados se resuelven sobre este fotograma (retroceso y colapso procedimentales).
- **Entidad:** EL ARQUITECTO · DJ-DIRECTOR EN PERSONA (jefe secreto)
- **Referencia:** _refs/ref_10_arquitecto_antiguo.png (sprite anterior ampliado sobre lienzo 4:5) + boss_00_anden_idle.png (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
Create a new video game boss character sprite. IMAGE 1 is the character design reference: an old low-resolution pixel-art sprite of this boss. Redraw THIS character (same armour, crown, cape, colours and silhouette) as a clean high-resolution illustration. IMAGE 2 is ONLY a rendering style reference […]. CHARACTER: THE ARCHITECT OF THE CLUB ("El Arquitecto"), the secret final boss: the DJ-director who designed the damned nightclub. A tall armoured sovereign as in the reference: ornate black and silver plate armour, a tall spiked silver crown fused with a pair of large DJ headphones, a face hidden in shadow with two violet eyes, a long black cape, and one gauntlet that shines cyan (drawn solid and hard-edged). In his other hand he holds a long silver drafting compass like a sceptre. Thin violet and cyan blueprint lines are engraved on the armour. Palette: black, silver, violet, cyan. POSE, IDLE: standing upright and imperious, the cyan gauntlet raised at chest height, the compass-sceptre planted on the ground. VIEW: three-quarter view; body and face turned toward the RIGHT side of the image. FRAMING: ONE single figure, not a model sheet, not a turnaround. Whole body visible from the top of the headgear to the feet, nothing cropped, the figure fills about 85 percent of the image height and is centred. STYLE: high resolution stylised digital illustration, NOT pixel art; crisp black ink outlines, hard-edged cel shading, magenta rim light along the back, cyan rim light along the front. Every part of the character is solid and opaque with an ink outline: no soft glows, no smoke, no particles, no motion lines. BACKGROUND: flat solid chroma green (#00FF00) filling the entire image. No floor, no ground line, no cast shadow, no scenery, no text, no frame. Nothing green on the character.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---
