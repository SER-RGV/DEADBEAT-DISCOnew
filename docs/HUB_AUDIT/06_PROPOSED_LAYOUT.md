# 06_PROPOSED_LAYOUT.md — Propuesta de distribución alternativa del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **propuesta únicamente** — no implementar sin aprobación. Sin nuevos assets hasta aprobación.

---

## 1. Premisa de diseño

El tamaño actual del Refugio (1240 × 760 unidades) es **adecuado** para una zona segura de una sola sala. El problema no es la escala, sino la **jerarquía visual y la orientación**: falta un camino claro hacia la plataforma de descenso, esta no domina visualmente, y algunas zonas periféricas están infrautilizadas.

**Decisión clave:** no ampliar el escenario. Reorganizar lo existente dentro de los mismos límites (1240 × 760), conservando todos los assets reutilizables.

---

## 2. Dimensiones recomendadas

| Magnitud | Valor recomendado | Justificación |
|----------|-------------------|---------------|
| Límites del mapa | Mantener 1240 × 760 (x:260, y:210) | Área transitable suficiente (~1164 × 684); no hay necesidad de más espacio |
| Spawn | Mantener (880,615) | Eje central ya funcional |
| Plataforma de descenso | Mantener (880,785), radio 96 | Ancla de salida; reforzar visualmente, no mover |
| Estaciones | Mantener radios 95–106 | Funcionales; ajustar posiciones para jerarquía |
| Área transitable | ~1164 × 684 | Suficiente para un protagonista (drawH 112) a 285 u/s |

**No se recomienda cambiar el tamaño del fondo ni del área jugable.** Cualquier cambio de dimensión requeriría rehacer el cache de sala (1800×1180), el clamp de cámara y el posicionamiento de todos los props.

---

## 3. Distribución recomendada (plano esquemático propuesto)

```
        MURO NORTE — gótico, nichos, pilastras
  x:260 ┌─────────────────────────────────────────────────────┐ x:1500
        │ [E] [E]   [Barra]   [Parlante] [CabinaDJ] [Sub] [Palma]
        │ (430,245)(560,245) (740,278)(1035,255) (1165,278)(1305,265)(1415,295)
        │                                              [DJ Virgilio]
        │                                             (1165,335) r105
        │                          [Farol]              [Farol]
        │                         (650,215)            (1110,215)
        │
        │      [Sofá]   [Banco]   [Sofá]                   [Mapa]
        │     (745,470)(880,488)(1015,470)                (1345,605) r95
        │       [But]                         [But]
        │     (635,545)                      (1125,545)
        │
        │  [Nevera]   [Can]                  [Can]
        │  (325,280) (675,410)              (1085,410)
        │
        │  [Exp] [Arc] [Cofre]               [Armero]
        │  (355,515)(355,655)(455,565)        (432,505)
        │             [ARMERÍA]               (415,535) r95
        │    (415,535) r95
        │
        │                      [ PROTAGONISTA ]
        │                       spawn (880,615)
        │                        ▲
        │                        │ eje de descenso (iluminación diferencial)
        │                        ▼
        │                 [ DESCENSO ● ]
        │                (880,785) r96
        │          "PLATAFORMA DE DESCENSO" — jerarquía dominante
        │
        │                       [Planta]      [Planta]
        │                     (1425,745)    (335,845)
        │
        │                      [Pezuestal]
        │                    (1365,585) r40
  x:260 └─────────────────────────────────────────────────────┘ x:1500
```

**Cambios propuestos (reorganización, sin mover el descenso ni el spawn):**
1. **Eje de descenso reforzado:** iluminación/selectividad visual en el tramo vertical entre spawn (880,615) y descenso (880,785) para que el jugador entienda adónde ir.
2. **Plataforma de descenso como ancla dominante:** diferenciarla visualmente de las otras tres estaciones (iluminación cian del pad, anillo más marcado, posible alfombra de acceso).
3. **Zona de estancia retirada del centro de tránsito:** los sofás y el banco pueden desplazarse ligeramente hacia un lateral para liberar el eje central.
4. **Triángulo de preparación:** armería (izquierda), mapa (derecha), DJ (arriba-derecha) forman un triángulo alrededor del eje central, sin bloquear el paso al descenso.

