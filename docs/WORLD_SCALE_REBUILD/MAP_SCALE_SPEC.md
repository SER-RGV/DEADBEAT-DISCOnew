# FASE 08 · MAP_SCALE_SPEC — Salas: clasificación y ampliación por función

## 1. Dónde se decide el tamaño

Un único punto: `ng(index, shop)` del motor (offset 3317412 del ORIGINAL).
Orden original: forma por ranura → tamaño base de la forma → azar
(×0,86–1,14 / ×0,88–1,12, múltiplos de 20) → mínimos de minijefe/jefe/final
(1480×1040) → **topes 960–1980 × 700–1480** → mínimo de entrada (1600×820).

Parche Fase 08 (`tools/build_active_html.py`, bloque `1e(b)`): justo después
de ese acotado y antes de construir el polígono,

```
if (DD_SCALE && DD_SCALE.scaledRoomSize) {
  sz = DD_SCALE.scaledRoomSize(w, h, { index:t, slot:n, boss: n===5||n===10||t===qe, first: n===0, final: t===qe });
  w = sz.w; h = sz.h;
}
```

`scaledRoomSize` multiplica cada eje por el factor de clase, **vuelve a acotar a
los mismos topes del motor** (1980×1480) y redondea a múltiplos de 20. La tienda
sale de `ng` antes (return propio) y no pasa por aquí.

Como la sala siempre se centra en el mundo (`Os`), los puntos del polígono se
calculan en coordenadas normalizadas × `w,h`, y puertas (`fd`), atrezo, spawns
y navegación se generan **después** a partir del rect/polígono final, nada de
eso necesita cambios: no quedan vacíos ni elementos fuera de la sala.

## 2. Clasificación

| Clase | Cómo se detecta | Factor | Ejemplo medido |
|---|---|---|---|
| `entrance` (transición / primera) | ranura 0 | 1,10 | nivel 1: 1600×1020 → 1760×1120 |
| `combat` (normal/combate) | resto de ranuras | 1,18 | nivel 2 `l-wing`: ≈1380×1260 → 1620×1480 (tope en alto) |
| `shop` (especial / refugio de compra) | `shop` | 1,00 | 1040×780 (sin cambio) |
| `miniboss` (especial) | ranura 5 | 1,28 | ≥1480×1040 → ≤1900×1340 |
| `boss` (arena) | ranura 10 | 1,40 | ≥1480×1040 → 1980×1460 (tope en ancho) |
| `final` (arena final) | nivel 99 | 1,40 | ídem |

No existen "pasillos" como clase propia en el generador: la forma más apaisada
de cada recorrido (p. ej. `wide` 1600×820) hace de pasillo; la sonda la captura
como `corridor`. El Refugio (HUB) no pasa por `ng` y no se toca.

## 3. Efecto en el resto de sistemas

* **Validador de layout** (`w ≤ E && h ≤ k`): se respeta (topes ≤ 1980×1480 < 2500×1850).
* **Franja de muro**: la sala más grande (1980×1460) deja 260 px a cada lado y
  195 px arriba/abajo; el `roomMargin` de la cámara (240/280/220) se ha elegido
  para no enseñar más vacío que esa franja.
* **Minimapa**: dibuja a escala `M.width/E`, las salas salen proporcionalmente
  mayores; sin código nuevo.
* **Suelo cacheado** `qc()`: 2500×1850, sin cambio.
* **Director / spawns / navegación**: usan el rect/polígono final; sin cambio.
* **Tiempo de recorrido**: con `speed 200` cruzar una sala de combate pasa de
  ≈7 s a ≈8 s de media; se acepta dentro del rango pedido (1,20–1,40).

## 4. Pendiente / no ejecutado

* No se han redistribuido a mano columnas u obstáculos por sala (el generador
  los reparte por densidad; en las capturas DESPUÉS no aparecen huecos).
* Las salas de tienda y el HUB quedan al tamaño original por diseño.
