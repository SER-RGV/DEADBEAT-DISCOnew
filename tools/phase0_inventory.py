#!/usr/bin/env python3
"""
FASE 0 · Inventario maestro de assets
Genera docs/ASSET_REGEN/00_INVENTARIO.csv y 00_INVENTARIO.md

Recorre:
- assets/ (todos los ficheros de imagen y recurso)
- Cruza con assets/manifest.json (registrados vs planificados)
- Cruza con src/dd_asset_registry.js (código activo)
- Busca referencias a IDs en src/*.js
- Detecta duplicados por hash, archivos huérfanos y planificados sin materializar
"""

import csv
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("WARN: Pillow no disponible; dimensiones de imagen no se leerán", file=sys.stderr)

REPO = Path(__file__).resolve().parent.parent
ASSETS_DIR = REPO / "assets"
SRC_DIR = REPO / "src"
MANIFEST_PATH = ASSETS_DIR / "manifest.json"
OUT_CSV = REPO / "docs" / "ASSET_REGEN" / "00_INVENTARIO.csv"
OUT_MD = REPO / "docs" / "ASSET_REGEN" / "00_INVENTARIO.md"

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"}
FONT_EXTS = {".woff", ".woff2", ".ttf", ".otf"}
AUDIO_EXTS = {".mp3", ".ogg", ".wav", ".m4a"}
DATA_EXTS = {".json", ".md", ".txt", ".html", ".js", ".css"}

# ---------- helpers ----------

def sha256_file(path, max_bytes=None):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
            if max_bytes is not None and f.tell() > max_bytes:
                break
    return h.hexdigest()


def sha16_file(path):
    """Primeros 16 hex del SHA-1, igual que el manifest."""
    h = hashlib.sha1()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()[:16]


def get_image_dims(path):
    if not HAS_PIL:
        return (None, None)
    try:
        with Image.open(path) as im:
            return im.size  # (w, h)
    except Exception:
        return (None, None)


def has_alpha(path):
    if not HAS_PIL:
        return None
    try:
        with Image.open(path) as im:
            return im.mode in ("RGBA", "LA", "PA") or (im.mode == "P" and "transparency" in im.info)
    except Exception:
        return None


def rel(p):
    return str(p.relative_to(REPO))


# ---------- 1. Cargar manifest ----------

with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest_entries = manifest["entries"]
byOriginalId = manifest.get("byOriginalId", {})
total_registered = manifest["totalRegistered"]
total_planned = manifest["totalPlanned"]

# Construir índice src -> id desde manifest
src_to_id = {}
for eid, entry in manifest_entries.items():
    src_to_id[entry["src"]] = eid

# ---------- 2. Escanear todos los ficheros en assets/ ----------

disk_files = []  # list of dicts
sha_to_paths = defaultdict(list)
path_to_sha = {}

for root, dirs, files in os.walk(ASSETS_DIR):
    for fname in files:
        fp = Path(root) / fname
        ext = fp.suffix.lower()
        if ext in DATA_EXTS and fname not in ("manifest.json", "README.md"):
            # we still list HTML preview files etc
            pass
        relpath = rel(fp)
        stat = fp.stat()
        size_bytes = stat.st_size
        size_kb = round(size_bytes / 1024, 1)
        # hash (small files full; big files partial + head/tail)
        if size_bytes < 20 * 1024 * 1024:
            sha = sha256_file(fp)
        else:
            sha = sha256_file(fp, max_bytes=4 * 1024 * 1024)
        sha_to_paths[sha].append(relpath)
        path_to_sha[relpath] = sha

        w, h = None, None
        alpha = None
        if ext in IMAGE_EXTS:
            w, h = get_image_dims(fp)
            alpha = has_alpha(fp)

        # infer category from directory
        parts = fp.relative_to(ASSETS_DIR).parts
        category_dir = parts[0] if parts else "root"

        disk_files.append({
            "path": relpath,
            "filename": fname,
            "category_dir": category_dir,
            "ext": ext,
            "size_bytes": size_bytes,
            "size_kb": size_kb,
            "w": w,
            "h": h,
            "alpha": alpha,
            "sha256_16": sha[:16],
            "sha256": sha,
        })

# ---------- 3. Detectar duplicados por hash ----------

duplicates = {sha: paths for sha, paths in sha_to_paths.items() if len(paths) > 1}

# ---------- 4. Buscar referencias en código (src/*.js) ----------

src_code = ""
src_files = []
for js in sorted(SRC_DIR.glob("*.js")):
    text = js.read_text(encoding="utf-8", errors="replace")
    src_code += "\n// FILE: " + js.name + "\n" + text
    src_files.append(js.name)

