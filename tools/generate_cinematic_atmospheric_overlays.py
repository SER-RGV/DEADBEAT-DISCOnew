import os
import subprocess

os.makedirs("assets/cinematics/overlays", exist_ok=True)
os.makedirs("assets/cinematics/effects", exist_ok=True)
os.makedirs("assets/cinematics/foregrounds", exist_ok=True)

# 1. Vignette & Cinematic Letterbox overlay (1920x1080)
# Deep radial falloff with baroque gothic framing
vignette_cmd = [
    "convert", "-size", "1920x1080", "radial-gradient:rgba(0,0,0,0)-rgba(6,2,14,0.72)",
    "-fill", "none", "-stroke", "rgba(0,240,255,0.08)", "-strokewidth", "2", "-draw", "rectangle 24,24,1895,1055",
    "assets/cinematics/overlays/overlay_vignette_gothic.png"
]
subprocess.run(vignette_cmd, check=True)

# 2. Anamorphic Lens Flare Horizontal Streak (1920x256)
flare_cmd = [
    "convert", "-size", "1920x256", "xc:none",
    "-stroke", "none",
    "-fill", "rgba(0,240,255,0.35)", "-draw", "ellipse 960,128 900,4 0,360",
    "-fill", "rgba(255,0,127,0.45)", "-draw", "ellipse 960,128 650,12 0,360",
    "-fill", "rgba(255,255,255,0.85)", "-draw", "ellipse 960,128 280,2 0,360",
    "-blur", "0x8",
    "assets/cinematics/effects/effect_anamorphic_flare.png"
]
subprocess.run(flare_cmd, check=True)

# 3. Gothic Dust Motes & Neon Particles (1920x1080)
particles_cmd = [
    "convert", "-size", "1920x1080", "xc:none",
    "-fill", "rgba(255,230,120,0.6)",
    "-draw", "circle 320,240 322,240",
    "-draw", "circle 840,180 843,180",
    "-draw", "circle 1420,310 1422,310",
    "-draw", "circle 610,620 612,620",
    "-draw", "circle 1180,740 1183,740",
    "-draw", "circle 1650,480 1652,480",
    "-fill", "rgba(0,240,255,0.5)",
    "-draw", "circle 450,410 452,410",
    "-draw", "circle 980,520 982,520",
    "-draw", "circle 1350,210 1352,210",
    "-fill", "rgba(255,0,127,0.5)",
    "-draw", "circle 220,780 222,780",
    "-draw", "circle 1580,820 1582,820",
    "-draw", "circle 750,380 752,380",
    "-blur", "0x1.5",
    "assets/cinematics/effects/effect_dust_particles.png"
]
subprocess.run(particles_cmd, check=True)

print("Generated cinematic overlays and visual effects successfully!")
