# FASE 1 — CONTRATO TÉCNICO DE ASSET (Deadbeat Disco, reconstrucción 2026-11)

Vinculante para todo asset nuevo o regenerado en `docs/TOTAL_ART_REBUILD/`. Derivado de `ART_BIBLE.md`, del pipeline real (`tools/asset_pipeline.py`, `tools/build_active_html.py`, `src/dd_world_renderer.js`, `src/dd_hub_system.js`) y de las 12 láminas de referencia. Si algo aquí contradice una lámina, gana ART_BIBLE (ver `00_AUDIT_REPORT.md §5`).

## 1. Escala, perspectiva y pivotes

- **Perspectiva:** la del motor (ortográfica isométrica/2.5D del build activo). Los diamantes de suelo son 2:1 cuando el módulo es «material de suelo». Los muros/props son sprites con apoyo en suelo.
- **Tile de suelo:** **512×512, opaco, seamless** (cosine cross-blend en `make_seamless_tile`), sin viñeta, sin objetos, sin bordes. Repite con `repeat` + offset del motor.
- **Muros/pilares:** modular, **256×384** (paneles) y **192×384** (pilares), RGBA, baseline inferior = línea de suelo de sala. Misma familia de baseline en todo el set.
- **Props:** RGBA, pivote **`bottom-center`**, apoyo en el baseline del prop (la sombra la pinta el motor, nunca el sprite). Anchura draw-time ≈ `max(64, min(240, br*2.55))` px lógicos; el arte debe leerse ahí (silueta > detalle).
- **Personajes/enemigos/jefes:** pivote `bottom-center`; pies en la franja inferior del PNG (~88–94 % de la altura); altura de dibujo alineada con `ENEMY_FOOT_K`/`BOSS_FOOT_K` (no cambiar esas constantes ni hitboxes). Mínimo 2 variantes por familia ya existente; élite = paleta/rim, no silueta nueva (salvo lámina).
- **iconos HUD/UI:** RGBA, pivote `center`, rejilla 44/64/128 px, trazo nítido ≥ 2 px a tamaño final. Sin texto incrustado cuando el texto lo pinta la UI.
- **Cinemáticas/paneles opacos:** cover-fit al área de diseño, JPEG/WebP (PNG si tiene canal alfa funcional). Nada de upscales borrosos.

## 2. Perspectiva de luz, materiales y color

- **Fuente de luz:** noroeste (vista del artista). **Rim light** magenta a un lado y cian al otro cuando aporte lectura. **Bloom solo en emisores de neón** (overlays aditivos o PNG de glow en `effects/`).
- **Sombras de contacto:** las calcula el motor. **Prohibido hornearlas**. El fondo de generación (verde croma / negro puro) es croma técnico: se elimina en postproceso (despill + flood-fill); esquinas RGBA transparentes.
- **Materiales (familia → respuesta especular):** piedra pulida, mármol, metal cepillado, cromo, terciopelo, cristal, tela, hueso, hielo. 2–3 tonos por material (base/sombra/reflejo). Prohibido ruido/dither/grano/pixelado artificial.
- **Neón ≤ ~15 % de la superficie** de un entorno; fondos de sala de baja saturación y valor; personajes con saturación superior; peligro = rojo/cian saturado; interacción = magenta/oro; rareza = oro→violeta→cian.
- **HUD:** chasis `#0a0c12`, texto crema/oro claro, atención magenta. Nada de blancos/verdes puros de fondo.

### Paleta por círculo (láminas ↔ `circle_themes.json` / `CIRCLE_CONFIG`)

| idx | Lámina | bg | mid | hi | neón | secundario | referencia |
|---|---|---|---|---|---|---|---|
| 0 | HUB / Refugio | `#0e1525` | `#1e293b` | `#475569` | `#38bdf8` | `#94a3b8` | hub panorámico |
| 1 | I Lujuria | `#1b0826` | `#3b0f4c` | `#86198f` | `#ff2d95` | `#c084fc` | `Mapa de Diseño_ Círculo I, Lujuria` |
| 2 | II Gula | `#210e09` | `#431a0e` | `#9a3412` | `#f97316` | `#facc15` | `Mapa de Gula_ Discoteca Infernal` |
| 3 | III Avaricia | `#171206` | `#36280a` | `#854d0e` | `#facc15` | `#fef08a` | `Mapa de Avaricia_ Deadbeat Disco` |
| 4 | IV Ira | `#210709` | `#450a0a` | `#991b1b` | `#ef4444` | `#fb923c` | `Mapa de Nivel_ Ira en Deadbeat Disco` |
| 5 | V Herejía | `#150826` | `#2e1065` | `#6b21a8` | `#a855f7` | `#c084fc` | `Mapa de Herejía Neon-Gótica` |
| 6 | VI Violencia | `#091813` | `#102a1e` | `#166534` | `#4ade80` | `#86efac` | `Mapa de Nivel_ Violencia Industrial Neon` |
| 7 | VII Fraude | `#081829` | `#0c2438` | `#155e75` | `#22d3ee` | `#ff2d7a` | `Mapa neón/Mapa de fraude` |
| 8 | VIII Traición | `#081526` | `#0f1f3a` | `#1e3a5f` | `#7dd3fc` | `#f43f5e` | `Mapa infernal_ Círculo IX, Traición` |
| 9 | IX Núcleo | `#120924` | `#241234` | `#3b2a4f` | `#e2e8f0` | `#ff2d7a` | collage + guía maestra |

