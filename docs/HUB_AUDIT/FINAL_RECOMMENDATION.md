# FINAL_RECOMMENDATION.md — Informe ejecutivo: auditoría del Refugio

DEADBEAT DISCO · FASE 01 · Auditoría y rediseño del Refugio
Rama: `arena/8b71cc96-deadbeat-disconew` (desde `main` `2d1f6e8`)
Estado: **FASE 01 completada (auditoría y propuesta)**. Esperando aprobación antes de rediseño o producción de nuevos assets.

---

## 1. Resumen ejecutivo

El Refugio (HUB) de DEADBEAT DISCO es una **zona segura de una sola sala, técnicamente funcional y de tamaño adecuado**, construida sobre Canvas 2D con perspectiva isométrica y orden de dibujado Y-sort. Su arquitectura (`DD_HUB`, `DD_WORLD`, `DD_UI`, `DD_BOOT`, `DD_CINE`) ya soporta movimiento, colisiones suaves, estaciones de interacción, cámara con zoom adaptativo y la entrada/salida hacia incursiones.

**No hay necesidad de ampliar el escenario ni de sustituir assets aprobados.** Los problemas detectados son de **jerarquía visual, orientación y distribución funcional**, no de escala. Se recomienda **conservar la mayoría de los assets**, **reorganizar algunos dentro de los mismos límites (1240 × 760)** y **rediseñar solo la vinculación y verificación del protagonista** respecto a la referencia canónica aprobada.

Esta fase es **exclusivamente de auditoría y proposal**. No se han hecho modificaciones destructivas ni rediseños visuales. Queda pendiente la aprobación para iniciar la fase de implementación.

---

## 2. Respuestas a las preguntas requeridas

### ¿Qué tamaño tiene actualmente el Refugio?

- **1240 × 760 unidades de mundo** (mundo X 260–1500, Y 210–970).
- Área transitable efectiva antes de pushout: **~1164 × 684 unidades**.
- Spawn del protagonista: **(880, 615)**.
- Plataforma de descenso: **(880, 785)**, radio 96.
- Velocidad de movimiento: **285 unidades/segundo**.
- Cámara: zoom 1.02–1.6, cache de sala 1800×1180 píxeles.

### ¿Es adecuado?

**Sí.** Es adecuado para una zona segura de una sola sala: el protagonista dispone de espacio suficiente para desplazarse (cruza la sala en ~4–5 segundos) y no hay sensación de agobio ni de vacío excesivo. No es ni demasiado pequeño ni demasiado grande.

### ¿Qué problemas espaciales presenta?

1. **Falta un camino principal definido** hacia la plataforma de descenso desde cualquier punto.
2. **La plataforma de descenso no domina visualmente**; es una estación más entre cuatro.
3. **Zonas periféricas infrautilizadas** (esquinas superiores, bordes laterales).
4. **NPC armero al mismo nivel Y que el jugador**: puede quedar oculto por props o por el propio jugador (Y-sort).
5. **Sin distinción entre zona de paso y zona de estancia**: los sofás y el banco están en el centro de tránsito.

### ¿Qué problemas gráficos presenta?

1. **Protagonista del HUB (`pm_idle_fid_00.png`, 288×512) no verificado visualmente** contra la referencia canónica aprobada (`protagonist_master_approved.png`, 1672×941, SHA-256 `43d9e58f...`). Pendiente confirmar que anatomía, tatuajes, silueta e proporciones coincidan.
2. **Protagonista fuera del manifiesto de recursos** (`src/dd_asset_registry.js`): se carga vía `new Image()` directo, no registrado.
3. **Múltiples fallbacks de dibujo del protagonista**: `drawRefugeIdle` → `drawProtagonist` (escala 1.16) → `__DD_BRIDGE.drawPlayerAt`.
4. **Variantes obsoletas del protagonista** (v1, experimento fallido de 4 frames) que no se usan pero ocupan espacio y generan confusión.
5. **No se ha verificado visualmente la consistencia artística** de cada recurso (requiere revisión humana).

### ¿Qué recursos debemos conservar?

Todos los siguientes, listados en `04_ASSET_INVENTORY.md` y clasificados en `03_ART_AUDIT.md`:
- Límites del mapa 1240 × 760, spawn (880,615), plataforma de descenso (880,785).
- Sistema de estaciones (4), movimiento + colisión pushout, cámara, Y-sort.
- Suelos (`floor_00_limbo_marble`, `floor_11_vip_velvet`), muro gótico (`wall_panel_gothic_niche`), pilastra (`wall_pillar_obsidian`).
- Plataforma de descenso (`threshold_descent_pad`, aprobado), mural Zorro Neón (`prop_hub_fox_neon`, aprobado).
- Todos los props y NPCs de TANDA_01..08 usados en `HUB_PROPS` (22 props, 3 NPCs).
- Faroles dorados (`prop_chandelier_gold`).

### ¿Qué recursos están obsoletos?

- `pm_idle_fid_00_v1.png` (versión anterior de corrección, conservar como comparación).
- `IDLE_4F_EXPERIMENT_FAILED_TATTOO_CONTINUITY/pm_idle_0[0-3].png` (experimento de tatuaje fallido, continuidad rota).
- **No eliminar.** Conservar como referencia/documentación.

### ¿Qué deberíamos reorganizar?

