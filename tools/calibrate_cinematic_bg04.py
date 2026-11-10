#!/usr/bin/env python3
"""Ajuste heurístico reproducible a marcas subjetivas; nunca modifica BG04."""
import json, math, random
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/cinematics/spatial_08c2'
A=json.loads((BASE/'calibration_bg04.json').read_text())
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):
 l=math.sqrt(dot(a,a));return tuple(x/l for x in a)
def project(v,pt):
 x,y,z,tx,tz,fov=v;pos=(x,y,z);forward=norm(sub((tx,80,tz),pos));right=norm(cross(forward,(0,0,1)));up=cross(right,forward);d=sub(pt,pos);depth=dot(d,forward)
 if depth<.5:return None
 f=.5/math.tan(math.radians(fov)/2);w,h=A['reference_dimensions'];return (.5+f*dot(d,right)/depth,.5-f*(w/h)*dot(d,up)/depth)
def errors(v,previous=False):
 w,h=A['reference_dimensions'];out=[]
 for a in A['anchors']:
  if previous and not a.get('present_in_prior', True): continue
  xy=project(v,a['previous_world'] if previous else a['world'])
  if xy is None:return None
  ref=(a['pixel'][0]/w,a['pixel'][1]/h);out.append((a['id'],(xy[0]-ref[0],xy[1]-ref[1]),a['weight']))
 return out
def cost(v,previous=False):
 result=errors(v,previous)
 return sum(w*(d[0]**2+d[1]**2) for _,d,w in result) if result else 10

def fit():
 b=A['fit_bounds'];bounds=[b[k] for k in ['x','y','z','target_x','target_z','horizontal_fov_degrees']];rng=random.Random(8321);best=(1e9,None)
 for _ in range(60000):
  v=[rng.uniform(a,b) for a,b in bounds];score=cost(v)
  if score<best[0]:best=(score,v)
 v=best[1];step=[5,2,3,5,3,10]
 for _ in range(70):
  changed=False
  for i in range(6):
   for sign in [-1,1]:
    trial=v[:];trial[i]=max(bounds[i][0],min(bounds[i][1],trial[i]+step[i]*sign))
    if cost(trial)<cost(v):v=trial;changed=True
  if not changed:step=[x*.7 for x in step]
 return [round(x,2) for x in v]
if __name__=='__main__':
 v=fit();prior=[50,6,30,50,23,110]
 print(json.dumps({'camera':v,'weighted_cost_old_six_prior_anchors':round(cost(prior,True),6),'weighted_cost_new_six_prior_anchors':round(sum(w*(d[0]**2+d[1]**2) for name,d,w in errors(v) if name not in ('suspended_left','suspended_right')),6),'weighted_cost_new_eight_anchors':round(cost(v),6),'residuals_normalized':{name:[round(d[0],4),round(d[1],4)] for name,d,_ in errors(v)}},indent=2))
