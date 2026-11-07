#!/usr/bin/env python3
"""Métricas y hoja comparativa de la MODIFICACIÓN PRIORITARIA A–F.

Compara, EN LA MISMA PÁGINA y sin recarga, `ab_antes_*.jpg` (flag OFF,
estado publicado) con `ab_despues_*.jpg` (flag ON). Recorte central común
(120,150)-(1160,780), idéntico al usado en la auditoría de legibilidad.

Además mide la línea recta magenta del sur (C4): nº de píxeles magenta
brillantes en la franja y=725..750 de `ab_*_borde.jpg`.
"""
from __future__ import annotations
import json
import pathlib
from PIL import Image, ImageDraw, ImageStat

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
OUT = ROOT / 'ART_EVIDENCE' / 'hub' / 'correccion'
CROP = (120, 150, 1160, 780)
ZONES = ['centro', 'norte', 'nw', 'este', 'sur', 'borde']


def metrics(path: pathlib.Path) -> dict:
    im = Image.open(path).convert('L').crop(CROP)
    st = ImageStat.Stat(im)
    mean = st.mean[0]
    std = st.stddev[0]
    # energía de borde (gradiente horizontal + vertical, muestreado 2px)
    px = im.load()
    w, h = im.size
    tot = 0
    n = 0
    for y in range(0, h - 2, 2):
        for x in range(0, w - 2, 2):
            tot += abs(px[x, y] - px[x + 2, y]) + abs(px[x, y] - px[x, y + 2])
            n += 1
    edge = tot / max(1, n)
    hist = im.histogram()
    dark = 100.0 * sum(hist[:48]) / (w * h)
    bright = 100.0 * sum(hist[210:]) / (w * h)
    return {'media': round(mean, 2), 'contraste': round(std, 2),
            'bordes': round(edge, 2), 'oscuro': round(dark, 2),
            'brillante': round(bright, 2)}


def plane_separation(path: pathlib.Path) -> float:
    """Jerarquía de planos: luminancia del plano principal MENOS la del
    plano profundo. Cuanto mayor, más separa la discoteca del abismo."""
    im = Image.open(path).convert('L')
    top = ImageStat.Stat(im.crop((120, 150, 1160, 480))).mean[0]
    bottom = ImageStat.Stat(im.crop((120, 680, 1160, 880))).mean[0]
    return round(top - bottom, 2)


def magenta_line(path: pathlib.Path) -> int:
    """Cuenta píxeles de la línea neón recta del sur en la franja y=725..750."""
    im = Image.open(path).convert('RGB')
    px = im.load()
    n = 0
    for y in range(725, 751):
        for x in range(0, im.width, 2):
            r, g, b = px[x, y]
            if r > 150 and b > 110 and g < 120 and r - g > 60 and b - g > 40:
                n += 1
    return n


def sheet(pairs: list, path: pathlib.Path) -> None:
    tw, th = 520, 366
    canvas = Image.new('RGB', (tw * 2 + 30, (th + 26) * len(pairs) + 26), (10, 10, 16))
    d = ImageDraw.Draw(canvas)
    for i, (name, a, b) in enumerate(pairs):
        y = 26 + i * (th + 26)
        for j, (label, f) in enumerate([('ANTES · flag OFF', a), ('DESPUÉS · flag ON', b)]):
            im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
            canvas.paste(im, (10 + j * (tw + 10), y))
            d.text((14 + j * (tw + 10), y - 17), f'{name} — {label}', fill=(240, 240, 250))
    canvas.save(path, 'PNG', optimize=True)


def main() -> int:
    rows = []
    pairs = []
    for z in ZONES:
        a = OUT / f'ab_antes_{z}.jpg'
        b = OUT / f'ab_despues_{z}.jpg'
        if not (a.exists() and b.exists()):
            raise SystemExit(f'Faltan capturas A/B para {z}')
        ma, mb = metrics(a), metrics(b)
        rows.append({'zona': z, 'antes': ma, 'despues': mb,
                     'dMedia': round(mb['media'] - ma['media'], 2),
                     'dContraste': round(mb['contraste'] - ma['contraste'], 2),
                     'dBordes': round(mb['bordes'] - ma['bordes'], 2),
                     'dOscuro': round(mb['oscuro'] - ma['oscuro'], 2),
                     'separacionPlanosAntes': plane_separation(a),
                     'separacionPlanosDespues': plane_separation(b)})
        pairs.append((z, a, b))
    # métrica C4: desaparición del borde recto
    c4 = {'antes': magenta_line(OUT / 'ab_antes_borde.jpg'),
          'despues': magenta_line(OUT / 'ab_despues_borde.jpg'),
          'restaurado': magenta_line(OUT / 'ab_restaurado_borde.jpg')}
    c4['reduccion_pct'] = round(100 * (1 - c4['despues'] / max(1, c4['antes'])), 1)
    data = {'generatedAt': __import__('datetime').datetime.now().isoformat(),
            'crop': list(CROP), 'zonas': rows, 'lineaMagentaC4': c4,
            'resumen': {
                'dMediaMin': min(r['dMedia'] for r in rows),
                'dMediaMax': max(r['dMedia'] for r in rows),
                'dContrasteMin': min(r['dContraste'] for r in rows),
                'dContrasteMax': max(r['dContraste'] for r in rows),
                'dBordesMin': min(r['dBordes'] for r in rows),
                'dBordesMax': max(r['dBordes'] for r in rows)}}
    (OUT / 'metricas.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    sheet(pairs, OUT / 'comparativa_antes_despues.png')
    print('zonas', len(rows), '| Δmedia', data['resumen']['dMediaMin'], '..', data['resumen']['dMediaMax'])
    print('C4 línea magenta', c4)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
