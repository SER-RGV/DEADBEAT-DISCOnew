#!/usr/bin/env python3
"""Validación técnica; no valida la exactitud del modelo ni las marcas manuales."""
import hashlib,importlib.util,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2];base=root/'assets/cinematics/spatial_08c2'
m=json.loads((base/'plan.json').read_text());a=json.loads((base/'calibration_bg04.json').read_text())
ref=root/a['reference'];assert hashlib.sha256(ref.read_bytes()).hexdigest()=='9c1c9358acaca94abea7c7eb20c6e505e2605a884f8d18a99e8d3383ec74bba3'
assert len(a['anchors'])==8 and all(x['confidence'] for x in a['anchors'])
assert m['dancefloor']['longitudinal_band_x']==[40,60] and 'circle_center' not in m['dancefloor']
assert m['stairs']['top_z']==m['stage']['top_z']==m['dj_booth']['base_z']==4
assert len(m['suspended_speakers'])==2 and [c['id'] for c in m['cameras']]==['BG04','BG05','BG06']
assert m['cameras'][1]['position']==[50,19,8] and m['cameras'][2]['position']==[50,31,6]
assert m['future_descent_reserve']['x']==[44,56] and m['future_descent_reserve']['y']==[50,60]
sp=importlib.util.spec_from_file_location('cal',root/'tools/calibrate_cinematic_bg04.py');cal=importlib.util.module_from_spec(sp);sp.loader.exec_module(cal)
v=cal.fit();cam=m['cameras'][0];assert v==cam['position']+[cam['target'][0],cam['target'][2],cam['horizontal_fov_degrees']]
old=[50,6,30,50,23,110];old_cost=cal.cost(old,True)
new_cost=sum(w*(d[0]**2+d[1]**2) for name,d,w in cal.errors(v) if name not in ('suspended_left','suspended_right'))
assert new_cost<old_cost
files=['planta.svg','alzados.svg','bg04_proyeccion.svg','bg05_proyeccion.svg','bg06_proyeccion.svg']
def digests(folder):return [hashlib.sha256((folder/f).read_bytes()).hexdigest() for f in files]
before=digests(base);subprocess.run(['python3','tools/generate_cinematic_08c2.py'],cwd=root,check=True);assert digests(base)==before
archive=base/'archive_08c2';before=digests(archive);subprocess.run(['python3',str(archive/'generate_original.py')],cwd=root,check=True);assert digests(archive)==before
print('OK: referencia intacta, ajuste reproducible, geometría común y versiones archivadas')
