# FASE 03 — MAPAS CONCEPTUALES
# 9 PISTAS + REFUGIO · 2026-11-12

**Autoridad:** Fichas Pistas + Refugio + Biblia §6.2 (8–12 nodos, 4–5 capas, 2–3 rutas, tienda/curación/armería garantizadas)  
**Escala:** Cada nodo = 1 sala jugable (~480×640 canvas, 12×9 tiles isométricos). Capas = profundidad vertical (norte→sur).  
**Símbolos:** `S` Spawn/entrada · `C` Combate · `T` Tienda · `H` Curación · `$` Tesoro · `A` Armería (Afinación) · `P` Pacto · `?` Secreta · `★` Jefe · `●` Fragmento/vitrina/altavoz (según pista) · `—` Ruta principal · `··` Alternativa · `↑` Verticalidad

---

## PISTA 01 — LA INVITACIÓN (8 nodos, 4 capas, 2 rutas)

```
Capa 1 (Entrada)          S
                           \
Capa 2 (Elección)      C01 — — C02
                         \     \
Capa 3 (Corazón)        C03 — ★ C04  (★ = sala corazón roto central, 2 fases Véspera)
                           \     \
Capa 4 (Véspera)            T — — H — — $ — — A
                               \         \
                                —————————— ★ VÉSPERA
```

- **Nodos:** 8 (S, C01-04, T, H, $, A, ★)
- **Rutas:** Izquierda (C01→C03→T) segura con curación; derecha (C02→C04→$) corta con arma.
- **Verticalidad:** Desniveles alfombra 12px (no colisión), balcones decorativos en C02/C04.
- **Interactivo:** Cortinas rosas en C01/C03 (rasgar → secreto Archivo).
- **Garantizado:** T+H+A sí (grafo siempre genera 1 de cada si ruta viable).

---

## PISTA 02 — EL BANQUETE (9 nodos, 4 capas, 3 rutas)

```
Capa1  S — — C01 (mesa larga 2:1)
          \     |      \
Capa2   C02 — — C03 — — C04  (C04 = horno con mano curativa)
             \     \      \
Capa3        T — — H — — $ — — C05 (bandejas móviles)
                \    \
Capa4              ———— ★ VORAZ (horno ventral)
```

- **Nodos:** 9. Mesas como barreras horizontales (pasillos 100px).
- **Rutas:** Centro (C01→C03→$) balanceada; izq (C02→T) con curación; dcha (C04→C05→H) con trampas rápidas pero tienda.
- **Verticalidad:** Hornos +18px, mesas no elevadas.
- **Secreto:** Horno apagado tras C05 detenido → Portero.

---

## PISTA 03 — CÁMARA INSTANTES (10 nodos, 5 capas, 2 rutas)

```
Capa1  S — — C01 — — C02
              \      \
Capa2      C03 — — ● — — C04   (● = caja fuerte central 4×4 vitrinas)
             \     | \      \
Capa3      H — — $ — — $ — — C05
              \     \       \
Capa4          T — — A — — C06
                 \
Capa5              ——— ★ ÁUREA (trono relojes)
```

- **Nodos:** 10. Grid ortogonal; vitrinas como muros Reflectantes.
- **Rutas:** Externa (C01→C03→H→T) segura con tienda; interna (C02→●→$→A) con caja fuerte + 2 secretos.
- **Verticalidad:** Vitrinas 32px cover alto.
- **Secretos:** Vitrina junta iluminada → Archivo; caja fuerte → arma alternativa.

---

## PISTA 04 — AMPLIFICACIÓN (9 nodos, 4 capas, 3 rutas)

```
Capa1       S
           /|\
Capa2  C01 — C02 — C03  (cada C con altavoz en punta)
        \  / \  / \  /
Capa3    C04 — T — C05  (T entre conos, C04/C05 con cables)
            \  |  /
Capa4         ★ BRAMA (escenario hundido -24px)
```

- **Nodos:** 9 en estrella. Conos presión cruzan diagonales.
- **Rutas:** Escenario central directo con 2 altavoces; camerinos laterales con 1 altavoz c/u + cables cortables.
- **Verticalidad:** Escenario -24px + pasarela técnica +24px (balcón observación conos).
- **Interactivo:** Altavoces destructibles → zona incendiada; cables cortables.

---

## PISTA 05 — NOTA AUSENTE (10 nodos, 5 capas, cruz latina, 2 rutas)

```
         C01 (nave norte)
          |
    C02 — S — C03
          |     \
    H — — C04 — C05 — C06 (órgano)
          |     \
    T — — C07 — $ — — ★ OBISPO (confesionario -12px)
          |
    ? Archivo (diapasones)
```

- **Nodos:** 10 en cruz latina. Nave central alta, laterales bajas.
- **Rutas:** Nave central directa con diapasones; laterales oscuras sin órgano pero con afinadores patrulla.
- **Verticalidad:** Coro +24px, confesionario -12px.
- **Mecánica:** Diapasones revelan nota ausente; órgano abre atajo.

---