# También revisar tools/build_active_html.py (que inyecta referencias)
build_tool = REPO / "tools" / "build_active_html.py"
if build_tool.exists():
    src_code += "\n// FILE: build_active_html.py\n" + build_tool.read_text(encoding="utf-8", errors="replace")

# Para cada asset id del manifest, comprobar si aparece como cadena en el código
code_refs = {}
for eid in manifest_entries:
    # Buscar el id como cadena literal
    pattern = re.compile(r'["\']' + re.escape(eid) + r'["\']')
    matches = pattern.findall(src_code)
    code_refs[eid] = len(matches)

# También buscar rutas src directamente
src_path_refs = {}
for relpath in [d["path"] for d in disk_files]:
    # Normalizar: en el código las rutas aparecen como "assets/..."
    count = src_code.count(relpath)
    if count == 0:
        # buscar sin "assets/" prefijo
        short = relpath[len("assets/"):] if relpath.startswith("assets/") else relpath
        count = src_code.count(short)
    src_path_refs[relpath] = count

# ---------- 5. Clasificar cada fichero del disco ----------

rows = []
registered_paths = set(e["src"] for e in manifest_entries.values())
registered_ids = set(manifest_entries.keys())

# Estado por categoría_dir conocida
GAME_CATEGORIES = {
    "bosses", "characters", "cinematics", "effects", "enemies",
    "environments", "floors", "logos", "pickups", "props", "ui",
    "walls", "weapons",
}
REFERENCE_CATEGORIES = {"references"}
LEGACY_CATEGORIES = {"fase01"}
SPECIAL_CATEGORIES = {"fonts", "prefabs"}

# También revisar subcarpetas de characters/ que son atuendos/maestro
def find_entry_by_exact_src(path):
    """Devuelve (eid, entry) si el path coincide exactamente con un src del manifest."""
    if path in src_to_id:
        eid = src_to_id[path]
        return eid, manifest_entries[eid]
    return None, None

