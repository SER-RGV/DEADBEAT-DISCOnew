#!/usr/bin/env python3
"""Asset-level checks for the eight Fase 03 protagonist outfits.

Run from the repository root with `.venv/bin/python tools/qa/validate_phase03_outfits.py`.
This validates the shipped pose contract and that the approved Fase 02 showcases
remain byte-identical to HEAD; it is not a substitute for in-game browser QA.
"""
from __future__ import annotations

import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUTFITS = (
    "original", "rapture", "shadow", "apocalypse", "gunslinger",
    "fightclub", "kitchenriot", "streetart",
)
POSES = {
    "idle": (288, 512),
    "walk_a": (288, 512),
    "aim": (352, 512),
    "hurt": (352, 512),
    "roll": (384, 384),
    "death": (640, 320),
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def main() -> None:
    appearance = (ROOT / "src/dd_appearance.js").read_text()
    renderer = (ROOT / "src/dd_world_renderer.js").read_text()
    for outfit in OUTFITS:
        if f"{outfit}: '{outfit}'" not in appearance:
            fail(f"missing canonical outfit path: {outfit}")
        for pose, expected_size in POSES.items():
            path = ROOT / "assets/characters/outfits" / outfit / f"{pose}.png"
            backup = ROOT / "assets/characters/outfits/concepts/archive/phase03-before" / outfit / f"{pose}.png"
            if not path.is_file() or not backup.is_file():
                fail(f"missing runtime pose or pre-phase backup: {outfit}/{pose}")
            with Image.open(path) as image:
                if image.size != expected_size:
                    fail(f"{outfit}/{pose}: {image.size} != {expected_size}")
                if image.mode != "RGBA":
                    fail(f"{outfit}/{pose}: expected RGBA, got {image.mode}")
                alpha = image.getchannel("A")
                if alpha.getbbox() is None:
                    fail(f"{outfit}/{pose}: fully transparent")
                if alpha.getextrema() != (0, 255):
                    fail(f"{outfit}/{pose}: expected transparent and opaque pixels")
                bbox = alpha.getbbox()
                if pose in ("idle", "walk_a", "aim", "hurt") and (bbox[1] != 43 or bbox[3] != 505):
                    # Standard upright poses share the audited top/baseline; x extents vary by pose.
                    fail(f"{outfit}/{pose}: upright top/baseline drift: {bbox}")
                if pose in ("roll", "death") and (bbox[0] < 8 or bbox[1] < 8
                        or bbox[2] > expected_size[0] - 8 or bbox[3] > expected_size[1] - 8):
                    fail(f"{outfit}/{pose}: alpha crosses the 8px contain margin: {bbox}")
            if path.read_bytes() != backup.read_bytes():
                fail(f"pipeline changed shipped pose unexpectedly: {outfit}/{pose}")
        showcase = f"assets/characters/outfits/{outfit}/showcase.png"
        approved = subprocess.run(
            ["git", "show", f"HEAD:{showcase}"], cwd=ROOT,
            check=True, stdout=subprocess.PIPE,
        ).stdout
        if (ROOT / showcase).read_bytes() != approved:
            fail(f"approved showcase changed: {outfit}")

    # Verify the renderer's existing visual reuse mapping; this does not assert
    # new motor states or a bespoke charged/boost frame.
    for token in ("knight('idle')", "knight('aim')", "knight('hurt')",
                  "knight('roll')", "knight('death')", "'walk_a' : 'idle'"):
        if token not in renderer:
            fail(f"renderer no longer maps the outfit pose {token}")
    if "const PLAYER_BASE_H = 104" not in renderer:
        fail("player scale contract changed unexpectedly")

    print("PASS: 48 RGBA pose PNGs satisfy canvas, alpha, upright baseline and contain margins; match pre-run backups")
    print("PASS: all 8 approved showcases remain byte-identical to HEAD")
    print("PASS: existing renderer routes idle/walk/aim/hurt/roll/death through outfit frames")
    print("NOTE: run browser-based selector/HUB/gameplay QA separately; this is asset-level only")


if __name__ == "__main__":
    main()