## PISTA 06 — UMBRAL ENCADENADO (8 nodos, 3 capas, masa)

```
Capa1  S — C01 — C02  (ante-sala sur, 2 salas)
            \      \
Capa2      C03 — C04 — C05 — C06  (sala-búnker 4 nodos interconectados, tambor central)
                 \      |      \
Capa3              C07 — — ★ CORAZÓN (ante-sala norte, puerta blindada)
```

- **Nodos:** 8 (menos que otras: masa, no laberinto). Sala-búnker es 60% del contenido.
- **Rutas:** Realmente 2: sur → búnker → norte. Dentro del búnker 4 nodos son malla abierta (elige orden).
- **Verticalidad:** Búnker 2 alturas (0 y +18px pasarela mantenimiento).
- **Interactivo:** Tambor (3 golpes abre cadena) + 4 cadenas destructibles.

---

## PISTA 07 — SALÓN MIL VOCES (10 nodos, 5 capas, diamante espejado)

```
         C01 (entrada casino)
        /   \
Capa2  C02 — C03 (espejos rombo)
      / \  / \  \
Capa3 C04 — $ — C05 (palcos +18px)
     / \  / \  / \
Capa4 C06 — T — H — C07 (mesa central ● = ruleta)
     \  \ /  /  /
Capa5    ★ CRUPIER (camerinos)
```

- **Nodos:** 10 rombo/diamante. Palcos elevados +18px, camerinos -12px.
- **Rutas:** Centro (mesa) engaño máximo; laterales palcos/camerinos seguras pero con espejos ocultos.
- **Mecánica:** Vocal falsa vs suelo; espejos rompibles revelan rutas reales.

---

## PISTA 08 — ANDÉN AUSENTE (9 nodos, 4 capas, 3 vías)

```
Capa1  S — — C01 (andén central)
          \      \
Capa2   C02 — — C03 — — C04  (C04 = vía con tren lineal)
           \      \      \
Capa3     T — — H — — C05 — — $ (velos blancos)
              \
Capa4           ★ NIX (línea divisoria cian)
```

- **Nodos:** 9. 3 vías rectas: central (directa con trenes), laterales elevadas (+12px sin trenes, con velos).
- **Verticalidad:** Andenes +12px vs vías -8px = 20px desnivel; trenes solo en vías.
- **Mecánica:** Memoria proyectiles + línea divisoria + tren hazard lineal.

---

## PISTA 09 — NÚCLEO (6 nodos, 5 capas, lineal fragmentado)

```
Capa1  S (fragmentos P01-04 flotando)
        |
Capa2  C01 — — ● (anclaje 1, P05-06)
        |
Capa3  C02 — — ● (anclaje 2, P07-08)
        |
Capa4  C03 — — ● (anclaje 3)
        |
Capa5  ★ REY DEL COMPÁS (3 fases: Espejo → Corona → Última Vuelta)
        |
     VACÍO BLANCO (suelo final) + corona/cadena finales
```

- **Nodos:** 6 (menos es más). Fragmentos son salas reconstruidas de run (cada anclaje roto quita 1 capa).
- **Verticalidad:** Fragmentos flotantes 20–40px como plataformas temporales (caen en 2s).
- **Rutas:** Lineal intencional — es examen, no laberinto.

---

## REFUGIO — MAPA CONCEPTUAL (1 sala, no grafo)

```
                    N (Tempo / Ventanas / Archivo)
                    ┌─────────────────────┐
                    │  [Ventanas]         │
                    │  [Mesa mezclas] [Archivo] [Tocadiscos] │
                    │  ┌── Bar ──┐      ┌ Cabina Tempo ─┐ │
                    │  │  Latón  │      │   Zorro neón  │ │
                    ├─────────────────────┤ │
                    │  Sofá magenta ·   · Sofá magenta  │ │
                    │      ┌ Bench ┐      │  Pedestal Mapa│ │
                    │  [Espejo]   [Sofás]│               │ │
                    │  Armería    Plataforma cian (des)  │ │
                    │   [Chest]     880,785               │ │
                    └─────────────────────┘
                              S (Descenso a P01)
```

- **Bounds:** 260,210,1240×760. 1 sala con 4 cuadrantes; plataforma sur es salida.
- **Transición:** Plataforma apertura circular 260·shaftOpen → 5 planos parallax → P01.

---

## LEYENDA TÉCNICA

- **Entrada/Salida:** `CIRCLE_CONFIG[idx]` determina suelo/muro/pilar/haze. S siempre en `HUB` o puerta previa.
- **Garantía Biblia §6.2:** Si grafo puede generar ruta válida, 1 tienda + 1 curación + 1 armería aparecen. Si no, no (no se fuerza grafo imposible).
- **Verticalidad funcional:** +12/+18/+24px balcones = rutas alternativas; -8/-12/-24px fosos = hazards visuales, no colisión distinta salvo trenes (P08) y puerta cadenas (P06).
- **Secretos:** Siempre desde `C` (combate) ramificado, nunca desde `S` o `★` (no bloquear progresión).