> Este plano es un **esquema de propuesta**. Las coordenadas exactas de cualquier movimiento de prop se definirían tras aprobación y con verificación visual de los assets.

---

## 4. Jerarquía visual recomendada

Orden de legibilidad para el jugador:

1. **Protagonista** — spotlight + halo cálido, Y-sort, drawH 112. Debe ser siempre identificable.
2. **Plataforma de descenso** — objetivo principal; diferenciar con iluminación cian y anillo de interacción destacado.
3. **Estaciones principales** (armería, mapa, DJ) — anillos elípticos, prompt `[E]/(A)`, radios 95–106.
4. **Personajes interactivos** (DJ, bartender, armero) — Y-sort, alturas 102–118, nombres/etiquetas cercanas.
5. **Elementos decorativos** (sofás, faroles, mural zorro, plantas) — sin competir con los 4 niveles superiores.

Regla: ningún elemento decorativo debe superponerse visualmente con la plataforma de descenso ni ocultar el protagonista desde el spawn.

---

## 5. A. Qué conservar (ya funcionan)

| Elemento | Motivo |
|----------|--------|
| Límites del mapa 1240 × 760 | Área transitable suficiente; no hay que rehacer cache ni cámara |
| Spawn (880,615) | Funcional; eje central con descenso |
| Plataforma de descenso (880,785, r96) + `threshold_descent_pad` | Ancla de salida; asset aprobado (TANDA_01) |
| Sistema de estaciones (4, anillos elípticos, prompt `[E]/(A)`) | Funcional y probado |
| Movimiento + colisión pushout (prop circles `br*0.72+18`) | Funcional; sin colisión arquitectónica compleja necesaria |
| Cámara con zoom adaptativo y clamp | Funcional; evita bandas negras |
| Y-sort (props + NPCs + jugador) | Orden de dibujado correcto |
| Props y NPCs TANDA_01..08 | Reutilizables; no hay que sustituir |
| Mural Zorro Neón (`prop_hub_fox_neon`) | Firma visual aprobada |
| Suelo mármol + velvet VIP | Reutilizables |

---

## 6. B. Qué reorganizar (válidos, nueva posición/escala/jerarquía)

| Elemento | Qué reorganizar | Por qué |
|----------|-----------------|---------|
| Plataforma de descenso | Reforzar jerarquía visual (iluminación, anillo, alfombra de acceso) | Es el objetivo principal pero compite con otras estaciones |
| Eje spawn→descenso | Añadir señalización/iluminación en el tramo vertical (880,615→880,785) | Falta camino claro |
| Sofás / banco | Desplazar ligeramente del centro de tránsito | Liberar el eje central |
| Armería / Mapa / DJ | Reposicionar como triángulo de preparación alrededor del eje | Mejor orientación sin hacinamiento |
| Faroles / candelabros | Ajustar para apoyar la iluminación selectiva del eje de descenso | Mejor contraste y legibilidad |

---

## 7. C. Qué rediseñar (no cumplen dirección artística o tienen problemas técnicos)

| Elemento | Problema | Acción recomendada (pendiente aprobación) |
|----------|----------|-------------------------------------------|
| Protagonista HUB (`pm_idle_fid_00.png`, 288×512) | No verificado visualmente contra la referencia aprobada 1672×941 | Comparar anatomía/tatuajes/silueta; si no coincide, documentar como INCONSISTENTE (no sustituir automáticamente) |
| Protagonista fuera de manifiesto (`DD_ASSETS`) | Cargado vía `new Image()` directo, no registrado | Registrar en `src/dd_asset_registry.js` tras aprobación |
| Múltiples fallbacks de dibujo del protagonista | `drawRefugeIdle` → `drawProtagonist` (1.16) → `__DD_BRIDGE.drawPlayerAt` | Unificar a una fuente de verdad (pendiente de diseño) |
| Variantes obsoletas del protagonista | v1, experimento fallido de 4 frames ocupan espacio | Documentar como obsoletos, conservar como referencia, no eliminar |

