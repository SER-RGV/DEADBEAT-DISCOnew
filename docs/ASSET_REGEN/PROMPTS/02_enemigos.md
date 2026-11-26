# Enemigos

> 6 familias: security, dancer, fanatic, chef, drone, elite. Cada familia tiene 4 estados (walk/windup/attack/death) salvo el chef que tiene todos los estados ya generados en TR_W1-W6. Walk es la referencia de escala para todos los fotogramas de la familia.

**Nº de assets en esta categoría:** 24

## enemies

### `enemy_chef_attack`

- **Nombre:** Tanque · ataque
- **Ruta:** `assets/enemies/enemy_chef_attack.png`
- **Tamaño lienzo:** 800×528 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [800, 528]
- **Uso en el juego:** Familia `chef` (tipo `tank`; minijefe del círculo III), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tanque (bruto colosal)
- **Referencia:** _refs/ref_chef_wide.png (el `walk` de la familia sobre un lienzo de 1560×1000)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TANQUE: bruto colosal de cuerpo de gorila. Espalda y hombros enormes, puños como su cabeza, cabeza calva hundida entre los hombros, gran barba violeta, ojos pequeños encendidos, piel cetrina con cicatrices. Torso desnudo, pantalón marrón raído, cinturón de tachuelas, botas negras. ATAQUE, puñetazo en carrera: se lanza hacia la derecha sobre dos piernas, cuerpo inclinado unos 45°, pierna trasera estirada, brazo derecho totalmente extendido en horizontal con el puño por delante de la cabeza, brazo izquierdo atrás; ninguna mano toca el suelo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_chef_death`

- **Nombre:** Tanque · muerte
- **Ruta:** `assets/enemies/enemy_chef_death.png`
- **Tamaño lienzo:** 656×592 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [656, 592]
- **Uso en el juego:** Familia `chef` (tipo `tank`; minijefe del círculo III), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Tanque (bruto colosal)
- **Referencia:** _refs/ref_chef_center.png (el `walk` de la familia CENTRADO sobre un lienzo de 1500×1300 para que la caída quepa)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TANQUE: bruto colosal de cuerpo de gorila. Espalda y hombros enormes, puños como su cabeza, cabeza calva hundida entre los hombros, gran barba violeta, ojos pequeños encendidos, piel cetrina con cicatrices. Torso desnudo, pantalón marrón raído, cinturón de tachuelas, botas negras. MUERTE: acaba de recibir un disparo en el pecho desde la derecha y cae de ESPALDAS hacia la izquierda, con todo el cuerpo inclinado unos 40 grados: cabeza echada atrás arriba a la izquierda, boca abierta y ojos cerrados, pecho y vientre hacia arriba, los dos brazos sueltos con las manos abiertas (ninguna toca el suelo), una pierna pateando hacia la derecha y el talón de la otra bota todavía en el suelo. UNA sola figura en la imagen; la pose de la referencia se sustituye por completo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_chef_walk`

- **Nombre:** Tanque · caminar / reposo
- **Ruta:** `assets/enemies/enemy_chef_walk.png`
- **Tamaño lienzo:** 608×512 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [608, 512]
- **Uso en el juego:** Familia `chef` (tipo `tank`; minijefe del círculo III), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tanque (bruto colosal)
- **Referencia:** REF_06_guia_visual_maestra.png#enemigos/TANQUE (diseño) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TANQUE: bruto colosal de cuerpo de gorila. Espalda y hombros enormes, puños como su cabeza, cabeza calva hundida entre los hombros, gran barba violeta, ojos pequeños encendidos, piel cetrina con cicatrices. Torso desnudo, pantalón marrón raído, cinturón de tachuelas, botas negras. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: andar de gorila sobre los nudillos: un puño plantado delante, piernas cortas flexionadas. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_chef_windup`

