# DEADBEAT DISCO — AUDITORÍA VISUAL INTEGRAL
Fecha: 2026-11-04
Branch: arena/c4354446-deadbeat-disconew
Build auditada: v3.3 FLOORBAG AUDITFIX (4.84 MB, 5209 líneas)
Base: v2.89 ARMAS120 → v3.0 optimizada (14.97 MB → 4.78 MB, -68%)

## 1. Sistemas de renderizado identificados

### A. Sistema pixelArt (d)
- Variable: `d` en IIFE principal (script[3], línea ~1250129)
- Versión: `2.83.0-pixel` y `2.85.0-pixel` (dos revisiones coexisten, 2.85 sobreescribe)
- Atlas: `1024×1323` PNG indexado (P, 134 KB) → `d.atlas` Image + `d.rects` coords + `d.themes`
- Rects: 226 entradas verificadas:
  - Personaje: player_idle/walk/fire/hit/roll/death + 4 steps anim
  - Enemigos: security, fanatic, chef, dancer, drone, elite (+ windup/attack + 4 steps)
  - Jefes: boss0..boss9 + 4 steps + boss singular
  - Props: speaker,bunny,sofa,armchair,chest,plant,mirror,vending,arcade,cooler,crate,bench,poster,lamp
  - Arquitectura: wall_limbo/lust/gula/wrath/envy + tile variants + logo
  - Suelos/materiales: floor_limbo→core + v1/v2 variants + material_glass/flesh/bone
  - Proyectiles/impactos: projectile_* (10) + impact_0-3 + paper/fire/soul
- Temas: 10 ambientes (limbo, lujuria, gula, avaricia, ira, herejía, violencia, fraude, traición, núcleo)
  Cada tema = {id, name, material, base/wall/trim/light/neon/ink} — paleta propia
- Render: `Yb(ctx, key, x,y,w,h)` y `Vb/Yb` wrappers → `ctx.drawImage(d.atlas, sx,sy,sw,sh, dx,dy,dw,dh)`
- Dibujado: suelos (tileado 48×48), paredes (tile + sombra), props (escala por room), entidades (step anim), efectos
- Estado: `d.ready` async via `d.atlas.onload` → `document.documentElement.classList.add("pixel-art-ready")`

### B. Sistema HD (window.__HD_DATA)
- Script[1]: 161 entradas embebidas como `data:image/webp;base64` (≈ 3.8 MB acumulado)
  - weapons: 121 (c003→c114 categorías completas, 160px recomprimidas)
  - bosses: 18 (boss_05..09 + hit/death/attack variants)
  - player: 10 (idle/walk 0-3, shoot/hurt/roll/death/boost)
  - pickups: 12 (heart/bomb/boost/shield/coin/xp/ammo/companion/credits/damageup/fireup/speedup/turret/mutation)
- Consumo: `o[t]=new Image(); o[t].src= window.__HD_DATA[a[t]] || e+a[t]` (script[3] línea 1.56M)
- Render HD: `p` atlas 1024×1024 (player HD) + `ut` weapon rig per-weapon grip/axis/pivot
- weaponRig v2.97.0-cadera: valida grip 0.12–0.65, axis 0.15–...
- Integración: `Pf` hook (player render) elige `p.atlas` si `i("player_idle")` ok, sino fallback `d`

### C. Sistema Floorgen (script[2], 66 KB)
- Prefabs por piso, bolsa de salas, `buildFloor()` vs `layout.cells`
- Corrige FLOORBAG bugs: nucleo_umbral nucleoOnly, plant→planter

### D. Sistemas CSS / HUD / Menú
- 23 bloques <style>: DMO hud (#dmo-compact-hud), arcade, boot-screen, DDC cover, overlay, subs
- #ddc-cover: 1672×941 cinematic + #ddc-bg blurred 22px + #ddc-stage 1672px logical
- #overlay: 704×384 JPEG gradient + #menu-card + #menu-scene53 (club-haze/beams/speakers)
- HUD: #hud fixed + #dmo-compact-hud + minimap 88×66 + sticks 104px + ability ready/empty

### E. Otros
- Sf: segundo atlas (128×128 por entity) para shadows? (Sf.atlas 128×128)
- Canvas principal #game 100dvw/vh, DPR min(devicePixelRatio,2), 2D context, imageSmoothingEnabled var por asset

## 2. Atlas y registros existentes
- Atlas principal 1024×1323 contiene TODO: suelos/paredes/props/personajes/enemigos/jefes/efectos
- Coordenadas precisas: rect = [x,y,w,h] en px atlas
- Sin atlas separado por categoría — todo en uno

## 3. Conflictos entre sistemas
- d (pixelArt) y p (HD player) compiten: Pf elige HD si existe, sino d
- __HD_DATA sobrescribe algunas claves boss_05 si falta attack_00
- DDC cover y overlay usan JPEGs distintos que ahora unificamos

## 4. Puntos de integración para reemplazo
- d.atlas.src → reemplazar con nuevo atlas regenerado (mismo rects, nuevo arte)
- window.__HD_DATA["path"] → reemplazar data URIs por nuevos sprites
- WeaponRig: `window.DMO.weaponRig` + `ut.h` (weapon sprite handling)
- CSS: #ddc-cover, #ddc-bg, #overlay, #menu-card, #game-title
- Canvas props: Yb(), Wb(), Yb() llamadas en ~52 drawImage sites

## 5. Plan de sustitución (12 tandas)
- T01: Identidad/logo/menú ✓ (WIP 7.4 MB, bg+logo integrados, CSS overhaul)
- T02: Suelos/materiales (48×48 tiles, 10 ambientes + v1/v2)
- T03: Paredes/arquitectura/puertas
- T04: Props/decoración HUB (sofa, plant, mirror, arcade…)
- T05: Protagonista animaciones (idle/walk/fire/hit/roll/death + HD 256)
- T06: Enemigos (6 familias × 6 estados)
- T07: Jefes (9 + núcleo, hit/death/attack)
- T08: Armas 120 (weapon_c*** + rig)
- T09: Pickups/objetos
- T10: Efectos (projectiles, impacts, neon)
- T11: HUD interfaz completa
- T12: Escenarios salas combate (integración final)

## 6. Backup
- BACKUP_original.html (4.84 MB) generado y verificado
- assets/atlas/original_atlas.png (134 KB) + thumb
- refs/ originales copiados

## 7. Riesgos
- ATLAS recorte debe respetar coordenadas exactas o romperá colisiones/visuales
- No tocar combate/IA/balance — solo visual
- DPR y responsive deben mantenerse
- Rendimiento: nuevos atlas no > 1024×2048, JPEG 84q max
