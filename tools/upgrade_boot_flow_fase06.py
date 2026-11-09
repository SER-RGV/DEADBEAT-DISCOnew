import re

with open("src/dd_boot.js", "r", encoding="utf-8") as f:
    boot_code = f.read()

# 1. Update ESSENTIAL IMAGES in STEPS to prioritize cinematic assets
old_img_step = 'var ids = ["logo_deadbeat_graffiti", "emblem_fox_crown", "menu_main_backdrop", "menu_main_backdrop_a", "cine_intro_club_panorama", "player_idle_00", "player_walk_00", "player_walk_01", "player_walk_02", "player_walk_03"];'

new_img_step = 'var ids = ["cine_bg01_city", "cine_bg02_club_exterior", "cine_bg03_entrance", "cine_bg04_main_hall", "cine_bg05_dancefloor", "cine_bg06_hero", "player_idle_00", "player_walk_00", "player_walk_01", "player_walk_02", "player_walk_03", "player_shoot_00", "logo_deadbeat_cinematic"];'

assert old_img_step in boot_code, "old_img_step not found in src/dd_boot.js"
boot_code = boot_code.replace(old_img_step, new_img_step, 1)

# 2. Update finish handler in startIntro to perform transition directly into HUB
old_intro_finish = """    var finished = false;
    var finish = function (why) {
      if (finished) return;
      finished = true;
      state.introActive = false;
      state.introEndedBy = why || "complete";
      document.body.classList.remove("dd-intro-running");
      enterMainMenu();
      emit("intro-end", { by: state.introEndedBy });
    };"""

new_intro_finish = """    var finished = false;
    var finish = function (why) {
      if (finished) return;
      finished = true;
      state.introActive = false;
      state.introEndedBy = why || "complete";
      document.body.classList.remove("dd-intro-running");

      // FASE 06: Transición directa de la cinemática al HUB canónico r0
      if (window.DD_HUB && typeof window.DD_HUB.enter === "function") {
        try { window.DD_HUB.enter(); } catch (e) { console.warn("[DD_BOOT] error al entrar al HUB", e); }
      }
      if (window.DD_UI && typeof window.DD_UI.hideMainMenu === "function") {
        try { window.DD_UI.hideMainMenu(); } catch (e) {}
      }
      setState("PLAYING");
      emit("intro-end", { by: state.introEndedBy });
    };"""

assert old_intro_finish in boot_code, "old_intro_finish not found in src/dd_boot.js"
boot_code = boot_code.replace(old_intro_finish, new_intro_finish, 1)

# 3. Update canStartGame to permit PLAYING state transitions and direct enterGame
old_can_start = """  function canStartGame() {
    return state.current === "MAIN_MENU" || state.current === "SUBMENU";
  }"""

new_can_start = """  function canStartGame() {
    return state.current === "MAIN_MENU" || state.current === "SUBMENU" || state.current === "PLAYING";
  }"""

assert old_can_start in boot_code, "old_can_start not found in src/dd_boot.js"
boot_code = boot_code.replace(old_can_start, new_can_start, 1)

with open("src/dd_boot.js", "w", encoding="utf-8") as f:
    f.write(boot_code)

print("Successfully updated src/dd_boot.js for FASE 06 direct cinematic -> HUB gameplay transition!")
