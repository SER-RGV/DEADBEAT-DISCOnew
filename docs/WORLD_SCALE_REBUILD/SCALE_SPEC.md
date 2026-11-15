# FASE 08 · SCALE_SPEC — Escala intermedia (valores elegidos)

Fuente de verdad en código: `src/dd_world_scale.js` (`window.DD_SCALE`), perfil
`intermedia`. El perfil `legacy` deja todo a 1 y la cámara nueva apagada
(reproduce la build anterior; `?scale=legacy` o
`localStorage.dd_scale_profile = "legacy"`).

## 1. Principio

* La escala es **visual y de mapa**: multiplica la altura de la figura dibujada
  y el tamaño de la sala. **No** multiplica radios de colisión, alcances,
  velocidades, radios de explosión ni distancias de recogida (ver
  `COLLISION_AUDIT.md`).
* Todos los factores son relativos a lo que había (×1 = build anterior) y
  dentro de los rangos pedidos. Se eligió el tramo **bajo-medio** de cada rango
  para no perjudicar la legibilidad en multitud ni la lectura de las salas.

## 2. Entidades

| Categoría | Rango pedido | **Factor** | Figura antes → después (px mundo) |
|---|---|---|---|
| Jugador | 1,15–1,25 | **1,18** | 104 → 122,7 |
| Enemigo normal: security | 0,95–1,15 | **1,06** | 94 → 99,6 |
| Enemigo normal: dancer | 0,95–1,15 | **1,04** | 90 → 93,6 |
| Enemigo rápido: fanatic | 0,85–1,05 | **0,98** | 80 → 78,4 |
| Enemigo rápido: drone | 0,85–1,05 | **0,95** | 90 → 85,5 |
| Enemigo pesado: chef (tanque) | 1,35–1,60 | **1,36** | 106 → 144,2 |
| Élite | 1,40–1,80 | **1,42** | 100 → 142,0 |
| Minijefe (marca `mini`) | – | ×**1,12** adicional sobre su familia | p.ej. chef mini r=26: ≈ 190 → 290 |
| Jefes (genérico) | 2–3 × jugador | **1,28** | 178–204 → 228–251 (≈ 1,9–2,05 × jugador nuevo, 2,2–2,4 × el antiguo) |
| `boss_09_nucleo` | | 1,22 | 204 → 248,9 (tope de recorte de hoja) |
| `boss_08_traidor` | | 1,24 | 200 → 248,0 |
| Objetos (pickups) | 1,10–1,20 | **1,15** | 44 → 50,6 (cofres 82 sin cambio) |
| Arma en mano | sigue al jugador | 1,18 | `ut.h` 95 → 112,1 **sólo durante el dibujo** |

Los jefes quedan por debajo del "3×" del rango a propósito: con 1,28 un
residente ya mide 2× el protagonista nuevo y no se recorta en arenas de
1480 px de alto a zoom 0,84; subirlo más obligaría a alejar la cámara y
devolvería al jugador al tamaño anterior (se documenta como decisión, ver §5).

## 3. Salas (ver `MAP_SCALE_SPEC.md`)

| Clase | Factor | Nota |
|---|---|---|
| entrada (ranura 0) | 1,10 | ya forzada a ≥1600×820 |
| combate (resto) | 1,18 | |
| tienda | 1,00 | fija 1040×780, no se toca |
| minijefe (ranura 5) | 1,28 | |
| arena de residente (ranura 10) | 1,40 | |
| final (nivel 99) | 1,40 | |

Topes del motor **sin cambio**: `w ≤ 1980`, `h ≤ 1480`, múltiplos de 20 px.

## 4. Cámara (ver `CAMERA_SPEC.md`)

Zoom de referencia a 1080p: calma 1,08 · combate 0,98 · multitud 0,88 ·
jefe ≥ 0,84; rango [0,80, 1,12]. Escalado por `viewH/1080` para mantener el
campo vertical constante entre 1920×1080, 1600×900 y 1280×720.

Tamaño en pantalla resultante a 1080p (calma 1,08): jugador ≈ 133 px (antes 83),
enemigo normal ≈ 100–108 px (antes 72–75), tanque ≈ 156 px, jefe (zoom 0,84)
≈ 205 px (antes 150), pickup ≈ 55 px (antes 35).

## 5. Decisiones y desviaciones documentadas

* **Jefes 1,28 (no 2–3× sobre el jefe antiguo)**: el rango pedido se lee como
  "2–3 veces el jugador"; se cumple (2,0×). Escalar la figura ×2 haría 400 px de
  mundo y exigiría arenas > 1480 px.
* **Rápidos < 1**: fanatic 0,98 y drone 0,95 para que la jerarquía
  rápido < normal < pesado < élite se lea aunque todos crezcan en pantalla por
  el zoom.
* **Salas al tope**: con ×1,18 muchas salas de combate llegan a 1480 de alto
  (tope del motor). Es intencionado: las salas ya no caben enteras en pantalla
  y la cámara recorre; no se amplía el mundo (2500×1850) para no tocar el
  cacheado del suelo ni el minimapa.