- **Nombre:** Tanque · aviso
- **Ruta:** `assets/enemies/enemy_chef_windup.png`
- **Tamaño lienzo:** 432×704 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [432, 704]
- **Uso en el juego:** Familia `chef` (tipo `tank`; minijefe del círculo III), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tanque (bruto colosal)
- **Referencia:** _refs/ref_chef_tall.png (el `walk` de la familia sobre un lienzo de 1240×1400: el original, de 864 px de alto, no dejaba sitio para una pose erguida y por eso el primer intento volvió al andar sobre los nudillos)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TANQUE: bruto colosal de cuerpo de gorila. Espalda y hombros enormes, puños como su cabeza, cabeza calva hundida entre los hombros, gran barba violeta, ojos pequeños encendidos, piel cetrina con cicatrices. Torso desnudo, pantalón marrón raído, cinturón de tachuelas, botas negras. AVISO antes de la carga: se yergue sobre las dos piernas como un gorila enfurecido, mucho más alto que al caminar, con los dos puños alzados y juntos por encima de la cabeza, pecho fuera y boca abierta rugiendo; ninguna mano toca el suelo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_dancer_attack`

- **Nombre:** Bailarina · ataque
- **Ruta:** `assets/enemies/enemy_dancer_attack.png`
- **Tamaño lienzo:** 480×416 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [480, 416]
- **Uso en el juego:** Familia `dancer` (tipo `dancer` del círculo II en adelante), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Bailarina (gogó no-muerta)
- **Referencia:** enemy_dancer_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
BAILARINA: gogó no-muerta. Demacrada, extremidades muy largas, piel rosa chicle, cara de calavera con cuencas oscuras, melena corta rosa. Top rosa de manga larga, minifalda plisada azul celeste, botines rosas, dedos en garra. POSE DE ATAQUE: el golpe en su punto máximo. En concreto: zancada profunda hacia la derecha: rodilla delantera muy flexionada, pierna trasera estirada, torso lanzado adelante, ambos brazos extendidos al frente a la altura del hombro con las garras abiertas, melena hacia atrás. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_dancer_death`

- **Nombre:** Bailarina · muerte
- **Ruta:** `assets/enemies/enemy_dancer_death.png`
- **Tamaño lienzo:** 384×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [384, 432]
- **Uso en el juego:** Familia `dancer` (tipo `dancer` del círculo II en adelante), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Bailarina (gogó no-muerta)
- **Referencia:** enemy_dancer_walk.png
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
BAILARINA: gogó no-muerta. Demacrada, extremidades muy largas, piel rosa chicle, cara de calavera con cuencas oscuras, melena corta rosa. Top rosa de manga larga, minifalda plisada azul celeste, botines rosas, dedos en garra. MUERTE: recibe el disparo de frente y cae de espaldas: cuerpo arqueado como un arco, cabeza vencida hacia atrás con la melena al vuelo, mandíbula abierta, brazos lanzados arriba, falda al vuelo; una pierna al aire y el tacón de la otra en el suelo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_dancer_walk`

- **Nombre:** Bailarina · caminar / reposo
- **Ruta:** `assets/enemies/enemy_dancer_walk.png`
- **Tamaño lienzo:** 272×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [272, 432]
- **Uso en el juego:** Familia `dancer` (tipo `dancer` del círculo II en adelante), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Bailarina (gogó no-muerta)
- **Referencia:** REF_06_guia_visual_maestra.png#enemigos/BAILARÍN (diseño) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
BAILARINA: gogó no-muerta. Demacrada, extremidades muy largas, piel rosa chicle, cara de calavera con cuencas oscuras, melena corta rosa. Top rosa de manga larga, minifalda plisada azul celeste, botines rosas, dedos en garra. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: paso de baile arrastrado: rodillas flexionadas, caderas ladeadas, ambos brazos al frente con las muñecas caídas. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_dancer_windup`