def classify_file(d):
    path = d["path"]
    parts = Path(path).relative_to("assets").parts
    cat_dir = parts[0]
    is_registered = path in registered_paths
    in_code = src_path_refs.get(path, 0) > 0

    # Buscar por id si el path coincide EXACTAMENTE con un src del manifest
    matched_id, matched_entry = find_entry_by_exact_src(path)

    # Determinar uso en el juego
    usage = ""
    status = ""

    # Helper: is this a cinematic root-level background (old version)?
    cine_root_bg = (cat_dir == "cinematics" and len(parts) >= 2
                    and parts[1] == "backgrounds"
                    and not any(p in parts for p in ("final", "preview", "restart", "thumbnails"))
                    and d["ext"] in IMAGE_EXTS
                    and len(parts) == 3)  # e.g. cinematics/backgrounds/cine_bg01_city.png
    # Helper: old-style layer_* files in backgrounds/cine_bgXX/
    cine_old_layers = (cat_dir == "cinematics" and len(parts) >= 4
                       and parts[1] == "backgrounds"
                       and parts[2].startswith("cine_bg")
                       and "final" not in parts
                       and d["ext"] in IMAGE_EXTS)
    # Helper: root backgrounds/ extra files (card_bg*, COMPARATIVA)
    cine_root_extra = (cat_dir == "cinematics" and len(parts) == 3
                       and parts[1] == "backgrounds"
                       and not parts[2].startswith("cine_bg")
                       and d["ext"] in IMAGE_EXTS)

    if cat_dir in GAME_CATEGORIES:
        if is_registered and in_code:
            status = "vigente"
            usage = "build activo (registry + código)"
        elif is_registered and not in_code:
            # Podría estar referenciado por id, no por ruta
            if matched_id and code_refs.get(matched_id, 0) > 0:
                status = "vigente"
                usage = "referenciado por id en src/"
            else:
                status = "registrado-sin-ref-codigo"
                usage = "en manifest pero no localizado en src/"
        elif not is_registered:
            # Archivo en carpeta de juego pero no registrado
            sub = "/".join(parts[1:3]) if len(parts) > 2 else parts[1] if len(parts) > 1 else ""
            if cine_root_extra:
                if "COMPARATIVA" in path:
                    status = "material-produccion"
                    usage = "imagen comparativa de producción (no es asset del juego)"
                elif "card_bg" in d["filename"]:
                    status = "thumbnail-card"
                    usage = "thumbnail/card de plano (raíz backgrounds/)"
                else:
                    status = "material-produccion"
                    usage = "material adicional en backgrounds/ (verificar)"
            elif cine_old_layers:
                status = "version-anterior"
                usage = "capa con nombre legacy (sustituida por 01_/02_/03_ en final/)"
            elif cine_root_bg:
                status = "version-anterior"
                usage = "fondo raíz de cinemática (versión previa a final/)"
            elif "protagonist_master" in path:
                if "IDLE_4F_EXPERIMENT_FAILED" in path:
                    status = "material-historico"
                    usage = "experimento fallido IDLE 4 fotogramas (archivado)"
                elif "fidelidad/versiones" in path:
                    status = "material-produccion"
                    usage = "iteración de fidelidad del IDLE (no final)"
                elif "walk" in path or "descent" in path:
                    status = "producido-no-integrado"
                    usage = "animación producida del maestro (no registrada en build activo)"
                else:
                    status = "producido-no-integrado"
                    usage = "material del protagonista maestro (RESTART) — integrado parcialmente"
            elif "outfits" in path:
                if "concepts/archive" in path:
                    status = "material-historico"
                    usage = f"archivo histórico de concepto {sub}"
                elif "concepts/backup_pre_arm_fix" in path:
                    status = "material-historico"
                    usage = "backup pre-corrección de brazos"
                elif "caballero_drafts" in path:
                    status = "material-produccion"
                    usage = "draft del atuendo caballero"
                else:
                    status = "producido-no-integrado"
                    usage = f"atuendo {sub} — no integrado en build activo"
            elif cat_dir == "cinematics" and "backgrounds/final" in path:
                if "COMPARATIVA" in path:
                    status = "material-produccion"
                    usage = "imagen comparativa de producción (no es asset del juego)"
                elif "/loop/" in path:
                    status = "frame-loop"
                    usage = "frame de loop animado de cinemática (verificar si dd_opening.js lo usa)"
                elif path.endswith("_master.png"):
                    status = "archivo-maestro"
                    usage = "archivo maestro (fuente de composición, no cargado en juego)"
                elif "/card_bg" in d["filename"]:
                    status = "thumbnail-card"
                    usage = "thumbnail/card de plano (verificar uso)"
                elif d["ext"] in DATA_EXTS:
                    status = "metadata"
                    usage = "documentación/manifest de cinemática"
                else:
                    status = "capa-alternativa"
                    usage = "capa con nombre alternativo/iteración en final/ (la registrada usa otra denominación)"
            elif cat_dir == "prefabs":
                status = "sin-usar-build-activo"
                usage = "prefab legacy (sistema anterior; verificar dd_prefab_world.js)"
            elif cat_dir == "cinematics" and ("restart" in path or "thumbnails" in path or "preview" in path):
                status = "material-produccion"
                usage = "preview/thumbnails/restart source — no en build"
            elif cat_dir == "cinematics" and "logos" in path:
                status = "vigente" if is_registered else "sin-registro"
                usage = "logo cinemático"
            elif cat_dir == "cinematics" and "characters" in path:
                # hero sprites in cinematics/characters/
                # El registry los apunta vía cine:characters:hero_* -> assets/cinematics/characters/protagonist/hero_*
                # Verificar por ruta exacta
                bn = d["filename"]
                found = False
                for eid, e in manifest_entries.items():
                    if e["src"] == path:
                        found = True
                        matched_id = eid
                        is_registered = True
                        status = "vigente"
                        usage = f"sprite héroe cinemático (id={eid})"
                        break
                if not found:
                    # Buscar cualquier otro hero_* con mismo filename en assets/characters/
                    for eid, e in manifest_entries.items():
                        if e["src"].endswith("/" + bn) and e["category"] == "characters":
                            status = "duplicado"
                            usage = f"mismo filename que {e['src']} (posible duplicado de sprite héroe)"
                            found = True
                            break
                    if not found:
                        status = "sin-registro"
                        usage = "sprite en cinematics/characters/ sin registro"
            elif cat_dir == "cinematics" and "effects" in path:
                # Los efectos de cinemática están registrados en effects/
                bn = d["filename"]
                found = False
                for eid, e in manifest_entries.items():
                    if e["src"] == path:
                        found = True
                        matched_id = eid
                        is_registered = True
                        status = "vigente"
                        usage = f"efecto cinemático (id={eid})"
                        break
                if not found:
                    status = "sin-registro"
                    usage = "efecto en cinematics/effects/ sin registro"
            elif cat_dir == "cinematics" and "overlays" in path:
                bn = d["filename"]
                for eid, e in manifest_entries.items():
                    if e["src"] == path:
                        matched_id = eid
                        is_registered = True
                        status = "vigente"
                        usage = f"overlay cinemático (id={eid})"
                        break
                else:
                    status = "sin-registro"
                    usage = "overlay sin registro"
            elif cat_dir == "characters":
                # player_*.png root level or companion/npc
                if is_registered:
                    status = "vigente"
                    usage = "sprite personaje en build activo"
                else:
                    # root-level files not registered
                    if d["filename"].startswith("player_") or d["filename"].startswith("hero_"):
                        status = "obsoleto"
                        usage = "sprite del diseño anterior (sin uso en build activo? verificar)"
                    else:
                        status = "sin-registro"
                        usage = "archivo en characters/ sin alta en manifest"
            else:
                status = "sin-registro"
                usage = f"archivo en {cat_dir}/ sin alta en manifest"
        else:
            status = "vigente"
            usage = "registrado y en código"
    elif cat_dir in REFERENCE_CATEGORIES:
        status = "referencia"
        usage = "material de referencia (no se carga en juego)"
    elif cat_dir in LEGACY_CATEGORIES:
        status = "obsoleto-legacy"
        usage = "assets de fase01 (no registrados en build activo)"
    elif cat_dir == "fonts":
        # fonts are loaded via CSS
        if d["ext"] in FONT_EXTS:
            status = "vigente"
            usage = "fuente web (cargada por CSS)"
        else:
            status = "metadata"
            usage = "licencia/txt de fuente"
    elif cat_dir == "prefabs":
        status = "sin-usar-build-activo"
        usage = "prefab legacy (37 piezas, sistema anterior)"
    else:
        status = "desconocido"
        usage = f"categoría {cat_dir} no clasificada"

    # Duplicado?
    sha = d["sha256"]
    is_dup = sha in duplicates and len(duplicates[sha]) > 1

    return {
        **d,
        "in_manifest": is_registered,
        "manifest_id": matched_id or "",
        "in_code": in_code or (matched_id and code_refs.get(matched_id, 0) > 0),
        "status": status,
        "usage": usage,
        "is_duplicate": is_dup,
        "duplicate_of": "; ".join(p for p in duplicates.get(sha, []) if p != path) if is_dup else "",
    }


