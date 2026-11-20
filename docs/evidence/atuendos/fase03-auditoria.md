# DEADBEAT DISCO — Fase 03 · auditoría inicial

**Base auditada:** `44a709a` (`art: completar seis showcases de atuendos`).
**Estado:** fotografía inicial de rutas y contrato; producción de Fase 03 aún no integrada en esa fecha. La duda de compatibilidad visual de los sprites descrita abajo quedó revisada posteriormente en [`fase03.1-informe-qa.md`](fase03.1-informe-qa.md); esta auditoría se conserva como antecedente, no como resultado final.

## Rutas y manifiestos

- **Selector/HUB/combate:** `src/dd_appearance.js` carga directamente `assets/characters/outfits/<id>/<pose>.png`. `DD_APPEARANCE.preview()` devuelve la showcase para el selector y `outfitFrame()` entrega el PNG de pose. `src/dd_ui_system.js` sólo presenta la URL. `src/dd_world_renderer.js` dibuja la pose seleccionada. El contrato de los ocho atuendos vive en estos archivos y en sus directorios; no hay atlas de poses de atuendo ni manifiesto individual por atuendo.
- **Atlas/manifiesto central:** el protagonista base sí está registrado en la constante `MANIFEST` de `src/dd_asset_registry.js`, reflejada en `assets/manifest.json`. Ese grupo contiene idle, cuatro pasos, disparos/sectores de puntería, impulso, daño, roll y muerte. Las poses de los atuendos no están en el atlas ni en `assets/manifest.json`; las precarga por su ruta `DD_APPEARANCE`.
- **Copia previa:** `tools/art_master/prepare_v2m_outfit.py` documenta y reproduce los tamaños/encajes de las seis poses existentes. En el árbol también hay maestros previos `.cache/v2m/m_<id>_<pose>.png`; son material de una versión anterior, no se consideran automáticamente compatibles con los showcases aprobados de Fase 02.

## Cobertura actual por atuendo

Los ocho directorios tienen exactamente seis PNG de pose: `idle`, `walk_a`, `aim`, `hurt`, `roll`, `death`. No hay `run`, `charged`, `boost/skill`, `walk_b` ni metadatos de ancla por atuendo.

| Pose directa | Lienzo/encaje del contrato actual | Uso real |
|---|---|---|
| `idle` | 288×512, figura-hip, figura 462 px, baseline 505 | reposo/HUB; también participa en el ciclo de paso |
| `walk_a` | 288×512, figura-hip, figura 462 px, baseline 505 | pose móvil; alterna con `idle` para los cuatro índices base |
| `aim` | 352×512, figura-bbox, figura 462 px, baseline 505 | guardia/aim; el renderer la reutiliza con arma, disparo y disparo cargado |
| `hurt` | 352×512, figura-bbox, figura 462 px, baseline 505 | impacto/daño/aturdimiento |
| `roll` | 384×384, contain con margen 8 | esquiva/voltereta |
| `death` | 640×320, contain con margen 8 y flip horizontal de preparación | derribo/muerte |

Los ocho conjuntos existentes pasan por la misma ruta, pero sus dibujos de pose preceden a la aprobación visual de Fase 02 y no se puede presumir que conserven exactamente los ocho vestuarios aprobados.

## Máquina de animación real (sin inventar estados)

`docs/RESTART/04_PROTAGONISTA_PRODUCCION.md` y `PLAYER_POSE_TO_ID`/`resolvePlayerPose()` en `src/dd_world_renderer.js` describen el contrato de ejecución:

- `idle` → `player_idle_00`; `walk` y `run` usan el ciclo base de cuatro pasos a distinta cadencia. En vestuario la API actual ofrece dos dibujos alternados (`idle`/`walk_a`), no una animación separada para correr.
- `shoot`, `aim`, `charged`, recarga y cambio de arma comparten la familia de puntería. El renderer no define un PNG exclusivo para disparo cargado ni para cada dirección en los atuendos; `aim.png` se usa como guardia visual y el arma se dibuja aparte.
- `ability` ya es un estado del juego (`player_boost_00`), pero la sustitución actual de atuendo no tiene pose `boost`: con atuendo se reemplaza por `aim` cuando hay arma o por `idle` sin arma. Es una carencia de presentación, no un estado nuevo del motor.
- `hurt`/`stun` → `hurt.png`; `death` → `death.png`; `dodge` → `roll.png`.

Por tanto, para cubrir todas las etiquetas solicitadas sin cambiar gameplay: `RUN` reutiliza el ciclo `WALK` con su cadencia existente; disparo normal/cargado reutilizan la pose de puntería existente; el estado de habilidad debe poder seleccionar un arte de atuendo para el estado de impulso ya existente. No se añade estado de motor, disparo ni habilidad nueva.

## Restricciones de producción

- Contrato tomado de `prepare_v2m_outfit.py`/`tools/art_master/artlib.py::fit_canvas`: lienzos, pivote a suelas y cortes de figura indicados arriba; `death` se refleja según la convención actual.
- La API visual actual fija anclas de mano por ID en `src/dd_world_renderer.js` y el corte armado usa un cinturón genérico `0.48`; no hay anclas de cinturón/mano por atuendo. No se cambiarán las coordenadas físicas ni la lógica de armas.
- Fase 03 debe conservar los `showcase.png` aprobados de los ocho atuendos; el alcance de sustitución se limita a recursos de pose y metadatos de esos recursos.

## Archivos a conservar / no tocar

Los showcases aprobados de Fase 02 son: `assets/characters/outfits/{original,rapture,shadow,apocalypse,gunslinger,fightclub,kitchenriot,streetart}/showcase.png`. No se modificarán. Antes de sustituir sprites de pose, se archivará el conjunto vigente completo para los ocho IDs.