- **Nombre:** Bailarina · aviso
- **Ruta:** `assets/enemies/enemy_dancer_windup.png`
- **Tamaño lienzo:** 320×448 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [320, 448]
- **Uso en el juego:** Familia `dancer` (tipo `dancer` del círculo II en adelante), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Bailarina (gogó no-muerta)
- **Referencia:** enemy_dancer_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
BAILARINA: gogó no-muerta. Demacrada, extremidades muy largas, piel rosa chicle, cara de calavera con cuencas oscuras, melena corta rosa. Top rosa de manga larga, minifalda plisada azul celeste, botines rosas, dedos en garra. POSE DE AVISO: carga el golpe antes de atacar (telegrafía el ataque al jugador). En concreto: se echa muy atrás sobre la pierna trasera, torso inclinado hacia atrás, ambos brazos alzados por encima de la cabeza con las garras abiertas, boca abierta en un chillido, pierna delantera estirada con la punta en el suelo. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_drone_attack`

- **Nombre:** Tirador · ataque
- **Ruta:** `assets/enemies/enemy_drone_attack.png`
- **Tamaño lienzo:** 432×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [432, 432]
- **Uso en el juego:** Familia `drone` (tipo `speaker` (mantiene distancia y dispara)), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tirador (pistolero no-muerto)
- **Referencia:** enemy_drone_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TIRADOR: pistolero no-muerto. Delgado, piel gris. Cazadora bomber roja con puños y cuello negros, gorra roja calada, pañuelo negro con dientes de calavera sobre media cara, pantalón cargo negro, zapatillas blancas y rojas. Subfusil compacto negro a dos manos. POSE DE ATAQUE: el golpe en su punto máximo. En concreto: postura de tiro baja y abierta, cuerpo volcado hacia adelante, ambos brazos totalmente extendidos al frente a la altura del hombro, cañón horizontal; sin fogonazo (el motor pone los proyectiles). Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_drone_death`

- **Nombre:** Tirador · muerte
- **Ruta:** `assets/enemies/enemy_drone_death.png`
- **Tamaño lienzo:** 416×448 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [416, 448]
- **Uso en el juego:** Familia `drone` (tipo `speaker` (mantiene distancia y dispara)), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Tirador (pistolero no-muerto)
- **Referencia:** enemy_drone_walk.png
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TIRADOR: pistolero no-muerto. Delgado, piel gris. Cazadora bomber roja con puños y cuello negros, gorra roja calada, pañuelo negro con dientes de calavera sobre media cara, pantalón cargo negro, zapatillas blancas y rojas. Subfusil compacto negro a dos manos. MUERTE: recibe el disparo de frente y cae de espaldas: torso arqueado, cabeza vencida hacia atrás, la gorra roja saliendo despedida, brazos abiertos y el subfusil girando en el aire; una pierna al aire y el talón de la otra en el suelo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_drone_walk`

- **Nombre:** Tirador · caminar / reposo
- **Ruta:** `assets/enemies/enemy_drone_walk.png`
- **Tamaño lienzo:** 272×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [272, 432]
- **Uso en el juego:** Familia `drone` (tipo `speaker` (mantiene distancia y dispara)), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tirador (pistolero no-muerto)
- **Referencia:** REF_06_guia_visual_maestra.png#enemigos/TIRADOR (diseño) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TIRADOR: pistolero no-muerto. Delgado, piel gris. Cazadora bomber roja con puños y cuello negros, gorra roja calada, pañuelo negro con dientes de calavera sobre media cara, pantalón cargo negro, zapatillas blancas y rojas. Subfusil compacto negro a dos manos. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: avance cauteloso con las rodillas flexionadas y el arma lista a la altura del pecho, sin disparar. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_drone_windup`

- **Nombre:** Tirador · aviso
- **Ruta:** `assets/enemies/enemy_drone_windup.png`
- **Tamaño lienzo:** 240×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [240, 432]
- **Uso en el juego:** Familia `drone` (tipo `speaker` (mantiene distancia y dispara)), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Tirador (pistolero no-muerto)
- **Referencia:** enemy_drone_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
TIRADOR: pistolero no-muerto. Delgado, piel gris. Cazadora bomber roja con puños y cuello negros, gorra roja calada, pañuelo negro con dientes de calavera sobre media cara, pantalón cargo negro, zapatillas blancas y rojas. Subfusil compacto negro a dos manos. POSE DE AVISO: carga el golpe antes de atacar (telegrafía el ataque al jugador). En concreto: se planta con los pies separados y alza el subfusil en vertical junto a la cara, cañón hacia arriba, las dos manos en el arma, mirando a su objetivo. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_elite_attack`

- **Nombre:** Élite · Mascota · ataque
- **Ruta:** `assets/enemies/enemy_elite_attack.png`
- **Tamaño lienzo:** 672×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [672, 432]
- **Uso en el juego:** Familia `elite` (cualquier tipo con la marca élite; minijefe del círculo VIII), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Élite · Mascota del club
- **Referencia:** _refs/ref_elite_wide_attack.png (el `walk` de la familia sobre un lienzo de 1400×1314: en el original, de 800 px de ancho, no cabía un brazo extendido y por eso el primer intento cruzó los brazos sobre la cara)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
MASCOTA: matón disfrazado de mascota del club. Corpulento, mono de peluche rosa, cabezón de oso de peluche color crema con orejas redondas, sonrisa cosida, un ojo de botón y otro magenta encendido, manchas y costuras. Manoplas de peluche con garras de acero, botas rosas, collar negro de pinchos. ATAQUE de garra: zancada larga hacia la derecha con el torso adelantado; brazo derecho extendido en horizontal a la altura del hombro con las garras abiertas por delante, brazo izquierdo recogido atrás; el cabezón entero a la vista, sin nada que lo tape. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_elite_death`

