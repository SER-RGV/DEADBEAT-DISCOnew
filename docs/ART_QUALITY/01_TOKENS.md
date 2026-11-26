# FASE 1 · SISTEMA DE TOKENS Y LEGIBILIDAD BASE — DEADBEAT DISCO

**Fecha:** 2026-11-26 · **Rama:** `arena/46b8bb0f-deadbeat-disconew` · **Commit base:** `60870577628825c5cbd6e764ca214c3f106a3433` (la fase 0 quedó entregada en el PR #38 de esta misma rama)
**Previa obligatoria:** FASE 0 aprobada por la dirección (2026-11-26). Informe de partida: `docs/ART_QUALITY/00_AUDITORIA.md`.
**Alcance:** tokens de diseño en CSS + legibilidad mínima (TXT-1) + botones en combate (TXT-3) + HUD compacto ≤560 px (MOB-1). **Sin tocar arte** salvo las correcciones deliberadas indicadas.
**Estado de la fase:** EN REVISIÓN (pendiente del visto bueno de la dirección; la fase no se cierra hasta entonces)

---

## 1. Qué se ha cambiado (todo)

| Artefacto | Cambio |
|---|---|
| `src/dd_rebuild_ui.css` | Bloque `:root` ampliado con el **sistema de tokens** (§2); **139 hex sueltos sustituidos por `var(--dd-*)`**; piso mínimo tipográfico (**60 `font-size` ≤ 11,5 px u 12 px subidos**); regla nueva `.dd-quick-actions.dd-combat-hidden`; bloque nuevo **MOB-1** (HUD compacto ≤560 px) |
| `src/dd_ui_system.js` | En `updateHud()`: los accesos rápidos (`.dd-quick-actions`) reciben `dd-combat-hidden` fuera del Refugio (mismo patrón que `#dd-boss-hud`). Dos `font-size:11px` en línea → 12px |
| `src/dd_cinematic_camera.js` | `font-size:11px` en el letrero «CINEMÁTICA EN TIEMPO REAL» → 12px |
| `index.html` / `DEADBEAT_DISCO.html` | Regenerados con `tools/build_active_html.py` (determinista; backups en `backups/`) |
| `backups/index_PRE-FASE1_2026-11-26.html` · `backups/DEADBEAT_DISCO_PRE-FASE1_2026-11-26.html` | Copias de seguridad byte a byte previas a tocar nada (SHA-256 = build auditada en FASE 0, `6fdba6c4…`) |
| `ART_EVIDENCE/art_quality/fase1/` | **87 capturas** (29 pantallas × 3 resoluciones) + `captures.json` (90 entradas, `errors: []`) — mismas rutas y arnés que FASE 0 |

**Sin tocar:** `src/` (resto), assets, manifiesto, arte, cámara, salas, motor, builds más allá de la regeneración determinista, `backups/` previos, `DEADBEAT_DISCO.ART.html`, `v9_t3_fase1b_cache_probe.html`.

## 2. El sistema de tokens (F6 · P0)

Definido en el `:root` principal de `src/dd_rebuild_ui.css`. Todos los valores coinciden con los hex que ya usaba el build — **ningún color nuevo se ha introducido** salvo el alias `--dd-coral` (ver §6).

- **Neutros y fondos:** `--dd-white/black`, `--dd-bg-base`, `--dd-bg-deep`, `--dd-bg-ink`, `--dd-ink-warm`, `--dd-ink-deep`, `--dd-text`, `--dd-cream-warm`, `--dd-rose-light`, `--dd-taupe`, `--dd-slate`, `--dd-violet`
- **Acentos:** `--dd-pink`, `--dd-pink-med`, `--dd-pink-hot`, `--dd-pink-soft`, `--dd-pink-53`
- **Cyanes:** `--dd-cyan`, `--dd-cyan-bright`, `--dd-cyan-ice`, `--dd-cyan-soft`
- **Dorados:** `--dd-gold`, `--dd-gold-soft`, `--dd-gold-pastel`, `--dd-gold-deep`, `--dd-amber`
- **Tipografía:** `--dd-text-2xs` **12px** · `--dd-text-xs` **13px** · `--dd-text-sm` 14px · `--dd-text-md` 16px · `--dd-text-lg` 20px · `--dd-text-xl` 24px · `--dd-text-2xl` 26px
- **Espacio / radios / sombras / z / movimiento:** `--dd-space-1..8` (4–32px) · `--dd-radius-sm/md/lg` · `--dd-shadow-panel/soft` · `--dd-z-hud` (6200) `--dd-z-cine` (9200) `--dd-z-menu` (9500) · `--dd-motion-fast/motion`
- **Heredados (estaban referenciados sin definir; ahora existen):** `--dd-coral` → alias a `--dd-pink-soft`; `--dd-core` → alias a `--dd-gold-pastel` (bug latente pre-existente, ver §6)

### Cobertura (antes → después)

| Métrica | FASE 0 | FASE 1 |
|---|---|---|
| Ocurrencias hex sueltos (valores) | 226 | **113** |
| Únicos (valores) | 106 | **104** |
| Con `var(--dd-*)` en el CSS | 167 | **299** |
| `font-size` ≤ 11,5 px | 39 lugares | **0** (todo ≥ `--dd-text-2xs` = 12 px) |
| 12 px sueltos | 19 | 0 (→ `--dd-text-xs` = 13 px) |

Los 104 únicos restantes son: definiciones de los propios tokens, tintes alfa de una pieza (`#000b`, `#ffffff24`…), los 2 hex del par duplicado `.dd-look-swatch-gold`, y casos singulares documentados en §7. **La migración total del lienzo (canvas) queda fuera**: `dd_world_renderer.js` pinta con `rgba()` inline y es materia de FASE 4/5.

## 3. TXT-1 · Piso mínimo tipográfico

Todo `font-size` ≤ 10 px pasó a `--dd-text-2xs` (12 px); los 10.5–11.5 px, también; los 12 px sueltos pasaron a `--dd-text-xs` (13 px). Comprobado: **ningún `font-size` numérico por debajo de 12 px**; ninguna declaración nueva introduce < 12 px.

## 4. TXT-3 · Accesos rápidos sólo en el Refugio

Durante la partida (fuera de `DD_HUB.isActive()`), la fila **ARMERÍA · TORRE · [H] REFUGIO** se oculta (misma señal `inHub` que usa el resto del HUD; `#dd-boss-hud` ya seguía ese patrón). La tecla **H sigue funcionando** como salida de emergencia deliberada — se oculta la fila de botones, no la vía de escape.
- Medido: `display: none` en combate a 1280×900 y 390×844 (sonda); `display: flex` en el Refugio.
- Confirmación visual: comparación `07-hud-03-gula-1280x900.jpg` FASE 0 (botones visibles) → `…/fase1/07-hud-03-gula-1280x900.jpg` (sin botones).

## 5. MOB-1 · HUD compacto ≤ 560 px

Nuevo bloque `@media (max-width: 560px)`: panel de vitales con `max-width: calc(100vw - 152px)`, retrato 52 px, iconos de vida 16 px, emblema crítico (`M1911 · ∞`) con elipsis, minimapa 136×92, banner de sala con ajuste de línea y `top/right: 8px`. Resultado medido (sonda, build nuevo): utilidades sin solape a 390×844 (vitales 8→246 px; minimapa 246→382 px; corazones dentro del viewport) y a 1280×900 sin cambios geométricos (`vitalsRight 388 px`, `minimapLeft 1066 px`).

## 6. Hallazgos y arreglos incidentales (documentados, no ocultos)

1. **El pase de tokens rompió 4 selectores `#ddc-*`** (ids de la capa legacy: `#ddc-cover/-img/-fx`): el reemplazo mecánico de `#ddc` los convirtió en `var(--dd-taupe)-cover` e invalidó 3 reglas completas — con ello la capa legacy (`#hud`, `#dmo-compact-hud`, `#subs`, `#minimap`, `#pause-btn`, `#audio-btn`) volvió a pintarse sobre el HUD HD (se vio en las primeras capturas de la fase: «GOD MODE», «NV.1 P0…», recuadro de sala duplicado). **Corregido**; sonda posterior: capa legacy `opacity: 0`, `#ddc-cover` `display: none`, 0 pageerror. Las capturas finales de `ART_EVIDENCE/art_quality/fase1/` son ya del build corregido.
2. **`--dd-coral` y `--dd-core` estaban referenciados en el build sin estar definidos** (bug latente pre-existente). Definidos como alias (`--dd-pink-soft`, `--dd-gold-pastel`). **Pendiente de confirmación de la dirección artística** (Fase 2): si se quiere un coral distinto, es un cambio de una línea en `:root`.
3. **`.dd-look-swatch-gold` está duplicada** (misma regla dos veces) y conserva `#eebd46`/`#ff2d7a44` sueltos: queda como micro-tarea en §7 — no se corrigió aquí para no invalidar la evidencia capturada.
4. **Los fps SwiftShader de esta tanda son señal relativa** (ver FASE 0 §3.9): menú ~18, EXTRAS ~9–10, arenas de jefe 35–58 en 390 px. Sin puerta de rendimiento hasta FASE 6.

## 7. Trabajo pendiente derivado (fuera de esta fase, no empezado)

- Migrar los 104 hex únicos restantes (alfa de una pieza y casos singulares) y deduplicar `.dd-look-swatch-gold` (convertir `#eebd46` → `var(--dd-gold-deep)`, `#ff2d7a44` → `rgba()` con el token `--dd-pink-*`).
- Tokens sobre el lienzo (`dd_world_renderer.js`, `rgba()` inline) → Fase 4/5.
- `--dd-coral`: valor definitivo y su contraste (Fase 2).
- PJE-4 (barra de jefe con el color del círculo) → Fase 5; TXT-2 (minimapa) → Fase 4.

## 8. Pruebas: antes / después

**Antes** = evidencia FASE 0 (`ART_EVIDENCE/art_quality/fase0/`, generada 2026-11-26T01:59Z sobre la build auditada `6fdba6c4…`, es decir, byte idéntica a `backups/*_PRE-FASE1_2026-11-26.html`).
**Después** = misma máquina, mismo arnés (`tools/qa/capture_art_audit_fase0.js`), `ART_EVIDENCE/art_quality/fase1/` (generada 2026-11-26T03:00Z).

| Prueba | Resultado |
|---|---|
| Capturas 29 pantallas × 3 resoluciones | 87/87 rehechas; `captures.json` 90 entradas; **`errors: []`** |
| Sonda HUD (probe) | vitals/minimapa sin solape ≤560 px; `dd-combat-hidden` activo en combate y ausente en el Refugio; 0 pageerror |
| `test_menu_respuesta.js` (52 comprobaciones, menú/OPCIONES/EXTRAS/mando) | **52/52 en 4 de 6 ejecuciones** (build corregida incluida, ejecución limpia tras la captura: 52/52). Fallos puntuales: 1× 51/52 (`[CRÉDITOS]`, flaky) y 2 timeouts atrapados con la captura corriendo en paralelo (menú→OPCIONES, misma puerta que el flake). **Ningún fallo en el build estable; el build previo al fix no es comparable (tenía el bug §6.1)** |
| `test_persistencia.js` / `test_restart_flow.js` / `test_hud_vitals.js` | **Mismo resultado antes y después**: los tres abortan en este sandbox en la misma puerta (`waitingGesture`/`INTRO`, timeout 60 s) por starvation de rAF en SwiftShader headless — **idéntico en la build pre-FASE 1** (verificado ejecutándolas contra la copia de respaldo). No hay regresión atribuible a esta fase |
| Geometría HUD 4 tamaños (`test_hud_vitals`) | Bloqueada por el mismo entorno (antes/después idéntico); geometría verificada con sonda propia (ver §5) |
| fps (SwiftShader, señal relativa) | 1280×900: menú 5,9→9,3 · hub 9,3→12,6 · gula 15,8→23,5 · jefe Cajero 13,0→18,7 · victoria 15,9→24,0. 1920×1080: menú 4,4→6,2. 390: sin cambio apreciable (dentro del ruido). **No es una puerta de rendimiento**; sólo confirma que no hay regresión de pintado |
| A/B visual teclado→foco→EXTRAS | Menú, atuendos, EXTRAS, resultados, cartas de jefe: sin cambios estructurales; tipografía ligeramente mayor en rótulos (esperado, TXT-1) |

**Conclusión:** sin regresiones detectadas; los tres fallos de la tabla existen igual en la build de FASE 0 en este entorno (documentados como límite de QA del sandbox, no del juego).

## 9. Límites y decisiones pendientes

- **Sin merge implícito.** Esta fase, como la FASE 0 (PR #38), queda en borrador pendiente de la revisión de la dirección. **FASE 2 NO se abre sin visto bueno.**
- Rama fija por el entorno de trabajo (`arena/46b8bb0f-deadbeat-disconew`): los commits de FASE 1 van **encima** de los de FASE 0 en esta rama y en el PR #38 hasta que éste se fusione; tras la fusión, los commits de FASE 1 forman su propio PR a `main`. No se crea ni se cambia de rama en esta sesión de trabajo.
- F6 queda **iniciado, no agotado**: el lienzo usa `rgba()` inline y las ~104 excepciones singulares quedan listadas en §7.
- Paleta (`REF_06`): sin tocar; el botón `JUGAR` amarillo fuera de paleta y el contraste del foco siguen siendo materia de Fase 2/3 (TXT/ACC), no de esta fase.
