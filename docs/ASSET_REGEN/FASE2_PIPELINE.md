# FASE 2 · Flujo de regeneración reproducible

**Versión:** 1.0.0 · **Generado:** 2026-11-26

## Objetivo

Definir un flujo de regeneración de arte **reproducible, reversible y no destructivo** que:
1. Separa la generación (raw sobre verde croma) del postproceso (mate alfa + encaje a contrato).
2. NUNCA sobrescribe un asset del juego sin backup previo.
3. Permite rollback con un solo comando.
4. Registra cada lote con su informe QC.
5. Valida dimensiones/peso/alfa/QC antes de aplicar.

## Convenciones

- **Lotes** definidos en `docs/ASSET_REGEN/LOTES_PLAN.json` (13 lotes).
- **Salida del postproceso:** `assets/_regen/LOTE_XX/<category>/<id>.png` (nunca toca `assets/<category>/` sin paso de *apply*).
- **Maestro WebP:** `assets/_regen/LOTE_XX/_masters/<id>.webp`.
- **Raw (entrada):** directorio con los PNG brutos del generador sobre verde croma `#00ff00`.
  - Por defecto: `assets/_regen/LOTE_XX/_raw/<id>.png`.
  - Se puede especificar otra ruta con `--raw`.
- **Backup antes de aplicar:** `backups/regen/LOTE_XX_pre<BATCH>/...` (espejo de `assets/`).
- **Registro de aplicación:** `assets/_regen/LOTE_XX/<batch>.applied.json` (permite rollback).
- **Informe QC de postproceso:** `assets/_regen/LOTE_XX/<lote>.report.json`.
- **Informe de validación:** `assets/_regen/LOTE_XX/<lote>.validation.json`.

## Herramientas

| Script | Función |
|---|---|
| `tools/regen/planner.py` | Genera los JSON de lote en `docs/ASSET_REGEN/LOTES/` desde el plan + `assets/prompts.json`. |
| `tools/regen/process_lote.py` | Toma PNG crudos (verde croma), hace mate alfa con `artlib.py`, encaja al lienzo del contrato, guarda PNG final en `_regen/` + WebP maestro + hoja de contacto + informe. |
| `tools/regen/validate_lote.py` | Verifica dimensiones, canal alfa, peso, flags QC y presencia de maestro tras procesar. |
| `tools/regen/apply_lote.py` | Hace backup de los assets existentes, copia lo nuevo a su ubicación final en `assets/`, actualiza `assets/manifest.json` y `src/dd_asset_registry.js`, regenera el HTML. Tiene `--dry-run`. |
| `tools/regen/rollback_lote.py` | Lee el `.applied.json` más reciente, restaura desde backup o borra assets nuevos, reconstruye manifest/registry, regenera HTML. Tiene `--dry-run`. |

Se apoya en la biblioteca existente `tools/art_master/artlib.py` (mate alfa, encaje, QC) y en `tools/art_master/batch.py` como referencia de formato.