def fname_matches(fname, src):
    return src.endswith("/" + fname) or src.endswith(fname)


for d in disk_files:
    rows.append(classify_file(d))

# ---------- 6. Entradas del manifest sin archivo en disco ----------

missing_from_disk = []
for eid, entry in manifest_entries.items():
    src_path = entry["src"]
    full = REPO / src_path
    if not full.exists():
        missing_from_disk.append({
            "path": src_path,
            "filename": Path(src_path).name,
            "category_dir": entry.get("category", ""),
            "ext": Path(src_path).suffix,
            "size_kb": 0,
            "w": entry.get("w"),
            "h": entry.get("h"),
            "alpha": entry.get("alpha"),
            "sha256_16": entry.get("sha16", ""),
            "in_manifest": True,
            "manifest_id": eid,
            "in_code": code_refs.get(eid, 0) > 0,
            "status": "planificado-sin-archivo",
            "usage": f"registrado en manifest pero el fichero no existe ({entry.get('name','')})",
            "is_duplicate": False,
            "duplicate_of": "",
        })

# ---------- 7. Planificados (totalPlanned > totalRegistered) ----------
# El manifest dice totalPlanned=349 pero entries solo tiene 277. Los "planeados" no están
# explícitamente listados aquí; en docs/ART_REBUILD/MASTER_INVENTORY.json hay más detalle.

planned_path = REPO / "docs" / "ART_REBUILD" / "MASTER_INVENTORY.json"
planned_ids = set()
if planned_path.exists():
    try:
        with open(planned_path, "r", encoding="utf-8") as f:
            mi = json.load(f)
        for a in mi.get("assets", []):
            pid = a.get("id") or a.get("asset_id")
            if pid:
                planned_ids.add(pid)
    except Exception as e:
        print(f"WARN: no se pudo leer MASTER_INVENTORY.json: {e}", file=sys.stderr)

planned_not_registered = planned_ids - registered_ids
# Filtrar los que ya tienen archivo en disco
for pid in sorted(planned_not_registered):
    # no tenemos su src con seguridad; añadir fila informativa
    missing_from_disk.append({
        "path": "(planificado)",
        "filename": pid,
        "category_dir": "(planned)",
        "ext": "",
        "size_kb": 0,
        "w": None,
        "h": None,
        "alpha": None,
        "sha256_16": "",
        "in_manifest": False,
        "manifest_id": "",
        "in_code": False,
        "status": "planificado-no-implementado",
        "usage": "ID listado en MASTER_INVENTORY.json pero no dado de alta en manifest",
        "is_duplicate": False,
        "duplicate_of": "",
    })

