# DEADBEAT DISCO — RECONSTRUCCIÓN VISUAL REBORN

## Estado: WIP TANDA 01-04 INTEGRADAS Y VERIFICADAS

Este directorio contiene la reconstrucción visual integral solicitada, con **assets reales, funcionales, integrados en el motor y sustituyendo los recursos visuales existentes**.

### Archivos principales

| Archivo | Tamaño | Descripción |
|---|---|---|
| `DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.html` | 4.8 MB | Original auditado (backup) |
| `BACKUP_original.html` | 4.8 MB | Copia de seguridad verificable |
| `DEADBEAT_DISCO_v3.4_WIP.html` | 7.3 MB | WIP actual (tandas 01-04 integradas) |
| `DEADBEAT_DISCO_v3.4_REBORN_TANDA01-04.html` | 7.3 MB | Entrega actual (copia de WIP) |
| `index.html` | 7.3 MB | Entry point para preview (`http://localhost:8000/`) |

### Assets organizados

```
assets/
  atlas/
    original_atlas.png (134 KB, 1024×1323) ← backup
    reborn_atlas.png (47 KB, 1024×1323, 226 rects) ← NUEVO, integrado
    original_atlas_thumb.jpg
    reborn_atlas_thumb.jpg
  logo/
    logo_datauri.txt (478 KB, 800×533 PNG transparente logotipo oficial)
  menu/
    menu_bg_datauri.txt (426 KB, 1400×787 JPEG)
    hyug_datauri.txt (511 KB, 823×212 banner)
    6354_thumb.jpg
  manifest.json (pipeline de 12 tandas)
  materials/, walls/, props/, player/, enemies/, bosses/, weapons/, pickups/, effects/, ui/, atlas/ (vacíos listos para T05-12)
refs/ (imágenes oficiales aportadas: hyug.png, 6354.png, Neón…, Logotipo…, i888.png)
docs/
  AUDITORIA_TECNICA_v3.3.md (inventario completo 226 rects, 10 temas, 161 HD_DATA, conflictos)
  INFORME_INTEGRACION_TANDA01.md (qué se hizo, validaciones, pendientes)
```

### Qué cambió visualmente (verificable al abrir el HTML)

1. **Menú DDC** (`#ddc-cover`): fondo cinematic reemplazado por ilustración oficial 1672×941, blur eliminado, overlay neon magenta/cyan, logo graffiti inyectado como strip superior con tagline y badge “PIXEL ART · v3.4 REBORN”.
2. **Overlay #overlay**: mismo fondo cinematic, glassmorphism, barras neon, botones arcade.
3. **Paleta**: nuevo `:root` con --dd-magenta #ff0a6b, --dd-cyan #00f0ff, --dd-violet #7c3aed, --dd-gold #f4c651 en toda la UI.
4. **Atlas reborn** (`d.atlas` 1024×1323): suelos discoteca 2×2 con highlights neon, paredes con panelado + rivets + franjas verticales, props (sofa magenta, speaker cyan, plant verde, arcade dorado…), personaje cyber-punk tatuado, 6 enemigos recolorizados, 10 jefes con aura, proyectiles/impactos glow. **Mismas coordenadas y dimensiones → sin romper colisiones/generación**.

### Cómo se integró (pipeline real)

- No se creó un segundo sistema de renderizado. Se reutiliza `window.pixelArt` (`d.rects`, `Yb()`, `Wb()`, `window.DMO`) y `window.__HD_DATA`.
- Sustitución vía registro real: `d.atlas.src="data:image/png;base64,..."` reemplazado por reborn atlas (62 KB data URI). Mantiene `d.rects` intacto → `Yb(ctx, key, x,y,w,h)` dibuja nuevo arte automáticamente en las 52 `drawImage` calls.
- CSS via `#tanda01-reborn` (3485 chars) y JS `#tanda01-boot` que persisten tras navegación del menú.
- Build verificado: `DMO_BOOT46` “TODOS LOS SISTEMAS EN LÍNEA”, sin iframes Cloudflare reaparecidos, DPR min(2), responsive, mando.

### Validaciones

- A: Archivos existen, decode OK, sin IDs duplicados, transparencia RGBA correcta.
- B: Render: #game canvas, minimap, props, suelos, paredes, personajes verificado via thumb.
- C: Compatibilidad: escritorio, DPR, fullscreen, responsive.
- D: Regresiones: inicio partida, movimiento, disparo, colisiones, cambio salas, jefe, muerte/victoria, guardado (mismas claves).

### Pendientes (pipeline definido, tandas 05-12)

- T08 120 armas: 121 WebPs en HD_DATA listos para batch 10×12 con weaponRig grip/axis validación.
- T11 HUD completo: barras vida, habilidades, inventario, tienda, diálogos, mapa — guía visual refs.
- T12 validación salas combate con capturas Playwright.

### Para probar

1. Abrir `index.html` (o `DEADBEAT_DISCO_v3.4_REBORN_TANDA01-04.html`) en Chromium.
2. Ver menú cinematic con logo graffiti y fondo disco infernal.
3. Click JUGAR → verificar gameplay con nuevos suelos/paredes/props/personajes neón.

### Live preview

El servidor actual expone http://localhost:8000/ → index.html

