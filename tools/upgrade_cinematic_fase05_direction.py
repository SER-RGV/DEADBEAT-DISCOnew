import re

with open("src/dd_cinematic_camera.js", "r", encoding="utf-8") as f:
    code = f.read()

# Locate shot rendering section
start_marker = "// RENDERIZADO ESPECÍFICO POR PLANO"
end_marker = "ctx.restore();\n      return;\n    } else if (activeSeq.type === \"room\") {"

start_idx = code.find(start_marker)
end_idx = code.find(end_marker, start_idx)

assert start_idx != -1 and end_idx != -1, "Markers not found"

new_shots_render = """// RENDERIZADO ESPECÍFICO POR PLANO CON ACABADO PREMIUM FASE 05
      const dustImg = getAsset("effect_dust_particles");
      const flareImg = getAsset("effect_anamorphic_flare");
      const vignetteImg = getAsset("overlay_vignette_gothic");

      if (shotIdx === 1) {
        // PLANO 01 · CIUDAD EXTERIOR (cine_bg01_city)
        const sp = shotProgress;
        drawLayer("cine_bg01_city_01_sky_moon_atmosphere", (sp - 0.5) * 15, sp * -8, 1.02, 1.0);
        drawLayer("cine_bg01_city_02_gothic_skyline_architecture", (sp - 0.5) * 45, sp * -18, 1.05, 1.0);
        drawLayer("cine_bg01_city_03_foreground_industrial_pipes", (sp - 0.5) * 95, sp * -28, 1.08, 1.0);
        if (!getAsset("cine_bg01_city_01_sky_moon_atmosphere")) {
          drawLayer("cine_bg01_city", (sp - 0.5) * 50, sp * -20, 1.04, 1.0);
        }

        // Niebla volumétrica en capas con paralaje y dispersión de luz
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.22 + Math.sin(t * 1.5) * 0.05;
        const fogGrad = ctx.createLinearGradient(0, viewH * 0.52, 0, viewH);
        fogGrad.addColorStop(0, "rgba(0, 240, 255, 0.0)");
        fogGrad.addColorStop(0.6, "rgba(157, 0, 255, 0.25)");
        fogGrad.addColorStop(1, "rgba(255, 0, 127, 0.32)");
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, viewH * 0.48, viewW, viewH * 0.52);

        // Polvo ambiental flotante en el aire urbano
        if (dustImg && dustImg.naturalWidth > 0) {
          ctx.globalAlpha = 0.35;
          ctx.drawImage(dustImg, (sp - 0.5) * 30, Math.sin(t * 0.8) * 10, viewW, viewH);
        }
        ctx.restore();

      } else if (shotIdx === 2) {
        // PLANO 02 · FACHADA DEL CLUB (cine_bg02_club_exterior)
        const sp = shotProgress;
        const zoom = 1.0 + sp * 0.12;
        drawLayer("cine_bg02_club_exterior_01_gothic_cathedral_facade", 0, sp * -15, zoom, 1.0);
        drawLayer("cine_bg02_club_exterior_02_portal_speakers_entrance", 0, sp * -12, zoom * 1.02, 1.0);
        drawLayer("cine_bg02_club_exterior_03_wet_pavement_reflections", 0, sp * -6, zoom * 1.05, 1.0);
        if (!getAsset("cine_bg02_club_exterior_01_gothic_cathedral_facade")) {
          drawLayer("cine_bg02_club_exterior", 0, sp * -14, zoom, 1.0);
        }

        // Resplandor neón pulsante en el portal exterior con halos volumétricos
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.18 + kickPulse * 0.16;
        const neonGlow = ctx.createRadialGradient(viewW * 0.5, viewH * 0.45, 20, viewW * 0.5, viewH * 0.45, viewW * 0.45);
        neonGlow.addColorStop(0, "rgba(255, 0, 127, 0.5)");
        neonGlow.addColorStop(0.45, "rgba(0, 240, 255, 0.2)");
        neonGlow.addColorStop(1, "rgba(6, 2, 12, 0)");
        ctx.fillStyle = neonGlow;
        ctx.fillRect(0, 0, viewW, viewH);

        // Destello de lente anamórfico en el dintel del pórtico
        if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.3) {
          ctx.globalAlpha = kickPulse * 0.38;
          ctx.drawImage(flareImg, 0, viewH * 0.42 - 64, viewW, 128);
        }
        ctx.restore();

      } else if (shotIdx === 3) {
        // PLANO 03 · UMBRAL (cine_bg03_entrance - CU Dutch Angle)
        const sp = shotProgress;
        ctx.save();
        ctx.translate(viewW * 0.5, viewH * 0.5);
        ctx.rotate((reducedMotion ? 0 : 0.025) * Math.sin(sp * Math.PI));
        ctx.translate(-viewW * 0.5, -viewH * 0.5);

        drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", (sp - 0.5) * 20, 0, 1.15 + sp * 0.05, 1.0);
        drawLayer("cine_bg03_entrance_02_midground_columns_banners", (sp - 0.5) * 35, 0, 1.18 + sp * 0.06, 1.0);
        drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", (sp - 0.5) * 60, 0, 1.22 + sp * 0.08, 1.0);
        if (!getAsset("cine_bg03_entrance_01_vaulted_hallway_depth")) {
          drawLayer("cine_bg03_entrance", (sp - 0.5) * 30, 0, 1.18, 1.0);
        }
        ctx.restore();

        // Fuga de luz dorada cegadora desde la rendija con haces diagonales
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.22 + sp * 0.28;
        const flashGrad = ctx.createLinearGradient(viewW * 0.35, 0, viewW * 0.65, viewH);
        flashGrad.addColorStop(0, "rgba(255, 230, 0, 0.0)");
        flashGrad.addColorStop(0.48, "rgba(255, 230, 0, 0.55)");
        flashGrad.addColorStop(1, "rgba(255, 0, 127, 0.0)");
        ctx.fillStyle = flashGrad;
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.restore();

      } else if (shotIdx === 4) {
        // PLANO 04 · APARICIÓN DEL PROTAGONISTA (cine_bg03_entrance - Contraluz MS)
        const sp = shotProgress;
        drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", 0, 10 - sp * 10, 1.12, 1.0);
        drawLayer("cine_bg03_entrance_02_midground_columns_banners", 0, 12 - sp * 12, 1.14, 1.0);

        // Protagonista en silueta de contraluz avanzando con paso firme
        const frameIdx = Math.floor(t * 8.0) % (pWalkFrames.length || 1);
        const pImg = pWalkFrames[frameIdx] || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(380, viewH * 0.44);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.78 - sp * 24;

          // Halo de contraluz volumétrico (Rim Light magenta profundo)
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          const rim = ctx.createRadialGradient(px, py - ph * 0.5, 10, px, py - ph * 0.5, ph * 0.7);
          rim.addColorStop(0, "rgba(255, 0, 127, 0.75)");
          rim.addColorStop(0.5, "rgba(255, 230, 0, 0.3)");
          rim.addColorStop(1, "rgba(6, 2, 12, 0)");
          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.5, pw * 1.25, ph * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sombra proyectada alargada hacia adelante
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(4, 1, 8, 0.72)";
          ctx.beginPath();
          ctx.ellipse(px, py + 2, pw * 0.6, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 32;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", 0, 0, 1.18, 1.0);

      } else if (shotIdx === 5) {
        // PLANO 05 · CAMINATA CINEMATOGRÁFICA (cine_bg03_entrance - Tracking Lateral)
        const sp = shotProgress;
        const parBg = (sp - 0.5) * -120;
        const parMid = (sp - 0.5) * -220;
        const parFg = (sp - 0.5) * -420;

        drawLayer("cine_bg03_entrance_01_vaulted_hallway_depth", parBg, 0, 1.08, 1.0);
        drawLayer("cine_bg03_entrance_02_midground_columns_banners", parMid, 0, 1.10, 1.0);

        // Protagonista con desplazamiento físico real y alternancia fluida de pasos a 128 BPM
        const frameIdx = Math.floor(t * 8.5) % (pWalkFrames.length || 1);
        const pImg = pWalkFrames[frameIdx] || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(360, viewH * 0.42);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * (0.18 + sp * 0.64);
          const py = viewH * 0.82 + Math.sin(t * 17.0) * 2.5;

          ctx.save();
          // Sombra proyectada elíptica con gradiente de contacto
          ctx.fillStyle = "rgba(4, 1, 8, 0.72)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.48, 15, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 22;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        drawLayer("cine_bg03_entrance_03_foreground_pillars_occlusion", parFg, 0, 1.18, 1.0);

      } else if (shotIdx === 6) {
        // PLANO 06 · GRAN NAVE PRINCIPAL (cine_bg04_main_hall - High Angle EWS)
        const sp = shotProgress;
        const grpY = -25 + sp * 22;
        drawLayer("cine_bg04_main_hall_01_cathedral_nave_vaults", 0, grpY * 0.5, 1.15 - sp * 0.08, 1.0);
        drawLayer("cine_bg04_main_hall_02_laser_beams_equalizer", Math.sin(t * 1.8) * 18, grpY * 0.8, 1.16 - sp * 0.08, 1.0);
        drawLayer("cine_bg04_main_hall_03_chandeliers_stage_framing", 0, grpY * 1.2, 1.18 - sp * 0.08, 1.0);
        if (!getAsset("cine_bg04_main_hall_01_cathedral_nave_vaults")) {
          drawLayer("cine_bg04_main_hall", 0, grpY, 1.12, 1.0);
        }

        // Haces de luz láser volumétrica cruzados y oscilantes
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.32 + kickPulse * 0.18;
        const beamAngle = Math.sin(t * 2.2) * 140;
        const bGrad = ctx.createLinearGradient(viewW * 0.5, 0, viewW * 0.5 + beamAngle, viewH);
        bGrad.addColorStop(0, "rgba(255, 0, 127, 0.0)");
        bGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.4)");
        bGrad.addColorStop(1, "rgba(157, 0, 255, 0.0)");
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.5 - 30, 0);
        ctx.lineTo(viewW * 0.5 + 30, 0);
        ctx.lineTo(viewW * 0.5 + beamAngle + 120, viewH);
        ctx.lineTo(viewW * 0.5 + beamAngle - 120, viewH);
        ctx.closePath();
        ctx.fill();

        // Láser secundario opuesto
        const bGrad2 = ctx.createLinearGradient(viewW * 0.5, 0, viewW * 0.5 - beamAngle * 0.8, viewH);
        bGrad2.addColorStop(0, "rgba(0, 240, 255, 0.0)");
        bGrad2.addColorStop(0.5, "rgba(255, 0, 127, 0.35)");
        bGrad2.addColorStop(1, "rgba(255, 230, 0, 0.0)");
        ctx.fillStyle = bGrad2;
        ctx.beginPath();
        ctx.moveTo(viewW * 0.5 - 20, 0);
        ctx.lineTo(viewW * 0.5 + 20, 0);
        ctx.lineTo(viewW * 0.5 - beamAngle * 0.8 + 100, viewH);
        ctx.lineTo(viewW * 0.5 - beamAngle * 0.8 - 100, viewH);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

      } else if (shotIdx === 7) {
        // PLANO 07 · PISTA PRINCIPAL (cine_bg05_dancefloor - Dynamic WS DROP)
        const sp = shotProgress;
        drawLayer("cine_bg05_dancefloor_01_astrological_dancefloor_grid", 0, sp * -12, 1.04 + kickPulse * 0.02, 1.0);
        drawLayer("cine_bg05_dancefloor_02_sound_towers_dj_stage", 0, sp * -10, 1.06 + kickPulse * 0.03, 1.0);

        // Protagonista avanzando hacia el centro de la pista pulsante
        const frameIdx = Math.floor(t * 8.5) % (pWalkFrames.length || 1);
        const pImg = pWalkFrames[frameIdx] || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(340, viewH * 0.40);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.88 - sp * 40;

          // Reflejo interactivo en la obsidiana pulida del suelo
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.32 + kickPulse * 0.2;
          ctx.translate(px, py);
          ctx.scale(1, -0.42);
          ctx.drawImage(pImg, -pw * 0.5, 0, pw, ph);
          ctx.restore();

          // Sombra de contacto
          ctx.save();
          ctx.fillStyle = "rgba(4, 1, 8, 0.8)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.5, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 22;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        drawLayer("cine_bg05_dancefloor_03_tables_foreground_ambient", 0, sp * -6, 1.10, 1.0);

        // Estallido estroboscópico del DROP musical sincronizado a 128 BPM
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = kickPulse * 0.38;
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(0, 0, viewW, viewH);

        if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.4) {
          ctx.globalAlpha = kickPulse * 0.55;
          ctx.drawImage(flareImg, 0, viewH * 0.5 - 64, viewW, 128);
        }
        ctx.restore();

      } else if (shotIdx === 8) {
        // PLANO 08 · PRESENTACIÓN HEROICA (cine_bg06_hero - MCU Órbita)
        const sp = shotProgress;
        const orbX = Math.sin(sp * Math.PI) * 22;
        drawLayer("cine_bg06_hero_01_axial_portal_rosette", orbX * 0.5, 0, 1.20, 1.0);
        drawLayer("cine_bg06_hero_02_hero_rimlight_spotlight", orbX * 0.8, 0, 1.22 + kickPulse * 0.04, 1.0);

        // El héroe se detiene (idle_00) y empuña su M1911 (shoot_00 windup)
        const pImg = (sp > 0.45 && pShoot) ? pShoot : pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(440, viewH * 0.52);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5 + orbX;
          const py = viewH * 0.88;

          ctx.save();
          // Halo de contraluz volumétrico (Rim Light cenital dorado/fucsia)
          ctx.globalCompositeOperation = "screen";
          const rim = ctx.createRadialGradient(px, py - ph * 0.55, 12, px, py - ph * 0.55, ph * 0.72);
          rim.addColorStop(0, "rgba(255, 0, 127, 0.75)");
          rim.addColorStop(0.5, "rgba(0, 240, 255, 0.3)");
          rim.addColorStop(1, "rgba(6, 2, 12, 0)");
          ctx.fillStyle = rim;
          ctx.beginPath();
          ctx.ellipse(px, py - ph * 0.55, pw * 1.3, ph * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sombra de contacto
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "rgba(4, 1, 8, 0.85)";
          ctx.beginPath();
          ctx.ellipse(px, py - 4, pw * 0.55, 18, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 28;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        drawLayer("cine_bg06_hero_03_flanking_speakers_framing", orbX * 1.2, 0, 1.25, 1.0);

      } else if (shotIdx === 9) {
        // PLANO 09 · IDENTIDAD DEL JUEGO (cine_bg06_hero - Logotipo Oficial)
        const sp = shotProgress;
        drawLayer("cine_bg06_hero_01_axial_portal_rosette", 0, 0, 1.18, 1.0);
        drawLayer("cine_bg06_hero_02_hero_rimlight_spotlight", 0, 0, 1.20, 1.0);

        // Protagonista visible al pie en guardia de combate
        const pImg = pShoot || pIdle;
        if (pImg && pImg.naturalWidth > 0) {
          const ph = Math.min(360, viewH * 0.42);
          const pw = ph * (pImg.naturalWidth / pImg.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.92;
          ctx.save();
          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 24;
          ctx.drawImage(pImg, px - pw * 0.5, py - ph, pw, ph);
          ctx.restore();
        }

        drawLayer("cine_bg06_hero_03_flanking_speakers_framing", 0, 0, 1.22, 1.0);

        // LOGOTIPO MODULAR DEADBEAT DISCO (assets/cinematics/logos/logo_deadbeat_cinematic.png con fallback)
        const logoImg = getAsset("logo_deadbeat_cinematic") || getAsset("logo_deadbeat_trim") || getAsset("logo_deadbeat_graffiti");
        if (logoImg && logoImg.naturalWidth > 0) {
          const lw = Math.min(viewW * 0.65, 780);
          const lh = lw * (logoImg.naturalHeight / logoImg.naturalWidth);
          const lx = (viewW - lw) * 0.5;
          const ly = viewH * 0.22 - lh * 0.5;

          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.shadowColor = "#ff007f";
          ctx.shadowBlur = 36 + kickPulse * 22;
          ctx.drawImage(logoImg, lx, ly, lw, lh);

          if (flareImg && flareImg.naturalWidth > 0 && kickPulse > 0.4) {
            ctx.globalAlpha = kickPulse * 0.65;
            ctx.drawImage(flareImg, 0, ly + lh * 0.5 - 64, viewW, 128);
          }
          ctx.restore();
        }

      } else {
        // PLANO 10 · TRANSICIÓN AL JUEGO ISOMÉTRICO (Conexión directa con HUB / r0)
        const sp = shotProgress;
        const ease = sp * sp * (3 - 2 * sp);

        ctx.save();
        ctx.globalAlpha = Math.max(0, 1.0 - ease);
        drawLayer("cine_bg06_hero", 0, ease * 30, 1.14 - ease * 0.14, 1.0);

        if (pIdle && pIdle.naturalWidth > 0) {
          const ph = Math.min(320, viewH * 0.38) * (1.0 - ease * 0.15);
          const pw = ph * (pIdle.naturalWidth / pIdle.naturalHeight);
          const px = viewW * 0.5;
          const py = viewH * 0.88 - ease * 20;
          ctx.drawImage(pIdle, px - pw * 0.5, py - ph, pw, ph);
        }
        ctx.restore();

        if (sp > 0.92 && window.DD_HUB && typeof window.DD_HUB.isActive === "function" && !window.DD_HUB.isActive()) {
          try { window.DD_HUB.enter(); } catch (e) {}
        }
      }

      // Overlays cinematográficos globales: Viñeteado gótico y partículas
      if (vignetteImg && vignetteImg.naturalWidth > 0 && shotIdx < 10) {
        ctx.save();
        ctx.globalCompositeOperation = "multiply";
        ctx.globalAlpha = 0.65;
        ctx.drawImage(vignetteImg, 0, 0, viewW, viewH);
        ctx.restore();
      }

      """

code = code[:start_idx] + new_shots_render + code[end_idx:]

with open("src/dd_cinematic_camera.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Successfully injected FASE 05 cinematic rendering upgrades into src/dd_cinematic_camera.js!")
