# 02_SPATIAL_AUDIT.md — Auditoría del diseño espacial del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo auditoría y propuesta** — sin modificaciones destructivas, sin rediseño visual, sin nuevos assets.

---

## 1. Resumen espacial

El Refugio es una sala rectangular única de **1240 × 760 unidades de mundo** (mundo X 260–1500, Y 210–970), con el protagonista spawnando en **(880, 615)** y moviéndose a **285 u/s**. El área transitable efectiva antes del pushout de muebles es de unos **1164 × 684 unidades** (bounds menos márgenes de paredes). Dentro de ese rectángulo hay 22 props, 4 estaciones de interacción, 3 NPCs y el protagonista.

Es un **espacio de una sola planta, abierto, sin habitaciones separadas ni pasillos**. La organización es por "islas" de mobiliario y estaciones distribuidas sobre un suelo de mármol con alfombra/medallón central y un muro norte gótico con nichos.

---

## 2. Elementos espaciales identificados

### 2.1 Estructura arquitectónica

| Elemento | Posición (mundo) | Tamaño / radio | Notas |
|----------|------------------|----------------|-------|
| Límites del mapa (bounds) | (260,210) → (1500,970) | 1240 × 760 | `HUB_BOUNDS` |
| Zona transitable (márgenes) | (298,272) → (1462,894) aprox. | ~1164 × 684 | margen X 38, Y 62 |
| Muro norte (gótico, nichos) | y ≈ 210, x 260–1500 | módulos 128, alto 132 | `wall_panel_gothic_niche` |
| Pilastras obsidiana | cada 320 px en muro norte | `wall_pillar_obsidian` | flanco del muro |
| Mural Zorro Neón (derecha) | x ≈ 1382, y ≈ 360 | 112 × 148 | `prop_hub_fox_neon` |
| Faroles dorados (techo) | (650,215) y (1110,215) | 136 × 136 | `prop_chandelier_gold` |

### 2.2 Plataforma de descenso

| Estación | Posición | Radio | Etiqueta |
|----------|----------|-------|----------|
| Descenso | **(880, 785)** | 96 | "PLATAFORMA DE DESCENSO · INICIAR INCURSIÓN" |

La plataforma está en la parte **inferior-central** de la sala, justo debajo del spawn (880,615). Es el punto de acceso a las incursiones y el ancla de salida del Refugio.

### 2.3 Estaciones de interacción

| Estación | Posición (mundo) | Radio | Función |
|----------|------------------|-------|---------|
| Descenso | (880, 785) | 96 | Iniciar incursión (Círculo I · Lujuria) |
| Armería | (415, 535) | 95 | Inventario y tienda (120 armas) |
| DJ Virgilio | (1165, 335) | 105 | Diálogo con el DJ |
| Mapa astral | (1345, 605) | 95 | Torre de los 9 Círculos |

Anillo de interacción elíptico `r*0.72 × r*0.34`; prompt `[E]/(A)` en la parte inferior de pantalla cuando el jugador está dentro del radio.

### 2.4 Personajes (NPCs)

| NPC | Posición | Altura en mundo | Asset |
|-----|----------|-----------------|-------|
| DJ Virgilio | (1165, 268 aprox.) | 118 | `npc_dj_booth_world` (fallback `dialogue_portrait_dj`) |
| Bartender | (740, 262 aprox.) | 102 | `npc_bartender_hub` |
| Armero | (432, 505 aprox.) | 104 | `npc_armorer_hub` |

Orden de dibujado Y-sort; el armero está a la altura del protagonista (y=505) y puede quedar por delante o detrás según la posición del jugador.

### 2.5 Props (mobiliario y decoración)