# ---------- 8. Ordenar y escribir CSV ----------

all_rows = rows + missing_from_disk
# Ordenar: primero por categoría, luego por path
all_rows.sort(key=lambda r: (r["category_dir"], r["path"]))

fieldnames = [
    "path", "filename", "category_dir", "ext", "w", "h", "alpha",
    "size_kb", "in_manifest", "manifest_id", "in_code", "status", "usage",
    "is_duplicate", "duplicate_of", "sha256_16",
]

OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in all_rows:
        writer.writerow(r)

print(f"CSV escrito: {OUT_CSV}  ({len(all_rows)} filas)")

# ---------- 9. Resumen y Markdown ----------

# Contadores
status_counts = Counter(r["status"] for r in all_rows)
cat_counts = Counter(r["category_dir"] for r in all_rows)
total_disk = len(rows)
total_missing = len(missing_from_disk)
total_duplicates = sum(1 for r in all_rows if r["is_duplicate"])

# Contar por categoría y estado
cat_status = defaultdict(lambda: Counter())
for r in all_rows:
    cat_status[r["category_dir"]][r["status"]] += 1

# Duplicados con detalle
dup_groups = []
for sha, paths in sorted(duplicates.items(), key=lambda x: -len(x[1])):
    dup_groups.append((sha[:16], paths))

# Huecos: planificados sin archivo
gaps = [r for r in all_rows if r["status"] in ("planificado-sin-archivo", "planificado-no-implementado")]
# Archivos sin registro (en categorías de juego pero sin manifest)
unregistered = [r for r in all_rows if r["status"] in ("sin-registro", "duplicado-o-fuente", "fuente-cinematica", "producido-no-integrado", "registrado-sin-ref-codigo")]

# Prioridad visual (para el jugador): bosses, enemies, player/combat, floors, walls, props, weapons, pickups, effects, ui, logos, cinematics, environments, characters/outfits, fonts, references, legacy
priority_map = {
    "bosses": 1, "enemies": 2, "characters": 3, "ui": 4,
    "floors": 5, "walls": 6, "environments": 7, "cinematics": 8,
    "props": 9, "weapons": 10, "pickups": 11, "effects": 12,
    "logos": 13, "prefabs": 14, "fonts": 15, "fase01": 16, "references": 17,
}

# Activos vigentes por categoría (para conteo de cobertura)
vigentes_by_cat = Counter()
for r in all_rows:
    if r["status"] == "vigente":
        vigentes_by_cat[r["category_dir"]] += 1

# Generar MD
md_lines = []
md_lines.append("# FASE 0 · Inventario maestro de assets\n")
md_lines.append(f"**Generado:** 2026-11-26 · **Rama:** `arena/09513f9b-deadbeat-disconew`\n")
md_lines.append("## 0. Resumen ejecutivo\n")
md_lines.append("| Métrica | Valor |")
md_lines.append("|---|---|")
md_lines.append(f"| Ficheros en `assets/` | **{total_disk}** |")
md_lines.append(f"| Entradas en `assets/manifest.json` | **{total_registered}** registradas / **{total_planned}** planificadas |")
md_lines.append(f"| Ficheros vigentes (en manifest + código) | **{status_counts.get('vigente', 0)}** |")
md_lines.append(f"| Registrados sin referencia en código | **{status_counts.get('registrado-sin-ref-codigo', 0)}** |")
md_lines.append(f"| Planificados sin archivo (huecos) | **{len(gaps)}** |")
md_lines.append(f"| Archivos sin registro | **{len(unregistered)}** |")
md_lines.append(f"| Grupos de duplicados (hash idéntico) | **{len(dup_groups)}** |")
md_lines.append(f"| Fuentes (woff2) | **{cat_counts.get('fonts', 0)}** |")
md_lines.append(f"| Material de referencia | **{cat_counts.get('references', 0)}** |")
md_lines.append(f"| Legado fase01 | **{cat_counts.get('fase01', 0)}** |")
md_lines.append(f"| Prefabs legacy | **{cat_counts.get('prefabs', 0)}** |")
md_lines.append("")

md_lines.append("## 1. Cobertura por categoría\n")
md_lines.append("| Categoría | Ficheros en disco | Vigentes (manifest+código) | Otros estados |")
md_lines.append("|---|---|---|---|")
for cat in sorted(cat_counts.keys(), key=lambda c: priority_map.get(c, 99)):
    v = vigentes_by_cat.get(cat, 0)
    o = cat_counts[cat] - v
    md_lines.append(f"| `{cat}` | {cat_counts[cat]} | {v} | {o} |")
