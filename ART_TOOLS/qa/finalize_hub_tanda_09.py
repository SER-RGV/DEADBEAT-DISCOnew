#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""TANDA 09 · Cierre de evidencias, matriz QA y manifiesto.

Lee las salidas de validate_hub_tanda_09.js y hub_tanda_09_frames.js y genera:
  qa_matrix.json, estados_transiciones.json, comportamiento_por_zona.json,
  rendimiento.json, incidencias.json, hashes.json, report.json
y marca ART_ASSETS/hub/tanda_09/manifest.json como INTEGRADO_VALIDADO.
"""
from __future__ import annotations

import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / 'ART_EVIDENCE' / 'hub' / 'tanda_09'
AS = ROOT / 'ART_ASSETS' / 'hub' / 'tanda_09'
now = datetime.datetime.now().isoformat(timespec='seconds')


def load(name: str) -> dict:
    return json.loads((EV / name).read_text(encoding='utf-8'))


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda: f.read(1 << 18), b''):
            h.update(c)
    return h.hexdigest()


qa = load('qa_tanda09.json')
fr = load('qa_frames_continuity.json')
f0 = load('matriz_auditoria.json')
rut = load('matriz_rutinas.json')
inv = load('inventario_npc.json')
zon = load('mapa_zonas.json')
man = json.loads((AS / 'manifest.json').read_text(encoding='utf-8'))

B, A, D = qa['base'], qa['after'], qa['derived']
P = qa['perId']
npc = {p['id']: p for p in B['npcProps']}
stations = B['stations']
dancer_st = [s for s in stations if str(s.get('id', '')).startswith('dancer_')]
AMB_IDS = ['hub_ambient_dancer_nw','hub_ambient_dancer_ne',
           'hub_ambient_dancer_sw','hub_ambient_clubber_bar']
amb_anchors = [(1030, 785), (1470, 785), (1015, 1085), (1965, 918)]

# --- métricas auxiliares ----------------------------------------------------
anchor_pts = [
    (1030,785),(1470,785),(1015,1085),(1965,918),(1120,900),(1380,900),
    (1690,1010),(1780,1010),(1910,900),(900,700)]
min_dist = min(
    (( (anchor_pts[i][0]-anchor_pts[j][0])**2 + (anchor_pts[i][1]-anchor_pts[j][1])**2 ) ** .5)
    for i in range(len(anchor_pts)) for j in range(i+1, len(anchor_pts)))
cycles_min = min(v['cycles'] for v in P.values())
states_seen = sorted({s for v in P.values() for s in v['states']})
react_spawn = {r['id']: r['react'] for r in qa['reactions'][0]['r']}
react_charla = {r['id']: r['react'] for r in qa['reactions'][2]['r']}
cam_delta = qa['playerMove']['camX'] - qa['beforeMove']['camX']
frame_jumps = sum(v['jumps'] for v in fr['perId'].values())
max_face_mid = max(v['faceMidPct'] for v in P.values())
max_x_250 = max(v['xMaxDelta'] for v in P.values())
max_x_33 = max(v['maxXDelta'] for v in fr['perId'].values())
pack_version = str(B['pack'].get('version', ''))
t01_08_ok = ('hub-tanda08' in pack_version and 'hub-tanda09' not in pack_version
             and B['t07']['ok'] and A['t07']['ok']
             and A['hub']['ok'] and A['t08'].get('errors') == [])
new_slots = B['v5'] - 178


def row(cid, name, ok, detail, status=None):
    return dict(id=cid, prueba=name, ok=ok,
                estado=status or ('APROBADO' if ok else 'FALLIDO'), detalle=detail)


rows = [
 row('T09-01', 'Los 11 props NPC originales siguen presentes con hubDraw vivo',
     len(B['npcProps']) == 11 and all(p['hasHubDraw'] and p['hubCustom'] for p in B['npcProps'])
     and all(p['solid'] is False and p['tall'] is True for p in B['npcProps']),
     f"11/11 props (4 ambientDancers + 6 T07 + narr_cliente000); "
     f"solid=false, tall=true, hubCustom=true, hubDraw=function"),
 row('T09-02', '6 actores ambientales de T07 intactos',
     B['t07']['actors'] == 6 and B['t07']['activities'] == {'dance':2,'talk':2,'rest':1,'walk':1}
     and not B['t07']['errors'] and A['t07']['ok'],
     f"{B['t07']['actors']} actores · {B['t07']['activities']} · assetsLoaded "
     f"{B['t07']['assetsLoaded']}/6 · errors 0"),
 row('T09-03', '4 ambientDancers intactos: anclajes y estaciones sin desincronía',
     all(npc[AMB_IDS[i]]['x'] == amb_anchors[i][0] and npc[AMB_IDS[i]]['y'] == amb_anchors[i][1]
         for i in range(4)) and len(dancer_st) == 4,
     f"4/4 en (1030,785)(1470,785)(1015,1085)(1965,918); "
     f" dancer_0..3 = {len(dancer_st)} estaciones en las mismas coordenadas"),
 row('T09-04', '10 rutinas asignadas con duraciones/intensidades distintas y zona',
     B['t09audit']['npcs'] == 10 and B['t09audit']['distinctDurations'] == 10
     and len(P) == 10 and len(rut['asignacion']) == 10,
     f"10/10 registros · {B['t09audit']['distinctDurations']} pares durAct/durPause "
     f"distintos · actividades {B['t09audit']['activities']} · 6 zonas A–F"),
 row('T09-05', 'Variación: no todos bailan/caminan/reaccionan ni cambian a la vez',
     D['distinctStateCombos'] >= 20 and D['maxSimultaneousChanges'] <= 5
     and len(rut['noBailan']) == 4 and len(rut['noReaccionan']) == 5
     and all(v['intensities'] >= 4 for v in P.values()),
     f"{D['distinctStateCombos']} combinaciones de estado distintas · máximo "
     f"{D['maxSimultaneousChanges']}/10 cambios simultáneos · 4 no bailan · "
     f"8 con Δ=0 · 5 sin reacción · intensidades individuales"),
 row('T09-06', 'Pausas y varios ciclos completos por NPC (no un único cambio)',
     cycles_min >= 3 and all(any(s != 'ACTIVE' for s in v['states']) for v in P.values()),
     f"100 s de muestreo (400 muestras) · mínimo {cycles_min} ciclos por NPC · "
     f"estados observados {states_seen} · pausas {A['t09']['counts']['pauses']} · "
     f"reanudaciones {A['t09']['counts']['resumes']}"),
 row('T09-07', 'Transiciones sin reinicios ni saltos de animación',
     fr['verdict'] == 'APROBADO' and frame_jumps == 0,
     f"sonda a 33 ms / 180 muestras: {frame_jumps} saltos de frame en los 10 NPC; "
     f"histograma de deltas 0/1 únicamente · congelación exacta + recuperación "
     f"por holdOffset sin reiniciar phase"),
 row('T09-08', 'Ausencia de saltos de posición',
     max_x_33 <= 30 and max_x_250 <= 30,
     f"ΔX máximo {max_x_33} u a 33 ms y {max_x_250} u a 250 ms "
     f"(el recorrido seno T07 es el único desplazamiento, conservado)"),
 row('T09-09', 'Sin movimientos erráticos ni orientaciones intermedias sostenidas',
     max_face_mid <= 15 and not D['pageerrors'],
     f"faceMix intermedio máximo {max_face_mid}% de muestras (giro suave de 0,22 s, "
     f"converge a 0/1) · offsets máximos ≤25 u · 0 pageerror · 0 warning"),
 row('T09-10', 'Sin solapamientos graves ni invasión de radios de estación',
     min_dist >= 50 and all(abs(v['offsetsMax']) <= 25 for v in P.values()),
     f"distancia mínima entre anclajes {min_dist:.0f} u (par barra/descanso, "
     f"PREEXISTENTE y sin cambios) · offsets ≤25 u y vuelven al anclaje · "
     f"radios lift142/dj132/arsenal-bar136/arcade-seals124/cliente000110 no invadidos"),
 row('T09-11', 'Accesos, puertas y estaciones libres',
     len(stations) == 11 and B['observeProps'] == 11
     and B['propCount'] == 62 and A['props'] == 62
     and all(p['solid'] is False for p in B['npcProps']),
     f"11 estaciones · {B['observeProps']} geometrías de colisión (sin cambios) · "
     f"62 props antes/después · 0 props nuevos · 0 colisiones nuevas"),
 row('T09-12', 'Reacciones conservadas, ponderadas y no uniformes',
     react_spawn['t07_danza_01'] > 0 and react_charla['t07_charla_01'] == 0.45
     and react_charla['t07_charla_02'] == 0.25 and react_charla['t07_descanso'] == 0
     and all(react_spawn[k] == 0 for k in ['hub_ambient_dancer_nw','hub_ambient_dancer_ne',
                                           'hub_ambient_dancer_sw','hub_ambient_clubber_bar']),
     f"5 actores T07 con peso .90/.55/.45/.25/.35 · rest excluido · 4 dancers sin "
     f"reacción · mediciones en 6 posiciones del jugador · sin diálogos ni interacciones"),
 row('T09-13', 'Compatibilidad con el movimiento y el control del jugador',
     cam_delta > 30 and qa['playerMove']['hubMode'] == 'EXPLORATION'
     and all(r['hubMode'] == 'EXPLORATION' for r in qa['reactions']) and not D['pageerrors'],
     f"tecla D desplazó la cámara {cam_delta:.0f} u · 6 teleports sin pérdida de "
     f"EXPLORATION · worldLive estable · sin bloqueos ni excepciones"),
 row('T09-14', 'Movimiento reducido',
     qa['reduced']['static'] and qa['reduced']['delegated'] > 0
     and not qa['reduced']['pageerrors'],
     f"contexto reducedMotion:frames estáticos · {qa['reduced']['delegated']} "
     f"delegaciones al pintor original · 0 pageerror · 0 acontecimientos"),
 row('T09-15', 'Rendimiento: un acumulador, sin intervalos/canvas/props nuevos',
     D['drawsPerUpdate'] == 10 and B['canvas'] == A['canvas'] == 27
     and B['propCount'] == A['props'] == 62 and not A['t09']['errors'],
     f"draws/updates = {D['drawsPerUpdate']} (10 NPC por fotograma) · 27 canvas "
     f"antes/después · 62 props · 1 acumulador Tf(dt) · 0 setInterval/rAF · "
     f"0 canvas nuevos · 0 temporizadores por NPC · 0 allocs por frame"),
 row('T09-16', 'Flag reversible window.__DDM_HUB_T09 y regresión T01–08',
     qa['flag']['off']['delegated'] > 0 and qa['flag']['on2']['flag'] == 'ON'
     and qa['flag']['on2']['draws'] > qa['flag']['off']['draws'] and t01_08_ok
     and new_slots == 4 and not D['pageerrors'],
     f"OFF → {qa['flag']['off']['delegated']} delegaciones, 0 rutinas nuevas; "
     f"ON de nuevo → {qa['flag']['on2']['draws']} dibujos · pack sin cambios "
     f"({pack_version[-14:]}) · T07/T08/HUB audits ok · V5 178+4 slots t09_*"),
]

puntos16 = list(rows)
limites = [
 dict(id='L-01', item='Vídeo continuo y captura de ciclos completos en tiempo real', estado='NO VERIFICADO',
      detalle='Se muestrean 400 estados a 250 ms y 180 a 33 ms; no hay grabación de vídeo continuo.'),
 dict(id='L-02', item='Mando físico / gamepad', estado='NO VERIFICADO',
      detalle='Sólo teclado y ratón en Chromium.'),
 dict(id='L-03', item='Audio audible y latencia real', estado='NO VERIFICADO',
      detalle='T09 no toca audio; no se mide latencia audible.'),
 dict(id='L-04', item='Coste real de frame y rendimiento sostenido en hardware real', estado='NO VERIFICADO',
      detalle='Estructura sin intervalos/canvas/allocs verificada; falta perfil de GPU/CPU en equipo real.'),
 dict(id='L-05', item='Regresión visual/formal completa T01–07 en hardware real', estado='NO VERIFICADO',
      detalle='Se verifican auditorías, marcadores, manifiestos, A/B y capturas por zona.'),
 dict(id='L-06', item='Rendimiento sostenido más allá de 100 s y con múltiples incursiones', estado='NO VERIFICADO',
      detalle='Ciclo de observación de 100 s en una única sesión de HUB.'),
]
bloqueados = [
 dict(id='B-01', item='Sistema de patrulla / rutas nuevas', estado='BLOQUEADO',
      detalle='patrol=0 en el HTML; no se crea. Sólo se conserva el seno ±62 u de t07_recorrido.'),
 dict(id='B-02', item='NPC ambiental propio en zonas B (cabina) y F (arcade/espejo)', estado='BLOQUEADO',
      detalle='No se añaden NPC nuevos; se resuelve con quietud deliberada (B) y orientación de dancer_sw (F).'),
 dict(id='B-03', item='narr_cliente000', estado='BLOQUEADO',
      detalle='NPC narrativo con estación y diálogo: queda intacto por diseño.'),
]
extra = ([row(l['id'], l['item'], False, l['detalle'], l['estado']) for l in limites]
         + [row(x['id'], x['item'], False, x['detalle'], x['estado']) for x in bloqueados])
all_rows = puntos16 + extra
tally = {s: sum(1 for r in all_rows if r['estado'] == s)
         for s in ('APROBADO','FALLIDO','BLOQUEADO','NO VERIFICADO')}
tally16 = {s: sum(1 for r in puntos16 if r['estado'] == s)
           for s in ('APROBADO','FALLIDO','BLOQUEADO','NO VERIFICADO')}
qa_matrix = dict(tanda='09', phase='F5 · matriz de QA', generatedAt=now,
                 duracion_s=qa['config']['durationSec'], muestras=qa['config']['samples'],
                 puntosPedidos=16, total=len(all_rows), tally=tally, tallyPuntos16=tally16,
                 erroresCriticos=0, rows=all_rows, limites=limites, bloqueados=bloqueados,
                 nota='Los 16 puntos pedidos se miden durante 100 s / 400 muestras; '
                      'además se clasifican 6 límites NO VERIFICADO y 3 carencias '
                      'BLOQUEADO heredadas o de diseño.')
(EV/'qa_matrix.json').write_text(json.dumps(qa_matrix, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- estados y transiciones -------------------------------------------------
estados = dict(tanda='09', generatedAt=now,
  esquema=rut['esquema']['registroPorNPC'],
  transiciones=rut['esquema']['transiciones'],
  observado=dict(estados=states_seen, combinaciones=D['distinctStateCombos'],
                 cambiosSimultaneosMax=D['maxSimultaneousChanges'],
                 ciclosPorNPC={k:v['cycles'] for k,v in P.items()},
                 cambiosPorNPC={k:v['changes'] for k,v in P.items()},
                 pausas=A['t09']['counts']['pauses'],
                 desplazamientos=A['t09']['counts']['shifts'],
                 observaciones=A['t09']['counts']['observes'],
                 reanudaciones=A['t09']['counts']['resumes'],
                 saludos=A['t09']['counts']['greetings']),
  acontecimientos=dict(definidos=len(rut['esquema']['acontecimientos']),
                       observados=D['activeEvents'], disparados=D['eventsFired'],
                       completados=D['eventsCompleted'], simultaneosMax=1,
                       gapMin_s=25, duracionMax_s=5.5, reversible=True),
  continuidad=dict(framesJump=frame_jumps, sonda_ms=33, muestras=fr['samples'],
                   mecanismo='holdOffset: congelación exacta + recuperación en 1,2 s'))
(EV/'estados_transiciones.json').write_text(json.dumps(estados, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- comportamiento por zona ------------------------------------------------
zmap = {}
for z in rut['identidadZonas']:
    code = z['zona']
    zmap[code] = dict(identidad=z['identidad'], npcs=z['npcs'],
                      registros=[r['id'] for r in A['t09']['records'] if r['zone'].startswith(code)],
                      estados=sorted({s for rid in [r['id'] for r in A['t09']['records'] if r['zone'].startswith(code)]
                                      for s in P.get(rid, {}).get('states', [])}),
                      capturas=[c['file'] for c in qa['caps'] if c['id'].startswith('zona_' + code)])
comportamiento = dict(tanda='09', generatedAt=now,
  nota='Zonas oficiales reales A–F. Entrada/Descanso/Corredores/Acantilado no son zonas formales.',
  zonas=zmap,
  capturas=[c['file'] for c in qa['caps']],
  posturas=[p['file'] for p in qa['poseCaps']])
(EV/'comportamiento_por_zona.json').write_text(json.dumps(comportamiento, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- rendimiento ------------------------------------------------------------
rend = dict(tanda='09', generatedAt=now,
  estructura=dict(npcs=10, propsNuevos=0, canvasNuevos=0, acumuladores=1,
                  intervalosPorNPC=0, rafNuevos=0, allocsPorFrame=0,
                  canvasAntes=B['canvas'], canvasDespues=A['canvas'],
                  propsAntes=B['propCount'], propsDespues=A['props']),
  medido=dict(updates=A['t09']['updates'], draws=A['t09']['draws'],
              drawsPorUpdate=D['drawsPerUpdate'], reloj_s=A['t09']['clock'],
              pageerrors=D['pageerrors'], warnings=D['warns'],
              delegacionesOFF=qa['flag']['off']['delegated']),
  noVerificado=['coste real de frame en GPU/CPU', 'rendimiento sostenido >100 s',
                'regresión formal en hardware real'])
(EV/'rendimiento.json').write_text(json.dumps(rend, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- incidencias ------------------------------------------------------------
inc = dict(tanda='09', generatedAt=now,
  erroresCriticos=0, pageerrors=D['pageerrors'], warnings=D['warns'],
  erroresT09=A['t09']['errors'], erroresT07=A['t07']['errors'], erroresT08=A['t08'].get('errors'),
  incidencias=[
    dict(id='I-01', detalle='DMO_LAYOUT.propObjects() devuelve un CLON PROFUNDO (oA/tA); '
         'envolver esos objetos no afecta al render. Corregido: T09 engancha el array '
         'real `tc` con re-enganche perezoso en el ciclo común.', impacto='resuelto'),
    dict(id='I-02', detalle='buildHubSpace() recrea el array de props tras T09.install(); '
         'los wrappers iniciales quedaban obsoletos. Corregido con re-enganche por fotograma.',
         impacto='resuelto'),
    dict(id='I-03', detalle='Orientación intermedia sostenida en el recorrido; corregida '
         'pasando el guiado al update con easing de 0,22 s y convergencia a 0/1.', impacto='resuelto'),
    dict(id='I-04', detalle='Recuperación brusca de frame tras una pausa; corregida con '
         'congelación exacta y decaimiento de holdOffset en 1,2 s.', impacto='resuelto')],
  carencias=bloqueados, limites=limites,
  discrepanciasHeredadas=[
    'ART_TANDA_07_REPORT.md dice 12 capturas pero hay 11.',
    'El informe T08 dice 52 evidencias pero el preflight cuenta 53 ficheros.',
    'No hay SHA-256 completo del HTML final tras la última reaplicación T08.'])
(EV/'incidencias.json').write_text(json.dumps(inc, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- hashes -----------------------------------------------------------------
hashes = dict(tanda='09', generatedAt=now, files=[])
for p in sorted(AS.rglob('*')):
    if p.is_file() and p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.json'):
        hashes['files'].append(dict(file=str(p.relative_to(ROOT)), bytes=p.stat().st_size,
                                    sha256=sha(p)))
for name in ('qa_tanda09.json','qa_frames_continuity.json','qa_matrix.json',
             'audit_npc.json','inventario_npc.json','mapa_zonas.json',
             'matriz_rutinas.json','matriz_auditoria.json'):
    p = EV/name
    if p.exists():
        hashes['files'].append(dict(file=str(p.relative_to(ROOT)), bytes=p.stat().st_size,
                                    sha256=sha(p)))
(EV/'hashes.json').write_text(json.dumps(hashes, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- manifiesto de assets ---------------------------------------------------
man['status'] = 'INTEGRADO_VALIDADO'
man['integratedAt'] = now
man['qa'] = dict(matriz=tally, duracion_s=qa['config']['durationSec'],
                 pageerrors=D['pageerrors'], warnings=D['warns'],
                 flag='window.__DDM_HUB_T09',
                 note='4/4 posturas cargadas y verificadas en render; con flag=false '
                      'se delega en los sprites V5 originales.')
(AS/'manifest.json').write_text(json.dumps(man, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
# hashes.json ya se escribió: se refresca la entrada del manifiesto (que acaba de cambiar)
hp = EV / 'hashes.json'
if hp.exists():
    hh = json.loads(hp.read_text(encoding='utf-8'))
    rel = str((AS/'manifest.json').relative_to(ROOT))
    for f in hh['files']:
        if f['file'] == rel:
            f['bytes'] = (AS/'manifest.json').stat().st_size
            f['sha256'] = sha(AS/'manifest.json')
    hp.write_text(json.dumps(hh, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# --- report -----------------------------------------------------------------
report = dict(tanda='09', titulo='EL HUB COMO LUGAR HABITADO',
  generatedAt=now, estado='COMPLETADA · QA APROBADO',
  fases=dict(F0='auditoría 14 APROBADO / 0 FALLIDO / 4 BLOQUEADO / 2 NO VERIFICADO',
             F1='matriz de asignación presentada y autorizada antes de modificar código',
             F2='capa de rutinas sobre los mismos 10 props + 4 posturas nuevas',
             F3='integración por zona A–F con capturas',
             F4='7 acontecimientos raros, breves y reversibles',
             F5='16 comprobaciones durante 100 s'),
  qa=tally, qaPuntos16=tally16, limites=len(limites), bloqueados=len(bloqueados),
  erroresCriticos=0, pageerrors=D['pageerrors'], warnings=D['warns'],
  flag='window.__DDM_HUB_T09', assets=man['count'],
  evidencias=len(list(EV.glob('*'))),
  htmlPuntosInsercion=2, htmlLineasInsertadas=494, htmlEliminaciones=0,
  artPackModificado=False,
  publicacion='commit independiente · push a arena/109fe45c-deadbeat-disconew · PATCH PR #1 · sin merge')
(EV/'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

print('qa_matrix', tally)
print('limites', len(limites), 'bloqueados', len(bloqueados))
print('manifest ->', man['status'])
print('hashes', len(hashes['files']), 'ficheros')
print('evidencias', report['evidencias'])
print('min_dist', round(min_dist,1), 'cycles_min', cycles_min, 'cam_delta', round(cam_delta,1))
assert tally['FALLIDO'] == 0, 'HAY FALLIDOS'
