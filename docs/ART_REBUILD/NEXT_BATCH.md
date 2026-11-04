# NEXT BATCH — TANDA_01

- **Tanda a ejecutar:** `TANDA_01` (1 de 33)
- **Fecha de planificación:** 2026-11-04T19:26:02Z
- **Archivos a actualizar:** `src/dd_asset_registry.js`, `docs/ART_REBUILD/*`
- **Pruebas obligatorias:** `node tools/validate_batch.js 1` (Chromium Headless + Playwright, 0 `pageerror`, decodificación PNG RGBA, DPR 1x/2x, mando emulado, capturas reales)
- **Commit previsto:** `feat(art): complete TANDA_01 high-res asset reconstruction and real engine integration`

## Diez Recursos de la Tanda

| # | ID Destino | ID Original | Categoría | Ruta | Dimensiones | Alpha | Dependencias |
|---:|---|---|---|---|---|---|---|
| 1 | `logo_deadbeat_graffiti` | `atlas:logo` | `logos` | `assets/logos/logo_deadbeat_graffiti.png` | 1024x682 | `True` | ninguna |
| 2 | `emblem_fox_crown` | `boot-sigil` | `logos` | `assets/logos/emblem_fox_crown.png` | 512x512 | `True` | ninguna |
| 3 | `menu_main_backdrop` | `ddc-img` | `ui` | `assets/ui/menu_main_backdrop.png` | 1280x720 | `False` | logo_deadbeat_graffiti |
| 4 | `cine_intro_club_panorama` | `ddc-bg` | `cinematics` | `assets/cinematics/cine_intro_club_panorama.png` | 1280x720 | `False` | logo_deadbeat_graffiti |
| 5 | `hud_portrait_protagonist` | `hud:portrait` | `ui` | `assets/ui/hud_portrait_protagonist.png` | 256x256 | `True` | ninguna |
| 6 | `dialogue_portrait_dj` | `atlas:dj` | `ui` | `assets/ui/dialogue_portrait_dj.png` | 512x512 | `True` | ninguna |
| 7 | `map_infernal_tower` | `explore72-map` | `ui` | `assets/ui/map_infernal_tower.png` | 640x640 | `True` | ninguna |
| 8 | `prop_hub_fox_neon` | `hub:fox_neon` | `props` | `assets/props/prop_hub_fox_neon.png` | 384x512 | `True` | ninguna |
| 9 | `prop_sofa_magenta` | `atlas:sofa` | `props` | `assets/props/prop_sofa_magenta.png` | 384x256 | `True` | ninguna |
| 10 | `threshold_descent_pad` | `hub:descent_pad` | `environments` | `assets/environments/threshold_descent_pad.png` | 512x320 | `True` | ninguna |
