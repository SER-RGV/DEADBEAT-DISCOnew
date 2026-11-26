# FASE 2 · DESTELLOS INDEPENDIENTES, FOCO DE PORTADA, «SIN INCURSIÓN» Y SALA DE JEFE

**Estado: EN REVISIÓN (dirección) — 2026-11-26**
**Rama:** `arena/46b8bb0f-deadbeat-disconew` · apilada sobre FASE 0 (`05910f4`) y FASE 1 (`182252a`) · PR #38 (abierto, sin merge)

---

## 1. Alcance (cerrado en la auditoría, tabla §5 de `00_AUDITORIA.md`)

| ID | Hallazgo (auditoría §3) | Antes |
|---|---|---|
| ACC-2 | Flashes de cámara (`dd-flash-a/b/c`) y estrobo (`dd-strobe`) sólo ceden ante `prefers-reduced-motion`; **no existía** una vía independiente de reducir destellos | CSS |
| ACC-3 | Botón enfocado/seleccionado de la portada: bloque amarillo + **texto en degradado naranja** (recorte legado `--dd-gold-grad` vence a `color`) | `01-menu-*.jpg` (fase1) |
| TXT-4 | Panel del minimapa en HUB: negro muerto con marco magenta, rótulo «SIN INCURSIÓN» en 11 px | `05-hub-1280x900.jpg` (fase1) |
| TXT-8 | Sala de jefe rotulada «CÁMARA DEL RESIDENTE» en las diez arenas; no nombra al Residente | `08-jefe-*.jpg` (fase1) |

**Fuera (decisión de alcance, sin tocar):** TXT-2 (minimapa), TXT-7 (posición del banner según círculo), CAM-*, MAT-*, CIN-*, PJE-*, FX-2/CIN-5 (wash AVARICIA, Fase 5), fases 3–6.

## 2. Método y verificación

- Backups previos: `backups/index_PRE-FASE2_2026-11-26.html` / `DEADBEAT_DISCO_PRE-FASE2_2026-11-26.html` (SHA-256 `3f13a20d…`, byte-idénticos al commit FASE 1 `182252a`).
- Build: `python3 tools/build_active_html.py` → `index.html` ≡ `DEADBEAT_DISCO.html`, **5.740.512 B** (+7.205 B vs 5.733.307 B).
- `node --check src/dd_ui_system.js` OK.
- **Sondas: `tools/qa/probe_fase2.js` → 34/34 en verde** (extrae y ejecuta el código real: `bossChamberBanner`, `drawMinimapEmptyState` con contexto grabador; verifica además el build generado y el parseo de los **14 scripts inline**; llaves CSS balanceadas 1000/1000).
- `node tools/qa/probe_fase2.js` termina con `FASE 2 · todas las comprobaciones en verde`.
- Servidor estático en **:8124** con el build FASE 2 para vista previa en navegador.

### 2.1 Limitación honesta de esta sesión

**El entorno no dispone de navegador ni de binarios chromium instalables** (sin red a los CDNs de navegadores; los hostnames de descarga devuelven 000). Por tanto **no se han podido regenerar capturas antes/después**; las de FASE 1 documentan el «antes». La validación visual del «después» queda pendiente de abrir el build en un navegador (en marcha en :8124) o de una sesión con el arnés `tools/qa/capture_art_audit_fase0.js` (fase1 → fase2). No se reporta ninguna captura nueva ni ningún fps; nada de lo aquí escrito sustituye a esa revisión.

### 2.2 Corrección de registro (honesta)

La cifra «5.725.924 B» citada en informes previos no corresponde al artefacto commiteado en `182252a` (real: **5.733.307 B**, verificado con `git show 182252a:index.html | wc -c` y SHA-256). Se usa la cifra real; el delta de FASE 2 es +7.205 B.

### 2.3 Incidente de entorno (transparencia)

