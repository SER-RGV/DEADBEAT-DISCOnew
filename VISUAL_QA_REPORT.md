# INFORME DE AUDITORÍA Y CONTROL DE CALIDAD VISUAL (QA) — DEADBEAT DISCO (`v4.0.0`)

## 1. Hojas Permanentes de Auditoría en Motor Real (`assets/qa/audit_v4/`)
Todas las capturas de aceptación final han sido generadas ejecutando directamente los módulos reales del motor (`window.DD_CINE`, `window.DD_WORLD`, `window.DD_HUB`, `window.DD_UI`, `window.DD_ASSETS`) con decodificación real de los `622` activos registrados a resoluciones `1280×720` (HD), `1920×1080` (FHD) y `2560×1440` (QHD):

1. **`assets/qa/audit_v4/audit_01_cinematic_10_shots_real_engine.png`** (`2560×1800` PNG):
   - Los 10 planos de la cinemática de apertura (**«La noche que vuelve»**, `0.0s → 35.0s`) renderizados por `window.DD_CINE.renderOverlay`.
   - Verifica la resolución de **`DEF-01`** (máscaras alfa de espacio negativo en las capas `03_*` de `cine_bg03_entrance`, `cine_bg05_dancefloor` y `cine_bg06_hero`, garantizando visibilidad al 100% del protagonista en los Planos 04, 05, 07, 08, 09 y 10), **`DEF-02`** (logotipo completo `DEADBEAT DISCO` + Zorro Coronado sin recorte superior en el Plano 09) y **`DEF-07`** (uso de `pIdle` sin fogonazo en Planos 08 y 09, eliminación de notas técnicas de cámara en las bandas letterbox y descenso al Refugio con el texto ambiental canónico *«LA NOCHE NO TERMINA.»* en el Plano 10).
2. **`assets/qa/audit_v4/audit_02_nine_tracks_gameplay_real_engine.png`** (`2560×1850` PNG):
   - Las 10 pistas jugables (**Track 0 · El Andén Cero** + **Pistas I a IX**) renderizadas por `window.DD_WORLD`.
   - Verifica la resolución de **`DEF-06`** (escala de enemigos regulares aumentada a `h >= 126px` en `drawEnemy` para máxima legibilidad de silueta y telegrafía en combate, y aura de escudo del jugador `v5_player_aegis_shield_aura` mostrada únicamente cuando `shield > 0`).
3. **`assets/qa/audit_v4/audit_03_resolutions_ui_and_animations.png`** (`2560×1600` PNG):
   - Menú Principal a `2560×1440` (QHD), El Refugio (`DD_HUB.render`) a `1920×1080` (FHD) y pantallas de Victoria/Derrota a `1280×720` (HD).
   - Verifica la resolución de **`DEF-05`** (las 8 vistas direccionales `player_dir_N..NO.png` reexportadas a cuerpo completo de cabeza a botas desde `ART_ASSETS/tanda_03/fase_b/_source/` y ángulo de cabeza 3/4 unificado en `player_walk_00..03.png`) y **`DEF-04`** (consistencia de identidad al 100% en los 4 estados `walk/windup/attack/death` de las 6 familias de enemigos: `security`, `fanatic`, `chef`, `dancer`, `drone`, `elite`).
4. **`assets/qa/audit_v4/audit_04_bosses_all_states_and_weapons_ui.png`** (`2560×1920` PNG):
   - Los 11 Soberanos (`boss_00_anden` a `boss_10_arquitecto`) en sus 4 estados (`idle`, `attack`, `hit`, `death` = `44` sprites), los 10 arquetipos diferenciados de `ART_ASSETS/tanda_E01/` y la interfaz de selección de armas de **La Cabina**.
   - Verifica la resolución de **`DEF-03`** (diferenciación total entre `boss_03_cajero` y `boss_07_imitador`, identidad consistente entre estados de `boss_00`, `boss_01`, `boss_02`, `boss_03`, `boss_05`, `boss_06` y `boss_10`, creación de `boss_10_arquitecto_hit.png` y `boss_10_arquitecto_death.png`, y eliminación de sustituciones de monstruos no relacionados en `PHASE2_BOSS_MAP`).

---

## 2. Hojas Comparativas Adicionales (`assets/qa/`)
1. **`assets/qa/BEFORE_AFTER_CHARACTERS.png`**: Comparativa Antes vs. Después del Protagonista (*El Desafinado*), vistas direccionales de cuerpo completo, NPCs del Refugio y Dron Compañero.
2. **`assets/qa/BEFORE_AFTER_ENEMIES.png`**: Comparativa Antes vs. Después de los 24 sprites de las 6 familias de enemigos (`security`, `fanatic`, `chef`, `dancer`, `drone`, `elite`).
3. **`assets/qa/BEFORE_AFTER_BOSSES.png`**: Comparativa Antes vs. Después de los 44 sprites de los Soberanos (`boss_00`..`boss_10`).
4. **`assets/qa/BEFORE_AFTER_CINEMATICS_AND_UI.png`**: Comparativa Antes vs. Después de las 6 escenas cinemáticas (`BG01`..`BG06`), logotipo oficial y elementos de UI/Props.
5. **`assets/qa/ANIMATION_STRIP_PREVIEW_SHEET.png`**: Tiras de animación cuadro a cuadro del Protagonista, las 6 familias de enemigos y los Soberanos.
6. **`assets/qa/IN_CONTEXT_RUNTIME_SCENES.png`**: Composición en contexto real de escena (Planos 04 y 07 de la cinemática, El Refugio HUB, Pista I Lujuria, Pista IV Ira, Pista IX El Núcleo y La Cabina).

---

## 3. Resultados de Verificación Automatizada
- **Auditoría de los 7 Defectos (`DEF-01` .. `DEF-07`):** `7 / 7` resueltos y verificados en motor real (`FINAL_ARTISTIC_ACCEPTANCE_AUDIT.md`).
- **Verificación HTTP en Vivo (`http://127.0.0.1:8080/`):** **`622 / 622`** activos registrados en `assets/manifest.json` y `src/dd_asset_registry.js` responden `HTTP 200 OK` (`0` errores 404).
- **Integridad del Build Activo:** `index.html` y `DEADBEAT_DISCO.html` (`5,526,777` bytes) compilados limpiamente mediante `python3 tools/build_active_html.py`.
