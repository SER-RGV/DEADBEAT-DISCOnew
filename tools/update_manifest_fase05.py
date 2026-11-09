import json

with open("assets/cinematics/manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

manifest["version"] = "1.1.0"
manifest["asset_version"] = "20261109.2"

new_assets = {
  "overlay_vignette_gothic": {
    "id": "overlay_vignette_gothic",
    "name": "Efecto Cinematográfico · Viñeteado Gótico y Marco Anamórfico",
    "category": "overlays",
    "file": "assets/cinematics/overlays/overlay_vignette_gothic.png",
    "expected": { "w": 1920, "h": 1080, "format": "png", "alpha": True },
    "behavior": "screen_overlay",
    "fallback": "assets/cinematics/overlays/overlay_vignette_gothic.png",
    "scene": "all",
    "description": "Gradiente radial de viñeteado cinematográfico con enmarque fino cian neón."
  },
  "effect_anamorphic_flare": {
    "id": "effect_anamorphic_flare",
    "name": "Efecto Visual · Destello de Lente Anamórfico Horizontal",
    "category": "effects",
    "file": "assets/cinematics/effects/effect_anamorphic_flare.png",
    "expected": { "w": 1920, "h": 256, "format": "png", "alpha": True },
    "behavior": "screen_flare",
    "fallback": "assets/cinematics/effects/effect_anamorphic_flare.png",
    "scene": "02,07,09",
    "description": "Destello de lente anamórfico horizontal cian y magenta sincronizado con el pulso 128 BPM."
  },
  "effect_dust_particles": {
    "id": "effect_dust_particles",
    "name": "Efecto Ambiental · Mota de Polvo y Partículas Neón Volumétricas",
    "category": "effects",
    "file": "assets/cinematics/effects/effect_dust_particles.png",
    "expected": { "w": 1920, "h": 1080, "format": "png", "alpha": True },
    "behavior": "ambient_particles",
    "fallback": "assets/cinematics/effects/effect_dust_particles.png",
    "scene": "01,03,04,05,06,08",
    "description": "Partículas de polvo dorado y destellos neón flotantes en suspensión ambiental."
  }
}

for k, v in new_assets.items():
    manifest["assets"][k] = v

with open("assets/cinematics/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"Updated assets/cinematics/manifest.json with {len(manifest['assets'])} total assets.")