El clon local arrancó la sesión con HEAD en el commit base (`6087057`) y **todo FASE 0+1 como cambios sin commitear** (los refs locales a `05910f4`/`182252a` no existían). Se verificó por SHA-256 que el árbol de trabajo era **byte a byte idéntico a `182252a`** (muestras: capturas, `src/dd_ui_system.js`, `index.html`, `docs/ART_QUALITY/01_TOKENS.md`) y se reancló la rama con `git reset --mixed FETCH_HEAD`. Cero contenido perdido; el remoto siempre estuvo correcto (`182252a`, PR #38 abierto).

## 3. ACC-2 · «Reducir destellos» independiente del sistema

**Diagnóstico.** El motor ya respetaba `dmodisco_a11y_v1.flash` (`flashAllowed()`) y `.shake` (`shakeAmount()`); la intro (`dd_opening.js`) también; el tick del beat-light en `dd_ui_system.js` también. **Pero los flashes CSS de la portada** (`dd-flash-a/b/c` sobre `.dd-menu-vig::after`) **y el estrobo** (`dd-strobe` sobre `.dd-menu-beat-light`) sólo se apagaban bajo `@media (prefers-reduced-motion: reduce)`. OPCIONES tampoco exponía el ajuste como control propio.

**Cambios.**

- `src/dd_rebuild_ui.css`: nuevas reglas tras el bloque `prefers-reduced-motion` de la sección de flashes:
  `body.dd-no-flash #dd-main-menu.dd-rs .dd-menu-vig::after { animation: none !important; opacity: 0 !important; }`
  `body.dd-no-flash #dd-main-menu.dd-rs .dd-menu-beat-light { animation: none !important; filter: none !important; opacity: 0 !important; }`
- `src/dd_ui_system.js`: `applyA11yFlashClass()` sincroniza `<body class="dd-no-flash">` con `dmodisco_a11y_v1.flash`. Se ejecuta en `buildDOM()` (arranque), en `tickInner()` (cada latido; cubre el checkbox legacy, que escribe la clave por su cuenta) y en `toggleA11y()` (inmediato).
- OPCIONES → **ACCESIBILIDAD** (sección nueva en el panel VÍDEO): filas **«DESTELLOS DE PANTALLA»** y **«SACUDIDA DE CÁMARA»** (`dd-opt-flash` / `dd-opt-shake`; los handlers ya existían pero no tenían botón). El botón propio sincroniza el checkbox legacy vía `internal.click()` como antes; al reabrir OPCIONES el estado se relee de `localStorage`.
- El `prefers-reduced-motion` existente **no se toca**.

**Fuera del alcance de ACC-2 (declarado):** `dd-logo-glitch` / `dd-aura-burst` (carácter de identidad REF_06; decidir con dirección), `dd-travel-light` del travelling (terreno CIN, Fase 3), wash rojo de AVARICIA (FX-2/CIN-5, Fase 5). El checkbox legacy «Destellos de pantalla» (MEZCLA DEL JUEGO) sigue visible: **dos controles, un ajuste**, sincronizados; retirada del duplicado queda como decisión pendiente.

## 4. ACC-3 · Foco/selección del botón de portada

**Causa raíz.** La regla heredada `#dd-main-menu .dd-menu-btn:hover/:focus-visible/.dd-selected .dd-btn-text b` aplicaba `--dd-gold-grad` recortado al texto (`background-clip: text` + `-webkit-text-fill-color: transparent`). La variante `.dd-rs` fijaba `color: var(--rs-ink)` pero **no** `-webkit-text-fill-color` ni el `background`; el texto se pintaba en degradado naranja sobre el brochazo amarillo. Esto es exactamente lo que denunció la auditoría («bloque amarillo plano con texto degradado naranja»).

**Cambio.** En `.dd-rs` se anula el recorte para hover/focus-visible/selected: `background: none; -webkit-background-clip: border-box; background-clip: border-box; -webkit-text-fill-color: currentColor; color: var(--rs-ink); filter: none; text-shadow: none;` (`src/dd_rebuild_ui.css`). El brochazo, el amarillo REF_06 y el `outline :focus-visible` (`--rs-cyan`, 2 px, offset 4 px) no cambian; el outline ya seguía el sistema.

## 5. TXT-4 · Panel «SIN INCURSIÓN»

**Diagnóstico.** Lienzo `#06030c` plano + «SIN INCURSIÓN» en 11 px `#a4b2c5` + marco magenta de alerta: un hueco negro muerto que delataba ausencia de diseño.

**Cambio (`drawMinimapEmptyState`, `src/dd_ui_system.js` + `.dd-minimap-box.is-empty`).**

- Resplandor radial cian tenue tras el glifo; retícula de puntos `rgba(131,245,241,0.12)`; dos anillos de radar; **glifo de torre almenada dorado** (trazo, `rgba(250,204,21,0.92)`) con puerta; guiño directo al botón que abre la torre de progresión.
- Rótulo **«SIN INCURSIÓN»** (800, 13 px, `#f8ecf6` ≡ `--dd-text`) y subtítulo **«EL DESCENSO REVELA EL MAPA»** (600, 12 px, `rgba(131,245,241,0.82)` ≡ `--dd-cyan-ice`): **piso TXT-1 = 12 px respetado** en canvas.
- Marco del panel en estado vacío: cian sereno (`rgba(34,211,238,0.38)` + glow `0 0 12px rgba(34,211,238,0.12)` ≡ `--dd-cyan`) en lugar del magenta de alerta; `:focus-visible` intacto.
- Colores = **tokens existentes** (documentados en el código: `#06030c` ≡ `--dd-bg-ink`, `#22d3ee` ≡ `--dd-cyan`, `#f8ecf6` ≡ `--dd-text`, `#83f5f1` ≡ `--dd-cyan-ice`, `#facc15` ≡ `--dd-gold`). `drawMinimap` pone/quita `is-empty` según haya o no mapa real; con partida viva se comporta como antes (copia el lienzo del motor) y el botón sigue abriendo la torre.

## 6. TXT-8 · Nombre de la sala de jefe

**Diagnóstico.** La arena de jefe del motor (`camara_residente_n`, `camara_jefe_ring`) se llama «CÁMARA DEL RESIDENTE» en las diez plantas; el banner mostraba «CÁMARA DEL RESIDENTE · CÍRCULO I · LIMBO». Las arenas con nombre SÍ existen en los datos de planta («CÁMARA DEL PORTERO», «CÁMARA DE MAGNETA», «CÁMARA DEL BUFÉ», «CÁMARA DEL CAJERO», «CÁMARA DEL POGO», «CÁMARA DEL OFICIANTE», «CÁMARA DEL MATARIFE», «CÁMARA DEL IMITADOR», «CÁMARA DEL TRAIDOR», «NÚCLEO FINAL · LA ÚLTIMA CANCIÓN») pero no llegaban al banner.

**Cambio (sin tocar el motor).** `bossChamberBanner()` en `src/dd_ui_system.js`: con jefe activo sustituye el prefijo «CÁMARA DEL RESIDENTE[ II]» por la arena del círculo (`BOSS_CHAMBERS`, orden I LIMBO…NÚCLEO; círculo se clampa a [0,9]). En NÚCLEO devuelve directamente «NÚCLEO FINAL · LA ÚLTIMA CANCIÓN» (evita duplicar el sufijo). Fuera de jefe, banner intacto. Variante gemelo («…RESidente II») cubierta por regex. Utilidades expuestas en `window.DD_FASE2` para las sondas (mismo patrón que `DD_BOOT`/`DD_UI`/`__DD_BRIDGE`).

**Resultado esperado:** «CÁMARA DEL PORTERO · CÍRCULO I · LIMBO», «CÁMARA DE MAGNETA · CÍRCULO II · LUJURIA», «CÁMARA DEL BUFÉ · CÍRCULO III · GULA», «CÁMARA DEL CAJERO · CÍRCULO IV · AVARICIA», «CÁMARA DEL POGO · CÍRCULO V · IRA», «CÁMARA DEL OFICIANTE · CÍRCULO VI · HEREJÍA», «CÁMARA DEL MATARIFE · CÍRCULO VII · VIOLENCIA», «CÁMARA DEL IMITADOR · CÍRCULO VIII · FRAUDE», «CÁMARA DEL TRAIDOR · CÍRCULO IX · TRAICIÓN», «NÚCLEO FINAL · LA ÚLTIMA CANCIÓN».

**Nota.** TXT-7 (el rótulo salta de línea en NÚCLEO) **no** es TXT-8 y no se ha tocado.

## 7. Riesgos y compatibilidad

- Núcleo: con jefe activo y círculo ≥ 9 el banner se sustituye entero por el nombre authored; fuera de jefe no aplica.
- El motor, el puente, la cámara cinemática y la escena de paso: sin cambios.
- Build byte-idéntico entre `index.html` y `DEADBEAT_DISCO.html`; los 14 `<script>` inline parsean (vm).
- Regresión con navegador (capturas 87/87, menú 52/52, persistencia/restart/hud_vitals): **no ejecutable en esta sesión** (§2.1). Comportamiento idéntico en SwiftShader esperado pero NO verificado.

## 8. Pendiente para la dirección

1. Vista previa del build (:8124) o regenerar capturas `tools/qa/capture_art_audit_fase0.js fase2` en un entorno con navegador — puntos a mirar: menú (JUGAR: tinta oscura sobre brochazo, sin degradado), HUB (panel SIN INCURSIÓN diseñado), sala de jefe (banner con nombre), OPCIONES → ACCESIBILIDAD (nuevo), y el ajuste DESTELLOS=NO (portada sin flashes).
2. Decidir retirada del duplicado legacy de los toggles; y si `dd-logo-glitch`/`dd-travel-light` deben considerarse «destellos reducibles».
3. Sigue abierto de FASE 1: `--dd-look-swatch-gold` duplicada (§7 de `01_TOKENS.md`) y confirmación de los alias `--dd-coral`/`--dd-core`.
4. Fase 3 (CIN-3 cartel de círculo, CIN-7 HUD, CIN-2, TXT-5): sin abrir.

## 9. Evidencia

- Antes (FASE 1, en este repo): `ART_EVIDENCE/art_quality/fase1/05-hub-1280x900.jpg` («SIN INCURSIÓN»), `08-jefe-01-limbo-1280x900.jpg` (banner), `01-menu-1280x900.jpg` (foco).
- Sondas: `tools/qa/probe_fase2.js` (34/34). Backups: `backups/index_PRE-FASE2_2026-11-26.html`, `backups/DEADBEAT_DISCO_PRE-FASE2_2026-11-26.html`.
- Build: `index.html` ≡ `DEADBEAT_DISCO.html`, 5.740.512 B, SHA-256 `6365b62b…`.
