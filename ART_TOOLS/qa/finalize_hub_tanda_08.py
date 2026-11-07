#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TANDA 08 · cierre: hashes SHA-256, manifest INTEGRADO_VALIDADO, mapa de
profundidad, comparativas A/B y report.json de evidencias.

Uso: PYTHONPATH=/tmp/pylibs python3 ART_TOOLS/qa/finalize_hub_tanda_08.py
"""
from __future__ import annotations

import datetime
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_08'
EV = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_08'
EV.mkdir(parents=True, exist_ok=True)


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(1 << 18), b''):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    man = json.loads((ASSETS / 'manifest.json').read_text(encoding='utf-8'))
    qa = json.loads((EV / 'qa_tanda08.json').read_text(encoding='utf-8'))
    comp = json.loads((EV / 'composition_proof.json').read_text(encoding='utf-8'))

    hashes, bad = [], []
    for a in man['assets']:
        p = ROOT / a['file']
        real = sha256(p) if p.exists() else None
        rec = dict(id=a['id'], alias=a['alias'], file=a['file'],
                   expected=a['sha256'], actual=real,
                   match=real == a['sha256'], bytes=p.stat().st_size if p.exists() else 0)
        hashes.append(rec)
        if not rec['match']:
            bad.append(a['id'])
    mh = sha256(ASSETS / 'manifest.json')
    (EV / 'hashes.json').write_text(json.dumps(dict(
        tanda='08', generated=datetime.datetime.now().isoformat(timespec='seconds'),
        count=len(hashes), matched=len(hashes) - len(bad), discrepancies=bad,
        manifestPreHash=mh, assets=hashes), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    ok = (len(bad) == 0 and man['allValid'] and qa['failed'] == 0 and
          comp['verdict'] == 'APROBADA' and qa['verdict'] == 'APROBADO')
    man['status'] = 'INTEGRADO_VALIDADO' if ok else 'INCIDENCIAS'
    man['phase'] = 'FASE 5 · cerrada'
    man['integratedAt'] = datetime.datetime.now().isoformat(timespec='seconds')
    man['integration'] = dict(
        html='DEADBEAT_DISCO.ART.html :: TANDA08:BEGIN/END (módulo T08 + T08.install())',
        pack='ART_PACK/art_pack.js :: HUB8_ASSETS/loadHub8()/API hub8*',
        version='fase1-…+hub-tanda08',
        v5KeysBefore=168, v5KeysAfter=178,
        hooks=['zf (cutaway, grieta, brasas/ceniza)', 'Tf (dt del motor)'],
        flag='window.__DDM_HUB_T08 = false',
        camera='sin modificar (zoom .9375, límites x[883,1617] y[655,1195])',
        canvas=27, sequencers=1,
        descent='shaftOpen/stairProgress reales de floorDropAnim',
        newSystems=['sin canvas', 'sin motor', 'sin cámara', 'sin loader',
                    'sin rAF', 'sin temporizador propio', 'sin audio',
                    'sin colisiones', 'sin geometría', 'sin estaciones',
                    'sin progresión', 'sin NPC/criaturas/enemigos'])
    man['qa'] = dict(verdict=qa['verdict'], total=qa['total'], tally=qa['tally'],
                     automated=qa['automated'], failed=qa['failed'],
                     evidence='ART_EVIDENCE/hub/tanda_08/qa_tanda08.json')
    man['composition'] = dict(verdict=comp['verdict'], total=comp['total'],
                              passed=comp['passed'],
                              evidence='ART_EVIDENCE/hub/tanda_08/composition_proof.json')
    (ASSETS / 'manifest.json').write_text(
        json.dumps(man, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # --- mapa de profundidad + carencias (machine readable) ------------------
    depth = dict(
        tanda='08', generated=datetime.datetime.now().isoformat(timespec='seconds'),
        camera=dict(zoom=.9375, viewW=1365, viewH=960, lead=dict(x=0, y=10),
                    limits=dict(x=[883, 1617], y=[655, 1195]),
                    southView='y715…1675 en cam.y=1195'),
        constraint='Bajo y1585 sólo hay ~84 px; durante el descenso la cámara '
                   'SUBE (1195→1306→985). La profundidad se resuelve como '
                   'cutaway en espacio de pantalla anclado al borde real.',
        formula=dict(edgeY='450 + zoom*(1585 - cam.y)',
                     expand='260 * shaftOpen',
                     windowTop='edgeY - expand',
                     planeY='T + Wh*(0.06 + 0.88*d^0.78)',
                     planeH='Wh*(0.30 - 0.20*d)',
                     parallax='-zoom*(cam.x - 1250)*factor'),
        planes=[
            dict(id='P1_cercano', d=.00, factor=.92, alpha=.98, screenY=820.7,
                 role='Paredes próximas con máxima definición',
                 assets=['h08_pared_cercana_izq', 'h08_pared_cercana_der'],
                 state='RESUELTO por T08'),
            dict(id='P2_medio', d=.26, factor=.66, alpha=.82, screenY=846.7,
                 role='Estrato + columnas naturales',
                 assets=['h08_estrato_medio', 'h08_columna_natural'],
                 state='RESUELTO por T08'),
            dict(id='P3_intermedio', d=.52, factor=.40, alpha=.62, screenY=865.3,
                 role='Plataforma suspendida + rocas flotantes',
                 assets=['h08_plataforma_suspendida', 'h08_rocas_suspendidas'],
                 state='RESUELTO por T08'),
            dict(id='P4_lejano', d=.76, factor=.20, alpha=.42, screenY=880.6,
                 role='Pared lejana + cavidades, bajo contraste',
                 assets=['h08_pared_lejana', 'h08_cavidades_lejanas'],
                 state='RESUELTO por T08'),
            dict(id='P5_fondo', d=.94, factor=.08, alpha=.30, screenY=891.4,
                 role='Fuentes de luz infernales que interpretan distancia',
                 assets=['h08_luces_abismo'], state='RESUELTO por T08'),
            dict(id='A_ambiente', factor=None, role='Humo infernal, brasas, ceniza, luces lejanas móviles',
                 assets=['h08_humo_infernal'], state='RESUELTO por T08')],
        alreadyResolved=[
            'Superficie transitable y medallón (T01–T06)',
            'Labio del acantilado y estrato T07 (y1470…1585)',
            'Grieta central: marco/decal T01 + panel III · DESCENSO',
            'Llegada breve, 6 actores NPC y transición de descenso (T07)',
            'Iluminación Wb/gradientes y DMO_ATMOS (bloom/vignette/grain)'],
        gaps=[
            dict(priority='P1', gap='La grieta era un agujero negro sin lectura de distancia',
                 resolution='Resplandor aditivo, banda de luces lejanas y brasas dentro de la elipse interior'),
            dict(priority='P2', gap='Bajo el acantilado sólo había una banda de roca plana',
                 resolution='5 planos de cutaway con trapezoide convergente'),
            dict(priority='P3', gap='Sin sistema de animación ambiental propio',
                 resolution='56 brasas + 26 cenizas + 4 columnas de humo + 3 luces lejanas, preasignados'),
            dict(priority='P4', gap='Sin parallax de profundidad',
                 resolution='Factores .92/.66/.40/.20/.08 derivados de DMO.camera()'),
            dict(priority='P5', gap='El descenso no revelaba nuevas capas',
                 resolution='expand = 260*shaftOpen, winH 84→374 px, luces y densidad ligadas a stairProgress')],
        reuse=['registro __DDM_V5_IMG / load()', 'hooks zf y Tf existentes',
               'reloj Z y dt del motor', 'Yc.reduced', 'floorDropAnim',
               'decal hub_abyss_stair_crack (T01)', 'labio y estrato (T07)'],
        deliberatelyUntouched=['cámara global', 'colisiones', 'geometría transitable',
                               'puertas', 'estaciones', 'progresión', 'audio/secuenciador',
                               'lógica de llegada', 'recuperación de control'])
    (EV / 'mapa_profundidad.json').write_text(
        json.dumps(depth, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    # --- comparativas A/B lado a lado ---------------------------------------
    for key in ('00_centro', '02_borde_sur', '03_sur_izq'):
        on, off = EV / f't08_AB_ON_{key}.jpg', EV / f't08_AB_OFF_{key}.jpg'
        if not (on.exists() and off.exists()):
            continue
        a, b = Image.open(on).convert('RGB'), Image.open(off).convert('RGB')
        a.thumbnail((640, 450)); b.thumbnail((640, 450))
        sheet = Image.new('RGB', (a.width + b.width + 24, max(a.height, b.height) + 34), (12, 10, 20))
        d = ImageDraw.Draw(sheet)
        d.text((8, 10), 'TANDA 08 · ON', fill=(255, 190, 90))
        d.text((a.width + 32, 10), 'TANDA 08 · OFF (flag=false)', fill=(150, 210, 255))
        sheet.paste(a, (8, 30)); sheet.paste(b, (a.width + 16, 30))
        sheet.save(EV / f't08_comparativa_{key}.jpg', quality=88)

    report = dict(
        tanda='08', title='El abismo vivo',
        generatedAt=datetime.datetime.now().isoformat(timespec='seconds'),
        status=man['status'], verdict=qa['verdict'],
        assets=dict(count=man['count'], allValid=man['allValid'],
                    exactSize=sum(1 for a in man['assets'] if a['verification']['exactSize']),
                    hashesMatched=len(hashes) - len(bad), discrepancies=bad),
        composition=dict(verdict=comp['verdict'], checks=f"{comp['passed']}/{comp['total']}"),
        qa=dict(total=qa['total'], tally=qa['tally'], failed=qa['failed']),
        evidence=dict(directory='ART_EVIDENCE/hub/tanda_08/',
                      files=len(list(EV.iterdir())),
                      qa='qa_tanda08.json', hashes='hashes.json',
                      depthMap='mapa_profundidad.json',
                      composition='composition_proof.json'),
        integration=man['integration'],
        noVerificado=[c['id'] + ' · ' + c['name'] for c in qa['checks']
                      if c['status'] == 'NO VERIFICADO'])
    (EV / 'report.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('status        :', man['status'])
    print('hashes        :', len(hashes) - len(bad), '/', len(hashes), 'discrepancias', bad)
    print('composición   :', comp['passed'], '/', comp['total'], comp['verdict'])
    print('QA            :', qa['tally'], '→', qa['verdict'])
    print('evidencias    :', report['evidence']['files'], 'ficheros')
    return 0 if ok else 1


if __name__ == '__main__':
    raise SystemExit(main())