md_lines.append("")

md_lines.append("## 2. Distribución de estados\n")
md_lines.append("| Estado | Nº de ficheros |")
md_lines.append("|---|---|")
for st, n in sorted(status_counts.items(), key=lambda x: -x[1]):
    md_lines.append(f"| `{st}` | {n} |")
md_lines.append("")

md_lines.append("## 3. Huecos: planificados sin materializar\n")
if gaps:
    md_lines.append(f"Hay **{len(gaps)}** entradas que aparecen en el manifest o en MASTER_INVENTORY pero cuyo archivo no existe o no está implementado:\n")
    md_lines.append("| ID / nombre | Categoría | Detalle |")
    md_lines.append("|---|---|---|")
    for r in gaps[:50]:
        mid = r["manifest_id"] or r["filename"]
        md_lines.append(f"| `{mid}` | {r['category_dir']} | {r['usage']} |")
    if len(gaps) > 50:
        md_lines.append(f"| … | … | +{len(gaps)-50} más (ver CSV) |")
else:
    md_lines.append("No se detectaron huecos entre manifest y disco para las categorías principales.")
md_lines.append("")

md_lines.append("## 4. Archivos sin registro en manifest\n")
if unregistered:
    md_lines.append(f"Hay **{len(unregistered)}** ficheros en `assets/` que no están dados de alta en el manifest activo (pueden ser material de producción, atuendos sin integrar, capas de cinemática sin alta, o duplicados):\n")
    md_lines.append("| Ruta | Tamaño KB | Dimensiones | Estado | Uso |")
    md_lines.append("|---|---|---|---|---|")
    for r in unregistered[:80]:
        dims = f"{r['w']}×{r['h']}" if r['w'] else "—"
        md_lines.append(f"| `{r['path']}` | {r['size_kb']} | {dims} | {r['status']} | {r['usage']} |")
    if len(unregistered) > 80:
        md_lines.append(f"| … | … | … | … | +{len(unregistered)-80} más (ver CSV) |")
else:
    md_lines.append("Todos los ficheros en categorías jugables están registrados.")
md_lines.append("")

md_lines.append("## 5. Duplicados (mismo hash SHA-256 en rutas distintas)\n")
if dup_groups:
    md_lines.append(f"Se detectaron **{len(dup_groups)}** grupos de contenido duplicado. Los más destacados:\n")
    md_lines.append("| SHA16 | Nº copias | Rutas |")
    md_lines.append("|---|---|---|")
    for sha16, paths in dup_groups[:30]:
        md_lines.append(f"| `{sha16}` | {len(paths)} | " + " · ".join(f"`{p}`" for p in paths) + " |")
    if len(dup_groups) > 30:
        md_lines.append(f"| … | … | +{len(dup_groups)-30} grupos más (ver CSV) |")
else:
    md_lines.append("No se detectaron duplicados por hash.")
md_lines.append("")

md_lines.append("## 6. Priorización por impacto visual vs esfuerzo\n")
md_lines.append("Orden sugerido para regeneración (FASE 3), de menor riesgo a mayor:\n")
md_lines.append("| Prioridad | Categoría | Nº vigentes | Notas de riesgo |")
md_lines.append("|---|---|---|---|")
prio_rows = [
    ("P1 · UI y logos", "ui+logos", "Baja: pocos assets, alta visibilidad, sin hitboxes"),
    ("P2 · Suelos, muros, entornos", "floors+walls+environments", "Media: tileables, afectan ambientación general; validar seamless"),
    ("P3 · Props, prefabs, pickups", "props+pickups+prefabs", "Baja-Media: objetos estáticos, mismo pivote bottom-center"),
    ("P4 · Armas y efectos", "weapons+effects", "Media: proyectiles y VFX no deben tapar amenazas; pixel-art actual podría conservarse"),
    ("P5 · Enemigos", "enemies", "Alta: 6 familias × 4 estados; requieren anclas foot/unit y halo de separación"),
    ("P6 · Jefes", "bosses", "Alta: 11 jefes × 4 estados (2 idle/attack para el secreto); anclas críticas para salud/barra vida"),
    ("P7 · Protagonista (atuendos)", "characters", "Muy alta: no mezclar diseño antiguo con maestro; requiere aprobación del IDLE/WALK/SHOOT"),
    ("P8 · Cinemáticas", "cinematics", "Media-Alta: fondos y capas de paralaje; 201 archivos incluyen versiones previas/final"),
]
for label, cat_key, note in prio_rows:
    if cat_key == "ui+logos":
        n = vigentes_by_cat.get("ui",0) + vigentes_by_cat.get("logos",0)
    elif cat_key == "floors+walls+environments":
        n = vigentes_by_cat.get("floors",0) + vigentes_by_cat.get("walls",0) + vigentes_by_cat.get("environments",0)
    elif cat_key == "props+pickups+prefabs":
        n = vigentes_by_cat.get("props",0) + vigentes_by_cat.get("pickups",0) + vigentes_by_cat.get("prefabs",0)
    elif cat_key == "weapons+effects":
        n = vigentes_by_cat.get("weapons",0) + vigentes_by_cat.get("effects",0)
    else:
        n = vigentes_by_cat.get(cat_key, 0)
    md_lines.append(f"| {label} | `{cat_key}` | {n} | {note} |")