- **Nombre:** Mascota (élite) · muerte
- **Ruta:** `assets/enemies/enemy_elite_death.png`
- **Tamaño lienzo:** 496×464 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [496, 464]
- **Uso en el juego:** Familia `elite` (cualquier tipo con la marca élite; minijefe del círculo VIII), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Élite · Mascota del club
- **Referencia:** _refs/ref_elite_wide_death.png (el `walk` de la familia sobre un lienzo de 1500×1314 para que la caída quepa)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
MASCOTA: matón disfrazado de mascota del club. Corpulento, mono de peluche rosa, cabezón de oso de peluche color crema con orejas redondas, sonrisa cosida, un ojo de botón y otro magenta encendido, manchas y costuras. Manoplas de peluche con garras de acero, botas rosas, collar negro de pinchos. MUERTE: cae de espaldas con el cuerpo a unos 45°: cabezón de oso vencido hacia atrás y torcido, relleno blanco saliendo por una costura reventada del pecho, brazos arriba con las garras abiertas; una bota al aire y el talón de la otra tocando el suelo. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_elite_walk`

- **Nombre:** Élite · Mascota · caminar / reposo
- **Ruta:** `assets/enemies/enemy_elite_walk.png`
- **Tamaño lienzo:** 320×496 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [320, 496]
- **Uso en el juego:** Familia `elite` (cualquier tipo con la marca élite; minijefe del círculo VIII), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Élite · Mascota del club
- **Referencia:** REF_06_guia_visual_maestra.png#enemigos/ESPECIAL (oso de peluche con mono rosa) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
MASCOTA: matón disfrazado de mascota del club. Corpulento, mono de peluche rosa, cabezón de oso de peluche color crema con orejas redondas, sonrisa cosida, un ojo de botón y otro magenta encendido, manchas y costuras. Manoplas de peluche con garras de acero, botas rosas, collar negro de pinchos. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: andar pesado y amenazante, torso adelantado, brazos algo abiertos con las garras listas. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_elite_windup`

- **Nombre:** Élite · Mascota · aviso
- **Ruta:** `assets/enemies/enemy_elite_windup.png`
- **Tamaño lienzo:** 336×512 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 512]
- **Uso en el juego:** Familia `elite` (cualquier tipo con la marca élite; minijefe del círculo VIII), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Élite · Mascota del club
- **Referencia:** enemy_elite_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
MASCOTA: matón disfrazado de mascota del club. Corpulento, mono de peluche rosa, cabezón de oso de peluche color crema con orejas redondas, sonrisa cosida, un ojo de botón y otro magenta encendido, manchas y costuras. Manoplas de peluche con garras de acero, botas rosas, collar negro de pinchos. POSE DE AVISO: carga el golpe antes de atacar (telegrafía el ataque al jugador). En concreto: se echa atrás con ambos brazos alzados por encima de la cabeza y las garras de acero abiertas, un pie en el aire al dar el paso. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_fanatic_attack`

- **Nombre:** Sprinter · ataque
- **Ruta:** `assets/enemies/enemy_fanatic_attack.png`
- **Tamaño lienzo:** 384×400 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [384, 400]
- **Uso en el juego:** Familia `fanatic` (tipo `sprinter`), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Sprinter (corredor no-muerto)
- **Referencia:** enemy_fanatic_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SPRINTER: corredor no-muerto. Fibroso, cara de calavera, cresta corta rosa. Mono ceñido azul marino con vivos rosas, cinturón rosa, mitones y zapatillas rosas, dedos en garra. POSE DE ATAQUE: el golpe en su punto máximo. En concreto: embestida a la carrera: torso casi horizontal, boca abierta, pierna trasera estirada, brazos lanzados hacia atrás. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_fanatic_death`