(Confirmar contra `ART_AUDIT/reference_palette.json` cuando se produzca cada tanda; estos hex son el contrato de partida.)

## 3. Nomenclatura y carpetas (estructura real, sin redundancia)

- IDs: `familia_material_variante` en minúsculas `snake_case` (`floor_08_ice_abyssal`). Nuevos del kit HUB: prefijo `hub_`. Nuevos firma por círculo: `prop_<círculo>_<objeto>` (p. ej. `prop_gula_hook_rack`). Variantes de estado: sufijo `_open/_closed/_on/_off/_destroyed`.
- Rutas: `assets/floors|walls|props|environments|enemies|bosses|weapons|effects|pickups|ui|logos|characters` — las ya existentes. Nada de `art_assets/v2/` paralelo.
- Manifiesto: cada entrada con **`id`, `originalId`, `name` (español), `category`, `src`, `w`, `h`, `alpha`, `pivot`, `tanda`, `sha16`**. Se regenera con `python3 tools/asset_pipeline.py --rebuild-registry` (escribe `src/dd_asset_registry.js` y `assets/manifest.json`). Si se añaden entradas a mano, replicar el esquema exacto y bump `ASSET_CACHE_VERSION`.
- Tamaño máximo práctico: suelos/muros/props ≤ 512–1024 px; nada > 2048 excepto cinemáticas.

## 4. Estados y capas

- Puertas/cofres/máquinas: `normal/activado/desactivado/bloqueado/destruido` como **PNG separados** con el mismo ID base + sufijo; el motor decide cuándo mostrar cada uno (si el motor no expone estados, solo se entregan los que consume; nunca se inventa lógica).
- Emisores (neón, fuego, plasma): sprite base + **overlay aditivo** (`effects/`); el overlay nunca sustituye al emisor base.
- Variantes de jefe: reutilizar `idle/attack/hit/death` ya registrados; fases especiales solo si el motor lee estados adicionales (auditoría previa obligatoria).

## 5. Pipeline de producción (reproducible)

1. **Generación**: `generate_image` con prompt que cite la lámina (círculo, paleta hex, material, luz NW, rim, sin texto, fondo croma/negro puro, silueta legible). Una imagen = un asset; nunca un collage ni «4 variaciones» en un PNG.
2. **Postproceso** (Python/PIL + numpy; método de `tools/asset_pipeline.py`): recorte de fondo por color de borde, despill, flood-fill exterior, `fit_rgba_to_canvas` con pivote, `make_seamless_tile` si es floor, `save_optimized_png`. Medir: dimensiones exactas, esquinas transparentes, **halo ≤ 0,2 %**, sin bordes de croma.
3. **Registro**: mover a `assets/<familia>/`, `--rebuild-registry`, comprobar `node --check src/dd_asset_registry.js` y `DD_ASSETS.stats()` sin errores ni 404.
4. **Wiring**: clase B → solo bump `?v=`; clase C → `CIRCLE_CONFIG`/`PROP_KIND_TO_ASSET`/`DD_HUB`/CSS según familia; **sin** tocar hitboxes, stats ni progresión.
5. **Build**: `python3 tools/build_active_html.py`; el workflow regenerá lo mismo en CI (`.github/workflows/rebuild-active-html.yml`).
6. **Evidencia**: hashes (SHA-256) del PNG final + (cuando haya navegador) captura A/B en `ART_EVIDENCE/<tanda>/`. **Ningún PASS sin ejecutar.**

## 6. Checklist de aceptación por asset (gate de tanda)

- [ ] Dimensiones exactas y formato correcto (RGB/RGBA)
- [ ] Esquinas/borde transparente cuando aplica; halo ≤ 0,2 %
- [ ] Tile de suelo: repetible sin costura visible a 128 px de miniatura
- [ ] Ancla/pivot correcto; baseline alineado con el motor (props/entidades)
- [ ] Paleta del círculo (±5 % ΔE sobre los hex de §2)
- [ ] Sin texto incrustado; sin sombras horneadas; sin halos de croma; sin dither/grano
- [ ] Nombre/ID/ruta/manifest coherentes; `?v=` incrementado
- [ ] Integrado: referenciado en código activo y **medido** (drawImage o visibilidad real) o declarado «producido, no integrado» con motivo
- [ ] Evidencia/hash archivados; commit pequeño; CHANGELOG/estado actualizados

## 7. Restricciones que ningún prompt puede saltar

Motor, hitboxes, colisiones, stats, progresión, saltos de cámara: **inmutables**. Láminas: solo lenguaje visual. Numeración: la del motor. HUD: sin renombrados en fases de arte. Documentos históricos: intocables. Prohibido declarar «integrado/PASS» sin ejecución real; prohibido borrar recursos antes de FASE 7; prohibido usar una lámina completa como textura de fondo.
