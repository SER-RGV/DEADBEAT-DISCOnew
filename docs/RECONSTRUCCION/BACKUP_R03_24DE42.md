# BACKUP R03 — 24/42 JEFES
# Respaldo del trabajo interrumpido (sin commit) · 2026-11-12

**Rama origen:** `arena/662f0d27-deadbeat-disconew` (commit `4d2e949`, 15/42)  
**Rama destino:** `arena/719117d9-deadbeat-disconew` (este commit de respaldo)  
**Estado:** Trabajo validado en juego con `probe_bosses.js` + `probe_bosses_combat.js` + `probe_final_flow.js`, **sin commit previo**. Se respalda por orden D-06.

---

## 1. Qué se respalda

### Ilustraciones — 9 nuevas (15 → 24)

| Estado | Jefe (ID técnico) | Soberano canónico (D-03) | Nota de validación |
|---|---|---|---|
| `attack` | `boss_03_cajero` | Áurea | Vitrina dorada + junta expuesta; vista 3/4 derecha; `state_ref` sobre `cajero_idle` wide |
| `attack` | `boss_05_oficiante` | Obispo | Mitra-diapasón alzada; humo suprimido; `fade` cables |
| `attack` | `boss_06_matarife` | Corazón Encadenado | Mazo-tambor elevado; cadenas tensas; sin línea de suelo |
| `attack` | `boss_07_imitador` | Crupier de Mil Voces | Dos máscaras superpuestas; humo denso opaco |
| `attack` | `boss_08_traidor` | Nix | Velo blanco desplegado; hielo negro cian; `tint` cian sutil |
| `attack` | `boss_09_nucleo` | Rey del Compás | Teselas de espejo fracturadas; esfera en pecho con grieta |
| `attack` | `boss_10_arquitecto` | Rey del Contratiempo | Compás-cetro abierto; radio 38u; `halo 0.42` |
| `hit` | `boss_00_anden` | Portero sin Rostro | Postura vulnerable: abrigo abierto, contador a 0 |
| `hit` | `boss_01_magneta` | Véspera | Cables flojos, máscara ladeada; `recover` = ventana daño ×1.5 |

**Inventario tras respaldo:** 24/42 integradas (11 `idle` + 11 `attack` + 2 `hit`). Pendientes: 8 `hit` + 10 `death` = 18.

### Código — 3 fixes validados en runtime

| Fix | Archivo | Descripción | Antes | Después |
|---|---|---|---|---|
| **Destello de impacto** | `src/dd_world_renderer.js` `blitBossFrame` | El `flash` (tinta blanca) velaba la figura en su pico (alpha 0.9). | `globalAlpha = 6*flash` sin tope | `flashCap 0.68`; `rim` preservado sobre tinta; curva `Math.min(flashCap, 6*flash)` |
| **Espera de pantalla final** | `src/dd_world_renderer.js` `DD_WORLD.drawBossDeath` + `src/dd_ui_system.js` `onBossDeath` | Núcleo y Arquitecto no se veían morir: `fin de partida` abría en el mismo frame. | `DMO_PROG.victory()` inmediato | `deathHoldMs: 1000`; `victoryDelay: 1000ms` con `requestAnimationFrame` + `setTimeout` fallback; sonda `probe_final_flow.js` mide 900–1100ms de derrumbe visible |
| **Sondas de combate** | `tools/art_master/probe_bosses_combat.js` | No existía validación de combate continuo (solo estados forzados). | `probe_bosses.js` forzaba campos | `probe_bosses_combat.js` simula ronda completa por pista: aparición→patrones→vulnerable→muerte→UI; captura 55→78 cuadros; `probe_final_flow.js` captura transición muerte→panel→fin |

---

## 2. Validación del respaldo

**Compilación:** `index.html` 5.43 MB, `src/dd_asset_registry.js` 269/269, `DD_ASSETS.integrity()` pass.

**Probes:**

- `probe_bosses.js` — 11 jefes × 19 situaciones = **207 recortes**, 55 cuadros, 0 `pageerror`, 0 404, 269/269 assets.
- `probe_bosses_combat.js` (nuevo) — 11 jefes × ronda completa simulada = **~330 acciones**, 78 cuadros, 0 `pageerror`; verifica que `drawBossDeath` de 1s no se corta por `VARÍA TU DISPARO`.
- `probe_final_flow.js` (nuevo) — Núcleo y Arquitecto: muerte → 1s derrumbe → `DMO_PROG.victoryDelay` → pantalla final; `HUD` no tapa final (`z-index` corregido en `dd_rebuild_ui.css` §victory).
- `probe_enemies.js` — círculos I y III (regresión R02), 0 errores.
- `probe_player.js` — 8 estados, 0 errores.

**IDs legacy:** Los 9 nuevos usan los mismos IDs técnicos `boss_0X_*` y la misma lámina REF_03 que los 15 previos. Por D-03 quedan marcados como **LEGACY** (alias motor) pendientes de reinterpretación a soberanos de Biblia.

---

## 3. Qué NO se respalda como definitivo

- La **identidad narrativa** de los 24 (REF_03 + nombres motor) es **obsoleta** tras D-03. Se conservan como evidencia técnica, no como canon.
- Los masters croma originales viven en `/home/user/dd_work/raw/R03_JEFES/` (fuera del repo). En el repo se respaldan los recortados `ART_ASSETS/rebuild_masters/R03_JEFES/*.webp` que ya existían para los 15; los 9 nuevos se respaldan solo como PNG procesados `assets/bosses/` + `ART_ASSETS/bosses/tanda_01-02/` cuando se regeneren bajo canon nuevo.
- No se aplican cambios de `CIRCLE_META`/`CIRCLE_CONFIG` (D-05) ni de soberanos (D-03) en este commit — van en siguiente commit de sustitución narrativa.

---

## 4. Próximos pasos (tras este backup)

1. Commit siguiente (autorizado D-05): barrido `círculos→pistas`, `Virgilio→Tempo`, `cazador→Desafinado`, `Infierno→Torre` en `src/dd_*.js` + `tools/build_active_html.py` + rebuild `index.html`.
2. Fase 02: Nueva Art Bible con soberanos de Biblia como **única referencia de diseño** (no REF_03).
3. R03 reinicio canónico: regenerar los 42 (o al menos 27 pendientes) con soberanos; decidir si los 15 idles legacy se reciclan o se rehacen.

---

**Firma backup:** 2026-11-12 · rama `arena/719117d9-deadbeat-disconew` · orden D-06 cumplida.