---

## 8. Recursos reutilizables (lista)

Todos los props, NPCs, suelos, muros, faroles y la plataforma de descenso listados en `04_ASSET_INVENTORY.md`, más:
- `pm_idle_fid_00.png` (pendiente de verificación visual contra la referencia aprobada)
- `threshold_descent_pad` (aprobado)
- `prop_hub_fox_neon` (aprobado)

---

## 9. Recursos obsoletos (lista)

- `pm_idle_fid_00_v1.png` (versión anterior de corrección, conservar como comparación)
- `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/pm_idle_0[0-3].png` (experimento de tatuaje fallido, continuidad rota)

**No eliminar.** Conservar como referencia/documentación.

---

## 10. Recursos que faltan (pendiente de confirmación tras aprobación del diseño)

Ninguno bloqueante para el HUB actual. Potenciales necesidades tras aprobación de la propuesta:
- Señalización visual de la plataforma de descenso (letrero/alumbrado).
- Iluminación diferencial en el eje spawn→descenso.
- Alfombra o marca de suelo en el eje de descenso.

Estos son **propuestas de diseño**, no carencias confirmadas del estado actual.

---

## 11. Dependencias técnicas

| Dependencia | Archivo / sistema | Impacto del rediseño |
|-------------|-------------------|----------------------|
| Cache de sala | `buildHighResRoomCache(cctx,1800,1180,HUB_BOUNDS,0,777,null)` | Si se cambian bounds, regenerar cache |
| Clamp de cámara | `x0..x1, y0..y1` en `render()` | Si se cambian bounds, ajustar clamp |
| Colisión pushout props | `(br*0.72)+18` en `update()` | Si se mueven props, actualizar coordenadas en `HUB_PROPS` |
| Estaciones | `STATIONS` array (x,y,r) | Si se mueven estaciones, actualizar coordenadas |
| Protagonista | `ensureRefugeIdle()` + `drawRefugeIdle()` | No tocar animación ni proporciones; solo registrar en manifiesto |
| Y-sort | `drawList` ordenado por `y` | Si se reubican NPCs/props, el orden se recalcula automáticamente |
| Flujo de salida | `exitToRun()` → `playCircleDescent(1, ...)` → `startRun()` | No modificar; solo se usa la estación "descent" |

---

## 12. Riesgos de implementación

1. **Cambiar el protagonista sin verificación visual** rompería la identidad aprobada (tatuajes, silueta, proporciones). Mitigación: comparar contra la referencia 1672×941 SHA-verificada antes de tocar cualquier archivo.
2. **Mover props/estaciones** requiere editar `HUB_PROPS` y `STATIONS` en `dd_hub_system.js`; es reversible y documentable, pero afecta colisiones y Y-sort.
3. **Registrar el protagonista en `DD_ASSETS`** debe hacerse sin romper la carga actual vía `new Image()`; probar ambas rutas.
4. **No hay entorno de ejecución verificado** para probar los cambios (ver `08_QA_REPORT.md`).

---

## 13. Próximo paso (pendiente de aprobación)

Presentar esta propuesta al responsable de dirección artística y diseño. Tras aprobación, se procedería a:
1. Registrar el protagonista en el manifiesto (si se confirma su identidad visual).
2. Ajustar coordenadas en `dd_hub_system.js` (reorganización).
3. Documentar los cambios.

No generar nuevos assets hasta que esta propuesta esté documentada y aprobada.