Dentro de los mismos límites 1240 × 760 (detalle en `06_PROPOSED_LAYOUT.md`):
1. **Reforzar la plataforma de descenso** como ancla dominante (iluminación cian, anillo marcado, alfombra de acceso).
2. **Crear un eje visual spawn→descenso** (880,615 → 880,785) con iluminación/selectividad.
3. **Desplazar sofás y banco** del centro de tránsito hacia un lateral.
4. **Organizar armería, mapa y DJ** como triángulo de preparación alrededor del eje central.
5. **Ajustar faroles y candelabros** para apoyar la iluminación selectiva del eje de descenso.

### ¿Qué deberíamos rediseñar?

- **Vinculación del protagonista al manifiesto**: registrar `pm_idle_fid_00.png` (o el sprite aprobado tras verificación) en `src/dd_asset_registry.js`.
- **Verificación visual del protagonista** contra la referencia 1672×941 SHA-verificada. Si no coincide, documentar como INCONSISTENTE (no sustituir automáticamente).
- **Unificar los fallbacks de dibujo del protagonista** a una única fuente de verdad.
- No se recomienda rediseñar ningún entorno, prop o NPC aprobado.

### ¿Qué dimensiones recomendamos?

**Mantener 1240 × 760 unidades de mundo.** No cambiar el tamaño del fondo ni del área jugable. Cualquier cambio de dimensión requeriría regenerar el cache de sala (1800×1180), ajustar el clamp de cámara y reposicionar todos los props.

### ¿Cómo conectaremos el Refugio con las incidencias?

Ya funciona parcialmente:
- Refugio → Descenso: `exitToRun()` → `playCircleDescent(1, triggerRun)` → `startRun()`.
- Descenso → Incursión: `__DD_BRIDGE.startRun()` con fallbacks.
- Intro → Refugio: `playIntro` onComplete llama `DD_HUB.enter()`.

Pendiente para el ciclo permanente (documentado en `07_TRANSITION_DEPENDENCIES.md`):
- **Ruta de retorno al Refugio tras muerte/fin** (no implementada; la muerte no debe enviar automáticamente al menú).
- **Guardia de primera partida** para no repetir la intro.
- **Limpieza de estado temporal de incursión** al volver al Refugio.
- **Transición de retorno** coherente (simétrica al descenso).
- Auditoría de que `RUN` y `PERMANENT` en `localStorage` no se dupliquen.

### ¿Qué trabajo debe hacerse primero?

1. **Aprobar esta auditoría y la propuesta de distribución** (`06_PROPOSED_LAYOUT.md`).
2. **Verificar visualmente al protagonista** contra la referencia aprobada 1672×941 (SHA `43d9e58f...`) antes de tocar cualquier archivo de personaje.
3. **Registrar el protagonista en el manifiesto de recursos** tras la verificación.
4. **Ejecutar el plan de pruebas** (`08_QA_REPORT.md`) en un entorno de ejecución válido.
5. Tras aprobación, implementar la **reorganización** dentro de los mismos límites (ajustar coordenadas en `dd_hub_system.js`), no el rediseño visual.

---

## 3. Decisiones clave para la siguiente fase

| Decisión | Recomendación |
|----------|---------------|
| ¿Cambiar tamaño del Refugio? | **No.** Mantener 1240 × 760. |
| ¿Sustituir assets aprobados? | **No.** Conservar todo lo aprobado y reutilizable. |
| ¿Generar nuevos assets? | **No.** No hasta completar inventario y diagnóstico (ya hecho) y obtener aprobación. |
| ¿Modificar cinemática de intro? | **No.** Sin necesidad técnica demostrable. |
| ¿Duplicar sistemas que funcionan? | **No.** Aprovechar `DD_HUB`, estaciones, cámara, Y-sort existentes. |
| ¿Qué rediseñar primero? | La vinculación y verificación del protagonista, y la jerarquía del eje de descenso. |

---

## 4. Próximo paso esperado

Presentar este informe ejecutivo y los 9 documentos de `docs/HUB_AUDIT/` para **aprobación**. Una vez aprobado, se procederá a la fase de implementación (reorganización dentro de los límites actuales, registro del protagonista en el manifiesto, y ejecución del plan de QA). No se iniciarán rediseños visuales ni producción de assets hasta recibir dicha aprobación.

---

## 5. Documentos de la auditoría (esta carpeta)

| Documento | Contenido |
|-----------|-----------|
| `01_TECHNICAL_AUDIT.md` | Arquitectura, dimensiones, rendimiento, problemas técnicos |
| `02_SPATIAL_AUDIT.md` | Diseño espacial, recorridos, evaluación, plano actual |
| `03_ART_AUDIT.md` | Clasificación artística de todos los recursos del Refugio |
| `04_ASSET_INVENTORY.md` | Inventario cuantitativo de assets (protagonista, NPCs, arquitectura, props, tanda HUB-01) |
| `05_CURRENT_LAYOUT.md` | Plano esquemático del Refugio actual con coordenadas |
| `06_PROPOSED_LAYOUT.md` | Propuesta de distribución alternativa (dimensiones, jerarquía, conservar/reorganizar/rediseñar) |
| `07_TRANSITION_DEPENDENCIES.md` | Dependencias para el ciclo permanente MENÚ→INTRO→REFUGIO→…→REFUGIO |
| `08_QA_REPORT.md` | Plan de pruebas (no ejecutadas; limitación documentada) |
| `FINAL_RECOMMENDATION.md` | Este informe ejecutivo |
| `capturas/` | (pendiente de entorno de ejecución) capturas reales del Refugio |
| `planos/` | (pendiente) planos adicionales |