22 props en `HUB_PROPS` (ver `dd_hub_system.js`). Algunos ejemplos con radio base `br` y posición:
- Estanterías: (430,245) br44, (560,245) br44
- Barra: (740,278) br56
- Nevera: (325,280) br36
- Parlante: (1035,255) br36
- Cabina DJ: (1165,278) br58
- Subwoofer: (1305,265) br38
- Palma: (1415,295) br38
- Sofás: (745,470) br48, (1015,470) br48 (flipX)
- Banco: (880,488) br34
- Butacas: (635,545) br34, (1125,545) br34 (flipX)
- Candelabros: (675,410) br24, (1085,410) br24
- Máquina expendedora: (355,515) br42
- Arcade: (355,655) br40
- Cofre: (455,565) br34
- Pedestal: (1365,585) br40
- Plantas: (1425,745) br32, (335,845) br32

### 2.6 Protagonista

Spawn en (880,615), cuerpo `drawH = 112` unidades, sin espejado, bob de respiración ±0.7 / paso 2.2. Integración con spotlight y halo de neón cálido.

---

## 3. Recorridos habituales (flujo del jugador)

1. **Entrada / spawn**: aparece en (880,615), zona central-sur.
2. **Orientación**: diálogo de bienvenida del DJ, prompt de estación si está cerca.
3. **Preparación**: camina a Armería (415,535) o Mapa (1345,605), o habla con el DJ (1165,335).
4. **Incursión**: camina a la Plataforma de Descenso (880,785) y pulsa `[E]/(A)`.
5. **Regreso**: tras la incursión, vuelve a aparecer en spawn (880,615).

El recorrido más común es spawn → preparación → descenso, con el descenso como punto final de cada visita.

---

## 4. Evaluación espacial

### 4.1 ¿Es demasiado pequeño, demasiado grande o adecuado?

**Adecuado para una zona segura de una sola sala**, pero con matices:
- 1240 × 760 unidades con ~22 props y 4 estaciones da una densidad media; no está vacío ni está saturado.
- El protagonista (drawH 112) dispone de espacio suficiente para desplazarse (área transitable ~1164 × 684).
- No hay habitaciones ni pasillos: todo es una sola planta abierta.

### 4.2 ¿Espacio suficiente para el protagonista?

**Sí.** El área transitable efectiva (~1164 × 684) es generosa para un único personaje y la velocidad de 285 u/s permite cruzar la sala en ~4–5 segundos. No hay sensación de agobio.

### 4.3 ¿Están las estaciones demasiado juntas?

**Parcialmente.** Las cuatro estaciones están distribuidas en las cuatro esquinas/ejes (descenso centro-inferior, armería izquierda-media, DJ arriba-derecha, mapa derecha-media), lo que evita el hacinamiento. La distancia entre armería (415,535) y descenso (880,785) es de ~469 unidades (~1.6 s de camino), aceptable. La distancia entre DJ (1165,335) y mapa (1345,605) es de ~305 unidades (~1 s), cercana pero distinta.

### 4.4 ¿Recorridos innecesarios?

No hay recorridos claramente innecesarios, pero el diseño es "lineal por islas": el jugador va de isla en isla. No hay un camino principal definido que guíe naturalmente hacia la plataforma de descenso.

### 4.5 ¿Zonas que no aportan nada?

- Las esquinas superiores izquierda y derecha están relativamente desiertas (solo pared norte y algún prop).
- La zona central (alrededor del banco 880,488 y los sofás) es de tránsito sin función propia clara más allá de la decoración.

### 4.6 ¿Permite incorporar futuras funciones?

**Sí.** Al ser una sola planta abierta con espacio sobrante en las zonas periféricas (especialmente superiores), se pueden añadir nuevas estaciones o props sin rehacer la sala, siempre que se respeten los límites y el Y-sort.

### 4.7 ¿La plataforma de descenso tiene suficiente protagonismo?

**Medio.** Está en una posición central-inferior visible, con su anillo de interacción y el `drawDescentPad`, pero compite visualmente con los sofás centrales y el mural del zorro. No hay un "eje visual" fuerte que dirija al jugador hacia ella desde el spawn.

### 4.8 ¿El jugador entiende rápidamente dónde debe ir?

