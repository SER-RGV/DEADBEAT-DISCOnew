# Auditoría de «Pendientes» TR — 2026-11-15

Contexto: la matriz `01_REPLACEMENT_MATRIX.md` marca ~163 filas «Pendiente». Esta auditoría muestrea visualmente una selección representativa para decidir si la regeneración masiva con IA tiene sentido. **Resultado: NO proceder a la conversión en masa**; gran parte del pendiente es arte ya final de alta calidad o coherente con el lenguaje pixel-art del juego.

## Muestras verificadas (evidencia en esta pasada)

| ID | Archivo inspeccionado | Veredicto |
|---|---|---|
| `menu_main_backdrop` | assets/ui/menu_main_backdrop.png | Excelente key art (ciudad roja + protagonista). Sin cambios. |
| `cine_intro_club_panorama` | assets/cinematics/cine_intro_club_panorama.png | Excelente (bola de discoteca, vetas magenta/cian). Sin cambios. |
| `cine_bg01_city` | assets/cinematics/backgrounds/final/cine_bg01_city/cine_bg01_city.png | Excelente key art; **anomalía menor**: recuadro inset superior-izquierdo que duplica parte de la escena (¿marco intencionado?). Verificar en in-situ. Sin cambios aún. |
| `cine_bg04_main_hall` | assets/cinematics/backgrounds/final/cine_bg04_main_hall/cine_bg04_main_hall.png | Excelente (nave gótica + neón + estatua). Sin cambios. |
| `cine_circle_01_lujuria` | assets/cinematics/cine_circle_01_lujuria.png | Excelente (salón magenta/esmeralda). Sin cambios. |
| `vfx_smoke_cloud` | assets/effects/vfx_smoke_cloud.png | Pixel-art limpio y coherente. Sin cambios. |
| `hud_heart_full` | assets/ui/hud_heart_full.png | Pixel-art limpio. Sin cambios. |
| `weapon_m1911` / `weapon_uzi` | assets/weapons/weapon_m1911.png · weapon_uzi.png | Pixel-art 320x160 estándar del arma, coherente con proyectiles/pickups/reliquias. Sin cambios. |

## Capturas in-situ (02/05)
- `ART_EVIDENCE/TOTAL_REBUILD/05_descent_pad.png` — HUB renderizado en navegador: HUD completo, retrato, corazones, NV.1, M1911 ∞, neón zorro, pad de descenso cian, DJ TemPO; **sin errores JS** (pageErrors [], failed []).
- `06_first_room.png` — la captura salió igual al HUB: el salto de cinemática de descenso no avanzó durante este harness headless (press Space no aterrizó en la sala). Honestidad: **captura de la primera sala NO confirmada**; reproducir tras fix o manualmente.

## Recomendación
1. **No regenerar en masa** cine/VFX/armas/proyectiles/reliquias/HUD. Riesgo alto de empobrecer arte final ya entregado.
2. Convertir la matriz en lista de verificación in-situ (círculo a círculo); regenerar solo lo que se vea roto en juego.
3. Fijar `cine_bg01_city` (inset duplicado) solo tras confirmar in-situ si es intencionado.
4. Dejar la decisión de merge de PR #31 (borrador) al responsable.

## Riesgos registrados
- La matriz **sobrestima** el trabajo pendiente (algunas filas «Pendiente» corresponden a arte final excelente).
- El inset de `cine_bg01_city` queda sin resolver (no bloqueante).
- `qa_descent` ejecutado 2026-11-15: OK de errores, pero la transición a la sala I requiere verificación adicional (captura 06 no la confirma).
