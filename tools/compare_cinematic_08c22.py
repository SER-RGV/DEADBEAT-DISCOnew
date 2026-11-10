#!/usr/bin/env python3
"""Comparación experimental de cámaras sin modificar el modelo ni arte 08C2.1."""
import copy, hashlib, importlib.util, json, math, random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/cinematics/spatial_08c22'
SRC=ROOT/'assets/cinematics/spatial_08c2'
M=json.loads((SRC/'plan.json').read_text())
A=json.loads((OUT/'anchors.json').read_text())
spec=importlib.util.spec_from_file_location('spatial_08c2_generator',ROOT/'tools/generate_cinematic_08c2.py')
g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)
def project(cam,point):
 pos=cam['position'];fw=g.norm(g.sub(cam['target'],pos));right=g.norm(g.cross(fw,(0,0,1)));up=g.cross(right,fw);d=g.sub(point,pos);depth=g.dot(d,fw)
 if depth<=.5:return None
 f=.5/math.tan(math.radians(cam['horizontal_fov_degrees'])/2);w,h=A['dimensions']
 return (.5+f*g.dot(d,right)/depth,.5-f*(w/h)*g.dot(d,up)/depth)
def cost(cam,anchors):
 w,h=A['dimensions'];total=0
 for a in anchors:
  q=project(cam,a['world'])
  if q is None:return 10
  total+=(q[0]-a['pixel'][0]/w)**2+(q[1]-a['pixel'][1]/h)**2
 return total

def hero_visible(cam):
 guide=M['hero_composition_guide'];x,y,z=guide['anchor'];w=guide['width'];h=guide['height'];a=project(cam,[x-w/2,y,z+h]);b=project(cam,[x+w/2,y,z])
 return bool(a and b and 0<a[0]<b[0]<1 and 0<a[1]<b[1]<1)

def make(cam_id,v):
 y,z,tz,fov=v
 return {'id':cam_id,'position':[50,y,z],'target':[50,82,tz],'horizontal_fov_degrees':fov,'description':'hipótesis de comparación, no aprobada'}
def candidate(cam_id):
 rng=random.Random(8322 if cam_id=='BG05' else 8323);b=A['bounds'];bounds=[b[k] for k in ['camera_y','camera_z','target_z','horizontal_fov_degrees']];anchors=A['cameras'][cam_id]
 def score(v):
  cam=make(cam_id,v)
  return cost(cam,anchors)+(5 if cam_id=='BG06' and not hero_visible(cam) else 0)
 best=(1e9,None)
 for _ in range(25000):
  v=[rng.uniform(*x) for x in bounds];c=score(v)
  if c<best[0]:best=(c,v)
 v=best[1];step=[4,2,3,8]
 for _ in range(60):
  changed=False
  for i in range(4):
   for direction in [-1,1]:
    q=v[:];q[i]=max(bounds[i][0],min(bounds[i][1],q[i]+direction*step[i]))
    if score(q)<score(v):v=q;changed=True
  if not changed:step=[x*.7 for x in step]
 return make(cam_id,[round(x,2) for x in v])
def clean_svg(raw):
 # La capa es el wireframe original sin su rectángulo opaco de fondo.
 return raw.replace('<rect width="960" height="540" fill="#111824"/>','',1)

def main():
 # Todas las vistas llaman a geometry() exactamente una vez y la reutilizan.
 g.M=copy.deepcopy(M);g.BASE=OUT;geo=g.geometry();result={'source_model':'assets/cinematics/spatial_08c2/plan.json','source_model_sha256':hashlib.sha256((SRC/'plan.json').read_bytes()).hexdigest(),'method':'cámara experimental ajustada a cuatro marcas manuales; geometría inalterada','geometry_lines':len(geo),'cameras':{}}
 for cam in M['cameras']:
  id=cam['id'];src=SRC/(id.lower()+'_proyeccion.svg');(OUT/(id.lower()+'_base_transparente.svg')).write_text(clean_svg(src.read_text()))
  if id=='BG04':
   result['cameras'][id]={'baseline':cam,'candidate':None,'note':'Se conserva calibración 08C2.1; no se repite el ajuste.'};continue
  alt=candidate(id);g.project(alt,geo);generated=OUT/(id.lower()+'_proyeccion.svg');target=OUT/(id.lower()+'_hipotesis.svg');generated.replace(target)
  (OUT/(id.lower()+'_hipotesis_transparente.svg')).write_text(clean_svg(target.read_text()))
  result['cameras'][id]={'baseline':cam,'candidate':alt,'cost_baseline':round(cost(cam,A['cameras'][id]),6),'cost_candidate':round(cost(alt,A['cameras'][id]),6),'hero_box_fits_candidate':hero_visible(alt) if id=='BG06' else None,'note':'Ajuste de cámara experimental; no corrige arte, suelo, oclusiones ni valida el modelo.'}
 (OUT/'comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