md_lines.append("")

md_lines.append("## 7. Hallazgos importantes\n")
md_lines.append("1. **Build activo vs legado ART_PACK**: El build activo usa `src/dd_asset_registry.js` (277 entradas). `DEADBEAT_DISCO.ART.html` y `ART_PACK/art_pack.js` son legado congelado y **no** reciben assets nuevos.")
md_lines.append("2. **BUG CONFIRMADO: capas de cinemática 02/03 son byte-identical en los 6 planos.** Los archivos `02_*` y `03_*` en cada `backgrounds/final/cine_bgXX/` tienen el mismo hash SHA-256 (son el mismo PNG guardado con dos nombres). Esto significa que la cinemática de intro está dibujando dos capas iguales para los planos 01–06, perdiendo la profundidad del paralax. Los 12 PNG afectados suman ~23 MB. Detalle:")
md_lines.append("   - bg01: `02_gothic_skyline_architecture.png` = `03_foreground_industrial_pipes.png` (1,9 MB)")
md_lines.append("   - bg02: `02_portal_speakers_entrance.png` = `03_wet_pavement_reflections.png` (1,9 MB)")
md_lines.append("   - bg03: `02_midground_columns_banners.png` = `03_foreground_pillars_occlusion.png` (1,9 MB)")
md_lines.append("   - bg04: `02_laser_beams_equalizer.png` = `03_chandeliers_stage_framing.png` (2,0 MB)")
md_lines.append("   - bg05: `02_sound_towers_dj_stage.png` = `03_tables_foreground_ambient.png` (2,0 MB)")
md_lines.append("   - bg06: `02_hero_rimlight_spotlight.png` = `03_flanking_speakers_framing.png` (1,8 MB)")
md_lines.append("   Además existen versiones alternativas más pequeñas (15–170 KB) con nombres parecidos (`02_skyline_architecture.png`, `03_fog_industrial_cables.png`, etc.) que podrían ser las capas correctas; requieren verificación visual.")
md_lines.append("3. **Discrepancia characters/ (448 vs 25 vigentes)**: La carpeta `assets/characters/` contiene atuendos (outfits/) con sus sprites PNG (aim/death/hurt/idle/roll/walk) y los WebP de concepto, además de múltiples versiones del protagonista maestro (fidelidad, IDLE_4F fallido, descent, walk/). Nada de esto está en el registry activo excepto los 25 sprites de la raíz (player_* + companion + NPCs).")
md_lines.append("4. **Cinematics (201 archivos)**: Estructura compleja con versiones superpuestas:")
md_lines.append("   - `cine_circle_*.png` y `cine_intro_club_panorama.png` en la raíz (11) — todos vigentes.")
md_lines.append("   - `backgrounds/final/cine_bgXX/cine_bgXX.png` (6 composiciones 2560×1440, vigentes).")
md_lines.append("   - `backgrounds/final/cine_bgXX/01_*_.._03_*` (18 capas de paralax 1920×1080, vigentes) — **pero 12 son duplicadas** (ver punto 2).")
md_lines.append("   - `backgrounds/final/cine_bgXX/loop/frame_*.png` (48 frames, 8 por plano) — no registrados; uso por verificar.")
md_lines.append("   - `backgrounds/final/*_master.png`, `card_bg0X.png`, `ESCENARIOS_*_COMPARATIVA.png` — material de producción, no usado por el juego.")
md_lines.append("   - `backgrounds/cine_bgXX/` (raíz, sin final/) — versiones anteriores, sustituidas por las de `final/`.")
md_lines.append("   - `backgrounds/cine_bgXX/layer_*.png` (18) — nombres legacy de capas (layer_01/02/03), sustituidos.")
md_lines.append("   - `characters/protagonist/hero_*` (6) y `effects/`, `overlays/`, `logos/` — sprites y overlays, todos vigentes.")
md_lines.append("   - `restart/` (25) — storyboards JPG y lámina maestra del protagonista (referencia de producción).")
md_lines.append("5. **Prefabs (37)**: Sistema legacy de prefabs de salas (club/) con piezas isométricas (suelo, tapa, jambas, mobiliario roto/intacto); no están en el manifest ni se referencian desde DD_WORLD. Pendientes de verificar si `src/dd_prefab_world.js` los carga por ruta directa.")
md_lines.append("6. **Protagonista en dos sitios**: `assets/characters/player_*.png` (diseño anterior, 22 sprites usados en combate) coexisten con `assets/characters/protagonist_master/` (diseño nuevo, IDLE 07B integrado solo en Refugio vía DD_HUB; los sprites WALK/SHOOT están producidos pero no integrados).")
md_lines.append("7. **Enemigos y jefes (24+42)**: Ya fueron regenerados en las tandas TR_W1–W12 (informe 2026-11-15); los PNG actuales son el rebuild painterly, no el pixel-art original. Todos vigentes (42+24).")
md_lines.append("8. **Huecos de planificación (105 IDs)**: `docs/ART_REBUILD/MASTER_INVENTORY.json` lista ~105 IDs no implementados, casi todos armas adicionales (weapon_c016–weapon_c075: unas 55 variantes extra). Estas armas no están en el build activo (el juego usa 16) y no se cargan en el motor; son un plan antiguo.")
md_lines.append("9. **Ficheros duplicados sin conflicto**: `caballero/walk_b.png` = `caballero_drafts/walk_b.png` (copia en carpeta de drafts); `ESCENARIOS_DEFINITIVOS_COMPARATIVA.png` duplicado entre backgrounds/ y backgrounds/final/; `logo_deadbeat_cinematic.png` (en cinematics/logos/) es idéntico a `fase01/logo_deadbeat_trim.png`.")
md_lines.append("")

