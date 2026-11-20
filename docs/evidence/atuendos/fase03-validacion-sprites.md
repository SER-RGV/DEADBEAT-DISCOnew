# FASE 03 — validación de sprites y límite de QA

**Base:** `44a709a` (`art: completar seis showcases de atuendos`).
**Estado al redactarse:** preparación de assets; el bloqueo de navegador aún no estaba resuelto. La recuperación posterior y matriz visual 8/8 quedan documentadas en [`fase03.1-informe-qa.md`](fase03.1-informe-qa.md). Esta nota conserva el resultado histórico de aquella ejecución; la conclusión vigente es la del informe FASE 03.1.

## Resultado del pipeline de preparación

Se ejecutó `tools/art_master/prepare_v2m_outfit.py` sobre los 48 maestros `.cache/v2m/m_<atuendo>_<pose>.png` (8 atuendos × 6 poses). El pipeline completó las 48 salidas conservando los lienzos acordados:

| Poses | Lienzo |
|---|---:|
| `idle`, `walk_a` | 288×512 |
| `aim`, `hurt` | 352×512 |
| `roll` | 384×384 |
| `death` | 640×320 |

Antes de ejecutarlo se archivaron copias exactas del conjunto runtime previo en `assets/characters/outfits/concepts/archive/phase03-before/<id>/`. La comparación posterior confirma que las 48 salidas son **byte por byte idénticas** a las PNG runtime previas. Por ello, el pipeline demuestra que los maestros y encajes reproducen el set existente, pero **no aporta un cambio de arte funcional ni demuestra por sí solo que las poses runtime ya cumplan la aprobación de FASE 02**. No se atribuye una sustitución nueva a esta ejecución.

La hoja de inspección de los 48 resultados está en `.cache/review/phase03/processed/processed-48.jpg` (artefacto temporal, no incluido en Git). La revisión muestra los seis dibujos para los ocho atuendos, con fondo descartado y alfa visible; se mantienen las siluetas reconocibles: capucha integrada en Shadow, armadura asimétrica de Apocalypse y torso/vendas de Fight Club. La hoja es una revisión de sprites aislados, no una captura del juego ni una certificación de anatomía en movimiento. No se modificó ninguno de los ocho `showcase.png`.

## Estado de implementación observado

- El renderer y selector ya cargan los seis PNG por IDs canónicos. No hay atlas ni manifiesto individual de atuendos; no hizo falta inventar uno ni cambiar `assets/manifest.json`.
- `walk` y `run` usan el ciclo/cadencia existente; el outfit alterna `idle` y `walk_a`. `aim`, disparo y disparo cargado reutilizan `aim.png` y el arma separada. `hurt`/aturdimiento, esquiva y muerte usan `hurt`, `roll` y `death` respectivamente.
- No hay arte de pose exclusivo `charged` o `boost`. El estado `player_boost_00` está en el motor; el renderer sustituye la apariencia por poses outfit según su ruta armada/no armada ya existente. No se añadió estado ni se alteró gameplay.
- No se cambiaron IDs canónicos ni la clave persistente `dd_appearance_v1`.

## Pruebas ejecutadas

- `.venv/bin/python tools/qa/validate_phase03_outfits.py` — **PASS**: 48 PNG RGBA con dimensiones esperadas y transparencia; comparación contra backups; los ocho showcases son byte-identical a `HEAD`; verifica rutas de render para las poses existentes. Es una prueba de assets/código, no de UI.
- Smoke HTTP contra el servidor local — **PASS**: 56 peticiones (48 poses y 8 showcases), estado 200 y firmas PNG correctas.
- `node tools/qa/test_outfit_preview.js`, `test_v2m_outfits.js` y `test_outfit_portraits.js` intentaron ejecutarse, pero no iniciaron navegador: Playwright no encontró su Chromium administrado. Al configurar `/tmp/chromium`, ese binario no pudo arrancar por ausencia de `libnspr4.so`. Por tanto, no son fallos del juego ni resultados PASS; la revisión de selector/HUB/combate en navegador queda **bloqueada** en este entorno.

## Pendiente para cerrar FASE 03

1. Comparar los 48 sprites a escala de juego con cada showcase aprobado y ajustar el arte si se descubre deriva de vestuario/anatomía o anclaje. El resultado actual del pipeline no cambia los sprites.
2. Ejecutar QA visual en navegador con un Chromium funcional para los ocho atuendos en selector, HUB y partida real.
3. Confirmar in-game movimiento/carrera, disparo y disparo cargado, habilidad/impulso, daño, esquiva y muerte; inspeccionar los anclajes de arma y el apoyo al suelo. Guardar capturas reales y resultados reproducibles.
4. Sólo entonces registrar sustituciones o declarar la cobertura completa; no tocar combate, IA, balance, showcases aprobados, IDs ni guardados.