**Parcialmente.** El prompt `[E]/(A)` ayuda cuando está cerca de una estación, pero no hay señalización visual permanente (letreros, iluminación diferencial, camino marcado) que indique la plataforma de descenso desde cualquier punto de la sala.

---

## 5. Problemas espaciales detectados

1. **Sin camino principal definido**: el jugador no tiene una guía visual clara desde el spawn hacia la plataforma de descenso.
2. **Plataforma de descenso sin jerarquía visual dominante**: es una estación más entre cuatro, sin destacar como el objetivo principal del Refugio.
3. **Zonas periféricas infrautilizadas**: esquinas superiores y bordes laterales con poca actividad.
4. **NPC armero al mismo nivel Y que el jugador**: puede quedar oculto por props o por el propio jugador según la posición (Y-sort).
5. **Sin distinción entre "zona de paso" y "zona de estancia"**: los sofás y el banco están en el centro de tránsito.

---

## 6. Plano esquemático del Refugio actual (texto)

```
        MURO NORTE (gótico, nichos, pilastras cada 320)
  x:260 ───────────────────────────────────────────── x:1500
     │  [estantería] [estantería]  [barra]   [parlante]   [cabinaDJ]  [subwoofer]  [palma]
     │      (430,245)  (560,245)   (740,278)  (1035,255)   (1165,278)  (1305,265)   (1415,295)
     │                                                         [DJ Virgilio]
     │                                                        (1165,335) r105
     │                           [farol dorado]                      [farol dorado]
     │                           (650,215)                         (1110,215)
     │
     │      [sofa]      [banco]      [sofa]                          [mapa]
     │     (745,470)   (880,488)   (1015,470)                    (1345,605) r95
     │       [butaca]                            [butaca]
     │     (635,545)                          (1125,545)
     │
     │  [nevera]             [candelabro]                    [candelabro]
     │  (325,280)            (675,410)                       (1085,410)
     │
     │  [expendedora]  [arcade]  [cofre]                  [armero]
     │  (355,515)  (355,655) (455,565)                  (432,505) r—
     │                     [ARMÉRIA]                       (415,535) r95
     │     (415,535)
     │
     │                       [PROTAGONISTA spawn]
     │                        (880,615)
     │
     │                          [DESCENSO]
     │                         (880,785) r96
     │                      "PLATAFORMA DE DESCENSO"
     │
     │                          [planta]            [planta]
     │                       (1425,745)          (335,845)
     │
     │  [pezuestal]                                                          (1365,585)
  x:260 ───────────────────────────────────────────── x:1500
        MURO SUR (abierto, sin estructura definida)
```

- `rXX` = radio de activación de estación.
- Spawn y descenso comparten la misma X (880): eje vertical central.
- Área transitable: interior del rectángulo menos márgenes (38 X, 62 Y).
- Pushout circular alrededor de cada prop (radio `br*0.72+18`).

---

## 7. Propuesta de distribución alternativa (síntesis, detalle en 06_PROPOSED_LAYOUT.md)

Se propone mantener la sala 1240 × 760 y reorganizar la jerarquía visual:
- **Eje central visual** desde el spawn (880,615) hacia la plataforma de descenso (880,785), reforzado con iluminación/selectividad.
- **Plataforma de descenso** como ancla dominante del centro-inferior.
- **Estaciones de preparación** (armería, mapa, DJ) en los laterales, formando un triángulo de preparación alrededor del eje central.
- **Zona de estancia** (sofás, banco) retirada del centro de tránsito hacia un lateral.

Se detalla en `06_PROPOSED_LAYOUT.md`.

---

## 8. Conclusión espacial

El Refugio tiene un **tamaño adecuado** para una zona segura de una sola sala: ni demasiado pequeño (suficiente área transitable) ni demasiado grande (fácil de recorrer en pocos segundos). Los problemas no son de escala sino de **jerarquía, orientación y distribución funcional**: falta un camino claro hacia la plataforma de descenso, esta no domina visualmente, y algunas zonas periféricas están infrautilizadas. Se recomienda **reorganizar** (no ampliar) antes de considerar un cambio de dimensiones.
