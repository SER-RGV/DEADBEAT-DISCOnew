#!/usr/bin/env python3
"""Comprueba consistencia de la maqueta; no certifica el arte ni el canon."""
import hashlib
import importlib.util
import json
import math
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
folder = root / 'assets/cinematics/spatial_08c2'
m = json.loads((folder / 'plan.json').read_text())
assert len(m['cameras']) == 3 and [c['id'] for c in m['cameras']] == ['BG04', 'BG05', 'BG06']
assert m['stage']['top_z'] == m['stairs']['top_z'] == m['dj_booth']['base_z'] == 5
assert m['stairs']['count'] == 5 and m['stairs']['y'][1] == m['stage']['y'][0]
assert m['stairs']['x'][0] < 50 < m['stairs']['x'][1]
left, right = m['speaker_stacks']
assert sum(left['x']) / 2 + sum(right['x']) / 2 == 100
assert right['x'][0] - left['x'][1] == 34
assert all(b['floor_z'] == 22 for b in m['balconies'])
assert m['rear_gallery']['floor_z'] == 22
assert m['dancefloor']['fixed_decoration'] and m['dancefloor']['circle_center'] == [50,45]
assert m['future_descent_reserve']['x'] == [44,56] and m['future_descent_reserve']['y'] == [50,60]
for x,y in m['audience']['positions']:
 assert 22 <= x <= 78 and 20 <= y <= 70
 assert not (44 <= x <= 56 and 50 <= y <= 60)
assert m['audience']['height'] == 4.5
assert m['hero_composition_guide']['anchor'] == [50,48,0]
# Proyectar la caja orientativa de BG06 para asegurar que esté en el encuadre.
spec = importlib.util.spec_from_file_location('spatial_generator',root/'tools/generate_cinematic_08c2.py')
gen = importlib.util.module_from_spec(spec); spec.loader.exec_module(gen)
assert len(gen.geometry()) > 100
cam = m['cameras'][2]; pos = cam['position']
forward = gen.norm(gen.sub(cam['target'],pos)); right = gen.norm(gen.cross(forward,(0,0,1))); up = gen.cross(right,forward)
f = 480 / math.tan(math.radians(cam['horizontal_fov_degrees']) / 2)
def project(point):
 d = gen.sub(point,pos); depth = gen.dot(d,forward)
 assert depth > 0.5
 return (480 + f*gen.dot(d,right)/depth,270 - f*gen.dot(d,up)/depth)
x,y,z = m['hero_composition_guide']['anchor']; w=m['hero_composition_guide']['width']; h=m['hero_composition_guide']['height']
a,b = project((x-w/2,y,z+h)),project((x+w/2,y,z))
assert 0 < a[0] < b[0] < 960 and 0 < a[1] < b[1] < 540
svg_names=['planta.svg','alzados.svg','bg04_proyeccion.svg','bg05_proyeccion.svg','bg06_proyeccion.svg']
def digests(): return [hashlib.sha256((folder / n).read_bytes()).hexdigest() for n in svg_names]
before=digests();subprocess.run(['python3','tools/generate_cinematic_08c2.py'],cwd=root,check=True);assert before == digests()
print('OK: modelo único, ubicaciones, reserva, encuadre orientativo y cinco SVG reproducibles')