md_lines.append("## 8. Metodología\n")
md_lines.append("- Recorrido recursivo de `assets/` sin excluir subcarpetas.")
md_lines.append("- Dimensiones y canal alfa leídos con Pillow cuando está disponible.")
md_lines.append("- Hash SHA-256 completo por fichero (parcial en >20 MB).")
md_lines.append("- Referencias en código: búsqueda literal de IDs y rutas en `src/*.js` y `tools/build_active_html.py`.")
md_lines.append("- Cruce con `assets/manifest.json` (277 entradas) y `docs/ART_REBUILD/MASTER_INVENTORY.json` (planificación).")
md_lines.append("- **No se ha borrado ni modificado ningún fichero**; este informe es solo lectura.")
md_lines.append("")

md_lines.append("## 9. Comprobaciones pendientes\n")
md_lines.append("- [ ] Verificar si `src/dd_prefab_world.js` carga los prefabs de `assets/prefabs/` por ruta directa sin pasar por el registry.")
md_lines.append("- [ ] Verificar si los HTML preview de `assets/cinematics/preview/` se usan en algún flujo.")
md_lines.append("- [ ] Confirmar que los sprites `hero_*` en `assets/cinematics/characters/protagonist/` son los que usa el motor de cinemática y no duplicados de `assets/characters/`.")
md_lines.append("- [ ] Medir tamaños totales de arranque (antes/después de la regeneración FASE 4).")
md_lines.append("- [ ] Revisar los subdirectorios `outfits/concepts/archive/` y `fidelidad/versiones/` — son histórico de producción de atuendos.")
md_lines.append("")

md_lines.append("---\n")
md_lines.append("*Archivo CSV de detalle: [`00_INVENTARIO.csv`](00_INVENTARIO.csv) — 17 columnas, una fila por fichero.*\n")

OUT_MD.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_MD, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"Markdown escrito: {OUT_MD}")

# ---------- 10. Resumen por stdout ----------
print("\n=== RESUMEN FASE 0 ===")
print(f"Ficheros en assets/:         {total_disk}")
print(f"Entradas en manifest.json:   {total_registered}")
print(f"Vigentes (manifest+código):  {status_counts.get('vigente', 0)}")
print(f"Planificados sin archivo:    {len(gaps)}")
print(f"Archivos sin registro:       {len(unregistered)}")
print(f"Grupos de duplicados:        {len(dup_groups)}")
print(f"Categorías:                  {len(cat_counts)}")
print()
print("Por categoría (ficheros en disco):")
for cat in sorted(cat_counts.keys(), key=lambda c: priority_map.get(c, 99)):
    print(f"  {cat:15s} {cat_counts[cat]:5d}  vigentes={vigentes_by_cat.get(cat,0)}")