- **Nombre:** Sprinter · muerte
- **Ruta:** `assets/enemies/enemy_fanatic_death.png`
- **Tamaño lienzo:** 496×448 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [496, 448]
- **Uso en el juego:** Familia `fanatic` (tipo `sprinter`), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Sprinter (corredor no-muerto)
- **Referencia:** enemy_fanatic_walk.png
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SPRINTER: corredor no-muerto. Fibroso, cara de calavera, cresta corta rosa. Mono ceñido azul marino con vivos rosas, cinturón rosa, mitones y zapatillas rosas, dedos en garra. MUERTE: el disparo lo levanta del suelo y lo dobla hacia atrás: cabeza a la izquierda y pies a la derecha, pecho y calavera hacia arriba, mandíbula abierta, brazos con las garras lacias al aire; una pierna pateando y la otra apoyada. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_fanatic_walk`

- **Nombre:** Sprinter · caminar / reposo
- **Ruta:** `assets/enemies/enemy_fanatic_walk.png`
- **Tamaño lienzo:** 336×400 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [336, 400]
- **Uso en el juego:** Familia `fanatic` (tipo `sprinter`), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Sprinter (corredor no-muerto)
- **Referencia:** REF_06_guia_visual_maestra.png#enemigos/SPRINTER (diseño) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SPRINTER: corredor no-muerto. Fibroso, cara de calavera, cresta corta rosa. Mono ceñido azul marino con vivos rosas, cinturón rosa, mitones y zapatillas rosas, dedos en garra. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: acecho agazapado: torso muy inclinado, rodillas flexionadas, cabeza adelantada, garras abiertas colgando. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_fanatic_windup`

- **Nombre:** Sprinter · aviso
- **Ruta:** `assets/enemies/enemy_fanatic_windup.png`
- **Tamaño lienzo:** 384×320 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [384, 320]
- **Uso en el juego:** Familia `fanatic` (tipo `sprinter`), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Sprinter (corredor no-muerto)
- **Referencia:** enemy_fanatic_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SPRINTER: corredor no-muerto. Fibroso, cara de calavera, cresta corta rosa. Mono ceñido azul marino con vivos rosas, cinturón rosa, mitones y zapatillas rosas, dedos en garra. POSE DE AVISO: carga el golpe antes de atacar (telegrafía el ataque al jugador). En concreto: agazapado para saltar: torso doblado hacia el suelo, ambas manos tocando el suelo por delante, cabeza baja mirando al frente con la mandíbula abierta, caderas altas. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_security_attack`

- **Nombre:** Seguridad · ataque
- **Ruta:** `assets/enemies/enemy_security_attack.png`
- **Tamaño lienzo:** 480×400 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [480, 400]
- **Uso en el juego:** Familia `security` (tipo `dancer` en el círculo I, guardianes y minijefes por defecto), estado `attack`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Seguridad del club (antidisturbios)
- **Referencia:** enemy_security_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SEGURIDAD: gorila antidisturbios del club. Casco negro cerrado con ranura de visor magenta encendida, chaleco táctico negro con hombreras angulosas y ribete magenta, emblema de calavera magenta en el pecho, guantes, pantalón táctico con rodilleras, botas. Porra negra de punta magenta. POSE DE ATAQUE: el golpe en su punto máximo. En concreto: fondo de esgrima hacia la derecha: rodilla delantera muy flexionada, pierna trasera estirada, brazo derecho totalmente extendido a la altura del hombro con la porra horizontal prolongando el brazo, brazo izquierdo recogido atrás. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_security_death`

