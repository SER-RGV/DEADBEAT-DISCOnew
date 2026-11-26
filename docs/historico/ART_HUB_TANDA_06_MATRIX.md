# HUB · TANDA 06 — Matriz de validación

Veredicto **APROBADO** · 14/14 · 2026-11-04T01:53:30.096319+00:00

| # | Comprobación | Estado |
|---|---|---|
| 1 | Carga de los 10 recursos: load(), registro V5, tamaño exacto y 0 errores de loader | **APROBADO** |
| 2 | Visibilidad: 10/10 drawImage medidos en el canvas de mundo 1280x900 con caja en pantalla | **APROBADO** |
| 3 | Orientación espacial: caras SUR/ESTE/OESTE/INFERIOR/SUELO y planos correctos | **APROBADO** |
| 4 | Perspectiva: proyección ortográfica 2.5D real, sin isometría impuesta ni cambio de cámara | **APROBADO** |
| 5 | Continuidad de paredes/estructuras: 0 huecos en el muro norte y en las aristas laterales | **APROBADO** |
| 6 | Escala relativa: aspecto del PNG conservado, sin estirar ni deformar | **APROBADO** |
| 7 | Anclajes: cajas mundo medidas iguales al manifiesto, dentro del octógono real | **APROBADO** |
| 8 | Orden de capas: cola Y-sort compartida, 0 dibujos en menú, 0 canvas nuevos | **APROBADO** |
| 9 | Oclusión: jugador/arquitectura/decoración en la misma cola de profundidad | **APROBADO** |
| 10 | Transparencias: alfa real, bordes limpios, sin halos blancos ni franjas | **APROBADO** |
| 11 | Movimiento: idéntico con el flag activado y desactivado | **APROBADO** |
| 12 | Colisiones: sin cambios de hitbox, auditoría del HUB idéntica en las 3 fases | **APROBADO** |
| 13 | Puertas y estaciones: sala r23, 11 estaciones y modal sin regresión | **APROBADO** |
| 14 | Regresión T01–T05: 10/10, 10/10, 13/13, 10/10, 152 claves base y cachés intactas | **APROBADO** |

## Clasificación

- `APROBADO`: ejecutado y medido conforme (14).
- `FALLIDO`: ejecutado y no conforme (0).
- `BLOQUEADO`: no ejecutable por dependencia externa (0, en esta tanda).
- `NO VERIFICADO`: fuera de alcance explícito (0).

## Cobertura por asset

| Asset | Recurso | Cara / plano | Caja mundo | Repeticiones | drawImage | Zonas completas | Señal OFF/ON | Ruido OFF/OFF | Alfa |
|---|---|---|---|---|---|---|---|---|---|
| T06-01 | Fachada norte · tramo A | SUR (+Y) | `500,180,362,150` | 0 | 133 | 2 | 66.294 % | 0.685 % | APROBADO |
| T06-02 | Fachada norte · tramo B | SUR (+Y) | `862,180,504,150` | 0 | 298 | 6 | 52.051 % | 0.569 % | APROBADO |
| T06-03 | Fachada norte · tramo C | SUR (+Y) | `1366,180,490,150` | 0 | 298 | 6 | 50.363 % | 1.992 % | APROBADO |
| T06-04 | Machón de esquina NO→SE | NO→SE (inglete 45°) | `536,180,128,150` | 0 | 133 | 2 | 75.696 % | 0.845 % | APROBADO |
| T06-05 | Machón de esquina NE→SO | NE→SO (inglete 45°) | `1845,180,111,150` | 0 | 255 | 4 | 59.004 % | 0.783 % | APROBADO |
| T06-06 | Paramento oeste (cara ESTE) | ESTE (+X) | `277,780,107,380` | 2 | 383 | 6 | 52.937 % | 1.739 % | APROBADO |
| T06-07 | Paramento este (cara OESTE) | OESTE (-X) | `2129,780,83,380` | 2 | 1013 | 8 | 46.047 % | 1.08 % | APROBADO |
| T06-08 | Viga / casetón de techo | INFERIOR | `991,240,518,90` | 0 | 298 | 7 | 44.457 % | 0.558 % | APROBADO |
| T06-09 | Cortinaje de cornisa | FRONTAL | `1817,200,96,230` | 0 | 711 | 6 | 67.377 % | 0.221 % | APROBADO |
| T06-10 | Zócalo de asiento (cenital) | SUELO (cenital) | `1090,322,321,36` | 0 | 376 | 7 | 10.934 % | 0.02 % | APROBADO |

## Secuencia A/B reversible

| Paso | Flag | Resultado medido |
|---|---|---|
| ANTES (10 zonas) | `false` antes del boot | 0 `drawImage` T06 |
| CONTROL OFF_A / OFF_B (6 zonas) | `false` | ruido de frame `1.992 %` |
| CONTROL ON (6 zonas) | `true` (en caliente) | `895` draws T06, señal `10.934–75.696 %` |
| `hub6Restore()` | — | 10 → 0 registrados |
| `hub6Apply()` | — | 0 → 10 registrados |
| DESPUÉS (10 zonas) | activo por defecto | 10/10 recursos, 14/14 cajas mundo |

## Ámbito del cambio

Solo `DEADBEAT_DISCO.ART.html` y `ART_PACK/art_pack.js` (2 archivos del juego).
Sin cambios de cámara, proyección, geometría general, colisiones, puertas,
estaciones, guardado, audio ni T01–T05. Evidencia: `diff_scope.json`,
`integridad_t01_t05.json`, `hashes.json`.
