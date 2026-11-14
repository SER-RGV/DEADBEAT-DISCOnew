# 05_CURRENT_LAYOUT.md — Plano actual del Refugio (estado actual)

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **solo auditoría y propuesta** — sin modificaciones destructivas, sin rediseño visual, sin nuevos assets.

---

## 1. Dimensiones del espacio actual

| Magnitud | Valor | Unidad |
|----------|-------|--------|
| Límites del mapa (`HUB_BOUNDS`) | x:260, y:210, w:1240, h:760 | unidades de mundo |
| Mundo X | 260 → 1500 | unidades de mundo |
| Mundo Y | 210 → 970 | unidades de mundo |
| Área total | 1240 × 760 | unidades de mundo (≈ 942.400 u²) |
| Área transitable efectiva (antes de pushout) | ~1164 × 684 | unidades de mundo |
| Spawn protagonista | 880, 615 | unidades de mundo |
| Velocidad | 285 | unidades/segundo |
| Plataforma de descenso | 880, 785, radio 96 | unidades de mundo |
| Zoom de cámara | 1.02 – 1.6 | factor |
| Cache de sala | 1800 × 1180 | píxeles de pantalla |

---

## 2. Plano esquemático del Refugio actual (vista cenital, texto)

Escala aproximada: cada carácter ≈ 40 unidades de mundo. Norte arriba.

```
        MURO NORTE — gótico, nichos y pilastras (cada 320)
  x:260 ┌─────────────────────────────────────────────────────┐ x:1500
        │ [E] [E]      [Barra]   [Parlante] [Cabina DJ] [Sub] [Palma]   x
        │(430,245)(560,245)  (740,278)(1035,255)  (1165,278)(1305,265)(1415,295)
        │                                              [DJ Virgilio]
        │                                             (1165,335) r105
        │                          [Farol]                     [Farol]
        │                         (650,215)                   (1110,215)
        │
        │      [Sofá]      [Banco]      [Sofá]                       [Mapa]
        │     (745,470)   (880,488)   (1015,470)                   (1345,605) r95
        │       [But]                              [But]
        │     (635,545)                          (1125,545)
        │
        │  [Nevera]        [Can]                    [Can]
        │  (325,280)       (675,410)                (1085,410)
        │
        │  [Exp]  [Arcade] [Cofre]                  [Armero]
        │  (355,515)(355,655)(455,565)              (432,505)
        │                   [ARMERÍA]               (415,535) r95
        │    (415,535) r95
        │
        │                      [ PROTAGONISTA ]
        │                       spawn (880,615)
        │
        │                       [ DESCENSO ]
        │                      (880,785) r96
        │                "PLATAFORMA DE DESCENSO"
        │
        │                       [Planta]          [Planta]
        │                     (1425,745)        (335,845)
        │
        │                      [Pezuestal]
        │                    (1365,585) r40
  x:260 └─────────────────────────────────────────────────────┘ x:1500
        MURO SUR — abierto, sin estructura definida

E = estantería  Exp = expendedora  Arcade = máquina arcade  Can = candelabro
But = butaca  Sub = subwoofer  Palma = palma neón
```

**Clave de estaciones (radio de activación):**
- `DESCENSO` (880,785) r96 — iniciar incursión (Círculo I · Lujuria)
- `ARMERÍA` (415,535) r95 — inventario y tienda (120 armas)
- `MAPA` (1345,605) r95 — Torre de los 9 Círculos
- `DJ` (1165,335) r105 — diálogo con DJ Virgilio

**NPCs (Y-sort, altura en mundo):**
- DJ Virgilio (1165, ~268) h118 — `npc_dj_booth_world` (fallback `dialogue_portrait_dj`)
- Bartender (740, ~262) h102 — `npc_bartender_hub`
- Armero (432, ~505) h104 — `npc_armorer_hub`

---

## 3. Estructura funcional actual

| Zona | Función | Ubicación | Elementos |
|------|---------|-----------|-----------|
| Zona de llegada / spawn | Aparición y orientación | Centro-sur (880,615) | Protagonista, diálogo DJ de bienvenida |
| Zona central / lounge | Estancia y tránsito | Centro | Sofás, banco, butacas, candelabros, faroles |
| Zona de preparación izquierda | Armería / equipamiento | Izquierda-media | Armería (415,535), nevera, expendedora, arcade, cofre |
| Zona de preparación derecha | Información / música | Derecha | Mapa (1345,605), DJ (1165,335), cabina DJ, parlante, subwoofer |
| Zona de salida | Acceso a incursiones | Centro-inferior | Plataforma de descenso (880,785) |
| Zona arquitectónica | Enmarcado del espacio | Norte (muro) | Nichos góticos, pilastras, mural Zorro Neón (derecha) |

---

## 4. Recorridos habituales del jugador

1. **Spawn** en (880,615) → diálogo de bienvenida del DJ.
2. **Opción A (preparación)**: caminar a Armería (415,535) y/o Mapa (1345,605) y/o hablar con DJ (1165,335).
3. **Opción B (salida)**: caminar a Plataforma de Descenso (880,785) → `[E]/(A)` → `exitToRun()` → cinemática de descenso → incursión.
4. **Regreso** tras incursión → reaparece en spawn (880,615).

El recorrido más frecuente es **spawn → preparación → descenso**, siendo el descenso el punto final de cada visita.

---

## 5. Coordenadas relevantes (tabla de referencia)

| Elemento | X | Y | Radio / tamaño | Nota |
|----------|---|---|----------------|------|
| Límite izquierdo | 260 | — | — | HUB_BOUNDS.x |
| Límite derecho | — | — | 1500 | x + w |
| Límite superior | — | 210 | — | HUB_BOUNDS.y |
| Límite inferior | — | — | 970 | y + h |
| Spawn | 880 | 615 | — | Protagonista |
| Plataforma de descenso | 880 | 785 | r96 | Estación "descent" |
| Armería | 415 | 535 | r95 | Estación "armory" |
| DJ Virgilio | 1165 | 335 | r105 | Estación "dj" |
| Mapa astral | 1345 | 605 | r95 | Estación "map" |
| Mural Zorro Neón | ≈1382 | ≈360 | 112×148 | Firma visual derecha |
| Farol izquierdo | 650 | 215 | 136×136 | Techo |
| Farol derecho | 1110 | 215 | 136×136 | Techo |

---

## 6. Observaciones del plano actual

- Es una **sala única, abierta, sin habitaciones ni pasillos**.
- Spawn y descenso comparten la misma X (880): forman un **eje vertical central** natural, pero no está reforzado visualmente.
- Las cuatro estaciones están en los cuatro "lados" del espacio, evitando el hacinamiento.
- La zona central (sofás, banco) está en medio del tránsito entre spawn, armería y descenso.
- Las esquinas superiores izquierda y derecha están relativamente desiertas.
- No hay señalización visual permanente ni camino marcado que guíe al jugador hacia la plataforma de descenso desde cualquier punto.

---

## 7. Limitación de capturas

No se ha podido ejecutar el juego para tomar capturas de pantalla reales del Refugio en ejecución (motor Canvas 2D con carga de imágenes bajo `file://`/servidor local no verificado en este entorno). Conforme a las reglas de trabajo, **no se simulan resultados ni se presentan capturas estáticas como prueba de fluidez**. Los planos arriba son esquemáticos derivados del código (`src/dd_hub_system.js`), que es la fuente de verdad del estado actual.

Cuando se disponga de un entorno de ejecución, se deberán tomar las capturas listadas en `08_QA_REPORT.md` y archivarlas en `docs/HUB_AUDIT/capturas/`.