- **Nombre:** Seguridad · muerte
- **Ruta:** `assets/enemies/enemy_security_death.png`
- **Tamaño lienzo:** 432×416 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [432, 416]
- **Uso en el juego:** Familia `security` (tipo `dancer` en el círculo I, guardianes y minijefes por defecto), estado `death`. Lo dibuja DD_WORLD.drawEnemyDeath con el registro de abatidos del motor (0,6 s: destello, retroceso y fundido).
- **Entidad:** Seguridad del club (antidisturbios)
- **Referencia:** enemy_security_walk.png
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SEGURIDAD: gorila antidisturbios del club. Casco negro cerrado con ranura de visor magenta encendida, chaleco táctico negro con hombreras angulosas y ribete magenta, emblema de calavera magenta en el pecho, guantes, pantalón táctico con rodilleras, botas. Porra negra de punta magenta. MUERTE: recibe el disparo de frente y cae de espaldas (hacia la izquierda): torso arqueado unos 40°, casco vencido hacia atrás, brazos abiertos, la porra saliendo despedida; una pierna pateando al aire y la otra apoyada. Mismo personaje y mismo tamaño que la referencia. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA. Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin sangre, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_security_walk`

- **Nombre:** Seguridad · caminar / reposo
- **Ruta:** `assets/enemies/enemy_security_walk.png`
- **Tamaño lienzo:** 224×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [224, 432]
- **Uso en el juego:** Familia `security` (tipo `dancer` en el círculo I, guardianes y minijefes por defecto), estado `walk`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Seguridad del club (antidisturbios)
- **Referencia:** assets/enemies/enemy_security_walk.png (diseño anterior del repositorio; REF_06 no trae esta familia) + player_idle_00 (estilo)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SEGURIDAD: gorila antidisturbios del club. Casco negro cerrado con ranura de visor magenta encendida, chaleco táctico negro con hombreras angulosas y ribete magenta, emblema de calavera magenta en el pecho, guantes, pantalón táctico con rodilleras, botas. Porra negra de punta magenta. POSE: avanzando hacia la derecha a media zancada, ambos pies cerca del suelo. Es el fotograma de reposo y de caminar (el motor le añade balanceo). En concreto: caminando erguido y amenazante, torso algo adelantado, la porra baja junto al muslo. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---

### `enemy_security_windup`

- **Nombre:** Seguridad · aviso
- **Ruta:** `assets/enemies/enemy_security_windup.png`
- **Tamaño lienzo:** 400×432 px
- **Pivote:** `anchors.foot`
- **Canal alfa:** True
- **Tamaño maestro:** [400, 432]
- **Uso en el juego:** Familia `security` (tipo `dancer` en el círculo I, guardianes y minijefes por defecto), estado `windup`. Lo dibuja DD_WORLD.drawEnemy con la familia y el estado que decide el puente (ddEnemyView).
- **Entidad:** Seguridad del club (antidisturbios)
- **Referencia:** enemy_security_walk (hoja de modelo de la familia)
- **Fuente prompt:** `existing-batch`

**Prompt positivo:**
```text
SEGURIDAD: gorila antidisturbios del club. Casco negro cerrado con ranura de visor magenta encendida, chaleco táctico negro con hombreras angulosas y ribete magenta, emblema de calavera magenta en el pecho, guantes, pantalón táctico con rodilleras, botas. Porra negra de punta magenta. POSE DE AVISO: carga el golpe antes de atacar (telegrafía el ataque al jugador). En concreto: se echa atrás con la porra alzada por detrás de la cabeza y el otro brazo extendido al frente para equilibrarse. Ilustración digital de alta resolución, mismo acabado que el protagonista (R01): contorno de tinta negra, sombreado cel de bordes duros, luz de contorno magenta en la espalda y cian en el frente. NO pixel art. Perfil estricto mirando a la DERECHA (el motor refleja al enemigo para encararlo al jugador). Fondo croma verde liso (#00FF00); sin suelo, sin sombra, sin efectos, sin texto; nada verde en el personaje.
```

**Prompt negativo:**
```text
sin texto, letras, marcas, pixel art, sombras horneadas, halos blancos, verde croma en bordes, blanco puro, collage, varios personajes, marcas de agua
```

---
