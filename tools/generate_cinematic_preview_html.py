import json
import os

with open("assets/cinematics/manifest.json", "r", encoding="utf-8") as f:
    manifest = json.load(f)

shots_html = ""
for shot in manifest["shots"]:
    bg_asset = manifest["assets"].get(shot["background"], {})
    bg_file = bg_asset.get("file", "")
    thumb_file = bg_asset.get("thumbnail", bg_file)
    
    layers_items = ""
    for lay_id in shot.get("fallback_layers", shot.get("layers", [])):
        lay_meta = manifest["assets"].get(lay_id, {})
        layers_items += f"""
        <li class="layer-item">
          <div class="layer-info">
            <span class="badge layer-badge">{lay_meta.get('behavior', 'layer')}</span>
            <strong>{lay_id}</strong>
            <code>{lay_meta.get('file', '')}</code>
          </div>
          <span class="dim">{lay_meta.get('expected', {}).get('w', 1920)}x{lay_meta.get('expected', {}).get('h', 1080)} PNG</span>
        </li>
        """

    chars_items = ""
    for ch_id in shot.get("characters", []):
        chars_items += f'<span class="badge char-badge">{ch_id}</span> '

    effects_items = ""
    for eff in shot.get("effects", []):
        effects_items += f'<span class="badge eff-badge">{eff}</span> '

    shots_html += f"""
    <article class="shot-card" id="{shot['id']}">
      <header class="shot-header">
        <div class="shot-badge-group">
          <span class="shot-number">PLANO {shot['index']:02d}</span>
          <span class="shot-time">{shot['time_range']} ({shot['duration']}s)</span>
          <span class="shot-type">{shot['shot_type']}</span>
        </div>
        <h3>{shot['name']}</h3>
        <p class="shot-cam"><strong>Cámara:</strong> {shot['camera']}</p>
      </header>

      <div class="shot-body">
        <div class="shot-preview">
          <img src="../../../{thumb_file}" alt="{shot['name']}" loading="lazy" class="shot-thumb">
          <div class="shot-file-tag">{bg_file}</div>
          <p class="dim">Base activa: maestro. Las capas listadas son respaldo si falla la carga.</p>
        </div>

        <div class="shot-details">
          <h4>Recursos Visuales Asociados</h4>
          <div class="meta-row">
            <span class="label">Fondo Maestro:</span>
            <code>{bg_file}</code>
          </div>
          
          <h4>Capas activas sobre el maestro: ninguna</h4>
          <p class="dim">Sin paralaje adicional hasta disponer de capas compatibles.</p>
          <h4>Capas de respaldo ({len(shot.get('fallback_layers', shot.get('layers', [])))})</h4>
          <ul class="layers-list">
            {layers_items or '<li class="dim">Ninguna (composición directa)</li>'}
          </ul>

          <div class="tags-section">
            <div class="tag-group"><strong>Personajes:</strong> {chars_items or '<span class="dim">Ninguno</span>'}</div>
            <div class="tag-group"><strong>Efectos Visuales:</strong> {effects_items or '<span class="dim">Estándar</span>'}</div>
          </div>
        </div>
      </div>
    </article>
    """

all_assets_table = ""
for aid, ameta in sorted(manifest["assets"].items()):
    all_assets_table += f"""
    <tr>
      <td><strong>{aid}</strong></td>
      <td><span class="badge cat-{ameta.get('category','gen')}">{ameta.get('category','')}</span></td>
      <td><code>{ameta.get('file','')}</code></td>
      <td>{ameta.get('expected',{}).get('w','?')}x{ameta.get('expected',{}).get('h','?')}</td>
      <td>{ameta.get('scene','-')}</td>
      <td><code>{ameta.get('fallback','')}</code></td>
    </tr>
    """

