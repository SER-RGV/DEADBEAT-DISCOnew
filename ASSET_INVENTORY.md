# INVENTARIO MAESTRO DE ACTIVOS VISUALES (`v4.0.0-UNIFIED-DEFINITIVE`)

> **Total de Activos Registrados en Runtime (`assets/manifest.json` & `src/dd_asset_registry.js`):** **586 activos verificados** (incrementado desde 260)
> **Estado del Inventario Maestro (`docs/ART_REBUILD/MASTER_INVENTORY.json`):** **330 / 330 completados (`100.0%`)** · `0` pendientes
> **Auditoría de Transparencia y Limpieza:** **0 fondos ajedrezados horneados** · **100% HTTP 200 OK** en servidor en vivo

---

## 1. Resumen Cuantitativo por Categoría

| Categoría (`assets/manifest.json`) | Activos Registrados | Ubicación en Disco | Formato y Estándar Técnico |
| :--- | :---: | :--- | :--- |
| **Armas (`weapons`)** | **121** | `assets/weapons/weapon_*.png` | `320x160` RGBA, perfil lateral derecho, *rim-light* por rareza + `weapons_atlas.png` |
| **Entornos V5 y Escenarios (`environments_v5`)** | **100** | `assets/environments/v5/*.png` | Escenarios de los 9 Círculos, medallones de suelo, altares del HUB y props interactivos |
| **Arquitectura y Ambiente HUB (`hub_art`)** | **76** | `ART_ASSETS/hub/tanda_01..09/` | Cabina de Tempo, Pista Astrológica, Barra de Véspera, La Cabina, foso abisal y clubbers |
| **Soberanos / Bosses (`bosses` + `bosses_phase2`)** | **61** | `assets/bosses/` + `ART_ASSETS/bosses/` | `384x448` / `416x448` RGBA cuerpo completo (`idle`, `attack`, `hit`, `death`) + Fase 2 |
| **Enemigos (`enemies` + `enemies_e01`)** | **35** | `assets/enemies/` + `ART_ASSETS/tanda_E01/` | 24 frames (`walk`, `windup`, `attack`, `death`) de las 6 familias + 10 arquetipos E01 + atlas |
| **Props de Club (`props`)** | **29** | `assets/props/*.png` | Mobiliario VIP, subwoofers, lámpara de araña dorada, póster de sigilo, cofres y neones |
| **Personajes y Protagonista (`characters` + `tanda_03`)** | **40** | `assets/characters/` + `ART_ASSETS/tanda_03/` | 12 poses gameplay (`y=24..312`, cintura `y=173`), 8 vistas (`N..SO`), 4 NPCs y 16 masters |
| **Cinemáticas 2.5D (`cinematics`)** | **12** (+ 66 capas/loops) | `assets/cinematics/` + `CINEMATIC_ASSETS/` | 6 escenas maestras (`2560x1440` & `1920x1080`), 18 capas parallax, 48 frames loop y 10 círculos |
| **Pickups y Reliquias (`pickups`)** | **20** | `assets/pickups/*.png` | 12 pickups (`160x160` RGBA) + 8 reliquias malditas del DJ |
| **Proyectiles y Efectos VFX (`effects`)** | **20** | `assets/effects/*.png` | 10 proyectiles orientados al Este (+X) + 10 efectos de impacto, fogonazo y explosión |
| **Interfaz HUD y Menús (`ui` + `logos`)** | **17** | `assets/ui/` + `assets/logos/` | Retratos HUD, corazones llenos/vacíos, habilidades, emblemas de victoria/derrota y logos |
| **Suelos y Muros Modulares (`floors` + `walls`)** | **42** | `assets/floors/`, `assets/walls/`, `ART_ASSETS/tanda_01..02/` | 12 suelos `512x512` seamless, 10 muros `256x384` y 20 variantes arquitectónicas |
| **Puertas y Portales (`environments`)** | **9** | `assets/environments/*.png` | Puertas góticas abiertas/cerradas, portales de jefe y plataforma de descenso |
| **Atlas Maestros (`atlases`)** | **4** (+ 4 JSON) | `assets/atlases/*.{png,json}` | `protagonist_atlas`, `enemies_atlas`, `bosses_atlas`, `weapons_atlas` |
| **TOTAL REGISTRADO EN RUNTIME** | **586** | `assets/manifest.json` | **100% Verificado (`0` errores / `0` enlaces rotos)** |
