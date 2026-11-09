import re

with open("src/dd_cinematic_camera.js", "r", encoding="utf-8") as f:
    cine_code = f.read()

# Update sprite / logo retrieval to check both modular cinematic IDs and original engine IDs
old_sprite_block = """      // Sprites oficiales del protagonista
      const getAsset = function (id) {
        return window.DD_ASSETS && typeof window.DD_ASSETS.get === "function" ? window.DD_ASSETS.get(id) : null;
      };
      const pIdle = getAsset("player_idle_00");
      const pShoot = getAsset("player_shoot_00") || pIdle;
      const pWalkFrames = [
        getAsset("player_walk_00"),
        getAsset("player_walk_01"),
        getAsset("player_walk_02"),
        getAsset("player_walk_03")
      ].filter(function (img) { return !!img && img.naturalWidth > 0; });"""

new_sprite_block = """      // Obtención modular de recursos con soporte de manifiesto central y fallback
      const getAsset = function (id) {
        if (!window.DD_ASSETS || typeof window.DD_ASSETS.get !== "function") return null;
        return window.DD_ASSETS.get(id);
      };
      // Personaje modular sustituible con fallback a sprites canónicos del motor
      const pIdle = getAsset("hero_idle_00") || getAsset("player_idle_00");
      const pShoot = getAsset("hero_shoot_00") || getAsset("player_shoot_00") || pIdle;
      const pWalkFrames = [
        getAsset("hero_walk_00") || getAsset("player_walk_00"),
        getAsset("hero_walk_01") || getAsset("player_walk_01"),
        getAsset("hero_walk_02") || getAsset("player_walk_02"),
        getAsset("hero_walk_03") || getAsset("player_walk_03")
      ].filter(function (img) { return !!img && img.naturalWidth > 0; });"""

assert old_sprite_block in cine_code, "old_sprite_block not found in src/dd_cinematic_camera.js"
cine_code = cine_code.replace(old_sprite_block, new_sprite_block, 1)

# Also check Plano 09 logo retrieval
old_logo_block = """        // LOGOTIPO OFICIAL DEADBEAT DISCO
        const logoImg = getAsset("logo_deadbeat_trim") || getAsset("logo_deadbeat_graffiti");"""

new_logo_block = """        // LOGOTIPO MODULAR DEADBEAT DISCO (assets/cinematics/logos/logo_deadbeat_cinematic.png con fallback)
        const logoImg = getAsset("logo_deadbeat_cinematic") || getAsset("logo_deadbeat_trim") || getAsset("logo_deadbeat_graffiti");"""

assert old_logo_block in cine_code, "old_logo_block not found in src/dd_cinematic_camera.js"
cine_code = cine_code.replace(old_logo_block, new_logo_block, 1)

with open("src/dd_cinematic_camera.js", "w", encoding="utf-8") as f:
    f.write(cine_code)

print("Successfully updated src/dd_cinematic_camera.js with modular asset retrieval!")
