#!/usr/bin/env python3
"""Comprueba que las builds HTML contienen exactamente las fuentes modulares actuales.

No genera ni modifica builds. Sólo lee archivos y devuelve código distinto de cero
si las dos builds no coinciden o si algún módulo embebido está desactualizado.
Uso: python3 tools/qa/test_build_source_sync.py
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUILDS = (ROOT / "index.html", ROOT / "DEADBEAT_DISCO.html")
CSS_SOURCE = ROOT / "src" / "dd_rebuild_ui.css"
JS_MODULES = (
    "dd_boot.js",
    "dd_asset_registry.js",
    "dd_world_renderer.js",
    "dd_hub_system.js",
    "dd_cinematic_camera.js",
    "dd_opening.js",
    "dd_ui_system.js",
)


class AuditError(RuntimeError):
    pass


def require_file(path: Path) -> str:
    if not path.is_file():
        raise AuditError(f"No existe el archivo requerido: {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8")


def extract_embedded(document: str, marker: str, closing_tag: str, label: str) -> str:
    count = document.count(marker)
    if count != 1:
        raise AuditError(f"{label}: marcador encontrado {count} veces (se esperaba 1)")
    start = document.index(marker) + len(marker)
    if document[start:start + 1] == "\n":
        start += 1
    end = document.find(closing_tag, start)
    if end < 0:
        raise AuditError(f"{label}: no se encuentra el cierre {closing_tag!r}")
    embedded = document[start:end]
    # El generador añade un salto de línea de separación antes del cierre.
    if embedded.endswith("\n"):
        embedded = embedded[:-1]
    return embedded


def check_embedded(document: str, source_path: Path, marker: str,
                   closing_tag: str, label: str) -> None:
    expected = require_file(source_path)
    actual = extract_embedded(document, marker, closing_tag, label)
    if actual != expected:
        raise AuditError(
            f"{label}: build desactualizada respecto a "
            f"{source_path.relative_to(ROOT)}; ejecuta tools/build_active_html.py"
        )
    print(f"PASS {label}: coincide con {source_path.relative_to(ROOT)}")


def main() -> int:
    try:
        documents = [(path, require_file(path)) for path in BUILDS]
        if documents[0][1] != documents[1][1]:
            raise AuditError("index.html y DEADBEAT_DISCO.html no son idénticos")
        print("PASS las dos builds son idénticas")

        for build_path, document in documents:
            print(f"\nAuditando {build_path.relative_to(ROOT)}")
            check_embedded(
                document,
                CSS_SOURCE,
                "/* === INLINED FROM src/dd_rebuild_ui.css — regenerate via tools/build_active_html.py === */",
                "\n  </style>",
                "CSS integrado",
            )
            for module in JS_MODULES:
                marker = (
                    "/* === INLINED FROM src/" + module
                    + " — regenerate via tools/build_active_html.py === */"
                )
                check_embedded(
                    document,
                    ROOT / "src" / module,
                    marker,
                    "\n  </script>",
                    module,
                )
        print("\nRESULTADO: builds sincronizadas con todas las fuentes.")
        return 0
    except (OSError, UnicodeError, AuditError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