html_template = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEADBEAT DISCO · Cinemática Modular · Previsualizador de Recursos</title>
  <style>
    :root {{
      --bg: #090412;
      --panel: #130924;
      --card: #1c0e35;
      --card-border: #331b5c;
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --magenta: #ff007f;
      --cyan: #00f0ff;
      --gold: #ffcc00;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      line-height: 1.5;
      padding: 24px;
    }}
    header.hero-banner {{
      max-width: 1300px;
      margin: 0 auto 32px auto;
      border-bottom: 2px solid var(--card-border);
      padding-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }}
    h1 {{ font-size: 28px; font-weight: 800; color: #fff; letter-spacing: 0.5px; text-transform: uppercase; }}
    h1 span {{ color: var(--magenta); text-shadow: 0 0 12px var(--magenta); }}
    .subtitle {{ color: var(--text-dim); font-size: 14px; margin-top: 4px; }}
    .manifest-badge {{
      background: rgba(0, 240, 255, 0.1);
      border: 1px solid var(--cyan);
      color: var(--cyan);
      padding: 6px 14px;
      border-radius: 999px;
      font-family: var(--font-mono);
      font-size: 13px;
    }}
    .container {{
      max-width: 1300px;
      margin: 0 auto;
    }}
    .instruction-box {{
      background: var(--panel);
      border-left: 4px solid var(--gold);
      padding: 16px 20px;
      border-radius: 6px;
      margin-bottom: 32px;
      font-size: 14px;
    }}
    .instruction-box h3 {{ color: var(--gold); margin-bottom: 6px; font-size: 15px; }}
    .shot-card {{
      background: var(--panel);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      margin-bottom: 28px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }}
    .shot-card:hover {{
      border-color: var(--cyan);
    }}
    .shot-header {{
      background: var(--card);
      padding: 14px 20px;
      border-bottom: 1px solid var(--card-border);
    }}
    .shot-badge-group {{
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 8px;
    }}
    .shot-number {{
      background: var(--magenta);
      color: #fff;
      font-weight: 800;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 1px;
    }}
    .shot-time {{
      font-family: var(--font-mono);
      color: var(--gold);
      font-size: 12px;
    }}
    .shot-type {{
      color: var(--cyan);
      font-size: 12px;
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
    }}
    .shot-header h3 {{
      font-size: 18px;
      font-weight: 700;
    }}
    .shot-cam {{
      font-size: 13px;
      color: var(--text-dim);
      margin-top: 4px;
    }}
    .shot-body {{
      display: grid;
      grid-template-columns: 460px 1fr;
      gap: 24px;
      padding: 20px;
    }}
    @media (max-width: 900px) {{
      .shot-body {{ grid-template-columns: 1fr; }}
    }}
    .shot-preview {{
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--card-border);
      background: #000;
    }}
    .shot-thumb {{
      width: 100%;
      height: auto;
      aspect-ratio: 16/9;
      object-fit: cover;
      display: block;
    }}
    .shot-file-tag {{
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(9, 4, 18, 0.88);
      font-family: var(--font-mono);
      font-size: 11px;
      padding: 6px 10px;
      color: #cbd5e1;
      border-top: 1px solid rgba(255,255,255,0.1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .shot-details h4 {{
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--cyan);
      margin: 12px 0 6px 0;
    }}
    .shot-details h4:first-child {{ margin-top: 0; }}
    .meta-row {{
      font-size: 13px;
      margin-bottom: 8px;
    }}
    .layers-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}
    .layer-item {{
      background: var(--card);
      border: 1px solid var(--card-border);
      padding: 8px 12px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }}
    .layer-info {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .layer-item code {{
      font-family: var(--font-mono);
      color: #94a3b8;
      font-size: 11px;
    }}
    code {{
      font-family: var(--font-mono);
      background: rgba(255,255,255,0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #e2e8f0;
    }}
    .dim {{ color: var(--text-dim); font-size: 12px; }}
    .badge {{
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 700;
      text-transform: uppercase;
    }}
    .layer-badge {{ background: rgba(0, 240, 255, 0.15); color: var(--cyan); }}
    .char-badge {{ background: rgba(255, 0, 127, 0.15); color: var(--magenta); }}
    .eff-badge {{ background: rgba(255, 204, 0, 0.15); color: var(--gold); }}
    .cat-backgrounds {{ background: rgba(0, 240, 255, 0.2); color: var(--cyan); }}
    .cat-characters {{ background: rgba(255, 0, 127, 0.2); color: var(--magenta); }}
    .cat-logos {{ background: rgba(255, 204, 0, 0.2); color: var(--gold); }}
    .tags-section {{
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
    }}
    table.manifest-table {{
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      background: var(--panel);
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
    }}
    table.manifest-table th, table.manifest-table td {{
      padding: 10px 14px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
    }}
    table.manifest-table th {{
      background: var(--card);
      color: var(--cyan);
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }}
    table.manifest-table tr:hover {{
      background: rgba(255,255,255,0.02);
    }}
    footer {{
      margin-top: 48px;
      text-align: center;
      color: var(--text-dim);
      font-size: 13px;
      border-top: 1px solid var(--card-border);
      padding-top: 24px;
    }}
  </style>
</head>
<body>
  <header class="hero-banner">
    <div>
      <h1>DEADBEAT DISCO <span>· Cinemática Modular</span></h1>
      <p class="subtitle">Herramienta de Previsualización y Mapa de Sustitución Directa de Recursos (FASE 04)</p>
    </div>
    <div class="manifest-badge">
      Manifest v{manifest['version']} · {len(manifest['assets'])} Activos Registrados
    </div>
  </header>

  <main class="container">
    <div class="instruction-box">
      <h3>🚀 Cómo sustituir cualquier imagen desde GitHub sin programar</h3>
      <p>Localiza el plano que deseas modificar abajo, copia la ruta del archivo correspondiente en <code>assets/cinematics/</code>, sube tu nueva imagen manteniendo exactamente el mismo nombre de archivo y publica el cambio en GitHub. El motor cargará la nueva imagen de forma inmediata sin alterar la cámara, la música ni el código.</p>
    </div>

    <section class="shots-container">
      {shots_html}
    </section>

    <section class="all-assets-section">
      <h2 style="font-size: 20px; color: #fff; margin: 40px 0 16px 0;">Tabla Completa de Referencias y Archivos</h2>
      <table class="manifest-table">
        <thead>
          <tr>
            <th>Identificador Único</th>
            <th>Categoría</th>
            <th>Ruta del Archivo</th>
            <th>Resolución</th>
            <th>Escena</th>
            <th>Recurso de Respaldo</th>
          </tr>
        </thead>
        <tbody>
          {all_assets_table}
        </tbody>
      </table>
    </section>
  </main>

  <footer>
    <p>DEADBEAT DISCO · Sistema de Cinemática Modular · 2026</p>
  </footer>
</body>
</html>
"""

os.makedirs("assets/cinematics/preview", exist_ok=True)
with open("assets/cinematics/preview/index.html", "w", encoding="utf-8") as f:
    f.write(html_template)

print("Successfully generated assets/cinematics/preview/index.html!")