## Flujo típico por lote

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GENERAR imágenes con IA/ilustrador sobre verde croma     │
│    #00ff00 (entrada: PNG crudos en _raw/<id>.png)           │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. POSTPROCESAR                                              │
│    python3 tools/regen/process_lote.py \                     │
│        docs/ASSET_REGEN/LOTES/LOTE_XX.sample.json \          │
│        --raw assets/_regen/LOTE_XX/_raw/                    │
│    (genera PNG final en _regen/LOTE_XX/, WebP, report.json) │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. VALIDAR                                                   │
│    python3 tools/regen/validate_lote.py LOTE_XX.sample       │
│    (comprueba dimensiones, alfa, peso, QC flags)            │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. REVISIÓN VISUAL (humano)                                  │
│    Hoja de contacto en assets/_regen/LOTE_XX/_qc/           │
│    Comparar contra referencias. APROBACIÓN REQUERIDA.       │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. APLICAR al juego (backup + copia + manifest + build)    │
│    python3 tools/regen/apply_lote.py LOTE_XX.sample          │
│    (usa --dry-run para simular antes)                       │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. VERIFICAR EN JUEGO                                       │
│    - HTML regenerado.                                       │
│    - Cargar la zona afectada.                               │
│    - Si falla: python3 tools/regen/rollback_lote.py LOTE_XX │
└─────────────────────────────────────────────────────────────┘
```

**Repetir el ciclo 1-6 para las 5 muestras**, y tras aprobación visual del lote de muestras, repetir con `LOTE_XX.json` (completo) en lugar de `.sample.json`.

## Orden de lotes

| Lote | Fase | Qué | Prioridad |
|---|---|---|---|
| LOTE_00 | 3A | Iconos HUD, emblemas pequeños, logos (sin retratos) | alta |
| LOTE_01 | 3B | Suelos (13 tiles 512×512) | alta |
| LOTE_02 | 3B | Muros y entornos (19 paneles/puertas) | alta |
| LOTE_03 | 3C | Props del Refugio y firma por círculo | alta |
| LOTE_04 | 3C | Pickups y reliquias | media |
| LOTE_05 | 3D | Armas (pixel-art coherente; evaluación previa) | **decisión** |
| LOTE_06 | 3D | Efectos y proyectiles VFX | media |
| LOTE_07 | 3A2 | Retratos UI, backdrop de menú, logo cinemático | media |
| LOTE_08 | 3E | Enemigos (usar R02 como semilla) | media |
| LOTE_09 | 3F | Jefes (usar R03 como semilla) | media |
| LOTE_10 | 3G | Protagonista (animaciones de combate) | **bloqueado** (aprobación explícita) |
| **LOTE_11** | **3H** | **Cinemáticas: corrección bug capas duplicadas** | **crítico** |
| LOTE_12 | 3H | Cinemáticas: composite bg y escenas de círculos | media |

## Reglas de postproceso (heredadas de artlib)

- **Croma verde #00ff00**: mate por dominancia (g - max(r,b)) con banda de 3 px. Modo `hard` para personajes/objetos; `none` para tiles opacos.
- **Despill (descontaminación)**: limita el canal verde en los bordes a max(r,b).
- **Encaje al contrato** (`fit`):
  - `contain`: cabe entero con halo, centrado (sprites).
  - `cover:trim=0`: cubre todo el lienzo (tiles, backdrops, overlays).
  - `anchor`: para sprites con anclas (enemigos, jefes, jugador) — usa `anchors_raw` y apoya el pie en `ground_line`.
- **Limpiezas automáticas**:
  - `remove_ground_line`: borra la línea de suelo que el generador a veces traza debajo de los pies.
  - `fade_regions`: desvanece hilos/cables que el generador prolonga hasta el borde.
- **Salida PNG**: sin cuantizar a paleta, sin dithering, PNG al máximo de color.
- **QC** tras guardado: detecta `ghost` (casi transparente), `touches_edge`, `empty`, `baked_checker_suspect`, `green_spill_pct`.

## Archivos que NUNCA se tocan directamente

- `index.html`, `DEADBEAT_DISCO.html` — los regenera `tools/build_active_html.py`.
- `assets/manifest.json` — lo actualiza `apply_lote.py` con los hashes correctos.
- `src/dd_asset_registry.js` — lo actualiza `apply_lote.py` (solo la línea `const MANIFEST = ...` y `ASSET_CACHE_VERSION`).
- Cualquier archivo en `assets/<category>/` fuera de `assets/_regen/` — solo se tocan desde `apply_lote.py` con backup previo.
- `ART_PACK/` y `DEADBEAT_DISCO.ART.html` son legado congelado.

## Rollback

```bash
# Ver qué se aplicó
ls assets/_regen/LOTE_00/*.applied.json

# Rollback (restaura backup y reconstruye manifest/HTML)
python3 tools/regen/rollback_lote.py LOTE_00 --dry-run
python3 tools/regen/rollback_lote.py LOTE_00
```

## Referencias

- `assets/prompts.json` — prompts positivos/negativos por asset.
- `docs/ASSET_REGEN/PROMPTS/00_STYLE_TEMPLATE.md` — bloques de estilo universales.
- `docs/TOTAL_ART_REBUILD/03_ASSET_CONTRACT.md` — contrato técnico (dimensiones, pivotes, alfa).
- `tools/art_master/artlib.py` — biblioteca de mate/encaje/QC (tomada del pipeline anterior).
- `tools/art_master/batch.py` — script histórico de producción (referencia de formato; no se usa directamente para los nuevos lotes, que escriben en `_regen/`).

## Lotes históricos como semilla

- `docs/ART_REBUILD/batches/R01_PROTAGONISTA.json` — prompts de protagonista (diseño anterior, histórico).
- `docs/ART_REBUILD/batches/R02_ENEMIGOS.json` — 24 enemigos ya aprobados (semilla para LOTE_08).
- `docs/ART_REBUILD/batches/R03_JEFES.json` — 42 jefes ya aprobados (semilla para LOTE_09).
- `docs/ART_REBUILD/batches/R05_PROTAGONISTA_MAESTRO.json` y `R05B_PROTAGONISTA_MAESTRO_FIDELIDAD.json` — IDLE 07B y fidelidad (NO regenerar).

Los prompts de estos batches ya están incorporados en `assets/prompts.json` marcados con `source: existing-batch`.

---

> Preparado por la FASE 2 (planner/process/validate/apply/rollback).
> Co-authored-by: Perplexity <noreply@perplexity.ai>
