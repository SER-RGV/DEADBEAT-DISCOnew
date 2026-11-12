# ESTADO ACTUAL DEL PROYECTO — DEADBEAT DISCO (`v4.0.0-UNIFIED-DEFINITIVE`)

## 1. Resumen Ejecutivo de Estado
- **Estado de Producción Visual:** **100.0% Completado** (`330 / 330` en `docs/ART_REBUILD/MASTER_INVENTORY.json` y `586` activos registrados en `assets/manifest.json`).
- **Estado del Build Activo:** `index.html` y `DEADBEAT_DISCO.html` (`5,486,464` bytes) compilados mediante `python3 tools/build_active_html.py`, con todos los subsistemas visuales y la máquina de estados de bosses (`boss_animation_state_machine.js`) integrados.
- **Estado del Servidor Live Preview:** Activo en `0.0.0.0:8080` (`Deadbeat Disco Game Server`), con **586 / 586** endpoints de activos respondiendo `HTTP 200 OK`.

## 2. Subsistemas en Producción
1. **`src/dd_asset_registry.js` (`window.DD_ASSETS`):** Registro unificado de 586 activos con precarga prioritaria y carga diferida (*lazy-load*) bajo demanda para armas extendidas, vistas direccionales y fases de jefes.
2. **`src/dd_world_renderer.js` (`window.DD_WORLD`):**
   - Renderizado de salas con escenarios V5 específicos por Pista (`lujuria_boudoir_stage` .. `nucleo_cathedral_stage`) y medallones centrales de suelo (`hub_pista_medallion` .. `nucleo_floor_mandala`).
   - Protagonista con **Waist-Split a `splitRatio = 0.54` (`y = 173`)** perfectamente alineado entre todas las poses erguidas (`head y = 24`, `feet y = 312`).
   - Enemigos regulares con interpolación a 4 poses (`walk`, `windup`, `attack`, `death`) y soporte para los 10 arquetipos de `tanda_E01`.
   - Soberanos / Bosses conectados a `window.DMO_BOSS_ANIMATION_FSM` (13 estados) y sprites de Fase 2 al bajar del 42% de vida.
3. **`src/dd_hub_system.js` (`window.DD_HUB`):** El Refugio con la **Pista Central Astrológica**, **Cabina de Tempo** con diálogos canónicos de lore (*El Desafinado*, *Véspera*, *El Rey del Compás*, *El Sello*, *Áurea*), **El Último Trago**, **La Cabina**, **Mesa Astral de las 9 Pistas** y clubbers ambientales.
4. **`src/dd_cinematic_camera.js` (`window.DD_CINE`):** Secuencia de apertura de 10 planos (**«La noche que vuelve»**, 35s) sincronizada al pulso de 128 BPM con capas parallax 2.5D y loops animados de 8 frames.
5. **`src/dd_ui_system.js` (`window.DD_UI`):** Armería (**La Cabina**) conectada al catálogo completo de **121 armas HD** (`assets/weapons/weapon_*.png`).
